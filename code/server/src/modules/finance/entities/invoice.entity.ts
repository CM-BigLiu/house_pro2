import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_invoice')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  applySource: string;

  @Column({ length: 200 })
  buyerName: string;

  @Column({ length: 50, nullable: true })
  buyerTaxNo: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amountWithoutTax: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amountWithTax: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ length: 100, nullable: true })
  issuer: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'handler_id', nullable: true })
  handlerId: number;

  @Column({ type: 'date', nullable: true })
  handleTime: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
