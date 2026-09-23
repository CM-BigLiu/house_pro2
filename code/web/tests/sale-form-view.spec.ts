import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import SaleFormView from '@/views/house/SaleFormView.vue';
import MoneyUppercase from '@/components/MoneyUppercase.vue';
import { getSalePropertyForEdit } from '@/api/sale';

const { route } = vi.hoisted(() => ({ route: { params: { id: '' } } }));
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn() } }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [] }) }));
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
  app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label"><slot /></div>' });
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
