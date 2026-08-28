<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const form = reactive({ mobile: 'super_admin', password: '123456' });
const loading = ref(false);

const bgIndex = ref(Math.floor(Math.random() * 2) + 1);
const bgImages = ['/img/login-bg-1.jpg', '/img/login-bg-2.jpg'];

async function handleLogin() {
  if (!form.mobile || !form.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login(form);
    router.push('/home');
  } catch {
    ElMessage.error('登录失败，请检查账号密码');
  } finally {
    loading.value = false;
  }
}

if (userStore.isLoggedIn) router.replace('/home');
</script>

<template>
  <div class="login-fullscreen">
    <!-- Full-screen background -->
    <div
      class="login-bg"
      :style="{ backgroundImage: 'url(' + bgImages[bgIndex - 1] + ')' }"
    >
      <div class="bg-overlay"></div>
    </div>

    <!-- Floating particles -->
    <div class="particles">
      <span
        v-for="i in 16"
        :key="i"
        class="particle"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          width: 2 + Math.random() * 4 + 'px',
          height: 2 + Math.random() * 4 + 'px',
          animationDuration: 8 + Math.random() * 14 + 's',
          animationDelay: Math.random() * 10 + 's',
        }"
      />
    </div>

    <!-- Top bar -->
    <div class="top-bar">
      <div class="top-brand">
        <img src="/img/logo.png" alt="logo" class="top-logo" />
        <span class="top-name">房屋租售 ERP</span>
      </div>
      <div class="top-right">
        <span class="top-version">v3.0</span>
      </div>
    </div>

    <!-- Centered login card -->
    <div class="center-wrap">
      <div class="login-glass">
        <div class="glass-left">
          <div class="glass-brand">
            <div class="glass-icon">
              <img src="/img/logo.png" alt="logo" />
            </div>
            <div class="glass-title">房屋租售 ERP</div>
            <div class="glass-sub">一体化租售运营管理平台</div>
          </div>
          <div class="glass-features">
            <div class="gf-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>房源管理</span>
            </div>
            <div class="gf-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              <span>客源管理</span>
            </div>
            <div class="gf-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              <span>财务对账</span>
            </div>
            <div class="gf-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span>数据看板</span>
            </div>
          </div>
          <div class="glass-illustration">
            <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="120" width="80" height="100" rx="4" fill="rgba(255,255,255,0.08)"/>
              <rect x="50" y="140" width="60" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
              <rect x="50" y="150" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
              <rect x="50" y="165" width="50" height="20" rx="2" fill="rgba(79,140,255,0.25)"/>
              <rect x="50" y="190" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.08)"/>

              <rect x="140" y="90" width="80" height="130" rx="4" fill="rgba(255,255,255,0.08)"/>
              <rect x="150" y="110" width="60" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
              <rect x="150" y="120" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
              <rect x="150" y="135" width="50" height="50" rx="2" fill="rgba(79,140,255,0.2)"/>
              <rect x="150" y="190" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.08)"/>

              <rect x="240" y="60" width="80" height="160" rx="4" fill="rgba(255,255,255,0.08)"/>
              <rect x="250" y="80" width="60" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
              <rect x="250" y="90" width="40" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
              <rect x="250" y="105" width="50" height="80" rx="2" fill="rgba(79,140,255,0.25)"/>
              <rect x="250" y="190" width="55" height="3" rx="1.5" fill="rgba(255,255,255,0.08)"/>

              <!-- Chart line -->
              <polyline points="60,108 90,96 120,100 150,82 180,72 210,68 240,58 270,48 300,44 330,38" stroke="rgba(79,140,255,0.4)" stroke-width="2" stroke-linecap="round" fill="none"/>
              <circle cx="330" cy="38" r="3" fill="rgba(79,140,255,0.6)"/>
            </svg>
          </div>
        </div>

        <div class="glass-divider"></div>

        <div class="glass-right">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-sub">登录您的账户继续使用系统</p>
          </div>

          <form class="form-body" @submit.prevent="handleLogin">
            <div class="field-group">
              <label class="field-label">账号</label>
              <div class="field-input-wrap">
                <svg class="fi-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input v-model="form.mobile" placeholder="请输入账号 / 手机号" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">密码</label>
              <div class="field-input-wrap">
                <svg class="fi-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <input v-model="form.password" type="password" placeholder="请输入密码" />
              </div>
            </div>

            <button type="submit" class="form-btn" :disabled="loading">
              <span v-if="!loading">登 录</span>
              <span v-else class="btn-loading">登录中...</span>
            </button>

            <div class="form-tips">
              <div class="tip-row">演示账号：<code>super_admin</code> / <code>store_manager</code> / <code>salesman</code></div>
              <div class="tip-row">密码：<code>123456</code></div>
            </div>
          </form>

          <div class="form-footer">© 2026 房屋租售管理系统 v3.0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── Full screen layout ── */
.login-fullscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b1121;
}

/* ── Background image (full bleed) ── */
.login-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  animation: bgFadeIn 1s ease;
}
@keyframes bgFadeIn {
  from { opacity: 0; transform: scale(1.04); }
  to   { opacity: 1; transform: scale(1); }
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(11, 17, 33, 0.6) 0%,
    rgba(11, 17, 33, 0.35) 40%,
    rgba(11, 17, 33, 0.5) 100%
  );
}

/* ── Particles ── */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  animation: particleFloat linear infinite;
}
@keyframes particleFloat {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  20%  { opacity: 0.6; }
  80%  { opacity: 0.4; }
  100% { transform: translateY(-100vh) scale(0.6); opacity: 0; }
}

/* ── Top bar ── */
.top-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 36px;
}
.top-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.top-logo {
  width: 30px; height: 30px;
  border-radius: 8px;
  object-fit: cover;
}
.top-name {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}
.top-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.top-version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.06);
  padding: 4px 12px;
  border-radius: 12px;
}

/* ── Center wrap ── */
.center-wrap {
  position: relative;
  z-index: 2;
  width: 840px;
  max-width: 94%;
}

/* ── Glass card ── */
.login-glass {
  display: flex;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(24px) saturate(1.3);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* ── Left panel ── */
.glass-left {
  width: 46%;
  padding: 48px 36px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, rgba(46, 107, 240, 0.12) 0%, transparent 70%);
}
.glass-brand {
  margin-bottom: 28px;
}
.glass-icon {
  width: 48px; height: 48px;
  margin-bottom: 14px;
  img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 14px;
  }
}
.glass-title {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 6px;
}
.glass-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}
.glass-features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: auto;
}
.gf-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 12px 6px 8px;
  border-radius: 20px;
  svg {
    color: rgba(79, 140, 255, 0.7);
  }
}
.glass-illustration {
  margin-top: 24px;
  svg {
    width: 100%;
    height: auto;
  }
}

/* ── Divider ── */
.glass-divider {
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08), transparent);
}

/* ── Right panel ── */
.glass-right {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
}

.form-header {
  margin-bottom: 30px;
}
.form-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
}
.form-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.field-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s;

  &:focus-within {
    border-color: rgba(79, 140, 255, 0.5);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.08);
  }
}
.fi-icon {
  color: rgba(255, 255, 255, 0.25);
  flex: none;
}
.field-input-wrap input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #fff;
  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
}

.form-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #fff;
  background: linear-gradient(135deg, #2e6bf0, #4f8cff);
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 2px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e56d6, #3b7af0);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(46, 107, 240, 0.35);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
.btn-loading {
  opacity: 0.8;
}

.form-tips {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px 14px;
}
.tip-row {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1.8;
  code {
    background: rgba(79, 140, 255, 0.12);
    color: rgba(144, 184, 255, 0.9);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10.5px;
  }
}

.form-footer {
  margin-top: auto;
  padding-top: 20px;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.15);
}

/* ── Responsive ── */
@media (max-width: 820px) {
  .top-bar { padding: 16px 20px; }
  .login-glass {
    flex-direction: column;
    max-height: 94vh;
    overflow-y: auto;
  }
  .glass-left { width: 100%; padding: 32px 28px; }
  .glass-illustration { display: none; }
  .glass-right { padding: 32px 28px; }
  .glass-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent);
  }
  .form-footer { margin-top: 16px; }
}
</style>