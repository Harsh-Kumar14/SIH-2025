
import mongoose from "mongoose";
import type { DoctorDocument } from "./doctorModel.js";
import { Doctor } from "./doctorModel.js";
import bcrypt from "bcrypt";
import dotenv from 'dotenv';

dotenv.config();

const dbUri = process.env.DATABASE_URI || process.env.DATABASE_URL;

if (!dbUri) {
  throw new Error('DATABASE_URI or DATABASE_URL environment variable is required');
}

mongoose.connect(dbUri);

export async function getDoctorId(licenseNumber: string): Promise<string | null> {
  const doctor = await Doctor.findOne({ licenseNumber }).lean();
  return doctor ? doctor._id.toString() : null;
}

export async function addDoctor(doctor: DoctorDocument ): Promise<string> {
  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(doctor.password, 10);
  const newDoctor = new Doctor({ ...doctor, password: hashedPassword });
  const savedDoctor: any = await newDoctor.save();
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
