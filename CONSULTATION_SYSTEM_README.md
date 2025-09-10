# Updated Consultation Booking System

This system now supports booking consultations using doctor license numbers and patient contact numbers for lookup.

## Updated API Endpoints

### Book Consultation (Updated)
```http
POST /book-consultation
Content-Type: application/json

{
  "doctorLicenseNumber": "DOC123456", // Doctor's license number
  "patientContact": "+1234567890", // Patient's contact number
  "patientName": "John Doe",
  "reason": "Heart palpitations and chest discomfort",
  "consultationType": "video-call",
  "preferredDate": "2025-09-15", // Optional - patient's preferred date
  "preferredTime": "10:00 AM", // Optional - patient's preferred time slot
  "additionalNotes": "I have been experiencing symptoms for the past week" // Optional
}
```

### Helper Endpoints

#### Get Patient ID by Contact
```http
POST /patientId
Content-Type: application/json

{
  "contactNumber": "+1234567890"
}

Response:
{
  "patientId": "patient_object_id",
  "patientName": "John Doe"
}
```

#### Get Doctor by License Number
```http
POST /getDoctorByLicense
Content-Type: application/json

{
  "licenseNumber": "DOC123456"
}

Response:
{
  "doctorId": "doctor_object_id",
  "doctorName": "Dr. Sarah Johnson",
  "specialization": "Cardiology"
}
```

## Updated Data Models

### Updated Consultation Schema
```typescript
{
  doctorLicenseNumber: string, // Used to find doctor
  patientContact: string, // Used to find patient
  patientName: string,
  reason: string, // Symptoms/reason for consultation
  consultationType: "general" | "follow-up" | "emergency" | "video-call",
  preferredDate?: string, // Patient's preferred date
  preferredTime?: string, // Patient's preferred time slot  
  additionalNotes?: string, // Patient's notes
  status: "waiting" | "in-progress" | "completed" | "cancelled"
}
```

### Patient in Consultation (Updated)
```typescript
{
  patientId: ObjectId,
  patientName: string,
  patientContact: string,
  reason: string,
  consultationType: string,
  status: string,
  bookedAt: Date,
  preferredDate?: Date, // When patient wants appointment
  preferredTime?: string, // Patient's preferred time slot
  scheduledTime?: Date, // Actual scheduled time (set by doctor)
  startedAt?: Date,
  completedAt?: Date,
  additionalNotes?: string, // Patient's notes
  doctorNotes?: string // Doctor's notes
}
```

## Frontend Integration Example

### Updated Book Consultation Form
```javascript
const handleBookConsultation = async (formData) => {
  try {
    const bookingData = {
      doctorLicenseNumber: doctor.licenseNumber, // From doctor card
      patientContact: currentPatient.contact, // From logged-in patient
      patientName: currentPatient.name,
      reason: formData.symptoms, // From form
      consultationType: formData.consultationType, // "video-call", "general", etc.
      preferredDate: formData.preferredDate, // From date picker
      preferredTime: formData.preferredTime, // From time selector
      additionalNotes: formData.additionalNotes // From text area
    };

    const response = await fetch('http://localhost:8080/book-consultation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });

    if (response.ok) {
      const result = await response.json();
      alert('Consultation booked successfully!');
      console.log('Booking details:', result.consultation);
    } else {
      const error = await response.json();
      alert(`Failed to book consultation: ${error.message}`);
    }
  } catch (error) {
    console.error('Error booking consultation:', error);
    alert('Failed to book consultation');
  }
};
```

### Patient Login Integration
```javascript
const loginPatient = async (contactNumber, password) => {
  try {
    // First authenticate patient
    const authResponse = await authenticatePatient(contactNumber, password);
    
    if (authResponse.success) {
      // Get patient ID for future bookings
      const patientResponse = await fetch('http://localhost:8080/patientId', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactNumber })
      });

      const patientData = await patientResponse.json();
      
      // Store patient info in state/localStorage
      setCurrentPatient({
        id: patientData.patientId,
        name: patientData.patientName,
        contact: contactNumber
      });
      
      localStorage.setItem('currentPatient', JSON.stringify(patientData));
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

### Form Component Example
```javascript
const BookAppointmentForm = ({ doctor, onClose }) => {
  const [formData, setFormData] = useState({
    symptoms: '',
    consultationType: 'general',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: ''
  });

  const currentPatient = JSON.parse(localStorage.getItem('currentPatient'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentPatient) {
      alert('Please login first');
      return;
    }

    await handleBookConsultation({
      doctorLicenseNumber: doctor.licenseNumber,
      patientContact: currentPatient.contact,
      patientName: currentPatient.name,
      reason: formData.symptoms,
      consultationType: formData.consultationType,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      additionalNotes: formData.additionalNotes
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Describe your symptoms or reason for consultation *</label>
        <textarea
          value={formData.symptoms}
          onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
          placeholder="Please describe your symptoms or the reason you'd like to consult with the doctor..."
          required
        />
      </div>

      <div>
        <label>Type of Consultation *</label>
        <select
          value={formData.consultationType}
          onChange={(e) => setFormData({...formData, consultationType: e.target.value})}
        >
          <option value="general">General Consultation</option>
          <option value="video-call">Video Consultation</option>
          <option value="follow-up">Follow-up</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      <div>
        <label>Preferred Date</label>
        <input
          type="date"
          value={formData.preferredDate}
          onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
        />
      </div>

      <div>
        <label>Preferred Time</label>
        <select
          value={formData.preferredTime}
          onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
        >
          <option value="">Select a time slot</option>
          <option value="09:00 AM">09:00 AM</option>
          <option value="10:00 AM">10:00 AM</option>
          <option value="11:00 AM">11:00 AM</option>
          <option value="02:00 PM">02:00 PM</option>
          <option value="03:00 PM">03:00 PM</option>
          <option value="04:00 PM">04:00 PM</option>
        </select>
      </div>

      <div>
        <label>Additional Notes (Optional)</label>
        <textarea
          value={formData.additionalNotes}
          onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
          placeholder="Any additional information you'd like the doctor to know..."
        />
      </div>

      <button type="submit">Book Consultation</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
  );
};
```

## Key Benefits of Updated System

1. ✅ **Simplified Lookup**: Use license numbers and contact numbers instead of IDs
2. ✅ **Patient Preferences**: Capture preferred date/time from booking form
3. ✅ **Detailed Notes**: Separate patient notes and doctor notes
4. ✅ **Flexible Consultation Types**: Support for video calls, emergency, etc.
5. ✅ **Better UX**: Form matches the screenshot provided
6. ✅ **Automatic ID Resolution**: Backend handles ID lookup automatically

The system now perfectly matches your frontend form and provides a seamless booking experience!
