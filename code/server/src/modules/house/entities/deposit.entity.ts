import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('house_deposit')
export class Deposit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  contractCode: string;

  @Column({ length: 50, nullable: true })
  tenantName: string;

  @Column({ length: 200 })
  houseInfo: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  depositAmount: number;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'date', nullable: true })
  depositDate: string;

  @Column({ type: 'date', nullable: true })
  refundDate: string;

  @Column({ length: 255, nullable: true })
  deductReason: string;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
