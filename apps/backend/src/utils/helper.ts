import mongoose from "mongoose";
import { ICareer, IStudyPlan } from "@eduno/shared";
import { ICareerDocument } from "@/models/career.model";
import { IStudyPlanDocument } from "@/models/study-plan.model";

export const getInitialLetter = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const formatCareer = (career: ICareerDocument): ICareer => ({
  id: (career._id as mongoose.Types.ObjectId).toString(),
  name: career.name,
  areaCode: career.areaCode,
  semesters: career.semesters,
  isActive: career.isActive,
  createdAt: career.createdAt,
  updatedAt: career.updatedAt,
});

export const formatStudyPlan = (plan: IStudyPlanDocument): IStudyPlan => ({
  id: (plan._id as mongoose.Types.ObjectId).toString(),
  name: plan.name,
  career: plan.career && typeof plan.career === "object" && "_id" in plan.career
    ? String((plan.career as { _id: unknown })._id)
    : String(plan.career),
  isActive: plan.isActive,
  isLatest: plan.isLatest,
  url: plan.url,
  structure: plan.structure,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});
