// Service to interact with Pharmacy Backend API
interface PharmacyMedicine {
  _id: string;
  Medicinename: string;
  currentstock: number;
  disease: string[];
  expirydate: string;
  price: number;
  supplier: string;
  lastrestock: string;
  users: string[];
  createdAt: string;
  updatedAt: string;
}

interface PharmacyApiResponse {
  success: boolean;
  data: PharmacyMedicine[];
  count: number;
  threshold?: number;
  expiringWithinDays?: number;
}

const PHARMACY_BACKEND_URL = process.env.PHARMACY_BACKEND_URL || 'http://localhost:8000';

export class PharmacyService {
  
  // Fetch low stock medicines from pharmacy backend
  static async getLowStockMedicines(threshold: number = 10): Promise<PharmacyMedicine[]> {
    try {
      const response = await fetch(
        `${PHARMACY_BACKEND_URL}/api/medicines/stock/low?threshold=${threshold}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PharmacyApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch low stock medicines from pharmacy');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching low stock medicines:', error);
      throw new Error(`Failed to fetch low stock medicines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch expiring medicines from pharmacy backend
  static async getExpiringMedicines(days: number = 30): Promise<PharmacyMedicine[]> {
    try {
      const response = await fetch(
        `${PHARMACY_BACKEND_URL}/api/medicines/expiring/soon?days=${days}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PharmacyApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch expiring medicines from pharmacy');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
      throw new Error(`Failed to fetch expiring medicines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch all medicines from pharmacy backend
  static async getAllMedicines(): Promise<PharmacyMedicine[]> {
    try {
      const response = await fetch(`${PHARMACY_BACKEND_URL}/api/medicines`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PharmacyApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch medicines from pharmacy');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching medicines:', error);
      throw new Error(`Failed to fetch medicines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch medicine by name from pharmacy backend
  static async getMedicineByName(medicineName: string): Promise<PharmacyMedicine | null> {
    try {
      const response = await fetch(`${PHARMACY_BACKEND_URL}/api/medicines/${encodeURIComponent(medicineName)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        return null;
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching medicine by name:', error);
      throw new Error(`Failed to fetch medicine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export type { PharmacyMedicine, PharmacyApiResponse };
