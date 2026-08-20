import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Community } from './community.entity';
import { RentalRoom } from './rental-room.entity';

@Entity('house_rental_set')
export class RentalSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 20 })
  bizType: string; // entire / shared

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ name: 'community_id' })
  communityId: number;

  @Column({ length: 100 })
  address: string;

  @Column({ length: 50 })
  building: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ length: 50 })
  roomNo: string;

  @Column({ length: 50 })
  layout: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  buildingArea: number;

  @Column({ length: 20, nullable: true })
  decoration: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  landlordRent: number;

  @Column({ type: 'date', nullable: true })
  leaseStart: string;

  @Column({ type: 'date', nullable: true })
  leaseEnd: string;

  @Column({ length: 50, nullable: true })
  rentFreePeriod: string;

  @Column({ length: 30, default: 'active' })
  status: string;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'group_id', nullable: true })
  groupId: number;

  @Column({ name: 'landlord_id', nullable: true })
  landlordId: number;

  @Column({ name: 'salesman_id', nullable: true })
  salesmanId: number;

  @Column({ name: 'housekeeper_id', nullable: true })
  housekeeperId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @OneToMany(() => RentalRoom, (room) => room.set)
  rooms: RentalRoom[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
