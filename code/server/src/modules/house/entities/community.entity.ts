import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('house_community')
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  alias: string;

  @Column()
  cityId: number;

  @Column({ nullable: true })
  districtId: number;

  @Column({ length: 100, nullable: true })
  district: string;

  @Column({ length: 100, nullable: true })
  businessCircle: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  propertyType: string;

  @Column({ type: 'text', nullable: true })
  supplement: string;

  @Column('simple-json', { nullable: true })
  photos: string[];

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ default: 0 })
  buildingCount: number;

  @Column({ default: 0 })
  unitCount: number;

  @Column({ default: 0 })
  roomCount: number;

  @Column({ default: 0 })
  currentSaleCount: number;

  @Column({ default: 0 })
  currentRentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
