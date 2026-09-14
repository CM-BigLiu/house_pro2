import type { FormRules } from 'element-plus';

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
