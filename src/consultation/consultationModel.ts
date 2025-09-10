import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

export enum ConsultationStatus {
  WAITING = "waiting",
  IN_PROGRESS = "in-progress", 
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum ConsultationType {
  GENERAL = "general",
  FOLLOW_UP = "follow-up",
  EMERGENCY = "emergency",
  VIDEO_CALL = "video-call"
}

// Zod schema for validation
export const ConsultationSchemaZod = z.object({
  doctorLicenseNumber: z.string().min(1, "Doctor license number is required"), // Use license number to find doctor
  patientContact: z.string().min(10, "Patient contact number is required"), // Use contact to find patient
  patientName: z.string().min(1, "Patient name is required"),
  reason: z.string().min(1, "Symptoms or reason for consultation is required"),
  consultationType: z.nativeEnum(ConsultationType).default(ConsultationType.GENERAL),
  preferredDate: z.string().optional(), // Date from the form
  preferredTime: z.string().optional(), // Time slot from the form
  additionalNotes: z.string().optional(), // Additional notes from the form
  status: z.nativeEnum(ConsultationStatus).default(ConsultationStatus.WAITING)
});

// Patient interface for the consultation
export interface PatientInConsultation {
  patientId: mongoose.Types.ObjectId;
  patientName: string;
  patientContact: string;
  reason: string; // Symptoms or reason for consultation
  consultationType: ConsultationType;
  status: ConsultationStatus;
  bookedAt: Date;
  preferredDate?: Date; // Patient's preferred date
  preferredTime?: string; // Patient's preferred time slot
  scheduledTime?: Date; // Actual scheduled time (set by doctor)
  startedAt?: Date;
  completedAt?: Date;
  additionalNotes?: string; // Patient's additional notes
  doctorNotes?: string; // Doctor's notes during/after consultation
}

// Main consultation document interface
export interface ConsultationDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  patients: PatientInConsultation[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for patient in consultation
const PatientConsultationSchema = new Schema<PatientInConsultation>({
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  patientName: { 
    type: String, 
    required: true,
    trim: true
  },
  patientContact: { 
    type: String, 
    required: true,
    trim: true
  },
  reason: { 
    type: String, 
    required: true,
    trim: true
  },
  consultationType: {
    type: String,
    enum: Object.values(ConsultationType),
    default: ConsultationType.GENERAL
  },
  status: {
    type: String,
    enum: Object.values(ConsultationStatus),
    default: ConsultationStatus.WAITING
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  preferredDate: {
    type: Date
  },
  preferredTime: {
    type: String,
    trim: true
  },
  scheduledTime: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  doctorNotes: {
    type: String,
    trim: true
  }
});

// Main consultation schema
const ConsultationSchema = new Schema<ConsultationDocument>({
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Doctor',
    required: true,
    unique: true // Each doctor has one consultation document
  },
  patients: [PatientConsultationSchema]
}, {
  timestamps: true
});

// Index for better query performance
ConsultationSchema.index({ doctorId: 1 });
ConsultationSchema.index({ 'patients.patientId': 1 });
ConsultationSchema.index({ 'patients.status': 1 });
ConsultationSchema.index({ 'patients.bookedAt': 1 });

// Instance methods
ConsultationSchema.methods.getPatientsByStatus = function(status: ConsultationStatus) {
  return this.patients.filter((patient: PatientInConsultation) => patient.status === status);
};

ConsultationSchema.methods.getWaitingPatients = function() {
  return this.getPatientsByStatus(ConsultationStatus.WAITING);
};

ConsultationSchema.methods.getActivePatients = function() {
  return this.getPatientsByStatus(ConsultationStatus.IN_PROGRESS);
};

ConsultationSchema.methods.getCompletedPatients = function() {
  return this.getPatientsByStatus(ConsultationStatus.COMPLETED);
};

// Static methods
ConsultationSchema.statics.findByDoctorId = function(doctorId: string) {
  return this.findOne({ doctorId });
};

ConsultationSchema.statics.getPatientConsultationHistory = function(patientId: string) {
  return this.find(
    { 'patients.patientId': patientId },
    { 
      doctorId: 1, 
      'patients.$': 1 
    }
  ).populate('doctorId', 'name specialization');
};

export const Consultation = mongoose.model<ConsultationDocument>("Consultation", ConsultationSchema);
