import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  LifeBuoy,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Video,
  Wifi,
  X,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import Toast from "../components/Toast";
import { SupportSkeleton } from "../components/Skeletons";
import { useSkeleton } from "../hooks/useSkeleton";
import { useToast } from "../hooks/useToast";
import { useEscape } from "../hooks/useEscape";
import { playTone } from "../utils/feedback";

const categories = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Create, join, and manage your first meeting.",
    icon: Video,
    color: "teal",
    articles: [
      "Create your first meeting",
      "Join a meeting with a code",
      "Invite teammates to a meeting",
    ],
  },
  {
    id: "audio-video",
    title: "Audio & video",
    description: "Camera, microphone, and speaker troubleshooting.",
    icon: Wifi,
    color: "blue",
    articles: [
      "Allow camera and microphone access",
      "Select the right audio device",
      "Improve call quality on slow networks",
    ],
  },
  {
    id: "account",
    title: "Account & settings",
    description: "Manage your profile and preferences.",
    icon: ShieldCheck,
    color: "purple",
    articles: [
      "Update your profile details",
      "Manage notification preferences",
      "Keep your account secure",
    ],
  },
  {
    id: "meetings",
    title: "Meetings & controls",
    description: "Learn about participants and meeting controls.",
    icon: BookOpen,
    color: "orange",
    articles: [
      "Share a meeting link",
      "Manage meeting participants",
      "Use chat and screen sharing",
    ],
  },
];
const faqs = [
  {
    q: "How do I create a new meeting?",
    a: "Open Home and select New meeting. Choose Start instant or Schedule for later, then copy the meeting code or link to share it with attendees.",
  },
  {
    q: "Why can't other participants hear me?",
    a: "Check that your browser has microphone permission, confirm the correct input device is selected, and make sure your microphone is not muted.",
  },
  {
    q: "Can I join a meeting without an account?",
    a: "Guest access depends on the meeting and backend permissions. In this demo, sign-in is required to access the meeting workspace.",
  },
  {
    q: "How do I change my notification preferences?",
    a: "Open Settings, select Notifications, update your preferences, and save your changes. The current demo stores these preferences locally.",
  },
];
const TOPICS = [
  "Getting started",
  "Audio & video",
  "Account & settings",
  "Meetings & controls",
  "Something else",
];

export default function SupportPage() {
  const loading = useSkeleton(450);
  const { toast, show, hide } = useToast();
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).toLowerCase();
  const [openFaq, setOpenFaq] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  useEscape(contactOpen, () => setContactOpen(false));

  const filteredCategories = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          articles: c.articles.filter((a) =>
            `${c.title} ${c.description} ${a}`.toLowerCase().includes(q),
          ),
        }))
        .filter(
          (c) =>
            !q ||
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.articles.length,
        ),
    [q],
  );
  const filteredFaqs = useMemo(
    () => faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(q)),
    [q],
  );

  async function sendRequest(e) {
    e.preventDefault();
    if (message.trim().length < 10) {
      setFormError(
        "Tell us a bit more so we can help (at least 10 characters).",
      );
      playTone("error");
      return;
    }
    setFormError("");
    setSending(true);
    await new Promise((r) => setTimeout(r, 700)); // simulates the API call; replace with your support endpoint
    setSending(false);
    setContactOpen(false);
    setMessage("");
    show("Request sent. We'll reply by email.");
  }

  return (
    <DashboardLayout
      page="support"
      searchPlaceholder="Search help articles, guides, or FAQs"
      onSearch={setQuery}
    >
      {loading ? (
        <SupportSkeleton />
      ) : (
        <>
          <section className="em-support-hero">
            <span className="em-support-kicker">
              <LifeBuoy size={14} /> EUODOO MEET HELP CENTER
            </span>
            <h1> How can we help you?</h1>
            <p>
              Find answers, explore quick guides, or get help with your meetings
              and workspace.
            </p>
            <label className="em-support-search">
              <Search size={19} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, settings, audio or video..."
                aria-label="Search help articles"
              />
              <kbd>Enter</kbd>
            </label>
            <div className="em-support-quick-links">
              <span onClick={() => setQuery("Setup guides")}>
                <i /> Setup guides
              </span>
              <span onClick={() => setQuery("Troubleshooting")}>
                <i /> Troubleshooting
              </span>
              <span onClick={() => setQuery("Meeting controls")}>
                <i /> Meeting controls
              </span>
            </div>
          </section>

          <section className="em-support-section">
            <div className="em-section-title">
              <div>
                <span className="em-page-kicker">BROWSE BY TOPIC</span>
                <h2>What do you need help with?</h2>
                <p>Choose a category to find relevant guides and answers.</p>
              </div>
              <span className="em-result-count">
                {filteredCategories.length} categories
              </span>
            </div>
            <div className="em-support-grid">
              {filteredCategories.map(
                ({ id, title, description, icon: Icon, color, articles }) => (
                  <article className="em-support-card" key={id}>
                    <span className={`em-support-icon ${color}`}>
                      <Icon size={21} />
                    </span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="em-article-list">
                      {articles.map((a) => (
                        <button
                          key={a}
                          onClick={() => {
                            setQuery(a);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          {a}
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  </article>
                ),
              )}
            </div>
            {filteredCategories.length === 0 && (
              <div className="em-support-empty">
                <Search size={25} />
                <b>No help topics found</b>
                <span>Try a different keyword.</span>
              </div>
            )}
          </section>

          <section className="em-support-section em-faq-section">
            <div className="em-section-title">
              <div>
                <span className="em-page-kicker">QUICK ANSWERS</span>
                <h2>Frequently asked questions</h2>
                <p>Common questions about using Euodoo Meet.</p>
              </div>
              <CircleHelp size={25} className="em-faq-heading-icon" />
            </div>
            <div className="em-faq-list">
              {filteredFaqs.map((faq, i) => (
                <article
                  className={`em-faq-item ${openFaq === i ? "open" : ""}`}
                  key={faq.q}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </button>
                  {openFaq === i && <p>{faq.a}</p>}
                </article>
              ))}
              {filteredFaqs.length === 0 && (
                <p className="em-no-faqs">No FAQs match your search.</p>
              )}
            </div>
          </section>

          <section className="em-contact-banner">
            <span className="em-contact-icon">
              <MessageCircle size={23} />
            </span>
            <div>
              <h2>Still need a hand?</h2>
              <p>
                Reach out to our support team and tell us what you're running
                into.
              </p>
            </div>
            <button
              onClick={() => {
                setFormError("");
                setContactOpen(true);
              }}
            >
              <Mail size={16} /> Contact support
            </button>
          </section>
        </>
      )}

      {contactOpen && (
        <div
          className="em-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setContactOpen(false);
          }}
        >
          <section
            className="em-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="em-contact-title"
          >
            <button
              className="em-modal-close"
              onClick={() => setContactOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="em-modal-icon">
              <Mail size={22} />
            </span>
            <h2 id="em-contact-title">Contact support</h2>
            <p>
              Describe what happened, which page you were on, and any error
              message you saw.
            </p>
            <form onSubmit={sendRequest}>
              <label className="em-field">
                Topic
                <select
                  className="em-text-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                >
                  {TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="em-field">
                Message
                <textarea
                  className="em-text-area"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  placeholder="What do you need help with?"
                  autoFocus
                />
              </label>
              {formError && (
                <div className="em-form-error" role="alert">
                  <X size={14} />
                  {formError}
                </div>
              )}
              <div className="em-modal-actions">
                <button
                  type="button"
                  className="em-button-secondary"
                  onClick={() => setContactOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="em-button-primary"
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 size={16} className="em-spin" />
                  ) : (
                    <Send size={16} />
                  )}{" "}
                  Send request
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      <Toast toast={toast} onClose={hide} />
    </DashboardLayout>
  );
}
