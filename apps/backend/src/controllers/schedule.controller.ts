import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { asyncHandler } from "@/utils/async-handler";
import { scrapeHorarios } from "@/utils/scraper";
import Schedule, { IScheduleDocument } from "@/models/schedule.model";
import StudyPlan from "@/models/study-plan.model";
import Professor from "@/models/professor.model";
import { BadRequestError, NotFoundError } from "@/utils/app-error";
import {
  IApiResponse,
  IPaginatedResponse,
  ISchedule,
  ICreateScheduleDTO,
  IUpdateScheduleDTO,
} from "@eduno/shared";

/**
 * Dynamically resolves courseName for a list of schedules by matching
 * courseCode with course definitions inside all active StudyPlans in the database.
 */
export const resolveCourseNamesForSchedules = async (
  schedules: IScheduleDocument[],
): Promise<ISchedule[]> => {
  // 1. Fetch all active study plans
  const activePlans = await StudyPlan.find({ isLatest: true });

  // 2. Build courseCode -> courseName lookup map
  const codeToNameMap: Record<string, string> = {};

  for (const plan of activePlans) {
    if (!plan.structure) continue;

    // Parse regular semesters
    if (Array.isArray(plan.structure.semesters)) {
      for (const sem of plan.structure.semesters) {
        if (Array.isArray(sem.courses)) {
          for (const course of sem.courses) {
            if (course && course.code) {
              codeToNameMap[course.code] = course.name;
            }
          }
        }
      }
    }

    // Parse emphasis/elective areas
    if (Array.isArray(plan.structure.emphasisAreas)) {
      for (const area of plan.structure.emphasisAreas) {
        if (Array.isArray(area.courses)) {
          for (const course of area.courses) {
            if (course && course.code) {
              codeToNameMap[course.code] = course.name;
            }
          }
        }
      }
    }
  }

  // 3. Map schedules to the shared ISchedule shape and inject resolved courseName
  return schedules.map((s) => {
    const sObj = s.toObject();
    return {
      id: sObj._id.toString(),
      courseCode: sObj.courseCode,
      courseName:
        codeToNameMap[sObj.courseCode] ||
        "Materia no encontrada en plan activo",
      group: sObj.group,
      type: sObj.type,
      timeBlock: sObj.timeBlock,
      days: sObj.days,
      professor: sObj.professor,
      professorId: sObj.professorId?.toString(),
      building: sObj.building,
      classroom: sObj.classroom,
      occupancy: sObj.occupancy,
      areaCode: sObj.areaCode,
      period: sObj.period,
      createdAt: sObj.createdAt,
      updatedAt: sObj.updatedAt,
    };
  });
};

/**
 * Trigger Playwright scraper for a given areaCode and period,
 * clear old entries for that specific period & areaCode,
 * and bulk insert parsed schedules.
 */
export const scrapeAndSync = asyncHandler(
  async (req: Request, res: Response) => {
    const { period, areaCode } = req.body;

    const numericAreaCode = areaCode !== undefined ? Number(areaCode) : 2;

    // 1. Run Playwright Scraper
    const scrapeResult = await scrapeHorarios(numericAreaCode);

    // 2. Parse and map each row into the ISchedule model structure (no courseName stored)
    const schedulesToInsert = scrapeResult.horarios.map((h) => {
      let courseCode = "";
      const hyphenIndex = h.materia.indexOf("-");
      if (hyphenIndex !== -1) {
        courseCode = h.materia.substring(0, hyphenIndex).trim();
      } else {
        courseCode = h.materia.trim();
      }

      const groupNum = parseInt(h.grupo, 10);
      const group = isNaN(groupNum) ? 0 : groupNum;

      let building = "";
      let classroom = h.salon.trim();
      if (h.salon.includes("-")) {
        const parts = h.salon.split("-");
        building = parts[0].trim();
        classroom = parts.slice(1).join("-").trim();
      }

      let occupancy = 0;
      const occupancyStr = h.ocupacion.replace("%", "").trim();
      const parsedOcc = parseInt(occupancyStr, 10);
      if (!isNaN(parsedOcc)) {
        occupancy = parsedOcc;
      }

      return {
        courseCode,
        group,
        type: h.tip.trim(),
        timeBlock: h.horario.trim(),
        days: h.dias, // Support both spellings from scraper row
        professor: h.profesor.trim(),
        building,
        classroom,
        occupancy,
        areaCode: numericAreaCode,
        period,
      };
    });

    // 3. Extract unique professor names and perform dynamic upsert to map them to Professor IDs
    const uniqueProfessorNames = Array.from(
      new Set(schedulesToInsert.map((s) => s.professor)),
    ).filter(
      (name) => !!name && name.trim() !== "" && name !== "--- POR DEFINIR ---",
    );

    const professorMap: Record<string, any> = {};

    await Promise.all(
      uniqueProfessorNames.map(async (name) => {
        let prof = await Professor.findOne({ name });
        if (!prof) {
          prof = await Professor.create({
            name,
            calificacion: 5.0,
            numResenas: 0,
            isVerificado: false,
          });
        }
        professorMap[name] = prof._id;
      }),
    );

    // Map each schedule item to its corresponding professorId reference
    const schedulesWithRefs = schedulesToInsert.map((s) => ({
      ...s,
      professorId: professorMap[s.professor] || null,
    }));

    // 4. Atomically delete existing records for this specific period & areaCode
    // and insert the newly scraped ones.
    await Schedule.deleteMany({ period, areaCode: numericAreaCode });
    const insertedDocs = await Schedule.insertMany(schedulesWithRefs);

    res.json({
      success: true,
      message: `Sincronización completada. Se eliminaron los registros anteriores de "${scrapeResult.area}" para el periodo "${period}" y se insertaron ${insertedDocs.length} registros actualizados.`,
      data: {
        areaName: scrapeResult.area,
        areaCode: numericAreaCode,
        period,
        totalInserted: insertedDocs.length,
      },
    });
  },
);

/**
 * Retrieve saved schedules matching query parameters, dynamically resolving courseName.
 */
export const listSchedules = asyncHandler(
  async (req: Request, res: Response<IPaginatedResponse<ISchedule[]>>) => {
    const {
      period,
      areaCode,
      type,
      courseName,
      professor,
      group,
      page,
      limit,
    } = req.query;

    const filter: FilterQuery<IScheduleDocument> = {};

    if (type && typeof type === "string") {
      filter.type = type;
    }

    if (period && typeof period === "string") {
      filter.period = period;
    }

    if (areaCode) {
      const codeNum = Number(areaCode);
      if (!isNaN(codeNum)) {
        filter.areaCode = codeNum;
      }
    }

    if (group) {
      const groupNum = Number(group);
      if (!isNaN(groupNum)) {
        filter.group = groupNum;
      }
    }

    if (professor && typeof professor === "string") {
      filter.professor = { $regex: professor, $options: "i" };
    }

    // Handle courseName filtering (dynamic resolution via active study plans)
    if (courseName && typeof courseName === "string") {
      // Find all courseCodes matching this courseName in active study plans
      const activePlans = await StudyPlan.find({ isLatest: true });
      const matchingCodes: string[] = [];
      const regex = new RegExp(courseName, "i");

      for (const plan of activePlans) {
        if (plan.structure) {
          if (Array.isArray(plan.structure.semesters)) {
            for (const sem of plan.structure.semesters) {
              if (Array.isArray(sem.courses)) {
                for (const course of sem.courses) {
                  if (course && course.code && regex.test(course.name)) {
                    matchingCodes.push(course.code);
                  }
                }
              }
            }
          }
          if (Array.isArray(plan.structure.emphasisAreas)) {
            for (const area of plan.structure.emphasisAreas) {
              if (Array.isArray(area.courses)) {
                for (const course of area.courses) {
                  if (course && course.code && regex.test(course.name)) {
                    matchingCodes.push(course.code);
                  }
                }
              }
            }
          }
        }
      }

      // Filter by these matching codes. If none found, pass an empty array to match nothing
      filter.courseCode = { $in: matchingCodes };
    }

    // Pagination calculations
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    // Fetch total matching schedules count
    const totalItems = await Schedule.countDocuments(filter);

    // Fetch matching schedules for the current page
    const schedules = await Schedule.find(filter)
      .sort({ courseCode: 1, group: 1 })
      .skip(skipNum)
      .limit(limitNum);

    const resolvedSchedules = await resolveCourseNamesForSchedules(schedules);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: resolvedSchedules,
      pagination: {
        totalItems,
        itemCount: resolvedSchedules.length,
        itemsPerPage: limitNum,
        totalPages,
        currentPage: pageNum,
      },
    });
  },
);

/**
 * List all unique academic periods saved in the database
 */
export const listPeriods = asyncHandler(
  async (_req: Request, res: Response<IApiResponse<string[]>>) => {
    const periods = await Schedule.distinct("period");
    res.status(200).json({
      success: true,
      data: periods.sort().reverse(),
    });
  },
);

/**
 * Create a new schedule manually.
 */
export const createSchedule = asyncHandler(
  async (
    req: Request<unknown, unknown, ICreateScheduleDTO>,
    res: Response<IApiResponse<ISchedule>>,
  ) => {
    const body = req.body;

    let professorId: any = null;
    if (
      body.professor &&
      body.professor.trim() !== "" &&
      body.professor !== "Profesor por Asignar"
    ) {
      let prof = await Professor.findOne({ name: body.professor.trim() });
      if (!prof) {
        prof = await Professor.create({
          name: body.professor.trim(),
          calificacion: 5.0,
          numResenas: 0,
          isVerificado: false,
        });
      }
      professorId = prof._id;
    }

    const newDoc = await Schedule.create({
      ...body,
      professorId,
    });

    const resolved = await resolveCourseNamesForSchedules([newDoc]);

    res.status(201).json({
      success: true,
      message: "Horario registrado exitosamente",
      data: resolved[0],
    });
  },
);

/**
 * Update an existing schedule manually.
 */
export const updateSchedule = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, IUpdateScheduleDTO>,
    res: Response<IApiResponse<ISchedule>>,
  ) => {
    const { id } = req.params;
    const body = req.body;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      throw new NotFoundError("Horario no encontrado");
    }

    // Update fields dynamically
    Object.assign(schedule, body);

    if (body.professor !== undefined) {
      let professorId: any = null;
      if (
        body.professor &&
        body.professor.trim() !== "" &&
        body.professor !== "Profesor por Asignar"
      ) {
        let prof = await Professor.findOne({ name: body.professor.trim() });
        if (!prof) {
          prof = await Professor.create({
            name: body.professor.trim(),
            calificacion: 5.0,
            numResenas: 0,
            isVerificado: false,
          });
        }
        professorId = prof._id;
      }
      schedule.set("professorId", professorId);
    }

    await schedule.save();

    const resolved = await resolveCourseNamesForSchedules([schedule]);

    res.status(200).json({
      success: true,
      message: "Horario actualizado exitosamente",
      data: resolved[0],
    });
  },
);

/**
 * Delete a schedule by ID.
 */
export const deleteSchedule = asyncHandler(
  async (
    req: Request<Record<string, string>>,
    res: Response<IApiResponse<void>>,
  ) => {
    const { id } = req.params;

    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      throw new NotFoundError("Horario no encontrado");
    }

    res.status(200).json({
      success: true,
      message: "Horario eliminado correctamente de forma permanente",
    });
  },
);
