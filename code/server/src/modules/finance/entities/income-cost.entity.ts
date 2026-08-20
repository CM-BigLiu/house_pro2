import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_income_cost')
export class IncomeCost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 7 })
  period: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  rentIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  depositIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  energyIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otherIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  rentCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  energyCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  decorateCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  laborCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  otherCost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalIncome: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
