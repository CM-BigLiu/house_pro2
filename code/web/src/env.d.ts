// element-plus 中文语言包无类型声明，按官方 Language 结构补模块声明
declare module 'element-plus/dist/locale/zh-cn.mjs' {
  import type { Language } from 'element-plus/es/locale';
  const zhCn: Language;
  export default zhCn;
}
