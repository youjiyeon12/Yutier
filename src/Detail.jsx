// trust 설명 페이지
//import { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function Detail({ user, onLogout }) {
  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      <div>
        <h2>TRUST 설명 페이지 git test</h2>
      </div>
      <Footer />
    </div>
  );
}
export default Detail;

