const { db } = require("./db");
const { historyEvents } = require("./db/schema");

const EVENTS = [
  // ============================================================
  // === 고대 (BC 3500 ~ 500 CE) ===
  // ============================================================
  { title: "수메르 문명 발생", description: "메소포타미아 남부에서 인류 최초의 도시 문명이 탄생. 쐐기문자, 수레바퀴, 관개농업을 발명하고 우르, 우루크 등 도시국가를 건설.", year: -3500, category: "culture", region: "중동", country: "이라크", latitude: 30.9626, longitude: 46.1052, importance: 5 },
  { title: "이집트 대피라미드 건설", description: "파라오 쿠푸의 명으로 기자에 대피라미드 건설. 고대 세계 7대 불가사의 중 유일하게 현존하는 건축물.", year: -2560, category: "culture", region: "중동", country: "이집트", latitude: 29.9792, longitude: 31.1342, importance: 5 },
  { title: "함무라비 법전 제정", description: "바빌로니아의 함무라비 왕이 세계 최초의 성문법전을 반포. '눈에는 눈, 이에는 이'의 동해보복법 원칙 포함.", year: -1754, category: "law", region: "중동", country: "이라크", latitude: 32.5421, longitude: 44.4209, importance: 5 },
  { title: "모세의 출애굽", description: "모세가 이스라엘 민족을 이끌고 이집트의 노예 상태에서 탈출. 시나이산에서 십계명을 받아 유대교의 율법 체계 확립.", year: -1250, category: "culture", region: "중동", country: "이집트", latitude: 28.5392, longitude: 33.9756, importance: 5 },
  { title: "트로이 전쟁", description: "그리스 연합군이 소아시아의 트로이를 공격한 전설적 전쟁. 호메로스의 일리아스와 오디세이아의 배경.", year: -1200, category: "war", region: "유럽", country: "터키", latitude: 39.9574, longitude: 26.2389, importance: 4 },
  { title: "그리스 민주주의 시작", description: "아테네의 클레이스테네스가 개혁을 통해 시민이 직접 정치에 참여하는 민주주의 체제를 수립.", year: -508, category: "politics", region: "유럽", country: "그리스", latitude: 37.9715, longitude: 23.7267, importance: 5 },
  { title: "공자 사상 체계 확립", description: "춘추시대 공자가 인(仁)과 예(禮)를 중심으로 한 유교 사상을 체계화. 동아시아 문명의 사상적 기반을 형성.", year: -500, category: "culture", region: "동아시아", country: "중국", latitude: 35.6010, longitude: 116.9855, importance: 5 },
  { title: "페르시아 전쟁 발발", description: "페르시아 제국이 그리스를 침공. 마라톤 전투에서 아테네가 페르시아 대군을 격파하여 그리스 문명을 수호.", year: -490, category: "war", region: "유럽", country: "그리스", latitude: 38.1144, longitude: 23.9744, importance: 4 },
  { title: "석가모니 열반", description: "고타마 싯다르타(석가모니)가 쿠시나가르에서 열반에 듦. 불교의 가르침이 아시아 전역으로 전파되는 기원.", year: -483, category: "culture", region: "남아시아", country: "인도", latitude: 26.7409, longitude: 83.8893, importance: 5 },
  { title: "로마 12표법 제정", description: "로마 공화정 시대 최초의 성문법. 평민과 귀족 간 법적 평등의 기초.", year: -449, category: "law", region: "유럽", country: "이탈리아", latitude: 41.9028, longitude: 12.4964, importance: 5 },
  { title: "펠로폰네소스 전쟁 발발", description: "아테네와 스파르타를 중심으로 한 그리스 도시국가 간 27년 전쟁. 그리스 문명 쇠퇴의 결정적 계기.", year: -431, category: "war", region: "유럽", country: "그리스", latitude: 37.0755, longitude: 22.4303, importance: 4 },
  { title: "알렉산드로스 대왕 동방원정", description: "마케도니아의 알렉산드로스가 페르시아 제국을 정복하고 헬레니즘 문화를 전파.", year: -334, category: "war", region: "유럽", country: "그리스", latitude: 40.6401, longitude: 22.9444, importance: 5 },
  { title: "진시황 중국 통일", description: "진나라 시황제가 전국 7국을 통일하고 만리장성 건설, 도량형 통일, 문자 통일 단행.", year: -221, category: "politics", region: "동아시아", country: "중국", latitude: 34.2658, longitude: 108.9541, importance: 5 },
  { title: "한니발의 알프스 횡단", description: "카르타고의 한니발 장군이 코끼리를 이끌고 알프스를 넘어 로마를 공격.", year: -218, category: "war", region: "유럽", country: "이탈리아", latitude: 45.8326, longitude: 6.8652, importance: 4 },
  { title: "한(漢) 왕조 전성기", description: "한 무제 시기 유교 국교화, 비단길 개척, 영토 확장으로 동아시아 문명의 기틀 마련. 중국인을 '한족'이라 부르는 기원.", year: -100, category: "politics", region: "동아시아", country: "중국", latitude: 34.2658, longitude: 108.9541, importance: 4 },
  { title: "카이사르 암살", description: "로마 공화정의 종신독재관 율리우스 카이사르가 원로원 의원들에 의해 암살. 로마 공화정의 사실상 종말.", year: -44, month: 3, day: 15, category: "politics", region: "유럽", country: "이탈리아", latitude: 41.8955, longitude: 12.4823, importance: 5 },
  { title: "예수 그리스도 탄생", description: "유대 베들레헴에서 예수 그리스도 탄생. 기독교의 시작이자 서양 문명의 근본적 전환점.", year: -4, category: "culture", region: "중동", country: "이스라엘", latitude: 31.7054, longitude: 35.2024, importance: 5 },
  { title: "삼국시대 시작", description: "신라(BC 57), 고구려(BC 37), 백제(BC 18)가 차례로 건국되어 한반도 삼국시대가 시작.", year: 57, category: "politics", region: "동아시아", country: "한국", latitude: 35.8562, longitude: 129.2247, importance: 4 },
  { title: "로마 기독교 공인 (밀라노 칙령)", description: "콘스탄티누스 대제가 밀라노 칙령으로 기독교를 공인. 기독교가 로마 제국의 국교로 성장하는 결정적 전환점.", year: 313, category: "culture", region: "유럽", country: "이탈리아", latitude: 45.4642, longitude: 9.1900, importance: 5 },
  { title: "로마 제국 동서 분열", description: "테오도시우스 1세 사후 로마 제국이 서로마와 동로마(비잔티움)로 영구 분열.", year: 395, category: "politics", region: "유럽", country: "이탈리아", latitude: 41.9028, longitude: 12.4964, importance: 4 },
  { title: "로마 제국 멸망 (서로마)", description: "게르만 용병대장 오도아케르가 서로마 제국의 마지막 황제 로물루스를 폐위.", year: 476, category: "politics", region: "유럽", country: "이탈리아", latitude: 41.9028, longitude: 12.4964, importance: 5 },

  // ============================================================
  // === 중세 (500 ~ 1500) ===
  // ============================================================
  { title: "당나라 건국", description: "이연이 수나라를 멸하고 당나라를 건국. 이후 태종 이세민의 정관의 치, 현종의 개원의 치로 동아시아 문명의 황금기.", year: 618, category: "politics", region: "동아시아", country: "중국", latitude: 34.2658, longitude: 108.9541, importance: 5 },
  { title: "이슬람교 창시 (헤지라)", description: "무함마드가 메카에서 메디나로 이주(헤지라). 이슬람 역법의 기원이자 이슬람 공동체(움마) 형성의 시작.", year: 622, category: "culture", region: "중동", country: "사우디아라비아", latitude: 24.4672, longitude: 39.6112, importance: 5 },
  { title: "신라 삼국통일", description: "신라가 당나라와 연합하여 백제(660)와 고구려(668)를 멸망시킨 뒤, 당의 세력을 축출하고 한반도 통일 달성.", year: 676, category: "war", region: "동아시아", country: "한국", latitude: 35.8562, longitude: 129.2247, importance: 5 },
  { title: "바이킹 시대 개막", description: "노르드인(바이킹)이 영국 린디스판 수도원을 약탈. 이후 300년간 유럽 전역을 항해·정복·교역하며 영향력 행사.", year: 793, category: "war", region: "유럽", country: "영국", latitude: 55.6690, longitude: -1.8010, importance: 3 },
  { title: "카롤루스 대제 대관", description: "프랑크 왕국의 카를 대제가 교황 레오 3세로부터 로마 황제 관을 수여받아 서유럽 통일 제국 건설.", year: 800, month: 12, day: 25, category: "politics", region: "유럽", country: "프랑스", latitude: 50.7753, longitude: 6.0839, importance: 4 },
  { title: "고려 건국", description: "왕건이 후삼국을 통일하고 고려를 건국. 불교 문화의 융성, 고려청자, 팔만대장경 등 찬란한 문화 유산.", year: 918, category: "politics", region: "동아시아", country: "한국", latitude: 37.9714, longitude: 126.5556, importance: 4 },
  { title: "송나라와 화약·나침반 발명", description: "중국 송나라에서 화약 무기, 나침반, 인쇄술이 실용화. 이 3대 발명이 이후 세계사의 흐름을 바꿈.", year: 1000, category: "science", region: "동아시아", country: "중국", latitude: 30.2741, longitude: 120.1551, importance: 4 },
  { title: "제1차 십자군 전쟁", description: "교황 우르바누스 2세의 호소로 유럽 기독교 세력이 예루살렘 탈환을 위해 원정. 예루살렘 왕국 수립.", year: 1096, category: "war", region: "중동", country: "이스라엘", latitude: 31.7683, longitude: 35.2137, importance: 4 },
  { title: "마그나 카르타 서명", description: "영국 존 왕이 귀족들의 압력으로 대헌장에 서명. 왕도 법 아래에 있다는 법의 지배 원칙 확립.", year: 1215, month: 6, day: 15, category: "law", region: "유럽", country: "영국", latitude: 51.4414, longitude: -0.5615, importance: 5 },
  { title: "몽골 제국 최대 판도", description: "칭기즈칸과 후계자들이 동유럽부터 동아시아까지 역사상 최대의 연속 영토 제국 건설.", year: 1279, category: "war", region: "중앙아시아", country: "몽골", latitude: 47.9213, longitude: 106.9057, importance: 5 },
  { title: "흑사병 유럽 대유행", description: "유럽 인구의 1/3이 사망한 대역병. 봉건제 붕괴와 노동력 부족으로 사회 구조 변혁.", year: 1347, category: "society", region: "유럽", country: "이탈리아", latitude: 43.7696, longitude: 11.2558, importance: 5 },
  { title: "조선 건국", description: "이성계가 고려를 멸하고 조선을 건국. 유교적 통치이념과 법치주의(경국대전) 수립.", year: 1392, category: "politics", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 5 },
  { title: "잉카 제국 전성기", description: "파차쿠티가 잉카 제국을 대대적으로 확장. 안데스 산맥을 따라 남미 서부 전역을 지배하는 대제국 건설.", year: 1438, category: "politics", region: "중남미", country: "페루", latitude: -13.5320, longitude: -71.9675, importance: 3 },
  { title: "구텐베르크 인쇄술 발명", description: "요하네스 구텐베르크가 활판인쇄술을 발명. 지식의 대중화와 종교개혁의 기폭제.", year: 1440, category: "science", region: "유럽", country: "독일", latitude: 49.9929, longitude: 8.2473, importance: 5 },
  { title: "백년전쟁 종결", description: "잔 다르크의 활약으로 프랑스가 영국에 최종 승리. 116년간 이어진 전쟁 종결과 프랑스 민족의식 각성.", year: 1453, category: "war", region: "유럽", country: "프랑스", latitude: 47.3220, longitude: -0.6828, importance: 4 },
  { title: "오스만 제국 콘스탄티노플 정복", description: "메흐메트 2세가 비잔티움 제국의 수도 콘스탄티노플을 함락. 동로마 제국의 종말과 이스탄불 시대의 개막.", year: 1453, month: 5, day: 29, category: "war", region: "중동", country: "터키", latitude: 41.0082, longitude: 28.9784, importance: 5 },
  { title: "장미전쟁 발발", description: "잉글랜드의 랭커스터 가문과 요크 가문 간의 왕위 계승 전쟁. 튜더 왕조 성립의 배경.", year: 1455, category: "war", region: "유럽", country: "영국", latitude: 51.5074, longitude: -0.1278, importance: 3 },

  // ============================================================
  // === 근세 (1500 ~ 1800) ===
  // ============================================================
  { title: "콜럼버스 신대륙 발견", description: "크리스토퍼 콜럼버스가 스페인 왕실의 후원으로 대서양을 횡단해 아메리카 대륙에 도달.", year: 1492, month: 10, day: 12, category: "diplomacy", region: "중남미", country: "바하마", latitude: 24.2485, longitude: -76.7961, importance: 5 },
  { title: "마르틴 루터 종교개혁", description: "마르틴 루터가 비텐베르크 성당 문에 95개조 반박문을 게시. 가톨릭 교회의 면죄부 판매에 항의하며 프로테스탄트 운동 시작.", year: 1517, month: 10, day: 31, category: "culture", region: "유럽", country: "독일", latitude: 51.8661, longitude: 12.6494, importance: 5 },
  { title: "스페인 무적함대 격파", description: "영국 해군이 스페인의 무적함대(아르마다)를 격파. 해양 패권이 스페인에서 영국으로 이동하는 전환점.", year: 1588, category: "war", region: "유럽", country: "영국", latitude: 50.3755, longitude: -4.1427, importance: 4 },
  { title: "임진왜란 발발", description: "일본 도요토미 히데요시가 조선을 침략. 이순신 장군의 해전 승리와 의병 활동으로 격퇴.", year: 1592, category: "war", region: "동아시아", country: "한국", latitude: 35.1796, longitude: 129.0756, importance: 5 },
  { title: "무굴 제국 전성기", description: "악바르 대제 시기 무굴 제국이 인도 아대륙 대부분을 지배. 종교적 관용 정책과 찬란한 건축문화(타지마할).", year: 1600, category: "politics", region: "남아시아", country: "인도", latitude: 27.1767, longitude: 78.0081, importance: 4 },
  { title: "청나라 건국", description: "만주족이 명나라를 멸망시키고 중국 전토를 장악. 약 270년간 중국 최후의 왕조를 통치.", year: 1644, category: "politics", region: "동아시아", country: "중국", latitude: 39.9042, longitude: 116.4074, importance: 4 },
  { title: "웨스트팔리아 조약", description: "30년 전쟁을 종결한 조약. 근대 국제법과 주권국가 체제의 기원.", year: 1648, category: "diplomacy", region: "유럽", country: "독일", latitude: 52.0, longitude: 8.05, importance: 5 },
  { title: "영국 명예혁명", description: "의회가 제임스 2세를 폐위하고 윌리엄 3세와 메리 2세를 공동 왕으로 추대. 권리장전으로 입헌군주제 확립.", year: 1688, category: "politics", region: "유럽", country: "영국", latitude: 51.5074, longitude: -0.1278, importance: 5 },
  { title: "뉴턴 프린키피아 출판", description: "아이작 뉴턴이 만유인력의 법칙과 운동법칙을 담은 '자연철학의 수학적 원리' 출판.", year: 1687, category: "science", region: "유럽", country: "영국", latitude: 52.2053, longitude: 0.1218, importance: 5 },
  { title: "미국 독립선언", description: "13개 식민지가 영국으로부터의 독립을 선언. 천부인권과 인민주권의 원칙 천명.", year: 1776, month: 7, day: 4, category: "politics", region: "북미", country: "미국", latitude: 39.9526, longitude: -75.1652, importance: 5 },
  { title: "프랑스 대혁명", description: "바스티유 감옥 습격으로 시작된 혁명. '자유, 평등, 박애'의 이념과 인권선언 발표.", year: 1789, month: 7, day: 14, category: "politics", region: "유럽", country: "프랑스", latitude: 48.8532, longitude: 2.3693, importance: 5 },

  // ============================================================
  // === 근대 (1800 ~ 1945) ===
  // ============================================================
  { title: "아이티 독립", description: "아이티가 프랑스로부터 독립을 선언. 세계 최초의 성공적인 흑인 노예 혁명이자 중남미 최초의 독립국.", year: 1804, month: 1, day: 1, category: "politics", region: "중남미", country: "아이티", latitude: 18.5944, longitude: -72.3074, importance: 4 },
  { title: "나폴레옹 법전 공포", description: "나폴레옹이 제정한 근대 민법전. 소유권 절대, 계약자유, 과실책임 원칙 확립. 전세계 민법의 모범.", year: 1804, category: "law", region: "유럽", country: "프랑스", latitude: 48.8566, longitude: 2.3522, importance: 5 },
  { title: "산업혁명 절정기", description: "증기기관 발전으로 영국에서 시작된 산업혁명이 유럽 전역으로 확산. 공장제 생산과 도시화 가속.", year: 1830, category: "economy", region: "유럽", country: "영국", latitude: 53.4808, longitude: -2.2426, importance: 5 },
  { title: "아편전쟁", description: "영국이 아편 무역 문제로 청나라를 공격. 난징조약으로 홍콩 할양, 동아시아에 서구 제국주의 침투의 시작.", year: 1840, category: "war", region: "동아시아", country: "중국", latitude: 23.1291, longitude: 113.2644, importance: 4 },
  { title: "미국 남북전쟁 발발", description: "노예제를 둘러싼 북부와 남부의 갈등이 전쟁으로 폭발. 4년간 약 62만 명 사망, 미국 역사상 가장 많은 전사자.", year: 1861, month: 4, day: 12, endYear: 1865, category: "war", region: "북미", country: "미국", latitude: 32.7521, longitude: -79.8604, importance: 5 },
  { title: "노예해방선언", description: "에이브러햄 링컨 대통령이 남부 연합 소속 주의 노예 해방을 선언. 미국 내 노예제 폐지의 결정적 계기.", year: 1863, month: 1, day: 1, category: "law", region: "북미", country: "미국", latitude: 38.8977, longitude: -77.0365, importance: 5 },
  { title: "메이지 유신", description: "일본 에도 막부 체제가 붕괴하고 천황 중심의 근대화 개혁 단행. 서구식 법제도 도입.", year: 1868, category: "politics", region: "동아시아", country: "일본", latitude: 35.6762, longitude: 139.6503, importance: 4 },
  { title: "수에즈 운하 개통", description: "지중해와 홍해를 연결하는 수에즈 운하 개통. 유럽과 아시아 간 해상 교통 혁명, 세계 무역의 판도 변화.", year: 1869, month: 11, day: 17, category: "economy", region: "중동", country: "이집트", latitude: 30.4574, longitude: 32.3498, importance: 4 },
  { title: "독일 통일", description: "프로이센의 비스마르크가 보불전쟁 승리 후 베르사유 궁전에서 독일 제국의 통일을 선포. 유럽 세력균형 재편.", year: 1871, month: 1, day: 18, category: "politics", region: "유럽", country: "독일", latitude: 52.5200, longitude: 13.4050, importance: 4 },
  { title: "대한제국 수립", description: "고종이 대한제국을 선포하고 황제에 즉위. 근대적 법령 정비 시도.", year: 1897, month: 10, day: 12, category: "politics", region: "동아시아", country: "한국", latitude: 37.5759, longitude: 126.9769, importance: 4 },
  { title: "라이트 형제 최초 동력 비행", description: "윌버와 오빌 라이트 형제가 키티호크에서 인류 최초의 동력 비행에 성공. 항공 시대의 개막.", year: 1903, month: 12, day: 17, category: "science", region: "북미", country: "미국", latitude: 36.0176, longitude: -75.6674, importance: 5 },
  { title: "을사늑약 체결", description: "일본이 대한제국의 외교권을 박탈한 을사조약 강제 체결. 대한제국의 실질적 국권 상실.", year: 1905, month: 11, day: 17, category: "diplomacy", region: "동아시아", country: "한국", latitude: 37.5759, longitude: 126.9769, importance: 5 },
  { title: "한일합방 (경술국치)", description: "일본이 대한제국을 강제 병합. 36년간 일제 식민통치의 시작.", year: 1910, month: 8, day: 29, category: "politics", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 5 },
  { title: "제1차 세계대전 발발", description: "오스트리아-헝가리 황태자 암살을 계기로 유럽 열강이 참전. 4년간 1천만 명 이상 사망.", year: 1914, month: 7, day: 28, endYear: 1918, category: "war", region: "유럽", country: "프랑스", latitude: 49.2833, longitude: 2.5, importance: 5 },
  { title: "러시아 혁명", description: "볼셰비키 혁명으로 차르 체제 붕괴. 세계 최초의 사회주의 국가 소련 수립.", year: 1917, month: 10, day: 25, category: "politics", region: "유럽", country: "러시아", latitude: 59.9311, longitude: 30.3609, importance: 5 },
  { title: "3·1 운동", description: "일제 강점기 한국에서 발생한 최대 규모의 독립운동. 대한민국 임시정부 수립의 계기.", year: 1919, month: 3, day: 1, category: "politics", region: "동아시아", country: "한국", latitude: 37.5713, longitude: 126.9760, importance: 5 },
  { title: "대공황 발생", description: "뉴욕 증권거래소 주가 대폭락(검은 목요일)으로 촉발된 세계적 경제 위기. 대량 실업과 세계 무역 급감.", year: 1929, month: 10, day: 24, category: "economy", region: "북미", country: "미국", latitude: 40.7069, longitude: -74.0089, importance: 5 },
  { title: "히틀러 집권", description: "아돌프 히틀러가 독일 총리에 취임. 나치 독재 체제를 구축하고 유대인 박해와 군비 확장에 착수.", year: 1933, month: 1, day: 30, category: "politics", region: "유럽", country: "독일", latitude: 52.5163, longitude: 13.3777, importance: 5 },
  { title: "난징대학살", description: "중일전쟁 중 일본군이 중국 난징을 점령하고 민간인과 포로 수십만 명을 학살. 전쟁 범죄의 상징.", year: 1937, month: 12, day: 13, category: "war", region: "동아시아", country: "중국", latitude: 32.0603, longitude: 118.7969, importance: 5 },
  { title: "제2차 세계대전 발발", description: "나치 독일의 폴란드 침공으로 시작. 6년간 약 7천만 명 사망, 홀로코스트.", year: 1939, month: 9, day: 1, endYear: 1945, category: "war", region: "유럽", country: "폴란드", latitude: 52.2297, longitude: 21.0122, importance: 5 },
  { title: "노르망디 상륙작전 (D-Day)", description: "연합군이 프랑스 노르망디 해안에 대규모 상륙작전 감행. 서부전선 개시와 나치 독일 패망의 전환점.", year: 1944, month: 6, day: 6, category: "war", region: "유럽", country: "프랑스", latitude: 49.3640, longitude: -0.8760, importance: 5 },
  { title: "히로시마 원자폭탄 투하", description: "미국이 일본 히로시마에 세계 최초의 원자폭탄 투하. 약 14만 명 사망, 3일 후 나가사키에도 투하되어 일본 항복.", year: 1945, month: 8, day: 6, category: "war", region: "동아시아", country: "일본", latitude: 34.3853, longitude: 132.4553, importance: 5 },

  // ============================================================
  // === 현대 (1945 ~ 현재) ===
  // ============================================================
  { title: "UN 창설", description: "제2차 세계대전 종전 후 국제 평화와 안보를 위한 국제연합 공식 출범. 51개국 참여.", year: 1945, month: 10, day: 24, category: "diplomacy", region: "북미", country: "미국", latitude: 40.7489, longitude: -73.9680, importance: 5 },
  { title: "인도 독립", description: "마하트마 간디의 비폭력 독립운동 끝에 인도가 영국으로부터 독립. 동시에 파키스탄과 분리 독립.", year: 1947, month: 8, day: 15, category: "politics", region: "남아시아", country: "인도", latitude: 28.6139, longitude: 77.2090, importance: 5 },
  { title: "이스라엘 건국", description: "UN의 팔레스타인 분할 결의안에 따라 유대 민족이 이스라엘 국가를 수립. 제1차 중동전쟁 발발.", year: 1948, month: 5, day: 14, category: "politics", region: "중동", country: "이스라엘", latitude: 32.0853, longitude: 34.7818, importance: 5 },
  { title: "세계인권선언 채택", description: "UN 총회에서 세계인권선언 채택. 모든 인간의 존엄성과 기본적 권리를 선언.", year: 1948, month: 12, day: 10, category: "law", region: "유럽", country: "프랑스", latitude: 48.8606, longitude: 2.3376, importance: 5 },
  { title: "대한민국 정부 수립", description: "8·15 광복 후 남한에서 총선거를 실시하고 대한민국 정부를 공식 수립.", year: 1948, month: 8, day: 15, category: "politics", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 5 },
  { title: "중화인민공화국 수립", description: "마오쩌둥이 천안문 광장에서 중화인민공화국 수립을 선포. 장제스의 국민당은 타이완으로 퇴각.", year: 1949, month: 10, day: 1, category: "politics", region: "동아시아", country: "중국", latitude: 39.9054, longitude: 116.3976, importance: 5 },
  { title: "한국전쟁", description: "북한의 남침으로 시작된 전쟁. UN군 참전, 3년간 약 300만 명 사망. 휴전협정으로 분단 고착.", year: 1950, month: 6, day: 25, endYear: 1953, category: "war", region: "동아시아", country: "한국", latitude: 37.9667, longitude: 126.7333, importance: 5 },
  { title: "DNA 이중나선 구조 발견", description: "제임스 왓슨과 프랜시스 크릭이 DNA의 이중나선 구조를 규명. 분자생물학과 현대 유전학의 기초.", year: 1953, month: 4, day: 25, category: "science", region: "유럽", country: "영국", latitude: 52.2053, longitude: 0.1218, importance: 5 },
  { title: "유럽경제공동체(EEC) 설립", description: "로마 조약으로 유럽 6개국이 경제통합을 위한 EEC 설립. 현재 EU의 전신.", year: 1957, month: 3, day: 25, category: "economy", region: "유럽", country: "이탈리아", latitude: 41.9028, longitude: 12.4964, importance: 4 },
  { title: "쿠바 미사일 위기", description: "소련이 쿠바에 핵미사일을 배치하면서 미소 간 핵전쟁 직전까지 대치. 냉전 최대의 위기.", year: 1962, month: 10, category: "diplomacy", region: "중남미", country: "쿠바", latitude: 23.1136, longitude: -82.3666, importance: 5 },
  { title: "마틴 루터 킹 '나에게 꿈이 있습니다' 연설", description: "마틴 루터 킹 목사가 워싱턴 행진에서 인종차별 철폐와 평등을 호소하는 역사적 연설.", year: 1963, month: 8, day: 28, category: "society", region: "북미", country: "미국", latitude: 38.8893, longitude: -77.0502, importance: 5 },
  { title: "문화대혁명 발동", description: "마오쩌둥이 문화대혁명을 발동. 홍위병에 의한 대대적 정치 탄압으로 수백만 명 피해, 중국 사회·문화 대파괴.", year: 1966, month: 5, category: "politics", region: "동아시아", country: "중국", latitude: 39.9042, longitude: 116.4074, importance: 4 },
  { title: "아폴로 11호 달 착륙", description: "닐 암스트롱이 인류 최초로 달 표면에 발을 디딤. '인간에게는 작은 한 걸음, 인류에게는 위대한 도약.'", year: 1969, month: 7, day: 20, category: "science", region: "북미", country: "미국", latitude: 28.5721, longitude: -80.6480, importance: 5 },
  { title: "닉슨 중국 방문", description: "리처드 닉슨 미국 대통령이 중화인민공화국을 방문. 미중 수교의 시작이자 냉전 외교의 대전환.", year: 1972, month: 2, day: 21, category: "diplomacy", region: "동아시아", country: "중국", latitude: 39.9042, longitude: 116.4074, importance: 4 },
  { title: "베트남전 종결 (사이공 함락)", description: "북베트남군이 사이공을 점령하며 베트남전쟁 종결. 베트남 공산화 통일.", year: 1975, month: 4, day: 30, category: "war", region: "동남아시아", country: "베트남", latitude: 10.8231, longitude: 106.6297, importance: 4 },
  { title: "이란 혁명 (이슬람 혁명)", description: "호메이니가 이끄는 이슬람 혁명으로 팔레비 왕조 붕괴. 이란이 이슬람 공화국으로 전환.", year: 1979, month: 2, day: 11, category: "politics", region: "중동", country: "이란", latitude: 35.6892, longitude: 51.3890, importance: 4 },
  { title: "5·18 광주민주화운동", description: "전두환의 신군부 쿠데타에 항거한 광주 시민들의 민주화 운동. 계엄군의 무력 진압으로 수백 명 희생.", year: 1980, month: 5, day: 18, category: "politics", region: "동아시아", country: "한국", latitude: 35.1595, longitude: 126.8526, importance: 5 },
  { title: "6월 민주항쟁", description: "전두환 정권의 독재에 항거한 전국적 민주화 운동. 6·29 선언으로 대통령 직선제 쟁취.", year: 1987, month: 6, day: 10, category: "politics", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 5 },
  { title: "천안문 사건", description: "중국 베이징 천안문 광장에서 민주화를 요구하던 시위대를 군대가 무력 진압. 수백~수천 명 사망 추정.", year: 1989, month: 6, day: 4, category: "politics", region: "동아시아", country: "중국", latitude: 39.9054, longitude: 116.3976, importance: 5 },
  { title: "베를린 장벽 붕괴", description: "동독 시민들이 베를린 장벽을 허물고 동서독 통일의 길을 열다. 냉전 종식의 상징.", year: 1989, month: 11, day: 9, category: "politics", region: "유럽", country: "독일", latitude: 52.5163, longitude: 13.3777, importance: 5 },
  { title: "소련 해체", description: "고르바초프의 개혁정책 이후 소비에트 연방이 15개 독립국으로 해체. 냉전 체제의 공식적 종결.", year: 1991, month: 12, day: 25, category: "politics", region: "유럽", country: "러시아", latitude: 55.7558, longitude: 37.6173, importance: 5 },
  { title: "넬슨 만델라 대통령 취임", description: "27년간 수감 후 석방된 넬슨 만델라가 남아공 최초의 흑인 대통령으로 취임. 아파르트헤이트 체제 종식.", year: 1994, month: 5, day: 10, category: "politics", region: "아프리카", country: "남아프리카공화국", latitude: -25.7461, longitude: 28.1881, importance: 5 },
  { title: "홍콩 반환", description: "영국이 155년간 지배하던 홍콩을 중국에 반환. '일국양제(一國兩制)' 원칙 적용.", year: 1997, month: 7, day: 1, category: "diplomacy", region: "동아시아", country: "중국", latitude: 22.3193, longitude: 114.1694, importance: 4 },
  { title: "유로화 도입", description: "유럽연합 11개국이 단일통화 유로(EUR)를 전자결제용으로 도입. 2002년부터 지폐와 동전 유통 시작.", year: 1999, month: 1, day: 1, category: "economy", region: "유럽", country: "벨기에", latitude: 50.8503, longitude: 4.3517, importance: 4 },
  { title: "9·11 테러", description: "알카에다 테러리스트들이 미국 세계무역센터와 펜타곤을 공격. 약 3천 명 사망. 전세계 안보 질서 재편.", year: 2001, month: 9, day: 11, category: "war", region: "북미", country: "미국", latitude: 40.7115, longitude: -74.0134, importance: 5 },
  { title: "이라크 전쟁", description: "미국 주도의 연합군이 대량살상무기 보유 의혹을 근거로 이라크 침공. 사담 후세인 정권 붕괴.", year: 2003, month: 3, day: 20, category: "war", region: "중동", country: "이라크", latitude: 33.3128, longitude: 44.3615, importance: 4 },
  { title: "2008 글로벌 금융위기", description: "미국 서브프라임 모기지 사태로 촉발된 전세계 금융위기. 리먼 브라더스 파산.", year: 2008, month: 9, day: 15, category: "economy", region: "북미", country: "미국", latitude: 40.7580, longitude: -73.9855, importance: 5 },
  { title: "아랍의 봄", description: "튀니지에서 시작된 민주화 시위가 이집트, 리비아, 시리아 등 아랍권 전역으로 확산. 다수의 독재 정권 붕괴.", year: 2011, month: 1, category: "politics", region: "중동", country: "튀니지", latitude: 36.8065, longitude: 10.1815, importance: 4 },
  { title: "파리 기후변화 협정", description: "195개국이 파리에서 지구 온난화를 1.5°C 이내로 억제하기로 합의.", year: 2015, month: 12, day: 12, category: "diplomacy", region: "유럽", country: "프랑스", latitude: 48.8566, longitude: 2.3522, importance: 4 },
  { title: "브렉시트 국민투표", description: "영국 국민이 국민투표로 유럽연합(EU) 탈퇴를 결정. 유럽 통합의 역사적 후퇴.", year: 2016, month: 6, day: 23, category: "politics", region: "유럽", country: "영국", latitude: 51.5074, longitude: -0.1278, importance: 4 },
  { title: "COVID-19 팬데믹", description: "중국 우한에서 시작된 코로나바이러스가 전세계로 확산. 전세계 사망자 약 700만 명.", year: 2020, month: 1, category: "society", region: "동아시아", country: "중국", latitude: 30.5928, longitude: 114.3055, importance: 5 },
  { title: "러시아-우크라이나 전쟁", description: "러시아가 우크라이나를 전면 침공. 제2차 세계대전 이후 유럽 최대 규모의 무력 충돌.", year: 2022, month: 2, day: 24, category: "war", region: "유럽", country: "우크라이나", latitude: 50.4501, longitude: 30.5234, importance: 5 },

  // ============================================================
  // === 추가 주요 사건 (지역·시대 균형) ===
  // ============================================================
  // 아프리카
  { title: "악숨 왕국 전성기", description: "에티오피아의 악숨 왕국이 동아프리카와 아라비아 반도를 잇는 무역 대국으로 성장. 기독교 국가로 전환.", year: 350, category: "politics", region: "아프리카", country: "에티오피아", latitude: 14.1292, longitude: 38.7261, importance: 3 },
  { title: "말리 제국과 만사 무사의 메카 순례", description: "말리 제국의 만사 무사 왕이 막대한 금을 가지고 메카를 순례. 당시 세계 최고의 부호로 알려짐.", year: 1324, category: "economy", region: "아프리카", country: "말리", latitude: 12.6392, longitude: -8.0029, importance: 3 },
  { title: "아프리카 독립의 해", description: "1960년 한 해에 아프리카 17개국이 식민 지배로부터 독립. 탈식민화 운동의 절정.", year: 1960, category: "politics", region: "아프리카", country: "나이지리아", latitude: 9.0579, longitude: 7.4951, importance: 4 },
  { title: "르완다 대학살", description: "르완다에서 후투족이 투치족을 대상으로 약 100일간 대학살. 약 80만 명 사망.", year: 1994, month: 4, day: 7, category: "war", region: "아프리카", country: "르완다", latitude: -1.9403, longitude: 29.8739, importance: 4 },

  // 동남아시아
  { title: "앙코르와트 건설", description: "크메르 제국의 수리야바르만 2세가 세계 최대의 종교 건축물 앙코르와트를 건설.", year: 1150, category: "culture", region: "동남아시아", country: "캄보디아", latitude: 13.4125, longitude: 103.8670, importance: 3 },
  { title: "캄보디아 크메르루주 학살", description: "폴 포트의 크메르루주 정권이 캄보디아 인구의 약 1/4인 170만~200만 명을 학살.", year: 1975, month: 4, day: 17, endYear: 1979, category: "war", region: "동남아시아", country: "캄보디아", latitude: 11.5564, longitude: 104.9282, importance: 4 },
  { title: "아세안(ASEAN) 창설", description: "동남아시아 5개국이 방콕 선언으로 아세안을 창설. 동남아시아 지역 협력체의 시작.", year: 1967, month: 8, day: 8, category: "diplomacy", region: "동남아시아", country: "태국", latitude: 13.7563, longitude: 100.5018, importance: 3 },

  // 오세아니아
  { title: "영국 호주 식민지 건설", description: "영국이 호주에 최초의 유럽인 정착지(시드니)를 건설. 원주민 사회에 파괴적 영향.", year: 1788, month: 1, day: 26, category: "politics", region: "오세아니아", country: "호주", latitude: -33.8688, longitude: 151.2093, importance: 3 },
  { title: "뉴질랜드 여성 참정권 부여", description: "뉴질랜드가 세계 최초로 여성에게 선거권을 부여. 여성 참정권 운동의 이정표.", year: 1893, month: 9, day: 19, category: "law", region: "오세아니아", country: "뉴질랜드", latitude: -41.2866, longitude: 174.7756, importance: 4 },

  // 중앙아시아
  { title: "실크로드 교역 전성기", description: "중국 한나라와 로마 제국을 연결하는 실크로드를 통해 비단, 향료, 종교, 기술이 동서로 전파.", year: 100, category: "economy", region: "중앙아시아", country: "우즈베키스탄", latitude: 39.6542, longitude: 66.9597, importance: 4 },
  { title: "티무르 제국 건설", description: "중앙아시아의 정복자 티무르가 사마르칸트를 수도로 대제국 건설. 이슬람 문화의 황금기.", year: 1370, category: "war", region: "중앙아시아", country: "우즈베키스탄", latitude: 39.6542, longitude: 66.9597, importance: 3 },

  // 추가 중남미
  { title: "아즈텍 제국 멸망", description: "스페인의 에르난 코르테스가 아즈텍 제국의 수도 테노치티틀란을 정복. 메소아메리카 문명의 종말.", year: 1521, category: "war", region: "중남미", country: "멕시코", latitude: 19.4326, longitude: -99.1332, importance: 4 },
  { title: "시몬 볼리바르 남미 해방", description: "시몬 볼리바르가 스페인으로부터 베네수엘라, 콜롬비아, 에콰도르, 페루, 볼리비아의 독립을 이끔.", year: 1819, category: "politics", region: "중남미", country: "베네수엘라", latitude: 10.4806, longitude: -66.9036, importance: 4 },
  { title: "파나마 운하 개통", description: "태평양과 대서양을 연결하는 파나마 운하 개통. 세계 해상 무역의 혁명적 변화.", year: 1914, month: 8, day: 15, category: "economy", region: "중남미", country: "파나마", latitude: 9.0801, longitude: -79.6805, importance: 4 },
  { title: "쿠바 혁명", description: "피델 카스트로가 쿠바 혁명으로 바티스타 독재 정권을 전복. 서반구 최초의 사회주의 국가 수립.", year: 1959, month: 1, day: 1, category: "politics", region: "중남미", country: "쿠바", latitude: 23.1136, longitude: -82.3666, importance: 4 },

  // 추가 과학·문화
  { title: "코페르니쿠스 지동설 발표", description: "니콜라우스 코페르니쿠스가 '천구의 회전에 관하여'를 출판. 지구가 태양 주위를 돈다는 지동설 제시.", year: 1543, category: "science", region: "유럽", country: "폴란드", latitude: 53.7712, longitude: 20.4735, importance: 5 },
  { title: "다윈 종의 기원 출판", description: "찰스 다윈이 '종의 기원'을 출판. 자연선택에 의한 진화론으로 생물학과 사상에 혁명적 전환.", year: 1859, month: 11, day: 24, category: "science", region: "유럽", country: "영국", latitude: 51.5074, longitude: -0.1278, importance: 5 },
  { title: "아인슈타인 상대성이론 발표", description: "알베르트 아인슈타인이 일반상대성이론을 발표. E=mc² 공식으로 물질과 에너지의 관계를 규명.", year: 1915, category: "science", region: "유럽", country: "독일", latitude: 52.5200, longitude: 13.4050, importance: 5 },
  { title: "페니실린 발견", description: "알렉산더 플레밍이 최초의 항생제 페니실린을 발견. 현대 의학의 혁명적 전환점.", year: 1928, month: 9, day: 28, category: "science", region: "유럽", country: "영국", latitude: 51.5074, longitude: -0.1278, importance: 5 },
  { title: "인터넷(월드와이드웹) 발명", description: "팀 버너스리가 CERN에서 월드와이드웹(WWW)을 발명. 정보화 시대의 시작.", year: 1991, month: 8, day: 6, category: "science", region: "유럽", country: "스위스", latitude: 46.2044, longitude: 6.1432, importance: 5 },
  { title: "인간 게놈 프로젝트 완료", description: "13년간의 국제 공동연구 끝에 인간 유전체 전체 서열 해독 완료. 맞춤의학의 시대 개막.", year: 2003, month: 4, day: 14, category: "science", region: "북미", country: "미국", latitude: 38.9896, longitude: -77.0960, importance: 4 },

  // 추가 한국사
  { title: "세종대왕 한글 반포", description: "조선 세종대왕이 훈민정음(한글)을 반포. 세계에서 가장 과학적인 문자 체계 중 하나.", year: 1446, month: 10, day: 9, category: "culture", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 5 },
  { title: "병자호란", description: "청나라가 조선을 침공. 인조가 남한산성에서 항전하다 삼전도에서 굴욕적 항복.", year: 1636, month: 12, category: "war", region: "동아시아", country: "한국", latitude: 37.4792, longitude: 127.1120, importance: 4 },
  { title: "동학농민운동", description: "전봉준이 이끄는 동학농민군이 탐관오리 척결과 반외세를 내걸고 봉기. 근대적 민중운동의 시초.", year: 1894, month: 1, category: "society", region: "동아시아", country: "한국", latitude: 35.8019, longitude: 127.1020, importance: 4 },
  { title: "4·19 혁명", description: "이승만 정권의 3·15 부정선거에 항거한 학생·시민 민주화 혁명. 이승만 대통령 하야.", year: 1960, month: 4, day: 19, category: "politics", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 4 },
  { title: "한일 기본조약 체결", description: "대한민국과 일본 간의 국교 정상화 조약. 식민 지배 청산 문제와 경제 협력 논의.", year: 1965, month: 6, day: 22, category: "diplomacy", region: "동아시아", country: "한국", latitude: 37.5665, longitude: 126.9780, importance: 3 },
  { title: "1988 서울 올림픽", description: "대한민국 서울에서 제24회 하계 올림픽 개최. 냉전 종식 분위기 속 동서 화합의 장.", year: 1988, month: 9, day: 17, category: "culture", region: "동아시아", country: "한국", latitude: 37.5151, longitude: 127.0735, importance: 4 },
  { title: "남북정상회담 (최초)", description: "김대중 대통령과 김정일 국방위원장이 평양에서 최초의 남북정상회담. 6·15 공동선언 발표.", year: 2000, month: 6, day: 15, category: "diplomacy", region: "동아시아", country: "한국", latitude: 39.0392, longitude: 125.7625, importance: 4 },

  // 추가 일본사
  { title: "일본 에도 막부 성립", description: "도쿠가와 이에야스가 세키가하라 전투 승리 후 에도 막부를 열어 260년간의 태평성대.", year: 1603, category: "politics", region: "동아시아", country: "일본", latitude: 35.6762, longitude: 139.6503, importance: 3 },
  { title: "일본 제국 헌법 공포", description: "메이지 일왕이 아시아 최초의 근대 헌법인 대일본제국 헌법을 공포. 입헌군주제 도입.", year: 1889, month: 2, day: 11, category: "law", region: "동아시아", country: "일본", latitude: 35.6762, longitude: 139.6503, importance: 3 },

  // 추가 주요 전쟁/외교
  { title: "비엔나 회의", description: "나폴레옹 전쟁 후 유럽 열강이 비엔나에서 전후 질서를 재편. 유럽 협조 체제와 세력균형 원칙 확립.", year: 1815, month: 6, day: 9, category: "diplomacy", region: "유럽", country: "오스트리아", latitude: 48.2082, longitude: 16.3738, importance: 4 },
  { title: "크림 전쟁", description: "러시아와 오스만 제국·영국·프랑스 연합군의 전쟁. 근대 전쟁의 시작이자 적십자 운동의 계기.", year: 1853, month: 10, endYear: 1856, category: "war", region: "유럽", country: "우크라이나", latitude: 44.4268, longitude: 33.5680, importance: 3 },
  { title: "제네바 협약 체결", description: "전쟁 시 부상병과 포로의 인도적 대우를 규정한 최초의 제네바 협약 체결. 국제 인도법의 기초.", year: 1864, month: 8, day: 22, category: "law", region: "유럽", country: "스위스", latitude: 46.2044, longitude: 6.1432, importance: 4 },
  { title: "뉘른베르크 전범재판", description: "제2차 세계대전 후 나치 전범들을 국제군사재판소에서 재판. 국제형사법의 이정표.", year: 1945, month: 11, day: 20, endYear: 1946, category: "law", region: "유럽", country: "독일", latitude: 49.4521, longitude: 11.0767, importance: 4 },
  { title: "NATO 창설", description: "미국 주도로 북대서양조약기구(NATO) 설립. 서방 집단안보체제의 핵심 기구.", year: 1949, month: 4, day: 4, category: "diplomacy", region: "북미", country: "미국", latitude: 38.8977, longitude: -77.0365, importance: 4 },
  { title: "걸프전 (이라크 쿠웨이트 침공)", description: "이라크 사담 후세인이 쿠웨이트를 침공. 미국 주도 다국적군이 이라크를 격퇴.", year: 1991, month: 1, day: 17, category: "war", region: "중동", country: "쿠웨이트", latitude: 29.3759, longitude: 47.9774, importance: 3 },
];

async function seed() {
  console.log(`Seeding ${EVENTS.length} history events...`);
  for (const event of EVENTS) {
    await db.insert(historyEvents).values(event);
  }
  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
