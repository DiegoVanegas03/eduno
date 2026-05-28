import mongoose, { Document, Schema } from "mongoose";

export interface IUserDownload extends Document {
  userId: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;
  downloadedAt: Date;
}

const UserDownloadSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "user_downloads",
  }
);

// Compound index to guarantee uniqueness of userId + fileId downloads quickly
UserDownloadSchema.index({ userId: 1, fileId: 1 }, { unique: true });

const UserDownload = mongoose.model<IUserDownload>("UserDownload", UserDownloadSchema);
export default UserDownload;
