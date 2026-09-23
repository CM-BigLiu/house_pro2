import { describe, expect, it } from 'vitest';
import Schema from 'async-validator';
import { calculateUnitPrice, formatRmbUppercase, saleFormRules } from '@/utils/sale-form';

const valid = {
  code: 'SALE-TEST', title: '测试房源', communityId: 1, propertyType: 'residential',
  building: '1', unit: '1', floor: '1', roomNo: '101',
  layoutRooms: 1, layoutHalls: 0, layoutBathrooms: 0, layoutBalconies: 0,
  buildingArea: 80, totalPrice: 1000000, unitPrice: 0,
  orientation: 'south', decoration: 'fine', elevator: 'yes', sourceChannel: 'store',
  ownerName: '测试业主', ownerPhone: '13800138000',
};
const schema = new Schema(saleFormRules as ConstructorParameters<typeof Schema>[0]);

describe('售房表单校验', () => {
  it('必填项有效、户型填 0、可选字段不填时允许提交', async () => {
    await expect(schema.validate(valid)).resolves.toBeDefined();
  });
  it.each(Object.keys(valid).filter(key => key !== 'unitPrice'))('必填字段 %s 缺失时阻止提交', async key => {
    await expect(schema.validate({ ...valid, [key]: undefined })).rejects.toBeDefined();
  });
  it.each([
    ['title', '   '], ['ownerName', '   '], ['building', ' '], ['communityId', 0], ['communityId', 1.5],
    ['buildingArea', 0], ['totalPrice', 0], ['buildingArea', -1], ['totalPrice', -1],
    ['layoutRooms', 1.5], ['layoutHalls', -1], ['layoutBathrooms', null], ['layoutBalconies', 0.5],
    ['ownerPhone', '138123'], ['ownerPhone', '138****1234'], ['unitPrice', -1], ['title', '字'.repeat(256)],
  ])('%s 的非法值 %s 被拒绝', async (key, value) => {
    await expect(schema.validate({ ...valid, [key]: value })).rejects.toBeDefined();
  });
});

describe('售房价格联动', () => {
  it('根据售价和面积计算每平方米单价并保留两位小数', () => {
    expect(calculateUnitPrice(1000000, 80)).toBe(12500);
    expect(calculateUnitPrice(1000000, 90)).toBe(11111.11);
    expect(calculateUnitPrice('1234567.89', '100')).toBe(12345.68);
    expect(calculateUnitPrice(1000000, 0)).toBe(0);
  });

  it.each([
    [0, '零元整'],
    [1, '壹元整'],
    [1000000, '壹佰万元整'],
    [100010001, '壹亿零壹万零壹元整'],
    [1234567.89, '壹佰贰拾叁万肆仟伍佰陆拾柒元捌角玖分'],
    [1001.01, '壹仟零壹元零壹分'],
  ])('售价 %s 显示大写金额', (value, expected) => {
    expect(formatRmbUppercase(value)).toBe(expected);
  });
});
