import { Injectable } from '@nestjs/common';

@Injectable()
export class MaintenanceCalculatorService {
  private readonly MAINTENANCE_INTERVAL_HOURS = 50;
  private readonly MAINTENANCE_INTERVAL_DAYS = 90;

  calculateNextMaintenanceDate(
    lastMaintenanceDate: Date,
    flightHoursSinceLastMaintenance: number,
    averageDailyFlightHours: number = 2,
  ): Date {
    const lastDate = new Date(lastMaintenanceDate);
    
    // 90 gün sonrası
    const dateBased = new Date(lastDate);
    dateBased.setDate(dateBased.getDate() + this.MAINTENANCE_INTERVAL_DAYS);
    
    // 50 saat bazlı
    const remainingHours = this.MAINTENANCE_INTERVAL_HOURS - flightHoursSinceLastMaintenance;
    const daysFromFlightHours = Math.ceil(remainingHours / averageDailyFlightHours);
    
    const hoursBased = new Date(lastDate);
    hoursBased.setDate(hoursBased.getDate() + daysFromFlightHours);
    
    // Hangisi önce gelirse onu döndür
    return dateBased < hoursBased ? dateBased : hoursBased;
  }

  isMaintenanceRequired(
    lastMaintenanceDate: Date,
    flightHoursSinceLastMaintenance: number,
  ): boolean {
    const nextMaintenanceDate = this.calculateNextMaintenanceDate(
      lastMaintenanceDate,
      flightHoursSinceLastMaintenance,
    );
    return new Date() >= nextMaintenanceDate;
  }

  getMaintenanceStatus(
    lastMaintenanceDate: Date,
    flightHoursSinceLastMaintenance: number,
  ): {
    isRequired: boolean;
    daysUntil: number;
    hoursUntil: number;
    status: 'good' | 'warning' | 'overdue';
  } {
    const daysUntil = Math.ceil(
      (new Date(this.calculateNextMaintenanceDate(lastMaintenanceDate, flightHoursSinceLastMaintenance)).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const hoursUntil = this.MAINTENANCE_INTERVAL_HOURS - flightHoursSinceLastMaintenance;
    const isRequired = this.isMaintenanceRequired(lastMaintenanceDate, flightHoursSinceLastMaintenance);

    let status: 'good' | 'warning' | 'overdue' = 'good';
    if (isRequired) {
      status = 'overdue';
    } else if (daysUntil <= 7 || hoursUntil <= 5) {
      status = 'warning';
    }

    return { isRequired, daysUntil, hoursUntil, status };
  }
}