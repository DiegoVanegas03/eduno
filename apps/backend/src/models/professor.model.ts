import mongoose, { Document, Schema } from "mongoose";
import { IProfessor } from "@eduno/shared";

export interface IProfessorDocument extends Document, Omit<IProfessor, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const professorSchema = new Schema<IProfessorDocument>(
  {
    name: {
      type: String,
      required: [true, "El nombre del profesor es obligatorio"],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isVerificado: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    calificacion: {
      type: Number,
      default: 5.0,
      min: [0, "La calificación mínima es 0"],
      max: [5, "La calificación máxima es 5"],
    },
    numResenas: {
      type: Number,
      default: 0,
      min: [0, "El número de reseñas no puede ser negativo"],
    },
    descripcionAbreviada: {
      type: String,
      default: "",
      trim: true,
    },
    descripcionPerfil: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "professors",
  }
);

const Professor = mongoose.model<IProfessorDocument>("Professor", professorSchema);
export default Professor;
