"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Books,
  Image,
  ClipboardText,
  ListChecks,
  Seal,
  Spinner,
  Microphone,
  Stop,
} from "@phosphor-icons/react";
import type { Message, AgentType } from "@/lib/types";
import { AGENT_META } from "@/lib/types";
import { getToken, getUser } from "@/lib/auth";
import { getWebSocketUrl } from "@/lib/api";
import { useLang } from "@/lib/use-lang";
import type { Lang } from "@/lib/use-lang";

const ease: [number, number, number, number] = [0.23, 1, 0.32, 1];

// Greeting messages shown before the backend responds — in the learner's language
const GREETINGS: Record<Lang, { welcome: string; offline: string }> = {
  en: {
    welcome:
      "Welcome to your AI literacy course. I'm your Teacher agent. Let's begin with your current module — or ask me anything about AI to get started.",
    offline:
      "Welcome. The backend is not connected yet — this is a preview of the interface. When the server is running, your messages will route to the appropriate specialist agent automatically.",
  },
  hi: {
    welcome:
      "आपके AI साक्षरता कोर्स में स्वागत है। मैं आपका Teacher एजेंट हूँ। आइए आपके मौजूदा मॉड्यूल से शुरू करें — या शुरू करने के लिए मुझसे AI के बारे में कुछ भी पूछें।",
    offline:
      "स्वागत है। बैकएंड अभी कनेक्ट नहीं है — यह इंटरफ़ेस का प्रीव्यू है। सर्वर चालू होने पर आपके संदेश अपने आप सही एजेंट तक पहुँच जाएंगे।",
  },
  mr: {
    welcome:
      "तुमच्या AI साक्षरता कोर्समध्ये स्वागत आहे. मी तुमचा Teacher एजंट आहे. चला तुमच्या सध्याच्या मॉड्यूलपासून सुरुवात करूया — किंवा सुरू करण्यासाठी मला AI बद्दल काहीही विचारा.",
    offline:
      "स्वागत आहे. बॅकएंड अजून कनेक्ट झालेले नाही — हे इंटरफेसचे प्रीव्ह्यू आहे. सर्व्हर सुरू असताना तुमचे संदेश आपोआप योग्य एजंटकडे जातील.",
  },
  te: {
    welcome:
      "మీ AI అక్షరాస్యత కోర్సుకు స్వాగతం. నేను మీ Teacher ఏజెంట్‌ని. మీ ప్రస్తుత మాడ్యూల్‌తో మొదలుపెడదాం — లేదా మొదలుపెట్టడానికి AI గురించి నన్ను ఏదైనా అడగండి.",
    offline:
      "స్వాగతం. బ్యాకెండ్ ఇంకా కనెక్ట్ అవ్వలేదు — ఇది ఇంటర్‌ఫేస్ ప్రివ్యూ. సర్వర్ రన్ అవుతున్నప్పుడు మీ మెసేజ్‌లు ఆటోమేటిక్‌గా సరైన ఏజెంట్‌కి వెళ్తాయి.",
  },
  ta: {
    welcome:
      "உங்கள் AI எழுத்தறிவு படிப்பிற்கு வரவேற்கிறோம். நான் உங்கள் Teacher ஏஜென்ட். உங்கள் தற்போதைய தொகுதியுடன் தொடங்குவோம் — அல்லது தொடங்க AI பற்றி என்னிடம் எதையும் கேளுங்கள்.",
    offline:
      "வரவேற்கிறோம். பேக்எண்ட் இன்னும் இணைக்கப்படவில்லை — இது இடைமுகத்தின் முன்னோட்டம். சர்வர் இயங்கும்போது உங்கள் செய்திகள் தானாகவே சரியான ஏஜென்ட்டுக்கு செல்லும்.",
  },
  kn: {
    welcome:
      "ನಿಮ್ಮ AI ಸಾಕ್ಷರತಾ ಕೋರ್ಸ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ Teacher ಏಜೆಂಟ್. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮಾಡ್ಯೂಲ್‌ನಿಂದ ಪ್ರಾರಂಭಿಸೋಣ — ಅಥವಾ ಪ್ರಾರಂಭಿಸಲು AI ಬಗ್ಗೆ ನನ್ನನ್ನು ಏನಾದರೂ ಕೇಳಿ.",
    offline:
      "ಸ್ವಾಗತ. ಬ್ಯಾಕೆಂಡ್ ಇನ್ನೂ ಸಂಪರ್ಕವಾಗಿಲ್ಲ — ಇದು ಇಂಟರ್‌ಫೇಸ್ ಪ್ರಿವ್ಯೂ. ಸರ್ವರ್ ಚಾಲನೆಯಲ್ಲಿರುವಾಗ ನಿಮ್ಮ ಸಂದೇಶಗಳು ತಾನಾಗಿಯೇ ಸರಿಯಾದ ಏಜೆಂಟ್‌ಗೆ ಹೋಗುತ್ತವೆ.",
  },
};

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  teacher: Books,
  illustrator: Image,
  examiner: ClipboardText,
  task_assigner: ListChecks,
  certifier: Seal,
  orchestrator: Spinner,
};

const AGENT_COLORS: Record<AgentType, string> = {
  teacher: "bg-emerald-100 text-emerald-700",
  illustrator: "bg-violet-100 text-violet-700",
  examiner: "bg-amber-100 text-amber-700",
  task_assigner: "bg-sky-100 text-sky-700",
  certifier: "bg-rose-100 text-rose-700",
  orchestrator: "bg-zinc-100 text-zinc-500",
};

// ---- Message bubble ----
const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="flex justify-end"
      >
        <div className="max-w-[70%] bg-zinc-900 text-white text-sm px-5 py-3.5 rounded-2xl rounded-tr-sm leading-relaxed">
          {msg.content}
        </div>
      </motion.div>
    );
  }

  const agent = msg.agent ?? "orchestrator";
  const Icon = AGENT_ICONS[agent];
  const colorClass = AGENT_COLORS[agent];
  const meta = AGENT_META[agent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="flex items-start gap-3"
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass} mt-0.5`}
      >
        <Icon size={15} weight="duotone" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-zinc-400 mb-1.5">
          {meta.label}
        </div>
        {msg.imageUrl ? (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={msg.imageUrl}
              alt="Visual explanation"
              className="rounded-xl border border-zinc-200 max-w-[360px] w-full"
            />
          </div>
        ) : null}
        <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    </motion.div>
  );
});

// ---- Typing indicator ----
function TypingIndicator({ agent }: { agent: AgentType }) {
  const Icon = AGENT_ICONS[agent];
  const colorClass = AGENT_COLORS[agent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3"
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
      >
        <Icon size={15} weight="duotone" />
      </div>
      <div className="flex items-center gap-1.5 py-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---- Context panel ----
function ContextPanel({
  activeAgent,
  messageCount,
}: {
  activeAgent: AgentType | null;
  messageCount: number;
}) {
  const AGENTS: AgentType[] = [
    "teacher",
    "illustrator",
    "examiner",
    "task_assigner",
    "certifier",
  ];

  return (
    <div className="w-64 shrink-0 hidden lg:flex flex-col border-l border-zinc-200 bg-white">
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
          Active session
        </div>
        <div className="text-sm font-semibold text-zinc-900 mt-1">
          {messageCount} messages
        </div>
      </div>

      <div className="px-5 py-4 flex-1">
        <div className="text-xs font-medium text-zinc-400 mb-3">
          Specialist agents
        </div>
        <div className="flex flex-col gap-2">
          {AGENTS.map((a) => {
            const Icon = AGENT_ICONS[a];
            const isActive = a === activeAgent;
            const meta = AGENT_META[a];
            return (
              <div
                key={a}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive ? "bg-zinc-100" : ""
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${AGENT_COLORS[a]}`}
                >
                  <Icon size={12} weight="duotone" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-zinc-900" : "text-zinc-500"
                  }`}
                >
                  {meta.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-zinc-100 text-xs text-zinc-400 leading-relaxed">
        Messages are routed to the right specialist automatically. You never
        need to address an agent by name.
      </div>
    </div>
  );
}

// ---- Main interface ----
export function ChatInterface() {
  const lang = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType | null>("teacher");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    const url = getWebSocketUrl(user.id);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Initial greeting from orchestrator
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          agent: "teacher",
          content: (GREETINGS[lang] ?? GREETINGS.en).welcome,
          timestamp: new Date(),
        },
      ]);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as {
        id: string;
        agent: AgentType;
        content: string;
        imageUrl?: string;
      };
      setLoading(false);
      setActiveAgent(data.agent);
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          role: "assistant",
          agent: data.agent,
          content: data.content,
          imageUrl: data.imageUrl,
          timestamp: new Date(),
        },
      ]);
    };

    ws.onerror = () => {
      setConnected(false);
      // Offline mode: simulate the teacher responding
      setMessages([
        {
          id: "offline-welcome",
          role: "assistant",
          agent: "teacher",
          content: (GREETINGS[lang] ?? GREETINGS.en).offline,
          timestamp: new Date(),
        },
      ]);
    };

    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const msg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");
    setLoading(true);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: text }));
    } else {
      // Offline simulation
      setTimeout(() => {
        setLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            agent: "teacher",
            content:
              "That's a great question. Connect the backend to get a real response from your specialist agents. Once running, the orchestrator will route your message to the most appropriate agent — Teacher, Examiner, Illustrator, Task Assigner, or Certifier.",
            timestamp: new Date(),
          },
        ]);
      }, 1200);
    }
  }, [input, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] md:h-[100dvh]">
      {/* Chat column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-zinc-200 bg-white flex items-center px-4 md:px-6 gap-3 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-zinc-300"
            }`}
          />
          <span className="text-sm font-medium text-zinc-700">
            Cosmoplex
          </span>
          {activeAgent && (
            <span className="text-xs text-zinc-400">
              — {AGENT_META[activeAgent].label} active
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-xs">
                <div className="text-zinc-300 text-4xl mb-4 font-mono">Cx</div>
                <div className="text-zinc-500 text-sm leading-relaxed">
                  Your AI literacy course is ready. Type anything to begin.
                </div>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && activeAgent && (
              <TypingIndicator key="typing" agent={activeAgent} />
            )}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-400 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, or type your exam answer..."
                className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 resize-none outline-none leading-relaxed max-h-40 min-h-[24px]"
              />
              <div className="flex items-center gap-2 shrink-0 pb-0.5">
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
                  title="Voice input"
                >
                  <Microphone size={15} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center disabled:opacity-30 hover:bg-zinc-700 transition-colors active:scale-[0.95]"
                >
                  {loading ? (
                    <Stop size={13} weight="fill" />
                  ) : (
                    <ArrowUp size={14} weight="bold" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-400 text-center mt-2">
              Shift+Enter for new line. Enter to send.
            </p>
          </div>
        </div>
      </div>

      {/* Context panel */}
      <ContextPanel
        activeAgent={activeAgent}
        messageCount={messages.length}
      />
    </div>
  );
}
