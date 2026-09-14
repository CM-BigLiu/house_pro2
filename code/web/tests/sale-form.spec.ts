import { describe, expect, it } from 'vitest';
import Schema from 'async-validator';
import { saleFormRules } from '@/utils/sale-form';

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
