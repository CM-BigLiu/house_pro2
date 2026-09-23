import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, ref, type App } from 'vue';
import MoneyUppercase from '@/components/MoneyUppercase.vue';

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
});

describe('金额大写提示', () => {
  it('金额变化时实时更新，空值或无效输入不显示', async () => {
    const value = ref<number | string>('');
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(defineComponent({
      components: { MoneyUppercase },
      setup: () => ({ value }),
      template: '<MoneyUppercase :value="value" />',
    }));
    app.mount(root);

    expect(root.textContent).toBe('');
    value.value = 1234.56;
    await nextTick();
    expect(root.textContent).toContain('大写金额：人民币壹仟贰佰叁拾肆元伍角陆分');

    value.value = 0;
    await nextTick();
    expect(root.textContent).toContain('人民币零元整');

    value.value = 'abc';
    await nextTick();
    expect(root.textContent).toBe('');
  });
});
