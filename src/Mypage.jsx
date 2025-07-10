// 마이페이지 화면
//import { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Mypage({ user, onLogout }) {
  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <div>
        <h2>마이페이지 화면</h2>
      </div>
      <Footer />
    </div>
  );
}
export default Mypage;