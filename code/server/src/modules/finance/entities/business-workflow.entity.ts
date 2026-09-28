import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedTransformer } from '../../../common/transformers/encrypted.transformer';

@Entity('fin_contract_schedule')
@Index(['dealId', 'sequence'], { unique: true })
export class ContractSchedule {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'deal_id' }) dealId: number;
  @Column({ name: 'property_id' }) propertyId: number;
  @Column({ length: 255 }) propertyName: string;
  @Column({ length: 10 }) direction: 'pay' | 'receive';
  @Column() sequence: number;
  @Column({ type: 'date' }) dueDate: string;
  @Column({ type: 'date' }) periodStart: string;
  @Column({ type: 'date' }) periodEnd: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: number;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  settledAmount: number;
  @Column({ length: 20, default: 'pending' }) status: string;
  @Column({ name: 'employee_id' }) employeeId: number;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true })
  groupId: number;
  @CreateDateColumn() createdAt: Date;
}

@Entity('fin_cash_account')
export class CashAccount {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ length: 30 }) code: string;
  @Column({ length: 50 }) name: string;
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  openingBalance: number;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('fin_cash_entry')
export class CashEntry {
  @PrimaryGeneratedColumn() id: number;
  @Index({ unique: true }) @Column({ length: 100 }) requestKey: string;
  @Column({ name: 'schedule_id' }) scheduleId: number;
  @Column({ length: 30 }) accountCode: string;
  @Column({ length: 10 }) direction: string;
  @Column({ type: 'date' }) paymentDate: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: number;
  @Column({ length: 255, transformer: encryptedTransformer })
  payerAccount: string;
  @Column({ length: 100 }) payer: string;
  @Column({ length: 255, transformer: encryptedTransformer })
  payeeAccount: string;
  @Column({ length: 100 }) payee: string;
  @Column({ name: 'employee_id' }) employeeId: number;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true })
  groupId: number;
  @CreateDateColumn() createdAt: Date;
}

@Entity('fin_property_configuration')
@Index(['propertyId'], { unique: true })
export class PropertyConfiguration {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'property_id' }) propertyId: number;
  @Column({ type: 'jsonb', default: [] }) items: {
    type: string;
    amount: number;
    recipient?: string;
    recipientEmployeeId?: number;
    channel?: string;
    remark: string;
  }[];
  // 金额调整按发生月份记账；修改当前配置不会挪走历史月份的成本。
  @Column({ type: 'jsonb', default: [] }) adjustments: {
    occurredOn: string;
    amount: number;
  }[];
  @Column({ name: 'employee_id' }) employeeId: number;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true })
  groupId: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('fin_business_submission')
export class BusinessSubmission {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 20 }) type: string;
  @Column({ length: 7 }) period: string;
  @Column({ type: 'jsonb' }) snapshot: Record<string, unknown>;
  @Column({ length: 20, default: 'submitted' }) status: string;
  @Column({ length: 500, default: '' }) reviewNote: string;
  @Column({ name: 'employee_id' }) employeeId: number;
  @Column({ length: 50 }) employeeName: string;
  @Column({ name: 'store_id' }) storeId: number;
  @Column({ name: 'group_id', type: 'integer', nullable: true })
  groupId: number;
  @Column({ type: 'integer', nullable: true }) reviewedBy: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
