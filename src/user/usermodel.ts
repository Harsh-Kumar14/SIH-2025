import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other"
}

// Location interface
export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  timestamp: Date;
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
  gender: z.enum(Gender),
  doctorId: z.string().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90, "Invalid latitude").default(0),
    longitude: z.number().min(-180).max(180, "Invalid longitude").default(0),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    timestamp: z.date().optional()
  }).optional().default({ latitude: 0, longitude: 0, timestamp: new Date() }),
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
  location?: UserLocation;
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
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
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
