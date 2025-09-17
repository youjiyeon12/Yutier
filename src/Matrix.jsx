import React, { useState, useEffect } from 'react';
import styles from './matrix.module.css';
import Header from './Header';
import Footer from './Footer';

const colorSet = [styles.c0, styles.c1, styles.c2, styles.c3, styles.c4];
const COMPETENCY_ORDER = ['유한인성역량', '기초학습역량', '직업기초역량', '직무수행역량', '취창업기초역량'];

function processDataForRender(data, openStates) {
  if (!data || data.length === 0) return [];

  const finalRenderList = [];
  const competencyGroups = new Map();

  data.forEach(row => {
    const competencyName = row['핵심역량'];
    if (!competencyName) return;
    if (!competencyGroups.has(competencyName)) {
      competencyGroups.set(competencyName, { summaryRow: null, dataRows: [] });
    }
    const group = competencyGroups.get(competencyName);
    if (!row['구분'] && !row['프로그램명']) {
      group.summaryRow = row;
    } else {
      group.dataRows.push(row);
    }
  });

  Array.from(competencyGroups.entries()).forEach(([competencyName, groupData]) => {
    const { summaryRow, dataRows } = groupData;
    const totalScore = summaryRow ? summaryRow['총점'] : '';

    const originalIndex = COMPETENCY_ORDER.indexOf(competencyName);
    const colorIndex = originalIndex !== -1 ? originalIndex : 0;
    const colorClass = colorSet[colorIndex % colorSet.length];

    const programGroups = new Map();
    dataRows.forEach(row => {
      const programKey = `${row['구분']}::${row['프로그램명']}`;
      if (!programGroups.has(programKey)) {
        programGroups.set(programKey, { mainRow: null, detailRows: [] });
      }
      const group = programGroups.get(programKey);
      if (row['상세항목']) {
        group.detailRows.push(row);
      } else {
        group.mainRow = row;
      }
    });

    let competencyTotalRowSpan = 0;
    const divisionRowSpanMap = new Map();
    const programList = Array.from(programGroups.values());

    programList.forEach((prog, i) => {
      const accordionKey = prog.mainRow ? `${prog.mainRow['프로그램명']}-${i}` : null;
      const isAccordionOpen = !!openStates[accordionKey];
      const rowCount = 1 + (isAccordionOpen ? prog.detailRows.length : 0);
      
      competencyTotalRowSpan += rowCount;
      
      const divisionName = prog.mainRow['구분'];
      if (!divisionRowSpanMap.has(divisionName)) {
        divisionRowSpanMap.set(divisionName, 0);
      }
      divisionRowSpanMap.set(divisionName, divisionRowSpanMap.get(divisionName) + rowCount);
    });

    let isFirstInCompetency = true;
    let currentDivision = null;

    programList.forEach((programData, programIndex) => {
      if (programData.mainRow) {
        const isFirstInDivision = programData.mainRow['구분'] !== currentDivision;
        if (isFirstInDivision) {
          currentDivision = programData.mainRow['구분'];
        }

        finalRenderList.push({
          data: programData.mainRow,
          detailRows: programData.detailRows,
          renderFlags: { isFirstInCompetency, isFirstInDivision },
          rowSpans: {
            competency: competencyTotalRowSpan,
            division: divisionRowSpanMap.get(currentDivision),
          },
          totalScore: totalScore,
          accordionKey: `${programData.mainRow['프로그램명']}-${programIndex}`,
          colorClass: colorClass,
        });
        isFirstInCompetency = false;
      }
    });
  });
  return finalRenderList;
}

function Matrix({ user, onLogout }) {
  const [year, setYear] = useState('2025');
  const [semester, setSemester] = useState('1');
  const [matrixData, setMatrixData] = useState([]);
  const [openAcc, setOpenAcc] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [tierScores, setTierScores] = useState({
    유한인성역량: '', 기초학습역량: '', 직업기초역량: '', 직무수행역량: '', 취창업기초역량: '',
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [totalTierScore, setTotalTierScore] = useState(0);
  const department = user?.department || "학과명";
  const name = user?.name || "이름";
  const userId = user?.id;

  useEffect(() => {
    const fetchTierScores = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/get-tier-scores/${userId}`);
        const data = await res.json();
        if (data.success && data.scores) {
          setTierScores(data.scores);
        }
      } catch (error) {
        console.error("페이지 로드 시 점수 조회 오류:", error);
      }
    };
    fetchTierScores();
  }, [userId]);
  
  useEffect(() => {
    const total = Object.values(tierScores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    setTotalTierScore(total);
  }, [tierScores]);

  const handleSearch = async () => {
    if (!userId) return;
    setActiveFilter(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/load-matrix?id=${userId}&year=${year}&semester=${semester}`
      );
      const json = await res.json();
      if (json.success) {
        setMatrixData(json.data);
        setOpenAcc({});
      } else {
        alert(json.message);
        setMatrixData([]);
      }
    } catch (error) {
      console.error("데이터 조회 실패:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleCheckboxChange = (programName, detailName, isChecked) => {
    const updatedData = matrixData.map(row => {
      if (row['프로그램명'] === programName && row['상세항목'] === detailName) {
        return { ...row, '이수/미이수': isChecked ? '이수' : '' };
      }
      return row;
    });
    setMatrixData(updatedData);
  };
  
  const handleScoreChange = (programName, newScore) => {
    const updatedData = matrixData.map(row => {
      if (row['프로그램명'] === programName && !row['상세항목']) {
        return { ...row, '내 점수': newScore };
      }
      return row;
    });
    setMatrixData(updatedData);
  };
  
  const handlesave = async () => {
    const updates = matrixData.reduce((acc, row) => {
      if (!row['상세항목'] && row['프로그램명']) {
        acc.push({ programName: row['프로그램명'], myScore: row['내 점수'] || '' });
      } else if (row['상세항목']) {
        acc.push({ programName: row['프로그램명'], detailName: row['상세항목'], isCompleted: row['이수/미이수'] === '이수' });
      }
      return acc;
    }, []);

    if (updates.length === 0) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/save-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ id: userId, year, semester, data: updates }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        handleSearch();
      } else {
        alert('저장 실패: ' + json.message);
      }
    } catch (error) {
      console.error("데이터 저장 실패:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAccordion = (groupKey) => {
    setOpenAcc(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };
  
  const handleCompetencyClick = (competencyName) => {
    if (matrixData.length === 0) {
      alert('먼저 조회 버튼을 눌러 매트릭스를 불러와 주세요.');
      return;
    }
    setActiveFilter(prevFilter => (prevFilter === competencyName ? null : competencyName));
  };
  
  const dataToRender = activeFilter ? matrixData.filter(row => row['핵심역량'] === activeFilter) : matrixData;
  const processedData = processDataForRender(dataToRender, openAcc);

  // 핵심역량별 매트릭스 점수 입력
  function renderScoreInput() {
    const handleTierScoreChange = (e) => {
      const { name, value } = e.target;
      setTierScores(prev => ({ ...prev, [name]: value }));
    };
    const handleRegisterScores = async () => {
        const hasEmptyValue = Object.values(tierScores).some(score => score === '');
        if (hasEmptyValue) {
          alert('모든 역량 점수를 입력해주세요.');
          return;
        }
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/save-tier-scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({ id: userId, scores: tierScores, }),
          });
          const json = await res.json();
          if (json.success) {
            alert(json.message);
          } else {
            alert('점수 등록 실패: ' + json.message);
          }
        } catch (error) {
          console.error("점수 등록 실패:", error);
          alert("서버와 통신 중 오류가 발생했습니다.");
        }
      };

    // 점수 입력란
    return (
      <div className={styles.scoreInputContainer}>
        <div className={styles.scoreTitle}>TRUST 인증 점수 총점 <span className={styles.totalScore}>{totalTierScore}</span></div>
        <div className={styles.scoreInputs}>
          {COMPETENCY_ORDER.map((name, index) => {
            const shortName = ['T1. 유한인성역량', 'R. 기초학습역량', 'U. 직업기초역량', 'S. 직무수행역량', 'T2. 취창업기초역량'][index];
            return (
              <div className={styles.scoreItem} key={name}>
                <span
                  className={`${styles.competencyName} ${activeFilter === name ? styles.activeCompetency : ''}`}
                  onClick={() => handleCompetencyClick(name)}
                >
                  {shortName}
                </span>
                <input type="number" name={name} value={tierScores[name]} onChange={handleTierScoreChange} /> 점
              </div>
            )
          })}
        </div>
        <button className={styles.registerBtn} onClick={handleRegisterScores}>등록</button>
      </div>
    );
  }

  function renderTable() {
    return (
      <table className={styles.matrixTable}>
        <thead>
          <tr>
            <th>핵심역량</th> 
            <th>구분</th> 
            <th>프로그램명</th> 
            <th>상세항목</th> 
            <th>1회 점수</th> 
            <th>최대 점수</th> 
            <th>내 점수</th> 
            <th>총점</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((item, index) => {
            const { data, detailRows, renderFlags, rowSpans, totalScore, accordionKey, colorClass } = item;
            const hasDetail = detailRows.length > 0;
            const isAccordionOpen = !!openAcc[accordionKey];
            const programRowSpan = hasDetail && isAccordionOpen ? detailRows.length + 1 : 1;
            
            return (
              <React.Fragment key={index}>
                <tr>
                  {renderFlags.isFirstInCompetency && <td rowSpan={rowSpans.competency} className={colorClass}>{data['핵심역량']}</td>}
                  {renderFlags.isFirstInDivision && <td rowSpan={rowSpans.division}>{data['구분']}</td>}
                  <td rowSpan={programRowSpan}>{data['프로그램명']}</td>
                  <td>
                    {hasDetail ? (
                      <button type="button" className={styles.accordionBtn} onClick={() => toggleAccordion(accordionKey)}>
                        {isAccordionOpen ? '▲' : '▼'}
                      </button>
                    ) : ( data['상세항목'] )}
                  </td>
                  <td>{data['1회 점수']}</td>
                  <td>{data['최대 점수']}</td>
                  <td>
                    <input className={styles.scoreInput} value={data['내 점수'] || ''} onChange={(e) => handleScoreChange(data['프로그램명'], e.target.value)} />
                  </td>
                  {renderFlags.isFirstInCompetency && <td rowSpan={rowSpans.competency}>{totalScore}</td>}
                </tr>
                {hasDetail && isAccordionOpen &&
                  detailRows.map((detail, dIdx) => (
                    <tr key={`detail-${index}-${dIdx}`} className={styles.detailRow}>
                      <td>{detail['상세항목']}</td> 
                      <td>{detail['1회 점수']}</td> 
                      <td>{detail['최대 점수']}</td>
                      <td>
                        <input type="checkbox" checked={detail['이수/미이수'] === '이수'} onChange={(e) => handleCheckboxChange(data['프로그램명'], detail['상세항목'], e.target.checked)} />
                      </td>
                    </tr>
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    );
  }

return (
    <div className={styles.pageWrap}>
      <div className={styles.stickyHeader}>
        <Header user={user} onLogout={onLogout} />
        <div className={styles.topContentContainer}>
          <h1 className={styles.mainTitle}>매트릭스 점수</h1>
          {renderScoreInput()}
        </div>
        <div className={styles.filterBar}>
          <div className={styles.filterLeft}>
            <div className={styles.filterGroup}>
              <label>년도
                <select value={year} onChange={e => setYear(e.target.value)} className={styles.styledSelect}>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </label>
              <label>학기
                <select value={semester} onChange={e => setSemester(e.target.value)} className={styles.styledSelect}>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </label>
            </div>
            <div className={styles.fixedGroup}>학과: <b>{department}</b> &nbsp;|&nbsp; 이름: <b>{name}</b></div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.searchBtn} onClick={handleSearch} disabled={isSaving}>조회</button>
            <button className={styles.saveBtn} onClick={handlesave} disabled={isSaving}>{isSaving ? '저장 중...' : '저장'}</button>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 0 auto' }}>
        <div className={styles.container_wrap}>
          {matrixData.length > 0 ? (
            <div className={styles.matrixContent}>
              {renderTable()}
            </div>
          ) : (
            <h2 className={styles.placeholderText}>조회 버튼을 눌러 매트릭스를 불러오세요.</h2>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Matrix;