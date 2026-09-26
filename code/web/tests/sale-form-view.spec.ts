import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import SaleFormView from '@/views/house/SaleFormView.vue';
import MoneyUppercase from '@/components/MoneyUppercase.vue';
import { createSaleProperty, getSalePropertyForEdit, updateSaleProperty } from '@/api/sale';

const { route } = vi.hoisted(() => ({ route: { params: { id: '' } } }));
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn() } }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [], getLabel: (_: string, value: string) => value }) }));
vi.mock('@/api/community', () => ({ getCommunities: vi.fn().mockResolvedValue({ list: [] }) }));
vi.mock('@/api/sale', () => ({ getSalePropertyForEdit: vi.fn(), createSaleProperty: vi.fn(), updateSaleProperty: vi.fn() }));

let app: App | undefined;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; vi.clearAllMocks(); });

async function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  app = createApp(SaleFormView);
  app.component('MoneyUppercase', MoneyUppercase);
  app.directive('loading', {});
  app.config.warnHandler = () => {};
  app.component('ElSelect', defineComponent({
    props: { modelValue: [String, Number, Array], multiple: Boolean },
    emits: ['update:modelValue'],
    template: '<select :multiple="multiple" :value="modelValue" @change="$emit(\'update:modelValue\', multiple ? Array.from($event.target.selectedOptions, option => option.value) : $event.target.value)"><slot /></select>',
  }));
  app.component('ElOption', { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' });
  app.component('ElForm', defineComponent({
    setup(_props, { expose }) { expose({ validate: () => Promise.resolve(true) }); },
    template: '<form @submit.prevent><slot /></form>',
  }));
  app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label"><slot /></div>' });
  app.component('ElInput', defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<span><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><slot name="append" /></span>',
  }));
  app.component('ElButton', { template: '<button type="button"><slot /></button>' });
  app.component('ElTag', {
    emits: ['close'],
    template: '<span class="el-tag"><slot /><button type="button" aria-label="移除标签" @click="$emit(\'close\')">×</button></span>',
  });
  app.component('PlainNumberInput', defineComponent({
    props: ['modelValue', 'disabled'],
    emits: ['update:modelValue'],
    template: '<input type="number" :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  }));
  app.mount(root);
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  return root;
}

function input(root: HTMLElement, label: string) {
  return root.querySelector(`[data-label="${label}"] input`) as HTMLInputElement;
}

async function enterText(root: HTMLElement, label: string, value: string) {
  const field = input(root, label);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await nextTick();
}

async function save(root: HTMLElement) {
  [...root.querySelectorAll('button')].find(button => button.textContent?.trim() === '保存')!.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('售房新增编辑价格联动', () => {
  it('新增时修改售价和面积会更新单价和金额大写', async () => {
    route.params.id = '';
    const root = await mount();
    const area = input(root, '面积(㎡)');
    const price = input(root, '售价(元)');
    area.value = '80';
    area.dispatchEvent(new Event('input', { bubbles: true }));
    price.value = '1000000';
    price.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(input(root, '单价(元/㎡)').value).toBe('12500');
    expect(input(root, '单价(元/㎡)').disabled).toBe(true);
    expect(root.textContent).toContain('大写金额：人民币壹佰万元整');
    expect(root.querySelector('[data-label="单价(元/㎡)"]')?.textContent).toContain('人民币壹万贰仟伍佰元整');
  });

  it('编辑时用当前售价和面积重算旧单价', async () => {
    route.params.id = '7';
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({
      id: 7, totalPrice: 1000000, buildingArea: 80, unitPrice: 7,
    } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const root = await mount();

    expect(getSalePropertyForEdit).toHaveBeenCalledWith(7);
    expect(input(root, '单价(元/㎡)').value).toBe('12500');
    expect(root.textContent).toContain('人民币壹佰万元整');
  });
});

describe('售房税费保存与回显', () => {
  it('新增时多选税种显示金额行，取消选择后仅提交保留的税种及金额', async () => {
    route.params.id = '';
    const root = await mount();
    const select = root.querySelector<HTMLSelectElement>('[data-label="税费"] select')!;
    expect(select.multiple).toBe(true);
    expect([...select.options].map(option => option.textContent)).toEqual(['增值税', '增值税附加', '个税', '契税', '土地出让金', '综合地价款', '其他']);
    for (const option of select.options) option.selected = ['vat', 'deed'].includes(option.value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    await enterText(root, '增值税', '1234.56');
    expect(input(root, '契税')).not.toBeNull();
    for (const option of select.options) option.selected = option.value === 'vat';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(input(root, '契税')).toBeNull();
    expect(input(root, '增值税').value).toBe('1234.56');
    await save(root);
    expect(createSaleProperty).toHaveBeenCalledWith(expect.objectContaining({ taxFees: [{ type: 'vat', amount: 1234.56 }] }));
  });

  it('编辑回显多税种的零金额和待填金额，并可全部清空保存', async () => {
    route.params.id = '7';
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({ id: 7, taxFees: [{ type: 'personal', amount: 0 }, { type: 'other', amount: null }] } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const root = await mount();
    expect(input(root, '个税').value).toBe('0');
    expect(input(root, '其他').value).toBe('');
    const select = root.querySelector<HTMLSelectElement>('[data-label="税费"] select')!;
    for (const option of select.options) option.selected = false;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(input(root, '个税')).toBeNull();
    await save(root);
    expect(updateSaleProperty).toHaveBeenCalledWith(7, expect.objectContaining({ taxFees: [] }));
  });

  it('兼容旧个税记录，但明确清空的税费不会被旧字段重新选中', async () => {
    route.params.id = '7';
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({ id: 7, taxType: 'personal' } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const root = await mount();
    expect(input(root, '个税')).not.toBeNull();
    app?.unmount();
    root.remove();
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({ id: 7, taxType: 'personal', taxFees: [] } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const cleared = await mount();
    expect(input(cleared, '个税')).toBeNull();
  });
});

describe('售房标签保存与回显', () => {
  it('新增时未按回车的标签也会保存，重新编辑并修改标题后仍然保留', async () => {
    route.params.id = '';
    const createRoot = await mount();
    await enterText(createRoot, '标签', ' 学区房 ');
    await save(createRoot);

    expect(createSaleProperty).toHaveBeenCalledWith(expect.objectContaining({ tags: ['学区房'] }));
    const created = vi.mocked(createSaleProperty).mock.calls[0][0];
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({
      ...created, id: 7, tags: [...created.tags!],
    } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    app?.unmount();
    createRoot.remove();

    route.params.id = '7';
    const editRoot = await mount();
    expect(editRoot.querySelector('[data-label="标签"] .el-tag')?.textContent).toContain('学区房');
    await enterText(editRoot, '房源标题', '修改后的标题');
    await save(editRoot);
    expect(updateSaleProperty).toHaveBeenCalledWith(7, expect.objectContaining({ title: '修改后的标题', tags: ['学区房'] }));
  });

  it('编辑时保留已有标签，新增标签可直接保存，重复回车添加不会重复', async () => {
    route.params.id = '7';
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({
      id: 7, tags: ['满五唯一', '近地铁'],
    } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const root = await mount();
    expect(root.querySelectorAll('[data-label="标签"] .el-tag')).toHaveLength(2);
    await enterText(root, '标签', '近地铁');
    input(root, '标签').dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(root.querySelectorAll('[data-label="标签"] .el-tag')).toHaveLength(2);

    await enterText(root, '标签', '采光好');
    await save(root);
    expect(updateSaleProperty).toHaveBeenCalledWith(7, expect.objectContaining({ tags: ['满五唯一', '近地铁', '采光好'] }));
  });

  it('明确移除全部标签后保存空数组', async () => {
    route.params.id = '7';
    vi.mocked(getSalePropertyForEdit).mockResolvedValue({
      id: 7, tags: ['学区房'],
    } as Awaited<ReturnType<typeof getSalePropertyForEdit>>);
    const root = await mount();
    (root.querySelector('[aria-label="移除标签"]') as HTMLButtonElement).click();
    await nextTick();
    expect(root.querySelectorAll('[data-label="标签"] .el-tag')).toHaveLength(0);
    await save(root);
    expect(updateSaleProperty).toHaveBeenCalledWith(7, expect.objectContaining({ tags: [] }));
  });
});
