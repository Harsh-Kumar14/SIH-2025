import mongoose, { Schema, Document, type Decimal128 } from "mongoose";
import {number, string, z} from "zod";
enum available{
  "available"="Available Today",
  "notavailable"="Not Available Today"
}
export const DoctorSchemaZod = z.object({
  name: z.string().min(1),
  specialization: z.string().min(1),
  experience: z.number(),
  rating:z.float32(),
  contact: z.string().min(1),
  email: z.email(),
  location: z.string().min(1),
  consultationFee: z.string(),
  availability:z.enum(available)
});

export interface DoctorDocument extends Document {
  name: string;
  specialization: string;
  experience: number;
  rating:number;
  contact: string;
  email: string;
  location: string;
  consultationFee: string;
  availability:available

}

const DoctorSchema = new Schema<DoctorDocument>({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  rating:{type:Number},
  contact: { type: String, required: true },
  email: { type: String, required: true },
  location: { type: String, required: true },
  consultationFee: {type:String,required:true},
  availability:{type:String,required:true}
});

export const Doctor = mongoose.model<DoctorDocument>("Doctor", DoctorSchema);
