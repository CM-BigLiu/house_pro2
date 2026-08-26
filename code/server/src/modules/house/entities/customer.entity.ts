import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedTransformer } from '../../../common/transformers/encrypted.transformer';

@Entity('house_customer')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  mobile: string;

  @Column({ length: 255, nullable: true, transformer: encryptedTransformer })
  idCard: string;

  @Column({ length: 20 })
  customerType: string;

  @Column({ length: 50, nullable: true })
  sourceChannel: string;

  @Column({ length: 100, nullable: true })
  relatedPropertyCode: string;

  @Column({ type: 'date', nullable: true })
  contractEndDate: string;

  @Column({ length: 30, default: 'active' })
  status: string;

  @Column({ default: false })
  isBlacklist: boolean;

  @Column({ name: 'salesman_id', nullable: true })
  salesmanId: number;

  @Column({ name: 'store_id', nullable: true })
  storeId: number;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
