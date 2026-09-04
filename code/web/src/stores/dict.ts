import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getDictItems, type DictItem } from '@/api/system';

export const useDictStore = defineStore('dict', () => {
  const dictMap = ref<Record<string, DictItem[]>>({});
  const labelMap = ref<Record<string, Record<string, string>>>({});
  const loadedCodes = ref<Set<string>>(new Set());

  const ensureLoaded = async (codes: string[]) => {
    const missing = codes.filter((code) => !loadedCodes.value.has(code) || !dictMap.value[code]?.length);
    if (!missing.length) return;
    await Promise.all(
      missing.map(async (code) => {
        const items = await getDictItems(code);
        dictMap.value[code] = items;
        labelMap.value[code] = items.reduce((acc, item) => {
          acc[item.value] = item.label;
          return acc;
        }, {} as Record<string, string>);
        loadedCodes.value.add(code);
      }),
    );
  };

  const getItems = (code: string) => dictMap.value[code] || [];
  const getLabel = (code: string, value?: string) => (value ? labelMap.value[code]?.[value] : undefined) || value || '-';

  return { dictMap, labelMap, loadedCodes, ensureLoaded, getItems, getLabel };
});
