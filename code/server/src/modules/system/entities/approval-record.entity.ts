import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sys_approval_record')
export class ApprovalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  entityType: string;

  @Column({ type: 'int' })
  entityId: number;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 50, nullable: true })
  fromStatus: string;

  @Column({ length: 50, nullable: true })
  toStatus: string;

  @Column({ name: 'operator_id' })
  operatorId: number;

  @Column({ name: 'approver_id', nullable: true })
  approverId: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ length: 20, default: 'pending' })
  result: string;

  @CreateDateColumn()
  createdAt: Date;
}
