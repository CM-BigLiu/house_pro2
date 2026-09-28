import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** 独立收付项目：保留收款人、归属和实际结清金额，不合并进房东租金。 */
@Entity('fin_business_charge')
export class BusinessCharge {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ name: 'source_key', length: 150 }) sourceKey: string;
  @Column({ name: 'deal_id', type: 'integer', nullable: true }) dealId: number | null;
  @Column({ name: 'property_id' }) propertyId: number;
  @Column({ name: 'room_id', type: 'integer', nullable: true }) roomId: number | null;
  @Column({ name: 'property_name', length: 255 }) propertyName: string;
  @Column({ length: 10 }) direction: 'pay' | 'receive';
  @Column({ length: 30 }) category: string;
  @Column({ name: 'due_date', type: 'date' }) dueDate: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: number;
  @Column({ name: 'settled_amount', type: 'decimal', precision: 14, scale: 2, default: 0 }) settledAmount: number;
  @Column({ length: 20, default: 'pending' }) status: string;
  @Column({ length: 100, default: '' }) counterparty: string;
  @Column({ length: 500, default: '' }) remark: string;
  @Column({ name: 'employee_id' }) employeeId: number;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true }) groupId: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
