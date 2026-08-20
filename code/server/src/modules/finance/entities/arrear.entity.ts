import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_arrear')
export class Arrear {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  bizType: string;

  @Column({ length: 20 })
  personType: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  mobile: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  remainAmount: number;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ length: 20, default: 'unpaid' })
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
