import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Dict } from './dict.entity';

@Entity('sys_dict_item')
export class DictItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Dict, (dict) => dict.items)
  @JoinColumn({ name: 'dict_code', referencedColumnName: 'code' })
  dict: Dict;

  @Column({ name: 'dict_code', length: 50 })
  dictCode: string;

  @Column({ length: 50 })
  value: string;

  @Column({ length: 100 })
  label: string;

  @Column({ length: 50, nullable: true })
  parentValue: string;

  @Column({ nullable: true })
  sort: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  isBuiltin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
