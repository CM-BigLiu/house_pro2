import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_performance')
export class Performance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ length: 50 })
  employeeName: string;

  @Column({ length: 7 })
  period: string;

  @Column({ type: 'int', default: 0 })
  newHouseCount: number;

  @Column({ type: 'int', default: 0 })
  newCustomerCount: number;

  @Column({ type: 'int', default: 0 })
  showingCount: number;

  @Column({ type: 'int', default: 0 })
  dealCount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalPerformance: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  distributed: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  retained: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  transferred: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  commission: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
