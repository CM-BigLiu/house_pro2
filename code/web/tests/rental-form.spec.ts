import { describe, expect, it } from 'vitest';
import { rentalFormErrors } from '@/utils/rental-form';
const valid = { code: 'ZJ-TEST', bizType: 'entire', communityId: 1, address: '测试地址', building: '1', unit: '1', roomNo: '101', layout: '两室一厅', buildingArea: 80, deposit: 0, status: 'vacant', rooms: [] };
describe('租房新增编辑共用校验', () => {
  it('空置房源不要求租客，允许零押金', () => expect(rentalFormErrors(valid, '1000', '2000')).toEqual({}));
  it.each(['code','communityId','address','building','unit','roomNo','layout','buildingArea'])('%s 缺失时报错', key => expect(rentalFormErrors({ ...valid, [key]: undefined }, 1000, 2000)[key]).toBeTruthy());
  it.each(['', 'abc', '-1', '1.234', 'Infinity', null])('非法金额 %s 被拒绝', amount => expect(rentalFormErrors(valid, amount, amount)).toHaveProperty('landlordRent'));
  it('手机号和倒置日期报错', () => {
    const result = rentalFormErrors({ ...valid, landlordPhone: '123', leaseStart: '2026-09-10', leaseEnd: '2026-09-01' }, 1, 1);
    expect(result.landlordPhone).toBeTruthy(); expect(result.leaseDateRange).toBeTruthy();
  });
  it('录入租客或已出租时须补齐租赁信息', () => {
    const result = rentalFormErrors({ ...valid, status: 'rented' }, 1, 1);
    for (const key of ['tenantName','tenantPhone','tenantPaymentMethod','tenantLeaseDateRange']) expect(result[key]).toBeTruthy();
  });
  it('已出租房源完整信息允许编辑保存', () => expect(rentalFormErrors({ ...valid, status: 'rented', tenantName: '测试租客', tenantPhone: '13800138000', tenantPaymentMethod: 'monthly', tenantLeaseStart: '2026-09-01', tenantLeaseEnd: '2027-08-31' }, 1, 1)).toEqual({}));
  it('合租不能为空，房号不能重复，金额不能非法', () => {
    expect(rentalFormErrors({ ...valid, bizType: 'shared' }, 1, 1).rooms).toBeTruthy();
    const result = rentalFormErrors({ ...valid, bizType: 'shared', rooms: [{ roomNo: 'A', rentPrice: -1, depositAmount: 0 }, { roomNo: ' A ', rentPrice: 1, depositAmount: 0 }] }, 1, 1);
    expect(result['rooms.0.roomNo']).toBeTruthy(); expect(result['rooms.1.roomNo']).toBeTruthy(); expect(result['rooms.0.rentPrice']).toBeTruthy();
  });
  it('合租空房间可保存，已租房间缺少电话不能保存', () => {
    const room = { roomNo: 'A', rentPrice: 1000, depositAmount: 0, status: 'vacant' };
    expect(rentalFormErrors({ ...valid, bizType: 'shared', rooms: [room] }, 1, 1)).toEqual({});
    expect(rentalFormErrors({ ...valid, bizType: 'shared', rooms: [{ ...room, status: 'rented' }] }, 1, 1)['rooms.0.tenantPhone']).toBeTruthy();
  });
});
