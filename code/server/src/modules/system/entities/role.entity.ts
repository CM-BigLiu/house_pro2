import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity('sys_role')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 20, default: 'self' })
  dataScope: string;

  @Column('simple-json', { nullable: true })
  assignedStores: number[];

  @Column('text', { nullable: true })
  customScope: string;

  @Column({ default: false })
  isBuiltin: boolean;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Role;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number;

  @Column({ default: 'enabled' })
  status: string;

  @ManyToMany(() => Permission)
  @JoinTable({ name: 'sys_role_permission' })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
