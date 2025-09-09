import type { DoctorDocument } from "./doctorModel.js";
export declare function addDoctor(doctor: {
    name: string;
    specialization: string;
    experience: number;
    contact: string;
    email: string;
    location: string;
}): Promise<string>;
export declare function getDoctorById(id: string): Promise<Omit<DoctorDocument, "contact"> | null>;
export declare function getAllDoctors(): Promise<Omit<DoctorDocument, "contact">[]>;
//# sourceMappingURL=doctorService.d.ts.map