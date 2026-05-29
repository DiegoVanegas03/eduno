import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "@eduno/shared";
import { USER_ROLES } from "@eduno/shared";


/**
 * IUser represents the user document as stored in MongoDB.
 * better-auth manages its own `user` and `session` collections automatically.
 * This model is kept for application-level queries (e.g. enriching profile
 * data with custom fields like `role`).
 */
export interface IUser extends Document {
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  image?: string;
  isBanned?: boolean;
  career?: string;
  semester?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const roles = Object.values(USER_ROLES);


const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Por favor ingrese un correo válido"],
    },
    role: {
      type: String,
      enum: roles,
      default: "alumno",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    career: {
      type: String,
      default: "",
    },
    semester: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    // better-auth uses the collection name "user" (lowercase, no plural)
    collection: "user",
  },
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
