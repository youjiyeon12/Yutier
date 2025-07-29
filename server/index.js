import express from 'express'; // Node.js웹 서버 프레임워크 
import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors'; // React 개발 서버에서 Node.js 서버 요청 보낼 때 필요.
import { cwd } from 'process';


dotenv.config(); // .env에서 환경변수 읽음
const app = express(); // Express 앱 생성
app.use(cors()); // 모든 CORS 요청 허용
app.use(express.json()); // JSON 파싱 미들웨어

// credentials.json 직접 읽기
const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));

const doc = new GoogleSpreadsheet('13QT8_OnNJ0FZaPkpx0_yMHz-v8ERg14lf9CXB_7bFzA'); // 구글 시트 ID
await doc.useServiceAccountAuth(credentials); // 서비스 계정으로 인증
await doc.loadInfo(); // 시트 정보 로딩
const sheet = doc.sheetsByTitle['users']; // users 시트 연결

// 아이디 중복확인 API
app.post('/check-id', async (req, res) => {
  const { id } = req.body;
  await sheet.loadCells(); // 전체 시트 로드
  const rows = await sheet.getRows();
  const exists = rows.some(row => row.아이디 === id);
  res.json({ exists }); // true/false로 반환
});

// 회원가입 저장 API
app.post('/signup', async (req, res) => {
  const { id, password, name, email, studentID, department, major } = req.body;
  await sheet.addRow({
    아이디: id,
    비밀번호: password,
    이름: name,
    이메일: email,
    학번: studentID,
    학부: department,
    전공: major
  });
  res.json({ success: true });
});

app.listen(3001, () => console.log('서버 실행 중: http://localhost:3001'));

// 로그인 검증 API
app.post('/login', async (req, res) => {
  const { id, password } = req.body;
  const rows = await sheet.getRows();
  const user = rows.find(row => row.아이디 === id && row.비밀번호 === password);
  // 회원 상세 정보 반환 
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.아이디,
        name: user.이름,
        studentId: user.학번,
        department: `${user.학부} ${user.전공}`
      }
    });
  } else {
    res.json({ success: false });
  }
});

// 학번 중복확인 API
app.post('/check-studentID', async (req, res) => {
  const { studentID } = req.body;
  const rows = await sheet.getRows();
  const exists = rows.some(row => row.학번 === studentID);
  res.json({ exists });
});


// 학부/전공 목록 불러오기 API
app.get('/api/major-list', async (req, res) => {
  try {
    const majorSheet = doc.sheetsByTitle['major']; // 'major' 시트 연결
    const rows = await majorSheet.getRows();

    const headerRow = majorSheet.headerValues; // 첫 번째 행: 학부명
    const result = {};

    headerRow.forEach((dept) => {
      const majors = [];
      rows.forEach((row) => {
        const majorName = row[dept];
        if (majorName) majors.push(majorName);
      });
      result[dept] = majors;
    });

    res.json(result);
  } catch (error) {
    console.error('학부/전공 불러오기 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 회원정보 수정 API
app.post('/api/update-user', async (req, res) => {
  const { id, department, major, currentPassword, newPassword } = req.body;

  try {
    const rows = await sheet.getRows();
    const userRow = rows.find(row => row.아이디 === id);

    if (!userRow) {
      return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호 검증
    if (newPassword && userRow.비밀번호 !== currentPassword) {
      return res.json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 학부/전공 수정
    if (department) userRow.학부 = department;
    if (major) userRow.전공 = major;

    // 비밀번호 수정
    if (newPassword) userRow.비밀번호 = newPassword;

    await userRow.save();
    res.json({ success: true });
  } catch (err) {
    console.error('회원정보 수정 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 매트릭스 시트 URL 저장 API
app.post('/api/save-matrix-url', async (req, res) => {
  const{id, url} = req.body;

  try{
    const rows = await sheet.getRows(); // users 시트
    const userRow = rows.find(row => row.아이디 === id);

    if (!userRow){
      return res.status(404).json({ success: false, message: '사용자 없음' });
    }

    userRow.url = url;
    await userRow.save();

    res.json({ success: true });
  }

  catch (error){
    console.error('URL 저장 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류 '});
  }
});

// 로그인 검증 API 수정
app.post('/login', async (req, res) => {
  const { id, password } = req.body;
  const rows = await sheet.getRows();
  const user = rows.find(row => row.아이디 === id && row.비밀번호 === password );
  
  if (user) {
    res.json({
      sucess: true,
      user: {
        id: user.아이디,
        name: user.이름,
        studentId: user.학번,
        department: `${user.학부} ${user.전공}`,
        matrixUrl: user.url || null 
      }
    });
  }

  else {
    res.json({ success: false });
  }
});

// URL 저장 및 조회
app.post('/api/verify-matrix-url', async (req, res) => {
  const { id, url } = req.body;
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return res.status(400).json({ success: false, message: '잘못된 URL 형식입니다.' });

    const sheetId = match[1];
    const userDoc = new GoogleSpreadsheet(sheetId);
    await userDoc.useServiceAccountAuth(credentials);
    await userDoc.loadInfo();

    const rows = await sheet.getRows(); // users 시트
    const userRow = rows.find(row => row.아이디 === id);
    if (!userRow) return res.status(404).json({ success: false, message: '사용자 없음' });

    userRow.url = url;
    await userRow.save();

    res.json({ success: true });
  } catch (err) {
    console.error('매트릭스 시트 접근 실패:', err.message);
    res.status(500).json({ success: false, message: '시트 접근 실패 (공유 안됐거나 잘못된 URL)' });
  }
});



