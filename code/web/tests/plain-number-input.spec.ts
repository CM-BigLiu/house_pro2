import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, ref, type App } from 'vue';
import { ElInput } from 'element-plus';
import PlainNumberInput from '@/components/PlainNumberInput.vue';

let app: App | undefined;
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = '';
});

describe('普通数字输入框', () => {
  it('保留数值模型，并在失焦时按范围和精度规范化', async () => {
    const amount = ref<number | undefined>(0);
    const root = document.createElement('div');
    document.body.append(root);
    app = createApp(defineComponent({
      components: { PlainNumberInput },
      setup: () => ({ amount }),
      template: '<PlainNumberInput v-model="amount" :min="0" :max="100" :precision="2" />',
    }));
    app.component('ElInput', ElInput);
    app.mount(root);
    const input = root.querySelector('input')!;
    input.value = '12.345';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await nextTick();

    expect(amount.value).toBe(12.345);
    expect(typeof amount.value).toBe('number');
    expect(input.getAttribute('min')).toBe('0');
    expect(input.getAttribute('step')).toBe('0.01');
    input.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect(amount.value).toBe(12.35);

    input.value = '101';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect(amount.value).toBe(100);
  });
});
