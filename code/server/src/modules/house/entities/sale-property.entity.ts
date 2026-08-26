import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedTransformer } from '../../../common/transformers/encrypted.transformer';
import { Community } from './community.entity';
import { Employee } from '../../system/entities/employee.entity';

@Entity('house_sale')
export class SaleProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 20 })
  propertyType: string;

  @ManyToOne(() => Community)
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ name: 'community_id' })
  communityId: number;

  @Column({ length: 50 })
  building: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ length: 50 })
  floor: string;

  @Column({ length: 50 })
  roomNo: string;

  @Column({ type: 'int' })
  layoutRooms: number;

  @Column({ type: 'int' })
  layoutHalls: number;

  @Column({ type: 'int' })
  layoutBathrooms: number;

  @Column({ type: 'int' })
  layoutBalconies: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  buildingArea: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  interiorArea: number;

  @Column({ type: 'int', nullable: true })
  totalFloor: number;

  @Column({ length: 20, nullable: true })
  propertyStatus: string;

  @Column({ default: false })
  isRentSaleCoexist: boolean;

  @Column({ default: false })
  isFusion: boolean;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ length: 100, nullable: true })
  govVerifyCode: string;

  @Column({ length: 20, nullable: true })
  govVerifyStatus: string;

  @Column({ type: 'date', nullable: true })
  quickSaleStart: string;

  @Column({ type: 'date', nullable: true })
  quickSaleEnd: string;

  @Column({ type: 'date', nullable: true })
  publishedAt: string;

  @Column({ type: 'date', nullable: true })
  offShelfAt: string;

  @Column({ type: 'date', nullable: true })
  bargainAt: string;

  @Column({ type: 'date', nullable: true })
  verifiedAt: string;

  @Column({ type: 'date', nullable: true })
  lastFollowAt: string;

  @Column({ type: 'int', nullable: true })
  daysWithoutFollow: number;

  @Column({ length: 50, nullable: true })
  viewingTime: string;

  @Column({ length: 50, nullable: true })
  viewingTimeAlt: string;

  @Column({ length: 255, nullable: true })
  vrUrl: string;

  @Column({ length: 255, nullable: true })
  videoUrl: string;

  @Column({ length: 20 })
  orientation: string;

  @Column({ length: 20 })
  decoration: string;

  @Column({ length: 10 })
  elevator: string;

  @Column({ type: 'int', nullable: true })
  buildYear: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  salePrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  floorPrice: number;

  @Column({ length: 20, nullable: true })
  taxType: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  debt: number;

  @Column({ length: 20, nullable: true })
  certificateType: string;

  @Column({ length: 50 })
  sourceChannel: string;

  @Column({ length: 255 })
  title: string;

  @Column('simple-json', { nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50 })
  ownerName: string;

  @Column({ length: 255, transformer: encryptedTransformer })
  ownerPhone: string;

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  ownerPhoneBackup: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'maintainer_id' })
  maintainer: Employee;

  @Column({ name: 'maintainer_id', nullable: true })
  maintainerId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ length: 30, default: 'pre_publish' })
  status: string;

  @Column({ type: 'int', nullable: true })
  qualityScore: number;

  @Column({ length: 10, nullable: true })
  qualityLevel: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  isCitywideSale: boolean;

  @Column({ type: 'simple-json', nullable: true })
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
