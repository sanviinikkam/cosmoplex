"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowClockwise,
  CheckCircle,
  FilePdf,
  FileDoc,
  Image,
  Sparkle,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import type { Assignment } from "@/lib/assignment-data";
import { assignmentQuestion } from "@/lib/assignment-data";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Lang } from "@/lib/use-lang";

interface Props {
  assignment: Assignment;
  lessonTitle: string;
  lang: Lang;
  onFinish: () => void;
}

type Phase = "upload" | "evaluating" | "result";

const ACCEPTED = ".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx";
const MAX_MB = 10;
const PASS_MARK = 75; // out of 100 — learner must reach this to continue

const ui = {
  en: {
    title: "Assignment",
    subtitle: "Upload your answer as an image or document",
    dragHint: "Drag & drop here, or click to browse",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — max 10 MB",
    submit: "Submit for Evaluation",
    evaluating: "AI is evaluating your submission…",
    yourScore: "Your Score",
    aiFeedback: "AI Feedback",
    continue: "Continue",
    removeFile: "Remove",
    errorSize: `File too large. Maximum size is ${MAX_MB} MB.`,
    errorType: "Unsupported file type. Upload an image, PDF, or Word document.",
    errorEmpty: "Please upload your file before submitting.",
    errorApi: "Evaluation failed. Please try again.",
    passLabel: "Passed",
    failLabel: "Not passed yet",
    resubmit: "Resubmit Assignment",
    improveScore: "Resubmit to improve score",
    failMsg: (mark: number) => `You need at least ${mark}/100 to continue. Read the feedback below and resubmit.`,
  },
  hi: {
    title: "असाइनमेंट",
    subtitle: "अपना जवाब इमेज या डॉक्यूमेंट के रूप में अपलोड करें",
    dragHint: "यहाँ खींचें और छोड़ें, या ब्राउज़ करें",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — अधिकतम 10 MB",
    submit: "मूल्यांकन के लिए जमा करें",
    evaluating: "AI आपकी सबमिशन का मूल्यांकन कर रही है…",
    yourScore: "आपका स्कोर",
    aiFeedback: "AI की प्रतिक्रिया",
    continue: "जारी रखें",
    removeFile: "हटाएं",
    errorSize: `फ़ाइल बहुत बड़ी है। अधिकतम आकार ${MAX_MB} MB है।`,
    errorType: "असमर्थित फ़ाइल प्रकार। इमेज, PDF या Word डॉक्यूमेंट अपलोड करें।",
    errorEmpty: "सबमिट करने से पहले अपनी फ़ाइल अपलोड करें।",
    errorApi: "मूल्यांकन विफल रहा। कृपया पुनः प्रयास करें।",
    passLabel: "पास हो गए",
    failLabel: "अभी पास नहीं हुए",
    resubmit: "फिर से जमा करें",
    improveScore: "स्कोर बढ़ाने के लिए फिर से जमा करें",
    failMsg: (mark: number) => `जारी रखने के लिए आपको कम से कम ${mark}/100 चाहिए। नीचे दी गई प्रतिक्रिया पढ़ें और फिर से जमा करें।`,
  },
  mr: {
    title: "असाइनमेंट",
    subtitle: "तुमचे उत्तर प्रतिमा किंवा दस्तऐवज म्हणून अपलोड करा",
    dragHint: "येथे ड्रॅग करा, किंवा ब्राउझ करा",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — कमाल 10 MB",
    submit: "मूल्यमापनासाठी सबमिट करा",
    evaluating: "AI तुमच्या सबमिशनचे मूल्यमापन करत आहे…",
    yourScore: "तुमचा स्कोर",
    aiFeedback: "AI अभिप्राय",
    continue: "पुढे सुरू ठेवा",
    removeFile: "काढून टाका",
    errorSize: `फाइल खूप मोठी आहे. कमाल आकार ${MAX_MB} MB आहे.`,
    errorType: "असमर्थित फाइल प्रकार. प्रतिमा, PDF किंवा Word दस्तऐवज अपलोड करा.",
    errorEmpty: "सबमिट करण्यापूर्वी आपली फाइल अपलोड करा.",
    errorApi: "मूल्यमापन अयशस्वी झाले. पुन्हा प्रयत्न करा.",
    passLabel: "पास झालात",
    failLabel: "अजून पास नाही",
    resubmit: "पुन्हा सबमिट करा",
    improveScore: "स्कोअर वाढवण्यासाठी पुन्हा सबमिट करा",
    failMsg: (mark: number) => `पुढे जाण्यासाठी तुम्हाला किमान ${mark}/100 हवे. खालील अभिप्राय वाचा आणि पुन्हा सबमिट करा.`,
  },
  te: {
    title: "అసైన్‌మెంట్",
    subtitle: "మీ ఆన్సర్‌ని ఫోటోగా లేదా డాక్యుమెంట్‌గా అప్‌లోడ్ చేయండి",
    dragHint: "ఇక్కడ డ్రాగ్ & డ్రాప్ చేయండి, లేదా బ్రౌజ్ చేయండి",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — మ్యాక్స్ 10 MB",
    submit: "ఎవాల్యుయేషన్ కోసం సబ్మిట్ చేయండి",
    evaluating: "AI మీ సబ్మిషన్‌ని చెక్ చేస్తోంది…",
    yourScore: "మీ స్కోర్",
    aiFeedback: "AI ఫీడ్‌బ్యాక్",
    continue: "కొనసాగించండి",
    removeFile: "తీసేయండి",
    errorSize: `ఫైల్ చాలా పెద్దగా ఉంది. మ్యాక్స్ సైజ్ ${MAX_MB} MB.`,
    errorType: "ఈ ఫైల్ టైప్ సపోర్ట్ అవ్వదు. ఫోటో, PDF లేదా Word డాక్యుమెంట్ అప్‌లోడ్ చేయండి.",
    errorEmpty: "సబ్మిట్ చేసే ముందు మీ ఫైల్ అప్‌లోడ్ చేయండి.",
    errorApi: "ఎవాల్యుయేషన్ ఫెయిల్ అయ్యింది. మళ్ళీ ట్రై చేయండి.",
    passLabel: "పాస్ అయ్యారు",
    failLabel: "ఇంకా పాస్ అవ్వలేదు",
    resubmit: "మళ్ళీ సబ్మిట్ చేయండి",
    improveScore: "స్కోర్ పెంచుకోవడానికి మళ్ళీ సబ్మిట్ చేయండి",
    failMsg: (mark: number) => `కొనసాగడానికి మీకు కనీసం ${mark}/100 కావాలి. కింద ఉన్న ఫీడ్‌బ్యాక్ చదివి మళ్ళీ సబ్మిట్ చేయండి.`,
  },
  ta: {
    title: "பணி",
    subtitle: "உங்கள் பதிலை படமாக அல்லது ஆவணமாக upload செய்யுங்கள்",
    dragHint: "இங்கே இழுத்து விடுங்கள், அல்லது browse செய்யுங்கள்",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — அதிகபட்சம் 10 MB",
    submit: "மதிப்பீட்டிற்கு சமர்பிக்கவும்",
    evaluating: "AI உங்கள் சமர்பிப்பை மதிப்பிடுகிறது…",
    yourScore: "உங்கள் மதிப்பெண்",
    aiFeedback: "AI கருத்து",
    continue: "தொடரவும்",
    removeFile: "அகற்று",
    errorSize: `கோப்பு மிகவும் பெரியது. அதிகபட்ச அளவு ${MAX_MB} MB.`,
    errorType: "ஆதரிக்கப்படாத கோப்பு வகை. படம், PDF அல்லது Word ஆவணம் upload செய்யுங்கள்.",
    errorEmpty: "சமர்பிக்கும் முன் உங்கள் கோப்பை upload செய்யுங்கள்.",
    errorApi: "மதிப்பீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
    passLabel: "தேர்ச்சி பெற்றீர்கள்",
    failLabel: "இன்னும் தேர்ச்சி பெறவில்லை",
    resubmit: "மீண்டும் சமர்பிக்கவும்",
    improveScore: "மதிப்பெண்ணை அதிகரிக்க மீண்டும் சமர்பிக்கவும்",
    failMsg: (mark: number) => `தொடர உங்களுக்கு குறைந்தது ${mark}/100 தேவை. கீழே உள்ள கருத்தை படித்து மீண்டும் சமர்பிக்கவும்.`,
  },
  kn: {
    title: "ನಿಯೋಜನೆ",
    subtitle: "ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಚಿತ್ರ ಅಥವಾ ದಾಖಲೆಯಾಗಿ upload ಮಾಡಿ",
    dragHint: "ಇಲ್ಲಿ ಎಳೆದು ಬಿಡಿ, ಅಥವಾ browse ಮಾಡಿ",
    fileTypes: "JPG · PNG · PDF · DOC · DOCX — ಗರಿಷ್ಠ 10 MB",
    submit: "ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ಸಲ್ಲಿಸಿ",
    evaluating: "AI ನಿಮ್ಮ ಸಲ್ಲಿಕೆಯನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತಿದೆ…",
    yourScore: "ನಿಮ್ಮ ಅಂಕ",
    aiFeedback: "AI ಪ್ರತಿಕ್ರಿಯೆ",
    continue: "ಮುಂದುವರಿಸಿ",
    removeFile: "ತೆಗೆದುಹಾಕಿ",
    errorSize: `ಫೈಲ್ ತುಂಬಾ ದೊಡ್ಡದು. ಗರಿಷ್ಠ ಗಾತ್ರ ${MAX_MB} MB.`,
    errorType: "ಬೆಂಬಲಿಸದ ಫೈಲ್ ಪ್ರಕಾರ. ಚಿತ್ರ, PDF ಅಥವಾ Word ದಾಖಲೆ upload ಮಾಡಿ.",
    errorEmpty: "ಸಲ್ಲಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಫೈಲ್ upload ಮಾಡಿ.",
    errorApi: "ಮೌಲ್ಯಮಾಪನ ವಿಫಲವಾಯಿತು. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    passLabel: "ಪಾಸ್ ಆಗಿದ್ದೀರಿ",
    failLabel: "ಇನ್ನೂ ಪಾಸ್ ಆಗಿಲ್ಲ",
    resubmit: "ಮತ್ತೆ ಸಲ್ಲಿಸಿ",
    improveScore: "ಸ್ಕೋರ್ ಹೆಚ್ಚಿಸಲು ಮತ್ತೆ ಸಲ್ಲಿಸಿ",
    failMsg: (mark: number) => `ಮುಂದುವರಿಯಲು ನಿಮಗೆ ಕನಿಷ್ಠ ${mark}/100 ಬೇಕು. ಕೆಳಗಿನ ಫೀಡ್‌ಬ್ಯಾಕ್ ಓದಿ ಮತ್ತೆ ಸಲ್ಲಿಸಿ.`,
  },
} as const;

function fileIcon(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return <FilePdf size={28} weight="fill" className="text-red-500" />;
  if (name.endsWith(".doc") || name.endsWith(".docx"))
    return <FileDoc size={28} weight="fill" className="text-blue-500" />;
  return <Image size={28} weight="fill" className="text-violet-500" />;
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= PASS_MARK ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f4f4f5" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono text-zinc-900">{score}</span>
        <span className="text-xs text-zinc-400">/100</span>
      </div>
    </div>
  );
}

export function VideoAssignment({ assignment, lessonTitle, lang, onFinish }: Props) {
  const t = ui[lang] ?? ui.en;
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndSet(f: File) {
    setError("");
    if (f.size > MAX_MB * 1024 * 1024) { setError(t.errorSize); return; }
    const name = f.name.toLowerCase();
    const isImage = /\.(jpg|jpeg|png|webp)$/.test(name);
    const isDoc = /\.(pdf|doc|docx)$/.test(name);
    if (!isImage && !isDoc) { setError(t.errorType); return; }
    setFile(f);
    if (isImage) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }

  async function handleSubmit() {
    if (!file) { setError(t.errorEmpty); return; }
    setError("");
    setPhase("evaluating");
    const token = getToken();
    if (!token) return;
    try {
      const result = await api.courses.evaluateAssignment(token, {
        file,
        lesson_title: lessonTitle,
        assignment_id: assignment.id,
        question: assignment.question,
        rubric: assignment.rubric,
        lang,
      });
      setScore(result.score);
      setFeedback(result.feedback);
      setPhase("result");
    } catch {
      setPhase("upload");
      setError(t.errorApi);
    }
  }

  function handleResubmit() {
    setPhase("upload");
    setFile(null);
    setPreview(null);
    setScore(null);
    setFeedback("");
    setError("");
  }

  // ── Result screen ────────────────────────────────────────────────────────────
  if (phase === "result" && score !== null) {
    const passed = score >= PASS_MARK;
    return (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <ScoreRing score={score} />
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">{t.yourScore}</p>
            <div className="flex items-center gap-2">
              {passed
                ? <CheckCircle size={20} weight="fill" className="text-emerald-500" />
                : <WarningCircle size={20} weight="fill" className="text-amber-500" />}
              <span className={`text-sm font-semibold ${passed ? "text-emerald-700" : "text-amber-700"}`}>
                {passed ? t.passLabel : t.failLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Sparkle size={12} weight="fill" className="text-violet-400" />
            {t.aiFeedback}
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed">{feedback}</p>
        </div>

        {passed ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button onClick={handleResubmit}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
              <ArrowClockwise size={14} weight="bold" />
              {t.improveScore}
            </button>
            <button onClick={onFinish}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">
              {t.continue}
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-amber-700">{t.failMsg(PASS_MARK)}</p>
            <button onClick={handleResubmit}
              className="self-end inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">
              <ArrowClockwise size={14} weight="bold" />
              {t.resubmit}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Evaluating screen ────────────────────────────────────────────────────────
  if (phase === "evaluating") {
    return (
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-10 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center">
          <Sparkle size={24} weight="fill" className="text-violet-500 animate-pulse" />
        </div>
        <p className="text-sm text-zinc-600">{t.evaluating}</p>
        <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-400 rounded-full animate-[loading_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  // ── Upload screen ────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
          <Sparkle size={13} weight="fill" className="text-violet-500" />
        </div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Assignment{lang !== "en" && ` · ${t.title}`}
        </p>
      </div>

      {/* Question */}
      <p className="text-zinc-900 font-medium leading-snug whitespace-pre-line">
        {assignmentQuestion(assignment, lang)}
      </p>

      {/* Drop zone or file preview */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-6 cursor-pointer transition-colors ${
            dragOver ? "border-violet-400 bg-violet-50" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
            <UploadSimple size={22} className="text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-zinc-700">{t.dragHint}</p>
          <p className="text-xs text-zinc-400">{t.fileTypes}</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSet(f); }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex items-center gap-4">
          {/* Image preview or file icon */}
          {preview ? (
            <img src={preview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-zinc-200 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              {fileIcon(file)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-800 truncate">{file.name}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={() => { setFile(null); setPreview(null); setError(""); }}
            className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash size={13} />
            {t.removeFile}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <WarningCircle size={13} weight="fill" />
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        className="self-end inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        {t.submit}
        <ArrowRight size={14} weight="bold" />
      </button>
    </div>
  );
}
