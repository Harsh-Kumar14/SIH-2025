import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { addDoctor, getAllDoctors } from './doctorService.js';
import {DoctorSchemaZod} from './doctorModel.js';
import type {DoctorDocument}  from './doctorModel.js';
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

app.post('/add-doctor', async (req: Request, res: Response) => {
  // Logic to add a doctor
  const result = DoctorSchemaZod.safeParse(req.body);
  if (!result.success) {
    return res.status(400).send(result.error);
  }
  const response = {
    name: result.data.name,
    specialization: result.data.specialization,
    experience: result.data.experience,
    rating: result.data.rating,
    contact: result.data.contact,
    email: result.data.email,
    location: result.data.location,
    consultationFee: result.data.consultationFee,
    availability: result.data.availability
  }
  const doctorId = await addDoctor(response as DoctorDocument);
  res.status(201).send({ message: 'Doctor added successfully', doctorId });
});

app.get('/get-doctors', async (req: Request, res: Response) => {
  // Logic to get all doctors
  const doctors = await getAllDoctors();
  res.status(200).send(doctors);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});