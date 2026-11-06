/* ==========================================================
   CAMT NEXTOPIA — ข้อมูลสาขา + คำถาม
   ข้อมูลสาขาอ้างอิงจาก Presentation CAMT 2026
   ========================================================== */

const MAJORS = {
  SE: {
    code: "SE",
    nameEN: "Software Engineering",
    nameTH: "วิศวกรรมซอฟต์แวร์",
    program: "International Program (หลักสูตรนานาชาติ)",
    district: "CODE SPIRE",
    districtTH: "หอคอยโค้ด",
    persona: "The Code Architect",
    personaTH: "สถาปนิกแห่งโค้ด",
    icon: "code",
    color: "#2F62D9",
    ink: "#FFFFFF",
    tagline: "คุณคือคนที่สร้างระบบที่ทั้งเมืองต้องพึ่งพา",
    desc:
      "คุณชอบคิดเป็นระบบ แก้ปัญหาทีละขั้น และรู้สึกฟินทุกครั้งที่โค้ดรันผ่าน " +
      "ในเนกซ์โทเปีย คุณคือผู้ออกแบบสมองกลที่ทำให้ไฮเปอร์ลูป ไฟจราจร และแอปทั้งเมืองทำงานได้ไม่สะดุด",
    subjects: [
      "Computer and Programming",
      "Abstract Data Type and Problem Solving",
      "Web User Interface Design and Development",
      "Algorithms Design and Analysis",
      "Object Oriented Programming",
      "Database Systems and Database Systems Design",
    ],
    careers: [
      "Front End / Back End Developer",
      "System Analysis",
      "UX / UI Designer",
      "Dev Ops / Full Stack Developer",
      "Software Architect",
      "Software Quality Assurance",
    ],
  },
  MMIT: {
    code: "MMIT",
    nameEN: "Modern Management and Information Technology",
    nameTH: "การจัดการสมัยใหม่และเทคโนโลยีสารสนเทศ",
    program: "Thai Program & International Program",
    district: "NEXUS EXCHANGE",
    districtTH: "ศูนย์กลางธุรกิจเน็กซัส",
    persona: "The Nexus Strategist",
    personaTH: "นักวางกลยุทธ์ดิจิทัล",
    icon: "chart",
    color: "#E9A319",
    ink: "#161616",
    tagline: "คุณคือคนที่เชื่อมเทคโนโลยีเข้ากับธุรกิจ",
    desc:
      "คุณมองเห็นภาพรวม ชอบวางแผน อ่านข้อมูลเป็น และรู้ว่าเทคโนโลยีจะสร้างมูลค่าได้อย่างไร " +
      "ในเนกซ์โทเปีย คุณคือคนที่ทำให้ธุรกิจทั้งเมืองเติบโตด้วยข้อมูลและ AI",
    subjects: [
      "Database Business Administrators",
      "Web Site Developer",
      "Sale IT",
      "Data Analyst",
      "Business Analyst",
      "Test Engineer",
      "AI and Automation",
    ],
    careers: [
      "Business Owners",
      "ERP Assistant",
      "IT Sale and Solution",
      "IT Support",
      "Production and Logistic Planner",
      "Web Application Developer",
      "Business Database Administrator",
    ],
  },
  ANI: {
    code: "ANI",
    nameEN: "Animation and Visual Effect",
    nameTH: "แอนนิเมชันและวิชวลเอฟเฟกต์",
    program: "Thai Program",
    district: "PRISM STUDIO",
    districtTH: "โดมปริซึมสตูดิโอ",
    persona: "The Dream Weaver",
    personaTH: "ผู้ถักทอจินตนาการ",
    icon: "film",
    color: "#D8457F",
    ink: "#FFFFFF",
    tagline: "คุณคือคนที่เปลี่ยนจินตนาการให้กลายเป็นภาพ",
    desc:
      "คุณมีตาที่มองเห็นความงาม ชอบเล่าเรื่องผ่านภาพ แสง สี และการเคลื่อนไหว " +
      "ในเนกซ์โทเปีย คุณคือผู้สร้างโฮโลแกรมยักษ์และหนังแอนิเมชันที่ฉายเหนือฟากฟ้าของเมือง",
    subjects: [
      "Sketch Drawing",
      "2D / 3D Modeling and Animation Design",
      "Fundamental Design in Digital Arts",
      "Computer Animation Production",
      "Composite",
      "Digital Cinematography",
      "Lighting and Rendering",
    ],
    careers: [
      "Animator",
      "Digital Artist",
      "Animation Producer",
      "Digital Modeller",
      "Visual Effects Producer",
      "Computer Graphic Designer",
      "Digital Imaging Technicians",
      "Colorists",
    ],
  },
  DG: {
    code: "DG",
    nameEN: "Digital Game",
    nameTH: "ดิจิทัลเกม",
    program: "Thai Program",
    district: "ARCADE ARENA",
    districtTH: "อารีน่าแห่งเกม",
    persona: "The World Builder",
    personaTH: "ผู้สร้างโลกเสมือน",
    icon: "gamepad",
    color: "#2E9E68",
    ink: "#FFFFFF",
    tagline: "คุณคือคนที่สร้างโลกใหม่ให้คนอื่นเข้าไปเล่น",
    desc:
      "คุณรักความสนุก ชอบผสมทั้งศิลปะ เรื่องราว และโค้ดเข้าด้วยกัน " +
      "ในเนกซ์โทเปีย คุณคือผู้ออกแบบโลก VR และอารีน่าอีสปอร์ตที่คนทั้งเมืองเข้ามาเล่น",
    subjects: [
      "Computer and Programming for Game",
      "Game Development",
      "Artificial Intelligence for Game Development",
      "Database and Network for Game Development",
      "Multiplayer Online Game Development",
      "Serious Games Design and Applications",
    ],
    careers: [
      "Game Developer",
      "Interactive Application Developer",
      "Game Designer",
      "Game Tester and Analyst",
      "Graphic Game Designer",
      "Computer Specialist",
      "Digital Game Entrepreneur",
    ],
  },
  DII: {
    code: "DII",
    nameEN: "Digital Industry Integration",
    nameTH: "บูรณาการอุตสาหกรรมดิจิทัล",
    program: "Thai Program",
    district: "SYNTH FORGE",
    districtTH: "โรงงานซินธ์ฟอร์จ",
    persona: "The Automation Visionary",
    personaTH: "ผู้พลิกโฉมอุตสาหกรรม",
    icon: "robot",
    color: "#7A55CC",
    ink: "#FFFFFF",
    tagline: "คุณคือคนที่ทำให้ทุกอย่างทำงานได้เอง",
    desc:
      "คุณชอบลงมือ ชอบเห็นของจริงทำงาน และหาทางทำให้งานซ้ำ ๆ หายไปด้วย AI โดรน และระบบอัตโนมัติ " +
      "ในเนกซ์โทเปีย คุณคือผู้ควบคุมฟาร์มอัจฉริยะ หุ่นยนต์ และโดรนเฝ้าระวังไฟป่าของเมือง",
    subjects: [
      "Product and Service in Digital Industry",
      "Digital Industry Process",
      "Automated Test",
      "Programming for Digital Automation",
      "AI for Workflow Automation",
    ],
    careers: [
      "Business Analyst",
      "Automation Engineer (RPA)",
      "AI Engineer",
      "UX/UI Designer",
      "Digital System Officers",
      "Digital Technology Planners and Developer",
    ],
  },
};

/* แต่ละตัวเลือกให้คะแนน { สาขา: คะแนน } */
const QUESTIONS = [
  {
    zone: "HYPERLOOP GATE",
    q: "ไฮเปอร์ลูปพาคุณมาถึงนครเนกซ์โทเปีย ปี 2099 สิ่งแรกที่อยากไปดูคือ?",
    options: [
      { t: "ศูนย์ควบคุม AI ที่รันทั้งเมือง อยากเห็นโค้ดเบื้องหลัง", s: { SE: 3, DII: 1 } },
      { t: "ตลาดดิจิทัลกลางเมือง ดูว่าธุรกิจไหนกำลังมาแรง", s: { MMIT: 3 } },
      { t: "โรงหนังโฮโลแกรม 360° ที่ฉายแอนิเมชันลอยกลางฟ้า", s: { ANI: 3 } },
      { t: "อารีน่าอีสปอร์ตที่กำลังแข่งทัวร์นาเมนต์ระดับจักรวาล", s: { DG: 3 } },
      { t: "ฟาร์มลอยฟ้าที่โดรนกับหุ่นยนต์ทำงานกันเอง", s: { DII: 3 } },
    ],
  },
  {
    zone: "NEON PLAZA",
    q: "ได้รับภารกิจทีมจากสภาเมือง บทบาทที่คุณถนัดที่สุดคือ?",
    options: [
      { t: "หัวหน้าทีม วางแผน แบ่งงาน คุมงบ และพรีเซนต์", s: { MMIT: 3 } },
      { t: "คนลงมือสร้างระบบหลัก ให้ทุกอย่างทำงานได้จริง", s: { SE: 3 } },
      { t: "ฝ่ายภาพ ทำวิดีโอ โปสเตอร์ งานดีไซน์ให้ปัง", s: { ANI: 3 } },
      { t: "คนคิดไอเดียสนุก ๆ ที่ทำให้ผลงานไม่เหมือนใคร", s: { DG: 3, ANI: 1 } },
      { t: "คนหาเครื่องมือ/AI มาช่วยให้ทีมทำงานเร็วขึ้น 10 เท่า", s: { DII: 3, MMIT: 1 } },
    ],
  },
  {
    zone: "SKY GARDEN",
    q: "วันหยุดในเมืองแห่งอนาคต คุณใช้เวลาไปกับ...",
    options: [
      { t: "ดำดิ่งเข้าโลก VR ตะลุยเกมกับเพื่อนทั่วโลก", s: { DG: 3 } },
      { t: "วาดรูป ปั้นโมเดล 3D หรือตัดต่อคลิปสวย ๆ", s: { ANI: 3 } },
      { t: "เขียนแอป/เว็บเล็ก ๆ ไว้ใช้เองแบบสนุก ๆ", s: { SE: 3 } },
      { t: "ขายของออนไลน์ ส่องเทรนด์ ดูตัวเลขยอดขาย", s: { MMIT: 3 } },
      { t: "ประกอบโดรน ต่อบอร์ด IoT ให้บ้านฉลาดขึ้น", s: { DII: 3 } },
    ],
  },
  {
    zone: "DATA LIBRARY",
    q: "ที่โรงเรียน วิชา/เรื่องแบบไหนที่คุณรู้สึกว่า 'ใช่' ที่สุด?",
    options: [
      { t: "คณิต ตรรกะ โจทย์ที่ต้องคิดเป็นขั้นตอน", s: { SE: 3, DG: 1 } },
      { t: "ศิลปะ การออกแบบ ถ่ายภาพ ทำหนังสั้น", s: { ANI: 3 } },
      { t: "สังคม ธุรกิจ การนำเสนอ คุยกับคน", s: { MMIT: 3 } },
      { t: "ชอบหลายอย่างผสมกัน ทั้งเล่าเรื่อง ศิลป์ และคอม", s: { DG: 3 } },
      { t: "วิทยาศาสตร์ การทดลอง เห็นของจริงทำงาน", s: { DII: 3 } },
    ],
  },
  {
    zone: "CIVIC CORE",
    q: "เมืองขอให้คุณสร้างสิ่งที่ทำให้ชีวิตคนในเมืองดีขึ้น คุณเลือก...",
    options: [
      { t: "แอปที่คนเป็นล้านใช้พร้อมกันได้ เสถียร ไม่มีล่ม", s: { SE: 3 } },
      { t: "แพลตฟอร์มข้อมูลที่ช่วยร้านเล็ก ๆ ขายดีขึ้น", s: { MMIT: 3, DII: 1 } },
      { t: "ระบบโดรน + AI ตรวจจับไฟป่าแบบอัตโนมัติ", s: { DII: 3 } },
      { t: "เกมที่สอนเรื่องสำคัญได้สนุกจนลืมว่ากำลังเรียน", s: { DG: 3 } },
      { t: "แอนิเมชันสั้นที่ทำให้คนทั้งเมืองซึ้งและเปลี่ยนความคิด", s: { ANI: 3 } },
    ],
  },
  {
    zone: "FUTURE TOWER",
    q: "ขึ้นลิฟต์ไปชั้นบนสุดของ Future Tower — อีก 10 ปี คุณเห็นตัวเองเป็น...",
    options: [
      { t: "Software Architect ในบริษัทเทคระดับโลก", s: { SE: 3 } },
      { t: "เจ้าของธุรกิจ / Business Analyst มือฉมัง", s: { MMIT: 3 } },
      { t: "Animator / VFX Artist ในสตูดิโอระดับโลก", s: { ANI: 3 } },
      { t: "Game Designer ที่มีเกมเป็นของตัวเอง", s: { DG: 3 } },
      { t: "AI / Automation Engineer ที่พลิกโฉมอุตสาหกรรม", s: { DII: 3 } },
    ],
  },
];

const CAMT_FACTS = [
  { k: "2003", v: "ก่อตั้ง" },
  { k: "1,715", v: "นักศึกษา (นานาชาติ 300)" },
  { k: "97", v: "อาจารย์" },
  { k: "29", v: "มหาวิทยาลัยพันธมิตรทั่วโลก" },
];

const CAMT_PERKS = [
  "ทุนเรียนดี 5,000 บาท (40 ทุน/ปี)",
  "ทุนสนับสนุนประกวด/แข่งขัน รวม 500,000 บาท/ปี",
  "ทุนสร้างสรรค์กิจกรรม สูงสุด 20,000 บาท/ทุน",
  "ทุนทำงาน ชั่วโมงละ 50 บาท",
  "ใช้ Gemini Pro · Adobe CC · Canva Pro · Grammarly ฟรี",
  "ศูนย์การเรียนรู้อีสปอร์ตภาคเหนือ (NREL)",
  "ฝึกงานกับบริษัทชั้นนำ Google · Agoda · SCG และอีกมากมาย",
];
