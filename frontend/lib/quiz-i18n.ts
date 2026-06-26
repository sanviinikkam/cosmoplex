export type Lang = "en" | "hi" | "mr" | "te" | "ta" | "kn";

export interface QuizI18n {
  // Progress labels
  stepOf: (n: number, total: number) => string;
  optional: string;
  skipIfYouWant: string;

  // Steps
  status: {
    question: string;
    options: { val: string; label: string }[];
  };
  role: {
    questionWorking: string;
    questionStudent: string;
    hint: string;
    placeholderWorking: string;
    placeholderStudent: string;
    industryPlaceholder: string;
  };
  goal: {
    question: string;
    hint: string;
    placeholder: string;
  };
  time: {
    question: string;
    options: { val: number; label: string }[];
  };
  optional_step: {
    question: string;
    hint: string;
    collegePlaceholder: string;
    hometownPlaceholder: string;
    aiLevelLabel: string;
    aiLevels: { val: string; label: string }[];
  };
  done: {
    heading: string;
    personaLine: (persona: string) => string;
    subline: string;
    cta: string;
  };

  // Buttons
  back: string;
  continue: string;
  skip: string;
  finish: string;
  saving: string;
  error: string;
}

// ── English ───────────────────────────────────────────────────────────────────

const en: QuizI18n = {
  stepOf: (n, t) => `Step ${n} of ${t}`,
  optional: "Optional",
  skipIfYouWant: "Skip if you want",

  status: {
    question: "What are you up to right now?",
    options: [
      { val: "working",      label: "I'm working" },
      { val: "studying",     label: "I'm studying / in college" },
      { val: "between_jobs", label: "Between jobs / looking for work" },
      { val: "freelancing",  label: "Freelancing / self-employed" },
    ],
  },
  role: {
    questionWorking: "What do you do for work?",
    questionStudent: "What role are you targeting?",
    hint: "This helps us pick the right examples for your course.",
    placeholderWorking: "e.g. Marketing Manager, Software Engineer",
    placeholderStudent: "e.g. Data Analyst, Product Manager",
    industryPlaceholder: "Industry (optional) — e.g. Healthcare, Finance, Tech",
  },
  goal: {
    question: "Why do you want to learn AI?",
    hint: "Be specific — the more you share, the better we personalise.",
    placeholder:
      "e.g. I want to use AI tools in my marketing job and understand what my team is talking about when they mention LLMs...",
  },
  time: {
    question: "How much time can you give each day?",
    options: [
      { val: 15, label: "15 minutes — quick lessons" },
      { val: 30, label: "30 minutes — steady pace" },
      { val: 45, label: "45 minutes — focused learner" },
      { val: 60, label: "1 hour — I'm serious about this" },
    ],
  },
  optional_step: {
    question: "Tell us a little more",
    hint: "Helps us fine-tune your experience even more.",
    collegePlaceholder: "College / University",
    hometownPlaceholder: "Hometown",
    aiLevelLabel: "How familiar are you with AI?",
    aiLevels: [
      { val: "none",         label: "None" },
      { val: "basic",        label: "Basic" },
      { val: "intermediate", label: "Intermediate" },
      { val: "advanced",     label: "Advanced" },
    ],
  },
  done: {
    heading: "You're all set!",
    personaLine: (p) => `We've tailored your course for a ${p}.`,
    subline: "Your modules are personalised. Let's start with Module 1.",
    cta: "Go to my course",
  },

  back: "Back",
  continue: "Continue",
  skip: "Skip",
  finish: "Finish",
  saving: "Saving…",
  error: "Something went wrong. Please try again.",
};

// ── Hindi ─────────────────────────────────────────────────────────────────────

const hi: QuizI18n = {
  stepOf: (n, t) => `चरण ${n} / ${t}`,
  optional: "वैकल्पिक",
  skipIfYouWant: "चाहें तो छोड़ें",

  status: {
    question: "आप अभी क्या कर रहे हैं?",
    options: [
      { val: "working",      label: "मैं नौकरी कर रहा/रही हूँ" },
      { val: "studying",     label: "मैं पढ़ रहा/रही हूँ / कॉलेज में हूँ" },
      { val: "between_jobs", label: "नौकरी की तलाश में हूँ" },
      { val: "freelancing",  label: "फ्रीलांसिंग / स्वरोजगार" },
    ],
  },
  role: {
    questionWorking: "आप क्या काम करते/करती हैं?",
    questionStudent: "आप किस पद को लक्ष्य बना रहे/रही हैं?",
    hint: "इससे हम आपके कोर्स के लिए सही उदाहरण चुन पाएंगे।",
    placeholderWorking: "जैसे: मार्केटिंग मैनेजर, सॉफ्टवेयर इंजीनियर",
    placeholderStudent: "जैसे: डेटा एनालिस्ट, प्रोडक्ट मैनेजर",
    industryPlaceholder: "उद्योग (वैकल्पिक) — जैसे: स्वास्थ्य, वित्त, टेक",
  },
  goal: {
    question: "आप AI क्यों सीखना चाहते/चाहती हैं?",
    hint: "जितना बताएंगे, उतना बेहतर अनुभव मिलेगा।",
    placeholder:
      "जैसे: मैं अपनी मार्केटिंग नौकरी में AI टूल्स इस्तेमाल करना चाहता/चाहती हूँ...",
  },
  time: {
    question: "आप हर दिन कितना समय दे सकते/सकती हैं?",
    options: [
      { val: 15, label: "15 मिनट — छोटे-छोटे पाठ" },
      { val: 30, label: "30 मिनट — नियमित गति" },
      { val: 45, label: "45 मिनट — ध्यान से सीखना" },
      { val: 60, label: "1 घंटा — मैं गंभीर हूँ" },
    ],
  },
  optional_step: {
    question: "थोड़ा और बताएं",
    hint: "आपके अनुभव को और बेहतर बनाने में मदद करेगा।",
    collegePlaceholder: "कॉलेज / विश्वविद्यालय",
    hometownPlaceholder: "गृहनगर",
    aiLevelLabel: "आप AI से कितना परिचित हैं?",
    aiLevels: [
      { val: "none",         label: "बिल्कुल नहीं" },
      { val: "basic",        label: "थोड़ा बहुत" },
      { val: "intermediate", label: "मध्यम स्तर" },
      { val: "advanced",     label: "उन्नत स्तर" },
    ],
  },
  done: {
    heading: "सब तैयार है!",
    personaLine: (p) => `आपका कोर्स ${p} के लिए तैयार किया गया है।`,
    subline: "आपके मॉड्यूल व्यक्तिगत रूप से तैयार हैं। मॉड्यूल 1 से शुरू करते हैं।",
    cta: "मेरा कोर्स शुरू करें",
  },

  back: "वापस",
  continue: "आगे बढ़ें",
  skip: "छोड़ें",
  finish: "पूरा करें",
  saving: "सहेज रहे हैं…",
  error: "कुछ गलत हो गया। कृपया फिर से कोशिश करें।",
};

// ── Marathi ───────────────────────────────────────────────────────────────────

const mr: QuizI18n = {
  stepOf: (n, t) => `पायरी ${n} / ${t}`,
  optional: "ऐच्छिक",
  skipIfYouWant: "हवे तर वगळा",

  status: {
    question: "तुम्ही सध्या काय करत आहात?",
    options: [
      { val: "working",      label: "मी नोकरी करतो/करते" },
      { val: "studying",     label: "मी शिकतो/शिकते / कॉलेजमध्ये आहे" },
      { val: "between_jobs", label: "नोकरी शोधत आहे" },
      { val: "freelancing",  label: "फ्रीलांसिंग / स्वयंरोजगार" },
    ],
  },
  role: {
    questionWorking: "तुम्ही कोणती नोकरी करता?",
    questionStudent: "तुम्हाला कोणती नोकरी करायची आहे?",
    hint: "यावरून आम्ही तुमच्या कोर्ससाठी योग्य उदाहरणे निवडू.",
    placeholderWorking: "उदा. मार्केटिंग मॅनेजर, सॉफ्टवेअर इंजिनियर",
    placeholderStudent: "उदा. डेटा अ‍ॅनालिस्ट, प्रोडक्ट मॅनेजर",
    industryPlaceholder: "उद्योग (ऐच्छिक) — उदा. आरोग्य, वित्त, टेक",
  },
  goal: {
    question: "तुम्हाला AI का शिकायचे आहे?",
    hint: "जेवढे सांगाल तेवढा अनुभव चांगला होईल.",
    placeholder:
      "उदा. मला माझ्या मार्केटिंग नोकरीत AI टूल्स वापरायची आहेत...",
  },
  time: {
    question: "तुम्ही दररोज किती वेळ देऊ शकता?",
    options: [
      { val: 15, label: "१५ मिनिटे — लहान धडे" },
      { val: 30, label: "३० मिनिटे — नियमित वेग" },
      { val: 45, label: "४५ मिनिटे — लक्षपूर्वक शिकणे" },
      { val: 60, label: "१ तास — मी गंभीर आहे" },
    ],
  },
  optional_step: {
    question: "थोडे अधिक सांगा",
    hint: "तुमचा अनुभव आणखी चांगला करण्यास मदत होईल.",
    collegePlaceholder: "महाविद्यालय / विद्यापीठ",
    hometownPlaceholder: "गाव / शहर",
    aiLevelLabel: "तुम्हाला AI बद्दल किती माहिती आहे?",
    aiLevels: [
      { val: "none",         label: "अजिबात नाही" },
      { val: "basic",        label: "थोडी माहिती" },
      { val: "intermediate", label: "मध्यम" },
      { val: "advanced",     label: "प्रगत" },
    ],
  },
  done: {
    heading: "सर्व तयार आहे!",
    personaLine: (p) => `तुमचा कोर्स ${p} साठी तयार केला आहे.`,
    subline: "तुमचे मॉड्युल्स वैयक्तिकृत केले आहेत. मॉड्युल १ पासून सुरुवात करूया.",
    cta: "माझा कोर्स सुरू करा",
  },

  back: "मागे",
  continue: "पुढे जा",
  skip: "वगळा",
  finish: "पूर्ण करा",
  saving: "जतन करत आहे…",
  error: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
};

// ── Telugu ────────────────────────────────────────────────────────────────────

const te: QuizI18n = {
  stepOf: (n, t) => `దశ ${n} / ${t}`,
  optional: "ఐచ్ఛికం",
  skipIfYouWant: "వదిలివేయాలంటే వదిలివేయండి",

  status: {
    question: "మీరు ప్రస్తుతం ఏమి చేస్తున్నారు?",
    options: [
      { val: "working",      label: "నేను ఉద్యోగం చేస్తున్నాను" },
      { val: "studying",     label: "నేను చదువుతున్నాను / కాలేజీలో ఉన్నాను" },
      { val: "between_jobs", label: "ఉద్యోగం వెతుకుతున్నాను" },
      { val: "freelancing",  label: "ఫ్రీలాన్సింగ్ / స్వయం ఉపాధి" },
    ],
  },
  role: {
    questionWorking: "మీరు ఏమి పని చేస్తారు?",
    questionStudent: "మీరు ఏ పాత్రను లక్ష్యంగా పెట్టుకున్నారు?",
    hint: "ఇది మీ కోర్సుకు సరైన ఉదాహరణలు ఎంచుకోవడానికి మాకు సహాయపడుతుంది.",
    placeholderWorking: "ఉదా. మార్కెటింగ్ మేనేజర్, సాఫ్ట్‌వేర్ ఇంజినీర్",
    placeholderStudent: "ఉదా. డేటా అనలిస్ట్, ప్రొడక్ట్ మేనేజర్",
    industryPlaceholder: "పరిశ్రమ (ఐచ్ఛికం) — ఉదా. ఆరోగ్యం, ఆర్థికం, టెక్",
  },
  goal: {
    question: "మీరు AI ఎందుకు నేర్చుకోవాలనుకుంటున్నారు?",
    hint: "ఎంత ఎక్కువ చెప్పితే అంత మంచి అనుభవం ఉంటుంది.",
    placeholder: "ఉదా. నా మార్కెటింగ్ ఉద్యోగంలో AI సాధనాలు ఉపయోగించాలనుకుంటున్నాను...",
  },
  time: {
    question: "మీరు ప్రతిరోజు ఎంత సమయం ఇవ్వగలరు?",
    options: [
      { val: 15, label: "15 నిమిషాలు — చిన్న పాఠాలు" },
      { val: 30, label: "30 నిమిషాలు — స్థిరమైన వేగం" },
      { val: 45, label: "45 నిమిషాలు — శ్రద్ధగా నేర్చుకోవడం" },
      { val: 60, label: "1 గంట — నేను నిజంగా సీరియస్‌గా ఉన్నాను" },
    ],
  },
  optional_step: {
    question: "మరికొంచెం చెప్పండి",
    hint: "మీ అనుభవాన్ని మరింత మెరుగుపర్చడానికి సహాయపడుతుంది.",
    collegePlaceholder: "కళాశాల / విశ్వవిద్యాలయం",
    hometownPlaceholder: "స్వగ్రామం / పట్టణం",
    aiLevelLabel: "మీకు AI పరిచయం ఎంత ఉంది?",
    aiLevels: [
      { val: "none",         label: "అసలు లేదు" },
      { val: "basic",        label: "కొంచెం" },
      { val: "intermediate", label: "మధ్యస్థాయి" },
      { val: "advanced",     label: "అభివృద్ధి స్థాయి" },
    ],
  },
  done: {
    heading: "అన్నీ సిద్ధంగా ఉన్నాయి!",
    personaLine: (p) => `మీ కోర్సు ${p} కోసం రూపొందించబడింది.`,
    subline: "మీ మాడ్యూళ్లు వ్యక్తిగతీకరించబడ్డాయి. మాడ్యూల్ 1 తో ప్రారంభిద్దాం.",
    cta: "నా కోర్సుకు వెళ్ళు",
  },

  back: "వెనుకకు",
  continue: "కొనసాగించు",
  skip: "దాటవేయి",
  finish: "పూర్తి చేయి",
  saving: "సేవ్ అవుతోంది…",
  error: "ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
};

// ── Tamil ─────────────────────────────────────────────────────────────────────

const ta: QuizI18n = {
  stepOf: (n, t) => `படி ${n} / ${t}`,
  optional: "விருப்பமான",
  skipIfYouWant: "வேண்டுமென்றால் தவிருங்கள்",

  status: {
    question: "நீங்கள் தற்போது என்ன செய்கிறீர்கள்?",
    options: [
      { val: "working",      label: "நான் வேலை செய்கிறேன்" },
      { val: "studying",     label: "நான் படிக்கிறேன் / கல்லூரியில் இருக்கிறேன்" },
      { val: "between_jobs", label: "வேலை தேடுகிறேன்" },
      { val: "freelancing",  label: "ஃப்ரீலான்சிங் / சுயதொழில்" },
    ],
  },
  role: {
    questionWorking: "நீங்கள் என்ன வேலை செய்கிறீர்கள்?",
    questionStudent: "நீங்கள் என்ன பதவியை இலக்காக வைத்திருக்கிறீர்கள்?",
    hint: "இது உங்கள் படிப்பிற்கு சரியான எடுத்துக்காட்டுகளை தேர்ந்தெடுக்க உதவுகிறது.",
    placeholderWorking: "எ.கா. மார்க்கெட்டிங் மேனேஜர், சாஃப்ட்வேர் இன்ஜினியர்",
    placeholderStudent: "எ.கா. டேட்டா அனலிஸ்ட், புராடக்ட் மேனேஜர்",
    industryPlaceholder: "தொழில் (விருப்பமான) — எ.கா. சுகாதாரம், நிதி, டெக்",
  },
  goal: {
    question: "நீங்கள் AI ஏன் கற்றுக்கொள்ள விரும்புகிறீர்கள்?",
    hint: "எவ்வளவு சொல்கிறீர்களோ, அவ்வளவு சிறந்த அனுபவம் கிடைக்கும்.",
    placeholder: "எ.கா. என் மார்க்கெட்டிங் வேலையில் AI கருவிகளை பயன்படுத்த விரும்புகிறேன்...",
  },
  time: {
    question: "நீங்கள் ஒவ்வொரு நாளும் எவ்வளவு நேரம் கொடுக்க முடியும்?",
    options: [
      { val: 15, label: "15 நிமிடங்கள் — சிறு பாடங்கள்" },
      { val: 30, label: "30 நிமிடங்கள் — நிலையான வேகம்" },
      { val: 45, label: "45 நிமிடங்கள் — கவனமான கற்றல்" },
      { val: 60, label: "1 மணி நேரம் — நான் தீவிரமாக இருக்கிறேன்" },
    ],
  },
  optional_step: {
    question: "இன்னும் கொஞ்சம் சொல்லுங்கள்",
    hint: "உங்கள் அனுபவத்தை இன்னும் மேம்படுத்த உதவும்.",
    collegePlaceholder: "கல்லூரி / பல்கலைக்கழகம்",
    hometownPlaceholder: "சொந்த ஊர்",
    aiLevelLabel: "AI பற்றி உங்களுக்கு எவ்வளவு தெரியும்?",
    aiLevels: [
      { val: "none",         label: "ஒன்றும் தெரியாது" },
      { val: "basic",        label: "கொஞ்சம் தெரியும்" },
      { val: "intermediate", label: "இடைநிலை" },
      { val: "advanced",     label: "மேம்பட்ட" },
    ],
  },
  done: {
    heading: "அனைத்தும் தயார்!",
    personaLine: (p) => `உங்கள் படிப்பு ${p} க்காக தயாரிக்கப்பட்டது.`,
    subline: "உங்கள் தொகுதிகள் தனிப்பயனாக்கப்பட்டுள்ளன. தொகுதி 1 இல் இருந்து தொடங்குவோம்.",
    cta: "என் படிப்பிற்கு செல்",
  },

  back: "திரும்பு",
  continue: "தொடரவும்",
  skip: "தவிர்",
  finish: "முடிக்கவும்",
  saving: "சேமிக்கிறது…",
  error: "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
};

// ── Kannada ───────────────────────────────────────────────────────────────────

const kn: QuizI18n = {
  stepOf: (n, t) => `ಹಂತ ${n} / ${t}`,
  optional: "ಐಚ್ಛಿಕ",
  skipIfYouWant: "ಬೇಕಿದ್ದರೆ ಬಿಟ್ಟುಬಿಡಿ",

  status: {
    question: "ನೀವು ಈಗ ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?",
    options: [
      { val: "working",      label: "ನಾನು ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇನೆ" },
      { val: "studying",     label: "ನಾನು ಓದುತ್ತಿದ್ದೇನೆ / ಕಾಲೇಜಿನಲ್ಲಿದ್ದೇನೆ" },
      { val: "between_jobs", label: "ಕೆಲಸ ಹುಡುಕುತ್ತಿದ್ದೇನೆ" },
      { val: "freelancing",  label: "ಫ್ರೀಲಾನ್ಸಿಂಗ್ / ಸ್ವಯಂ ಉದ್ಯೋಗ" },
    ],
  },
  role: {
    questionWorking: "ನೀವು ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತೀರಿ?",
    questionStudent: "ನೀವು ಯಾವ ಪಾತ್ರವನ್ನು ಗುರಿಯಾಗಿಸಿದ್ದೀರಿ?",
    hint: "ಇದು ನಿಮ್ಮ ಕೋರ್ಸ್‌ಗೆ ಸರಿಯಾದ ಉದಾಹರಣೆಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    placeholderWorking: "ಉದಾ. ಮಾರ್ಕೆಟಿಂಗ್ ಮ್ಯಾನೇಜರ್, ಸಾಫ್ಟ್‌ವೇರ್ ಇಂಜಿನಿಯರ್",
    placeholderStudent: "ಉದಾ. ಡೇಟಾ ಅನಲಿಸ್ಟ್, ಪ್ರಾಡಕ್ಟ್ ಮ್ಯಾನೇಜರ್",
    industryPlaceholder: "ಉದ್ಯಮ (ಐಚ್ಛಿಕ) — ಉದಾ. ಆರೋಗ್ಯ, ಹಣಕಾಸು, ಟೆಕ್",
  },
  goal: {
    question: "ನೀವು AI ಏಕೆ ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    hint: "ಎಷ್ಟು ಹೆಚ್ಚು ಹೇಳುತ್ತೀರೋ, ಅಷ್ಟು ಉತ್ತಮ ಅನುಭವ ಸಿಗುತ್ತದೆ.",
    placeholder: "ಉದಾ. ನನ್ನ ಮಾರ್ಕೆಟಿಂಗ್ ಕೆಲಸದಲ್ಲಿ AI ಉಪಕರಣಗಳನ್ನು ಬಳಸಲು ಬಯಸುತ್ತೇನೆ...",
  },
  time: {
    question: "ನೀವು ಪ್ರತಿದಿನ ಎಷ್ಟು ಸಮಯ ಕೊಡಬಹುದು?",
    options: [
      { val: 15, label: "15 ನಿಮಿಷ — ಚಿಕ್ಕ ಪಾಠಗಳು" },
      { val: 30, label: "30 ನಿಮಿಷ — ಸ್ಥಿರ ವೇಗ" },
      { val: 45, label: "45 ನಿಮಿಷ — ಗಮನವಿಟ್ಟು ಕಲಿಕೆ" },
      { val: 60, label: "1 ಗಂಟೆ — ನಾನು ಗಂಭೀರವಾಗಿದ್ದೇನೆ" },
    ],
  },
  optional_step: {
    question: "ಇನ್ನಷ್ಟು ಹೇಳಿ",
    hint: "ನಿಮ್ಮ ಅನುಭವವನ್ನು ಮತ್ತಷ್ಟು ಉತ್ತಮಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    collegePlaceholder: "ಕಾಲೇಜು / ವಿಶ್ವವಿದ್ಯಾಲಯ",
    hometownPlaceholder: "ಸ್ವಂತ ಊರು",
    aiLevelLabel: "AI ಬಗ್ಗೆ ನಿಮಗೆ ಎಷ್ಟು ಪರಿಚಯ?",
    aiLevels: [
      { val: "none",         label: "ಏನೂ ಇಲ್ಲ" },
      { val: "basic",        label: "ಸ್ವಲ್ಪ" },
      { val: "intermediate", label: "ಮಧ್ಯಮ" },
      { val: "advanced",     label: "ಮುಂದುವರಿದ" },
    ],
  },
  done: {
    heading: "ಎಲ್ಲಾ ಸಿದ್ಧ!",
    personaLine: (p) => `ನಿಮ್ಮ ಕೋರ್ಸ್ ${p} ಗಾಗಿ ತಯಾರಿಸಲಾಗಿದೆ.`,
    subline: "ನಿಮ್ಮ ಮಾಡ್ಯೂಲ್‌ಗಳು ವೈಯಕ್ತಿಕಗೊಳಿಸಲಾಗಿವೆ. ಮಾಡ್ಯೂಲ್ 1 ರಿಂದ ಪ್ರಾರಂಭಿಸೋಣ.",
    cta: "ನನ್ನ ಕೋರ್ಸ್‌ಗೆ ಹೋಗಿ",
  },

  back: "ಹಿಂದೆ",
  continue: "ಮುಂದುವರಿಯಿರಿ",
  skip: "ಬಿಟ್ಟುಬಿಡಿ",
  finish: "ಮುಗಿಸಿ",
  saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ…",
  error: "ಏನೋ ತಪ್ಪಾಯಿತು. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
};

// ── Export ────────────────────────────────────────────────────────────────────

export const i18n: Record<Lang, QuizI18n> = { en, hi, mr, te, ta, kn };

export function getQuizI18n(lang: string): QuizI18n {
  return i18n[(lang as Lang) in i18n ? (lang as Lang) : "en"];
}
