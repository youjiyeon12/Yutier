// 가이드 화면
//import { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Guide({ user, onLogout }) {

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <div>
        <h2>가이드 화면</h2>
      </div>
      <Footer />
    </div>
  );
}
export default Guide;