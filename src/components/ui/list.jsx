import React from "react";

/**
 * 추천 프로그램 리스트 컴포넌트
 * 추천 프로그램 데이터를 테이블 형태로 표시
 * 
 * 주요 기능:
 * - 추천 프로그램을 테이블로 표시
 * - 상세항목이 있는 프로그램에 * 표시
 * - 데이터가 없을 때 안내 메시지 표시
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.data - 추천 프로그램 데이터 배열
 */
function List({ data }) {
  // 상세항목이 있는 프로그램이 있는지 확인
  const hasDetails = data && data.some(item => 
    item.hasDetails || 
    (item.상세항목 && item.상세항목 !== '') ||
    (item.details && item.details !== '')
  );
  
  return (
    <div style={{ marginTop: "0px" }}>
      <h3 style={{
        textAlign: "left",
        paddingLeft: "0px",
        display: "inline"
      }}>
        추천 프로그램 리스트
      </h3>
      
      {/* 상세항목 표시 안내 */}
      {hasDetails && (
        <div style={{ 
          textAlign: 'right', 
          marginBottom: '10px', 
          fontSize: '12px', 
          color: '#666' 
        }}>
          * 상세항목 존재
        </div>
      )}
      
      <table style={{
        width: "100%",
        maxWidth: "900px",
        tableLayout: "fixed",  
        borderCollapse: "collapse",
        textAlign: "center",
        margin: "0 auto"
      }}>
        {/* 행 배치 */}
        <colgroup>
          <col style={{ width: "20%" }} />   
          <col style={{ width: "60%" }} />   
          <col style={{ width: "20%" }} />   
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>핵심역량</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>프로그램명</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>부여 점수</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, index) => {
              const programName = row['프로그램명'] || row.programName || '';
              const hasItemDetails = row.hasDetails || 
                (row.상세항목 && row.상세항목 !== '') ||
                (row.details && row.details !== '');
              
              return (
                <tr key={index}>
                  <td style={{ border: "1px solid #ccc", padding: "8px", wordWrap: "break-word" }}>
                    {row['핵심역량'] || row.category || ''}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", wordWrap: "break-word" }}>
                    {programName}
                    {hasItemDetails && (
                      <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}> *</span>
                    )}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", wordWrap: "break-word" }}>
                    {row['1회 점수'] || row.firstScore || ''}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="3" style={{ border: "1px solid #ccc", padding: "8px" }}>데이터가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default List;
