import express from 'express';
import cors from 'cors';
import { getDoctorId } from './Doctor/doctorService.js';
import { createServer } from 'http';
import { addDoctor, getAllDoctors } from './Doctor/doctorService.js';
import { DoctorSchemaZod } from './Doctor/doctorModel.js';
import { ChatSocketService } from './chatting/chat.service.js';
import { chatRoutes } from './chatting/chat.routes.js';
import { createUser, getAllUsers, getUserById, deleteUser, getUsersByDoctorId, searchUsersByName, getUserStats } from './user/userservice.js';
import { UserSchemaZod } from './user/usermodel.js';
import { bookConsultation, getDoctorConsultations, updateConsultationStatus, getPatientConsultationHistory, getConsultationsByStatus, cancelConsultation, getNextPatientInQueue, getConsultationStats } from './consultation/consultationService.js';
import { ConsultationSchemaZod, ConsultationStatus } from './consultation/consultationModel.js';
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;
// Initialize Chat Socket Service
const chatService = new ChatSocketService(server);
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for simplicity; adjust as needed for security
}));
// Serve static files from public directory
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
// Chat routes
app.use('/api/chat', chatRoutes);
app.post('/add-doctor', async (req, res) => {
    // Logic to add a doctor
    const result = DoctorSchemaZod.safeParse(req.body);
    if (!result.success) {
        return res.status(400).send(result.error);
    }
    const response = {
        name: result.data.name,
        licenseNumber: result.data.licenseNumber,
        specialization: result.data.specialization,
        experience: result.data.experience,
        rating: result.data.rating,
        contact: result.data.contact,
        email: result.data.email,
        location: result.data.location,
        consultationFee: result.data.consultationFee,
        availability: result.data.availability
    };
    const doctorId = await addDoctor(response);
    res.status(201).send({ message: 'Doctor added successfully', doctorId });
});
app.get('/get-doctors', async (req, res) => {
    // Logic to get all doctors
    const doctors = await getAllDoctors();
    res.status(200).send(doctors);
});
// User routes
app.post('/add-user', async (req, res) => {
    try {
        const result = UserSchemaZod.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues
            });
        }
        const userData = {
            name: result.data.name,
            contact: result.data.contact,
            age: result.data.age,
            gender: result.data.gender,
            doctorId: result.data.doctorId
        };
        const user = await createUser(userData);
        res.status(201).json({
            message: 'User created successfully',
            userId: user._id,
            user: user
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/get-users', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            error: 'Failed to get users',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/get-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            error: 'Failed to get user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// app.put('/update-user/:id', async (req: Request, res: Response) => {
//   try {
//     const userId = req.params.id;
//     if (!userId) {
//       return res.status(400).json({ error: 'User ID is required' });
//     }
//     const result = UserSchemaZod.partial().safeParse(req.body);
//     if (!result.success) {
//       return res.status(400).json({ 
//         error: 'Validation failed', 
//         details: result.error.issues 
//       });
//     }
//     const user = await updateUser(userId, result.data);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.status(200).json({ 
//       message: 'User updated successfully', 
//       user: user 
//     });
//   } catch (error) {
//     console.error('Error updating user:', error);
//     res.status(500).json({ 
//       error: 'Failed to update user', 
//       message: error instanceof Error ? error.message : 'Unknown error' 
//     });
//   }
// });
app.delete('/delete-user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const success = await deleteUser(userId);
        if (!success) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/get-users-by-doctor/:doctorId', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }
        const users = await getUsersByDoctorId(doctorId);
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error getting users by doctor:', error);
        res.status(500).json({
            error: 'Failed to get users by doctor',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/search-users', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name query parameter is required' });
        }
        const users = await searchUsersByName(name);
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            error: 'Failed to search users',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/user-stats', async (req, res) => {
    try {
        const stats = await getUserStats();
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            error: 'Failed to get user stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Consultation routes
app.post('/book-consultation', async (req, res) => {
    try {
        const result = ConsultationSchemaZod.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.issues
            });
        }
        const consultationData = {
            doctorId: result.data.doctorId,
            patientId: result.data.patientId,
            patientName: result.data.patientName,
            patientContact: result.data.patientContact,
            reason: result.data.reason,
            consultationType: result.data.consultationType
        };
        // Add scheduledTime if provided
        if (result.data.scheduledTime) {
            consultationData.scheduledTime = result.data.scheduledTime;
        }
        const consultation = await bookConsultation(consultationData);
        res.status(201).json({
            message: 'Consultation booked successfully',
            consultation: consultation
        });
    }
    catch (error) {
        console.error('Error booking consultation:', error);
        res.status(500).json({
            error: 'Failed to book consultation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/doctorId', async (req, res) => {
    const id = await (getDoctorId(req.body.licenseNumber));
    res.status(200).json({ doctorId: id });
});
app.get('/doctor-consultations/:doctorId', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }
        const consultations = await getDoctorConsultations(doctorId);
        res.status(200).json(consultations);
    }
    catch (error) {
        console.error('Error getting doctor consultations:', error);
        res.status(500).json({
            error: 'Failed to get doctor consultations',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.put('/update-consultation-status', async (req, res) => {
    try {
        const { doctorId, patientId, status, notes } = req.body;
        if (!doctorId || !patientId || !status) {
            return res.status(400).json({
                error: 'doctorId, patientId, and status are required'
            });
        }
        if (!Object.values(ConsultationStatus).includes(status)) {
            return res.status(400).json({
                error: 'Invalid status value'
            });
        }
        const updateData = {
            doctorId,
            patientId,
            status,
            notes
        };
        const updatedConsultation = await updateConsultationStatus(updateData);
        res.status(200).json({
            message: 'Consultation status updated successfully',
            consultation: updatedConsultation
        });
    }
    catch (error) {
        console.error('Error updating consultation status:', error);
        res.status(500).json({
            error: 'Failed to update consultation status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/patient-consultation-history/:patientId', async (req, res) => {
    try {
        const patientId = req.params.patientId;
        if (!patientId) {
            return res.status(400).json({ error: 'Patient ID is required' });
        }
        const history = await getPatientConsultationHistory(patientId);
        res.status(200).json(history);
    }
    catch (error) {
        console.error('Error getting patient consultation history:', error);
        res.status(500).json({
            error: 'Failed to get patient consultation history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/consultations-by-status/:doctorId/:status', async (req, res) => {
    try {
        const { doctorId, status } = req.params;
        if (!doctorId || !status) {
            return res.status(400).json({ error: 'Doctor ID and status are required' });
        }
        if (!Object.values(ConsultationStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }
        const consultations = await getConsultationsByStatus(doctorId, status);
        res.status(200).json(consultations);
    }
    catch (error) {
        console.error('Error getting consultations by status:', error);
        res.status(500).json({
            error: 'Failed to get consultations by status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.delete('/cancel-consultation/:doctorId/:patientId', async (req, res) => {
    try {
        const { doctorId, patientId } = req.params;
        if (!doctorId || !patientId) {
            return res.status(400).json({ error: 'Doctor ID and Patient ID are required' });
        }
        const success = await cancelConsultation(doctorId, patientId);
        if (success) {
            res.status(200).json({ message: 'Consultation cancelled successfully' });
        }
        else {
            res.status(404).json({ error: 'Consultation not found' });
        }
    }
    catch (error) {
        console.error('Error cancelling consultation:', error);
        res.status(500).json({
            error: 'Failed to cancel consultation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/next-patient/:doctorId', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        if (!doctorId) {
            return res.status(400).json({ error: 'Doctor ID is required' });
        }
        const nextPatient = await getNextPatientInQueue(doctorId);
        res.status(200).json(nextPatient);
    }
    catch (error) {
        console.error('Error getting next patient:', error);
        res.status(500).json({
            error: 'Failed to get next patient',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/consultation-stats', async (req, res) => {
    try {
        const stats = await getConsultationStats();
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error getting consultation stats:', error);
        res.status(500).json({
            error: 'Failed to get consultation stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/consultation-stats/:doctorId', async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const stats = await getConsultationStats(doctorId);
        res.status(200).json(stats);
    }
    catch (error) {
        console.error('Error getting consultation stats:', error);
        res.status(500).json({
            error: 'Failed to get consultation stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.IO server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map