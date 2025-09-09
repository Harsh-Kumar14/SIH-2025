import express from 'express';
import cors from 'cors';
import { addDoctor, getAllDoctors } from './doctorService.js';
import { DoctorSchemaZod } from './doctorModel.js';
const app = express();
const PORT = process.env.PORT || 8080;
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for simplicity; adjust as needed for security
}));
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.post('/add-doctor', async (req, res) => {
    // Logic to add a doctor
    const result = DoctorSchemaZod.safeParse(req.body);
    if (!result.success) {
        return res.status(400).send(result.error);
    }
    const doctorId = await addDoctor(result.data);
    res.status(201).send({ message: 'Doctor added successfully', doctorId });
});
app.get('/get-doctors', async (req, res) => {
    // Logic to get all doctors
    const doctors = await getAllDoctors();
    res.status(200).send(doctors);
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map