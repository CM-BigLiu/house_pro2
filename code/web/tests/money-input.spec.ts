import { createApp, nextTick, type App } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MoneyInput from '@/components/MoneyInput.vue';
let app: App;
afterEach(() => { app?.unmount(); document.body.innerHTML = ''; });
async function mount() {
  const update = vi.fn();
  const root = document.createElement('div'); document.body.append(root);
  app = createApp(MoneyInput, { modelValue: 0, 'onUpdate:modelValue': update });
  app.component('ElInput', { props: ['modelValue'], emits: ['update:modelValue', 'blur'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'blur\')" />' });
  app.mount(root); await nextTick();
  return { root, input: root.querySelector('input')!, update };
}
describe('金额输入框', () => {
  it('显示两位小数，输入使用文本框并输出数值金额', async () => {
    const { input, update } = await mount();
    expect(input.type).toBe('text'); expect(input.value).toBe('0.00');
    input.value = '12.3'; input.dispatchEvent(new Event('input')); await nextTick();
    expect(update).toHaveBeenLastCalledWith(12.3);
    input.dispatchEvent(new Event('blur')); await nextTick(); expect(input.value).toBe('12.30');
  });
  it.each(['abc', '-1', '1e3', '12.345'])('非法金额 %s 显示校验且不能成为有效数值', async value => {
    const { input, update, root } = await mount();
    input.value = value; input.dispatchEvent(new Event('input')); await nextTick();
    expect(update).toHaveBeenLastCalledWith(Number.NaN);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('最多两位小数');
  });
});
