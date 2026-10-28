import { useState, useRef, useEffect } from "react";
import { Send, Smile, X, Hand, Plus } from "lucide-react";

export default function ChatPanel({
  isOpen = true,
  messages = [],
  onSend,
  onClose,
  typingNotice = "Rithu Singh is typing...",
}) {
  const [draft, setDraft] = useState("");
  const [filterTab, setFilterTab] = useState("everyone"); // "everyone" | "private"
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  function submit(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (onSend) onSend(text);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  }

  if (!isOpen) return null;

  return (
    <aside className="mr-sidebar mr-chat-sidebar" aria-label="Meeting Chat">
      {/* Header */}
      <div className="mr-sidebar-head">
        <div>
          <h2>Chat</h2>
        </div>
        <button
          type="button"
          className="mr-icon-button"
          onClick={onClose}
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Everyone / Private Pill Switch */}
      <div className="mr-chat-filter-wrap">
        <div className="mr-chat-pill-switch" role="tablist">
          <button
            type="button"
            className={filterTab === "everyone" ? "active" : ""}
            onClick={() => setFilterTab("everyone")}
            role="tab"
            aria-selected={filterTab === "everyone"}
          >
            Everyone
          </button>
          <button
            type="button"
            className={filterTab === "private" ? "active" : ""}
            onClick={() => setFilterTab("private")}
            role="tab"
            aria-selected={filterTab === "private"}
          >
            Private
          </button>
        </div>
      </div>

      {/* Date Divider */}
      <div className="mr-chat-day-divider">
        <span>Today</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="mr-chat-messages-container">
        {messages.map((m) => {
          if (m.isSystem) {
            return (
              <div className="mr-chat-system-event" key={m.id}>
                {m.type === "hand" && <Hand size={13} className="mr-hand-system-icon" />}
                <span>{m.text}</span>
              </div>
            );
          }

          const isMe = m.sender === "You" || m.isYou;

          return (
            <div
              className={`mr-chat-bubble-row ${isMe ? "mine" : "theirs"}`}
              key={m.id}
            >
              {!isMe && (
                <span
                  className={`mr-chat-avatar ${
                    m.color === "orange" ? "mr-orange" : "mr-teal"
                  }`}
                >
                  {m.initials || m.sender.slice(0, 2).toUpperCase()}
                </span>
              )}

              <div className="mr-chat-bubble-content">
                <div className="mr-chat-meta">
                  <strong>{m.sender}</strong>
                  {m.role === "Host" && <span className="mr-chat-host-tag">Host</span>}
                  <small>{m.time}</small>
                </div>
                <div className="mr-chat-bubble">
                  <p>{m.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingNotice && (
          <div className="mr-chat-typing-indicator">
            <em>{typingNotice}</em>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form className="mr-chat-composer-row" onSubmit={submit}>
        <div className="mr-chat-input-box">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            aria-label="Type in-meeting message"
          />
          <button
            type="button"
            className="mr-chat-emoji-btn"
            onClick={() => setDraft((d) => d + " 👍")}
            title="Add reaction"
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          type="submit"
          className="mr-chat-send-btn"
          disabled={!draft.trim()}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
