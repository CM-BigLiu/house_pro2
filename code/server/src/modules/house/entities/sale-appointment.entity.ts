import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('house_sale_appointment')
export class SaleAppointment {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'sale_property_id' }) salePropertyId: number;
  @Column({ name: 'customer_id' }) customerId: number;
  @Column({ name: 'customer_name', length: 100 }) customerName: string;
  @Column({ name: 'property_code', length: 50 }) propertyCode: string;
  @Column({ name: 'property_name', length: 255 }) propertyName: string;
  @Column({ name: 'scheduled_at', type: 'timestamptz' }) scheduledAt: Date;
  @Column({ name: 'responsible_employee_id' }) responsibleEmployeeId: number;
  @Column({ name: 'responsible_employee_name', length: 50 }) responsibleEmployeeName: string;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true }) groupId: number;
  @Column({ length: 30, default: 'scheduled' }) status: string;
  @Column({ length: 500, nullable: true }) remark: string;
  @CreateDateColumn() createdAt: Date;
}
