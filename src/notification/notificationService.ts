import { PharmacyService } from '../pharmacy/pharmacyService.js';
import type { PharmacyMedicine } from '../pharmacy/pharmacyService.js';
import { getUsersByMedicine } from '../user/userservice.js';
import type { UserDocument } from '../user/usermodel.js';

export interface NotificationData {
  type: 'LOW_STOCK' | 'EXPIRING_SOON';
  medicine: PharmacyMedicine;
  affectedUsers: UserDocument[];
}

export interface NotificationSummary {
  lowStockNotifications: NotificationData[];
  expiringNotifications: NotificationData[];
  totalAffectedUsers: number;
  summary: {
    lowStockMedicines: number;
    expiringMedicines: number;
    uniqueUsersAffected: number;
  };
}

export class NotificationService {
  
  // Get users affected by low stock medicines
  static async getUsersAffectedByLowStock(threshold: number = 10): Promise<NotificationData[]> {
    try {
      // Fetch low stock medicines from pharmacy backend
      const lowStockMedicines = await PharmacyService.getLowStockMedicines(threshold);
      
      const notifications: NotificationData[] = [];
      
      // For each low stock medicine, find affected users
      for (const medicine of lowStockMedicines) {
        try {
          const affectedUsers = await getUsersByMedicine(medicine.Medicinename);
          
          if (affectedUsers.length > 0) {
            notifications.push({
              type: 'LOW_STOCK',
              medicine,
              affectedUsers
            });
          }
        } catch (error) {
          console.error(`Error fetching users for medicine ${medicine.Medicinename}:`, error);
          // Continue with other medicines even if one fails
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error getting users affected by low stock:', error);
      throw new Error(`Failed to get users affected by low stock: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get users affected by expiring medicines
  static async getUsersAffectedByExpiringMedicines(days: number = 30): Promise<NotificationData[]> {
    try {
      // Fetch expiring medicines from pharmacy backend
      const expiringMedicines = await PharmacyService.getExpiringMedicines(days);
      
      const notifications: NotificationData[] = [];
      
      // For each expiring medicine, find affected users
      for (const medicine of expiringMedicines) {
        try {
          const affectedUsers = await getUsersByMedicine(medicine.Medicinename);
          
          if (affectedUsers.length > 0) {
            notifications.push({
              type: 'EXPIRING_SOON',
              medicine,
              affectedUsers
            });
          }
        } catch (error) {
          console.error(`Error fetching users for medicine ${medicine.Medicinename}:`, error);
          // Continue with other medicines even if one fails
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error getting users affected by expiring medicines:', error);
      throw new Error(`Failed to get users affected by expiring medicines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get comprehensive notification summary
  static async getNotificationSummary(
    lowStockThreshold: number = 10, 
    expiringDays: number = 30
  ): Promise<NotificationSummary> {
    try {
      // Get both types of notifications
      const [lowStockNotifications, expiringNotifications] = await Promise.all([
        this.getUsersAffectedByLowStock(lowStockThreshold),
        this.getUsersAffectedByExpiringMedicines(expiringDays)
      ]);

      // Calculate unique users affected
      const allAffectedUserIds = new Set<string>();
      
      lowStockNotifications.forEach(notification => {
        notification.affectedUsers.forEach(user => {
          allAffectedUserIds.add((user._id as any).toString());
        });
      });
      
      expiringNotifications.forEach(notification => {
        notification.affectedUsers.forEach(user => {
          allAffectedUserIds.add((user._id as any).toString());
        });
      });

      const totalAffectedUsers = lowStockNotifications.reduce((total, notification) => 
        total + notification.affectedUsers.length, 0
      ) + expiringNotifications.reduce((total, notification) => 
        total + notification.affectedUsers.length, 0
      );

      return {
        lowStockNotifications,
        expiringNotifications,
        totalAffectedUsers,
        summary: {
          lowStockMedicines: lowStockNotifications.length,
          expiringMedicines: expiringNotifications.length,
          uniqueUsersAffected: allAffectedUserIds.size
        }
      };
    } catch (error) {
      console.error('Error getting notification summary:', error);
      throw new Error(`Failed to get notification summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get users for a specific medicine (helper method)
  static async getUsersForMedicine(medicineName: string): Promise<UserDocument[]> {
    try {
      return await getUsersByMedicine(medicineName);
    } catch (error) {
      console.error(`Error getting users for medicine ${medicineName}:`, error);
      throw new Error(`Failed to get users for medicine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
