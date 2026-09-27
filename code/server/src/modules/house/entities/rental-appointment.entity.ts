import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RentalAppointmentAction } from './rental-appointment-action.entity';

@Entity('house_rental_appointment')
export class RentalAppointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'rental_set_id' })
  rentalSetId: number;

  @Column({ name: 'rental_room_id', nullable: true })
  rentalRoomId: number;

  @Column({ name: 'customer_id', type: 'integer', nullable: true })
  customerId: number | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 50, nullable: true })
  customerName: string | null;

  @Column({ name: 'source_appointment_id', type: 'integer', nullable: true })
  sourceAppointmentId: number | null;

  @Index('IDX_rental_appointment_contract_code', { unique: true })
  @Column({ name: 'contract_code', type: 'varchar', length: 50, nullable: true })
  contractCode: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt: Date | null;

  @OneToMany(() => RentalAppointmentAction, (action) => action.appointment)
  actions: RentalAppointmentAction[];

  @Column({ name: 'property_code', length: 50 })
  propertyCode: string;

  @Column({ name: 'property_name', length: 255 })
  propertyName: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'responsible_employee_id' })
  responsibleEmployeeId: number;

  @Column({ name: 'responsible_employee_name', length: 50 })
  responsibleEmployeeName: string;

  @Column({ name: 'store_id' })
  storeId: number;

  @Column({ name: 'group_id', nullable: true })
  groupId: number;

  @Column({ length: 30, default: 'scheduled' })
  status: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
