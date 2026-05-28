import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { auth } from "@/config/auth";
import { fromNodeHeaders } from "better-auth/node";
import { asyncHandler } from "@/utils/async-handler";
import Professor, { IProfessorDocument } from "@/models/professor.model";
import Schedule from "@/models/schedule.model";
import User from "@/models/user.model";
import ProfessorVerificationRequest from "@/models/verification-request.model";
import { resolveCourseNamesForSchedules } from "./schedule.controller";
import { uploadBufferToMinio, getProfilePictureUrl } from "@/utils/minio-upload";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/app-error";
import {
  IApiResponse,
  IPaginatedResponse,
  IProfessor,
  ICreateProfessorDTO,
  IUpdateProfessorDTO,
  IVerifyTeacherBody,
  ISchedule,
} from "@eduno/shared";

import Review from "@/models/review.model";

// Helper to convert Mongoose document to clean DTO without internal database properties and resolving dynamic fields
export const enrichProfessorDTO = async (doc: IProfessorDocument): Promise<IProfessor> => {
  const obj = doc.toObject();
  const userId = obj.userId ? obj.userId.toString() : null;
  const isVerificado = !!userId;

  let descripcionPerfil = "";
  if (userId) {
    const linkedUser = await User.findById(userId);
    if (linkedUser && linkedUser.description) {
      descripcionPerfil = linkedUser.description;
    }
  }

  // Get the most voted review (highest netLikes) for this professor
  let descripcionAbreviada = "";
  const topReview = await Review.findOne({ professorId: doc._id }).sort({ netLikes: -1, createdAt: -1 });
  if (topReview) {
    descripcionAbreviada = topReview.comment;
  }

  return {
    id: obj._id.toString(),
    name: obj.name,
    userId,
    isVerificado,
    email: obj.email || null,
    calificacion: obj.calificacion !== undefined ? obj.calificacion : 5.0,
    numResenas: obj.numResenas || 0,
    descripcionAbreviada,
    descripcionPerfil,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

/**
 * Retrieve a paginated list of professors, supporting case-insensitive name searches and area filter.
 */
export const listProfessors = asyncHandler(
  async (req: Request, res: Response<IPaginatedResponse<IProfessor[]>>) => {
    const { search, areaCode, page, limit } = req.query;

    const filter: FilterQuery<IProfessorDocument> = {
      name: { $ne: "Profesor por Asignar", $exists: true, $nin: ["", null] }
    };

    if (search && typeof search === "string") {
      filter.name = { 
        $regex: search, 
        $options: "i",
        $ne: "Profesor por Asignar",
        $exists: true,
        $nin: ["", null]
      };
    }

    if (areaCode !== undefined) {
      const numericArea = Number(areaCode);
      if (!isNaN(numericArea)) {
        // Find unique professorIds from Schedule that belong to this areaCode
        const schedules = await Schedule.find({ areaCode: numericArea });
        const professorIds = Array.from(
          new Set(schedules.map((s) => s.professorId?.toString()))
        ).filter((id) => !!id);
        filter._id = { $in: professorIds };
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    const totalItems = await Professor.countDocuments(filter);
    const docs = await Professor.find(filter)
      .sort({ name: 1 })
      .skip(skipNum)
      .limit(limitNum);

    const data = await Promise.all(docs.map(enrichProfessorDTO));
    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limitNum,
        totalPages,
        currentPage: pageNum,
      },
    });
  },
);

/**
 * Get detailed professor profile by ID, resolving their entire teaching schedule.
 */
export const getProfessorById = asyncHandler(
  async (
    req: Request,
    res: Response<IApiResponse<any>>,
  ) => {
    const { id } = req.params;

    const doc = await Professor.findById(id);
    if (!doc) {
      throw new NotFoundError("Profesor no encontrado");
    }

    // Dynamic matching of courses/schedules matching professorId reference
    const schedules = await Schedule.find({ professorId: doc._id }).sort({
      courseCode: 1,
      group: 1,
    });
    const resolvedSchedules = await resolveCourseNamesForSchedules(schedules);

    const reviews = await Review.find({ professorId: doc._id })
      .populate("userId", "name image")
      .sort({ netLikes: -1, createdAt: -1 });

    const enriched = await enrichProfessorDTO(doc);

    res.status(200).json({
      success: true,
      data: {
        ...enriched,
        schedules: resolvedSchedules,
        reviews,
      },
    });
  },
);

/**
 * Submit a formal verification request to elevate a user account to role "profesor"
 * with a supporting pay stub or identity document image.
 */
export const requestTeacherVerification = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para realizar esta solicitud");
    }

    const { professorId } = req.body;
    if (!req.file) {
      throw new BadRequestError("El documento probatorio (imagen) es obligatorio.");
    }

    const prof = await Professor.findById(professorId);
    if (!prof) {
      throw new NotFoundError("Perfil de profesor scrapeado no encontrado");
    }

    // Verify if the professor profile is already claimed/verified
    if (prof.userId) {
      throw new BadRequestError(
        "Este perfil de profesor ya ha sido verificado y vinculado por otro usuario."
      );
    }

    // Check if there is already a pending verification request for this user
    const existingRequest = await ProfessorVerificationRequest.findOne({
      userId: user.id,
      status: "pending",
    });
    if (existingRequest) {
      throw new BadRequestError("Ya posees una solicitud de verificación en espera de revisión administrativa.");
    }

    // Upload the file to MinIO
    const documentUrl = await uploadBufferToMinio(req.file.buffer, req.file.mimetype);

    // Create a pending verification request
    const newReq = await ProfessorVerificationRequest.create({
      professorId: prof._id,
      userId: user.id,
      documentUrl,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Tu solicitud de verificación docente ha sido enviada correctamente. Un administrador la revisará pronto.",
      data: newReq,
    });
  },
);

/**
 * Retrieve a paginated list of verification requests, with optional status filter.
 */
export const listVerificationRequests = asyncHandler(
  async (req: Request, res: Response<IPaginatedResponse<any[]>>) => {
    const { status, page, limit } = req.query;

    const filter: FilterQuery<any> = {};
    if (status && typeof status === "string" && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    const totalItems = await ProfessorVerificationRequest.countDocuments(filter);
    const docs = await ProfessorVerificationRequest.find(filter)
      .populate("professorId")
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    const data = docs.map((d) => {
      const dObj = d.toObject();
      const prof = dObj.professorId as any;
      const usr = dObj.userId as any;
      return {
        id: dObj._id.toString(),
        professorId: prof?._id?.toString() || "",
        professorName: prof?.name || "Profesor por Asignar",
        userId: usr?._id?.toString() || "",
        userName: usr?.name || "Usuario Desconocido",
        userEmail: usr?.email || "",
        documentUrl: getProfilePictureUrl(dObj.documentUrl),
        status: dObj.status,
        notes: dObj.notes || "",
        createdAt: dObj.createdAt,
        updatedAt: dObj.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
      },
    });
  },
);

/**
 * Process a pending verification request by approving or rejecting it with notes.
 * If approved, elevates user's role to "profesor" and links the Professor profile.
 */
export const processVerificationRequest = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const vReq = await ProfessorVerificationRequest.findById(id);
    if (!vReq) {
      throw new NotFoundError("Solicitud de verificación no encontrada");
    }

    if (vReq.status !== "pending") {
      throw new BadRequestError("Esta solicitud ya ha sido procesada anteriormente.");
    }

    if (status === "approved") {
      const prof = await Professor.findById(vReq.professorId);
      if (!prof) {
        throw new NotFoundError("Profesor de la solicitud no encontrado.");
      }

      if (prof.userId) {
        vReq.status = "rejected";
        vReq.notes = "El profesor ya fue verificado por otro usuario.";
        await vReq.save();
        throw new BadRequestError("Este profesor ya fue verificado y vinculado por otro usuario.");
      }

      // 1. Link professor to user
      prof.userId = vReq.userId.toString();
      await prof.save();

      // 2. Elevate user role locally in database
      const dbUser = await User.findById(vReq.userId);
      if (dbUser) {
        dbUser.role = "profesor";
        await dbUser.save();
      }

      vReq.status = "approved";
      vReq.notes = notes || "Aprobado por el administrador";
    } else {
      vReq.status = "rejected";
      vReq.notes = notes || "Rechazado por el administrador";
    }

    await vReq.save();

    res.status(200).json({
      success: true,
      message: status === "approved" ? "Solicitud aprobada con éxito. El usuario ha sido elevado a profesor." : "Solicitud rechazada con éxito.",
      data: vReq,
    });
  },
);

/**
 * Manually create a new professor profile (Admin / Moderator only).
 */
export const createProfessor = asyncHandler(
  async (
    req: Request<unknown, unknown, ICreateProfessorDTO>,
    res: Response<IApiResponse<IProfessor>>,
  ) => {
    const body = req.body;

    const exists = await Professor.findOne({ name: body.name.trim() });
    if (exists) {
      throw new BadRequestError("Ya existe un perfil de profesor registrado con ese nombre.");
    }

    const newDoc = await Professor.create({
      name: body.name.trim(),
      email: body.email || null,
      calificacion: body.calificacion !== undefined ? body.calificacion : 5.0,
    });

    const enriched = await enrichProfessorDTO(newDoc);

    res.status(201).json({
      success: true,
      message: "Perfil de profesor creado de forma exitosa",
      data: enriched,
    });
  },
);

/**
 * Manually update a professor profile (Admin / Moderator only).
 */
export const updateProfessor = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, IUpdateProfessorDTO>,
    res: Response<IApiResponse<IProfessor>>,
  ) => {
    const { id } = req.params;
    const body = req.body;

    const doc = await Professor.findById(id);
    if (!doc) {
      throw new NotFoundError("Profesor no encontrado");
    }

    if (body.name && body.name.trim() !== doc.name) {
      const exists = await Professor.findOne({ name: body.name.trim() });
      if (exists) {
        throw new BadRequestError("Ya existe un profesor con ese nombre.");
      }
      doc.name = body.name.trim();
    }

    if (body.email !== undefined) doc.email = body.email || null;
    if (body.calificacion !== undefined) doc.calificacion = body.calificacion;

    if (body.userId !== undefined) {
      doc.userId = body.userId || null;
    }

    await doc.save();

    const enriched = await enrichProfessorDTO(doc);

    res.status(200).json({
      success: true,
      message: "Datos del profesor actualizados correctamente",
      data: enriched,
    });
  },
);

/**
 * Manually delete a professor profile (Admin only).
 */
export const deleteProfessor = asyncHandler(
  async (req: Request, res: Response<IApiResponse<void>>) => {
    const { id } = req.params;

    const doc = await Professor.findByIdAndDelete(id);
    if (!doc) {
      throw new NotFoundError("Profesor no encontrado");
    }

    // Clear schedule references for cleanliness
    await Schedule.updateMany({ professorId: id }, { $set: { professorId: null } });

    res.status(200).json({
      success: true,
      message: "Perfil de profesor eliminado correctamente de la base de datos.",
    });
  },
);

/**
 * Retrieve the top trending professors (based on many reviews and high ratings).
 */
export const getTrendingProfessors = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IProfessor[]>>) => {
    // Sort by numResenas desc, then by calificacion desc
    const docs = await Professor.find({
      name: { $ne: "Profesor por Asignar", $exists: true, $nin: ["", null] }
    })
      .sort({ numResenas: -1, calificacion: -1 })
      .limit(6);

    const data = await Promise.all(docs.map(enrichProfessorDTO));

    res.status(200).json({
      success: true,
      data,
    });
  }
);
