import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ContractDetails, contractDetailsTransformer } from './contract-details';

/** 成交合同快照；金额为合同约定，不代表实收或退款。历史记录不随客户编辑而变化。 */
@Entity('house_deal')
export class Deal {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true })
  @Column({ name: 'contract_code', length: 50 }) contractCode: string;
  @Column({ name: 'biz_type', length: 10 }) bizType: string;
  @Column({ name: 'workflow_type', length: 20, default: 'regular' }) workflowType: string;
  @Column({ type: 'text', nullable: true, transformer: contractDetailsTransformer }) details: ContractDetails;
  @Column({ name: 'customer_id', type: 'integer', nullable: true }) customerId: number | null;
  @Column({ name: 'customer_name', length: 100 }) customerName: string;
  @Column({ name: 'customer_phone', length: 20, nullable: true }) customerPhone: string;
  @Column({ name: 'property_id' }) propertyId: number;
  @Column({ name: 'room_id', type: 'integer', nullable: true }) roomId: number | null;
  @Column({ name: 'property_code', length: 50 }) propertyCode: string;
  @Column({ name: 'property_name', length: 255 }) propertyName: string;
  @Index({ unique: true })
  @Column({ name: 'rental_appointment_id', type: 'integer', nullable: true }) rentalAppointmentId: number | null;
  @Index({ unique: true })
  @Column({ name: 'sale_appointment_id', type: 'integer', nullable: true }) saleAppointmentId: number | null;
  @Column({ name: 'signed_at', type: 'timestamptz' }) signedAt: Date;
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true }) amount: number | null;
  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true }) deposit: number | null;
  @Column({ name: 'lease_start', type: 'date', nullable: true }) leaseStart: string;
  @Column({ name: 'lease_end', type: 'date', nullable: true }) leaseEnd: string;
  @Column({ name: 'payment_method', length: 50, nullable: true }) paymentMethod: string;
  @Column({ name: 'responsible_employee_id' }) responsibleEmployeeId: number;
  @Column({ name: 'responsible_employee_name', length: 50 }) responsibleEmployeeName: string;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true }) groupId: number;
  @Column({ length: 30, default: 'active' }) status: string;
  @Column({ name: 'checkout_id', type: 'integer', nullable: true }) checkoutId: number;
  @Column({ name: 'previous_property_status', length: 30, nullable: true }) previousPropertyStatus: string;
  @Column({ name: 'terminated_on', type: 'date', nullable: true }) terminatedOn: string;
  @Column({ name: 'termination_reason', length: 500, nullable: true }) terminationReason: string;
  @Column({ length: 500, nullable: true }) remark: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
