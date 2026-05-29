import mongoose, { Document, Schema } from "mongoose";
import { ICareer } from "@eduno/shared";

export interface ICareerDocument extends Document, Omit<ICareer, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const careerSchema = new Schema<ICareerDocument>(
  {
    name: {
      type: String,
      required: [true, "El nombre de la carrera es obligatorio"],
      unique: true,
      trim: true,
    },
    areaCode: {
      type: Number,
      min: [0, "El código de área mínimo es 0"],
      max: [8, "El código de área máximo es 8"],
    },
    semesters: {
      type: Number,
      required: [true, "El número de semestres es obligatorio"],
      min: [1, "Debe tener al menos 1 semestre"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "careers",
  }
);

// Indexes
careerSchema.index({ areaCode: 1 });
careerSchema.index({ isActive: 1 });

const Career = mongoose.model<ICareerDocument>("Career", careerSchema);
export default Career;
