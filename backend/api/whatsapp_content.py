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

QUIZ_PASS = 2   # of 3 — the pass mark is clamped to the number actually
                # asked, so a thin question bank can never be unpassable

# ── Assignment (text-only "Define It Yourself") ──────────────────────────────
# Assignment pass mark, out of 100. The rubric prompt below interpolates this,
# so the number the grader is told and the number the code compares against
# can never drift apart.
ASSIGN_PASS = 40

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

On fail (score < {ASSIGN_PASS}): identify the specific term(s) that are off and give a brief analogy-based hint. Do not ask for a full redo — just the one gap.""".replace("{ASSIGN_PASS}", str(ASSIGN_PASS)),
}



# ── Localized UI strings ─────────────────────────────────────────────────────
CONTENT = {
    "en": {
        "picker_done": "Great! We'll learn in English. 🎉",
        "lesson_caption": "📚 Lesson {n}: The 10 AI Words Every Fresher Must Know\n\nWatch the video, then tap “Start quiz”.",
        "after_text": "Ready when you are, {name} 👇",
        "quiz_btn": "📝 Start quiz",
        "menu_btn": "🌐 Language",
        "answer_btn": "Answer",
        "quiz_progress": "📝 Quiz · Question {n}/5",
        "pick_option": "Tap your answer below 👇",
        "correct": "✅ Correct!",
        "wrong": "❌ Not quite — the right answer was: {a}",
        "score_pass": "🎯 {name}, your score: {s}/{n} — you passed! ✅",
        "score_fail": "🎯 {name}, your score: {s}/{n}. You need {p}/{n} to pass — try again, or skip ahead 💪",
        "retake_btn": "🔁 Retake quiz",
        "assignment_intro": "📌 Assignment\n\n{q}\n\n✍️ Type or record your answer — you can send it in several messages. When you're done, tap *Submit answer* 👇",
        "submit_btn": "✅ Submit answer",
        "answer_added": "Got it ✍️ Add more if you want, then tap *Submit answer* when you're done. 👇",
        "submit_empty": "I don't have your answer yet 🙂 Type or record it first, then tap *Submit answer*.",
        "retry_prompt": "{name}, send an improved answer and tap *Submit answer*. 👇",
        "grading": "⏳ Checking your answer…",
        "rate_limited": "⏳ You're sending messages a bit fast — please slow down a little and I'll catch up. 🙂",
        "abusive_input": "🚫 Let's keep things respectful here — could you rephrase that?",
        "ai_busy": "⏳ We're at peak capacity right now — please try again in a few minutes. Your progress is saved.",
        "next_prompt": "🎉 Nice work, {name}! Here's your next lesson 👇",
        "next_choice": "✅ Lesson done, {name}! Next up: *{title}*.\n\nShall we start it — or do you have any doubts about the previous lesson?",
        "start_next_btn": "▶️ Next lesson",
        "doubt_btn": "❓ I have a doubt",
        "clarify_prompt": "Sure, {name} — ask me anything about the previous lesson. Tap *Next lesson* whenever you're ready. 👇",
        "clarify_more": "Any other doubts? Or tap *Next lesson* to continue. 👇",
        "practice_btn": "🔁 Practice quiz",
        "practice_result": "📊 {name}, you scored {s}/{n} in practice! 💪 Try another set or continue.",
        "done_choice": "🎉 That's all the lessons for now, {name}! Want to practice a quiz, or ask me a question?",
        "assign_pass": "✅ {name}, you scored {s}/100 — assignment accepted! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, you scored {s}/100 — you need {p}/100 to pass.\n\n💬 {f}\n\n✍️ Read the feedback and send an improved answer.",
        "done": "🎉 {name}, you've completed the course! Ask me anything about what you learned.",
        "no_more": "🎉 That's all for now — more lessons are coming soon! Ask me anything about what you learned.",
        "feedback_ask": "🙏 {name}, one favour before you go — we'd really like to hear from you.\n\n• What did you think of the course so far?\n• Do you think it will actually help you?\n• Would you keep going once more lessons are out?\n• What would you like to learn next?\n\n🎤 *You can send a voice note instead of typing* — whichever is easier for you. Just reply here, and your answer shapes what we build next.",
        "feedback_ask_mid": "🙏 {name}, you're four lessons in — how's it going so far?\n\n• What do you think of the course?\n• Do you think it will actually help you?\n• Will you keep going?\n• What would you like to see next?\n\n🎤 *You can send a voice note instead of typing* — whichever is easier.",
        "module_done": "🎉 *Module {n} complete, {name}!*\n\nYou've finished:\n{list}\n\n📚 Next up — *Module {nx}: {title}*",
        "feedback_thanks": "🙏 Thank you, {name}! That goes straight to the team making these lessons.",
        "cert_ready": "🎓 Incredible, {name} — you've completed the *entire AI Literacy course*! Here's your certificate 👇",
        "cert_caption": "Cosmoplex AI Literacy Certificate 🎓",
        "unsub_ok": "✅ Done — you're unsubscribed. No more reminders from us.\n\nYou can still message me anytime to keep learning, and type *restart* whenever you'd like to begin again. 👋",
    },
    "hi": {
        "picker_done": "बढ़िया! अब हम हिंदी में सीखेंगे। 🎉",
        "lesson_caption": "📚 पाठ {n}: हर फ्रेशर को पता होने चाहिए ये 10 AI शब्द\n\nवीडियो देखें, फिर “क्विज़ शुरू करें” दबाएँ।",
        "after_text": "{name}, तैयार हों तो शुरू करें 👇",
        "quiz_btn": "📝 क्विज़ शुरू करें",
        "menu_btn": "🌐 भाषा",
        "answer_btn": "जवाब दें",
        "quiz_progress": "📝 क्विज़ · सवाल {n}/5",
        "pick_option": "नीचे अपना जवाब चुनें 👇",
        "correct": "✅ सही!",
        "wrong": "❌ गलत — सही जवाब था: {a}",
        "score_pass": "🎯 {name}, आपका स्कोर: {s}/{n} — आप पास हो गए! ✅",
        "score_fail": "🎯 {name}, आपका स्कोर: {s}/{n}. पास होने के लिए {p}/{n} चाहिए — फिर कोशिश करें, या आगे बढ़ें 💪",
        "retake_btn": "🔁 फिर से क्विज़",
        "assignment_intro": "📌 असाइनमेंट\n\n{q}\n\n✍️ अपना जवाब लिखें या रिकॉर्ड करें — आप कई मैसेज में भेज सकते हैं। हो जाए तो *उत्तर भेजें* दबाएँ 👇",
        "submit_btn": "✅ उत्तर भेजें",
        "answer_added": "मिल गया ✍️ और जोड़ना हो तो जोड़ें, फिर *उत्तर भेजें* दबाएँ। 👇",
        "submit_empty": "अभी आपका जवाब नहीं मिला 🙂 पहले लिखें या रिकॉर्ड करें, फिर *उत्तर भेजें* दबाएँ।",
        "retry_prompt": "{name}, सुधारा हुआ जवाब भेजें और *उत्तर भेजें* दबाएँ। 👇",
        "grading": "⏳ आपका जवाब जाँचा जा रहा है…",
        "rate_limited": "⏳ आप थोड़ा तेज़ मैसेज भेज रहे हैं — कृपया थोड़ा धीमा करें, मैं जल्द ही जवाब दूँगा। 🙂",
        "abusive_input": "🚫 चलिए यहाँ सम्मानजनक भाषा रखें — क्या आप इसे दोबारा लिख सकते हैं?",
        "ai_busy": "⏳ अभी हम पर काफ़ी लोड है — कृपया कुछ मिनट बाद फिर कोशिश करें। आपकी प्रगति सुरक्षित है।",
        "next_prompt": "🎉 बढ़िया {name}! ये रहा आपका अगला पाठ 👇",
        "next_choice": "✅ पाठ पूरा, {name}! आगे: *{title}*.\n\nशुरू करें — या पिछले पाठ के बारे में कोई सवाल है?",
        "start_next_btn": "▶️ अगला पाठ",
        "doubt_btn": "❓ मुझे सवाल है",
        "clarify_prompt": "ज़रूर {name} — पिछले पाठ के बारे में कुछ भी पूछें। तैयार हों तो *अगला पाठ* दबाएँ। 👇",
        "clarify_more": "और कोई सवाल? या जारी रखने के लिए *अगला पाठ* दबाएँ। 👇",
        "practice_btn": "🔁 प्रैक्टिस क्विज़",
        "practice_result": "📊 {name}, प्रैक्टिस में आपने {s}/{n} स्कोर किया! 💪 और सेट आज़माएँ या आगे बढ़ें।",
        "done_choice": "🎉 {name}, फ़िलहाल इतने ही पाठ! प्रैक्टिस क्विज़ करना चाहेंगे, या मुझसे कुछ पूछना है?",
        "assign_pass": "✅ {name}, आपका स्कोर: {s}/100 — असाइनमेंट स्वीकृत! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, आपका स्कोर: {s}/100 — पास होने के लिए {p}/100 चाहिए।\n\n💬 {f}\n\n✍️ फीडबैक पढ़ें और बेहतर जवाब भेजें।",
        "done": "🎉 {name}, आपने कोर्स पूरा कर लिया! आपने जो सीखा उसके बारे में मुझसे कुछ भी पूछें।",
        "cert_ready": "🎓 शानदार, {name} — आपने *पूरा AI Literacy कोर्स* पूरा कर लिया! ये रहा आपका certificate 👇",
        "cert_caption": "Cosmoplex AI साक्षरता प्रमाणपत्र 🎓",
        "unsub_ok": "✅ हो गया — आप unsubscribe हो गए हैं। अब हमारी ओर से कोई reminder नहीं आएगा।\n\nसीखना जारी रखने के लिए आप कभी भी message कर सकते हैं, और दोबारा शुरू करने के लिए *restart* लिखें। 👋",
        "no_more": "🎉 फ़िलहाल इतना ही — और पाठ जल्द आ रहे हैं! आपने जो सीखा उसके बारे में मुझसे कुछ भी पूछें।",
        "feedback_ask": "🙏 {name}, जाने से पहले एक छोटी सी बात — हम आपकी राय ज़रूर सुनना चाहेंगे।\n\n• अब तक कोर्स आपको कैसा लगा?\n• क्या आपको लगता है यह वाकई आपके काम आएगा?\n• आगे और पाठ आने पर क्या आप जारी रखेंगे?\n• आगे आप क्या सीखना चाहेंगे?\n\n🎤 *टाइप करने की जगह आप voice note भी भेज सकते हैं* — जो आपको आसान लगे। यहीं जवाब दें — आपकी बात से तय होगा कि हम आगे क्या बनाएँ।",
        "feedback_ask_mid": "🙏 {name}, आपने चार पाठ पूरे कर लिए — अब तक कैसा लग रहा है?\n\n• कोर्स आपको कैसा लगा?\n• क्या आपको लगता है यह वाकई आपके काम आएगा?\n• क्या आप आगे जारी रखेंगे?\n• आगे आप क्या देखना चाहेंगे?\n\n🎤 *टाइप करने की जगह voice note भी भेज सकते हैं* — जो आसान लगे।",
        "module_done": "🎉 *मॉड्यूल {n} पूरा हुआ, {name}!*\n\nआपने पूरे किए:\n{list}\n\n📚 आगे — *मॉड्यूल {nx}: {title}*",
        "feedback_thanks": "🙏 धन्यवाद, {name}! आपकी बात सीधे इन पाठों को बनाने वाली टीम तक जाएगी।",
    },
    "mr": {
        "picker_done": "छान! आता आपण मराठीत शिकूया. 🎉",
        "lesson_caption": "📚 धडा {n}: प्रत्येक फ्रेशरला माहिती हवे असे 10 AI शब्द\n\nव्हिडिओ पाहा, मग “क्विझ सुरू करा” दाबा.",
        "after_text": "{name}, तयार असाल तर सुरू करा 👇",
        "quiz_btn": "📝 क्विझ सुरू करा",
        "menu_btn": "🌐 भाषा",
        "answer_btn": "उत्तर द्या",
        "quiz_progress": "📝 क्विझ · प्रश्न {n}/5",
        "pick_option": "खाली तुमचे उत्तर निवडा 👇",
        "correct": "✅ बरोबर!",
        "wrong": "❌ चूक — बरोबर उत्तर होते: {a}",
        "score_pass": "🎯 {name}, तुमचा स्कोर: {s}/{n} — तुम्ही पास झालात! ✅",
        "score_fail": "🎯 {name}, तुमचा स्कोर: {s}/{n}. पास होण्यासाठी {p}/{n} हवेत — पुन्हा प्रयत्न करा, किंवा पुढे जा 💪",
        "retake_btn": "🔁 पुन्हा क्विझ",
        "assignment_intro": "📌 असाइनमेंट\n\n{q}\n\n✍️ तुमचं उत्तर लिहा किंवा रेकॉर्ड करा — तुम्ही अनेक मेसेजमध्ये पाठवू शकता. झाल्यावर *उत्तर पाठवा* दाबा 👇",
        "submit_btn": "✅ उत्तर पाठवा",
        "answer_added": "मिळालं ✍️ आणखी जोडायचं असेल तर जोडा, मग *उत्तर पाठवा* दाबा. 👇",
        "submit_empty": "अजून तुमचं उत्तर मिळालं नाही 🙂 आधी लिहा किंवा रेकॉर्ड करा, मग *उत्तर पाठवा* दाबा.",
        "retry_prompt": "{name}, सुधारित उत्तर पाठवा आणि *उत्तर पाठवा* दाबा. 👇",
        "grading": "⏳ तुमचे उत्तर तपासले जात आहे…",
        "rate_limited": "⏳ तुम्ही जरा वेगाने मेसेज पाठवत आहात — जरा हळू करा, मी लवकरच उत्तर देतो. 🙂",
        "abusive_input": "🚫 चला इथे आदरपूर्वक भाषा वापरूया — तुम्ही हे पुन्हा लिहू शकाल का?",
        "ai_busy": "⏳ सध्या आमच्यावर जास्त लोड आहे — कृपया काही मिनिटांनी पुन्हा प्रयत्न करा. तुमची प्रगती सुरक्षित आहे.",
        "next_prompt": "🎉 छान {name}! हा तुमचा पुढचा धडा 👇",
        "next_choice": "✅ धडा पूर्ण, {name}! पुढे: *{title}*.\n\nसुरू करूया — की मागील धड्याबद्दल काही शंका आहे?",
        "start_next_btn": "▶️ पुढचा धडा",
        "doubt_btn": "❓ मला शंका आहे",
        "clarify_prompt": "नक्की {name} — मागील धड्याबद्दल काहीही विचारा. तयार असाल तेव्हा *पुढचा धडा* दाबा. 👇",
        "clarify_more": "आणखी काही शंका? किंवा पुढे जाण्यासाठी *पुढचा धडा* दाबा. 👇",
        "practice_btn": "🔁 सराव क्विझ",
        "practice_result": "📊 {name}, सरावात तुम्ही {s}/{n} मिळवले! 💪 आणखी सेट करून पाहा किंवा पुढे जा.",
        "done_choice": "🎉 {name}, सध्या एवढेच धडे! सराव क्विझ करायचा आहे, की मला काही विचारायचं आहे?",
        "assign_pass": "✅ {name}, तुमचा स्कोर: {s}/100 — असाइनमेंट स्वीकारले! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, तुमचा स्कोर: {s}/100 — पास होण्यासाठी {p}/100 हवे.\n\n💬 {f}\n\n✍️ अभिप्राय वाचा आणि सुधारित उत्तर पाठवा.",
        "done": "🎉 {name}, तुम्ही कोर्स पूर्ण केला! तुम्ही जे शिकलात त्याबद्दल मला काहीही विचारा.",
        "cert_ready": "🎓 अप्रतिम, {name} — तुम्ही *संपूर्ण AI Literacy कोर्स* पूर्ण केला! हे घ्या तुमचं certificate 👇",
        "cert_caption": "Cosmoplex AI साक्षरता प्रमाणपत्र 🎓",
        "unsub_ok": "✅ झालं — तुम्ही unsubscribe झाला आहात. आता आमच्याकडून कोणतेही reminder येणार नाहीत.\n\nशिकणं सुरू ठेवण्यासाठी तुम्ही कधीही message करू शकता, आणि पुन्हा सुरू करण्यासाठी *restart* लिहा. 👋",
        "no_more": "🎉 सध्या एवढेच — आणखी धडे लवकरच! तुम्ही जे शिकलात त्याबद्दल मला काहीही विचारा.",
        "feedback_ask": "🙏 {name}, जाण्यापूर्वी एक छोटीशी विनंती — आम्हाला तुमचं मत ऐकायला आवडेल.\n\n• आतापर्यंत कोर्स तुम्हाला कसा वाटला?\n• तुम्हाला वाटतं का की याचा खरंच फायदा होईल?\n• पुढे आणखी पाठ आल्यावर तुम्ही सुरू ठेवाल का?\n• पुढे तुम्हाला काय शिकायला आवडेल?\n\n🎤 *टाइप करण्याऐवजी तुम्ही voice note पण पाठवू शकता* — जे सोपं वाटेल ते. इथेच उत्तर द्या — तुमच्या मतावरून आम्ही पुढे काय बनवायचं ते ठरेल.",
        "feedback_ask_mid": "🙏 {name}, तुम्ही चार पाठ पूर्ण केले — आतापर्यंत कसं वाटतंय?\n\n• कोर्स तुम्हाला कसा वाटला?\n• याचा खरंच फायदा होईल असं वाटतं का?\n• तुम्ही पुढे सुरू ठेवाल का?\n• पुढे तुम्हाला काय बघायला आवडेल?\n\n🎤 *टाइप करण्याऐवजी voice note पण पाठवू शकता* — जे सोपं वाटेल ते.",
        "module_done": "🎉 *मॉड्यूल {n} पूर्ण झालं, {name}!*\n\nतुम्ही पूर्ण केले:\n{list}\n\n📚 पुढे — *मॉड्यूल {nx}: {title}*",
        "feedback_thanks": "🙏 धन्यवाद, {name}! तुमचं मत थेट हे पाठ बनवणाऱ्या टीमपर्यंत पोहोचेल.",
    },
    "te": {
        "picker_done": "అద్భుతం! ఇక తెలుగులో నేర్చుకుందాం. 🎉",
        "lesson_caption": "📚 పాఠం {n}: ప్రతి ఫ్రెషర్ తెలుసుకోవలసిన 10 AI పదాలు\n\nవీడియో చూసి, తర్వాత “క్విజ్ మొదలుపెట్టు” నొక్కండి.",
        "after_text": "{name}, సిద్ధమైతే మొదలుపెడదాం 👇",
        "quiz_btn": "📝 క్విజ్ మొదలుపెట్టు",
        "menu_btn": "🌐 భాష",
        "answer_btn": "సమాధానం",
        "quiz_progress": "📝 క్విజ్ · ప్రశ్న {n}/5",
        "pick_option": "కింద మీ సమాధానం ఎంచుకోండి 👇",
        "correct": "✅ కరెక్ట్!",
        "wrong": "❌ కాదు — సరైన సమాధానం: {a}",
        "score_pass": "🎯 {name}, మీ స్కోర్: {s}/{n} — మీరు పాస్ అయ్యారు! ✅",
        "score_fail": "🎯 {name}, మీ స్కోర్: {s}/{n}. పాస్ కావడానికి {p}/{n} కావాలి — మళ్లీ ప్రయత్నించండి, లేదా ముందుకు వెళ్లండి 💪",
        "retake_btn": "🔁 మళ్ళీ క్విజ్",
        "assignment_intro": "📌 అసైన్‌మెంట్\n\n{q}\n\n✍️ మీ సమాధానాన్ని టైప్ చేయండి లేదా రికార్డ్ చేయండి — అనేక మెసేజ్‌లలో పంపవచ్చు. అయ్యాక *సమాధానం పంపండి* నొక్కండి 👇",
        "submit_btn": "✅ సమాధానం పంపండి",
        "answer_added": "అందింది ✍️ ఇంకా జోడించాలంటే జోడించండి, తర్వాత *సమాధానం పంపండి* నొక్కండి. 👇",
        "submit_empty": "ఇంకా మీ సమాధానం రాలేదు 🙂 ముందు టైప్ చేయండి లేదా రికార్డ్ చేయండి, తర్వాత *సమాధానం పంపండి* నొక్కండి.",
        "retry_prompt": "{name}, మెరుగైన సమాధానం పంపి *సమాధానం పంపండి* నొక్కండి. 👇",
        "grading": "⏳ మీ సమాధానం చెక్ చేస్తున్నాం…",
        "rate_limited": "⏳ మీరు కొంచెం వేగంగా మెసేజ్‌లు పంపుతున్నారు — దయచేసి కొంచెం నెమ్మదించండి, నేను త్వరలో రిప్లై ఇస్తాను. 🙂",
        "abusive_input": "🚫 ఇక్కడ మర్యాదగా మాట్లాడదాం — దయచేసి దాన్ని మళ్ళీ రాయగలరా?",
        "ai_busy": "⏳ ప్రస్తుతం మాపై ఎక్కువ లోడ్ ఉంది — దయచేసి కొన్ని నిమిషాల తర్వాత మళ్ళీ ప్రయత్నించండి. మీ ప్రోగ్రెస్ సురక్షితం.",
        "next_prompt": "🎉 బాగుంది {name}! ఇదిగో మీ తదుపరి పాఠం 👇",
        "next_choice": "✅ పాఠం పూర్తి, {name}! తర్వాత: *{title}*.\n\nమొదలుపెడదామా — లేక మునుపటి పాఠం గురించి ఏవైనా సందేహాలున్నాయా?",
        "start_next_btn": "▶️ తదుపరి పాఠం",
        "doubt_btn": "❓ నాకు సందేహం ఉంది",
        "clarify_prompt": "తప్పకుండా {name} — మునుపటి పాఠం గురించి ఏదైనా అడగండి. సిద్ధమైనప్పుడు *తదుపరి పాఠం* నొక్కండి. 👇",
        "clarify_more": "ఇంకా సందేహాలున్నాయా? లేదా కొనసాగించడానికి *తదుపరి పాఠం* నొక్కండి. 👇",
        "practice_btn": "🔁 ప్రాక్టీస్ క్విజ్",
        "practice_result": "📊 {name}, ప్రాక్టీస్‌లో మీరు {s}/{n} సాధించారు! 💪 మరో సెట్ ప్రయత్నించండి లేదా కొనసాగండి.",
        "done_choice": "🎉 {name}, ప్రస్తుతానికి పాఠాలు ఇంతే! ప్రాక్టీస్ క్విజ్ చేద్దామా, లేక నన్ను ఏదైనా అడుగుతారా?",
        "assign_pass": "✅ {name}, మీ స్కోర్: {s}/100 — అసైన్‌మెంట్ ఆమోదించబడింది! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, మీ స్కోర్: {s}/100 — పాస్ అవ్వడానికి {p}/100 కావాలి.\n\n💬 {f}\n\n✍️ ఫీడ్‌బ్యాక్ చదివి మెరుగైన సమాధానం పంపండి.",
        "done": "🎉 {name}, మీరు కోర్సు పూర్తి చేశారు! మీరు నేర్చుకున్నదాని గురించి నన్ను ఏదైనా అడగండి.",
        "cert_ready": "🎓 అద్భుతం, {name} — మీరు *పూర్తి AI Literacy కోర్సు* పూర్తి చేశారు! ఇదిగో మీ certificate 👇",
        "cert_caption": "Cosmoplex AI అక్షరాస్యత సర్టిఫికెట్ 🎓",
        "unsub_ok": "✅ అయిపోయింది — మీరు unsubscribe అయ్యారు. ఇక మా నుంచి reminders రావు.\n\nనేర్చుకోవడం కొనసాగించడానికి మీరు ఎప్పుడైనా message చేయవచ్చు, మళ్లీ మొదలుపెట్టడానికి *restart* అని టైప్ చేయండి. 👋",
        "no_more": "🎉 ప్రస్తుతానికి ఇంతే — మరిన్ని పాఠాలు త్వరలో! మీరు నేర్చుకున్నదాని గురించి నన్ను ఏదైనా అడగండి.",
        "feedback_ask": "🙏 {name}, వెళ్ళే ముందు ఒక చిన్న అభ్యర్థన — మీ అభిప్రాయం వినాలని ఉంది.\n\n• ఇప్పటివరకు కోర్సు మీకు ఎలా అనిపించింది?\n• ఇది నిజంగా మీకు ఉపయోగపడుతుందని అనుకుంటున్నారా?\n• మరిన్ని పాఠాలు వచ్చాక కొనసాగిస్తారా?\n• తర్వాత మీరు ఏమి నేర్చుకోవాలనుకుంటున్నారు?\n\n🎤 *టైప్ చేయడానికి బదులు voice note కూడా పంపవచ్చు* — మీకు ఏది సులభమో అది. ఇక్కడే సమాధానం ఇవ్వండి — మేము తర్వాత ఏమి తయారు చేయాలో మీ మాటే నిర్ణయిస్తుంది.",
        "feedback_ask_mid": "🙏 {name}, మీరు నాలుగు పాఠాలు పూర్తి చేశారు — ఇప్పటివరకు ఎలా ఉంది?\n\n• కోర్సు మీకు ఎలా అనిపించింది?\n• ఇది నిజంగా మీకు ఉపయోగపడుతుందా?\n• మీరు కొనసాగిస్తారా?\n• తర్వాత ఏమి చూడాలనుకుంటున్నారు?\n\n🎤 *టైప్ చేయడానికి బదులు voice note పంపవచ్చు* — ఏది సులభమో అది.",
        "module_done": "🎉 *మాడ్యూల్ {n} పూర్తయింది, {name}!*\n\nమీరు పూర్తి చేసినవి:\n{list}\n\n📚 తర్వాత — *మాడ్యూల్ {nx}: {title}*",
        "feedback_thanks": "🙏 ధన్యవాదాలు, {name}! మీ మాట నేరుగా ఈ పాఠాలు తయారుచేసే బృందానికి చేరుతుంది.",
    },
    "ta": {
        "picker_done": "அருமை! இனி தமிழில் கற்போம். 🎉",
        "lesson_caption": "📚 பாடம் {n}: ஒவ்வொரு ஃப்ரெஷரும் தெரிந்திருக்க வேண்டிய 10 AI சொற்கள்\n\nவீடியோவைப் பாருங்கள், பிறகு “வினாடி வினா தொடங்கு” அழுத்துங்கள்.",
        "after_text": "{name}, தயாராக இருந்தால் தொடங்குவோம் 👇",
        "quiz_btn": "📝 வினாடி வினா",
        "menu_btn": "🌐 மொழி",
        "answer_btn": "பதில்",
        "quiz_progress": "📝 வினாடி வினா · கேள்வி {n}/5",
        "pick_option": "கீழே உங்கள் பதிலைத் தேர்ந்தெடுங்கள் 👇",
        "correct": "✅ சரி!",
        "wrong": "❌ இல்லை — சரியான பதில்: {a}",
        "score_pass": "🎯 {name}, உங்கள் மதிப்பெண்: {s}/{n} — தேர்ச்சி பெற்றீர்கள்! ✅",
        "score_fail": "🎯 {name}, உங்கள் மதிப்பெண்: {s}/{n}. தேர்ச்சிக்கு {p}/{n} தேவை — மீண்டும் முயலுங்கள், அல்லது தொடருங்கள் 💪",
        "retake_btn": "🔁 மீண்டும் வினா",
        "assignment_intro": "📌 பணி\n\n{q}\n\n✍️ உங்கள் பதிலை எழுதுங்கள் அல்லது பதிவு செய்யுங்கள் — பல செய்திகளாக அனுப்பலாம். முடிந்ததும் *பதிலை அனுப்பு* அழுத்துங்கள் 👇",
        "submit_btn": "✅ பதிலை அனுப்பு",
        "answer_added": "கிடைத்தது ✍️ இன்னும் சேர்க்க வேண்டுமெனில் சேருங்கள், பிறகு *பதிலை அனுப்பு* அழுத்துங்கள். 👇",
        "submit_empty": "இன்னும் உங்கள் பதில் கிடைக்கவில்லை 🙂 முதலில் எழுதுங்கள் அல்லது பதிவு செய்யுங்கள், பிறகு *பதிலை அனுப்பு* அழுத்துங்கள்.",
        "retry_prompt": "{name}, மேம்பட்ட பதிலை அனுப்பி *பதிலை அனுப்பு* அழுத்துங்கள். 👇",
        "grading": "⏳ உங்கள் பதில் சரிபார்க்கப்படுகிறது…",
        "rate_limited": "⏳ நீங்கள் கொஞ்சம் வேகமாக மெசேஜ் அனுப்புகிறீர்கள் — கொஞ்சம் மெதுவாக்குங்கள், நான் விரைவில் பதிலளிக்கிறேன். 🙂",
        "abusive_input": "🚫 இங்கே மரியாதையாக பேசுவோம் — அதை மீண்டும் எழுத முடியுமா?",
        "ai_busy": "⏳ இப்போது எங்களிடம் அதிக லோட் உள்ளது — சில நிமிடங்களில் மீண்டும் முயற்சிக்கவும். உங்கள் முன்னேற்றம் பாதுகாப்பாக உள்ளது.",
        "next_prompt": "🎉 அருமை {name}! இதோ உங்கள் அடுத்த பாடம் 👇",
        "next_choice": "✅ பாடம் முடிந்தது, {name}! அடுத்து: *{title}*.\n\nதொடங்கலாமா — அல்லது முந்தைய பாடம் குறித்து ஏதேனும் சந்தேகம் உள்ளதா?",
        "start_next_btn": "▶️ அடுத்த பாடம்",
        "doubt_btn": "❓ எனக்கு சந்தேகம்",
        "clarify_prompt": "கண்டிப்பாக {name} — முந்தைய பாடம் குறித்து எதையும் கேளுங்கள். தயாராகும்போது *அடுத்த பாடம்* அழுத்துங்கள். 👇",
        "clarify_more": "வேறு சந்தேகம் உள்ளதா? அல்லது தொடர *அடுத்த பாடம்* அழுத்துங்கள். 👇",
        "practice_btn": "🔁 பயிற்சி வினா",
        "practice_result": "📊 {name}, பயிற்சியில் {s}/{n} பெற்றீர்கள்! 💪 வேறு தொகுப்பை முயற்சி செய்யுங்கள் அல்லது தொடருங்கள்.",
        "done_choice": "🎉 {name}, தற்போதைக்கு பாடங்கள் இத்துடன்! பயிற்சி வினா செய்யலாமா, அல்லது ஏதேனும் கேட்கலாமா?",
        "assign_pass": "✅ {name}, உங்கள் மதிப்பெண்: {s}/100 — பணி ஏற்றுக்கொள்ளப்பட்டது! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, உங்கள் மதிப்பெண்: {s}/100 — தேர்ச்சி பெற {p}/100 தேவை.\n\n💬 {f}\n\n✍️ கருத்தைப் படித்து மேம்படுத்திய பதில் அனுப்புங்கள்.",
        "done": "🎉 {name}, நீங்கள் பாடநெறியை முடித்தீர்கள்! நீங்கள் கற்றது பற்றி என்னிடம் எதையும் கேளுங்கள்.",
        "cert_ready": "🎓 அருமை, {name} — நீங்கள் *முழு AI Literacy பாடநெறியையும்* முடித்துவிட்டீர்கள்! இதோ உங்கள் certificate 👇",
        "cert_caption": "Cosmoplex AI எழுத்தறிவு சான்றிதழ் 🎓",
        "unsub_ok": "✅ முடிந்தது — நீங்கள் unsubscribe செய்துவிட்டீர்கள். இனி எங்களிடமிருந்து reminders வராது.\n\nகற்றலைத் தொடர எப்போது வேண்டுமானாலும் message செய்யலாம், மீண்டும் தொடங்க *restart* என்று டைப் செய்யுங்கள். 👋",
        "no_more": "🎉 தற்போதைக்கு இத்துடன் — மேலும் பாடங்கள் விரைவில்! நீங்கள் கற்றது பற்றி என்னிடம் எதையும் கேளுங்கள்.",
        "feedback_ask": "🙏 {name}, செல்வதற்கு முன் ஒரு சிறிய கோரிக்கை — உங்கள் கருத்தை கேட்க விரும்புகிறோம்.\n\n• இதுவரை பாடநெறி உங்களுக்கு எப்படி இருந்தது?\n• இது உண்மையிலேயே உங்களுக்கு உதவும் என நினைக்கிறீர்களா?\n• மேலும் பாடங்கள் வந்ததும் தொடர்வீர்களா?\n• அடுத்து நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?\n\n🎤 *தட்டச்சு செய்வதற்குப் பதிலாக voice note-உம் அனுப்பலாம்* — உங்களுக்கு எது எளிதோ அது. இங்கேயே பதிலளியுங்கள் — நாங்கள் அடுத்து என்ன உருவாக்குவது என்பதை உங்கள் பதிலே தீர்மானிக்கும்.",
        "feedback_ask_mid": "🙏 {name}, நீங்கள் நான்கு பாடங்கள் முடித்துவிட்டீர்கள் — இதுவரை எப்படி இருக்கிறது?\n\n• பாடநெறி உங்களுக்கு எப்படி இருந்தது?\n• இது உண்மையில் உங்களுக்கு உதவுமா?\n• நீங்கள் தொடர்வீர்களா?\n• அடுத்து என்ன பார்க்க விரும்புகிறீர்கள்?\n\n🎤 *தட்டச்சுக்கு பதிலாக voice note அனுப்பலாம்* — எது எளிதோ அது.",
        "module_done": "🎉 *தொகுதி {n} முடிந்தது, {name}!*\n\nநீங்கள் முடித்தவை:\n{list}\n\n📚 அடுத்து — *தொகுதி {nx}: {title}*",
        "feedback_thanks": "🙏 நன்றி, {name}! உங்கள் கருத்து இந்தப் பாடங்களை உருவாக்கும் குழுவை நேரடியாகச் சென்றடையும்.",
    },
    "kn": {
        "picker_done": "ಅದ್ಭುತ! ಇನ್ನು ಕನ್ನಡದಲ್ಲಿ ಕಲಿಯೋಣ. 🎉",
        "lesson_caption": "📚 ಪಾಠ {n}: ಪ್ರತಿ ಫ್ರೆಶರ್ ತಿಳಿದಿರಬೇಕಾದ 10 AI ಪದಗಳು\n\nವೀಡಿಯೊ ನೋಡಿ, ನಂತರ “ಕ್ವಿಜ್ ಆರಂಭಿಸಿ” ಒತ್ತಿ.",
        "after_text": "{name}, ಸಿದ್ಧವಾದಾಗ ಆರಂಭಿಸೋಣ 👇",
        "quiz_btn": "📝 ಕ್ವಿಜ್ ಆರಂಭಿಸಿ",
        "menu_btn": "🌐 ಭಾಷೆ",
        "answer_btn": "ಉತ್ತರ",
        "quiz_progress": "📝 ಕ್ವಿಜ್ · ಪ್ರಶ್ನೆ {n}/5",
        "pick_option": "ಕೆಳಗೆ ನಿಮ್ಮ ಉತ್ತರ ಆಯ್ಕೆ ಮಾಡಿ 👇",
        "correct": "✅ ಸರಿ!",
        "wrong": "❌ ಅಲ್ಲ — ಸರಿಯಾದ ಉತ್ತರ: {a}",
        "score_pass": "🎯 {name}, ನಿಮ್ಮ ಅಂಕ: {s}/{n} — ನೀವು ಪಾಸ್ ಆಗಿದ್ದೀರಿ! ✅",
        "score_fail": "🎯 {name}, ನಿಮ್ಮ ಅಂಕ: {s}/{n}. ಪಾಸ್ ಆಗಲು {p}/{n} ಬೇಕು — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ, ಅಥವಾ ಮುಂದೆ ಸಾಗಿ 💪",
        "retake_btn": "🔁 ಮತ್ತೆ ಕ್ವಿಜ್",
        "assignment_intro": "📌 ನಿಯೋಜನೆ\n\n{q}\n\n✍️ ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ರೆಕಾರ್ಡ್ ಮಾಡಿ — ಹಲವು ಸಂದೇಶಗಳಲ್ಲಿ ಕಳುಹಿಸಬಹುದು. ಮುಗಿದ ಮೇಲೆ *ಉತ್ತರ ಕಳುಹಿಸಿ* ಒತ್ತಿ 👇",
        "submit_btn": "✅ ಉತ್ತರ ಕಳುಹಿಸಿ",
        "answer_added": "ಸಿಕ್ಕಿತು ✍️ ಇನ್ನಷ್ಟು ಸೇರಿಸಬೇಕಾದರೆ ಸೇರಿಸಿ, ನಂತರ *ಉತ್ತರ ಕಳುಹಿಸಿ* ಒತ್ತಿ. 👇",
        "submit_empty": "ಇನ್ನೂ ನಿಮ್ಮ ಉತ್ತರ ಸಿಕ್ಕಿಲ್ಲ 🙂 ಮೊದಲು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ರೆಕಾರ್ಡ್ ಮಾಡಿ, ನಂತರ *ಉತ್ತರ ಕಳುಹಿಸಿ* ಒತ್ತಿ.",
        "retry_prompt": "{name}, ಸುಧಾರಿತ ಉತ್ತರ ಕಳುಹಿಸಿ ಮತ್ತು *ಉತ್ತರ ಕಳುಹಿಸಿ* ಒತ್ತಿ. 👇",
        "grading": "⏳ ನಿಮ್ಮ ಉತ್ತರ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",
        "rate_limited": "⏳ ನೀವು ಸ್ವಲ್ಪ ವೇಗವಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸುತ್ತಿದ್ದೀರಿ — ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ನಿಧಾನಿಸಿ, ನಾನು ಶೀಘ್ರದಲ್ಲೇ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತೇನೆ. 🙂",
        "abusive_input": "🚫 ಇಲ್ಲಿ ಗೌರವಯುತವಾಗಿ ಮಾತನಾಡೋಣ — ದಯವಿಟ್ಟು ಅದನ್ನು ಮತ್ತೆ ಬರೆಯುತ್ತೀರಾ?",
        "ai_busy": "⏳ ಸದ್ಯ ನಮ್ಮ ಮೇಲೆ ಹೆಚ್ಚು ಲೋಡ್ ಇದೆ — ದಯವಿಟ್ಟು ಕೆಲವು ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. ನಿಮ್ಮ ಪ್ರಗತಿ ಸುರಕ್ಷಿತವಾಗಿದೆ.",
        "next_prompt": "🎉 ಚೆನ್ನಾಗಿದೆ {name}! ಇಗೋ ನಿಮ್ಮ ಮುಂದಿನ ಪಾಠ 👇",
        "next_choice": "✅ ಪಾಠ ಮುಗಿಯಿತು, {name}! ಮುಂದೆ: *{title}*.\n\nಆರಂಭಿಸೋಣವೇ — ಅಥವಾ ಹಿಂದಿನ ಪಾಠದ ಬಗ್ಗೆ ಏನಾದರೂ ಸಂದೇಹಗಳಿವೆಯೇ?",
        "start_next_btn": "▶️ ಮುಂದಿನ ಪಾಠ",
        "doubt_btn": "❓ ನನಗೆ ಸಂದೇಹವಿದೆ",
        "clarify_prompt": "ಖಂಡಿತ {name} — ಹಿಂದಿನ ಪಾಠದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ. ಸಿದ್ಧವಾದಾಗ *ಮುಂದಿನ ಪಾಠ* ಒತ್ತಿ. 👇",
        "clarify_more": "ಇನ್ನೇನಾದರೂ ಸಂದೇಹ? ಅಥವಾ ಮುಂದುವರಿಯಲು *ಮುಂದಿನ ಪಾಠ* ಒತ್ತಿ. 👇",
        "practice_btn": "🔁 ಅಭ್ಯಾಸ ಕ್ವಿಜ್",
        "practice_result": "📊 {name}, ಅಭ್ಯಾಸದಲ್ಲಿ {s}/{n} ಗಳಿಸಿದಿರಿ! 💪 ಇನ್ನೊಂದು ಸೆಟ್ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಮುಂದುವರಿಯಿರಿ.",
        "done_choice": "🎉 {name}, ಸದ್ಯಕ್ಕೆ ಪಾಠಗಳು ಇಷ್ಟೇ! ಅಭ್ಯಾಸ ಕ್ವಿಜ್ ಮಾಡೋಣವೇ, ಅಥವಾ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳುತ್ತೀರಾ?",
        "assign_pass": "✅ {name}, ನಿಮ್ಮ ಅಂಕ: {s}/100 — ನಿಯೋಜನೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! 🎉\n\n💬 {f}",
        "assign_fail": "📝 {name}, ನಿಮ್ಮ ಅಂಕ: {s}/100 — ಪಾಸ್ ಆಗಲು {p}/100 ಬೇಕು.\n\n💬 {f}\n\n✍️ ಫೀಡ್‌ಬ್ಯಾಕ್ ಓದಿ ಸುಧಾರಿತ ಉತ್ತರ ಕಳುಹಿಸಿ.",
        "done": "🎉 {name}, ನೀವು ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ! ನೀವು ಕಲಿತದ್ದರ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
        "cert_ready": "🎓 ಅದ್ಭುತ, {name} — ನೀವು *ಸಂಪೂರ್ಣ AI Literacy ಕೋರ್ಸ್* ಮುಗಿಸಿದ್ದೀರಿ! ಇದೋ ನಿಮ್ಮ certificate 👇",
        "cert_caption": "Cosmoplex AI ಸಾಕ್ಷರತೆ ಪ್ರಮಾಣಪತ್ರ 🎓",
        "unsub_ok": "✅ ಆಯಿತು — ನೀವು unsubscribe ಆಗಿದ್ದೀರಿ. ಇನ್ನು ನಮ್ಮಿಂದ ಯಾವುದೇ reminders ಬರುವುದಿಲ್ಲ.\n\nಕಲಿಕೆ ಮುಂದುವರಿಸಲು ನೀವು ಯಾವಾಗ ಬೇಕಾದರೂ message ಮಾಡಬಹುದು, ಮತ್ತೆ ಶುರುಮಾಡಲು *restart* ಎಂದು ಟೈಪ್ ಮಾಡಿ. 👋",
        "no_more": "🎉 ಸದ್ಯಕ್ಕೆ ಇಷ್ಟೇ — ಇನ್ನಷ್ಟು ಪಾಠಗಳು ಶೀಘ್ರದಲ್ಲೇ! ನೀವು ಕಲಿತದ್ದರ ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
        "feedback_ask": "🙏 {name}, ಹೋಗುವ ಮೊದಲು ಒಂದು ಸಣ್ಣ ಕೋರಿಕೆ — ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಕೇಳಲು ಇಷ್ಟಪಡುತ್ತೇವೆ.\n\n• ಇಲ್ಲಿಯವರೆಗೆ ಕೋರ್ಸ್ ನಿಮಗೆ ಹೇಗನಿಸಿತು?\n• ಇದು ನಿಜವಾಗಿಯೂ ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ ಎಂದು ಅನಿಸುತ್ತದೆಯೇ?\n• ಇನ್ನಷ್ಟು ಪಾಠಗಳು ಬಂದ ಮೇಲೆ ಮುಂದುವರಿಸುತ್ತೀರಾ?\n• ಮುಂದೆ ನೀವು ಏನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?\n\n🎤 *ಟೈಪ್ ಮಾಡುವ ಬದಲು voice note ಸಹ ಕಳುಹಿಸಬಹುದು* — ನಿಮಗೆ ಯಾವುದು ಸುಲಭವೋ ಅದು. ಇಲ್ಲಿಯೇ ಉತ್ತರಿಸಿ — ನಾವು ಮುಂದೆ ಏನು ಮಾಡಬೇಕೆಂದು ನಿಮ್ಮ ಮಾತೇ ನಿರ್ಧರಿಸುತ್ತದೆ.",
        "feedback_ask_mid": "🙏 {name}, ನೀವು ನಾಲ್ಕು ಪಾಠಗಳನ್ನು ಮುಗಿಸಿದ್ದೀರಿ — ಇಲ್ಲಿಯವರೆಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?\n\n• ಕೋರ್ಸ್ ನಿಮಗೆ ಹೇಗನಿಸಿತು?\n• ಇದು ನಿಜವಾಗಿಯೂ ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆಯೇ?\n• ನೀವು ಮುಂದುವರಿಸುತ್ತೀರಾ?\n• ಮುಂದೆ ಏನು ನೋಡಲು ಬಯಸುತ್ತೀರಿ?\n\n🎤 *ಟೈಪ್ ಮಾಡುವ ಬದಲು voice note ಕಳುಹಿಸಬಹುದು* — ಯಾವುದು ಸುಲಭವೋ ಅದು.",
        "module_done": "🎉 *ಮಾಡ್ಯೂಲ್ {n} ಪೂರ್ಣಗೊಂಡಿದೆ, {name}!*\n\nನೀವು ಪೂರ್ಣಗೊಳಿಸಿದವು:\n{list}\n\n📚 ಮುಂದೆ — *ಮಾಡ್ಯೂಲ್ {nx}: {title}*",
        "feedback_thanks": "🙏 ಧನ್ಯವಾದಗಳು, {name}! ನಿಮ್ಮ ಮಾತು ನೇರವಾಗಿ ಈ ಪಾಠಗಳನ್ನು ಮಾಡುವ ತಂಡಕ್ಕೆ ತಲುಪುತ್ತದೆ.",
    },
}


def tr(lang: str, key: str) -> str:
    return CONTENT.get(lang, CONTENT["en"]).get(key, CONTENT["en"][key])


# ═══════════════════════════════════════════════════════════════════════════
# Pre-sale onboarding funnel
# ═══════════════════════════════════════════════════════════════════════════

# Cloudinary public ID of the intro video. Leave "" to skip the video step.
INTRO_VIDEO_ID = "WhatsApp_Video_2026-07-15_at_10.06.39_AM_a1f6vf"

# Per-language intro videos. A learner gets their language's version if listed
# here, otherwise the default INTRO_VIDEO_ID above.
INTRO_VIDEO_OVERRIDES = {
    "mr": "",   # Marathi intro — fill with the Cloudinary public ID
}


def intro_video_for(lang: str) -> str:
    return INTRO_VIDEO_OVERRIDES.get(lang) or INTRO_VIDEO_ID

# Human-readable English name per language code (for the AI pitch prompt).
# The script each language must be WRITTEN IN. Naming the language alone is not
# enough: asked for "Hindi", the model happily replies in romanised Hinglish
# ("Cosmoplex mein aap seekhenge..."), which does not match any of our own copy
# and is harder to read for the learners who chose an Indian language.
LANG_SCRIPT = {
    "en": "Latin", "hi": "Devanagari", "mr": "Devanagari",
    "te": "Telugu", "ta": "Tamil", "kn": "Kannada",
}

LANG_NAME = {"en": "English", "hi": "Hindi", "mr": "Marathi",
             "te": "Telugu", "ta": "Tamil", "kn": "Kannada"}

# Short course facts fed to the AI when it writes the personalized pitch.
COURSE_FACTS = (
    "Cosmoplex AI School is an AI-literacy course for Indian freshers, taught in "
    "6 Indian languages. It covers: what AI/ML/Generative AI really are, the 10 AI "
    "words everyone should know, how to write good prompts, using tools like ChatGPT "
    "and Gemini, spotting AI mistakes (hallucinations), and hands-on real-world "
    "assignments. Each lesson has a short video, a quiz, and an assignment graded by "
    "AI, ending in a shareable certificate. It is practical, mobile-first, and "
    "designed to make you employable and confident with AI."
)

ONBOARD = {
    "en": {
        "brief": "🙏 Welcome, {name}! *Cosmoplex AI School* is India's AI-literacy course built for freshers, taught in your own language.\n\nIn just a few short lessons you'll learn how AI *actually* works, and how to use it to stand out in your studies and career. Let me show you around 👇",
        "name_q": "Great choice! 😊 Before we start — what should I call you?\n\nJust type your first name.",
        "intro_caption": "🎬 A quick intro to Cosmoplex",
        "profile_q": "First, tell me a little about you.\n\nWhat best describes you right now?",
        "profile_opts": [
            ("prof_student", "🎓 Student"),
            ("prof_graduate", "🆕 Recent graduate"),
            ("prof_working", "💼 Working professional"),
            ("prof_jobseeker", "🔍 Looking for a job"),
        ],
        "goal_q": "And what's your *main goal* with AI?\n\nPick one below, or just type your own 👇",
        "goal_opts": [
            ("goal_job", "🎯 Land an AI/tech job"),
            ("goal_grow", "📈 Grow in my job"),
            ("goal_build", "🛠️ Build my own project"),
            ("goal_explore", "🧭 Just exploring"),
        ],
        "select_btn": "Choose",
        "saved": "Perfect, {name} — noted! 🙌 You're all set.",
        "free_offer": "🎁 {name}, a *limited-time* offer, only for you — sign up right now and get our *₹699 course absolutely FREE*. Grab it before it's gone. 👇",
        "start_prompt": "Ready to try your first lesson, {name} — completely free? 👇",
        "start_btn": "🚀 Start Lesson 1",
        "signup_prompt": "{name}, ready to lock in your *FREE* spot? Tap below to sign up. 👇",
        "signup_btn": "✍️ Sign up",
        "ready_prompt": "🎉 You're signed up, {name}! Ready to start the course?",
        "ready_btn": "🚀 Start course",
        "pitch_wait": "Give me a second… ⏳",
    },
    "hi": {
        "brief": "🙏 {name}, *Cosmoplex AI School* में आपका स्वागत है — फ्रेशर्स के लिए बना भारत का AI-लिटरेसी कोर्स, आपकी अपनी भाषा में।\n\nकुछ ही छोटे पाठों में आप सीखेंगे कि AI *असल में* कैसे काम करता है, और इसका उपयोग करके अपनी पढ़ाई और करियर में कैसे आगे बढ़ें। आइए शुरू करें 👇",
        "name_q": "बढ़िया! 😊 शुरू करने से पहले — मैं आपको किस नाम से बुलाऊँ?\n\nअपना पहला नाम लिखें।",
        "intro_caption": "🎬 Cosmoplex का छोटा परिचय",
        "profile_q": "सबसे पहले, अपने बारे में थोड़ा बताएं।\n\nआप अभी क्या करते हैं?",
        "profile_opts": [
            ("prof_student", "🎓 छात्र"),
            ("prof_graduate", "🆕 हाल का ग्रेजुएट"),
            ("prof_working", "💼 नौकरी कर रहे हैं"),
            ("prof_jobseeker", "🔍 नौकरी ढूंढ रहे हैं"),
        ],
        "goal_q": "और AI को लेकर आपका *मुख्य लक्ष्य* क्या है?\n\nनीचे से चुनें, या अपना लिखें 👇",
        "goal_opts": [
            ("goal_job", "🎯 AI/टेक नौकरी पाना"),
            ("goal_grow", "📈 नौकरी में आगे बढ़ना"),
            ("goal_build", "🛠️ अपना प्रोजेक्ट बनाना"),
            ("goal_explore", "🧭 बस सीख रहा हूँ"),
        ],
        "select_btn": "चुनें",
        "saved": "बढ़िया {name} — नोट कर लिया! 🙌 आप तैयार हैं।",
        "free_offer": "🎁 {name}, *सीमित समय* का ऑफ़र, सिर्फ़ आपके लिए — अभी साइन अप करें और पाएँ *₹699 का कोर्स बिल्कुल मुफ़्त*। खत्म होने से पहले ले लें। 👇",
        "start_prompt": "{name}, अपना पहला पाठ आज़माने के लिए तैयार हैं — बिल्कुल मुफ़्त? 👇",
        "start_btn": "🚀 पाठ 1 शुरू करें",
        "signup_prompt": "{name}, अपनी *मुफ़्त* सीट पक्की करने के लिए तैयार? नीचे साइन अप दबाएँ। 👇",
        "signup_btn": "✍️ साइन अप",
        "ready_prompt": "🎉 {name}, आपका साइन-अप हो गया! कोर्स शुरू करने के लिए तैयार हैं?",
        "ready_btn": "🚀 शुरू करें",
        "pitch_wait": "एक सेकंड… ⏳",
    },
    "mr": {
        "brief": "🙏 {name}, *Cosmoplex AI School* मध्ये स्वागत आहे — फ्रेशर्ससाठी बनवलेला भारताचा AI-साक्षरता कोर्स, तुमच्याच भाषेत.\n\nकाही छोट्या धड्यांतच तुम्ही शिकाल की AI *खरंच* कसं काम करतं, आणि त्याचा वापर करून अभ्यास व करिअरमध्ये कसं पुढे जायचं. चला सुरू करूया 👇",
        "name_q": "छान! 😊 सुरू करण्यापूर्वी — मी तुम्हाला काय म्हणून हाक मारू?\n\nतुमचं पहिलं नाव लिहा.",
        "intro_caption": "🎬 Cosmoplex ची छोटी ओळख",
        "profile_q": "आधी, तुमच्याबद्दल थोडं सांगा.\n\nतुम्ही सध्या काय करता?",
        "profile_opts": [
            ("prof_student", "🎓 विद्यार्थी"),
            ("prof_graduate", "🆕 नुकतेच ग्रॅज्युएट"),
            ("prof_working", "💼 नोकरी करत आहे"),
            ("prof_jobseeker", "🔍 नोकरी शोधत आहे"),
        ],
        "goal_q": "आणि AI बाबत तुमचं *मुख्य ध्येय* काय आहे?\n\nखालून निवडा, किंवा स्वतःचं लिहा 👇",
        "goal_opts": [
            ("goal_job", "🎯 AI/टेक नोकरी मिळवणे"),
            ("goal_grow", "📈 नोकरीत पुढे जाणे"),
            ("goal_build", "🛠️ स्वतःचा प्रोजेक्ट"),
            ("goal_explore", "🧭 फक्त शिकत आहे"),
        ],
        "select_btn": "निवडा",
        "saved": "छान {name} — नोंद केली! 🙌 तुम्ही तयार आहात.",
        "free_offer": "🎁 {name}, *मर्यादित काळाची* ऑफर, फक्त तुमच्यासाठी — आत्ताच साइन अप करा आणि मिळवा *₹699 चा कोर्स अगदी मोफत*. संपण्याआधी घ्या. 👇",
        "start_prompt": "{name}, तुमचा पहिला धडा करून पाहायला तयार आहात — पूर्णपणे मोफत? 👇",
        "start_btn": "🚀 धडा 1 सुरू करा",
        "signup_prompt": "{name}, तुमची *मोफत* जागा निश्चित करायला तयार? खाली साइन अप दाबा. 👇",
        "signup_btn": "✍️ साइन अप",
        "ready_prompt": "🎉 {name}, तुमचं साइन-अप झालं! कोर्स सुरू करायला तयार?",
        "ready_btn": "🚀 सुरू करा",
        "pitch_wait": "एक सेकंद… ⏳",
    },
    "te": {
        "brief": "🙏 {name}, *Cosmoplex AI School* కు స్వాగతం — ఫ్రెషర్ల కోసం రూపొందించిన భారత AI-అక్షరాస్యత కోర్సు, మీ సొంత భాషలో.\n\nకొన్ని చిన్న పాఠాల్లోనే AI *నిజంగా* ఎలా పనిచేస్తుందో, దాన్ని వాడి మీ చదువులో, కెరీర్‌లో ఎలా ముందుకు వెళ్లాలో నేర్చుకుంటారు. మొదలుపెడదాం 👇",
        "name_q": "బాగుంది! 😊 మొదలుపెట్టే ముందు — మిమ్మల్ని ఏ పేరుతో పిలవాలి?\n\nమీ మొదటి పేరు టైప్ చేయండి.",
        "intro_caption": "🎬 Cosmoplex గురించి చిన్న పరిచయం",
        "profile_q": "ముందుగా, మీ గురించి కొంచెం చెప్పండి.\n\nప్రస్తుతం మీరు ఏం చేస్తున్నారు?",
        "profile_opts": [
            ("prof_student", "🎓 విద్యార్థి"),
            ("prof_graduate", "🆕 ఇటీవల గ్రాడ్యుయేట్"),
            ("prof_working", "💼 ఉద్యోగం చేస్తున్నా"),
            ("prof_jobseeker", "🔍 ఉద్యోగం వెతుకుతున్నా"),
        ],
        "goal_q": "మరి AI తో మీ *ప్రధాన లక్ష్యం* ఏమిటి?\n\nకింద ఒకటి ఎంచుకోండి, లేదా మీదే టైప్ చేయండి 👇",
        "goal_opts": [
            ("goal_job", "🎯 AI/టెక్ ఉద్యోగం"),
            ("goal_grow", "📈 ఉద్యోగంలో ఎదగడం"),
            ("goal_build", "🛠️ నా ప్రాజెక్ట్ చేయడం"),
            ("goal_explore", "🧭 అన్వేషిస్తున్నా"),
        ],
        "select_btn": "ఎంచుకోండి",
        "saved": "అద్భుతం {name} — నోట్ చేశాను! 🙌 మీరు సిద్ధం.",
        "free_offer": "🎁 {name}, *పరిమిత సమయం* ఆఫర్, మీ కోసం మాత్రమే — ఇప్పుడే సైన్ అప్ చేయండి, *₹699 విలువైన కోర్సు పూర్తిగా ఉచితంగా* పొందండి. అయిపోకముందే తీసుకోండి. 👇",
        "start_prompt": "{name}, మీ మొదటి పాఠం ప్రయత్నించడానికి సిద్ధమా — పూర్తిగా ఉచితం? 👇",
        "start_btn": "🚀 పాఠం 1 మొదలు",
        "signup_prompt": "{name}, మీ *ఉచిత* సీటును ఖాయం చేసుకోవడానికి సిద్ధమా? కింద సైన్ అప్ నొక్కండి. 👇",
        "signup_btn": "✍️ సైన్ అప్",
        "ready_prompt": "🎉 {name}, మీ సైన్-అప్ పూర్తయింది! కోర్సు మొదలుపెట్టడానికి సిద్ధమా?",
        "ready_btn": "🚀 మొదలుపెట్టు",
        "pitch_wait": "ఒక్క సెకను… ⏳",
    },
    "ta": {
        "brief": "🙏 {name}, *Cosmoplex AI School* க்கு வரவேற்கிறோம் — ஃப்ரெஷர்களுக்காக உருவாக்கப்பட்ட இந்தியாவின் AI-கல்வித் திறன் பாடநெறி, உங்கள் சொந்த மொழியில்.\n\nசில குறுகிய பாடங்களிலேயே AI *உண்மையில்* எப்படி வேலை செய்கிறது, அதைப் பயன்படுத்தி உங்கள் படிப்பிலும் தொழிலிலும் எப்படி முன்னேறுவது என்பதைக் கற்பீர்கள். தொடங்குவோம் 👇",
        "name_q": "நல்லது! 😊 தொடங்கும் முன் — உங்களை என்ன பெயரில் அழைக்கட்டும்?\n\nஉங்கள் முதல் பெயரை எழுதுங்கள்.",
        "intro_caption": "🎬 Cosmoplex பற்றிய சிறிய அறிமுகம்",
        "profile_q": "முதலில், உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள்.\n\nதற்போது நீங்கள் என்ன செய்கிறீர்கள்?",
        "profile_opts": [
            ("prof_student", "🎓 மாணவர்"),
            ("prof_graduate", "🆕 சமீபத்திய பட்டதாரி"),
            ("prof_working", "💼 வேலை செய்கிறேன்"),
            ("prof_jobseeker", "🔍 வேலை தேடுகிறேன்"),
        ],
        "goal_q": "AI உடன் உங்கள் *முக்கிய இலக்கு* என்ன?\n\nகீழே ஒன்றைத் தேர்ந்தெடுங்கள், அல்லது உங்களுடையதை எழுதுங்கள் 👇",
        "goal_opts": [
            ("goal_job", "🎯 AI/டெக் வேலை பெற"),
            ("goal_grow", "📈 வேலையில் முன்னேற"),
            ("goal_build", "🛠️ சொந்த திட்டம்"),
            ("goal_explore", "🧭 வெறுமனே ஆராய்கிறேன்"),
        ],
        "select_btn": "தேர்வு",
        "saved": "அருமை {name} — குறித்துக்கொண்டேன்! 🙌 நீங்கள் தயார்.",
        "free_offer": "🎁 {name}, *வரம்பிட்ட கால* சலுகை, உங்களுக்கு மட்டும் — இப்போதே பதிவு செய்யுங்கள், *₹699 மதிப்புள்ள பாடநெறியை முற்றிலும் இலவசமாக* பெறுங்கள். தீரும் முன் பெறுங்கள். 👇",
        "start_prompt": "{name}, உங்கள் முதல் பாடத்தை முயற்சிக்கத் தயாரா — முற்றிலும் இலவசம்? 👇",
        "start_btn": "🚀 பாடம் 1 தொடங்கு",
        "signup_prompt": "{name}, உங்கள் *இலவச* இடத்தை உறுதி செய்யத் தயாரா? கீழே Sign up-ஐ அழுத்துங்கள். 👇",
        "signup_btn": "✍️ Sign up",
        "ready_prompt": "🎉 {name}, உங்கள் பதிவு முடிந்தது! பாடத்தைத் தொடங்கத் தயாரா?",
        "ready_btn": "🚀 தொடங்கு",
        "pitch_wait": "ஒரு நொடி… ⏳",
    },
    "kn": {
        "brief": "🙏 {name}, *Cosmoplex AI School* ಗೆ ಸ್ವಾಗತ — ಫ್ರೆಶರ್‌ಗಳಿಗಾಗಿ ರೂಪಿಸಲಾದ ಭಾರತದ AI-ಸಾಕ್ಷರತಾ ಕೋರ್ಸ್, ನಿಮ್ಮದೇ ಭಾಷೆಯಲ್ಲಿ.\n\nಕೆಲವೇ ಚಿಕ್ಕ ಪಾಠಗಳಲ್ಲಿ AI *ನಿಜವಾಗಿ* ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಅದನ್ನು ಬಳಸಿ ನಿಮ್ಮ ಓದು ಮತ್ತು ವೃತ್ತಿಯಲ್ಲಿ ಹೇಗೆ ಮುಂದೆ ಹೋಗಬೇಕು ಎಂದು ಕಲಿಯುವಿರಿ. ಆರಂಭಿಸೋಣ 👇",
        "name_q": "ಚೆನ್ನಾಗಿದೆ! 😊 ಆರಂಭಿಸುವ ಮೊದಲು — ನಿಮ್ಮನ್ನು ಯಾವ ಹೆಸರಿನಿಂದ ಕರೆಯಲಿ?\n\nನಿಮ್ಮ ಮೊದಲ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ.",
        "intro_caption": "🎬 Cosmoplex ಬಗ್ಗೆ ಚಿಕ್ಕ ಪರಿಚಯ",
        "profile_q": "ಮೊದಲು, ನಿಮ್ಮ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ಹೇಳಿ.\n\nಈಗ ನೀವು ಏನು ಮಾಡುತ್ತಿದ್ದೀರಿ?",
        "profile_opts": [
            ("prof_student", "🎓 ವಿದ್ಯಾರ್ಥಿ"),
            ("prof_graduate", "🆕 ಇತ್ತೀಚಿನ ಪದವೀಧರ"),
            ("prof_working", "💼 ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇನೆ"),
            ("prof_jobseeker", "🔍 ಕೆಲಸ ಹುಡುಕುತ್ತಿದ್ದೇನೆ"),
        ],
        "goal_q": "AI ಜೊತೆ ನಿಮ್ಮ *ಮುಖ್ಯ ಗುರಿ* ಏನು?\n\nಕೆಳಗೆ ಒಂದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ, ಅಥವಾ ನಿಮ್ಮದೇ ಟೈಪ್ ಮಾಡಿ 👇",
        "goal_opts": [
            ("goal_job", "🎯 AI/ಟೆಕ್ ಕೆಲಸ ಪಡೆಯಲು"),
            ("goal_grow", "📈 ಕೆಲಸದಲ್ಲಿ ಬೆಳೆಯಲು"),
            ("goal_build", "🛠️ ಸ್ವಂತ ಪ್ರಾಜೆಕ್ಟ್"),
            ("goal_explore", "🧭 ಅನ್ವೇಷಿಸುತ್ತಿದ್ದೇನೆ"),
        ],
        "select_btn": "ಆಯ್ಕೆ ಮಾಡಿ",
        "saved": "ಅದ್ಭುತ {name} — ಗಮನಿಸಿದೆ! 🙌 ನೀವು ಸಿದ್ಧ.",
        "free_offer": "🎁 {name}, *ಸೀಮಿತ ಅವಧಿಯ* ಕೊಡುಗೆ, ನಿಮಗಾಗಿ ಮಾತ್ರ — ಈಗಲೇ ಸೈನ್ ಅಪ್ ಮಾಡಿ, *₹699 ಮೌಲ್ಯದ ಕೋರ್ಸ್ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿ* ಪಡೆಯಿರಿ. ಮುಗಿಯುವ ಮೊದಲು ಪಡೆಯಿರಿ. 👇",
        "start_prompt": "{name}, ನಿಮ್ಮ ಮೊದಲ ಪಾಠ ಪ್ರಯತ್ನಿಸಲು ಸಿದ್ಧವೇ — ಸಂಪೂರ್ಣ ಉಚಿತ? 👇",
        "start_btn": "🚀 ಪಾಠ 1 ಆರಂಭಿಸಿ",
        "signup_prompt": "{name}, ನಿಮ್ಮ *ಉಚಿತ* ಸೀಟನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಸಿದ್ಧವೇ? ಕೆಳಗೆ Sign up ಒತ್ತಿ. 👇",
        "signup_btn": "✍️ Sign up",
        "ready_prompt": "🎉 {name}, ನಿಮ್ಮ ಸೈನ್-ಅಪ್ ಆಯಿತು! ಕೋರ್ಸ್ ಆರಂಭಿಸಲು ಸಿದ್ಧವೇ?",
        "ready_btn": "🚀 ಆರಂಭಿಸಿ",
        "pitch_wait": "ಒಂದು ಕ್ಷಣ… ⏳",
    },
}


def ob(lang: str, key: str):
    return ONBOARD.get(lang, ONBOARD["en"]).get(key, ONBOARD["en"][key])
