"use client";
// Option A — Blank Canvas + Motion
// Centered editorial layout with entrance animations, floating mockup, scroll-triggered sections.

import { useEffect, useRef, useState } from "react";

const N = {
  bg: "#ffffff",
  bgAlt: "#f6f5f4",
  text: "rgba(0,0,0,0.95)",
  textSec: "#615d59",
  textMuted: "#a39e98",
  blue: "#0075de",
  border: "1px solid rgba(0,0,0,0.1)",
  shadow: "rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px 7.85px, rgba(0,0,0,0.02) 0px 0.8px 2.93px, rgba(0,0,0,0.01) 0px 0.175px 1.04px",
  font: "Geist, Inter, -apple-system, system-ui, sans-serif",
};

const TR = {
  badge: "SOSYAL MEDYA, BASİTLEŞTİRİLDİ",
  hero1: "Planla ve yayınla.",
  hero2: "Kaossuz.",
  subPre: "SM Planner, solo içerik üreticilerinin ve küçük ekiplerin Instagram, Facebook, LinkedIn ve TikTok'ta",
  subBold: "zamanlama ve yayın yapmasına",
  subPost: "yardımcı olur — tek bir sakin çalışma alanından.",
  cta1: "Ücretsiz başla",
  cta2: "Nasıl çalışır",
  navFeatures: "Özellikler",
  navSignin: "Giriş yap",
  navStart: "Ücretsiz başla",
  featTitle: "İhtiyacın olan her şey. Fazlası yok.",
  featSub: "Şişkinlik yok. Kurumsal menüler yok. Sadece işe yarayanlar.",
  features: [
    { title: "Önceden planla", desc: "Sürükle-bırak içerik takvimi. Her platformdaki her gönderiyi tek bir temiz görünümde gör.", icon: "📅" },
    { title: "Yapay zeka ile oluştur", desc: "Tek tıkla başlık, hashtag ve program oluştur. Gemini notunu okur ve metni yazar.", icon: "✦" },
    { title: "Her yerde yayınla", desc: "Instagram, Facebook, LinkedIn ve TikTok'a aynı anda gönder. Sekme değiştirme yok.", icon: "⟶" },
  ],
  platformsBadge: "HER PLATFORMDA YAYINLA",
  ctaTitle: "İçerik takviminiz sizi bekliyor.",
  ctaSub: "Daha akıllı planlayan içerik üreticileri ve ekiplere katılın.",
  ctaBtn: "Ücretsiz başla →",
  footerRights: "© 2025 Openborders. Tüm hakları saklıdır.",
  todayHeading: "Bugün",
  newPost: "+ Yeni Gönderi",
};

const EN = {
  badge: "SOCIAL MEDIA, SIMPLIFIED",
  hero1: "Plan and publish.",
  hero2: "Without the chaos.",
  subPre: "SM Planner helps solo creators and small teams",
  subBold: "schedule and publish",
  subPost: "across Instagram, Facebook, LinkedIn, and TikTok — from one calm workspace.",
  cta1: "Start for free",
  cta2: "See how it works",
  navFeatures: "Features",
  navSignin: "Sign in",
  navStart: "Get started free",
  featTitle: "Everything you need. Nothing you don't.",
  featSub: "No bloat. No enterprise menus. Just what works.",
  features: [
    { title: "Plan ahead", desc: "Drag-and-drop content calendar. See every post across every platform in one clean view.", icon: "📅" },
    { title: "Generate with AI", desc: "Write captions, hashtags, and schedules with one click. Gemini reads your brief and writes the copy.", icon: "✦" },
    { title: "Publish everywhere", desc: "Post to Instagram, Facebook, LinkedIn, and TikTok simultaneously. No switching tabs.", icon: "⟶" },
  ],
  platformsBadge: "PUBLISH TO EVERY PLATFORM",
  ctaTitle: "Your content calendar awaits.",
  ctaSub: "Join creators and teams who plan smarter.",
  ctaBtn: "Get started free →",
  footerRights: "© 2025 Openborders. All rights reserved.",
  todayHeading: "Today",
  newPost: "+ New Post",
};

const platforms = [
  { label: "Instagram", color: "#E1306C", bg: "#fce4ec" },
  { label: "Facebook", color: "#1877F2", bg: "#e8f0fe" },
  { label: "LinkedIn", color: "#0077B5", bg: "#e3f2fd" },
  { label: "TikTok", color: "#010101", bg: "#f0f0f0" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

function AppMockup({ t }: { t: typeof EN }) {
  const posts = [
    { platform: "IG", name: "Instagram", color: "#E1306C", time: "9:00 AM", text: "Excited to share our summer drop! 🌊 Swipe to see all 12 new designs and let us know your favourite.", status: "Scheduled" },
    { platform: "in", name: "LinkedIn", color: "#0077B5", time: "12:30 PM", text: "We're sharing our Q2 content strategy insights. Here's what worked, what didn't, and what we're doing next.", status: "Scheduled" },
    { platform: "TT", name: "TikTok", color: "#010101", time: "6:00 PM", text: "Behind the scenes of today's photoshoot. You won't believe how chaotic it actually was 😅", status: "Draft" },
  ];
  return (
    <div style={{ display: "flex", height: "380px", background: N.bg, border: N.border, borderRadius: "12px", overflow: "hidden", boxShadow: N.shadow, animation: "float 5s ease-in-out infinite" }}>
      <div style={{ width: "180px", background: N.bgAlt, borderRight: "1px solid rgba(0,0,0,0.08)", padding: "20px 12px", display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.3px", color: N.text, padding: "4px 8px", marginBottom: "16px" }}>SM Planner</div>
        {[{ label: "Dashboard", active: true }, { label: "Projects", active: false }, { label: "Settings", active: false }].map((item) => (
          <div key={item.label} style={{ padding: "6px 10px", borderRadius: "4px", fontSize: "13px", fontWeight: item.active ? 600 : 400, color: item.active ? "#fff" : N.textSec, background: item.active ? N.blue : "transparent" }}>{item.label}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: N.text, letterSpacing: "-0.3px" }}>{t.todayHeading}</div>
            <div style={{ fontSize: "12px", color: N.textMuted, marginTop: "2px" }}>3 posts scheduled</div>
          </div>
          <div style={{ background: N.blue, color: "#fff", padding: "5px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>{t.newPost}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {posts.map((post, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", animation: `slideIn 0.4s ease ${i * 120 + 400}ms both` }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: post.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{post.platform}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: N.textMuted, marginBottom: "3px" }}>{post.name} · {post.time}</div>
                <div style={{ fontSize: "13px", color: N.text, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{post.text}</div>
              </div>
              <div style={{ background: post.status === "Scheduled" ? "#f2f9ff" : N.bgAlt, color: post.status === "Scheduled" ? "#097fe8" : N.textSec, padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>{post.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompareBar() {
  return (
    <div style={{ background: N.bgAlt, borderTop: N.border, padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "13px", color: N.textMuted }}>Comparing designs:</span>
      <a href="/landing-a" style={{ fontSize: "13px", fontWeight: 700, color: N.blue, textDecoration: "none", padding: "4px 10px", background: "#f2f9ff", borderRadius: "4px" }}>A · Blank Canvas + Motion</a>
      <a href="/landing-b" style={{ fontSize: "13px", fontWeight: 500, color: N.textSec, textDecoration: "none", padding: "4px 10px" }}>B · Product-Led</a>
      <a href="/landing-c" style={{ fontSize: "13px", fontWeight: 500, color: N.textSec, textDecoration: "none", padding: "4px 10px" }}>C · Motion-First</a>
    </div>
  );
}

export default function LandingA() {
  const [lang, setLang] = useState<"en" | "tr">("en");
  const t = lang === "tr" ? TR : EN;

  return (
    <div style={{ fontFamily: N.font, background: N.bg, color: N.text, minHeight: "100vh", lineHeight: 1.5 }}>
      <style>{`
        @media (max-width: 767px) {
          nav.lp-nav { padding: 0 16px !important; }
          .lp-nav-hide { display: none !important; }
          section.lp-hero { padding: 56px 16px 40px !important; }
          section.lp-features { padding: 48px 16px 56px !important; }
          section.lp-platforms { padding: 56px 16px !important; }
          section.lp-cta { padding: 64px 16px !important; }
          footer.lp-footer { padding: 24px 16px !important; flex-direction: column !important; align-items: flex-start !important; }
          .lp-mockup-wrap { padding-left: 16px !important; padding-right: 16px !important; overflow-x: auto !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          nav.lp-nav { padding: 0 24px !important; }
          section.lp-hero { padding: 72px 24px 56px !important; }
          section.lp-features { padding: 56px 24px 64px !important; }
          section.lp-platforms { padding: 64px 24px !important; }
          section.lp-cta { padding: 80px 24px !important; }
          footer.lp-footer { padding: 28px 24px !important; }
          .lp-mockup-wrap { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="lp-nav" style={{ padding: "0 48px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(0,0,0,0.06)", position: "sticky", top: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", zIndex: 10, animation: "fadeDown 0.5s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.svg" alt="SM Planner" style={{ width: "34px", height: "34px", borderRadius: "7px" }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.3px" }}>SM Planner</div>
            <div style={{ fontSize: "11px", color: "#a39e98", fontWeight: 500 }}>by Openborders</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <a href="#features" className="lp-nav-hide" style={{ fontSize: "15px", fontWeight: 500, color: N.textSec, textDecoration: "none" }}>{t.navFeatures}</a>
          <a href="/login" className="lp-nav-hide" style={{ fontSize: "15px", fontWeight: 500, color: N.text, textDecoration: "none" }}>{t.navSignin}</a>
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "tr" : "en")}
            style={{
              fontSize: "13px", fontWeight: 600, color: N.textSec, background: N.bgAlt,
              border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px",
              padding: "5px 12px", cursor: "pointer", letterSpacing: "0.3px",
            }}
          >
            {lang === "en" ? "TR" : "EN"}
          </button>
          <a href="/signup" style={{ background: N.blue, color: "#fff", padding: "7px 16px", borderRadius: "4px", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>{t.navStart}</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero" style={{ padding: "108px 48px 72px", maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", background: "#f2f9ff", color: "#097fe8", borderRadius: "9999px", marginBottom: "28px", animation: "fadeDown 0.5s ease 0.1s both", overflow: "hidden", width: "220px" }}>
          <div className="iv-ticker" style={{ display: "flex", whiteSpace: "nowrap", animation: "ticker-v2 5s linear infinite", fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px" }}>
            <span style={{ padding: "4px 20px 4px 12px" }}>{t.badge}</span>
            <span style={{ padding: "4px 20px 4px 0" }}>{t.badge}</span>
          </div>
        </div>
        <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-2.125px", color: N.text, margin: "0 0 24px", animation: "fadeUp 0.65s ease 0.2s both" }}>
          {t.hero1}<br />{t.hero2}
        </h1>
        <p style={{ fontSize: "19px", fontWeight: 400, color: N.textSec, lineHeight: 1.55, maxWidth: "540px", margin: "0 auto 40px", animation: "fadeUp 0.65s ease 0.35s both" }}>
          {t.subPre}{" "}
          <span style={{ fontSize: "23px", fontWeight: 700, color: "rgba(0,0,0,0.93)", letterSpacing: "-0.35px" }}>{t.subBold}</span>{" "}
          {t.subPost}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.65s ease 0.48s both" }}>
          <a href="/signup" style={{ background: N.blue, color: "#fff", padding: "10px 22px", borderRadius: "4px", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>{t.cta1}</a>
          <a href="#features" style={{ background: "rgba(0,0,0,0.05)", color: N.text, padding: "10px 22px", borderRadius: "4px", fontSize: "15px", fontWeight: 500, textDecoration: "none" }}>{t.cta2}</a>
        </div>
      </section>

      {/* Product mockup */}
      <section className="lp-mockup-wrap" style={{ background: N.bgAlt, padding: "40px 48px 0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", animation: "fadeUp 0.8s ease 0.55s both" }}>
          <div style={{ display: "flex", height: "300px", background: N.bg, border: N.border, borderRadius: "12px", overflow: "hidden", boxShadow: N.shadow, animation: "float 5s ease-in-out infinite" }}>
            <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div style={{ fontSize: "17px", fontWeight: 700, color: N.text, letterSpacing: "-0.3px" }}>{t.todayHeading}</div>
                <div style={{ background: N.blue, color: "#fff", padding: "5px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>{t.newPost}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[{platform:"IG",name:"Instagram",color:"#E1306C",time:"9:00 AM",text:"Excited to share our summer drop! 🌊 Swipe to see all 12 new designs and let us know your favourite.",status:"Scheduled"},{platform:"in",name:"LinkedIn",color:"#0077B5",time:"12:30 PM",text:"We're sharing our Q2 content strategy insights. Here's what worked, what didn't, and what we're doing next.",status:"Scheduled"}].map((post,i)=>(
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: post.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{post.platform}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", color: N.textMuted, marginBottom: "3px" }}>{post.name} · {post.time}</div>
                      <div style={{ fontSize: "13px", color: N.text, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{post.text}</div>
                    </div>
                    <div style={{ background: "#f2f9ff", color: "#097fe8", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>Scheduled</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-features" style={{ background: N.bgAlt, padding: "72px 48px 80px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="iv1-head" style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-1px", marginBottom: "12px" }}>{t.featTitle}</h2>
            <p style={{ fontSize: "16px", color: N.textSec }}>{t.featSub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            {t.features.map((f, i) => (
              <div key={f.title} className={`iv1-c${i}`}>
                <div style={{ background: N.bg, border: N.border, borderRadius: "12px", padding: "28px", boxShadow: N.shadow, height: "100%" }}>
                  <div style={{ fontSize: "24px", marginBottom: "12px" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px", marginBottom: "8px" }}>{f.title}</h3>
                  <p style={{ fontSize: "15px", color: N.textSec, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="lp-platforms" style={{ padding: "80px 48px", textAlign: "center" }}>
        <FadeUp>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: N.textMuted, letterSpacing: "1px", marginBottom: "36px" }}>{t.platformsBadge}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
              {platforms.map((p) => (
                <div key={p.label} className="platform-dot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", border: N.border }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: p.color }}>{p.label.slice(0, 2)}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: N.textMuted }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* CTA */}
      <FadeUp>
        <section className="lp-cta" style={{ background: N.bgAlt, padding: "100px 48px", textAlign: "center" }}>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-1.5px", marginBottom: "16px" }}>{t.ctaTitle}</h2>
            <p style={{ fontSize: "18px", color: N.textSec, marginBottom: "36px" }}>{t.ctaSub}</p>
            <a href="/signup" style={{ background: N.blue, color: "#fff", padding: "12px 28px", borderRadius: "4px", fontSize: "16px", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>{t.ctaBtn}</a>
          </div>
        </section>
      </FadeUp>

      {/* Footer */}
      <footer className="lp-footer" style={{ padding: "32px 48px", borderTop: N.border, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.svg" alt="SM Planner" style={{ width: "29px", height: "29px", borderRadius: "6px" }} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: "15px" }}>SM Planner</div>
            <div style={{ fontSize: "11px", color: "#a39e98", fontWeight: 500 }}>by Openborders</div>
          </div>
        </div>
        <div style={{ fontSize: "13px", color: N.textMuted }}>{t.footerRights}</div>
        <div style={{ display: "flex", gap: "20px" }}>
          <a href="/login" style={{ fontSize: "13px", color: N.textSec, textDecoration: "none" }}>{t.navSignin}</a>
          <a href="/signup" style={{ fontSize: "13px", color: N.textSec, textDecoration: "none" }}>{t.navStart}</a>
        </div>
      </footer>

      <CompareBar />
    </div>
  );
}
