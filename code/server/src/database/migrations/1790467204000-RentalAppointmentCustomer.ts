import { MigrationInterface, QueryRunner } from 'typeorm';

export class RentalAppointmentCustomer1790467204000 implements MigrationInterface {
  name = 'RentalAppointmentCustomer1790467204000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_rental_appointment" ADD COLUMN IF NOT EXISTS "customer_id" integer');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" ADD COLUMN IF NOT EXISTS "customer_name" varchar(50)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "house_rental_appointment" DROP COLUMN IF EXISTS "customer_name"');
    await queryRunner.query('ALTER TABLE "house_rental_appointment" DROP COLUMN IF EXISTS "customer_id"');
  }
}
