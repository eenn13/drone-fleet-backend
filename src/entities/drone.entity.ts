import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  OneToMany 
} from 'typeorm';
import { Mission } from './mission.entity';
import { MaintenanceLog } from './maintenance-log.entity';

export enum DroneModel {
  PHANTOM_4 = 'PHANTOM_4',
  MATRICE_300 = 'MATRICE_300',
  MAVIC_3_ENTERPRISE = 'MAVIC_3_ENTERPRISE',
}

export enum DroneStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MISSION = 'IN_MISSION',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  serialNumber!: string;

  @Column({
    type: 'enum',
    enum: DroneModel,
    default: DroneModel.MATRICE_300,
  })
  model!: DroneModel;

  @Column({
    type: 'enum',
    enum: DroneStatus,
    default: DroneStatus.AVAILABLE,
  })
  status!: DroneStatus;

  @Column({ type: 'float', default: 0 })
  totalFlightHours!: number;

  @Column({ type: 'date' })
  lastMaintenanceDate!: string;

  @Column({ type: 'date' })
  nextMaintenanceDueDate!: string;

  @Column({ type: 'timestamp' })
  registrationTimestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Mission, mission => mission.assignedDrone)
  missions!: Mission[];

  @OneToMany(() => MaintenanceLog, log => log.drone)
  maintenanceLogs!: MaintenanceLog[];
}