//추천 프로그램 리스트 컴포넌트
//총점이 제일 낮은 역량은 2개의 프로그램을, 다음 역량들은 하나의 프로그램씩 
//총 5가지의 1회 점수가 높은 프로그램들 추천 
import React from "react";

function List({ data }) {

  // 추천 프로그램 뽑아내는 함수
  const getRecommendedPrograms = (matrixData) => {

    if (!matrixData || matrixData.length === 0) return [];

    // 핵심역량별 총점 구하기
    const competencyScores = {};
    [...new Set(matrixData.map(item => item['핵심역량']))].forEach(competency => {
      competencyScores[competency] = 0;
    });

    // 역량별 이수 프로그램 점수 합산
    matrixData.forEach(item => {
      const myScore = item['내 점수'] !== undefined && item['내 점수'] !== null && item['내 점수'].toString().trim() !== ''
        ? Number(item['내 점수'])
        : 0;
      competencyScores[item['핵심역량']] += myScore;
    });

    // 총점 낮은 역량부터 정렬
    const sortedCompetencies = Object.keys(competencyScores).sort(
      (a, b) => competencyScores[a] - competencyScores[b]
    );

    const recommended = [];
    const recommendedProgramNames = new Set();

    sortedCompetencies.forEach((competency, index) => {
      if (recommended.length >= 5) return;

      // 미이수 프로그램만 필터 (점수가 비어있거나 null)
      const uncompletedPrograms = matrixData
        .filter(item =>
          item['핵심역량'] === competency &&
          (item['내 점수'] === null || item['내 점수'] === undefined || item['내 점수'].toString().trim() === '') &&
          !recommendedProgramNames.has(item['프로그램명'])
        )
        .sort((a, b) => (Number(b['1회 점수']) || 0) - (Number(a['1회 점수']) || 0));

      // 총점이 제일 낮은 역량은 2개 추천, 나머지는 1개씩
      if (index === 0) {
        uncompletedPrograms.slice(0, 2).forEach(program => {
          if (recommended.length < 5) {
            recommended.push(program);
            recommendedProgramNames.add(program['프로그램명']);
          }
        });
      } else {
        if (uncompletedPrograms.length > 0 && recommended.length < 5) {
          recommended.push(uncompletedPrograms[0]);
          recommendedProgramNames.add(uncompletedPrograms[0]['프로그램명']);
        }
      }
    });

    // 5개가 안되면 미이수 프로그램에서 점수 높은 순으로 나열 
    if (recommended.length < 5) {
      const allUncompletedPrograms = matrixData
        .filter(item =>
          (item['내 점수'] === null || item['내 점수'] === undefined || item['내 점수'].toString().trim() === '') &&
          !recommendedProgramNames.has(item['프로그램명'])
        )
        .sort((a, b) => (Number(b['1회 점수']) || 0) - (Number(a['1회 점수']) || 0));

      while (recommended.length < 5 && allUncompletedPrograms.length > 0) {
        const programToAdd = allUncompletedPrograms.shift();
        recommended.push(programToAdd);
        recommendedProgramNames.add(programToAdd['프로그램명']);
      }
    }

    // 최종 정렬
    return recommended.sort((a, b) => {
      const scoreA = competencyScores[a['핵심역량']];
      const scoreB = competencyScores[b['핵심역량']];
      if (scoreA !== scoreB) return scoreA - scoreB;
      return (Number(b['1회 점수']) || 0) - (Number(a['1회 점수']) || 0);
    });
  };

  const recommendedData = getRecommendedPrograms(data);

  return (
    <div style={{ marginTop: "10px" }}>
      <h3 style={{ textAlign: "left", marginBottom: "20px" }}>
        추천 프로그램 리스트
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>핵심역량</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>프로그램명</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>부여 점수</th>
          </tr>
        </thead>
        <tbody>
          {recommendedData.length > 0 ? (
            recommendedData.map((row, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row['핵심역량']}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row['프로그램명']}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {row['1회 점수'] !== undefined && row['1회 점수'] !== null ? row['1회 점수'] : '-'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ border: "1px solid #ccc", padding: "8px" }}>
                추천 프로그램이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default List;