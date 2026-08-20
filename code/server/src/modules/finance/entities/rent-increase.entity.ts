import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fin_rent_increase')
export class RentIncrease {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'room_id', nullable: true })
  roomId: number;

  @Column({ length: 100, nullable: true })
  roomCode: string;

  @Column({ type: 'int', default: 1 })
  year: number;

  @Column({ type: 'int', default: 1 })
  month: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lastRent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentRent: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  increaseAmount: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  increaseRate: number;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
