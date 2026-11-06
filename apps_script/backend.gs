// Google Apps Script - Web App
// 이 스크립트는 React 프론트엔드로부터 들어오는 요청을 받아
// Google 스프레드시트(users, tier, major)를 읽고/쓰는 백엔드 역할을 합니다.
// 모든 응답은 JSON(TextOutput) 형식으로 반환합니다.
const SPREADSHEET_ID = '13QT8_OnNJ0FZaPkpx0_yMHz-v8ERg14lf9CXB_7bFzA'; // 실제 스프레드시트 ID로 변경

// 시트 이름 상수 정의
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

// 입력 비밀번호가 users 행(배열)의 저장값과 일치하는지 확인. salt가 없는 레거시 계정은 평문 비교.
function checkPassword(row, password) {
  if (!password) return false;
  const storedHash = row[USER_COLUMNS.PASSWORD];
  const salt = row[USER_COLUMNS.SALT];
  const inputHash = salt ? sha256Hex(salt + password) : String(password);
  return storedHash === inputHash;
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

/**
 * SHA-256 해시를 HEX 문자열로 반환
 */
function sha256Hex(str) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    str,
    Utilities.Charset.UTF_8
  );
  return raw.map(b => ('00' + (b & 0xff).toString(16)).slice(-2)).join('');
}

/**
 * 비밀번호 검증 함수
 */
function verifyPasswordHash(inputPassword, salt, storedHash) {
  try {
    if (!inputPassword || !salt || !storedHash) return false;

    const computedHash = sha256Hex(salt + inputPassword);
    return computedHash === storedHash;
  } catch (e) {
    console.error("verifyPasswordHash error:", e);
    return false;
  }
}

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '');
}

// 로그인 처리
// 입력: id, password
// 처리: users 시트 조회 후 일치 시 사용자 요약 정보 반환
function handleLogin(data) {
  const { id, password } = data;

  if (!id || !password) 
    return json(400, { success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });

  const userRow = findUserById(id);

  const fail = () => json(401, { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  if (!userRow) return fail();

  // 레거시 계정(salt 없음): 비밀번호가 맞으면 재설정 화면으로 보낸다.
  if (!userRow.salt) {
    if (userRow.password !== password) return fail();
    return json(401, {
      success: false,
      code: 'LEGACY_ACCOUNT',
      message: '계정 보안 기준 미달로 인해 비밀번호 재설정 페이지로 이동합니다.'
    });
  }

  if (!verifyPasswordHash(password, userRow.salt, userRow.password)) return fail();

  const user = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    studentId: userRow.studentID,
    department: userRow.department,
    major: userRow.major,
    matrixUrl: userRow.url || null,
    token: createSession(userRow.id)
  };
  return json(200, { success: true, message: '로그인 성공', user: user });
}

// 회원가입 처리
// 입력: id, password, name, email, studentID, department, major
// 처리: 아이디/학번 중복 검사 후 users 시트에 행 추가
function handleSignup(data) {
  const { id, password, name, email, studentID, department, major } = data;
  
  if (!id || !password || !name || !email || !studentID || !department || !major) {
    return json(400, { success: false, message: '모든 필드를 입력해주세요.' });
  }
  
  // 아이디 중복 확인
  if (findUserById(id)) {
    return json(200, { success: false, message: '이미 존재하는 아이디입니다.' });
  }
  
  // 학번 중복 확인
  if (findUserByStudentID(studentID)) {
    return json(200, { success: false, message: '이미 존재하는 학번입니다.' });
  }

  // 비밀번호 해싱
  const salt = generateSalt();                   
  const hash = sha256Hex(salt + password.trim()); 

  // 사용자 추가
  const sheet = getSheet(SHEET_NAMES.USERS);
  sheet.appendRow([id, hash, name, email, studentID, department, major, '', salt]);
  
  return json(200, { success: true, message: '회원가입이 완료되었습니다.' });
}

// 아이디 중복 확인
// 입력: id → { exists }
function handleCheckId(data) {
  const { id } = data;
  const exists = findUserById(id) !== null;
  return json(200, { exists });
}

// 학번 중복 확인
// 입력: studentID → { exists }
function handleCheckStudentID(data) {
  const { studentID } = data;
  const exists = findUserByStudentID(studentID) !== null;
  return json(200, { exists });
}

// 학부/전공 목록 조회
// major 시트의 각 열이 학부, 그 열 아래 행들이 전공이라고 가정합니다.
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
// 티어 점수 저장
// 입력: id, scores(JSON 또는 문자열)
// 처리: 1) 5개 핵심역량 모두 70점 이상 확인 → 2) 전체 학생들과 비교하여 상위 % 계산 → 3) 티어 산정
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
  
  if (rowIndex > 0) {
    // 7개 항목만 먼저 업데이트 (티어 정보 제외)
    sheet.getRange(rowIndex + 1, 1, 1, values.length).setValues([values]);
  } else {
    // 새 행 추가 시에도 7개 항목만 먼저 추가
    sheet.appendRow(values);
  }

  // 모든 사용자의 티어 재계산 실행
  return recalculateAllTiers();
}

// 티어 점수 조회
// 저장된 역량 점수들과 합산 점수를 반환합니다.
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

// 티어 정보 조회
// 저장된 티어 정보를 반환합니다. (새로운 컬럼 구조: 8=티어, 9=다음티어, 10=필요점수, 11=1위여부)
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

// 매트릭스 URL 검증
// URL 형식 확인 후 users 시트 8열(URL)에 저장합니다.
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

  // URL 저장
  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      sheet.getRange(i + 1, 8).setValue(url); // 8번째 컬럼에 URL 저장
      break;
    }
  }
  
  return json(200, { success: true, message: 'URL이 저장되었습니다.' });
}

// 매트릭스 URL 유효성 검사
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

// 사용자의 URL에서 스프레드시트 ID 추출
function extractSpreadsheetIdFromUrl(url) {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

// URL에서 gid(시트 탭 ID) 추출
function extractGidFromUrl(url) {
  if (!url) return null;
  const gidMatch = url.match(/[?#&]gid=(\d+)/);
  return gidMatch ? Number(gidMatch[1]) : null;
}

// 매트릭스 데이터 로드: users 시트의 url 컬럼에서 스프레드시트 ID 추출 후 읽기
// 입력: id, year, semester
function handleGetMatrix(data) {
  const { id, year, semester } = data;
  
  const user = findUserById(id);
  if (!user || !user.url) {
    return json(200, { success: false, message: '시트 URL 미등록' });
  }
  
  try {
    // 매트릭스 시트에서 데이터 가져오기
    const matrixData = getMatrixDataFromUrl(user.url, year, semester);
    
    // 헤더 추출 (첫 번째 행의 키들)
    const headers = matrixData.length > 0 ? Object.keys(matrixData[0]) : [];
    const dataRows = matrixData;
    
    return json(200, { 
      success: true, 
      header: headers, 
      data: dataRows, 
      sheetName: matrixData.sheetName
    });
  } catch (error) {
    console.error('매트릭스 데이터 로드 실패:', error);
    console.error('매트릭스 읽기 실패:', error);
    return json(200, { success: false, message: '매트릭스 시트를 읽지 못했습니다. 시트 공유 설정과 해당 학기 탭이 있는지 확인해주세요.' });
  }
}

// 매트릭스 데이터 저장: 프로그램별 점수와 이수 여부 저장
// 입력: updates 배열 [{ programName, myScore?, detailName?, isCompleted? }]
function handleSaveMatrix(data) {
  const { id, updates, year, semester } = data;

  // updates 파싱
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

    // 헤더 인덱스 선언
    const programNameCol = headers.indexOf('프로그램명');
    const detailCol = headers.indexOf('상세항목');
    const completedCol = headers.indexOf('이수/미이수');
    const myScoreCol = headers.indexOf('내 점수');
    const oneScoreCol = headers.indexOf('1회 점수');
    const maxScoreCol = headers.indexOf('최대 점수');

    if (programNameCol === -1)
      return json(200, { success: false, message: '프로그램명 컬럼을 찾을 수 없습니다.' });

    // 문자열 비교 함수 (공백, undefined 방지)
    const eq = (a, b) => (a ?? '').toString().trim() === (b ?? '').toString().trim();

    // 각 업데이트 적용
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
            break; // 일치하는 상세항목 1건만 처리
          }
        }
        return; // 이 update 끝
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
          break; // 대표행 1건만 처리
        }
      }
    });

    return json(200, { success: true, message: '저장이 완료되었습니다.' });
  } catch (err) {
    return json(200, { success: false, message: '매트릭스 저장 실패: ' + String(err) });
  }
}

// 회원 정보 수정
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
  sheet.getRange(rowNumber, USER_COLUMNS.PASSWORD + 1).setValue(sha256Hex(salt + newPassword));
  sheet.getRange(rowNumber, USER_COLUMNS.SALT + 1).setValue(salt);
}

// 비밀번호 확인
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

// 사용자의 매트릭스 URL 조회
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

/**
 * 추천 프로그램 조회 API
 * 사용자의 매트릭스 시트에서 데이터를 가져와 추천 로직을 적용하여 반환
 * 
 * @param {Object} data - 요청 데이터
 * @param {string} data.id - 사용자 ID
 * @param {number} data.year - 연도 (예: 2025)
 * @param {number} data.semester - 학기 (예: 2)
 * @returns {Object} JSON 응답 { success: boolean, data: Array, message: string }
 */
// 현재 연도와 학기를 자동으로 계산
function getCurrentYearSemester() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1~12월
  // 1학기: 3~8월, 2학기: 9~2월. 1~2월은 전년도 2학기다.
  const year = month <= 2 ? now.getFullYear() - 1 : now.getFullYear();
  const semester = (month >= 3 && month <= 8) ? 1 : 2;

  return { year, semester };
}

function handleGetRecommendedPrograms(data) {
  const { id } = data;
  const { year, semester } = getCurrentYearSemester();

  // 현재 학기 정보 콘솔 출력

  
  // 1. 사용자 정보 확인
  const user = findUserById(id);
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }
  
  // 2. 매트릭스 URL 확인
  const matrixUrl = user.url;
  if (!matrixUrl) {
    return json(200, { success: true, data: [], message: '매트릭스 URL이 등록되지 않았습니다.' });
  }
  
  try {
    // 3. 매트릭스 시트에서 데이터 가져오기
    const matrixData = getMatrixDataFromUrl(matrixUrl, year, semester);
    
    // 4. 추천 프로그램 로직 적용
    const recommendations = getRecommendedPrograms(matrixData, year, semester, id);
    
    // 5. 결과 반환
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


/**
 * 추천 프로그램 로직 구현
 * 핵심역량별 총합을 계산하여 낮은 점수의 역량을 우선 추천
 * 
 * 추천 규칙:
 * 1. 핵심역량별 총합 계산 (내 점수가 있는 프로그램들)
 * 2. 총합이 낮은 순서로 정렬 (오름차순)
 * 3. 최하위 핵심역량: 2개 프로그램 추천
 * 4. 나머지 핵심역량: 각각 1개씩 추천
 * 5. 최대 6개까지 추천
 * 6. 1회 점수 높은 순으로 정렬
 * 
 * @param {Array} matrixData - 매트릭스 데이터 배열
 * @param {number} year - 연도
 * @param {number} semester - 학기
 * @returns {Array} 추천 프로그램 배열
 */
function getRecommendedPrograms(matrixData, year, semester, id) {
  try {
    
    // 1. 핵심역량별 총합 계산 (전체 학기 기준)
    const trustScores = getTrustCategoryTotals(id);

    const categoryTotals = {};
    for (const [key, value] of Object.entries(trustScores)) {
    categoryTotals[key] = { total: value, count: 1, average: value };
  }
    
    // 2. 핵심역량을 총합 점수 오름차순으로 정렬 (낮은 점수 우선)
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => a.total - b.total);
    
    // 3. 핵심역량이 없는 경우 처리
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
    
    // 4. 각 핵심역량별로 프로그램 추천
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

      const recommendCount = (i === 0) ? 2 : 1; // 가장 낮은 역량 2개, 나머지 1개씩
      recommendations.push(...availablePrograms.slice(0, recommendCount));
    }

    return recommendations;
  } catch (error) {
    console.error('❌ 추천 프로그램 계산 오류:', error);
    return [];
  }
}


/**
 * 핵심역량별 총합 계산
 * 각 핵심역량에 대해 사용자가 입력한 점수들의 총합을 계산
 * 
 * @param {Array} matrixData - 매트릭스 데이터 배열
 * @returns {Object} 핵심역량별 총합 정보 { [역량명]: { total: number, count: number, average: number, programs: Array } }
 */
function calculateCategoryTotals(matrixData) {
  const categoryTotals = {};
  
  
  // 각 행을 순회하며 핵심역량별 점수 집계
  for (const row of matrixData) {
    const category = row['핵심역량'] || '';
    const myScore = parseFloat(row['내 점수']) || 0;
    const programName = row['프로그램명'] || '';
    
    // 핵심역량과 프로그램명이 모두 있는 경우만 처리
    if (category && programName) {
      // 새로운 핵심역량인 경우 초기화
      if (!categoryTotals[category]) {
        categoryTotals[category] = { 
          total: 0, 
          count: 0, 
          programs: [] 
        };
      }
      
      // "내 점수"가 있는 경우만 총합에 포함
      if (myScore > 0) {
        categoryTotals[category].total += myScore;
        categoryTotals[category].count += 1;
        categoryTotals[category].programs.push({
          name: programName,
          score: myScore
        });
      } else {
      }
    }
  }
  
  // 각 핵심역량별 평균 점수 계산
  for (const category in categoryTotals) {
    const data = categoryTotals[category];
    data.average = data.count > 0 ? data.total / data.count : 0;
  }
  
  return categoryTotals;
}

/**
 * TIER 시트에서 사용자 역량 점수를 불러옵니다.
 * @param {string} id - 사용자 ID
 * @returns {Object} { '유한인성역량': 80, '기초학습역량': 75, ... }
 */
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

// 매트릭스 시트에서 데이터 가져오기
function getMatrixDataFromUrl(matrixUrl, year, semester) {
  try {
    
    // URL에서 스프레드시트 ID 추출
    const spreadsheetId = extractSpreadsheetId(matrixUrl);
    if (!spreadsheetId) {
      throw new Error('유효하지 않은 매트릭스 URL입니다.');
    }
    
    // 스프레드시트 열기
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    // 시트 이름 생성 (예: "2025-2")
    const sheetName = `${year}-${semester}`;
    let sheet = ss.getSheetByName(sheetName);
    
    
    // 사용 가능한 시트 목록 확인
    const allSheets = ss.getSheets();
    allSheets.forEach(s => {
    });
    
    if (!sheet) {
      
      // 최신 시트 찾기 (2025-2, 2025-1, 2024-2, 2024-1 순서)
      const yearSemesterPattern = /^(\d{4})-(\d{1,2})$/;
      const availableSheets = allSheets
        .map(s => ({ name: s.getName(), sheet: s }))
        .filter(s => yearSemesterPattern.test(s.name))
        .sort((a, b) => {
          const [yearA, semA] = a.name.split('-').map(Number);
          const [yearB, semB] = b.name.split('-').map(Number);
          if (yearA !== yearB) return yearB - yearA; // 년도 내림차순
          return semB - semA; // 학기 내림차순
        });
      
      if (availableSheets.length > 0) {
        sheet = availableSheets[0].sheet;
      } else if (allSheets.length > 0) {
        sheet = allSheets[0];
      } else {
        throw new Error('사용 가능한 시트가 없습니다.');
      }
    } else {
    }
    
    // sheet가 여전히 undefined인지 확인
    if (!sheet) {
      throw new Error('시트를 찾을 수 없습니다.');
    }
    
    
    if (!sheet) {
      console.error('❌ 최종적으로 유효한 시트를 찾지 못했습니다. 데이터 로드를 진행할 수 없습니다.');
      throw new Error('데이터를 로드할 유효한 시트를 찾을 수 없습니다.');
    }
    
    // 선택된 시트에서 이수/미이수 데이터가 있는지 확인
    const testRange = sheet.getRange(1, 1, Math.min(10, sheet.getLastRow()), sheet.getLastColumn());
    const testValues = testRange.getValues();
    const testCompletionColumnIndex = testValues[0].findIndex(header => header === '이수/미이수');
    
    if (testCompletionColumnIndex !== -1) {
      const completionValues = testValues.slice(1).map(row => row[testCompletionColumnIndex]).filter(val => val && val.toString().trim() !== '');
      
      if (completionValues.length === 0) {
        
        // 다른 시트에서 이수/미이수 데이터가 있는 시트 찾기
        for (const testSheet of allSheets) {
          if (!testSheet.sheet) {
            console.error(`❌ 루프 내에서 시트 객체가 유효하지 않습니다: ${testSheet.name}`);
            continue; // 유효하지 않은 시트는 건너뛰기
          }
          
          const testRange2 = testSheet.sheet.getRange(1, 1, Math.min(10, testSheet.sheet.getLastRow()), testSheet.sheet.getLastColumn());
          const testValues2 = testRange2.getValues();
          const testCompletionColumnIndex2 = testValues2[0].findIndex(header => header === '이수/미이수');
          
          if (testCompletionColumnIndex2 !== -1) {
            const completionValues2 = testValues2.slice(1).map(row => row[testCompletionColumnIndex2]).filter(val => val && val.toString().trim() !== '');
            if (completionValues2.length > 0) {
              sheet = testSheet.sheet;
              break;
            }
          }
        }
      }
    }
    
    // 데이터 범위 가져오기 (헤더 포함) - 더 넓은 범위로 읽기
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // A1부터 마지막 셀까지 모든 데이터 읽기
    const range = sheet.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();
    
    
    if (values.length <= 1) {
      return [];
    }
    
    // 첫 번째 행(헤더) 확인
    
    // 이수/미이수 컬럼이 있는지 확인
    const completionColumnIndex = values[0].findIndex(header => header === '이수/미이수');
    
    if (completionColumnIndex !== -1) {
      // 이수/미이수 컬럼의 실제 값들 확인 (처음 10개 행)
      const completionValues = values.slice(1, 11).map(row => row[completionColumnIndex]);
    }
    
    // 헤더와 데이터 분리
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
        
        // 숫자 값인 경우 문자열로 변환 (소수점 처리)
        if (typeof value === 'number') {
          if (Number.isInteger(value)) {
            value = value.toString();
          } else {
            value = value.toString();
          }
        }
        
        obj[header] = value;
      });
      return obj;
    });
    
    
    // 이수/미이수 컬럼 데이터 확인을 위한 디버깅
    
    // 이수/미이수 컬럼 인덱스 찾기 (이미 위에서 선언됨)
    
    if (completionColumnIndex !== -1) {
      // 이수/미이수 컬럼의 모든 값들 확인
      const completionValues = matrixData.map(row => row['이수/미이수']).filter(val => val && val.trim() !== '');
      
      const completedItems = matrixData.filter(row => row['이수/미이수'] === '이수');
      if (completedItems.length > 0) {
      }
    } else {
    }

    // 요청한 탭이 없으면 다른 탭을 읽었을 수 있으니, 실제로 읽은 탭 이름을 함께 넘긴다.
    matrixData.sheetName = sheet.getName();
    return matrixData;
    
  } catch (error) {
    console.error('매트릭스 데이터 가져오기 오류:', error);
    throw error;
  }
}

// URL에서 스프레드시트 ID 추출
function extractSpreadsheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// 헬퍼 함수들
// 시트를 열고 없으면 생성하며, 필요한 경우 헤더를 초기화합니다.
function getSheet(sheetName) {
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
        url: sheetData[i][7],  // matrixUrl 대신 url로 변경
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

/**
 * 전체 티어 시스템 재계산
 * 모든 학생의 티어를 새로운 규칙에 따라 재계산하고 시트에 한 번에 업데이트합니다.
 */
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

        // 1위 여부 확인
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