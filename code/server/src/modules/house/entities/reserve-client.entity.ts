import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('house_reserve_client')
export class ReserveClient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 50 })
  clientName: string;

  @Column({ length: 20, nullable: true })
  clientMobile: string;

  @Column({ length: 100, nullable: true })
  desiredLocation: string;

  @Column({ length: 20 })
  demandType: string;

  @Column({ length: 50, nullable: true })
  desiredLayout: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaMax: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  priceMin: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  priceMax: number;

  @Column({ length: 50, nullable: true })
  sourceChannel: string;

  @Column({ length: 50, nullable: true })
  usage: string;

  @Column({ length: 20, nullable: true })
  urgency: string;

  @Column({ length: 20, default: 'public' })
  ownership: string;

  @Column({ length: 30, default: 'not_rented' })
  status: string;

  @Column({ length: 50, nullable: true })
  dataSource: string;

  @Column({ name: 'salesman_id', nullable: true })
  salesmanId: number;

  @Column({ name: 'follower_id', nullable: true })
  followerId: number;

  @Column({ type: 'date', nullable: true })
  followDate: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
