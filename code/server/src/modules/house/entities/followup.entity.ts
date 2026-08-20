import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('house_followup')
export class FollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30 })
  bizType: string;

  @Column({ length: 100 })
  bizId: string;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 30, nullable: true })
  followType: string;

  @Column({ type: 'date', nullable: true })
  nextFollowDate: string;

  @CreateDateColumn()
  createdAt: Date;
}
