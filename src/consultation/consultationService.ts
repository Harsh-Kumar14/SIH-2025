import { Consultation, ConsultationStatus, ConsultationType } from './consultationModel.js';
import type { ConsultationDocument, PatientInConsultation } from './consultationModel.js';
import { Doctor } from '../Doctor/doctorModel.js';
import { User } from '../user/usermodel.js';
import mongoose from 'mongoose';

export interface BookConsultationData {
  doctorLicenseNumber: string; // Doctor's license number for lookup
  patientContact: string; // Patient's contact number for lookup
  patientName: string;
  reason: string;
  consultationType?: ConsultationType;
  preferredDate?: string;
  preferredTime?: string;
  additionalNotes?: string;
}

export interface UpdateConsultationStatus {
  doctorId: string;
  patientId: string;
  status: ConsultationStatus;
  doctorNotes?: string; // Changed from 'notes' to 'doctorNotes'
}

// Book a new consultation
export const bookConsultation = async (consultationData: BookConsultationData): Promise<PatientInConsultation> => {
  try {
    // Find doctor by license number
    const doctor = await Doctor.findOne({ licenseNumber: consultationData.doctorLicenseNumber });
    if (!doctor) {
      throw new Error(`Doctor with license number ${consultationData.doctorLicenseNumber} not found`);
    }

    // Find patient by contact number
    const patient = await User.findOne({ contact: consultationData.patientContact });
    if (!patient) {
      throw new Error(`Patient with contact number ${consultationData.patientContact} not found`);
    }

    // Find or create consultation document for the doctor
    let consultation = await Consultation.findOne({ doctorId: doctor._id });
    
    if (!consultation) {
      consultation = new Consultation({
        doctorId: doctor._id,
        patients: []
      });
    }

    // Check if patient already has a pending consultation with this doctor
    const existingConsultation = consultation.patients.find(
      p => p.patientId.toString() === (patient._id as mongoose.Types.ObjectId).toString() && 
           (p.status === ConsultationStatus.WAITING || p.status === ConsultationStatus.IN_PROGRESS)
    );

    if (existingConsultation) {
      throw new Error('Patient already has a pending consultation with this doctor');
    }

    // Create new patient consultation
    const newPatientConsultation: PatientInConsultation = {
      patientId: patient._id as mongoose.Types.ObjectId,
      patientName: consultationData.patientName,
      patientContact: consultationData.patientContact,
      reason: consultationData.reason,
      consultationType: consultationData.consultationType || ConsultationType.GENERAL,
      status: ConsultationStatus.WAITING,
      bookedAt: new Date()
    };

    // Add optional fields if provided
    if (consultationData.preferredDate) {
      newPatientConsultation.preferredDate = new Date(consultationData.preferredDate);
    }
    if (consultationData.preferredTime) {
      newPatientConsultation.preferredTime = consultationData.preferredTime;
    }
    if (consultationData.additionalNotes) {
      newPatientConsultation.additionalNotes = consultationData.additionalNotes;
    }

    // Add to consultation queue
    consultation.patients.push(newPatientConsultation);
    await consultation.save();

    return newPatientConsultation;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to book consultation: ${error.message}`);
    }
    throw new Error('Failed to book consultation: Unknown error');
  }
};

// Get doctor's consultation queue
export const getDoctorConsultations = async (doctorId: string) => {
  try {
    const consultation = await Consultation.findOne({ doctorId })
      .populate('doctorId', 'name specialization contact email')
      .lean();

    if (!consultation) {
      return {
        doctorId,
        patients: [],
        stats: {
          waiting: 0,
          inProgress: 0,
          completed: 0,
          total: 0
        }
      };
    }

    const waiting = consultation.patients.filter(p => p.status === ConsultationStatus.WAITING);
    const inProgress = consultation.patients.filter(p => p.status === ConsultationStatus.IN_PROGRESS);
    const completed = consultation.patients.filter(p => p.status === ConsultationStatus.COMPLETED);

    return {
      ...consultation,
      stats: {
        waiting: waiting.length,
        inProgress: inProgress.length,
        completed: completed.length,
        total: consultation.patients.length
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get doctor consultations: ${error.message}`);
    }
    throw new Error('Failed to get doctor consultations: Unknown error');
  }
};

// Update consultation status
export const updateConsultationStatus = async (updateData: UpdateConsultationStatus): Promise<PatientInConsultation | null> => {
  try {
    const consultation = await Consultation.findOne({ doctorId: updateData.doctorId });
    
    if (!consultation) {
      throw new Error('Consultation document not found');
    }

    const patientConsultation = consultation.patients.find(
      p => p.patientId.toString() === updateData.patientId
    );

    if (!patientConsultation) {
      throw new Error('Patient consultation not found');
    }

    // Update status and timestamps
    patientConsultation.status = updateData.status;
    
    if (updateData.status === ConsultationStatus.IN_PROGRESS && !patientConsultation.startedAt) {
      patientConsultation.startedAt = new Date();
    }
    
    if (updateData.status === ConsultationStatus.COMPLETED && !patientConsultation.completedAt) {
      patientConsultation.completedAt = new Date();
    }

    if (updateData.doctorNotes) {
      patientConsultation.doctorNotes = updateData.doctorNotes;
    }

    await consultation.save();
    return patientConsultation;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update consultation status: ${error.message}`);
    }
    throw new Error('Failed to update consultation status: Unknown error');
  }
};

// Get patient's consultation history
export const getPatientConsultationHistory = async (patientId: string) => {
  try {
    const consultations = await Consultation.find(
      { 'patients.patientId': patientId }
    )
    .populate('doctorId', 'name specialization contact email location')
    .lean();

    const history = consultations.map(consultation => {
      const patientConsultations = consultation.patients.filter(
        p => p.patientId.toString() === patientId
      );
      
      return {
        doctor: consultation.doctorId,
        consultations: patientConsultations
      };
    });

    return history;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get patient consultation history: ${error.message}`);
    }
    throw new Error('Failed to get patient consultation history: Unknown error');
  }
};

// Get consultations by status
export const getConsultationsByStatus = async (doctorId: string, status: ConsultationStatus) => {
  try {
    const consultation = await Consultation.findOne({ doctorId });
    
    if (!consultation) {
      return [];
    }

    return consultation.patients.filter(p => p.status === status);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get consultations by status: ${error.message}`);
    }
    throw new Error('Failed to get consultations by status: Unknown error');
  }
};

// Cancel consultation
export const cancelConsultation = async (doctorId: string, patientId: string): Promise<boolean> => {
  try {
    const consultation = await Consultation.findOne({ doctorId });
    
    if (!consultation) {
      throw new Error('Consultation document not found');
    }

    const patientIndex = consultation.patients.findIndex(
      p => p.patientId.toString() === patientId
    );

    if (patientIndex === -1) {
      throw new Error('Patient consultation not found');
    }

    // Update status to cancelled instead of removing
    const patientConsultation = consultation.patients[patientIndex];
    if (patientConsultation) {
      patientConsultation.status = ConsultationStatus.CANCELLED;
      await consultation.save();
    }

    return true;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to cancel consultation: ${error.message}`);
    }
    throw new Error('Failed to cancel consultation: Unknown error');
  }
};

// Get next patient in queue
export const getNextPatientInQueue = async (doctorId: string): Promise<PatientInConsultation | null> => {
  try {
    const consultation = await Consultation.findOne({ doctorId });
    
    if (!consultation) {
      return null;
    }

    const waitingPatients = consultation.patients
      .filter(p => p.status === ConsultationStatus.WAITING)
      .sort((a, b) => a.bookedAt.getTime() - b.bookedAt.getTime());

    return waitingPatients[0] || null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get next patient: ${error.message}`);
    }
    throw new Error('Failed to get next patient: Unknown error');
  }
};

// Get consultation statistics for dashboard
export const getConsultationStats = async (doctorId?: string) => {
  try {
    const matchCondition = doctorId ? { doctorId } : {};
    
    const stats = await Consultation.aggregate([
      { $match: matchCondition },
      { $unwind: '$patients' },
      {
        $group: {
          _id: '$patients.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      waiting: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id as keyof typeof result] = stat.count;
      result.total += stat.count;
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get consultation stats: ${error.message}`);
    }
    throw new Error('Failed to get consultation stats: Unknown error');
  }
};
