import { User, Gender } from './usermodel.js';
import type { UserDocument, PrescribedMedicine, UserLocation } from './usermodel.js';
import { Doctor } from '../Doctor/doctorModel.js';
import mongoose from 'mongoose';

export interface CreateUserData {
  name: string;
  contact: string;
  age: number;
  gender: Gender;
  doctorId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    timestamp?: Date | undefined;
  };
}

export interface UserWithDoctor extends UserDocument {
  doctorDetails?: {
    _id: string;
    name: string;
    specialization: string;
    experience: number;
    rating: number;
    contact: string;
    email: string;
    location: string;
    consultationFee: string;
    availability: string;
  };
}

// Create a new user
export const createUser = async (userData: CreateUserData): Promise<UserDocument> => {
  try {
    // Validate if doctor exists
    // const doctor = await Doctor.findById(userData.doctorId);
    // if (!doctor) {
    //   throw new Error(`Doctor with ID ${userData.doctorId} not found`);
    // }

    // Create new user
    const user = new User({
      name: userData.name,
      contact: userData.contact,
      age: userData.age,
      gender: userData.gender,
      ...(userData.location && { location: userData.location })
    //   doctorId: userData.doctorId
    });

    const savedUser = await user.save();
    return savedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    throw new Error('Failed to create user: Unknown error');
  }
};

// Get user by ID with doctor information
export const getUserById = async (userId: string): Promise<UserWithDoctor | null> => {
  try {
    const user = await User.findById(userId)
      .populate('name specialization experience rating contact email location consultationFee availability')
      .lean() as UserWithDoctor;
    
    // if (user && user.doctorId) {
    //   user.doctorDetails = user.doctorId as any;
    // }
    
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
    throw new Error('Failed to get user: Unknown error');
  }
};

// Get all users with doctor information
export const getAllUsers = async (): Promise<UserWithDoctor[]> => {
  try {
    const users = await User.find();
    return users;
    // return users.map(user => {
    //   if (user.doctorId) {
    //     user.doctorDetails = user.doctorId as any;
    //   }
    //   return user;
    // });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
    throw new Error('Failed to get users: Unknown error');
  }
};

// Update user
// export const updateUser = async (userId: string, updateData: Partial<CreateUserData>): Promise<UserDocument | null> => {
//   try {
//     // If doctorId is being updated, validate the new doctor exists
//     if (updateData.doctorId) {
//       const doctor = await Doctor.findById(updateData.doctorId);
//       if (!doctor) {
//         throw new Error(`Doctor with ID ${updateData.doctorId} not found`);
//       }
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     return updatedUser;
//   } catch (error) {
//     if (error instanceof Error) {
//       throw new Error(`Failed to update user: ${error.message}`);
//     }
//     throw new Error('Failed to update user: Unknown error');
//   }
// };

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    return !!deletedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
    throw new Error('Failed to delete user: Unknown error');
  }
};

// Get users by doctor ID
export const getUsersByDoctorId = async (doctorId: string): Promise<UserWithDoctor[]> => {
  try {
    const users = await User.find({ doctorId })
      .populate('doctorId', 'name specialization experience rating contact email location consultationFee availability')
      .lean() as UserWithDoctor[];
    
    // return users.map(user => {
    //   if (user.doctorId) {
    //     user.doctorDetails = user.doctorId as any;
    //   }
    //   return user;
    // });
    return users;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users by doctor: ${error.message}`);
    }
    throw new Error('Failed to get users by doctor: Unknown error');
  }
};

// Search users by name
export const searchUsersByName = async (name: string): Promise<UserWithDoctor[]> => {
  try {
    const users = await User.find({ 
      name: { $regex: name, $options: 'i' } 
    })
    .populate('doctorId', 'name specialization experience rating contact email location consultationFee availability')
    .lean() as UserWithDoctor[];
    
    // return users.map(user => {
    //   if (user.doctorId) {
    //     user.doctorDetails = user.doctorId as any;
    //   }
    //   return user;
    // });
    return users;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
    throw new Error('Failed to search users: Unknown error');
  }
};

// Get user statistics
export const getUserStats = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const usersByGender = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    const averageAge = await User.aggregate([
      { $group: { _id: null, averageAge: { $avg: '$age' } } }
    ]);

    return {
      totalUsers,
      usersByGender,
      averageAge: averageAge[0]?.averageAge || 0
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
    throw new Error('Failed to get user stats: Unknown error');
  }
};

// Prescribe medicine to user
export const prescribeMedicineToUser = async (
  userId: string, 
  medicineData: {
    medicineName: string;
    dose: string;
    doctorId?: string;
    instructions?: string;
  }
): Promise<UserDocument | null> => {
  try {
    const prescribedMedicine: PrescribedMedicine = {
      medicineName: medicineData.medicineName,
      dose: medicineData.dose,
      prescribedAt: new Date(),
      ...(medicineData.doctorId && { doctorId: medicineData.doctorId }),
      ...(medicineData.instructions && { instructions: medicineData.instructions })
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          prescribedMedicines: prescribedMedicine 
        } 
      },
      { new: true, runValidators: true }
    );

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to prescribe medicine: ${error.message}`);
    }
    throw new Error('Failed to prescribe medicine: Unknown error');
  }
};

// Prescribe multiple medicines to user
export const prescribeMultipleMedicines = async (
  userId: string,
  medicines: Array<{
    medicineName: string;
    dose: string;
    doctorId?: string;
    instructions?: string;
  }>
): Promise<UserDocument | null> => {
  try {
    const prescribedMedicines: PrescribedMedicine[] = medicines.map(med => ({
      medicineName: med.medicineName,
      dose: med.dose,
      prescribedAt: new Date(),
      ...(med.doctorId && { doctorId: med.doctorId }),
      ...(med.instructions && { instructions: med.instructions })
    }));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          prescribedMedicines: { $each: prescribedMedicines } 
        } 
      },
      { new: true, runValidators: true }
    );

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to prescribe medicines: ${error.message}`);
    }
    throw new Error('Failed to prescribe medicines: Unknown error');
  }
};

// Get user's prescribed medicines
export const getUserPrescribedMedicines = async (userId: string): Promise<PrescribedMedicine[]> => {
  try {
    const user = await User.findById(userId).select('prescribedMedicines');
    return user?.prescribedMedicines || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get prescribed medicines: ${error.message}`);
    }
    throw new Error('Failed to get prescribed medicines: Unknown error');
  }
};

// Remove a prescribed medicine from user
export const removePrescribedMedicine = async (
  userId: string, 
  medicineIndex: number
): Promise<UserDocument | null> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (medicineIndex < 0 || medicineIndex >= user.prescribedMedicines.length) {
      throw new Error('Invalid medicine index');
    }

    user.prescribedMedicines.splice(medicineIndex, 1);
    await user.save();

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove prescribed medicine: ${error.message}`);
    }
    throw new Error('Failed to remove prescribed medicine: Unknown error');
  }
};

// Get users by prescribed medicine name
export const getUsersByMedicine = async (medicineName: string): Promise<UserDocument[]> => {
  try {
    const users = await User.find({
      'prescribedMedicines.medicineName': { $regex: medicineName, $options: 'i' }
    });
    return users;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users by medicine: ${error.message}`);
    }
    throw new Error('Failed to get users by medicine: Unknown error');
  }
};

// Update user location
export const updateUserLocation = async (
  userId: string,
  locationData: UserLocation
): Promise<UserDocument | null> => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        location: {
          ...locationData,
          timestamp: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update user location: ${error.message}`);
    }
    throw new Error('Failed to update user location: Unknown error');
  }
};

// Get users within a certain radius (in kilometers) from given coordinates
export const getUsersNearLocation = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<UserDocument[]> => {
  try {
    const users = await User.find({
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    });

    // Filter users by distance using Haversine formula
    const usersWithinRadius = users.filter(user => {
      if (!user.location?.latitude || !user.location?.longitude) {
        return false;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        user.location.latitude,
        user.location.longitude
      );

      return distance <= radiusKm;
    });

    return usersWithinRadius;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users near location: ${error.message}`);
    }
    throw new Error('Failed to get users near location: Unknown error');
  }
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
