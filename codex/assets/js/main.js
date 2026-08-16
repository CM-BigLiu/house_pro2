/* 原型通用交互 */
document.addEventListener('DOMContentLoaded', function() {
  // 初始化 Lucide 图标
  if (window.lucide) {
    lucide.createIcons();
  }

  // 移动端菜单切换
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });
  }

  // 侧边栏分组展开
  const navItems = document.querySelectorAll('.nav-item[data-toggle]');
  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      item.classList.toggle('expanded');
      const subnav = item.nextElementSibling;
      if (subnav && subnav.classList.contains('subnav')) {
        subnav.classList.toggle('show');
      }
      if (window.lucide) {
        lucide.createIcons();
      }
    });
  });

  // Tab 切换
  const tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      const group = tab.closest('[data-tab-group]');
      if (!group) return;
      const target = tab.getAttribute('data-tab');
      group.querySelectorAll('[data-tab]').forEach(function(t) { t.classList.remove('active'); });
      group.querySelectorAll('[data-tab-panel]').forEach(function(p) { p.classList.add('hidden'); });
      tab.classList.add('active');
      const panel = group.querySelector('[data-tab-panel="' + target + '"]');
      if (panel) panel.classList.remove('hidden');
    });
  });
});
