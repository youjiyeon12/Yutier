// Google Apps Script - Web App (GET 요청 처리)
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

// 웹 앱 진입점: 쿼리 파라미터의 action 값으로 라우팅합니다.
function doGet(e) {
  try {
    const { action, ...data } = e.parameter || {};
    console.log('=== API 호출 시작 (GET) ===');
    console.log('요청된 액션:', action);
    console.log('전체 파라미터:', e.parameter);
    console.log('현재 시간:', new Date().toISOString());
    
    return routeRequest(action, data);
  } catch (err) {
    return json(500, { success: false, message: 'Server error', detail: String(err) });
  }
}

// POST 요청 처리: JSON 데이터를 받아서 처리합니다.
function doPost(e) {
  try {
    console.log('=== API 호출 시작 (POST) ===');
    console.log('POST 데이터:', e.postData);
    console.log('현재 시간:', new Date().toISOString());
    
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        return json(200, { success: false, message: 'JSON 파싱 오류: ' + String(parseError) });
      }
    }
    
    const { action, ...requestData } = data;
    console.log('요청된 액션:', action);
    console.log('요청 데이터:', requestData);
    
    return routeRequest(action, requestData);
  } catch (error) {
    console.error('POST API 처리 중 오류:', error);
    return json(200, { success: false, message: '서버 오류: ' + String(error) });
  }
}

// 공통 라우팅 함수
function routeRequest(action, data) {
  switch (action) {
    case 'login':
      return handleLogin(data);
    case 'signup':
      return handleSignup(data);
    case 'checkId':
      return handleCheckId(data);
    case 'checkStudentID':
      return handleCheckStudentID(data);
    case 'getMajorList':
      return handleGetMajorList();
    case 'updateUser':
      return handleUpdateUser(data);
    case 'verifyMatrixUrl':
      return handleVerifyMatrixUrl(data);
    case 'validateMatrixUrl':
      return handleValidateMatrixUrl(data);
    case 'getMatrix':
      return handleGetMatrix(data);
    case 'saveMatrix':
      return handleSaveMatrix(data);
    case 'saveTierScores':
      return handleSaveTierScores(data);
    case 'getTierScores':
      return handleGetTierScores(data);
    case 'getTierInfo':
      return handleGetTierInfo(data);
    case 'getRecommendedPrograms':
      return handleGetRecommendedPrograms(data);
    case 'getUserMatrixUrl':
      return handleGetUserMatrixUrl(data);
    case 'verifyPassword':
      return handleVerifyPassword(data);
    case 'deleteAccount':
      return handleDeleteAccount(data);
    case 'sendVerificationCode':
      return handleSendVerificationCode(data);
    case 'findIdWithVerification':
      return handleFindIdWithVerification(data);
     case 'sendVerificationCodeForPassword':
      return handleSendVerificationCodeForPassword(data);
    case 'findPasswordWithVerification':
      return handleFindPasswordWithVerification(data);
    case 'updatePassword':
      return handleUpdatePassword(data);
    case 'recalculateAllTiers':
      return recalculateAllTiers();
    default:
      return json(400, { success: false, message: 'Unknown action' });
  }
}

// 로그인 처리
// 입력: id, password
// 처리: users 시트 조회 후 일치 시 사용자 요약 정보 반환
function handleLogin(data) {
  const { id, password } = data;
  if (!id || !password) {
    return json(400, { success: false, message: 'ID와 비밀번호가 필요합니다.' });
  }
  
  const user = findUserById(id);
  if (user && user.password === password) {
    return json(200, {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        studentId: user.studentID,
        department: `${user.department} ${user.major}`,
        matrixUrl: user.url || null  // url 속성 사용
      }
    });
  }
  
  return json(200, { success: false, message: '로그인 실패' });
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
  
  // 사용자 추가
  const sheet = getSheet(SHEET_NAMES.USERS);
  sheet.appendRow([id, password, name, email, studentID, department, major, '']);
  
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
  // URL 쿼리로 전달된 경우 문자열이므로 파싱
  if (typeof scores === 'string') {
    try { scores = JSON.parse(scores); } catch (e) { scores = {}; }
  }
  
  // 1. 5개 핵심역량 점수 추출
  const competencyScores = {
    유한인성역량: parseFloat(scores.유한인성역량) || 0,
    기초학습역량: parseFloat(scores.기초학습역량) || 0,
    직업기초역량: parseFloat(scores.직업기초역량) || 0,
    직무수행역량: parseFloat(scores.직무수행역량) || 0,
    취창업기초역량: parseFloat(scores.취창업기초역량) || 0
  };
  
  const totalScore = Object.values(competencyScores).reduce((sum, score) => sum + score, 0);
  
  // 2. 티어 자격 확인: 모든 핵심역량이 70점 이상인지 확인
  const isQualified = Object.values(competencyScores).every(score => score >= 70);
  
  // 3. 티어 계산
  let tierValue = 'Unranked';
  let nextTier = 'Bronze';
  let scoreForNextTier = 70;
  let isRankOne = false;
  
  if (isQualified) {
    // 자격이 있는 경우, 전체 학생들과 비교하여 상위 % 계산
    const tierResult = calculateTierByRanking(id, totalScore);
    tierValue = tierResult.tier;
    nextTier = tierResult.nextTier;
    scoreForNextTier = tierResult.scoreForNextTier;
    isRankOne = tierResult.isRankOne;
    
    console.log('🎯 [handleSaveTierScores] 티어 계산 결과:');
    console.log('🏆 계산된 티어:', tierValue);
    console.log('🎯 다음 목표:', nextTier);
    console.log('📊 필요 점수:', scoreForNextTier);
    console.log('🥇 1등 여부:', isRankOne);
  } else {
    console.log('❌ [handleSaveTierScores] 자격 미달 - Unranked 처리');
  }
  
  const sheet = getSheet(SHEET_NAMES.TIER);
  const sheetData = sheet.getDataRange().getValues();
  
  // 기존 사용자 찾기
  let rowIndex = -1;
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      rowIndex = i;
      break;
    }
  }
  
  const values = [id, scores.유한인성역량, scores.기초학습역량, scores.직업기초역량, scores.직무수행역량, scores.취창업기초역량, totalScore, tierValue, nextTier, scoreForNextTier, isRankOne];
  
  if (rowIndex > 0) {
    // 기존 행 업데이트
    for (let i = 0; i < values.length; i++) {
      sheet.getRange(rowIndex + 1, i + 1).setValue(values[i]);
    }
  } else {
    // 새 행 추가
    sheet.appendRow(values);
  }
  
  return json(200, { success: true, message: '점수가 성공적으로 등록되었습니다.' });
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
  console.log('매트릭스 데이터 로드 요청:', { id, year, semester });
  
  const user = findUserById(id);
  if (!user || !user.url) {
    return json(200, { success: false, message: '시트 URL 미등록' });
  }
  
  try {
    // 매트릭스 시트에서 데이터 가져오기
    const matrixData = getMatrixDataFromUrl(user.url, year, semester);
    console.log('매트릭스 데이터 로드 성공, 데이터 길이:', matrixData.length);
    console.log('매트릭스 데이터 샘플:', matrixData.slice(0, 3)); // 처음 3개 행만 로그
    
    // 헤더 추출 (첫 번째 행의 키들)
    const headers = matrixData.length > 0 ? Object.keys(matrixData[0]) : [];
    const dataRows = matrixData;
    
    return json(200, { 
      success: true, 
      header: headers, 
      data: dataRows, 
      sheetName: `${year}-${semester}`,
      debug: {
        message: '매트릭스 데이터 로드 성공',
        timestamp: new Date().toISOString(),
        action: 'getMatrix',
        dataCount: matrixData.length,
        sampleData: matrixData.slice(0, 2) // 처음 2개 행 샘플
      }
    });
  } catch (error) {
    console.error('매트릭스 데이터 로드 실패:', error);
    return json(200, { success: false, message: '매트릭스 읽기 실패: ' + String(error) });
  }
}

// 매트릭스 데이터 저장: 프로그램별 점수와 이수 여부 저장
// 입력: updates 배열 [{ programName, myScore?, detailName?, isCompleted? }]
function handleSaveMatrix(data) {
  const { id, updates, year, semester } = data;
  
  // updates가 JSON 문자열인 경우 파싱
  let parsedUpdates = updates;
  if (typeof updates === 'string') {
    try {
      parsedUpdates = JSON.parse(updates);
    } catch (e) {
      console.error('updates 파싱 오류:', e);
      return json(200, { success: false, message: '데이터 파싱 오류가 발생했습니다.' });
    }
  }
  
  console.log('파싱된 updates:', parsedUpdates);
  
  const user = findUserById(id);
  if (!user || !user.url) {
    return json(200, { success: false, message: '시트 URL 미등록' });
  }
  const spreadsheetId = extractSpreadsheetIdFromUrl(user.url);
  if (!spreadsheetId) {
    return json(200, { success: false, message: 'URL에서 스프레드시트 ID를 추출할 수 없습니다.' });
  }
  if (!parsedUpdates || !parsedUpdates.length) {
    return json(200, { success: false, message: '업데이트할 내용이 없습니다.' });
  }
  
  if (!year || !semester) {
    return json(200, { success: false, message: '연도와 학기 정보가 필요합니다.' });
  }

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheetName = `${year}-${semester}`;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return json(404, { success: false, message: `'${sheetName}' 시트를 찾을 수 없습니다.` });
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return json(200, { success: false, message: '데이터가 없습니다.' });
    }
    
    const headers = values[0];
    const programNameCol = headers.indexOf('프로그램명');
    const myScoreCol = headers.indexOf('내 점수');
    const detailCol = headers.indexOf('상세항목');
    const completedCol = headers.indexOf('이수/미이수');
    
    if (programNameCol === -1) {
      return json(200, { success: false, message: '프로그램명 컬럼을 찾을 수 없습니다.' });
    }
    
    // 각 업데이트를 적용
    parsedUpdates.forEach(update => {
      const { programName, myScore, detailName, isCompleted } = update;
      
      // 데이터 행에서 해당 프로그램 찾기
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row[programNameCol] === programName) {
          // 내 점수 업데이트
          if (myScore !== undefined && myScoreCol !== -1) {
            sheet.getRange(i + 1, myScoreCol + 1).setValue(myScore);
          }
          
          // 상세항목 이수 여부 업데이트
          if (detailName && isCompleted !== undefined && detailCol !== -1 && completedCol !== -1) {
            // 상세항목이 일치하는 행 찾기
            for (let j = i; j < values.length; j++) {
              const detailRow = values[j];
              if (detailRow[programNameCol] === programName && detailRow[detailCol] === detailName) {
                sheet.getRange(j + 1, completedCol + 1).setValue(isCompleted ? '이수' : '');
                break;
              }
            }
          }
          break;
        }
      }
    });
    
    return json(200, { success: true, message: '저장이 완료되었습니다.' });
  } catch (err) {
    return json(200, { success: false, message: '매트릭스 저장 실패: ' + String(err) });
  }
}

// 회원 정보 수정
// 입력: id, updateData { department?, major?, currentPassword?, newPassword? }
function handleUpdateUser(data) {
  const { id, updateData } = data;
  
  // updateData가 JSON 문자열인 경우 파싱
  let parsedUpdateData = updateData;
  if (typeof updateData === 'string') {
    try {
      parsedUpdateData = JSON.parse(updateData);
    } catch (e) {
      console.error('updateData 파싱 오류:', e);
      return json(200, { success: false, message: '데이터 파싱 오류가 발생했습니다.' });
    }
  }
  
  console.log('파싱된 updateData:', parsedUpdateData);
  
  const user = findUserById(id);
  
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }
  
  // 비밀번호 검증
  if (parsedUpdateData.newPassword && user.password !== parsedUpdateData.currentPassword) {
    return json(200, { success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
  }
  
  // 정보 수정
  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      if (parsedUpdateData.department) {
        sheet.getRange(i + 1, 6).setValue(parsedUpdateData.department);
        console.log('학부 업데이트:', parsedUpdateData.department);
      }
      if (parsedUpdateData.major) {
        sheet.getRange(i + 1, 7).setValue(parsedUpdateData.major);
        console.log('전공 업데이트:', parsedUpdateData.major);
      }
      if (parsedUpdateData.newPassword) {
        sheet.getRange(i + 1, 2).setValue(parsedUpdateData.newPassword);
        console.log('비밀번호 업데이트됨');
      }
      break;
    }
  }
  
  return json(200, { success: true, message: '정보가 수정되었습니다.' });
}

// 비밀번호 확인
function handleVerifyPassword(data) {
  const { id, password } = data;
  const user = findUserById(id);
  
  if (!user) {
    return json(200, { message: '사용자를 찾을 수 없습니다.' });
  }
  
  if (user.password !== password) {
    return json(200, { message: '비밀번호가 일치하지 않습니다.' });
  }
  
  return json(200, { success: true, message: '비밀번호가 확인되었습니다.' });
}

// 회원 탈퇴
function handleDeleteAccount(data) {
  const { id, password } = data;
  const user = findUserById(id);
  
  if (!user) {
    return json(200, { message: '사용자를 찾을 수 없습니다.' });
  }
  
  if (user.password !== password) {
    return json(200, { message: '비밀번호가 일치하지 않습니다.' });
  }
  
  // 사용자 데이터 삭제
  const sheet = getSheet(SHEET_NAMES.USERS);
  const sheetData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  return json(200, { message: '회원 탈퇴가 성공적으로 처리되었습니다.' });
}

// 사용자의 매트릭스 URL 조회
function handleGetUserMatrixUrl(data) {
  const { id } = data;
  console.log('사용자 매트릭스 URL 조회 요청:', { id });
  
  const user = findUserById(id);
  if (!user) {
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }
  
  const matrixUrl = user.url || '';
  console.log('사용자 매트릭스 URL:', matrixUrl);
  
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
function handleGetRecommendedPrograms(data) {
  const { id, year, semester } = data;
  console.log('=== 추천 프로그램 조회 시작 ===');
  console.log('요청 정보:', { 사용자ID: id, 연도: year, 학기: semester });
  
  // 1. 사용자 정보 확인
  const user = findUserById(id);
  if (!user) {
    console.log('❌ 사용자를 찾을 수 없습니다:', id);
    return json(200, { success: false, message: '사용자를 찾을 수 없습니다.' });
  }
  
  // 2. 매트릭스 URL 확인
  const matrixUrl = user.url;
  if (!matrixUrl) {
    console.log('⚠️ 사용자 매트릭스 URL이 없습니다:', id);
    return json(200, { success: true, data: [], message: '매트릭스 URL이 등록되지 않았습니다.' });
  }
  
  try {
    // 3. 매트릭스 시트에서 데이터 가져오기
    console.log('📊 매트릭스 데이터 조회 중...');
    const matrixData = getMatrixDataFromUrl(matrixUrl, year, semester);
    console.log('✅ 매트릭스 데이터 조회 성공, 총 데이터 수:', matrixData.length);
    
    // 4. 추천 프로그램 로직 적용
    console.log('🎯 추천 프로그램 계산 중...');
    const recommendations = getRecommendedPrograms(matrixData, year, semester);
    console.log('✅ 추천 프로그램 계산 완료, 추천 수:', recommendations.length);
    
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
      message: '매트릭스 데이터를 가져올 수 없습니다: ' + error.message 
    });
  }
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
function getRecommendedPrograms(matrixData, year, semester) {
  try {
    console.log('🎯 추천 프로그램 로직 시작');
    console.log('📊 처리할 데이터 수:', matrixData.length);
    
    // 1. 핵심역량별 총합 계산 (전체 학기 기준)
    const categoryTotals = calculateCategoryTotals(matrixData);
    console.log('📈 핵심역량별 총합:', categoryTotals);
    
    // 2. 핵심역량을 총합 점수 오름차순으로 정렬 (낮은 점수 우선)
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => a.total - b.total);
    console.log('📋 정렬된 핵심역량 (낮은 순):', sortedCategories.map(([name, info]) => `${name}: ${info.total}점`));
    
    // 3. 핵심역량이 없는 경우 처리 - 모든 프로그램을 1회 점수 순으로 정렬
    if (sortedCategories.length === 0) {
      console.log('⚠️ 핵심역량이 없음 - 모든 프로그램을 1회 점수 순으로 정렬');
      const allPrograms = matrixData
        .filter(row => {
          // 내 점수가 비어있는 프로그램만 추천 대상
          const myScore = row['내 점수'] || '';
          const isMyScoreEmpty = !myScore || myScore === '' || myScore === 0 || myScore === '0';
          return isMyScoreEmpty;
        })
        .map(row => ({
          category: row['핵심역량'] || '',
          programName: row['프로그램명'] || '',
          firstScore: parseFloat(row['1회 점수']) || 0,
          maxScore: parseFloat(row['최대 점수']) || 0,
          hasDetails: (row['상세항목'] && row['상세항목'] !== '') ? true : false,
          details: row['상세항목'] || ''
        }))
        .sort((a, b) => b.firstScore - a.firstScore) // 1회 점수 높은 순
        .slice(0, 6); // 최대 6개
      
      console.log('📋 전체 프로그램 추천 (1회 점수 순):', allPrograms.length, '개');
      return allPrograms;
    }
    
    const recommendations = [];
    const maxRecommendations = 6;
    
    // 4. 각 핵심역량별로 프로그램 추천
    for (let i = 0; i < sortedCategories.length && recommendations.length < maxRecommendations; i++) {
      const [category, categoryInfo] = sortedCategories[i];
      console.log(`🔍 핵심역량 "${category}" 처리 중 (총합: ${categoryInfo.total}점)`);
      
      // 5. 현재 학기 데이터에서 "내 점수"가 없는 프로그램만 필터링
      const availablePrograms = matrixData
        .filter(row => {
          const coreCompetency = row['핵심역량'] || '';
          const myScore = row['내 점수'] || '';
          const isMyScoreEmpty = !myScore || myScore === '' || myScore === 0 || myScore === '0';
          
          return coreCompetency === category && isMyScoreEmpty;
        })
        .map(row => ({
          category: row['핵심역량'] || '',
          programName: row['프로그램명'] || '',
          firstScore: parseFloat(row['1회 점수']) || 0,
          maxScore: parseFloat(row['최대 점수']) || 0,
          hasDetails: (row['상세항목'] && row['상세항목'] !== '') ? true : false,
          details: row['상세항목'] || ''
        }))
        .sort((a, b) => b.firstScore - a.firstScore); // 1회 점수 높은 순
      
      console.log(`📊 핵심역량 "${category}"에서 사용 가능한 프로그램:`, availablePrograms.length, '개');
      
      // 6. 추천 개수 결정 (최하위 핵심역량: 2개, 나머지: 1개)
      let recommendCount = (i === 0) ? 2 : 1;
      
      // 7. 추천 프로그램 추가
      const selectedPrograms = availablePrograms.slice(0, recommendCount);
      recommendations.push(...selectedPrograms);
      
      console.log(`✅ 핵심역량 "${category}"에서 ${selectedPrograms.length}개 프로그램 추천`);
    }
    
    console.log(`🎉 총 추천 프로그램: ${recommendations.length}개`);
    console.log('📝 최종 추천 목록:', recommendations.map(p => `${p.category} - ${p.programName} (${p.firstScore}점)`));
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
  
  console.log('📊 핵심역량별 총합 계산 시작');
  console.log('📋 처리할 데이터 행 수:', matrixData.length);
  
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
        console.log(`✅ 점수 포함: ${category} - ${programName} (${myScore}점)`);
      } else {
        console.log(`⏭️ 점수 없음: ${category} - ${programName} (내 점수: "${row['내 점수']}")`);
      }
    }
  }
  
  // 각 핵심역량별 평균 점수 계산
  for (const category in categoryTotals) {
    const data = categoryTotals[category];
    data.average = data.count > 0 ? data.total / data.count : 0;
    console.log(`📈 ${category}: 총합=${data.total}점, 개수=${data.count}개, 평균=${data.average.toFixed(1)}점`);
  }
  
  console.log('🎯 최종 핵심역량별 총합:', categoryTotals);
  return categoryTotals;
}

// 매트릭스 시트에서 데이터 가져오기
function getMatrixDataFromUrl(matrixUrl, year, semester) {
  try {
    console.log('매트릭스 URL에서 데이터 가져오기:', matrixUrl);
    
    // URL에서 스프레드시트 ID 추출
    console.log('🔍 추출할 URL:', matrixUrl);
    const spreadsheetId = extractSpreadsheetId(matrixUrl);
    console.log('🔍 추출된 스프레드시트 ID:', spreadsheetId);
    if (!spreadsheetId) {
      throw new Error('유효하지 않은 매트릭스 URL입니다.');
    }
    
    // 스프레드시트 열기
    const ss = SpreadsheetApp.openById(spreadsheetId);
    console.log(`✅ 스프레드시트 열기 성공: ${ss.getName()}`);
    
    // 시트 이름 생성 (예: "2025-2")
    const sheetName = `${year}-${semester}`;
    let sheet = ss.getSheetByName(sheetName);
    console.log(`초기 sheet 객체 (ss.getSheetByName 결과):`, sheet ? sheet.getName() : 'null/undefined');
    
    console.log(`=== 시트 선택 디버깅 ===`);
    console.log(`찾고 있는 시트 이름: ${sheetName}`);
    
    // 사용 가능한 시트 목록 확인
    const allSheets = ss.getSheets();
    console.log('사용 가능한 시트들:');
    allSheets.forEach(s => {
      console.log(`- ${s.getName()}`);
    });
    
    if (!sheet) {
      console.log(`시트 ${sheetName}을 찾을 수 없습니다.`);
      
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
        console.log(`최신 시트 "${availableSheets[0].name}" 사용`);
        sheet = availableSheets[0].sheet;
      } else if (allSheets.length > 0) {
        console.log(`첫 번째 시트 "${allSheets[0].getName()}" 사용`);
        sheet = allSheets[0];
      } else {
        console.log('사용 가능한 시트가 없습니다.');
        throw new Error('사용 가능한 시트가 없습니다.');
      }
    } else {
      console.log(`시트 ${sheetName}을 찾았습니다.`);
    }
    
    // sheet가 여전히 undefined인지 확인
    if (!sheet) {
      console.log('❌ 시트를 찾을 수 없습니다.');
      throw new Error('시트를 찾을 수 없습니다.');
    }
    
    console.log(`최종 선택된 시트: ${sheet.getName()}`);
    console.log(`최종 선택된 시트 (데이터 로드 직전):`, sheet ? sheet.getName() : 'null/undefined');
    
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
      console.log(`선택된 시트의 이수/미이수 값들 (처음 10개):`, completionValues);
      
      if (completionValues.length === 0) {
        console.log('⚠️ 선택된 시트에 이수/미이수 데이터가 없습니다. 다른 시트를 찾아보겠습니다.');
        
        // 다른 시트에서 이수/미이수 데이터가 있는 시트 찾기
        for (const testSheet of allSheets) {
          console.log(`루프 내 시트 확인: ${testSheet.name}, 유효성:`, testSheet.sheet ? '유효함' : '유효하지 않음');
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
              console.log(`✅ 시트 "${testSheet.name}"에서 이수/미이수 데이터를 찾았습니다!`);
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
    console.log(`시트의 마지막 행: ${lastRow}, 마지막 열: ${lastCol}`);
    
    // A1부터 마지막 셀까지 모든 데이터 읽기
    const range = sheet.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();
    
    console.log(`데이터 범위: ${range.getA1Notation()}`);
    console.log(`읽어온 데이터 행 수: ${values.length}`);
    console.log(`읽어온 데이터 열 수: ${values[0] ? values[0].length : 0}`);
    
    if (values.length <= 1) {
      console.log('데이터가 없습니다.');
      return [];
    }
    
    // 첫 번째 행(헤더) 확인
    console.log('첫 번째 행 (헤더):', values[0]);
    
    // 이수/미이수 컬럼이 있는지 확인
    const completionColumnIndex = values[0].findIndex(header => header === '이수/미이수');
    console.log('이수/미이수 컬럼 인덱스:', completionColumnIndex);
    
    if (completionColumnIndex !== -1) {
      // 이수/미이수 컬럼의 실제 값들 확인 (처음 10개 행)
      const completionValues = values.slice(1, 11).map(row => row[completionColumnIndex]);
      console.log('이수/미이수 컬럼의 실제 값들 (처음 10개):', completionValues);
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
    
    console.log(`매트릭스 데이터 변환 완료: ${matrixData.length}개 행`);
    
    // 이수/미이수 컬럼 데이터 확인을 위한 디버깅
    console.log('=== 이수/미이수 컬럼 디버깅 ===');
    console.log('헤더 목록:', headers);
    
    // 이수/미이수 컬럼 인덱스 찾기 (이미 위에서 선언됨)
    console.log('이수/미이수 컬럼 인덱스:', completionColumnIndex);
    
    if (completionColumnIndex !== -1) {
      // 이수/미이수 컬럼의 모든 값들 확인
      const completionValues = matrixData.map(row => row['이수/미이수']).filter(val => val && val.trim() !== '');
      console.log('이수/미이수 컬럼의 고유 값들:', [...new Set(completionValues)]);
      console.log('빈 값이 아닌 이수/미이수 값 개수:', completionValues.length);
      
      const completedItems = matrixData.filter(row => row['이수/미이수'] === '이수');
      console.log(`이수 완료된 항목 수: ${completedItems.length}개`);
      if (completedItems.length > 0) {
        console.log('이수 완료된 항목 샘플:', completedItems.slice(0, 3));
      }
    } else {
      console.log('❌ 이수/미이수 컬럼을 찾을 수 없습니다!');
      console.log('사용 가능한 컬럼들:', headers);
    }
    
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

// 테스트용 함수 - 추천 프로그램 로직 테스트
function testRecommendationLogic() {
  console.log('=== 추천 프로그램 로직 테스트 시작 ===');
  
  // 테스트용 매트릭스 데이터 생성
  const testMatrixData = [
    {
      '핵심역량': '유한인성역량',
      '프로그램명': '사회봉사',
      '1회 점수': 5,
      '최대 점수': 10,
      '내 점수': '', // 비어있음 - 추천 대상
      '상세항목': ''
    },
    {
      '핵심역량': '유한인성역량',
      '프로그램명': '유한인성역량 교양 교과',
      '1회 점수': 5,
      '최대 점수': 20,
      '내 점수': 10, // 점수 있음 - 추천 제외
      '상세항목': '직장예절(e러닝)'
    },
    {
      '핵심역량': '직무수행역량',
      '프로그램명': '학습성과 경진대회',
      '1회 점수': 10,
      '최대 점수': 15,
      '내 점수': '', // 비어있음 - 추천 대상
      '상세항목': ''
    },
    {
      '핵심역량': '직무수행역량',
      '프로그램명': '전공관련 경진대회',
      '1회 점수': 8,
      '최대 점수': 12,
      '내 점수': '', // 비어있음 - 추천 대상
      '상세항목': '교외 참가'
    }
  ];
  
  console.log('테스트 데이터:', testMatrixData);
  
  // 핵심역량별 총합 계산 테스트
  const categoryTotals = calculateCategoryTotals(testMatrixData);
  console.log('핵심역량별 총합 결과:', categoryTotals);
  
  // 추천 프로그램 계산 테스트
  const recommendations = getRecommendedPrograms(testMatrixData, 2025, 2);
  console.log('추천 프로그램 결과:', recommendations);
  console.log('추천 프로그램 개수:', recommendations.length);
  
  console.log('=== 테스트 완료 ===');
  
  return {
    categoryTotals: categoryTotals,
    recommendations: recommendations,
    recommendationCount: recommendations.length
  };
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
        url: sheetData[i][7]  // matrixUrl 대신 url로 변경
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
    if (sheetData[i][4] === studentID) {
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
 * 상위 % 기반 티어 계산 함수
 * 자격이 있는 학생들 중에서 합산 점수 순위에 따라 티어를 결정
 * 
 * @param {string} currentUserId - 현재 사용자 ID
 * @param {number} currentUserScore - 현재 사용자의 합산 점수
 * @returns {Object} { tier, nextTier, scoreForNextTier, isRankOne }
 */
function calculateTierByRanking(currentUserId, currentUserScore) {
  console.log('🎯 [calculateTierByRanking] 티어 계산 시작');
  console.log('👤 [calculateTierByRanking] 사용자 ID:', currentUserId);
  console.log('📊 [calculateTierByRanking] 사용자 점수:', currentUserScore);
  
  try {
    // 1. 자격이 있는 모든 학생들의 점수 조회
    const qualifiedStudents = getQualifiedStudents();
    console.log('📋 [calculateTierByRanking] 자격 있는 학생 수:', qualifiedStudents.length);
    
    if (qualifiedStudents.length === 0) {
      console.log('⚠️ [calculateTierByRanking] 자격 있는 학생이 없음');
      return { tier: 'Bronze', nextTier: 'Silver', scoreForNextTier: 0, isRankOne: false };
    }
    
    // 2. 점수 기준으로 내림차순 정렬
    qualifiedStudents.sort((a, b) => b.totalScore - a.totalScore);
    console.log('📊 [calculateTierByRanking] 정렬된 학생들:', qualifiedStudents.slice(0, 5).map(s => `${s.id}: ${s.totalScore}점`));
    
    // 3. 현재 사용자의 순위 찾기
    const currentUserRank = qualifiedStudents.findIndex(student => student.id === currentUserId) + 1;
    console.log('🏆 [calculateTierByRanking] 현재 사용자 순위:', currentUserRank);
    
    if (currentUserRank === 0) {
      console.log('❌ [calculateTierByRanking] 사용자를 찾을 수 없음');
      return { tier: 'Bronze', nextTier: 'Silver', scoreForNextTier: 0, isRankOne: false };
    }
    
    // 4. 상위 % 계산
    const totalQualified = qualifiedStudents.length;
    const percentile = (currentUserRank / totalQualified) * 100;
    console.log('📈 [calculateTierByRanking] 상위 퍼센트:', percentile.toFixed(2) + '%');
    
    // 5. 티어 결정
    let tier, nextTier, scoreForNextTier, isRankOne;
    
    if (percentile <= 5) {
      tier = 'Diamond';
      if (currentUserRank === 1) {
        // 1등인 경우
        nextTier = '1위';
        scoreForNextTier = 0; // 이미 1등
        isRankOne = true;
      } else {
        // Diamond이지만 1등이 아닌 경우
        nextTier = '1위';
        scoreForNextTier = qualifiedStudents[0].totalScore + 1; // 1등 점수 + 1
        isRankOne = false;
      }
    } else if (percentile <= 10) {
      tier = 'Gold';
      nextTier = 'Diamond';
      // Diamond 커트라인 찾기 (상위 5% 경계)
      const diamondCutoff = Math.ceil(totalQualified * 0.05);
      scoreForNextTier = qualifiedStudents[diamondCutoff - 1].totalScore + 1;
      isRankOne = false;
    } else if (percentile <= 30) {
      tier = 'Silver';
      nextTier = 'Gold';
      // Gold 커트라인 찾기 (상위 10% 경계)
      const goldCutoff = Math.ceil(totalQualified * 0.10);
      scoreForNextTier = qualifiedStudents[goldCutoff - 1].totalScore + 1;
      isRankOne = false;
    } else {
      tier = 'Bronze';
      nextTier = 'Silver';
      // Silver 커트라인 찾기 (상위 30% 경계)
      const silverCutoff = Math.ceil(totalQualified * 0.30);
      scoreForNextTier = qualifiedStudents[silverCutoff - 1].totalScore + 1;
      isRankOne = false;
    }
    
    console.log('✅ [calculateTierByRanking] 최종 결과:');
    console.log('🏆 티어:', tier);
    console.log('🎯 다음 목표:', nextTier);
    console.log('📊 필요 점수:', scoreForNextTier);
    console.log('🥇 1위 여부:', isRankOne);
    
    return { tier, nextTier, scoreForNextTier, isRankOne };
    
  } catch (error) {
    console.error('❌ [calculateTierByRanking] 오류 발생:', error);
    return { tier: 'Bronze', nextTier: 'Silver', scoreForNextTier: 0, isRankOne: false };
  }
}

/**
 * 자격이 있는 학생들 조회
 * 모든 핵심역량이 70점 이상인 학생들만 반환
 * 
 * @returns {Array} 자격 있는 학생들의 배열 [{ id, totalScore, scores }]
 */
function getQualifiedStudents() {
  console.log('🔍 [getQualifiedStudents] 자격 있는 학생들 조회 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.TIER);
    const sheetData = sheet.getDataRange().getValues();
    
    if (sheetData.length <= 1) {
      console.log('📋 [getQualifiedStudents] 데이터가 없음');
      return [];
    }
    
    const qualifiedStudents = [];
    
    // 각 행을 순회하며 자격 확인
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const id = row[0];
      const scores = {
        유한인성역량: parseFloat(row[1]) || 0,
        기초학습역량: parseFloat(row[2]) || 0,
        직업기초역량: parseFloat(row[3]) || 0,
        직무수행역량: parseFloat(row[4]) || 0,
        취창업기초역량: parseFloat(row[5]) || 0
      };
      
      const totalScore = parseFloat(row[6]) || 0;
      
      // 모든 핵심역량이 70점 이상인지 확인
      const isQualified = Object.values(scores).every(score => score >= 70);
      
      if (isQualified) {
        qualifiedStudents.push({
          id: id,
          totalScore: totalScore,
          scores: scores
        });
        console.log(`✅ [getQualifiedStudents] 자격 통과: ${id} (${totalScore}점)`);
      } else {
        console.log(`❌ [getQualifiedStudents] 자격 미달: ${id} (점수: ${Object.values(scores).join(', ')})`);
      }
    }
    
    console.log(`📊 [getQualifiedStudents] 총 자격 있는 학생: ${qualifiedStudents.length}명`);
    return qualifiedStudents;
    
  } catch (error) {
    console.error('❌ [getQualifiedStudents] 오류 발생:', error);
    return [];
  }
}

/**
 * 전체 티어 시스템 재계산
 * 모든 학생의 티어를 새로운 규칙에 따라 재계산합니다.
 * 기존 데이터가 있는 경우 사용할 수 있습니다.
 */
function recalculateAllTiers() {
  console.log('🔄 [recalculateAllTiers] 전체 티어 재계산 시작');
  
  try {
    const sheet = getSheet(SHEET_NAMES.TIER);
    const sheetData = sheet.getDataRange().getValues();
    
    if (sheetData.length <= 1) {
      console.log('📋 [recalculateAllTiers] 데이터가 없음');
      return { success: true, message: '재계산할 데이터가 없습니다.' };
    }
    
    let updatedCount = 0;
    
    // 각 학생의 티어를 재계산
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const id = row[0];
      
      if (!id) continue;
      
      const scores = {
        유한인성역량: parseFloat(row[1]) || 0,
        기초학습역량: parseFloat(row[2]) || 0,
        직업기초역량: parseFloat(row[3]) || 0,
        직무수행역량: parseFloat(row[4]) || 0,
        취창업기초역량: parseFloat(row[5]) || 0
      };
      
      const totalScore = parseFloat(row[6]) || 0;
      
      // 자격 확인
      const isQualified = Object.values(scores).every(score => score >= 70);
      
      let tierValue = 'Unranked';
      let nextTier = 'Bronze';
      let scoreForNextTier = 70;
      let isRankOne = false;
      
      if (isQualified) {
        const tierResult = calculateTierByRanking(id, totalScore);
        tierValue = tierResult.tier;
        nextTier = tierResult.nextTier;
        scoreForNextTier = tierResult.scoreForNextTier;
        isRankOne = tierResult.isRankOne;
      }
      
      // 시트 업데이트
      sheet.getRange(i + 1, 8).setValue(tierValue);        // 티어
      sheet.getRange(i + 1, 9).setValue(nextTier);         // 다음티어
      sheet.getRange(i + 1, 10).setValue(scoreForNextTier); // 필요점수
      sheet.getRange(i + 1, 11).setValue(isRankOne);        // 1위여부
      
      updatedCount++;
      console.log(`✅ [recalculateAllTiers] ${id} 업데이트 완료: ${tierValue}`);
    }
    
    console.log(`🎉 [recalculateAllTiers] 재계산 완료: ${updatedCount}명`);
    return { success: true, message: `${updatedCount}명의 티어가 재계산되었습니다.` };
    
  } catch (error) {
    console.error('❌ [recalculateAllTiers] 오류 발생:', error);
    return { success: false, message: '재계산 중 오류가 발생했습니다: ' + error.message };
  }
}

/**
 * 아이디 찾기용 인증번호 발송 처리 핸들러
 * @param {Object} data - { name, studentID, email }
 * @returns {ContentService.TextOutput} JSON 응답
 */
function handleSendVerificationCode(data) {
  const { name, studentID, email } = data;

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.USERS);
    const allData = sheet.getDataRange().getValues();
    let userExists = false;

    // 사용자 존재 여부 확인
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      // C열=이름(2), E열=학번(4), D열=이메일(3)
      if (row[2] == name && String(row[4]) == String(studentID) && row[3] == email) {
        userExists = true;
        break;
      }
    }

    if (!userExists) {
      return json(404, { success: false, message: '입력하신 정보와 일치하는 사용자가 없습니다.' });
    }
    
    // 6자리 랜덤 인증번호 생성
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    
    // CacheService를 이용해 3분(180초) 동안만 인증번호 임시 저장
    const cache = CacheService.getScriptCache();
    cache.put(email, verificationCode, 180); // 키: 이메일, 값: 인증번호, 유효시간: 180초
    
    // MailApp을 이용해 사용자에게 이메일 발송
    const subject = "[YUTIER] 아이디 찾기 인증번호 안내";
    const body = `YUTIER 아이디 찾기를 위한 인증번호는 [ ${verificationCode} ] 입니다. 3분 내에 입력해주세요.`;
    MailApp.sendEmail(email, subject, body);
    
    return json(200, { success: true, message: '인증번호가 발송되었습니다.' });

  } catch (error) {
    console.error("handleSendVerificationCode 오류:", error);
    return json(500, { success: false, message: '인증번호 발송 중 오류가 발생했습니다.' });
  }
}

/**
 * 인증번호 확인 후 아이디를 반환하는 핸들러
 * @param {Object} data - { email, code }
 * @returns {ContentService.TextOutput} JSON 응답
 */
function handleFindIdWithVerification(data) {
  const { email, code } = data;
  try {
    const cache = CacheService.getScriptCache();
    const storedCode = cache.get(email);
    
    // 캐시에 저장된 코드가 있는지, 만료되지는 않았는지 확인
    if (storedCode == null) {
      return json(400, { success: false, message: '인증번호 유효 시간이 만료되었습니다. 다시 시도해주세요.' });
    }
    
    // 사용자가 입력한 코드와 저장된 코드가 일치하는지 확인
    if (storedCode != code) {
      return json(400, { success: false, message: '인증번호가 일치하지 않습니다.' });
    }
    
    // 인증 성공! 시트에서 아이디를 찾아서 반환
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.USERS);
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      // A열=아이디(0), D열=이메일(3)
      if (row[3] == email) {
        cache.remove(email); // 인증에 사용된 코드는 즉시 삭제하여 재사용 방지
        return json(200, { success: true, id: row[0] });
      }
    }
    
    // 혹시 모를 예외 상황 (인증은 됐는데 DB에 이메일이 없는 경우)
    return json(404, { success: false, message: '사용자 정보를 찾는 데 실패했습니다.' });
    
  } catch (error) {
    console.error("handleFindIdWithVerification 오류:", error);
    return json(500, { success: false, message: '인증 확인 중 오류가 발생했습니다.' });
  }
}

/**
 * 비밀번호 찾기용 인증번호 발송 처리
 */
function handleSendVerificationCodeForPassword(data) {
  const { name, id, email } = data;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.USERS);
  const allData = sheet.getDataRange().getValues();
  const userExists = allData.slice(1).some(row => row[2] == name && row[0] == id && row[3] == email);
  
  if (!userExists) {
    return json(404, { success: false, message: '입력하신 정보와 일치하는 사용자가 없습니다.' });
  }
  
  const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
  try {
    MailApp.sendEmail(email, '[YUTIER] 비밀번호 찾기 인증번호 안내', `인증번호는 [ ${verificationCode} ] 입니다.`);
    CacheService.getScriptCache().put(email, verificationCode, 180);
    return json(200, { success: true, message: '인증번호가 발송되었습니다.' });
  } catch (err) {
    return json(500, { success: false, message: '이메일 발송 중 오류가 발생했습니다.' });
  }
}

/**
 * 비밀번호 찾기용 인증번호 확인 처리
 */
function handleFindPasswordWithVerification(data) {
  const { email, code } = data;
  const cache = CacheService.getScriptCache();
  const storedCode = cache.get(email);
  
  if (storedCode == null) return json(400, { success: false, message: '인증 시간이 만료되었습니다.' });
  if (storedCode != code) return json(400, { success: false, message: '인증번호가 일치하지 않습니다.' });
  
  // 인증 성공 시 프론트엔드에서 UI를 변경할 수 있도록 성공 응답만 보냄
  return json(200, { success: true });
}

/**
 * 새 비밀번호 업데이트 처리 
 */
function handleUpdatePassword(data) {
  const { id, newPassword } = data;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAMES.USERS);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) { // A열(아이디)
      const hashedPassword = newPassword;
      sheet.getRange(i + 1, 2).setValue(hashedPassword); // B열(비밀번호)
      
      const userEmail = allData[i][3]; // D열(이메일)
      CacheService.getScriptCache().remove(userEmail);
      
      return json(200, { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    }
  }
  
  return json(404, { success: false, message: '사용자 정보를 찾을 수 없어 비밀번호를 변경할 수 없습니다.' });
}

// JSON 응답 헬퍼: 항상 JSON 텍스트로 반환합니다.
function json(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
