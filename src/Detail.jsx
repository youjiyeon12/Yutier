// trust 설명 페이지
//import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';
import dmc from './detail.module.css';

function Detail({ user, onLogout }) {
  const navigate = useNavigate();

  return (
     <div className={dmc.container}> 
      <Header user={user} onLogout={onLogout} />
      
      <main className={dmc.content}> 
      <div>

       <div className={dmc.menu}>


      <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize: '24px', fontWeight: 600 }}>YUHAN TRUST</p>

      <p style={{ fontSize: '16px' }}><span onClick={() => navigate('/detail')}
          className={dmc.btn1}
          style={location.pathname === '/detail' ? {} : { background: '#fff', color: '#393F59' }}>
          교육 인증 제도 안내</span></p>

      <p style={{ fontSize: '16px' }}><span onClick={() => navigate('/detail2')} className={dmc.btn1}
          style={location.pathname === '/detail2' ? {} : { background: '#fff', color: '#393F59' }}>
          TRUST 역량 안내</span></p>
    
    </div>
      
        <div className={dmc.body}>
        <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -18, marginTop: 0 }}>YUHAN TRUST 교육 인증 제도</p>
        <p style={{fontSize:'14px', fontWeight:400}}>사회에 봉사하고 책임을 질 줄 아는 인간교육의 바탕 위에 지식사회에 필요한 전문 지식과 실무 역량으로 자립하고 사회에 기여하여 타의 모범이 되는 ‘성실’한 직업인을 양성하기 위해
        <br />성실한(integrity)한 인재상인 <span style={{ fontFamily: 'Pretendard-SemiBold' }}>협업(Collaboration), 창의(Creativity), 신뢰(Confidence), 도전(Challenge)</span>을 반영한 우수학생 인증 제도</p>

        <p style={{ fontFamily: 'Pretendard-SemiBold',fontSize:'16px', fontWeight:600, marginBottom: -18}}>YUHAN TRUST 교육 인증은 역량 성취도와 대학의 인재상을 반영한 5대 역량으로 구성</p>
        <p style={{fontSize:'14px', fontWeight:400, marginBottom: -10}}>핵심(교과) 과정: 입학부터 졸업까지 모든 학생들에게 공통으로 제공되는 정규 및 비교과 프로그램 등 EX) 전공, 교양, 출석률</p>
        <p style={{fontSize:'14px', fontWeight:400}}>심화(비교과) 과정: 학생들의 역량 향상을 위하여 우수학습자 또는 부진 학습자를 위한 별도 프로그램 제공을 통해 학생들이 선택적으로 받는 정규 및 비교과 프로그램 등 EX) 상담 프로그램</p>

         <p style={{ fontFamily: 'Pretendard-SemiBold',fontSize:'16xp', fontWeight:600, marginBottom: -18}}>YUHAN TRUST 제도 등급</p>
         <p style={{fontSize:'14px', fontWeight:400, marginBottom: -18}}>핵심 및 심화과정 프로그램 평가 및 참여를 점수화하여 등급제에 적용</p>
        
       
       <div className={dmc.table}>
         <table>
          <tbody>
              <tr>
                <td bgcolor='#e6e6e6'>등급</td>

                  <td>
                    <div style={{ textAlign: 'center' }}>
                      <img src="/tier1.svg" alt="tier" />
                      <div>Bronz</div>
                    </div>
                  </td>
                 
                <td>
                    <div style={{ textAlign: 'center' }}>
                      <img src="/tier2.svg" alt="tier" />
                      <div>Silver</div>
                    </div>
                  </td>

                <td>
                   <div style={{ textAlign: 'center' }}>
                      <img src="/tier3.svg" alt="tier" />
                      <div>Gold</div>
                    </div>
                  </td>

               <td>
                    <div style={{ textAlign: 'center' }}>
                      <img src="/tier4.svg" alt="tier" />
                      <div>Diamond</div>
                    </div>
                </td>

              </tr>
              
              <tr>
                <th bgcolor='#e6e6e6'>부여된 등급기준</th>
               <th>
                   <div style={{ textAlign: 'center' }}>
                      모든 역량
                      <div>최소 인증지수 70점 이상</div>
                    </div>
               </th>
                <th>상위 30% 이내</th>
                <th>상위 10% 이내</th>
                <th>상위 5% 이내</th>
              </tr>
        </tbody>
      </table>
      </div>


        <p style={{fontSize:'14px', fontWeight:400}}>등급제를 통해 졸업학년 마지막 학기 재학생을 대상으로 인증예정증명서를 수여하며, 우수한 학생에게는 소정의 시상품과 해외 연수 및 우수 기업 취업 지원합니다.</p>

        </div>

 </div>
      </main>
      <Footer/>
    </div>
  );
  
}
export default Detail;