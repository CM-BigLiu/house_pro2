import {
  addMonths,
  addDays,
  addCalendarMonths,
  buildContractSchedule,
  leaseAmount,
  validDate,
  validMoney,
  normalizeFreeRentRanges,
} from './business-calculation';

describe('合同金额与收付款周期', () => {
  it('多段免租跨付款周期扣除，交叠区间与年度免租不重复扣减', () => {
    const rows = buildContractSchedule({ leaseStart: '2026-10-01', leaseEnd: '2026-11-29', paymentDate: '2026-10-01', paymentMethod: 'monthly', amount: 3000,
      freeDays: [10, 0, 0, 0, 0], freeRentRanges: [{ start: '2026-10-05', end: '2026-10-15' }, { start: '2026-10-29', end: '2026-11-02' }] });
    expect(rows.map(row => row.amount)).toEqual([1200, 2700]);
    expect(rows.map(row => row.dueDate)).toEqual(['2026-10-01', '2026-11-01']);
  });
  it('指定免租起止日都计算，连续及重叠日期只扣一次', () => {
    expect(normalizeFreeRentRanges([{ start: '2026-10-10', end: '2026-10-15' }, { start: '2026-10-01', end: '2026-10-10' }])).toEqual([{ start: '2026-10-01', end: '2026-10-15' }]);
    expect(leaseAmount('2026-10-01', '2026-10-30', 3000, '2026-10-01', '2026-10-31', [], [{ start: '2026-10-15', end: '2026-10-15' }])).toBe(2803.23);
  });
  it.each([[{ start: '2026-02-30', end: '2026-03-01' }], [{ start: '2026-10-10', end: '2026-10-01' }], [{ start: '2026-09-30', end: '2026-10-01' }]])('无效或超出租期免租拒绝保存 %j', ranges => {
    expect(() => normalizeFreeRentRanges(ranges, '2026-10-01', '2026-10-30')).toThrow();
  });
  const contract = {
    leaseStart: '2026-10-01',
    leaseEnd: '2027-09-25',
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
      9300, 9300, 9300, 8783.33,
    ]);
    expect(quarterly[3].periodEnd).toBe('2027-09-25');
  });

  it('月底和闰年也按真实日历推算付款日期', () => {
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

  it('首年免租按月租除以30扣减，不影响以后完整月份', () => {
    const rows = buildContractSchedule({
      ...contract,
      freeDays: [10, 0, 0, 0, 0],
    });
    expect(rows[0].amount).toBe(2066.67);
    expect(rows[1].amount).toBe(3100);
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(35650);
  });

  it('第二合同年从周年日期开始扣免租', () => {
    const rows = buildContractSchedule({
      ...contract,
      leaseEnd: '2028-09-19',
      freeDays: [0, 10, 0, 0, 0],
    });
    expect(rows[11].amount).toBe(3100);
    expect(rows[12].amount).toBe(2066.67);
    expect(rows[13].amount).toBe(3100);
  });

  it('最后不足一个合同月和解约截断按合同月实际天数折算', () => {
    const rows = buildContractSchedule({
      ...contract,
      leaseEnd: '2026-11-15',
      paymentMethod: 'quarterly',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(4650);
    expect(
      leaseAmount('2026-10-01', '2026-10-15', 3100, '2026-10-01', '2026-11-01'),
    ).toBe(1500);
  });

  it('月租4000、季付且免租45天时首期应付6000元', () => {
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
      amount: 6000,
    });
    expect(rows[1].amount).toBe(12000);
  });

  it.each([
    ['2026-02-01', '2026-02-28', 1607.14],
    ['2028-02-01', '2028-02-29', 1551.72],
    ['2026-04-01', '2026-04-30', 1500],
    ['2026-05-01', '2026-05-31', 1451.61],
  ])('指定起止日期%s至%s按合同月实际天数折算', (start, end, expected) => {
    expect(leaseAmount(start, end, 3000, start, addDays(end, 1))).toBe(3000);
    expect(leaseAmount(start, end, 3000, start, start.slice(0, 8) + '16')).toBe(expected);
  });

  it('合同与报表按真实日历计算，二月和31号数据不会漏报', () => {
    expect(addMonths('2026-02-01', 1)).toBe('2026-03-01');
    expect(addCalendarMonths('2026-02-01', 1)).toBe('2026-03-01');
    expect(addCalendarMonths('2026-10-01', 1)).toBe('2026-11-01');
  });

  it('日租不提前舍入，按每期合计保留两位小数', () => {
    expect(leaseAmount('2026-05-01', '2026-05-31', 100, '2026-05-01', '2026-05-08')).toBe(22.58);
  });

  it('跨闰年及月底的合同月折算不会漏掉月底天数', () => {
    expect(
      leaseAmount('2028-01-31', '2028-03-30', 2900, '2028-01-31', '2028-03-31'),
    ).toBe(5800);
  });

  it('免租扣款上限为本期租金，二月按实际免租天数除以30计算', () => {
    const rows = buildContractSchedule({ ...contract, freeDays: [365, 0, 0, 0, 0] });
    expect(rows.every(row => row.amount >= 0)).toBe(true);
    expect(rows[0].amount).toBe(0);
    expect(rows.find(row => row.periodStart === '2027-02-01').amount).toBe(206.67);
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
