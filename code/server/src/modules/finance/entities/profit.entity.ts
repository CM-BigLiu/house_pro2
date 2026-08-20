import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_profit')
export class Profit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 7 })
  period: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  income: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  margin: number;

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

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
