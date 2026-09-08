import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_config')
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  configKey: string;

  @Column({ type: 'text', nullable: true })
  configValue: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'group_name', length: 50, default: 'system' })
  group: string;

  @Column({ default: 0 })
  sort: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
