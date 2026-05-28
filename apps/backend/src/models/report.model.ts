import mongoose, { Document, Schema } from "mongoose";
import { IReport } from "@eduno/shared";

export interface IReportDocument extends Document, Omit<IReport, "id" | "reporterId" | "targetId"> {
  reporterId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El ID del reportero es obligatorio"],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, "El tipo de objetivo es obligatorio (review o file)"],
      enum: ["review", "file"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, "El ID del objetivo es obligatorio"],
      index: true,
    },
    reasonType: {
      type: String,
      required: [true, "El tipo de motivo es obligatorio"],
      enum: ["spam", "abuse", "inappropriate_content", "copyright", "other"],
    },
    description: {
      type: String,
      required: [true, "La descripción del reporte es obligatoria"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

const Report = mongoose.model<IReportDocument>("Report", reportSchema);
export default Report;
