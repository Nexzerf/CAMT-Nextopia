import type { MajorCode } from "./majors";

/**
 * ข้อมูลหลักสูตรจากเอกสารโครงสร้างและแผนการศึกษาของแต่ละสาขา
 * SE  : วท.บ. วิศวกรรมซอฟต์แวร์ (หลักสูตรนานาชาติ) พ.ศ. 2568
 * MMIT: วท.บ. การจัดการสมัยใหม่และเทคโนโลยีสารสนเทศ พ.ศ. 2565
 * ANI : ศศ.บ. แอนนิเมชันและวิชวลเอฟเฟกต์ ฉบับปี พ.ศ. 2567
 * DG  : วท.บ. ดิจิทัลเกม ฉบับปี พ.ศ. 2562
 * DII : วท.บ. บูรณาการอุตสาหกรรมดิจิทัล (หลักสูตรปรับปรุง พ.ศ. 2567)
 */

export interface Course {
  code: string;
  name: string;
}

export interface YearPlan {
  year: 1 | 2 | 3 | 4;
  theme: string;
  courses: Course[];
  note?: string;
}

export interface Curriculum {
  degree: string;
  degreeEn: string;
  version: string;
  /** หน่วยกิตรวมตลอดหลักสูตร (null = เอกสารไม่ได้ระบุ) */
  credits: number | null;
  /** สัดส่วนหน่วยกิตแต่ละหมวด */
  structure: { label: string; credits: number }[];
  teaching?: string;
  journey: YearPlan[];
  electives: string[];
  finalYear: { title: string; text: string };
  careers: { th: string; en?: string }[];
  /** true = อาชีพมาจากหัวข้อ "อาชีพที่สามารถประกอบได้" ในเอกสารหลักสูตรโดยตรง */
  careersFromCurriculum: boolean;
}

export const CURRICULUM: Record<MajorCode, Curriculum> = {
  SE: {
    degree: "วิทยาศาสตรบัณฑิต (วิศวกรรมซอฟต์แวร์)",
    degreeEn: "B.S. Software Engineering · International Program",
    version: "หลักสูตรนานาชาติ พ.ศ. 2568",
    credits: 125,
    structure: [
      { label: "ศึกษาทั่วไป", credits: 24 },
      { label: "วิชาแกน", credits: 26 },
      { label: "วิชาเอกบังคับ", credits: 57 },
      { label: "วิชาเอกเลือก", credits: 12 },
      { label: "เลือกเสรี", credits: 6 },
    ],
    teaching: "หลักสูตรนานาชาติ เรียนเป็นภาษาอังกฤษ",
    journey: [
      {
        year: 1,
        theme: "ปูพื้นการเขียนโปรแกรมและเว็บ",
        courses: [
          { code: "953101", name: "Computer and Programming" },
          { code: "953104", name: "Web User Interface Design and Development" },
          { code: "953102", name: "Abstract Data Type and Problem Solving" },
          { code: "953202", name: "Introduction to Software Engineering" },
          { code: "953231", name: "Object Oriented Programming" },
          { code: "953261", name: "Interactive Web Development" },
        ],
      },
      {
        year: 2,
        theme: "อัลกอริทึม ฐานข้อมูล และระบบ",
        courses: [
          { code: "953201", name: "Algorithms Design and Analysis" },
          { code: "953212", name: "Database Systems and Database Systems Design" },
          { code: "953233", name: "Advanced Programming" },
          { code: "953251", name: "Human Factors in Digital Interaction Design" },
          { code: "953214", name: "Operating System and Computer Networks" },
          { code: "953234", name: "Basic Development and Operations" },
        ],
      },
      {
        year: 3,
        theme: "ออกแบบซอฟต์แวร์จริงจัง + AI",
        courses: [
          { code: "953321", name: "Software Requirement Analysis" },
          { code: "953328", name: "Software Design, Architecture and Constructions" },
          { code: "953331", name: "Component-Based Software Development" },
          { code: "953411", name: "Artificial Intelligence for Software Engineering" },
          { code: "953329", name: "Software Testing and Maintenance" },
        ],
      },
      {
        year: 4,
        theme: "คุณภาพ โครงงาน และสหกิจศึกษา",
        courses: [
          { code: "953420", name: "Ethics and Professionalism for Software Engineers" },
          { code: "953422", name: "Software Quality Assurance" },
          { code: "953499", name: "Software Engineering Project" },
          { code: "953491", name: "Cooperative Education (สหกิจศึกษา)" },
        ],
      },
    ],
    electives: [
      "User Experience for Software Design",
      "Mobile Application Development",
      "Web Services and Microservices",
      "IoT and Embedded Programming for Software",
      "Automated Software Testing",
      "Agile Software Development Tools",
      "Computer Network and Security",
      "Natural Language Processing for Software Engineering",
      "Artificial Intelligence-Enabled System",
      "Introduction to Software Business",
    ],
    finalYear: {
      title: "สหกิจศึกษา + โครงงาน",
      text: "ปี 4 ทำโครงงานวิศวกรรมซอฟต์แวร์ (953499) แล้วไปสหกิจศึกษาทำงานจริงในบริษัทตลอดภาคการศึกษา (953491 · 9 หน่วยกิต)",
    },
    careers: [
      { th: "นักพัฒนาโปรแกรม", en: "Software Developer" },
      { th: "นักทดสอบระบบ", en: "Software Tester / QA" },
      { th: "นักวิเคราะห์และออกแบบระบบ", en: "System Analyst" },
      { th: "ผู้จัดการโครงการซอฟต์แวร์", en: "Software Project Manager" },
      { th: "ผู้ประกอบการบริษัทซอฟต์แวร์", en: "Software Entrepreneur" },
      { th: "นักวิทยาการข้อมูล", en: "Data Scientist" },
      { th: "ผู้ชำนาญการความปลอดภัยเครือข่าย", en: "Network Security Specialist" },
      { th: "นักออกแบบฐานข้อมูล", en: "Database Designer" },
    ],
    careersFromCurriculum: true,
  },

  MMIT: {
    degree: "วิทยาศาสตรบัณฑิต (การจัดการสมัยใหม่และเทคโนโลยีสารสนเทศ)",
    degreeEn: "B.S. Modern Management and Information Technology",
    version: "หลักสูตร พ.ศ. 2565",
    credits: 126,
    structure: [
      { label: "ศึกษาทั่วไป", credits: 30 },
      { label: "วิชาแกน", credits: 33 },
      { label: "วิชาเอกบังคับ", credits: 39 },
      { label: "วิชาเอกเลือก", credits: 18 },
      { label: "เลือกเสรี", credits: 6 },
    ],
    teaching: "มีทั้งภาคปกติ (ไทย) และหลักสูตรนานาชาติ",
    journey: [
      {
        year: 1,
        theme: "พื้นฐานไอทีและการเขียนโปรแกรม",
        courses: [
          { code: "954140", name: "Information Technology Literacy" },
          { code: "954142", name: "Fundamental Computer Programming" },
          { code: "954100", name: "Information System for Organization Management" },
          { code: "954143", name: "Data Management" },
          { code: "954170", name: "Elementary Business Process Modeling" },
          { code: "954246", name: "Advanced Computer Programming for Modern Management" },
        ],
      },
      {
        year: 2,
        theme: "ระบบธุรกิจดิจิทัลทั้งองค์กร",
        courses: [
          { code: "954230", name: "Financial Tracking in Digital Business" },
          { code: "954231", name: "Human Capital Management in Digital Business" },
          { code: "954244", name: "System Analysis and Design for Modern Management" },
          { code: "954340", name: "Enterprise Database Design and Applications" },
          { code: "954374", name: "Sales and Distribution for Digital Market" },
          { code: "954416", name: "IS for Supply Chain and Customer Relationship Mgmt." },
        ],
      },
      {
        year: 3,
        theme: "ERP และการพัฒนาระบบให้ธุรกิจ",
        courses: [
          { code: "954310", name: "Information Systems for Enterprise Resource Planning" },
          { code: "954365", name: "Knowledge Management System" },
          { code: "954346", name: "Application Development for Business Sector" },
          { code: "954490", name: "Informatics Research Methodology" },
          { code: "954381", name: "Preparation for Work Integrated Learning" },
        ],
      },
      {
        year: 4,
        theme: "ทำงานจริง (WIL) หรือค้นคว้าอิสระ",
        courses: [
          { code: "954484", name: "Work Integrated Learning 1" },
          { code: "954485", name: "Work Integrated Learning 2" },
        ],
        note: "หรือเลือกแผนค้นคว้าอิสระ: ฝึกงาน (954389) + ค้นคว้าอิสระ (954499)",
      },
    ],
    electives: [
      "Web Programming",
      "E-Commerce",
      "Cloud Computing",
      "Business Data Mining",
      "Business Data Visualization",
      "ERP Configuration",
      "Digital Business Ecosystem",
      "Service Innovation",
      "Online Business and Service Psychology",
    ],
    finalYear: {
      title: "เลือกได้ 2 แผน",
      text: "แผน WIL: ทำงานจริงในบริษัท 2 ภาคการศึกษา (954484, 954485) · แผนค้นคว้าอิสระ: ฝึกงาน + ทำค้นคว้าอิสระ",
    },
    careers: [
      { th: "ผู้ดูแลระบบฐานข้อมูลธุรกิจ", en: "Business Database Administrator" },
      { th: "ผู้ช่วยวางแผนทรัพยากรองค์กร", en: "ERP Assistant" },
      { th: "นักพัฒนาเว็บแอปพลิเคชัน", en: "Web Application Developer" },
      { th: "ผู้ประสานงานขายด้านเทคโนโลยี", en: "IT Sale and Solution" },
      { th: "เจ้าหน้าที่สนับสนุนไอที", en: "IT Support" },
      { th: "ผู้วางแผนการผลิตและโลจิสติกส์", en: "Production and Logistic Planner" },
      { th: "ราชการ / รัฐวิสาหกิจ สายบริหารและไอที" },
    ],
    careersFromCurriculum: true,
  },

  ANI: {
    degree: "ศิลปศาสตรบัณฑิต (แอนนิเมชันและวิชวลเอฟเฟกต์)",
    degreeEn: "B.A. Animation and Visual Effects",
    version: "ฉบับปี พ.ศ. 2567",
    credits: 129,
    structure: [
      { label: "ศึกษาทั่วไป", credits: 30 },
      { label: "วิชาแกน", credits: 24 },
      { label: "วิชาเอกบังคับ", credits: 48 },
      { label: "วิชาเอกเลือก", credits: 21 },
      { label: "เลือกเสรี", credits: 6 },
    ],
    teaching: "วิชาเฉพาะสาขาสอนเป็นภาษาอังกฤษ (สองภาษา)",
    journey: [
      {
        year: 1,
        theme: "วาดภาพ เล่าเรื่อง และพื้นฐานงานดิจิทัล",
        courses: [
          { code: "951103", name: "Sketch Drawing" },
          { code: "951105", name: "The Fundamentals of Design in Digital Art" },
          { code: "951106", name: "Screenwriting and Digital Storytelling" },
          { code: "951215", name: "Storyboarding" },
          { code: "951111", name: "Two Dimensional Animation Design" },
          { code: "957107", name: "Digital Color and Light" },
        ],
      },
      {
        year: 2,
        theme: "3D, VFX และงานภาพยนตร์",
        courses: [
          { code: "951211", name: "3D Modeling and Animation Design 1" },
          { code: "957213", name: "Composite 1" },
          { code: "957331", name: "Color Grading" },
          { code: "951216", name: "Digital Cinematography" },
          { code: "951344", name: "Sound Design in Animation and Multimedia" },
          { code: "951312", name: "Computer Animation Production" },
        ],
      },
      {
        year: 3,
        theme: "พอร์ตโฟลิโอ + วิชาเลือกตามสายที่ชอบ",
        courses: [
          { code: "951451", name: "Marketing for Design" },
          { code: "951452", name: "Portfolio and Presentation" },
          { code: "951490", name: "Seminar in Animation and Visual Effects" },
        ],
        note: "และเลือกเรียนวิชาเอกเลือกอีก 7 วิชา",
      },
      {
        year: 4,
        theme: "ทำงานจริงในสตูดิโอทั้งปี",
        courses: [
          { code: "951481", name: "Work Integrated Learning for Animation and VFX 1" },
          { code: "951482", name: "Work Integrated Learning for Animation and VFX 2" },
        ],
      },
    ],
    electives: [
      "3D Character Animation",
      "3D Character Rigging",
      "Digital Painting",
      "Comics Design",
      "Mascot Design",
      "Motion Capture",
      "Stop Motion",
      "Matte Painting",
      "Special Effects",
      "Toy and Souvenir Product Design",
    ],
    finalYear: {
      title: "WIL ทั้งปีสุดท้าย",
      text: "ปี 4 ไปทำงานจริงกับสตูดิโอ/บริษัทตลอด 2 ภาคการศึกษา (951481, 951482 · รวม 18 หน่วยกิต)",
    },
    careers: [
      { th: "แอนิเมเตอร์", en: "Animator" },
      { th: "ดิจิทัลอาร์ติสต์", en: "Digital Artist" },
      { th: "ผู้สร้างโมเดลดิจิทัล", en: "Digital Modeller" },
      { th: "โปรดิวเซอร์แอนิเมชัน", en: "Animation Producer" },
      { th: "โปรดิวเซอร์วิชวลเอฟเฟกต์", en: "Visual Effects Producer" },
      { th: "นักออกแบบคอมพิวเตอร์กราฟิก", en: "Computer Graphic Designer" },
      { th: "Digital Imaging Technician", en: "DIT" },
      { th: "คัลเลอริสต์", en: "Colorist" },
    ],
    careersFromCurriculum: false,
  },

  DG: {
    degree: "วิทยาศาสตรบัณฑิต (ดิจิทัลเกม)",
    degreeEn: "B.S. Digital Game",
    version: "ฉบับปี พ.ศ. 2562",
    credits: null,
    structure: [],
    journey: [
      {
        year: 1,
        theme: "คิดเชิงตรรกะและเขียนโปรแกรมเกม",
        courses: [
          { code: "955103", name: "Programming Logical Thinking" },
          { code: "958111", name: "Computer and Programming for Game 1" },
          { code: "955102", name: "Digital Literacy" },
          { code: "958112", name: "Computer and Programming for Game 2" },
        ],
      },
      {
        year: 2,
        theme: "สร้างเกมแรก + กราฟิก",
        courses: [
          { code: "958201", name: "Mathematics for Computer Graphics and Game" },
          { code: "958221", name: "Game Development 1" },
          { code: "958225", name: "Digital Game Production" },
          { code: "958261", name: "Graphics Design for Two Dimensional Games" },
          { code: "958202", name: "Computer Graphics Programming" },
          { code: "958222", name: "Game Development 2" },
        ],
      },
      {
        year: 3,
        theme: "AI ออนไลน์ และธุรกิจเกม",
        courses: [
          { code: "958321", name: "Game Development 3" },
          { code: "958325", name: "Artificial Intelligence for Game Development" },
          { code: "958331", name: "Database and Network for Game Development" },
          { code: "958322", name: "Game Development 4" },
          { code: "958421", name: "Advanced Game Design" },
          { code: "958453", name: "Digital Game Industry and Distribution" },
        ],
      },
      {
        year: 4,
        theme: "ทำงานจริงในบริษัทเกมทั้งปี",
        courses: [
          { code: "958491", name: "Work Integrated Learning for Digital Game 1" },
          { code: "958492", name: "Work Integrated Learning for Digital Game 2" },
        ],
      },
    ],
    electives: ["Multiplayer Online Game Development", "Serious Games Design and Applications", "Introduction to Digital Business", "Fundamental Design in Digital Arts"],
    finalYear: {
      title: "WIL ทั้งปีสุดท้าย",
      text: "ปี 4 ไปทำงานจริงกับบริษัทเกม/สตูดิโอตลอด 2 ภาคการศึกษา (958491, 958492 · รวม 18 หน่วยกิต)",
    },
    careers: [
      { th: "นักพัฒนาเกม", en: "Game Developer" },
      { th: "นักออกแบบเกม", en: "Game Designer" },
      { th: "นักออกแบบกราฟิกเกม", en: "Graphic Game Designer" },
      { th: "นักพัฒนาแอปพลิเคชันเชิงโต้ตอบ", en: "Interactive Application Developer" },
      { th: "นักทดสอบและวิเคราะห์เกม", en: "Game Tester and Analyst" },
      { th: "ผู้เชี่ยวชาญคอมพิวเตอร์", en: "Computer Specialist" },
      { th: "ผู้ประกอบการธุรกิจเกม", en: "Digital Game Entrepreneur" },
    ],
    careersFromCurriculum: false,
  },

  DII: {
    degree: "วิทยาศาสตรบัณฑิต (บูรณาการอุตสาหกรรมดิจิทัล)",
    degreeEn: "B.S. Digital Industry Integration",
    version: "หลักสูตรปรับปรุง พ.ศ. 2567",
    credits: 126,
    structure: [
      { label: "ศึกษาทั่วไป", credits: 30 },
      { label: "วิชาแกน", credits: 24 },
      { label: "วิชาเอกบังคับ", credits: 51 },
      { label: "วิชาเอกเลือก", credits: 15 },
      { label: "เลือกเสรี", credits: 6 },
    ],
    journey: [
      {
        year: 1,
        theme: "ดิจิทัล ตรรกะโปรแกรม และ UX",
        courses: [
          { code: "960100", name: "Digital Literacy for Digital Industry Integration" },
          { code: "960101", name: "Basic Logic of Programming in Digital Industry" },
          { code: "960102", name: "User-Centered Interface and Experience Design" },
          { code: "954100", name: "Information System for Organization Management" },
          { code: "960141", name: "Digital Industry Solution 1" },
          { code: "960131", name: "Digital Industry Infrastructure 1" },
        ],
      },
      {
        year: 2,
        theme: "กระบวนการ โครงสร้างพื้นฐาน และโซลูชันอุตสาหกรรม",
        courses: [
          { code: "960121", name: "Digital Industry Process 1" },
          { code: "960212", name: "Product and Service in Digital Industry" },
          { code: "960231", name: "Digital Industry Infrastructure 2" },
          { code: "960241", name: "Digital Industry Solution 2" },
          { code: "960200", name: "Project Management for Digital Industry" },
          { code: "960213", name: "Professionalism in Digital Industry" },
        ],
      },
      {
        year: 3,
        theme: "เตรียมพร้อมแล้วออกไปทำงานจริง",
        courses: [
          { code: "960290", name: "Work Integrated Learning Preparation" },
          { code: "960391", name: "Work Integrated Learning 1" },
        ],
        note: "และวิชาเอกเลือกตามสายที่สนใจ",
      },
      {
        year: 4,
        theme: "WIL ต่อเนื่องในอุตสาหกรรม",
        courses: [
          { code: "960491", name: "Work Integrated Learning 2" },
          { code: "960492", name: "Work Integrated Learning 3" },
        ],
      },
    ],
    electives: [
      "Advanced Topics in Digital Industry Business",
      "Advanced Topics in Digital Industry Process",
      "Advanced Topics in Digital Industry Infrastructure",
      "Advanced Topics in Digital Industry Solution",
      "Selected Topics in Digital Industry Integration",
    ],
    finalYear: {
      title: "WIL 3 ภาคการศึกษา",
      text: "เริ่มทำงานจริงตั้งแต่ปี 3 เทอม 2 ต่อเนื่องถึงจบปี 4 รวม 3 ภาคการศึกษา (960391, 960491, 960492 · 27 หน่วยกิต)",
    },
    careers: [
      { th: "วิศวกรระบบอัตโนมัติ", en: "Automation Engineer (RPA)" },
      { th: "วิศวกร AI", en: "AI Engineer" },
      { th: "นักวิเคราะห์ธุรกิจ", en: "Business Analyst" },
      { th: "นักออกแบบ UX/UI", en: "UX/UI Designer" },
      { th: "เจ้าหน้าที่ระบบดิจิทัล", en: "Digital System Officer" },
      { th: "นักวางแผนและพัฒนาเทคโนโลยีดิจิทัล", en: "Digital Technology Planner and Developer" },
    ],
    careersFromCurriculum: false,
  },
};
