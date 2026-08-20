import type { DirectiveBinding } from 'vue';
import { useUserStore } from '@/stores/user';

export const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { permissions } = useUserStore();
    const required = Array.isArray(binding.value) ? binding.value : [binding.value];
    const has = required.some((code) => permissions.includes('*') || permissions.includes(code));
    if (!has && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};
