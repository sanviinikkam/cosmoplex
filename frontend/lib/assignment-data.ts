import type { Lang } from "@/lib/use-lang";

export interface Assignment {
  id: string;
  question: string;
  question_hi?: string;
  question_te?: string;
  question_ta?: string;
  question_kn?: string;
  question_mr?: string;
  rubric: string;
}

const LESSON_ASSIGNMENTS: Record<string, Assignment[]> = {
  "The 10 AI Words Every Fresher Must Know": [
    {
      id: "a1",
      question:
        "Pick any 5 of these 10 words and write one sentence for each — in your own words, not the video's:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nNo notes. No Googling. No copy-paste. Your own words only.",
      question_hi:
        "इन 10 शब्दों में से कोई भी 5 चुनें और हर एक के लिए एक वाक्य लिखें — अपने शब्दों में, वीडियो के नहीं:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nकोई नोट्स नहीं। Google नहीं। Copy-paste नहीं। सिर्फ अपने शब्द।",
      question_te:
        "ఈ 10 పదాల్లో ఏవైనా 5 సెలెక్ట్ చేసి, ఒక్కో దానికి ఒక్కో సెంటెన్స్ రాయండి — మీ సొంత మాటల్లో, వీడియోలో చెప్పినవి కాదు:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nనోట్స్ వద్దు. Google వద్దు. Copy-paste వద్దు. మీ మాటల్లోనే రాయండి.",
      question_ta:
        "இந்த 10 வார்த்தைகளில் ஏதேனும் 5 ஐ தேர்ந்தெடுத்து ஒவ்வொன்றுக்கும் ஒரு வாக்கியம் எழுதுங்கள் — உங்கள் சொந்த வார்த்தைகளில்:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nகுறிப்புகள் வேண்டாம். Google வேண்டாம். Copy-paste வேண்டாம். உங்கள் வார்த்தைகள் மட்டும்.",
      question_kn:
        "ಈ 10 ಪದಗಳಲ್ಲಿ ಯಾವುದಾದರೂ 5 ಆಯ್ಕೆ ಮಾಡಿ ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ — ನಿಮ್ಮ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nಟಿಪ್ಪಣಿಗಳು ಬೇಡ. Google ಬೇಡ. Copy-paste ಬೇಡ. ಕೇವಲ ನಿಮ್ಮ ಮಾತುಗಳು.",
      question_mr:
        "या 10 शब्दांपैकी कोणतेही 5 निवडा आणि प्रत्येकासाठी एक वाक्य लिहा — तुमच्या स्वतःच्या शब्दांत, व्हिडिओतले नाही:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nनोट्स नाहीत. Google नाही. Copy-paste नाही. फक्त तुमचेच शब्द.",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Define It Yourself".
The learner was asked to pick any 5 of these 10 AI terms and explain each in one sentence in their own words:
AI, ML, Generative AI, LLM, Prompt, Token, Context Window, Model, Output, Hallucination.

Score out of 100:
- Accuracy (40 pts): Are the 5 definitions factually correct? The right general idea counts even with imperfect phrasing. Penalise clearly wrong or confused definitions.
- Own words (30 pts): Is the learner paraphrasing genuinely, not copying verbatim from a standard definition?
- Coverage (20 pts): Did they define exactly 5 terms?
- Clarity (10 pts): Are the explanations simple and understandable?

On fail (score < 50): identify the specific term(s) that are off and give a brief analogy-based hint. Do not ask for a full redo — just the one gap.`,
    },
    {
      id: "a2",
      question:
        "Open your phone right now. Pick 3 apps you actually use — Truecaller, Swiggy, YouTube, WhatsApp, anything.\n\nFor each one, write:\n• App name\n• AI type it uses (AI / ML / Generative AI)\n• One sentence: why you think so\n\nTake a screenshot of the app home screens and upload it along with your 3 lines of reasoning.",
      question_hi:
        "अभी अपना फ़ोन खोलें। 3 ऐसे ऐप्स चुनें जो आप actually इस्तेमाल करते हैं — Truecaller, Swiggy, YouTube, WhatsApp, कुछ भी।\n\nहर एक के लिए लिखें:\n• ऐप का नाम\n• वो किस AI का उपयोग करता है (AI / ML / Generative AI)\n• एक वाक्य: आपको ऐसा क्यों लगता है\n\nऐप की होम स्क्रीन का स्क्रीनशॉट लें और अपने 3 लाइन के reasoning के साथ अपलोड करें।",
      question_te:
        "ఇప్పుడే మీ ఫోన్ ఓపెన్ చేయండి. మీరు నిజంగా వాడే 3 apps సెలెక్ట్ చేయండి — Truecaller, Swiggy, YouTube, WhatsApp, ఏదైనా.\n\nఒక్కో దానికి రాయండి:\n• App పేరు\n• ఇది వాడే AI రకం (AI / ML / Generative AI)\n• ఒక సెంటెన్స్: మీకు అలా ఎందుకు అనిపించింది\n\nApp హోమ్ స్క్రీన్ స్క్రీన్‌షాట్ తీసి, మీ 3 లైన్ల రీజన్‌తో అప్‌లోడ్ చేయండి.",
      question_ta:
        "இப்போதே உங்கள் ஃபோனை திறங்கள். நீங்கள் உண்மையில் பயன்படுத்தும் 3 apps தேர்ந்தெடுங்கள் — Truecaller, Swiggy, YouTube, WhatsApp, எதுவும்.\n\nஒவ்வொன்றுக்கும் எழுதுங்கள்:\n• App பெயர்\n• அது பயன்படுத்தும் AI வகை (AI / ML / Generative AI)\n• ஒரு வாக்கியம்: ஏன் என்று நீங்கள் நினைக்கிறீர்கள்\n\nApp home screens ஸ்கிரீன்ஷாட் எடுத்து உங்கள் 3 வரி reasoning உடன் upload செய்யுங்கள்.",
      question_kn:
        "ಈಗಲೇ ನಿಮ್ಮ ಫೋನ್ ತೆರೆಯಿರಿ. ನೀವು ನಿಜವಾಗಿ ಬಳಸುವ 3 apps ಆಯ್ಕೆ ಮಾಡಿ — Truecaller, Swiggy, YouTube, WhatsApp, ಏನಾದರೂ.\n\nಪ್ರತಿಯೊಂದಕ್ಕೂ ಬರೆಯಿರಿ:\n• App ಹೆಸರು\n• ಅದು ಬಳಸುವ AI ಪ್ರಕಾರ (AI / ML / Generative AI)\n• ಒಂದು ವಾಕ್ಯ: ಏಕೆ ಎಂದು ನೀವು ಭಾವಿಸುತ್ತೀರಿ\n\nApp home screens ಸ್ಕ್ರೀನ್‌ಶಾಟ್ ತೆಗೆದು ನಿಮ್ಮ 3 ಸಾಲಿನ reasoning ಜೊತೆ upload ಮಾಡಿ.",
      question_mr:
        "आत्ताच तुमचा फोन उघडा. तुम्ही खरोखर वापरता असे 3 apps निवडा — Truecaller, Swiggy, YouTube, WhatsApp, काहीही.\n\nप्रत्येकासाठी लिहा:\n• App चं नाव\n• ते कोणत्या प्रकारचं AI वापरतं (AI / ML / Generative AI)\n• एक वाक्य: तुम्हाला असं का वाटतं\n\nApp च्या home screens चा स्क्रीनशॉट घ्या आणि तुमच्या 3 ओळींच्या reasoning सोबत upload करा.",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Your Phone, Three Apps".
The learner was asked to pick 3 apps they use, identify which type of AI each uses (AI / ML / Generative AI), and give one reason per app. They were also asked to submit a screenshot.

Score out of 100:
- Correct classification (40 pts): At least 2 of 3 apps correctly identified with the right AI type. Common correct answers: Truecaller=ML (spam detection), Swiggy=ML (recommendations), YouTube=ML (recommendations), ChatGPT/Gemini=Generative AI, Google Maps=AI/ML.
- Reasoning quality (35 pts): Does the one-sentence reason show actual understanding? "It creates new content" for Generative AI or "it learns from my history" for ML are good signals.
- Evidence submitted (15 pts): Is there a screenshot or image showing the apps?
- Coverage (10 pts): Did they cover 3 apps?

On fail: point to the specific app whose classification is wrong and hint at the creating-vs-learning distinction.`,
    },
    {
      id: "a3",
      question:
        "Pick any real task you need done today — a resume line, a message to a manager, study notes, anything.\n\nStep 1: Write a vague prompt. Run it in ChatGPT. Take a screenshot.\nStep 2: Rewrite it with: who you are + what you need + how you want it formatted. Run it. Take a screenshot.\n\nUpload both screenshots and add one sentence: what changed between the two outputs?",
      question_hi:
        "कोई भी असली काम चुनें जो आज करना है — resume की एक लाइन, मैनेजर को message, study notes, कुछ भी।\n\nStep 1: एक vague prompt लिखें। ChatGPT में run करें। Screenshot लें।\nStep 2: इसे rewrite करें — आप कौन हैं + क्या चाहिए + कैसे format में चाहिए। Run करें। Screenshot लें।\n\nदोनों screenshots upload करें और एक वाक्य लिखें: दोनों outputs में क्या बदला?",
      question_te:
        "ఈరోజు మీరు చేయాల్సిన ఏదైనా ఒక real పని తీసుకోండి — రెజ్యూమ్ లైన్, మేనేజర్‌కి మెసేజ్, స్టడీ నోట్స్, ఏదైనా.\n\nStep 1: ఒక vague prompt రాయండి. ChatGPT లో రన్ చేయండి. స్క్రీన్‌షాట్ తీయండి.\nStep 2: ఇప్పుడు అదే prompt ని మళ్ళీ రాయండి — మీరు ఎవరు + మీకేం కావాలి + ఏ ఫార్మాట్‌లో కావాలి. రన్ చేయండి. స్క్రీన్‌షాట్ తీయండి.\n\nరెండు స్క్రీన్‌షాట్‌లు అప్‌లోడ్ చేసి ఒక్క లైన్ రాయండి: రెండు outputs మధ్య ఏం తేడా వచ్చింది?",
      question_ta:
        "இன்று செய்ய வேண்டிய ஏதாவது ஒரு உண்மையான வேலையை தேர்ந்தெடுங்கள்.\n\nStep 1: ஒரு தெளிவற்ற prompt எழுதுங்கள். ChatGPT இல் run செய்யுங்கள். Screenshot எடுங்கள்.\nStep 2: அதை மீண்டும் எழுதுங்கள் — நீங்கள் யார் + என்ன வேண்டும் + எப்படி format வேண்டும். Run செய்யுங்கள். Screenshot எடுங்கள்.\n\nரெண்டு screenshots upload செய்து ஒரு வாக்கியம் எழுதுங்கள்: இரண்டு outputs இடையே என்ன மாறியது?",
      question_kn:
        "ಇಂದು ಮಾಡಬೇಕಾದ ಯಾವುದಾದರೂ ನಿಜವಾದ ಕೆಲಸ ಆಯ್ಕೆ ಮಾಡಿ.\n\nStep 1: ಅಸ್ಪಷ್ಟ prompt ಬರೆಯಿರಿ. ChatGPT ನಲ್ಲಿ run ಮಾಡಿ. Screenshot ತೆಗೆಯಿರಿ.\nStep 2: ಅದನ್ನು ಮತ್ತೆ ಬರೆಯಿರಿ — ನೀವು ಯಾರು + ಏನು ಬೇಕು + ಹೇಗೆ format ಬೇಕು. Run ಮಾಡಿ. Screenshot ತೆಗೆಯಿರಿ.\n\nಎರಡು screenshots upload ಮಾಡಿ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ: ಎರಡು outputs ನಡುವೆ ಏನು ಬದಲಾಯಿತು?",
      question_mr:
        "आज करायचं असं कोणतंही खरं काम निवडा — रेझ्युमेची एक ओळ, मॅनेजरला message, study notes, काहीही.\n\nStep 1: एक vague prompt लिहा. ChatGPT मध्ये run करा. Screenshot घ्या.\nStep 2: तोच prompt पुन्हा लिहा — तुम्ही कोण आहात + तुम्हाला काय हवं + कोणत्या format मध्ये हवं. Run करा. Screenshot घ्या.\n\nदोन्ही screenshots upload करा आणि एक वाक्य लिहा: दोन्ही outputs मध्ये काय बदललं?",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Bad Prompt vs Good Prompt".
The learner was asked to write a vague prompt, run it, then rewrite a more specific one with context (who they are, what they need, desired format), run it, and compare the outputs.

Score out of 100:
- Evidence of two attempts (30 pts): Are there two screenshots or outputs — one vague, one specific?
- Improvement quality (35 pts): Is the second prompt meaningfully more specific? Does it include context (role, task, format)?
- Observation (25 pts): Did the learner articulate what changed between the two outputs? Any specific observation (tone, length, relevance) counts.
- Clarity (10 pts): Is the comparison easy to follow?

On fail: identify whether the second prompt still lacks context (who they are, what the output is for) and suggest one specific addition.`,
    },
    {
      id: "a4",
      question:
        "Open ChatGPT and start a fresh chat.\n\nMessage 1: Tell it your name and something specific — your city, your degree, your dream job.\nThen send 10 more messages on completely different topics — news, recipes, anything.\nFinal message: Ask — 'What did I tell you about myself at the start?'\n\nTake a screenshot of its reply and upload it with one line: what did this show you?",
      question_hi:
        "ChatGPT खोलें और एक नई chat शुरू करें।\n\nMessage 1: अपना नाम और कुछ specific बताएं — अपना शहर, अपनी degree, अपना dream job।\nफिर बिल्कुल अलग-अलग topics पर 10 और messages भेजें — news, recipes, कुछ भी।\nआखिरी message: पूछें — 'शुरुआत में मैंने अपने बारे में क्या बताया था?'\n\nइसके जवाब का screenshot लें और एक लाइन के साथ upload करें: इससे आपको क्या पता चला?",
      question_te:
        "ChatGPT ఓపెన్ చేసి కొత్త chat స్టార్ట్ చేయండి.\n\nMessage 1: మీ పేరు, మీ ఊరు, మీ డిగ్రీ లాంటి వివరాలు చెప్పండి.\nతర్వాత పూర్తిగా వేరే topics మీద 10 messages పంపండి — న్యూస్, రెసిపీలు, ఏదైనా.\nలాస్ట్ message: అడగండి — 'మొదట్లో నా గురించి నేను ఏం చెప్పాను?'\n\nదాని ఆన్సర్ స్క్రీన్‌షాట్ తీసి, ఒక్క లైన్‌తో అప్‌లోడ్ చేయండి: దీంతో మీకు ఏం అర్థమైంది?",
      question_ta:
        "ChatGPT ஐ திறந்து புதிய chat ஐ தொடங்குங்கள்.\n\nMessage 1: உங்கள் பெயர் மற்றும் குறிப்பிட்ட விவரங்கள் சொல்லுங்கள்.\nபின்னர் முற்றிலும் வேறுபட்ட topics இல் 10 messages அனுப்புங்கள்.\nகடைசி message: கேளுங்கள் — 'தொடக்கத்தில் நான் என்னைப் பற்றி என்ன சொன்னேன்?'\n\nபதிலின் screenshot எடுத்து ஒரு வரியுடன் upload செய்யுங்கள்: இது உங்களுக்கு என்ன காட்டியது?",
      question_kn:
        "ChatGPT ತೆರೆದು ಹೊಸ chat ಪ್ರಾರಂಭಿಸಿ.\n\nMessage 1: ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ನಿರ್ದಿಷ್ಟ ವಿವರಗಳು ಹೇಳಿ.\nನಂತರ ಸಂಪೂರ್ಣ ಭಿನ್ನ topics ನಲ್ಲಿ 10 messages ಕಳುಹಿಸಿ.\nಕೊನೆಯ message: ಕೇಳಿ — 'ಮೊದಲಲ್ಲಿ ನಾನು ನನ್ನ ಬಗ್ಗೆ ಏನು ಹೇಳಿದೆ?'\n\nಉತ್ತರದ screenshot ತೆಗೆದು ಒಂದು ಸಾಲಿನೊಂದಿಗೆ upload ಮಾಡಿ: ಇದು ನಿಮಗೆ ಏನು ತೋರಿಸಿತು?",
      question_mr:
        "ChatGPT उघडा आणि एक नवीन chat सुरू करा.\n\nMessage 1: तुमचं नाव आणि काहीतरी specific सांगा — तुमचं शहर, तुमची degree, तुमचा dream job.\nमग पूर्णपणे वेगवेगळ्या topics वर आणखी 10 messages पाठवा — news, recipes, काहीही.\nशेवटचा message: विचारा — 'सुरुवातीला मी माझ्याबद्दल काय सांगितलं होतं?'\n\nत्याच्या उत्तराचा screenshot घ्या आणि एका ओळीसोबत upload करा: यातून तुम्हाला काय कळलं?",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Break the Memory".
The learner was asked to: start a fresh ChatGPT chat, share personal info, send 10+ unrelated messages, then ask ChatGPT what they said at the start — to observe context window / memory limits.

Score out of 100:
- Evidence submitted (30 pts): Is there a screenshot of ChatGPT's reply to the final question?
- Observation accuracy (40 pts): Did the learner notice the AI forgot or partially forgot the initial information? Can they name the reason (context window, memory limit, no persistent memory)?
- Insight quality (20 pts): Is the one-line observation specific and shows real understanding — not just "it forgot"?
- Completeness (10 pts): Did they follow the steps (fresh chat, 10+ messages, ask at the end)?

On fail: if the AI remembered, suggest a longer chat (15+ messages). If the AI forgot but the learner didn't name why, prompt them to name the concept (context window).`,
    },
    {
      id: "a5",
      question:
        "Ask ChatGPT this:\n\"Give me 5 interesting facts about [your city or district].\"\n\nPick the most specific fact — a number, a date, a name.\nNow check it. Google it. Official website. Wikipedia. Anything.\n\nUpload or write:\nChatGPT said: ___\nI checked: ___\nVerdict: ___",
      question_hi:
        "ChatGPT से यह पूछें:\n\"मुझे [अपने शहर या जिले] के बारे में 5 interesting facts बताओ।\"\n\nसबसे specific fact चुनें — कोई number, date, या नाम।\nअब इसे check करें। Google करें। Official website। Wikipedia। कुछ भी।\n\nUpload करें या लिखें:\nChatGPT ने कहा: ___\nमैंने check किया: ___\nVerdict: ___",
      question_te:
        "ChatGPT ని ఇలా అడగండి:\n\"నాకు [మీ ఊరు లేదా జిల్లా] గురించి 5 ఇంట్రెస్టింగ్ విషయాలు చెప్పు.\"\n\nఅందులో బాగా specific విషయం ఒకటి తీసుకోండి — ఒక నంబర్, డేట్, లేదా పేరు.\nఇప్పుడు దాన్ని చెక్ చేయండి. Google చేయండి, ఆఫిషియల్ వెబ్‌సైట్ చూడండి, Wikipedia చూడండి — ఏదైనా.\n\nఅప్‌లోడ్ చేయండి లేదా రాయండి:\nChatGPT చెప్పింది: ___\nనేను చెక్ చేసింది: ___\nనా నిర్ణయం: ___",
      question_ta:
        "ChatGPT ஐ இப்படி கேளுங்கள்:\n'எனக்கு [உங்கள் நகரம் அல்லது மாவட்டம்] பற்றி 5 சுவாரஸ்யமான உண்மைகளை சொல்லுங்கள்.'\n\nமிகவும் குறிப்பிட்ட உண்மையை தேர்ந்தெடுங்கள். இப்போது அதை சரிபார்க்கவும்.\n\nUpload செய்யுங்கள் அல்லது எழுதுங்கள்:\nChatGPT சொன்னது: ___\nநான் சரிபார்த்தது: ___\nதீர்ப்பு: ___",
      question_kn:
        "ChatGPT ಅನ್ನು ಹೀಗೆ ಕೇಳಿ:\n'ನನಗೆ [ನಿಮ್ಮ ನಗರ ಅಥವಾ ಜಿಲ್ಲೆ] ಬಗ್ಗೆ 5 ಆಸಕ್ತಿಕರ ವಾಸ್ತವಗಳನ್ನು ಹೇಳು.'\n\nಅತ್ಯಂತ ನಿರ್ದಿಷ್ಟ ವಾಸ್ತವ ಆಯ್ಕೆ ಮಾಡಿ. ಈಗ ಅದನ್ನು ಪರಿಶೀಲಿಸಿ.\n\nUpload ಮಾಡಿ ಅಥವಾ ಬರೆಯಿರಿ:\nChatGPT ಹೇಳಿದ್ದು: ___\nನಾನು ಪರಿಶೀಲಿಸಿದ್ದು: ___\nತೀರ್ಪು: ___",
      question_mr:
        "ChatGPT ला असं विचारा:\n\"मला [तुमचं शहर किंवा जिल्हा] बद्दल 5 interesting facts सांग.\"\n\nसर्वात specific fact निवडा — एखादा number, date, किंवा नाव.\nआता ते check करा. Google करा. Official website. Wikipedia. काहीही.\n\nUpload करा किंवा लिहा:\nChatGPT ने सांगितलं: ___\nमी check केलं: ___\nनिकाल: ___",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Catch a Hallucination".
The learner was asked to ask ChatGPT for 5 facts about their city, pick the most specific one, verify it independently (Google, Wikipedia, official site), and report: what ChatGPT said, what they found, and their verdict.

Score out of 100:
- Verification step completed (40 pts): Did the learner actually check the fact using an external source? This is the most important criterion.
- Source cited (20 pts): Did they name where they checked (Google, Wikipedia, official site)?
- Verdict given (25 pts): Did they state clearly whether the fact was accurate or a hallucination?
- Fact specificity (15 pts): Did they pick a specific, verifiable fact (number, date, name) rather than a vague statement?

Note: Both accurate facts and hallucinations are valid — the habit of checking is what matters. Do not penalise for not finding an error.`,
    },
    {
      id: "a6",
      question:
        "Pick one real task — a cover letter line, a WhatsApp message, an explanation of something.\n\nRun the exact same prompt in:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) OR Meta AI (in WhatsApp — type @Meta AI)\n\nTake a screenshot of both outputs. Upload them with one line:\nWhich one was better for your task, and why?",
      question_hi:
        "एक असली काम चुनें — cover letter की एक लाइन, WhatsApp message, किसी चीज़ की explanation।\n\nबिल्कुल same prompt इन दोनों में run करें:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) या Meta AI (WhatsApp में — @Meta AI type करें)\n\nदोनों outputs के screenshots लें। उन्हें एक लाइन के साथ upload करें:\nआपके task के लिए कौन सा बेहतर था, और क्यों?",
      question_te:
        "ఒక real పని తీసుకోండి — cover letter లైన్, WhatsApp మెసేజ్, ఏదైనా ఎక్స్‌ప్లనేషన్.\n\nఅదే prompt ని ఈ రెండింట్లో రన్ చేయండి:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) లేదా Meta AI (WhatsApp లో — @Meta AI టైప్ చేయండి)\n\nరెండు outputs స్క్రీన్‌షాట్‌లు తీయండి. ఒక్క లైన్‌తో అప్‌లోడ్ చేయండి:\nమీ పనికి ఏది బెటర్‌గా ఉంది, ఎందుకు?",
      question_ta:
        "ஒரு உண்மையான வேலையை தேர்ந்தெடுங்கள்.\n\nஒரே prompt ஐ இரண்டிலும் run செய்யுங்கள்:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) அல்லது Meta AI\n\nரெண்டு outputs screenshots எடுங்கள். ஒரு வரியுடன் upload செய்யுங்கள்:\nஉங்கள் வேலைக்கு எது சிறந்தது, ஏன்?",
      question_kn:
        "ಒಂದು ನಿಜವಾದ ಕೆಲಸ ಆಯ್ಕೆ ಮಾಡಿ.\n\nಒಂದೇ prompt ಅನ್ನು ಎರಡರಲ್ಲೂ run ಮಾಡಿ:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) ಅಥವಾ Meta AI\n\nಎರಡು outputs screenshots ತೆಗೆಯಿರಿ. ಒಂದು ಸಾಲಿನೊಂದಿಗೆ upload ಮಾಡಿ:\nನಿಮ್ಮ ಕೆಲಸಕ್ಕೆ ಯಾವುದು ಉತ್ತಮ, ಏಕೆ?",
      question_mr:
        "एक खरं काम निवडा — cover letter ची एक ओळ, WhatsApp message, एखाद्या गोष्टीचं explanation.\n\nअगदी तोच prompt या दोन्हींमध्ये run करा:\n• ChatGPT (chatgpt.com)\n• Gemini (gemini.google.com) किंवा Meta AI (WhatsApp मध्ये — @Meta AI type करा)\n\nदोन्ही outputs चे screenshots घ्या. ते एका ओळीसोबत upload करा:\nतुमच्या task साठी कोणतं चांगलं होतं, आणि का?",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Same Prompt, Two Models".
The learner was asked to run the same prompt in two AI tools (ChatGPT + Gemini or Meta AI), screenshot both outputs, and give a one-line preference with a specific reason.

Score out of 100:
- Two outputs shown (30 pts): Are there screenshots or evidence of outputs from two different AI models?
- Specific comparison (40 pts): Does the learner name a concrete difference — tone, length, examples used, relevance to task? "One is better" without specifics does not count.
- Reasoning quality (20 pts): Does the reason show they understood why one was better for their specific task?
- Task relevance (10 pts): Is the chosen task real and personal (not just "hello")?

On fail: ask them to name one concrete difference — tone, length, or examples. Vague preferences don't demonstrate learning.`,
    },
    {
      id: "a7",
      question:
        "Open this link on your phone: platform.openai.com/tokenizer\n\nType a sentence you know well — in English. See how many tokens it is.\nNow type the same sentence in your home language (Hindi, Marathi, Telugu, Tamil, Kannada — whatever you speak).\nSame meaning. Different token count.\n\nTake screenshots of both. Upload them with one line: what did you notice?",
      question_hi:
        "अपने फ़ोन पर यह link खोलें: platform.openai.com/tokenizer\n\nएक वाक्य type करें जो आपको अच्छे से पता हो — English में। देखें कितने tokens हैं।\nअब वही वाक्य Hindi में type करें (या Marathi, या आपकी घर की भाषा में)।\nसमान meaning। अलग token count।\n\nदोनों के screenshots लें। एक लाइन के साथ upload करें: आपने क्या notice किया?",
      question_te:
        "మీ ఫోన్‌లో ఈ లింక్ ఓపెన్ చేయండి: platform.openai.com/tokenizer\n\nఒక సెంటెన్స్ ఇంగ్లీష్‌లో టైప్ చేయండి. ఎన్ని tokens వచ్చాయో చూడండి.\nఇప్పుడు అదే సెంటెన్స్ తెలుగులో టైప్ చేయండి.\nఅర్థం ఒకటే. కానీ token count వేరే.\n\nరెండు స్క్రీన్‌షాట్‌లు తీసి ఒక్క లైన్‌తో అప్‌లోడ్ చేయండి: మీరు ఏం గమనించారు?",
      question_ta:
        "உங்கள் ஃபோனில் இந்த link ஐ திறங்கள்: platform.openai.com/tokenizer\n\nஒரு வாக்கியத்தை ஆங்கிலத்தில் type செய்யுங்கள். எத்தனை tokens என்று பாருங்கள்.\nஒரே வாக்கியத்தை தமிழில் type செய்யுங்கள்.\nஒரே அர்த்தம். வேறு token count.\n\nரெண்டு screenshots எடுத்து ஒரு வரியுடன் upload செய்யுங்கள்: நீங்கள் என்ன கவனித்தீர்கள்?",
      question_kn:
        "ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ಈ link ತೆರೆಯಿರಿ: platform.openai.com/tokenizer\n\nಒಂದು ವಾಕ್ಯವನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ type ಮಾಡಿ. ಎಷ್ಟು tokens ಎಂದು ನೋಡಿ.\nಅದೇ ವಾಕ್ಯವನ್ನು ಕನ್ನಡದಲ್ಲಿ type ಮಾಡಿ.\nಒಂದೇ ಅರ್ಥ. ಭಿನ್ನ token count.\n\nಎರಡು screenshots ತೆಗೆದು ಒಂದು ಸಾಲಿನೊಂದಿಗೆ upload ಮಾಡಿ: ನೀವು ಏನು ಗಮನಿಸಿದಿರಿ?",
      question_mr:
        "तुमच्या फोनवर ही link उघडा: platform.openai.com/tokenizer\n\nतुम्हाला नीट माहीत असलेलं एक वाक्य type करा — English मध्ये. किती tokens आहेत ते बघा.\nआता तेच वाक्य तुमच्या घरच्या भाषेत type करा (Hindi, Marathi, Telugu, Tamil, Kannada — तुम्ही जी बोलता ती).\nएकच अर्थ. वेगळी token count.\n\nदोन्हींचे screenshots घ्या. एका ओळीसोबत upload करा: तुम्ही काय notice केलं?",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Count the Tokens".
The learner was asked to use the OpenAI tokenizer, type the same sentence in English and then in their home language (e.g. Hindi, Marathi, Telugu, Tamil, Kannada, or any other), and observe the difference in token count.

Score out of 100:
- Evidence submitted (30 pts): Are there screenshots of the tokenizer showing both languages?
- Observation correctness (40 pts): Did the learner notice that: (a) tokens ≠ words, OR (b) the same meaning takes more tokens in their home language? Either observation counts for full marks.
- Insight depth (20 pts): Is the observation specific? e.g. "English took 8 tokens, my home language took 15 for the same sentence" is much better than "they were different".
- Completion (10 pts): Did they try both languages?

On fail: prompt them to compare the actual numbers from both screenshots — the gap between the English and home-language token counts is the lesson.`,
    },
    {
      id: "a8",
      question:
        "Think of one person in your life who has never used AI — parent, sibling, cousin, friend, anyone.\n\nPick one word from the 10 that you feel most confident about:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nWrite out (or record as a voice note and transcribe it) a 30–60 second explanation of that word for that person. Use an example from your own life — not from the video.\n\nUpload your written explanation or a document with the transcription.",
      question_hi:
        "अपनी ज़िंदगी में किसी ऐसे व्यक्ति के बारे में सोचें जिसने कभी AI use नहीं किया — माता-पिता, भाई-बहन, cousin, दोस्त, कोई भी।\n\n10 शब्दों में से एक चुनें जिसमें आप सबसे confident हों:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\n30–60 second की explanation लिखें (या voice note record करके transcript करें) उस शब्द की — उस व्यक्ति के लिए। अपनी ज़िंदगी से example दें — video का नहीं।\n\nअपनी written explanation या transcription वाला document upload करें।",
      question_te:
        "మీకు తెలిసిన, ఎప్పుడూ AI వాడని ఒక వ్యక్తి గురించి ఆలోచించండి — అమ్మ, నాన్న, ఫ్రెండ్, ఎవరైనా.\n\n10 పదాల్లో మీకు బాగా క్లారిటీ ఉన్న ఒక పదం తీసుకోండి:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nఆ వ్యక్తికి అర్థమయ్యేలా ఆ పదాన్ని 30–60 సెకండ్లలో ఎక్స్‌ప్లెయిన్ చేస్తూ రాయండి. మీ సొంత లైఫ్ నుంచి ఉదాహరణ ఇవ్వండి — వీడియోలోది కాదు.\n\nమీరు రాసింది అప్‌లోడ్ చేయండి.",
      question_ta:
        "உங்கள் வாழ்வில் ஒருபோதும் AI பயன்படுத்தாத ஒருவரைப் பற்றி யோசியுங்கள்.\n\n10 வார்த்தைகளில் நீங்கள் மிகவும் நம்பிக்கையாக உணரும் ஒன்றை தேர்ந்தெடுங்கள்.\n\nஅந்த நபருக்கு அந்த வார்த்தையை 30–60 வினாடி விளக்கம் எழுதுங்கள். உங்கள் சொந்த வாழ்க்கையிலிருந்து உதாரணம் கொடுங்கள்.\n\nஉங்கள் எழுதப்பட்ட விளக்கத்தை upload செய்யுங்கள்.",
      question_kn:
        "ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಎಂದಿಗೂ AI ಬಳಸಿಲ್ಲದ ಯಾರೊಬ್ಬರ ಬಗ್ಗೆ ಯೋಚಿಸಿ.\n\n10 ಪದಗಳಲ್ಲಿ ನಿಮಗೆ ಅತ್ಯಂತ ಆತ್ಮವಿಶ್ವಾಸ ಅನಿಸುವ ಒಂದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.\n\nಆ ವ್ಯಕ್ತಿಗೆ ಆ ಪದದ 30–60 ಸೆಕೆಂಡ್ ವಿವರಣೆ ಬರೆಯಿರಿ. ನಿಮ್ಮ ಸ್ವಂತ ಜೀವನದಿಂದ ಉದಾಹರಣೆ ಕೊಡಿ.\n\nನಿಮ್ಮ ಬರೆದ ವಿವರಣೆ upload ಮಾಡಿ.",
      question_mr:
        "तुमच्या आयुष्यातल्या अशा एका व्यक्तीचा विचार करा जिने कधीही AI वापरलं नाही — आई-वडील, भावंड, चुलत भाऊ-बहीण, मित्र, कोणीही.\n\n10 शब्दांपैकी तुम्हाला ज्याबद्दल सर्वात जास्त confident वाटतं असा एक शब्द निवडा:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nत्या व्यक्तीसाठी त्या शब्दाचं 30–60 सेकंदांचं explanation लिहा (किंवा voice note record करून transcribe करा). तुमच्या स्वतःच्या आयुष्यातलं उदाहरण द्या — व्हिडिओतलं नाही.\n\nतुमचं लिहिलेलं explanation किंवा transcription असलेला document upload करा.",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Teach It in 60 Seconds".
The learner was asked to explain one AI term to someone who has never used AI, using a personal real-life example — not the video's example. They submitted a written explanation or transcription.

Score out of 100:
- Term correctly explained (40 pts): Is the chosen term explained in a way that is factually accurate and understandable to a non-technical person?
- Own example used (35 pts): Did they use a personal, real-life example? Penalise if they used the video's exact analogy (e.g. "dhaba" analogy if that was in the script). A different example of the same concept is fine.
- Appropriate level (15 pts): Is the explanation simple enough for someone who's never used AI?
- Length/effort (10 pts): Is it substantive — roughly 30–60 seconds worth of speech (50–100 words)?

On fail: affirm the term understanding but flag the video example and ask for a personal one from their own life.`,
    },
    {
      id: "a9",
      question:
        "Write one paragraph — 8 to 12 sentences — describing a single ChatGPT conversation from start to finish.\n\nUse all 10 words at least once each. Bold or CAPITALISE each word when you use it:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nYou can make the conversation up — it does not have to be real. But every word must be used in a way that actually makes sense.\n\nUpload as a document or image of your written paragraph.",
      question_hi:
        "एक paragraph लिखें — 8 से 12 वाक्य — एक ChatGPT conversation को शुरू से अंत तक describe करते हुए।\n\nसभी 10 शब्दों का कम से कम एक बार इस्तेमाल करें। हर शब्द को bold करें या CAPITAL में लिखें:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nConversation बनाई हुई हो सकती है — real होना ज़रूरी नहीं। लेकिन हर शब्द का इस्तेमाल meaningful तरीके से होना चाहिए।\n\nएक document या अपने लिखे paragraph की image के रूप में upload करें।",
      question_te:
        "ఒక paragraph రాయండి — 8 నుంచి 12 సెంటెన్సులు — ఒక ChatGPT సంభాషణని మొదటి నుంచి చివరి వరకు చెప్పండి.\n\n10 పదాలనీ కనీసం ఒక్కసారైనా వాడండి. ప్రతి పదాన్ని bold చేయండి లేదా CAPITALS లో రాయండి:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nసంభాషణ మీరు ఊహించుకున్నది అయినా ఫర్వాలేదు — నిజంగా జరగాల్సిన అవసరం లేదు. కానీ ప్రతి పదం సరైన అర్థంలో వాడాలి.\n\nడాక్యుమెంట్‌గా లేదా మీరు రాసిన paragraph ఫోటోగా అప్‌లోడ్ చేయండి.",
      question_ta:
        "ஒரு paragraph எழுதுங்கள் — 8 முதல் 12 வாக்கியங்கள் — ஒரு ChatGPT உரையாடலை தொடக்கத்திலிருந்து இறுதி வரை விவரிக்கவும்.\n\nஅனைத்து 10 வார்த்தைகளையும் குறைந்தது ஒரு முறையாவது பயன்படுத்துங்கள்:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nஒரு document அல்லது image ஆக upload செய்யுங்கள்.",
      question_kn:
        "ಒಂದು paragraph ಬರೆಯಿರಿ — 8 ರಿಂದ 12 ವಾಕ್ಯಗಳು — ಒಂದು ChatGPT ಸಂಭಾಷಣೆಯನ್ನು ಆರಂಭದಿಂದ ಕೊನೆಯವರೆಗೆ ವಿವರಿಸಿ.\n\nಎಲ್ಲಾ 10 ಪದಗಳನ್ನು ಕನಿಷ್ಠ ಒಂದು ಬಾರಿ ಬಳಸಿ:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nಒಂದು document ಅಥವಾ image ಆಗಿ upload ಮಾಡಿ.",
      question_mr:
        "एक paragraph लिहा — 8 ते 12 वाक्यं — एका ChatGPT संभाषणाचं सुरुवातीपासून शेवटपर्यंत वर्णन करत.\n\nसर्व 10 शब्द कमीत कमी एकदा वापरा. प्रत्येक शब्द वापरताना तो bold करा किंवा CAPITAL मध्ये लिहा:\nAI · ML · Generative AI · LLM · Prompt · Token · Context Window · Model · Output · Hallucination\n\nसंभाषण काल्पनिक असलं तरी चालेल — ते खरं असण्याची गरज नाही. पण प्रत्येक शब्द खरोखर अर्थपूर्ण पद्धतीने वापरला गेला पाहिजे.\n\nएक document किंवा तुम्ही लिहिलेल्या paragraph ची image म्हणून upload करा.",
      rubric: `You are evaluating a submission for an AI literacy assignment called "The Full Chain".
The learner was asked to write a single paragraph of 8–12 sentences describing a ChatGPT conversation, using all 10 AI terms correctly (each marked in bold or CAPS):
AI, ML, Generative AI, LLM, Prompt, Token, Context Window, Model, Output, Hallucination.

Score out of 100:
- All 10 terms present (30 pts): Are all 10 terms used at least once? Deduct 3 pts per missing term.
- Correct usage (50 pts): Is each term used in a way that reflects its actual meaning? Simple sentences are fine — meaning must match. Deduct 5 pts per term used incorrectly.
- Coherence (10 pts): Does the paragraph tell a connected story of a conversation, not just a list of definitions?
- Length (10 pts): Is it 8–12 sentences?

On fail: name the specific term(s) used incorrectly and give a one-sentence hint about the correct meaning. Ask for only that fix — no full redo.`,
    },
    {
      id: "a10",
      question:
        "For the next 3 days — use ChatGPT once a day for any real task.\n\nEach day, log one entry:\nDay __ | What I asked | What I got | One word from the 10 that describes what happened\n\nExample:\nDay 1 | Draft an apology to my manager | 3-line message, professional tone | Output\nDay 2 | Explain what GST is | Clear explanation with an example | LLM\nDay 3 | Asked it to make my week schedule | Hallucinated a meeting I never mentioned | Hallucination\n\nUpload your 3-day log as a document or image.",
      question_hi:
        "अगले 3 दिनों के लिए — ChatGPT को दिन में एक बार किसी असली काम के लिए use करें।\n\nहर दिन एक entry log करें:\nDay __ | मैंने क्या पूछा | मुझे क्या मिला | 10 शब्दों में से एक जो describe करता हो\n\nExample:\nDay 1 | अपने manager को माफी का draft | 3-line message, professional tone | Output\nDay 2 | GST क्या है explain करो | Example के साथ clear explanation | LLM\nDay 3 | मेरा हफ्ते का schedule बनाओ | एक meeting hallucinate की जो मैंने कभी mention नहीं की | Hallucination\n\nअपना 3-day log एक document या image के रूप में upload करें।",
      question_te:
        "వచ్చే 3 రోజులు — ChatGPT ని రోజుకి ఒకసారి ఏదైనా real పని కోసం వాడండి.\n\nప్రతి రోజు ఒక entry రాయండి:\nDay __ | నేను ఏం అడిగాను | నాకు ఏం వచ్చింది | జరిగిన దాన్ని వివరించే 10 పదాల్లో ఒకటి\n\nఉదాహరణ:\nDay 1 | మేనేజర్‌కి సారీ మెసేజ్ డ్రాఫ్ట్ చెయ్యి | 3 లైన్ల మెసేజ్, professional tone | Output\nDay 2 | GST అంటే ఏంటో చెప్పు | ఉదాహరణతో క్లియర్ ఎక్స్‌ప్లనేషన్ | LLM\nDay 3 | నా వీక్ షెడ్యూల్ చెయ్యి | నేను చెప్పని meeting ని hallucinate చేసింది | Hallucination\n\nమీ 3-day log ని document లేదా image గా అప్‌లోడ్ చేయండి.",
      question_ta:
        "அடுத்த 3 நாட்களுக்கு — ChatGPT ஐ ஒரு நாளில் ஒரு முறை உண்மையான வேலைக்கு பயன்படுத்துங்கள்.\n\nஒவ்வொரு நாளும் ஒரு entry log செய்யுங்கள்:\nDay __ | நான் என்ன கேட்டேன் | நான் என்ன பெற்றேன் | விவரிக்கும் 10 வார்த்தைகளில் ஒன்று\n\nஉங்கள் 3-day log ஐ document அல்லது image ஆக upload செய்யுங்கள்.",
      question_kn:
        "ಮುಂದಿನ 3 ದಿನಗಳು — ChatGPT ಅನ್ನು ದಿನಕ್ಕೊಮ್ಮೆ ನಿಜವಾದ ಕೆಲಸಕ್ಕಾಗಿ ಬಳಸಿ.\n\nಪ್ರತಿ ದಿನ ಒಂದು entry log ಮಾಡಿ:\nDay __ | ನಾನು ಏನು ಕೇಳಿದೆ | ನಾನು ಏನು ಪಡೆದೆ | ವಿವರಿಸುವ 10  ಪದಗಳಲ್ಲಿ ಒಂದು\n\nನಿಮ್ಮ 3-day log ಅನ್ನು document ಅಥವಾ image ಆಗಿ upload ಮಾಡಿ.",
      question_mr:
        "पुढच्या 3 दिवसांसाठी — ChatGPT ला दिवसातून एकदा कोणत्याही खऱ्या कामासाठी वापरा.\n\nदररोज एक entry log करा:\nDay __ | मी काय विचारलं | मला काय मिळालं | जे घडलं ते describe करणारा 10 शब्दांपैकी एक\n\nExample:\nDay 1 | माझ्या manager ला माफीचा draft | 3-line message, professional tone | Output\nDay 2 | GST म्हणजे काय explain कर | उदाहरणासह clear explanation | LLM\nDay 3 | माझं आठवड्याचं schedule बनव | मी कधीही न सांगितलेली एक meeting hallucinate केली | Hallucination\n\nतुमचा 3-day log एक document किंवा image म्हणून upload करा.",
      rubric: `You are evaluating a submission for an AI literacy assignment called "Three Days, One AI".
The learner was asked to use ChatGPT once a day for 3 days and log each session: what they asked, what they got, and one term from the 10 AI words that describes what happened.

Score out of 100:
- 3 entries present (30 pts): Are there 3 distinct log entries? Entries across at least 2 different days. Using the same task or same term all 3 days reduces the score (habit repetition without learning).
- Term usage accuracy (40 pts): Does the chosen term for each day actually match what happened in that conversation? "Output" every single day without variety scores poorly — it suggests surface-level engagement.
- Genuine use shown (20 pts): Do the descriptions suggest real ChatGPT conversations (not made up or trivial)? Specific outputs ("3-line message", "hallucinated a meeting") score higher than vague ones ("got an answer").
- Completeness (10 pts): Does each entry have all 3 parts: what asked, what got, one term?

On fail: identify the specific day(s) missing a term or with incorrect term usage. Ask only for that fix — not a full redo.`,
    },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/** Returns one random assignment for the lesson, or null if no pool exists. */
export function pickAssignmentForLesson(lessonTitle: string): Assignment | null {
  const pool = LESSON_ASSIGNMENTS[lessonTitle];
  if (!pool || pool.length === 0) return null;
  return shuffle(pool)[0];
}

export function assignmentQuestion(a: Assignment, lang: Lang): string {
  if (lang === "hi" && a.question_hi) return a.question_hi;
  if (lang === "te" && a.question_te) return a.question_te;
  if (lang === "ta" && a.question_ta) return a.question_ta;
  if (lang === "kn" && a.question_kn) return a.question_kn;
  if (lang === "mr" && a.question_mr) return a.question_mr;
  return a.question;
}
