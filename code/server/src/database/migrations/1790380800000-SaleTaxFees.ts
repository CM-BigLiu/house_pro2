import { MigrationInterface, QueryRunner } from 'typeorm';

export class SaleTaxFees1790380800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // 保留旧 taxType，新增可存储多税种及各自金额的明细。
    await queryRunner.query('ALTER TABLE house_sale ADD COLUMN IF NOT EXISTS "taxFees" text');
  }

  async down(): Promise<void> {
    throw new Error('税费明细可能已有业务数据，请备份并人工确认后回退。');
  }
}
