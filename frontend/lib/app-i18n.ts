import type { Lang } from "./quiz-i18n";

export interface AppI18n {
  // Sidebar
  nav: {
    dashboard: string;
    courses: string;
    learn: string;
    certificate: string;
    signOut: string;
  };

  // ContinueWatchingCard
  welcomeBack: (name: string) => string;
  continueWatching: string;
  myCourses: string;
  modules: (n: number) => string;

  // BentoGrid
  agentProgress: string;
  overallProgress: string;
  avgScore: string;
  certificateAvailable: string;
  tasks: string;
  allTasksComplete: string;
  agentStatus: string;
  active: string;
  askAnything: string;
  currentModule: string;
  pickUpWhereLeft: string;
  allModulesComplete: string;
  continueCta: string;
  examScores: string;
  noExams: string;
  allModules: string;
  goToLesson: string;

  // Course page
  course: string;
  readyForCertificate: string;
  videosProgress: (done: number, total: number) => string;
  startHere: string;
  resume: string;
  start: string;
  statModules: string;
  statCompleted: string;
  statVideos: string;

  // CourseStructure
  courseContent: string;
  modulesSummary: (mods: number, vids: number) => string;
  sectionProgress: (done: number, total: number) => string;
  moduleVideos: (done: number, total: number) => string;

  // Level labels
  levelLabel: (level: number) => string;
  levelLocked: (level: number) => string;

  // VideoPlayer
  videoComingSoon: string;
  completed: string;
  sectionComplete: string;
  nextLabel: (title: string) => string;
  continueBtn: string;
  replay: string;

  // Learn page
  upNext: string;
  next: string;
}

const en: AppI18n = {
  nav: {
    dashboard: "Dashboard",
    courses: "Courses",
    learn: "Learn",
    certificate: "Certificate",
    signOut: "Sign out",
  },
  welcomeBack: (name) => `Welcome back, ${name}.`,
  continueWatching: "Continue watching",
  myCourses: "My courses",
  modules: (n) => `${n} modules`,
  agentProgress: "AI Agent progress",
  overallProgress: "Overall progress",
  avgScore: "Avg score",
  certificateAvailable: "Certificate available",
  tasks: "Tasks",
  allTasksComplete: "All tasks complete.",
  agentStatus: "Agent status",
  active: "Active",
  askAnything: "Ask anything",
  currentModule: "Current module",
  pickUpWhereLeft: "Pick up where you left off",
  allModulesComplete: "All modules complete",
  continueCta: "Continue",
  examScores: "Exam scores",
  noExams: "No exams completed yet.",
  allModules: "All modules",
  goToLesson: "Go to lesson",

  course: "Course",
  readyForCertificate: "Ready for certificate",
  videosProgress: (done, total) => `${done}/${total} videos`,
  startHere: "Start here",
  resume: "Resume",
  start: "Start",
  statModules: "Modules",
  statCompleted: "Completed",
  statVideos: "Videos",
  courseContent: "Course content",
  modulesSummary: (mods, vids) => `${mods} modules · ${vids} videos`,
  sectionProgress: (done, total) => `${done}/${total} complete`,
  moduleVideos: (done, total) => `${done}/${total} videos`,

  levelLabel: (level) =>
    level === 1 ? "Level 1 — Beginner" : level === 2 ? "Level 2 — Intermediate" : "Level 3 — Advanced",
  levelLocked: (level) => `Complete Level ${level - 1} to unlock`,

  videoComingSoon: "Video coming soon",
  completed: "Completed",
  sectionComplete: "Section complete!",
  nextLabel: (title) => `Next: ${title}`,
  continueBtn: "Continue",
  replay: "Replay",

  upNext: "Up next",
  next: "Next",
};

const hi: AppI18n = {
  nav: {
    dashboard: "डैशबोर्ड",
    courses: "कोर्स",
    learn: "सीखें",
    certificate: "प्रमाणपत्र",
    signOut: "साइन आउट",
  },
  welcomeBack: (name) => `वापस स्वागत है, ${name}.`,
  continueWatching: "जारी रखें",
  myCourses: "मेरे कोर्स",
  modules: (n) => `${n} मॉड्यूल`,
  agentProgress: "AI एजेंट प्रगति",
  overallProgress: "कुल प्रगति",
  avgScore: "औसत अंक",
  certificateAvailable: "प्रमाणपत्र उपलब्ध",
  tasks: "कार्य",
  allTasksComplete: "सभी कार्य पूरे हो गए।",
  agentStatus: "एजेंट स्थिति",
  active: "सक्रिय",
  askAnything: "कुछ भी पूछें",
  currentModule: "वर्तमान मॉड्यूल",
  pickUpWhereLeft: "जहाँ छोड़ा था वहाँ से शुरू करें",
  allModulesComplete: "सभी मॉड्यूल पूरे हो गए",
  continueCta: "जारी रखें",
  examScores: "परीक्षा के अंक",
  noExams: "अभी तक कोई परीक्षा पूरी नहीं हुई।",
  allModules: "सभी मॉड्यूल",
  goToLesson: "पाठ पर जाएँ",

  course: "कोर्स",
  readyForCertificate: "प्रमाणपत्र के लिए तैयार",
  videosProgress: (done, total) => `${done}/${total} वीडियो`,
  startHere: "यहाँ से शुरू करें",
  resume: "जारी रखें",
  start: "शुरू करें",
  statModules: "मॉड्यूल",
  statCompleted: "पूर्ण",
  statVideos: "वीडियो",
  courseContent: "कोर्स सामग्री",
  modulesSummary: (mods, vids) => `${mods} मॉड्यूल · ${vids} वीडियो`,
  sectionProgress: (done, total) => `${done}/${total} पूरे`,
  moduleVideos: (done, total) => `${done}/${total} वीडियो`,

  levelLabel: (level) =>
    level === 1 ? "स्तर 1 — शुरुआती" : level === 2 ? "स्तर 2 — मध्यवर्ती" : "स्तर 3 — उन्नत",
  levelLocked: (level) => `अनलॉक करने के लिए स्तर ${level - 1} पूरा करें`,

  videoComingSoon: "वीडियो जल्द आएगा",
  completed: "पूरा हुआ",
  sectionComplete: "सेक्शन पूरा हुआ!",
  nextLabel: (title) => `अगला: ${title}`,
  continueBtn: "जारी रखें",
  replay: "दोबारा देखें",

  upNext: "अगला",
  next: "अगला",
};

const mr: AppI18n = {
  nav: {
    dashboard: "डॅशबोर्ड",
    courses: "अभ्यासक्रम",
    learn: "शिका",
    certificate: "प्रमाणपत्र",
    signOut: "साइन आउट",
  },
  welcomeBack: (name) => `परत स्वागत आहे, ${name}.`,
  continueWatching: "पुढे पाहा",
  myCourses: "माझे अभ्यासक्रम",
  modules: (n) => `${n} मॉड्युल्स`,
  agentProgress: "AI एजंट प्रगती",
  overallProgress: "एकूण प्रगती",
  avgScore: "सरासरी गुण",
  certificateAvailable: "प्रमाणपत्र उपलब्ध",
  tasks: "कार्ये",
  allTasksComplete: "सर्व कार्ये पूर्ण झाली.",
  agentStatus: "एजंट स्थिती",
  active: "सक्रिय",
  askAnything: "काहीही विचारा",
  currentModule: "सध्याचे मॉड्युल",
  pickUpWhereLeft: "सोडलेल्या ठिकाणाहून सुरू करा",
  allModulesComplete: "सर्व मॉड्युल्स पूर्ण",
  continueCta: "पुढे जा",
  examScores: "परीक्षेचे गुण",
  noExams: "अजून कोणतीही परीक्षा पूर्ण झाली नाही.",
  allModules: "सर्व मॉड्युल्स",
  goToLesson: "धड्यावर जा",

  course: "अभ्यासक्रम",
  readyForCertificate: "प्रमाणपत्रासाठी तयार",
  videosProgress: (done, total) => `${done}/${total} व्हिडिओ`,
  startHere: "इथून सुरू करा",
  resume: "पुढे सुरू करा",
  start: "सुरू करा",
  statModules: "मॉड्युल्स",
  statCompleted: "पूर्ण",
  statVideos: "व्हिडिओ",
  courseContent: "अभ्यासक्रम सामग्री",
  modulesSummary: (mods, vids) => `${mods} मॉड्युल्स · ${vids} व्हिडिओ`,
  sectionProgress: (done, total) => `${done}/${total} पूर्ण`,
  moduleVideos: (done, total) => `${done}/${total} व्हिडिओ`,

  levelLabel: (level) =>
    level === 1 ? "स्तर 1 — नवशिकी" : level === 2 ? "स्तर 2 — मध्यम" : "स्तर 3 — प्रगत",
  levelLocked: (level) => `अनलॉक करण्यासाठी स्तर ${level - 1} पूर्ण करा`,

  videoComingSoon: "व्हिडिओ लवकरच येईल",
  completed: "पूर्ण झाले",
  sectionComplete: "विभाग पूर्ण झाला!",
  nextLabel: (title) => `पुढील: ${title}`,
  continueBtn: "पुढे सुरू करा",
  replay: "पुन्हा पाहा",

  upNext: "पुढील",
  next: "पुढील",
};

const te: AppI18n = {
  nav: {
    dashboard: "డాష్‌బోర్డ్",
    courses: "కోర్సులు",
    learn: "నేర్చుకోండి",
    certificate: "సర్టిఫికేట్",
    signOut: "సైన్ అవుట్",
  },
  welcomeBack: (name) => `తిరిగి స్వాగతం, ${name}.`,
  continueWatching: "చూడడం కొనసాగించండి",
  myCourses: "నా కోర్సులు",
  modules: (n) => `${n} మాడ్యూళ్లు`,
  agentProgress: "AI ఏజెంట్ పురోగతి",
  overallProgress: "మొత్తం పురోగతి",
  avgScore: "సగటు స్కోర్",
  certificateAvailable: "సర్టిఫికేట్ అందుబాటులో ఉంది!",
  tasks: "పనులు",
  allTasksComplete: "అన్ని పనులు పూర్తయ్యాయి.",
  agentStatus: "ఏజెంట్ స్థితి",
  active: "క్రియాశీలం",
  askAnything: "ఏదైనా అడగండి",
  currentModule: "ప్రస్తుత మాడ్యూల్",
  pickUpWhereLeft: "మీరు ఆపిన చోట కొనసాగించండి",
  allModulesComplete: "అన్ని మాడ్యూళ్లు పూర్తయ్యాయి",
  continueCta: "కొనసాగించు",
  examScores: "పరీక్ష స్కోర్లు",
  noExams: "ఇంకా పరీక్షలు పూర్తి కాలేదు.",
  allModules: "అన్ని మాడ్యూళ్లు",
  goToLesson: "పాఠానికి వెళ్ళు",

  course: "కోర్సు",
  readyForCertificate: "సర్టిఫికేట్‌కు సిద్ధంగా ఉంది",
  videosProgress: (done, total) => `${done}/${total} వీడియోలు`,
  startHere: "ఇక్కడ ప్రారంభించండి",
  resume: "కొనసాగించు",
  start: "ప్రారంభించండి",
  statModules: "మాడ్యూళ్లు",
  statCompleted: "పూర్తయింది",
  statVideos: "వీడియోలు",
  courseContent: "కోర్సు విషయాలు",
  modulesSummary: (mods, vids) => `${mods} మాడ్యూళ్లు · ${vids} వీడియోలు`,
  sectionProgress: (done, total) => `${done}/${total} పూర్తయింది`,
  moduleVideos: (done, total) => `${done}/${total} వీడియోలు`,

  levelLabel: (level) =>
    level === 1 ? "స్థాయి 1 — ప్రారంభకులు" : level === 2 ? "స్థాయి 2 — మధ్యస్థాయి" : "స్థాయి 3 — అభివృద్ధి",
  levelLocked: (level) => `అన్‌లాక్ చేయడానికి స్థాయి ${level - 1} పూర్తి చేయండి`,

  videoComingSoon: "వీడియో త్వరలో వస్తుంది",
  completed: "పూర్తయింది",
  sectionComplete: "విభాగం పూర్తయింది!",
  nextLabel: (title) => `తదుపరి: ${title}`,
  continueBtn: "కొనసాగించు",
  replay: "మళ్ళీ చూడు",

  upNext: "తదుపరి",
  next: "తదుపరి",
};

const ta: AppI18n = {
  nav: {
    dashboard: "டாஷ்போர்டு",
    courses: "படிப்புகள்",
    learn: "கற்றுக்கொள்ளுங்கள்",
    certificate: "சான்றிதழ்",
    signOut: "வெளியேறு",
  },
  welcomeBack: (name) => `மீண்டும் வரவேற்கிறோம், ${name}.`,
  continueWatching: "பார்ப்பதை தொடரவும்",
  myCourses: "என் படிப்புகள்",
  modules: (n) => `${n} தொகுதிகள்`,
  agentProgress: "AI ஏஜென்ட் முன்னேற்றம்",
  overallProgress: "மொத்த முன்னேற்றம்",
  avgScore: "சராசரி மதிப்பெண்",
  certificateAvailable: "சான்றிதழ் கிடைக்கிறது!",
  tasks: "பணிகள்",
  allTasksComplete: "அனைத்து பணிகளும் முடிந்தன.",
  agentStatus: "ஏஜென்ட் நிலை",
  active: "செயலில்",
  askAnything: "எதையும் கேளுங்கள்",
  currentModule: "தற்போதைய தொகுதி",
  pickUpWhereLeft: "நிறுத்திய இடத்திலிருந்து தொடரவும்",
  allModulesComplete: "அனைத்து தொகுதிகளும் முடிந்தன",
  continueCta: "தொடரவும்",
  examScores: "தேர்வு மதிப்பெண்கள்",
  noExams: "இன்னும் தேர்வுகள் எதுவும் முடிக்கப்படவில்லை.",
  allModules: "அனைத்து தொகுதிகள்",
  goToLesson: "பாடத்திற்கு செல்",

  course: "படிப்பு",
  readyForCertificate: "சான்றிதழுக்கு தயார்",
  videosProgress: (done, total) => `${done}/${total} வீடியோக்கள்`,
  startHere: "இங்கே தொடங்குங்கள்",
  resume: "தொடரவும்",
  start: "தொடங்கு",
  statModules: "தொகுதிகள்",
  statCompleted: "முடிந்தது",
  statVideos: "வீடியோக்கள்",
  courseContent: "படிப்பு உள்ளடக்கம்",
  modulesSummary: (mods, vids) => `${mods} தொகுதிகள் · ${vids} வீடியோக்கள்`,
  sectionProgress: (done, total) => `${done}/${total} முடிந்தது`,
  moduleVideos: (done, total) => `${done}/${total} வீடியோக்கள்`,

  levelLabel: (level) =>
    level === 1 ? "நிலை 1 — தொடக்கநிலை" : level === 2 ? "நிலை 2 — இடைநிலை" : "நிலை 3 — மேம்பட்ட",
  levelLocked: (level) => `திறக்க நிலை ${level - 1} முடிக்கவும்`,

  videoComingSoon: "வீடியோ விரைவில் வரும்",
  completed: "முடிந்தது",
  sectionComplete: "பகுதி முடிந்தது!",
  nextLabel: (title) => `அடுத்து: ${title}`,
  continueBtn: "தொடரவும்",
  replay: "மீண்டும் பார்",

  upNext: "அடுத்து",
  next: "அடுத்து",
};

const kn: AppI18n = {
  nav: {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    courses: "ಕೋರ್ಸ್‌ಗಳು",
    learn: "ಕಲಿಯಿರಿ",
    certificate: "ಪ್ರಮಾಣಪತ್ರ",
    signOut: "ಸೈನ್ ಔಟ್",
  },
  welcomeBack: (name) => `ಮತ್ತೆ ಸ್ವಾಗತ, ${name}.`,
  continueWatching: "ವೀಕ್ಷಿಸುವುದನ್ನು ಮುಂದುವರಿಸಿ",
  myCourses: "ನನ್ನ ಕೋರ್ಸ್‌ಗಳು",
  modules: (n) => `${n} ಮಾಡ್ಯೂಲ್‌ಗಳು`,
  agentProgress: "AI ಏಜೆಂಟ್ ಪ್ರಗತಿ",
  overallProgress: "ಒಟ್ಟು ಪ್ರಗತಿ",
  avgScore: "ಸರಾಸರಿ ಅಂಕ",
  certificateAvailable: "ಪ್ರಮಾಣಪತ್ರ ಲಭ್ಯವಿದೆ!",
  tasks: "ಕೆಲಸಗಳು",
  allTasksComplete: "ಎಲ್ಲಾ ಕೆಲಸಗಳು ಮುಗಿದಿವೆ.",
  agentStatus: "ಏಜೆಂಟ್ ಸ್ಥಿತಿ",
  active: "ಸಕ್ರಿಯ",
  askAnything: "ಏನನ್ನಾದರೂ ಕೇಳಿ",
  currentModule: "ಪ್ರಸ್ತುತ ಮಾಡ್ಯೂಲ್",
  pickUpWhereLeft: "ನಿಲ್ಲಿಸಿದ ಕಡೆಯಿಂದ ಮುಂದುವರಿಸಿ",
  allModulesComplete: "ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳು ಮುಗಿದಿವೆ",
  continueCta: "ಮುಂದುವರಿಸಿ",
  examScores: "ಪರೀಕ್ಷೆ ಅಂಕಗಳು",
  noExams: "ಇನ್ನೂ ಯಾವುದೇ ಪರೀಕ್ಷೆ ಮುಗಿದಿಲ್ಲ.",
  allModules: "ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳು",
  goToLesson: "ಪಾಠಕ್ಕೆ ಹೋಗಿ",

  course: "ಕೋರ್ಸ್",
  readyForCertificate: "ಪ್ರಮಾಣಪತ್ರಕ್ಕೆ ಸಿದ್ಧ",
  videosProgress: (done, total) => `${done}/${total} ವೀಡಿಯೊಗಳು`,
  startHere: "ಇಲ್ಲಿ ಪ್ರಾರಂಭಿಸಿ",
  resume: "ಮುಂದುವರಿಸಿ",
  start: "ಪ್ರಾರಂಭಿಸಿ",
  statModules: "ಮಾಡ್ಯೂಲ್‌ಗಳು",
  statCompleted: "ಮುಗಿದಿದೆ",
  statVideos: "ವೀಡಿಯೊಗಳು",
  courseContent: "ಕೋರ್ಸ್ ವಿಷಯ",
  modulesSummary: (mods, vids) => `${mods} ಮಾಡ್ಯೂಲ್‌ಗಳು · ${vids} ವೀಡಿಯೊಗಳು`,
  sectionProgress: (done, total) => `${done}/${total} ಮುಗಿದಿದೆ`,
  moduleVideos: (done, total) => `${done}/${total} ವೀಡಿಯೊಗಳು`,

  levelLabel: (level) =>
    level === 1 ? "ಹಂತ 1 — ಆರಂಭಿಕ" : level === 2 ? "ಹಂತ 2 — ಮಧ್ಯಮ" : "ಹಂತ 3 — ಮುಂದುವರಿದ",
  levelLocked: (level) => `ಅನ್‌ಲಾಕ್ ಮಾಡಲು ಹಂತ ${level - 1} ಮುಗಿಸಿ`,

  videoComingSoon: "ವೀಡಿಯೊ ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿದೆ",
  completed: "ಮುಗಿದಿದೆ",
  sectionComplete: "ವಿಭಾಗ ಮುಗಿದಿದೆ!",
  nextLabel: (title) => `ಮುಂದಿನದು: ${title}`,
  continueBtn: "ಮುಂದುವರಿಸಿ",
  replay: "ಮತ್ತೆ ನೋಡಿ",

  upNext: "ಮುಂದಿನದು",
  next: "ಮುಂದಿನದು",
};

export const appI18n: Record<Lang, AppI18n> = { en, hi, mr, te, ta, kn };

export function getAppI18n(lang: Lang): AppI18n {
  return appI18n[lang] ?? appI18n.en;
}
