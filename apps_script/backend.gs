// Yutier 백엔드 (Google Apps Script 웹 앱)
// React 프론트엔드의 요청을 받아 Google 스프레드시트(users, tier, major)를 읽고 쓴다. 응답은 모두 JSON.
//
// 배포 전 설정: 프로젝트 설정 > 스크립트 속성에 SPREADSHEET_ID(DB 시트 ID)를 넣는다.
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

// USERS: 회원 정보, TIER: 역량 점수/합산/티어, MAJOR: 학부/전공 목록
const SHEET_NAMES = {
  USERS: 'users',
  TIER: 'tier', 
  MAJOR: 'major'
};

// 웹 앱 진입점. 프론트엔드는 POST(text/plain, JSON body)로 호출한다.
// doGet은 예전 클라이언트 호환용이다. 비밀번호가 URL에 남으므로 쓰지 않는 것이 좋다.
function doGet(e) {
  try {
    const { action, ...data } = e.parameter || {};
    let parsedData = { ...data };
    if (data.data && typeof data.data === 'string') {
      try {
        parsedData = JSON.parse(data.data);
      } catch (jsonError) {
        return json(400, { success: false, message: 'Invalid JSON data format' });
      }
    }
    return routeRequest(action, parsedData);
  } catch (err) {
    console.error('GET 처리 오류:', err);
    return json(500, { success: false, message: '서버 오류가 발생했습니다.' });
  }
}

function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        return json(400, { success: false, message: '요청 형식이 올바르지 않습니다.' });
      }
    }
    const { action, ...requestData } = data;
    return routeRequest(action, requestData);
  } catch (error) {
    console.error('POST 처리 오류:', error);
    return json(500, { success: false, message: '서버 오류가 발생했습니다.' });
  }
}

// 로그인 토큰이 있어야 하는 액션. 핸들러에는 토큰에서 꺼낸 id가 data.id로 전달된다.
const PROTECTED_HANDLERS = {
  updateUser: data => handleUpdateUser(data),
  verifyMatrixUrl: data => handleVerifyMatrixUrl(data),
  validateMatrixUrl: data => handleValidateMatrixUrl(data),
  getMatrix: data => handleGetMatrix(data),
  saveMatrix: data => handleSaveMatrix(data),
  saveTierScores: data => handleSaveTierScores(data),
  getTierScores: data => handleGetTierScores(data),
  getTierInfo: data => handleGetTierInfo(data),
  getRecommendedPrograms: data => handleGetRecommendedPrograms(data),
  getUserMatrixUrl: data => handleGetUserMatrixUrl(data),
  verifyPassword: data => handleVerifyPassword(data),
  deleteAccount: data => handleDeleteAccount(data),
};

const PUBLIC_HANDLERS = {
  login: data => handleLogin(data),
  logout: data => handleLogout(data),
  signup: data => handleSignup(data),
  checkId: data => handleCheckId(data),
  checkStudentID: data => handleCheckStudentID(data),
  getMajorList: () => handleGetMajorList(),
  sendVerificationCode: data => handleSendVerificationCode(data),
  findIdWithVerification: data => handleFindIdWithVerification(data),
  sendVerificationCodeForPassword: data => handleSendVerificationCodeForPassword(data),
  findPasswordWithVerification: data => handleFindPasswordWithVerification(data),
  updatePassword: data => handleUpdatePassword(data),
};
// recalculateAllTiers는 공개하지 않는다. 필요하면 Apps Script 편집기에서 직접 실행한다.

function routeRequest(action, data) {
  if (PROTECTED_HANDLERS[action]) {
    const id = getSessionUserId(data.token);
    if (!id) {
      return json(401, { success: false, code: 'AUTH_REQUIRED', message: '로그인이 필요합니다.' });
    }
    return PROTECTED_HANDLERS[action]({ ...data, id });
  }
  if (PUBLIC_HANDLERS[action]) return PUBLIC_HANDLERS[action](data);
  return json(400, { success: false, message: 'Unknown action' });
}

// ---- 세션 / 일회용 토큰 (CacheService) ----
const SESSION_TTL = 21600;       // 6시간 (CacheService 최대값)
const RESET_TOKEN_TTL = 600;     // 비밀번호 재설정 토큰 10분
const CODE_TTL = 180;            // 인증번호 3분
const MAX_CODE_TRIES = 5;

function createSession(id) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('session:' + token, id, SESSION_TTL);
  return token;
}

function getSessionUserId(token) {
  if (!token) return null;
  return CacheService.getScriptCache().get('session:' + token);
}

function handleLogout(data) {
  if (data.token) CacheService.getScriptCache().remove('session:' + data.token);
  return json(200, { success: true });
}

// 인증번호 저장. 값에 인증번호와 사용자 id를 함께 넣는다.
function putVerificationCode(key, code, id) {
  const cache = CacheService.getScriptCache();
  cache.put(key, JSON.stringify({ code, id }), CODE_TTL);
  cache.remove('tries:' + key);
}

// 인증번호 확인. 성공하면 id를 돌려주고 코드를 지운다. 실패 횟수가 MAX_CODE_TRIES를 넘으면 코드를 폐기한다.
function consumeVerificationCode(key, code) {
  const cache = CacheService.getScriptCache();
  const stored = cache.get(key);
  if (stored == null) return { ok: false, message: '인증번호 유효 시간이 만료되었습니다. 다시 시도해주세요.' };

  const { code: storedCode, id } = JSON.parse(stored);
  if (String(storedCode) !== String(code)) {
    const tries = Number(cache.get('tries:' + key) || 0) + 1;
    if (tries >= MAX_CODE_TRIES) {
      cache.removeAll([key, 'tries:' + key]);
      return { ok: false, message: '인증 시도 횟수를 초과했습니다. 인증번호를 다시 받아주세요.' };
    }
    cache.put('tries:' + key, String(tries), CODE_TTL);
    return { ok: false, message: '인증번호가 일치하지 않습니다.' };
  }
  cache.removeAll([key, 'tries:' + key]);
  return { ok: true, id };
}

function generateVerificationCode() {
  // Math.random 대신 UUID 기반 난수 사용
  const n = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16);
  return String(100000 + (n % 900000));
}

// 입력 비밀번호가 users 행(배열)에 저장된 해시와 맞는지 확인한다.
function checkPassword(row, password) {
  return verifyPassword(row[USER_COLUMNS.PASSWORD], row[USER_COLUMNS.SALT], password).ok;
}

// users 시트에서 아이디로 [행 번호(1-based), 행 배열]을 찾는다.
function findUserRow(sheet, id) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][USER_COLUMNS.ID] === id) return { rowNumber: i + 1, row: values[i] };
  }
  return null;
}

const USER_COLUMNS = {
  ID: 0,         // A 열: 아이디
  PASSWORD: 1,   // B 열: 비밀번호 
  NAME: 2,       // C 열: 이름
  EMAIL: 3,      // D 열: 이메일
  STUDENT_ID: 4, // E 열: 학번
  DEPT: 5,       // F 열: 학부
  MAJOR: 6,      // G 열: 전공
  MATRIX_URL: 7, // H 열: url
  SALT: 8        // I 열: 솔트
};

// ---- 비밀번호 해시 ----
// 저장 형식: "pbkdf2$<반복 횟수>$<hex>" (PBKDF2-HMAC-SHA256, salt는 I열).
// 예전 형식(sha256(salt + 비밀번호))은 로그인에 성공하면 새 형식으로 바꿔 저장한다.
// shortcut: Apps Script 실행 시간 제한 때문에 반복 횟수를 낮게 잡았다. 횟수는 해시마다 저장되니 나중에 올려도 기존 계정이 깨지지 않는다.
const PBKDF2_ITERATIONS = 2000;

function toHex(bytes) {
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function sha256Hex(str) {
  return toHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8));
}

// PBKDF2-HMAC-SHA256, 출력 32바이트(블록 1개)
function pbkdf2Hex(password, salt, iterations) {
  const key = Utilities.newBlob(password).getBytes();
  let u = Utilities.computeHmacSha256Signature(Utilities.newBlob(salt).getBytes().concat([0, 0, 0, 1]), key);
  const t = u.slice();
  for (let i = 1; i < iterations; i++) {
    u = Utilities.computeHmacSha256Signature(u, key);
    for (let j = 0; j < t.length; j++) t[j] ^= u[j];
  }
  return toHex(t);
}

function hashPassword(password, salt) {
  return `pbkdf2$${PBKDF2_ITERATIONS}$${pbkdf2Hex(password, salt, PBKDF2_ITERATIONS)}`;
}

// 길이가 같으면 끝까지 비교해서, 어디서 달라지는지 응답 시간으로 드러나지 않게 한다.
function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// { ok, needsUpgrade }: needsUpgrade면 예전 형식이라 새 형식으로 다시 저장해야 한다.
function verifyPassword(stored, salt, password) {
  if (!password || !stored || !salt) return { ok: false };
  const parts = String(stored).split('$');
  if (parts[0] === 'pbkdf2' && parts.length === 3) {
    const iterations = Number(parts[1]);
    return { ok: safeEqual(pbkdf2Hex(password, salt, iterations), parts[2]), needsUpgrade: iterations < PBKDF2_ITERATIONS };
  }
  return { ok: safeEqual(sha256Hex(salt + password), stored), needsUpgrade: true };
}

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '');
}

function handleLogin(data) {
  const { id, password } = data;
  if (!id || !password) {
    return json(400, { success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const found = findUserRow(sheet, id);
  const fail = () => json(401, { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  if (!found) return fail();
  const row = found.row;

  // salt가 없는 초창기 계정은 평문으로 저장돼 있다. 비밀번호가 맞으면 재설정 화면으로 보낸다.
  if (!row[USER_COLUMNS.SALT]) {
    if (!safeEqual(row[USER_COLUMNS.PASSWORD], password)) return fail();
    return json(401, {
      success: false,
      code: 'LEGACY_ACCOUNT',
      message: '계정 보안 기준 미달로 인해 비밀번호 재설정 페이지로 이동합니다.'
    });
  }

  const result = verifyPassword(row[USER_COLUMNS.PASSWORD], row[USER_COLUMNS.SALT], password);
  if (!result.ok) return fail();
  if (result.needsUpgrade) setPassword(sheet, found.rowNumber, password);

  const user = {
    id: row[USER_COLUMNS.ID],
    name: row[USER_COLUMNS.NAME],
    email: row[USER_COLUMNS.EMAIL],
    studentId: row[USER_COLUMNS.STUDENT_ID],
    department: row[USER_COLUMNS.DEPT],
    major: row[USER_COLUMNS.MAJOR],
    matrixUrl: row[USER_COLUMNS.MATRIX_URL] || null,
    token: createSession(row[USER_COLUMNS.ID])
  };
  return json(200, { success: true, message: '로그인 성공', user: user });
}

function handleSignup(data) {
  const { id, password, name, email, studentID, department, major } = data;
  
  if (!id || !password || !name || !email || !studentID || !department || !major) {
    return json(400, { success: false, message: '모든 필드를 입력해주세요.' });
  }
  
  if (findUserById(id)) {
    return json(200, { success: false, message: '이미 존재하는 아이디입니다.' });
  }
  
  if (findUserByStudentID(studentID)) {
    return json(200, { success: false, message: '이미 존재하는 학번입니다.' });
  }

  const salt = generateSalt();
  getSheet(SHEET_NAMES.USERS).appendRow([id, hashPassword(password, salt), name, email, studentID, department, major, '', salt]);
  
  return json(200, { success: true, message: '회원가입이 완료되었습니다.' });
}

function handleCheckId(data) {
  const { id } = data;
  const exists = findUserById(id) !== null;
  return json(200, { exists });
}

function handleCheckStudentID(data) {
  const { studentID } = data;
  const exists = findUserByStudentID(studentID) !== null;
  return json(200, { exists });
}

// major 시트의 각 열이 학부, 그 열 아래 행들이 전공이다.
function handleGetMajorList() {
  const sheet = getSheet(SHEET_NAMES.MAJOR);
  const sheetData = sheet.getDataRange().getValues();
  
  if (sheetData.length === 0) return json(200, {});
  
  const headers = sheetData[0];
  const result = {};
  
  headers.forEach((dept, index) => {
    const majors = [];
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][index]) {
        majors.push(sheetData[i][index]);
      }
    }
    result[dept] = majors;
  });
  
  return json(200, result);
}

// 점수를 저장한 뒤 전체 티어를 다시 계산한다(5개 역량 모두 70점 이상인 학생끼리 상위 % 비교).
function handleSaveTierScores(data) {
  const { id } = data;
  var scores = data.scores;
  if (typeof scores === 'string') {
    try { scores = JSON.parse(scores); } catch (e) { scores = {}; }
  }
  
  const competencyScores = {
    유한인성역량: parseFloat(scores.유한인성역량) || 0,
    기초학습역량: parseFloat(scores.기초학습역량) || 0,
    직업기초역량: parseFloat(scores.직업기초역량) || 0,
    직무수행역량: parseFloat(scores.직무수행역량) || 0,
    취창업기초역량: parseFloat(scores.취창업기초역량) || 0
  };
  const totalScore = Object.values(competencyScores).reduce((sum, score) => sum + score, 0);

  const sheet = getSheet(SHEET_NAMES.TIER);
  const sheetData = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      rowIndex = i;
      break;
    }
  }
  
  const values = [id, scores.유한인성역량, scores.기초학습역량, scores.직업기초역량, scores.직무수행역량, scores.취창업기초역량, totalScore];
  
  // 티어 열(8~11)은 아래 recalculateAllTiers가 채운다.
  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }

  return recalculateAllTiers();
}

function handleGetTierScores(data) {
  const { id } = data;
  const user = findTierUserById(id);
  
  if (user) {
    return json(200, {
      success: true,
      scores: {
        유한인성역량: user[1] || '',
        기초학습역량: user[2] || '',
        직업기초역량: user[3] || '',
        직무수행역량: user[4] || '',
        취창업기초역량: user[5] || '',
      },
      totalScore: user[6] || 0
    });
  }
  
  return json(200, { success: true, scores: null, totalScore: 0 });
}

// tier 시트 열: 8=티어, 9=다음티어, 10=필요점수, 11=1위여부
function handleGetTierInfo(data) {
  const { id } = data;
  const user = findUserById(id);
  const tier = findTierUserById(id);
  
  if (!user) {
    return json(200, { success: false, message: '사용자 정보를 찾을 수 없습니다.' });
  }
  
  if (!tier) {
    return json(200, { success: false, message: '아직 등록된 점수가 없습니다.' });
  }
  
  const currentScore = parseFloat(tier[6]) || 0;
  const currentTier = tier[7] || 'Unranked';
  const nextTier = tier[8] || 'Bronze';
  const scoreForNextTier = parseFloat(tier[9]) || 70;
  const isRankOne = tier[10] === true || tier[10] === 'true';
  
  return json(200, {
    success: true,
    userName: user.name,
    currentTier: currentTier,
    currentScore: currentScore,
    nextTier: nextTier,
    scoreForNextTier: scoreForNextTier,
    isRankOne: isRankOne
  });
}

function handleVerifyMatrixUrl(data) {
  const { id, url } = data;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  
  if (!match) {
    return json(200, { success: false, message: '잘못된 URL 형식입니다.' });
  }
  
  const user = findUserById(id);
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }

  // 실제로 열리는지, 매트릭스 템플릿 사본인지(학기 탭 'YYYY-N'이 있는지) 확인한 뒤 저장한다.
  try {
    const ss = SpreadsheetApp.openById(match[1]);
    const hasSemesterTab = ss.getSheets().some(s => /^\d{4}-[12]$/.test(s.getName()));
    if (!hasSemesterTab) {
      return json(200, { success: false, message: '매트릭스 템플릿 사본이 아닌 것 같아요. 안내에 있는 템플릿을 복사한 시트의 URL을 입력해주세요.' });
    }
  } catch (e) {
    return json(200, { success: false, message: '시트를 열 수 없습니다. URL이 맞는지, 시트 공유 설정(링크가 있는 모든 사용자 또는 편집자 추가)을 확인해주세요.' });
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();

  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      sheet.getRange(i + 1, 8).setValue(url);
      break;
    }
  }
  
  return json(200, { success: true, message: 'URL이 저장되었습니다.' });
}

function handleValidateMatrixUrl(data) {
  const { id } = data;
  const user = findUserById(id);
  
  if (!user || !user.url) {
    return json(200, { valid: false, message: '매트릭스 URL이 등록되어 있지 않습니다.' });
  }
  
  const match = user.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    return json(200, { valid: false, message: 'URL 형식이 잘못되었습니다.' });
  }
  
  return json(200, { valid: true });
}

function extractSpreadsheetIdFromUrl(url) {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

function handleGetMatrix(data) {
  const { id, year, semester } = data;
  
  const user = findUserById(id);
  if (!user || !user.url) {
    return json(200, { success: false, message: '시트 URL 미등록' });
  }
  
  try {
    const matrixData = getMatrixDataFromUrl(user.url, year, semester);
    const headers = matrixData.length > 0 ? Object.keys(matrixData[0]) : [];

    return json(200, {
      success: true,
      header: headers,
      data: matrixData,
      sheetName: matrixData.sheetName
    });
  } catch (error) {
    console.error('매트릭스 데이터 로드 실패:', error);
    return json(200, { success: false, message: '매트릭스 시트를 읽지 못했습니다. 시트 공유 설정과 해당 학기 탭이 있는지 확인해주세요.' });
  }
}

// updates: [{ programName, detailName?, myScore?, isCompleted?, oneScore?, maxScore? }]
function handleSaveMatrix(data) {
  const { id, updates, year, semester } = data;

  let parsedUpdates = updates;
  if (typeof updates === 'string') {
    try {
      parsedUpdates = JSON.parse(updates);
    } catch (e) {
      console.error('updates 파싱 오류:', e);
      return json(200, { success: false, message: '데이터 파싱 오류가 발생했습니다.' });
    }
  }

  const user = findUserById(id);
  if (!user || !user.url)
    return json(200, { success: false, message: '시트 URL 미등록' });

  const spreadsheetId = extractSpreadsheetIdFromUrl(user.url);
  if (!spreadsheetId)
    return json(200, { success: false, message: 'URL에서 스프레드시트 ID 추출 실패' });

  if (!year || !semester)
    return json(200, { success: false, message: '연도와 학기 정보가 필요합니다.' });

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = `${year}-${semester}`;
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet)
      return json(404, { success: false, message: `'${sheetName}' 시트를 찾을 수 없습니다.` });

    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    const programNameCol = headers.indexOf('프로그램명');
    const detailCol = headers.indexOf('상세항목');
    const completedCol = headers.indexOf('이수/미이수');
    const myScoreCol = headers.indexOf('내 점수');
    const oneScoreCol = headers.indexOf('1회 점수');
    const maxScoreCol = headers.indexOf('최대 점수');

    if (programNameCol === -1)
      return json(200, { success: false, message: '프로그램명 컬럼을 찾을 수 없습니다.' });

    // 셀 값 앞뒤 공백, 빈 셀(undefined)도 같은 값으로 본다.
    const eq = (a, b) => (a ?? '').toString().trim() === (b ?? '').toString().trim();

    parsedUpdates.forEach(update => {
      const { programName, detailName, myScore, isCompleted, oneScore, maxScore } = update;

      // 세부항목이 있는 경우 — 시트 전체 전역 탐색
      if (detailName) {
        for (let r = 1; r < values.length; r++) {
          const row = values[r];
          if (eq(row[programNameCol], programName) && eq(row[detailCol], detailName)) {
            if (myScore !== undefined && myScoreCol !== -1)
              sheet.getRange(r + 1, myScoreCol + 1).setValue(myScore);
            if (isCompleted !== undefined && completedCol !== -1)
              sheet.getRange(r + 1, completedCol + 1).setValue(isCompleted ? '이수' : '');
            if (oneScore !== undefined && oneScoreCol !== -1)
              sheet.getRange(r + 1, oneScoreCol + 1).setValue(oneScore);
            if (maxScore !== undefined && maxScoreCol !== -1)
              sheet.getRange(r + 1, maxScoreCol + 1).setValue(maxScore);
            break;
          }
        }
        return;
      }

      // 상세항목이 없는 경우 — 대표행 업데이트
      for (let r = 1; r < values.length; r++) {
        const row = values[r];
        if (eq(row[programNameCol], programName) && !row[detailCol]) {
          if (myScore !== undefined && myScoreCol !== -1)
            sheet.getRange(r + 1, myScoreCol + 1).setValue(myScore);
          if (oneScore !== undefined && oneScoreCol !== -1)
            sheet.getRange(r + 1, oneScoreCol + 1).setValue(oneScore);
          if (maxScore !== undefined && maxScoreCol !== -1)
            sheet.getRange(r + 1, maxScoreCol + 1).setValue(maxScore);
          break;
        }
      }
    });

    return json(200, { success: true, message: '저장이 완료되었습니다.' });
  } catch (err) {
    return json(200, { success: false, message: '매트릭스 저장 실패: ' + String(err) });
  }
}

// 입력: id(세션), updateData { department?, major?, currentPassword?, newPassword? }
function handleUpdateUser(data) {
  let updateData = data.updateData || {};
  if (typeof updateData === 'string') {
    try {
      updateData = JSON.parse(updateData);
    } catch (e) {
      return json(400, { success: false, message: '데이터 파싱 오류가 발생했습니다.' });
    }
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const found = findUserRow(sheet, data.id);
  if (!found) return json(404, { success: false, message: '사용자를 찾을 수 없습니다.' });

  // 비밀번호를 바꿀 때는 현재 비밀번호를 반드시 확인한다.
  if (updateData.newPassword && !checkPassword(found.row, updateData.currentPassword)) {
    return json(403, { success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
  }

  const r = found.rowNumber;
  if (updateData.department) sheet.getRange(r, USER_COLUMNS.DEPT + 1).setValue(updateData.department);
  if (updateData.major) sheet.getRange(r, USER_COLUMNS.MAJOR + 1).setValue(updateData.major);
  if (updateData.newPassword) setPassword(sheet, r, updateData.newPassword);

  return json(200, { success: true, message: '정보가 수정되었습니다.' });
}

function setPassword(sheet, rowNumber, newPassword) {
  const salt = generateSalt();
  sheet.getRange(rowNumber, USER_COLUMNS.PASSWORD + 1).setValue(hashPassword(newPassword, salt));
  sheet.getRange(rowNumber, USER_COLUMNS.SALT + 1).setValue(salt);
}

function handleVerifyPassword(data) {
  const found = findUserRow(getSheet(SHEET_NAMES.USERS), data.id);
  if (!found) return json(404, { success: false, message: '사용자를 찾을 수 없습니다.' });
  if (!checkPassword(found.row, data.password)) {
    return json(403, { success: false, message: '비밀번호가 일치하지 않습니다.' });
  }
  return json(200, { success: true, message: '비밀번호가 확인되었습니다.' });
}

// 회원 탈퇴: users, tier 행을 지우고 세션도 끊는다.
function handleDeleteAccount(data) {
  const { id, password } = data;
  const sheet = getSheet(SHEET_NAMES.USERS);
  const found = findUserRow(sheet, id);
  if (!found) return json(404, { success: false, message: '사용자를 찾을 수 없습니다.' });
  if (!checkPassword(found.row, password)) {
    return json(403, { success: false, message: '비밀번호가 일치하지 않습니다.' });
  }

  sheet.deleteRow(found.rowNumber);

  const sheetT = getSheet(SHEET_NAMES.TIER);
  const tierValues = sheetT.getDataRange().getValues();
  for (let j = 1; j < tierValues.length; j++) {
    if (tierValues[j][0] === id) {
      sheetT.deleteRow(j + 1);
      break;
    }
  }

  CacheService.getScriptCache().remove('session:' + data.token);
  return json(200, { success: true, message: '회원 탈퇴가 성공적으로 처리되었습니다.' });
}

function handleGetUserMatrixUrl(data) {
  const { id } = data;
  
  const user = findUserById(id);
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }
  
  const matrixUrl = user.url || '';
  
  return json(200, { 
    success: true, 
    matrixUrl: matrixUrl 
  });
}

function getCurrentYearSemester() {
  const now = new Date();
  const month = now.getMonth() + 1;
  // 1학기: 3~8월, 2학기: 9~2월. 1~2월은 전년도 2학기다.
  const year = month <= 2 ? now.getFullYear() - 1 : now.getFullYear();
  const semester = (month >= 3 && month <= 8) ? 1 : 2;

  return { year, semester };
}

function handleGetRecommendedPrograms(data) {
  const { id } = data;
  const { year, semester } = getCurrentYearSemester();

  const user = findUserById(id);
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }

  const matrixUrl = user.url;
  if (!matrixUrl) {
    return json(200, { success: true, data: [], message: '매트릭스 URL이 등록되지 않았습니다.' });
  }

  try {
    const matrixData = getMatrixDataFromUrl(matrixUrl, year, semester);
    const recommendations = getRecommendedPrograms(matrixData, year, semester, id);

    return json(200, {
      success: true, 
      data: recommendations,
      message: '추천 프로그램 조회 완료',
      meta: {
        totalPrograms: matrixData.length,
        recommendedCount: recommendations.length,
        year: year,
        semester: semester
      }
    });
    
  } catch (error) {
    console.error('❌ 매트릭스 데이터 조회 실패:', error);
    return json(200, { 
      success: false, 
      message: '매트릭스 데이터를 가져올 수 없습니다.' 
    });
  }
}

function isProgramCompleted(matrixData, programName) {
  return matrixData
    .filter(r => r['프로그램명'] === programName)
    .some(r => r['내 점수'] && r['내 점수'] !== '' && r['내 점수'] !== '0');
}

// 추천 규칙: tier 시트의 역량 점수가 낮은 역량부터, 최하위 역량은 2개·나머지는 1개씩,
// 아직 이수하지 않은 프로그램을 1회 점수 높은 순으로 고른다. 최대 6개.
function getRecommendedPrograms(matrixData, year, semester, id) {
  try {
    const trustScores = getTrustCategoryTotals(id);

    const categoryTotals = {};
    for (const [key, value] of Object.entries(trustScores)) {
      categoryTotals[key] = { total: value, count: 1, average: value };
    }

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => a.total - b.total);

    // tier 시트에 점수가 없으면 미이수 프로그램 중 1회 점수 높은 순으로 6개.
    if (sortedCategories.length === 0) {
      const allPrograms = matrixData
        .filter(row => !row['내 점수'] || row['내 점수'] === '' || row['내 점수'] === '0')
        .map(row => ({
          category: row['핵심역량'] || '',
          programName: row['프로그램명'] || '',
          firstScore: parseFloat(row['1회 점수']) || 0,
          maxScore: parseFloat(row['최대 점수']) || 0,
          details: row['상세항목'] || ''
        }))
        .sort((a, b) => b.firstScore - a.firstScore)
        .slice(0, 6);
      return allPrograms;
    }
    
    const recommendations = [];
    const maxRecommendations = 6;

    for (let i = 0; i < sortedCategories.length && recommendations.length < maxRecommendations; i++) {
      const [category, categoryInfo] = sortedCategories[i];
      const availablePrograms = matrixData
        .filter(row => 
          row['핵심역량'] === category &&
          !isProgramCompleted(matrixData, row['프로그램명'])
        )
        .map(row => ({
          category: row['핵심역량'] || '',
          programName: row['프로그램명'] || '',
          firstScore: parseFloat(row['1회 점수']) || 0,
          maxScore: parseFloat(row['최대 점수']) || 0,
          details: row['상세항목'] || ''
        }))
        .sort((a, b) => b.firstScore - a.firstScore);

      const recommendCount = (i === 0) ? 2 : 1;
      recommendations.push(...availablePrograms.slice(0, recommendCount));
    }

    return recommendations;
  } catch (error) {
    console.error('❌ 추천 프로그램 계산 오류:', error);
    return [];
  }
}

// tier 시트에서 사용자의 역량별 점수를 { 역량명: 점수 }로 읽는다. 없으면 {}.
function getTrustCategoryTotals(id) {
  const sheet = getSheet(SHEET_NAMES.TIER);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return {
        '유한인성역량': parseFloat(data[i][1]) || 0,
        '기초학습역량': parseFloat(data[i][2]) || 0,
        '직업기초역량': parseFloat(data[i][3]) || 0,
        '직무수행역량': parseFloat(data[i][4]) || 0,
        '취창업기초역량': parseFloat(data[i][5]) || 0,
      };
    }
  }
  return {};
}

// 매트릭스 시트의 'YYYY-N' 탭을 읽어 행 객체 배열로 돌려준다.
function getMatrixDataFromUrl(matrixUrl, year, semester) {
  try {
    const spreadsheetId = extractSpreadsheetIdFromUrl(matrixUrl);
    if (!spreadsheetId) {
      throw new Error('유효하지 않은 매트릭스 URL입니다.');
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = `${year}-${semester}`;
    let sheet = ss.getSheetByName(sheetName);
    const allSheets = ss.getSheets();

    if (!sheet) {
      // 요청 학기 탭이 없으면 가장 최근 학기 탭(2025-2, 2025-1, 2024-2 ...)을 쓴다.
      const yearSemesterPattern = /^(\d{4})-(\d{1,2})$/;
      const availableSheets = allSheets
        .map(s => ({ name: s.getName(), sheet: s }))
        .filter(s => yearSemesterPattern.test(s.name))
        .sort((a, b) => {
          const [yearA, semA] = a.name.split('-').map(Number);
          const [yearB, semB] = b.name.split('-').map(Number);
          if (yearA !== yearB) return yearB - yearA;
          return semB - semA;
        });
      
      if (availableSheets.length > 0) {
        sheet = availableSheets[0].sheet;
      } else if (allSheets.length > 0) {
        sheet = allSheets[0];
      } else {
        throw new Error('사용 가능한 시트가 없습니다.');
      }
    }

    if (!sheet) {
      throw new Error('시트를 찾을 수 없습니다.');
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const range = sheet.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();

    if (values.length <= 1) {
      return [];
    }

    const headers = values[0];
    const dataRows = values.slice(1);
    
    // 객체 배열로 변환 (날짜/숫자 형식 처리)
    const matrixData = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let value = row[index] || '';
        
        // 날짜로 인식된 분수 값들을 원래 형태로 복원
        if (value instanceof Date) {
          const month = value.getMonth() + 1;
          const day = value.getDate();
          const year = value.getFullYear();
          
          // 2025년 3월 4일 또는 5일로 변환된 경우 (3/5, 4/5 등)
          if (year === 2025 && month === 3 && (day === 4 || day === 5)) {
            value = `${month}/${day}`;
          }
          // 2025년 3월 3일로 변환된 경우 (3/3 등)
          else if (year === 2025 && month === 3 && day === 3) {
            value = `${month}/${day}`;
          }
          // 2025년 3월 8일로 변환된 경우 (8/3 등)
          else if (year === 2025 && month === 3 && day === 8) {
            value = `${day}/${month}`;
          }
          // 기타 분수 형태로 보이는 날짜들
          else if (year === 2025 && month <= 12 && day <= 31) {
            // 월/일 형태로 복원
            value = `${month}/${day}`;
          }
          // 2024년으로 변환된 경우들 (12/31, 1/1 등)
          else if (year === 2024 && month <= 12 && day <= 31) {
            value = `${month}/${day}`;
          }
          // 2023년으로 변환된 경우들
          else if (year === 2023 && month <= 12 && day <= 31) {
            value = `${month}/${day}`;
          }
          else {
            value = value.toLocaleDateString();
          }
        }
        
        if (typeof value === 'number') {
          value = value.toString();
        }
        
        obj[header] = value;
      });
      return obj;
    });

    // 요청한 탭이 없으면 다른 탭을 읽었을 수 있으니, 실제로 읽은 탭 이름을 함께 넘긴다.
    matrixData.sheetName = sheet.getName();
    return matrixData;
  } catch (error) {
    console.error('매트릭스 데이터 가져오기 오류:', error);
    throw error;
  }
}

// DB 시트를 연다. 탭이 없으면 만들고 헤더 행을 넣는다.
function getSheet(sheetName) {
  if (!SPREADSHEET_ID) throw new Error('스크립트 속성 SPREADSHEET_ID가 설정되지 않았습니다.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === SHEET_NAMES.USERS) {
      sheet.appendRow(['아이디', '비밀번호', '이름', '이메일', '학번', '학부', '전공', 'URL']);
    } else if (sheetName === SHEET_NAMES.TIER) {
      sheet.appendRow(['아이디', '유한인성역량', '기초학습역량', '직업기초역량', '직무수행역량', '취창업기초역량', '합산 점수', '티어', '다음티어', '필요점수', '1위여부']);
    }
  }
  return sheet;
}

// users 시트에서 아이디로 사용자 레코드를 객체로 반환합니다.
function findUserById(id) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      return {
        id: sheetData[i][0],
        password: sheetData[i][1],
        name: sheetData[i][2],
        email: sheetData[i][3],
        studentID: sheetData[i][4],
        department: sheetData[i][5],
        major: sheetData[i][6],
        url: sheetData[i][7],
        salt: sheetData[i][8]
      };
    }
  }
  return null;
}

// users 시트에서 학번으로 행 배열을 반환합니다.
function findUserByStudentID(studentID) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][4]) === studentID) { 
      return sheetData[i];
    }
  }
  return null;
}

// tier 시트에서 아이디로 행 배열을 반환합니다.
function findTierUserById(id) {
  const sheet = getSheet(SHEET_NAMES.TIER);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      return sheetData[i];
    }
  }
  return null;
}

// 티어 규칙: 5개 역량 모두 70점 이상인 학생만 순위에 든다.
// 합산 점수 기준 상위 5% Diamond, 10% Gold, 30% Silver, 나머지 Bronze. 결과는 8~11열에 한 번에 쓴다.
function recalculateAllTiers() {
  try {
    const sheet = getSheet(SHEET_NAMES.TIER);
    const sheetData = sheet.getDataRange().getValues();
    if (sheetData.length <= 1) {
      return json(200, { success: true, message: '재계산할 데이터가 없습니다.' });
    }

    const allStudents = sheetData.slice(1).map(row => ({
      id: row[0],
      scores: {
        유한인성역량: parseFloat(row[1]) || 0, 기초학습역량: parseFloat(row[2]) || 0,
        직업기초역량: parseFloat(row[3]) || 0, 직무수행역량: parseFloat(row[4]) || 0,
        취창업기초역량: parseFloat(row[5]) || 0,
      },
      totalScore: parseFloat(row[6]) || 0
    }));

    const qualifiedStudents = allStudents
      .filter(student => student.id && Object.values(student.scores).every(score => score >= 70))
      .sort((a, b) => b.totalScore - a.totalScore);
    
    const totalQualified = qualifiedStudents.length;
    let diamondCutoffScore = -1, goldCutoffScore = -1, silverCutoffScore = -1;

    if (totalQualified > 0) {
        const diamondCutoffRank = Math.ceil(totalQualified * 0.05);
        const goldCutoffRank = Math.ceil(totalQualified * 0.10);
        const silverCutoffRank = Math.ceil(totalQualified * 0.30);

        if (qualifiedStudents.length >= diamondCutoffRank) {
            diamondCutoffScore = qualifiedStudents[diamondCutoffRank - 1].totalScore;
        }
        if (qualifiedStudents.length >= goldCutoffRank) {
            goldCutoffScore = qualifiedStudents[goldCutoffRank - 1].totalScore;
        }
        if (qualifiedStudents.length >= silverCutoffRank) {
            silverCutoffScore = qualifiedStudents[silverCutoffRank - 1].totalScore;
        }
    }

    const updates = [];

    allStudents.forEach(student => {
      const isQualified = student.id && Object.values(student.scores).every(score => score >= 70);
      let tierValue = 'Unranked', nextTier = 'Bronze', scoreForNextTier = 70, isRankOne = false;

      if (isQualified && totalQualified > 0) {
        // 학생의 점수를 '커트라인 점수'와 직접 비교하여 등급을 결정합니다.
        if (student.totalScore >= diamondCutoffScore) {
            tierValue = 'Diamond';
        } else if (student.totalScore >= goldCutoffScore) {
            tierValue = 'Gold';
        } else if (student.totalScore >= silverCutoffScore) {
            tierValue = 'Silver';
        } else {
            tierValue = 'Bronze';
        }

        if (tierValue === 'Diamond' && student.totalScore >= qualifiedStudents[0].totalScore) {
            const rank = qualifiedStudents.findIndex(s => s.id === student.id) + 1;
            if (rank === 1) isRankOne = true;
        }

        // 결정된 등급을 기준으로 '다음 목표'와 '필요 점수'를 계산합니다.
        let targetScore = 0;
        if(isRankOne){
            nextTier = '1위';
            scoreForNextTier = 0;
        } else {
            switch(tierValue) {
                case 'Diamond':
                    nextTier = '1위';
                    targetScore = qualifiedStudents[0].totalScore + 1;
                    break;
                case 'Gold':
                    nextTier = 'Diamond';
                    targetScore = diamondCutoffScore + 1;
                    break;
                case 'Silver':
                    nextTier = 'Gold';
                    targetScore = goldCutoffScore + 1;
                    break;
                case 'Bronze':
                    nextTier = 'Silver';
                    targetScore = silverCutoffScore + 1;
                    break;
            }
            scoreForNextTier = Math.max(0, targetScore - student.totalScore);
        }
      }
      updates.push([tierValue, nextTier, scoreForNextTier, isRankOne]);
    });
    
    if (updates.length > 0) {
      sheet.getRange(2, 8, updates.length, 4).setValues(updates);
    }
    
    return json(200, { success: true, message: `점수가 저장되었습니다.` });
    
  } catch (error) {
    return json(500, { success: false, message: '재계산 중 오류가 발생했습니다: ' + String(error) });
  }
}

/**
 * 아이디 찾기: 이름·학번·이메일이 일치하면 인증번호를 메일로 보낸다.
 */
function handleSendVerificationCode(data) {
  const { name, studentID, email } = data;
  try {
    const allData = getSheet(SHEET_NAMES.USERS).getDataRange().getValues();
    const row = allData.slice(1).find(r =>
      r[USER_COLUMNS.NAME] == name && String(r[USER_COLUMNS.STUDENT_ID]) == String(studentID) && r[USER_COLUMNS.EMAIL] == email);
    if (!row) return json(404, { success: false, message: '입력하신 정보와 일치하는 사용자가 없습니다.' });

    const code = generateVerificationCode();
    MailApp.sendEmail(email, '[YUTIER] 아이디 찾기 인증번호 안내', `인증번호는 [ ${code} ] 입니다.`);
    putVerificationCode('idcode:' + email, code, row[USER_COLUMNS.ID]);
    return json(200, { success: true, message: '인증번호가 발송되었습니다.' });
  } catch (error) {
    console.error('handleSendVerificationCode 오류:', error);
    return json(500, { success: false, message: '인증번호 발송 중 오류가 발생했습니다.' });
  }
}

/**
 * 아이디 찾기: 인증번호가 맞으면 발송 때 확인한 사용자의 아이디를 돌려준다.
 */
function handleFindIdWithVerification(data) {
  const result = consumeVerificationCode('idcode:' + data.email, data.code);
  if (!result.ok) return json(400, { success: false, message: result.message });
  return json(200, { success: true, id: result.id });
}

/**
 * 비밀번호 찾기: 이름·아이디·이메일이 일치하면 인증번호를 메일로 보낸다.
 */
function handleSendVerificationCodeForPassword(data) {
  const { name, id, email } = data;
  try {
    const allData = getSheet(SHEET_NAMES.USERS).getDataRange().getValues();
    const exists = allData.slice(1).some(r =>
      r[USER_COLUMNS.NAME] == name && r[USER_COLUMNS.ID] == id && r[USER_COLUMNS.EMAIL] == email);
    if (!exists) return json(404, { success: false, message: '입력하신 정보와 일치하는 사용자가 없습니다.' });

    const code = generateVerificationCode();
    MailApp.sendEmail(email, '[YUTIER] 비밀번호 찾기 인증번호 안내', `인증번호는 [ ${code} ] 입니다.`);
    putVerificationCode('pwcode:' + email, code, id);
    return json(200, { success: true, message: '인증번호가 발송되었습니다.' });
  } catch (err) {
    console.error('handleSendVerificationCodeForPassword 오류:', err);
    return json(500, { success: false, message: '이메일 발송 중 오류가 발생했습니다.' });
  }
}

/**
 * 비밀번호 찾기: 인증번호가 맞으면 일회용 재설정 토큰을 발급한다.
 */
function handleFindPasswordWithVerification(data) {
  const result = consumeVerificationCode('pwcode:' + data.email, data.code);
  if (!result.ok) return json(400, { success: false, message: result.message });

  const resetToken = Utilities.getUuid();
  CacheService.getScriptCache().put('reset:' + resetToken, result.id, RESET_TOKEN_TTL);
  return json(200, { success: true, resetToken });
}

/**
 * 새 비밀번호 저장. 재설정 토큰이 있어야 하고, 토큰은 한 번 쓰면 사라진다.
 */
function handleUpdatePassword(data) {
  const { resetToken, newPassword } = data;
  if (!resetToken || !newPassword) return json(400, { success: false, message: '잘못된 요청입니다.' });

  const cache = CacheService.getScriptCache();
  const id = cache.get('reset:' + resetToken);
  if (!id) return json(401, { success: false, message: '인증이 만료되었습니다. 다시 인증해주세요.' });

  const sheet = getSheet(SHEET_NAMES.USERS);
  const found = findUserRow(sheet, id);
  if (!found) return json(404, { success: false, message: '사용자 정보를 찾을 수 없어 비밀번호를 변경할 수 없습니다.' });

  setPassword(sheet, found.rowNumber, newPassword);
  cache.remove('reset:' + resetToken);
  return json(200, { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
}

// JSON 응답 헬퍼. Apps Script 웹 앱은 HTTP 상태 코드를 바꿀 수 없어서 status는 읽기용 표시일 뿐이다.
function json(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}