import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import Report from "@/models/report.model";
import Review from "@/models/review.model";
import { FileModel } from "@/models/file.model";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/app-error";
import { IApiResponse, IPaginatedResponse } from "@eduno/shared";

/**
 * Submit a new abuse report for either a review or a file.
 */
export const createReport = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError("Debes iniciar sesión para reportar contenido.");
    }

    const { targetType, targetId, reasonType, description } = req.body;

    if (!["review", "file"].includes(targetType)) {
      throw new BadRequestError("El tipo de objetivo debe ser 'review' o 'file'.");
    }

    // Verify target existence
    if (targetType === "review") {
      const reviewExists = await Review.findById(targetId);
      if (!reviewExists) {
        throw new NotFoundError("La opinión que intentas reportar no existe.");
      }
    } else if (targetType === "file") {
      const fileExists = await FileModel.findById(targetId);
      if (!fileExists) {
        throw new NotFoundError("El archivo que intentas reportar no existe.");
      }
    }

    // Create report
    const report = await Report.create({
      reporterId: user.id,
      targetType,
      targetId,
      reasonType,
      description,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Reporte de abuso recibido. Un administrador revisará el caso.",
      data: report,
    });
  }
);

/**
 * List all submitted reports (Admin/Moderator only).
 */
export const listReports = asyncHandler(
  async (req: Request, res: Response<IPaginatedResponse<any[]>>) => {
    const { status, targetType, page, limit } = req.query;

    const filter: any = {};
    if (status && typeof status === "string" && ["pending", "resolved", "dismissed"].includes(status)) {
      filter.status = status;
    }
    if (targetType && typeof targetType === "string" && ["review", "file"].includes(targetType)) {
      filter.targetType = targetType;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    const totalItems = await Report.countDocuments(filter);
    const docs = await Report.find(filter)
      .populate("reporterId", "name email")
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum);

    // Dynamic enrichment of target items
    const enrichedData = await Promise.all(
      docs.map(async (doc) => {
        const docObj = doc.toObject();
        let targetDetail: any = null;

        try {
          if (docObj.targetType === "review") {
            const review = await Review.findById(docObj.targetId).populate("professorId", "name");
            if (review) {
              targetDetail = {
                comment: review.comment,
                professorName: (review.professorId as any)?.name || "Desconocido",
              };
            }
          } else if (docObj.targetType === "file") {
            const file = await FileModel.findById(docObj.targetId);
            if (file) {
              targetDetail = {
                originalName: file.originalName,
                size: file.size,
              };
            }
          }
        } catch (e) {
          // Ignore population errors
        }

        return {
          id: docObj._id.toString(),
          reporter: {
            id: (docObj.reporterId as any)?._id?.toString() || "",
            name: (docObj.reporterId as any)?.name || "Usuario",
            email: (docObj.reporterId as any)?.email || "",
          },
          targetType: docObj.targetType,
          targetId: docObj.targetId.toString(),
          reasonType: docObj.reasonType,
          description: docObj.description,
          status: docObj.status,
          targetDetail,
          createdAt: docObj.createdAt,
          updatedAt: docObj.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedData,
      pagination: {
        totalItems,
        itemCount: enrichedData.length,
        itemsPerPage: limitNum,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
      },
    });
  }
);

/**
 * Update report status (Admin/Moderator only).
 */
export const processReport = asyncHandler(
  async (req: Request, res: Response<IApiResponse<any>>) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["resolved", "dismissed"].includes(status)) {
      throw new BadRequestError("El estado debe ser 'resolved' o 'dismissed'.");
    }

    const report = await Report.findById(id);
    if (!report) {
      throw new NotFoundError("Reporte no encontrado.");
    }

    report.status = status;
    await report.save();

    res.status(200).json({
      success: true,
      message: `Reporte marcado como ${status === "resolved" ? "resuelto" : "desestimado"}.`,
      data: report,
    });
  }
);
