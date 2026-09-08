import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../entities/operation-log.entity';
import { Employee } from '../entities/employee.entity';

const MODULE_CN: Record<string, string> = {
  house: '房屋管理',
  finance: '财务管理',
  system: '系统管理',
};

const MODULE_EN: Record<string, string> = {
  租房管理: 'house',
  售房管理: 'house',
  房屋管理: 'house',
  财务管理: 'finance',
  系统管理: 'system',
  人员管理: 'system',
  字典管理: 'system',
};

function actionToCn(action: string): string {
  const a = action || '';
  if (/(create|:add|_add)/.test(a)) return '新增';
  if (/(edit|update|changeStatus|change_status)/.test(a)) return '编辑';
  if (/(delete|remove)/.test(a)) return '删除';
  if (/export/.test(a)) return '导出';
  if (/import/.test(a)) return '导入';
  if (/login/.test(a)) return '登录';
  if (/(approve|confirm|complete|refund|deduct|take|transfer|checkout)/.test(a)) return '审批';
  return a;
}

function formatDate(d: Date): string {
  if (!d) return '';
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

@Injectable()
export class SystemLogService {
  constructor(
    @InjectRepository(OperationLog)
    private logRepo: Repository<OperationLog>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  async findAll(query: any) {
    const qb = this.logRepo.createQueryBuilder('l');
    const moduleEn = query.module ? (MODULE_EN[query.module] || query.module) : null;
    if (moduleEn) qb.andWhere('l.module = :module', { module: moduleEn });
    if (query.startDate) qb.andWhere('l.createdAt >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('l.createdAt <= :endDate', { endDate: `${query.endDate} 23:59:59` });
    if (query.keyword) {
      qb.andWhere('(l.action ILIKE :kw OR l.objectType ILIKE :kw OR l.objectId ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }

    if (query.operator) {
      const employees = await this.employeeRepo.find();
      const matchedIds = employees
        .filter((e) => e.name && e.name.includes(query.operator))
        .map((e) => e.id);
      if (matchedIds.length) {
        qb.andWhere('l.employeeId IN (:...ids)', { ids: matchedIds });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    const [list, total] = await qb
      .orderBy('l.createdAt', 'DESC')
      .skip(((query.page || 1) - 1) * (query.pageSize || 20))
      .take(query.pageSize || 20)
      .getManyAndCount();

    const employeeIds = [...new Set(list.map((l) => l.employeeId).filter(Boolean))];
    const employees = employeeIds.length ? await this.employeeRepo.findByIds(employeeIds) : [];
    const nameMap = new Map(employees.map((e) => [e.id, e.name]));

    const mapped = list.map((l) => {
      const actionCn = actionToCn(l.action);
      return {
        id: l.id,
        createdAt: formatDate(l.createdAt),
        module: MODULE_CN[l.module] || l.module,
        actionType: actionCn,
        operator: nameMap.get(l.employeeId) || '',
        ip: l.ip || '',
        detail: `${actionCn}${l.objectType ? ' · ' + l.objectType : ''}`,
        target: l.objectId || '',
        status: l.result || 'success',
      };
    });
    return { list: mapped, total };
  }
}
