import mongoose, { Document, Schema } from "mongoose";
import { IProfessorVerificationRequest } from "@eduno/shared";

export interface IProfessorVerificationRequestDocument
  extends Document,
    Omit<IProfessorVerificationRequest, "id" | "professorId" | "userId"> {
  professorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const verificationRequestSchema = new Schema<IProfessorVerificationRequestDocument>(
  {
    professorId: {
      type: Schema.Types.ObjectId,
      ref: "Professor",
      required: [true, "El ID del profesor es obligatorio"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El ID del usuario es obligatorio"],
      index: true,
    },
    documentUrl: {
      type: String,
      required: [true, "El comprobante o documento probatorio es obligatorio"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "professor_verification_requests",
  }
);

// Populate indexes
verificationRequestSchema.index({ status: 1, createdAt: -1 });

const ProfessorVerificationRequest = mongoose.model<IProfessorVerificationRequestDocument>(
  "ProfessorVerificationRequest",
  verificationRequestSchema
);

export default ProfessorVerificationRequest;
