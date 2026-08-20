import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('house_blacklist')
export class Blacklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20, nullable: true })
  mobile: string;

  @Column({ length: 50, nullable: true })
  idCard: string;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 255 })
  reason: string;

  @Column({ length: 100, nullable: true })
  source: string;

  @Column({ length: 30, default: 'active' })
  status: string;

  @Column({ name: 'store_id', nullable: true })
  storeId: number;

  @Column({ name: 'created_by' })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
