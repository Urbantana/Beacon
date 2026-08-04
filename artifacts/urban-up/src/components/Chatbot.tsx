import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  suggestions?: string[];
  links?: { label: string; labelAr: string; href: string }[];
}

const QUICK_QUESTIONS = {
  en: ["How do I earn points?", "Show me events", "Book a tour", "Report an issue"],
  ar: ["كيف أكسب نقاطًا؟", "أرني الفعاليات", "احجز جولة", "أبلغ عن مشكلة"],
};

export function Chatbot() {
  const { isRtl, lang } = useI18n();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "bot",
        text: lang === "ar"
          ? "مرحبًا! أنا مساعد بالتور 🗺️ كيف يمكنني مساعدتك اليوم؟"
          : "Hello! I'm your PalTur assistant 🗺️ How can I help you today?",
        suggestions: QUICK_QUESTIONS[lang],
      }]);
    }
  }, [isOpen, lang]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE}/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: location, lang }),
      });
      const data = await res.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: lang === "ar" ? data.replyAr : data.reply,
        suggestions: lang === "ar" ? data.suggestionsAr : data.suggestions,
        links: data.links,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: lang === "ar" ? "عذرًا، حدث خطأ. يرجى المحاولة مرة أخرى." : "Sorry, something went wrong. Please try again.",
      }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label={lang === "ar" ? "فتح المساعد" : "Open assistant"}
        >
          <MessageCircle className="size-6" />
          <span className="absolute -top-1 -right-1 size-4 rounded-full bg-green-500 border-2 border-background" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl shadow-2xl bg-background border border-border overflow-hidden transition-all",
            isMinimized ? "h-14" : "h-[500px]",
            isRtl && "right-auto left-6"
          )}
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 bg-primary text-primary-foreground shrink-0">
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{lang === "ar" ? "مساعد بالتور" : "PalTur Assistant"}</p>
                <p className="text-xs text-primary-foreground/70">{lang === "ar" ? "متصل" : "Online"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <Minimize2 className="size-4" />
              </button>
              <button onClick={() => { setIsOpen(false); setMessages([]); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(500px-112px)]">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? (isRtl ? "flex-row" : "flex-row-reverse") : "flex-row", isRtl && msg.role === "user" && "flex-row-reverse")}>
                    <div className={cn("size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "bot" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {msg.role === "bot" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                    </div>
                    <div className="max-w-[80%] space-y-2">
                      <div className={cn("rounded-2xl px-3 py-2 text-sm",
                        msg.role === "bot"
                          ? "bg-muted text-foreground rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm"
                      )}>
                        {msg.text}
                      </div>
                      {/* Quick reply suggestions */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => sendMessage(s)}
                              className="text-xs rounded-full border border-border px-2.5 py-1 hover:bg-muted transition-colors">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Links */}
                      {msg.links && msg.links.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.links.map((link, i) => (
                            <a key={i} href={link.href}
                              className="text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 hover:bg-primary/20 transition-colors"
                              onClick={() => setIsOpen(false)}>
                              → {lang === "ar" ? link.labelAr : link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className={cn("flex gap-2", isRtl && "flex-row-reverse")}>
                    <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Bot className="size-3.5" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 flex gap-1 items-center">
                      {[0,1,2].map(i => <div key={i} className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className={cn("flex items-center gap-2 p-3 border-t border-border", isRtl && "flex-row-reverse")}>
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                  placeholder={lang === "ar" ? "اكتب رسالة…" : "Type a message…"}
                  className="flex-1 text-sm"
                  disabled={isTyping}
                />
                <Button size="icon" className="size-9 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isTyping}>
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
