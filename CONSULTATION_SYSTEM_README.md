# Consultation Booking System

This system allows patients to book consultations with doctors and provides doctors with a queue management system.

## Database Models

### 1. User Model (`/user/userModel.ts`)
```typescript
{
  name: string,
  contact: string,
  age: number,
  gender: "male" | "female" | "other",
  doctorId: ObjectId, // Reference to doctor
  doctorName: string, // Auto-populated from doctor
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Consultation Model (`/consultation/consultationModel.ts`)
```typescript
{
  doctorId: ObjectId, // Reference to doctor (unique - one document per doctor)
  patients: [
    {
      patientId: ObjectId, // Reference to user
      patientName: string,
      patientContact: string,
      reason: string,
      consultationType: "general" | "follow-up" | "emergency" | "video-call",
      status: "waiting" | "in-progress" | "completed" | "cancelled",
      bookedAt: Date,
      scheduledTime?: Date,
      startedAt?: Date,
      completedAt?: Date,
      notes?: string
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Book Consultation
```http
POST /book-consultation
Content-Type: application/json

{
  "doctorId": "doctor_object_id",
  "patientId": "patient_object_id", 
  "patientName": "John Doe",
  "patientContact": "+1234567890",
  "reason": "Regular checkup",
  "consultationType": "general",
  "scheduledTime": "2025-09-10T10:00:00Z" // optional
}
```

### Get Doctor's Consultation Queue
```http
GET /doctor-consultations/{doctorId}

Response:
{
  "doctorId": "doctor_id",
  "patients": [...],
  "stats": {
    "waiting": 3,
    "inProgress": 1,
    "completed": 10,
    "total": 14
  }
}
```

### Update Consultation Status
```http
PUT /update-consultation-status
Content-Type: application/json

{
  "doctorId": "doctor_id",
  "patientId": "patient_id",
  "status": "in-progress", // waiting | in-progress | completed | cancelled
  "notes": "Patient is doing well" // optional
}
```

### Get Patient's Consultation History
```http
GET /patient-consultation-history/{patientId}
```

### Get Consultations by Status
```http
GET /consultations-by-status/{doctorId}/{status}
// status: waiting | in-progress | completed | cancelled
```

### Cancel Consultation
```http
DELETE /cancel-consultation/{doctorId}/{patientId}
```

### Get Next Patient in Queue
```http
GET /next-patient/{doctorId}
```

### Get Consultation Statistics
```http
GET /consultation-stats/{doctorId} // for specific doctor
GET /consultation-stats // for all doctors
```

## Frontend Integration Example

### 1. Book Consultation Button (Patient Side)
```javascript
// In DoctorsSection component
const handleBookConsultation = async (doctor) => {
  try {
    const bookingData = {
      doctorId: doctor._id,
      patientId: currentPatient.id,
      patientName: currentPatient.name,
      patientContact: currentPatient.contact,
      reason: consultationReason,
      consultationType: "general"
    };

    const response = await fetch('http://localhost:8080/book-consultation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    if (response.ok) {
      alert('Consultation booked successfully!');
      // Optionally redirect or update UI
    }
  } catch (error) {
    console.error('Error booking consultation:', error);
    alert('Failed to book consultation');
  }
};
```

### 2. Doctor's Queue Management (Doctor Side)
```javascript
// In PatientQueue component
const fetchConsultations = async () => {
  try {
    const response = await fetch(`http://localhost:8080/doctor-consultations/${doctorId}`);
    const data = await response.json();
    
    setWaitingPatients(data.patients.filter(p => p.status === 'waiting'));
    setInProgressPatients(data.patients.filter(p => p.status === 'in-progress'));
    setCompletedPatients(data.patients.filter(p => p.status === 'completed'));
    setStats(data.stats);
  } catch (error) {
    console.error('Error fetching consultations:', error);
  }
};

const updatePatientStatus = async (patientId, newStatus) => {
  try {
    const response = await fetch('http://localhost:8080/update-consultation-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorId: doctorId,
        patientId: patientId,
        status: newStatus
      })
    });

    if (response.ok) {
      fetchConsultations(); // Refresh the queue
    }
  } catch (error) {
    console.error('Error updating status:', error);
  }
};
```

## Usage Flow

1. **Patient Books Consultation**:
   - Patient clicks "Book Consultation" button on doctor's profile
   - System creates/updates consultation document for that doctor
   - Patient is added to doctor's queue with "waiting" status

2. **Doctor Views Queue**:
   - Doctor opens their dashboard
   - System displays patients grouped by status (waiting, in-progress, completed)
   - Shows statistics and queue length

3. **Doctor Manages Queue**:
   - Doctor can start consultation (waiting → in-progress)
   - Doctor can complete consultation (in-progress → completed)
   - Doctor can add notes during/after consultation

4. **Real-time Updates** (Optional Enhancement):
   - Use WebSocket/Socket.IO to notify doctors of new bookings
   - Update patient status in real-time
   - Send notifications to patients about status changes

## Database Queries Examples

```javascript
// Get all waiting patients for a doctor
const waitingPatients = await Consultation.findOne({ doctorId })
  .then(doc => doc?.patients.filter(p => p.status === 'waiting') || []);

// Get patient's consultation history
const history = await Consultation.find({ 'patients.patientId': patientId })
  .populate('doctorId', 'name specialization');

// Get next patient in queue (oldest waiting)
const nextPatient = await Consultation.findOne({ doctorId })
  .then(doc => {
    const waiting = doc?.patients
      .filter(p => p.status === 'waiting')
      .sort((a, b) => a.bookedAt - b.bookedAt);
    return waiting?.[0] || null;
  });
```

## Key Features

1. ✅ **Queue Management**: Doctors can see and manage their patient queue
2. ✅ **Status Tracking**: Track consultation progress (waiting → in-progress → completed)
3. ✅ **History**: Patients can view their consultation history
4. ✅ **Statistics**: Dashboard with consultation stats
5. ✅ **Flexible Booking**: Support for different consultation types
6. ✅ **Notes System**: Doctors can add notes during/after consultations
7. ✅ **Cancellation**: Both parties can cancel consultations

This system provides a complete foundation for managing patient-doctor consultations with a proper queue system!
