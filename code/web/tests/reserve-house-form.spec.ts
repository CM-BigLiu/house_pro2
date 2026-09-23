import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import ReserveHouseFormView from '@/views/house/ReserveHouseFormView.vue';
import MoneyUppercase from '@/components/MoneyUppercase.vue';
import { createReserveProperty, getReservePropertyForEdit } from '@/api/reserve-property';

const { route } = vi.hoisted(() => ({ route: { params: { id: '' } } }));
vi.mock('vue-router', () => ({ useRoute: () => route, useRouter: () => ({ push: vi.fn() }) }));
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), warning: vi.fn() } }));
vi.mock('@/stores/dict', () => ({ useDictStore: () => ({ ensureLoaded: vi.fn().mockResolvedValue(undefined), getItems: () => [] }) }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ userInfo: { storeIds: [1] } }) }));
vi.mock('@/api/community', () => ({ getCommunities: vi.fn().mockResolvedValue({ list: [] }) }));
vi.mock('@/api/reserve-property', () => ({
  createReserveProperty: vi.fn().mockResolvedValue({}),
  getReservePropertyForEdit: vi.fn(),
  updateReserveProperty: vi.fn(),
}));

let app: App | undefined;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; vi.clearAllMocks(); });

async function mount() {
  const root = document.createElement('div');
  document.body.append(root);
  app = createApp(ReserveHouseFormView);
  app.component('MoneyUppercase', MoneyUppercase);
  app.directive('loading', {});
  app.config.warnHandler = () => {};
  app.component('ElFormItem', { props: ['label'], template: '<div :data-label="label"><slot /></div>' });
  const input = defineComponent({
    props: ['modelValue', 'disabled'], emits: ['update:modelValue'],
    template: '<input :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  });
  app.component('ElInput', input);
  app.component('PlainNumberInput', defineComponent({
    props: ['modelValue', 'disabled'], emits: ['update:modelValue'],
    template: '<input :value="modelValue" :disabled="disabled" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  }));
  app.mount(root);
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  return root;
}

describe('储备房源租售表单', () => {
  it('新增默认租房储备，只有业主姓名也能保存', async () => {
    route.params.id = '';
    const root = await mount();
    expect(root.querySelector('[data-label="预计客租价"]')).not.toBeNull();
    expect(root.querySelector('[data-label="预计房东押金"]')).not.toBeNull();
    expect(root.querySelector('[data-label="预计租客押金"]')).toBeNull();
    expect(root.querySelector('[data-label="房源类型"]')).toBeNull();
    const owner = root.querySelector('[data-label="房东姓名"] input') as HTMLInputElement;
    owner.value = '测试房东';
    owner.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();
    const save = [...root.querySelectorAll('button')].find(button => button.textContent === '保存');
    save!.click();
    await nextTick();
    expect(createReserveProperty).toHaveBeenCalledWith(expect.objectContaining({
      reserveType: 'rent', ownerName: '测试房东', storeId: 1,
      details: expect.objectContaining({ bizType: 'entire' }),
    }));
  });

  it('历史储备押金按房东押金回显', async () => {
    route.params.id = '9';
    vi.mocked(getReservePropertyForEdit).mockResolvedValue({
      id: 9, reserveType: 'rent', status: 'not_rented', ownerName: '测试房东',
      details: { bizType: 'entire', deposit: 2600 },
    } as Awaited<ReturnType<typeof getReservePropertyForEdit>>);
    const root = await mount();
    expect((root.querySelector('[data-label="预计房东押金"] input') as HTMLInputElement).value).toBe('2600');
    expect(root.querySelector('[data-label="预计租客押金"]')).toBeNull();
  });

  it('编辑售房储备时显示售房字段并自动计算单价', async () => {
    route.params.id = '8';
    vi.mocked(getReservePropertyForEdit).mockResolvedValue({
      id: 8, reserveType: 'sale', status: 'not_sold', ownerName: '测试业主',
      ownerQuote: 1000000, buildingArea: 80, details: { title: '测试售房', unitPrice: 1 },
    } as Awaited<ReturnType<typeof getReservePropertyForEdit>>);
    const root = await mount();
    expect(root.querySelector('[data-label="房源类型"]')).not.toBeNull();
    expect(root.textContent).toContain('人民币壹佰万元整');
    expect(root.querySelector('[data-label="预计客租价"]')).toBeNull();
    expect((root.querySelector('[data-label="单价(元/㎡)"] input') as HTMLInputElement).value).toBe('12500');
  });
});
