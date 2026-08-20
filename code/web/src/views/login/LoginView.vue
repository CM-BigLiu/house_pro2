<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { User, Lock } from 'lucide-vue-next';

const router = useRouter();
const userStore = useUserStore();
const form = reactive({ mobile: 'super_admin', password: '123456' });
const loading = ref(false);

async function handleLogin() {
  if (!form.mobile || !form.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    await userStore.login(form);
    router.push('/home');
  } finally {
    loading.value = false;
  }
}

if (userStore.isLoggedIn) {
  router.replace('/home');
}
</script>

<template>
  <div class="login-view">
    <div class="login-box">
      <div class="login-left">
        <div class="login-brand">房屋租售 ERP</div>
        <div class="login-slogan">覆盖租售房源、客源、财务、权限的一体化运营平台</div>
      </div>
      <div class="login-right">
        <div class="login-title">欢迎登录</div>
        <div class="login-form">
          <div class="input-row">
            <User :size="18" class="input-icon" />
            <input v-model="form.mobile" placeholder="账号/手机号" @keyup.enter="handleLogin" />
          </div>
          <div class="input-row">
            <Lock :size="18" class="input-icon" />
            <input v-model="form.password" type="password" placeholder="密码" @keyup.enter="handleLogin" />
          </div>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
          <div class="login-tips">默认账号：super_admin / store_manager / salesman，密码：123456</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0d1526 0%, #1e293b 100%);
}
.login-box {
  display: flex;
  width: 860px;
  max-width: 92%;
  min-height: 440px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.login-left {
  width: 45%;
  background: var(--primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
}
.login-brand {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 16px;
}
.login-slogan {
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.9;
}
.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
}
.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 28px;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-sm);
  background: var(--ink-50);
  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: var(--ink-800);
    &::placeholder { color: var(--ink-400); }
  }
}
.input-icon {
  color: var(--ink-400);
}
.login-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  border-radius: var(--radius-sm);
}
.login-tips {
  font-size: 12px;
  color: var(--ink-400);
  text-align: center;
  margin-top: 8px;
}
@media (max-width: 768px) {
  .login-box { flex-direction: column; }
  .login-left { width: 100%; padding: 28px; }
  .login-right { padding: 28px; }
}
</style>
