import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Community } from './community.entity';

@Entity('house_reserve')
export class ReserveProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'group_id', nullable: true })
  groupId: number;

  @ManyToOne(() => Community, { nullable: true })
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ name: 'community_id', nullable: true })
  communityId: number;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 100 })
  roomNo: string;

  @Column({ length: 50 })
  layout: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  buildingArea: number;

  @Column({ length: 20, nullable: true })
  decoration: string;

  @Column({ length: 50 })
  ownerName: string;

  @Column({ length: 20, nullable: true })
  ownerPhone: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  ownerQuote: number;

  @Column({ length: 50 })
  sourceChannel: string;

  @Column({ length: 20, nullable: true })
  keyStatus: string;

  @Column({ length: 20, default: 'public' })
  diskType: string;

  @Column({ length: 30, default: 'not_rented' })
  status: string;

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
