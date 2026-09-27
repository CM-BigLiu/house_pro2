import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 已退休账单的历史只读映射，仅供存量付款日期和核算查询；无 CRUD 入口。 */
@Entity('fin_bill')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 20 })
  bizType: string;

  @Column({ length: 100, nullable: true })
  bizId: string;

  @Column({ length: 50 })
  billSource: string;

  @Column({ length: 100, nullable: true })
  payer: string;

  @Column({ length: 100, nullable: true })
  payee: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ length: 50, nullable: true })
  paymentCount: string;

  @Column({ length: 100, nullable: true })
  billPeriod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overdueFee: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ length: 20, default: 'pending_receive' })
  status: string;

  @Column({ name: 'salesman_id', nullable: true })
  salesmanId: number;

  @Column({ name: 'housekeeper_id', nullable: true })
  housekeeperId: number;

  @Column({ length: 100, nullable: true })
  roomCode: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
