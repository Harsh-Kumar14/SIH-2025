import mongoose from "mongoose";
import type { DoctorDocument } from "./doctorModel.js";
import { Doctor } from "./doctorModel.js";

const dbUri = "mongodb+srv://hraj98097_db_user:pbL3F2UDbnxHzKyz@doctor-details.q8vf2ol.mongodb.net/doctor-details";

mongoose.connect(dbUri);

export async function getDoctorId(licenseNumber: string): Promise<string | null> {
  const doctor = await Doctor.findOne({ licenseNumber }).lean();
  return doctor ? doctor._id.toString() : null;
}

export async function addDoctor(doctor: DoctorDocument ): Promise<string> {
  const newDoctor = new Doctor(doctor);
  const savedDoctor:any = await newDoctor.save();
  return savedDoctor._id.toString();
}

export async function getDoctorById(id: string): Promise<Omit<DoctorDocument, "contact"> | null> {
  const doctor = await Doctor.findById(id).lean();
  if (!doctor) return null;
  const { contact, ...publicDoctor } = doctor as DoctorDocument & { contact: string };
  return publicDoctor as Omit<DoctorDocument, "contact">;
}

export async function getAllDoctors(): Promise<Omit<DoctorDocument, "contact">[]> {
  const doctors = await Doctor.find().lean();
  return doctors.map(({ contact, ...publicDoctor }) => publicDoctor) as Omit<DoctorDocument, "contact">[];
}
