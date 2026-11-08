// backend.gs를 Apps Script 대신 Node에서 실행해 보는 테스트.
// Utilities, CacheService 등 Apps Script 전역 객체는 Node crypto와 Map으로 흉내 낸다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHmac, createHash, randomUUID, pbkdf2Sync } from 'node:crypto';
import vm from 'node:vm';
import { Buffer } from 'node:buffer';

// Apps Script의 byte[]는 -128~127 범위의 부호 있는 정수 배열이다.
const toSigned = (buf) => [...buf].map(b => (b > 127 ? b - 256 : b));
const toBuf = (arr) => Buffer.from(arr.map(b => b & 0xff));

function loadBackend({ props = {}, spreadsheets = {} } = {}) {
  const cache = new Map();
  const ctx = {
    console,
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_alg, str) => toSigned(createHash('sha256').update(str, 'utf8').digest()),
      computeHmacSha256Signature: (value, key) => toSigned(createHmac('sha256', toBuf(key)).update(toBuf(value)).digest()),
      newBlob: (str) => ({ getBytes: () => toSigned(Buffer.from(str, 'utf8')) }),
      getUuid: () => randomUUID(),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => cache.set(k, String(v)),
        remove: (k) => cache.delete(k),
        removeAll: (ks) => ks.forEach(k => cache.delete(k)),
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k) => ({ SPREADSHEET_ID: 'test-sheet-id', ...props })[k] ?? null }),
    },
    SpreadsheetApp: {
      openById: (id) => {
        if (!spreadsheets[id]) throw new Error('no access: ' + id);
        return spreadsheets[id];
      },
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (text) => ({ setMimeType() { return this; }, text }),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('./backend.gs', import.meta.url), 'utf8'), ctx);
  return { ctx, cache };
}

const body = (out) => JSON.parse(out.text);

describe('비밀번호 해시', () => {
  const { ctx } = loadBackend();

  it('pbkdf2Hex는 표준 PBKDF2-HMAC-SHA256과 같은 값을 낸다', () => {
    const expected = pbkdf2Sync('Pass!word1', 'salt123', 2000, 32, 'sha256').toString('hex');
    expect(ctx.pbkdf2Hex('Pass!word1', 'salt123', 2000)).toBe(expected);
  });

  it('새 형식 해시는 맞는 비밀번호만 통과한다', () => {
    const stored = ctx.hashPassword('Pass!word1', 'abc');
    expect(stored).toMatch(/^pbkdf2\$\d+\$[0-9a-f]{64}$/);
    expect(ctx.verifyPassword(stored, 'abc', 'Pass!word1')).toEqual({ ok: true, needsUpgrade: false });
    expect(ctx.verifyPassword(stored, 'abc', 'wrong').ok).toBe(false);
  });

  it('예전 형식(sha256(salt+비밀번호))도 통과하되 다시 저장하라고 알려 준다', () => {
    const legacy = createHash('sha256').update('abc' + 'Pass!word1').digest('hex');
    expect(ctx.verifyPassword(legacy, 'abc', 'Pass!word1')).toEqual({ ok: true, needsUpgrade: true });
    expect(ctx.verifyPassword(legacy, 'abc', 'nope').ok).toBe(false);
  });

  it('빈 값은 통과하지 않는다', () => {
    expect(ctx.verifyPassword('', 'abc', 'x').ok).toBe(false);
    expect(ctx.verifyPassword('pbkdf2$1$00', '', 'x').ok).toBe(false);
  });
});

describe('인증번호', () => {
  let ctx;
  beforeEach(() => { ({ ctx } = loadBackend()); });

  it('맞는 번호는 한 번만 쓸 수 있다', () => {
    ctx.putVerificationCode('pwcode:a@b.c', '123456', 'user1');
    expect(ctx.consumeVerificationCode('pwcode:a@b.c', '123456')).toEqual({ ok: true, id: 'user1' });
    expect(ctx.consumeVerificationCode('pwcode:a@b.c', '123456').ok).toBe(false);
  });

  it('5번 틀리면 번호가 폐기된다', () => {
    ctx.putVerificationCode('pwcode:a@b.c', '123456', 'user1');
    for (let i = 0; i < 5; i++) ctx.consumeVerificationCode('pwcode:a@b.c', '000000');
    expect(ctx.consumeVerificationCode('pwcode:a@b.c', '123456').ok).toBe(false);
  });
});

describe('라우팅과 세션', () => {
  let ctx;
  beforeEach(() => { ({ ctx } = loadBackend()); });

  it('보호된 액션은 토큰 없이 AUTH_REQUIRED를 돌려준다', () => {
    expect(body(ctx.routeRequest('getMatrix', {})).code).toBe('AUTH_REQUIRED');
    expect(body(ctx.routeRequest('getMatrix', { token: 'fake' })).code).toBe('AUTH_REQUIRED');
  });

  it('로그아웃하면 세션이 사라진다', () => {
    const token = ctx.createSession('user1');
    expect(ctx.getSessionUserId(token)).toBe('user1');
    ctx.routeRequest('logout', { token });
    expect(ctx.getSessionUserId(token)).toBe(null);
  });

  it('재설정 토큰 없이 비밀번호를 바꿀 수 없다', () => {
    expect(body(ctx.routeRequest('updatePassword', { id: 'user1', newPassword: 'x' })).success).toBe(false);
  });

  it('공개하지 않은 액션은 거부한다', () => {
    expect(body(ctx.routeRequest('recalculateAllTiers', {})).message).toBe('Unknown action');
  });
});

// 탭 이름과 표시값(2차원 배열)만 가진 가짜 스프레드시트
function fakeSpreadsheet(id, tabs) {
  const ss = {
    tabs: [],
    getId: () => id,
    getSheets: () => ss.tabs,
    getSheetByName: (name) => ss.tabs.find(t => t.getName() === name) || null,
    deleteSheet: (t) => { ss.tabs = ss.tabs.filter(x => x !== t); },
  };
  const makeTab = (name, rows) => {
    const tab = {
      name, rows,
      getName: () => tab.name,
      setName: (n) => {
        if (ss.tabs.some(t => t !== tab && t.getName() === n)) throw new Error('duplicate name');
        tab.name = n; return tab;
      },
      getDataRange: () => ({ getDisplayValues: () => tab.rows }),
    };
    return tab;
  };
  ss.addTab = (name, rows) => { const t = makeTab(name, rows); ss.tabs.push(t); return t; };
  ss.copyTabTo = (tab, target) => target.addTab(`${tab.getName()}의 사본`, tab.rows.map(r => [...r]));
  Object.entries(tabs).forEach(([name, rows]) => {
    const t = ss.addTab(name, rows);
    t.copyTo = (target) => ss.copyTabTo(t, target);
  });
  return ss;
}

const HEADER = ['핵심역량', '프로그램명', '1회 점수', '내 점수'];

describe('학기 탭 확장', () => {
  const setup = (templateTabs, studentTabs, props = { MATRIX_TEMPLATE_ID: 'tpl' }) => {
    const tpl = fakeSpreadsheet('tpl', templateTabs);
    const student = fakeSpreadsheet('stu', studentTabs);
    const { ctx } = loadBackend({ props, spreadsheets: { tpl, stu: student } });
    return { ctx, tpl, student };
  };
  const URL = 'https://docs.google.com/spreadsheets/d/stu/edit';

  it('학생 시트에 없는 학기 탭은 원본 템플릿에서 복사해 와서 읽는다', () => {
    const { ctx, student } = setup(
      { '2026-2': [HEADER, ['직무수행역량', '역량평가성취도', '3/5', '']] },
      { '2025-2': [HEADER, ['유한인성역량', '사회봉사', '5', '10']] },
    );
    const data = ctx.getMatrixDataFromUrl(URL, '2026', '2');
    expect(data.sheetName).toBe('2026-2');
    expect(data[0]['1회 점수']).toBe('3/5');
    expect(student.getSheetByName('2026-2')).not.toBe(null);
  });

  it('원본에도 없으면 복사하지 않고 가장 최근 학기 탭을 보여 준다', () => {
    const { ctx, student } = setup(
      { '2025-2': [HEADER] },
      { '2025-1': [HEADER, ['a', 'b', '1', '']], '2025-2': [HEADER, ['a', 'c', '2', '']] },
    );
    const data = ctx.getMatrixDataFromUrl(URL, '2027', '1');
    expect(data.sheetName).toBe('2025-2');
    expect(student.getSheets()).toHaveLength(2);
  });

  it('MATRIX_TEMPLATE_ID가 없거나 원본을 열 수 없어도 오류 없이 예전처럼 동작한다', () => {
    const row = ['a', 'b', '1', ''];
    const noProp = setup({ '2026-2': [HEADER, row] }, { '2025-2': [HEADER, row] }, {});
    expect(noProp.ctx.getMatrixDataFromUrl(URL, '2026', '2').sheetName).toBe('2025-2');
    const noAccess = setup({ '2026-2': [HEADER, row] }, { '2025-2': [HEADER, row] }, { MATRIX_TEMPLATE_ID: 'other' });
    expect(noAccess.ctx.getMatrixDataFromUrl(URL, '2026', '2').sheetName).toBe('2025-2');
  });

  it('학기 형식이 아닌 이름은 복사하지 않는다', () => {
    const { ctx, student } = setup({ '2026-2': [HEADER] }, { '2025-2': [HEADER] });
    expect(ctx.copySemesterTabFromTemplate(student, '2026-3')).toBe(null);
    expect(ctx.copySemesterTabFromTemplate(student, '../users')).toBe(null);
  });

  it('동시에 복사해서 이름이 겹치면 사본을 지우고 먼저 만든 탭을 쓴다', () => {
    const { ctx, student } = setup({ '2026-2': [HEADER] }, { '2025-2': [HEADER] });
    const first = ctx.copySemesterTabFromTemplate(student, '2026-2');
    const second = ctx.copySemesterTabFromTemplate(student, '2026-2');
    expect(second).toBe(first);
    expect(student.getSheets().map(t => t.getName())).toEqual(['2025-2', '2026-2']);
  });
});
