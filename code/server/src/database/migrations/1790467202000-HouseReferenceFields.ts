import { MigrationInterface, QueryRunner } from 'typeorm';

/** 补齐参考系统的租房、二手房与小区新增/编辑字段。 */
export class HouseReferenceFields1790467202000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE house_community
      ADD COLUMN IF NOT EXISTS "district" varchar(100),
      ADD COLUMN IF NOT EXISTS "propertyType" varchar(100),
      ADD COLUMN IF NOT EXISTS "supplement" text,
      ADD COLUMN IF NOT EXISTS "photos" text`);

    await queryRunner.query(`ALTER TABLE house_sale
      ADD COLUMN IF NOT EXISTS "isOnlyProperty" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "downPayment" numeric(14,2),
      ADD COLUMN IF NOT EXISTS "monthlyPayment" numeric(14,2),
      ADD COLUMN IF NOT EXISTS "loanAmount" numeric(14,2),
      ADD COLUMN IF NOT EXISTS "propertyRights" varchar(50),
      ADD COLUMN IF NOT EXISTS "propertyTerm" varchar(50),
      ADD COLUMN IF NOT EXISTS "certificateTerm" varchar(50),
      ADD COLUMN IF NOT EXISTS "acceptedPaymentMethods" varchar(100),
      ADD COLUMN IF NOT EXISTS "ownerMentality" text,
      ADD COLUMN IF NOT EXISTS "communityIntro" text,
      ADD COLUMN IF NOT EXISTS "nearbySchool" text,
      ADD COLUMN IF NOT EXISTS "taxDescription" text,
      ADD COLUMN IF NOT EXISTS "advantages" text,
      ADD COLUMN IF NOT EXISTS "ownerRemark" text,
      ADD COLUMN IF NOT EXISTS "emergencyContacts" text,
      ADD COLUMN IF NOT EXISTS "followUpContent" text`);

    await queryRunner.query(`ALTER TABLE house_rental_set
      ADD COLUMN IF NOT EXISTS "title" varchar(255),
      ADD COLUMN IF NOT EXISTS "communityIntro" text,
      ADD COLUMN IF NOT EXISTS "nearbySchool" text,
      ADD COLUMN IF NOT EXISTS "taxDescription" text,
      ADD COLUMN IF NOT EXISTS "advantages" text,
      ADD COLUMN IF NOT EXISTS "facilities" text,
      ADD COLUMN IF NOT EXISTS "landlordPhoneBackup" varchar(255),
      ADD COLUMN IF NOT EXISTS "landlordRemark" text,
      ADD COLUMN IF NOT EXISTS "emergencyContacts" text,
      ADD COLUMN IF NOT EXISTS "viewingTime" varchar(50),
      ADD COLUMN IF NOT EXISTS "viewingTimeAlt" varchar(50),
      ADD COLUMN IF NOT EXISTS "followUpContent" text,
      ADD COLUMN IF NOT EXISTS "images" text`);
  }

  async down(): Promise<void> {
    throw new Error('房源参考字段可能已有业务数据，请备份并人工确认后回退；禁止自动删列。');
  }
}
