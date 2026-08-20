import { ref, onMounted } from 'vue';
import { getDictItems } from '@/api/system';

export function useDict(code: string) {
  const options = ref<{ label: string; value: string }[]>([]);
  const loading = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      options.value = await getDictItems(code);
    } finally {
      loading.value = false;
    }
  };

  onMounted(load);

  return { options, loading, load };
}

export function useDictMap(codes: string[]) {
  const maps = ref<Record<string, Record<string, string>>>({});
  const loading = ref(false);

  const load = async () => {
    loading.value = true;
    try {
      const entries = await Promise.all(
        codes.map(async (code) => {
          const items = await getDictItems(code);
          const map: Record<string, string> = {};
          items.forEach((item) => {
            map[item.value] = item.label;
          });
          return [code, map] as const;
        }),
      );
      maps.value = Object.fromEntries(entries);
    } finally {
      loading.value = false;
    }
  };

  onMounted(load);

  return { maps, loading, load };
}
