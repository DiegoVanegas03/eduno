import mongoose, { Document, Schema } from "mongoose";
import { IFileBase } from "@eduno/shared";

export interface IFile extends Document, IFileBase {
  uploadedAt: Date;
}

const FileSchema: Schema = new Schema({
  originalName: { type: String, required: true },
  minioObjectName: { type: String, required: true },
  size: { type: Number, required: true },
  mimetype: { type: String, required: true },
  isClean: { type: Boolean, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const FileModel = mongoose.model<IFile>("File", FileSchema);
