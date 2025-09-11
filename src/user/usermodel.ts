import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other"
}

// Medicine prescription interface
export interface PrescribedMedicine {
  medicineName: string;
  dose: string;
  prescribedAt: Date;
  doctorId?: string;
  instructions?: string;
}

export const UserSchemaZod = z.object({
  name: z.string().min(1, "Name is required"),
  contact: z.string().min(10, "Contact number must be at least 10 digits"),
  age: z.number().min(1, "Age must be greater than 0").max(150, "Age must be less than 150"),
  gender: z.nativeEnum(Gender),
  doctorId: z.string().optional(),
  prescribedMedicines: z.array(z.object({
    medicineName: z.string().min(1, "Medicine name is required"),
    dose: z.string().min(1, "Dose is required"),
    prescribedAt: z.date().optional(),
    doctorId: z.string().optional(),
    instructions: z.string().optional()
  })).optional()
});

export interface UserDocument extends Document {
  name: string;
  contact: string;
  age: number;
  gender: Gender;
  prescribedMedicines: PrescribedMedicine[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  contact: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  age: { 
    type: Number, 
    required: true,
    min: 1,
    max: 150
  },
  gender: { 
    type: String, 
    enum: Object.values(Gender),
    required: true
  },
  prescribedMedicines: [{
    medicineName: {
      type: String,
      required: true,
      trim: true
    },
    dose: {
      type: String,
      required: true,
      trim: true
    },
    prescribedAt: {
      type: Date,
      default: Date.now
    },
    doctorId: {
      type: String,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true // This automatically adds createdAt and updatedAt fields
});

// Pre-save middleware to populate doctor name
// UserSchema.pre('save', async function(next) {
//   if (this.isModified('doctorId') || this.isNew) {
//     try {
//     //   const doctor = await mongoose.model('Doctor').findById(this.doctorId);
//     //   if (doctor) {
//     //     this.doctorName = doctor.name;
//     //   }
//     } catch (error) {
//       console.error('Error populating doctor name:', error);
//     }
//   }
//   next();
// });

// Instance method to populate doctor information
UserSchema.methods.populateDoctor = function() {
  return this.populate('doctorId', 'name specialization');
};

export const User = mongoose.model<UserDocument>("User", UserSchema);
export { Gender };
