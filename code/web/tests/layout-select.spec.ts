/* eslint-disable vue/one-component-per-file, vue/require-default-prop */
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, ref, type App } from 'vue';
import LayoutSelect from '@/components/LayoutSelect.vue';
import { COMMON_LAYOUT_OPTIONS, formatLayoutLabel, parseLayoutLabel } from '@/utils/layout-options';

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
  localStorage.clear();
});

describe('户型选项', () => {
  it('提供常用户型并兼容中文与数字格式', () => {
    expect(COMMON_LAYOUT_OPTIONS).toContain('2室1厅1卫');
    expect(parseLayoutLabel('2室1厅1卫1阳台')).toEqual({ rooms: 2, halls: 1, bathrooms: 1, balconies: 1 });
    expect(parseLayoutLabel('三室两厅')).toEqual({ rooms: 3, halls: 2, bathrooms: 1, balconies: 0 });
    expect(parseLayoutLabel('复式')).toBeNull();
    expect(formatLayoutLabel({ rooms: 4, halls: 2, bathrooms: 2, balconies: 1 })).toBe('4室2厅2卫1阳台');
  });

  it('下拉框开启筛选和创建，并把手动输入的新户型写回表单', async () => {
    const host = defineComponent({
      components: { LayoutSelect },
      setup() {
        const layout = ref('');
        return { layout };
      },
      template: '<LayoutSelect v-model="layout" /><output>{{ layout }}</output>',
    });
    const elSelect = defineComponent({
      props: { modelValue: String, filterable: Boolean, allowCreate: Boolean, defaultFirstOption: Boolean },
      emits: ['change'],
      template: '<button data-select :data-filterable="filterable" :data-allow-create="allowCreate" :data-default-first="defaultFirstOption" @click="$emit(\'change\', \'6室3厅2卫1阳台\')"><slot /></button>',
    });
    const elOption = defineComponent({
      props: { label: String, value: String },
      template: '<span class="layout-option">{{ label }}</span>',
    });
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(host);
    app.component('ElSelect', elSelect);
    app.component('ElOption', elOption);
    app.mount(root);

    const select = root.querySelector<HTMLButtonElement>('[data-select]')!;
    expect(select.dataset.filterable).toBe('true');
    expect(select.dataset.allowCreate).toBe('true');
    expect(select.dataset.defaultFirst).toBe('true');
    expect([...root.querySelectorAll('.layout-option')].map(item => item.textContent)).toContain('2室1厅1卫');

    select.click();
    await nextTick();
    expect(root.querySelector('output')?.textContent).toBe('6室3厅2卫1阳台');
    expect(JSON.parse(localStorage.getItem('house_custom_layouts') || '[]')).toContain('6室3厅2卫1阳台');
  });
});
