import mongoose, { Document, Schema } from "mongoose";
import { ISchedule } from "@eduno/shared";

export interface IScheduleDocument extends Document, Omit<ISchedule, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<IScheduleDocument>(
  {
    courseCode: {
      type: String,
      required: [true, "El código de la materia es obligatorio"],
      trim: true,
    },
    courseName: {
      type: String,
      required: [true, "El nombre de la materia es obligatorio"],
      trim: true,
    },
    group: {
      type: Number,
      required: [true, "El grupo es obligatorio"],
    },
    type: {
      type: String,
      required: [true, "El tipo de curso es obligatorio"],
      trim: true,
    },
    timeBlock: {
      type: String,
      required: [true, "El bloque de horario es obligatorio"],
      trim: true,
    },
    days: {
      type: [Number],
      required: [true, "Los días de clase son obligatorios"],
      validate: {
        validator: function (v: number[]) {
          return Array.isArray(v) && v.length === 6;
        },
        message: "Los días deben ser un arreglo de exactamente 6 elementos binarios.",
      },
    },
    professor: {
      type: String,
      required: [true, "El nombre del profesor es obligatorio"],
      trim: true,
    },
    building: {
      type: String,
      required: [true, "El edificio es obligatorio"],
      trim: true,
    },
    classroom: {
      type: String,
      required: [true, "El salón/aula es obligatorio"],
      trim: true,
    },
    occupancy: {
      type: Number,
      required: [true, "El porcentaje de ocupación es obligatorio"],
      min: [0, "La ocupación no puede ser menor a 0"],
      max: [100, "La ocupación no puede ser mayor a 100"],
    },
    areaCode: {
      type: Number,
      required: [true, "El código de área es obligatorio"],
    },
    period: {
      type: String,
      required: [true, "El periodo es obligatorio"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "schedules",
  }
);

// Indexes
scheduleSchema.index({ period: 1, areaCode: 1 });
scheduleSchema.index({ courseCode: 1, group: 1, period: 1, areaCode: 1 });

const Schedule = mongoose.model<IScheduleDocument>("Schedule", scheduleSchema);
export default Schedule;
