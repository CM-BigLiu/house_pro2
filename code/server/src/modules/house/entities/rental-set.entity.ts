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
import { encryptedTransformer } from '../../../common/transformers/encrypted.transformer';

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

  @Column({ length: 50, nullable: true })
  floor: string;

  @Column({ type: 'int', nullable: true })
  totalFloor: number;

  @Column({ length: 50 })
  roomNo: string;

  @Column({ length: 50 })
  layout: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  buildingArea: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  interiorArea: number;

  @Column({ length: 100, nullable: true })
  businessCircle: string;

  @Column({ length: 100, nullable: true })
  district: string;

  @Column({ length: 30, nullable: true })
  propertyType: string;

  @Column({ length: 20, nullable: true })
  orientation: string;

  @Column({ length: 10, nullable: true })
  elevator: string;

  @Column({ length: 20, nullable: true })
  decoration: string;

  @Column({ length: 50, nullable: true })
  sourceChannel: string;

  @Column('simple-json', { nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  communityIntro: string;

  @Column({ type: 'text', nullable: true })
  nearbySchool: string;

  @Column({ type: 'text', nullable: true })
  taxDescription: string;

  @Column({ type: 'text', nullable: true })
  advantages: string;

  @Column('simple-json', { nullable: true })
  facilities: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  landlordRent: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  landlordDeposit: number;

  @Column({ length: 100, nullable: true })
  landlordName: string;

  @Column({ length: 30, nullable: true })
  landlordPhone: string;

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  landlordPhoneBackup: string;

  @Column({ type: 'text', nullable: true })
  landlordRemark: string;

  @Column('simple-json', { nullable: true })
  emergencyContacts: { name: string; phone: string; relation?: string }[];

  @Column({ length: 50, nullable: true })
  viewingTime: string;

  @Column({ length: 50, nullable: true })
  viewingTimeAlt: string;

  @Column({ type: 'text', nullable: true })
  followUpContent: string;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  landlordIdCard: string;

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  landlordBankCard: string;

  @Column({ length: 100, nullable: true })
  landlordBankName: string;

  @Column({ length: 100, nullable: true })
  tenantName: string;

  @Column({ length: 30, nullable: true })
  tenantPhone: string;

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  tenantIdCard: string;

  @Column({ length: 50, nullable: true })
  tenantPaymentMethod: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  deposit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, default: 0 })
  rent: number;

  @Column({ type: 'date', nullable: true })
  leaseStart: string;

  @Column({ type: 'date', nullable: true })
  leaseEnd: string;

  @Column({ length: 50, nullable: true })
  landlordPaymentMethod: string;

  @Column({ length: 50, nullable: true })
  leaseTerm: string;

  @Column({ length: 50, nullable: true })
  rentFreePeriod: string;

  @Column({ name: 'free_rent_ranges', type: 'jsonb', default: [] })
  freeRentRanges: { start: string; end: string }[];

  @Column({ length: 30, default: 'active' })
  status: string;

  @Column({ length: 30, default: 'normal' })
  operationStatus: string;

  @Column({ length: 30, nullable: true })
  businessStatus: string;

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

  @Column({ name: 'is_managed', default: false })
  isManaged: boolean;

  @Column({ type: 'date', nullable: true })
  tenantLeaseStart: string;

  @Column({ type: 'date', nullable: true })
  tenantLeaseEnd: string;

  @OneToMany(() => RentalRoom, (room) => room.set)
  rooms: RentalRoom[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
