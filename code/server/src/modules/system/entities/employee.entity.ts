import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';
import { Department } from './department.entity';
import { Position } from './position.entity';
import { Role } from './role.entity';
import { Group } from './group.entity';

@Entity('sys_employee')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20, unique: true })
  mobile: string;

  @Column({ length: 255 })
  password: string;

  @Column({ default: 'normal' })
  status: string;

  @Column({ type: 'date', nullable: true })
  entryDate: string;

  @Column({ type: 'date', nullable: true })
  leaveDate: string;

  @Column({ length: 50, nullable: true })
  idCard: string;

  @Column({ length: 50, nullable: true })
  bankCard: string;

  @Column({ length: 100, nullable: true })
  bankName: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @ManyToMany(() => Store)
  @JoinTable({ name: 'sys_employee_store' })
  stores: Store[];

  @ManyToMany(() => Department)
  @JoinTable({ name: 'sys_employee_department' })
  departments: Department[];

  @ManyToMany(() => Position)
  @JoinTable({ name: 'sys_employee_position' })
  positions: Position[];

  @ManyToMany(() => Role)
  @JoinTable({ name: 'sys_employee_role' })
  roles: Role[];

  @ManyToMany(() => Group)
  @JoinTable({ name: 'sys_employee_group' })
  groups: Group[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
