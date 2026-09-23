import type { FormRules } from 'element-plus';

export function calculateUnitPrice(totalPrice: unknown, buildingArea: unknown): number {
  const price = Number(totalPrice);
  const area = Number(buildingArea);
  if (!Number.isFinite(price) || !Number.isFinite(area) || price <= 0 || area <= 0) return 0;
  return Number((price / area).toFixed(2));
}

export function formatRmbUppercase(value: unknown): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return '';

  const digits = '零壹贰叁肆伍陆柒捌玖';
  const places = ['', '拾', '佰', '仟'];
  const groups = ['', '万', '亿'];
  const cents = Math.round(amount * 100);
  const yuan = Math.floor(cents / 100);
  let integerText = '';
  let skippedGroup = false;

  for (let groupIndex = groups.length - 1; groupIndex >= 0; groupIndex--) {
    const group = Math.floor(yuan / 10000 ** groupIndex) % 10000;
    if (!group) {
      if (integerText) skippedGroup = true;
      continue;
    }
    if (integerText && (skippedGroup || group < 1000)) integerText += '零';
    let groupText = '';
    let pendingZero = false;
    for (let place = 3; place >= 0; place--) {
      const digit = Math.floor(group / 10 ** place) % 10;
      if (!digit) {
        if (groupText) pendingZero = true;
      } else {
        if (pendingZero) groupText += '零';
        groupText += digits[digit] + places[place];
        pendingZero = false;
      }
    }
    integerText += groupText + groups[groupIndex];
    skippedGroup = false;
  }

  const jiao = Math.floor(cents % 100 / 10);
  const fen = cents % 10;
  const fractionText = !jiao && !fen
    ? '整'
    : `${jiao ? digits[jiao] + '角' : ''}${fen ? (jiao ? '' : '零') + digits[fen] + '分' : ''}`;
  return `${integerText || '零'}元${fractionText}`;
}

const textRule = (label: string, max: number) => [
  { required: true, whitespace: true, message: `请填写${label}`, trigger: 'blur' },
  { max, message: `${label}不能超过 ${max} 个字符`, trigger: 'blur' },
];
const choiceRule = (label: string) => [{ required: true, message: `请选择${label}`, trigger: 'change' }];
const countRule = (label: string) => [{
  required: true,
  validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
    callback(typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? undefined : new Error(`${label}必须为大于等于 0 的整数`));
  },
  trigger: ['blur', 'change'],
}];

export const saleFormRules: FormRules = {
  code: textRule('房源编码', 50),
  title: textRule('房源标题', 255),
  communityId: [{ required: true, type: 'integer', min: 1, message: '请选择小区', trigger: 'change' }],
  propertyType: choiceRule('房源类型'),
  building: textRule('楼栋', 50), unit: textRule('单元', 50),
  floor: textRule('楼层', 50), roomNo: textRule('房号', 50),
  layoutRooms: countRule('室数'), layoutHalls: countRule('厅数'),
  layoutBathrooms: countRule('卫数'), layoutBalconies: countRule('阳台数'),
  buildingArea: [{ required: true, type: 'number', min: 0.01, message: '面积必须大于 0', trigger: ['blur', 'change'] }],
  totalPrice: [{ required: true, type: 'number', min: 0.01, message: '售价必须大于 0', trigger: ['blur', 'change'] }],
  unitPrice: [{ type: 'number', min: 0, message: '单价不能小于 0', trigger: ['blur', 'change'] }],
  orientation: choiceRule('朝向'), decoration: choiceRule('装修'),
  elevator: choiceRule('电梯情况'), sourceChannel: choiceRule('来源'),
  ownerName: textRule('业主姓名', 50),
  ownerPhone: [
    { required: true, message: '请填写业主电话', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请填写 11 位业主手机号', trigger: 'blur' },
  ],
};
