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

      const competencyColorMap = {
        '유한인성역량': styles.c0,
        '기초학습역량': styles.c1,
        '직업기초역량': styles.c2,
        '직무수행역량': styles.c3,
        '취창업기초역량': styles.c4,
      };

       const colorClass = competencyColorMap[competencyName] || colorSet[competencyIndex % colorSet.length];

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
    console.log("🔍 [Matrix] user.id:", user?.id);
    console.log("🔍 [Matrix] user.matrixUrl:", user?.matrixUrl);
    
    // 상태 저장
    const [year, setYear] = useState('2025');
    const [semester, setSemester] = useState('1');
    const [matrixData, setMatrixData] = useState([]);
    const [originalMatrixData, setOriginalMatrixData] = useState([]); // 원본 데이터 저장
    const [openAcc, setOpenAcc] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isFilter, setIsFilter] = useState(false);
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
   // 도움말 버튼 상태 추가
   const [showHelp, setShowHelp] = useState(false);
   const [currentSlide, setCurrentSlide] = useState(0);


    console.log("🔍 [Matrix] year:", year, "semester:", semester);

    useEffect(() => {
      if (userId) {
        handleSearch();
      }

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
    console.log("🔍 [Matrix] 조회 파라미터 - userId:", userId, "year:", year, "semester:", semester);
    
    if (!userId) {
      alert("사용자 정보가 없습니다.");
      return;
    }

    setIsFilter(true); // 로딩 시작

    try {
      const urlValidation = await googleSheetsService.validateMatrixUrl(userId);
      if (!urlValidation.valid) {
        alert("매트릭스 URL이 등록되지 않았거나 유효하지 않습니다.");
        window.location.href = '/matrix-url';
        return;
      }

      // Trust 인증 총점 로드
      const tierResult = await googleSheetsService.getTierScores(userId);
      if (tierResult.success) {
        console.log("✅ [Matrix] TRUST 점수 조회 성공:", tierResult.scores);
        setTierScores(tierResult.scores || {});
        setTotalTierScore(tierResult.totalScore || 0);
      } else {
        console.warn("⚠️ [Matrix] TRUST 점수 조회 실패");
      }

      // 매트릭스 로드
      googleSheetsService.loadMatrix(userId, year, semester)
        .then(matrixResult => {
          if (matrixResult.success) {
            console.log("✅ [Matrix] 매트릭스 데이터 로드 성공:", matrixResult.data?.length);
            setMatrixData(matrixResult.data);
            setOriginalMatrixData(JSON.parse(JSON.stringify(matrixResult.data)));
            setOpenAcc({});
          } else {
            console.error("❌ [Matrix] 매트릭스 데이터 로드 실패:", matrixResult.message);
            alert(matrixResult.message);
          }
        })
        .catch(error => {
          console.error("❌ [Matrix] 매트릭스 데이터 로드 오류:", error);
        })
        .finally(() => setIsFilter(false));

    } catch (error) {
      console.error("❌ [Matrix] handleSearch 중 오류:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
      setIsFilter(false);
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
                className={`${styles.clickableCompetency} ${styles.clickableC0}`}
                onClick={() => handleCompetencyClick('유한인성역량')}
                title="유한인성역량 항목들 보기"
              >
                T1. 유한인성역량
              </span>
              <input type="number" name="유한인성역량" value={tierScores.유한인성역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={`${styles.clickableCompetency} ${styles.clickableC1}`}
                onClick={() => handleCompetencyClick('기초학습역량')}
                title="기초학습역량 항목들 보기"
              >
                R. 기초학습역량
              </span>
              <input type="number" name="기초학습역량" value={tierScores.기초학습역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={`${styles.clickableCompetency} ${styles.clickableC2}`}
                onClick={() => handleCompetencyClick('직업기초역량')}
                title="직업기초역량 항목들 보기"
              >
                U. 직업기초역량
              </span>
              <input type="number" name="직업기초역량" value={tierScores.직업기초역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={`${styles.clickableCompetency} ${styles.clickableC3}`}
                onClick={() => handleCompetencyClick('직무수행역량')}
                title="직무수행역량 항목들 보기"
              >
                S. 직무수행역량
              </span>
              <input type="number" name="직무수행역량" value={tierScores.직무수행역량} onChange={handleScoreChange} /> 점
            </div>
            <div className={styles.scoreItem}>
              <span 
                className={`${styles.clickableCompetency} ${styles.clickableC4}`}
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

          {/* 도움말 */}
          <div className={styles.titleWithHelp}>
            <button
              onClick={() => setShowHelp(true)}
              className={styles.helpButtonInline} >
              <img
                src="question.png"
                alt="도움말 버튼"
                className={styles.helpIcon} 
              />
            </button>
          </div>

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
            <button className={styles.searchBtn} onClick={handleSearch} disabled={isFilter}>
              {isFilter ? '조회 중...' : '조회'}
            </button>
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
             
              {renderTable()}
            </div>
          ) : (
            <h2 className={styles.placeholderText}>조회 버튼을 눌러 매트릭스를 불러오세요.</h2>
          )}
        </div>

{/*-----도움말 버튼---------------------*/}
        
{showHelp && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
        >
          <div 
            className={styles.helpWindow} 
            onClick={(e) => e.stopPropagation()}
          >

            {(() => {
              //  실제 도움말 내용
              const slideContents = [
                { 
                    id: 1, 
                       text: (
                         <>
                          <h3 className={styles.title}>Yutier 매트릭스 등록</h3>
                          <p className={styles.tbody}>
                          1. 매트릭스 점수 입력하는 페이지가 나오면 유한대학교 포털(<a href='https://portal.yuhan.ac.kr/' target='_blank'>https://portal.yuhan.ac.kr/</a>)로 이동합니다. 
                          <br/>
                          2. 로그인 후 [학생이력]으로 들어가줍니다.
                          <br/>
                          3. '나의 TRUST인증 현황' 아래에 각각의 자신의 점수를 Yutier 웹 페이지로 돌아와 입력해줍니다.
                          </p>
                          <img src="/sc3.png" height="300px" style={{ marginTop: '30px' , marginRight: '20px'}}></img>
                          <img src="/sc4.png" height="300px" style={{ marginTop: '30px' }}></img>
                        
                      </>
                    ) 
                  },
                { 
                  id: 2, 
                  text: (
                    <>
                      <h3 className={styles.title}>Yutier 매트릭스 등록</h3>
                      <p className={styles.tbody}>
                        4. 나의 인증현황 가운데를 누른 후 [개인역량 매트릭스]에 들어갑니다.
                        <br/>
                        5. 들어간 후엔 학년, 학기, 교과를 선택하고 [조회]를 누릅니다.
                        <br/>
                        6. 조회를 누르면 아래처럼 점수가 나오는 것을 볼 수 있습니다.
                      </p>
                      <img src="/sc6.png" height="250px" style={{marginTop: '-30px',marginRight: '20px'}}></img>
                      <img src="/sc7.png" height="250px" style={{marginTop: '-300px'}}></img>
                      <img src="/sc8.png" height="290px" style={{ marginTop: '30px' , marginLeft: '20px'}}></img>
                    </>
                  )
                },
                { 
                  id: 3, 
                  text: (
                    <>
                      <h3 className={styles.title}>Yutier 매트릭스 등록</h3>
                      <p className={styles.tbody}>
                        9. 나온 점수를 토대로 Yutier 사이트에 입력합니다.
                        <br/>
                        10. 각 버튼 마다 필터링 기능이 있어 항목별로 각각 볼 수 있습니다
                        <br/>
                        11. 또한 화살표를 눌러 상세항목 보기가 가능합니다.
                      </p>
                      <img src="/sc9.png" height="270px" style={{marginTop: '30px',marginRight: '20px'}}></img>
                      <img src="/sc10.png" height="270px" style={{marginTop: '30px'}}></img>
                    </>
                  )
                },
                { 
                  id: 4, 
                  text: (
                    <>
                      <h3 className={styles.title}>Yutier 매트릭스 등록</h3>
                      <p className={styles.tbody}>
                        12. 다 입력을 하였다면 [홈]이나 마이페이지의 회원정보에서 티어와 추천 프로그램 리스트를 확인할 수 있습니다.
                      </p>
                      <img src="/sc11.png" height="280px" style={{marginTop: '60px',marginRight: '20px'}}></img>
                      <img src="/sc12.png" height="280px" style={{marginTop: '60px'}}></img>
                    </>
                  )
                },
                   
              ];

              return (
                <>
                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
                    className={styles.closeButton} 
                  >
                    &times;
                  </button>

                  {/* 슬라이드 내용 영역 */}
                  <div className={styles.slideContentArea}>
                    {slideContents[currentSlide].text}
                  </div>

                  {/* 슬라이드 제어 버튼 (왼쪽 하단 고정) */}
                  <div className={styles.slideControlsBottomLeft}>
                    <button
                      onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                      disabled={currentSlide === 0} 
                      className={styles.slideNavButton}
                    >
                      <img 
                        src="/arrow-left.png" 
                        alt="이전" 
                        className={styles.slideNavIcon}
                      />
                    </button>
                    
                    <span className={styles.slidePageIndicator}>
                      {currentSlide + 1} / {slideContents.length}
                    </span>

                    <button
                      onClick={() => setCurrentSlide(prev => Math.min(slideContents.length - 1, prev + 1))}
                      disabled={currentSlide === slideContents.length - 1} 
                      className={styles.slideNavButton}
                    >
                      <img 
                        src="/arrow-right.png" 
                        alt="다음" 
                        className={styles.slideNavIcon}
                      />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
        
        <Footer />
      </div>
    );
  }

  export default Matrix;
