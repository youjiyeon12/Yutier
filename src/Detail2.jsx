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

          <p style={{ fontSize: '16px' }}> 
            <span onClick={() => navigate('/detail')} className={dmc.btn1}
            style={location.pathname === '/detail' ? {} : { background: '#fff', color: '#393F59'}}>
            교육 인증 제도 안내</span></p>

          <p style={{ fontSize: '16px' }}>
          <span onClick={() => navigate('/detail2')} className={dmc.btn1} 
            style={location.pathname === '/detail2'? {} : { background: '#fff', color: '#393F59' }}>
            TRUST 역량 안내</span></p>


          </div>
      
        <div className={dmc.body}>

          <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -20, marginTop: 0 }}>•유한인성역량(Trustworthy)</p>
          <p>설립자 유일한 박사의 정신을 계승하여 성실하며 사회에 봉사하고 책임질 줄 아는 태도를 함양하고자 하는 유한대학교 고유의 기본 역량</p>


            <table className={dmc.table1}><thead>
        <tr>
            <th className={dmc.colA}>핵심역량</th>
            <th className={dmc.colB}>하위역량명</th>
            <th className={dmc.colC}>하위역량의 정의</th>
        </tr></thead>
        <tbody>
        <tr>
            <td className={dmc.colA} rowspan="4">유한인성역량(T1)</td>
            <td className={dmc.colB}>창의역량</td>
            <td className={dmc.colC}>
                <div>창의적 사고와 태도 간의 상호작용을 통해서 새롭고 가치 있으며 유용한 아이디어나 산출물을 생산해 내는 역량
                      <br /><br />
                      <div>역량 요소 : 확산적사고능력, 수렴적사고능력, 창의적태도, 창의적문제해결</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>협업역량</td>
              <td className={dmc.colC}>
                <div>타인과 적극적으로 소통하고 상대방을 배려, 존중하는 윤리적인 태도로 효과적인 협력 관계를 유지하는 역량
                  <br /><br />
                      <div>역량 요소 : 팀워크, 협력적 소통, 조직이해</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>신뢰역량</td>
              <td className={dmc.colC}>
                <div>모든 직업인들이 조직 안에서 공통적으로 지켜야 할 규범으로 조직 내에서 업무를 수행함에 있어 사회적으로 기대되는 태도, 매너, 올바른 직업관 등의 내‧외적인 행위 준거를 이해하며 실천하는 역량
                      <br /><br />
                      <div>역량 요소 : 책임감, 윤리의식</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>도전역량</td>
              <td className={dmc.colC}>
                <div>직업인으로서 자신의 경력단계에 대한 이해를 바탕으로 적절한 경력개발 계획을 수립하고 자신의 삶과 진로에 필요한 기초 능력과 자질을 지속적으로 계발, 관리하여 변화하는 사회에 유연하게 적응할 수 있는 역량
                     <br /><br />
                      <div>역량 요소 : 자기인식, 자기평가, 자기개발, 건강관리</div>
                </div>
            </td>
        </tr>
        </tbody>
        </table>

        <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -20, marginTop: 20 }}>•기초학습역량(Ready)</p>
        <p>교육과정 이수에 필요한 기본적인 언어능력, 수리능력, 사고력을 통하여 기초적 학습 능력을 종합한 역량</p>

         {/*22*/}
        <table className={dmc.table2}><thead>
        <tr>
            <th className={dmc.colA}>핵심역량</th>
            <th className={dmc.colB}>하위역량명</th>
            <th className={dmc.colC}>하위역량의 정의</th>
        </tr></thead>
        <tbody>
        <tr>
            <td className={dmc.colA} rowspan="3">기초학습역량(R)</td>
            <td className={dmc.colB}>언어역량</td>
            <td className={dmc.colC}>
                <div>전공에 관계없이 대학에서의 학업 수행과정에서 말을 읽고 들음으로써 교수자의 뜻한 바를 파악하고, 학습자가 뜻한 바를 글과 말을 통해서 정확하게 쓰거나 말하는데 필요한 기본적이고 기초적인 언어 영역 중 국어와 영어에 대한 역량
                      <br /><br />
                      <div>역량 요소 : 읽기/듣기, 쓰기, 말하기, 기초외국어</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>수리역량</td>
              <td className={dmc.colC}>
                <div>전공에 관계없이 대학에서의 학업을 수행하는데 필요한 기본적이고 기초적인 수리 영역 학습에 필요한 역량
                  <br /><br />
                      <div>역량 요소 : 기초계산력, 공간지각력, 확률 통계 자료해석</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>사고역량</td>
              <td className={dmc.colC}>
                <div>학습에 대한 흥미 및 동기가 있고, 적극적으로 질문에 대답하며 수업에 참여하고, 학업성취도를 높이는 역량
                      <br /><br />
                      <div>역량 요소 : 기본적사고, 전략적사고, 창의적사고</div>
                </div>
            </td>
        </tr>
        </tbody>
        </table>

        <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -20, marginTop: 20}}>•직업기초역량(Useful)</p>
        <p>모든 직업 분야에서 성공적인 직무수행을 위해 갖추어야 할 기초 교양으로서 공통적으로 요구되는 역량</p>

       {/*33*/}
        <table className={dmc.table3}><thead>
        <tr>
            <th className={dmc.colA}>핵심역량</th>
            <th className={dmc.colB}>하위역량명</th>
            <th className={dmc.colC}>하위역량의 정의</th>
        </tr></thead>
        <tbody>
        <tr>
            <td className={dmc.colA} rowspan="7">유한인성역량(T1)</td>
            <td className={dmc.colB}>의사소통</td>
            <td className={dmc.colC}>
                <div>상대방의 글과 말의 의미를 정확하게 파악하고 적절하게 대응하며 자신의 의견과 정보를 효과적으로 전달하는 역량
                      <br /><br />
                      <div>역량 요소 : 경청, 공감, 의사전달</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>대인관계</td>
              <td className={dmc.colC}>
                <div>구성원 간의 다양한 견해와 입장을 이해하고 구성원들 간의 관계를 긍정적으로 형성하며 갈등이 발생했을 경우 원만히 조절하는 역량
                  <br /><br />
                      <div>역량 요소 : 갈등관리, 리더십, 배려</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>감성지능</td>
              <td className={dmc.colC}>
                <div>모든 직업인들이 조직 안에서 공통적으로 지켜야 할 규범으로 조직 내에서 업무를 수행함에 있어 사회적으로 기대되는 태도, 매너, 올바른 직업관 등의 내‧외적인 행위 준거를 이해하며 실천하는 역량
                      <br /><br />
                      <div>요소 : 감성이해, 감성조절, 감성활용</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>복합적 문제해결</td>
              <td className={dmc.colC}>
                <div>업무수행 중 문제 상황이 발생하였을 경우, 객관적인 자료를 근거로 창조적이고 논리적인 사고를 통하여 문제의 원인을 올바르게 인식하고 적절히 해결할 수 있는 대안을 도출하고 처리하는 역량
                     <br /><br />
                      <div>역량 요소 : 문제인식, 대안도출, 문제처리능력</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>자원관리</td>
              <td className={dmc.colC}>
                <div>업무 수행에 있어서 시간, 재무자원, 물적자원, 인적자원 등의 자원 가운데 무엇이 얼마나 필요한지를 확인하고, 이용 가능한 자원을 최대한 수집하여 실제 업무에 어떻게 활용할 것인지를 계획하고, 계획대로 업무수행에 이를 할당하는 역량
                  <br /><br />
                      <div>역량 요소 : 인적자원관리, 물적자원관리, 재무자원관리, 시간관리</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>지식정보 활용</td>
              <td className={dmc.colC}>
                <div>직장생활에서 합리적인 문제해결 방안의 탐색, 해결 방안의 실행 및 평가, 매체 활용 등을 위해 다양한 분야의 정보를 수집하고 분석하여 활용할 수 있는 역량
                  <br /><br />
                      <div>역량 요소 : 디지털문해력, 기술적능력, 수리능력</div>
                </div>
            </td>
        </tr>
        <tr>
            <td className={dmc.colB}>글로벌</td>
              <td className={dmc.colC}>
                <div>세계화의 흐름을 수용하고, 국제적인 식견과 능력을 기르고, 문화적 다양성과 글로벌 환경을 인식하여 유연하게 대응하며, 외국어로 기초적인 의사를 표현할 수 있는 역량
                  <br /><br />
                      <div>역량 요소 : 글로벌마인드, 다문화공감, 외국어활용</div>
                </div>
            </td>
        </tr>
        
        </tbody>
        </table>

        <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -20, marginTop: 20}}>•직무수행역량(Specialized)</p>
        <p>학교 수업 및 역량 개발 활동을 통해 습득한 지식, 기술 등을 통하여 현장실무에서 적용 및 활용할 수 있는 역량을 말한다. 단, 직무수행 역량 중 IT 역량이란 컴퓨터로 처리할 수 있는 문제와 해결책을 표현하고 사고하는 컴퓨팅 사고 역량 증진을 위해 요구되는 역량</p>
        <p style={{ fontFamily: 'Pretendard-SemiBold', fontSize:'18px', fontWeight:600, marginBottom: -20, marginTop: 10 }}>•취·창업기초역량(Tested)</p>
        <p>취·창업 마인드 제고와 취·창업역량 강화 및 취업 또는 창업을 위해 요구되는 기본적인 역량</p>


        </div>

 </div>
      </main>
      <Footer/>
    </div>
  );
  
  
}
export default Detail;