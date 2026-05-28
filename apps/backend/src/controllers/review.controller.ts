import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import Review from "@/models/review.model";
import Professor from "@/models/professor.model";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/app-error";
import { IApiResponse } from "@eduno/shared";
import mongoose from "mongoose";

/**
 * Create a new review for a professor, recalculating their average rating.
 */
export const createReview = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para dejar una reseña.");
    }

    const { professorId, rating, comment } = req.body;

    const professor = await Professor.findById(professorId);
    if (!professor) {
      throw new NotFoundError("Profesor no encontrado.");
    }

    // Verify if user already reviewed this professor
    const existing = await Review.findOne({ professorId, userId: user.id });
    if (existing) {
      throw new BadRequestError("Ya has dejado una opinión para este profesor.");
    }

    // Create the review
    const review = await Review.create({
      professorId,
      userId: user.id,
      rating,
      comment,
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

    res.status(201).json({
      success: true,
      message: "Reseña guardada exitosamente.",
      data: review,
    });
  }
);

/**
 * List reviews for a professor, sorted by netLikes desc.
 */
export const listReviewsByProfessor = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any[]>>) => {
    const { id } = req.params; // Professor ID

    const reviews = await Review.find({ professorId: id })
      .populate("userId", "name image")
      .sort({ netLikes: -1, createdAt: -1 });

    const data = reviews.map((r) => {
      const rObj = r.toObject();
      const usr = rObj.userId as any;
      return {
        id: rObj._id.toString(),
        professorId: rObj.professorId.toString(),
        userId: usr?._id?.toString() || "",
        rating: rObj.rating,
        comment: rObj.comment,
        likes: rObj.likes.map((l: any) => l.toString()),
        dislikes: rObj.dislikes.map((d: any) => d.toString()),
        netLikes: rObj.netLikes,
        user: {
          name: usr?.name || "Estudiante",
          image: usr?.image || "",
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
    review.dislikes = review.dislikes.filter((id) => id.toString() !== userIdStr);

    // Toggle like
    const alreadyLiked = review.likes.some((id) => id.toString() === userIdStr);
    if (alreadyLiked) {
      review.likes = review.likes.filter((id) => id.toString() !== userIdStr);
    } else {
      review.likes.push(userIdObj);
    }

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
    review.likes = review.likes.filter((id) => id.toString() !== userIdStr);

    // Toggle dislike
    const alreadyDisliked = review.dislikes.some((id) => id.toString() === userIdStr);
    if (alreadyDisliked) {
      review.dislikes = review.dislikes.filter((id) => id.toString() !== userIdStr);
    } else {
      review.dislikes.push(userIdObj);
    }

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
