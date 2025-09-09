import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './signup.module.css';

function Signup({ onRegister }) {
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

  const navigate = useNavigate();

  //ref 객체
  const idRef = useRef(null);
  const pwRef = useRef(null);
  const confirmPwRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const studentIDRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/major-list`)
      .then(res => res.json())
      .then(data => setMajorData(data));
  }, []);

  const departments = Object.keys(majorData);
  const majors = selectedDept ? majorData[selectedDept] : [];

   const validateForm = () => {
    const idRegex = /^[a-zA-Z0-9]{5,20}$/;
    const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!?/@#$%^])[a-zA-Z\d!?/@#$%^]{8,20}$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const studentIDRegex = /^\d{9}$/;

    if (!idRegex.test(id)) {
      alert('아이디는 영문과 숫자를 포함한 5자 이상 20자 이하로 입력해주세요.');
      idRef.current.focus();
      return false;
    }

    if (!pwRegex.test(password)) {
      alert('비밀번호는 8자 이상이며, 대소문자 영문 + 숫자 + 특수문자(!,?,/,@,#,$,%,^)를 포함해야 합니다.');
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

    if (!validateForm()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          password,
          name,
          email,
          studentID,
          department: selectedDept,
          major: selectedMajor,
        }),
      });

      const data = await res.json();
      if (data.success) {
        //alert('회원가입 성공!');
        onRegister({ id, name });
        navigate('/Login'); // 회원가입 후 로그인으로 이동
      } else {
        alert('회원가입 실패!');
      }
    } catch (err) {
      alert('회원가입 중 오류 발생');
      console.error(err);
    }
  };

  // 아이디 확인
  const checkSignupId = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/check-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.exists) {
        alert('이미 사용 중인 아이디입니다.');
        setIsIdChecked(false);
      } else {
        alert('사용 가능한 아이디입니다!');
        setIsIdChecked(true);
      }
    } catch (err) {
      alert('중복 확인 중 오류 발생');
      console.error(err);
    }
  };

  // 학번 확인
  const checkStudentID = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/check-studentID`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentID }),
    });

    const data = await res.json();

    if (data.exists) {
      alert('이미 등록된 학번입니다.');
      setIsStudentIdChecked(false);
    } else {
      alert('사용 가능한 학번입니다!');
      setIsStudentIdChecked(true);
    }
  } catch (err) {
    alert('학번 중복 확인 중 오류 발생');
    console.error(err);
  }
};

  

  return (
  <div className={styles.container}>
    <div className={styles.logoBox}>
      <img src="/yutier.svg" alt="YUTIER 로고" className={styles.logoImage} />
    </div>

    <form onSubmit={handleSubmit} className={styles.form}>
      <h2 className={styles.title}>회원가입</h2>

      <label className={styles.label}>아이디</label>
      <div className={styles.idRow}>
        <input
          ref={idRef}
          className={styles.input}
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIsIdChecked(false);
          }}
          placeholder="5~20자 이내, 영문(대/소문자 구분), 숫자"
        />
        <button type="button" onClick={checkSignupId} className={styles.button}>중복 확인</button>
      </div>

      <label className={styles.label}>비밀번호</label>
      <input
        ref={pwRef}
        type="password"
        className={styles.input}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="8~20자 이내, 영문(대/소문자 구분), 숫자, 특수문자(!, ?, /, @, #, $, %, ^ 만)"
      />

      <label className={styles.label}>비밀번호 확인</label>
      <input
        ref={confirmPwRef}
        type="password"
        className={styles.input}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="비밀번호 재입력"
      />

      <label className={styles.label}>이름</label>
      <input
        ref={nameRef}
        className={styles.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력"
      />

      <label className={styles.label}>이메일</label>
      <input
        ref={emailRef}
        className={styles.input}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일 입력(example@example.com)"
      />

      <label className={styles.label}>학번</label>
      <div className={styles.idRow}>
        <input
          ref={studentIDRef}
          className={styles.input}
          value={studentID}
          onChange={(e) => {
            setStudentID(e.target.value);
            setIsStudentIdChecked(false); // 입력 바뀌면 다시 확인해야 함
          }}
          placeholder="ex) 202307000"
        />
        <button type="button" onClick={checkStudentID} className={styles.button}>
          중복 확인
        </button>
      </div>

      <label className={styles.label}>학부 / 전공</label>
      <div className={styles.selectRow}>
        <select
          className={styles.select}
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setSelectedMajor('');
          }}
        >
          <option value="">학부 선택</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
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
        <button type="submit" className={styles.submit}>가입하기</button>
      </div>
    </form>
    <footer className={styles.footer}>Copyright ⓒ hambugi</footer>
  </div>
  );
}

export default Signup;
