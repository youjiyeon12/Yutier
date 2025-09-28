/**
 * Google Apps Script Web App 서비스
 * React 프론트엔드에서 Google Apps Script 웹앱으로 요청을 보내는 중앙 서비스
 * 
 * 주요 기능:
 * - 사용자 인증 (로그인/회원가입)
 * - 매트릭스 데이터 관리
 * - 티어 점수 계산 및 조회
 * - 추천 프로그램 조회
 * 
 * 모든 요청은 GET 방식으로 URL 파라미터를 통해 전달되며, 
 * Apps Script의 doGet() 함수가 처리합니다.
 */

// 환경 변수에서 Apps Script URL 가져오기
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// 환경 변수 로딩 확인 (개발 시에만)
if (import.meta.env.DEV) {
  console.log("🔧 [googleSheetsService] 개발 모드 - 환경 변수 확인:");
  console.log("🔧 [googleSheetsService] VITE_APPS_SCRIPT_URL:", APPS_SCRIPT_URL);
}

/**
 * Apps Script API 호출 헬퍼 함수
 * 
 * @param {string} action - 호출할 액션명 (예: 'login', 'getRecommendedPrograms')
 * @param {Object} data - 요청 데이터 객체
 * @returns {Promise<Object>} Apps Script의 JSON 응답 또는 오류 객체
 * 
 * 처리 과정:
 * 1. 객체/배열 데이터를 JSON 문자열로 직렬화
 * 2. URL 파라미터로 변환하여 GET 요청 전송
 * 3. 응답을 JSON으로 파싱하여 반환
 */
const callAppsScriptAPI = async (action, data = {}) => {
  console.log(`🚀 [API] ${action} 호출 시작`);
  console.log(`📤 [API] 요청 데이터:`, data);
  
  try {
    // 1. 데이터 직렬화 (객체/배열을 JSON 문자열로 변환)
    const serialized = { action };
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && typeof value === 'object') {
        serialized[key] = JSON.stringify(value);
      } else {
        serialized[key] = value;
      }
    });
    
    // 2. URL 파라미터 생성 및 요청 URL 구성
    const params = new URLSearchParams(serialized);
    const fullUrl = `${APPS_SCRIPT_URL}?${params}`;
    
    console.log(`🌐 [API] 요청 URL (길이: ${fullUrl.length}자):`, fullUrl);
    
    // 3. HTTP GET 요청 전송
    const response = await fetch(fullUrl, {
      method: 'GET'
    });

    console.log(`📡 [API] 응답 상태:`, response.status, response.statusText);

    // 응답 상태 확인
    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }

    // 응답 텍스트 파싱
    const text = await response.text();
    console.log(`📄 [API] 응답 텍스트 (처음 200자):`, text.substring(0, 200));
    
    // HTML 응답 확인 (Apps Script 배포 문제)
    if (text.includes('<!doctype') || text.includes('<html')) {
      console.error('❌ [API] Apps Script가 HTML을 반환했습니다. 배포 설정을 확인하세요.');
      return { success: false, message: 'Apps Script 배포 설정을 확인하세요.' };
    }

    // JSON 파싱 및 반환
    const parsedData = JSON.parse(text);
    console.log(`✅ [API] 파싱된 응답:`, parsedData);
    
    // 디버그 정보 로깅 (개발 모드에서만)
    if (parsedData.debug && import.meta.env.DEV) {
      console.log(`🔍 [API] 디버그 정보:`, parsedData.debug);
      console.log(`🔍 [API] 호출된 액션:`, parsedData.debug.action);
      console.log(`🔍 [API] 응답 시간:`, parsedData.debug.timestamp);
    }
    
    return parsedData;
    
  } catch (error) {
    console.error('❌ [API] Apps Script API 호출 오류:', error);
    console.error('❌ [API] 에러 타입:', typeof error);
    console.error('❌ [API] 에러 스택:', error.stack);
    return { success: false, message: 'API 호출 실패: ' + error.message };
  }
};

// API 서비스 객체
// React 컴포넌트에서 사용할 수 있는 모든 Google Sheets 관련 API를 제공합니다.
// 각 메서드는 Apps Script의 해당 액션을 호출하며, 오류 발생 시 적절한 폴백 값을 반환합니다.
export const googleSheetsService = {
  // 아이디 중복 확인
  // 입력: id(문자열) → 반환: { exists: boolean }
  async checkId(id) {
    try {
      const result = await callAppsScriptAPI('checkId', { id });
      return result;
    } catch (error) {
      console.error('아이디 중복 확인 오류:', error);
      return { exists: false };
    }
  },

  // 회원가입
  // 입력: userData { id, password, name, email, studentID, department, major }
  // 반환: { success: boolean, message: string }
  async signup(userData) {
    try {
      const result = await callAppsScriptAPI('signup', userData);
      return result;
    } catch (error) {
      console.error('회원가입 오류:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  },

  // 로그인
  // 입력: id, password → 반환: { success: boolean, user?: object }
  async login(id, password) {
    try {
      const result = await callAppsScriptAPI('login', { id, password });
      return result;
    } catch (error) {
      console.error('로그인 오류:', error);
      return { success: false };
    }
  },

  // 학번 중복 확인
  // 입력: studentID(문자열) → 반환: { exists: boolean }
  async checkStudentID(studentID) {
    try {
      const result = await callAppsScriptAPI('checkStudentID', { studentID });
      return result;
    } catch (error) {
      console.error('학번 중복 확인 오류:', error);
      return { exists: false };
    }
  },

  // 학부/전공 목록 조회
  // 반환: { [학부명]: [전공배열] } 형태의 객체
  async getMajorList() {
    try {
      const result = await callAppsScriptAPI('getMajorList');
      return result;
    } catch (error) {
      console.error('학부/전공 목록 조회 오류:', error);
      return {};
    }
  },

  // 회원 정보 수정
  // 입력: id, updateData { department?, major?, currentPassword?, newPassword? }
  // 반환: { success: boolean, message: string }
  async updateUser(id, updateData) {
    try {
      const result = await callAppsScriptAPI('updateUser', { id, updateData });
      return result;
    } catch (error) {
      console.error('회원 정보 수정 오류:', error);
      return { success: false, message: '정보 수정 중 오류가 발생했습니다.' };
    }
  },

  // 매트릭스 URL 검증 및 저장
  // 입력: id, url(Google Sheets URL) → 반환: { success: boolean, message: string }
  async verifyMatrixUrl(id, url) {
    console.log(`🔍 [verifyMatrixUrl] 호출 시작, id:`, id, "url:", url);
    try {
      const result = await callAppsScriptAPI('verifyMatrixUrl', { id, url });
      console.log(`🔍 [verifyMatrixUrl] 결과:`, result);
      return result;
    } catch (error) {
      console.error('❌ [verifyMatrixUrl] 매트릭스 URL 검증 오류:', error);
      return { success: false, message: '시트 접근 실패 (공유 안됐거나 잘못된 URL)' };
    }
  },

  // 매트릭스 URL 유효성 검사
  // 입력: id → 반환: { valid: boolean, message?: string }
  async validateMatrixUrl(id) {
    try {
      const result = await callAppsScriptAPI('validateMatrixUrl', { id });
      return result;
    } catch (error) {
      console.error('매트릭스 URL 유효성 검사 오류:', error);
      return {
        valid: false,
        message: '시트에 접근할 수 없습니다. 삭제되었거나 공유되지 않았을 수 있습니다.'
      };
    }
  },

  // 매트릭스 데이터 로드 (간소화된 버전)
  // 입력: id, range(선택) → 반환: { success: boolean, header: array, data: array }
  async loadMatrix(id, year, semester) {
    console.log(`🔍 [loadMatrix] 호출 시작, id:`, id, "year:", year, "semester:", semester);
    try {
      const result = await callAppsScriptAPI('getMatrix', { id, year, semester });
      console.log(`🔍 [loadMatrix] 결과:`, result);
      return result;
    } catch (error) {
      console.error('❌ [loadMatrix] 매트릭스 데이터 로드 오류:', error);
      return { success: false, message: '매트릭스 데이터 로드 실패' };
    }
  },

  // 매트릭스 데이터 저장 (간소화된 버전)
  // 입력: id, updates [{ programName, myScore?, detailName?, isCompleted? }] → 반환: { success: boolean, message: string }
  async saveMatrix(id, updates, year, semester) {
    console.log(`💾 [saveMatrix] 매트릭스 저장 시작, id:`, id, "updates:", updates);
    
    // URL 길이 제한을 피하기 위해 데이터를 작은 청크로 나누어 전송
    const CHUNK_SIZE = 20; // 한 번에 20개씩 처리 (변경된 데이터만 저장하므로 더 크게 설정)
    const chunks = [];
    
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      chunks.push(updates.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`💾 [saveMatrix] ${updates.length}개 업데이트를 ${chunks.length}개 청크로 분할`);
    
    try {
      // 각 청크를 순차적으로 처리
      for (let i = 0; i < chunks  .length; i++) {
        console.log(`💾 [saveMatrix] 청크 ${i + 1}/${chunks.length} 처리 중...`);
        const result = await callAppsScriptAPI('saveMatrix', { id, updates: chunks[i], year, semester });
        
        if (!result.success) {
          console.error(`❌ [saveMatrix] 청크 ${i + 1} 저장 실패:`, result.message);
          return { success: false, message: `청크 ${i + 1} 저장 실패: ${result.message}` };
        }
        
        console.log(`✅ [saveMatrix] 청크 ${i + 1} 저장 완료`);
      }
      
      console.log(`✅ [saveMatrix] 모든 청크 저장 완료`);
      return { success: true, message: '저장이 완료되었습니다.' };
      
    } catch (error) {
      console.error('❌ [saveMatrix] 매트릭스 저장 오류:', error);
      return { success: false, message: '매트릭스 저장 실패: ' + error.message };
    }
  },

  // 티어 점수 저장
  // 입력: id, scores { 유한인성역량, 기초학습역량, 직업기초역량, 직무수행역량, 취창업기초역량 }
  // 처리: Apps Script에서 합산 점수 계산 및 티어 산정 후 저장
  // 반환: { success: boolean, message: string }
  async saveTierScores(id, scores) {
    try {
      const result = await callAppsScriptAPI('saveTierScores', { id, scores });
      return result;
    } catch (error) {
      console.error('티어 점수 저장 오류:', error);
      return { success: false, message: '서버 오류가 발생했습니다.' };
    }
  },

  // 티어 점수 조회
  // 입력: id → 반환: { success: boolean, scores: object, totalScore: number }
  async getTierScores(id) {
    try {
      const result = await callAppsScriptAPI('getTierScores', { id });
      return result;
    } catch (error) {
      console.error('티어 점수 조회 오류:', error);
      return { success: false, message: '서버 오류가 발생했습니다.' };
    }
  },

  // 티어 정보 조회
  // 입력: id → 반환: { success: boolean, userName: string, currentTier: string, currentScore: number, ... }
  // 주의: 저장된 티어 값을 신뢰하며 재계산하지 않습니다.
  async getTierInfo(id) {
    console.log(`🔍 [getTierInfo] 호출 시작, id:`, id);
    try {
      const result = await callAppsScriptAPI('getTierInfo', { id });
      console.log(`🔍 [getTierInfo] 결과:`, result);
      return result;
    } catch (error) {
      console.error('❌ [getTierInfo] 티어 정보 조회 오류:', error);
      return { success: false, message: '서버 오류' };
    }
  },

  /**
   * 추천 프로그램 조회
   * 사용자의 매트릭스 데이터를 기반으로 핵심역량별 추천 프로그램을 반환
   * 
   * 추천 로직:
   * 1. 핵심역량별 총합 계산 (내 점수가 있는 프로그램들)
   * 2. 총합이 낮은 순서로 정렬 (오름차순)
   * 3. 최하위 핵심역량: 2개 프로그램 추천
   * 4. 나머지 핵심역량: 각각 1개씩 추천
   * 5. 최대 6개까지 추천
   * 6. 1회 점수 높은 순으로 정렬
   * 
   * @param {string} id - 사용자 ID
   * @param {number} year - 연도 (예: 2025)
   * @param {number} semester - 학기 (예: 2)
   * @returns {Promise<Object>} { success: boolean, data: Array, message: string }
   */
  async getRecommendedPrograms(id, year, semester) {
    console.log(`🎯 [getRecommendedPrograms] 추천 프로그램 조회 시작`);
    console.log(`👤 사용자 ID: ${id}, 연도: ${year}, 학기: ${semester}`);
    
    try {
      const result = await callAppsScriptAPI('getRecommendedPrograms', { id, year, semester });
      
      if (result.success) {
        console.log(`✅ [getRecommendedPrograms] 추천 프로그램 조회 성공`);
        console.log(`📊 추천된 프로그램 수: ${result.data?.length || 0}개`);
        
        // 메타 정보가 있으면 로깅
        if (result.meta) {
          console.log(`📈 [getRecommendedPrograms] 메타 정보:`, result.meta);
        }
      } else {
        console.log(`⚠️ [getRecommendedPrograms] 추천 프로그램 조회 실패:`, result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [getRecommendedPrograms] 추천 프로그램 조회 오류:', error);
      return { 
        success: false, 
        message: '추천 프로그램을 불러오는 중 서버 오류가 발생했습니다: ' + error.message 
      };
    }
  },

  // 비밀번호 확인
  // 입력: id, password → 반환: { success: boolean, message: string }
  async verifyPassword(id, password) {
    try {
      const result = await callAppsScriptAPI('verifyPassword', { id, password });
      return result;
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      return { message: '서버 오류가 발생했습니다.' };
    }
  },

  // 사용자의 매트릭스 URL 조회
  // 입력: id → 반환: { success: boolean, matrixUrl?: string }
  async getUserMatrixUrl(id) {
    console.log(`🔍 [getUserMatrixUrl] 호출 시작, id:`, id);
    try {
      const result = await callAppsScriptAPI('getUserMatrixUrl', { id });
      console.log(`🔍 [getUserMatrixUrl] 결과:`, result);
      return result;
    } catch (error) {
      console.error('❌ [getUserMatrixUrl] 사용자 매트릭스 URL 조회 오류:', error);
      return { success: false, message: '매트릭스 URL 조회 실패' };
    }
  },

  // 회원 탈퇴
  // 입력: id, password → 반환: { message: string }
  async deleteAccount(id, password) {
    try {
      const result = await callAppsScriptAPI('deleteAccount', { id, password });
      return result;
    } catch (error) {
      console.error('회원 탈퇴 오류:', error);
      return { message: '서버 오류가 발생했습니다.' };
    }
  },

  // 전체 티어 시스템 재계산
  // 기존 데이터를 새로운 티어 규칙에 따라 재계산
  // 반환: { success: boolean, message: string }
  async recalculateAllTiers() {
    try {
      const result = await callAppsScriptAPI('recalculateAllTiers');
      return result;
    } catch (error) {
      console.error('전체 티어 재계산 오류:', error);
      return { success: false, message: '재계산 중 서버 오류가 발생했습니다.' };
    }
  }
};