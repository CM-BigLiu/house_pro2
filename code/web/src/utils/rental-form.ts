// 新增、编辑共用校验；空置房源不强制录入租客。
export function rentalFormErrors(form: Record<string, any>, landlordRent: unknown, tenantRent: unknown) {
  const errors: Record<string, string> = {};
  const text = (key: string, label: string, value: unknown, required = true) => {
    if (required && (typeof value !== 'string' || !value.trim())) errors[key] = `请填写${label}`;
  };
  const amount = (key: string, label: string, value: unknown, positive = false, required = true) => {
    if (!required && (value === null || value === undefined || String(value).trim() === '')) return;
    if (value === null || value === undefined || !/^\d+(\.\d{1,2})?$/.test(String(value).trim()) || !Number.isFinite(Number(value)) || (positive && Number(value) <= 0)) {
      errors[key] = `${label}须为${positive ? '大于 0 的' : '非负'}数字，最多两位小数`;
    }
  };
  const phone = (key: string, value: unknown, required = false) => {
    if ((required || value) && !/^1\d{10}$/.test(String(value || '').trim())) errors[key] = '请填写 11 位手机号';
  };
  const dates = (key: string, start: string, end: string, required = false) => {
    if (!required && !start && !end) return;
    if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end))) errors[key] = '请选择完整有效的起止日期';
    else if (start > end) errors[key] = '结束日期不能早于开始日期';
  };
  for (const [key, label] of Object.entries({ code: '房源编码', address: '地址', building: '楼栋', unit: '单元', roomNo: '房号', layout: '户型' })) text(key, label, form[key]);
  if (!['entire', 'shared'].includes(form.bizType)) errors.bizType = '请选择租赁方式';
  if (!Number.isInteger(form.communityId) || form.communityId <= 0) errors.communityId = '请选择小区';
  amount('buildingArea', '面积', form.buildingArea, true);
  amount('landlordRent', '承租价', landlordRent);
  amount('landlordDeposit', '房东押金', form.landlordDeposit, false, false);
  phone('landlordPhone', form.landlordPhone);
  dates('leaseDateRange', form.leaseStart, form.leaseEnd);
  if (form.bizType === 'entire') {
    const occupied = ['rented', 'checkout'].includes(form.status) || !!(form.tenantName || form.tenantPhone);
    amount('rent', '客租价', tenantRent, false, occupied);
    amount('deposit', '租客押金', form.deposit, false, occupied);
    text('tenantName', '租客姓名', form.tenantName, occupied);
    phone('tenantPhone', form.tenantPhone, occupied);
    text('tenantPaymentMethod', '付款方式', form.tenantPaymentMethod, occupied);
    dates('tenantLeaseDateRange', form.tenantLeaseStart, form.tenantLeaseEnd, occupied);
  } else {
    const rooms = form.rooms || [];
    if (!rooms.length) errors.rooms = '合租房源至少需要一个房间';
    rooms.forEach((room: Record<string, any>, index: number) => {
      const prefix = `rooms.${index}.`;
      text(prefix + 'roomNo', '房间房号', room.roomNo);
      if (room.roomNo?.trim() && rooms.filter((other: any) => other.roomNo?.trim() === room.roomNo.trim()).length > 1) errors[prefix + 'roomNo'] = '房间房号不能重复';
      const occupied = ['rented', 'checkout'].includes(room.status) || !!(room.tenantName || room.tenantPhone);
      amount(prefix + 'rentPrice', '租金', room.rentPrice, false, occupied);
      amount(prefix + 'depositAmount', '押金', room.depositAmount, false, occupied);
      text(prefix + 'tenantName', '租客姓名', room.tenantName, occupied);
      phone(prefix + 'tenantPhone', room.tenantPhone, occupied);
      text(prefix + 'paymentMethod', '付款方式', room.paymentMethod, occupied);
      dates(prefix + 'leaseDateRange', room.leaseStart, room.leaseEnd, occupied);
    });
  }
  return errors;
}
