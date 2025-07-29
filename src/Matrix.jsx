import Header from './Header';
import Footer from './Footer';
import style from './matrix.module.css';

function Matrix({ user, onLogout }) {
    return (
    <div className={style.container}>
      <Header user={user} onLogout={onLogout} />

      <main className={style.mainContent}>
        <h2>매트릭스 페이지</h2>
        <p>여기에 매트릭스 내용을 추가하세요.</p>
      </main>

      <Footer />
    </div>
  );
}

export default Matrix;