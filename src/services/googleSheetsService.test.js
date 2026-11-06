import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleSheetsService } from './googleSheetsService';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { location: { hash: '#/', reload: vi.fn() } };

const respond = (json) => vi.fn(async () => ({ ok: true, text: async () => JSON.stringify(json) }));

beforeEach(() => {
  store.clear();
  window.location.hash = '#/';
  window.location.reload.mockClear();
});

describe('googleSheetsService', () => {
  it('POST(text/plain)로 보내고, 저장된 token을 자동으로 붙인다', async () => {
    store.set('user', JSON.stringify({ id: 'u1', token: 't-123' }));
    globalThis.fetch = respond({ success: true });

    await googleSheetsService.getTierInfo();

    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toContain('text/plain');
    expect(JSON.parse(init.body)).toEqual({ action: 'getTierInfo', token: 't-123' });
  });

  it('보호된 요청에 클라이언트가 넘긴 id는 보내지 않는다', async () => {
    globalThis.fetch = respond({ success: true });
    await googleSheetsService.updateUser('someone-else', { major: 'x' });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty('id');
  });

  it('AUTH_REQUIRED를 받으면 로그인 정보를 지우고 로그인 화면으로 보낸다', async () => {
    store.set('user', JSON.stringify({ id: 'u1', token: 'expired' }));
    globalThis.fetch = respond({ success: false, code: 'AUTH_REQUIRED' });

    await googleSheetsService.getUserMatrixUrl();

    expect(store.has('user')).toBe(false);
    expect(window.location.hash).toBe('#/login');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('네트워크 오류는 예외 대신 { success: false }로 돌려준다', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('offline'); });
    const result = await googleSheetsService.login('a', 'b');
    expect(result.success).toBe(false);
    expect(result.message).toContain('offline');
  });

  it('매트릭스 저장은 20개씩 나눠 보내고, 중간에 실패하면 멈춘다', async () => {
    const updates = Array.from({ length: 45 }, (_, i) => ({ programName: `p${i}` }));
    globalThis.fetch = respond({ success: true });
    expect((await googleSheetsService.saveMatrix('u1', updates, '2026', '2')).success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => '{"success":true}' })
      .mockResolvedValueOnce({ ok: true, text: async () => '{"success":false,"message":"시트 없음"}' });
    const failed = await googleSheetsService.saveMatrix('u1', updates, '2026', '2');
    expect(failed.success).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
