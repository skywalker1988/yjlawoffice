const { db } = require("./db");
const { documents, historyEvents } = require("./db/schema");
const { eq } = require("drizzle-orm");

// 카테고리 → 문서 유형 매핑
const CATEGORY_TO_DOCTYPE = {
  politics: "note",
  war: "note",
  economy: "note",
  culture: "note",
  science: "note",
  law: "note",
  society: "note",
  diplomacy: "note",
};

const CATEGORY_LABELS = {
  politics: "정치", war: "전쟁", economy: "경제", culture: "문화",
  science: "과학", law: "법률", society: "사회", diplomacy: "외교",
};

// 각 이벤트별 상세 본문 (한국어 + 영어 이중언어)
const DETAILED_CONTENT = {

  "수메르 문명 발생": `# 수메르 문명 발생

## 개요 (Overview)
기원전 4500년경부터 기원전 1900년경까지 메소포타미아 남부(현재의 이라크 남부)에서 번성한 인류 최초의 도시 문명이다. 티그리스강과 유프라테스강 사이의 비옥한 충적 평야에서 관개 농업을 기반으로 발전하였다.

## 주요 내용 (Key Details)
- **쐐기문자(cuneiform)**: 기원전 3400년경 발명된 인류 최초의 문자 체계
- **우르, 우루크, 라가시** 등 세계 최초의 도시국가 건설
- **60진법** 수학 체계 개발 (현재 시간·각도 단위의 기원)
- **지구라트(ziggurat)**: 계단식 신전 건축으로 대표되는 건축 기술
- 세계 최초의 법률 체계와 행정 관료제 운영
- 청동기 기술, 바퀴, 쟁기 등 혁신적 기술 발명
- 길가메시 서사시 등 최초의 문학 작품 탄생

## 역사적 의의 (Historical Significance)
수메르 문명은 문자, 법률, 도시 계획, 관료제 등 문명의 기본 요소를 최초로 확립하여 이후 바빌로니아, 아시리아, 페르시아 등 후속 문명의 토대를 마련하였다. 인류 역사에서 '문명의 요람'이라 불리며, 현대 사회의 근본적 제도와 기술의 원형을 제공하였다.

---

# Rise of Sumerian Civilization

## Overview
The Sumerian civilization flourished from approximately 4500 BCE to 1900 BCE in southern Mesopotamia (present-day southern Iraq). It developed on the fertile alluvial plains between the Tigris and Euphrates rivers, sustained by sophisticated irrigation agriculture.

## Key Details
- **Cuneiform script**: The world's first writing system, invented around 3400 BCE
- Construction of the earliest city-states including **Ur, Uruk, and Lagash**
- Development of the **sexagesimal (base-60)** numerical system, the origin of modern time and angle measurements
- **Ziggurats**: Monumental stepped temple complexes demonstrating advanced architectural engineering
- The world's first legal codes and administrative bureaucracies
- Invention of transformative technologies: bronze metallurgy, the wheel, and the plow
- Creation of the earliest literary works, including the Epic of Gilgamesh

## Historical Significance
Sumerian civilization established the fundamental building blocks of human civilization—writing, law, urban planning, and bureaucracy—laying the groundwork for subsequent Babylonian, Assyrian, and Persian empires. Often called the "Cradle of Civilization," it provided the archetypal institutions and technologies upon which modern society ultimately rests.`,

  "이집트 피라미드 건설": `# 이집트 피라미드 건설

## 개요 (Overview)
기원전 2630년경부터 기원전 2500년경까지 고대 이집트 고왕국 시대에 파라오의 무덤으로 건설된 거대 석조 건축물이다. 특히 기자(Giza)의 대피라미드는 기원전 2560년경 제4왕조 쿠푸(Khufu) 파라오의 명으로 건설되었으며, 고대 세계 7대 불가사의 중 유일하게 현존한다.

## 주요 내용 (Key Details)
- **쿠푸 대피라미드**: 높이 약 146.6m, 약 230만 개의 석회암 블록 사용, 각 블록 평균 2.5톤
- **건설 기간**: 약 20년, 추정 노동력 2만~10만 명
- 조세르왕의 **계단식 피라미드**(기원전 2630년)가 최초의 대규모 석조 건축
- 건축가 **임호텝(Imhotep)**은 역사상 최초로 이름이 기록된 건축가
- 정밀한 천문학적 정렬: 네 변이 동서남북 방위와 거의 정확히 일치
- 내부 구조: 왕의 방, 왕비의 방, 대회랑 등 정교한 내부 설계

## 역사적 의의 (Historical Significance)
피라미드는 고대 이집트의 정치적 권력, 종교적 신앙(사후 세계관), 그리고 놀라운 공학 기술을 상징한다. 대규모 노동력의 조직적 동원은 고도로 발달한 국가 행정 체계의 존재를 증명하며, 이집트 문명이 수천 년간 지속될 수 있었던 사회적 결속력의 원천이었다.

---

# Construction of the Egyptian Pyramids

## Overview
The Egyptian pyramids were monumental stone structures built as royal tombs during the Old Kingdom period, from approximately 2630 BCE to 2500 BCE. The Great Pyramid at Giza, constructed around 2560 BCE by order of Pharaoh Khufu (Fourth Dynasty), is the only surviving wonder of the ancient Seven Wonders of the World.

## Key Details
- **Great Pyramid of Khufu**: Originally 146.6 meters tall, constructed from approximately 2.3 million limestone blocks averaging 2.5 tons each
- **Construction period**: Approximately 20 years, employing an estimated 20,000 to 100,000 workers
- The **Step Pyramid of Djoser** (c. 2630 BCE) was the first large-scale stone construction in history
- Architect **Imhotep** is the earliest known architect in recorded history
- Precise astronomical alignment: the four sides correspond almost exactly to the cardinal directions
- Complex internal architecture: the King's Chamber, Queen's Chamber, and Grand Gallery

## Historical Significance
The pyramids symbolize ancient Egypt's political authority, religious beliefs in the afterlife, and remarkable engineering capabilities. The organized mobilization of massive labor forces demonstrates the existence of a highly developed state administration, and served as a source of social cohesion that sustained Egyptian civilization for millennia.`,

  "함무라비 법전 제정": `# 함무라비 법전 제정

## 개요 (Overview)
기원전 1754년경, 바빌로니아 제1왕조의 제6대 왕 함무라비(재위 BC 1792~BC 1750)가 반포한 세계에서 가장 오래된 성문법전 중 하나이다. 높이 2.25m의 검은 섬록암 비석에 아카드어 쐐기문자로 새겨져 있으며, 현재 프랑스 루브르 박물관에 소장되어 있다.

## 주요 내용 (Key Details)
- **동해보복법(lex talionis)**: "눈에는 눈, 이에는 이" 원칙
- 총 **282개 조문**으로 구성
- 재산법, 가족법, 노동법, 형법, 상법 등 광범위한 영역 포괄
- 사회계층에 따른 차별적 적용: 자유민(awilum), 반자유민(muskenum), 노예(wardum)
- 계약법, 임대차, 고용, 의료과실 등 구체적 사례 규정
- 비석 상단에 태양신 샤마시로부터 법을 받는 함무라비의 부조가 새겨져 있음

## 역사적 의의 (Historical Significance)
- 관습법의 성문화를 통한 법적 안정성과 예측 가능성 확보
- 왕의 자의적 재판을 제한하고 객관적 기준 제시
- 법 앞의 (제한적) 평등 개념 최초 도입
- 현대 법체계의 기초적 원리(죄형법정주의, 계약 자유 등)의 원형 제공
- 이후 로마법, 유대법 등 서양 법전통의 발전에 간접적 영향

---

# Promulgation of the Code of Hammurabi

## Overview
Around 1754 BCE, Hammurabi, the sixth king of the First Babylonian Dynasty (r. 1792-1750 BCE), promulgated one of the world's oldest known written legal codes. Inscribed in Akkadian cuneiform on a 2.25-meter black diorite stele, it is currently housed in the Louvre Museum in Paris.

## Key Details
- **Lex talionis**: The principle of "an eye for an eye, a tooth for a tooth"
- Comprises **282 laws** in total
- Covers a broad range of legal areas: property, family, labor, criminal, and commercial law
- Differential application based on social class: free persons (awilum), commoners (muskenum), and slaves (wardum)
- Specific provisions on contracts, leases, employment, and medical malpractice
- The stele's upper portion depicts a relief of Hammurabi receiving the law from the sun god Shamash

## Historical Significance
- Achieved legal certainty and predictability through codification of customary law
- Constrained royal judicial arbitrariness by establishing objective standards
- Introduced the earliest (albeit limited) concept of equality before the law
- Provided archetypal principles underlying modern legal systems (nullum crimen sine lege, freedom of contract)
- Indirectly influenced the development of Roman law, Judaic law, and the broader Western legal tradition`,

  "그리스 민주주의 시작": `# 그리스 민주주의 시작

## 개요 (Overview)
기원전 508년, 아테네의 정치가 클레이스테네스(Cleisthenes)가 참주정을 무너뜨리고 시민이 직접 국정에 참여하는 민주정 체제를 수립하였다. 이는 인류 역사상 최초의 민주주의 실험으로, '데모크라티아(demokratia, 민중의 지배)'라는 개념의 기원이다.

## 주요 내용 (Key Details)
- **에클레시아(민회)**: 성인 남성 시민 전원이 참여하는 최고 의결 기관
- **부울레(500인 평의회)**: 10개 부족에서 각 50명씩 추첨으로 선출
- **도편추방제(ostracism)**: 참주 출현을 방지하기 위한 제도, 도자기 파편에 이름을 적어 투표
- **공직 추첨제**: 대부분의 공직을 추첨으로 선발하여 권력 독점 방지
- 페리클레스 시대(기원전 461~429년)에 민주주의가 최전성기 도달
- 다만 여성, 외국인(메토이코이), 노예는 시민권에서 배제

## 역사적 의의 (Historical Significance)
아테네 민주주의는 시민의 직접적 정치 참여, 법 앞의 평등(이소노미아), 표현의 자유(파르헤시아)라는 근대 민주주의의 핵심 원리를 최초로 실천하였다. 비록 참여 범위가 제한적이었으나, 로마 공화정, 근대 계몽사상, 미국-프랑스 혁명의 사상적 원천이 되었다.

---

# Birth of Greek Democracy

## Overview
In 508 BCE, the Athenian statesman Cleisthenes overthrew tyrannical rule and established a political system in which citizens directly participated in governance. This constituted the first democratic experiment in human history and gave rise to the concept of "demokratia" (rule by the people).

## Key Details
- **Ecclesia (Assembly)**: The supreme decision-making body open to all adult male citizens
- **Boule (Council of 500)**: Fifty members selected by lot from each of the ten tribes
- **Ostracism**: A mechanism to prevent tyranny, where citizens inscribed names on pottery shards to vote for exile
- **Selection by lot**: Most public offices filled by lottery to prevent concentration of power
- Democracy reached its zenith during the **Age of Pericles** (461-429 BCE)
- However, women, resident foreigners (metics), and enslaved persons were excluded from citizenship

## Historical Significance
Athenian democracy pioneered the core principles of modern democratic governance: direct citizen participation, equality before the law (isonomia), and freedom of speech (parrhesia). Although limited in its inclusiveness, it served as the intellectual wellspring for the Roman Republic, Enlightenment philosophy, and the American and French Revolutions.`,

  "석가모니 열반": `# 석가모니 열반

## 개요 (Overview)
기원전 483년경(일설에는 기원전 400년경), 불교의 창시자 고타마 싯다르타(Gautama Siddhartha)가 인도 쿠시나가라에서 80세의 나이로 열반(parinirvana)에 들었다. 석가모니는 기원전 563년경 현재 네팔 룸비니에서 석가족의 왕자로 태어나, 29세에 출가하여 35세에 보리수 아래에서 깨달음을 얻었다.

## 주요 내용 (Key Details)
- **사성제(四聖諦)**: 고(苦)-집(集)-멸(滅)-도(道) - 인생의 고통과 해탈의 진리
- **팔정도(八正道)**: 올바른 수행의 여덟 가지 길
- **중도(中道)**: 극단적 쾌락주의와 극단적 고행을 모두 피하는 균형의 길
- **연기설(緣起說)**: 모든 존재는 인과 관계에 의해 상호 의존적으로 생성
- 45년간의 전법(傳法) 활동을 통해 인도 전역에 교단 확립
- 열반 후 제자들에 의해 경전 결집(結集) 시작

## 역사적 의의 (Historical Significance)
석가모니의 가르침은 인도에서 시작하여 동남아시아, 동아시아, 중앙아시아로 전파되어 세계 4대 종교 중 하나인 불교로 발전하였다. 카스트 제도에 대한 비판, 비폭력(아힘사)의 원칙, 명상 수행의 전통은 인류 정신사에 깊은 영향을 미쳤으며, 현대에도 전 세계 약 5억 명의 신자가 있다.

---

# Parinirvana of Shakyamuni Buddha

## Overview
Around 483 BCE (some scholars suggest c. 400 BCE), Gautama Siddhartha, the founder of Buddhism, attained parinirvana (final nirvana) at Kushinagar, India, at the age of 80. Born circa 563 BCE in Lumbini (present-day Nepal) as a prince of the Shakya clan, he renounced worldly life at 29 and achieved enlightenment at 35 under the Bodhi tree.

## Key Details
- **Four Noble Truths**: Suffering (dukkha), its origin (samudaya), its cessation (nirodha), and the path to cessation (magga)
- **Noble Eightfold Path**: Eight aspects of right practice leading to liberation
- **Middle Way**: Avoidance of both extreme hedonism and extreme asceticism
- **Dependent Origination (pratityasamutpada)**: All phenomena arise interdependently through causal relations
- Established the Sangha (monastic community) across India through 45 years of teaching
- After his passing, disciples convened the First Buddhist Council to compile his teachings

## Historical Significance
The Buddha's teachings spread from India to Southeast Asia, East Asia, and Central Asia, evolving into Buddhism-one of the world's four major religions. His critique of the caste system, the principle of non-violence (ahimsa), and the tradition of meditative practice have profoundly shaped human intellectual history. Today, Buddhism claims approximately 500 million adherents worldwide.`,

  "공자 사상 체계 확립": `# 공자 사상 체계 확립

## 개요 (Overview)
기원전 5세기경, 춘추시대 말기 중국의 사상가 공자(孔子, 기원전 551~479년)가 인(仁)-예(禮)-의(義)를 핵심으로 하는 유가(儒家) 사상 체계를 확립하였다. 노(魯)나라 출신으로, 주유천하(周遊天下)를 통해 제후들에게 이상적 통치를 설파하고, 만년에 제자 교육과 경전 편찬에 전력하였다.

## 주요 내용 (Key Details)
- **인(仁)**: 사람을 사랑하는 마음, 유교의 최고 덕목
- **예(禮)**: 사회 질서를 유지하는 규범과 의례 체계
- **충서(忠恕)**: 충(忠, 자기 최선)과 서(恕, 타인에 대한 배려)의 윤리
- **정명(正名)**: "임금은 임금답고 신하는 신하다워야 한다" - 명분론
- **오경(五經)**: 시경, 서경, 역경, 예기, 춘추 등 경전 편찬-정리
- 약 3,000명의 제자를 가르침, 그중 72명이 뛰어난 인물(칠십이현)
- 제자들이 공자의 언행을 기록한 **논어(論語)**가 핵심 경전

## 역사적 의의 (Historical Significance)
유교 사상은 중국을 넘어 한국, 일본, 베트남 등 동아시아 전역의 정치 체제, 교육 제도, 사회 윤리, 법문화에 지대한 영향을 미쳤다. 과거제도를 통한 능력 기반 관료 선발, 효(孝) 중심의 가족 윤리, 수기치인(修己治人)의 지도자론은 동아시아 문명의 핵심 원리가 되었다.

---

# Establishment of Confucian Philosophy

## Overview
Around the 5th century BCE, during the late Spring and Autumn period, the Chinese philosopher Confucius (Kong Qiu, 551-479 BCE) established the Confucian (Ruist) philosophical system centered on ren (benevolence), li (ritual propriety), and yi (righteousness). A native of the state of Lu, he traveled extensively to advise rulers on ideal governance and devoted his later years to educating disciples and compiling classical texts.

## Key Details
- **Ren (benevolence)**: Love for humanity, the supreme Confucian virtue
- **Li (ritual propriety)**: Norms and ceremonial systems maintaining social order
- **Zhongshu**: The ethics of loyalty (zhong) and reciprocity (shu)
- **Zhengming (rectification of names)**: "Let the ruler be a ruler, the minister a minister"
- **Five Classics**: Compilation and editing of the Book of Songs, Book of Documents, Book of Changes, Book of Rites, and Spring and Autumn Annals
- Taught approximately 3,000 disciples, among whom 72 were regarded as exceptional
- The **Analects (Lunyu)**, recording Confucius's sayings and deeds, became the central Confucian text

## Historical Significance
Confucian thought profoundly influenced political systems, educational institutions, social ethics, and legal culture across East Asia-extending beyond China to Korea, Japan, and Vietnam. Meritocratic bureaucratic selection through civil examinations, filial piety-centered family ethics, and the leadership ideal of self-cultivation for governance became defining principles of East Asian civilization.`,

  "알렉산드로스 대왕 동방원정": `# 알렉산드로스 대왕 동방원정

## 개요 (Overview)
기원전 334년, 마케도니아의 알렉산드로스 3세(기원전 356~323년)가 약 4만 명의 원정군을 이끌고 페르시아 제국 정복에 나섰다. 10년간의 원정을 통해 이집트, 페르시아, 중앙아시아, 인도 북서부까지 진출하여 인류 역사상 가장 광대한 제국 중 하나를 건설하였다.

## 주요 내용 (Key Details)
- **그라니코스 전투**(기원전 334년): 소아시아에서 첫 승리
- **이수스 전투**(기원전 333년): 페르시아 왕 다리우스 3세를 격파
- **이집트 정복**(기원전 332년): 알렉산드리아 건설, 파라오로 추대
- **가우가멜라 전투**(기원전 331년): 페르시아 제국 결정적 패배
- **인도 원정**(기원전 326년): 히다스페스 전투 승리 후 병사들의 귀환 요청으로 회군
- 기원전 323년 바빌론에서 32세에 급서 (사인 불명, 열병 추정)
- 사후 제국은 디아도코이(후계자)들에 의해 분열

## 역사적 의의 (Historical Significance)
알렉산드로스의 원정은 그리스 문화와 오리엔트 문화의 융합인 **헬레니즘(Hellenism)** 시대를 열었다. 알렉산드리아 등 70여 개 도시 건설을 통해 그리스어가 지중해~중앙아시아의 공용어가 되었고, 철학-과학-예술의 교류가 활성화되어 이후 로마 문명과 기독교 전파의 문화적 기반이 되었다.

---

# Alexander the Great's Eastern Campaign

## Overview
In 334 BCE, Alexander III of Macedon (356-323 BCE) led an expeditionary force of approximately 40,000 soldiers on a campaign to conquer the Persian Empire. Over ten years, he advanced through Egypt, Persia, Central Asia, and into northwestern India, establishing one of the largest empires in human history.

## Key Details
- **Battle of Granicus** (334 BCE): First major victory in Asia Minor
- **Battle of Issus** (333 BCE): Decisive defeat of Persian King Darius III
- **Conquest of Egypt** (332 BCE): Founded Alexandria; acclaimed as Pharaoh
- **Battle of Gaugamela** (331 BCE): Delivered the fatal blow to the Persian Empire
- **Indian campaign** (326 BCE): Victory at the Battle of the Hydaspes, followed by withdrawal at the army's insistence
- Died suddenly in Babylon in 323 BCE at age 32 (cause unknown, likely fever)
- The empire fragmented among the Diadochi (successors) after his death

## Historical Significance
Alexander's campaigns inaugurated the **Hellenistic era**, a period of cultural fusion between Greek and Oriental civilizations. Through the establishment of over 70 cities including Alexandria, Greek became the lingua franca from the Mediterranean to Central Asia. The resulting exchange in philosophy, science, and the arts laid the cultural foundation for Roman civilization and the subsequent spread of Christianity.`,

  "진시황 중국 통일": `# 진시황 중국 통일

## 개요 (Overview)
기원전 221년, 진(秦)나라의 왕 영정(嬴政)이 전국 7웅(齊-楚-燕-韓-趙-魏-秦)을 멸하고 중국 역사상 최초의 통일 제국을 건설하였다. 스스로 '시황제(始皇帝, 최초의 황제)'라 칭하며, 중앙집권적 관료제 국가의 기틀을 마련하였다.

## 주요 내용 (Key Details)
- **군현제(郡縣制)**: 봉건제를 폐지하고 중앙에서 관리를 파견하는 직할 통치 체제 시행
- **문자 통일**: 소전(小篆)으로 문자를 통일하여 행정 효율 향상
- **도량형 통일**: 도량형과 화폐, 수레바퀴 간격까지 표준화
- **만리장성 축조**: 북방 흉노 침입 방지를 위한 대규모 방벽 건설
- **분서갱유(焚書坑儒)**: 사상 통제를 위해 서적을 소각하고 유생을 처형
- **진시황릉과 병마용**: 약 8,000구의 도용(陶俑)이 부장된 세계 최대의 지하 군대
- 기원전 210년 순행 중 사망, 이후 진나라는 급속히 멸망(기원전 206년)

## 역사적 의의 (Historical Significance)
진시황의 통일은 이후 2,000년 이상 지속된 중국 통일 제국 전통의 시작이었다. 군현제, 문자-도량형 통일 등의 제도적 유산은 한(漢)나라에 계승되어 중국 문명의 영속적 기반이 되었으며, 동아시아 전체의 행정-법률 체계에 깊은 영향을 미쳤다.

---

# Qin Shi Huang's Unification of China

## Overview
In 221 BCE, King Ying Zheng of the Qin state conquered the six rival Warring States (Qi, Chu, Yan, Han, Zhao, Wei) and established the first unified empire in Chinese history. He proclaimed himself "Shi Huangdi" (First Emperor) and laid the foundations for a centralized bureaucratic state.

## Key Details
- **Commandery-county system (junxian)**: Abolished feudalism in favor of direct governance by centrally appointed officials
- **Script unification**: Standardized writing to Small Seal Script (xiaozhuan) for administrative efficiency
- **Standardization of weights, measures, currency**, and even axle widths
- **Great Wall construction**: Built massive fortifications to defend against Xiongnu incursions from the north
- **Burning of books and burying of scholars (fenshu kengru)**: Suppressed dissent through ideological control
- **Terracotta Army**: Approximately 8,000 life-sized clay warriors interred with the emperor's tomb
- Died during a tour of the empire in 210 BCE; the Qin dynasty rapidly collapsed by 206 BCE

## Historical Significance
Qin Shi Huang's unification initiated the tradition of unified imperial governance that persisted for over two millennia. His institutional legacies-the commandery-county system, script standardization, and uniform measurements-were inherited by the Han dynasty and became enduring foundations of Chinese civilization, profoundly influencing administrative and legal systems throughout East Asia.`,

  "카이사르 암살": `# 카이사르 암살

## 개요 (Overview)
기원전 44년 3월 15일(이두스 마르티아이, Ides of March), 로마 공화정의 종신 독재관 가이우스 율리우스 카이사르(기원전 100~44년)가 원로원 의사당에서 브루투스, 카시우스 등 60여 명의 공화파 원로원 의원들에 의해 23군데를 찔려 암살당하였다.

## 주요 내용 (Key Details)
- 카이사르는 갈리아 전쟁(기원전 58~50년) 승리로 막대한 군사적 명성 획득
- 기원전 49년 루비콘강을 건너 내전 시작, 폼페이우스 격파
- 종신 독재관(dictator perpetuo) 취임으로 공화파의 반감 극대화
- 암살 당일 약 23회 칼에 찔림, "브루투스, 너마저(Et tu, Brute?)"는 셰익스피어의 창작
- 암살 후 옥타비아누스(양자)-안토니우스-레피두스가 제2차 삼두정치 구성
- 최종적으로 옥타비아누스가 승리하여 아우구스투스로서 로마 제정(帝政) 개시(기원전 27년)

## 역사적 의의 (Historical Significance)
카이사르 암살은 로마 공화정의 종말과 제정(帝政)으로의 전환을 촉발한 역사적 분기점이다. 공화주의자들의 의도와 달리, 암살은 공화정을 회복시키지 못하고 오히려 내전과 독재를 가속화하였다. 이 사건은 이후 서양 정치사상에서 참주 살해(tyrannicide)의 정당성에 관한 끊임없는 논쟁의 원형이 되었다.

---

# Assassination of Julius Caesar

## Overview
On March 15, 44 BCE (the Ides of March), Gaius Julius Caesar (100-44 BCE), dictator perpetuo of the Roman Republic, was assassinated in the Senate house, stabbed 23 times by a group of approximately 60 Republican senators led by Brutus and Cassius.

## Key Details
- Caesar achieved immense military prestige through his conquest of Gaul (58-50 BCE)
- Crossed the Rubicon in 49 BCE, initiating civil war and defeating Pompey
- His assumption of the title "dictator perpetuo" maximized Republican opposition
- Stabbed approximately 23 times on the day of assassination; "Et tu, Brute?" is a Shakespearean invention
- Following the assassination, Octavian (his adopted heir), Antony, and Lepidus formed the Second Triumvirate
- Octavian ultimately prevailed, inaugurating the Roman Empire as Augustus in 27 BCE

## Historical Significance
Caesar's assassination was the pivotal event that triggered the transition from the Roman Republic to the Imperial system. Contrary to the conspirators' intentions, the act failed to restore the Republic and instead accelerated civil war and autocratic consolidation. The event became the archetype for Western political debates over the legitimacy of tyrannicide.`,

  "로마 제국 멸망": `# 로마 제국 멸망 (서로마)

## 개요 (Overview)
476년 9월 4일, 게르만 용병대장 오도아케르(Odoacer)가 서로마 제국의 마지막 황제 로물루스 아우구스툴루스(Romulus Augustulus)를 폐위시킴으로써, 기원전 27년 아우구스투스로부터 시작된 약 500년의 서로마 제국이 공식적으로 종말을 맞이하였다.

## 주요 내용 (Key Details)
- **분열(395년)**: 테오도시우스 1세 사후 로마 제국이 동-서로 영구 분할
- **게르만 민족의 대이동(4~5세기)**: 훈족의 압박으로 게르만 부족들이 제국 영내로 대거 유입
- **410년 로마 약탈**: 서고트족의 알라리크가 800년 만에 로마시를 점령-약탈
- **455년 반달족의 로마 약탈**: 2주간의 조직적 약탈
- 경제적 쇠퇴: 무역 감소, 화폐 가치 하락, 인구 감소
- 군사적 약화: 게르만 용병 의존도 심화, 군사력의 질적 저하
- 동로마(비잔틴) 제국은 1453년까지 약 1,000년 더 존속

## 역사적 의의 (Historical Significance)
서로마의 멸망은 고대에서 중세로의 전환을 상징하는 역사적 이정표이다. 로마법, 라틴어, 기독교 등 로마의 유산은 게르만 왕국들에 의해 부분적으로 계승되었으며, 이는 중세 유럽 문명의 기반이 되었다. 또한 동로마 제국의 존속은 로마 법학 전통의 보존에 결정적 역할을 하였다(유스티니아누스 법전).

---

# Fall of the Roman Empire (Western)

## Overview
On September 4, 476 CE, the Germanic chieftain Odoacer deposed Romulus Augustulus, the last emperor of the Western Roman Empire, formally ending approximately 500 years of imperial rule that had begun with Augustus in 27 BCE.

## Key Details
- **Division (395 CE)**: After Theodosius I's death, the Roman Empire was permanently split into Eastern and Western halves
- **Great Migration (4th-5th centuries)**: Pressure from the Huns drove Germanic tribes into the empire en masse
- **Sack of Rome (410 CE)**: Alaric and the Visigoths captured and sacked Rome for the first time in 800 years
- **Vandal sack of Rome (455 CE)**: Two weeks of systematic plunder
- Economic decline: decreased trade, currency debasement, population loss
- Military deterioration: growing dependence on Germanic mercenaries, declining troop quality
- The Eastern Roman (Byzantine) Empire survived until 1453, enduring nearly 1,000 additional years

## Historical Significance
The fall of the Western Roman Empire marks the symbolic transition from antiquity to the medieval period. Roman legacies-Roman law, the Latin language, and Christianity-were partially inherited by the Germanic kingdoms, forming the foundation of medieval European civilization. The survival of the Eastern Empire proved decisive in preserving the Roman legal tradition, most notably through the Corpus Juris Civilis of Justinian.`,

  "이슬람교 창시": `# 이슬람교 창시

## 개요 (Overview)
610년경, 아라비아 반도 메카의 상인 무함마드(Muhammad, 570~632년)가 히라 산 동굴에서 대천사 지브릴(가브리엘)을 통해 알라의 계시를 받기 시작하였다. 이후 622년 메카에서 메디나로의 이주(히즈라, Hijra)를 기점으로 이슬람 공동체(움마)가 본격적으로 형성되었으며, 이 해가 이슬람력의 원년이 되었다.

## 주요 내용 (Key Details)
- **꾸란(Quran)**: 무함마드가 23년간 받은 계시를 집대성한 이슬람의 경전
- **이슬람의 다섯 기둥**: 신앙고백(샤하다), 예배(살라), 자선(자카트), 금식(사움), 성지순례(하지)
- **622년 히즈라**: 메카 박해를 피해 메디나로 이주, 이슬람 공동체 형성
- **630년 메카 정복**: 무혈입성으로 아라비아 반도 통일
- **632년 무함마드 사망** 후 칼리프 체제로 전환
- 이후 100년 내에 이베리아 반도에서 인도까지 급속 확장

## 역사적 의의 (Historical Significance)
이슬람교는 현재 전 세계 약 19억 명의 신자를 가진 세계 제2의 종교로 발전하였다. 이슬람 문명은 중세 시대에 수학, 의학, 천문학, 철학 분야에서 인류 지식의 보존과 발전에 핵심 역할을 하였으며, 샤리아(이슬람법)는 독자적인 법체계로서 많은 국가의 법률에 영향을 미치고 있다.

---

# Founding of Islam

## Overview
Around 610 CE, Muhammad (570-632 CE), a merchant in Mecca on the Arabian Peninsula, began receiving divine revelations from Allah through the Archangel Jibril (Gabriel) in a cave on Mount Hira. The Hijra-Muhammad's migration from Mecca to Medina in 622 CE-marked the formal establishment of the Muslim community (umma) and became Year One of the Islamic calendar.

## Key Details
- **Quran**: The sacred scripture compiling revelations received by Muhammad over 23 years
- **Five Pillars of Islam**: Declaration of faith (shahada), prayer (salat), almsgiving (zakat), fasting (sawm), and pilgrimage (hajj)
- **622 CE Hijra**: Migration to Medina to escape persecution, founding the Islamic community
- **630 CE Conquest of Mecca**: Bloodless entry unifying the Arabian Peninsula
- **632 CE**: Muhammad's death, succeeded by the Caliphate system
- Within a century, Islamic rule expanded from the Iberian Peninsula to India

## Historical Significance
Islam has grown into the world's second-largest religion with approximately 1.9 billion adherents. Islamic civilization played an essential role in preserving and advancing human knowledge in mathematics, medicine, astronomy, and philosophy during the medieval period. Sharia (Islamic law) constitutes an independent legal system that continues to influence the laws of numerous nations.`,

  "십자군 전쟁 시작": `# 십자군 전쟁 시작

## 개요 (Overview)
1096년, 교황 우르바누스 2세의 클레르몽 공의회(1095년) 연설에 호응하여 서유럽 기독교도들이 성지 예루살렘을 이슬람 세력으로부터 탈환하기 위한 제1차 십자군 원정을 시작하였다. 이후 약 200년간(1096~1291년) 총 8차례의 공식 원정이 이어졌다.

## 주요 내용 (Key Details)
- **1095년 클레르몽 공의회**: 우르바누스 2세의 "신이 그것을 원하신다(Deus vult!)" 연설
- **제1차 십자군(1096~1099년)**: 예루살렘 점령 성공, 예루살렘 왕국 수립
- **제3차 십자군(1189~1192년)**: 살라딘 vs 사자심왕 리처드 1세의 대결
- **제4차 십자군(1202~1204년)**: 본래 목적에서 이탈, 기독교 도시 콘스탄티노플을 약탈
- 십자군 국가: 예루살렘 왕국, 트리폴리 백국, 안티오키아 공국, 에데사 백국
- **1291년 아크레 함락**으로 십자군 국가 완전 소멸

## 역사적 의의 (Historical Significance)
십자군 전쟁은 동서 문명의 대규모 접촉을 가져와 유럽에 이슬람 문명의 선진 기술(나침반, 제지술, 의학)과 학문(아리스토텔레스 철학의 재발견)을 전달하였다. 또한 원거리 무역의 확대로 이탈리아 도시국가들의 상업적 부흥을 촉진하여 르네상스의 경제적 기반을 마련하였다.

---

# Beginning of the Crusades

## Overview
In 1096, responding to Pope Urban II's call at the Council of Clermont (1095), Western European Christians launched the First Crusade to recapture the Holy City of Jerusalem from Islamic forces. Over the following two centuries (1096-1291), eight major crusading expeditions were undertaken.

## Key Details
- **Council of Clermont (1095)**: Urban II's rallying cry "Deus vult!" (God wills it)
- **First Crusade (1096-1099)**: Successfully captured Jerusalem; established the Kingdom of Jerusalem
- **Third Crusade (1189-1192)**: The legendary contest between Saladin and Richard I "the Lionheart"
- **Fourth Crusade (1202-1204)**: Diverted from its purpose to sack the Christian city of Constantinople
- Crusader states: Kingdom of Jerusalem, County of Tripoli, Principality of Antioch, County of Edessa
- **Fall of Acre (1291)**: Final elimination of all Crusader states

## Historical Significance
The Crusades facilitated large-scale contact between Eastern and Western civilizations, transmitting advanced Islamic technologies (compass, papermaking, medicine) and scholarship (the rediscovery of Aristotelian philosophy) to Europe. The expansion of long-distance trade spurred the commercial revival of Italian city-states, establishing the economic foundations for the Renaissance.`,

  "마그나 카르타 서명": `# 마그나 카르타 서명

## 개요 (Overview)
1215년 6월 15일, 영국의 존 왕(King John)이 런던 근교 러니미드(Runnymede)에서 반란 귀족들의 압력에 의해 대헌장(Magna Carta Libertatum)에 서명하였다. 총 63개 조항으로 구성된 이 문서는 왕권에 대한 최초의 체계적 법적 제한으로, 입헌주의와 법의 지배 원칙의 기원으로 평가된다.

## 주요 내용 (Key Details)
- **법의 지배(Rule of Law)**: 국왕도 법 아래에 있다는 원칙 확립
- **적법 절차(Due Process)**: 제39조 - "자유인은 합법적 재판 없이 체포-구금-추방당하지 않는다"
- **과세 동의권**: 제12조 - 왕은 귀족 회의(대평의회)의 동의 없이 세금을 부과할 수 없음
- **교회의 자유**: 제1조 - 국왕의 교회 간섭 제한
- **상업의 자유**: 상인의 자유로운 이동과 무역 보장
- **25인 귀족위원회**: 왕의 약속 이행을 감시하는 기구 설치

## 역사적 의의 (Historical Significance)
마그나 카르타는 비록 당시에는 봉건 귀족의 특권 보장 문서에 불과했으나, 후대에 보편적 인권과 법치주의의 상징으로 재해석되었다. 영국 권리장전(1689), 미국 독립선언(1776), 미국 수정헌법, 세계인권선언(1948)에 직접적 영향을 미쳤으며, 현대 입헌민주주의의 사상적 초석이다.

---

# Signing of the Magna Carta

## Overview
On June 15, 1215, King John of England signed the Magna Carta Libertatum (Great Charter of Liberties) at Runnymede, near London, under pressure from rebel barons. Comprising 63 clauses, this document represents the first systematic legal constraint on royal authority and is regarded as the origin of constitutionalism and the rule of law.

## Key Details
- **Rule of Law**: Established the principle that even the king is subject to the law
- **Due Process**: Clause 39 - "No free man shall be arrested, imprisoned, or exiled except by lawful judgment"
- **Consent to taxation**: Clause 12 - The king cannot levy taxes without the consent of the Great Council
- **Freedom of the Church**: Clause 1 - Limited royal interference in ecclesiastical affairs
- **Freedom of commerce**: Guaranteed merchants' freedom of movement and trade
- **Committee of 25 Barons**: Established to monitor royal compliance with the charter

## Historical Significance
Although originally a document securing feudal baronial privileges, the Magna Carta was subsequently reinterpreted as a symbol of universal human rights and the rule of law. It directly influenced the English Bill of Rights (1689), the American Declaration of Independence (1776), the U.S. Bill of Rights, and the Universal Declaration of Human Rights (1948), serving as the intellectual cornerstone of modern constitutional democracy.`,

  "몽골 제국 최대 판도": `# 몽골 제국 최대 판도

## 개요 (Overview)
1206년 테무진이 칭기즈 칸으로 추대된 이후, 몽골 제국은 급속히 팽창하여 1279년경 최대 영토에 도달하였다. 동유럽부터 한반도, 동남아시아 북부까지 약 3,300만 km2에 달하는 인류 역사상 최대의 연속 영토 제국으로, 전 세계 인구의 약 25%를 지배하였다.

## 주요 내용 (Key Details)
- **칭기즈 칸(1162~1227)**: 몽골 부족 통일 후 서하, 금, 호라즘 제국 정복
- **오고타이 칸(재위 1229~1241)**: 금나라 멸망, 유럽 원정(바투의 서정)
- **1241년 레그니차 전투**: 폴란드-독일 연합군 격파, 유럽에 충격
- **쿠빌라이 칸(재위 1260~1294)**: 원(元) 건국, 남송 멸망(1279)으로 중국 전역 통일
- **4대 칸국**: 원, 차가타이 칸국, 킵차크 칸국(골든 호르드), 일 칸국
- **역참제(얌, yam)**: 대륙 횡단 통신-교통 네트워크 구축
- **팍스 몽골리카(Pax Mongolica)**: 동서 교역로의 안전 보장, 실크로드 부활

## 역사적 의의 (Historical Significance)
몽골 제국은 동서 문명의 교류를 전례 없는 수준으로 촉진하였다. 마르코 폴로의 여행, 화약-나침반-인쇄술의 서전(西傳), 흑사병의 전파 등이 모두 몽골 제국의 교통망을 통해 이루어졌다. 또한 종교적 관용 정책과 능력 위주의 인재 등용은 제국 통치의 혁신적 모델이었다.

---

# Mongol Empire at Its Greatest Extent

## Overview
After Temujin was proclaimed Chinggis Khan in 1206, the Mongol Empire expanded rapidly, reaching its greatest territorial extent around 1279. Stretching from Eastern Europe to the Korean Peninsula and northern Southeast Asia, it encompassed approximately 33 million km2-the largest contiguous land empire in history-governing roughly 25% of the world's population.

## Key Details
- **Chinggis Khan (1162-1227)**: Unified Mongol tribes; conquered Western Xia, Jin dynasty, and Khwarezmian Empire
- **Ogedei Khan (r. 1229-1241)**: Destroyed the Jin dynasty; launched the European campaign (Batu's western expedition)
- **Battle of Legnica (1241)**: Defeated a combined Polish-German force, shocking Europe
- **Kublai Khan (r. 1260-1294)**: Founded the Yuan dynasty; unified all of China with the fall of the Southern Song (1279)
- **Four Khanates**: Yuan, Chagatai, Kipchak (Golden Horde), and Ilkhanate
- **Yam (relay post system)**: Established a transcontinental communication and transportation network
- **Pax Mongolica**: Ensured the safety of East-West trade routes, reviving the Silk Road

## Historical Significance
The Mongol Empire facilitated East-West civilizational exchange on an unprecedented scale. Marco Polo's travels, the westward transmission of gunpowder, the compass, and printing, and even the spread of the Black Death all occurred through Mongol transportation networks. The empire's policies of religious tolerance and meritocratic talent recruitment represented innovative models of imperial governance.`,

  "흑사병 유럽 대유행": `# 흑사병 유럽 대유행

## 개요 (Overview)
1347~1353년, 페스트균(Yersinia pestis)에 의한 대역병이 유럽 전역을 휩쓸어 유럽 인구의 약 1/3~1/2에 해당하는 2,500만~5,000만 명이 사망하였다. 중앙아시아에서 발원하여 실크로드와 해상 무역로를 따라 유럽에 전파된 것으로 추정된다.

## 주요 내용 (Key Details)
- **1347년 10월**: 제노바 상선이 시칠리아 메시나 항에 입항하며 유럽 전파 시작
- **전파 경로**: 이탈리아 -> 프랑스 -> 이베리아 반도 -> 영국 -> 북유럽 -> 동유럽
- **세 가지 형태**: 선(腺)페스트(림프절 종창), 폐페스트(호흡기 감염), 패혈증형 페스트
- 감염 후 치사율 약 60~90%, 폐페스트의 경우 거의 100%
- 의사들이 새 부리 모양 마스크를 착용 (향료를 채워 독기를 막으려 함)
- 유대인 학살, 편력 수도자(flagellant) 운동 등 사회적 혼란 심화
- 이후 14~17세기까지 반복적으로 재유행

## 역사적 의의 (Historical Significance)
흑사병은 유럽 사회 구조를 근본적으로 변혁시켰다. 극심한 노동력 부족으로 농노의 지위가 향상되고 봉건제가 약화되었으며, 임금 상승과 노동 조건 개선이 이루어졌다. 교회 권위의 실추, 죽음에 대한 새로운 예술적 표현(memento mori), 의학의 발전 등을 촉진하여 중세에서 근대로의 전환을 가속화하였다.

---

# The Black Death in Europe

## Overview
From 1347 to 1353, a devastating pandemic caused by Yersinia pestis swept across Europe, killing an estimated 25 to 50 million people-approximately one-third to one-half of Europe's population. The plague is believed to have originated in Central Asia and spread to Europe via Silk Road and maritime trade routes.

## Key Details
- **October 1347**: Genoese merchant ships arrived at the port of Messina in Sicily, initiating the European outbreak
- **Spread**: Italy -> France -> Iberian Peninsula -> England -> Northern Europe -> Eastern Europe
- **Three forms**: Bubonic plague (swollen lymph nodes), pneumonic plague (respiratory infection), and septicemic plague
- Mortality rate of 60-90% upon infection; nearly 100% for pneumonic plague
- Physicians wore beak-shaped masks filled with aromatic herbs to ward off miasma
- Social upheaval intensified: massacres of Jewish communities, flagellant movements
- Recurrent outbreaks continued from the 14th through 17th centuries

## Historical Significance
The Black Death fundamentally transformed European social structures. Acute labor shortages improved the status of serfs, weakened feudalism, and drove increases in wages and improvements in working conditions. The erosion of ecclesiastical authority, new artistic expressions of mortality (memento mori), and advances in medical knowledge collectively accelerated the transition from the medieval to the modern era.`,

  "구텐베르크 인쇄술 발명": `# 구텐베르크 인쇄술 발명

## 개요 (Overview)
1440년경, 독일 마인츠의 금세공사 요하네스 구텐베르크(Johannes Gutenberg, c. 1400~1468)가 가동 활자(movable type)를 이용한 인쇄기를 발명하였다. 1455년에는 이 기술로 최초의 대량 인쇄 서적인 '구텐베르크 성경(42행 성경)'을 출판하여, 지식의 대중화와 정보 혁명의 서막을 열었다.

## 주요 내용 (Key Details)
- **가동 금속 활자**: 납-주석-안티몬 합금으로 개별 활자를 주조하여 재사용 가능
- **인쇄기(press)**: 포도주 압착기에서 착안한 나사식 압착 인쇄기 개발
- **유성 잉크**: 기존 수성 잉크 대신 유성 잉크를 개발하여 금속 활자에 적합
- **구텐베르크 성경(1455)**: 약 180부 인쇄, 현존 48부 (종이본 36, 양피지본 12)
- 인쇄 비용: 필사본 대비 약 1/300 수준으로 절감
- 1500년까지 유럽 전역에 약 1,000개의 인쇄소 설립, 약 2,000만 권 출판

## 역사적 의의 (Historical Significance)
구텐베르크의 인쇄술은 인류 역사상 가장 중요한 기술 혁신 중 하나이다. 지식의 독점을 타파하고 교육의 대중화를 촉진하였으며, 마르틴 루터의 종교개혁(1517), 과학혁명, 계몽주의 등 근대 사회의 핵심적 변혁의 기술적 기반이 되었다. 현대의 인터넷 혁명에 비견되는 정보 혁명의 시발점이었다.

---

# Gutenberg's Invention of the Printing Press

## Overview
Around 1440, Johannes Gutenberg (c. 1400-1468), a goldsmith from Mainz, Germany, invented a printing press utilizing movable metal type. In 1455, he used this technology to produce the Gutenberg Bible (the 42-line Bible), the first major book printed in mass quantities, inaugurating the democratization of knowledge and an information revolution.

## Key Details
- **Movable metal type**: Individual characters cast from a lead-tin-antimony alloy, enabling reuse
- **Printing press**: A screw-press mechanism adapted from wine and olive presses
- **Oil-based ink**: Developed oil-based ink suitable for metal type, replacing water-based alternatives
- **Gutenberg Bible (1455)**: Approximately 180 copies printed; 48 survive today (36 on paper, 12 on vellum)
- Printing costs reduced to approximately 1/300th of manuscript copying
- By 1500, approximately 1,000 printing shops established across Europe, producing an estimated 20 million volumes

## Historical Significance
Gutenberg's printing press ranks among the most consequential technological innovations in human history. It broke the monopoly on knowledge, promoted mass education, and provided the technological foundation for Martin Luther's Reformation (1517), the Scientific Revolution, and the Enlightenment. It constituted the inception of an information revolution comparable to the modern Internet.`,

  "오스만 제국 콘스탄티노플 정복": `# 오스만 제국 콘스탄티노플 정복

## 개요 (Overview)
1453년 5월 29일, 오스만 제국의 술탄 메흐메트 2세(Mehmed II, '정복왕')가 약 8만 명의 대군과 거대 대포를 동원하여 비잔틴 제국의 수도 콘스탄티노플을 함락시켰다. 이로써 1,100년간 지속된 동로마(비잔틴) 제국이 멸망하고, 콘스탄티노플은 이스탄불로 개명되어 오스만 제국의 수도가 되었다.

## 주요 내용 (Key Details)
- **비잔틴 방어군**: 약 7,000명(콘스탄티노스 11세 팔레올로고스 황제 지휘)
- **오스만 공격군**: 약 80,000명 + 헝가리 기술자 우르반이 제작한 거대 대포(Urban's Bombard)
- **53일간의 포위전**: 4월 6일~5월 29일
- 테오도시우스 성벽(3중 성벽): 1,000년간 난공불락으로 간주되었으나 대포에 의해 붕괴
- 금각만 방어 쇠사슬을 우회하기 위해 함선을 육지로 끌어 이동하는 기발한 전술
- 마지막 황제 콘스탄티노스 11세는 최후의 전투에서 전사

## 역사적 의의 (Historical Significance)
콘스탄티노플 함락은 중세의 종말과 근세의 시작을 알리는 상징적 사건이다. 비잔틴 학자들의 서유럽 망명은 그리스 고전의 재발견을 촉진하여 르네상스에 기여하였다. 또한 동방 무역로의 차단은 유럽인들의 신항로 개척을 자극하여 대항해시대를 여는 간접적 계기가 되었다.

---

# Ottoman Conquest of Constantinople

## Overview
On May 29, 1453, Sultan Mehmed II ("the Conqueror") of the Ottoman Empire captured Constantinople, the capital of the Byzantine Empire, deploying approximately 80,000 troops and massive cannons. This ended 1,100 years of Eastern Roman (Byzantine) rule. Constantinople was renamed Istanbul and became the Ottoman capital.

## Key Details
- **Byzantine defenders**: Approximately 7,000 troops under Emperor Constantine XI Palaiologos
- **Ottoman forces**: Approximately 80,000 soldiers plus the enormous cannon (Urban's Bombard) built by the Hungarian engineer Urban
- **53-day siege**: April 6 to May 29
- The Theodosian Walls (triple fortification), considered impregnable for a millennium, were breached by cannon fire
- Ingenious tactic of dragging ships overland to bypass the defensive chain across the Golden Horn
- The last emperor, Constantine XI, died fighting in the final assault

## Historical Significance
The fall of Constantinople symbolizes the end of the medieval period and the beginning of the early modern era. The flight of Byzantine scholars to Western Europe stimulated the rediscovery of Greek classical texts, contributing to the Renaissance. The disruption of Eastern trade routes also spurred European exploration of new sea routes, indirectly inaugurating the Age of Discovery.`,

  "조선 건국": `# 조선 건국

## 개요 (Overview)
1392년 7월 17일, 고려의 무장 이성계(李成桂, 1335~1408)가 위화도 회군(1388)을 통해 실권을 장악한 뒤, 고려를 멸하고 조선(朝鮮)을 건국하였다. 한양(현재의 서울)을 수도로 정하고, 유교를 국가 이념으로 채택하여 약 518년간(1392~1910) 지속된 동아시아 최장수 왕조를 세웠다.

## 주요 내용 (Key Details)
- **위화도 회군(1388)**: 요동 정벌 명령을 거부하고 군대를 돌려 정변 성공
- **정도전(1342~1398)**: 조선 건국의 설계자, 조선경국전을 통해 유교적 국가 체제 구상
- **한양 천도(1394)**: 풍수지리에 따라 수도 선정, 경복궁 건설
- **과거제도**: 유교 경전 시험을 통한 관료 선발 체계 확립
- **세종대왕(재위 1418~1450)**: 훈민정음(한글) 창제(1443), 측우기 등 과학 발전
- **경국대전(1485)**: 조선의 기본 법전 완성
- 양반 관료제, 사림 정치, 붕당 정치 등 독특한 정치 문화 발전

## 역사적 의의 (Historical Significance)
조선은 유교적 이상을 국가 운영에 가장 체계적으로 적용한 왕조로, 한국 문화-사회-법제의 근간을 형성하였다. 한글 창제는 세계 문자 역사상 가장 과학적인 문자 발명으로 평가되며, 조선의 유교적 법치 전통은 현대 한국 법문화에도 깊은 영향을 미치고 있다.

---

# Founding of the Joseon Dynasty

## Overview
On July 17, 1392, the Goryeo general Yi Seong-gye (1335-1408), having seized power through the Wihwado Retreat (1388), abolished the Goryeo dynasty and founded Joseon. He established Hanyang (present-day Seoul) as the capital and adopted Confucianism as the state ideology, creating the longest-lasting dynasty in East Asian history, enduring approximately 518 years (1392-1910).

## Key Details
- **Wihwado Retreat (1388)**: Defied orders to invade Liaodong, turning his army back in a successful coup
- **Jeong Do-jeon (1342-1398)**: Chief architect of the Joseon state; envisioned a Confucian governance system in the Joseon Gyeonggukjeon
- **Transfer of capital to Hanyang (1394)**: Selected according to geomantic principles; Gyeongbokgung Palace constructed
- **Civil service examination system**: Established meritocratic bureaucratic recruitment based on Confucian classics
- **King Sejong the Great (r. 1418-1450)**: Invented Hangul (1443); advanced scientific instruments including the rain gauge
- **Gyeongguk Daejeon (1485)**: Completion of Joseon's comprehensive legal code
- Distinctive political culture: yangban bureaucracy, sarim politics, factional politics

## Historical Significance
Joseon was the dynasty that most systematically applied Confucian ideals to state governance, forming the foundation of Korean culture, society, and legal institutions. The creation of Hangul is regarded as the most scientifically designed writing system in world history. Joseon's Confucian tradition of rule by law continues to deeply influence modern Korean legal culture.`,

  "콜럼버스 신대륙 발견": `# 콜럼버스 신대륙 발견

## 개요 (Overview)
1492년 10월 12일, 제노바 출신의 탐험가 크리스토퍼 콜럼버스(Christopher Columbus, 1451~1506)가 스페인 이사벨라 1세 여왕의 후원으로 3척의 범선(산타마리아, 니냐, 핀타)을 이끌고 대서양을 횡단하여 바하마 제도의 산살바도르 섬에 도착하였다.

## 주요 내용 (Key Details)
- **출발**: 1492년 8월 3일 스페인 팔로스 항 출항
- **항해**: 약 70일간의 대서양 횡단
- **도착**: 10월 12일 바하마 제도 산살바도르(과나하니) 섬
- 총 4차례 항해(1492, 1493, 1498, 1502) 수행
- 콜럼버스는 죽을 때까지 자신이 아시아에 도착했다고 믿었음
- 아메리고 베스푸치(Amerigo Vespucci)가 신대륙임을 확인, '아메리카' 명칭의 유래
- **콜럼버스 교환(Columbian Exchange)**: 구대륙과 신대륙 간 동식물, 질병, 문화의 교류

## 역사적 의의 (Historical Significance)
콜럼버스의 항해는 대항해시대를 본격화하고, 유럽-아메리카-아프리카를 연결하는 전 지구적 교역 네트워크를 형성하였다. 그러나 동시에 원주민 인구의 90% 이상이 전염병과 식민 폭력으로 사멸하는 비극을 초래하였으며, 대서양 노예무역의 시작이라는 어두운 유산도 남겼다.

---

# Columbus's Discovery of the New World

## Overview
On October 12, 1492, the Genoese explorer Christopher Columbus (1451-1506), sponsored by Queen Isabella I of Spain, crossed the Atlantic Ocean with three ships (Santa Maria, Nina, and Pinta) and reached San Salvador Island in the Bahamas.

## Key Details
- **Departure**: August 3, 1492, from Palos de la Frontera, Spain
- **Voyage**: Approximately 70 days crossing the Atlantic
- **Arrival**: October 12, San Salvador (Guanahani) Island, Bahamas
- Conducted four voyages in total (1492, 1493, 1498, 1502)
- Columbus believed until his death that he had reached Asia
- Amerigo Vespucci confirmed it was a "New World," giving rise to the name "America"
- **Columbian Exchange**: Transfer of plants, animals, diseases, and cultures between the Old and New Worlds

## Historical Significance
Columbus's voyage inaugurated the Age of Exploration in earnest and established a global trade network linking Europe, the Americas, and Africa. However, it also precipitated the catastrophic loss of over 90% of Indigenous populations through epidemic disease and colonial violence, and initiated the Atlantic slave trade-a dark legacy that continues to shape contemporary discourse.`,

  "마르틴 루터 종교개혁": `# 마르틴 루터 종교개혁

## 개요 (Overview)
1517년 10월 31일, 독일의 아우구스티누스 수도회 신부이자 비텐베르크 대학 교수였던 마르틴 루터(Martin Luther, 1483~1546)가 로마 가톨릭 교회의 면죄부(indulgence) 판매에 항의하여 비텐베르크 성(城)교회 정문에 95개조 논제(95 Theses)를 게시하였다.

## 주요 내용 (Key Details)
- **면죄부 비판**: "돈이 헌금함에 떨어지는 순간 영혼이 연옥에서 나온다"는 주장 반박
- **오직 믿음(Sola Fide)**: 구원은 선행이 아닌 오직 믿음으로만 가능
- **오직 성경(Sola Scriptura)**: 교황의 권위가 아닌 성경만이 최종 권위
- **만인 사제주의**: 모든 신자가 하느님 앞에 평등한 사제
- **1521년 보름스 제국의회**: 루터의 소환과 "나는 여기 서 있다(Here I stand)" 선언
- **성경 독일어 번역(1522~1534)**: 독일어의 표준화와 대중의 성경 접근권 확보
- 이후 칼뱅주의, 성공회 등 다양한 개신교 교파로 분화

## 역사적 의의 (Historical Significance)
종교개혁은 유럽의 종교적 통일을 깨뜨리고 개인의 양심과 종교적 자유라는 근대적 가치의 출발점이 되었다. 또한 국민국가의 형성, 정교분리(政敎分離) 원칙, 자본주의 윤리(막스 베버의 '프로테스탄트 윤리') 등 근대 서양 문명의 핵심 요소에 깊은 영향을 미쳤다.

---

# Martin Luther's Protestant Reformation

## Overview
On October 31, 1517, Martin Luther (1483-1546), an Augustinian friar and professor at the University of Wittenberg, posted his 95 Theses on the door of the Castle Church in Wittenberg, protesting the Roman Catholic Church's sale of indulgences.

## Key Details
- **Critique of indulgences**: Refuted the claim that "as soon as the coin in the coffer rings, the soul from purgatory springs"
- **Sola Fide (Faith Alone)**: Salvation attainable through faith alone, not through works
- **Sola Scriptura (Scripture Alone)**: The Bible, not papal authority, as the ultimate source of authority
- **Priesthood of all believers**: All Christians are equal priests before God
- **Diet of Worms (1521)**: Luther's summons and declaration "Here I stand, I can do no other"
- **German Bible translation (1522-1534)**: Standardized the German language and democratized access to Scripture
- Subsequently diversified into Calvinism, Anglicanism, and other Protestant denominations

## Historical Significance
The Reformation shattered Europe's religious unity and inaugurated the modern values of individual conscience and religious freedom. It profoundly influenced the formation of nation-states, the principle of separation of church and state, and capitalist ethics (Max Weber's "Protestant Ethic"), all of which became core elements of modern Western civilization.`,

  "임진왜란 발발": `# 임진왜란 발발

## 개요 (Overview)
1592년 4월 13일, 일본의 도요토미 히데요시(豊臣秀吉)가 약 15만 8,000명의 대군을 이끌고 조선을 침략하였다(임진왜란). 전쟁은 1598년 히데요시의 사망까지 약 7년간(정유재란 포함) 지속되었으며, 조선-명-일본 3국의 운명을 결정지은 동아시아 최대의 국제전이었다.

## 주요 내용 (Key Details)
- **부산 상륙(1592.4.13)**: 고니시 유키나가 부대 선봉, 20일 만에 한양 함락
- **이순신 장군의 해전**: 한산도 대첩(1592.7), 명량 해전(1597.10) 등 23전 23승
- **거북선(龜船)**: 세계 최초의 철갑선으로 평가되는 돌격용 전선
- **의병 활동**: 곽재우, 조헌, 고경명 등 민간 의병장들의 저항
- **명나라 참전**: 이여송이 이끄는 약 4만 명의 원군 파견
- **정유재란(1597~1598)**: 히데요시의 재침, 노량 해전에서 이순신 전사
- 전후 조선 인구 약 30% 감소, 국토 황폐화

## 역사적 의의 (Historical Significance)
임진왜란은 동아시아 국제 질서를 재편한 대전쟁이었다. 조선은 막대한 피해를 입었으나 이순신의 해상 지배와 의병의 저항으로 국가를 보존하였다. 이순신은 한국 역사상 가장 존경받는 인물 중 하나이며, 임진왜란의 경험은 이후 조선의 국방 정책과 대일 외교에 결정적 영향을 미쳤다.

---

# Outbreak of the Imjin War (Japanese Invasion of Korea)

## Overview
On April 13, 1592, Toyotomi Hideyoshi of Japan launched an invasion of Joseon Korea with approximately 158,000 troops (Imjin Waeran). The conflict lasted approximately seven years (including the Jeongyu Jaeran of 1597) until Hideyoshi's death in 1598, constituting the largest international war in East Asian history, determining the fates of Joseon, Ming China, and Japan.

## Key Details
- **Landing at Busan (April 13, 1592)**: Konishi Yukinaga's vanguard; Seoul fell within 20 days
- **Admiral Yi Sun-sin's naval victories**: Battle of Hansan Island (July 1592), Battle of Myeongnyang (October 1597)-23 battles, 23 victories
- **Geobukseon (Turtle Ship)**: Considered the world's first ironclad warship, used for ramming attacks
- **Righteous army (uibyeong) resistance**: Civilian militia leaders including Gwak Jae-u, Jo Heon, and Go Gyeong-myeong
- **Ming Chinese intervention**: Approximately 40,000 reinforcements led by Li Rusong
- **Jeongyu Jaeran (1597-1598)**: Second invasion; Admiral Yi killed at the Battle of Noryang
- Post-war Joseon population declined by approximately 30%; widespread devastation

## Historical Significance
The Imjin War reshaped the East Asian international order. Although Joseon suffered catastrophic damage, Admiral Yi's naval supremacy and the righteous armies' resistance preserved the nation. Yi Sun-sin remains one of the most revered figures in Korean history, and the wartime experience decisively influenced Joseon's subsequent defense policy and diplomatic relations with Japan.`,

  "웨스트팔리아 조약": `# 웨스트팔리아 조약

## 개요 (Overview)
1648년 10월 24일, 30년 전쟁(1618~1648)을 종결시킨 두 개의 조약 - 뮌스터 조약과 오스나브뤼크 조약 - 이 체결되었다. 이 조약은 근대 국제법의 기원이자 주권국가 체제(Westphalian system)의 출발점으로, 국제관계학의 가장 중요한 이정표로 평가된다.

## 주요 내용 (Key Details)
- **주권 평등의 원칙**: 모든 국가는 영토 내에서 배타적 주권을 행사
- **내정 불간섭 원칙**: 타국의 내부 문제에 간섭하지 않을 의무
- **종교적 관용**: "영주의 종교가 그 영지의 종교(cuius regio, eius religio)" 원칙 재확인 및 확대
- 신성로마제국의 실질적 해체: 약 300개 독립 영방국가 인정
- 스위스와 네덜란드의 독립 공식 승인
- 프랑스와 스웨덴의 유럽 강대국으로서의 지위 확인
- 교황의 국제 정치적 권위 실질적 소멸

## 역사적 의의 (Historical Significance)
웨스트팔리아 조약은 중세적 보편 제국(신성로마제국)과 보편 교회(교황권)의 시대를 종결하고, 주권국가를 기본 단위로 하는 근대 국제 질서를 확립하였다. 오늘날 국제법의 기본 원리인 주권 평등, 내정 불간섭, 외교적 대등성의 원칙은 모두 이 조약에서 기원한다.

---

# Treaty of Westphalia

## Overview
On October 24, 1648, two treaties-the Treaty of Munster and the Treaty of Osnabruck-were signed, ending the Thirty Years' War (1618-1648). These treaties are recognized as the origin of modern international law and the starting point of the sovereign state system (Westphalian system), constituting the most important milestone in the study of international relations.

## Key Details
- **Principle of sovereign equality**: Each state exercises exclusive sovereignty within its territory
- **Non-intervention**: Obligation not to interfere in other states' internal affairs
- **Religious tolerance**: Reaffirmation and expansion of "cuius regio, eius religio" (whose realm, his religion)
- De facto dissolution of the Holy Roman Empire: recognition of approximately 300 independent territorial states
- Formal recognition of Swiss and Dutch independence
- Confirmation of France and Sweden as major European powers
- Effective elimination of papal authority in international politics

## Historical Significance
The Treaty of Westphalia ended the era of medieval universal empire (Holy Roman Empire) and universal church (papal authority), establishing the modern international order based on sovereign states as fundamental units. The foundational principles of contemporary international law-sovereign equality, non-intervention, and diplomatic reciprocity-all originate from this treaty.`,

  "뉴턴 프린키피아 출판": `# 뉴턴 프린키피아 출판

## 개요 (Overview)
1687년 7월 5일, 영국의 과학자 아이작 뉴턴(Isaac Newton, 1643~1727)이 자연철학의 수학적 원리(Philosophiae Naturalis Principia Mathematica)를 출판하였다. 이 저작은 만유인력의 법칙과 운동의 3법칙을 체계적으로 기술하여 근대 물리학의 기초를 놓았다.

## 주요 내용 (Key Details)
- **운동 제1법칙(관성의 법칙)**: 외력이 작용하지 않으면 물체는 정지 또는 등속직선운동 유지
- **운동 제2법칙(가속도의 법칙)**: F = ma
- **운동 제3법칙(작용-반작용의 법칙)**: 모든 작용에는 크기가 같고 방향이 반대인 반작용
- **만유인력의 법칙**: 모든 물체는 질량에 비례하고 거리의 제곱에 반비례하는 힘으로 끌어당김
- 에드먼드 핼리의 재정 지원으로 출판 가능
- 행성 운동, 조석, 혜성 궤도 등을 통일적으로 설명

## 역사적 의의 (Historical Significance)
프린키피아는 과학혁명의 정점이자, 수학적 법칙으로 자연 현상을 설명하는 근대 과학의 방법론을 확립한 기념비적 저작이다. 계몽주의 사상에 결정적 영향을 미쳤으며, 이후 아인슈타인의 상대성 이론이 나오기까지 200여 년간 물리학의 절대적 기준이 되었다.

---

# Publication of Newton's Principia

## Overview
On July 5, 1687, the English scientist Isaac Newton (1643-1727) published Philosophiae Naturalis Principia Mathematica. This work systematically described the law of universal gravitation and the three laws of motion, establishing the foundations of modern physics.

## Key Details
- **First Law (Inertia)**: An object at rest stays at rest, and an object in motion stays in uniform motion, unless acted upon by an external force
- **Second Law (Acceleration)**: F = ma
- **Third Law (Action-Reaction)**: Every action has an equal and opposite reaction
- **Law of Universal Gravitation**: Every body attracts every other body with a force proportional to their masses and inversely proportional to the square of their distance
- Published with financial support from Edmond Halley
- Unified explanation of planetary motion, tides, and cometary orbits

## Historical Significance
The Principia stands as the pinnacle of the Scientific Revolution and the monumental work that established the methodology of modern science-explaining natural phenomena through mathematical laws. It decisively influenced Enlightenment thought and remained the absolute standard in physics for over 200 years until Einstein's theory of relativity.`,

  "미국 독립선언": `# 미국 독립선언

## 개요 (Overview)
1776년 7월 4일, 북아메리카 13개 식민지 대표들이 필라델피아에서 열린 대륙회의(Continental Congress)에서 영국으로부터의 독립을 선언하는 문서를 채택하였다. 토머스 제퍼슨(Thomas Jefferson)이 주로 기초한 이 선언문은 천부인권과 인민주권, 혁명권을 명시한 역사적 문서이다.

## 주요 내용 (Key Details)
- **"모든 사람은 평등하게 태어났다(All men are created equal)"**: 핵심 선언
- **천부인권**: 생명, 자유, 행복 추구의 권리는 양도할 수 없는 자연권
- **인민주권**: 정부의 정당한 권력은 피통치자의 동의로부터 나온다
- **혁명권**: 정부가 이러한 권리를 침해할 때 인민은 정부를 변혁할 권리가 있다
- **서명자 56명**: 벤저민 프랭클린, 존 애덤스, 존 핸콕 등
- 영국 왕 조지 3세의 27가지 폭정을 열거
- 존 로크(John Locke)의 자연권 사상에 직접적 영향을 받음

## 역사적 의의 (Historical Significance)
미국 독립선언은 근대 민주주의의 이론적 기초를 실천적 문서로 구현한 최초의 사례이다. 프랑스 인권선언(1789), 라틴아메리카 독립운동, 세계인권선언(1948) 등에 직접적 영향을 미쳤으며, 오늘날까지 전 세계 민주주의 운동의 사상적 원천이 되고 있다.

---

# American Declaration of Independence

## Overview
On July 4, 1776, representatives of the thirteen North American colonies adopted a declaration of independence from Great Britain at the Continental Congress in Philadelphia. Primarily drafted by Thomas Jefferson, this historic document articulated the principles of natural rights, popular sovereignty, and the right of revolution.

## Key Details
- **"All men are created equal"**: The declaration's central proposition
- **Natural rights**: The inalienable rights to life, liberty, and the pursuit of happiness
- **Popular sovereignty**: The just powers of government derive from the consent of the governed
- **Right of revolution**: The people have the right to alter or abolish any government that violates these rights
- **56 signatories**: Including Benjamin Franklin, John Adams, and John Hancock
- Enumerated 27 grievances against King George III
- Directly influenced by John Locke's natural rights philosophy

## Historical Significance
The American Declaration of Independence was the first practical document to embody the theoretical foundations of modern democracy. It directly influenced the French Declaration of the Rights of Man (1789), Latin American independence movements, and the Universal Declaration of Human Rights (1948), and continues to serve as an intellectual wellspring for democratic movements worldwide.`,

  "프랑스 대혁명": `# 프랑스 대혁명

## 개요 (Overview)
1789년 7월 14일, 파리 시민들이 바스티유 감옥을 습격하면서 프랑스 대혁명이 본격적으로 시작되었다. 절대왕정과 봉건적 특권 체제를 무너뜨리고 '자유, 평등, 박애(Liberte, Egalite, Fraternite)'의 이념을 내세운 이 혁명은 세계 역사의 가장 중대한 전환점 중 하나이다.

## 주요 내용 (Key Details)
- **삼부회 소집(1789.5.5)**: 루이 16세의 재정 위기로 175년 만에 소집
- **테니스코트 서약(1789.6.20)**: 제3신분 대표들이 헌법 제정을 서약
- **바스티유 습격(1789.7.14)**: 혁명의 상징적 시작
- **인간과 시민의 권리선언(1789.8.26)**: "인간은 자유롭고 평등한 권리를 가지고 태어난다"
- **루이 16세 처형(1793.1.21)**: 기요틴에 의한 국왕 처형
- **공포정치(1793~1794)**: 로베스피에르 주도, 약 16,000~40,000명 처형
- **나폴레옹의 등장(1799)**: 쿠데타로 통령정부 수립, 혁명의 종결

## 역사적 의의 (Historical Significance)
프랑스 대혁명은 봉건제와 절대왕정을 종식시키고, 시민권-인권-민주주의의 보편적 이념을 확립하였다. 인간과 시민의 권리선언은 세계인권선언의 직접적 선구이며, 혁명이 제시한 국민주권, 법 앞의 평등, 권력분립의 원칙은 전 세계 헌법의 기본 원리가 되었다.

---

# French Revolution

## Overview
On July 14, 1789, Parisian citizens stormed the Bastille prison, marking the dramatic beginning of the French Revolution. Overthrowing absolute monarchy and the feudal privilege system under the banner of "Liberte, Egalite, Fraternite" (Liberty, Equality, Fraternity), this revolution constitutes one of the most consequential turning points in world history.

## Key Details
- **Estates-General convened (May 5, 1789)**: Called by Louis XVI amid fiscal crisis, the first session in 175 years
- **Tennis Court Oath (June 20, 1789)**: Third Estate representatives swore to draft a constitution
- **Storming of the Bastille (July 14, 1789)**: Symbolic beginning of the revolution
- **Declaration of the Rights of Man and of the Citizen (August 26, 1789)**: "Men are born and remain free and equal in rights"
- **Execution of Louis XVI (January 21, 1793)**: The king guillotined
- **Reign of Terror (1793-1794)**: Led by Robespierre; approximately 16,000-40,000 executed
- **Rise of Napoleon (1799)**: Seized power by coup, effectively ending the revolution

## Historical Significance
The French Revolution ended feudalism and absolute monarchy, establishing the universal ideals of civil rights, human rights, and democracy. The Declaration of the Rights of Man directly prefigured the Universal Declaration of Human Rights. The revolutionary principles of popular sovereignty, equality before the law, and separation of powers became foundational to constitutions worldwide.`,

  "나폴레옹 법전 공포": `# 나폴레옹 법전 공포

## 개요 (Overview)
1804년 3월 21일, 나폴레옹 보나파르트(Napoleon Bonaparte, 1769~1821)가 제정한 프랑스 민법전이 공포되었다. 정식 명칭은 "프랑스인의 민법전(Code civil des Francais)"으로, 혁명의 이념을 법적으로 제도화한 근대 민법의 전범(典範)이다.

## 주요 내용 (Key Details)
- **3대 원칙**: (1) 소유권 절대의 원칙 (2) 계약자유의 원칙 (3) 과실책임의 원칙
- 총 **2,281개 조문**으로 구성
- 제1편: 인(人)에 관한 법 - 신분법, 혼인, 이혼, 친자관계
- 제2편: 재산 및 소유권 - 물권법
- 제3편: 소유권 취득 방법 - 채권법, 상속법, 계약법
- 봉건적 신분 차별 폐지, 법 앞의 평등 실현
- 종교적 관용: 시민법(civil law)과 교회법(canon law)의 분리
- 나폴레옹 본인이 초안 검토 회의에 57회 중 36회 직접 참석

## 역사적 의의 (Historical Significance)
나폴레옹 법전은 프랑스를 넘어 벨기에, 이탈리아, 네덜란드, 스페인, 라틴아메리카, 이집트, 일본 등 전 세계 법체계에 지대한 영향을 미쳤다. 독일 민법전(BGB)과 일본 민법전을 거쳐 대한민국 민법에도 간접적으로 계수되었으며, 근대 사법(私法) 체계의 기초를 확립한 인류 법제사의 기념비적 업적이다.

---

# Promulgation of the Napoleonic Code

## Overview
On March 21, 1804, the French Civil Code, enacted by Napoleon Bonaparte (1769-1821), was officially promulgated. Formally titled "Code civil des Francais," it legally institutionalized the ideals of the Revolution and became the paradigm of modern civil law.

## Key Details
- **Three fundamental principles**: (1) Absolute right of property (2) Freedom of contract (3) Fault-based liability
- Comprises **2,281 articles** in total
- Book I: Persons - status law, marriage, divorce, filiation
- Book II: Property and ownership - property law
- Book III: Modes of acquiring property - obligations, inheritance, contracts
- Abolished feudal status distinctions; realized equality before the law
- Religious tolerance: separation of civil law from canon law
- Napoleon personally attended 36 of 57 drafting sessions

## Historical Significance
The Napoleonic Code influenced legal systems far beyond France-in Belgium, Italy, the Netherlands, Spain, Latin America, Egypt, Japan, and many other jurisdictions. Through the German Civil Code (BGB) and the Japanese Civil Code, it was indirectly received into the Civil Code of the Republic of Korea. It stands as a monumental achievement in legal history, establishing the foundations of the modern private law system.`,

  "산업혁명 절정기": `# 산업혁명 절정기

## 개요 (Overview)
1760년대에 영국에서 시작된 산업혁명은 1830년대에 절정기에 도달하여 유럽 전역과 북미로 확산되었다. 증기기관의 발전, 공장제 생산 방식의 확립, 철도 건설 붐이 맞물려 인류 생산력과 생활 방식의 근본적 변혁이 이루어졌다.

## 주요 내용 (Key Details)
- **제임스 와트의 증기기관 개량(1769)**: 산업혁명의 핵심 동력
- **방적기 발명**: 제니 방적기(1764), 수력 방적기(1769), 뮬 방적기(1779)
- **공장제 생산**: 가내수공업에서 대규모 기계화 공장으로의 전환
- **리버풀-맨체스터 철도 개통(1830)**: 최초의 도시 간 여객 철도
- **인구의 도시 집중**: 1800년 영국 도시 인구 20% -> 1850년 50% 초과
- 아동 노동, 장시간 노동, 열악한 주거환경 등 사회 문제 심화
- **공장법(Factory Act, 1833)**: 아동 노동 규제 등 최초의 노동 입법

## 역사적 의의 (Historical Significance)
산업혁명은 농업 중심 사회에서 산업 중심 사회로의 전환이라는 인류 역사상 가장 근본적인 경제적-사회적 변혁이었다. 자본주의 경제 체제의 확립, 노동자 계급의 형성, 사회주의 사상의 출현, 근대적 노동법과 사회복지 제도의 기원이 모두 이 시기에 뿌리를 두고 있다.

---

# Peak of the Industrial Revolution

## Overview
The Industrial Revolution, which began in Britain in the 1760s, reached its peak in the 1830s and spread across continental Europe and North America. The convergence of steam power advancement, the factory system, and the railway construction boom produced a fundamental transformation in human productivity and modes of living.

## Key Details
- **James Watt's improved steam engine (1769)**: The central driving force of the Industrial Revolution
- **Spinning machine inventions**: Spinning Jenny (1764), Water Frame (1769), Spinning Mule (1779)
- **Factory system**: Transition from cottage industry to large-scale mechanized factory production
- **Liverpool-Manchester Railway (1830)**: The first intercity passenger railway
- **Urbanization**: Britain's urban population grew from 20% in 1800 to over 50% by 1850
- Social problems intensified: child labor, excessive working hours, squalid housing
- **Factory Act (1833)**: First labor legislation regulating child labor

## Historical Significance
The Industrial Revolution was the most fundamental economic and social transformation in human history-the shift from an agrarian to an industrial society. The establishment of the capitalist economic system, the formation of the working class, the emergence of socialist thought, and the origins of modern labor law and social welfare all trace their roots to this period.`,

  "아편전쟁": `# 아편전쟁

## 개요 (Overview)
1840~1842년, 영국과 청(淸)나라 사이에 벌어진 전쟁으로, 영국의 아편 무역 강요와 청의 아편 금지 정책 간의 충돌이 원인이었다. 영국의 압도적 군사력 앞에 패배한 청은 난징 조약(1842)을 체결하여 홍콩 할양, 5개 항구 개방, 거액의 배상금 지불 등을 수용해야 했다.

## 주요 내용 (Key Details)
- **배경**: 영국의 대중국 무역 적자 해소를 위한 아편 수출 확대
- **임칙서의 아편 몰수(1839)**: 광저우에서 영국 상인의 아편 2만여 상자 몰수-폐기
- **영국 함대 파견(1840.6)**: 약 4,000명의 원정군, 48척의 함선
- **난징 조약(1842.8.29)**: 중국 최초의 불평등 조약
  - 홍콩 할양 (1997년까지 155년간 영국 통치)
  - 상하이 등 5개 항구 개방
  - 2,100만 달러 배상금 지불
  - 치외법권, 최혜국대우 조항
- 이후 제2차 아편전쟁(1856~1860) 발발

## 역사적 의의 (Historical Significance)
아편전쟁은 중국의 '백년국치(百年國恥)'의 시작으로, 중화 중심의 세계관이 붕괴하고 서구 제국주의 침탈이 본격화된 전환점이었다. 불평등 조약 체제는 이후 일본, 조선 등 동아시아 전역으로 확대되어 근대 동아시아 역사의 비극적 출발점이 되었다.

---

# The Opium Wars

## Overview
From 1840 to 1842, war erupted between Great Britain and the Qing dynasty, triggered by the conflict between Britain's insistence on opium trade and China's prohibition policy. Defeated by Britain's overwhelming military superiority, the Qing signed the Treaty of Nanking (1842), ceding Hong Kong, opening five ports, and paying substantial indemnities.

## Key Details
- **Background**: Britain's expansion of opium exports to offset its trade deficit with China
- **Lin Zexu's opium confiscation (1839)**: Seized and destroyed over 20,000 chests of British opium in Guangzhou
- **British expedition (June 1840)**: Approximately 4,000 troops and 48 warships
- **Treaty of Nanking (August 29, 1842)**: China's first unequal treaty
  - Cession of Hong Kong (under British rule for 155 years until 1997)
  - Opening of five treaty ports including Shanghai
  - Indemnity of 21 million silver dollars
  - Extraterritoriality and most-favored-nation clauses
- The Second Opium War followed (1856-1860)

## Historical Significance
The Opium Wars marked the beginning of China's "Century of Humiliation," the collapse of the Sinocentric worldview, and the onset of full-scale Western imperialist encroachment. The unequal treaty system subsequently spread to Japan, Korea, and throughout East Asia, constituting the tragic starting point of modern East Asian history.`,

  "미국 남북전쟁": `# 미국 남북전쟁

## 개요 (Overview)
1861년 4월 12일부터 1865년 4월 9일까지, 미국 북부의 연방(Union)과 남부의 남부연합(Confederacy) 간에 벌어진 내전이다. 노예제도의 존폐를 둘러싼 갈등이 직접적 원인이었으며, 약 62만~75만 명이 사망한 미국 역사상 가장 참혹한 전쟁이다.

## 주요 내용 (Key Details)
- **섬터 요새 공격(1861.4.12)**: 남군의 선제공격으로 전쟁 시작
- **노예해방선언(1863.1.1)**: 링컨 대통령의 반란 지역 노예 해방 포고
- **게티즈버그 전투(1863.7)**: 전쟁의 전환점, 양측 합계 약 5만 명 사상
- **게티즈버그 연설(1863.11.19)**: "인민의, 인민에 의한, 인민을 위한 정부"
- **애포매톡스 항복(1865.4.9)**: 남군 총사령관 리 장군의 항복
- **링컨 암살(1865.4.14)**: 존 윌크스 부스에 의해 포드 극장에서 피살
- **수정헌법 제13조(1865)**: 노예제도 공식 폐지

## 역사적 의의 (Historical Significance)
남북전쟁은 노예제도를 폐지하고 연방의 통합을 유지함으로써 미국을 근대 국민국가로 재탄생시켰다. 그러나 이후 재건 시대(Reconstruction)의 실패와 짐 크로 법(Jim Crow laws)으로 실질적인 인종 평등은 100년 이상 지연되었으며, 인종 문제는 오늘날까지 미국 사회의 핵심 과제로 남아 있다.

---

# American Civil War

## Overview
From April 12, 1861, to April 9, 1865, the United States was engulfed in a civil war between the northern Union and the southern Confederacy. The immediate cause was the conflict over the preservation or abolition of slavery. With approximately 620,000 to 750,000 deaths, it remains the deadliest war in American history.

## Key Details
- **Attack on Fort Sumter (April 12, 1861)**: Confederate forces initiated hostilities
- **Emancipation Proclamation (January 1, 1863)**: President Lincoln declared slaves in rebel territories free
- **Battle of Gettysburg (July 1863)**: Turning point of the war; approximately 50,000 combined casualties
- **Gettysburg Address (November 19, 1863)**: "Government of the people, by the people, for the people"
- **Appomattox surrender (April 9, 1865)**: Confederate General Lee's surrender
- **Assassination of Lincoln (April 14, 1865)**: Shot by John Wilkes Booth at Ford's Theatre
- **13th Amendment (1865)**: Formal abolition of slavery

## Historical Significance
The Civil War abolished slavery and preserved the Union, effectively refounding the United States as a modern nation-state. However, the failure of Reconstruction and the subsequent Jim Crow laws delayed substantive racial equality for over a century. The question of race remains a central challenge in American society to this day.`,

  "메이지 유신": `# 메이지 유신

## 개요 (Overview)
1868년, 일본에서 약 260년간 지속된 도쿠가와 막부(에도 막부) 체제가 붕괴하고, 메이지 천황(明治天皇) 중심의 근대화 개혁이 시작되었다. '왕정복고(王政復古)'를 표방한 이 정변은 일본을 봉건 사회에서 근대 산업국가로 탈바꿈시킨 동아시아 최초의 성공적인 근대화 혁명이었다.

## 주요 내용 (Key Details)
- **왕정복고 선언(1868.1.3)**: 도쿠가와 쇼군의 관직과 영지 반환 명령
- **보신전쟁(1868~1869)**: 신정부군과 구막부군 간의 내전
- **판적봉환-폐번치현(1871)**: 번(藩)을 폐지하고 현(県)을 설치, 중앙집권화
- **사민평등**: 신분제 폐지, 사농공상(士農工商)의 구분 철폐
- **징병령(1873)**: 국민개병제 실시
- **메이지 헌법(1889)**: 독일(프로이센) 헌법을 모델로 한 아시아 최초의 근대 헌법
- **서구식 법제도 도입**: 형법(프랑스 모델), 민법(독일 모델) 제정

## 역사적 의의 (Historical Significance)
메이지 유신은 비서구 국가가 서구적 근대화를 자주적으로 달성한 최초이자 가장 성공적인 사례이다. 그러나 급속한 군사력 증강은 이후 청일전쟁(1894), 러일전쟁(1904), 한일합방(1910) 등 제국주의적 팽창으로 이어졌으며, 이는 동아시아 근현대사의 비극적 전개의 주요 원인이 되었다.

---

# Meiji Restoration

## Overview
In 1868, the Tokugawa shogunate (Edo bakufu), which had governed Japan for approximately 260 years, collapsed, and modernizing reforms were initiated under Emperor Meiji. Proclaimed as a "restoration of imperial rule," this political transformation was East Asia's first successful modernization revolution, converting Japan from a feudal society into a modern industrial nation.

## Key Details
- **Restoration of Imperial Rule (January 3, 1868)**: Tokugawa shogun ordered to surrender offices and lands
- **Boshin War (1868-1869)**: Civil war between the new imperial government and pro-shogunate forces
- **Abolition of domains, establishment of prefectures (1871)**: Centralization of governance
- **Social equality**: Abolition of the feudal status system (samurai, farmer, artisan, merchant)
- **Conscription ordinance (1873)**: Universal military service
- **Meiji Constitution (1889)**: Asia's first modern constitution, modeled on the Prussian constitution
- **Western legal system adoption**: Criminal code (French model), Civil code (German model)

## Historical Significance
The Meiji Restoration was the first and most successful instance of a non-Western nation independently achieving Western-style modernization. However, the rapid military buildup subsequently led to imperialist expansion-the First Sino-Japanese War (1894), the Russo-Japanese War (1904), and the annexation of Korea (1910)-becoming a primary cause of the tragic developments in modern East Asian history.`,

  "대한제국 수립": `# 대한제국 수립

## 개요 (Overview)
1897년 10월 12일, 고종(高宗)이 환구단에서 하늘에 제사를 올리고 황제에 즉위하여 대한제국(大韓帝國)을 선포하였다. 국호를 '대한'으로 정하고 연호를 '광무(光武)'로 개원하여, 조선에서 근대적 황제국으로의 전환을 시도하였다.

## 주요 내용 (Key Details)
- **배경**: 갑오개혁(1894), 을미사변(1895, 명성황후 시해), 아관파천(1896)
- **환구단 즉위식**: 중국 황제에 준하는 의례로 독립국 지위 과시
- **광무개혁**: 양전사업(토지 측량), 근대적 법제 정비, 상공업 진흥
- **대한국 국제(1899)**: 대한제국의 기본법, 황제의 무한한 군주권 규정
- **을사늑약(1905)**: 일본에 외교권 박탈, 통감부 설치
- **경술국치(1910)**: 한일합방으로 대한제국 멸망

## 역사적 의의 (Historical Significance)
대한제국 수립은 조선이 중국 중심의 조공 체제에서 벗어나 근대적 주권국가로 전환하려 한 시도였다. 비록 일본의 침략으로 좌절되었으나, 근대적 법제도 정비와 국가 주권 의식의 확립은 이후 3-1 운동과 대한민국 건국의 사상적 토양이 되었다.

---

# Establishment of the Korean Empire

## Overview
On October 12, 1897, King Gojong ascended to the title of Emperor at the Hwangudan altar, proclaiming the Korean Empire (Daehan Jeguk). The country was renamed "Daehan" with the era name "Gwangmu," marking the attempted transition from the Joseon dynasty to a modern imperial state.

## Key Details
- **Background**: Gabo Reform (1894), assassination of Empress Myeongseong (1895), King's refuge at the Russian legation (1896)
- **Enthronement at Hwangudan**: Imperial-level ceremony demonstrating independent sovereign status
- **Gwangmu Reforms**: Land surveys, modern legal system development, promotion of commerce and industry
- **National Constitution of 1899**: Basic law establishing unlimited imperial sovereignty
- **Eulsa Treaty (1905)**: Japan stripped Korea of diplomatic rights; established the Residency-General
- **Japan-Korea Annexation (1910)**: End of the Korean Empire

## Historical Significance
The establishment of the Korean Empire represented Joseon's attempt to transition from the Chinese tributary system to a modern sovereign state. Although thwarted by Japanese aggression, the modernization of legal institutions and the consolidation of national sovereignty consciousness provided the intellectual foundation for the March 1st Movement and the founding of the Republic of Korea.`,

  "제1차 세계대전 발발": `# 제1차 세계대전 발발

## 개요 (Overview)
1914년 7월 28일, 오스트리아-헝가리 제국이 세르비아에 선전포고함으로써 제1차 세계대전이 시작되었다. 직접적 계기는 1914년 6월 28일 사라예보에서 발생한 오스트리아-헝가리 황태자 프란츠 페르디난트 부부 암살 사건이었다. 4년 3개월간 지속된 이 전쟁에서 약 1,000만 명의 군인과 700만 명의 민간인이 사망하였다.

## 주요 내용 (Key Details)
- **동맹국(Central Powers)**: 독일, 오스트리아-헝가리, 오스만 제국, 불가리아
- **협상국(Allied Powers)**: 영국, 프랑스, 러시아, 이탈리아, 미국(1917~)
- **서부전선**: 참호전의 교착, 솜 전투(1916, 약 100만 명 사상), 베르됭 전투
- **새로운 무기**: 기관총, 독가스, 전차(탱크), 잠수함(U-Boat), 비행기
- **미국 참전(1917.4)**: 전세를 협상국 측으로 결정적 전환
- **러시아 혁명(1917.10)**: 러시아의 전쟁 이탈
- **독일 항복(1918.11.11)**: 11월 11일 11시 정전 발효

## 역사적 의의 (Historical Significance)
제1차 세계대전은 오스만, 오스트리아-헝가리, 독일, 러시아 4대 제국의 붕괴를 초래하고, 베르사유 조약(1919)을 통해 국제 질서를 재편하였다. 그러나 과도한 전쟁 배상금과 영토 재분배는 독일의 분노를 촉발하여 제2차 세계대전의 씨앗이 되었으며, 국제연맹(League of Nations) 창설의 계기가 되었다.

---

# Outbreak of World War I

## Overview
On July 28, 1914, Austria-Hungary declared war on Serbia, igniting World War I. The immediate trigger was the assassination of Archduke Franz Ferdinand and his wife in Sarajevo on June 28, 1914. Over four years and three months, approximately 10 million soldiers and 7 million civilians perished.

## Key Details
- **Central Powers**: Germany, Austria-Hungary, Ottoman Empire, Bulgaria
- **Allied Powers**: Britain, France, Russia, Italy, United States (from 1917)
- **Western Front**: Trench warfare stalemate; Battle of the Somme (1916, ~1 million casualties), Battle of Verdun
- **New weapons**: Machine guns, poison gas, tanks, submarines (U-boats), aircraft
- **U.S. entry (April 1917)**: Decisively tilted the balance toward the Allies
- **Russian Revolution (October 1917)**: Russia's withdrawal from the war
- **German armistice (November 11, 1918)**: Ceasefire at the 11th hour of the 11th day of the 11th month

## Historical Significance
World War I caused the collapse of four great empires-Ottoman, Austro-Hungarian, German, and Russian-and restructured the international order through the Treaty of Versailles (1919). However, excessive war reparations and territorial redistribution fueled German resentment, sowing the seeds of World War II, while also prompting the creation of the League of Nations.`,

  "러시아 혁명": `# 러시아 혁명

## 개요 (Overview)
1917년, 러시아에서 두 차례의 혁명이 발생하였다. 2월 혁명(3월, 구력 2월)으로 300년 로마노프 왕조가 무너지고, 10월 혁명(11월, 구력 10월)으로 블라디미르 레닌이 이끄는 볼셰비키가 권력을 장악하여 세계 최초의 사회주의 국가가 탄생하였다.

## 주요 내용 (Key Details)
- **2월 혁명(1917.3.8~15)**: 식량 부족과 전쟁 피로에 의한 대중 봉기, 차르 니콜라이 2세 퇴위
- **임시정부 수립**: 케렌스키 주도, 그러나 전쟁 지속 결정으로 민심 이반
- **레닌의 '4월 테제'**: "모든 권력을 소비에트로!", 즉각적 종전, 토지 분배 주장
- **10월 혁명(1917.11.7)**: 볼셰비키의 겨울궁전 점령, 임시정부 전복
- **브레스트-리토프스크 조약(1918.3)**: 독일과의 단독 강화, 전쟁 이탈
- **러시아 내전(1918~1922)**: 적군(볼셰비키) vs 백군(반혁명파)
- **소련 수립(1922.12.30)**: 소비에트사회주의공화국연방(USSR) 공식 출범

## 역사적 의의 (Historical Significance)
러시아 혁명은 마르크스주의를 현실 정치에 구현한 최초의 사례로, 20세기 세계 역사의 방향을 근본적으로 바꾸었다. 자본주의 vs 사회주의의 이념 대립(냉전)의 기원이 되었으며, 식민지 해방운동, 복지국가 발전, 노동 운동 등에 지대한 영향을 미쳤다.

---

# Russian Revolution

## Overview
In 1917, two revolutions transformed Russia. The February Revolution (March by the Gregorian calendar) toppled the 300-year-old Romanov dynasty, and the October Revolution (November by the Gregorian calendar) brought Vladimir Lenin's Bolsheviks to power, establishing the world's first socialist state.

## Key Details
- **February Revolution (March 8-15, 1917)**: Mass uprising driven by food shortages and war weariness; Tsar Nicholas II abdicated
- **Provisional Government**: Led by Kerensky, but lost popular support by continuing the war
- **Lenin's "April Theses"**: "All power to the Soviets!"; demanded immediate peace and land redistribution
- **October Revolution (November 7, 1917)**: Bolshevik seizure of the Winter Palace; overthrow of the Provisional Government
- **Treaty of Brest-Litovsk (March 1918)**: Separate peace with Germany; Russia's withdrawal from WWI
- **Russian Civil War (1918-1922)**: Red Army (Bolsheviks) vs. White Army (counter-revolutionaries)
- **Founding of the USSR (December 30, 1922)**: Formal establishment of the Union of Soviet Socialist Republics

## Historical Significance
The Russian Revolution was the first implementation of Marxism in political reality, fundamentally altering the course of 20th-century world history. It originated the capitalist vs. socialist ideological confrontation (the Cold War) and profoundly influenced colonial liberation movements, welfare state development, and the global labor movement.`,

  "3·1 운동": `# 3-1 운동

## 개요 (Overview)
1919년 3월 1일, 일제 강점기 한국에서 발생한 최대 규모의 비폭력 독립운동이다. 민족대표 33인이 독립선언서를 낭독하고, 서울 탑골공원을 시작으로 전국 방방곡곡에서 약 200만 명의 한국인이 "대한독립만세"를 외치며 거리로 나섰다.

## 주요 내용 (Key Details)
- **배경**: 1910년 한일합방 이후 일제의 무단통치, 윌슨의 민족자결주의, 고종 황제 독살 의혹
- **독립선언서**: 최남선 기초, "우리는 이에 우리 조선의 독립국임과 조선인의 자주민임을 선언하노라"
- **민족대표 33인**: 천도교 15인, 기독교 16인, 불교 2인
- 1919년 3월 1일, 서울 탑골공원에서 학생-시민이 만세 시위 시작
- **전국 확산**: 약 1,542회의 시위, 약 200만 명 참여
- **일제의 탄압**: 약 7,500여 명 사망, 16,000여 명 부상, 46,000여 명 체포
- 제암리 학살(1919.4.15): 수원 제암리에서 일본군이 마을 주민 학살

## 역사적 의의 (Historical Significance)
3-1 운동은 대한민국 임시정부 수립(1919.4.11)의 직접적 계기가 되었으며, 대한민국 헌법 전문에 "3-1운동으로 건립된 대한민국임시정부의 법통"이 명시되어 있다. 비폭력 저항운동의 선구적 사례로서 중국 5-4 운동, 인도 독립운동 등 아시아 민족운동에 영향을 미쳤으며, 한국 민주주의의 정신적 원류이다.

---

# March 1st Movement (3.1 Movement)

## Overview
On March 1, 1919, the largest-scale nonviolent independence movement under Japanese colonial rule erupted across Korea. Thirty-three national representatives read the Declaration of Independence, and approximately 2 million Koreans took to the streets beginning from Tapgol Park in Seoul, shouting "Long live Korean independence."

## Key Details
- **Background**: Japanese military rule since the 1910 annexation; Woodrow Wilson's principle of national self-determination; suspicions of Emperor Gojong's poisoning
- **Declaration of Independence**: Drafted by Choe Nam-seon; "We hereby declare that Korea is an independent state and that Koreans are a self-governing people"
- **33 national representatives**: 15 Cheondogyo, 16 Christian, 2 Buddhist leaders
- Mass demonstrations began at Tapgol Park, Seoul, on March 1, 1919
- **Nationwide spread**: Approximately 1,542 demonstrations involving roughly 2 million participants
- **Japanese suppression**: Approximately 7,500 killed, 16,000 wounded, 46,000 arrested
- Jeamni Massacre (April 15, 1919): Japanese soldiers massacred villagers in Jeam-ri, Suwon

## Historical Significance
The March 1st Movement directly precipitated the establishment of the Korean Provisional Government (April 11, 1919). The Preamble to the Constitution of the Republic of Korea explicitly states its legal continuity with "the Provisional Government of the Republic of Korea, established through the March 1st Movement." As a pioneering nonviolent resistance movement, it influenced China's May Fourth Movement, India's independence movement, and other Asian nationalist movements, constituting the spiritual origin of Korean democracy.`,

  "대공황": `# 대공황

## 개요 (Overview)
1929년 10월 29일 뉴욕 증권거래소의 주가 대폭락('검은 화요일')을 시작으로 전 세계를 휩쓴 사상 최악의 경제 위기이다. 1929년부터 약 10년간 지속되어 전 세계 경제, 정치, 사회에 심대한 영향을 미쳤다.

## 주요 내용 (Key Details)
- **검은 화요일(1929.10.29)**: 다우존스 지수 하루 만에 12% 폭락
- **미국 실업률**: 1933년 약 25% (1,300만 명 실업)
- **세계 무역량**: 1929~1934년 사이 약 65% 감소
- **은행 도산**: 미국에서만 약 9,000개 은행 파산
- **스무트-홀리 관세법(1930)**: 보호무역 정책이 위기를 심화
- **뉴딜 정책(1933~)**: 프랭클린 루스벨트 대통령의 정부 주도 경기 부양책
  - 사회보장법(1935), 공공사업진흥국(WPA), 금융 규제 강화
- 독일, 일본, 이탈리아에서 파시즘-군국주의 대두의 경제적 배경

## 역사적 의의 (Historical Significance)
대공황은 자유방임 자본주의의 한계를 드러내고, 정부의 적극적 경제 개입(케인스 경제학)이라는 새로운 패러다임을 확립하였다. 사회보장제도, 금융 규제, 중앙은행의 역할 강화 등 현대 경제 정책의 기본 틀이 이 시기에 형성되었다. 또한 경제적 고통이 극단주의를 촉진하여 제2차 세계대전의 경제적 원인이 되었다.

---

# The Great Depression

## Overview
Beginning with the catastrophic stock market crash on "Black Tuesday," October 29, 1929, the Great Depression was the worst economic crisis in modern history. Lasting approximately ten years from 1929, it profoundly affected the global economy, politics, and society.

## Key Details
- **Black Tuesday (October 29, 1929)**: Dow Jones index fell 12% in a single day
- **U.S. unemployment**: Approximately 25% by 1933 (13 million unemployed)
- **Global trade**: Declined approximately 65% between 1929 and 1934
- **Bank failures**: Approximately 9,000 banks collapsed in the United States alone
- **Smoot-Hawley Tariff Act (1930)**: Protectionist policies deepened the crisis
- **New Deal (1933 onward)**: President Franklin Roosevelt's government-led stimulus programs
  - Social Security Act (1935), Works Progress Administration (WPA), strengthened financial regulation
- Provided the economic backdrop for the rise of fascism and militarism in Germany, Japan, and Italy

## Historical Significance
The Great Depression exposed the limits of laissez-faire capitalism and established a new paradigm of active government economic intervention (Keynesian economics). The basic frameworks of modern economic policy-social security, financial regulation, and enhanced central bank roles-were formed during this period. The economic distress also fueled extremism, constituting an economic cause of World War II.`,

  "제2차 세계대전 발발": `# 제2차 세계대전 발발

## 개요 (Overview)
1939년 9월 1일, 나치 독일이 폴란드를 침공하면서 제2차 세계대전이 시작되었다. 1945년까지 6년간 지속된 이 전쟁은 약 7,000만~8,500만 명이 사망한 인류 역사상 가장 파괴적인 전쟁이며, 홀로코스트라는 전례 없는 대학살이 자행되었다.

## 주요 내용 (Key Details)
- **추축국**: 독일(히틀러), 이탈리아(무솔리니), 일본(도조 히데키)
- **연합국**: 영국(처칠), 미국(루스벨트), 소련(스탈린), 프랑스, 중국
- **전격전(Blitzkrieg)**: 독일의 폴란드, 프랑스 침공 (1939~1940)
- **바르바로사 작전(1941.6)**: 독일의 소련 침공
- **진주만 공습(1941.12.7)**: 일본의 하와이 공격, 미국 참전
- **스탈린그라드 전투(1942~1943)**: 동부전선의 전환점, 독일군 대패
- **노르망디 상륙작전(1944.6.6, D-Day)**: 서유럽 해방의 시작
- **홀로코스트**: 유대인 약 600만 명을 포함한 1,100만 명 이상 학살
- **독일 항복(1945.5.8)**, **일본 항복(1945.8.15)**

## 역사적 의의 (Historical Significance)
제2차 세계대전은 파시즘의 패배와 함께 UN 창설, 세계인권선언, 뉘른베르크 전범재판 등 현대 국제 질서의 기틀을 마련하였다. 전후 미-소 냉전 체제의 시작, 식민지 해방, 유럽 통합 움직임, 핵무기 시대의 개막 등 20세기 후반의 모든 주요 역사적 흐름의 출발점이 되었다.

---

# Outbreak of World War II

## Overview
On September 1, 1939, Nazi Germany invaded Poland, initiating World War II. Lasting six years until 1945, it was the most destructive conflict in human history, claiming approximately 70-85 million lives and witnessing the unprecedented atrocity of the Holocaust.

## Key Details
- **Axis Powers**: Germany (Hitler), Italy (Mussolini), Japan (Tojo Hideki)
- **Allied Powers**: Britain (Churchill), United States (Roosevelt), Soviet Union (Stalin), France, China
- **Blitzkrieg**: German invasion of Poland and France (1939-1940)
- **Operation Barbarossa (June 1941)**: German invasion of the Soviet Union
- **Attack on Pearl Harbor (December 7, 1941)**: Japan's assault on Hawaii; U.S. entry into the war
- **Battle of Stalingrad (1942-1943)**: Turning point on the Eastern Front; catastrophic German defeat
- **D-Day, Normandy landings (June 6, 1944)**: Beginning of Western European liberation
- **Holocaust**: Systematic murder of approximately 6 million Jews and over 11 million total victims
- **Germany surrendered (May 8, 1945)**; **Japan surrendered (August 15, 1945)**

## Historical Significance
World War II, with the defeat of fascism, established the foundations of the modern international order: the United Nations, the Universal Declaration of Human Rights, and the Nuremberg War Crimes Tribunal. It served as the starting point for all major historical developments of the latter 20th century-the U.S.-Soviet Cold War, decolonization, European integration, and the dawn of the nuclear age.`,

  "히로시마 원폭 투하": `# 히로시마 원폭 투하

## 개요 (Overview)
1945년 8월 6일 오전 8시 15분, 미국 B-29 폭격기 '에놀라 게이(Enola Gay)'가 일본 히로시마에 인류 역사상 최초의 핵무기 '리틀 보이(Little Boy)'를 투하하였다. 3일 후인 8월 9일에는 나가사키에 '팻 맨(Fat Man)'이 투하되었다. 두 차례의 원폭으로 약 12만~22만 명이 사망하였다.

## 주요 내용 (Key Details)
- **리틀 보이**: 우라늄-235 원자폭탄, TNT 약 15킬로톤 위력
- **히로시마 피해**: 즉사 약 70,000~80,000명, 이후 방사능으로 총 약 14만 명 사망
- **나가사키(1945.8.9)**: 플루토늄 폭탄 '팻 맨', 약 39,000~80,000명 사망
- **맨해튼 프로젝트**: 로버트 오펜하이머 주도, 3년간 약 20억 달러(당시) 투입
- **일본 항복(1945.8.15)**: 히로히토 천황의 '옥음방송'으로 무조건 항복
- **방사능 후유증**: 피폭자(히바쿠샤) 약 65만 명, 수십 년간 암-백혈병 발생

## 역사적 의의 (Historical Significance)
히로시마-나가사키 원폭은 핵무기의 파괴력을 전 세계에 각인시키고, 핵전쟁의 공포가 냉전 시대의 국제 정치를 지배하게 만들었다. 이 사건은 핵비확산조약(NPT, 1968), 핵실험 금지 운동, 평화주의 운동의 출발점이 되었으며, 과학 기술의 윤리적 책임에 대한 근본적 성찰을 촉발하였다.

---

# Atomic Bombing of Hiroshima

## Overview
At 8:15 AM on August 6, 1945, the American B-29 bomber "Enola Gay" dropped "Little Boy," the first nuclear weapon ever used in warfare, on Hiroshima, Japan. Three days later, on August 9, "Fat Man" was dropped on Nagasaki. The two atomic bombings killed an estimated 120,000 to 220,000 people.

## Key Details
- **Little Boy**: Uranium-235 atomic bomb with a yield of approximately 15 kilotons of TNT
- **Hiroshima casualties**: 70,000-80,000 killed instantly; total deaths approximately 140,000 by year's end
- **Nagasaki (August 9, 1945)**: Plutonium bomb "Fat Man"; 39,000-80,000 deaths
- **Manhattan Project**: Led by J. Robert Oppenheimer; approximately $2 billion invested over three years
- **Japanese surrender (August 15, 1945)**: Emperor Hirohito's radio broadcast announcing unconditional surrender
- **Radiation aftermath**: Approximately 650,000 hibakusha (atomic bomb survivors); decades of cancer and leukemia

## Historical Significance
The atomic bombings of Hiroshima and Nagasaki imprinted the destructive power of nuclear weapons on global consciousness, making the fear of nuclear war a dominant force in Cold War international politics. These events became the starting point for the Nuclear Non-Proliferation Treaty (NPT, 1968), the anti-nuclear testing movement, and pacifist movements, while provoking fundamental reflection on the ethical responsibilities of scientific advancement.`,

  "UN 창설": `# UN 창설

## 개요 (Overview)
1945년 10월 24일, 제2차 세계대전의 참화를 겪은 51개국이 국제 평화와 안전 보장을 위해 국제연합(United Nations)을 공식 출범시켰다. 1945년 6월 26일 샌프란시스코에서 채택된 UN 헌장이 발효됨으로써 설립되었으며, 본부는 뉴욕에 위치한다.

## 주요 내용 (Key Details)
- **UN 헌장**: 전문 + 19장 111조, 국제 평화-안보, 인권, 경제-사회 발전 목적
- **안전보장이사회**: 5개 상임이사국(미-영-프-러-중) 거부권 보유 + 10개 비상임이사국
- **총회(General Assembly)**: 전 회원국 참여, 1국 1표 원칙
- **국제사법재판소(ICJ)**: 헤이그 소재, 국가 간 분쟁의 사법적 해결
- **전문기구**: WHO, UNESCO, ILO, IMF, World Bank 등
- 2024년 현재 **193개 회원국**
- 유엔평화유지활동(PKO): 1948년 이래 70여 건의 임무 수행

## 역사적 의의 (Historical Significance)
UN은 국제연맹(League of Nations)의 실패를 교훈 삼아 더 강력한 집단안보 체제를 구축하고자 한 인류의 노력이다. 냉전 시대에는 미-소 대립으로 기능이 제한되었으나, 탈냉전 이후 평화유지, 인권 보호, 개발 협력 분야에서 핵심적 역할을 수행하고 있다. 대한민국은 1991년에 가입하였다.

---

# Founding of the United Nations

## Overview
On October 24, 1945, fifty-one nations that had endured the devastation of World War II officially established the United Nations (UN) to maintain international peace and security. It was founded upon the entry into force of the UN Charter, adopted in San Francisco on June 26, 1945. Its headquarters are located in New York City.

## Key Details
- **UN Charter**: Preamble plus 19 chapters and 111 articles; purposes include international peace, human rights, and socioeconomic development
- **Security Council**: Five permanent members (U.S., UK, France, Russia, China) with veto power + 10 non-permanent members
- **General Assembly**: All member states participate on a one-state, one-vote basis
- **International Court of Justice (ICJ)**: Located in The Hague; adjudicates disputes between states
- **Specialized agencies**: WHO, UNESCO, ILO, IMF, World Bank, among others
- Currently **193 member states** as of 2024
- UN Peacekeeping Operations (PKO): Over 70 missions since 1948

## Historical Significance
The UN represents humanity's effort to build a stronger collective security system, drawing lessons from the failure of the League of Nations. While its functions were constrained by U.S.-Soviet rivalry during the Cold War, since the end of the Cold War it has played a central role in peacekeeping, human rights protection, and development cooperation. The Republic of Korea became a member in 1991.`,

  "세계인권선언 채택": `# 세계인권선언 채택

## 개요 (Overview)
1948년 12월 10일, UN 총회가 프랑스 파리 샤이요궁에서 세계인권선언(Universal Declaration of Human Rights, UDHR)을 채택하였다. 엘리너 루스벨트가 위원장을 맡은 인권위원회가 기초한 이 선언은, 제2차 세계대전과 홀로코스트의 참혹한 인권 유린에 대한 반성에서 탄생하였다.

## 주요 내용 (Key Details)
- **전문 + 30개 조항**으로 구성
- **제1조**: "모든 인간은 태어날 때부터 자유롭고, 존엄하며, 평등하다"
- **시민적-정치적 권리**: 생명권, 자유권, 신체 안전권, 사상-양심-종교의 자유, 표현의 자유
- **경제적-사회적-문화적 권리**: 교육권, 근로권, 사회보장권, 문화생활 참여권
- **제7조**: 법 앞의 평등과 차별 금지
- **제10조**: 공정한 재판을 받을 권리
- 찬성 48, 반대 0, 기권 8 (소련 등 6개국, 사우디, 남아공)로 채택

## 역사적 의의 (Historical Significance)
세계인권선언은 그 자체로 법적 구속력은 없으나, 국제관습법으로 인정되어 사실상의 법적 효력을 갖는다. 이후 국제인권규약(ICCPR, ICESCR), 여성차별철폐협약, 아동권리협약 등 수많은 국제인권조약의 기초가 되었다. 대한민국 헌법 제10조의 인간 존엄 조항의 사상적 원천이며, 헌법재판소가 해석 기준으로 활용하고 있다.

---

# Adoption of the Universal Declaration of Human Rights

## Overview
On December 10, 1948, the UN General Assembly adopted the Universal Declaration of Human Rights (UDHR) at the Palais de Chaillot in Paris, France. Drafted by the Commission on Human Rights chaired by Eleanor Roosevelt, the Declaration was born from reflection on the horrific human rights violations of World War II and the Holocaust.

## Key Details
- Comprises a **preamble and 30 articles**
- **Article 1**: "All human beings are born free and equal in dignity and rights"
- **Civil and political rights**: Right to life, liberty, and security; freedom of thought, conscience, religion, and expression
- **Economic, social, and cultural rights**: Rights to education, work, social security, and cultural participation
- **Article 7**: Equality before the law and protection against discrimination
- **Article 10**: Right to a fair trial
- Adopted with 48 in favor, 0 against, 8 abstentions (including 6 Soviet bloc nations, Saudi Arabia, South Africa)

## Historical Significance
While the UDHR is not legally binding per se, it is recognized as customary international law and possesses de facto legal authority. It has served as the foundation for numerous international human rights treaties, including the ICCPR, ICESCR, CEDAW, and the Convention on the Rights of the Child. It is the intellectual source of Article 10 of the Constitution of the Republic of Korea (human dignity clause) and is employed by the Constitutional Court as an interpretive standard.`,

  "대한민국 정부 수립": `# 대한민국 정부 수립

## 개요 (Overview)
1948년 8월 15일, 8-15 광복 3주년을 맞아 대한민국 정부가 공식 수립되었다. 1948년 5월 10일 UN 감시 하에 실시된 남한 총선거에서 선출된 제헌국회가 7월 17일 헌법을 공포하고, 이승만을 초대 대통령으로 선출하였다.

## 주요 내용 (Key Details)
- **5-10 총선거(1948.5.10)**: UN 한국임시위원단(UNTCOK) 감시 하 실시, 남한만의 단독 총선
- **제헌헌법(1948.7.17)**: 민주공화국 선언, 국민주권, 기본권 보장, 삼권분립
- **이승만 초대 대통령 선출(1948.7.20)**: 국회 간접선거로 선출
- **정부 수립 선포(1948.8.15)**: 중앙청에서 정부 수립 기념식 거행
- **UN 승인(1948.12.12)**: UN 총회 결의로 한반도 유일 합법 정부로 승인
- 국호 '대한민국'은 1919년 대한민국 임시정부의 법통 계승
- 같은 해 9월 9일 북한에서 조선민주주의인민공화국 수립

## 역사적 의의 (Historical Significance)
대한민국 정부 수립은 한민족 최초의 민주공화국 탄생을 의미한다. 3-1 운동과 대한민국 임시정부의 법통을 계승하고, 국민주권-기본권 보장-권력분립의 헌법적 가치를 확립하였다. 비록 남북 분단이라는 한계가 있었으나, 이후 산업화와 민주화를 동시에 달성한 대한민국 발전의 헌법적-제도적 출발점이었다.

---

# Establishment of the Government of the Republic of Korea

## Overview
On August 15, 1948, the third anniversary of liberation from Japanese rule, the Government of the Republic of Korea was officially established. Following a general election on May 10, 1948, conducted under UN observation, the Constituent National Assembly promulgated the Constitution on July 17 and elected Syngman Rhee as the first president.

## Key Details
- **May 10 General Election (1948)**: Conducted under UNTCOK supervision; held only in the south
- **Founding Constitution (July 17, 1948)**: Declared a democratic republic; guaranteed popular sovereignty, fundamental rights, and separation of powers
- **First President Syngman Rhee (July 20, 1948)**: Elected by indirect vote of the National Assembly
- **Government proclamation (August 15, 1948)**: Ceremony held at the Central Government Building
- **UN recognition (December 12, 1948)**: Recognized by UN General Assembly resolution as the only lawful government on the Korean Peninsula
- The national title "Republic of Korea" (Daehan Minguk) inherited the legal tradition of the 1919 Korean Provisional Government
- On September 9, 1948, the Democratic People's Republic of Korea was established in the north

## Historical Significance
The establishment of the ROK government marked the birth of the Korean people's first democratic republic. Inheriting the legal tradition of the March 1st Movement and the Korean Provisional Government, it enshrined the constitutional values of popular sovereignty, fundamental rights, and separation of powers. Despite the limitation of national division, it constituted the constitutional and institutional starting point for the Republic of Korea's subsequent achievement of both industrialization and democratization.`,

  "한국전쟁": `# 한국전쟁

## 개요 (Overview)
1950년 6월 25일 새벽 4시, 북한군이 38도선 전역에서 남침하여 한국전쟁이 발발하였다. 1953년 7월 27일 정전협정이 체결될 때까지 3년 1개월간 지속되었으며, 약 300만 명이 사망하고 1,000만 명의 이산가족이 발생한 한민족 최대의 비극이다.

## 주요 내용 (Key Details)
- **1950.6.25**: 북한군 전면 남침, 3일 만에 서울 함락
- **1950.6.27**: UN 안보리 결의, 16개국 참전 결정
- **1950.9.15**: 인천상륙작전(맥아더 장군 지휘), 전세 역전
- **1950.10**: UN군 압록강까지 진격, 중국군 30만 명 개입
- **1950.12**: 흥남 철수, 10만여 민간인 대피
- **1951~1953**: 38선 부근 교착 상태, 고지전
- **1953.7.27**: 판문점 정전협정 체결 (평화 조약 아님)
- **피해**: 한국군 약 62만, 북한군 약 92만, 중국군 약 90만, 민간인 약 150만 명 사상

## 역사적 의의 (Historical Significance)
한국전쟁은 냉전이 열전(熱戰)으로 비화된 최초의 대규모 분쟁으로, 미-소 냉전 대립을 극적으로 심화시켰다. 전쟁은 남북 분단을 고착화하고 한미동맹 체제를 확립하였으며, 전후 대한민국의 산업화와 국가 재건의 출발점이 되었다. 70년이 지난 현재까지 정전 상태가 유지되고 있어, 한반도 평화 체제 구축이 핵심 과제로 남아 있다.

---

# Korean War

## Overview
At 4:00 AM on June 25, 1950, North Korean forces launched a full-scale invasion across the 38th parallel, initiating the Korean War. The conflict lasted three years and one month until the armistice agreement was signed on July 27, 1953. Approximately 3 million people died and 10 million families were separated-the greatest tragedy in Korean national history.

## Key Details
- **June 25, 1950**: Full-scale North Korean invasion; Seoul fell within three days
- **June 27, 1950**: UN Security Council resolution; 16 nations committed to intervention
- **September 15, 1950**: Inchon Landing (led by General MacArthur); dramatic reversal of the war
- **October 1950**: UN forces advanced to the Yalu River; 300,000 Chinese troops intervened
- **December 1950**: Hungnam evacuation; over 100,000 civilians rescued
- **1951-1953**: Stalemate near the 38th parallel; fierce hill battles
- **July 27, 1953**: Armistice signed at Panmunjom (not a peace treaty)
- **Casualties**: Approximately 620,000 ROK, 920,000 DPRK, 900,000 Chinese, and 1.5 million civilian casualties

## Historical Significance
The Korean War was the first large-scale conflict in which the Cold War turned "hot," dramatically intensifying the U.S.-Soviet confrontation. It solidified the division of the Korean Peninsula, established the ROK-U.S. alliance system, and became the starting point for South Korea's post-war industrialization and national reconstruction. Over 70 years later, the armistice remains in effect, and establishing a peace regime on the Korean Peninsula endures as a paramount challenge.`,

  "쿠바 미사일 위기": `# 쿠바 미사일 위기

## 개요 (Overview)
1962년 10월 16일~28일, 소련이 쿠바에 핵미사일을 배치한 사실이 발각되면서 미-소 간 13일간의 극한 대립이 벌어졌다. 인류가 핵전쟁에 가장 가까이 다가갔던 순간으로, 존 F. 케네디 미국 대통령과 니키타 흐루시초프 소련 서기장의 외교적 해결로 위기가 수습되었다.

## 주요 내용 (Key Details)
- **배경**: 1961년 피그만 침공 실패 후 쿠바의 소련 접근, 터키 주둔 미국 미사일에 대한 소련의 우려
- **1962.10.14**: U-2 정찰기가 쿠바 내 소련 중거리 핵미사일 기지 촬영
- **1962.10.22**: 케네디 대통령, TV 연설로 쿠바 해상봉쇄(quarantine) 선포
- **13일간의 대치**: 소련 화물선 접근, 핵전쟁 직전까지 긴장 고조
- **1962.10.28**: 흐루시초프가 미사일 철수 합의 (비공개로 터키 미사일도 철수)
- **핫라인 설치(1963)**: 미-소 정상 간 직통 통신선 개설
- **부분적 핵실험 금지 조약(1963)**: 위기 이후 핵군축 협상 시작

## 역사적 의의 (Historical Significance)
쿠바 미사일 위기는 핵전쟁의 현실적 위험을 양 진영에 각인시키고, 이후 데탕트(긴장 완화)와 핵군축 협상의 기폭제가 되었다. 위기관리(crisis management)와 핵억제 이론의 핵심 사례로 국제관계학에서 가장 많이 연구되는 사건 중 하나이다.

---

# Cuban Missile Crisis

## Overview
From October 16 to 28, 1962, the discovery of Soviet nuclear missiles deployed in Cuba triggered a 13-day standoff between the United States and the Soviet Union. It was the closest humanity has come to nuclear war. The crisis was resolved through diplomacy between President John F. Kennedy and Soviet Premier Nikita Khrushchev.

## Key Details
- **Background**: Soviet-Cuban rapprochement after the failed Bay of Pigs invasion (1961); Soviet concerns about U.S. missiles in Turkey
- **October 14, 1962**: U-2 reconnaissance aircraft photographed Soviet medium-range nuclear missile installations in Cuba
- **October 22, 1962**: Kennedy announced a naval "quarantine" of Cuba in a televised address
- **13-day standoff**: Soviet cargo ships approached; tensions escalated to the brink of nuclear war
- **October 28, 1962**: Khrushchev agreed to withdraw missiles (U.S. secretly agreed to remove Turkey-based missiles)
- **Hotline established (1963)**: Direct communication link between U.S. and Soviet leaders
- **Partial Nuclear Test Ban Treaty (1963)**: Nuclear disarmament negotiations began in the crisis's aftermath

## Historical Significance
The Cuban Missile Crisis impressed the realistic danger of nuclear war upon both blocs, catalyzing detente and nuclear arms control negotiations. It remains one of the most studied events in international relations as a seminal case in crisis management and nuclear deterrence theory.`,

  "아폴로 11호 달 착륙": `# 아폴로 11호 달 착륙

## 개요 (Overview)
1969년 7월 20일 오후 10시 56분(UTC), 미국 우주비행사 닐 암스트롱(Neil Armstrong)이 아폴로 11호 달착륙선 '이글'에서 내려 인류 최초로 달 표면에 발을 디뎠다. "이것은 한 인간에게는 작은 한 걸음이지만, 인류에게는 위대한 도약이다(That's one small step for man, one giant leap for mankind)"라는 역사적 발언을 남겼다.

## 주요 내용 (Key Details)
- **승무원**: 닐 암스트롱(선장), 버즈 올드린(달착륙선 조종사), 마이클 콜린스(사령선 조종사)
- **발사**: 1969년 7월 16일, 플로리다 케네디 우주센터에서 새턴 V 로켓으로 발사
- **달 착륙**: 7월 20일, '고요의 바다(Sea of Tranquility)'에 착륙
- **달 표면 활동**: 약 2시간 31분, 월면 보행 및 암석 샘플 21.5kg 수집
- **귀환**: 7월 24일 태평양에 안전 착수
- **케네디 대통령의 선언(1961)**: "10년 안에 인간을 달에 보내겠다"
- **우주 경쟁**: 소련 스푸트니크(1957), 가가린(1961)에 대한 미국의 응전

## 역사적 의의 (Historical Significance)
아폴로 11호의 달 착륙은 냉전 시대 미-소 우주 경쟁의 결정적 승리이자, 인류의 과학 기술적 역량이 지구 바깥으로 확장될 수 있음을 증명한 역사적 쾌거이다. 약 6억 명이 TV로 시청한 이 사건은 전 인류적 성취의 상징이 되었으며, 이후 우주 탐사와 인공위성 기술 발전의 토대를 마련하였다.

---

# Apollo 11 Moon Landing

## Overview
At 10:56 PM UTC on July 20, 1969, American astronaut Neil Armstrong descended from the Apollo 11 Lunar Module "Eagle" and became the first human to set foot on the Moon. He delivered the historic words: "That's one small step for man, one giant leap for mankind."

## Key Details
- **Crew**: Neil Armstrong (Commander), Buzz Aldrin (Lunar Module Pilot), Michael Collins (Command Module Pilot)
- **Launch**: July 16, 1969, from Kennedy Space Center, Florida, aboard a Saturn V rocket
- **Moon landing**: July 20, at the Sea of Tranquility
- **Lunar surface activity**: Approximately 2 hours 31 minutes of moonwalk; 21.5 kg of rock samples collected
- **Return**: Safe splashdown in the Pacific Ocean on July 24
- **Kennedy's declaration (1961)**: "Before this decade is out, landing a man on the Moon"
- **Space Race**: U.S. response to Soviet Sputnik (1957) and Gagarin's orbital flight (1961)

## Historical Significance
The Apollo 11 Moon landing represented the decisive victory in the Cold War space race and proved that human scientific and technological capabilities could extend beyond Earth. Watched by an estimated 600 million television viewers, it became a symbol of universal human achievement and laid the groundwork for subsequent space exploration and satellite technology development.`,

  "5·18 광주민주화운동": `# 5-18 광주민주화운동

## 개요 (Overview)
1980년 5월 18일~27일, 전라남도 광주에서 신군부의 쿠데타와 계엄령 확대에 항거하여 시민들이 민주주의를 요구하며 봉기하였다. 계엄군의 무력 진압으로 최소 154명(추정 최대 606명 이상)이 사망하였으며, 대한민국 민주화 운동의 가장 중요한 분기점이다.

## 주요 내용 (Key Details)
- **배경**: 1979.10.26 박정희 대통령 시해 -> 12.12 군사반란(전두환) -> 1980 서울의 봄
- **5.17 비상계엄 전국 확대**: 전두환 신군부의 권력 장악 시도
- **5.18**: 전남대 학생 시위에 대한 공수부대의 무차별 진압
- **5.19~20**: 시민군 형성, 무장 항쟁으로 전환
- **5.21**: 계엄군의 집단 발포, 시민군이 전남도청 장악
- **5.22~26**: '해방 광주' - 시민 자치 5일간
- **5.27**: 계엄군의 도청 진압 작전으로 최종 진압
- 2011년 5-18 관련 기록물이 **UNESCO 세계기록유산**에 등재

## 역사적 의의 (Historical Significance)
5-18 광주민주화운동은 1987년 6월 항쟁과 민주화의 직접적 동력이 되었으며, 이후 전두환-노태우 전 대통령의 사법 처리(1996)로 정의의 실현을 이루었다. 2000년 5-18 민주화운동 관련자 보상법 제정 등을 통해 국가적 차원의 명예 회복이 이루어졌다. 한국 민주주의의 초석이자 아시아 민주화 운동의 상징이다.

---

# May 18 Gwangju Democratization Movement

## Overview
From May 18 to 27, 1980, citizens of Gwangju, South Jeolla Province, rose up against the new military regime's coup and expansion of martial law, demanding democracy. The military's violent suppression killed at least 154 people (estimates range up to 606 or more), making it the most critical turning point in South Korea's democratization movement.

## Key Details
- **Background**: Assassination of President Park Chung-hee (Oct. 26, 1979) -> December 12 military coup (Chun Doo-hwan) -> Seoul Spring of 1980
- **May 17**: Nationwide expansion of emergency martial law by the new military regime
- **May 18**: Paratroopers unleashed indiscriminate violence against student demonstrators at Chonnam National University
- **May 19-20**: Formation of citizen militia; transition to armed resistance
- **May 21**: Troops opened fire on crowds; citizen forces seized the South Jeolla Provincial Office
- **May 22-26**: "Liberated Gwangju"-five days of citizen self-governance
- **May 27**: Final military operation to recapture the Provincial Office
- In 2011, the May 18 archives were inscribed on **UNESCO's Memory of the World Register**

## Historical Significance
The Gwangju Democratization Movement became the direct impetus for the June Democratic Uprising of 1987 and subsequent democratization. Justice was served through the criminal prosecution of former presidents Chun Doo-hwan and Roh Tae-woo (1996). National-level rehabilitation was achieved through legislation such as the May 18 Democratization Movement Compensation Act (2000). It stands as the cornerstone of Korean democracy and a symbol of democratization movements across Asia.`,

  "베를린 장벽 붕괴": `# 베를린 장벽 붕괴

## 개요 (Overview)
1989년 11월 9일 밤, 동독 정부의 여행 자유화 발표를 계기로 동서 베를린 시민들이 28년간 분단의 상징이었던 베를린 장벽을 허물기 시작하였다. 이 사건은 냉전 종식의 결정적 순간이자, 1990년 10월 3일 독일 통일로 이어진 역사적 전환점이다.

## 주요 내용 (Key Details)
- **건설(1961.8.13)**: 동독이 서베를린을 둘러싼 155km의 장벽 건설, 주민 탈출 방지
- **장벽의 상징성**: 자유 vs 억압, 자본주의 vs 사회주의의 물리적 경계
- **1989년 배경**: 소련 고르바초프의 글라스노스트(개방)-페레스트로이카(개혁) 정책, 동유럽 민주화 물결
- **1989.11.9**: 동독 대변인 귄터 샤보프스키의 기자회견에서 여행 자유화 발표 실수
- 수만 명의 시민이 국경 검문소로 몰려들어 장벽 개방
- 시민들이 망치와 곡괭이로 장벽을 파괴 - "벽따기(Mauerspechte)"
- **독일 통일(1990.10.3)**: 동독이 서독에 편입되는 형태로 통일

## 역사적 의의 (Historical Significance)
베를린 장벽 붕괴는 제2차 세계대전 후 40여 년간 지속된 냉전 체제의 종말을 상징한다. 이후 동유럽 사회주의 정권의 연쇄적 붕괴, 소련 해체(1991), 유럽연합(EU)의 동방 확대 등 탈냉전 시대의 새로운 국제 질서가 형성되었다. 한반도 통일 논의에도 중요한 참조점이 되고 있다.

---

# Fall of the Berlin Wall

## Overview
On the night of November 9, 1989, following the East German government's announcement of travel liberalization, citizens of East and West Berlin began dismantling the Berlin Wall, which had stood as a symbol of division for 28 years. This event was the decisive moment ending the Cold War and the historic turning point leading to German reunification on October 3, 1990.

## Key Details
- **Construction (August 13, 1961)**: East Germany erected a 155-km barrier surrounding West Berlin to prevent citizen defection
- **Symbolic significance**: The physical boundary between freedom and repression, capitalism and socialism
- **1989 context**: Gorbachev's glasnost (openness) and perestroika (reform); wave of democratic movements across Eastern Europe
- **November 9, 1989**: East German spokesman Gunter Schabowski's press conference mistakenly announced immediate travel freedom
- Tens of thousands of citizens surged to border checkpoints, forcing the wall open
- Citizens attacked the wall with hammers and pickaxes-"Mauerspechte" (wall woodpeckers)
- **German Reunification (October 3, 1990)**: East Germany was incorporated into West Germany

## Historical Significance
The fall of the Berlin Wall symbolized the end of the Cold War system that had endured for over 40 years after World War II. It was followed by the cascading collapse of socialist regimes across Eastern Europe, the dissolution of the Soviet Union (1991), and the eastward expansion of the European Union, forming the new post-Cold War international order. It also serves as an important reference point in discussions about Korean reunification.`,

  "소련 해체": `# 소련 해체

## 개요 (Overview)
1991년 12월 25일, 미하일 고르바초프 소련 대통령이 사임하고, 12월 26일 소비에트사회주의공화국연방(USSR)이 공식 해체되었다. 1922년 수립 이래 69년간 존속한 세계 최초의 사회주의 초강대국이 15개 독립 국가로 분열되며 냉전 시대가 공식적으로 종결되었다.

## 주요 내용 (Key Details)
- **고르바초프의 개혁(1985~)**: 글라스노스트(개방), 페레스트로이카(개혁) 정책
- **동유럽 사회주의 붕괴(1989)**: 폴란드, 헝가리, 체코슬로바키아 등 연쇄적 체제 전환
- **발트 3국 독립(1990~1991)**: 리투아니아, 라트비아, 에스토니아의 독립 선언
- **8월 쿠데타(1991.8.19~21)**: 보수파의 쿠데타 시도, 옐친의 저항으로 실패
- **벨라베자 합의(1991.12.8)**: 러시아-우크라이나-벨라루스 정상이 소련 해체 합의
- **독립국가연합(CIS) 출범(1991.12.21)**: 11개국 참여
- **고르바초프 사임(1991.12.25)**: 소련 국기 하강, 러시아 국기 게양

## 역사적 의의 (Historical Significance)
소련 해체는 20세기를 지배한 자본주의 vs 사회주의 이념 대립의 종결을 의미하며, 미국 중심의 단극 체제가 시작되었다. 핵군축, 시장경제 확산, 세계화의 가속 등 탈냉전 시대의 새로운 국제 질서가 형성되었으나, 동시에 민족 분쟁, 경제적 혼란, 핵무기 관리 문제 등 새로운 과제도 발생하였다.

---

# Dissolution of the Soviet Union

## Overview
On December 25, 1991, Soviet President Mikhail Gorbachev resigned, and on December 26, the Union of Soviet Socialist Republics (USSR) was officially dissolved. The world's first socialist superpower, which had existed since 1922 (69 years), fractured into 15 independent nations, formally ending the Cold War era.

## Key Details
- **Gorbachev's reforms (from 1985)**: Glasnost (openness) and perestroika (restructuring) policies
- **Collapse of Eastern European socialism (1989)**: Successive regime changes in Poland, Hungary, Czechoslovakia, and others
- **Baltic independence (1990-1991)**: Lithuania, Latvia, and Estonia declared independence
- **August Coup (August 19-21, 1991)**: Hardliner coup attempt; foiled by Yeltsin's resistance
- **Belavezha Accords (December 8, 1991)**: Leaders of Russia, Ukraine, and Belarus agreed to dissolve the USSR
- **Commonwealth of Independent States (CIS) formed (December 21, 1991)**: 11 nations participated
- **Gorbachev's resignation (December 25, 1991)**: Soviet flag lowered; Russian flag raised over the Kremlin

## Historical Significance
The dissolution of the Soviet Union signified the end of the capitalism vs. socialism ideological confrontation that dominated the 20th century, inaugurating a unipolar system centered on the United States. While the post-Cold War era brought nuclear arms reduction, market economy proliferation, and accelerated globalization, it also generated new challenges: ethnic conflicts, economic upheaval, and nuclear weapons management issues.`,

  "9·11 테러": `# 9-11 테러

## 개요 (Overview)
2001년 9월 11일 화요일 아침, 알카에다(al-Qaeda) 소속 19명의 테러리스트가 4대의 민항기를 납치하여 미국 뉴욕 세계무역센터(WTC) 쌍둥이 빌딩과 워싱턴 D.C. 인근 펜타곤을 공격하였다. 약 2,977명이 사망한 이 테러는 미국 본토에 대한 최악의 공격이자 21세기 국제 질서를 근본적으로 재편한 사건이다.

## 주요 내용 (Key Details)
- **8:46 AM**: 아메리칸 항공 11편, WTC 북타워 충돌
- **9:03 AM**: 유나이티드 항공 175편, WTC 남타워 충돌
- **9:37 AM**: 아메리칸 항공 77편, 펜타곤 충돌
- **10:03 AM**: 유나이티드 항공 93편, 펜실베이니아 추락 (승객 저항)
- **WTC 붕괴**: 남타워 9:59 AM, 북타워 10:28 AM 붕괴
- **사망자**: 2,977명 (19명 테러범 제외) + 400명 이상의 소방관-경찰
- **주모자**: 오사마 빈 라덴(2011년 미군 특수부대에 의해 사살)

## 역사적 의의 (Historical Significance)
9-11 테러는 미국의 '테러와의 전쟁' 선포, 아프가니스탄 전쟁(2001), 이라크 전쟁(2003)으로 이어지며 21세기 국제 안보 질서를 근본적으로 변화시켰다. 국내적으로는 애국법(Patriot Act) 제정, 국토안보부 신설 등 안보와 인권 간의 긴장이 새로운 법적-정치적 쟁점으로 부상하였다.

---

# September 11 Attacks

## Overview
On the morning of Tuesday, September 11, 2001, 19 terrorists affiliated with al-Qaeda hijacked four commercial airliners and attacked the World Trade Center (WTC) twin towers in New York City and the Pentagon near Washington, D.C. Killing approximately 2,977 people, these attacks constituted the worst assault on American soil and fundamentally reshaped the 21st-century international order.

## Key Details
- **8:46 AM**: American Airlines Flight 11 struck the WTC North Tower
- **9:03 AM**: United Airlines Flight 175 struck the WTC South Tower
- **9:37 AM**: American Airlines Flight 77 struck the Pentagon
- **10:03 AM**: United Airlines Flight 93 crashed in Pennsylvania (passengers resisted the hijackers)
- **WTC collapse**: South Tower at 9:59 AM, North Tower at 10:28 AM
- **Deaths**: 2,977 (excluding 19 hijackers) plus over 400 firefighters and police officers
- **Mastermind**: Osama bin Laden (killed by U.S. special forces in 2011)

## Historical Significance
The 9/11 attacks led to the U.S. declaration of a "War on Terror," the Afghanistan War (2001), and the Iraq War (2003), fundamentally transforming the 21st-century international security order. Domestically, the Patriot Act and the creation of the Department of Homeland Security raised new legal and political tensions between security and civil liberties.`,

  "2008 글로벌 금융위기": `# 2008 글로벌 금융위기

## 개요 (Overview)
2008년 9월 15일, 미국 4대 투자은행 리먼 브라더스(Lehman Brothers)가 파산하면서 전 세계 금융 시스템이 붕괴 위기에 처하였다. 미국 서브프라임 모기지(비우량 주택담보대출) 시장의 거품 붕괴가 원인으로, 대공황 이후 최악의 세계 경제 위기를 초래하였다.

## 주요 내용 (Key Details)
- **서브프라임 모기지**: 신용등급이 낮은 차주에게 주택담보대출을 남발
- **금융 파생상품**: MBS, CDO 등 복잡한 파생상품이 위험을 확산
- **리먼 브라더스 파산(2008.9.15)**: 158년 역사의 투자은행 파산, 전 세계 충격
- **구제금융**: 미국 TARP(7,000억 달러), AIG 구제 등 대규모 공적 자금 투입
- **글로벌 확산**: 아이슬란드 은행 시스템 붕괴, 유럽 재정위기(그리스, 스페인 등)
- **실업률**: 미국 10%, 유로존 12% 이상으로 급등
- **도드-프랭크법(2010)**: 금융 규제 강화법 제정

## 역사적 의의 (Historical Significance)
2008년 금융위기는 규제 없는 금융 자유화의 위험성을 보여주고, 금융 규제 강화와 중앙은행의 역할 재정립의 계기가 되었다. "대마불사(too big to fail)" 문제, 경제적 불평등 심화, 포퓰리즘 부상 등 현재까지 이어지는 경제적-정치적 영향을 남겼다.

---

# 2008 Global Financial Crisis

## Overview
On September 15, 2008, Lehman Brothers, the fourth-largest U.S. investment bank, declared bankruptcy, pushing the global financial system to the brink of collapse. Triggered by the bursting of the U.S. subprime mortgage bubble, it caused the worst global economic crisis since the Great Depression.

## Key Details
- **Subprime mortgages**: Excessive lending to borrowers with poor credit ratings
- **Financial derivatives**: Complex instruments (MBS, CDOs) amplified and spread risk
- **Lehman Brothers bankruptcy (Sept. 15, 2008)**: Collapse of a 158-year-old investment bank; worldwide shockwaves
- **Bailouts**: U.S. TARP ($700 billion), AIG rescue, massive public fund injections
- **Global contagion**: Icelandic banking system collapse; European sovereign debt crisis (Greece, Spain)
- **Unemployment**: Surged to 10% in the U.S. and over 12% in the Eurozone
- **Dodd-Frank Act (2010)**: Comprehensive financial regulation reform enacted

## Historical Significance
The 2008 financial crisis demonstrated the dangers of unregulated financial liberalization and prompted strengthened financial regulation and a redefined role for central banks. Its lasting economic and political effects-the "too big to fail" problem, deepening inequality, and the rise of populism-continue to shape the contemporary landscape.`,

  "파리 기후변화 협정": `# 파리 기후변화 협정

## 개요 (Overview)
2015년 12월 12일, 제21차 유엔기후변화협약 당사국총회(COP21)에서 195개국이 파리 협정(Paris Agreement)을 채택하였다. 지구 평균 기온 상승을 산업화 이전 대비 2도C 이내, 가능하면 1.5도C 이내로 억제하기로 합의한 역사적인 국제 환경 협약이다.

## 주요 내용 (Key Details)
- **온도 목표**: 지구 평균 기온 상승을 2도C 이내, 노력 목표 1.5도C
- **국가별 기여(NDC)**: 각국이 자발적으로 온실가스 감축 목표를 설정하고 이행
- **5년 주기 검토**: 감축 목표를 5년마다 상향 조정
- **선진국의 재정 지원**: 개발도상국에 연간 1,000억 달러 지원 약속
- **2016.11.4 발효**: 55개국 이상, 전 세계 온실가스 55% 이상 비준 조건 충족
- **미국 탈퇴(2020)-복귀(2021)**: 트럼프 행정부 탈퇴, 바이든 행정부 복귀

## 역사적 의의 (Historical Significance)
파리 협정은 교토 의정서(1997)의 한계를 극복하고, 선진국과 개발도상국 모두가 참여하는 보편적 기후 체제를 최초로 확립한 이정표이다. 탄소중립(Net Zero) 목표의 국제적 확산, ESG 투자, 재생에너지 전환 등 현대 기후 정책의 근거가 되고 있다.

---

# Paris Climate Agreement

## Overview
On December 12, 2015, 195 nations adopted the Paris Agreement at the 21st Conference of the Parties (COP21) to the United Nations Framework Convention on Climate Change. This historic international environmental accord committed signatories to limiting global average temperature rise to well below 2 degrees C above pre-industrial levels, with efforts to limit the increase to 1.5 degrees C.

## Key Details
- **Temperature targets**: Limit warming to below 2 degrees C, with a 1.5 degrees C aspiration
- **Nationally Determined Contributions (NDCs)**: Each country sets and implements voluntary emission reduction targets
- **Five-year review cycle**: Ratcheting up ambition every five years
- **Developed nation financing**: Commitment to $100 billion annually for developing countries
- **Entered into force November 4, 2016**: Ratification threshold (55 countries, 55% of global emissions) met
- **U.S. withdrawal (2020) and return (2021)**: Trump administration withdrew; Biden administration rejoined

## Historical Significance
The Paris Agreement overcame the limitations of the Kyoto Protocol (1997) by establishing the first universal climate framework involving both developed and developing nations. It underpins contemporary climate policy, including the spread of Net Zero targets, ESG investing, and the transition to renewable energy.`,

  "COVID-19 팬데믹": `# COVID-19 팬데믹

## 개요 (Overview)
2019년 12월, 중국 후베이성 우한시에서 원인 불명의 폐렴 환자가 보고되면서 시작된 코로나바이러스감염증-19(COVID-19)가 전 세계로 확산되었다. 2020년 3월 11일 세계보건기구(WHO)가 팬데믹을 선언하였으며, 2023년 5월 종료 선언까지 전 세계적으로 약 700만 명 이상이 사망하였다.

## 주요 내용 (Key Details)
- **병원체**: SARS-CoV-2 (코로나바이러스과)
- **최초 보고**: 2019년 12월 31일 중국 우한
- **WHO 팬데믹 선언**: 2020년 3월 11일
- **전 세계 감염자**: 약 7억 7,000만 명 이상 (확인 기준)
- **전 세계 사망자**: 약 700만 명 이상 (공식 집계, 실제는 1,500만~2,000만 추정)
- **백신 개발**: mRNA 백신(화이자-바이오엔텍, 모더나) 사상 최단기 개발 (약 11개월)
- **봉쇄 조치(lockdown)**: 전 세계적 이동 제한, 경제 활동 중단
- **경제 충격**: 2020년 세계 GDP 약 3.5% 감소, 대공황 이후 최악의 경기 침체

## 역사적 의의 (Historical Significance)
COVID-19 팬데믹은 세계화 시대의 감염병 위험을 적나라하게 보여주었으며, 공중보건 체계, 디지털 전환(원격근무-온라인 교육), 국제 협력의 중요성을 재확인시켰다. mRNA 백신의 성공적 개발은 의학사의 이정표이며, 팬데믹 대응 과정에서 발생한 개인의 자유 vs 공공의 안전이라는 법적 쟁점은 각국의 헌법적 논쟁을 촉발하였다.

---

# COVID-19 Pandemic

## Overview
In December 2019, cases of pneumonia of unknown cause were reported in Wuhan, Hubei Province, China, marking the emergence of Coronavirus Disease 2019 (COVID-19). The World Health Organization (WHO) declared a pandemic on March 11, 2020. By the time the emergency was declared over in May 2023, more than 7 million people had died worldwide.

## Key Details
- **Pathogen**: SARS-CoV-2 (Coronaviridae family)
- **First reported**: December 31, 2019, in Wuhan, China
- **WHO pandemic declaration**: March 11, 2020
- **Global infections**: Over 770 million confirmed cases
- **Global deaths**: Over 7 million officially recorded (actual estimates: 15-20 million)
- **Vaccine development**: mRNA vaccines (Pfizer-BioNTech, Moderna) developed in record time (~11 months)
- **Lockdowns**: Worldwide mobility restrictions and cessation of economic activity
- **Economic impact**: Global GDP contracted approximately 3.5% in 2020, the worst recession since the Great Depression

## Historical Significance
The COVID-19 pandemic starkly demonstrated the infectious disease risks of a globalized world and reaffirmed the importance of public health systems, digital transformation (remote work, online education), and international cooperation. The successful development of mRNA vaccines was a milestone in medical history. The legal tension between individual liberty and public safety that arose during pandemic response measures provoked constitutional debates in countries worldwide.`,

  "러시아-우크라이나 전쟁": `# 러시아-우크라이나 전쟁

## 개요 (Overview)
2022년 2월 24일, 러시아가 우크라이나에 대한 전면적인 군사 침공을 개시하였다. 블라디미르 푸틴 러시아 대통령은 "특별군사작전"이라 칭하였으나, 국제사회는 이를 주권국가에 대한 명백한 침략 전쟁으로 규정하였다. 2014년 크림반도 병합과 돈바스 분쟁에 이은 러시아의 확전이다.

## 주요 내용 (Key Details)
- **2014년 크림 병합**: 러시아의 크림반도 강제 병합, 돈바스 지역 분리주의 지원
- **2022.2.24 전면 침공**: 수도 키이우 포함 다방면 동시 공격
- **키이우 방어 성공**: 우크라이나군의 예상 밖 강력한 저항, 러시아군 키이우 철수(2022.4)
- **볼로디미르 젤렌스키**: 우크라이나 대통령의 항전 지도력이 국제적 상징
- **서방의 대러 제재**: SWIFT 차단, 자산 동결, 에너지 수입 제한 등 역사상 가장 강력한 경제제재
- **에너지 위기**: 유럽의 러시아 천연가스 의존이 에너지 안보 위기로 전화
- **전쟁 피해**: 2024년 기준 민간인 사망 약 10,000명 이상, 난민 약 630만 명 (UNHCR)

## 역사적 의의 (Historical Significance)
러시아-우크라이나 전쟁은 제2차 세계대전 이후 유럽 안보 질서의 근간이었던 주권 존중-무력 불사용 원칙의 심각한 위반이다. NATO의 결속 강화, 유럽 안보 구조의 재편, 핵 위협의 재부상, 글로벌 식량-에너지 위기 등 21세기 국제 질서에 깊은 영향을 미치고 있으며, 국제법상 침략 전쟁의 책임 문제가 핵심 쟁점으로 부상하였다.

---

# Russia-Ukraine War

## Overview
On February 24, 2022, Russia launched a full-scale military invasion of Ukraine. Russian President Vladimir Putin termed it a "special military operation," but the international community characterized it as an unambiguous war of aggression against a sovereign state. The invasion represented an escalation following Russia's 2014 annexation of Crimea and the Donbas conflict.

## Key Details
- **2014 Crimea annexation**: Russia's forcible incorporation of Crimea; support for separatists in the Donbas region
- **February 24, 2022, full-scale invasion**: Simultaneous multi-front attacks including the capital, Kyiv
- **Successful defense of Kyiv**: Unexpectedly fierce Ukrainian resistance; Russian forces withdrew from Kyiv (April 2022)
- **Volodymyr Zelensky**: Ukrainian president's wartime leadership became an international symbol
- **Western sanctions against Russia**: SWIFT exclusion, asset freezes, energy import restrictions-the most extensive economic sanctions in history
- **Energy crisis**: Europe's dependence on Russian natural gas transformed into an energy security crisis
- **War casualties**: Over 10,000 civilian deaths by 2024; approximately 6.3 million refugees (UNHCR)

## Historical Significance
The Russia-Ukraine War represents a grave violation of the principles of sovereignty and non-use of force that have underpinned the European security order since World War II. It has profoundly affected the 21st-century international order through NATO's strengthened cohesion, restructuring of European security architecture, the resurgence of nuclear threats, and the global food and energy crisis. The question of accountability for wars of aggression under international law has emerged as a central issue.`,

  // === seed-history.js에 있지만 위에서 커버되지 않은 이벤트들 ===

  "로마 12표법 제정": `# 로마 12표법 제정

## 개요 (Overview)
기원전 449년, 로마 공화정 시대에 제정된 최초의 성문법이다. 평민(plebeians)과 귀족(patricians) 간의 법적 분쟁을 해결하기 위해, 10인 위원회(Decemviri)가 그리스 아테네의 솔론 법을 연구한 뒤 12개의 청동판에 법률을 새겨 포룸에 공개하였다.

## 주요 내용 (Key Details)
- 12개의 청동 판(tabula)에 새겨 로마 포룸에 공개 게시
- 소송 절차, 가족법, 상속법, 재산법, 불법행위법 등 포괄
- "법의 공개" 원칙: 귀족의 법 독점을 깨뜨리고 모든 시민에게 법 내용 공개
- 채무 불이행 시 채권자의 가혹한 권리(채무 노예) 인정
- 평민과 귀족 간 통혼 금지 규정 포함 (이후 렉스 카눌레이아로 폐지)

## 역사적 의의 (Historical Significance)
12표법은 관습법을 성문화하여 법의 투명성과 평등한 적용의 기초를 마련하였다. 이후 로마법 발전의 출발점이 되었으며, 유스티니아누스 법전을 거쳐 현대 대륙법(civil law) 전통의 원류가 되었다.

---

# Twelve Tables of Rome

## Overview
In 449 BCE, the Twelve Tables were enacted as the first codified law of the Roman Republic. To resolve legal disputes between plebeians and patricians, a commission of ten men (Decemviri) studied the laws of Solon in Athens and inscribed laws on twelve bronze tablets, publicly displayed in the Forum.

## Key Details
- Inscribed on twelve bronze tablets and publicly displayed in the Roman Forum
- Covered procedural law, family law, inheritance, property, and delict (tort)
- Principle of "published law": broke the patrician monopoly on legal knowledge
- Recognized harsh creditor rights in cases of default (debt slavery)
- Prohibited intermarriage between plebeians and patricians (later repealed by the Lex Canuleia)

## Historical Significance
The Twelve Tables established the foundations for legal transparency and equal application by codifying customary law. They served as the starting point for Roman legal development, which through the Corpus Juris Civilis of Justinian became the origin of the modern civil law tradition.`,

  "한니발의 알프스 횡단": `# 한니발의 알프스 횡단

## 개요 (Overview)
기원전 218년, 카르타고의 명장 한니발 바르카(Hannibal Barca, 기원전 247~183년)가 약 5만 명의 보병, 9,000명의 기병, 37마리의 전투 코끼리를 이끌고 알프스 산맥을 넘어 이탈리아를 직접 공격하였다. 제2차 포에니 전쟁(기원전 218~201년)의 시작이다.

## 주요 내용 (Key Details)
- **알프스 횡단**: 15일간의 험난한 산악 행군, 약 절반의 병력 손실
- **칸나에 전투(기원전 216)**: 약 5만~7만 로마군 전멸, 군사사상 최고의 포위 섬멸전
- 그러나 로마 본국 공격에는 실패
- 기원전 202년 자마 전투에서 스키피오에게 패배

## 역사적 의의 (Historical Significance)
한니발의 알프스 횡단은 군사 역사상 가장 대담한 전략적 기동 중 하나로 평가된다. 칸나에 전투는 오늘날까지 군사 전략의 교과서적 사례로 연구되며, 로마는 이 전쟁을 통해 지중해 패권을 확립하게 된다.

---

# Hannibal's Crossing of the Alps

## Overview
In 218 BCE, the Carthaginian general Hannibal Barca (247-183 BCE) led approximately 50,000 infantry, 9,000 cavalry, and 37 war elephants across the Alps to directly attack Italy, beginning the Second Punic War (218-201 BCE).

## Key Details
- **Alpine crossing**: 15-day grueling mountain march; approximately half the force was lost
- **Battle of Cannae (216 BCE)**: 50,000-70,000 Romans killed; history's most celebrated double envelopment
- Failed to attack Rome directly; strategic deadlock ensued
- Defeated by Scipio Africanus at the Battle of Zama (202 BCE)

## Historical Significance
Hannibal's Alpine crossing is regarded as one of the most audacious strategic maneuvers in military history. The Battle of Cannae remains a textbook case in military strategy, and through the war against Hannibal, Rome established its hegemony over the Mediterranean.`,

  "유럽경제공동체(EEC) 설립": `# 유럽경제공동체(EEC) 설립

## 개요 (Overview)
1957년 3월 25일, 프랑스, 서독, 이탈리아, 벨기에, 네덜란드, 룩셈부르크 6개국이 로마 조약에 서명하여 유럽경제공동체(EEC)를 설립하였다. 현재 유럽연합(EU)의 직접적 전신이다.

## 주요 내용 (Key Details)
- **공동 시장**: 회원국 간 관세 철폐, 노동-자본-상품의 자유로운 이동
- **공동 농업 정책(CAP)**: 농업 보조금과 가격 안정화
- **마스트리히트 조약(1992)**: EEC를 유럽연합(EU)으로 발전

## 역사적 의의 (Historical Significance)
EEC는 두 차례의 세계대전으로 황폐해진 유럽에서 경제적 통합을 통해 평화를 추구한 역사적 실험이었다. 이후 EU로 발전하여 27개 회원국, 인구 4.5억의 세계 최대 경제 블록이 되었다.

---

# Establishment of the European Economic Community (EEC)

## Overview
On March 25, 1957, six nations-France, West Germany, Italy, Belgium, the Netherlands, and Luxembourg-signed the Treaty of Rome, establishing the European Economic Community (EEC), the direct predecessor of today's EU.

## Key Details
- **Common market**: Elimination of tariffs; free movement of labor, capital, and goods
- **Common Agricultural Policy (CAP)**: Agricultural subsidies and price stabilization
- **Maastricht Treaty (1992)**: Transformed the EEC into the European Union (EU)

## Historical Significance
The EEC was a historic experiment in pursuing peace through economic integration in a Europe devastated by two world wars. It evolved into the EU-the world's largest economic bloc with 27 member states and 450 million people.`,

};

async function seed() {
  // 모든 history_events 가져오기
  const allEvents = await db.select().from(historyEvents);
  console.log(`Processing ${allEvents.length} history events...`);

  for (const event of allEvents) {
    // 날짜 문자열 생성
    let dateStr = null;
    if (event.year > 0) {
      dateStr = `${event.year}`;
      if (event.month) dateStr += `-${String(event.month).padStart(2, "0")}`;
      else dateStr += "-01";
      if (event.day) dateStr += `-${String(event.day).padStart(2, "0")}`;
      else dateStr += "-01";
    }

    // 상세 본문 (있으면 사용, 없으면 기본 생성)
    const detailedContent = DETAILED_CONTENT[event.title] || generateDefaultContent(event);

    const plainText = detailedContent
      .replace(/#{1,6}\s+/g, "").replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1").replace(/- /g, "").trim();

    // 문서 생성
    const [doc] = await db.insert(documents).values({
      documentType: "note",
      title: `[세계사] ${event.title}`,
      subtitle: event.description,
      author: null,
      source: event.source || `세계사 기록 — ${event.region || ""}`,
      publishedDate: dateStr,
      contentMarkdown: detailedContent,
      contentPlain: plainText,
      summary: event.description,
      status: "completed",
      importance: event.importance,
      metadata: JSON.stringify({
        historyEventId: event.id,
        category: event.category,
        region: event.region,
        country: event.country,
        year: event.year,
        endYear: event.endYear,
      }),
    }).returning();

    // history_events에 relatedDocumentId 연결
    await db.update(historyEvents)
      .set({ relatedDocumentId: doc.id })
      .where(eq(historyEvents.id, event.id));

    console.log(`  ✓ ${event.title} → document ${doc.id}`);
  }

  console.log("\nDone! All history events linked to documents.");
  process.exit(0);
}

function generateDefaultContent(event) {
  const yearStr = event.year < 0 ? `기원전 ${Math.abs(event.year)}년` : `${event.year}년`;
  const yearStrEn = event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`;
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  let content = `# ${event.title}\n\n`;
  content += `## 개요 (Overview)\n`;
  content += `- **시기**: ${yearStr}`;
  if (event.endYear) content += ` ~ ${event.endYear}년`;
  content += `\n`;
  content += `- **분류**: ${catLabel}\n`;
  if (event.region) content += `- **지역**: ${event.region}\n`;
  if (event.country) content += `- **국가**: ${event.country}\n`;
  content += `- **중요도**: ${"★".repeat(event.importance)}${"☆".repeat(5 - event.importance)}\n\n`;
  content += `## 주요 내용 (Key Details)\n${event.description || "상세 내용 추가 필요."}\n\n`;
  content += `## 역사적 의의 (Historical Significance)\n이 사건은 ${catLabel} 분야에서 중요한 전환점이 되었다.\n`;
  if (event.source) content += `\n## 출처\n${event.source}\n`;
  content += `\n---\n\n`;
  content += `# ${event.title}\n\n`;
  content += `## Overview\n`;
  content += `- **Period**: ${yearStrEn}`;
  if (event.endYear) content += ` - ${event.endYear} CE`;
  content += `\n`;
  content += `- **Category**: ${event.category}\n`;
  if (event.region) content += `- **Region**: ${event.region}\n`;
  if (event.country) content += `- **Country**: ${event.country}\n`;
  content += `- **Importance**: ${"★".repeat(event.importance)}${"☆".repeat(5 - event.importance)}\n\n`;
  content += `## Key Details\n${event.description || "Additional details needed."}\n\n`;
  content += `## Historical Significance\nThis event was a significant turning point in the field of ${event.category}.\n`;
  return content;
}

seed().catch((e) => { console.error(e); process.exit(1); });
