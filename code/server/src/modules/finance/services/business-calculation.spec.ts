import {
  addMonths,
  buildContractSchedule,
  leaseAmount,
  validDate,
  validMoney,
} from './business-calculation';

describe('合同金额与收付款周期', () => {
  const contract = {
    leaseStart: '2026-10-01',
    leaseEnd: '2027-09-30',
    paymentDate: '2026-09-28',
    paymentMethod: 'monthly',
    amount: 3100,
  };

  it('月付与季付金额、期数和末期范围正确', () => {
    const monthly = buildContractSchedule(contract);
    expect(monthly).toHaveLength(12);
    expect(monthly[0]).toEqual({
      sequence: 1,
      dueDate: '2026-09-28',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      amount: 3100,
    });
    const quarterly = buildContractSchedule({
      ...contract,
      paymentMethod: 'quarterly',
    });
    expect(quarterly).toHaveLength(4);
    expect(quarterly.map((row) => row.amount)).toEqual([
      9300, 9300, 9300, 9300,
    ]);
    expect(quarterly[3].periodEnd).toBe('2027-09-30');
  });

  it('月底付款持续以首期日期为锚点，不把后续各月永久移到28日', () => {
    const rows = buildContractSchedule({
      ...contract,
      paymentDate: '2026-01-31',
    });
    expect(rows.slice(0, 3).map((row) => row.dueDate)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]);
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('首年免租后剩余天数按30天折算，不影响以后完整月份', () => {
    const rows = buildContractSchedule({
      ...contract,
      freeDays: [10, 0, 0, 0, 0],
    });
    expect(rows[0].amount).toBe(2170);
    expect(rows[1].amount).toBe(3100);
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(36270);
  });

  it('第二合同年按周年起点扣免租，非自然年1月重新扣', () => {
    const rows = buildContractSchedule({
      ...contract,
      leaseEnd: '2028-09-30',
      freeDays: [0, 10, 0, 0, 0],
    });
    expect(rows[11].amount).toBe(3100);
    expect(rows[12].amount).toBe(2170);
    expect(rows[13].amount).toBe(3100);
  });

  it('最后不足一个合同月和解约截断按实际天数除以30折算', () => {
    const rows = buildContractSchedule({
      ...contract,
      leaseEnd: '2026-11-15',
      paymentMethod: 'quarterly',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(4650);
    expect(
      leaseAmount('2026-10-01', '2026-10-15', 3100, '2026-10-01', '2026-11-01'),
    ).toBe(1550);
  });

  it('月租4000、季付且免租45天时首期为16/30个月加1整月', () => {
    const rows = buildContractSchedule({
      leaseStart: '2026-09-28',
      leaseEnd: '2028-09-27',
      paymentDate: '2026-09-28',
      paymentMethod: 'quarterly',
      amount: 4000,
      freeDays: [45, 30, 0, 0, 0],
    });
    expect(rows[0]).toMatchObject({
      periodStart: '2026-09-28',
      periodEnd: '2026-12-27',
      amount: 6133.33,
    });
    expect(rows[1].amount).toBe(12000);
  });

  it.each([
    ['2026-02-01', '2026-02-28'],
    ['2028-02-01', '2028-02-29'],
    ['2026-04-01', '2026-04-30'],
    ['2026-05-01', '2026-05-31'],
  ])('整月%s至%s仍收一个月租金，零散15天统一按30天折算', (start, end) => {
    const until = addMonths(start, 1);
    expect(leaseAmount(start, end, 3000, start, until)).toBe(3000);
    expect(leaseAmount(start, end, 3000, start, `${start.slice(0, 8)}16`)).toBe(1500);
  });

  it('日租不提前舍入，按每期合计保留两位小数', () => {
    expect(leaseAmount('2026-05-01', '2026-05-31', 100, '2026-05-01', '2026-05-08')).toBe(23.33);
  });

  it('跨闰年及月底的合同月折算不会漏掉月底天数', () => {
    expect(
      leaseAmount('2028-01-31', '2028-03-30', 2900, '2028-01-31', '2028-03-31'),
    ).toBe(5800);
  });

  it('免租覆盖整期时生成已清零金额，没有负数应付款', () => {
    expect(
      buildContractSchedule({ ...contract, freeDays: [365, 0, 0, 0, 0] }).every(
        (row) => row.amount === 0,
      ),
    ).toBe(true);
  });

  it.each([
    { leaseStart: '2026-02-30' },
    { leaseEnd: '2025-01-01' },
    { paymentDate: 'invalid' },
    { paymentMethod: 'unknown' },
    { leaseEnd: '2036-10-01' },
  ])('拒绝无效合同参数 %j', (input) => {
    expect(() => buildContractSchedule({ ...contract, ...input })).toThrow();
  });

  it('日期和金额拒绝溢出、无限值及三位小数', () => {
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2028-02-29')).toBe(true);
    for (const value of [NaN, Infinity, -1, 1.001, '1', 1e15])
      expect(() => validMoney(value, '金额')).toThrow();
    expect(validMoney(-1, '调整金额', true)).toBe(-1);
  });
});
