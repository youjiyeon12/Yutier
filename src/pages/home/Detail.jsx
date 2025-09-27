// trust 설명 페이지
import { useState, useEffect } from 'react';
//import { useSearchParams } from 'react-router-dom';

import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import dmc from './styles/detail.module.css';
import Detail2 from './Detail2';

function Detail({ user, onLogout }) {
  // URL에 파라미터 없이 상태 유지
  const [activeMenuKey, setActiveMenuKey] = useState("info");

  // 메뉴 클릭 시 localStorage에 저장
  const handleMenuClick = (menuKey) => {
    setActiveMenuKey(menuKey)

    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/detail")
  }

  // URL 정리
  useEffect(() => {
    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/detail")
  }, [])

  return (
    <div className={dmc.container}>
      <Header user={user} onLogout={onLogout} />
      <div className={activeMenuKey === "info" ? dmc.content : dmc.content2}>
        <div className={dmc.menuContent}>
          <p className={dmc.menuTitle}>YUHAN TRUST</p>
          <div className={dmc.menuBar}>
            <p><span onClick={() => handleMenuClick("info")}
              className={activeMenuKey === "info" ? dmc.menuClickBtn : dmc.menuNoBtn}>교육 인증 제도 안내</span></p>
            <p><span onClick={() => handleMenuClick("trust")}
              className={activeMenuKey === "trust" ? dmc.menuClickBtn : dmc.menuNoBtn}>TRUST 역량 안내</span></p>
          </div>
        </div>
        {activeMenuKey === "info" && (
          <div className={dmc.body}>
            <div className={dmc.textArea}>
              <p className={dmc.titleText}>YUHAN TRUST 교육 인증 제도</p>
              <p>사회에 봉사하고 책임을 질 줄 아는 인간교육의 바탕 위에 지식사회에 필요한 전문 지식과 실무 역량으로 자립하고 사회에 기여하여 타의 모범이 되는 <span className={dmc.boldText}>‘성실’한 직업인</span>을 <span className={dmc.boldText}>양성</span>하기 위해
                성실한(integrity)한 인재상인 <span className={dmc.boldText}>협업(Collaboration), 창의(Creativity), 신뢰(Confidence), 도전(Challenge)</span>을 반영한 우수학생 인증 제도</p>
            </div>
            <div className={dmc.textArea}>
              <p className={dmc.titleText}>YUHAN TRUST 교육 인증은 역량 성취도와 대학의 인재상을 반영한 5대 역량으로 구성</p>
              <p><span className={dmc.boldText}>핵심(교과) 과정:</span> 입학부터 졸업까지 모든 학생들에게 공통으로 제공되는 정규 및 비교과 프로그램 등 EX) 전공, 교양, 출석률</p>
              <p><span className={dmc.boldText}>심화(비교과) 과정:</span> 학생들의 역량 향상을 위하여 우수학습자 또는 부진 학습자를 위한 별도 프로그램 제공을 통해 학생들이 선택적으로 받는 정규 및 비교과 프로그램 등 EX) 상담 프로그램</p>
            </div>
            <div className={dmc.textArea}>
              <p className={dmc.titleText}>YUHAN TRUST 제도 등급</p>
              <p>핵심 및 심화과정 프로그램 평가 및 참여를 점수화하여 등급제에 적용</p>
              <table className={dmc.table}>
                <tbody>
                  <tr>
                    <td className={dmc.headerCell}>등급</td>
                    <td className={dmc.contentCell}>
                      <div className={dmc.tierItem}>
                        <img src="/tier1.png"/>
                        <div>Bronz</div>
                      </div>
                    </td>
                    <td className={dmc.contentCell}>
                      <div className={dmc.tierItem}>
                        <img src="/tier2.png"/>
                        <div>Silver</div>
                      </div>
                    </td>
                    <td className={dmc.contentCell}>
                      <div className={dmc.tierItem}>
                        <img src="/tier3.png"/>
                        <div>Gold</div>
                      </div>
                    </td>
                    <td className={dmc.contentCell}>
                      <div className={dmc.tierItem}>
                        <img src="/tier4.png"/>
                        <div>Diamond</div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className={dmc.headerCell2}>부여된 등급기준</td>
                    <td className={dmc.contentCell2}>
                      <p>모든 역량</p>
                      <p>최소 인증지수 70점 이상</p>
                    </td>
                    <td className={dmc.contentCell2}>상위 30% 이내</td>
                    <td className={dmc.contentCell2}>상위 10% 이내</td>
                    <td className={dmc.contentCell2}>상위 5% 이내</td>
                  </tr>
                </tbody>
              </table>
              <p>등급제를 통해 졸업학년 마지막 학기 재학생을 대상으로 인증예정증명서를 수여하며, 우수한 학생에게는 소정의 시상품과 해외 연수 및 우수 기업 취업 지원합니다.</p>
            </div>
          </div>
        )}
        {activeMenuKey === "trust" && (
          <Detail2 />
        )}
      </div>
      <Footer />
    </div>
  );

}
export default Detail;