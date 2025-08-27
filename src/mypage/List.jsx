import React from "react";

// 추천 프로그램 리스트 렌더링
function List({ data }) {
  return (
    <div style={{ marginTop: "0px" }}>
      <h3 style={{
        textAlign: "left",
        marginBottom: "20px",
        paddingLeft: "45px"
      }}>
        추천 프로그램 리스트
      </h3>
      <table style={{
        width: "90%",
        borderCollapse: "collapse",
        textAlign: "center",
        margin: "0 auto"
      }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>핵심역량</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>프로그램명</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>부여 점수</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row['핵심역량']}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row['프로그램명']}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{row['1회 점수'] || ''}</td>
              </tr>
            ))
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
