import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { applyDataScope } from '../../../common/data-scope/data-scope.util';
import { isRentalAdministrator } from '../../../common/utils/rental-privacy.util';
import { Deal } from '../../house/entities/deal.entity';
import { RentalSet } from '../../house/entities/rental-set.entity';
import { ContractDetails } from '../../house/entities/contract-details';
import { Employee } from '../../system/entities/employee.entity';
import {
  BusinessSubmission,
  CashAccount,
  CashEntry,
  ContractSchedule,
  PropertyConfiguration,
} from '../entities/business-workflow.entity';
import {
  addDays,
  addMonths,
  buildContractSchedule,
  CASH_ACCOUNTS,
  cents,
  leaseAmount,
  money,
  validDate,
  validMoney,
} from './business-calculation';

@Injectable()
export class BusinessWorkflowService {
  constructor(private readonly ds: DataSource) {}

  private scoped<T>(
    repo: Repository<T>,
    user: CurrentUserPayload,
    owner = 'employeeId',
  ) {
    const qb = repo.createQueryBuilder('record');
    applyDataScope(qb, user, 'record', {
      ownerField: owner,
      storeField: 'storeId',
      groupField: 'groupId',
    });
    return qb;
  }
  private period(value?: string) {
    const period =
      value ||
      new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })
        .format(new Date())
        .slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))
      throw new BadRequestException('月份格式为 YYYY-MM');
    return period;
  }
  private async property(
    id: number,
    user: CurrentUserPayload,
    manager: EntityManager,
    lock = false,
  ) {
    const qb = manager
      .getRepository(RentalSet)
      .createQueryBuilder('rental')
      .where('rental.id = :id', { id });
    if (!isRentalAdministrator(user))
      qb.andWhere('rental.creatorId = :owner', { owner: user.employeeId });
    const row = await (lock ? qb.setLock('pessimistic_write') : qb).getOne();
    if (!row)
      throw new ForbiddenException('房源不存在或仅原录入人和管理员可操作');
    return row;
  }
  validateDetails(details: ContractDetails = {}) {
    if (!details || typeof details !== 'object' || Array.isArray(details))
      throw new BadRequestException('合同详情格式无效');
    for (const key of [
      'ownerName',
      'ownerAddress',
      'propertyAddress',
      'customerAddress',
      'payee',
      'payeeAccount',
      'depositNote',
    ]) {
      if (
        details[key] != null &&
        (typeof details[key] !== 'string' || details[key].length > 255)
      )
        throw new BadRequestException('合同文本字段最多 255 字');
    }
    if (
      (details.ownerName?.length || 0) > 100 ||
      (details.payeeAccount?.length || 0) > 100
    )
      throw new BadRequestException('业主姓名最多 100 字，收款账号最多 100 字');
    for (const key of ['ownerIdCard', 'customerIdCard'])
      if (
        details[key] != null &&
        (typeof details[key] !== 'string' ||
          (details[key] && !/^(\d{15}|\d{17}[\dXx])$/.test(details[key])))
      )
        throw new BadRequestException('身份证号须为 15 位或 18 位');
    if (
      details.ownerPhone != null &&
      (typeof details.ownerPhone !== 'string' ||
        (details.ownerPhone && !/^1\d{10}$/.test(details.ownerPhone)))
    )
      throw new BadRequestException('业主电话须为有效手机号');
    validMoney(details.commissionAmount ?? 0, '佣金');
    for (const key of [
      'performanceRatio',
      'commissionRatio',
      'entryRatio',
      'closingRatio',
    ])
      if (
        details[key] != null &&
        (typeof details[key] !== 'number' ||
          !Number.isFinite(details[key]) ||
          details[key] < 0 ||
          details[key] > 100)
      )
        throw new BadRequestException('分成比例须在 0 至 100 之间');
    if (details.paymentDate && !validDate(details.paymentDate))
      throw new BadRequestException('付款日期无效');
    for (const key of ['occupants', 'maxOccupants'])
      if (
        details[key] != null &&
        (!Number.isInteger(details[key]) ||
          details[key] < 1 ||
          details[key] > 100)
      )
        throw new BadRequestException('居住人数须为 1 至 100 的整数');
    if (
      details.occupants &&
      details.maxOccupants &&
      details.occupants > details.maxOccupants
    )
      throw new BadRequestException('常居人数不能超过房屋容纳人数');
    if (
      details.freeDays != null &&
      (!Array.isArray(details.freeDays) ||
        details.freeDays.length !== 5 ||
        details.freeDays.some((v) => !Number.isInteger(v) || v < 0 || v > 365))
    )
      throw new BadRequestException('请填写五个年度的免租天数（0 至 365）');
    return details;
  }

  validateRentalDetails(details: ContractDetails, managed: boolean) {
    this.validateDetails(details);
    const required = managed
      ? ['customerIdCard', 'customerAddress', 'propertyAddress', 'paymentDate']
      : [
          'ownerName',
          'ownerIdCard',
          'ownerAddress',
          'ownerPhone',
          'propertyAddress',
          'customerIdCard',
          'customerAddress',
        ];
    if (
      required.some(
        (key) => typeof details[key] !== 'string' || !details[key].trim(),
      )
    )
      throw new BadRequestException('请补齐合同身份资料、地址及付款信息');
  }

  private async ensureAccounts(manager: EntityManager) {
    await manager
      .getRepository(CashAccount)
      .createQueryBuilder()
      .insert()
      .values(
        Object.entries(CASH_ACCOUNTS).map(([code, name]) => ({
          code,
          name,
          openingBalance: 0,
        })),
      )
      .orIgnore()
      .execute();
  }

  async createSchedules(
    manager: EntityManager,
    deal: Deal,
    direction: 'pay' | 'receive',
  ) {
    const data = buildContractSchedule({
      leaseStart: deal.leaseStart,
      leaseEnd: deal.leaseEnd,
      amount: Number(deal.amount),
      paymentMethod: deal.paymentMethod,
      paymentDate: deal.details?.paymentDate || deal.leaseStart,
      freeDays: direction === 'pay' ? deal.details?.freeDays : undefined,
    });
    const repo = manager.getRepository(ContractSchedule);
    await repo.save(
      data.map((row) =>
        repo.create({
          ...row,
          dealId: deal.id,
          propertyId: deal.propertyId,
          propertyName: deal.details?.propertyAddress || deal.propertyName,
          direction,
          status: row.amount === 0 ? 'paid' : 'pending',
          settledAmount: 0,
          employeeId: deal.responsibleEmployeeId,
          storeId: deal.storeId,
          groupId: deal.groupId,
        }),
      ),
    );
  }

  async delegationContext(id: number, user: CurrentUserPayload) {
    const rental = await this.property(id, user, this.ds.manager);
    const latest = await this.ds.getRepository(Deal).findOne({
      where: { propertyId: id, workflowType: 'management', status: 'active' }, order: { signedAt: 'DESC' },
    });
    return {
      leaseStart: latest?.leaseStart || rental.leaseStart || '', leaseEnd: latest?.leaseEnd || rental.leaseEnd || '',
      amount: Number(latest?.amount ?? rental.landlordRent ?? 0), deposit: Number(latest?.deposit ?? rental.landlordDeposit ?? 0),
      paymentMethod: latest?.paymentMethod || rental.landlordPaymentMethod || 'monthly',
      existingContractCode: latest?.contractCode,
      details: { ownerName: rental.landlordName || '', ownerPhone: rental.landlordPhone || '',
        ownerIdCard: rental.landlordIdCard || '', payee: rental.landlordName || '', payeeAccount: rental.landlordBankCard || '',
        propertyAddress: [rental.address, rental.building && `${rental.building}栋`, rental.unit && `${rental.unit}单元`, rental.roomNo && `${rental.roomNo}室`].filter(Boolean).join(' '),
        ...latest?.details },
    };
  }

  async delegate(
    propertyId: number,
    input: {
      leaseStart: string;
      leaseEnd: string;
      amount: number;
      deposit: number;
      paymentMethod: string;
      details: ContractDetails;
    },
    user: CurrentUserPayload,
  ) {
    this.validateDetails(input.details);
    for (const key of [
      'ownerName',
      'ownerIdCard',
      'ownerAddress',
      'ownerPhone',
      'propertyAddress',
      'paymentDate',
      'payee',
      'payeeAccount',
    ])
      if (!input.details?.[key]?.trim())
        throw new BadRequestException(
          '请补齐业主资料、地址、首期付款日期及收款人和账号',
        );
    validMoney(input.amount, '成交金额');
    validMoney(input.deposit, '押金');
    if (input.amount <= 0) throw new BadRequestException('成交月租须大于零');
    if (input.amount > 9999999999.99 || input.deposit > 9999999999.99)
      throw new BadRequestException('租金及押金超出房源金额上限');
    if (!input.details.freeDays)
      throw new BadRequestException('请填写五个年度的免租天数');
    buildContractSchedule({
      ...input,
      paymentDate: input.details.paymentDate,
      freeDays: input.details.freeDays,
    });
    return this.ds.transaction(async (manager) => {
      const rental = await this.property(propertyId, user, manager, true);
      const repo = manager.getRepository(Deal);
      if (
        await repo
          .createQueryBuilder('contract')
          .where(
            'contract.propertyId = :propertyId AND contract.workflowType = :type AND contract.status IN (:...statuses) AND contract.leaseStart <= :leaseEnd AND contract.leaseEnd >= :leaseStart',
            {
              propertyId,
              type: 'management',
              statuses: ['active', 'termination_pending'],
              leaseStart: input.leaseStart,
              leaseEnd: input.leaseEnd,
            },
          )
          .getCount()
      )
        throw new ConflictException('房源已有租期重叠的生效委托合同');
      const deal = await repo.save(
        repo.create({
          contractCode: `WT${Date.now()}${randomUUID().slice(0, 8)}`,
          bizType: 'management',
          workflowType: 'management',
          propertyId,
          propertyCode: rental.code,
          propertyName: input.details.propertyAddress,
          customerName: input.details.ownerName,
          signedAt: new Date(),
          amount: input.amount,
          deposit: input.deposit,
          leaseStart: input.leaseStart,
          leaseEnd: input.leaseEnd,
          paymentMethod: input.paymentMethod,
          details: input.details,
          responsibleEmployeeId: user.employeeId,
          responsibleEmployeeName: user.name,
          storeId: rental.storeId,
          groupId: rental.groupId,
          status: 'active',
        }),
      );
      Object.assign(rental, {
        isManaged: true,
        landlordName: input.details.ownerName,
        landlordIdCard: input.details.ownerIdCard,
        landlordPhone: input.details.ownerPhone,
        landlordRent: input.amount,
        landlordDeposit: input.deposit,
        landlordBankCard: input.details.payeeAccount,
        leaseStart: input.leaseStart,
        leaseEnd: input.leaseEnd,
        landlordPaymentMethod: input.paymentMethod,
      });
      await manager.getRepository(RentalSet).save(rental);
      await this.createSchedules(manager, deal, 'pay');
      return deal;
    });
  }

  async calendar(periodValue: string, user: CurrentUserPayload) {
    const period = this.period(periodValue),
      start = `${period}-01`,
      end = addMonths(start, 2);
    const rows = await this.scoped(
      this.ds.getRepository(ContractSchedule),
      user,
    )
      .innerJoin(Deal, 'deal', 'deal.id = record.dealId')
      .andWhere('deal.status IN (:...active)', {
        active: ['active', 'termination_pending'],
      })
      .andWhere('record.status = :status', { status: 'pending' })
      .andWhere('record.dueDate >= :start AND record.dueDate < :end', {
        start,
        end,
      })
      .orderBy('record.dueDate', 'ASC')
      .addOrderBy('record.id', 'ASC')
      .getMany();
    const buckets = ['pay', 'receive'].flatMap((direction) =>
      [period, addMonths(start, 1).slice(0, 7)].map((month) => {
        const list = rows
          .filter(
            (row) =>
              row.direction === direction && row.dueDate.startsWith(month),
          )
          .map((row) => ({
            ...row,
            amount: Number(row.amount),
            remaining: money(cents(row.amount) - cents(row.settledAmount)),
          }));
        return {
          direction,
          period: month,
          amount: money(list.reduce((s, row) => s + cents(row.remaining), 0)),
          count: new Set(list.map((row) => row.propertyId)).size,
          list,
        };
      }),
    );
    const overdue = await this.scoped(
      this.ds.getRepository(ContractSchedule),
      user,
    )
      .innerJoin(Deal, 'deal', 'deal.id = record.dealId')
      .andWhere('deal.status IN (:...active)', {
        active: ['active', 'termination_pending'],
      })
      .andWhere('record.status = :status AND record.dueDate < :start', {
        status: 'pending',
        start,
      })
      .orderBy('record.dueDate', 'ASC')
      .getMany();
    return {
      period,
      buckets,
      overdue: overdue.map((row) => ({
        ...row,
        remaining: money(cents(row.amount) - cents(row.settledAmount)),
      })),
    };
  }

  async settle(
    id: number,
    input: {
      requestKey: string;
      paymentDate: string;
      amount: number;
      accountCode: string;
      payerAccount: string;
      payer: string;
      payeeAccount: string;
      payee: string;
    },
    user: CurrentUserPayload,
  ) {
    if (
      !input.requestKey?.trim() ||
      input.requestKey.length > 100 ||
      !validDate(input.paymentDate) ||
      !CASH_ACCOUNTS[input.accountCode]
    )
      throw new BadRequestException('请填写有效付款日期和公司收支账户');
    validMoney(input.amount, '支付金额');
    if (input.amount <= 0) throw new BadRequestException('支付金额须大于零');
    for (const key of ['payerAccount', 'payer', 'payeeAccount', 'payee'])
      if (!input[key]?.trim() || input[key].length > 100)
        throw new BadRequestException('请填写付款人、收款人及双方账号');
    return this.ds
      .transaction(async (manager) => {
        const scheduleRepo = manager.getRepository(ContractSchedule);
        const row = await this.scoped(scheduleRepo, user)
          .andWhere('record.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();
        if (!row) throw new ForbiddenException('支付计划不存在或无权操作');
        const entries = manager.getRepository(CashEntry);
        const existing = await entries.findOne({
          where: { requestKey: input.requestKey },
        });
        if (existing) {
          if (
            existing.scheduleId !== id ||
            cents(existing.amount) !== cents(input.amount) ||
            existing.accountCode !== input.accountCode ||
            existing.paymentDate !== input.paymentDate ||
            existing.payer !== input.payer ||
            existing.payee !== input.payee ||
            existing.payerAccount !== input.payerAccount ||
            existing.payeeAccount !== input.payeeAccount
          )
            throw new ConflictException('重复请求编号对应不同付款内容');
          return existing;
        }
        const deal = await manager.getRepository(Deal).findOne({
          where: { id: row.dealId },
          lock: { mode: 'pessimistic_read' },
        });
        if (
          !deal ||
          !['active', 'termination_pending'].includes(deal.status) ||
          row.status !== 'pending'
        )
          throw new ConflictException('合同已结束或该期已结清');
        if (cents(input.amount) > cents(row.amount) - cents(row.settledAmount))
          throw new BadRequestException('支付金额不能超过本期未结金额');
        // 锁定同一合同的前序计划，不能跳过未结清的付款流程。
        const prior = await scheduleRepo
          .createQueryBuilder('s')
          .where(
            's.dealId = :deal AND s.sequence < :sequence AND s.status = :status',
            { deal: row.dealId, sequence: row.sequence, status: 'pending' },
          )
          .getCount();
        if (prior) throw new ConflictException('请先完成该合同前一期收付款');
        await this.ensureAccounts(manager);
        const entry = await entries.save(
          entries.create({
            ...input,
            scheduleId: id,
            direction: row.direction,
            employeeId: row.employeeId,
            storeId: row.storeId,
            groupId: row.groupId,
          }),
        );
        row.settledAmount = money(
          cents(row.settledAmount) + cents(input.amount),
        );
        row.status =
          cents(row.settledAmount) === cents(row.amount) ? 'paid' : 'pending';
        await scheduleRepo.save(row);
        return entry;
      })
      .catch((error) => {
        if (error?.code === '23505')
          throw new ConflictException('付款请求编号已被使用，请核对原记录');
        throw error;
      });
  }

  async cashFlow(user: CurrentUserPayload) {
    const accountRepo = this.ds.getRepository(CashAccount);
    const openings = await accountRepo.find();
    const entries = await this.scoped(this.ds.getRepository(CashEntry), user)
      .select('record.accountCode', 'code')
      .addSelect(
        "COALESCE(SUM(CASE WHEN record.direction = 'receive' THEN record.amount ELSE -record.amount END),0)",
        'movement',
      )
      .groupBy('record.accountCode')
      .getRawMany();
    const list = Object.entries(CASH_ACCOUNTS).map(([code, name]) => {
      const openingBalance = Number(
        openings.find((row) => row.code === code)?.openingBalance || 0,
      );
      const movement = Number(
        entries.find((row) => row.code === code)?.movement || 0,
      );
      return {
        code,
        name,
        openingBalance,
        movement,
        balance: money(cents(openingBalance) + cents(movement)),
      };
    });
    // 期初余额为公司口径，个人/门店范围不能混合公司期初和局部流水。
    if (user.dataScope !== 'company')
      list.forEach((row) => {
        row.openingBalance = 0;
        row.balance = row.movement;
      });
    const history = await this.scoped(this.ds.getRepository(CashEntry), user)
      .orderBy('record.createdAt', 'DESC')
      .take(100)
      .getMany();
    return { accounts: list, history, scope: user.dataScope };
  }
  async opening(code: string, amount: number, user: CurrentUserPayload) {
    if (!isRentalAdministrator(user))
      throw new ForbiddenException('仅公司管理员可设置期初余额');
    if (!CASH_ACCOUNTS[code]) throw new BadRequestException('账户无效');
    validMoney(amount, '期初余额', true);
    return this.ds
      .getRepository(CashAccount)
      .upsert({ code, name: CASH_ACCOUNTS[code], openingBalance: amount }, [
        'code',
      ]);
  }

  async configuration(id: number, user: CurrentUserPayload) {
    await this.property(id, user, this.ds.manager);
    return (
      (await this.ds
        .getRepository(PropertyConfiguration)
        .findOne({ where: { propertyId: id } })) || {
        propertyId: id,
        items: [],
      }
    );
  }
  async configurationEmployees(id: number, user: CurrentUserPayload) {
    await this.property(id, user, this.ds.manager);
    return this.employeeOptions(user);
  }
  async saveConfiguration(
    id: number,
    items: PropertyConfiguration['items'],
    user: CurrentUserPayload,
  ) {
    const types = [
      'cleaning',
      'repair',
      'renovation',
      'furniture',
      'appliance',
      'collection_bonus',
      'rental_bonus',
    ];
    if (
      !Array.isArray(items) ||
      items.length !== types.length ||
      items.some((row) => !row || typeof row !== 'object') ||
      new Set(items.map((row) => row.type)).size !== types.length
    )
      throw new BadRequestException('请填写全部配置项目');
    items.forEach((row) => {
      if (!row || !types.includes(row.type))
        throw new BadRequestException('配置类型无效');
      validMoney(row.amount, '配置金额');
      if (
        typeof row.remark !== 'string' ||
        row.remark.length > 500 ||
        (row.recipient != null &&
          (typeof row.recipient !== 'string' || row.recipient.length > 100))
      )
        throw new BadRequestException('备注最多 500 字，获奖人最多 100 字');
      if (
        row.type.endsWith('_bonus') &&
        row.amount > 0 &&
        (!Number.isInteger(row.recipientEmployeeId) || row.recipientEmployeeId <= 0 ||
          !['cash', 'transfer', 'wechat'].includes(row.channel))
      )
        throw new BadRequestException('奖励需选择员工和发放渠道');
    });
    return this.ds.transaction(async (manager) => {
      const rental = await this.property(id, user, manager, true);
      if (!rental.isManaged)
        throw new BadRequestException('仅托管房源支持配置');
      const employees = await this.saleEmployees(user, manager);
      items = items.map(row => {
        if (!row.type.endsWith('_bonus')) return { ...row, recipient: '', recipientEmployeeId: undefined };
        if (row.recipientEmployeeId == null && row.amount === 0) return { ...row, recipient: '' };
        const employee = employees.find(employee => employee.id === row.recipientEmployeeId);
        if (!employee) throw new ForbiddenException('奖励员工不存在、已停用或不在可选范围内');
        return { ...row, recipient: employee.name, recipientEmployeeId: employee.id };
      });
      const repo = manager.getRepository(PropertyConfiguration),
        old = await repo.findOne({ where: { propertyId: id } });
      const delta =
        items.reduce((s, row) => s + cents(row.amount), 0) -
        (old?.items || []).reduce((s, row) => s + cents(row.amount), 0);
      const adjustments = [...(old?.adjustments || [])];
      if (delta)
        adjustments.push({
          occurredOn: new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Asia/Shanghai',
          }).format(new Date()),
          amount: money(delta),
        });
      return repo.save(
        repo.create({
          ...old,
          propertyId: id,
          items,
          adjustments,
          employeeId: user.employeeId,
          storeId: rental.storeId,
          groupId: rental.groupId,
        }),
      );
    });
  }

  private async saleEmployees(user: CurrentUserPayload, manager = this.ds.manager) {
    const employees = await manager
      .getRepository(Employee)
      .find({ relations: ['stores', 'groups'] });
    return employees.filter(
      (row) =>
        row.status === 'normal' &&
        (user.dataScope === 'company' ||
          row.id === user.employeeId ||
          (user.dataScope === 'store' &&
            row.stores.some((store) => user.storeIds?.includes(store.id))) ||
          (user.dataScope === 'assigned' &&
            row.stores.some((store) =>
              user.assignedStoreIds?.includes(store.id),
            )) ||
          (user.dataScope === 'group' &&
            row.groups.some((group) => user.groupIds?.includes(group.id)))),
    );
  }
  async employeeOptions(user: CurrentUserPayload) {
    return (await this.saleEmployees(user)).map((row) => ({
      id: row.id,
      name: row.name,
      code: String(row.id).padStart(6, '0'),
    }));
  }

  async manualSale(
    input: { amount: number; address: string; details: ContractDetails },
    user: CurrentUserPayload,
  ) {
    validMoney(input.amount, '成交金额');
    this.validateDetails(input.details);
    if (
      input.amount <= 0 ||
      !input.address?.trim() ||
      input.address.length > 255
    )
      throw new BadRequestException('请填写成交地址和有效金额');
    const d = input.details;
    if (
      !Number.isInteger(d.entryEmployeeId) ||
      d.entryEmployeeId <= 0 ||
      !Number.isInteger(d.closingEmployeeId) ||
      d.closingEmployeeId <= 0 ||
      typeof d.entryRatio !== 'number' ||
      typeof d.closingRatio !== 'number' ||
      (d.entryRatio ?? 0) + (d.closingRatio ?? 0) !== 100
    )
      throw new BadRequestException(
        '请选择录入人、成交人，录入比例和成交比例之和须为 100%',
      );
    const employees = await this.saleEmployees(user);
    const allowed = (id: number) => employees.find((row) => row.id === id);
    const entry = allowed(d.entryEmployeeId),
      closing = allowed(d.closingEmployeeId);
    if (!entry || !closing)
      throw new ForbiddenException('员工不存在或不在可分配范围内');
    const storeId = user.storeIds?.[0] || closing.stores[0]?.id;
    if (!storeId) throw new BadRequestException('报送人或成交人须关联门店');
    const repo = this.ds.getRepository(Deal);
    return repo.save(
      repo.create({
        contractCode: `MM${Date.now()}${randomUUID().slice(0, 8)}`,
        bizType: 'sale',
        workflowType: 'sale',
        propertyId: 0,
        propertyCode: '手工买卖',
        propertyName: input.address,
        customerName: '手工买卖',
        amount: input.amount,
        signedAt: new Date(),
        details: {
          ...d,
          entryEmployeeName: entry.name,
          closingEmployeeName: closing.name,
        },
        responsibleEmployeeId: user.employeeId,
        responsibleEmployeeName: user.name,
        storeId,
        groupId: user.groupIds?.[0],
        status: 'active',
      }),
    );
  }

  async performance(periodValue: string, user: CurrentUserPayload) {
    const period = this.period(periodValue),
      start = `${period}-01`,
      end = addMonths(start, 1);
    const deals = await this.scoped(
      this.ds.getRepository(Deal),
      user,
      'responsibleEmployeeId',
    )
      .andWhere('record.signedAt < CAST(:end AS date)', { end })
      .getMany();
    const allocatedEmployeeIds = new Set([
      user.employeeId,
      ...(await this.saleEmployees(user)).map((row) => row.id),
    ]);
    // 管理员可代报买卖；参与员工只能查看自己数据范围内的分配金额，不能因报送人不同而丢失收入。
    if (user.dataScope !== 'company') {
      const allocations = await this.ds
        .getRepository(Deal)
        .createQueryBuilder('allocation')
        .where(
          'allocation.bizType = :type AND allocation.signedAt >= CAST(:start AS date) AND allocation.signedAt < CAST(:end AS date)',
          { type: 'sale', start, end },
        )
        .getMany();
      for (const deal of allocations)
        if (
          (allocatedEmployeeIds.has(deal.details?.entryEmployeeId) ||
            allocatedEmployeeIds.has(deal.details?.closingEmployeeId)) &&
          !deals.some((row) => row.id === deal.id)
        )
          deals.push(deal);
    }
    const managedPropertyIds = [
      ...new Set(
        deals
          .filter((row) => row.workflowType === 'management')
          .map((row) => row.propertyId),
      ),
    ];
    // 已获授权的委托合同需要整套房的承租金额，不能因承租成交人为另一位员工而漏算溢价。
    const tenants = managedPropertyIds.length
      ? await this.ds
          .getRepository(Deal)
          .createQueryBuilder('tenant')
          .select([
            'tenant.propertyId',
            'tenant.leaseStart',
            'tenant.leaseEnd',
            'tenant.terminatedOn',
            'tenant.amount',
          ])
          .where(
            'tenant.workflowType = :type AND tenant.propertyId IN (:...ids)',
            { type: 'tenant', ids: managedPropertyIds },
          )
          .getMany()
      : [];
    const configurations = await this.ds
      .getRepository(PropertyConfiguration)
      .find();
    const employees = await this.ds
      .getRepository(Employee)
      .find({ select: ['id', 'name'] });
    const result = new Map<number, any>();
    const bucket = (id: number, name: string) => {
      if (!result.has(id))
        result.set(id, {
          employeeId: id,
          employeeName: name,
          employeeCode: String(id).padStart(6, '0'),
          regular: { amount: 0, commission: 0, details: [] },
          management: { amount: 0, commission: 0, details: [] },
          tenant: { amount: 0, commission: 0, details: [] },
          sale: { amount: 0, commission: 0, details: [] },
          totalAmount: 0,
          totalCommission: 0,
        });
      return result.get(id);
    };
    const append = (
      id: number,
      name: string,
      type: string,
      amount: number,
      commission: number,
      detail: any,
    ) => {
      const row = bucket(id, name);
      row[type].amount = money(cents(row[type].amount) + cents(amount));
      row[type].commission = money(
        cents(row[type].commission) + cents(commission),
      );
      row[type].details.push(detail);
    };
    for (const deal of deals) {
      const d = deal.details || {},
        signedMonth = new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Shanghai',
        })
          .format(deal.signedAt)
          .slice(0, 7);
      if (
        deal.status === 'terminated' &&
        (!deal.terminatedOn || deal.terminatedOn < start)
      )
        continue;
      if (deal.workflowType === 'management') {
        const effectiveEnd = [
          deal.leaseEnd,
          deal.terminatedOn ? addDays(deal.terminatedOn, -1) : deal.leaseEnd,
        ].sort()[0];
        const config = configurations.find(
          (row) => row.propertyId === deal.propertyId,
        );
        const latest = deals
          .filter(
            (row) =>
              row.workflowType === 'management' &&
              row.propertyId === deal.propertyId,
          )
          .sort(
            (a, b) =>
              new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime(),
          )[0];
        const costs =
          latest?.id === deal.id
            ? money(
                (config?.adjustments || [])
                  .filter((row) => row.occurredOn.startsWith(period))
                  .reduce((s, row) => s + cents(row.amount), 0),
              )
            : 0;
        if ((deal.leaseStart >= end || effectiveEnd < start) && !costs)
          continue;
        const fullRent = leaseAmount(
          deal.leaseStart,
          effectiveEnd,
          Number(deal.amount),
          start,
          end,
        );
        const outgoing = leaseAmount(
          deal.leaseStart,
          effectiveEnd,
          Number(deal.amount),
          start,
          end,
          d.freeDays,
        );
        const incoming = tenants
          .filter((row) => row.propertyId === deal.propertyId)
          .reduce(
            (sum, row) =>
              sum +
              cents(
                leaseAmount(
                  row.leaseStart,
                  [
                    row.leaseEnd,
                    row.terminatedOn
                      ? addDays(row.terminatedOn, -1)
                      : row.leaseEnd,
                    effectiveEnd,
                  ].sort()[0],
                  Number(row.amount),
                  [start, deal.leaseStart].sort().pop()!,
                  end,
                ),
              ),
            0,
          );
        const premium = money(incoming - cents(fullRent)),
          freeAmount = money(cents(fullRent) - cents(outgoing));
        const gain = money(cents(premium) + cents(freeAmount) - cents(costs));
        const performanceRatio = Number(d.performanceRatio ?? 100),
          commissionRatio = Number(d.commissionRatio ?? 0);
        const amount = money((cents(gain) * performanceRatio) / 100),
          commission = money((cents(amount) * commissionRatio) / 100);
        append(
          deal.responsibleEmployeeId,
          deal.responsibleEmployeeName,
          'management',
          amount,
          commission,
          {
            dealId: deal.id,
            propertyName: deal.propertyName,
            contractCode: deal.contractCode,
            freeDays: d.freeDays || [0, 0, 0, 0, 0],
            freeAmount,
            premium,
            occurredOn: start,
            costs,
            configuration: config?.items || [],
            signedMonth,
          },
        );
      } else if (signedMonth === period) {
        const type =
          deal.bizType === 'sale'
            ? 'sale'
            : deal.workflowType === 'tenant'
              ? 'tenant'
              : 'regular';
        const received = Number(d.commissionAmount || 0),
          performanceRatio = Number(d.performanceRatio ?? 100),
          commissionRatio = Number(d.commissionRatio ?? 0);
        if (type === 'sale' && d.entryEmployeeId && d.closingEmployeeId) {
          const entryAmount = money(
            (cents(deal.amount || 0) * Number(d.entryRatio)) / 100,
          );
          for (const [id, ratio, role, amount] of [
            [d.entryEmployeeId, d.entryRatio, '录入', entryAmount],
            [
              d.closingEmployeeId,
              d.closingRatio,
              '成交',
              money(cents(deal.amount || 0) - cents(entryAmount)),
            ],
          ] as const) {
            if (user.dataScope !== 'company' && !allocatedEmployeeIds.has(id))
              continue;
            append(
              id,
              (role === '录入' ? d.entryEmployeeName : d.closingEmployeeName) ||
                employees.find((row) => row.id === id)?.name ||
                String(id),
              type,
              amount,
              money((cents(amount) * commissionRatio) / 100),
              {
                propertyName: deal.propertyName,
                contractCode: deal.contractCode,
                role,
                ratio,
                amount,
                transactionAmount: Number(deal.amount),
              },
            );
          }
        } else {
          const amount = money((cents(received) * performanceRatio) / 100),
            commission = money((cents(amount) * commissionRatio) / 100);
          append(
            deal.responsibleEmployeeId,
            deal.responsibleEmployeeName,
            type,
            amount,
            commission,
            {
              propertyName: deal.propertyName,
              customerName: deal.customerName,
              contractCode: deal.contractCode,
              received,
              performanceRatio,
              commissionRatio,
              amount,
              commission,
            },
          );
        }
      }
    }
    const list = [...result.values()].map((row) => ({
      ...row,
      totalAmount: money(
        ['regular', 'management', 'tenant', 'sale'].reduce(
          (s, type) => s + cents(row[type].amount),
          0,
        ),
      ),
      totalCommission: money(
        ['regular', 'management', 'tenant', 'sale'].reduce(
          (s, type) => s + cents(row[type].commission),
          0,
        ),
      ),
    }));
    return { period, list };
  }

  async submit(type: string, periodValue: string, user: CurrentUserPayload) {
    const period = this.period(periodValue);
    if (!['performance', 'management', 'regular', 'sale'].includes(type))
      throw new BadRequestException('提交类型无效');
    const permission =
      type === 'management'
        ? 'finance:arrears:modify'
        : 'finance:performance:modify';
    if (!user.permissions?.some((code) => code === '*' || code === permission))
      throw new ForbiddenException('无权提交该类业务');
    const data =
      type === 'management'
        ? await this.calendar(period, user)
        : await this.performance(period, user);
    if (type === 'management') {
      const start = `${period}-01`,
        end = addMonths(start, 1);
      (data as any).payments = await this.scoped(
        this.ds.getRepository(CashEntry),
        user,
      )
        .innerJoin(
          ContractSchedule,
          'schedule',
          'schedule.id = record.scheduleId',
        )
        .select('record')
        .addSelect('schedule.propertyName', 'propertyName')
        .andWhere(
          'record.paymentDate >= :start AND record.paymentDate < :end',
          { start, end },
        )
        .orderBy('record.paymentDate', 'ASC')
        .getRawAndEntities()
        .then((result) =>
          result.entities.map((row, index) => ({
            ...row,
            propertyName: result.raw[index].propertyName,
          })),
        );
    }
    const snapshot =
      type === 'regular' || type === 'sale'
        ? {
            period,
            list: (data as any).list
              .map((row) => ({
                employeeId: row.employeeId,
                employeeCode: row.employeeCode,
                employeeName: row.employeeName,
                [type]: row[type],
              }))
              .filter((row) => row[type].details.length),
          }
        : data;
    return this.ds.transaction(async (manager) => {
      // 同一人的同类月份提交串行化，避免重复报送；退回后可重新提交新快照。
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        user.employeeId,
      ]);
      const repo = manager.getRepository(BusinessSubmission);
      if (
        await repo
          .createQueryBuilder('submission')
          .where(
            'submission.type = :type AND submission.period = :period AND submission.employeeId = :employeeId AND submission.status IN (:...statuses)',
            {
              type,
              period,
              employeeId: user.employeeId,
              statuses: ['submitted', 'saved'],
            },
          )
          .getCount()
      )
        throw new ConflictException('该月份已提交或已保存，不能重复报送');
      return repo.save(
        repo.create({
          type,
          period,
          snapshot,
          employeeId: user.employeeId,
          employeeName: user.name,
          storeId: user.storeIds?.[0],
          groupId: user.groupIds?.[0],
          status: 'submitted',
        }),
      );
    });
  }
  async submissions(user: CurrentUserPayload) {
    return this.scoped(this.ds.getRepository(BusinessSubmission), user)
      .orderBy('record.createdAt', 'DESC')
      .take(200)
      .getMany();
  }
  async review(
    id: number,
    action: string,
    note: string,
    user: CurrentUserPayload,
  ) {
    if (
      !['save', 'return'].includes(action) ||
      typeof note !== 'string' ||
      note.length > 500 ||
      (action === 'return' && !note.trim())
    )
      throw new BadRequestException('退回须填写原因，备注最多 500 字');
    return this.ds.transaction(async (manager) => {
      const repo = manager.getRepository(BusinessSubmission),
        row = await this.scoped(repo, user)
          .andWhere('record.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();
      if (!row) throw new NotFoundException('财务提交不存在或无权操作');
      if (row.status !== 'submitted')
        throw new ConflictException('该提交已经处理');
      row.status = action === 'return' ? 'returned' : 'saved';
      row.reviewNote = note;
      row.reviewedBy = user.employeeId;
      return repo.save(row);
    });
  }
}
