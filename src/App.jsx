import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
// Navigate = redirect 느낌 / Route = 특정 URL 경로에 대해 어떤 컴포넌트 보여줄지
import { useEffect, useState } from 'react';
// 파일 import
import Login from './Login';
import Signup from './Signup';
import Home from './Home';
import Detail from './Detail';
import Footer from './Footer';
import Guide from './Guide';
import Header from './Header';
import Detail2 from './Detail2';
import Mypage from './mypage/Mypage';
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

  // 주석 형식 {/* */}
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
        {/* trust 설명 페이지 */}
        <Route
          path="/detail"
          element={<Detail user={user} onLogout={() => setUser(null)} />}
        />

        <Route
          path="/detail2"
          element={<Detail2 user={user} onLogout={() => setUser(null)} />}
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
      </Routes>
    </Router>
  );
}

export default App;
