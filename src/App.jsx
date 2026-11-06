import { Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { googleSheetsService } from './services/googleSheetsService';
// 파일 import
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import FindId from './pages/auth/FindId';
import FindPassword from './pages/auth/FindPassword';
import Home from './pages/home/Home';
import Detail from './pages/home/Detail';
import Guide from './pages/home/Guide';
import Mypage from './pages/mypage/Mypage';
import Matrix from './pages/matrix/Matrix';
import MatrixURLSubmit from './pages/matrix/MatrixURLSubmit';
//** route는 Home.jsx

function App() {
  // 로그인 정보는 localStorage에 둔다. token이 없는 예전 로그인 정보는 버린다.
  const [user, setUserState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      return stored?.token ? stored : null;
    } catch {
      return null;
    }
  });

  // localStorage를 state보다 먼저 갱신한다. 자식 페이지의 첫 API 호출이 바로 token을 읽기 때문이다.
  const setUser = useCallback((next) => {
    if (next) localStorage.setItem('user', JSON.stringify(next));
    else localStorage.removeItem('user');
    setUserState(next);
  }, []);

  const handleLogout = () => {
    googleSheetsService.logout();
    setUser(null);
  };

  return (
      <Routes>
        {/* 홈 화면: 로그인된 유저만 접근 가능 */}
        <Route
          path="/"
          element={
            user ? <Home user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        {/* 로그인 페이지: 비로그인 상태에서만 접근 가능 */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <Login onLogin={setUser} />
          }
        />

        {/* 회원가입 페이지 */}
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" /> : <Signup />
          }
        />

        {/* 아이디 찾기 페이지: 비로그인 상태에서만 접근 가능 */}
        <Route
          path="/findid" 
          element={
            user ? <Navigate to="/" /> : <FindId />
          }
        />

        {/* 비밀번호 찾기 페이지: 비로그인 상태에서만 접근 가능 */}
        <Route
          path="/findpassword"
          element={
            user ? <Navigate to="/" /> : <FindPassword />
          }
        />

        {/* trust 설명 페이지 */}
        <Route path="/detail" 
          element={
            <Detail user={user} onLogout={handleLogout} />
          } 
        />
        
        {/* 이용가이드 페이지 */}
        <Route
          path="/guide"
          element={<Guide user={user} onLogout={handleLogout} />}
        />

        {/* 마이 페이지 */}
        <Route
          path="/mypage"
          element={
            user ? <Mypage user={user} setUser={setUser} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        {/* 매트릭스 페이지 */}
        <Route
        path="/matrix"
        element={
          user ? <Matrix user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        <Route
        path="/matrix-url"
        element={
        user ? <MatrixURLSubmit user={user} onLogout={handleLogout} />
            : <Navigate to="/login" />
        }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}


export default App;

