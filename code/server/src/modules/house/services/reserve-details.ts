import { BadRequestException } from '@nestjs/common';

export type ReserveType = 'rent' | 'sale';

const rentStrings = [
  'bizType', 'building', 'unit', 'leaseStart', 'leaseEnd', 'rentFreePeriod',
  'tenantName', 'tenantPhone', 'tenantPaymentMethod', 'tenantLeaseStart', 'tenantLeaseEnd',
];
const rentNumbers = ['landlordRent', 'landlordDeposit', 'rent', 'deposit'];
const saleStrings = [
  'title', 'propertyType', 'building', 'unit', 'floor', 'orientation', 'elevator',
  'taxType', 'certificateType', 'ownerPhoneBackup', 'description',
];
const saleNumbers = [
  'layoutRooms', 'layoutHalls', 'layoutBathrooms', 'layoutBalconies',
  'interiorArea', 'buildYear', 'unitPrice', 'floorPrice', 'debt',
];
const roomStrings = [
  'roomNo', 'roomType', 'status', 'paymentMethod', 'leaseTerm',
  'tenantName', 'tenantPhone', 'leaseStart', 'leaseEnd',
];
const roomNumbers = ['rentPrice', 'listedPrice', 'depositAmount'];

function pickFields(
  input: Record<string, unknown>,
  stringFields: string[],
  numberFields: string[],
  context: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of stringFields) {
    const value = input[key];
    if (value == null) continue;
    if (typeof value !== 'string') throw new BadRequestException(`${context}.${key} 必须是文本`);
    result[key] = value.trim();
  }
  for (const key of numberFields) {
    const value = input[key];
    if (value == null || value === '') continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`${context}.${key} 必须是非负数字`);
    }
    result[key] = value;
  }
  return result;
}

export function sanitizeReserveDetails(type: ReserveType, input?: Record<string, unknown> | null) {
  if (input == null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('储备房源详情格式错误');

  if (type === 'rent') {
    const result = pickFields(input, rentStrings, rentNumbers, '租房详情');
    // 历史储备数据使用 deposit 保存收房押金，统一归一为房东押金。
    if (result.landlordDeposit == null && result.deposit != null) {
      result.landlordDeposit = result.deposit;
    }
    delete result.deposit;
    if (result.bizType && !['entire', 'shared'].includes(result.bizType as string)) {
      throw new BadRequestException('租赁方式无效');
    }
    if (input.rooms != null) {
      if (!Array.isArray(input.rooms)) throw new BadRequestException('房间明细必须是数组');
      result.rooms = input.rooms.map((room, index) => {
        if (!room || typeof room !== 'object' || Array.isArray(room)) {
          throw new BadRequestException(`房间明细 ${index + 1} 格式错误`);
        }
        return pickFields(room, roomStrings, roomNumbers, `房间 ${index + 1}`);
      });
    }
    return result;
  }

  const result = pickFields(input, saleStrings, saleNumbers, '售房详情');
  if (input.isCitywideSale != null) {
    if (typeof input.isCitywideSale !== 'boolean') throw new BadRequestException('全城区售必须是布尔值');
    result.isCitywideSale = input.isCitywideSale;
  }
  if (input.tags != null) {
    if (!Array.isArray(input.tags) || !input.tags.every(tag => typeof tag === 'string')) {
      throw new BadRequestException('标签必须是文本数组');
    }
    result.tags = input.tags.map(tag => tag.trim()).filter(Boolean);
  }
  return result;
}
