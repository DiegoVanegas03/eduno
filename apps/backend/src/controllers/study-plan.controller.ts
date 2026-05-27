import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { asyncHandler } from "@/utils/async-handler";
import StudyPlan, { IStudyPlanDocument } from "@/models/study-plan.model";
import Career from "@/models/career.model";
import { NotFoundError, BadRequestError } from "@/utils/app-error";
import { scrapePlanEstudios } from "@/utils/plan-estudios";
import {
  IApiResponse,
  ICareer,
  ICreateStudyPlanSchema,
  IStudyPlan,
  IGetStudyPlanListQuery,
} from "@eduno/shared";
import { formatStudyPlan } from "@/utils/helper";

export const createStudyPlan = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan>>) => {
    const {
      name,
      career: careerId,
      isLatest,
      url,
      structure,
    } = req.body as ICreateStudyPlanSchema;

    // Validate career exists
    const career = await Career.findById(careerId);
    if (!career) {
      throw new NotFoundError("La carrera especificada no existe");
    }

    const studyPlan = await StudyPlan.create({
      name: name.trim(),
      career: careerId,
      isLatest: isLatest ?? false,
      url,
      structure,
    });

    // If set as latest, toggle off other plans for this career
    if (studyPlan.isLatest) {
      await StudyPlan.updateMany(
        { career: careerId, _id: { $ne: studyPlan._id } },
        { isLatest: false },
      );
    }

    res.status(201).json({
      success: true,
      data: formatStudyPlan(studyPlan),
    });
  },
);

export const listStudyPlans = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan[]>>) => {
    const { career: careerId, isActive } = req.query;
    const filter: FilterQuery<IStudyPlanDocument> = {};

    if (careerId && typeof careerId === "string") {
      filter.career = careerId;
    }

    if (isActive !== undefined) {
      filter.isActive = String(isActive) === "true";
    }

    const studyPlans = await StudyPlan.find(filter)
      .populate("career")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: studyPlans.map(formatStudyPlan),
    });
  },
);

export const getStudyPlanById = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan>>) => {
    const { id } = req.params;

    const studyPlan = await StudyPlan.findById(id).populate("career");
    if (!studyPlan) {
      throw new NotFoundError("Plan de estudio no encontrado");
    }

    res.status(200).json({
      success: true,
      data: formatStudyPlan(studyPlan),
    });
  },
);

export const updateStudyPlan = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan>>) => {
    const { id } = req.params;
    const { name, career: careerId, isLatest, url, structure } = req.body;

    const studyPlan = await StudyPlan.findById(id);
    if (!studyPlan) {
      throw new NotFoundError("Plan de estudio no encontrado");
    }

    const currentCareerId = careerId || studyPlan.career;

    if (careerId) {
      const career = await Career.findById(careerId);
      if (!career) {
        throw new NotFoundError("La carrera especificada no existe");
      }
      studyPlan.career = careerId;
    }

    if (name) studyPlan.name = name.trim();
    if (isLatest !== undefined) studyPlan.isLatest = isLatest;
    if (url !== undefined) studyPlan.url = url;
    if (structure !== undefined) studyPlan.structure = structure;

    await studyPlan.save();

    // If set as latest, toggle off other plans for this career
    if (studyPlan.isLatest) {
      await StudyPlan.updateMany(
        { career: currentCareerId, _id: { $ne: studyPlan._id } },
        { isLatest: false },
      );
    }

    res.status(200).json({
      success: true,
      data: formatStudyPlan(studyPlan),
    });
  },
);

export const deleteStudyPlan = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan>>) => {
    const { id } = req.params;

    const studyPlan = await StudyPlan.findById(id);
    if (!studyPlan) {
      throw new NotFoundError("Plan de estudio no encontrado");
    }

    await StudyPlan.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Plan de estudio eliminado correctamente",
      data: formatStudyPlan(studyPlan),
    });
  },
);

export const scrapeAndSaveStudyPlan = asyncHandler(
  async (req: Request, res: Response<IApiResponse<IStudyPlan>>) => {
    const { id } = req.params;

    const studyPlan = await StudyPlan.findById(id).populate("career");
    if (!studyPlan) {
      throw new NotFoundError("Plan de estudio no encontrado");
    }

    if (!studyPlan.url) {
      throw new BadRequestError(
        "El plan de estudio no tiene una URL configurada para realizar el scraping",
      );
    }

    let careerName = "Carrera Desconocida";
    if (
      studyPlan.career &&
      typeof studyPlan.career === "object" &&
      "name" in studyPlan.career
    ) {
      const careerObj = studyPlan.career as unknown as ICareer;
      careerName = careerObj.name;
    }

    // Trigger Playwright scrape
    const scrapedData = await scrapePlanEstudios(studyPlan.url, careerName);

    // Save back to database
    studyPlan.structure = scrapedData;
    await studyPlan.save();

    res.status(200).json({
      success: true,
      message:
        "Scraping de plan de estudios completado y guardado correctamente",
      data: formatStudyPlan(studyPlan),
    });
  },
);
