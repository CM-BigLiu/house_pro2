import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('house_follow_up')
export class FollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'biz_type', length: 50 })
  bizType: string;

  @Column({ name: 'biz_id' })
  bizId: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ length: 50 })
  employeeName: string;

  @Column({ length: 20 })
  followType: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 30, default: 'completed' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
