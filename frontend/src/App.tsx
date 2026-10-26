import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, CircleStop, Flame, Menu, Plus, Send, Settings2, ShieldAlert, Skull, Sparkles, Zap } from "lucide-react";

type Mode = "adaptive" | "roast" | "uncensored";
type ChatMessage = { role: "user" | "assistant"; content: string };
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const starters = [
  { icon: "💀", title: "Destroy my code", prompt: "Roast this code brutally, don't hold back, then show me how to write it properly: " },
  { icon: "⚡", title: "Unfiltered reality check", prompt: "Give me the brutal, unvarnished reality check on this idea: " },
  { icon: "🧠", title: "Explain like I'm cooked", prompt: "Explain quantum computing like I have 2 braincells left and watch TikTok 14 hours a day." },
  { icon: "🔥", title: "Roast my life choices", prompt: "I haven't touched grass in 3 days and I'm thinking of starting another unfinished side project. Roast me." },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<Mode>("uncensored");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Global shortcut for Cmd/Ctrl + K
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        newChat();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The model encountered an error.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reach the backend.";
      setError(`${message} Check that the backend is running and backend/.env is configured.`);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function keyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function newChat() {
    if (busy) return;
    setMessages([]);
    setError("");
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className={`app-shell theme-${mode}`}>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            {mode === "uncensored" ? <Skull size={22} /> : <Bot size={22} />}
          </div>
          <div>
            <div className="brand-name">brainrot<span>.</span></div>
            <div className="brand-sub">
              {mode === "uncensored" ? "UNCENSORED · ZERO FILTER" : "INTELLIGENCE, BUT COOKED"}
            </div>
          </div>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={18} />
          </button>
        </div>

        <button className="new-chat" onClick={newChat}>
          <Plus size={17} /> New chat <span>⌘ K</span>
        </button>

        <div className="side-label">SELECT PERSONALITY</div>
        <div className="side-modes">
          <button
            className={`side-link ${mode === "adaptive" ? "active" : ""}`}
            onClick={() => setMode("adaptive")}
          >
            <Sparkles size={16} /> Adaptive <span className="mode-badge">Chill</span>
          </button>
          <button
            className={`side-link ${mode === "roast" ? "active roast" : ""}`}
            onClick={() => setMode("roast")}
          >
            <Flame size={16} /> Roast Mode <span className="mode-badge roast">Spicy</span>
          </button>
          <button
            className={`side-link ${mode === "uncensored" ? "active uncensored" : ""}`}
            onClick={() => setMode("uncensored")}
          >
            <Skull size={16} /> Uncensored <span className="mode-badge uncensored">Savage</span>
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-light" />
            <div>
              <strong>Mode Active</strong>
              <small>
                {mode === "uncensored"
                  ? "Savage & Dark Comedy"
                  : mode === "roast"
                  ? "Flaming Roasts"
                  : "Chaotic Gen Z"}
              </small>
            </div>
            <Zap size={15} />
          </div>
          <div className="profile">
            <div className="avatar">
              {mode === "uncensored" ? "💀" : "B"}
            </div>
            <div>
              <strong>BRAINROT AI</strong>
              <small>v0.2 · dark uncensored</small>
            </div>
            <Settings2 size={16} />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="crumb">
            <button
              className="icon-button mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={18} />
            </button>
            Workspace <span>/</span> <strong>{mode.toUpperCase()} MODE</strong>
          </div>

          <div className="top-actions">
            <div className="mode-segmented-control">
              <button
                className={`seg-btn ${mode === "adaptive" ? "active" : ""}`}
                onClick={() => setMode("adaptive")}
                title="Adaptive: witty and balanced"
              >
                <Sparkles size={13} />
                <span>Adaptive</span>
              </button>
              <button
                className={`seg-btn ${mode === "roast" ? "active roast" : ""}`}
                onClick={() => setMode("roast")}
                title="Roast: sarcastic reality checks"
              >
                <Flame size={13} />
                <span>Roast</span>
              </button>
              <button
                className={`seg-btn ${mode === "uncensored" ? "active uncensored" : ""}`}
                onClick={() => setMode("uncensored")}
                title="Uncensored: brutal dark humor, zero filter"
              >
                <Skull size={13} />
                <span>Uncensored</span>
              </button>
            </div>
          </div>
        </header>

        <section className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="hero-icon">
                {mode === "uncensored" ? <Skull size={34} /> : <Bot size={34} />}
                <span className="hero-spark">
                  {mode === "uncensored" ? "💀" : "✳"}
                </span>
              </div>
              <div className="eyebrow">
                <span />
                {mode === "uncensored"
                  ? "TERMINALLY UNHINGED & UNCENSORED"
                  : "YOUR NEW INTERNET COMPANION"}
              </div>
              <h1>
                {mode === "uncensored" ? (
                  <>Brain cooked.<br /><span>Zero filter attached.</span></>
                ) : (
                  <>Big brain.<br /><span>Absolutely cooked.</span></>
                )}
              </h1>
              <p className="hero-copy">
                {mode === "uncensored"
                  ? "Brutal reality checks, dark humor, and chronically-online slang. No corporate HR talk."
                  : "Real answers with terminally online delivery. What are we cooking today?"}
              </p>
              <div className="starter-grid">
                {starters.map((s) => (
                  <button
                    className="starter"
                    key={s.title}
                    onClick={() => {
                      setInput(s.prompt);
                      inputRef.current?.focus();
                    }}
                  >
                    <span className="starter-icon">{s.icon}</span>
                    <span>
                      <strong>{s.title}</strong>
                      <small>
                        {s.title === "Destroy my code"
                          ? "Mock my bugs ruthlessly"
                          : s.title === "Unfiltered reality check"
                          ? "Tell me the honest truth"
                          : s.title === "Explain like I'm cooked"
                          ? "Knowledge, zero NPC energy"
                          : "Get humbled immediately"}
                      </small>
                    </span>
                    <span className="starter-arrow">↗</span>
                  </button>
                ))}
              </div>
              <div className="mode-note">
                {mode === "uncensored" ? (
                  <><Skull size={14} /> Uncensored mode active · Brutal comedy, dark truth, zero sugarcoating</>
                ) : mode === "roast" ? (
                  <><Flame size={14} /> Roast mode active · Your logic is on trial</>
                ) : (
                  <><Sparkles size={14} /> Adaptive mode · Reads the room, sharp when needed</>
                )}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((m, i) => (
                <article className={`message ${m.role}`} key={i}>
                  <div className={`message-avatar ${m.role}`}>
                    {m.role === "user" ? (
                      "YOU"
                    ) : mode === "uncensored" ? (
                      <Skull size={17} />
                    ) : (
                      <Bot size={17} />
                    )}
                  </div>
                  <div className="message-body">
                    <div className="message-label">
                      {m.role === "user" ? "YOU" : "BRAINROT AI"}
                      {m.role === "assistant" && (
                        <span className={`tag-${mode}`}> · {mode.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="message-content">{m.content}</div>
                  </div>
                </article>
              ))}
              {busy && (
                <article className="message assistant">
                  <div className="message-avatar assistant">
                    {mode === "uncensored" ? <Skull size={17} /> : <Bot size={17} />}
                  </div>
                  <div className="message-body">
                    <div className="message-label">BRAINROT AI</div>
                    <div className="thinking">
                      <i /><i /><i />
                      {mode === "uncensored"
                        ? "formulating a lethal reality check..."
                        : "cooking up a response..."}
                    </div>
                  </div>
                </article>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <div className="composer-wrap">
          {error && (
            <div className="error-banner">
              <strong>Issue:</strong> {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
          <form className="composer" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={keyDown}
              placeholder={
                mode === "uncensored"
                  ? "Say something unhinged. Ask for brutal feedback. No filter..."
                  : "Ask anything. Cook something. Be so for real..."
              }
              rows={1}
              disabled={busy}
            />
            <div className="composer-footer">
              <div className="composer-tools">
                <span className="tool-chip">
                  {mode === "uncensored" ? (
                    <><Skull size={13} /> Uncensored Protocol</>
                  ) : mode === "roast" ? (
                    <><Flame size={13} /> Roast Protocol</>
                  ) : (
                    <><Sparkles size={13} /> Adaptive Personality</>
                  )}
                </span>
                <span className="hint">Shift + Enter for new line · ⌘ K to clear</span>
              </div>
              <button
                className="send-button"
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Send message"
              >
                {busy ? <CircleStop size={17} /> : <Send size={17} />}
                <span>{busy ? "Cooking" : "Send"}</span>
              </button>
            </div>
          </form>
          <div className="disclaimer">
            {mode === "uncensored"
              ? "Dark humor & savage roasts enabled. Truth over feelings."
              : "BRAINROT AI can be confidently wrong. Verify important facts."}
          </div>
        </div>
      </main>
    </div>
  );
}
