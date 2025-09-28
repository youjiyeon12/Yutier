  import React, { useState, useEffect } from 'react';
  import styles from './styles/matrix.module.css';
  import Header from '../../components/common/Header';
  import Footer from '../../components/common/Footer';
  import { googleSheetsService } from '../../services/googleSheetsService';

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
    console.log("🔍 [Matrix] 컴포넌트 렌더링 시작");
    console.log("🔍 [Matrix] 받은 user 정보:", user);
    console.log("🔍 [Matrix] user.id:", user?.id);
    console.log("🔍 [Matrix] user.matrixUrl:", user?.matrixUrl);
    
    // 상태 저장
    const [year, setYear] = useState('2025');
    const [semester, setSemester] = useState('1');
    const [matrixData, setMatrixData] = useState([]);
    const [originalMatrixData, setOriginalMatrixData] = useState([]); // 원본 데이터 저장
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
    const [filteredCompetency, setFilteredCompetency] = useState(null); // 필터링된 핵심역량
    const department = user?.department || "학과명";
    const name = user?.name || "이름";
    const userId = user?.id;

    console.log("🔍 [Matrix] 현재 상태:");
    console.log("🔍 [Matrix] year:", year, "semester:", semester);
    console.log("🔍 [Matrix] matrixData 길이:", matrixData.length);
    console.log("🔍 [Matrix] isSaving:", isSaving);

    // 페이지 진입 시 URL 유효성 검사 및 저장된 점수를 자동으로 불러옴
    useEffect(() => {
      const initializeMatrix = async () => {
        if (!userId) return;
        
        // URL 유효성 검사
        try {
          const urlValidation = await googleSheetsService.validateMatrixUrl(userId);
          if (!urlValidation.valid) {
            console.error("❌ [Matrix] 페이지 로드 시 URL이 유효하지 않습니다.");
            alert("매트릭스 URL이 등록되지 않았거나 유효하지 않습니다. URL 등록 페이지로 이동합니다.");
            window.location.href = '/matrix-url';
            return;
          }
        } catch (error) {
          console.error("❌ [Matrix] 페이지 로드 시 URL 검증 실패:", error);
          alert("매트릭스 URL 검증 중 오류가 발생했습니다. URL 등록 페이지로 이동합니다.");
          window.location.href = '/matrix-url';
          return;
        }

        // URL이 유효하면 점수 조회
        try {
          const data = await googleSheetsService.getTierScores(userId);
          if (data.success && data.scores) {
            setTierScores(data.scores);
          }
        } catch (error) {
          console.error("페이지 로드 시 점수 조회 오류:", error);
        }
      };
      
      initializeMatrix();
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
      console.log("🔍 [Matrix] handleSearch 시작");
      console.log("🔍 [Matrix] 조회 파라미터 - userId:", userId, "year:", year, "semester:", semester);
      
      if (!userId) {
        console.error("❌ [Matrix] userId가 없습니다.");
        alert("사용자 정보가 없습니다.");
        return;
      }

      // URL 유효성 검사 - 서버에서 직접 확인
      try {
        const urlValidation = await googleSheetsService.validateMatrixUrl(userId);
        if (!urlValidation.valid) {
          console.error("❌ [Matrix] 매트릭스 URL이 유효하지 않습니다.");
          alert("매트릭스 URL이 등록되지 않았거나 유효하지 않습니다. 먼저 URL을 등록해주세요.");
          // URL이 유효하지 않으면 URL 등록 페이지로 리다이렉트
          window.location.href = '/matrix-url';
          return;
        }
      } catch (error) {
        console.error("❌ [Matrix] URL 검증 실패:", error);
        alert("매트릭스 URL 검증 중 오류가 발생했습니다.");
        // 오류 발생 시에도 URL 등록 페이지로 리다이렉트
        window.location.href = '/matrix-url';
        return;
      }

      try {
        console.log("🔍 [Matrix] loadMatrix API 호출 시작");
        const json = await googleSheetsService.loadMatrix(userId, year, semester);
        console.log("🔍 [Matrix] loadMatrix 응답:", json);
        
        if (json.success) {
          console.log("✅ [Matrix] 매트릭스 데이터 로드 성공, 데이터 길이:", json.data?.length);
          
          // 이수/미이수 데이터 확인 (문자열 정리 후 비교)
          const completedItems = json.data.filter(row => {
            const value = row['이수/미이수'];
            return value && value.toString().trim() === '이수';
          });
          console.log(`✅ [Matrix] 이수 완료된 항목 수: ${completedItems.length}개`);
          
          // 디버깅: 이수/미이수 컬럼의 실제 값들 확인
          const completionValues = json.data
            .map(row => row['이수/미이수'])
            .filter(val => val && val.toString().trim() !== '')
            .slice(0, 5);
          console.log('🔍 [Matrix] 이수/미이수 컬럼의 실제 값들 (처음 5개):', completionValues);
          console.log('🔍 [Matrix] 값들의 길이:', completionValues.map(v => v.toString().length));
          console.log('🔍 [Matrix] 값들의 문자 코드:', completionValues.map(v => v.toString().split('').map(c => c.charCodeAt(0))));
          
          if (completedItems.length > 0) {
            console.log('✅ [Matrix] 이수 완료된 항목 샘플:', completedItems.slice(0, 3));
          }
          
          setMatrixData(json.data);
          setOriginalMatrixData(JSON.parse(JSON.stringify(json.data))); // 원본 데이터 저장 (깊은 복사)
          setOpenAcc({});
        } else {
          console.error("❌ [Matrix] 매트릭스 데이터 로드 실패:", json.message);
          alert(json.message);
          setMatrixData([]);
          setOriginalMatrixData([]);
        }
      } catch (error) {
        console.error("❌ [Matrix] 데이터 조회 실패:", error);
        alert("서버와 통신 중 오류가 발생했습니다.");
      }
      
      try {
        console.log("🔍 [Matrix] getTierScores API 호출 시작");
        const data = await googleSheetsService.getTierScores(userId);
        console.log("🔍 [Matrix] getTierScores 응답:", data);
        
        const emptyScores = { 유한인성역량: '', 기초학습역량: '', 직업기초역량: '', 직무수행역량: '', 취창업기초역량: '' };

        if (data.success) {
          console.log("✅ [Matrix] 티어 점수 조회 성공:", data.scores);
          setTierScores(data.scores || emptyScores);
          setTotalTierScore(data.totalScore || 0);
        } else {
          console.log("⚠️ [Matrix] 티어 점수 조회 실패, 기본값 사용");
          setTierScores(emptyScores);
          setTotalTierScore(0);
        }
      } catch (error) {
        console.error("❌ [Matrix] Tier 점수 조회 중 오류:", error);
      }
    };

    // 변경된 데이터만 감지하는 함수
    const getChangedData = () => {
      const changes = [];
      
      matrixData.forEach((currentRow, index) => {
        const originalRow = originalMatrixData[index];
        if (!originalRow) return;
        
        // 내 점수 변경 확인
        if (!currentRow['상세항목'] && currentRow['프로그램명']) {
          const currentScore = currentRow['내 점수'] || '';
          const originalScore = originalRow['내 점수'] || '';
          
          if (currentScore !== originalScore) {
            changes.push({
              programName: currentRow['프로그램명'],
              myScore: currentScore,
            });
          }
        }
        
        // 이수/미이수 변경 확인
        if (currentRow['상세항목']) {
          const currentCompleted = currentRow['이수/미이수'] && currentRow['이수/미이수'].toString().trim() === '이수';
          const originalCompleted = originalRow['이수/미이수'] && originalRow['이수/미이수'].toString().trim() === '이수';
          
          if (currentCompleted !== originalCompleted) {
            changes.push({
              programName: currentRow['프로그램명'],
              detailName: currentRow['상세항목'],
              isCompleted: currentCompleted,
            });
          }
        }
      });
      
      return changes;
    };

    // 저장
    const handlesave = async () => {
      // 변경된 데이터만 수집
      const updates = getChangedData();
      
      console.log(`💾 [Matrix] 변경된 데이터: ${updates.length}개`);

      if (updates.length === 0) {
        alert('변경된 데이터가 없습니다.');
        return;
      }

      setIsSaving(true);

      try {
        const json = await googleSheetsService.saveMatrix(userId, updates, year, semester);
        if (json.success) {
          alert(`저장 완료! (${updates.length}개 항목 변경됨)`);
          // 저장 성공 시 원본 데이터 업데이트
          setOriginalMatrixData(JSON.parse(JSON.stringify(matrixData)));
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
    
    // 필터링된 데이터 처리
    const filteredData = filteredCompetency 
      ? matrixData.filter(row => row['핵심역량'] === filteredCompetency)
      : matrixData;
    
    // 렌더링 시점에 아코디언 상태를 전달하여 rowSpan을 다시 계산
    const processedData = processDataForRender(filteredData, openAcc);  

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
            const json = await googleSheetsService.saveTierScores(userId, tierScores);
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

      // 역량 클릭 핸들러
      const handleCompetencyClick = (competency) => {
        setFilteredCompetency(competency);
      };

      return (
        <div className={styles.scoreInputContainer}>
          <div className={styles.scoreTitle}>
            TRUST 인증 점수 총점
            <span className={styles.totalScore}>{totalTierScore}</span>
          </div>
          <div className={styles.scoreInputs}>
            <div className={styles.scoreItem}>
              <span 
                className={styles.clickableCompetency}
                onClick={() => handleCompetencyClick('유한인성역량')}
                title="유한인성역량 항목들 보기"
              >
                T1. 유한인성역량
              </span>
              <input type="number" name="유한인성역량" value={tierScores.유한인성역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={styles.clickableCompetency}
                onClick={() => handleCompetencyClick('기초학습역량')}
                title="기초학습역량 항목들 보기"
              >
                R. 기초학습역량
              </span>
              <input type="number" name="기초학습역량" value={tierScores.기초학습역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={styles.clickableCompetency}
                onClick={() => handleCompetencyClick('직업기초역량')}
                title="직업기초역량 항목들 보기"
              >
                U. 직업기초역량
              </span>
              <input type="number" name="직업기초역량" value={tierScores.직업기초역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={styles.clickableCompetency}
                onClick={() => handleCompetencyClick('직무수행역량')}
                title="직무수행역량 항목들 보기"
              >
                S. 직무수행역량
              </span>
              <input type="number" name="직무수행역량" value={tierScores.직무수행역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={styles.clickableCompetency}
                onClick={() => handleCompetencyClick('취창업기초역량')}
                title="취창업기초역량 항목들 보기"
              >
                T2. 취창업기초역량
              </span>
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
                          checked={detail['이수/미이수'] && detail['이수/미이수'].toString().trim() === '이수'} // 문자열 정리 후 비교
                          onChange={(e) => handleCheckboxChange(data['프로그램명'], detail['상세항목'], e.target.checked)}
                        />
                        {/* 디버깅용 - 개발 모드에서만 표시 */}
                        {process.env.NODE_ENV === 'development' && (
                          <span style={{fontSize: '10px', color: 'gray'}}>
                            ({detail['이수/미이수']})
                          </span>
                        )}
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
        
        {/* 필터링 상태 표시 */}
        {matrixData.length > 0 && filteredCompetency && (
          <div className={styles.competencyFilter}>
            <div className={styles.filterTitle}>
              현재 필터링: <strong>{filteredCompetency}</strong>
              <button 
                className={styles.clearFilterBtn}
                onClick={() => setFilteredCompetency(null)}
                title="전체 보기"
              >
                ✕ 전체 보기
              </button>
            </div>
          </div>
        )}
        <div className={styles.container_wrap}>
          {/* 매트릭스 점수 입력 및 테이블 출력(조회 버튼 클릭 시) */}
          {matrixData.length > 0 ? (
            <div className={styles.matrixContent}>
              {/* 필터링된 역량 정보 표시 */}
              {filteredCompetency && (
                <div className={styles.filteredInfo}>
                  <div className={styles.filteredTitle}>
                    📋 {filteredCompetency} 역량 항목들
                  </div>
                  <div className={styles.filteredCount}>
                    총 {filteredData.length}개 항목
                  </div>
                </div>
              )}
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
