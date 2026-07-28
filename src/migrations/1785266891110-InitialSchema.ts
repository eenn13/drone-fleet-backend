import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1785266891110 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabloları oluştur
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "serialNumber" character varying NOT NULL UNIQUE,
        "model" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'AVAILABLE',
        "totalFlightHours" double precision NOT NULL DEFAULT 0,
        "lastMaintenanceDate" date NOT NULL,
        "nextMaintenanceDueDate" date NOT NULL,
        "registrationTimestamp" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drones" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "missions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "type" character varying NOT NULL,
        "pilotName" character varying NOT NULL,
        "siteLocation" character varying NOT NULL,
        "plannedStart" TIMESTAMP NOT NULL,
        "plannedEnd" TIMESTAMP NOT NULL,
        "actualStart" TIMESTAMP,
        "actualEnd" TIMESTAMP,
        "status" character varying NOT NULL DEFAULT 'PLANNED',
        "flightHoursLogged" double precision,
        "abortReason" character varying,
        "droneId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_missions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_missions_drone" FOREIGN KEY ("droneId") REFERENCES "drones"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "maintenance_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "technicianName" character varying NOT NULL,
        "notes" character varying,
        "datePerformed" date NOT NULL,
        "flightHoursAtTime" double precision NOT NULL,
        "droneId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenance_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_maintenance_logs_drone" FOREIGN KEY ("droneId") REFERENCES "drones"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "missions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drones"`);
  }
}