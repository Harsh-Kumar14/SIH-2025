import { User, Gender } from './usermodel.js';
import type { UserDocument } from './usermodel.js';
import { Doctor } from '../Doctor/doctorModel.js';
import mongoose from 'mongoose';

export interface CreateUserData {
  name: string;
  contact: string;
  age: number;
  gender: Gender;
  doctorId: string;
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
