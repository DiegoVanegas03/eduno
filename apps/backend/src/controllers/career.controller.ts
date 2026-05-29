import { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import { asyncHandler } from "@/utils/async-handler";
import Career, { ICareerDocument } from "@/models/career.model";
import { NotFoundError, ConflictError } from "@/utils/app-error";
import { IApiResponse, ICareer, ICareerIdParamSchema } from "@eduno/shared";
import { formatCareer } from "@/utils/helper";

export const createCareer = asyncHandler(
  async (req: Request, res: Response<IApiResponse<ICareer>>) => {
    const { name, areaCode, semesters, isActive } = req.body;

    // Check if name is already taken
    const existingCareer = await Career.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existingCareer) {
      throw new ConflictError("Ya existe una carrera con ese nombre");
    }

    const career = await Career.create({
      name: name.trim(),
      areaCode,
      semesters,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      success: true,
      data: formatCareer(career),
    });
  },
);

export const listCareers = asyncHandler(
  async (req: Request, res: Response<IApiResponse<ICareer[]>>) => {
    const areaCodeQuery = req.query.areaCode;
    const isActiveQuery = req.query.isActive;

    const filter: FilterQuery<ICareerDocument> = {};

    if (areaCodeQuery !== undefined) {
      const areaCodeNum = Number(areaCodeQuery);
      if (!isNaN(areaCodeNum)) {
        filter.areaCode = areaCodeNum;
      }
    }

    if (isActiveQuery !== undefined) {
      filter.isActive = String(isActiveQuery) === "true";
    }

    const careers = await Career.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: careers.map(formatCareer),
    });
  },
);

export const getCareerById = asyncHandler(
  async (req: Request, res: Response<IApiResponse<ICareer>>) => {
    const { id } = req.params as ICareerIdParamSchema;

    const career = await Career.findById(id);
    if (!career) {
      throw new NotFoundError("Carrera no encontrada");
    }

    res.status(200).json({
      success: true,
      data: formatCareer(career),
    });
  },
);

export const updateCareer = asyncHandler(
  async (req: Request, res: Response<IApiResponse<ICareer>>) => {
    const { id } = req.params as ICareerIdParamSchema;
    const { name, areaCode, semesters, isActive } = req.body;

    const career = await Career.findById(id);
    if (!career) {
      throw new NotFoundError("Carrera no encontrada");
    }

    if (name) {
      const trimmedName = name.trim();
      // Verify name uniqueness if changing
      if (trimmedName.toLowerCase() !== career.name.toLowerCase()) {
        const existing = await Career.findOne({
          name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        });
        if (existing) {
          throw new ConflictError("Ya existe otra carrera con ese nombre");
        }
      }
      career.name = trimmedName;
    }

    if (areaCode !== undefined) career.areaCode = areaCode;
    if (semesters !== undefined) career.semesters = semesters;
    if (isActive !== undefined) career.isActive = isActive;

    await career.save();

    res.status(200).json({
      success: true,
      data: formatCareer(career),
    });
  },
);

export const deleteCareer = asyncHandler(
  async (req: Request, res: Response<IApiResponse<ICareer>>) => {
    const { id } = req.params as ICareerIdParamSchema;

    const career = await Career.findById(id);
    if (!career) {
      throw new NotFoundError("Carrera no encontrada");
    }

    // Soft delete: sets isActive to false
    career.isActive = false;
    await career.save();

    res.status(200).json({
      success: true,
      message: "Carrera desactivada (eliminación lógica) correctamente",
      data: formatCareer(career),
    });
  },
);
