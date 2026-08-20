import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_payment_plan')
export class PaymentPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 20 })
  planType: string;

  @Column({ length: 50 })
  billingCategory: string;

  @Column({ length: 100 })
  reason: string;

  @Column({ length: 50, nullable: true })
  relatedPartyType: string;

  @Column({ length: 100, nullable: true })
  relatedPartyName: string;

  @Column({ type: 'int', default: 1 })
  totalPeriods: number;

  @Column({ length: 50, nullable: true })
  paymentInterval: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  completedAmount: number;

  @Column({ length: 20, default: 'pending' })
  auditStatus: string;

  @Column({ name: 'auditor_id', nullable: true })
  auditorId: number;

  @Column({ type: 'date', nullable: true })
  auditTime: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
