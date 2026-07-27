import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Drone } from './drone.entity';

export enum MaintenanceType {
  ROUTINE_CHECK = 'ROUTINE_CHECK',
  BATTERY_REPLACEMENT = 'BATTERY_REPLACEMENT',
  MOTOR_REPAIR = 'MOTOR_REPAIR',
  FIRMWARE_UPDATE = 'FIRMWARE_UPDATE',
  FULL_OVERHAUL = 'FULL_OVERHAUL',
}

@Entity('maintenance_logs')
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
  })
  type!: MaintenanceType;

  @Column()
  technicianName!: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'date' })
  datePerformed!: string;

  @Column({ type: 'float' })
  flightHoursAtTime!: number;

  @ManyToOne(() => Drone, drone => drone.maintenanceLogs)
  @JoinColumn({ name: 'droneId' })
  drone!: Drone;

  @Column()
  droneId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}