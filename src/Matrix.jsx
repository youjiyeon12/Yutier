import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import style from './matrix.module.css';

function Matrix({ user, onLogout }) {
  // 초기 상태 설정
  const [matrixData, setMatrixData] = useState([]); // 조회된 매트릭스 데이터(시트에서 불러온 행 정보 배열)
  const [year, setYear] = useState('2025'); // 조회할 년도 필터
  const [semester, setSemester] = useState('1'); // 조회할 학기 필터
  const [matrixUrl, setMatrixUrl] = useState(''); // 상세항목 보기 상태(아코디언)
  const [openIndexes, setOpenIndexes] = useState({}); // 아코디언 열림 상태
  const [checkedDetails, setCheckedDetails] = useState({}); // 체크된 상세항목 상태

  useEffect(() => {
    // 로그인한 사용자 ID 기준으로 시트 URL 불러오기
    fetch(`http://localhost:3001/api/user-url?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMatrixUrl(data.url);
      })
      .catch((err) => {
        console.error('시트 URL 가져오기 실패:', err);
      });
  }, [user.id]);

  // 조회 버튼 -> 매트릭스 호출
  const handleLoadMatrix = () => {
    if (!matrixUrl) return;

    const encodedUrl = encodeURIComponent(matrixUrl);
    const semesterKey = `${year}-${semester}`;

    fetch(`http://localhost:3001/api/load-matrix?url=${encodedUrl}&semester=${semesterKey}`)
      .then((res) => res.json())
      .then((data) => {
        setMatrixData(data.data); // 시트에서 파싱된 행들
      })
      .catch((err) => {
        console.error('매트릭스 불러오기 실패:', err);
      });
  };

  // 핵심역량이 연속된 그룹별로 나누는 함수
  function groupByCoreCompetency(data) {
    const grouped = {};
    let currentKey = '';

    data.forEach((row) => {
      const key = row.핵심역량?.trim() || currentKey;
      currentKey = key;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    return Object.values(grouped);
  }

  const toggleAccordion = (idx) => {
    setOpenIndexes(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleDetailCheck = (index, item) => {
    setCheckedDetails(prev => {
      const prevSet = prev[index] || [];
      const exists = prevSet.includes(item);
      return {
        ...prev,
        [index]: exists ? prevSet.filter(i => i !== item) : [...prevSet, item]
      };
    });
  };

  return (
    <div className={style.container}>
      <Header user={user} onLogout={onLogout} />

      <main className={style.mainContent}>
        <h2>📊 유한 TRUST 매트릭스</h2>

        {/* 상단 필터 바 */}
        <div className={style.filterBar}>
          <label>
            년도:
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </label>

          <label>
            학기:
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </label>

          <label>
            학과:
            <input type="text" value={user.department} readOnly />
          </label>

          <label>
            이름:
            <input type="text" value={user.name} readOnly />
          </label>

          <button onClick={handleLoadMatrix}>조회</button>
        </div>

        {/* 매트릭스 URL 확인용 */}
        <div className={style.debugBox}>
          <strong>시트 URL:</strong>{' '}
          {matrixUrl ? (
            <a href={matrixUrl} target="_blank" rel="noopener noreferrer">🔗 시트 열기</a>
          ) : (
            <span>불러오는 중...</span>
          )}
        </div>

        {matrixData.length > 0 && (
          <table className={style.matrixTable}>
            <thead>
              <tr>
                <th>핵심역량</th>
                <th>구분</th>
                <th>프로그램명</th>
                <th>1회 점수</th>
                <th>최대 취득 점수</th>
                <th>상세항목</th>
                <th>내 점수</th>
                <th>총점</th> 
              </tr>
            </thead>
            <tbody>
              {groupByCoreCompetency(matrixData).map((group, groupIdx) => {
                let totalScore = 0;
                return (
                  <>
                    {group.map((row, rowIdx) => {
                      const globalIndex = `${groupIdx}-${rowIdx}`;
                      const hasDetail = Array.isArray(row.상세항목) && row.상세항목.length > 0;
                      const detailItems = hasDetail ? row.상세항목 : [];
                      const userScore = Number(row.내점수) || 0;
                      totalScore += userScore;

                      return (
                        <>
                          <tr
                            key={globalIndex}
                            className={hasDetail ? style.accordionRow : ''}
                          >
                            {rowIdx === 0 && (
                            <td
                              rowSpan={
                                group.length +
                                group.filter((_, i) => openIndexes[`${groupIdx}-${i}`]).length
                              }
                            >
                              {row.핵심역량}
                            </td>
                          )}

                            <td>{row.구분}</td>
                            <td>{row.프로그램명}</td>
                            <td>{row.일회점수}</td>
                            <td>{row.최대점수}</td>
                            <td>
                              {hasDetail && (
                                <button
                                  className={style.accordionToggle}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleAccordion(globalIndex);
                                  }}
                                >
                                  {openIndexes[globalIndex] ? '접기' : '보기'}
                                </button>
                              )}
                            </td>
                            <td>{row.내점수}</td>
                            {rowIdx === 0 && (
                            <td
                              rowSpan={
                                group.length +
                                group.filter((_, i) => openIndexes[`${groupIdx}-${i}`]).length
                              }
                              className={style.totalScoreCell}
                            >
                              <strong>{totalScore}</strong>
                            </td>
                          )}

                          </tr>

                            {hasDetail && openIndexes[globalIndex] && (
                              <tr className={style.detailRow}>
                                <td colSpan={6}>
                                  <div className={style.detailBox}>
                                    <strong>📌 상세내용 체크:</strong>
                                    <ul className={style.detailList}>
                                      {detailItems.map((item, i) => (
                                        <li key={`${globalIndex}-${i}`}>
                                          <label>
                                            <input
                                              type="checkbox"
                                              checked={checkedDetails[globalIndex]?.includes(item) || false}
                                              onChange={() => handleDetailCheck(globalIndex, item)}
                                            />{' '}
                                            {item}
                                          </label>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </td>
                              </tr>
                            )}
                        </>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Matrix;
