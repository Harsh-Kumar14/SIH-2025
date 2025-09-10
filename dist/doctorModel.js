import mongoose, { Schema, Document } from "mongoose";
import { number, string, z } from "zod";
var Available;
(function (Available) {
    Available["AVAILABLE"] = "available";
    Available["NOT_AVAILABLE"] = "not available";
})(Available || (Available = {}));
export const DoctorSchemaZod = z.object({
    name: z.string().min(1),
    specialization: z.string().min(1),
    experience: z.number(),
    rating: z.number(),
    contact: z.string().min(1),
    email: z.email(),
    location: z.string().min(1),
    consultationFee: z.string(),
    availability: z.nativeEnum(Available)
});
const DoctorSchema = new Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true },
    rating: { type: Number },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    consultationFee: { type: String, required: true },
    availability: { type: String, required: true }
});
export const Doctor = mongoose.model("Doctor", DoctorSchema);
//# sourceMappingURL=doctorModel.js.map