import mongoose, { Document } from "mongoose";
import { z } from "zod";
declare enum Available {
    AVAILABLE = "available",
    NOT_AVAILABLE = "not available"
}
export declare const DoctorSchemaZod: z.ZodObject<{
    name: z.ZodString;
    specialization: z.ZodString;
    experience: z.ZodNumber;
    rating: z.ZodNumber;
    contact: z.ZodString;
    email: z.ZodEmail;
    location: z.ZodString;
    consultationFee: z.ZodString;
    availability: z.ZodEnum<typeof Available>;
}, z.core.$strip>;
export interface DoctorDocument extends Document {
    name: string;
    specialization: string;
    experience: number;
    rating: number;
    contact: string;
    email: string;
    location: string;
    consultationFee: string;
    availability: Available;
}
export declare const Doctor: mongoose.Model<DoctorDocument, {}, {}, {}, mongoose.Document<unknown, {}, DoctorDocument, {}, {}> & DoctorDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export {};
//# sourceMappingURL=doctorModel.d.ts.map