import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_partner')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  share: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  invest: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  dividend: number;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
