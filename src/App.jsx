import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
// Navigate = redirect 느낌 / Route = 특정 URL 경로에 대해 어떤 컴포넌트 보여줄지
import { useEffect, useState } from 'react';
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
  // 로그인한 사용자 정보가 있으면 불러옴(세션) - localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // 로그인하면 localStorage에 저장 -> 로그아웃 시 삭제
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  return (
    <Router>
      <Routes>
        {/* 홈 화면: 로그인된 유저만 접근 가능 */}
        <Route
          path="/"
          element={
            user ? <Home user={user} onLogout={() => setUser(null)} />
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
            user ? <Navigate to="/" /> : <Signup onRegister={setUser} />
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
            <Detail user={user} onLogout={() => setUser(null)} />
          } 
        />
        
        {/* 이용가이드 페이지 */}
        <Route
          path="/guide"
          element={<Guide user={user} onLogout={() => setUser(null)} />}
        />

        {/* 마이 페이지 */}
        <Route
          path="/mypage"
          element={
            user ? <Mypage user={user} setUser={setUser} onLogout={() => setUser(null)} />
              : <Navigate to="/login" />
          }
        />

        {/* 매트릭스 페이지 */}
        <Route
        path="/matrix"
        element={
          user ? <Matrix user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/login" />
          }
        />

        <Route
        path="/matrix-url"
        element={
        user ? <MatrixURLSubmit user={user} onLogout={() => setUser(null)} />
            : <Navigate to="/login" />
        }
        />
      </Routes>
    </Router>
  );
}

export default App;
