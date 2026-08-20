import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_accounting')
export class Accounting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 7 })
  period: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  revenue: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  receivable: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  payable: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualExpense: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  diff: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
