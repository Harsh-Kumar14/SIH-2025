import mongoose from "mongoose";
import { Doctor } from "./doctorModel.js";
const dbUri = "mongodb+srv://hraj98097_db_user:pbL3F2UDbnxHzKyz@doctor-details.q8vf2ol.mongodb.net/doctor-details";
mongoose.connect(dbUri);
export async function addDoctor(doctor) {
    const newDoctor = new Doctor(doctor);
    const savedDoctor = await newDoctor.save();
    return savedDoctor._id.toString();
}
export async function getDoctorById(id) {
    const doctor = await Doctor.findById(id).lean();
    if (!doctor)
        return null;
    const { contact, ...publicDoctor } = doctor;
    return publicDoctor;
}
export async function getAllDoctors() {
    const doctors = await Doctor.find().lean();
    return doctors.map(({ contact, ...publicDoctor }) => publicDoctor);
}
//# sourceMappingURL=doctorService.js.map