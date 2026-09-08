import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('house_checkout')
export class Checkout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  contractCode: string;

  @Column({ length: 50, nullable: true })
  tenantName: string;

  @Column({ length: 200 })
  houseInfo: string;

  @Column({ type: 'date', nullable: true })
  checkoutDate: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  settlementAmount: number;

  @Column({ length: 255, nullable: true })
  reason: string;

  @Column({ length: 255, nullable: true })
  remark: string;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
