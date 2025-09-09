import mongoose, { Document } from "mongoose";
import { z } from "zod";
export declare const DoctorSchemaZod: z.ZodObject<{
    name: z.ZodString;
    specialization: z.ZodString;
    experience: z.ZodNumber;
    contact: z.ZodString;
    email: z.ZodString;
    location: z.ZodString;
}, z.core.$strip>;
export interface DoctorDocument extends Document {
    name: string;
    specialization: string;
    experience: number;
    contact: string;
    email: string;
    location: string;
}
export declare const Doctor: mongoose.Model<DoctorDocument, {}, {}, {}, mongoose.Document<unknown, {}, DoctorDocument, {}, {}> & DoctorDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=doctorModel.d.ts.map