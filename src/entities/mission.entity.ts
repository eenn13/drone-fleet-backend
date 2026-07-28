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

export enum MissionType {
  WIND_TURBINE_INSPECTION = 'WIND_TURBINE_INSPECTION',
  SOLAR_PANEL_SURVEY = 'SOLAR_PANEL_SURVEY',
  POWER_LINE_PATROL = 'POWER_LINE_PATROL',
}

export enum MissionStatus {
  PLANNED = 'PLANNED',
  PRE_FLIGHT_CHECK='PRE_FLIGHT_CHECK',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABORTED = 'ABORTED',
}

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: MissionType,
  })
  type!: MissionType;

  @Column()
  pilotName!: string;

  @Column()
  siteLocation!: string;

  @Column({ type: 'timestamp' })
  plannedStart!: Date;

  @Column({ type: 'timestamp' })
  plannedEnd!: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEnd?: Date;

  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.PLANNED,
  })
  status!: MissionStatus;

  @Column({ type: 'float', nullable: true })
  flightHoursLogged?: number;

  @Column({ nullable: true })
  abortReason?: string;

  @ManyToOne(() => Drone, drone => drone.missions)
  @JoinColumn({ name: 'droneId' })
  assignedDrone!: Drone;

  @Column()
  droneId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}