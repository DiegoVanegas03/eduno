import mongoose, { Document, Schema } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: delete document when expiresAt is reached
    },
  },
  {
    timestamps: true,
  },
);

const Session = mongoose.model<ISession>("Session", sessionSchema);
export default Session;
