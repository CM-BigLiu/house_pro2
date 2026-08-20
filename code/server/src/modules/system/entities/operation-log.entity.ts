import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sys_operation_log')
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ length: 50 })
  module: string;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 50 })
  objectType: string;

  @Column({ length: 100 })
  objectId: string;

  @Column('simple-json', { nullable: true })
  beforeSnapshot: any;

  @Column('simple-json', { nullable: true })
  afterSnapshot: any;

  @Column({ length: 50, nullable: true })
  ip: string;

  @Column({ length: 255, nullable: true })
  userAgent: string;

  @Column({ default: 'success' })
  result: string;

  @CreateDateColumn()
  createdAt: Date;
}
