import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRecord } from '../entities/approval-record.entity';

export interface SubmitApprovalInput {
  entityType: string;
  entityId: number;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  operatorId: number;
  remark?: string;
}

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRecord)
    private approvalRepo: Repository<ApprovalRecord>,
  ) {}

  async submit(input: SubmitApprovalInput): Promise<ApprovalRecord> {
    const record = this.approvalRepo.create({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      fromStatus: input.fromStatus || '',
      toStatus: input.toStatus || '',
      operatorId: input.operatorId,
      remark: input.remark || '',
      result: 'pending',
    });
    return this.approvalRepo.save(record);
  }

  async approve(id: number, approverId: number, remark?: string): Promise<ApprovalRecord | null> {
    const record = await this.approvalRepo.findOne({ where: { id } });
    if (!record) return null;
    record.approverId = approverId;
    record.result = 'approved';
    if (remark) record.remark = remark;
    return this.approvalRepo.save(record);
  }

  async reject(id: number, approverId: number, remark?: string): Promise<ApprovalRecord | null> {
    const record = await this.approvalRepo.findOne({ where: { id } });
    if (!record) return null;
    record.approverId = approverId;
    record.result = 'rejected';
    if (remark) record.remark = remark;
    return this.approvalRepo.save(record);
  }

  async findAll(): Promise<ApprovalRecord[]> {
    return this.approvalRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByEntity(entityType: string, entityId: number): Promise<ApprovalRecord[]> {
    return this.approvalRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
