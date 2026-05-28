import mongoose, { Document, Schema } from "mongoose";
import { IFileBase } from "@eduno/shared";

export interface IFile extends Document, Omit<IFileBase, "id"> {
  uploaderId: mongoose.Types.ObjectId;
  materiaId: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: Date;
}

const FileSchema: Schema = new Schema({
  originalName: { type: String, required: true },
  minioObjectName: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  isClean: { type: Boolean, required: true },
  uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  materiaId: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const FileModel = mongoose.model<IFile>("File", FileSchema);
