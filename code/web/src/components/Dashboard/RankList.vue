<script setup lang="ts">
export interface RankEntry {
  rank: number;
  name: string;
  avatar?: string;
  teamName?: string;
  score: string | number;
}

withDefaults(defineProps<{
  title?: string;
  subtitle?: string;
  items: RankEntry[];
  maxScore?: number;
}>(), {
  title: '业绩排行榜 TOP20',
  subtitle: '前 3 名高亮',
  maxScore: 100000,
});

const medalColors = ['#f472b6', '#fb923c', '#fbbf24'];
</script>

<template>
  <div class="rank-list-widget">
    <div class="rl-header">
      <div class="rl-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/>
          <path d="M4 22h16"/><path d="M10 22V2l4 4-4 4"/>
        </svg>
        {{ title }}
      </div>
      <span class="rl-subtitle">{{ subtitle }}</span>
    </div>

    <div class="rl-list">
      <div v-for="item in items" :key="item.rank" class="rl-row" :class="{ 'top-3': item.rank <= 3 }">
        <!-- Rank badge -->
        <div v-if="item.rank <= 3" class="rl-medal" :style="{ background: medalColors[item.rank - 1] }">
          {{ item.rank }}
        </div>
        <div v-else class="rl-rank-num">{{ item.rank }}</div>

        <!-- Avatar -->
        <div class="rl-avatar" v-if="item.avatar">
          <img :src="item.avatar" :alt="item.name" />
        </div>
        <div v-else class="rl-avatar rl-avatar-text">{{ item.name?.[0] || '?' }}</div>

        <!-- Name + team -->
        <div class="rl-info">
          <div class="rl-name">{{ item.name }}</div>
          <div class="rl-team" v-if="item.teamName">{{ item.teamName }}</div>
        </div>

        <!-- Score bar -->
        <div class="rl-bar-wrap">
          <div class="rl-bar-track">
            <div class="rl-bar-fill" :class="'fill-' + Math.min(item.rank, 5)"
              :style="{ width: (Number(item.score) / maxScore * 100) + '%' }">
            </div>
          </div>
        </div>

        <!-- Score -->
        <span class="rl-score">¥{{ Number(item.score).toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rank-list-widget {
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(16,24,40,0.07);
}
.rl-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.rl-title {
  font-size: 14px; font-weight: 700; color: #1e293b;
  display: flex; align-items: center; gap: 7px;
}
.rl-subtitle { font-size: 11px; color: #94a3b8; }
.rl-list { display: flex; flex-direction: column; gap: 8px; }
.rl-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px;
  transition: background 0.12s;
}
.rl-row:hover { background: #f8fafc; }
.rl-medal {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  flex: none;
}
.rl-rank-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: #64748b;
  background: #f1f4f9; flex: none;
}
.rl-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, #eef4ff, #dbeafe);
  color: #3b82f6; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex: none; overflow: hidden;
}
.rl-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rl-info { min-width: 0; flex: 0 0 auto; width: 90px; }
.rl-name { font-size: 12.5px; color: #334155; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rl-team { font-size: 10.5px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rl-bar-wrap { flex: 1; min-width: 0; padding: 0 4px; }
.rl-bar-track {
  height: 6px; background: #f1f4f9; border-radius: 3px;
  overflow: hidden;
}
.rl-bar-fill {
  height: 100%; border-radius: 3px; transition: width 0.4s ease;
}
.rl-bar-fill.fill-1 { background: linear-gradient(90deg, #f472b6, #ec4899); }
.rl-bar-fill.fill-2 { background: linear-gradient(90deg, #fb923c, #f97316); }
.rl-bar-fill.fill-3 { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.rl-bar-fill.fill-4,
.rl-bar-fill.fill-5 { background: linear-gradient(90deg, #93c5fd, #3b82f6); }
.rl-score {
  font-family: var(--font-num);
  font-size: 13px; font-weight: 700; color: #1e293b;
  flex: none; min-width: 70px; text-align: right;
}
</style>