import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import Review from "@/models/review.model";
import Professor from "@/models/professor.model";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/app-error";
import { IApiResponse, IReview } from "@eduno/shared";
import mongoose from "mongoose";
import { getProfilePictureUrl } from "@/utils/minio-upload";
import Schedule from "@/models/schedule.model";
import { resolveCourseNamesForSchedules } from "./schedule.controller";

/**
 * Create a new review for a professor, recalculating their average rating.
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IReview>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para dejar una reseña.");
    }

    const { professorId, rating, comment, materiaId } = req.body;

    const professor = await Professor.findById(professorId);
    if (!professor) {
      throw new NotFoundError("Profesor no encontrado.");
    }

    // Verify if user already reviewed this professor for this subject
    const existing = await Review.findOne({ professorId, userId: user.id, materiaId });
    if (existing) {
      throw new BadRequestError("Ya has dejado una opinión para esta materia con este profesor.");
    }

    // Create the review
    const review = await Review.create({
      professorId,
      userId: user.id,
      rating,
      comment,
      materiaId,
      isEdited: false,
      likes: [],
      dislikes: [],
      netLikes: 0,
    });

    // Recalculate average rating & reviews count for this professor
    const reviews = await Review.find({ professorId });
    const numResenas = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const calificacion = numResenas > 0 ? parseFloat((totalRating / numResenas).toFixed(1)) : 5.0;

    professor.numResenas = numResenas;
    professor.calificacion = calificacion;
    await professor.save();

    // Resolve course name dynamically
    const schedule = await Schedule.findOne({ professorId: professor._id, courseCode: materiaId });
    let materiaNombre = "Materia Académica";
    if (schedule) {
      const resolved = await resolveCourseNamesForSchedules([schedule]);
      materiaNombre = resolved[0]?.courseName || "Materia Académica";
    }

    const rObjCreated = review.toObject();
    const dataCreated: IReview = {
      id: rObjCreated._id.toString(),
      professorId: rObjCreated.professorId.toString(),
      userId: rObjCreated.userId.toString(),
      rating: rObjCreated.rating,
      comment: rObjCreated.comment,
      likes: (rObjCreated.likes || []).map((l: any) => l.toString()),
      dislikes: (rObjCreated.dislikes || []).map((d: any) => d.toString()),
      netLikes: rObjCreated.netLikes,
      materiaId: rObjCreated.materiaId,
      materiaNombre,
      isEdited: rObjCreated.isEdited,
      createdAt: rObjCreated.createdAt,
      updatedAt: rObjCreated.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "Reseña guardada exitosamente.",
      data: dataCreated,
    });
  }
);

/**
 * List reviews for a professor, sorted by netLikes desc.
 */
export const listReviewsByProfessor = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IReview[]>>) => {
    const { id } = req.params; // Professor ID

    const reviews = await Review.find({ professorId: id })
      .populate("userId", "name image")
      .sort({ netLikes: -1, createdAt: -1 });

    // Fetch schedules for the professor to resolve course codes to names in one pass
    const schedules = await Schedule.find({ professorId: id });
    const resolvedSchedules = await resolveCourseNamesForSchedules(schedules);
    const courseMap: Record<string, string> = {};
    resolvedSchedules.forEach((s) => {
      if (s.courseCode) {
        courseMap[s.courseCode] = s.courseName || "Materia Académica";
      }
    });

    const data: IReview[] = reviews.map((r) => {
      const rObj = r.toObject();
      const usr = rObj.userId as any;
      const imageUrl = usr?.image ? getProfilePictureUrl(usr.image) : undefined;
      return {
        id: rObj._id.toString(),
        professorId: rObj.professorId.toString(),
        userId: usr?._id?.toString() || "",
        rating: rObj.rating,
        comment: rObj.comment,
        likes: (rObj.likes || []).map((l: any) => l.toString()),
        dislikes: (rObj.dislikes || []).map((d: any) => d.toString()),
        netLikes: rObj.netLikes,
        materiaId: rObj.materiaId,
        materiaNombre: courseMap[rObj.materiaId] || "Materia Académica",
        isEdited: rObj.isEdited,
        user: {
          name: usr?.name || "Estudiante",
          image: imageUrl || undefined,
        },
        createdAt: rObj.createdAt,
        updatedAt: rObj.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  }
);

/**
 * Upvote / Like a review
 */
export const likeReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para dar me gusta.");
    }

    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Reseña no encontrada.");
    }

    const userIdObj = new mongoose.Types.ObjectId(user.id);
    const userIdStr = user.id;

    // Remove from dislikes if present
    review.dislikes = review.dislikes.filter((id) => id.toString() !== userIdStr) as any;

    // Toggle like
    const alreadyLiked = review.likes.some((id) => id.toString() === userIdStr);
    if (alreadyLiked) {
      review.likes = review.likes.filter((id) => id.toString() !== userIdStr) as any;
    } else {
      review.likes.push(userIdObj);
    }

    review.markModified("likes");
    review.markModified("dislikes");
    await review.save();

    res.status(200).json({
      success: true,
      message: "Reacción guardada.",
      data: {
        likesCount: review.likes.length,
        dislikesCount: review.dislikes.length,
        netLikes: review.netLikes,
      },
    });
  }
);

/**
 * Downvote / Dislike a review
 */
export const dislikeReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para dar dislike.");
    }

    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Reseña no encontrada.");
    }

    const userIdObj = new mongoose.Types.ObjectId(user.id);
    const userIdStr = user.id;

    // Remove from likes if present
    review.likes = review.likes.filter((id) => id.toString() !== userIdStr) as any;

    // Toggle dislike
    const alreadyDisliked = review.dislikes.some((id) => id.toString() === userIdStr);
    if (alreadyDisliked) {
      review.dislikes = review.dislikes.filter((id) => id.toString() !== userIdStr) as any;
    } else {
      review.dislikes.push(userIdObj);
    }

    review.markModified("likes");
    review.markModified("dislikes");
    await review.save();

    res.status(200).json({
      success: true,
      message: "Reacción guardada.",
      data: {
        likesCount: review.likes.length,
        dislikesCount: review.dislikes.length,
        netLikes: review.netLikes,
      },
    });
  }
);

/**
 * Delete a review written by the authenticated user
 */
export const deleteReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para eliminar una reseña.");
    }

    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Reseña no encontrada.");
    }

    // Verify ownership
    if (review.userId.toString() !== user.id) {
      throw new UnauthorizedError("No tienes permiso para eliminar esta reseña.");
    }

    const professorId = review.professorId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate average rating & reviews count for this professor
    const reviews = await Review.find({ professorId });
    const numResenas = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const calificacion = numResenas > 0 ? parseFloat((totalRating / numResenas).toFixed(1)) : 5.0;

    const professor = await Professor.findById(professorId);
    if (professor) {
      professor.numResenas = numResenas;
      professor.calificacion = calificacion;
      await professor.save();
    }

    res.status(200).json({
      success: true,
      message: "Reseña eliminada exitosamente.",
    });
  }
);

/**
 * Update an existing review written by the authenticated user
 */
export const updateReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IReview>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para editar una reseña.");
    }

    const { reviewId } = req.params;
    const { rating, comment, materiaId } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Reseña no encontrada.");
    }

    // Verify ownership
    if (review.userId.toString() !== user.id) {
      throw new UnauthorizedError("No tienes permiso para editar esta reseña.");
    }

    // Update fields and set isEdited to true ONLY if they actually changed
    if (review.rating !== rating || review.comment !== comment || (materiaId && review.materiaId !== materiaId)) {
      review.isEdited = true;
    }

    review.rating = rating;
    review.comment = comment;
    if (materiaId) {
      review.materiaId = materiaId;
    }
    
    await review.save();

    // Recalculate average rating & reviews count for this professor
    const professorId = review.professorId;
    const reviews = await Review.find({ professorId });
    const numResenas = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const calificacion = numResenas > 0 ? parseFloat((totalRating / numResenas).toFixed(1)) : 5.0;

    const professor = await Professor.findById(professorId);
    if (professor) {
      professor.numResenas = numResenas;
      professor.calificacion = calificacion;
      await professor.save();
    }

    // Resolve course name dynamically
    const schedule = await Schedule.findOne({ professorId: review.professorId, courseCode: review.materiaId });
    let materiaNombre = "Materia Académica";
    if (schedule) {
      const resolved = await resolveCourseNamesForSchedules([schedule]);
      materiaNombre = resolved[0]?.courseName || "Materia Académica";
    }

    const rObj = review.toObject();
    const data: IReview = {
      id: rObj._id.toString(),
      professorId: rObj.professorId.toString(),
      userId: rObj.userId.toString(),
      rating: rObj.rating,
      comment: rObj.comment,
      likes: (rObj.likes || []).map((l: any) => l.toString()),
      dislikes: (rObj.dislikes || []).map((d: any) => d.toString()),
      netLikes: rObj.netLikes,
      materiaId: rObj.materiaId,
      materiaNombre,
      isEdited: rObj.isEdited,
      createdAt: rObj.createdAt,
      updatedAt: rObj.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Reseña actualizada exitosamente.",
      data,
    });
  }
);
