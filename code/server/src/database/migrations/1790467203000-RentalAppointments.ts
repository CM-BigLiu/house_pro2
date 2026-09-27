import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentalAppointments1790467203000 implements MigrationInterface {
  name = 'RentalAppointments1790467203000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "house_rental_appointment" (
      "id" SERIAL NOT NULL,
      "rental_set_id" integer NOT NULL,
      "rental_room_id" integer,
      "property_code" varchar(50) NOT NULL,
      "property_name" varchar(255) NOT NULL,
      "scheduled_at" timestamptz NOT NULL,
      "responsible_employee_id" integer NOT NULL,
      "responsible_employee_name" varchar(50) NOT NULL,
      "store_id" integer NOT NULL,
      "group_id" integer,
      "status" varchar(30) NOT NULL DEFAULT 'scheduled',
      "remark" text,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now(),
      CONSTRAINT "PK_house_rental_appointment" PRIMARY KEY ("id")
    )`);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_rental_appointment_employee" ON "house_rental_appointment" ("responsible_employee_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_rental_appointment_store" ON "house_rental_appointment" ("store_id")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_rental_appointment_scheduled_at" ON "house_rental_appointment" ("scheduled_at")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "house_rental_appointment"');
  }
}
