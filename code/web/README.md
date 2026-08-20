# 房屋租售管理系统 · 前端

基于 Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router 4 构建。

## 快速启动

```bash
cd code/web
npm install
npm run dev
```

默认打开 `http://localhost:5173`，代理 `/api` 到后端 `http://localhost:3000`。

## 默认账号

- `super_admin` / `123456`（全部权限）
- `store_manager` / `123456`（店长）
- `salesman` / `123456`（业务员）

## 项目结构

```
src/
  api/              按模块封装的 axios 请求
  components/       公共组件
    Layout/         AppSidebar、AppHeader
    Common/         业务通用组件
    Dashboard/      首页 KPI、预警、排行榜、大卡片
  directives/       v-permission 指令
  hooks/            useDict 等组合式函数
  router/           路由配置与动态路由
  stores/           Pinia 状态：user、dict
  styles/           设计变量与全局样式
  utils/            请求封装、格式化工具
  views/            页面视图
    login/          登录页
    dashboard/      首页看板
    house/          房屋管理 6 页面
    finance/        财务管理 12 页面
    system/         系统管理 4 页面
    wizard/         统一 4 步房源录入向导
```

## 技术要点

- 动态路由：登录后根据 `/api/auth/menus` 过滤并注册路由。
- 按钮权限：`v-permission="['sale:add']"`。
- 字典驱动：`useDictStore().ensureLoaded(['house_status'])` + `getLabel(code, value)`。
- 样式变量：移植高保真设计稿，深色侧边栏 `#0d1526`、主色 `#2e6bf0`、玻璃顶栏。

## 脚本

- `npm run dev`：启动开发服务器
- `npm run build`：生产构建
- `npm run preview`：预览生产包
- `npm run lint`：ESLint 自动修复
