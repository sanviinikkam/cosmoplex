import type { Lang } from "@/lib/use-lang";

export interface MCQ {
  id: string;
  level: "B" | "I" | "A";
  question: string;
  question_hi?: string;
  question_te?: string;
  question_ta?: string;
  question_kn?: string;
  question_mr?: string;
  options: string[];
  options_hi?: string[];
  options_te?: string[];
  options_ta?: string[];
  options_kn?: string[];
  options_mr?: string[];
  correctIndex: number;
}

export const MCQ_POOL: MCQ[] = [
  // ── Beginner ────────────────────────────────────────────────────────────────
  {
    id: "q1", level: "B",
    question: "What does AI stand for?",
    question_hi: "AI का पूरा नाम क्या है?",
    question_te: "AI అంటే ఏమిటి?",
    question_ta: "AI என்றால் என்ன?",
    question_kn: "AI ಎಂದರೇನು?",
    question_mr: "AI चा फुल फॉर्म काय आहे?",
    options: ["Automated Interface", "Artificial Intelligence", "Advanced Integration", "Automated Intelligence"],
    options_hi: ["ऑटोमेटेड इंटरफेस", "आर्टिफिशियल इंटेलिजेंस", "एडवांस्ड इंटीग्रेशन", "ऑटोमेटेड इंटेलिजेंस"],
    options_te: ["ఆటోమేటెడ్ ఇంటర్‌ఫేస్", "ఆర్టిఫిషియల్ ఇంటెలిజెన్స్", "అడ్వాన్స్‌డ్ ఇంటిగ్రేషన్", "ఆటోమేటెడ్ ఇంటెలిజెన్స్"],
    options_ta: ["ஆட்டோமேட்டட் இன்டர்ஃபேஸ்", "ஆர்டிஃபிஷியல் இன்டெலிஜென்ஸ்", "அட்வான்ஸ்ட் இன்டிகிரேஷன்", "ஆட்டோமேட்டட் இன்டெலிஜென்ஸ்"],
    options_kn: ["ಆಟೊಮೇಟೆಡ್ ಇಂಟರ್‌ಫೇಸ್", "ಆರ್ಟಿಫಿಷಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್", "ಅಡ್ವಾನ್ಸ್ಡ್ ಇಂಟಿಗ್ರೇಶನ್", "ಆಟೊಮೇಟೆಡ್ ಇಂಟೆಲಿಜೆನ್ಸ್"],
    options_mr: ["ऑटोमेटेड इंटरफेस", "आर्टिफिशियल इंटेलिजन्स", "ॲडव्हान्स्ड इंटिग्रेशन", "ऑटोमेटेड इंटेलिजन्स"],
    correctIndex: 1,
  },
  {
    id: "q2", level: "B",
    question: "Which of these is an everyday example of AI?",
    question_hi: "इनमें से AI का रोज़ाना का उदाहरण कौन सा है?",
    question_te: "ఇవిలో AI యొక్క రోజువారీ ఉదాహరణ ఏది?",
    question_ta: "இவற்றில் AI-யின் தினசரி உதாரணம் எது?",
    question_kn: "ಇವುಗಳಲ್ಲಿ AI ಯ ದೈನಂದಿನ ಉದಾಹರಣೆ ಯಾವುದು?",
    question_mr: "यांपैकी AI चं रोजच्या वापरातलं उदाहरण कोणतं आहे?",
    options: ["Calculator", "Truecaller spam detection", "Basic alarm clock", "Manual dictionary"],
    options_hi: ["कैलकुलेटर", "ट्रूकॉलर स्पैम डिटेक्शन", "बेसिक अलार्म क्लॉक", "मैनुअल डिक्शनरी"],
    options_te: ["కాల్కులేటర్", "Truecaller స్పామ్ డిటెక్షన్", "సాధారణ అలారం క్లాక్", "మాన్యువల్ డిక్షనరీ"],
    options_ta: ["கால்குலேட்டர்", "Truecaller ஸ்பேம் டிடெக்ஷன்", "சாதாரண அலாரம் கடிகாரம்", "மேனுவல் டிக்ஷனரி"],
    options_kn: ["ಕ್ಯಾಲ್ಕುಲೇಟರ್", "Truecaller ಸ್ಪ್ಯಾಮ್ ಡಿಟೆಕ್ಷನ್", "ಸಾಧಾರಣ ಅಲಾರಂ ಕ್ಲಾಕ್", "ಮ್ಯಾನುಯಲ್ ಡಿಕ್ಷನರಿ"],
    options_mr: ["कॅल्क्युलेटर", "Truecaller स्पॅम डिटेक्शन", "साधं अलार्म क्लॉक", "मॅन्युअल डिक्शनरी"],
    correctIndex: 1,
  },
  {
    id: "q3", level: "B",
    question: "What does Generative AI do?",
    question_hi: "जेनेरेटिव AI क्या करता है?",
    question_te: "జెనరేటివ్ AI ఏమి చేస్తుంది?",
    question_ta: "Generative AI என்ன செய்கிறது?",
    question_kn: "Generative AI ಏನು ಮಾಡುತ್ತದೆ?",
    question_mr: "जनरेटिव्ह AI काय करतं?",
    options: ["Generates electricity", "Creates new content — text, images, audio", "Only searches the internet", "Only translates languages"],
    options_hi: ["बिजली बनाता है", "नया कॉन्टेंट बनाता है — टेक्स्ट, इमेज, ऑडियो", "केवल इंटरनेट सर्च करता है", "केवल भाषाएं अनुवाद करता है"],
    options_te: ["విద్యుత్తు తయారు చేస్తుంది", "కొత్త కంటెంట్ సృష్టిస్తుంది — టెక్స్ట్, చిత్రాలు, ఆడియో", "కేవలం ఇంటర్నెట్ వెతుకుతుంది", "కేవలం భాషలు అనువదిస్తుంది"],
    options_ta: ["மின்சாரத்தை உருவாக்குகிறது", "புதிய உள்ளடக்கத்தை உருவாக்குகிறது — டெக்ஸ்ட், படங்கள், ஆடியோ", "இணையத்தில் மட்டும் தேடுகிறது", "மொழிகளை மட்டும் மொழிபெயர்க்கிறது"],
    options_kn: ["ವಿದ್ಯುತ್ ಉತ್ಪಾದಿಸುತ್ತದೆ", "ಹೊಸ ಕಂಟೆಂಟ್ ಸೃಷ್ಟಿಸುತ್ತದೆ — ಟೆಕ್ಸ್ಟ್, ಚಿತ್ರಗಳು, ಆಡಿಯೋ", "ಇಂಟರ್ನೆಟ್‌ನಲ್ಲಿ ಮಾತ್ರ ಹುಡುಕುತ್ತದೆ", "ಭಾಷೆಗಳನ್ನು ಮಾತ್ರ ಅನುವಾದಿಸುತ್ತದೆ"],
    options_mr: ["वीज तयार करतं", "नवीन कंटेंट तयार करतं — टेक्स्ट, इमेज, ऑडिओ", "फक्त इंटरनेट सर्च करतं", "फक्त भाषांचं भाषांतर करतं"],
    correctIndex: 1,
  },
  {
    id: "q4", level: "B",
    question: "What is a Prompt?",
    question_hi: "प्रॉम्प्ट क्या होता है?",
    question_te: "ప్రాంప్ట్ అంటే ఏమిటి?",
    question_ta: "ப்ராம்ட் (Prompt) என்றால் என்ன?",
    question_kn: "ಪ್ರಾಂಪ್ಟ್ (Prompt) ಎಂದರೇನು?",
    question_mr: "प्रॉम्प्ट म्हणजे काय?",
    options: ["A phone notification", "The instruction you give to AI", "AI's response", "A type of AI model"],
    options_hi: ["फोन नोटिफिकेशन", "AI को दिया गया आपका इंस्ट्रक्शन", "AI का जवाब", "एक प्रकार का AI मॉडल"],
    options_te: ["ఫోన్ నోటిఫికేషన్", "మీరు AI కి ఇచ్చే సూచన", "AI యొక్క సమాధానం", "ఒక రకమైన AI మోడల్"],
    options_ta: ["ஃபோன் நோட்டிஃபிகேஷன்", "நீங்கள் AI-க்கு கொடுக்கும் அறிவுறுத்தல்", "AI-யின் பதில்", "ஒரு வகை AI மாடல்"],
    options_kn: ["ಫೋನ್ ನೋಟಿಫಿಕೇಶನ್", "ನೀವು AI ಗೆ ನೀಡುವ ಸೂಚನೆ", "AI ಯ ಉತ್ತರ", "ಒಂದು ಬಗೆಯ AI ಮಾಡೆಲ್"],
    options_mr: ["फोन नोटिफिकेशन", "तुम्ही AI ला देता ती सूचना", "AI चं उत्तर", "एक प्रकारचं AI मॉडेल"],
    correctIndex: 1,
  },
  {
    id: "q5", level: "B",
    question: "What does LLM stand for?",
    question_hi: "LLM का पूरा नाम क्या है?",
    question_te: "LLM పూర్తి పేరు ఏమిటి?",
    question_ta: "LLM என்றால் என்ன?",
    question_kn: "LLM ಎಂದರೇನು?",
    question_mr: "LLM चा फुल फॉर्म काय आहे?",
    options: ["Latest Language Machine", "Large Language Model", "Linear Learning Module", "Local Language Memory"],
    options_hi: ["लेटेस्ट लैंग्वेज मशीन", "लार्ज लैंग्वेज मॉडल", "लीनियर लर्निंग मॉड्यूल", "लोकल लैंग्वेज मेमरी"],
    options_te: ["లేటెస్ట్ లాంగ్వేజ్ మెషీన్", "లార్జ్ లాంగ్వేజ్ మోడల్", "లీనియర్ లెర్నింగ్ మాడ్యూల్", "లోకల్ లాంగ్వేజ్ మెమరీ"],
    options_ta: ["லேட்டஸ்ட் லாங்வேஜ் மெஷின்", "லார்ஜ் லாங்வேஜ் மாடல்", "லீனியர் லேர்னிங் மாட்யூல்", "லோக்கல் லாங்வேஜ் மெமரி"],
    options_kn: ["ಲೇಟೆಸ್ಟ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮೆಷಿನ್", "ಲಾರ್ಜ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮಾಡೆಲ್", "ಲೀನಿಯರ್ ಲರ್ನಿಂಗ್ ಮಾಡ್ಯೂಲ್", "ಲೋಕಲ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮೆಮರಿ"],
    options_mr: ["लेटेस्ट लँग्वेज मशीन", "लार्ज लँग्वेज मॉडेल", "लिनिअर लर्निंग मॉड्यूल", "लोकल लँग्वेज मेमरी"],
    correctIndex: 1,
  },
  {
    id: "q6", level: "B",
    question: "Which best describes Machine Learning?",
    question_hi: "मशीन लर्निंग को सबसे अच्छी तरह कौन सा विकल्प बताता है?",
    question_te: "మెషీన్ లెర్నింగ్‌ను అత్యుత్తమంగా వర్ణించేది ఏది?",
    question_ta: "Machine Learning-ஐ சிறந்த முறையில் விவரிப்பது எது?",
    question_kn: "Machine Learning ಅನ್ನು ಅತ್ಯುತ್ತಮವಾಗಿ ವಿವರಿಸುವುದು ಯಾವುದು?",
    question_mr: "मशीन लर्निंग सर्वात चांगल्या प्रकारे कोणता पर्याय सांगतो?",
    options: ["Machines that follow pre-written rules", "Machines that learn patterns from data", "Machines that only do calculations", "Machines controlled manually"],
    options_hi: ["मशीनें जो पहले से लिखे नियमों का पालन करती हैं", "मशीनें जो डेटा से पैटर्न सीखती हैं", "मशीनें जो केवल गणना करती हैं", "मैन्युअल रूप से नियंत्रित मशीनें"],
    options_te: ["ముందుగా రాసిన నియమాలు పాటించే మెషీన్లు", "డేటా నుండి నమూనాలు నేర్చుకునే మెషీన్లు", "కేవలం గణనలు చేసే మెషీన్లు", "మాన్యువల్‌గా నియంత్రించే మెషీన్లు"],
    options_ta: ["முன்கூட்டியே எழுதப்பட்ட விதிகளைப் பின்பற்றும் மெஷின்கள்", "டேட்டாவிலிருந்து பேட்டர்ன்களைக் கற்கும் மெஷின்கள்", "கணக்கீடுகளை மட்டும் செய்யும் மெஷின்கள்", "மேனுவலாக கட்டுப்படுத்தப்படும் மெஷின்கள்"],
    options_kn: ["ಮೊದಲೇ ಬರೆದ ನಿಯಮಗಳನ್ನು ಅನುಸರಿಸುವ ಮೆಷಿನ್‌ಗಳು", "ಡೇಟಾದಿಂದ ಪ್ಯಾಟರ್ನ್‌ಗಳನ್ನು ಕಲಿಯುವ ಮೆಷಿನ್‌ಗಳು", "ಕೇವಲ ಲೆಕ್ಕಾಚಾರ ಮಾಡುವ ಮೆಷಿನ್‌ಗಳು", "ಮ್ಯಾನುಯಲ್ ಆಗಿ ನಿಯಂತ್ರಿಸುವ ಮೆಷಿನ್‌ಗಳು"],
    options_mr: ["आधीच लिहिलेल्या नियमांचं पालन करणाऱ्या मशीन्स", "डेटामधून पॅटर्न शिकणाऱ्या मशीन्स", "फक्त गणितं करणाऱ्या मशीन्स", "मॅन्युअली नियंत्रित होणाऱ्या मशीन्स"],
    correctIndex: 1,
  },
  {
    id: "q7", level: "B",
    question: "What is an Output in AI?",
    question_hi: "AI में आउटपुट क्या होता है?",
    question_te: "AI లో అవుట్‌పుట్ అంటే ఏమిటి?",
    question_ta: "AI-யில் அவுட்புட் (Output) என்றால் என்ன?",
    question_kn: "AI ಯಲ್ಲಿ ಔಟ್‌ಪುಟ್ (Output) ಎಂದರೇನು?",
    question_mr: "AI मध्ये आउटपुट म्हणजे काय?",
    options: ["Electricity AI uses", "Instruction you give AI", "What AI generates in response to your prompt", "AI's memory limit"],
    options_hi: ["AI जो बिजली इस्तेमाल करती है", "AI को दिया गया इंस्ट्रक्शन", "आपके प्रॉम्प्ट के जवाब में AI जो बनाता है", "AI की मेमरी लिमिट"],
    options_te: ["AI వాడే విద్యుత్తు", "AI కి ఇచ్చే సూచన", "మీ ప్రాంప్ట్‌కు జవాబుగా AI సృష్టించేది", "AI యొక్క మెమరీ పరిమితి"],
    options_ta: ["AI பயன்படுத்தும் மின்சாரம்", "நீங்கள் AI-க்கு கொடுக்கும் அறிவுறுத்தல்", "உங்கள் ப்ராம்ட்டுக்கு பதிலாக AI உருவாக்குவது", "AI-யின் மெமரி வரம்பு"],
    options_kn: ["AI ಬಳಸುವ ವಿದ್ಯುತ್", "ನೀವು AI ಗೆ ನೀಡುವ ಸೂಚನೆ", "ನಿಮ್ಮ ಪ್ರಾಂಪ್ಟ್‌ಗೆ ಪ್ರತಿಯಾಗಿ AI ಸೃಷ್ಟಿಸುವುದು", "AI ಯ ಮೆಮರಿ ಮಿತಿ"],
    options_mr: ["AI वापरते ती वीज", "AI ला दिलेली सूचना", "तुमच्या प्रॉम्प्टला उत्तर म्हणून AI जे तयार करतं ते", "AI ची मेमरी लिमिट"],
    correctIndex: 2,
  },

  // ── Intermediate ─────────────────────────────────────────────────────────────
  {
    id: "q8", level: "I",
    question: "Swiggy recommends dishes based on your past orders. This is:",
    question_hi: "Swiggy आपके पिछले ऑर्डर के आधार पर व्यंजन सुझाता है। यह क्या है?",
    question_te: "Swiggy మీ గత ఆర్డర్ల ఆధారంగా వంటకాలు సూచిస్తుంది. ఇది:",
    question_ta: "Swiggy உங்கள் முந்தைய ஆர்டர்களின் அடிப்படையில் உணவுகளை பரிந்துரைக்கிறது. இது:",
    question_kn: "Swiggy ನಿಮ್ಮ ಹಿಂದಿನ ಆರ್ಡರ್‌ಗಳ ಆಧಾರದ ಮೇಲೆ ಭಕ್ಷ್ಯಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ. ಇದು:",
    question_mr: "Swiggy तुमच्या आधीच्या ऑर्डरवरून पदार्थ सुचवतं. हे काय आहे?",
    options: ["Generative AI", "Machine Learning", "Basic programming", "Database lookup"],
    options_hi: ["जेनेरेटिव AI", "मशीन लर्निंग", "बेसिक प्रोग्रामिंग", "डेटाबेस लुकअप"],
    options_te: ["జెనరేటివ్ AI", "మెషీన్ లెర్నింగ్", "సాధారణ ప్రోగ్రామింగ్", "డేటాబేస్ లుకప్"],
    options_ta: ["Generative AI", "Machine Learning", "சாதாரண ப்ரோகிராமிங்", "டேட்டாபேஸ் லுக்அப்"],
    options_kn: ["Generative AI", "Machine Learning", "ಸಾಧಾರಣ ಪ್ರೋಗ್ರಾಮಿಂಗ್", "ಡೇಟಾಬೇಸ್ ಲುಕಪ್"],
    options_mr: ["जनरेटिव्ह AI", "मशीन लर्निंग", "बेसिक प्रोग्रामिंग", "डेटाबेस लुकअप"],
    correctIndex: 1,
  },
  {
    id: "q9", level: "I",
    question: 'You asked ChatGPT "write something" and got a poor result. Most likely reason:',
    question_hi: 'आपने ChatGPT से "कुछ लिखो" कहा और खराब नतीजा मिला। सबसे संभावित कारण:',
    question_te: 'మీరు ChatGPT ని "ఏదైనా రాయి" అని అడిగారు, నిరాశాజనక ఫలితం వచ్చింది. అత్యధిక అవకాశం ఉన్న కారణం:',
    question_ta: 'நீங்கள் ChatGPT-யிடம் "ஏதாவது எழுது" என்று கேட்டீர்கள், மோசமான முடிவு கிடைத்தது. மிகச் சாத்தியமான காரணம்:',
    question_kn: 'ನೀವು ChatGPT ಗೆ "ಏನಾದರೂ ಬರೆ" ಎಂದು ಕೇಳಿದಿರಿ, ಕಳಪೆ ಫಲಿತಾಂಶ ಬಂದಿತು. ಅತ್ಯಂತ ಸಂಭವನೀಯ ಕಾರಣ:',
    question_mr: 'तुम्ही ChatGPT ला "काहीतरी लिही" असं सांगितलं आणि खराब रिझल्ट मिळाला. सर्वात संभाव्य कारण:',
    options: ["ChatGPT is broken", "Internet is slow", "Prompt was not specific enough", "Model is outdated"],
    options_hi: ["ChatGPT खराब है", "इंटरनेट धीमा है", "प्रॉम्प्ट पर्याप्त स्पेसिफिक नहीं था", "मॉडल पुराना है"],
    options_te: ["ChatGPT పాడైంది", "ఇంటర్నెట్ మెల్లగా ఉంది", "ప్రాంప్ట్ తగినంత నిర్దిష్టంగా లేదు", "మోడల్ పాతది"],
    options_ta: ["ChatGPT பழுதடைந்துள்ளது", "இணையம் மெதுவாக உள்ளது", "ப்ராம்ட் போதுமான அளவு குறிப்பிட்டதாக இல்லை", "மாடல் பழையது"],
    options_kn: ["ChatGPT ಕೆಟ್ಟುಹೋಗಿದೆ", "ಇಂಟರ್ನೆಟ್ ನಿಧಾನವಾಗಿದೆ", "ಪ್ರಾಂಪ್ಟ್ ಸಾಕಷ್ಟು ನಿರ್ದಿಷ್ಟವಾಗಿರಲಿಲ್ಲ", "ಮಾಡೆಲ್ ಹಳೆಯದು"],
    options_mr: ["ChatGPT खराब आहे", "इंटरनेट हळू आहे", "प्रॉम्प्ट पुरेसा स्पेसिफिक नव्हता", "मॉडेल जुनं आहे"],
    correctIndex: 2,
  },
  {
    id: "q10", level: "I",
    question: "What is the Context Window?",
    question_hi: "कॉन्टेक्स्ट विंडो क्या है?",
    question_te: "కాంటెక్స్ట్ విండో అంటే ఏమిటి?",
    question_ta: "காண்டெக்ஸ்ட் விண்டோ (Context Window) என்றால் என்ன?",
    question_kn: "ಕಾಂಟೆಕ್ಸ್ಟ್ ವಿಂಡೋ (Context Window) ಎಂದರೇನು?",
    question_mr: "कॉन्टेक्स्ट विंडो म्हणजे काय?",
    options: ["AI's display screen", "Maximum messages per day", "How much of a conversation AI can remember at one time", "Size of the AI model"],
    options_hi: ["AI की डिस्प्ले स्क्रीन", "प्रति दिन अधिकतम मैसेज", "एक बातचीत में AI कितना याद रख सकती है", "AI मॉडल का आकार"],
    options_te: ["AI యొక్క డిస్‌ప్లే స్క్రీన్", "రోజుకు గరిష్ట సందేశాలు", "ఒకే సమయంలో AI సంభాషణలో ఎంత గుర్తుంచుకోగలదు", "AI మోడల్ పరిమాణం"],
    options_ta: ["AI-யின் டிஸ்ப்ளே ஸ்கிரீன்", "ஒரு நாளைக்கு அதிகபட்ச மெசேஜ்கள்", "ஒரே நேரத்தில் ஒரு உரையாடலில் AI எவ்வளவு நினைவில் வைத்திருக்க முடியும்", "AI மாடலின் அளவு"],
    options_kn: ["AI ಯ ಡಿಸ್‌ಪ್ಲೇ ಸ್ಕ್ರೀನ್", "ದಿನಕ್ಕೆ ಗರಿಷ್ಠ ಸಂದೇಶಗಳು", "ಒಂದೇ ಸಮಯದಲ್ಲಿ ಸಂಭಾಷಣೆಯಲ್ಲಿ AI ಎಷ್ಟು ನೆನಪಿಟ್ಟುಕೊಳ್ಳಬಲ್ಲದು", "AI ಮಾಡೆಲ್‌ನ ಗಾತ್ರ"],
    options_mr: ["AI ची डिस्प्ले स्क्रीन", "दिवसाला जास्तीत जास्त मेसेज", "एका वेळी AI संभाषणातलं किती लक्षात ठेवू शकतं", "AI मॉडेलचा आकार"],
    correctIndex: 2,
  },
  {
    id: "q11", level: "I",
    question: "Which is true about tokens?",
    question_hi: "टोकन के बारे में कौन सी बात सही है?",
    question_te: "టోకన్ల గురించి సత్యమేది?",
    question_ta: "டோக்கன்கள் (Tokens) பற்றி எது சரியானது?",
    question_kn: "ಟೋಕನ್‌ಗಳ (Tokens) ಬಗ್ಗೆ ಯಾವುದು ಸರಿ?",
    question_mr: "टोकनबद्दल कोणती गोष्ट बरोबर आहे?",
    options: ["One token always equals one word", "Tokens are AI's processing unit — smaller pieces than words", "Tokens are only for image generation", "More tokens always means better output"],
    options_hi: ["एक टोकन हमेशा एक शब्द के बराबर होता है", "टोकन AI की प्रोसेसिंग यूनिट है — शब्दों से छोटे टुकड़े", "टोकन केवल इमेज जेनरेशन के लिए हैं", "अधिक टोकन हमेशा बेहतर आउटपुट देते हैं"],
    options_te: ["ఒక టోకన్ ఎప్పుడూ ఒక పదానికి సమానం", "టోకన్లు AI యొక్క ప్రాసెసింగ్ యూనిట్ — పదాల కంటే చిన్న ముక్కలు", "టోకన్లు కేవలం చిత్రాల సృష్టికే", "ఎక్కువ టోకన్లు ఎప్పుడూ మెరుగైన అవుట్‌పుట్ ఇస్తాయి"],
    options_ta: ["ஒரு டோக்கன் எப்போதும் ஒரு வார்த்தைக்கு சமம்", "டோக்கன்கள் AI-யின் ப்ராசசிங் யூனிட் — வார்த்தைகளை விட சிறிய துண்டுகள்", "டோக்கன்கள் இமேஜ் ஜெனரேஷனுக்கு மட்டுமே", "அதிக டோக்கன்கள் எப்போதும் சிறந்த அவுட்புட் தரும்"],
    options_kn: ["ಒಂದು ಟೋಕನ್ ಯಾವಾಗಲೂ ಒಂದು ಪದಕ್ಕೆ ಸಮ", "ಟೋಕನ್‌ಗಳು AI ಯ ಪ್ರೊಸೆಸಿಂಗ್ ಯೂನಿಟ್ — ಪದಗಳಿಗಿಂತ ಸಣ್ಣ ತುಣುಕುಗಳು", "ಟೋಕನ್‌ಗಳು ಇಮೇಜ್ ಜನರೇಶನ್‌ಗೆ ಮಾತ್ರ", "ಹೆಚ್ಚು ಟೋಕನ್‌ಗಳು ಯಾವಾಗಲೂ ಉತ್ತಮ ಔಟ್‌ಪುಟ್ ನೀಡುತ್ತವೆ"],
    options_mr: ["एक टोकन नेहमी एका शब्दाइतकं असतं", "टोकन ही AI ची प्रोसेसिंग युनिट आहे — शब्दांपेक्षा लहान तुकडे", "टोकन फक्त इमेज जनरेशनसाठी असतात", "जास्त टोकन म्हणजे नेहमी चांगलं आउटपुट"],
    correctIndex: 1,
  },
  {
    id: "q12", level: "I",
    question: "ChatGPT, Gemini, and Claude are all:",
    question_hi: "ChatGPT, Gemini और Claude सभी:",
    question_te: "ChatGPT, Gemini మరియు Claude అన్నీ:",
    question_ta: "ChatGPT, Gemini மற்றும் Claude அனைத்தும்:",
    question_kn: "ChatGPT, Gemini ಮತ್ತು Claude ಎಲ್ಲವೂ:",
    question_mr: "ChatGPT, Gemini आणि Claude हे सगळे:",
    options: ["The same AI with different names", "Different models with different strengths", "All owned by Google", "All free without limits"],
    options_hi: ["अलग नामों वाला एक ही AI", "अलग-अलग खूबियों वाले अलग-अलग मॉडल", "सब Google के हैं", "सब बिना सीमा के मुफ्त हैं"],
    options_te: ["వేరే పేర్లతో ఒకే AI", "వేర్వేరు బలాలున్న వేర్వేరు మోడల్లు", "అన్నీ Google సొంతం", "అన్నీ పరిమితి లేకుండా ఉచితం"],
    options_ta: ["வெவ்வேறு பெயர்களில் உள்ள ஒரே AI", "வெவ்வேறு பலங்களைக் கொண்ட வெவ்வேறு மாடல்கள்", "அனைத்தும் Google-க்கு சொந்தமானவை", "அனைத்தும் வரம்பின்றி இலவசம்"],
    options_kn: ["ಬೇರೆ ಹೆಸರುಗಳಲ್ಲಿ ಇರುವ ಒಂದೇ AI", "ಬೇರೆ ಬೇರೆ ಶಕ್ತಿಗಳುಳ್ಳ ಬೇರೆ ಬೇರೆ ಮಾಡೆಲ್‌ಗಳು", "ಎಲ್ಲವೂ Google ಒಡೆತನದ್ದು", "ಎಲ್ಲವೂ ಮಿತಿ ಇಲ್ಲದೆ ಉಚಿತ"],
    options_mr: ["वेगवेगळ्या नावांचं एकच AI", "वेगवेगळ्या खुब्या असलेली वेगवेगळी मॉडेल्स", "सगळे Google चे आहेत", "सगळे कोणत्याही मर्यादेशिवाय फ्री आहेत"],
    correctIndex: 1,
  },
  {
    id: "q13", level: "I",
    question: 'You give AI a vague prompt like "help me with my resume." What happens?',
    question_hi: 'आप AI को "मेरे रेज़ुमे में मदद करो" जैसा अस्पष्ट प्रॉम्प्ट देते हैं। क्या होता है?',
    question_te: '"నా రెజ్యూమేకు సహాయం చేయి" వంటి అస్పష్టమైన ప్రాంప్ట్ ఇస్తే ఏమవుతుంది?',
    question_ta: 'நீங்கள் AI-க்கு "என் ரெஸ்யூமேக்கு உதவு" போன்ற தெளிவற்ற ப்ராம்ட் கொடுக்கிறீர்கள். என்ன நடக்கும்?',
    question_kn: 'ನೀವು AI ಗೆ "ನನ್ನ ರೆಸ್ಯೂಮ್‌ಗೆ ಸಹಾಯ ಮಾಡು" ಎಂಬಂತಹ ಅಸ್ಪಷ್ಟ ಪ್ರಾಂಪ್ಟ್ ನೀಡುತ್ತೀರಿ. ಏನಾಗುತ್ತದೆ?',
    question_mr: 'तुम्ही AI ला "माझ्या रेझ्युमेमध्ये मदत कर" असा अस्पष्ट प्रॉम्प्ट देता. काय होतं?',
    options: ["AI asks clarifying questions", "AI produces a generic, less useful output", "AI refuses", "AI searches Google for your resume"],
    options_hi: ["AI स्पष्टीकरण के सवाल पूछता है", "AI एक सामान्य, कम उपयोगी आउटपुट देता है", "AI मना कर देता है", "AI आपका रेज़ुमे Google पर ढूंढता है"],
    options_te: ["AI స్పష్టత కోసం అడుగుతుంది", "AI సాధారణ, తక్కువ ఉపయోగకరమైన అవుట్‌పుట్ ఇస్తుంది", "AI నిరాకరిస్తుంది", "AI మీ రెజ్యూమేను Google లో వెతుకుతుంది"],
    options_ta: ["AI தெளிவுபடுத்தும் கேள்விகளைக் கேட்கிறது", "AI ஒரு பொதுவான, குறைவான பயனுள்ள அவுட்புட் தருகிறது", "AI மறுக்கிறது", "AI உங்கள் ரெஸ்யூமேயை Google-ல் தேடுகிறது"],
    options_kn: ["AI ಸ್ಪಷ್ಟೀಕರಣದ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತದೆ", "AI ಒಂದು ಸಾಧಾರಣ, ಕಡಿಮೆ ಉಪಯುಕ್ತ ಔಟ್‌ಪುಟ್ ನೀಡುತ್ತದೆ", "AI ನಿರಾಕರಿಸುತ್ತದೆ", "AI ನಿಮ್ಮ ರೆಸ್ಯೂಮ್ ಅನ್ನು Google ನಲ್ಲಿ ಹುಡುಕುತ್ತದೆ"],
    options_mr: ["AI स्पष्टीकरणाचे प्रश्न विचारतं", "AI एक सामान्य, कमी उपयोगी आउटपुट देतं", "AI नकार देतं", "AI तुमचा रेझ्युमे Google वर शोधतं"],
    correctIndex: 1,
  },
  {
    id: "q14", level: "I",
    question: '"Model" in AI refers to:',
    question_hi: 'AI में "मॉडल" का मतलब है:',
    question_te: 'AI లో "మోడల్" అంటే:',
    question_ta: 'AI-யில் "மாடல்" (Model) என்றால்:',
    question_kn: 'AI ಯಲ್ಲಿ "ಮಾಡೆಲ್" (Model) ಎಂದರೆ:',
    question_mr: 'AI मध्ये "मॉडेल" म्हणजे:',
    options: ["A physical robot", "A fashion model", "The specific trained AI system you are using", "AI's output format"],
    options_hi: ["एक फिजिकल रोबोट", "एक फैशन मॉडल", "वह विशेष ट्रेन्ड AI सिस्टम जिसे आप इस्तेमाल कर रहे हैं", "AI का आउटपुट फॉर्मेट"],
    options_te: ["ఒక భౌతిక రోబోట్", "ఒక ఫ్యాషన్ మోడల్", "మీరు ఉపయోగిస్తున్న నిర్దిష్ట శిక్షణ పొందిన AI సిస్టమ్", "AI యొక్క అవుట్‌పుట్ ఫార్మాట్"],
    options_ta: ["ஒரு உடல்ரீதியான ரோபோ", "ஒரு ஃபேஷன் மாடல்", "நீங்கள் பயன்படுத்தும் குறிப்பிட்ட ட்ரெயின் செய்யப்பட்ட AI சிஸ்டம்", "AI-யின் அவுட்புட் ஃபார்மேட்"],
    options_kn: ["ಒಂದು ಭೌತಿಕ ರೋಬೋಟ್", "ಒಂದು ಫ್ಯಾಷನ್ ಮಾಡೆಲ್", "ನೀವು ಬಳಸುತ್ತಿರುವ ನಿರ್ದಿಷ್ಟ ಟ್ರೇನ್ಡ್ AI ಸಿಸ್ಟಂ", "AI ಯ ಔಟ್‌ಪುಟ್ ಫಾರ್ಮ್ಯಾಟ್"],
    options_mr: ["एक फिजिकल रोबोट", "एक फॅशन मॉडेल", "तुम्ही वापरत असलेली ती विशिष्ट ट्रेन्ड AI सिस्टम", "AI चं आउटपुट फॉरमॅट"],
    correctIndex: 2,
  },

  // ── Advanced ─────────────────────────────────────────────────────────────────
  {
    id: "q15", level: "A",
    question: "How is Generative AI different from other types of AI?",
    question_hi: "जेनेरेटिव AI अन्य प्रकार के AI से अलग कैसे है?",
    question_te: "జెనరేటివ్ AI ఇతర రకాల AI నుండి ఎలా భిన్నంగా ఉంది?",
    question_ta: "ஜெனரேட்டிவ் AI மற்ற வகை AI களிலிருந்து எப்படி வேறுபடுகிறது?",
    question_kn: "ಜನರೇಟಿವ್ AI ಇತರ ಪ್ರಕಾರದ AI ಗಳಿಂದ ಹೇಗೆ ಭಿನ್ನವಾಗಿದೆ?",
    question_mr: "जनरेटिव्ह AI इतर प्रकारच्या AI पेक्षा कसं वेगळं आहे?",
    options: ["It only works with images", "It creates new content rather than classifying existing patterns", "It requires more electricity", "It is always more accurate"],
    options_hi: ["यह केवल इमेज के साथ काम करता है", "यह मौजूदा पैटर्न वर्गीकृत करने के बजाय नया कॉन्टेंट बनाता है", "इसे अधिक बिजली चाहिए", "यह हमेशा अधिक सटीक होता है"],
    options_te: ["ఇది కేవలం చిత్రాలతో మాత్రమే పని చేస్తుంది", "ఇది ఇప్పటికే ఉన్న నమూనాలను వర్గీకరించడం కాకుండా కొత్త కంటెంట్ సృష్టిస్తుంది", "ఇందుకు ఎక్కువ విద్యుత్తు అవసరం", "ఇది ఎప్పుడూ ఎక్కువ ఖచ్చితంగా ఉంటుంది"],
    options_ta: ["இது படங்களுடன் மட்டுமே வேலை செய்கிறது", "இது தற்போதுள்ள முறைகளை வகைப்படுத்துவதற்கு பதிலாக புதிய உள்ளடக்கத்தை உருவாக்குகிறது", "இதற்கு அதிக மின்சாரம் தேவை", "இது எப்போதும் அதிக துல்லியமானது"],
    options_kn: ["ಇದು ಚಿತ್ರಗಳೊಂದಿಗೆ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ", "ಇದು ಅಸ್ತಿತ್ವದಲ್ಲಿರುವ ಮಾದರಿಗಳನ್ನು ವರ್ಗೀಕರಿಸುವ ಬದಲು ಹೊಸ ವಿಷಯ ಸೃಷ್ಟಿಸುತ್ತದೆ", "ಇದಕ್ಕೆ ಹೆಚ್ಚು ವಿದ್ಯುತ್ ಬೇಕು", "ಇದು ಯಾವಾಗಲೂ ಹೆಚ್ಚು ನಿಖರ"],
    options_mr: ["हे फक्त इमेजसोबत काम करतं", "हे आधीच्या पॅटर्नचं वर्गीकरण करण्याऐवजी नवीन कंटेंट तयार करतं", "याला जास्त वीज लागते", "हे नेहमी जास्त अचूक असतं"],
    correctIndex: 1,
  },
  {
    id: "q16", level: "A",
    question: "Why does the Context Window limit matter in a long conversation?",
    question_hi: "लंबी बातचीत में कॉन्टेक्स्ट विंडो की सीमा क्यों मायने रखती है?",
    question_te: "దీర్ఘ సంభాషణలో కాంటెక్స్ట్ విండో పరిమితి ఎందుకు ముఖ్యమైనది?",
    question_ta: "நீண்ட உரையாடலில் கான்டெக்ஸ்ட் விண்டோ வரம்பு ஏன் முக்கியம்?",
    question_kn: "ದೀರ್ಘ ಸಂಭಾಷಣೆಯಲ್ಲಿ ಕಾಂಟೆಕ್ಸ್ಟ್ ವಿಂಡೋ ಮಿತಿ ಏಕೆ ಮುಖ್ಯ?",
    question_mr: "लांबलचक संभाषणात कॉन्टेक्स्ट विंडोची मर्यादा का महत्त्वाची असते?",
    options: ["It slows your internet", "AI may lose earlier context when the window is full", "It increases API cost", "It stops AI answering new questions"],
    options_hi: ["यह आपका इंटरनेट धीमा करता है", "विंडो भरने पर AI पहले का कॉन्टेक्स्ट भूल सकता है", "इससे API की लागत बढ़ती है", "यह AI को नए सवाल जवाब देने से रोकता है"],
    options_te: ["ఇది మీ ఇంటర్నెట్‌ను మందగిస్తుంది", "విండో నిండినప్పుడు AI మునుపటి సందర్భాన్ని కోల్పోవచ్చు", "ఇది API వ్యయాన్ని పెంచుతుంది", "ఇది AI కి కొత్త ప్రశ్నలకు సమాధానం చెప్పకుండా ఆపుతుంది"],
    options_ta: ["இது உங்கள் இணையத்தை மெதுவாக்குகிறது", "விண்டோ நிரம்பும்போது AI முந்தைய சூழலை இழக்கலாம்", "இது API செலவை அதிகரிக்கிறது", "இது AI ஐ புதிய கேள்விகளுக்கு பதிலளிப்பதை நிறுத்துகிறது"],
    options_kn: ["ಇದು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಅನ್ನು ನಿಧಾನಗೊಳಿಸುತ್ತದೆ", "ವಿಂಡೋ ತುಂಬಿದಾಗ AI ಹಿಂದಿನ ಸಂದರ್ಭವನ್ನು ಕಳೆದುಕೊಳ್ಳಬಹುದು", "ಇದು API ವೆಚ್ಚವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ", "ಇದು AI ಹೊಸ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸುವುದನ್ನು ತಡೆಯುತ್ತದೆ"],
    options_mr: ["हे तुमचं इंटरनेट हळू करतं", "विंडो भरली की AI आधीचा कॉन्टेक्स्ट विसरू शकतं", "यामुळे API चा खर्च वाढतो", "हे AI ला नवीन प्रश्नांना उत्तर देण्यापासून थांबवतं"],
    correctIndex: 1,
  },
  {
    id: "q17", level: "A",
    question: "An LLM predicts responses by:",
    question_hi: "एक LLM जवाब कैसे predict करता है?",
    question_te: "ఒక LLM సమాధానాలను ఎలా అంచనా వేస్తుంది?",
    question_ta: "ஒரு LLM பதில்களை எப்படி கணிக்கிறது?",
    question_kn: "ಒಂದು LLM ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಹೇಗೆ ಊಹಿಸುತ್ತದೆ?",
    question_mr: "एक LLM उत्तरांचा अंदाज कसा लावतं?",
    options: ["Searching the internet in real time", "Following strict logical rules", "Predicting the most likely next word from patterns in training data", "Copying answers from Wikipedia"],
    options_hi: ["रियल टाइम में इंटरनेट सर्च करके", "सख्त तार्किक नियमों का पालन करके", "ट्रेनिंग डेटा के पैटर्न से अगले सबसे संभावित शब्द का अनुमान लगाकर", "Wikipedia से जवाब कॉपी करके"],
    options_te: ["నిజ సమయంలో ఇంటర్నెట్ వెతకడం ద్వారా", "కఠినమైన తార్కిక నియమాలను పాటించడం ద్వారా", "శిక్షణ డేటాలోని నమూనాల నుండి అత్యంత సంభావ్యమైన తదుపరి పదాన్ని అంచనా వేయడం ద్వారా", "Wikipedia నుండి సమాధానాలు కాపీ చేయడం ద్వారా"],
    options_ta: ["நிகழ்நேரத்தில் இணையத்தில் தேடுவதன் மூலம்", "கடுமையான தர்க்க விதிகளை பின்பற்றுவதன் மூலம்", "பயிற்சி தரவில் உள்ள முறைகளிலிருந்து அடுத்த சாத்தியமான வார்த்தையை கணிப்பதன் மூலம்", "Wikipedia இலிருந்து பதில்களை நகலெடுப்பதன் மூலம்"],
    options_kn: ["ನೈಜ ಸಮಯದಲ್ಲಿ ಇಂಟರ್ನೆಟ್ ಹುಡುಕುವ ಮೂಲಕ", "ಕಟ್ಟುನಿಟ್ಟಾದ ತಾರ್ಕಿಕ ನಿಯಮಗಳನ್ನು ಅನುಸರಿಸುವ ಮೂಲಕ", "ತರಬೇತಿ ಡೇಟಾದಲ್ಲಿನ ಮಾದರಿಗಳಿಂದ ಮುಂದಿನ ಸಂಭಾವ್ಯ ಪದವನ್ನು ಊಹಿಸುವ ಮೂಲಕ", "Wikipedia ದಿಂದ ಉತ್ತರಗಳನ್ನು ನಕಲಿಸುವ ಮೂಲಕ"],
    options_mr: ["रिअल टाइममध्ये इंटरनेट सर्च करून", "कडक तार्किक नियमांचं पालन करून", "ट्रेनिंग डेटामधल्या पॅटर्नवरून पुढचा सर्वात संभाव्य शब्द ओळखून", "Wikipedia वरून उत्तरं कॉपी करून"],
    correctIndex: 2,
  },
  {
    id: "q18", level: "A",
    question: "Which statement about AI models is most accurate?",
    question_hi: "AI मॉडल के बारे में कौन सा कथन सबसे सटीक है?",
    question_te: "AI మోడల్ల గురించి అత్యంత ఖచ్చితమైన ప్రకటన ఏది?",
    question_ta: "AI மாடல்களைப் பற்றி மிகவும் துல்லியமான கூற்று எது?",
    question_kn: "AI ಮಾದರಿಗಳ ಬಗ್ಗೆ ಅತ್ಯಂತ ನಿಖರ ಹೇಳಿಕೆ ಯಾವುದು?",
    question_mr: "AI मॉडेल्सबद्दल कोणतं विधान सर्वात अचूक आहे?",
    options: ["All models have the same capabilities", "Newest model is always best", "Different models have different strengths, suited to different tasks", "Using multiple models always gives better results"],
    options_hi: ["सभी मॉडल की एक जैसी क्षमताएं हैं", "नया मॉडल हमेशा सबसे अच्छा होता है", "अलग-अलग मॉडल की अलग-अलग खूबियां हैं, अलग कामों के लिए उपयुक्त", "कई मॉडल का उपयोग हमेशा बेहतर नतीजे देता है"],
    options_te: ["అన్ని మోడల్లకు ఒకే సామర్థ్యాలు ఉన్నాయి", "కొత్త మోడల్ ఎప్పుడూ అత్యుత్తమం", "వేర్వేరు మోడల్లకు వేర్వేరు బలాలున్నాయి, వేర్వేరు పనులకు అనుకూలం", "అనేక మోడల్లు ఉపయోగించడం ఎప్పుడూ మెరుగైన ఫలితాలు ఇస్తుంది"],
    options_ta: ["எல்லா மாடல்களுக்கும் ஒரே திறன்கள் உள்ளன", "புதிய மாடல் எப்போதும் சிறந்தது", "வெவ்வேறு மாடல்களுக்கு வெவ்வேறு பலங்கள் உள்ளன, வெவ்வேறு பணிகளுக்கு ஏற்றவை", "பல மாடல்களைப் பயன்படுத்துவது எப்போதும் சிறந்த முடிவுகளைத் தரும்"],
    options_kn: ["ಎಲ್ಲಾ ಮಾದರಿಗಳಿಗೆ ಒಂದೇ ಸಾಮರ್ಥ್ಯಗಳಿವೆ", "ಹೊಸ ಮಾದರಿ ಯಾವಾಗಲೂ ಅತ್ಯುತ್ತಮ", "ವಿಭಿನ್ನ ಮಾದರಿಗಳಿಗೆ ವಿಭಿನ್ನ ಶಕ್ತಿಗಳಿವೆ, ವಿಭಿನ್ನ ಕೆಲಸಗಳಿಗೆ ಸೂಕ್ತ", "ಅನೇಕ ಮಾದರಿಗಳನ್ನು ಬಳಸುವುದು ಯಾವಾಗಲೂ ಉತ್ತಮ ಫಲಿತಾಂಶ ನೀಡುತ್ತದೆ"],
    options_mr: ["सगळ्या मॉडेल्सच्या क्षमता सारख्याच आहेत", "नवीन मॉडेल नेहमी सर्वात चांगलं असतं", "वेगवेगळ्या मॉडेल्सच्या वेगवेगळ्या खुब्या आहेत, वेगवेगळ्या कामांसाठी योग्य", "अनेक मॉडेल्स वापरल्याने नेहमी चांगले रिझल्ट मिळतात"],
    correctIndex: 2,
  },
  {
    id: "q19", level: "A",
    question: "Why does understanding AI / ML / GenAI differences matter for a fresher?",
    question_hi: "एक फ्रेशर के लिए AI / ML / GenAI के अंतर को समझना क्यों ज़रूरी है?",
    question_te: "ఫ్రెషర్‌కు AI / ML / GenAI తేడాలు అర్థం చేసుకోవడం ఎందుకు ముఖ్యం?",
    question_ta: "ஒரு புதியவருக்கு AI / ML / GenAI வேறுபாடுகளைப் புரிந்துகொள்வது ஏன் முக்கியம்?",
    question_kn: "ಫ್ರೆಷರ್‌ಗೆ AI / ML / GenAI ವ್ಯತ್ಯಾಸಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು ಏಕೆ ಮುಖ್ಯ?",
    question_mr: "एका फ्रेशरसाठी AI / ML / GenAI मधला फरक समजून घेणं का गरजेचं आहे?",
    options: ["Only useful for technical roles", "Helps you understand tools and communicate accurately with your team", "Required for all job interviews", "Helps you build your own AI"],
    options_hi: ["केवल तकनीकी भूमिकाओं के लिए उपयोगी", "टूल्स को समझने और टीम के साथ सटीक संवाद करने में मदद करता है", "सभी नौकरी के इंटरव्यू के लिए ज़रूरी है", "अपना खुद का AI बनाने में मदद करता है"],
    options_te: ["కేవలం సాంకేతిక పాత్రలకు మాత్రమే ఉపయోగకరం", "టూల్స్ అర్థం చేసుకోవడానికి మరియు మీ జట్టుతో ఖచ్చితంగా కమ్యూనికేట్ చేయడానికి సహాయపడుతుంది", "అన్ని ఉద్యోగ ఇంటర్వ్యూలకు అవసరం", "మీ స్వంత AI నిర్మించడానికి సహాయపడుతుంది"],
    options_ta: ["தொழில்நுட்ப பணிகளுக்கு மட்டும் பயனுள்ளது", "கருவிகளைப் புரிந்துகொள்ளவும் உங்கள் குழுவுடன் துல்லியமாக தொடர்புகொள்ளவும் உதவுகிறது", "எல்லா வேலை நேர்காணல்களுக்கும் தேவை", "உங்கள் சொந்த AI ஐ உருவாக்க உதவுகிறது"],
    options_kn: ["ಕೇವಲ ತಾಂತ್ರಿಕ ಪಾತ್ರಗಳಿಗೆ ಉಪಯುಕ್ತ", "ಉಪಕರಣಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಮತ್ತು ನಿಮ್ಮ ತಂಡದೊಂದಿಗೆ ನಿಖರವಾಗಿ ಸಂವಹನ ನಡೆಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ", "ಎಲ್ಲಾ ಉದ್ಯೋಗ ಸಂದರ್ಶನಗಳಿಗೆ ಅಗತ್ಯ", "ನಿಮ್ಮ ಸ್ವಂತ AI ನಿರ್ಮಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ"],
    options_mr: ["फक्त टेक्निकल भूमिकांसाठी उपयोगी", "टूल्स समजून घ्यायला आणि टीमशी अचूक संवाद साधायला मदत करतं", "सगळ्या नोकरीच्या इंटरव्ह्यूसाठी गरजेचं आहे", "स्वतःचं AI तयार करायला मदत करतं"],
    correctIndex: 1,
  },
  {
    id: "q20", level: "A",
    question: "When Truecaller flags a number it has never seen, this shows:",
    question_hi: "जब Truecaller किसी ऐसे नंबर को फ्लैग करता है जो उसने कभी नहीं देखा, तो यह दर्शाता है:",
    question_te: "Truecaller ఎప్పుడూ చూడని నంబర్‌ను ఫ్లాగ్ చేసినప్పుడు, ఇది చూపిస్తుంది:",
    question_ta: "Truecaller ஒருபோதும் பார்த்திராத எண்ணை ஃபிளாக் செய்யும்போது, இது காட்டுவது:",
    question_kn: "Truecaller ಎಂದೂ ನೋಡದ ಸಂಖ್ಯೆಯನ್ನು ಫ್ಲ್ಯಾಗ್ ಮಾಡಿದಾಗ, ಇದು ತೋರಿಸುತ್ತದೆ:",
    question_mr: "Truecaller ने कधीही न पाहिलेला नंबर फ्लॅग केला, तेव्हा हे दर्शवतं:",
    options: ["It checked a manual database", "AI can apply learned patterns to new situations it has never encountered", "The number was manually flagged", "Truecaller uses Generative AI"],
    options_hi: ["उसने मैन्युअल डेटाबेस चेक किया", "AI उन नई परिस्थितियों में सीखे हुए पैटर्न लागू कर सकता है जो उसने कभी नहीं देखी", "नंबर मैन्युअली फ्लैग किया गया था", "Truecaller जेनेरेटिव AI इस्तेमाल करता है"],
    options_te: ["ఇది మాన్యువల్ డేటాబేస్ తనిఖీ చేసింది", "AI ఎప్పుడూ చూడని కొత్త పరిస్థితులకు నేర్చుకున్న నమూనాలను వర్తింపజేయగలదు", "నంబర్‌ను మాన్యువల్‌గా ఫ్లాగ్ చేశారు", "Truecaller జెనరేటివ్ AI ఉపయోగిస్తుంది"],
    options_ta: ["இது கைமுறை தரவுத்தளத்தை சரிபார்த்தது", "AI ஒருபோதும் சந்திக்காத புதிய சூழ்நிலைகளுக்கு கற்ற முறைகளைப் பயன்படுத்த முடியும்", "எண் கைமுறையாக ஃபிளாக் செய்யப்பட்டது", "Truecaller ஜெனரேட்டிவ் AI ஐப் பயன்படுத்துகிறது"],
    options_kn: ["ಇದು ಕೈಯಿಂದ ಮಾಡಿದ ಡೇಟಾಬೇಸ್ ಪರಿಶೀಲಿಸಿತು", "AI ಎಂದೂ ಎದುರಿಸದ ಹೊಸ ಸಂದರ್ಭಗಳಿಗೆ ಕಲಿತ ಮಾದರಿಗಳನ್ನು ಅನ್ವಯಿಸಬಹುದು", "ಸಂಖ್ಯೆಯನ್ನು ಕೈಯಿಂದ ಫ್ಲ್ಯಾಗ್ ಮಾಡಲಾಯಿತು", "Truecaller ಜನರೇಟಿವ್ AI ಬಳಸುತ್ತದೆ"],
    options_mr: ["त्याने मॅन्युअल डेटाबेस तपासला", "AI ने कधीही न अनुभवलेल्या नवीन परिस्थितींमध्ये शिकलेले पॅटर्न लागू करू शकतं", "नंबर मॅन्युअली फ्लॅग केला होता", "Truecaller जनरेटिव्ह AI वापरतं"],
    correctIndex: 1,
  },
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Randomly reorders a question's options (so the answer isn't always B/C).
// Applies the SAME permutation to every language variant and remaps correctIndex.
function shuffleOptions(q: MCQ): MCQ {
  const n = q.options.length;
  const perm = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const apply = (arr?: string[]) => (arr ? perm.map((i) => arr[i]) : arr);
  return {
    ...q,
    options: perm.map((i) => q.options[i]),
    options_hi: apply(q.options_hi),
    options_te: apply(q.options_te),
    options_ta: apply(q.options_ta),
    options_kn: apply(q.options_kn),
    options_mr: apply(q.options_mr),
    correctIndex: perm.indexOf(q.correctIndex),
  };
}

export function pickQuestionsForLesson(lessonTitle: string): MCQ[] | null {
  // Currently all lessons share the same pool; filtered by lesson key
  const pools: Record<string, true> = {
    "The 10 AI Words Every Fresher Must Know": true,
  };
  if (!pools[lessonTitle]) return null;

  const byLevel = (lvl: MCQ["level"]) => MCQ_POOL.filter((q) => q.level === lvl);
  const beginner     = shuffle(byLevel("B")).slice(0, 2);
  const intermediate = shuffle(byLevel("I")).slice(0, 2);
  const advanced     = shuffle(byLevel("A")).slice(0, 1);
  return shuffle([...beginner, ...intermediate, ...advanced]).map(shuffleOptions);
}

/** Returns the question text in the requested language. */
export function qText(q: MCQ, lang: Lang): string {
  if (lang === "hi" && q.question_hi) return q.question_hi;
  if (lang === "te" && q.question_te) return q.question_te;
  if (lang === "ta" && q.question_ta) return q.question_ta;
  if (lang === "kn" && q.question_kn) return q.question_kn;
  if (lang === "mr" && q.question_mr) return q.question_mr;
  return q.question;
}

/** Returns the options array in the requested language. */
export function qOptions(q: MCQ, lang: Lang): string[] {
  if (lang === "hi" && q.options_hi) return q.options_hi;
  if (lang === "te" && q.options_te) return q.options_te;
  if (lang === "ta" && q.options_ta) return q.options_ta;
  if (lang === "kn" && q.options_kn) return q.options_kn;
  if (lang === "mr" && q.options_mr) return q.options_mr;
  return q.options;
}
