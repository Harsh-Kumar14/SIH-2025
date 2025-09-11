import express from 'express';
import type { Request, Response } from 'express';
import {
  createUser,
  getUserById,
  getAllUsers,
  deleteUser,
  getUsersByDoctorId,
  searchUsersByName,
  getUserStats,
  prescribeMedicineToUser,
  prescribeMultipleMedicines,
  getUserPrescribedMedicines,
  removePrescribedMedicine,
  getUsersByMedicine
} from './userservice.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const user = await getUserById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const newUser = await createUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const deleted = await deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/doctor/:doctorId - Get users by doctor ID
router.get('/doctor/:doctorId', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    
    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }
    
    const users = await getUsersByDoctorId(doctorId);
    
    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users by doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/search/:name - Search users by name
router.get('/search/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name parameter is required'
      });
    }
    
    const users = await searchUsersByName(name);
    
    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/stats/overview - Get user statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await getUserStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users/:id/prescribe-medicine - Prescribe medicine to user
router.post('/:id/prescribe-medicine', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { medicineName, dose, doctorId, instructions } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!medicineName || !dose) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name and dose are required'
      });
    }
    
    const updatedUser = await prescribeMedicineToUser(id, {
      medicineName,
      dose,
      doctorId,
      instructions
    });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine prescribed successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error prescribing medicine',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users/:id/prescribe-multiple-medicines - Prescribe multiple medicines to user
router.post('/:id/prescribe-multiple-medicines', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { medicines } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medicines array is required and must not be empty'
      });
    }
    
    // Validate each medicine object
    for (const medicine of medicines) {
      if (!medicine.medicineName || !medicine.dose) {
        return res.status(400).json({
          success: false,
          message: 'Each medicine must have medicineName and dose'
        });
      }
    }
    
    const updatedUser = await prescribeMultipleMedicines(id, medicines);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicines prescribed successfully',
      data: updatedUser,
      prescribedCount: medicines.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error prescribing medicines',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id/prescribed-medicines - Get user's prescribed medicines
router.get('/:id/prescribed-medicines', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const prescribedMedicines = await getUserPrescribedMedicines(id);
    
    res.status(200).json({
      success: true,
      data: prescribedMedicines,
      count: prescribedMedicines.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prescribed medicines',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/users/:id/prescribed-medicines/:index - Remove prescribed medicine
router.delete('/:id/prescribed-medicines/:index', async (req: Request, res: Response) => {
  try {
    const { id, index } = req.params;
    
    if (!id || !index) {
      return res.status(400).json({
        success: false,
        message: 'User ID and medicine index are required'
      });
    }
    
    const medicineIndex = parseInt(index);
    if (isNaN(medicineIndex)) {
      return res.status(400).json({
        success: false,
        message: 'Medicine index must be a valid number'
      });
    }
    
    const updatedUser = await removePrescribedMedicine(id, medicineIndex);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescribed medicine removed successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error removing prescribed medicine',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/medicine/:medicineName - Get users by prescribed medicine
router.get('/medicine/:medicineName', async (req: Request, res: Response) => {
  try {
    const { medicineName } = req.params;
    
    if (!medicineName) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name is required'
      });
    }
    
    const users = await getUsersByMedicine(medicineName);
    
    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users by medicine',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
