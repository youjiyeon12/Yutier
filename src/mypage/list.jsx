import React from "react";
import styles from "./list.module.css";

// 추천 프로그램 리스트 렌더링 
function List({ data }) {
  // 데이터가 없거나 비어있으면 간단한 메시지를 표시
  if (!data || data.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <p>추천해 드릴 프로그램이 없습니다.</p>
        <p>매트릭스에서 점수를 모두 입력했는지 확인해주세요!</p>
      </div>
    );
  }

  return (
    <div className={styles.listContainer}>
      <h3 className={styles.title}>
        추천 프로그램 리스트
      </h3>
      <table className={styles.programTable}>
        {/* 행 배치 */}
        <colgroup>
          <col className={styles.colCategory} />   
          <col className={styles.colName} />   
          <col className={styles.colScore} />   
        </colgroup>
        <thead>
          <tr>
            <th>핵심역량</th>
            <th>프로그램명</th>
            <th>부여 점수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row['핵심역량']}</td>
              <td>{row['프로그램명']}</td>
              <td>{row['1회 점수'] || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default List;
