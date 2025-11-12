// 상단 화면
import { useNavigate } from 'react-router-dom';
import styles from './styles/footer.module.css';

function Footer() {
  const navigate = useNavigate();


  return (
    <div className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top_container}>
          <div className={styles.yutier_sentence}>
            <span className={styles.sentence_text}>
              함께 성장하는 대학 생활의 시작. 모든 순간을 더 의미 있게.
            </span>
            <span className={styles.sentence_text}>
              당신의 도전을 YUTIER가 응원합니다.
            </span>
            <span className={styles.sentence_text}>
              문의: hambugis12@gmail.com
            </span>
          </div>
          <div className={styles.social}>
            <div className={styles.social_div}>
              <span className={styles.social_text} onClick={() => window.open('https://www.youtube.com/@YuhanUniversity', '_blank')}>Yuhan Univ. Youtube</span>
              <img className={styles.social_icon} alt="Yuhan Univ. Youtube" src={`${import.meta.env.BASE_URL}Youtube.svg`} onClick={() => window.open('https://www.youtube.com/@YuhanUniversity', '_blank')} />
            </div>
            <div className={styles.social_div}>
              <span className={styles.social_text} onClick={() => window.open('https://www.instagram.com/yuhan_univ', '_blank')}>Yuhan Univ. Instargram</span>
              <img className={styles.social_icon} alt="Yuhan Univ. Instargram" src="/Instagram.svg" onClick={() => window.open('https://www.instagram.com/yuhan_univ', '_blank')} />
            </div>
            <div className={styles.social_div}>
              <span className={styles.social_text} onClick={() => window.open('https://github.com/youjiyeon12/Yutier', '_blank')}>YUTIER GitHub</span>
              <img className={styles.social_icon} alt="YUTIER GitHub" src="/Github.svg" onClick={() => window.open('https://github.com/youjiyeon12/Yutier', '_blank')} />
            </div>
          </div>
        </div>
        <div className={styles.bottom_container}>
          <img className={styles.symbol} alt="YUTIER logo white" src="/yutierSymbol2-white.svg" />
          <div className={styles.navbar}>
            <span onClick={() => navigate('/')}>HOME</span>
            <span onClick={() => navigate('/mypage')}>마이페이지</span>
            <span onClick={() => navigate('/detail')}>YUHAN TRUST란?</span>
            <span onClick={() => navigate('/guide')}>이용가이드</span>
          </div>
          <div className={styles.coptlight}>
            <span>Yuhan University | Team Hambugi.</span>
            <span>ⓒ 2025 YUTIER Project. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Footer;