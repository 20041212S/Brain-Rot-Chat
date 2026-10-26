import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { CircleStop, Menu, Plus, Send, Settings2, Skull, Zap } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };
// In production the frontend and backend share one Vercel domain, so relative
// /api calls are proxied by vercel.json. Local dev defaults to the local backend.
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

const starters = [
  { icon: "💀", title: "Destroy my code", prompt: "Roast this code brutally in full brainrot mode, don't hold back, then show me how to write it properly: " },
  { icon: "⚡", title: "Unfiltered reality check", prompt: "Give me the brutal, unvarnished reality check on this idea, zero corporate filter: " },
  { icon: "🧠", title: "Explain like I'm cooked", prompt: "Explain quantum computing like I have 2 braincells left, am chronically online, and need actual brainrot slang." },
  { icon: "🔥", title: "Roast my life choices", prompt: "I haven't touched grass in 3 days and I'm starting another unfinished side project. Roast me in full brainrot." },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
        body: JSON.stringify({ messages: next }),
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
    <div className="app-shell theme-uncensored">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Skull size={22} />
          </div>
          <div>
            <div className="brand-name">brainrot<span>.</span></div>
            <div className="brand-sub">UNCENSORED · ZERO FILTER</div>
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

        <div className="side-label">MODE</div>
        <div className="side-modes">
          <div className="side-link active uncensored">
            <Skull size={16} /> Uncensored <span className="mode-badge uncensored">Savage</span>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-light" />
            <div>
              <strong>Mode Active</strong>
              <small>Savage &amp; Dark Comedy</small>
            </div>
            <Zap size={15} />
          </div>
          <div className="profile">
            <div className="avatar">💀</div>
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
            Workspace <span>/</span> <strong>UNCENSORED MODE</strong>
          </div>

          <div className="top-actions">
            <div className="mode-segmented-control">
              <span className="seg-btn active uncensored" title="Uncensored is the only mode">
                <Skull size={13} />
                <span>Uncensored</span>
              </span>
            </div>
          </div>
        </header>

        <section className={`conversation ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="hero-icon">
                <Skull size={34} />
                <span className="hero-spark">💀</span>
              </div>
              <div className="eyebrow">
                <span />
                TERMINALLY UNHINGED &amp; UNCENSORED
              </div>
              <h1>
                Brain cooked.<br /><span>Zero filter attached.</span>
              </h1>
              <p className="hero-copy">
                Brutal reality checks, dark humor, and chronically-online slang. No corporate HR talk.
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
                <Skull size={14} /> Uncensored mode active · Brutal comedy, dark truth, zero sugarcoating
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((m, i) => (
                <article className={`message ${m.role}`} key={i}>
                  <div className={`message-avatar ${m.role}`}>
                    {m.role === "user" ? "YOU" : <Skull size={17} />}
                  </div>
                  <div className="message-body">
                    <div className="message-label">
                      {m.role === "user" ? "YOU" : "BRAINROT AI"}
                    </div>
                    <div className="message-content">{m.content}</div>
                  </div>
                </article>
              ))}
              {busy && (
                <article className="message assistant">
                  <div className="message-avatar assistant">
                    <Skull size={17} />
                  </div>
                  <div className="message-body">
                    <div className="message-label">BRAINROT AI</div>
                    <div className="thinking">
                      <i /><i /><i />
                      formulating a lethal reality check...
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
              placeholder="Say something unhinged. Ask for brutal feedback. No filter..."
              rows={1}
              disabled={busy}
            />
            <div className="composer-footer">
              <div className="composer-tools">
                <span className="tool-chip">
                  <Skull size={13} /> Uncensored Protocol
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
            Dark humor &amp; savage roasts enabled. Truth over feelings.
          </div>
        </div>
      </main>
    </div>
  );
}
