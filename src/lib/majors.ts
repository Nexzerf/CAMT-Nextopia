import type { IconName } from "./icons";
export type MajorCode = "SE" | "MMIT" | "ANI" | "DG" | "DII";

export interface Major {
  /** หมายเลขชุดตัวละครใน sprite.ts (OUTFITS) */
  id: number;
  code: MajorCode;
  slug: string;
  nameTH: string;
  nameEN: string;
  program: string;
  persona: string;
  personaTH: string;
  uniform: string;
  icon: IconName;
  color: string;
  tagline: string;
  desc: string;
  highlights: [string, string, string];
  subjects: string[];
  careers: string[];
}

/** ข้อมูลสาขาอ้างอิงจาก Presentation CAMT 2026 */
export const MAJORS: Record<MajorCode, Major> = {
  SE: {
    id: 2,
    code: "SE",
    slug: "code-architect",
    nameTH: "วิศวกรรมซอฟต์แวร์",
    nameEN: "Software Engineering",
    program: "International Program (หลักสูตรนานาชาติ)",
    persona: "The Code Architect",
    personaTH: "สถาปนิกแห่งโค้ด",
    uniform: "ฮู้ดดี้ + แล็ปท็อป",
    icon: "laptop",
    color: "#3b6fd8",
    tagline: "คุณคือคนที่สร้างระบบที่ทั้งเมืองต้องพึ่งพา",
    desc: "คุณชอบคิดเป็นระบบ แก้ปัญหาทีละขั้น และรู้สึกฟินทุกครั้งที่โค้ดรันผ่าน ในเนกซ์โทเปีย คุณคือผู้ออกแบบสมองกลที่ทำให้ไฮเปอร์ลูป ไฟจราจร และแอปทั้งเมืองทำงานได้ไม่สะดุด",
    highlights: ["คิดเป็นระบบ แก้ปัญหาทีละขั้น", "ชอบสร้างของที่คนใช้ได้จริง", "สนุกกับโค้ดและเทคโนโลยี"],
    subjects: ["Computer and Programming", "Abstract Data Type and Problem Solving", "Web User Interface Design and Development", "Algorithms Design and Analysis", "Object Oriented Programming", "Database Systems and Database Systems Design"],
    careers: ["Front End / Back End Developer", "System Analysis", "UX / UI Designer", "Dev Ops / Full Stack Developer", "Software Architect", "Software Quality Assurance"],
  },
  MMIT: {
    id: 5,
    code: "MMIT",
    slug: "nexus-strategist",
    nameTH: "การจัดการสมัยใหม่และเทคโนโลยีสารสนเทศ",
    nameEN: "Modern Management and Information Technology",
    program: "Thai Program & International Program",
    persona: "The Nexus Strategist",
    personaTH: "นักวางกลยุทธ์ดิจิทัล",
    uniform: "เชิ้ต + เน็กไท + แท็บเล็ต",
    icon: "moneybag",
    color: "#e0a21a",
    tagline: "คุณคือคนที่เชื่อมเทคโนโลยีเข้ากับธุรกิจ",
    desc: "คุณมองเห็นภาพรวม ชอบวางแผน อ่านข้อมูลเป็น และรู้ว่าเทคโนโลยีจะสร้างมูลค่าได้อย่างไร ในเนกซ์โทเปีย คุณคือคนที่ทำให้ธุรกิจทั้งเมืองเติบโตด้วยข้อมูลและ AI",
    highlights: ["มองภาพรวม วางแผนเก่ง", "อ่านข้อมูลแล้วตัดสินใจได้", "เชื่อมเทคโนโลยีเข้ากับธุรกิจ"],
    subjects: ["Database Business Administrators", "Web Site Developer", "Sale IT", "Data Analyst", "Business Analyst", "Test Engineer", "AI and Automation"],
    careers: ["Business Owners", "ERP Assistant", "IT Sale and Solution", "IT Support", "Production and Logistic Planner", "Web Application Developer", "Business Database Administrator"],
  },
  ANI: {
    id: 10,
    code: "ANI",
    slug: "dream-weaver",
    nameTH: "แอนนิเมชันและวิชวลเอฟเฟกต์",
    nameEN: "Animation and Visual Effect",
    program: "Thai Program",
    persona: "The Dream Weaver",
    personaTH: "ผู้ถักทอจินตนาการ",
    uniform: "เสื้อสีสด + โทรโข่ง",
    icon: "palette",
    color: "#e0438f",
    tagline: "คุณคือคนที่เปลี่ยนจินตนาการให้กลายเป็นภาพ",
    desc: "คุณมีตาที่มองเห็นความงาม ชอบเล่าเรื่องผ่านภาพ แสง สี และการเคลื่อนไหว ในเนกซ์โทเปีย คุณคือผู้สร้างโฮโลแกรมยักษ์และหนังแอนิเมชันที่ฉายเหนือฟากฟ้าของเมือง",
    highlights: ["ตาไวเรื่องความงาม แสง สี", "เล่าเรื่องผ่านภาพได้", "จินตนาการไม่มีลิมิต"],
    subjects: ["Sketch Drawing", "2D / 3D Modeling and Animation Design", "Fundamental Design in Digital Arts", "Computer Animation Production", "Composite", "Digital Cinematography", "Lighting and Rendering"],
    careers: ["Animator", "Digital Artist", "Animation Producer", "Digital Modeller", "Visual Effects Producer", "Computer Graphic Designer", "Digital Imaging Technicians", "Colorists"],
  },
  DG: {
    id: 11,
    code: "DG",
    slug: "world-builder",
    nameTH: "ดิจิทัลเกม",
    nameEN: "Digital Game",
    program: "Thai Program",
    persona: "The World Builder",
    personaTH: "ผู้สร้างโลกเสมือน",
    uniform: "ยูนิฟอร์ม + หูฟังเกมมิ่ง",
    icon: "gamepad",
    color: "#2fa86a",
    tagline: "คุณคือคนที่สร้างโลกใหม่ให้คนอื่นเข้าไปเล่น",
    desc: "คุณรักความสนุก ชอบผสมทั้งศิลปะ เรื่องราว และโค้ดเข้าด้วยกัน ในเนกซ์โทเปีย คุณคือผู้ออกแบบโลก VR และอารีน่าอีสปอร์ตที่คนทั้งเมืองเข้ามาเล่น",
    highlights: ["ผสมศิลปะ เรื่องราว และโค้ดได้", "คิดเรื่องสนุกให้คนอื่นเล่น", "ชอบทดลองไอเดียแปลกใหม่"],
    subjects: ["Computer and Programming for Game", "Game Development", "Artificial Intelligence for Game Development", "Database and Network for Game Development", "Multiplayer Online Game Development", "Serious Games Design and Applications"],
    careers: ["Game Developer", "Interactive Application Developer", "Game Designer", "Game Tester and Analyst", "Graphic Game Designer", "Computer Specialist", "Digital Game Entrepreneur"],
  },
  DII: {
    id: 4,
    code: "DII",
    slug: "automation-visionary",
    nameTH: "บูรณาการอุตสาหกรรมดิจิทัล",
    nameEN: "Digital Industry Integration",
    program: "Thai Program",
    persona: "The Automation Visionary",
    personaTH: "ผู้พลิกโฉมอุตสาหกรรม",
    uniform: "ชุดช่าง + กล่องเครื่องมือ",
    icon: "robot",
    color: "#7a55cc",
    tagline: "คุณคือคนที่ทำให้ทุกอย่างทำงานได้เอง",
    desc: "คุณชอบลงมือ ชอบเห็นของจริงทำงาน และหาทางทำให้งานซ้ำ ๆ หายไปด้วย AI โดรน และระบบอัตโนมัติ ในเนกซ์โทเปีย คุณคือผู้ควบคุมฟาร์มอัจฉริยะ หุ่นยนต์ และโดรนเฝ้าระวังไฟป่าของเมือง",
    highlights: ["ชอบลงมือ เห็นของจริงทำงาน", "หาทางทำงานซ้ำ ๆ ให้เป็นอัตโนมัติ", "สนใจ AI โดรน และ IoT"],
    subjects: ["Product and Service in Digital Industry", "Digital Industry Process", "Automated Test", "Programming for Digital Automation", "AI for Workflow Automation"],
    careers: ["Business Analyst", "Automation Engineer (RPA)", "AI Engineer", "UX/UI Designer", "Digital System Officers", "Digital Technology Planners and Developer"],
  },
};

export const MAJOR_ORDER: MajorCode[] = ["SE", "MMIT", "ANI", "DG", "DII"];

export const CAMT_FACTS: { k: string; v: string }[] = [{"k": "2003", "v": "ก่อตั้ง"}, {"k": "1,715", "v": "นักศึกษา (นานาชาติ 300)"}, {"k": "97", "v": "อาจารย์"}, {"k": "29", "v": "มหาวิทยาลัยพันธมิตรทั่วโลก"}];

export const CAMT_PERKS: string[] = ["ทุนเรียนดี 5,000 บาท (40 ทุน/ปี)", "ทุนสนับสนุนประกวด/แข่งขัน รวม 500,000 บาท/ปี", "ทุนสร้างสรรค์กิจกรรม สูงสุด 20,000 บาท/ทุน", "ทุนทำงาน ชั่วโมงละ 50 บาท", "ใช้ Gemini Pro · Adobe CC · Canva Pro · Grammarly ฟรี", "ศูนย์การเรียนรู้อีสปอร์ตภาคเหนือ (NREL)", "ฝึกงานกับบริษัทชั้นนำ Google · Agoda · SCG และอีกมากมาย"];

export interface Option {
  text: string;
  score: Partial<Record<MajorCode, number>>;
}

export interface Question {
  icon: IconName;
  zone: string;
  text: string;
  options: Option[];
}

export const QUESTIONS: Question[] = [
  {
    icon: "rocket",
    zone: "HYPERLOOP GATE",
    text: "ไฮเปอร์ลูปพาคุณมาถึงนครเนกซ์โทเปีย ปี 2099 สิ่งแรกที่อยากไปดูคือ?",
    options: [
      { text: "ศูนย์ควบคุม AI ที่รันทั้งเมือง อยากเห็นโค้ดเบื้องหลัง", score: {"SE": 3, "DII": 1} },
      { text: "ตลาดดิจิทัลกลางเมือง ดูว่าธุรกิจไหนกำลังมาแรง", score: {"MMIT": 3} },
      { text: "โรงหนังโฮโลแกรม 360° ที่ฉายแอนิเมชันลอยกลางฟ้า", score: {"ANI": 3} },
      { text: "อารีน่าอีสปอร์ตที่กำลังแข่งทัวร์นาเมนต์ระดับจักรวาล", score: {"DG": 3} },
      { text: "ฟาร์มลอยฟ้าที่โดรนกับหุ่นยนต์ทำงานกันเอง", score: {"DII": 3} },
    ],
  },
  {
    icon: "team",
    zone: "NEON PLAZA",
    text: "ได้รับภารกิจทีมจากสภาเมือง บทบาทที่คุณถนัดที่สุดคือ?",
    options: [
      { text: "หัวหน้าทีม วางแผน แบ่งงาน คุมงบ และพรีเซนต์", score: {"MMIT": 3} },
      { text: "คนลงมือสร้างระบบหลัก ให้ทุกอย่างทำงานได้จริง", score: {"SE": 3} },
      { text: "ฝ่ายภาพ ทำวิดีโอ โปสเตอร์ งานดีไซน์ให้ปัง", score: {"ANI": 3} },
      { text: "คนคิดไอเดียสนุก ๆ ที่ทำให้ผลงานไม่เหมือนใคร", score: {"DG": 3, "ANI": 1} },
      { text: "คนหาเครื่องมือ/AI มาช่วยให้ทีมทำงานเร็วขึ้น 10 เท่า", score: {"DII": 3, "MMIT": 1} },
    ],
  },
  {
    icon: "sun",
    zone: "SKY GARDEN",
    text: "วันหยุดในเมืองแห่งอนาคต คุณใช้เวลาไปกับ...",
    options: [
      { text: "ดำดิ่งเข้าโลก VR ตะลุยเกมกับเพื่อนทั่วโลก", score: {"DG": 3} },
      { text: "วาดรูป ปั้นโมเดล 3D หรือตัดต่อคลิปสวย ๆ", score: {"ANI": 3} },
      { text: "เขียนแอป/เว็บเล็ก ๆ ไว้ใช้เองแบบสนุก ๆ", score: {"SE": 3} },
      { text: "ขายของออนไลน์ ส่องเทรนด์ ดูตัวเลขยอดขาย", score: {"MMIT": 3} },
      { text: "ประกอบโดรน ต่อบอร์ด IoT ให้บ้านฉลาดขึ้น", score: {"DII": 3} },
    ],
  },
  {
    icon: "books",
    zone: "DATA LIBRARY",
    text: "ที่โรงเรียน วิชา/เรื่องแบบไหนที่คุณรู้สึกว่า 'ใช่' ที่สุด?",
    options: [
      { text: "คณิต ตรรกะ โจทย์ที่ต้องคิดเป็นขั้นตอน", score: {"SE": 3, "DG": 1} },
      { text: "ศิลปะ การออกแบบ ถ่ายภาพ ทำหนังสั้น", score: {"ANI": 3} },
      { text: "สังคม ธุรกิจ การนำเสนอ คุยกับคน", score: {"MMIT": 3} },
      { text: "ชอบหลายอย่างผสมกัน ทั้งเล่าเรื่อง ศิลป์ และคอม", score: {"DG": 3} },
      { text: "วิทยาศาสตร์ การทดลอง เห็นของจริงทำงาน", score: {"DII": 3} },
    ],
  },
  {
    icon: "brain",
    zone: "CIVIC CORE",
    text: "เมืองขอให้คุณสร้างสิ่งที่ทำให้ชีวิตคนในเมืองดีขึ้น คุณเลือก...",
    options: [
      { text: "แอปที่คนเป็นล้านใช้พร้อมกันได้ เสถียร ไม่มีล่ม", score: {"SE": 3} },
      { text: "แพลตฟอร์มข้อมูลที่ช่วยร้านเล็ก ๆ ขายดีขึ้น", score: {"MMIT": 3, "DII": 1} },
      { text: "ระบบโดรน + AI ตรวจจับไฟป่าแบบอัตโนมัติ", score: {"DII": 3} },
      { text: "เกมที่สอนเรื่องสำคัญได้สนุกจนลืมว่ากำลังเรียน", score: {"DG": 3} },
      { text: "แอนิเมชันสั้นที่ทำให้คนทั้งเมืองซึ้งและเปลี่ยนความคิด", score: {"ANI": 3} },
    ],
  },
  {
    icon: "ladder",
    zone: "FUTURE TOWER",
    text: "ชั้นบนสุดของ Future Tower มีห้องทำงานในฝันรออยู่ 5 ห้อง คุณจะเปิดห้องไหน?",
    options: [
      { text: "ห้องเงียบ ๆ มีปริศนายาก ๆ รอให้ค่อย ๆ ไขทีละขั้น", score: {"SE": 3} },
      { text: "ห้องประชุมกระจกมองเห็นทั้งเมือง ได้คุยและตัดสินใจเรื่องสำคัญกับทีม", score: {"MMIT": 3} },
      { text: "สตูดิโอที่เต็มไปด้วยภาพสเก็ตช์ แสงไฟ และสีสัน", score: {"ANI": 3} },
      { text: "ห้องที่มีเพื่อน ๆ กำลังเล่นสิ่งที่คุณสร้าง แล้วหัวเราะกันลั่น", score: {"DG": 3} },
      { text: "ห้องแล็บที่มีหุ่นยนต์และเครื่องจักรรอให้คุณลองสั่งงาน", score: {"DII": 3} },
    ],
  },
];
