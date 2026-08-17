/* 原型通用交互：使用事件委托，支持角色切换后重新渲染的内容 */
(function() {
  const actionNames = {
    'search': '搜索', 'bell': '通知', 'heart': '收藏', 'qr-code': '收款码',
    'chevron-left': '上一页', 'chevron-right': '下一页', 'home': '首页', 'circle-help': '帮助'
  };

  function getIconName(element) {
    const icon = element.querySelector('[data-lucide]');
    if (icon) return icon.getAttribute('data-lucide');
    const svg = element.querySelector('svg');
    if (!svg) return null;
    return Object.keys(actionNames).find(name => svg.classList.contains('lucide-' + name));
  }

  function getActionName(element) {
    return element.getAttribute('aria-label') || element.getAttribute('title') ||
      (element.innerText || '').trim() || actionNames[getIconName(element)] || '操作';
  }

  function showToast(message) {
    let toast = document.querySelector('.prototype-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'prototype-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    window.clearTimeout(showToast.timer);
    toast.classList.add('show');
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function setActive(group, target) {
    group.querySelectorAll('.active').forEach(item => item.classList.remove('active'));
    target.classList.add('active');
  }

  function setupMenu() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('[data-menu-toggle]');
    if (!sidebar || !menuToggle) return;

    let backdrop = document.querySelector('.sidebar-backdrop');
    let closeButton = sidebar.querySelector('[data-menu-close]');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      sidebar.insertAdjacentElement('afterend', backdrop);
    }
    const brand = sidebar.querySelector('.brand');
    if (!closeButton && brand) {
      closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'icon-btn sidebar-close';
      closeButton.setAttribute('data-menu-close', '');
      closeButton.setAttribute('aria-label', '收起菜单');
      closeButton.textContent = '✕';
      brand.appendChild(closeButton);
    }

    function setMenuOpen(open) {
      sidebar.classList.toggle('open', open);
      const current = document.querySelector('[data-menu-toggle]');
      if (current) current.setAttribute('aria-expanded', String(open));
    }

    document.addEventListener('click', function(event) {
      if (event.target.closest('[data-menu-toggle]')) {
        event.preventDefault();
        setMenuOpen(!sidebar.classList.contains('open'));
      } else if (event.target.closest('[data-menu-close], .sidebar-backdrop')) {
        setMenuOpen(false);
      } else if (event.target.closest('.nav-item[data-toggle]')) {
        event.preventDefault();
        const item = event.target.closest('.nav-item[data-toggle]');
        item.classList.toggle('expanded');
        const subnav = item.nextElementSibling;
        if (subnav && subnav.classList.contains('subnav')) subnav.classList.toggle('show');
      }
    });

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') setMenuOpen(false);
      if ((event.key === 'Enter' || event.key === ' ') && document.activeElement.classList.contains('tab')) {
        event.preventDefault();
        document.activeElement.click();
      }
    });

    window.matchMedia('(max-width: 768px)').addEventListener('change', event => {
      if (!event.matches) setMenuOpen(false);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    setupMenu();
    document.querySelectorAll('.tab').forEach(tab => {
      if (!tab.hasAttribute('tabindex')) tab.setAttribute('tabindex', '0');
    });
  });

  document.addEventListener('click', function(event) {
    const ownerVerify = event.target.closest('[data-owner-verify]');
    if (ownerVerify) {
      const dialog = document.querySelector('[data-blacklist-dialog]');
      if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
      else showToast('原型演示：业主电话触发黑名单校验');
      return;
    }

    const dialogClose = event.target.closest('[data-dialog-close]');
    if (dialogClose) {
      const dialog = dialogClose.closest('dialog[open]');
      if (dialog) dialog.close();
      return;
    }

    const tagButton = event.target.closest('.tag-select button');
    if (tagButton) {
      tagButton.classList.toggle('active');
      return;
    }

    const demoControl = event.target.closest('.upload-card, .quick-entry-grid button');
    if (demoControl) {
      showToast('原型演示：「' + getActionName(demoControl) + '」已响应');
      return;
    }

    const wizardStepButton = event.target.closest('[data-wizard-step]');
    if (wizardStepButton) {
      const index = wizardStepButton.getAttribute('data-wizard-step');
      document.querySelectorAll('.wizard-step').forEach(item => item.classList.toggle('active', item === wizardStepButton));
      document.querySelectorAll('.wizard-step-panel').forEach(panel => panel.classList.toggle('active', panel.getAttribute('data-wizard-panel') === index));
      return;
    }

    const wizardPrev = event.target.closest('[data-wizard-prev]');
    if (wizardPrev) {
      const active = document.querySelector('.wizard-step.active');
      if (active && active.previousElementSibling) active.previousElementSibling.click();
      return;
    }

    const wizardNext = event.target.closest('[data-wizard-next]');
    if (wizardNext) {
      const active = document.querySelector('.wizard-step.active');
      if (active && active.nextElementSibling && active.nextElementSibling.hasAttribute('data-wizard-step')) active.nextElementSibling.click();
      else showToast('原型演示：已到最后一步，可点击发布生成房源码');
      return;
    }

    const tab = event.target.closest('.tab');
    if (tab) {
      const group = tab.closest('.tabs');
      if (group) setActive(group, tab);
      /* Tab 切换数据面板（§5.2 列表多视图） */
      const host = document.getElementById('tab-panel-host');
      const page = window.__CURRENT_PAGE;
      if (host && page && group && group.hasAttribute('data-tab-host') && window.__renderTabPanel) {
        const index = Number(tab.getAttribute('data-tab-index') || 0);
        host.innerHTML = window.__renderTabPanel(page, index);
        if (window.lucide) lucide.createIcons();
      }
      return;
    }

    const statusTab = event.target.closest('.status-tab');
    if (statusTab) {
      setActive(statusTab.parentElement, statusTab);
      return;
    }

    const viewButton = event.target.closest('.view-switch button');
    if (viewButton) {
      setActive(viewButton.parentElement, viewButton);
      return;
    }

    const pageButton = event.target.closest('.page-btn');
    if (pageButton) {
      const pagination = pageButton.closest('.pagination');
      const pages = Array.from(pagination.querySelectorAll('.page-btn')).filter(item => /^\d+$/.test((item.innerText || '').trim()));
      const numeric = pages.find(item => item.innerText.trim() === pageButton.innerText.trim());
      if (numeric) {
        pages.forEach(item => item.classList.remove('active'));
        numeric.classList.add('active');
        return;
      }
      const current = pages.findIndex(item => item.classList.contains('active'));
      const isPrev = pageButton.querySelector('[data-lucide="chevron-left"], .lucide-chevron-left') || pageButton.innerText.trim() === '«';
      const offset = isPrev ? -1 : 1;
      const target = pages[Math.max(0, Math.min(pages.length - 1, current + offset))];
      if (target) target.click();
      return;
    }

    const placeholder = event.target.closest('button.btn, button.icon-btn:not([data-menu-toggle]):not([data-menu-close]), a[href="#"]');
    if (!placeholder || placeholder.disabled) return;
    if (placeholder.tagName === 'A') event.preventDefault();
    if (!placeholder.getAttribute('aria-label') && !(placeholder.innerText || '').trim()) {
      const iconName = getIconName(placeholder);
      if (iconName && actionNames[iconName]) placeholder.setAttribute('aria-label', actionNames[iconName]);
    }
      showToast('原型演示：「' + getActionName(placeholder) + '」已响应');
  });

  document.addEventListener('change', function(event) {
    const typeSelect = event.target.closest('[data-wizard-type]');
    if (!typeSelect) return;
    const params = new URLSearchParams(window.location.search);
    params.set('type', typeSelect.value);
    window.location.search = params.toString();
  });
})();

/* 高保真增强：树节点选中 */
document.addEventListener('click', function(event) {
  const node = event.target.closest('.tree li > span');
  if (!node) return;
  const tree = node.closest('.tree');
  tree.querySelectorAll('li.active').forEach(item => item.classList.remove('active'));
  node.parentElement.classList.add('active');
});

/* 高保真增强：删图模式开关（§5.2.4 / UX-007） */
document.addEventListener('click', function(event) {
  const toggle = event.target.closest('[data-toggle-no-image]');
  if (!toggle) return;
  event.preventDefault();
  const content = document.querySelector('.content');
  if (!content) return;
  const off = content.classList.toggle('no-image');
  toggle.classList.toggle('is-on', off);
});

/* 高保真增强：售房排序区单选（§5.2.4） */
document.addEventListener('click', function(event) {
  const button = event.target.closest('.sort-bar button');
  if (!button) return;
  button.parentElement.querySelectorAll('button.active').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
});

/* 高保真增强：首页设置关闭待办自动弹出（UX-001 / UX-002，原型按会话暂存） */
document.addEventListener('click', function(event) {
  const setting = event.target.closest('[data-dismiss-todo]');
  if (!setting) return;
  try { sessionStorage.setItem('todo-dialog-off', '1'); } catch (err) { /* 忽略 */ }
});

/* 高保真增强：更多筛选折叠展开（§5.2.3 快速筛选 + 详细筛选） */
document.addEventListener('click', function(event) {
  const moreBtn = event.target.closest('[data-more-filters]');
  if (!moreBtn) return;
  const bar = moreBtn.closest('.filter-bar');
  const more = bar && bar.querySelector('.filter-more');
  if (!more) return;
  const open = more.classList.toggle('open');
  moreBtn.setAttribute('aria-expanded', String(open));
  moreBtn.classList.toggle('is-on', open);
  const label = moreBtn.querySelector('span');
  if (label) label.textContent = open ? '收起筛选' : '更多筛选';
});

/* 高保真增强：角色管理 —— 左侧角色列表切换（§3.1） */
document.addEventListener('click', function(event) {
  const item = event.target.closest('.role-item');
  if (!item) return;
  const list = item.closest('.role-list');
  list.querySelectorAll('.role-item.active').forEach(el => el.classList.remove('active'));
  item.classList.add('active');
});

/* 高保真增强：菜单权限树父子级联勾选 */
document.addEventListener('change', function(event) {
  const checkbox = event.target.closest('.perm-tree input[type="checkbox"]');
  if (!checkbox) return;
  const li = checkbox.closest('li');
  /* 父 -> 子 */
  li.querySelectorAll('ul input[type="checkbox"]').forEach(child => { child.checked = checkbox.checked; });
  /* 子 -> 父：任一子勾选则父勾选，全部取消则父取消 */
  let parentLi = li.parentElement && li.parentElement.closest('li');
  while (parentLi) {
    const box = parentLi.querySelector(':scope > .perm-node input[type="checkbox"]');
    const children = parentLi.querySelectorAll(':scope > ul input[type="checkbox"]');
    if (box) box.checked = Array.from(children).some(child => child.checked);
    parentLi = parentLi.parentElement && parentLi.parentElement.closest('li');
  }
});

/* 高保真增强：角色配置保存 */
document.addEventListener('click', function(event) {
  const save = event.target.closest('[data-role-save]');
  if (!save) return;
  event.preventDefault();
  const active = document.querySelector('.role-item.active strong');
  showGlobalToast(`原型演示：角色「${active ? active.textContent : ''}」权限配置已保存`);
});

/* 高保真增强：向导跟进内容字数统计（0/500） */
document.addEventListener('input', function(event) {
  const textarea = event.target.closest('[data-char-count]');
  if (!textarea) return;
  const counter = textarea.parentElement.querySelector('[data-char-count-num]');
  if (counter) counter.textContent = textarea.value.length;
});

/* 高保真增强：向导发布校验（业主电话必填） */
document.addEventListener('click', function(event) {
  const submit = event.target.closest('[data-wizard-submit]');
  if (!submit) return;
  event.preventDefault();
  const phone = document.querySelector('[data-owner-phone]');
  if (!phone || !phone.value.trim()) {
    showGlobalToast('手机号不可为空');
    if (phone) phone.focus();
    return;
  }
  showGlobalToast('原型演示：房源发布成功，已生成房源码');
});

/* 通用 toast（供 IIFE 外的增强复用） */
function showGlobalToast(message) {
  let toast = document.querySelector('.prototype-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'prototype-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showGlobalToast.timer);
  showGlobalToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}
