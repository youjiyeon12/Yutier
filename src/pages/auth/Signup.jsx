import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/signup.module.css';
import { googleSheetsService } from '../../services/googleSheetsService';

function Signup() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentID, setStudentID] = useState('');
  //아이디, 학번 중복 체크
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isStudentIdChecked, setIsStudentIdChecked] = useState(false);

  const [majorData, setMajorData] = useState({});
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  // 진행 중인 요청: 'submit' | 'checkId' | 'checkStudentID' | null
  const [busy, setBusy] = useState(null);
  const [majorLoading, setMajorLoading] = useState(true);

  const navigate = useNavigate();

  //ref 객체
  const idRef = useRef(null);
  const pwRef = useRef(null);
  const confirmPwRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const studentIDRef = useRef(null);

  useEffect(() => {
    googleSheetsService.getMajorList()
      .then(data => setMajorData(data && data.success !== false ? data : {}))
      .catch(error => console.error('학부/전공 목록 로드 실패:', error))
      .finally(() => setMajorLoading(false));
  }, []);

  const departments = Object.keys(majorData);
  const majors = selectedDept ? majorData[selectedDept] : [];

   const validateForm = () => {
    const idRegex = /^[a-zA-Z0-9]{5,20}$/;
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!?/@#$%^])[a-zA-Z\d!?/@#$%^]{8,20}$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const studentIDRegex = /^\d{9}$/;

    if (!idRegex.test(id)) {
      alert('아이디는 영문과 숫자만 사용하여 5자 이상 20자 이하로 입력해주세요.');
      idRef.current.focus();
      return false; 
    }

    if (!pwRegex.test(password)) {
      alert('비밀번호는 8~20자 영문, 숫자, 특수문자(!?/@#$%^)를 포함해야 합니다.');
      pwRef.current.focus();
      return false;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      confirmPwRef.current.focus();
      return false;
    }

    if (!name.trim() || name.trim().length < 2) {
    alert('이름은 2자 이상 입력해주세요.');
    nameRef.current.focus();
    return false;
    }

    if (!emailRegex.test(email)) {
      alert('유효한 이메일 주소를 입력해주세요.');
      emailRef.current.focus();
      return false;
    }

    if (!studentIDRegex.test(studentID)) {
      alert('학번은 9자리 숫자여야 합니다.');
      studentIDRef.current.focus();
      return false;
    }

    if (!selectedDept || !selectedMajor) {
      alert('학부와 전공을 선택해주세요.');
      return false;
    }

    if (!isIdChecked) {
      alert('아이디 중복 확인을 해주세요.');
      return false;
    }

    if (!isStudentIdChecked) {
    alert('학번 중복 확인을 해주세요.');
    studentIDRef.current.focus();
    return false;
    }

    return true;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    if (!validateForm()) return;

    setBusy('submit');
    try {
      const data = await googleSheetsService.signup({
        id,
        password,
        name,
        email,
        studentID,
        department: selectedDept,
        major: selectedMajor,
      });

      if (data.success) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        navigate('/login');
      } else {
        alert(data.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err) {
      alert('회원가입 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  // 아이디 확인
  const checkSignupId = async () => {
    const idPattern = /^[a-zA-Z0-9]{5,20}$/;
    if (!idPattern.test(id)) {
      alert('아이디는 영문과 숫자만 사용하여 5자 이상 20자 이하로 입력해주세요.');
      setIsIdChecked(false);
      return; 
    }

    setBusy('checkId');
    try {
      const data = await googleSheetsService.checkId(id);

      if (data.exists) {
        alert('이미 사용 중인 아이디입니다.');
        setIsIdChecked(false);
      } else {
        alert('사용 가능한 아이디입니다!');
        setIsIdChecked(true);
      }
    } catch (err) {
      alert('중복 확인 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };


  // 학번 확인
  const checkStudentID = async () => {
  if (!/^\d{9}$/.test(studentID)) {
    alert('학번은 9자리 숫자여야 합니다.');
    return;
  }
  setBusy('checkStudentID');
  try {
    const data = await googleSheetsService.checkStudentID(studentID);

    if (data.exists) {
      alert('이미 등록된 학번입니다.');
      setIsStudentIdChecked(false);
    } else {
      alert('사용 가능한 학번입니다!');
      setIsStudentIdChecked(true);
    }
  } catch (err) {
    alert('학번 중복 확인 중 오류가 발생했습니다.');
    console.error(err);
  } finally {
    setBusy(null);
  }
};

  

  return (
  <div className={styles.container}>
    <div className={styles.logoBox}>
      <img src={`${import.meta.env.BASE_URL}yutier.svg`} alt="YUTIER 로고" className={styles.logoImage} />
    </div>

    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>회원가입</h2>

      <label className={styles.label}>아이디</label>
      <div className={styles.idRow}>
        <input aria-label="아이디"
          ref={idRef}
          className={styles.input}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIsIdChecked(false);
          }}
          placeholder="5~20자 이내, 영문(대/소문자 구분), 숫자"
        />
        <button type="button" onClick={checkSignupId} className={styles.button} disabled={busy !== null} aria-busy={busy === 'checkId'}>
          {busy === 'checkId' ? '확인 중...' : isIdChecked ? '확인 완료' : '중복 확인'}
        </button>
      </div>

      <label className={styles.label}>비밀번호</label>
      <input aria-label="비밀번호" autoComplete="new-password"
        ref={pwRef}
        type="password"
        className={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="8~20자 이내, 영문(대/소문자 구분), 숫자, 특수문자(!, ?, /, @, #, $, %, ^ 만)"
      />

      <label className={styles.label}>비밀번호 확인</label>
      <input aria-label="비밀번호 확인" autoComplete="new-password"
        ref={confirmPwRef}
        type="password"
        className={styles.input}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="비밀번호 재입력"
      />

      <label className={styles.label}>이름</label>
      <input aria-label="이름"
        ref={nameRef}
        className={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력"
      />

      <label className={styles.label}>이메일</label>
      <input aria-label="이메일"
        ref={emailRef}
        type="email"
        className={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일 입력(example@example.com)"
      />

      <label className={styles.label}>학번</label>
      <div className={styles.idRow}>
        <input aria-label="학번"
          ref={studentIDRef}
          className={styles.input}
          value={studentID}
          onChange={(e) => {
            setStudentID(e.target.value);
            setIsStudentIdChecked(false); // 입력 바뀌면 다시 확인해야 함
          }}
          placeholder="ex) 202307000"
        />
        <button type="button" onClick={checkStudentID} className={styles.button} disabled={busy !== null} aria-busy={busy === 'checkStudentID'}>
          {busy === 'checkStudentID' ? '확인 중...' : isStudentIdChecked ? '확인 완료' : '중복 확인'}
        </button>
      </div>

      <label className={styles.label}>학부 / 전공</label>
      <div className={styles.selectRow}>
        <select aria-label="학부"
          className={styles.select}
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedMajor('');
          }}
        >
          <option value="">{majorLoading ? '학부 목록 불러오는 중...' : '학부 선택'}</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select aria-label="전공"
          className={styles.select}
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          disabled={!selectedDept}
        >
          <option value="">전공 선택</option>
          {majors.map((major) => (
            <option key={major} value={major}>{major}</option>
          ))}
        </select>
      </div>

      <div className={styles.buttonRow}>
        <button type="button" onClick={() => navigate('/login')} className={styles.cancel}>취소</button>
        <button type="submit" className={styles.submit} disabled={busy !== null} aria-busy={busy === 'submit'}>
          {busy === 'submit' ? '가입 처리 중...' : '가입하기'}
        </button>
      </div>
    </form>
    <footer className={styles.footer}>Copyright ⓒ hambugi</footer>
  </div>
  );
}

export default Signup;
