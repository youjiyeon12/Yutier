import express from 'express'; // Node.js웹 서버 프레임워크 
import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors'; // React 개발 서버에서 Node.js 서버 요청 보낼 때 필요.
import { cwd } from 'process';
import { google } from 'googleapis';

// 구글드라이브 API 사용
const authDrive = new google.auth.GoogleAuth({
  keyFile: './credentials.json',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth: await authDrive.getClient() });

dotenv.config(); // .env에서 환경변수 읽음
const app = express(); // Express 앱 생성
app.use(cors()); // 모든 CORS 요청 허용
app.use(express.json()); // JSON 파싱 미들웨어

// credentials.json 직접 읽기
const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf-8'));

// Administator 시트 URL
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
        department: `${user.학부} ${user.전공}`,
        matrixUrl: user.url || null // 매트릭스 URL 여부
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

// 저장된 URL이 타당한지 확인
app.get('/api/validate-matrix-url', async (req, res) => {
  const { id } = req.query;

  try {
    const rows = await sheet.getRows();
    const userRow = rows.find(row => row.아이디 === id);

    if (!userRow || !userRow.url) {
      return res.status(404).json({ valid: false, message: '매트릭스 URL이 등록되어 있지 않습니다.' });
    }

    const match = userRow.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).json({ valid: false, message: 'URL 형식이 잘못되었습니다.' });
    }

    const sheetId = match[1];

    // Drive API로 휴지통 여부 확인
    const file = await drive.files.get({
      fileId: sheetId,
      fields: 'trashed',
    });

    if (file.data.trashed) {
      return res.status(400).json({ valid: false, message: '시트가 휴지통에 있습니다.' });
    }

    const userDoc = new GoogleSpreadsheet(sheetId);
    await userDoc.useServiceAccountAuth(credentials);
    await userDoc.loadInfo(); // 실제 접근 가능한 시트인지 확인

    res.json({ valid: true });
  } catch (err) {
    console.error("시트 검증 실패:", err.message);
    res.status(500).json({
      valid: false,
      message: '시트에 접근할 수 없습니다. 삭제되었거나 공유되지 않았을 수 있습니다.'
    });
  }
});

// 매트릭스 조회
app.get('/api/load-matrix', async (req, res) => {
  const { id, year, semester } = req.query;

  try {
    // users 시트에서 내 row 찾기
    const rows = await sheet.getRows();
    const userRow = rows.find(row => row.아이디 === id);

    if (!userRow || !userRow.url) {
      return res.status(404).json({ success: false, message: '시트 URL 미등록' });
    }

    // 시트 ID 추출
    const match = userRow.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).json({ success: false, message: '잘못된 URL' });
    }
    const sheetId = match[1];

    // 사용자 구글 시트 연결
    const userDoc = new GoogleSpreadsheet(sheetId);
    await userDoc.useServiceAccountAuth(credentials);
    await userDoc.loadInfo();

    // 학기별 시트명
    const semesterTitle = `${year}-${semester}`;
    const matrixSheet = userDoc.sheetsByTitle[semesterTitle];

    if (!matrixSheet) {
      return res.status(404).json({ success: false, message: `${semesterTitle} 시트를 찾을 수 없습니다.` });
    }

    await matrixSheet.loadCells('A1:Z200');

    // 시트 데이터 읽기 (헤더 포함)
    await matrixSheet.loadHeaderRow();
    const matrixRows = await matrixSheet.getRows();

    // 필요한 컬럼명 (헤더) 가져오기
    const header = matrixSheet.headerValues;

    // 데이터 가공 
    // (각 row를 객체로 변환)
    const data = matrixRows.map(row => {
      const obj = {};
      header.forEach(col => {
        obj[col] = row[col] || "";
      });
      return obj;
    });

    // 응답 반환
    res.json({
      success: true,
      header,
      data
    });

  } catch (err) {
    console.error('load-matrix error:', err.message);
    res.status(500).json({ success: false, message: '시트 데이터 읽기 실패' });
  }
});

// 매트릭스 저장
app.post('/api/save-matrix', async (req, res) => {
  const { id, year, semester, data: updates } = req.body;

  if (!id || !year || !semester || !updates) {
    return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
  }

  try {
    const rows = await sheet.getRows();
    const userRow = rows.find(row => row.아이디 === id);
    if (!userRow || !userRow.url) {
      return res.status(404).json({ success: false, message: '시트 URL이 등록되지 않았습니다.' });
    }

    const match = userRow.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).json({ success: false, message: '잘못된 URL 형식입니다.' });
    }
    const sheetId = match[1];

    const userDoc = new GoogleSpreadsheet(sheetId);
    await userDoc.useServiceAccountAuth(credentials);
    await userDoc.loadInfo();

    const semesterTitle = `${year}-${semester}`;
    const matrixSheet = userDoc.sheetsByTitle[semesterTitle];
    if (!matrixSheet) {
      return res.status(404).json({ success: false, message: `${semesterTitle} 시트를 찾을 수 없습니다.` });
    }

    await matrixSheet.loadHeaderRow();
    const sheetRows = await matrixSheet.getRows();
    await matrixSheet.loadCells(); // 셀 직접 조작을 위해 로드
    
    const scoreColumnIndex = matrixSheet.headerValues.indexOf('내 점수');
    const completionColumnName = '이수/미이수'; 
    const completionColumnIndex = matrixSheet.headerValues.indexOf(completionColumnName);


    if (scoreColumnIndex === -1) {
      return res.status(500).json({ success: false, message: "'내 점수' 열을 시트에서 찾을 수 없습니다." });
    }
     if (completionColumnIndex === -1) {
      console.warn(`'${completionColumnName}' 열을 찾을 수 없어 '내 점수' 열에 저장합니다.`);
    }

    // 업데이트 로직 수정
    for (const item of updates) {
      if (item.myScore !== undefined) {
        const rowToUpdate = sheetRows.find(r => r['프로그램명'] === item.programName && !r['상세항목']);
        if (rowToUpdate) {
          const cell = matrixSheet.getCell(rowToUpdate.rowIndex - 1, scoreColumnIndex);
          cell.value = item.myScore ? parseFloat(item.myScore) : null;
        }
      }
      else if (item.detailName !== undefined) {
        const rowToUpdate = sheetRows.find(r => r['프로그램명'] === item.programName && r['상세항목'] === item.detailName);
        if (rowToUpdate) {
          const targetColIndex = completionColumnIndex !== -1 ? completionColumnIndex : scoreColumnIndex;
          const cell = matrixSheet.getCell(rowToUpdate.rowIndex - 1, targetColIndex);
          cell.value = item.isCompleted ? '이수' : ''; 
        }
      }
    }

    await matrixSheet.saveUpdatedCells();

    res.json({ success: true, message: '저장이 완료되었습니다.' });

  } catch (err) {
    console.error('save-matrix error:', err.message);
    res.status(500).json({ success: false, message: '데이터 저장 중 서버 오류가 발생했습니다.' });
  }
});

// 매트릭스 핵심역량별 점수 저장
app.post('/api/save-tier-scores', async (req, res) => {
  const { id, scores } = req.body;

  if (!id || !scores) {
    return res.status(400).json({ success: false, message: 'ID와 점수 데이터는 필수입니다.' });
  }

  try {
    const tierSheet = doc.sheetsByTitle['tier'];
    if (!tierSheet) {
      return res.status(404).json({ success: false, message: "'tier' 시트를 찾을 수 없습니다." });
    }

    const rows = await tierSheet.getRows();
    let userRow = rows.find(row => row.아이디 === id);

    // 합산 점수 계산
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (parseFloat(score) || 0), 0);

    if (userRow) {
      // 기존 사용자의 점수 업데이트
      userRow.유한인성역량 = scores.유한인성역량;
      userRow.기초학습역량 = scores.기초학습역량;
      userRow.직업기초역량 = scores.직업기초역량;
      userRow.직무수행역량 = scores.직무수행역량;
      userRow.취창업기초역량 = scores.취창업기초역량;
      userRow['합산 점수'] = totalScore;
      await userRow.save();
    } else {
      // 신규 사용자의 점수 추가
      await tierSheet.addRow({
        아이디: id,
        ...scores,
        '합산 점수': totalScore,
      });
    }

    res.json({ success: true, message: '점수가 성공적으로 등록되었습니다.' });

  } catch (err) {
    console.error('Tier 점수 저장 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 매트릭스 핵심역량별 점수 조회
app.get('/api/get-tier-scores/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, message: 'ID가 없습니다.' });
  }
  try {
    const tierSheet = doc.sheetsByTitle['tier'];
    if (!tierSheet) {
      return res.status(404).json({ success: false, message: "'tier' 시트를 찾을 수 없습니다." });
    }
    const rows = await tierSheet.getRows();
    const userRow = rows.find(row => row.아이디 === id);

    if (userRow) {
      res.json({
        success: true,
        scores: {
          유한인성역량: userRow.유한인성역량 || '',
          기초학습역량: userRow.기초학습역량 || '',
          직업기초역량: userRow.직업기초역량 || '',
          직무수행역량: userRow.직무수행역량 || '',
          취창업기초역량: userRow.취창업기초역량 || '',
        },
        totalScore: userRow['합산 점수'] || 0 
      });
    } else {
      // 데이터가 없을 때
      res.json({ success: true, scores: null, totalScore: 0 });
    }
  } catch (err) {
    console.error('Tier 점수 불러오기 오류:', err.message);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});











