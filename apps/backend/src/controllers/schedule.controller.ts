import { Request, Response } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { scrapeHorarios } from "@/utils/scraper";
import Schedule from "@/models/schedule.model";
import { BadRequestError } from "@/utils/app-error";

/**
 * Trigger Playwright scraper for a given areaCode and period,
 * clear old entries for that specific period & areaCode,
 * and bulk insert parsed schedules.
 */
export const scrapeAndSync = asyncHandler(
  async (req: Request, res: Response) => {
    const { period, areaCode } = req.body;

    if (!period || typeof period !== "string") {
      throw new BadRequestError("El periodo (period) es requerido y debe ser un texto");
    }

    const numericAreaCode = areaCode !== undefined ? Number(areaCode) : 2; // Default to 2 (Ciencias de la Computación)
    if (isNaN(numericAreaCode)) {
      throw new BadRequestError("El código de área (areaCode) debe ser un número válido");
    }

    // 1. Run Playwright Scraper
    const scrapeResult = await scrapeHorarios(numericAreaCode);

    // 2. Parse and map each row into the ISchedule model structure
    const schedulesToInsert = scrapeResult.horarios.map((h) => {
      // Course Code & Name decomposition (e.g., "3082 - BASE DE DATOS")
      let courseCode = "";
      let courseName = h.materia.trim();
      const hyphenIndex = h.materia.indexOf("-");
      if (hyphenIndex !== -1) {
        courseCode = h.materia.substring(0, hyphenIndex).trim();
        courseName = h.materia.substring(hyphenIndex + 1).trim();
      }

      // Group as number
      const groupNum = parseInt(h.grupo, 10);
      const group = isNaN(groupNum) ? 0 : groupNum;

      // Building & Classroom decomposition (e.g., "I-05")
      let building = "";
      let classroom = h.salon.trim();
      if (h.salon.includes("-")) {
        const parts = h.salon.split("-");
        building = parts[0].trim();
        classroom = parts.slice(1).join("-").trim();
      }

      // Occupancy percentage (e.g., "30/40" -> 75)
      let occupancy = 0;
      const occupancyTrim = h.ocupacion.trim();
      if (occupancyTrim.includes("/")) {
        const parts = occupancyTrim.split("/");
        const current = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        if (!isNaN(current) && !isNaN(max) && max > 0) {
          occupancy = Math.round((current / max) * 100);
        }
      }

      return {
        courseCode,
        courseName,
        group,
        type: h.tip.trim(),
        timeBlock: h.horario.trim(),
        days: h.dias,
        professor: h.profesor.trim(),
        building,
        classroom,
        occupancy,
        areaCode: numericAreaCode,
        period,
      };
    });

    // 3. Atomically delete existing records for this specific period & areaCode
    // and insert the newly scraped ones. This ensures a clean sync.
    await Schedule.deleteMany({ period, areaCode: numericAreaCode });
    const insertedDocs = await Schedule.insertMany(schedulesToInsert);

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
  }
);

/**
 * Retrieve saved schedules matching query parameters:
 * ?period=2026-I&areaCode=2&courseCode=3082&professor=JUAN&group=1
 */
export const listSchedules = asyncHandler(
  async (req: Request, res: Response) => {
    const { period, areaCode, courseCode, professor, group } = req.query;

    const filter: any = {};

    if (period && typeof period === "string") {
      filter.period = period;
    }

    if (areaCode) {
      const codeNum = Number(areaCode);
      if (!isNaN(codeNum)) {
        filter.areaCode = codeNum;
      }
    }

    if (courseCode && typeof courseCode === "string") {
      filter.courseCode = courseCode;
    }

    if (group) {
      const groupNum = Number(group);
      if (!isNaN(groupNum)) {
        filter.group = groupNum;
      }
    }

    if (professor && typeof professor === "string") {
      // Case-insensitive regex match for partial name
      filter.professor = { $regex: professor, $options: "i" };
    }

    const schedules = await Schedule.find(filter).sort({ courseName: 1, group: 1 });

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  }
);

/**
 * List all unique academic periods saved in the database
 */
export const listPeriods = asyncHandler(
  async (_req: Request, res: Response) => {
    const periods = await Schedule.distinct("period");
    res.json({
      success: true,
      data: periods.sort().reverse(), // Sort to show newer semesters first
    });
  }
);
