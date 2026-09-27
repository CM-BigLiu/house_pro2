import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentalAppointmentWorkflow1790467205000 implements MigrationInterface {
  name = 'RentalAppointmentWorkflow1790467205000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_rental_appointment" ADD COLUMN IF NOT EXISTS "source_appointment_id" integer');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" ADD COLUMN IF NOT EXISTS "contract_code" varchar(50)');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" ADD COLUMN IF NOT EXISTS "signed_at" timestamptz');
    await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rental_appointment_contract_code" ON "house_rental_appointment" ("contract_code")');
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "house_rental_appointment_action" (
      "id" SERIAL PRIMARY KEY,
      "appointment_id" integer NOT NULL REFERENCES "house_rental_appointment" ("id") ON DELETE CASCADE,
      "action" varchar(20) NOT NULL,
      "content" text NOT NULL,
      "employee_id" integer NOT NULL,
      "employee_name" varchar(50) NOT NULL,
      "details" jsonb,
      "createdAt" timestamp NOT NULL DEFAULT now()
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "house_rental_appointment_action"');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" DROP COLUMN IF EXISTS "signed_at"');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" DROP COLUMN IF EXISTS "contract_code"');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" DROP COLUMN IF EXISTS "source_appointment_id"');
  }
}
