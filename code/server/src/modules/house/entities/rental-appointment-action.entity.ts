import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RentalAppointment } from './rental-appointment.entity';

@Entity('house_rental_appointment_action')
export class RentalAppointmentAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'appointment_id' })
  appointmentId: number;

  @ManyToOne(() => RentalAppointment, (appointment) => appointment.actions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: RentalAppointment;

  @Column({ length: 20 })
  action: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ name: 'employee_name', length: 50 })
  employeeName: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
