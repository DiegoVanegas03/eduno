import mongoose, { Document, Schema } from "mongoose";
import { IStudyPlan, ICoursePlan, ISemesterPlan, IEmphasisArea, IStudyPlanStructure } from "@eduno/shared";

export interface IStudyPlanDocument
  extends Document, Omit<IStudyPlan, "id" | "career"> {
  career: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Course Plan Sub-schema ───────────────────────────────────────────────────
const coursePlanSchema = new Schema<ICoursePlan>(
  {
    code: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    theoryHours: { type: String, default: "0" },
    practicalHours: { type: String, default: "0" },
    credits: { type: String, default: "0" },
    cacei: { type: String, trim: true },
    prerequisites: [{ type: String, trim: true }],
    type: { type: String, trim: true },
  },
  { _id: false }
);

// ── Semester Plan Sub-schema ─────────────────────────────────────────────────
const semesterPlanSchema = new Schema<ISemesterPlan>(
  {
    semester: { type: Number, required: true },
    courses: [coursePlanSchema],
    canInscribeEmphasis: { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Emphasis Area Sub-schema ─────────────────────────────────────────────────
const emphasisAreaSchema = new Schema<IEmphasisArea>(
  {
    name: { type: String, required: true, trim: true },
    courses: [coursePlanSchema],
  },
  { _id: false }
);

// ── Study Plan Structure Sub-schema ──────────────────────────────────────────
const studyPlanStructureSchema = new Schema<IStudyPlanStructure>(
  {
    semesters: [semesterPlanSchema],
    emphasisAreas: [emphasisAreaSchema],
  },
  { _id: false }
);

// ── Study Plan Main Schema ───────────────────────────────────────────────────
const studyPlanSchema = new Schema<IStudyPlanDocument>(
  {
    name: {
      type: String,
      required: [true, "El nombre del plan de estudio es obligatorio"],
      trim: true,
    },
    career: {
      type: Schema.Types.ObjectId,
      ref: "Career",
      required: [true, "La carrera a la que pertenece el plan es obligatoria"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLatest: {
      type: Boolean,
      default: false,
    },
    url: {
      type: String,
      trim: true,
    },
    structure: {
      type: studyPlanStructureSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "study_plans",
  },
);

// Indexes
studyPlanSchema.index({ career: 1 });
studyPlanSchema.index({ career: 1, isLatest: 1 });

const StudyPlan = mongoose.model<IStudyPlanDocument>(
  "StudyPlan",
  studyPlanSchema,
);
export default StudyPlan;
