import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_permission')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 50 })
  type: string; // menu / action / data

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ length: 50, nullable: true })
  module: string;

  @Column({ length: 255, nullable: true })
  path: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ nullable: true })
  sort: number;

  @Column({ default: 'enabled' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
