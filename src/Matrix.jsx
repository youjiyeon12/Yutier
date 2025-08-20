  import React, { useState, useEffect } from 'react';
  import styles from './matrix.module.css';
  import Header from './Header';
  import Footer from './Footer';

  const colorSet = [styles.c0, styles.c1, styles.c2, styles.c3, styles.c4];

  function processDataForRender(data, openStates) {
    if (!data || data.length === 0) return [];

    const finalRenderList = [];
    const competencyGroups = new Map();

    // 데이터를 핵심역량 기준으로 그룹핑
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

    // 각 핵심역량 그룹을 순회하며 구조화
    Array.from(competencyGroups.entries()).forEach(([competencyName, groupData], competencyIndex) => {
      const { summaryRow, dataRows } = groupData;
      const totalScore = summaryRow ? summaryRow['총점'] : '';

      const colorClass = colorSet[competencyIndex % colorSet.length];

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

      // 아코디언 상태에 따라 동적으로 rowSpan 다시 계산
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
    // 상태 저장
    const [year, setYear] = useState('2025');
    const [semester, setSemester] = useState('1');
    const [matrixData, setMatrixData] = useState([]);
    const [openAcc, setOpenAcc] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [tierScores, setTierScores] = useState({
      유한인성역량: '',
      기초학습역량: '',
      직업기초역량: '',
      직무수행역량: '',
      취창업기초역량: '',
    });
    const [totalTierScore, setTotalTierScore] = useState(0);
    const department = user?.department || "학과명";
    const name = user?.name || "이름";
    const userId = user?.id;

    // 페이지 진입 시 저장된 점수를 자동으로 불러옴
    useEffect(() => {
      const fetchTierScores = async () => {
        if (!userId) return;
        try {
          const res = await fetch(`http://localhost:3001/api/get-tier-scores/${userId}`);
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

    // 점수 입력 시, 실시간으로 합산 점수 계산
    useEffect(() => {
      const total = Object.values(tierScores).reduce((sum, score) => {
        return sum + (Number(score) || 0);
      }, 0);
      setTotalTierScore(total);
    }, [tierScores]);

    // 체크박스 상태 변경 핸들러
    const handleCheckboxChange = (programName, detailName, isChecked) => {
      const updatedData = matrixData.map(row => {
        // 해당 프로그램의 상세항목을 찾아서 '이수/미이수' 값을 변경
        if (row['프로그램명'] === programName && row['상세항목'] === detailName) {
          return { ...row, '이수/미이수': isChecked ? '이수' : '' };
        }
        return row;
      });
      setMatrixData(updatedData);
    };
    // 내 점수 상태 변경 핸들러
    const handleScoreChange = (programName, newScore) => {
      const updatedData = matrixData.map(row => {
        if (row['프로그램명'] === programName && !row['상세항목']) {
          return { ...row, '내 점수': newScore };
        }
        return row;
      });
      setMatrixData(updatedData);
    };


    // 조회
    const handleSearch = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/load-matrix?id=${userId}&year=${year}&semester=${semester}`
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
      try {
        const res = await fetch(`http://localhost:3001/api/get-tier-scores/${userId}`);
        const data = await res.json();
        const emptyScores = { 유한인성역량: '', 기초학습역량: '', 직업기초역량: '', 직무수행역량: '', 취창업기초역량: '' };

        if (data.success) {
          setTierScores(data.scores || emptyScores);
          setTotalTierScore(data.totalScore || 0);
        } else {
          setTierScores(emptyScores);
          setTotalTierScore(0);
        }
      } catch (error) {
        console.error("Tier 점수 조회 중 오류:", error);
      }
    };

    // 저장
    const handlesave = async () => {
      // state에서 직접 변경된 데이터를 수집
      const updates = matrixData.reduce((acc, row) => {

        if (!row['상세항목'] && row['프로그램명']) {
          acc.push({
            programName: row['프로그램명'],
            myScore: row['내 점수'] || '', 
          });
        }
        else if (row['상세항목']) {
          acc.push({
            programName: row['프로그램명'],
            detailName: row['상세항목'],
            isCompleted: row['이수/미이수'] === '이수', 
          });
        }
        return acc;
      }, []);

      if (updates.length === 0) {
        alert('저장할 데이터가 없습니다.');
        return;
      }

      setIsSaving(true);

      try {
        const res = await fetch('http://localhost:3001/api/save-matrix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userId,
            year,
            semester,
            data: updates,
          }),
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
    
    // 렌더링 시점에 아코디언 상태를 전달하여 rowSpan을 다시 계산
    const processedData = processDataForRender(matrixData, openAcc);  

    // 매트릭스 핵심역량 점수 입력
    function renderScoreInput() {
      // 입력값이 바뀔 때마다 tierScores 상태를 업데이트하는 함수
      const handleScoreChange = (e) => {
        const { name, value } = e.target;
        setTierScores(prev => ({ ...prev, [name]: value }));
      };

      // '등록' 버튼을 눌렀을 때 실행될 함수 
      const handleRegisterScores = async () => {
          // 빈 값이 있는지 확인
          const hasEmptyValue = Object.values(tierScores).some(score => score === '');
          if (hasEmptyValue) {
            alert('모든 역량 점수를 입력해주세요.');
            return;
          }

          try {
            const res = await fetch('http://localhost:3001/api/save-tier-scores', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: userId,
                scores: tierScores,
              }),
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

      return (
        <div className={styles.scoreInputContainer}>
          <div className={styles.scoreTitle}>
            TRUST 인증 점수 총점
            <span className={styles.totalScore}>{totalTierScore}</span>
          </div>
          <div className={styles.scoreInputs}>
            <div className={styles.scoreItem}>
              <span>T1. 유한인성역량</span>
              <input type="number" name="유한인성역량" value={tierScores.유한인성역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span>R. 기초학습역량</span>
              <input type="number" name="기초학습역량" value={tierScores.기초학습역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span>U. 직업기초역량</span>
              <input type="number" name="직업기초역량" value={tierScores.직업기초역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span>S. 직무수행역량</span>
              <input type="number" name="직무수행역량" value={tierScores.직무수행역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span>T2. 취창업기초역량</span>
              <input type="number" name="취창업기초역량" value={tierScores.취창업기초역량} onChange={handleScoreChange} /> 점
            </div>
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
              // 필요한거 꺼내오기
              const { data, detailRows, renderFlags, rowSpans, totalScore, accordionKey, colorClass } = item;
              const hasDetail = detailRows.length > 0;
              const isAccordionOpen = !!openAcc[accordionKey];
              
              const programRowSpan = hasDetail && isAccordionOpen ? detailRows.length + 1 : 1;
              
              return (
                <React.Fragment key={index}>
                  {/* 대표 행 */}
                  <tr>
                    {renderFlags.isFirstInCompetency && <td rowSpan={rowSpans.competency} className={colorClass}>{data['핵심역량']}</td>}
                    {renderFlags.isFirstInDivision && <td rowSpan={rowSpans.division}>{data['구분']}</td>}
                    <td rowSpan={programRowSpan}>{data['프로그램명']}</td>
                    <td>
                      {hasDetail ? (
                        <button type="button" className={styles.accordionBtn} onClick={() => toggleAccordion(accordionKey)}>
                          {isAccordionOpen ? '▲' : '▼'}
                        </button>
                      ) : (
                        data['상세항목']
                      )}
                    </td>
                    <td>{data['1회 점수']}</td>
                    <td>{data['최대 점수']}</td>
                    <td>
                      <input
                        className={styles.scoreInput}
                        value={data['내 점수'] || ''} 
                        onChange={(e) => handleScoreChange(data['프로그램명'], e.target.value)} 
                        data-program-name={data['프로그램명']}
                      />
                    </td>
                    {renderFlags.isFirstInCompetency && <td rowSpan={rowSpans.competency}>{totalScore}</td>}
                  </tr>

                  {/* 상세 항목 행 (아코디언 열렸을 때) */}
                  {hasDetail && isAccordionOpen &&
                    detailRows.map((detail, dIdx) => (
                      <tr key={`detail-${index}-${dIdx}`} className={styles.detailRow}>
                        {/* 병합된 셀들은 렌더링하지 않음 */}
                        <td>{detail['상세항목']}</td>
                        <td>{detail['1회 점수']}</td>
                        <td>{detail['최대 점수']}</td>
                        <td>
                        <input
                          type="checkbox"
                          checked={detail['이수/미이수'] === '이수'} // state 기반으로 checked 상태 결정
                          onChange={(e) => handleCheckboxChange(data['프로그램명'], detail['상세항목'], e.target.checked)}
                        />
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
        <Header user={user} onLogout={onLogout} />
         <div className={styles.topContentContainer}>
          <h1 className={styles.mainTitle}>매트릭스 점수</h1>
          {renderScoreInput()}
        </div>
       
        <div className={styles.filterBar}>
          <div className={styles.filterLeft}>
            <div className={styles.filterGroup}>
              <label>
                년도
                <select value={year} onChange={e => setYear(e.target.value)} className={styles.styledSelect}>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </label>
              <label>
                학기
                <select value={semester} onChange={e => setSemester(e.target.value)} className={styles.styledSelect}>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </label>
            </div>
            <div className={styles.fixedGroup}>
              학과: <b>{department}</b> &nbsp;|&nbsp; 이름: <b>{name}</b>
            </div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.searchBtn} onClick={handleSearch} disabled={isSaving}>조회</button>
            <button className={styles.saveBtn} onClick={handlesave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
        <div className={styles.container_wrap}>
          {/* 매트릭스 점수 입력 및 테이블 출력(조회 버튼 클릭 시) */}
          {matrixData.length > 0 ? (
            <div className={styles.matrixContent}>
              {renderTable()}
            </div>
          ) : (
            <h2 className={styles.placeholderText}>조회 버튼을 눌러 매트릭스를 불러오세요.</h2>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  export default Matrix;
