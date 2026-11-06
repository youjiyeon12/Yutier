import { Routes, Route, Navigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { googleSheetsService } from './services/googleSheetsService';
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

function App() {
  // 로그인 정보는 localStorage에 둔다. token이 없는 예전 로그인 정보는 버린다.
  const [user, setUserState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      if (stored?.token) return stored;
    } catch { /* 깨진 값은 아래에서 지운다 */ }
    localStorage.removeItem('user');
    return null;
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
        <Route
          path="/"
          element={
            user ? <Home user={user} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <Login onLogin={setUser} />
          }
        />

        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" /> : <Signup />
          }
        />

        <Route
          path="/findid" 
          element={
            user ? <Navigate to="/" /> : <FindId />
          }
        />

        <Route
          path="/findpassword"
          element={
            user ? <Navigate to="/" /> : <FindPassword />
          }
        />

        <Route path="/detail" 
          element={
            <Detail user={user} onLogout={handleLogout} />
          } 
        />
        
        <Route
          path="/guide"
          element={<Guide user={user} onLogout={handleLogout} />}
        />

        <Route
          path="/mypage"
          element={
            user ? <Mypage user={user} setUser={setUser} onLogout={handleLogout} />
              : <Navigate to="/login" />
          }
        />

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

