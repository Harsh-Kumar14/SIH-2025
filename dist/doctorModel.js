import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";
export const DoctorSchemaZod = z.object({
    name: z.string().min(1),
    specialization: z.string().min(1),
    experience: z.number().min(0),
    contact: z.string().min(1),
    email: z.string().email(),
    location: z.string().min(1),
});
const DoctorSchema = new Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
});
export const Doctor = mongoose.model("Doctor", DoctorSchema);
//# sourceMappingURL=doctorModel.js.map