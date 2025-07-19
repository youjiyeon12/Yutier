// 메인 화면
//import { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './home.module.css';

function Home({ user, onLogout }) {

  return (
    <div className={styles.container}>
      <Header user={user} onLogout={onLogout} />
      <div className={styles.container_wrap}>
        <h2>환영합니다, {user.id}님!</h2>
      </div>
      <Footer/>
    </div>
  );
};

export default Home;