import http from 'k6/http';
import { check, sleep } from 'k6';

// 环境变量
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const MOBILE = __ENV.MOBILE || 'super_admin';
const PASSWORD = __ENV.PASSWORD || '123456';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   //  ramps up
    { duration: '1m', target: 50 },    //  steady state
    { duration: '30s', target: 0 },    //  ramps down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% 请求 < 1s
    http_req_failed: ['rate<0.05'],    // 失败率 < 5%
  },
};

function login() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ mobile: MOBILE, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login status 200/201': (r) => r.status === 200 || r.status === 201 });
  const body = res.json();
  return body.data?.token || body.token;
}

export default function () {
  const token = login();
  if (!token) {
    console.error('登录失败，无法获取 token');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/api/house/sale-properties?page=1&pageSize=20` },
    { method: 'GET', url: `${BASE_URL}/api/dashboard/overview` },
    { method: 'GET', url: `${BASE_URL}/api/system/dicts` },
    { method: 'GET', url: `${BASE_URL}/api/property/page?transType=2` },
  ];

  for (const ep of endpoints) {
    const res = http.request(ep.method, ep.url, null, { headers });
    check(res, {
      [`${ep.url} status 200`]: (r) => r.status === 200,
      [`${ep.url} response ok`]: (r) => {
        const body = r.json();
        return body.code === undefined || body.code === 0 || body.code === 200;
      },
    });
  }

  sleep(1);
}
