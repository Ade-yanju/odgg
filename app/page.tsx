import React from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"] });

const theme = {
  ink: "#1a1410",
  paper: "#f5f0e8",
  warm: "#c9a96e",
  warmDark: "#8b6b35",
  red: "#b5362a",
  muted: "#6b5e4e",
  border: "rgba(139, 107, 53, 0.25)",
};

export default function DeveloperNoticePage() {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      backgroundColor: theme.paper,
      color: theme.ink,
      fontFamily: dmSans.style.fontFamily, // Strict inline Next.js font
      minHeight: "100vh",
      overflowX: "hidden",
      position: "relative",
    },
    noise: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      pointerEvents: "none",
      zIndex: 0,
    },
    topBand: {
      backgroundColor: theme.ink,
      color: theme.warm,
      textAlign: "center",
      padding: "10px 1rem",
      fontSize: "11px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      position: "relative",
      zIndex: 10,
    },
    header: {
      position: "relative",
      zIndex: 10,
      borderBottom: `1px solid ${theme.border}`,
      padding: "2rem 2rem 1.5rem",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "1rem",
    },
    logoArea: { display: "flex", alignItems: "center", gap: "14px" },
    logoMark: {
      width: "44px",
      height: "44px",
      backgroundColor: theme.ink,
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    logoMarkSpan: {
      color: theme.warm,
      fontFamily: playfair.style.fontFamily,
      fontSize: "20px",
      fontWeight: 700,
    },
    logoText: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "18px",
      fontWeight: 700,
      color: theme.ink,
      lineHeight: 1.1,
    },
    logoSub: {
      fontSize: "11px",
      color: theme.muted,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontWeight: 400,
    },
    headerDate: {
      fontSize: "12px",
      color: theme.muted,
      letterSpacing: "0.06em",
      textAlign: "right",
    },
    hero: {
      position: "relative",
      zIndex: 10,
      maxWidth: "860px",
      margin: "0 auto",
      padding: "5rem 2rem 4rem",
      textAlign: "center",
    },
    heroKicker: {
      display: "inline-block",
      backgroundColor: theme.red,
      color: "#fff",
      fontSize: "11px",
      fontWeight: 500,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      padding: "6px 18px",
      borderRadius: "2px",
      marginBottom: "2rem",
    },
    h1: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
      fontWeight: 900,
      lineHeight: 1.05,
      color: theme.ink,
      marginBottom: "2rem",
    },
    h1Em: { fontStyle: "italic", color: theme.warmDark },
    heroSub: {
      fontSize: "1.1rem",
      color: theme.muted,
      maxWidth: "560px",
      margin: "0 auto 3rem",
      lineHeight: 1.7,
      fontWeight: 300,
    },
    ornament: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      maxWidth: "400px",
      margin: "0 auto 4rem",
      color: theme.warm,
    },
    ornamentLine: { flex: 1, height: "1px", backgroundColor: theme.border },
    ornamentIcon: { fontSize: "18px", color: theme.warm },
    statsRow: {
      position: "relative",
      zIndex: 10,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "1px",
      backgroundColor: theme.border,
      border: `1px solid ${theme.border}`,
      maxWidth: "860px",
      margin: "0 auto 5rem",
      borderRadius: "8px",
      overflow: "hidden",
    },
    stat: {
      backgroundColor: theme.paper,
      padding: "2rem 1.5rem",
      textAlign: "center",
    },
    statNum: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "2.6rem",
      fontWeight: 900,
      color: theme.ink,
      lineHeight: 1,
      marginBottom: "6px",
    },
    statNumRed: { color: theme.red },
    statLabel: {
      fontSize: "12px",
      color: theme.muted,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontWeight: 500,
    },
    section: {
      position: "relative",
      zIndex: 10,
      maxWidth: "860px",
      margin: "0 auto",
      padding: "0 2rem 5rem",
    },
    sectionLabelWrap: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "1.5rem",
    },
    sectionLabel: {
      fontSize: "11px",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      fontWeight: 500,
      color: theme.warmDark,
    },
    sectionLabelLine: {
      flex: "0 0 40px",
      height: "1px",
      backgroundColor: theme.warmDark,
    },
    messageCard: {
      backgroundColor: theme.ink,
      color: theme.paper,
      borderRadius: "12px",
      padding: "3rem",
      position: "relative",
      overflow: "hidden",
    },
    quoteMark: {
      position: "absolute",
      top: "-20px",
      left: "30px",
      fontFamily: playfair.style.fontFamily,
      fontSize: "14rem",
      color: "rgba(201, 169, 110, 0.08)",
      lineHeight: 1,
      pointerEvents: "none",
    },
    messageP: {
      fontSize: "1.08rem",
      lineHeight: 1.85,
      color: "rgba(245, 240, 232, 0.88)",
      marginBottom: "1.4rem",
      position: "relative",
      zIndex: 2,
      fontWeight: 300,
    },
    messageStrong: { color: theme.warm, fontWeight: 500 },
    workItems: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "1.5rem",
      marginTop: "1.5rem",
    },
    workItem: {
      border: `1px solid ${theme.border}`,
      borderRadius: "10px",
      padding: "1.5rem",
      backgroundColor: "rgba(255,255,255,0.4)",
    },
    workItemNum: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "2rem",
      fontWeight: 900,
      color: theme.warmDark,
      opacity: 0.4,
      lineHeight: 1,
      marginBottom: "8px",
    },
    workItemTitle: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "1.1rem",
      fontWeight: 700,
      color: theme.ink,
      marginBottom: "6px",
    },
    workItemDesc: { fontSize: "0.88rem", color: theme.muted, lineHeight: 1.6 },
    ctaSection: {
      position: "relative",
      zIndex: 10,
      maxWidth: "860px",
      margin: "0 auto",
      padding: "0 2rem 6rem",
      textAlign: "center",
    },
    ctaBox: {
      border: `1px solid ${theme.border}`,
      borderRadius: "16px",
      padding: "3.5rem 2.5rem",
      backgroundColor: "rgba(255,255,255,0.5)",
      position: "relative",
    },
    ctaH2: {
      fontFamily: playfair.style.fontFamily,
      fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
      fontWeight: 900,
      color: theme.ink,
      marginBottom: "1rem",
      lineHeight: 1.2,
    },
    ctaP: {
      fontSize: "1rem",
      color: theme.muted,
      maxWidth: "480px",
      margin: "0 auto 2.5rem",
      lineHeight: 1.7,
      fontWeight: 300,
    },
    ctaEmail: {
      display: "inline-flex",
      alignItems: "center",
      gap: "12px",
      backgroundColor: theme.ink,
      color: theme.warm,
      fontFamily: dmSans.style.fontFamily,
      fontSize: "1rem",
      fontWeight: 500,
      padding: "1rem 2.2rem",
      borderRadius: "6px",
      textDecoration: "none",
      letterSpacing: "0.02em",
      marginBottom: "1.5rem",
    },
    ctaNote: {
      fontSize: "0.82rem",
      color: theme.muted,
      letterSpacing: "0.04em",
    },
    footer: {
      position: "relative",
      zIndex: 10,
      borderTop: `1px solid ${theme.border}`,
      padding: "1.5rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "0.5rem",
      fontSize: "12px",
      color: theme.muted,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.noise}></div>

      <div style={styles.topBand}>
        Official Notice — Pending Project Completion & Payment
      </div>

      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoMark}>
            <span style={styles.logoMarkSpan}>D</span>
          </div>
          <div>
            <div style={styles.logoText}>Developer Notice</div>
            <div style={styles.logoSub}>Full-Stack Web Development</div>
          </div>
        </div>
        <div style={styles.headerDate}>
          Issued: April 2025
          <br />
          <span style={{ color: theme.red, fontWeight: 500 }}>
            Status: Awaiting Response
          </span>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroKicker}>Urgent — For the Website Owner</div>
        <h1 style={styles.h1}>
          Your Website Is
          <br />
          <em style={styles.h1Em}>Not Yet Complete.</em>
        </h1>
        <p style={styles.heroSub}>
          This page is a formal notice addressed to the owner of the full-stack
          websites currently in development. There is an unresolved matter of
          payment and project status that requires your immediate attention.
        </p>
        <div style={styles.ornament}>
          <div style={styles.ornamentLine}></div>
          <span style={styles.ornamentIcon}>◆</span>
          <div style={styles.ornamentLine}></div>
        </div>
      </section>

      {/* <div style={styles.statsRow}>
        <div style={styles.stat}>
          <div style={{ ...styles.statNum, ...styles.statNumRed }}>Partial</div>
          <div style={styles.statLabel}>Payment Status</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statNum}>0</div>
          <div style={styles.statLabel}>Projects Delivered</div>
        </div>
      </div> */}

      <section style={styles.section}>
        <div style={styles.sectionLabelWrap}>
          <span style={styles.sectionLabel}>The Message</span>
          <div style={styles.sectionLabelLine}></div>
        </div>
        <div style={styles.messageCard}>
          <div style={styles.quoteMark}>&quot;</div>
          <p style={styles.messageP}>
            This page is addressed directly to{" "}
            <strong>the owner of the full-stack websites</strong> whose
            development was commissioned. You engaged a developer through a
            third party, and work has begun in good faith on the projects.
          </p>
          <p style={styles.messageP}>
            To date, the payment received has been{" "}
            <strong>far below what is appropriate</strong> for full-stack web
            development projects. Full-stack development involves both frontend
            and backend engineering, database design, API development, and
            deployment — significant skilled work that deserves fair
            compensation.
          </p>
          <p style={styles.messageP}>
            The projects{" "}
            <strong>remain incomplete and will not be delivered</strong> until a
            clear agreement on fair payment has been established. This is not a
            personal dispute — it is a professional boundary. Skilled labour
            deserves to be fairly paid.
          </p>
          <p style={{ ...styles.messageP, marginBottom: 0 }}>
            If you are the website owner and you{" "}
            <strong>wish to continue</strong> and receive your completed
            websites, please reach out directly. A fair discussion about project
            scope, timeline, and compensation is all that is needed to move
            forward. The work can be completed &#39; let&#39;s talk.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionLabelWrap}>
          <span style={styles.sectionLabel}>Scope of Work</span>
          <div style={styles.sectionLabelLine}></div>
        </div>
        <div style={styles.workItems}>
          <div style={styles.workItem}>
            <div style={styles.workItemNum}>01</div>
            <div style={styles.workItemTitle}>Frontend Development</div>
            <div style={styles.workItemDesc}>
              Responsive UI, page layouts, navigation, component design, and
              user experience work across the websites.
            </div>
          </div>
          <div style={styles.workItem}>
            <div style={styles.workItemNum}>02</div>
            <div style={styles.workItemTitle}>Backend Development</div>
            <div style={styles.workItemDesc}>
              Server-side logic, APIs, authentication systems, and business
              logic — the engine that powers each website.
            </div>
          </div>
          <div style={styles.workItem}>
            <div style={styles.workItemNum}>03</div>
            <div style={styles.workItemTitle}>Database & Integration</div>
            <div style={styles.workItemDesc}>
              Data architecture, database setup, and integration between
              frontend, backend, and any third-party services.
            </div>
          </div>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div style={styles.ctaBox}>
          <h2 style={styles.ctaH2}>
            Ready to Continue?
            <br />
            Let&#39;s Resolve This.
          </h2>
          <p style={styles.ctaP}>
            If you are the website owner and want your projects completed
            professionally and on time, one email is all it takes to restart the
            conversation. The developer is willing, ready, and professional.
          </p>
          <a href="mailto:sportcolony92@gmail.com" style={styles.ctaEmail}>
            <svg
              viewBox="0 0 24 24"
              style={{
                width: "18px",
                height: "18px",
                fill: theme.warm,
                flexShrink: 0,
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            sportcolony92@gmail.com
          </a>
          <br />
          <span style={styles.ctaNote}>
            Click the button above to open your email and write directly to the
            developer.
          </span>
        </div>
      </section>

      <footer style={styles.footer}>
        <span>Developer Notice — Full-Stack Web Development</span>
        <span>sportcolony92@gmail.com</span>
      </footer>
    </div>
  );
}

///landing page for the website owner. This page is a formal notice regarding the status of the full-stack web development projects, payment issues, and next steps for resolution.
// ("use client");

// import { FormEvent, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Utensils,
//   Bike,
//   Store,
//   Sparkles,
//   MapPin,
//   Zap,
//   Menu,
//   X,
//   ShoppingBag,
//   ArrowRight,
//   Flame,
//   Star,
//   Clock,
//   Search,
//   TrendingUp,
//   Shield,
// } from "lucide-react";

// // ─────────────────────────────────────────────
// //  AI RECOMMENDATION ENGINE (client-side mock)
// //  Replace processPrompt with a real API call when ready.
// // ─────────────────────────────────────────────

// interface Recommendation {
//   meal: string;
//   vendor: string;
//   price: string;
//   time: string;
//   rating: string;
//   tag: string;
// }

// interface RecommendationResult {
//   label: string;
//   recs: Recommendation[];
// }

// class AIRecommendationEngine {
//   processPrompt(prompt: string): RecommendationResult {
//     const t = prompt.toLowerCase();
//     if (t.includes("spicy") || t.includes("pepper") || t.includes("hot"))
//       return {
//         label: "High-Heat Picks",
//         recs: [
//           {
//             meal: "Peri-Peri Chicken Wrap",
//             vendor: "KFC Bodija",
//             price: "₦4,500",
//             time: "14m",
//             rating: "4.9",
//             tag: "Trending",
//           },
//           {
//             meal: "Suya Pepper Steak",
//             vendor: "Malam's Spot",
//             price: "₦3,200",
//             time: "19m",
//             rating: "4.7",
//             tag: "Local Fave",
//           },
//         ],
//       };
//     if (t.includes("budget") || t.includes("cheap") || /₦?\d+/.test(t))
//       return {
//         label: "Value Deals",
//         recs: [
//           {
//             meal: "Student Combo Jollof",
//             vendor: "Item 7",
//             price: "₦1,800",
//             time: "9m",
//             rating: "4.6",
//             tag: "Best Value",
//           },
//           {
//             meal: "Sausage Roll & Hollandia",
//             vendor: "Campus Bakery",
//             price: "₦1,100",
//             time: "5m",
//             rating: "4.8",
//             tag: "Quick Pick",
//           },
//         ],
//       };
//     if (t.includes("healthy") || t.includes("salad") || t.includes("vegan"))
//       return {
//         label: "Clean Eats",
//         recs: [
//           {
//             meal: "Grilled Chicken Power Bowl",
//             vendor: "GreenBowl",
//             price: "₦3,800",
//             time: "17m",
//             rating: "4.9",
//             tag: "Protein",
//           },
//           {
//             meal: "Acai & Granola Parfait",
//             vendor: "SmoothieHub",
//             price: "₦2,200",
//             time: "7m",
//             rating: "4.7",
//             tag: "Fresh",
//           },
//         ],
//       };
//     return {
//       label: "Trending Now",
//       recs: [
//         {
//           meal: "Classic Beef Shawarma XL",
//           vendor: "Shawarma King",
//           price: "₦3,000",
//           time: "12m",
//           rating: "4.9",
//           tag: "🔥 Hot",
//         },
//         {
//           meal: "Jollof Rice & Turkey Leg",
//           vendor: "Tantalizers",
//           price: "₦5,500",
//           time: "18m",
//           rating: "4.8",
//           tag: "Crowd Fave",
//         },
//       ],
//     };
//   }
// }

// const aiEngine = new AIRecommendationEngine();

// // ─────────────────────────────────────────────
// //  DYNAMIC ISLAND TRACKER
// // ─────────────────────────────────────────────

// function DynamicIsland() {
//   const [open, setOpen] = useState(false);
//   const [stage, setStage] = useState(0);

//   useEffect(() => {
//     if (!open) return;
//     const t1 = setTimeout(() => setStage(1), 1600);
//     const t2 = setTimeout(() => setStage(2), 3800);
//     return () => {
//       clearTimeout(t1);
//       clearTimeout(t2);
//     };
//   }, [open]);

//   const stages = [
//     "Grabbing your meal…",
//     "Rider on Bodija Road…",
//     "Arriving at your gate!",
//   ];
//   const pct = [28, 62, 96][stage];

//   return (
//     <div
//       onClick={() =>
//         setOpen((o) => {
//           if (!o) setStage(0);
//           return !o;
//         })
//       }
//       style={{
//         position: "fixed",
//         top: 18,
//         left: "50%",
//         transform: "translateX(-50%)",
//         background: "#fff",
//         borderRadius: 50,
//         width: open ? 320 : 172,
//         height: open ? 136 : 44,
//         padding: open ? "16px 20px" : "0 20px",
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: open ? "flex-start" : "center",
//         alignItems: "center",
//         zIndex: 9000,
//         cursor: "pointer",
//         overflow: "hidden",
//         boxShadow: "0 8px 32px rgba(230,0,0,0.18)",
//         border: "1px solid rgba(230,0,0,0.12)",
//         transition: "all 0.48s cubic-bezier(0.32,0.72,0,1)",
//       }}
//     >
//       {!open ? (
//         <span
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             fontWeight: 800,
//             fontSize: 13,
//             color: "#e60000",
//             fontFamily: "inherit",
//           }}
//         >
//           <span
//             style={{
//               width: 8,
//               height: 8,
//               borderRadius: "50%",
//               background: "#e60000",
//               animation: "pulse-red 1.8s infinite",
//             }}
//           />
//           1 Active Order
//         </span>
//       ) : (
//         <div style={{ width: "100%", animation: "fadeUp 0.4s ease" }}>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: 10,
//             }}
//           >
//             <span
//               style={{
//                 fontSize: 11,
//                 fontWeight: 700,
//                 color: "#888",
//                 letterSpacing: 1,
//                 textTransform: "uppercase",
//               }}
//             >
//               ODG-LCU-99
//             </span>
//             <span style={{ fontSize: 12, fontWeight: 900, color: "#e60000" }}>
//               12 min away
//             </span>
//           </div>
//           <p
//             style={{
//               margin: "0 0 12px",
//               fontWeight: 800,
//               fontSize: 14,
//               color: "#0f172a",
//             }}
//           >
//             {stages[stage]}
//           </p>
//           <div
//             style={{
//               height: 5,
//               background: "#f1f5f9",
//               borderRadius: 5,
//               overflow: "hidden",
//             }}
//           >
//             <div
//               style={{
//                 height: "100%",
//                 background: "linear-gradient(90deg,#e60000,#ff4d4d)",
//                 width: `${pct}%`,
//                 transition: "width 1.2s ease-in-out",
//                 borderRadius: 5,
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// //  TICKER
// // ─────────────────────────────────────────────

// const orders = [
//   {
//     id: "ACU-102",
//     label: "Chicken Burger",
//     color: "#ff6b35",
//     status: "12m away",
//     icon: "🔥",
//   },
//   {
//     id: "LCU-44",
//     label: "Jollof Rice",
//     color: "#00c853",
//     status: "Delivered",
//     icon: "✅",
//   },
//   {
//     id: "UI-90",
//     label: "Parfait XL",
//     color: "#00b0ff",
//     status: "Preparing",
//     icon: "🚀",
//   },
//   {
//     id: "ACU-114",
//     label: "Beef Shawarma",
//     color: "#ff6b35",
//     status: "8m away",
//     icon: "🔥",
//   },
// ];

// function Ticker() {
//   const track = [...orders, ...orders, ...orders];
//   return (
//     <div
//       style={{
//         background: "#0f172a",
//         padding: "14px 0",
//         overflow: "hidden",
//         whiteSpace: "nowrap",
//       }}
//     >
//       <div
//         style={{
//           display: "inline-block",
//           animation: "scrollLeft 30s linear infinite",
//         }}
//       >
//         {track.map((o, i) => (
//           <span
//             key={i}
//             style={{
//               fontSize: 14,
//               fontWeight: 700,
//               marginRight: 60,
//               color: "#fff",
//               fontFamily: "inherit",
//             }}
//           >
//             <span style={{ color: o.color }}>
//               {o.icon} Order #{o.id}:
//             </span>{" "}
//             {o.label} — <span style={{ color: "#94a3b8" }}>{o.status}</span>
//           </span>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// //  AI MODAL
// // ─────────────────────────────────────────────

// interface AIModalProps {
//   results: RecommendationResult | null;
//   onClose: () => void;
// }

// function AIModal({ results, onClose }: AIModalProps) {
//   if (!results) return null;
//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(15,23,42,0.6)",
//         backdropFilter: "blur(18px)",
//         zIndex: 9999,
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         padding: "20px",
//         animation: "fadeIn 0.25s ease",
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 28,
//           padding: "36px",
//           maxWidth: 560,
//           width: "100%",
//           boxShadow: "0 40px 80px rgba(0,0,0,0.2)",
//           animation: "slideUp 0.3s ease",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//             marginBottom: 8,
//           }}
//         >
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <Sparkles size={22} color="#e60000" />
//             <span
//               style={{
//                 fontWeight: 900,
//                 fontSize: 22,
//                 color: "#0f172a",
//                 fontFamily: "inherit",
//               }}
//             >
//               ODG Picks
//             </span>
//           </div>
//           <button
//             onClick={onClose}
//             style={{
//               background: "#f8f9fa",
//               border: "none",
//               borderRadius: "50%",
//               padding: 8,
//               cursor: "pointer",
//             }}
//           >
//             <X size={20} color="#64748b" />
//           </button>
//         </div>
//         <p
//           style={{
//             color: "#64748b",
//             fontWeight: 600,
//             fontSize: 15,
//             marginBottom: 24,
//             fontFamily: "inherit",
//           }}
//         >
//           {results.label}
//         </p>
//         <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//           {results.recs.map((r, i) => (
//             <div
//               key={i}
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 padding: "18px 20px",
//                 border: "1.5px solid #f1f5f9",
//                 borderRadius: 18,
//                 background: "#fafbfc",
//               }}
//             >
//               <div>
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 8,
//                     marginBottom: 4,
//                   }}
//                 >
//                   <span
//                     style={{
//                       background: "#e60000",
//                       color: "#fff",
//                       fontSize: 10,
//                       fontWeight: 900,
//                       padding: "3px 8px",
//                       borderRadius: 20,
//                       letterSpacing: 0.5,
//                       fontFamily: "inherit",
//                     }}
//                   >
//                     {r.tag}
//                   </span>
//                 </div>
//                 <p
//                   style={{
//                     margin: 0,
//                     fontWeight: 800,
//                     fontSize: 17,
//                     color: "#0f172a",
//                     fontFamily: "inherit",
//                   }}
//                 >
//                   {r.meal}
//                 </p>
//                 <p
//                   style={{
//                     margin: 0,
//                     color: "#94a3b8",
//                     fontSize: 13,
//                     fontWeight: 600,
//                     fontFamily: "inherit",
//                   }}
//                 >
//                   {r.vendor} · ⭐ {r.rating} · 🕒 {r.time}
//                 </p>
//               </div>
//               <button
//                 style={{
//                   background: "#e60000",
//                   color: "#fff",
//                   border: "none",
//                   padding: "12px 20px",
//                   borderRadius: 40,
//                   fontWeight: 900,
//                   cursor: "pointer",
//                   fontSize: 15,
//                   fontFamily: "inherit",
//                 }}
//               >
//                 {r.price}
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// //  DATA
// // ─────────────────────────────────────────────

// const stats = [
//   { value: "15m", label: "Avg. Delivery Time" },
//   { value: "20+", label: "Campuses Expanding" },
//   { value: "4.9★", label: "Platform Rating" },
//   { value: "₦0", label: "Delivery Fee Today" },
// ];

// const campuses = [
//   {
//     name: "Lead City University",
//     city: "Ibadan",
//     state: "Oyo",
//     status: "LIVE",
//     time: "12m",
//   },
//   {
//     name: "Ajayi Crowther University",
//     city: "Oyo",
//     state: "Oyo",
//     status: "LIVE",
//     time: "15m",
//   },
//   {
//     name: "University of Ibadan",
//     city: "Ibadan",
//     state: "Oyo",
//     status: "SOON",
//     time: "20m",
//   },
//   {
//     name: "The Polytechnic Ibadan",
//     city: "Ibadan",
//     state: "Oyo",
//     status: "SOON",
//     time: "—",
//   },
// ];

// // ─────────────────────────────────────────────
// //  MAIN PAGE
// // ─────────────────────────────────────────────

// export default function ODGLanding() {
//   const router = useRouter();
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiLoading, setAiLoading] = useState(false);
//   const [aiModal, setAiModal] = useState<RecommendationResult | null>(null);

//   const handleAI = (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!aiPrompt.trim()) return;
//     setAiLoading(true);
//     setTimeout(() => {
//       setAiModal(aiEngine.processPrompt(aiPrompt));
//       setAiLoading(false);
//     }, 1400);
//   };

//   const CSS = `
//     @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

//     *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//     :root {
//       --red:    #e60000;
//       --red2:   #ff4d4d;
//       --dark:   #0f172a;
//       --mid:    #1e293b;
//       --muted:  #64748b;
//       --light:  #f8f9fa;
//       --white:  #ffffff;
//       --border: #eaeaea;
//     }

//     body { font-family: 'DM Sans', sans-serif; background: var(--white); color: var(--dark); overflow-x: hidden; scroll-behavior: smooth; }

//     @keyframes scrollLeft  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
//     @keyframes pulse-red   { 0%,100% { box-shadow: 0 0 0 0 rgba(230,0,0,0.45); } 70% { box-shadow: 0 0 0 7px rgba(230,0,0,0); } }
//     @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
//     @keyframes fadeUp      { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
//     @keyframes slideUp     { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
//     @keyframes floatA      { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
//     @keyframes floatB      { 0%,100% { transform:translateY(0) rotate(-2deg); } 50% { transform:translateY(-18px) rotate(2deg); } }
//     @keyframes gridMove    { from { background-position: 0 0; } to { background-position: 60px 60px; } }
//     @keyframes spin        { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }

//     /* NAV */
//     .nav { position:fixed; top:0; left:0; right:0; z-index:800; padding:0 5%; display:flex; align-items:center; justify-content:space-between; height:72px; background:rgba(255,255,255,0.96); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,0.06); }
//     .nav-logo { font-family:'Syne',sans-serif; font-size:28px; font-weight:900; letter-spacing:-1px; color:var(--dark); text-decoration:none; }
//     .nav-logo span { color:var(--red); }
//     .nav-links { display:flex; gap:36px; align-items:center; }
//     .nav-link { color:var(--dark); text-decoration:none; font-weight:600; font-size:15px; transition:color 0.2s; }
//     .nav-link:hover { color:var(--red); }
//     .btn-nav { background:var(--red); color:#fff; border:none; padding:10px 26px; border-radius:40px; font-weight:700; font-size:15px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; }
//     .btn-nav:hover { opacity:0.88; }
//     .btn-menu { display:none; background:none; border:none; cursor:pointer; }

//     /* HERO */
//     .hero { min-height:100vh; background:var(--red); display:flex; align-items:center; padding:120px 5% 80px; position:relative; overflow:hidden; }
//     .hero-grid-bg { position:absolute; inset:0; opacity:0.06; background-image:linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px); background-size:60px 60px; animation:gridMove 6s linear infinite; }
//     .hero-container { position:relative; z-index:2; max-width:1400px; margin:0 auto; width:100%; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
//     .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.3); padding:8px 18px; border-radius:40px; font-size:12px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#fff; margin-bottom:28px; }
//     .hero-h1 { font-family:'Syne',sans-serif; font-size:clamp(48px,7vw,90px); font-weight:900; line-height:1.02; letter-spacing:-2.5px; color:#fff; margin-bottom:24px; }
//     .hero-sub { font-size:clamp(16px,1.6vw,20px); line-height:1.65; color:rgba(255,255,255,0.82); max-width:520px; margin-bottom:44px; font-weight:500; }
//     .hero-ctas { display:flex; gap:16px; flex-wrap:wrap; }
//     .btn-white { background:#fff; color:var(--red); border:none; padding:16px 36px; border-radius:50px; font-weight:800; font-size:17px; cursor:pointer; display:inline-flex; align-items:center; gap:10px; font-family:'DM Sans',sans-serif; transition:transform 0.2s, box-shadow 0.2s; }
//     .btn-white:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,0,0,0.2); }
//     .btn-ghost { background:transparent; color:#fff; border:2px solid rgba(255,255,255,0.35); padding:14px 32px; border-radius:50px; font-weight:700; font-size:17px; cursor:pointer; display:inline-flex; align-items:center; gap:10px; font-family:'DM Sans',sans-serif; transition:border-color 0.2s; }
//     .btn-ghost:hover { border-color:#fff; }

//     /* FLOATERS */
//     .hero-floaters { position:relative; height:480px; }
//     .floater { position:absolute; background:#fff; border-radius:24px; padding:18px 24px; box-shadow:0 20px 48px rgba(0,0,0,0.18); display:flex; align-items:center; gap:14px; }
//     .floater-icon { width:46px; height:46px; border-radius:14px; background:var(--red); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
//     .floater-label { font-weight:700; font-size:13px; color:var(--muted); line-height:1.3; }
//     .floater-value { font-family:'Syne',sans-serif; font-weight:900; font-size:18px; color:var(--dark); }

//     /* SECTIONS */
//     .section { padding:120px 5%; }
//     .section-alt { background:#f8f9fa; }
//     .container { max-width:1400px; margin:0 auto; }
//     .section-eyebrow { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800; letter-spacing:2.5px; text-transform:uppercase; color:var(--red); margin-bottom:16px; }
//     .section-h2 { font-family:'Syne',sans-serif; font-size:clamp(36px,5vw,68px); font-weight:900; letter-spacing:-1.5px; line-height:1.08; margin-bottom:20px; }
//     .section-sub { font-size:clamp(15px,1.5vw,19px); color:var(--muted); line-height:1.7; max-width:600px; font-weight:500; }

//     /* AI SEARCH */
//     .ai-pill { display:flex; align-items:center; background:#fff; border-radius:100px; border:1.5px solid var(--border); box-shadow:0 20px 50px rgba(0,0,0,0.07); max-width:860px; margin:0 auto; transition:box-shadow 0.3s, border-color 0.3s; overflow:hidden; }
//     .ai-pill:focus-within { box-shadow:0 24px 60px rgba(230,0,0,0.14); border-color:rgba(230,0,0,0.35); }
//     .ai-input { flex:1; border:none; outline:none; padding:20px 28px; font-size:18px; font-weight:600; font-family:'DM Sans',sans-serif; color:var(--dark); background:transparent; }
//     .ai-input::placeholder { color:#b0b8c8; font-weight:500; }
//     .btn-red { background:var(--red); color:#fff; border:none; padding:16px 36px; border-radius:50px; font-weight:800; font-size:16px; cursor:pointer; display:inline-flex; align-items:center; gap:9px; font-family:'DM Sans',sans-serif; transition:opacity 0.2s; margin:6px; }
//     .btn-red:hover { opacity:0.9; }
//     .btn-red:disabled { opacity:0.6; cursor:not-allowed; }
//     .ai-spinner { width:20px; height:20px; border:2.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }

//     /* STATS */
//     .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:var(--border); border:1px solid var(--border); border-radius:24px; overflow:hidden; }
//     .stat-cell { background:#fff; padding:40px 32px; text-align:center; }
//     .stat-value { font-family:'Syne',sans-serif; font-size:clamp(36px,4vw,56px); font-weight:900; color:var(--dark); line-height:1; margin-bottom:8px; }
//     .stat-label { font-size:14px; color:var(--muted); font-weight:600; }

//     /* FEATURES */
//     .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
//     .feature-card { background:#fff; border-radius:24px; padding:36px; border:1.5px solid var(--border); transition:border-color 0.25s, box-shadow 0.25s, transform 0.25s; }
//     .feature-card:hover { border-color:rgba(230,0,0,0.3); box-shadow:0 16px 40px rgba(230,0,0,0.08); transform:translateY(-4px); }
//     .feature-icon { width:52px; height:52px; background:var(--light); border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
//     .feature-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; margin-bottom:10px; }
//     .feature-desc { color:var(--muted); font-size:15px; line-height:1.65; font-weight:500; }

//     /* CAMPUSES */
//     .campus-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
//     .campus-card { padding:32px; border-radius:20px; border:1.5px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#fff; transition:border-color 0.2s; }
//     .campus-card:hover { border-color:rgba(230,0,0,0.25); }
//     .campus-badge-live { background:rgba(230,0,0,0.08); color:var(--red); font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:20px; display:inline-block; margin-bottom:10px; }
//     .campus-badge-soon { background:#f1f5f9; color:var(--muted); font-size:11px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; padding:4px 10px; border-radius:20px; display:inline-block; margin-bottom:10px; }
//     .campus-name { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; color:var(--dark); margin-bottom:6px; }
//     .campus-loc { font-size:14px; color:var(--muted); font-weight:600; display:flex; align-items:center; gap:5px; }
//     .campus-time { font-family:'Syne',sans-serif; font-size:28px; font-weight:900; color:var(--dark); }
//     .campus-time-label { font-size:12px; color:var(--muted); font-weight:600; text-align:right; }

//     /* ── JOIN CTA (replaces the old inline registration form) ── */
//     .join-section { background:var(--dark); padding:120px 5%; }
//     .join-inner { max-width:1400px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
//     .join-cards { display:flex; flex-direction:column; gap:16px; }
//     .join-card {
//       background:rgba(255,255,255,0.04);
//       border:1.5px solid rgba(255,255,255,0.08);
//       border-radius:20px; padding:24px 28px;
//       display:flex; align-items:center; gap:20px;
//       transition:border-color 0.2s, background 0.2s;
//       cursor:pointer; text-decoration:none;
//     }
//     .join-card:hover { border-color:rgba(230,0,0,0.4); background:rgba(230,0,0,0.05); }
//     .join-card-icon { width:48px; height:48px; background:rgba(230,0,0,0.15); border-radius:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
//     .join-card-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:#fff; margin-bottom:3px; }
//     .join-card-desc { color:rgba(255,255,255,0.5); font-size:13px; font-weight:500; }
//     .join-card-arrow { margin-left:auto; color:rgba(255,255,255,0.3); flex-shrink:0; }
//     .join-cta-btn { display:inline-flex; align-items:center; gap:10px; background:var(--red); color:#fff; border:none; padding:18px 40px; border-radius:50px; font-family:'DM Sans',sans-serif; font-weight:800; font-size:18px; cursor:pointer; transition:opacity 0.2s, transform 0.2s; margin-top:8px; }
//     .join-cta-btn:hover { opacity:0.88; transform:translateY(-2px); }
//     .join-login-link { display:inline-flex; align-items:center; gap:8px; margin-left:20px; color:rgba(255,255,255,0.5); font-size:15px; font-weight:600; cursor:pointer; border:none; background:none; transition:color 0.2s; }
//     .join-login-link:hover { color:#fff; }

//     /* FOOTER */
//     .footer { padding:80px 5% 40px; border-top:1.5px solid var(--border); }
//     .footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:60px; margin-bottom:60px; }
//     .footer-logo { font-family:'Syne',sans-serif; font-size:28px; font-weight:900; color:var(--dark); margin-bottom:16px; }
//     .footer-logo span { color:var(--red); }
//     .footer-desc { color:var(--muted); font-size:16px; line-height:1.7; font-weight:500; }
//     .footer-heading { font-family:'Syne',sans-serif; font-weight:800; font-size:16px; color:var(--dark); margin-bottom:24px; }
//     .footer-link { display:block; color:var(--muted); text-decoration:none; font-weight:600; font-size:15px; margin-bottom:14px; transition:color 0.2s; }
//     .footer-link:hover { color:var(--red); }
//     .footer-bottom { border-top:1.5px solid var(--border); padding-top:32px; display:flex; justify-content:space-between; align-items:center; color:var(--muted); font-size:14px; font-weight:600; flex-wrap:wrap; gap:16px; }

//     /* RESPONSIVE */
//     @media (max-width: 1100px) {
//       .hero-container { grid-template-columns:1fr; }
//       .hero-floaters { display:none; }
//       .stats-grid { grid-template-columns:repeat(2,1fr); }
//       .features-grid { grid-template-columns:repeat(2,1fr); }
//       .join-inner { grid-template-columns:1fr; gap:48px; }
//       .footer-grid { grid-template-columns:1fr 1fr; }
//     }
//     @media (max-width: 768px) {
//       .nav-links { display:none; flex-direction:column; position:fixed; top:72px; left:0; right:0; background:#fff; padding:28px 5%; border-bottom:1px solid var(--border); box-shadow:0 20px 40px rgba(0,0,0,0.08); z-index:799; }
//       .nav-links.open { display:flex; }
//       .btn-menu { display:flex; }
//       .ai-pill { flex-direction:column; border-radius:24px; padding:12px; }
//       .ai-input { text-align:center; font-size:16px; }
//       .ai-pill .btn-red { width:calc(100% - 12px); justify-content:center; margin:0 6px 6px; }
//       .ai-search-icon { display:none; }
//       .stats-grid { grid-template-columns:1fr 1fr; }
//       .features-grid { grid-template-columns:1fr; }
//       .campus-grid { grid-template-columns:1fr; }
//       .footer-grid { grid-template-columns:1fr; gap:40px; }
//       .footer-bottom { flex-direction:column; text-align:center; }
//       .section { padding:80px 5%; }
//       .join-section { padding:80px 5%; }
//       .join-cta-btn { width:100%; justify-content:center; }
//       .join-login-link { margin-left:0; margin-top:12px; }
//     }
//   `;

//   return (
//     <>
//       <style dangerouslySetInnerHTML={{ __html: CSS }} />

//       <DynamicIsland />

//       {/* ── NAV ── */}
//       <nav className="nav">
//         <a href="#" className="nav-logo">
//           ODG<span>.</span>
//         </a>
//         <button className="btn-menu" onClick={() => setMenuOpen((o) => !o)}>
//           {menuOpen ? (
//             <X size={28} color="var(--dark)" />
//           ) : (
//             <Menu size={28} color="var(--dark)" />
//           )}
//         </button>
//         <div className={`nav-links ${menuOpen ? "open" : ""}`}>
//           <a href="#ai" className="nav-link" onClick={() => setMenuOpen(false)}>
//             ODG AI
//           </a>
//           <a
//             href="#campuses"
//             className="nav-link"
//             onClick={() => setMenuOpen(false)}
//           >
//             Campuses
//           </a>
//           <a
//             href="#join"
//             className="nav-link"
//             onClick={() => setMenuOpen(false)}
//           >
//             Join
//           </a>
//           <button className="btn-nav" onClick={() => router.push("/login")}>
//             Sign In
//           </button>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <header className="hero">
//         <div className="hero-grid-bg" />
//         <div className="hero-container">
//           <div>
//             <div className="hero-eyebrow">
//               <span
//                 style={{
//                   width: 8,
//                   height: 8,
//                   borderRadius: "50%",
//                   background: "#fff",
//                   animation: "pulse-red 1.8s infinite",
//                   flexShrink: 0,
//                 }}
//               />
//               Now Live · Ibadan & Oyo
//             </div>
//             <h1 className="hero-h1">
//               Campus meals.
//               <br />
//               Delivered in
//               <br />
//               <span
//                 style={{
//                   color: "rgba(255,255,255,0.45)",
//                   textDecoration: "line-through",
//                   fontSize: "0.7em",
//                 }}
//               >
//                 forever.
//               </span>{" "}
//               15 min.
//             </h1>
//             <p className="hero-sub">
//               The premium food delivery network built for Nigerian university
//               campuses. Hot, fresh meals from top vendors — to your exact hostel
//               door.
//             </p>
//             <div className="hero-ctas">
//               <button
//                 className="btn-white"
//                 onClick={() => router.push("/register?role=user")}
//               >
//                 <ShoppingBag size={22} /> Order Now
//               </button>
//               <button
//                 className="btn-ghost"
//                 onClick={() =>
//                   document
//                     .getElementById("campuses")
//                     ?.scrollIntoView({ behavior: "smooth" })
//                 }
//               >
//                 Explore Campuses <ArrowRight size={20} />
//               </button>
//             </div>
//           </div>

//           <div className="hero-floaters">
//             <div
//               className="floater"
//               style={{
//                 top: "8%",
//                 right: "5%",
//                 animation: "floatA 6s ease-in-out infinite",
//               }}
//             >
//               <div className="floater-icon">
//                 <Flame size={22} color="#fff" />
//               </div>
//               <div>
//                 <div className="floater-label">Trending Now</div>
//                 <div className="floater-value">Spicy Chicken Wrap</div>
//               </div>
//             </div>
//             <div
//               className="floater"
//               style={{
//                 top: "42%",
//                 left: "0%",
//                 animation: "floatB 7.5s ease-in-out infinite",
//               }}
//             >
//               <div className="floater-icon">
//                 <Clock size={22} color="#fff" />
//               </div>
//               <div>
//                 <div className="floater-label">ETA to Block C</div>
//                 <div className="floater-value">12 Minutes</div>
//               </div>
//             </div>
//             <div
//               className="floater"
//               style={{
//                 bottom: "12%",
//                 right: "12%",
//                 animation: "floatA 5.5s ease-in-out infinite 1s",
//                 background: "#0f172a",
//               }}
//             >
//               <div
//                 className="floater-icon"
//                 style={{ background: "rgba(255,255,255,0.1)" }}
//               >
//                 <Star size={22} color="#f59e0b" fill="#f59e0b" />
//               </div>
//               <div>
//                 <div className="floater-label" style={{ color: "#94a3b8" }}>
//                   Vendor Rating
//                 </div>
//                 <div className="floater-value" style={{ color: "#fff" }}>
//                   4.9 · 200+ Reviews
//                 </div>
//               </div>
//             </div>
//             <div
//               style={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 transform: "translate(-50%,-50%)",
//                 width: 320,
//                 height: 320,
//                 borderRadius: "50%",
//                 border: "1.5px solid rgba(255,255,255,0.12)",
//                 zIndex: -1,
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 transform: "translate(-50%,-50%)",
//                 width: 480,
//                 height: 480,
//                 borderRadius: "50%",
//                 border: "1px solid rgba(255,255,255,0.06)",
//                 zIndex: -1,
//               }}
//             />
//           </div>
//         </div>
//       </header>

//       {/* ── TICKER ── */}
//       <Ticker />

//       {/* ── STATS ── */}
//       <div className="section" style={{ paddingBottom: 0 }}>
//         <div className="container">
//           <div className="stats-grid">
//             {stats.map((s, i) => (
//               <div key={i} className="stat-cell">
//                 <div className="stat-value">{s.value}</div>
//                 <div className="stat-label">{s.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── AI SEARCH ── */}
//       <section id="ai" className="section" style={{ textAlign: "center" }}>
//         <div className="container">
//           <div className="section-eyebrow">
//             <Sparkles size={16} /> ODG Food AI
//           </div>
//           <h2
//             className="section-h2"
//             style={{ margin: "0 auto 16px", maxWidth: 720 }}
//           >
//             What are you <span style={{ color: "var(--red)" }}>craving?</span>
//           </h2>
//           <p className="section-sub" style={{ margin: "0 auto 48px" }}>
//             Describe your mood, budget, or dietary needs — our AI matches you
//             with the best campus vendors instantly.
//           </p>
//           <form onSubmit={handleAI} className="ai-pill">
//             <Search
//               size={24}
//               color="#b0b8c8"
//               style={{ marginLeft: 20, flexShrink: 0 }}
//               className="ai-search-icon"
//             />
//             <input
//               value={aiPrompt}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               placeholder="e.g., 'budget ₦2500, something spicy near Block D'"
//               className="ai-input"
//               required
//             />
//             <button type="submit" className="btn-red" disabled={aiLoading}>
//               {aiLoading ? (
//                 <>
//                   <div className="ai-spinner" /> Scanning…
//                 </>
//               ) : (
//                 <>
//                   <Sparkles size={18} /> Find Food
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </section>

//       <AIModal results={aiModal} onClose={() => setAiModal(null)} />

//       {/* ── FEATURES ── */}
//       <section className="section section-alt">
//         <div className="container">
//           <div className="section-eyebrow">
//             <Zap size={16} /> Why ODG
//           </div>
//           <h2 className="section-h2">
//             Built for campus life.
//             <br />
//             <span style={{ color: "var(--red)" }}>Nothing else.</span>
//           </h2>
//           <p className="section-sub" style={{ marginBottom: 56 }}>
//             Every feature engineered around how students actually eat, order,
//             and live on campus.
//           </p>
//           <div className="features-grid">
//             {[
//               {
//                 icon: <Clock size={24} color="var(--red)" />,
//                 title: "15-Minute Guarantee",
//                 desc: "Our rider network is geo-optimised around campus layouts. Your food is hot when it arrives, not when it leaves.",
//               },
//               {
//                 icon: <MapPin size={24} color="var(--red)" />,
//                 title: "Hostel-Precise Delivery",
//                 desc: 'Drop a pin at your exact block and room number. No more "meet me at the gate" situations.',
//               },
//               {
//                 icon: <Star size={24} color="var(--red)" />,
//                 title: "Curated 4.7★+ Vendors",
//                 desc: "Every restaurant on ODG passes our taste and hygiene audit. Mediocre food doesn't ship.",
//               },
//               {
//                 icon: <Sparkles size={24} color="var(--red)" />,
//                 title: "AI-Powered Matching",
//                 desc: "Tell us your budget, craving, and dietary needs. Our AI surfaces the best options in seconds.",
//               },
//               {
//                 icon: <Shield size={24} color="var(--red)" />,
//                 title: "Secure Payments",
//                 desc: "Pay with cards, bank transfers, or campus wallets. Every transaction is encrypted end-to-end.",
//               },
//               {
//                 icon: <TrendingUp size={24} color="var(--red)" />,
//                 title: "Vendor Analytics",
//                 desc: "Restaurant partners get real-time dashboards, peak-hour insights, and order flow management tools.",
//               },
//             ].map((f, i) => (
//               <div key={i} className="feature-card">
//                 <div className="feature-icon">{f.icon}</div>
//                 <h3 className="feature-title">{f.title}</h3>
//                 <p className="feature-desc">{f.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CAMPUSES ── */}
//       <section id="campuses" className="section">
//         <div className="container">
//           <div className="section-eyebrow">
//             <MapPin size={16} /> Coverage
//           </div>
//           <h2 className="section-h2">
//             Active <span style={{ color: "var(--red)" }}>campuses.</span>
//           </h2>
//           <p className="section-sub" style={{ marginBottom: 48 }}>
//             We&apos;re live on the highest-density student campuses in Oyo
//             State, with rapid expansion underway.
//           </p>
//           <div className="campus-grid">
//             {campuses.map((c, i) => (
//               <div key={i} className="campus-card">
//                 <div>
//                   <span
//                     className={
//                       c.status === "LIVE"
//                         ? "campus-badge-live"
//                         : "campus-badge-soon"
//                     }
//                   >
//                     {c.status === "LIVE" ? "● Live Now" : "○ Coming Soon"}
//                   </span>
//                   <div className="campus-name">{c.name}</div>
//                   <div className="campus-loc">
//                     <MapPin size={14} />
//                     {c.city}, {c.state}
//                   </div>
//                 </div>
//                 <div style={{ textAlign: "right" }}>
//                   <div className="campus-time">{c.time}</div>
//                   <div className="campus-time-label">Avg. ETA</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── JOIN CTA (replaces the old inline form) ── */}
//       <section id="join" className="join-section">
//         <div className="join-inner">
//           {/* Copy */}
//           <div>
//             <div
//               className="section-eyebrow"
//               style={{ color: "rgba(255,255,255,0.45)" }}
//             >
//               <Zap size={16} /> Join the Network
//             </div>
//             <h2 className="section-h2" style={{ color: "#fff" }}>
//               Your account.
//               <br />
//               <span style={{ color: "var(--red)" }}>Your role.</span>
//             </h2>
//             <p
//               className="section-sub"
//               style={{ color: "rgba(255,255,255,0.55)", marginBottom: 40 }}
//             >
//               Sign up as a student to start ordering, or as a vendor to manage
//               your restaurant and unlock live dashboards.
//             </p>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 flexWrap: "wrap",
//                 gap: 0,
//               }}
//             >
//               <button
//                 className="join-cta-btn"
//                 onClick={() => router.push("/register")}
//               >
//                 <Zap size={20} /> Create Account
//               </button>
//               <button
//                 className="join-login-link"
//                 onClick={() => router.push("/login")}
//               >
//                 Already have an account? Sign in →
//               </button>
//             </div>
//           </div>

//           {/* Role cards */}
//           <div className="join-cards">
//             {[
//               {
//                 icon: <Utensils size={22} color="var(--red)" />,
//                 role: "Student",
//                 desc: "Order from top campus vendors in minutes.",
//                 href: "/register?role=user",
//               },
//               {
//                 icon: <Store size={22} color="var(--red)" />,
//                 role: "Vendor",
//                 desc: "List your restaurant, manage orders, grow revenue.",
//                 href: "/register?role=vendor",
//               },
//               {
//                 icon: <Bike size={22} color="var(--red)" />,
//                 role: "Rider",
//                 desc: "Deliver on your schedule and earn daily.",
//                 href: "/register?role=rider",
//               },
//             ].map((item, i) => (
//               <a key={i} className="join-card" href={item.href}>
//                 <div className="join-card-icon">{item.icon}</div>
//                 <div>
//                   <div className="join-card-title">{item.role}</div>
//                   <div className="join-card-desc">{item.desc}</div>
//                 </div>
//                 <ArrowRight size={18} className="join-card-arrow" />
//               </a>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="footer">
//         <div className="container">
//           <div className="footer-grid">
//             <div>
//               <div className="footer-logo">
//                 ODG<span>.</span>
//               </div>
//               <p className="footer-desc">
//                 The premium food delivery network for Nigerian university
//                 campuses. Hot meals. Fast riders. Zero compromise.
//               </p>
//             </div>
//             <div>
//               <div className="footer-heading">Platform</div>
//               <a href="#ai" className="footer-link">
//                 ODG Food AI
//               </a>
//               <a href="#campuses" className="footer-link">
//                 Campuses
//               </a>
//               <a href="/register" className="footer-link">
//                 Create Account
//               </a>
//             </div>
//             <div>
//               <div className="footer-heading">Partner</div>
//               <a href="/register?role=vendor" className="footer-link">
//                 List Your Restaurant
//               </a>
//               <a href="/register?role=rider" className="footer-link">
//                 Become a Rider
//               </a>
//               <a href="#" className="footer-link">
//                 Contact Sales
//               </a>
//             </div>
//           </div>
//           <div className="footer-bottom">
//             <span>© 2026 ODG Deliveries Ltd. All rights reserved.</span>
//             <div style={{ display: "flex", gap: 32 }}>
//               <a href="#" className="footer-link" style={{ marginBottom: 0 }}>
//                 Privacy Policy
//               </a>
//               <a href="#" className="footer-link" style={{ marginBottom: 0 }}>
//                 Terms of Service
//               </a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </>
//   );
// }
