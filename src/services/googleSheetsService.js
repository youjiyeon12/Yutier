/**
 * Google Apps Script 웹 앱 호출 서비스
 *
 * 모든 요청은 POST(text/plain, JSON body)로 보낸다.
 * - text/plain이라 CORS preflight가 생기지 않고, 비밀번호가 URL에 남지 않는다.
 * - 로그인 후 받은 token을 매 요청에 자동으로 붙인다. 서버는 token에서 사용자 id를 꺼내 쓴다.
 * - 서버가 AUTH_REQUIRED를 돌려주면(세션 만료) 저장된 로그인 정보를 지우고 로그인 화면으로 보낸다.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))?.token;
  } catch {
    return undefined;
  }
};

const callAppsScriptAPI = async (action, data = {}) => {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...data, action, token: getToken() }),
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    const text = await response.text();
    if (text.includes('<!doctype') || text.includes('<html')) {
      console.error('[API] Apps Script가 HTML을 반환했습니다. 배포 설정을 확인하세요.');
      return { success: false, message: 'Apps Script 배포 설정을 확인하세요.' };
    }

    const result = JSON.parse(text);
    if (result.code === 'AUTH_REQUIRED') {
      localStorage.removeItem('user');
      window.location.hash = '#/login';
      window.location.reload();
    }
    return result;
  } catch (error) {
    console.error(`[API] ${action} 호출 오류:`, error.message);
    return { success: false, message: 'API 호출 실패: ' + error.message };
  }
};

// 페이지에서 쓰는 API 모음. 실패하면 { success: false, message }를 돌려준다.
// id 인자는 예전 호출부와 맞추기 위해 남겨 두었다. 보호된 액션에서는 서버가 token의 id만 쓴다.
export const googleSheetsService = {
  checkId: (id) => callAppsScriptAPI('checkId', { id }),
  checkStudentID: (studentID) => callAppsScriptAPI('checkStudentID', { studentID }),
  signup: (userData) => callAppsScriptAPI('signup', userData),
  login: (id, password) => callAppsScriptAPI('login', { id, password }),
  logout: () => callAppsScriptAPI('logout'),
  getMajorList: () => callAppsScriptAPI('getMajorList'),

  updateUser: (id, updateData) => callAppsScriptAPI('updateUser', { updateData }),
  verifyPassword: (id, password) => callAppsScriptAPI('verifyPassword', { password }),
  deleteAccount: (id, password) => callAppsScriptAPI('deleteAccount', { password }),

  verifyMatrixUrl: (id, url) => callAppsScriptAPI('verifyMatrixUrl', { url }),
  validateMatrixUrl: () => callAppsScriptAPI('validateMatrixUrl'),
  getUserMatrixUrl: () => callAppsScriptAPI('getUserMatrixUrl'),
  loadMatrix: (id, year, semester) => callAppsScriptAPI('getMatrix', { year, semester }),

  // 업데이트를 20개씩 나눠 순서대로 저장한다 (Apps Script 실행 시간 제한 대비).
  async saveMatrix(id, updates, year, semester) {
    const CHUNK_SIZE = 20;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const result = await callAppsScriptAPI('saveMatrix', {
        updates: updates.slice(i, i + CHUNK_SIZE), year, semester,
      });
      if (!result.success) {
        return { success: false, message: `저장 실패: ${result.message}` };
      }
    }
    return { success: true, message: '저장이 완료되었습니다.' };
  },

  saveTierScores: (id, scores) => callAppsScriptAPI('saveTierScores', { scores }),
  getTierScores: () => callAppsScriptAPI('getTierScores'),
  getTierInfo: () => callAppsScriptAPI('getTierInfo'),
  // 추천 프로그램: 서버가 현재 연도·학기를 직접 계산한다.
  getRecommendedPrograms: (id, year, semester) =>
    callAppsScriptAPI('getRecommendedPrograms', { year, semester }),

  sendVerificationCode: ({ name, studentID, email }) =>
    callAppsScriptAPI('sendVerificationCode', { name, studentID, email }),
  findIdWithVerification: (email, code) =>
    callAppsScriptAPI('findIdWithVerification', { email, code }),
  sendVerificationCodeForPassword: ({ name, id, email }) =>
    callAppsScriptAPI('sendVerificationCodeForPassword', { name, id, email }),
  // 성공하면 { success, resetToken }. resetToken은 updatePassword에 넘긴다.
  findPasswordWithVerification: (email, code) =>
    callAppsScriptAPI('findPasswordWithVerification', { email, code }),
  updatePassword: ({ resetToken, newPassword }) =>
    callAppsScriptAPI('updatePassword', { resetToken, newPassword }),
};
