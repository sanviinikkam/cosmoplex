"""
Course content + localized UI strings for the WhatsApp learning flow.

Kept separate from whatsapp_routes.py so the route logic stays readable.
Lesson 1 = "The 10 AI Words Every Fresher Must Know" — the one lesson with a
video in every language. Its quiz (5 MCQs) and assignment (text-only) are below.
"""

# ── Lesson videos: language → Cloudinary public ID ───────────────────────────
LESSON_VIDEOS = [
    {
        "en": "2.1_English_compressed_s6vhdd",
        "hi": "2.1_hindi_sixgnf",
        "mr": "2.1_Marathi_cws5fc",
        "te": "2.1_Telugu_qloes6",
        "ta": "2.1_tamil_tl4rf2",
        "kn": "2.1_Kannada_azgabe",
    },
]

# ── Quiz: 5 MCQs, each with question + 4 options per language + correct index ─
QUIZ = [
    {
        "q": {
            "en": "What does AI stand for?",
            "hi": "AI का पूरा नाम क्या है?",
            "te": "AI అంటే ఏమిటి?",
            "ta": "AI என்றால் என்ன?",
            "kn": "AI ಎಂದರೇನು?",
            "mr": "AI चा फुल फॉर्म काय आहे?",
        },
        "opts": {
            "en": ["Automated Interface", "Artificial Intelligence", "Advanced Integration", "Automated Intelligence"],
            "hi": ["ऑटोमेटेड इंटरफेस", "आर्टिफिशियल इंटेलिजेंस", "एडवांस्ड इंटीग्रेशन", "ऑटोमेटेड इंटेलिजेंस"],
            "te": ["ఆటోమేటెడ్ ఇంటర్‌ఫేస్", "ఆర్టిఫిషియల్ ఇంటెలిజెన్స్", "అడ్వాన్స్‌డ్ ఇంటిగ్రేషన్", "ఆటోమేటెడ్ ఇంటెలిజెన్స్"],
            "ta": ["ஆட்டோமேட்டட் இன்டர்ஃபேஸ்", "ஆர்டிஃபிஷியல் இன்டெலிஜென்ஸ்", "அட்வான்ஸ்ட் இன்டிகிரேஷன்", "ஆட்டோமேட்டட் இன்டெலிஜென்ஸ்"],
            "kn": ["ಆಟೊಮೇಟೆಡ್ ಇಂಟರ್‌ಫೇಸ್", "ಆರ್ಟಿಫಿಷಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್", "ಅಡ್ವಾನ್ಸ್ಡ್ ಇಂಟಿಗ್ರೇಶನ್", "ಆಟೊಮೇಟೆಡ್ ಇಂಟೆಲಿಜೆನ್ಸ್"],
            "mr": ["ऑटोमेटेड इंटरफेस", "आर्टिफिशियल इंटेलिजन्स", "ॲडव्हान्स्ड इंटिग्रेशन", "ऑटोमेटेड इंटेलिजन्स"],
        },
        "correct": 1,
    },
    {
        "q": {
            "en": "Which of these is an everyday example of AI?",
            "hi": "इनमें से AI का रोज़ाना का उदाहरण कौन सा है?",
            "te": "ఇవిలో AI యొక్క రోజువారీ ఉదాహరణ ఏది?",
            "ta": "இவற்றில் AI-யின் தினசரி உதாரணம் எது?",
            "kn": "ಇವುಗಳಲ್ಲಿ AI ಯ ದೈನಂದಿನ ಉದಾಹರಣೆ ಯಾವುದು?",
            "mr": "यांपैकी AI चं रोजच्या वापरातलं उदाहरण कोणतं आहे?",
        },
        "opts": {
            "en": ["Calculator", "Truecaller spam detection", "Basic alarm clock", "Manual dictionary"],
            "hi": ["कैलकुलेटर", "ट्रूकॉलर स्पैम डिटेक्शन", "बेसिक अलार्म क्लॉक", "मैनुअल डिक्शनरी"],
            "te": ["కాల్కులేటర్", "Truecaller స్పామ్ డిటెక్షన్", "సాధారణ అలారం క్లాక్", "మాన్యువల్ డిక్షనరీ"],
            "ta": ["கால்குலேட்டர்", "Truecaller ஸ்பேம் டிடெக்ஷன்", "சாதாரண அலாரம் கடிகாரம்", "மேனுவல் டிக்ஷனரி"],
            "kn": ["ಕ್ಯಾಲ್ಕುಲೇಟರ್", "Truecaller ಸ್ಪ್ಯಾಮ್ ಡಿಟೆಕ್ಷನ್", "ಸಾಧಾರಣ ಅಲಾರಂ ಕ್ಲಾಕ್", "ಮ್ಯಾನುಯಲ್ ಡಿಕ್ಷನರಿ"],
            "mr": ["कॅल्क्युलेटर", "Truecaller स्पॅम डिटेक्शन", "साधं अलार्म क्लॉक", "मॅन्युअल डिक्शनरी"],
        },
        "correct": 1,
    },
    {
        "q": {
            "en": "What does Generative AI do?",
            "hi": "जेनेरेटिव AI क्या करता है?",
            "te": "జెనరేటివ్ AI ఏమి చేస్తుంది?",
            "ta": "Generative AI என்ன செய்கிறது?",
            "kn": "Generative AI ಏನು ಮಾಡುತ್ತದೆ?",
            "mr": "जनरेटिव्ह AI काय करतं?",
        },
        "opts": {
            "en": ["Generates electricity", "Creates new content — text, images, audio", "Only searches the internet", "Only translates languages"],
            "hi": ["बिजली बनाता है", "नया कॉन्टेंट बनाता है — टेक्स्ट, इमेज, ऑडियो", "केवल इंटरनेट सर्च करता है", "केवल भाषाएं अनुवाद करता है"],
            "te": ["విద్యుత్తు తయారు చేస్తుంది", "కొత్త కంటెంట్ సృష్టిస్తుంది — టెక్స్ట్, చిత్రాలు, ఆడియో", "కేవలం ఇంటర్నెట్ వెతుకుతుంది", "కేవలం భాషలు అనువదిస్తుంది"],
            "ta": ["மின்சாரத்தை உருவாக்குகிறது", "புதிய உள்ளடக்கத்தை உருவாக்குகிறது — டெக்ஸ்ட், படங்கள், ஆடியோ", "இணையத்தில் மட்டும் தேடுகிறது", "மொழிகளை மட்டும் மொழிபெயர்க்கிறது"],
            "kn": ["ವಿದ್ಯುತ್ ಉತ್ಪಾದಿಸುತ್ತದೆ", "ಹೊಸ ಕಂಟೆಂಟ್ ಸೃಷ್ಟಿಸುತ್ತದೆ — ಟೆಕ್ಸ್ಟ್, ಚಿತ್ರಗಳು, ಆಡಿಯೋ", "ಇಂಟರ್ನೆಟ್‌ನಲ್ಲಿ ಮಾತ್ರ ಹುಡುಕುತ್ತದೆ", "ಭಾಷೆಗಳನ್ನು ಮಾತ್ರ ಅನುವಾದಿಸುತ್ತದೆ"],
            "mr": ["वीज तयार करतं", "नवीन कंटेंट तयार करतं — टेक्स्ट, इमेज, ऑडिओ", "फक्त इंटरनेट सर्च करतं", "फक्त भाषांचं भाषांतर करतं"],
        },
        "correct": 1,
    },
    {
        "q": {
            "en": "What is a Prompt?",
            "hi": "प्रॉम्प्ट क्या होता है?",
            "te": "ప్రాంప్ట్ అంటే ఏమిటి?",
            "ta": "ப்ராம்ட் (Prompt) என்றால் என்ன?",
            "kn": "ಪ್ರಾಂಪ್ಟ್ (Prompt) ಎಂದರೇನು?",
            "mr": "प्रॉम्प्ट म्हणजे काय?",
        },
        "opts": {
            "en": ["A phone notification", "The instruction you give to AI", "AI's response", "A type of AI model"],
            "hi": ["फोन नोटिफिकेशन", "AI को दिया गया आपका इंस्ट्रक्शन", "AI का जवाब", "एक प्रकार का AI मॉडल"],
            "te": ["ఫోన్ నోటిఫికేషన్", "మీరు AI కి ఇచ్చే సూచన", "AI యొక్క సమాధానం", "ఒక రకమైన AI మోడల్"],
            "ta": ["ஃபோன் நோட்டிஃபிகேஷன்", "நீங்கள் AI-க்கு கொடுக்கும் அறிவுறுத்தல்", "AI-யின் பதில்", "ஒரு வகை AI மாடல்"],
            "kn": ["ಫೋನ್ ನೋಟಿಫಿಕೇಶನ್", "ನೀವು AI ಗೆ ನೀಡುವ ಸೂಚನೆ", "AI ಯ ಉತ್ತರ", "ಒಂದು ಬಗೆಯ AI ಮಾಡೆಲ್"],
            "mr": ["फोन नोटिफिकेशन", "तुम्ही AI ला देता ती सूचना", "AI चं उत्तर", "एक प्रकारचं AI मॉडेल"],
        },
        "correct": 1,
    },
    {
        "q": {
            "en": "What does LLM stand for?",
            "hi": "LLM का पूरा नाम क्या है?",
            "te": "LLM పూర్తి పేరు ఏమిటి?",
            "ta": "LLM என்றால் என்ன?",
            "kn": "LLM ಎಂದರೇನು?",
            "mr": "LLM चा फुल फॉर्म काय आहे?",
        },
        "opts": {
            "en": ["Latest Language Machine", "Large Language Model", "Linear Learning Module", "Local Language Memory"],
            "hi": ["लेटेस्ट लैंग्वेज मशीन", "लार्ज लैंग्वेज मॉडल", "लीनियर लर्निंग मॉड्यूल", "लोकल लैंग्वेज मेमरी"],
            "te": ["లేటెస్ట్ లాంగ్వేజ్ మెషీన్", "లార్జ్ లాంగ్వేజ్ మోడల్", "లీనియర్ లెర్నింగ్ మాడ్యూల్", "లోకల్ లాంగ్వేజ్ మెమరీ"],
            "ta": ["லேட்டஸ்ட் லாங்வேஜ் மெஷின்", "லார்ஜ் லாங்வேஜ் மாடல்", "லீனியர் லேர்னிங் மாட்யூல்", "லோக்கல் லாங்வேஜ் மெமரி"],
            "kn": ["ಲೇಟೆಸ್ಟ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮೆಷಿನ್", "ಲಾರ್ಜ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮಾಡೆಲ್", "ಲೀನಿಯರ್ ಲರ್ನಿಂಗ್ ಮಾಡ್ಯೂಲ್", "ಲೋಕಲ್ ಲ್ಯಾಂಗ್ವೇಜ್ ಮೆಮರಿ"],
            "mr": ["लेटेस्ट लँग्वेज मशीन", "लार्ज लँग्वेज मॉडेल", "लिनिअर लर्निंग मॉड्यूल", "लोकल लँग्वेज मेमरी"],
        },
        "correct": 1,
    },
]

QUIZ_PASS = 3   # of 5

# ── Assignment (text-only "Define It Yourself") ──────────────────────────────
ASSIGNMENT = {
    "id": "a1",
    "question": {
        "en": "Pick any 5 of these 10 words and write one sentence for each — in your own words, not the video's:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nNo notes. No Googling. No copy-paste. Your own words only.",
        "hi": "इन 10 शब्दों में से कोई भी 5 चुनें और हर एक के लिए एक वाक्य लिखें — अपने शब्दों में, वीडियो के नहीं:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nकोई नोट्स नहीं। Google नहीं। Copy-paste नहीं। सिर्फ अपने शब्द।",
        "te": "ఈ 10 పదాల్లో ఏవైనా 5 సెలెక్ట్ చేసి, ఒక్కో దానికి ఒక్కో సెంటెన్స్ రాయండి — మీ సొంత మాటల్లో, వీడియోలో చెప్పినవి కాదు:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nనోట్స్ వద్దు. Google వద్దు. Copy-paste వద్దు. మీ మాటల్లోనే రాయండి.",
        "ta": "இந்த 10 வார்த்தைகளில் ஏதேனும் 5 ஐ தேர்ந்தெடுத்து ஒவ்வொன்றுக்கும் ஒரு வாக்கியம் எழுதுங்கள் — உங்கள் சொந்த வார்த்தைகளில்:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nகுறிப்புகள் வேண்டாம். Google வேண்டாம். Copy-paste வேண்டாம். உங்கள் வார்த்தைகள் மட்டும்.",
        "kn": "ಈ 10 ಪದಗಳಲ್ಲಿ ಯಾವುದಾದರೂ 5 ಆಯ್ಕೆ ಮಾಡಿ ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ — ನಿಮ್ಮ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nಟಿಪ್ಪಣಿಗಳು ಬೇಡ. Google ಬೇಡ. Copy-paste ಬೇಡ. ಕೇವಲ ನಿಮ್ಮ ಮಾತುಗಳು.",
        "mr": "या 10 शब्दांपैकी कोणतेही 5 निवडा आणि प्रत्येकासाठी एक वाक्य लिहा — तुमच्या स्वतःच्या शब्दांत, व्हिडिओतले नाही:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nनोट्स नाहीत. Google नाही. Copy-paste नाही. फक्त तुमचेच शब्द.",
    },
    "rubric": """You are evaluating a submission for an AI literacy assignment called "Define It Yourself".
The learner was asked to pick any 5 of these 10 AI terms and explain each in one sentence in their own words:
AI, ML, Generative AI, LLM, Prompt, Token, Context Window, Model, Output, Hallucination.

Score out of 100:
- Accuracy (40 pts): Are the 5 definitions factually correct? The right general idea counts even with imperfect phrasing. Penalise clearly wrong or confused definitions.
- Own words (30 pts): Is the learner paraphrasing genuinely, not copying verbatim from a standard definition?
- Coverage (20 pts): Did they define exactly 5 terms?
- Clarity (10 pts): Are the explanations simple and understandable?

On fail (score < 75): identify the specific term(s) that are off and give a brief analogy-based hint. Do not ask for a full redo — just the one gap.""",
}

ASSIGN_PASS = 75  # of 100

# ── Localized UI strings ─────────────────────────────────────────────────────
CONTENT = {
    "en": {
        "picker_done": "Great! We'll learn in English. 🎉",
        "lesson_caption": "📚 Lesson {n}: The 10 AI Words Every Fresher Must Know\n\nWatch the video, then tap “Start quiz”.",
        "after_text": "Ready when you are 👇",
        "quiz_btn": "📝 Start quiz",
        "menu_btn": "🌐 Language",
        "answer_btn": "Answer",
        "quiz_progress": "📝 Quiz · Question {n}/5",
        "pick_option": "Tap your answer below 👇",
        "correct": "✅ Correct!",
        "wrong": "❌ Not quite — the right answer was: {a}",
        "score_pass": "🎯 Your score: {s}/5 — you passed! ✅\n\nNow the assignment 👇",
        "score_fail": "🎯 Your score: {s}/5. You need {p}/5 to pass — let's try again 💪",
        "retake_btn": "🔁 Retake quiz",
        "assignment_intro": "📌 Assignment\n\n{q}\n\n✍️ Type your answer here as a message.",
        "grading": "⏳ Checking your answer…",
        "assign_pass": "✅ Score: {s}/100 — assignment accepted! 🎉\n\n💬 {f}",
        "assign_fail": "📝 Score: {s}/100 — you need {p}/100 to pass.\n\n💬 {f}\n\n✍️ Read the feedback and send an improved answer.",
        "done": "🎉 You've completed Lesson 1! More lessons are on the way. Meanwhile, ask me anything about what you learned.",
        "no_more": "🎉 That's all for now — more lessons are coming soon! Ask me anything about what you learned.",
    },
    "hi": {
        "picker_done": "बढ़िया! अब हम हिंदी में सीखेंगे। 🎉",
        "lesson_caption": "📚 पाठ {n}: हर फ्रेशर को पता होने चाहिए ये 10 AI शब्द\n\nवीडियो देखें, फिर “क्विज़ शुरू करें” दबाएँ।",
        "after_text": "तैयार हों तो शुरू करें 👇",
        "quiz_btn": "📝 क्विज़ शुरू करें",
        "menu_btn": "🌐 भाषा",
        "answer_btn": "जवाब दें",
        "quiz_progress": "📝 क्विज़ · सवाल {n}/5",
        "pick_option": "नीचे अपना जवाब चुनें 👇",
        "correct": "✅ सही!",
        "wrong": "❌ गलत — सही जवाब था: {a}",
        "score_pass": "🎯 आपका स्कोर: {s}/5 — आप पास हो गए! ✅\n\nअब असाइनमेंट 👇",
        "score_fail": "🎯 आपका स्कोर: {s}/5. पास होने के लिए {p}/5 चाहिए — फिर से कोशिश करें 💪",
        "retake_btn": "🔁 फिर से क्विज़",
        "assignment_intro": "📌 असाइनमेंट\n\n{q}\n\n✍️ अपना जवाब यहाँ मैसेज के रूप में लिखें।",
        "grading": "⏳ आपका जवाब जाँचा जा रहा है…",
        "assign_pass": "✅ स्कोर: {s}/100 — असाइनमेंट स्वीकृत! 🎉\n\n💬 {f}",
        "assign_fail": "📝 स्कोर: {s}/100 — पास होने के लिए {p}/100 चाहिए।\n\n💬 {f}\n\n✍️ फीडबैक पढ़ें और बेहतर जवाब भेजें।",
        "done": "🎉 आपने पाठ 1 पूरा कर लिया! और पाठ जल्द आ रहे हैं। तब तक, आपने जो सीखा उसके बारे में मुझसे कुछ भी पूछें।",
        "no_more": "🎉 फ़िलहाल इतना ही — और पाठ जल्द आ रहे हैं! आपने जो सीखा उसके बारे में मुझसे कुछ भी पूछें।",
    },
    "mr": {
        "picker_done": "छान! आता आपण मराठीत शिकूया. 🎉",
        "lesson_caption": "📚 धडा {n}: प्रत्येक फ्रेशरला माहिती हवे असे 10 AI शब्द\n\nव्हिडिओ पाहा, मग “क्विझ सुरू करा” दाबा.",
        "after_text": "तयार असाल तर सुरू करा 👇",
        "quiz_btn": "📝 क्विझ सुरू करा",
        "menu_btn": "🌐 भाषा",
        "answer_btn": "उत्तर द्या",
        "quiz_progress": "📝 क्विझ · प्रश्न {n}/5",
        "pick_option": "खाली तुमचे उत्तर निवडा 👇",
        "correct": "✅ बरोबर!",
        "wrong": "❌ चूक — बरोबर उत्तर होते: {a}",
        "score_pass": "🎯 तुमचा स्कोर: {s}/5 — तुम्ही पास झालात! ✅\n\nआता असाइनमेंट 👇",
        "score_fail": "🎯 तुमचा स्कोर: {s}/5. पास होण्यासाठी {p}/5 हवे — पुन्हा प्रयत्न करा 💪",
        "retake_btn": "🔁 पुन्हा क्विझ",
        "assignment_intro": "📌 असाइनमेंट\n\n{q}\n\n✍️ तुमचे उत्तर इथे मेसेज म्हणून लिहा.",
        "grading": "⏳ तुमचे उत्तर तपासले जात आहे…",
        "assign_pass": "✅ स्कोर: {s}/100 — असाइनमेंट स्वीकारले! 🎉\n\n💬 {f}",
        "assign_fail": "📝 स्कोर: {s}/100 — पास होण्यासाठी {p}/100 हवे.\n\n💬 {f}\n\n✍️ अभिप्राय वाचा आणि सुधारित उत्तर पाठवा.",
        "done": "🎉 तुम्ही धडा 1 पूर्ण केला! आणखी धडे लवकरच येत आहेत. तोपर्यंत, तुम्ही जे शिकलात त्याबद्दल मला काहीही विचारा.",
        "no_more": "🎉 सध्या एवढेच — आणखी धडे लवकरच! तुम्ही जे शिकलात त्याबद्दल मला काहीही विचारा.",
    },
    "te": {
        "picker_done": "అద్భుతం! ఇక తెలుగులో నేర్చుకుందాం. 🎉",
        "lesson_caption": "📚 పాఠం {n}: ప్రతి ఫ్రెషర్ తెలుసుకోవలసిన 10 AI పదాలు\n\nవీడియో చూసి, తర్వాత “క్విజ్ మొదలుపెట్టు” నొక్కండి.",
        "after_text": "సిద్ధమైతే మొదలుపెడదాం 👇",
        "quiz_btn": "📝 క్విజ్ మొదలుపెట్టు",
        "menu_btn": "🌐 భాష",
        "answer_btn": "సమాధానం",
        "quiz_progress": "📝 క్విజ్ · ప్రశ్న {n}/5",
        "pick_option": "కింద మీ సమాధానం ఎంచుకోండి 👇",
        "correct": "✅ కరెక్ట్!",
        "wrong": "❌ కాదు — సరైన సమాధానం: {a}",
        "score_pass": "🎯 మీ స్కోర్: {s}/5 — మీరు పాస్ అయ్యారు! ✅\n\nఇప్పుడు అసైన్‌మెంట్ 👇",
        "score_fail": "🎯 మీ స్కోర్: {s}/5. పాస్ అవ్వడానికి {p}/5 కావాలి — మళ్ళీ ప్రయత్నించండి 💪",
        "retake_btn": "🔁 మళ్ళీ క్విజ్",
        "assignment_intro": "📌 అసైన్‌మెంట్\n\n{q}\n\n✍️ మీ సమాధానాన్ని ఇక్కడ మెసేజ్‌గా రాయండి.",
        "grading": "⏳ మీ సమాధానం చెక్ చేస్తున్నాం…",
        "assign_pass": "✅ స్కోర్: {s}/100 — అసైన్‌మెంట్ ఆమోదించబడింది! 🎉\n\n💬 {f}",
        "assign_fail": "📝 స్కోర్: {s}/100 — పాస్ అవ్వడానికి {p}/100 కావాలి.\n\n💬 {f}\n\n✍️ ఫీడ్‌బ్యాక్ చదివి మెరుగైన సమాధానం పంపండి.",
        "done": "🎉 మీరు పాఠం 1 పూర్తి చేశారు! మరిన్ని పాఠాలు త్వరలో వస్తున్నాయి. అప్పటివరకు, మీరు నేర్చుకున్నదాని గురించి నన్ను ఏదైనా అడగండి.",
        "no_more": "🎉 ప్రస్తుతానికి ఇంతే — మరిన్ని పాఠాలు త్వరలో! మీరు నేర్చుకున్నదాని గురించి నన్ను ఏదైనా అడగండి.",
    },
    "ta": {
        "picker_done": "அருமை! இனி தமிழில் கற்போம். 🎉",
        "lesson_caption": "📚 பாடம் {n}: ஒவ்வொரு ஃப்ரெஷரும் தெரிந்திருக்க வேண்டிய 10 AI சொற்கள்\n\nவீடியோவைப் பாருங்கள், பிறகு “வினாடி வினா தொடங்கு” அழுத்துங்கள்.",
        "after_text": "தயாராக இருந்தால் தொடங்குவோம் 👇",
        "quiz_btn": "📝 வினாடி வினா",
        "menu_btn": "🌐 மொழி",
        "answer_btn": "பதில்",
        "quiz_progress": "📝 வினாடி வினா · கேள்வி {n}/5",
        "pick_option": "கீழே உங்கள் பதிலைத் தேர்ந்தெடுங்கள் 👇",
        "correct": "✅ சரி!",
        "wrong": "❌ இல்லை — சரியான பதில்: {a}",
        "score_pass": "🎯 உங்கள் மதிப்பெண்: {s}/5 — தேர்ச்சி பெற்றீர்கள்! ✅\n\nஇப்போது பணி 👇",
        "score_fail": "🎯 உங்கள் மதிப்பெண்: {s}/5. தேர்ச்சி பெற {p}/5 தேவை — மீண்டும் முயற்சிக்கவும் 💪",
        "retake_btn": "🔁 மீண்டும் வினா",
        "assignment_intro": "📌 பணி\n\n{q}\n\n✍️ உங்கள் பதிலை இங்கே செய்தியாக எழுதுங்கள்.",
        "grading": "⏳ உங்கள் பதில் சரிபார்க்கப்படுகிறது…",
        "assign_pass": "✅ மதிப்பெண்: {s}/100 — பணி ஏற்றுக்கொள்ளப்பட்டது! 🎉\n\n💬 {f}",
        "assign_fail": "📝 மதிப்பெண்: {s}/100 — தேர்ச்சி பெற {p}/100 தேவை.\n\n💬 {f}\n\n✍️ கருத்தைப் படித்து மேம்படுத்திய பதில் அனுப்புங்கள்.",
        "done": "🎉 பாடம் 1 ஐ முடித்தீர்கள்! மேலும் பாடங்கள் விரைவில் வரும். அதுவரை, நீங்கள் கற்றது பற்றி என்னிடம் எதையும் கேளுங்கள்.",
        "no_more": "🎉 தற்போதைக்கு இத்துடன் — மேலும் பாடங்கள் விரைவில்! நீங்கள் கற்றது பற்றி என்னிடம் எதையும் கேளுங்கள்.",
    },
    "kn": {
        "picker_done": "ಅದ್ಭುತ! ಇನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕಲಿಯೋಣ. 🎉",
        "lesson_caption": "📚 ಪಾಠ {n}: ಪ್ರತಿ ಫ್ರೆಶರ್ ತಿಳಿದಿರಬೇಕಾದ 10 AI ಪದಗಳು\n\nವೀಡಿಯೊ ನೋಡಿ, ನಂತರ “ಕ್ವಿಜ್ ಆರಂಭಿಸಿ” ಒತ್ತಿ.",
        "after_text": "ಸಿದ್ಧವಾದಾಗ ಆರಂಭಿಸೋಣ 👇",
        "quiz_btn": "📝 ಕ್ವಿಜ್ ಆರಂಭಿಸಿ",
        "menu_btn": "🌐 ಭಾಷೆ",
        "answer_btn": "ಉತ್ತರ",
        "quiz_progress": "📝 ಕ್ವಿಜ್ · ಪ್ರಶ್ನೆ {n}/5",
        "pick_option": "ಕೆಳಗೆ ನಿಮ್ಮ ಉತ್ತರ ಆಯ್ಕೆ ಮಾಡಿ 👇",
        "correct": "✅ ಸರಿ!",
        "wrong": "❌ ಅಲ್ಲ — ಸರಿಯಾದ ಉತ್ತರ: {a}",
        "score_pass": "🎯 ನಿಮ್ಮ ಅಂಕ: {s}/5 — ನೀವು ಪಾಸ್ ಆಗಿದ್ದೀರಿ! ✅\n\nಈಗ ನಿಯೋಜನೆ 👇",
        "score_fail": "🎯 ನಿಮ್ಮ ಅಂಕ: {s}/5. ಪಾಸ್ ಆಗಲು {p}/5 ಬೇಕು — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ 💪",
        "retake_btn": "🔁 ಮತ್ತೆ ಕ್ವಿಜ್",
        "assignment_intro": "📌 ನಿಯೋಜನೆ\n\n{q}\n\n✍️ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಸಂದೇಶವಾಗಿ ಬರೆಯಿರಿ.",
        "grading": "⏳ ನಿಮ್ಮ ಉತ್ತರ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
        "assign_pass": "✅ ಅಂಕ: {s}/100 — ನಿಯೋಜನೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! 🎉\n\n💬 {f}",
        "assign_fail": "📝 ಅಂಕ: {s}/100 — ಪಾಸ್ ಆಗಲು {p}/100 ಬೇಕು.\n\n💬 {f}\n\n✍️ ಫೀಡ್‌ಬ್ಯಾಕ್ ಓದಿ ಸುಧಾರಿತ ಉತ್ತರ ಕಳುಹಿಸಿ.",
        "done": "🎉 ನೀವು ಪಾಠ 1 ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ! ಇನ್ನಷ್ಟು ಪಾಠಗಳು ಶೀಘ್ರದಲ್ಲೇ ಬರಲಿವೆ. ಅಲ್ಲಿಯವರೆಗೆ, ನೀವು ಕಲಿತದ್ದರ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
        "no_more": "🎉 ಸದ್ಯಕ್ಕೆ ಇಷ್ಟೇ — ಇನ್ನಷ್ಟು ಪಾಠಗಳು ಶೀಘ್ರದಲ್ಲೇ! ನೀವು ಕಲಿತದ್ದರ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
    },
}


def tr(lang: str, key: str) -> str:
    return CONTENT.get(lang, CONTENT["en"]).get(key, CONTENT["en"][key])
