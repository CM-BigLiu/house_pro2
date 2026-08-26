import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RentalSet } from './rental-set.entity';

@Entity('house_rental_room')
export class RentalRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  roomNo: string;

  @Column({ length: 50, nullable: true })
  roomType: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  rentPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  listedPrice: number;

  @Column({ length: 20, default: 'vacant' })
  status: string;

  @Column({ type: 'date', nullable: true })
  leaseEnd: string;

  @Column({ length: 50, nullable: true })
  paymentMethod: string;

  @Column({ length: 50, nullable: true })
  leaseTerm: string;

  @Column({ length: 50, nullable: true })
  renovationProgress: string;

  @Column('simple-json', { nullable: true })
  cohabitantIds: number[];

  @Column({ length: 50, nullable: true })
  leaseDuration: string;

  @Column({ type: 'int', nullable: true })
  arrearDays: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  depositAmount: number;

  @Column({ length: 20, nullable: true })
  paymentStatus: string;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @ManyToOne(() => RentalSet, (set) => set.rooms)
  @JoinColumn({ name: 'set_id' })
  set: RentalSet;

  @Column({ name: 'set_id' })
  setId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
