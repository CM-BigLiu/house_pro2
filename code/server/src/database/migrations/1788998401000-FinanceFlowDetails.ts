import { MigrationInterface, QueryRunner } from 'typeorm';

export class FinanceFlowDetails1788998401000 implements MigrationInterface {
  name = 'FinanceFlowDetails1788998401000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "fin_flow" ADD COLUMN IF NOT EXISTS "paymentType" character varying(30)');
    await queryRunner.query('ALTER TABLE "fin_flow" ADD COLUMN IF NOT EXISTS "occurredOn" date');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "fin_flow" DROP COLUMN IF EXISTS "occurredOn"');
    await queryRunner.query('ALTER TABLE "fin_flow" DROP COLUMN IF EXISTS "paymentType"');
  }
}
