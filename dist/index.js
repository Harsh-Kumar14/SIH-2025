import bcrypt from 'bcrypt';
import express from 'express';
import cors from 'cors';
import { getDoctorId } from './Doctor/doctorService.js';
import { createServer } from 'http';
import { addDoctor, getAllDoctors } from './Doctor/doctorService.js';
import { DoctorSchemaZod } from './Doctor/doctorModel.js';
import { ChatSocketService } from './chatting/chat.service.js';
import { chatRoutes } from './chatting/chat.routes.js';
import { createUser, getAllUsers, getUserById, deleteUser, getUsersByDoctorId, searchUsersByName, getUserStats, prescribeMedicineToUser, prescribeMultipleMedicines, getUserPrescribedMedicines, getUsersByMedicine } from './user/userservice.js';
import { UserSchemaZod } from './user/usermodel.js';
import { User } from './user/usermodel.js';
import { Doctor } from './Doctor/doctorModel.js';
import { PharmacyService } from './pharmacy/pharmacyService.js';
import { NotificationService } from './notification/notificationService.js';
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
// Doctor sign-in route (after app is initialized)
app.post('/doctor-signin', async (req, res) => {
    const { licenseNumber, password } = req.body;
    if (!licenseNumber || !password) {
        return res.status(400).json({ error: 'License number and password are required' });
    }
    try {
        const doctor = await Doctor.findOne({ licenseNumber });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        // You can return doctor info except password
        const { password: _, ...doctorData } = doctor.toObject();
        res.status(200).json({ message: 'Sign-in successful', doctor: doctorData });
    }
    catch (error) {
        res.status(500).json({ error: 'Sign-in failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
});
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
        availability: result.data.availability,
        password: result.data.password
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
            doctorId: result.data.doctorId ? result.data.doctorId : ""
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
// Medicine prescription routes
app.post('/prescribe-medicine/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { medicineName, dose, doctorId, instructions } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        if (!medicineName || !dose) {
            return res.status(400).json({
                error: 'Medicine name and dose are required'
            });
        }
        const updatedUser = await prescribeMedicineToUser(userId, {
            medicineName,
            dose,
            doctorId,
            instructions
        });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            message: 'Medicine prescribed successfully',
            user: updatedUser,
            prescribedMedicine: {
                medicineName,
                dose,
                instructions,
                prescribedAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error prescribing medicine:', error);
        res.status(500).json({
            error: 'Failed to prescribe medicine',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.post('/prescribe-multiple-medicines/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { medicines } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                error: 'Medicines array is required and must not be empty'
            });
        }
        // Validate each medicine object
        for (const medicine of medicines) {
            if (!medicine.medicineName || !medicine.dose) {
                return res.status(400).json({
                    error: 'Each medicine must have medicineName and dose'
                });
            }
        }
        const updatedUser = await prescribeMultipleMedicines(userId, medicines);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            message: 'Medicines prescribed successfully',
            user: updatedUser,
            prescribedCount: medicines.length,
            prescribedMedicines: medicines
        });
    }
    catch (error) {
        console.error('Error prescribing medicines:', error);
        res.status(500).json({
            error: 'Failed to prescribe medicines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/get-prescribed-medicines/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const prescribedMedicines = await getUserPrescribedMedicines(userId);
        res.status(200).json({
            success: true,
            data: prescribedMedicines,
            count: prescribedMedicines.length
        });
    }
    catch (error) {
        console.error('Error getting prescribed medicines:', error);
        res.status(500).json({
            error: 'Failed to get prescribed medicines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/get-users-by-medicine/:medicineName', async (req, res) => {
    try {
        const { medicineName } = req.params;
        if (!medicineName) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        const users = await getUsersByMedicine(medicineName);
        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        console.error('Error getting users by medicine:', error);
        res.status(500).json({
            error: 'Failed to get users by medicine',
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
            doctorLicenseNumber: result.data.doctorLicenseNumber,
            patientContact: result.data.patientContact,
            patientName: result.data.patientName,
            reason: result.data.reason,
            consultationType: result.data.consultationType
        };
        // Add optional fields if provided
        if (result.data.preferredDate) {
            consultationData.preferredDate = result.data.preferredDate;
        }
        if (result.data.preferredTime) {
            consultationData.preferredTime = result.data.preferredTime;
        }
        if (result.data.additionalNotes) {
            consultationData.additionalNotes = result.data.additionalNotes;
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
// Helper route to get patient ID by contact number
app.post('/patientId', async (req, res) => {
    try {
        const { contactNumber } = req.body;
        if (!contactNumber) {
            return res.status(400).json({ error: 'Contact number is required' });
        }
        const patient = await User.findOne({ contact: contactNumber });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found with this contact number' });
        }
        res.status(200).json({
            patientId: patient._id,
            patientName: patient.name
        });
    }
    catch (error) {
        console.error('Error getting patient ID:', error);
        res.status(500).json({
            error: 'Failed to get patient ID',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Helper route to get doctor ID by license number
app.post('/getDoctorByLicense', async (req, res) => {
    try {
        const { licenseNumber } = req.body;
        if (!licenseNumber) {
            return res.status(400).json({ error: 'License number is required' });
        }
        const doctor = await Doctor.findOne({ licenseNumber });
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found with this license number' });
        }
        res.status(200).json({
            doctorId: doctor._id,
            doctorName: doctor.name,
            specialization: doctor.specialization
        });
    }
    catch (error) {
        console.error('Error getting doctor by license:', error);
        res.status(500).json({
            error: 'Failed to get doctor by license',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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
        const { doctorId, patientId, status, doctorNotes } = req.body;
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
            doctorNotes
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
// Route to get users by medicine name
app.get('/get-users-by-medicine/:medicineName', async (req, res) => {
    try {
        const { medicineName } = req.params;
        if (!medicineName) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        const users = await getUsersByMedicine(medicineName);
        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        console.error('Error getting users by medicine:', error);
        res.status(500).json({
            error: 'Failed to get users by medicine',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Pharmacy integration routes
app.get('/pharmacy/medicines/low-stock', async (req, res) => {
    try {
        const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
        const medicines = await PharmacyService.getLowStockMedicines(threshold);
        res.status(200).json({
            success: true,
            data: medicines,
            count: medicines.length,
            threshold
        });
    }
    catch (error) {
        console.error('Error fetching low stock medicines:', error);
        res.status(500).json({
            error: 'Failed to fetch low stock medicines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/pharmacy/medicines/expiring', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const medicines = await PharmacyService.getExpiringMedicines(days);
        res.status(200).json({
            success: true,
            data: medicines,
            count: medicines.length,
            expiringWithinDays: days
        });
    }
    catch (error) {
        console.error('Error fetching expiring medicines:', error);
        res.status(500).json({
            error: 'Failed to fetch expiring medicines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/pharmacy/medicines', async (req, res) => {
    try {
        const medicines = await PharmacyService.getAllMedicines();
        res.status(200).json({
            success: true,
            data: medicines,
            count: medicines.length
        });
    }
    catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({
            error: 'Failed to fetch medicines',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Notification routes
app.get('/notifications/low-stock-users', async (req, res) => {
    try {
        const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
        const notifications = await NotificationService.getUsersAffectedByLowStock(threshold);
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length,
            threshold
        });
    }
    catch (error) {
        console.error('Error getting low stock notifications:', error);
        res.status(500).json({
            error: 'Failed to get low stock notifications',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/notifications/expiring-users', async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const notifications = await NotificationService.getUsersAffectedByExpiringMedicines(days);
        res.status(200).json({
            success: true,
            data: notifications,
            count: notifications.length,
            expiringWithinDays: days
        });
    }
    catch (error) {
        console.error('Error getting expiring medicine notifications:', error);
        res.status(500).json({
            error: 'Failed to get expiring medicine notifications',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
app.get('/notifications/summary', async (req, res) => {
    try {
        const lowStockThreshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
        const expiringDays = req.query.days ? parseInt(req.query.days) : 30;
        const summary = await NotificationService.getNotificationSummary(lowStockThreshold, expiringDays);
        res.status(200).json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Error getting notification summary:', error);
        res.status(500).json({
            error: 'Failed to get notification summary',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.IO server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map