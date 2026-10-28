const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');

// Run the actual TypeScript HTTP client with Axios adapters; no browser or server mocks of the interceptor.
function client(handler, initial = { auth_token: 'expired', refresh_token: 'refresh-1' }) {
  const storage = new Map(Object.entries(initial));
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const proxy = new Proxy(axios, { get(target, key) {
    if (key === 'create') return config => axios.create({ ...config, adapter: async request => {
      const result = await handler(request, storage);
      const response = { config: request, headers: {}, statusText: '', status: result.status ?? 200, data: result.data };
      if (response.status >= 400) throw new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', request, {}, response);
      return response;
    } });
    return target[key];
  } });
  const source = ts.transpileModule(fs.readFileSync(require.resolve('../lib/axios-instance.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require: name => name === 'axios' ? proxy : require(name), process, window: {}, localStorage });
  return { request: exports.customAxiosInstance, storage };
}
const refreshed = { data: { accessToken: 'fresh', refreshToken: 'refresh-2' } };

for (const method of ['POST', 'PATCH']) test(`${method} milestone retries once after refresh and preserves body`, async () => {
  const seen = [];
  const { request, storage } = client(async config => {
    seen.push(config);
    if (config.url === '/api/auth/refresh') {
      assert.deepEqual(JSON.parse(config.data), { refreshToken: 'refresh-1' });
      return { data: refreshed };
    }
    return config.headers.Authorization === 'Bearer fresh' ? { data: { data: { id: 'saved' } } } : { status: 401 };
  });
  const body = JSON.stringify({ name: 'Quà', requiredBooths: 20, requiredWorkshopIds: ['workshop-a', 'workshop-b'] });
  const result = await request('/api/rewards/milestones/id', { method, body });
  assert.equal(result.data.id, 'saved');
  assert.equal(seen.length, 3);
  assert.equal(seen[0].data, body); assert.equal(seen[2].data, body);
  assert.equal(seen[2].method, method.toLowerCase());
  assert.equal(storage.get('refresh_token'), 'refresh-2');
});
test('concurrent workshop fetch and save share one refresh', async () => {
  let refreshes = 0;
  const { request } = client(async config => {
    if (config.url === '/api/auth/refresh') { refreshes++; await new Promise(r => setTimeout(r, 10)); return { data: refreshed }; }
    return config.headers.Authorization === 'Bearer fresh' ? { data: {} } : { status: 401 };
  });
  await Promise.all([request('/api/booths?type=workshop'), request('/api/rewards/milestones', { method: 'POST', body: '{}' })]);
  assert.equal(refreshes, 1);
});
test('fresh session saves directly; forbidden response never refreshes', async () => {
  let calls = 0;
  const { request } = client(async config => { calls++; assert.equal(config.headers.Authorization, 'Bearer fresh'); return { status: 403 }; }, { auth_token: 'fresh', refresh_token: 'refresh-1' });
  await assert.rejects(request('/api/rewards/milestones', { method: 'POST', body: '{}' }));
  assert.equal(calls, 1);
});
test('missing refresh token gives a clear login message without replaying save', async () => {
  const { request, storage } = client(async () => ({ status: 401 }), { auth_token: 'expired' });
  await assert.rejects(request('/api/rewards/milestones'), e => e.response.data.message.includes('đăng nhập lại'));
  assert.equal(storage.has('auth_token'), false);
});
test('invalid refresh ends the session; no retry loop', async () => {
  let calls = 0;
  const { request, storage } = client(async () => { calls++; return { status: 401 }; });
  await assert.rejects(request('/api/rewards/milestones'));
  assert.equal(calls, 2); assert.equal(storage.has('refresh_token'), false);
});
test('network failure during refresh retains the session for another attempt', async () => {
  const { request, storage } = client(async config => {
    if (config.url === '/api/auth/refresh') throw new axios.AxiosError('Network error');
    return { status: 401 };
  });
  await assert.rejects(request('/api/rewards/milestones'));
  assert.equal(storage.get('refresh_token'), 'refresh-1');
});
test('failed login does not clear an existing session or refresh', async () => {
  let calls = 0;
  const { request, storage } = client(async () => { calls++; return { status: 401 }; });
  await assert.rejects(request('/api/auth/login', { method: 'POST', body: '{}' }));
  assert.equal(calls, 1); assert.equal(storage.get('auth_token'), 'expired');
});
test('logout during refresh is not undone by its late response', async () => {
  const { request, storage } = client(async (config, store) => {
    if (config.url === '/api/auth/refresh') { store.clear(); return { data: refreshed }; }
    return { status: 401 };
  });
  await assert.rejects(request('/api/rewards/milestones'));
  assert.equal(storage.size, 0);
});
