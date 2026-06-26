import type { Lang } from "@/lib/use-lang";

export interface LandingCopy {
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroTitle3: string;
  heroSubtitle: string;
  startLearning: string;
  signIn: string;
  statLabels: [string, string, string];
  demoTeacher1: string;
  demoUser1: string;
  demoTeacher2: string;
  demoExaminer1: string;
  inputPlaceholder: string;
  agentsEyebrow: string;
  agentsTitle1: string;
  agentsTitle2: string;
  agentsIntro: string;
  agentDescriptions: [string, string, string, string, string];
  agentCapabilities: [string, string, string, string, string];
  howEyebrow: string;
  howTitle: string;
  stepTitles: [string, string, string, string, string];
  stepBodies: [string, string, string, string, string];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  footerTagline: string;
  getStarted: string;
  builtWith: string;
}

const en: LandingCopy = {
  heroBadge: "Five specialist agents. One learning journey.",
  heroTitle1: "AI literacy",
  heroTitle2: "for everyone",
  heroTitle3: "who works with it.",
  heroSubtitle:
    "Five specialist agents teach concepts, generate visuals, test your understanding, assign practice tasks, and issue a verified certificate — in your language.",
  startLearning: "Start learning",
  signIn: "Sign in",
  statLabels: ["Specialist agents", "Languages supported", "Learners certified"],
  demoTeacher1:
    "Welcome. Let's start with what AI actually is — not the hype, the mechanism.",
  demoUser1: "What's the difference between machine learning and deep learning?",
  demoTeacher2:
    "Machine learning is any system that improves with data. Deep learning is a subset that uses layered neural networks — more capable, but also more opaque.",
  demoExaminer1:
    "Quick check: which of the following is NOT a type of machine learning? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "Type your response...",
  agentsEyebrow: "The team",
  agentsTitle1: "Five minds,",
  agentsTitle2: "one course.",
  agentsIntro:
    "Each agent has a single responsibility. The orchestrator routes every message to the right specialist — you never talk to the wrong expert.",
  agentDescriptions: [
    "Breaks down AI literacy concepts into digestible modules. Detects your language and adapts accordingly.",
    "Generates diagrams and visual analogies when a concept benefits from seeing, not just reading.",
    "Constructs questions tied to what you've learned. Scores multiple-choice deterministically; grades open-ended with a structured rubric.",
    "Assigns real-world AI literacy exercises after each module. Tracks your submission and feeds it into your certification record.",
    "Generates and delivers a verified PDF certificate — but only after deterministic code confirms every module is passed and every task is submitted.",
  ],
  agentCapabilities: [
    "Multi-language delivery",
    "AI-generated visuals",
    "Rubric-based grading",
    "Real-world exercises",
    "Fraud-proof certification",
  ],
  howEyebrow: "The journey",
  howTitle: "How it works",
  stepTitles: [
    "Receive a lesson",
    "Get tested",
    "Complete a task",
    "Pass the module",
    "Earn your certificate",
  ],
  stepBodies: [
    "The Teacher agent delivers a module on AI literacy — adapted to your language and level. Concepts are broken into focused messages, not walls of text.",
    "The Examiner agent generates questions based on exactly what you were taught. Open-ended answers are graded against a rubric — not just keyword-matched.",
    "The Task Assigner gives you a real-world exercise to apply what you learned. You submit your response; it gets logged to your record.",
    "A deterministic code gate checks your exam score and task status. No AI decides if you passed — the database does.",
    "Once all modules are complete, the Certifier generates a PDF certificate with a verifiable completion URL. Yours permanently.",
  ],
  ctaTitle: "Ready to get certified?",
  ctaBody: "Start your first lesson in under a minute. No credit card required.",
  ctaButton: "Begin your journey",
  footerTagline: "AI literacy for everyone who works with it.",
  getStarted: "Get started",
  builtWith: "Built with Claude Sonnet 4.6",
};

const hi: LandingCopy = {
  heroBadge: "पाँच विशेषज्ञ एजेंट। एक सीखने की यात्रा।",
  heroTitle1: "AI साक्षरता",
  heroTitle2: "हर किसी के लिए",
  heroTitle3: "जो इसके साथ काम करता है।",
  heroSubtitle:
    "पाँच विशेषज्ञ एजेंट कॉन्सेप्ट सिखाते हैं, विज़ुअल बनाते हैं, आपकी समझ परखते हैं, प्रैक्टिस टास्क देते हैं, और एक verified सर्टिफिकेट जारी करते हैं — आपकी भाषा में।",
  startLearning: "सीखना शुरू करें",
  signIn: "साइन इन करें",
  statLabels: ["विशेषज्ञ एजेंट", "समर्थित भाषाएं", "प्रमाणित शिक्षार्थी"],
  demoTeacher1:
    "स्वागत है। चलिए शुरू करते हैं कि AI असल में क्या है — हाइप नहीं, असली मैकेनिज्म।",
  demoUser1: "मशीन लर्निंग और डीप लर्निंग में क्या अंतर है?",
  demoTeacher2:
    "मशीन लर्निंग कोई भी सिस्टम है जो डेटा से बेहतर होता है। डीप लर्निंग उसी का एक हिस्सा है जो परतदार न्यूरल नेटवर्क इस्तेमाल करता है — ज़्यादा सक्षम, पर ज़्यादा जटिल भी।",
  demoExaminer1:
    "क्विक चेक: इनमें से कौन सा मशीन लर्निंग का प्रकार नहीं है? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "अपना जवाब टाइप करें...",
  agentsEyebrow: "टीम",
  agentsTitle1: "पाँच दिमाग,",
  agentsTitle2: "एक कोर्स।",
  agentsIntro:
    "हर एजेंट की एक ही ज़िम्मेदारी है। ऑर्केस्ट्रेटर हर मैसेज को सही विशेषज्ञ तक पहुंचाता है — आप कभी गलत एक्सपर्ट से बात नहीं करते।",
  agentDescriptions: [
    "AI साक्षरता के कॉन्सेप्ट को आसान मॉड्यूल में बांटता है। आपकी भाषा पहचानकर उसी के अनुसार ढलता है।",
    "जब किसी कॉन्सेप्ट को देखना पढ़ने से बेहतर हो, तब डायग्राम और विज़ुअल उदाहरण बनाता है।",
    "आपने जो सीखा उसी से जुड़े सवाल बनाता है। मल्टीपल-चॉइस को पक्के तरीके से और ओपन-एंडेड को रूब्रिक से जांचता है।",
    "हर मॉड्यूल के बाद असली दुनिया के अभ्यास देता है। आपकी सबमिशन को ट्रैक करके सर्टिफिकेशन रिकॉर्ड में जोड़ता है।",
    "एक verified PDF सर्टिफिकेट बनाता है — पर तभी जब कोड पक्का कर ले कि हर मॉड्यूल पास और हर टास्क सबमिट हो चुका है।",
  ],
  agentCapabilities: [
    "बहु-भाषा डिलीवरी",
    "AI-निर्मित विज़ुअल",
    "रूब्रिक-आधारित ग्रेडिंग",
    "असली दुनिया के अभ्यास",
    "धोखा-रहित सर्टिफिकेशन",
  ],
  howEyebrow: "यात्रा",
  howTitle: "यह कैसे काम करता है",
  stepTitles: [
    "एक पाठ पाएं",
    "परीक्षा दें",
    "एक टास्क पूरा करें",
    "मॉड्यूल पास करें",
    "अपना सर्टिफिकेट पाएं",
  ],
  stepBodies: [
    "Teacher एजेंट AI साक्षरता का मॉड्यूल देता है — आपकी भाषा और स्तर के अनुसार। कॉन्सेप्ट छोटे-छोटे मैसेज में बंटे होते हैं, लंबे पैराग्राफ में नहीं।",
    "Examiner एजेंट ठीक उसी पर सवाल बनाता है जो आपको सिखाया गया। ओपन-एंडेड जवाब रूब्रिक से जांचे जाते हैं — सिर्फ कीवर्ड से नहीं।",
    "Task Assigner आपको सीखे हुए को लागू करने के लिए असली अभ्यास देता है। आप जवाब सबमिट करते हैं; वह आपके रिकॉर्ड में दर्ज हो जाता है।",
    "एक तय कोड गेट आपके परीक्षा स्कोर और टास्क की स्थिति जांचता है। कोई AI तय नहीं करता कि आप पास हुए — डेटाबेस करता है।",
    "सभी मॉड्यूल पूरे होने पर, Certifier एक verifiable URL के साथ PDF सर्टिफिकेट बनाता है। हमेशा के लिए आपका।",
  ],
  ctaTitle: "सर्टिफाई होने के लिए तैयार हैं?",
  ctaBody: "एक मिनट से भी कम में अपना पहला पाठ शुरू करें। कोई क्रेडिट कार्ड ज़रूरी नहीं।",
  ctaButton: "अपनी यात्रा शुरू करें",
  footerTagline: "AI साक्षरता हर किसी के लिए जो इसके साथ काम करता है।",
  getStarted: "शुरू करें",
  builtWith: "Claude Sonnet 4.6 से बनाया गया",
};

const mr: LandingCopy = {
  heroBadge: "पाच तज्ज्ञ एजंट. एक शिकण्याचा प्रवास.",
  heroTitle1: "AI साक्षरता",
  heroTitle2: "प्रत्येकासाठी",
  heroTitle3: "जो याच्यासोबत काम करतो.",
  heroSubtitle:
    "पाच तज्ज्ञ एजंट संकल्पना शिकवतात, व्हिज्युअल तयार करतात, तुमची समज तपासतात, सराव टास्क देतात आणि verified सर्टिफिकेट देतात — तुमच्या भाषेत.",
  startLearning: "शिकायला सुरुवात करा",
  signIn: "साइन इन करा",
  statLabels: ["तज्ज्ञ एजंट", "समर्थित भाषा", "प्रमाणित विद्यार्थी"],
  demoTeacher1:
    "स्वागत आहे. चला सुरुवात करूया की AI खरंच काय आहे — हाईप नाही, खरी यंत्रणा.",
  demoUser1: "मशीन लर्निंग आणि डीप लर्निंगमध्ये काय फरक आहे?",
  demoTeacher2:
    "मशीन लर्निंग म्हणजे कोणतीही सिस्टम जी डेटामधून सुधारते. डीप लर्निंग हा त्याचाच एक भाग आहे जो थरांचे न्यूरल नेटवर्क वापरतो — जास्त सक्षम, पण जास्त गुंतागुंतीचाही.",
  demoExaminer1:
    "झटपट चेक: यापैकी कोणता मशीन लर्निंगचा प्रकार नाही? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "तुमचं उत्तर टाइप करा...",
  agentsEyebrow: "टीम",
  agentsTitle1: "पाच मनं,",
  agentsTitle2: "एक कोर्स.",
  agentsIntro:
    "प्रत्येक एजंटची एकच जबाबदारी आहे. ऑर्केस्ट्रेटर प्रत्येक मेसेज योग्य तज्ज्ञाकडे पाठवतो — तुम्ही कधीही चुकीच्या एक्सपर्टशी बोलत नाही.",
  agentDescriptions: [
    "AI साक्षरतेच्या संकल्पना सोप्या मॉड्यूलमध्ये विभागतो. तुमची भाषा ओळखून त्यानुसार जुळवून घेतो.",
    "एखादी संकल्पना वाचण्यापेक्षा बघून जास्त समजते तेव्हा डायग्राम आणि व्हिज्युअल उदाहरणं तयार करतो.",
    "तुम्ही जे शिकलात त्यावरच प्रश्न तयार करतो. मल्टिपल-चॉइस ठरलेल्या पद्धतीने आणि ओपन-एंडेड रुब्रिकने तपासतो.",
    "प्रत्येक मॉड्यूलनंतर खऱ्या जगातले सराव देतो. तुमची सबमिशन ट्रॅक करून सर्टिफिकेशन रेकॉर्डमध्ये जोडतो.",
    "एक verified PDF सर्टिफिकेट तयार करतो — पण तेव्हाच जेव्हा कोड खात्री करतो की प्रत्येक मॉड्यूल पास आणि प्रत्येक टास्क सबमिट झालाय.",
  ],
  agentCapabilities: [
    "बहु-भाषा डिलिव्हरी",
    "AI-निर्मित व्हिज्युअल",
    "रुब्रिक-आधारित ग्रेडिंग",
    "खऱ्या जगातले सराव",
    "फसवणूक-रहित सर्टिफिकेशन",
  ],
  howEyebrow: "प्रवास",
  howTitle: "हे कसं काम करतं",
  stepTitles: [
    "एक धडा मिळवा",
    "परीक्षा द्या",
    "एक टास्क पूर्ण करा",
    "मॉड्यूल पास करा",
    "तुमचं सर्टिफिकेट मिळवा",
  ],
  stepBodies: [
    "Teacher एजंट AI साक्षरतेचा मॉड्यूल देतो — तुमच्या भाषा आणि स्तरानुसार. संकल्पना छोट्या मेसेजमध्ये विभागलेल्या असतात, लांब परिच्छेदात नाही.",
    "Examiner एजंट तुम्हाला नेमकं जे शिकवलं त्यावर प्रश्न तयार करतो. ओपन-एंडेड उत्तरं रुब्रिकने तपासली जातात — फक्त कीवर्डने नाही.",
    "Task Assigner तुम्हाला शिकलेलं वापरण्यासाठी खरा सराव देतो. तुम्ही उत्तर सबमिट करता; ते तुमच्या रेकॉर्डमध्ये नोंदवलं जातं.",
    "एक ठरलेला कोड गेट तुमचा परीक्षा स्कोअर आणि टास्क स्थिती तपासतो. तुम्ही पास झालात की नाही हे कोणतंही AI ठरवत नाही — डेटाबेस ठरवतो.",
    "सगळे मॉड्यूल पूर्ण झाल्यावर, Certifier एक verifiable URL सह PDF सर्टिफिकेट तयार करतो. कायमचं तुमचं.",
  ],
  ctaTitle: "सर्टिफाय व्हायला तयार आहात?",
  ctaBody: "एका मिनिटापेक्षा कमी वेळात तुमचा पहिला धडा सुरू करा. क्रेडिट कार्डची गरज नाही.",
  ctaButton: "तुमचा प्रवास सुरू करा",
  footerTagline: "AI साक्षरता प्रत्येकासाठी जो याच्यासोबत काम करतो.",
  getStarted: "सुरू करा",
  builtWith: "Claude Sonnet 4.6 ने बनवलं",
};

const te: LandingCopy = {
  heroBadge: "ఐదు స్పెషలిస్ట్ ఏజెంట్లు. ఒకే లెర్నింగ్ ప్రయాణం.",
  heroTitle1: "AI అక్షరాస్యత",
  heroTitle2: "ప్రతి ఒక్కరికీ",
  heroTitle3: "దానితో పని చేసే వారికి.",
  heroSubtitle:
    "ఐదు స్పెషలిస్ట్ ఏజెంట్లు కాన్సెప్ట్‌లు నేర్పిస్తారు, విజువల్స్ తయారు చేస్తారు, మీ అవగాహనను టెస్ట్ చేస్తారు, ప్రాక్టీస్ టాస్క్‌లు ఇస్తారు, verified సర్టిఫికెట్ ఇస్తారు — మీ భాషలో.",
  startLearning: "నేర్చుకోవడం మొదలుపెట్టండి",
  signIn: "సైన్ ఇన్ చేయండి",
  statLabels: ["స్పెషలిస్ట్ ఏజెంట్లు", "సపోర్ట్ ఉన్న భాషలు", "సర్టిఫై అయిన లెర్నర్లు"],
  demoTeacher1:
    "స్వాగతం. AI నిజంగా ఏంటో దానితో మొదలుపెడదాం — హైప్ కాదు, అసలు మెకానిజం.",
  demoUser1: "మెషీన్ లెర్నింగ్ మరియు డీప్ లెర్నింగ్ మధ్య తేడా ఏంటి?",
  demoTeacher2:
    "మెషీన్ లెర్నింగ్ అంటే డేటాతో మెరుగయ్యే ఏ సిస్టమ్ అయినా. డీప్ లెర్నింగ్ దానిలో ఒక భాగం, ఇది లేయర్డ్ న్యూరల్ నెట్‌వర్క్‌లు వాడుతుంది — ఎక్కువ సమర్థం, కానీ ఎక్కువ సంక్లిష్టం కూడా.",
  demoExaminer1:
    "క్విక్ చెక్: వీటిలో మెషీన్ లెర్నింగ్ రకం కానిది ఏది? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "మీ సమాధానం టైప్ చేయండి...",
  agentsEyebrow: "టీమ్",
  agentsTitle1: "ఐదు మెదళ్లు,",
  agentsTitle2: "ఒకే కోర్సు.",
  agentsIntro:
    "ప్రతి ఏజెంట్‌కి ఒకే బాధ్యత. ఆర్కెస్ట్రేటర్ ప్రతి మెసేజ్‌ను సరైన స్పెషలిస్ట్‌కు పంపిస్తుంది — మీరు ఎప్పుడూ తప్పు ఎక్స్‌పర్ట్‌తో మాట్లాడరు.",
  agentDescriptions: [
    "AI అక్షరాస్యత కాన్సెప్ట్‌లను సులభమైన మాడ్యూల్స్‌గా విభజిస్తుంది. మీ భాషను గుర్తించి దానికి తగ్గట్టు మారుతుంది.",
    "ఒక కాన్సెప్ట్ చదవడం కంటే చూడటం మంచిది అయినప్పుడు డయాగ్రామ్‌లు, విజువల్ ఉదాహరణలు తయారు చేస్తుంది.",
    "మీరు నేర్చుకున్న దానిపైనే ప్రశ్నలు తయారు చేస్తుంది. మల్టిపుల్-చాయిస్‌ను కచ్చితంగా, ఓపెన్-ఎండెడ్‌ను రూబ్రిక్‌తో గ్రేడ్ చేస్తుంది.",
    "ప్రతి మాడ్యూల్ తర్వాత నిజ జీవిత ప్రాక్టీస్ ఇస్తుంది. మీ సబ్మిషన్‌ను ట్రాక్ చేసి సర్టిఫికేషన్ రికార్డ్‌లో చేరుస్తుంది.",
    "verified PDF సర్టిఫికెట్ తయారు చేస్తుంది — కానీ ప్రతి మాడ్యూల్ పాస్, ప్రతి టాస్క్ సబ్మిట్ అయ్యిందని కోడ్ నిర్ధారించాకే.",
  ],
  agentCapabilities: [
    "బహుళ-భాషా డెలివరీ",
    "AI-తయారు విజువల్స్",
    "రూబ్రిక్-ఆధారిత గ్రేడింగ్",
    "నిజ జీవిత ప్రాక్టీస్",
    "మోసం-రహిత సర్టిఫికేషన్",
  ],
  howEyebrow: "ప్రయాణం",
  howTitle: "ఇది ఎలా పని చేస్తుంది",
  stepTitles: [
    "ఒక పాఠం పొందండి",
    "టెస్ట్ అవ్వండి",
    "ఒక టాస్క్ పూర్తి చేయండి",
    "మాడ్యూల్ పాస్ అవ్వండి",
    "మీ సర్టిఫికెట్ పొందండి",
  ],
  stepBodies: [
    "Teacher ఏజెంట్ AI అక్షరాస్యత మాడ్యూల్ ఇస్తుంది — మీ భాష, స్థాయికి తగ్గట్టు. కాన్సెప్ట్‌లు చిన్న మెసేజ్‌లుగా విభజించబడతాయి, పెద్ద పేరాగ్రాఫ్‌లుగా కాదు.",
    "Examiner ఏజెంట్ మీకు నేర్పిన దానిపైనే ప్రశ్నలు తయారు చేస్తుంది. ఓపెన్-ఎండెడ్ సమాధానాలు రూబ్రిక్‌తో గ్రేడ్ అవుతాయి — కేవలం కీవర్డ్‌తో కాదు.",
    "Task Assigner మీరు నేర్చుకున్నది వాడటానికి నిజ జీవిత ప్రాక్టీస్ ఇస్తుంది. మీరు సమాధానం సబ్మిట్ చేస్తారు; అది మీ రికార్డ్‌లో నమోదవుతుంది.",
    "ఒక నిర్ధారిత కోడ్ గేట్ మీ ఎగ్జామ్ స్కోర్, టాస్క్ స్థితిని చెక్ చేస్తుంది. మీరు పాస్ అయ్యారా అని ఏ AI నిర్ణయించదు — డేటాబేస్ నిర్ణయిస్తుంది.",
    "అన్ని మాడ్యూల్స్ పూర్తయ్యాక, Certifier ఒక verifiable URL తో PDF సర్టిఫికెట్ తయారు చేస్తుంది. శాశ్వతంగా మీది.",
  ],
  ctaTitle: "సర్టిఫై అవ్వడానికి సిద్ధంగా ఉన్నారా?",
  ctaBody: "ఒక నిమిషంలోపే మీ మొదటి పాఠం మొదలుపెట్టండి. క్రెడిట్ కార్డ్ అవసరం లేదు.",
  ctaButton: "మీ ప్రయాణం మొదలుపెట్టండి",
  footerTagline: "AI అక్షరాస్యత దానితో పని చేసే ప్రతి ఒక్కరికీ.",
  getStarted: "మొదలుపెట్టండి",
  builtWith: "Claude Sonnet 4.6 తో తయారు చేయబడింది",
};

const ta: LandingCopy = {
  heroBadge: "ஐந்து நிபுணர் ஏஜென்ட்கள். ஒரே கற்றல் பயணம்.",
  heroTitle1: "AI எழுத்தறிவு",
  heroTitle2: "எல்லோருக்கும்",
  heroTitle3: "அதனுடன் வேலை செய்பவர்களுக்கு.",
  heroSubtitle:
    "ஐந்து நிபுணர் ஏஜென்ட்கள் கருத்துகளை கற்பிக்கிறார்கள், விஷுவல்ஸ் உருவாக்குகிறார்கள், உங்கள் புரிதலை சோதிக்கிறார்கள், பயிற்சி பணிகளை வழங்குகிறார்கள், verified சான்றிதழ் வழங்குகிறார்கள் — உங்கள் மொழியில்.",
  startLearning: "கற்க தொடங்குங்கள்",
  signIn: "உள்நுழைக",
  statLabels: ["நிபுணர் ஏஜென்ட்கள்", "ஆதரிக்கப்படும் மொழிகள்", "சான்றளிக்கப்பட்ட கற்பவர்கள்"],
  demoTeacher1:
    "வரவேற்கிறோம். AI உண்மையில் என்ன என்பதிலிருந்து தொடங்குவோம் — ஹைப் அல்ல, உண்மையான இயங்குமுறை.",
  demoUser1: "மெஷின் லேர்னிங்கிற்கும் டீப் லேர்னிங்கிற்கும் என்ன வித்தியாசம்?",
  demoTeacher2:
    "மெஷின் லேர்னிங் என்பது தரவில் இருந்து மேம்படும் எந்த சிஸ்டமும். டீப் லேர்னிங் அதன் ஒரு பகுதி, அது அடுக்கு நியூரல் நெட்வொர்க்குகளை பயன்படுத்துகிறது — அதிக திறன், ஆனால் அதிக சிக்கலானதும்.",
  demoExaminer1:
    "விரைவு சோதனை: இவற்றில் எது மெஷின் லேர்னிங் வகை அல்ல? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "உங்கள் பதிலை தட்டச்சு செய்யுங்கள்...",
  agentsEyebrow: "குழு",
  agentsTitle1: "ஐந்து மனங்கள்,",
  agentsTitle2: "ஒரே படிப்பு.",
  agentsIntro:
    "ஒவ்வொரு ஏஜென்ட்டுக்கும் ஒரே பொறுப்பு. ஆர்கெஸ்ட்ரேட்டர் ஒவ்வொரு செய்தியையும் சரியான நிபுணருக்கு அனுப்புகிறது — நீங்கள் ஒருபோதும் தவறான நிபுணரிடம் பேச மாட்டீர்கள்.",
  agentDescriptions: [
    "AI எழுத்தறிவு கருத்துகளை எளிய தொகுதிகளாக பிரிக்கிறது. உங்கள் மொழியை கண்டறிந்து அதற்கேற்ப மாறுகிறது.",
    "ஒரு கருத்தை படிப்பதை விட பார்ப்பது சிறந்தது எனும்போது வரைபடங்கள், விஷுவல் உதாரணங்களை உருவாக்குகிறது.",
    "நீங்கள் கற்றதைப் பற்றியே கேள்விகளை உருவாக்குகிறது. மல்டிபிள்-சாய்ஸை உறுதியாகவும், ஓபன்-எண்டெட்டை ரூப்ரிக் மூலமும் மதிப்பிடுகிறது.",
    "ஒவ்வொரு தொகுதிக்கும் பிறகு நிஜ வாழ்க்கை பயிற்சிகளை வழங்குகிறது. உங்கள் சமர்ப்பிப்பை கண்காணித்து சான்றிதழ் பதிவில் சேர்க்கிறது.",
    "verified PDF சான்றிதழை உருவாக்குகிறது — ஆனால் ஒவ்வொரு தொகுதியும் தேர்ச்சி, ஒவ்வொரு பணியும் சமர்ப்பிக்கப்பட்டதை கோட் உறுதிசெய்த பிறகே.",
  ],
  agentCapabilities: [
    "பல-மொழி வழங்கல்",
    "AI-உருவாக்கிய விஷுவல்ஸ்",
    "ரூப்ரிக் அடிப்படையிலான மதிப்பீடு",
    "நிஜ வாழ்க்கை பயிற்சிகள்",
    "மோசடி-தடுப்பு சான்றளிப்பு",
  ],
  howEyebrow: "பயணம்",
  howTitle: "இது எப்படி வேலை செய்கிறது",
  stepTitles: [
    "ஒரு பாடம் பெறுங்கள்",
    "சோதிக்கப்படுங்கள்",
    "ஒரு பணியை முடியுங்கள்",
    "தொகுதியில் தேர்ச்சி பெறுங்கள்",
    "உங்கள் சான்றிதழைப் பெறுங்கள்",
  ],
  stepBodies: [
    "Teacher ஏஜென்ட் AI எழுத்தறிவு தொகுதியை வழங்குகிறது — உங்கள் மொழி, நிலைக்கேற்ப. கருத்துகள் சிறிய செய்திகளாக பிரிக்கப்படுகின்றன, நீண்ட பத்திகளாக அல்ல.",
    "Examiner ஏஜென்ட் உங்களுக்கு கற்பித்ததைப் பற்றியே கேள்விகளை உருவாக்குகிறது. ஓபன்-எண்டெட் பதில்கள் ரூப்ரிக் மூலம் மதிப்பிடப்படுகின்றன — வெறும் கீவேர்டால் அல்ல.",
    "Task Assigner நீங்கள் கற்றதை பயன்படுத்த நிஜ வாழ்க்கை பயிற்சியை வழங்குகிறது. நீங்கள் பதிலை சமர்ப்பிக்கிறீர்கள்; அது உங்கள் பதிவில் சேர்க்கப்படுகிறது.",
    "ஒரு உறுதியான கோட் கேட் உங்கள் தேர்வு மதிப்பெண், பணி நிலையை சரிபார்க்கிறது. நீங்கள் தேர்ச்சி பெற்றீர்களா என எந்த AI யும் முடிவு செய்யாது — டேட்டாபேஸ் செய்கிறது.",
    "எல்லா தொகுதிகளும் முடிந்ததும், Certifier சரிபார்க்கக்கூடிய URL உடன் PDF சான்றிதழை உருவாக்குகிறது. நிரந்தரமாக உங்களுடையது.",
  ],
  ctaTitle: "சான்றளிக்கப்பட தயாரா?",
  ctaBody: "ஒரு நிமிடத்திற்குள் உங்கள் முதல் பாடத்தை தொடங்குங்கள். கிரெடிட் கார்டு தேவையில்லை.",
  ctaButton: "உங்கள் பயணத்தை தொடங்குங்கள்",
  footerTagline: "AI எழுத்தறிவு அதனுடன் வேலை செய்யும் எல்லோருக்கும்.",
  getStarted: "தொடங்குங்கள்",
  builtWith: "Claude Sonnet 4.6 உடன் உருவாக்கப்பட்டது",
};

const kn: LandingCopy = {
  heroBadge: "ಐದು ತಜ್ಞ ಏಜೆಂಟ್‌ಗಳು. ಒಂದೇ ಕಲಿಕೆಯ ಪ್ರಯಾಣ.",
  heroTitle1: "AI ಸಾಕ್ಷರತೆ",
  heroTitle2: "ಪ್ರತಿಯೊಬ್ಬರಿಗೂ",
  heroTitle3: "ಅದರೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವವರಿಗೆ.",
  heroSubtitle:
    "ಐದು ತಜ್ಞ ಏಜೆಂಟ್‌ಗಳು ಕಾನ್ಸೆಪ್ಟ್‌ಗಳನ್ನು ಕಲಿಸುತ್ತಾರೆ, ವಿಷುಯಲ್ಸ್ ತಯಾರಿಸುತ್ತಾರೆ, ನಿಮ್ಮ ತಿಳಿವಳಿಕೆಯನ್ನು ಪರೀಕ್ಷಿಸುತ್ತಾರೆ, ಪ್ರಾಕ್ಟೀಸ್ ಟಾಸ್ಕ್‌ಗಳನ್ನು ನೀಡುತ್ತಾರೆ, verified ಪ್ರಮಾಣಪತ್ರ ನೀಡುತ್ತಾರೆ — ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ.",
  startLearning: "ಕಲಿಕೆ ಪ್ರಾರಂಭಿಸಿ",
  signIn: "ಸೈನ್ ಇನ್ ಮಾಡಿ",
  statLabels: ["ತಜ್ಞ ಏಜೆಂಟ್‌ಗಳು", "ಬೆಂಬಲಿತ ಭಾಷೆಗಳು", "ಪ್ರಮಾಣೀಕೃತ ಕಲಿಯುವವರು"],
  demoTeacher1:
    "ಸ್ವಾಗತ. AI ನಿಜವಾಗಿ ಏನು ಎಂಬುದರಿಂದ ಪ್ರಾರಂಭಿಸೋಣ — ಹೈಪ್ ಅಲ್ಲ, ನಿಜವಾದ ಕಾರ್ಯವಿಧಾನ.",
  demoUser1: "ಮೆಷೀನ್ ಲರ್ನಿಂಗ್ ಮತ್ತು ಡೀಪ್ ಲರ್ನಿಂಗ್ ನಡುವೆ ಏನು ವ್ಯತ್ಯಾಸ?",
  demoTeacher2:
    "ಮೆಷೀನ್ ಲರ್ನಿಂಗ್ ಎಂದರೆ ಡೇಟಾದಿಂದ ಸುಧಾರಿಸುವ ಯಾವುದೇ ಸಿಸ್ಟಮ್. ಡೀಪ್ ಲರ್ನಿಂಗ್ ಅದರ ಒಂದು ಭಾಗ, ಇದು ಪದರದ ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್‌ಗಳನ್ನು ಬಳಸುತ್ತದೆ — ಹೆಚ್ಚು ಸಮರ್ಥ, ಆದರೆ ಹೆಚ್ಚು ಸಂಕೀರ್ಣವೂ ಹೌದು.",
  demoExaminer1:
    "ಕ್ವಿಕ್ ಚೆಕ್: ಇವುಗಳಲ್ಲಿ ಯಾವುದು ಮೆಷೀನ್ ಲರ್ನಿಂಗ್ ಪ್ರಕಾರ ಅಲ್ಲ? A) Supervised B) Unsupervised C) Deterministic D) Reinforcement",
  inputPlaceholder: "ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
  agentsEyebrow: "ತಂಡ",
  agentsTitle1: "ಐದು ಮನಸ್ಸುಗಳು,",
  agentsTitle2: "ಒಂದೇ ಕೋರ್ಸ್.",
  agentsIntro:
    "ಪ್ರತಿ ಏಜೆಂಟ್‌ಗೆ ಒಂದೇ ಜವಾಬ್ದಾರಿ. ಆರ್ಕೆಸ್ಟ್ರೇಟರ್ ಪ್ರತಿ ಸಂದೇಶವನ್ನು ಸರಿಯಾದ ತಜ್ಞರಿಗೆ ಕಳುಹಿಸುತ್ತದೆ — ನೀವು ಎಂದಿಗೂ ತಪ್ಪು ತಜ್ಞರೊಂದಿಗೆ ಮಾತನಾಡುವುದಿಲ್ಲ.",
  agentDescriptions: [
    "AI ಸಾಕ್ಷರತೆ ಕಾನ್ಸೆಪ್ಟ್‌ಗಳನ್ನು ಸುಲಭ ಮಾಡ್ಯೂಲ್‌ಗಳಾಗಿ ವಿಭಜಿಸುತ್ತದೆ. ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಗುರುತಿಸಿ ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ.",
    "ಒಂದು ಕಾನ್ಸೆಪ್ಟ್ ಓದುವುದಕ್ಕಿಂತ ನೋಡುವುದು ಉತ್ತಮವಾದಾಗ ಡಯಾಗ್ರಾಮ್‌ಗಳು, ವಿಷುಯಲ್ ಉದಾಹರಣೆಗಳನ್ನು ತಯಾರಿಸುತ್ತದೆ.",
    "ನೀವು ಕಲಿತದ್ದರ ಮೇಲೆಯೇ ಪ್ರಶ್ನೆಗಳನ್ನು ರಚಿಸುತ್ತದೆ. ಮಲ್ಟಿಪಲ್-ಚಾಯ್ಸ್ ಅನ್ನು ನಿಖರವಾಗಿ, ಓಪನ್-ಎಂಡೆಡ್ ಅನ್ನು ರೂಬ್ರಿಕ್‌ನಿಂದ ಗ್ರೇಡ್ ಮಾಡುತ್ತದೆ.",
    "ಪ್ರತಿ ಮಾಡ್ಯೂಲ್ ನಂತರ ನಿಜ ಜೀವನದ ಅಭ್ಯಾಸಗಳನ್ನು ನೀಡುತ್ತದೆ. ನಿಮ್ಮ ಸಲ್ಲಿಕೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಪ್ರಮಾಣೀಕರಣ ದಾಖಲೆಗೆ ಸೇರಿಸುತ್ತದೆ.",
    "verified PDF ಪ್ರಮಾಣಪತ್ರ ತಯಾರಿಸುತ್ತದೆ — ಆದರೆ ಪ್ರತಿ ಮಾಡ್ಯೂಲ್ ಪಾಸ್, ಪ್ರತಿ ಟಾಸ್ಕ್ ಸಲ್ಲಿಕೆಯಾಗಿದೆ ಎಂದು ಕೋಡ್ ಖಚಿತಪಡಿಸಿದ ನಂತರವೇ.",
  ],
  agentCapabilities: [
    "ಬಹು-ಭಾಷಾ ವಿತರಣೆ",
    "AI-ರಚಿತ ವಿಷುಯಲ್ಸ್",
    "ರೂಬ್ರಿಕ್-ಆಧಾರಿತ ಗ್ರೇಡಿಂಗ್",
    "ನಿಜ ಜೀವನದ ಅಭ್ಯಾಸಗಳು",
    "ವಂಚನೆ-ರಹಿತ ಪ್ರಮಾಣೀಕರಣ",
  ],
  howEyebrow: "ಪ್ರಯಾಣ",
  howTitle: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
  stepTitles: [
    "ಒಂದು ಪಾಠ ಪಡೆಯಿರಿ",
    "ಪರೀಕ್ಷೆಗೆ ಒಳಗಾಗಿ",
    "ಒಂದು ಟಾಸ್ಕ್ ಪೂರ್ಣಗೊಳಿಸಿ",
    "ಮಾಡ್ಯೂಲ್ ಪಾಸ್ ಮಾಡಿ",
    "ನಿಮ್ಮ ಪ್ರಮಾಣಪತ್ರ ಪಡೆಯಿರಿ",
  ],
  stepBodies: [
    "Teacher ಏಜೆಂಟ್ AI ಸಾಕ್ಷರತೆ ಮಾಡ್ಯೂಲ್ ನೀಡುತ್ತದೆ — ನಿಮ್ಮ ಭಾಷೆ, ಮಟ್ಟಕ್ಕೆ ತಕ್ಕಂತೆ. ಕಾನ್ಸೆಪ್ಟ್‌ಗಳು ಚಿಕ್ಕ ಸಂದೇಶಗಳಾಗಿ ವಿಭಜಿಸಲ್ಪಡುತ್ತವೆ, ಉದ್ದ ಪ್ಯಾರಾಗ್ರಾಫ್‌ಗಳಾಗಿ ಅಲ್ಲ.",
    "Examiner ಏಜೆಂಟ್ ನಿಮಗೆ ಕಲಿಸಿದ್ದರ ಮೇಲೆಯೇ ಪ್ರಶ್ನೆಗಳನ್ನು ರಚಿಸುತ್ತದೆ. ಓಪನ್-ಎಂಡೆಡ್ ಉತ್ತರಗಳು ರೂಬ್ರಿಕ್‌ನಿಂದ ಗ್ರೇಡ್ ಆಗುತ್ತವೆ — ಕೇವಲ ಕೀವರ್ಡ್‌ನಿಂದ ಅಲ್ಲ.",
    "Task Assigner ನೀವು ಕಲಿತದ್ದನ್ನು ಅನ್ವಯಿಸಲು ನಿಜ ಜೀವನದ ಅಭ್ಯಾಸ ನೀಡುತ್ತದೆ. ನೀವು ಉತ್ತರ ಸಲ್ಲಿಸುತ್ತೀರಿ; ಅದು ನಿಮ್ಮ ದಾಖಲೆಗೆ ದಾಖಲಾಗುತ್ತದೆ.",
    "ಒಂದು ನಿರ್ಧಾರಿತ ಕೋಡ್ ಗೇಟ್ ನಿಮ್ಮ ಪರೀಕ್ಷೆ ಸ್ಕೋರ್, ಟಾಸ್ಕ್ ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ. ನೀವು ಪಾಸ್ ಆಗಿದ್ದೀರಾ ಎಂದು ಯಾವ AI ಯೂ ನಿರ್ಧರಿಸುವುದಿಲ್ಲ — ಡೇಟಾಬೇಸ್ ನಿರ್ಧರಿಸುತ್ತದೆ.",
    "ಎಲ್ಲಾ ಮಾಡ್ಯೂಲ್‌ಗಳು ಪೂರ್ಣಗೊಂಡ ನಂತರ, Certifier ಪರಿಶೀಲಿಸಬಹುದಾದ URL ನೊಂದಿಗೆ PDF ಪ್ರಮಾಣಪತ್ರ ತಯಾರಿಸುತ್ತದೆ. ಶಾಶ್ವತವಾಗಿ ನಿಮ್ಮದು.",
  ],
  ctaTitle: "ಪ್ರಮಾಣೀಕರಣಕ್ಕೆ ಸಿದ್ಧವಾಗಿದ್ದೀರಾ?",
  ctaBody: "ಒಂದು ನಿಮಿಷದೊಳಗೆ ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಪ್ರಾರಂಭಿಸಿ. ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ.",
  ctaButton: "ನಿಮ್ಮ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ",
  footerTagline: "AI ಸಾಕ್ಷರತೆ ಅದರೊಂದಿಗೆ ಕೆಲಸ ಮಾಡುವ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ.",
  getStarted: "ಪ್ರಾರಂಭಿಸಿ",
  builtWith: "Claude Sonnet 4.6 ನೊಂದಿಗೆ ನಿರ್ಮಿಸಲಾಗಿದೆ",
};

export const landing: Record<Lang, LandingCopy> = { en, hi, mr, te, ta, kn };

export function getLanding(lang: Lang): LandingCopy {
  return landing[lang] ?? landing.en;
}

// Consistent heading spacing across ALL languages. Roomy enough that Indic
// scripts (Telugu/Tamil/Kannada/Devanagari) with stacked vowel marks never
// collide, while still tight enough to read as a display heading in English.
export function headingSpacing(_lang: Lang): string {
  return "tracking-tight leading-[1.2]";
}
