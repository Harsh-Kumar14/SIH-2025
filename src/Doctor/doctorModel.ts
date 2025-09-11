import mongoose, { Schema, Document, type Decimal128 } from "mongoose";
import {number, string, z} from "zod";

enum Available {
  AVAILABLE = "available",
  NOT_AVAILABLE = "not available"
}

export const DoctorSchemaZod = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  specialization: z.string().min(1),
  experience: z.number(),
  rating: z.number(),
  contact: z.string().min(1),
  email: z.email(),
  location: z.string().min(1),
  consultationFee: z.string(),
  availability: z.enum(Available),
  password: z.string().min(6)
});

export interface DoctorDocument extends Document {
  name: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  rating: number;
  contact: string;
  email: string;
  location: string;
  consultationFee: string;
  availability: Available;
  password: string;
}

const DoctorSchema = new Schema<DoctorDocument>({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  rating:{type:Number,default:0},
  contact: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String },
  consultationFee: { type: String, required: true },
  availability: { type: String, default: Available.AVAILABLE },
  password: { type: String, required: true }
});

export const Doctor = mongoose.model<DoctorDocument>("Doctor", DoctorSchema);
