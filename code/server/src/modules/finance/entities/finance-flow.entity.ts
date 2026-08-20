import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_flow')
export class FinanceFlow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bill_id', nullable: true })
  billId: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ length: 10 })
  direction: string; // income / expense

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ default: false })
  isRed: boolean;

  @Column({ name: 'cashier_id', nullable: true })
  cashierId: number;

  @Column({ default: false })
  audited: boolean;

  @Column({ length: 100, nullable: true })
  bizType: string;

  @Column({ length: 255, nullable: true })
  remark: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
