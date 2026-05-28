import mongoose, { Document, Schema } from "mongoose";
import { IReview } from "@eduno/shared";

export interface IReviewDocument extends Document, Omit<IReview, "id" | "professorId" | "userId" | "likes" | "dislikes"> {
  professorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  dislikes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReviewDocument>(
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
    rating: {
      type: Number,
      required: [true, "La calificación es obligatoria"],
      min: [0, "La calificación mínima es 0"],
      max: [5, "La calificación máxima es 5"],
    },
    comment: {
      type: String,
      required: [true, "El comentario es obligatorio"],
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    netLikes: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  }
);

// Auto-recalculate netLikes on save/change
reviewSchema.pre("save", function (next) {
  this.netLikes = (this.likes || []).length - (this.dislikes || []).length;
  next();
});

const Review = mongoose.model<IReviewDocument>("Review", reviewSchema);
export default Review;
