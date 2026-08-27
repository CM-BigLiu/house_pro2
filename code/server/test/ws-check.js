// WebSocket ping/pong 验证脚本
const { io } = require('socket.io-client');

const API = 'http://localhost:3000';

async function getToken(mobile) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password: '123456' }),
  });
  const json = await res.json();
  if (json.code !== 200) throw new Error('login failed: ' + JSON.stringify(json));
  return json.data.token;
}

(async () => {
  const token = await getToken('super_admin');
  const socket = io(API + '/events', {
    transports: ['websocket'],
    auth: { token },
    reconnection: false,
    timeout: 8000,
  });

  const timeout = setTimeout(() => {
    console.log('RESULT: TIMEOUT - no pong within 10s');
    process.exit(1);
  }, 10000);

  socket.on('connect', () => {
    console.log('connected, id=' + socket.id);
    socket.emit('ping', { t: Date.now() }, (ack) => {
      console.log('ping ack:', JSON.stringify(ack));
    });
    socket.emit('ping');
  });

  socket.on('pong', (data) => {
    console.log('RESULT: PONG received:', JSON.stringify(data));
    clearTimeout(timeout);
    socket.close();
    process.exit(0);
  });

  socket.on('connect_error', (err) => {
    console.log('connect_error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('disconnect:', reason);
  });
})();
