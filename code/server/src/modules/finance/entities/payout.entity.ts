import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_payout')
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: true })
  batchNo: string;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 100 })
  accountName: string;

  @Column({ length: 100, nullable: true })
  bankCardNo: string;

  @Column({ length: 100 })
  bankName: string;

  @Column({ length: 10 })
  cardType: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  payoutAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  serviceFeeBorneByPayee: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  payableAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  actualAmount: number;

  @Column({ length: 100, nullable: true })
  merchantNo: string;

  @Column({ length: 20, default: 'downloaded' })
  status: string;

  @Column({ name: 'operator_id' })
  operatorId: number;

  @Column({ type: 'date' })
  operateDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
