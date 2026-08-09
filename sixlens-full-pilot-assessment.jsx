import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Loader2, RotateCcw, Sparkles, Printer } from "lucide-react";

/* ---------------------------------------------------------
   SixLens Framework — Full Pilot Assessment
   Beyond aptitude. Beyond pressure. Towards purpose.

   Design tokens
   Color:  #16213A ink navy (bg) · #F4F1E9 paper ·
           #C9A24B brass/lens gold (accent) ·
           #7C8AA5 muted slate (secondary text) ·
           #5F8F73 sage (positive) · #B5654B clay (contrast)
   Type:   'Fraunces' (display serif) + 'Inter' (body/UI)
   Signature: an aperture ring in the header that opens as
              the student moves through the six lenses
--------------------------------------------------------- */

const LENSES = [
  { id: "reasoning", label: "Reasoning", q: "What am I naturally good at?" },
  { id: "awareness", label: "Awareness", q: "What paths actually exist?" },
  { id: "self", label: "Self-Understanding", q: "What do I actually want?" },
  { id: "discipline", label: "Discipline", q: "What will it take?" },
  { id: "purpose", label: "Purpose", q: "Why does it matter to me?" },
  { id: "vision", label: "Vision", q: "Where does this lead?" },
];

const ITEMS = [
  // --- Reasoning ---
  { id: "r1", lens: "reasoning", type: "mcq", prompt: "Which number continues this sequence?", sub: "2, 6, 12, 20, 30, ?", options: ["36", "40", "42", "44"], correct: 2, tag: "Logical" },
  { id: "r2", lens: "reasoning", type: "mcq", prompt: "A shop marks up a product by 25%, then gives a 20% discount on the marked price. Compared to the original cost, the final price is:", options: ["5% higher", "Exactly the same", "10% higher", "5% lower"], correct: 1, tag: "Numerical" },
  { id: "r3", lens: "reasoning", type: "mcq", prompt: "A cube has Red on top, Green in front. You rotate it 90° forward (top moves to front). If Yellow was at the back, what's on top now?", options: ["Green", "Red", "Yellow", "Can't tell"], correct: 2, tag: "Spatial" },
  { id: "r4", lens: "reasoning", type: "mcq", prompt: "You're loosening a very tight bolt with a wrench. Which change makes it easiest?", options: ["Use a longer handle", "Use a shorter handle", "Turn it faster", "Use a thinner wrench"], correct: 0, tag: "Mechanical" },
  { id: "r5", lens: "reasoning", type: "mcq", prompt: "BOOK is to LIBRARY as PAINTING is to:", options: ["Frame", "Museum", "Artist", "Canvas"], correct: 1, tag: "Verbal" },

  // --- Awareness (interest mapping, 1-5 likert) ---
  { id: "a1", lens: "awareness", type: "likert", prompt: "Building apps, machines, or systems that solve problems", tag: "Technology & Engineering" },
  { id: "a2", lens: "awareness", type: "likert", prompt: "Designing visuals, spaces, stories, or experiences", tag: "Creative & Design" },
  { id: "a3", lens: "awareness", type: "likert", prompt: "Managing money, running a business, or building strategy", tag: "Business & Finance" },
  { id: "a4", lens: "awareness", type: "likert", prompt: "Understanding how the body or natural world works, or helping people heal", tag: "Healthcare & Science" },
  { id: "a5", lens: "awareness", type: "likert", prompt: "Teaching, guiding, or supporting other people", tag: "Social & Education" },
  { id: "a6", lens: "awareness", type: "likert", prompt: "Working with your hands — building, fixing, or making physical things", tag: "Trades & Hands-on" },

  // --- Self-Understanding ---
  { id: "s1", lens: "self", type: "likert", prompt: "Making a lot of money matters a lot to me", tag: "Money orientation" },
  { id: "s2", lens: "self", type: "likert", prompt: "I care more about doing work I enjoy than what others think is impressive", tag: "Independence" },
  { id: "s3", lens: "self", type: "likert", prompt: "My family's expectations strongly influence what I want to do", tag: "External pressure" },
  { id: "s4", lens: "self", type: "text", prompt: "What's one career idea you've had but haven't said out loud, because of what others might think?", tag: "Hidden interest" },

  // --- Discipline ---
  { id: "d1", lens: "discipline", type: "likert", prompt: "I stick with a task even when it gets boring or difficult", tag: "Persistence" },
  { id: "d2", lens: "discipline", type: "likert", prompt: "I make plans or to-do lists and actually follow them", tag: "Planning" },
  { id: "d3", lens: "discipline", type: "likert", prompt: "I practice or improve a skill on my own, without being told to", tag: "Self-motivation" },

  // --- Purpose ---
  { id: "p1", lens: "purpose", type: "text", prompt: "What's a problem — big or small — that you'd genuinely like to help fix?", tag: "Motivation" },
  { id: "p2", lens: "purpose", type: "text", prompt: "When do you feel most useful or proud of yourself?", tag: "Meaning" },

  // --- Vision ---
  { id: "v1", lens: "vision", type: "text", prompt: "Ten years from now, describe your daily life — not the job title, but how you're actually living.", tag: "Long-term picture" },
  { id: "v2", lens: "vision", type: "likert", prompt: "How comfortable are you with your career path changing or evolving over time?", tag: "Flexibility", low: "I want one clear fixed path", high: "I'm comfortable adapting as I go" },
];

function Aperture({ progress, size = 60 }) {
  const blades = 8;
  const r = size / 2;
  const openness = 0.2 + progress * 0.6;
  const petals = Array.from({ length: blades }).map((_, i) => {
    const angle = (i / blades) * Math.PI * 2;
    const cx = r + Math.cos(angle) * r * 0.5;
    const cy = r + Math.sin(angle) * r * 0.5;
    return <circle key={i} cx={cx} cy={cy} r={r * openness} fill="none" stroke="#C9A24B" strokeWidth="1.3" opacity={0.55} />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke="#3A4664" strokeWidth="1" />
      {petals}
      <circle cx={r} cy={r} r={r * openness * 0.5} fill="#C9A24B" opacity="0.9" />
    </svg>
  );
}

const LIKERT_LABELS = ["Not me at all", "A little", "Somewhat", "Quite a bit", "Very much me"];

export default function SixLensPilotAssessment() {
  const [stage, setStage] = useState("intro"); // intro | lens-intro | item | loading | report
  const [flowIndex, setFlowIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [likertVal, setLikertVal] = useState(null);
  const [textVal, setTextVal] = useState("");
  const [studentName, setStudentName] = useState("");
  const [report, setReport] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
      .sl-root * { box-sizing: border-box; }
      .sl-root { font-family: 'Inter', sans-serif; }
      .sl-serif { font-family: 'Fraunces', serif; }
      .sl-btn { transition: transform .15s ease, background .15s ease, border-color .15s ease; }
      .sl-btn:hover { transform: translateY(-1px); }
      .sl-fade { animation: slFadeIn .35s ease both; }
      @keyframes slFadeIn { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform:none; } }
      .sl-bar-fill { transition: width .8s cubic-bezier(.22,1,.36,1); }
      .sl-dot { transition: background .15s ease, transform .15s ease; }
      @media print {
        .sl-noprint { display: none !important; }
        .sl-print-area { background: white !important; color: #16213A !important; box-shadow: none !important; }
      }
      @media (prefers-reduced-motion: reduce) { .sl-fade { animation: none; } .sl-bar-fill { transition: none; } }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Build flow: [lens-intro, item, item, ...] per lens
  const flow = [];
  LENSES.forEach((lens) => {
    flow.push({ kind: "lens-intro", lens: lens.id });
    ITEMS.filter((it) => it.lens === lens.id).forEach((it) => flow.push({ kind: "item", item: it }));
  });

  const currentFlow = flow[flowIndex];
  const lensOfIndex = (idx) => flow[idx]?.lens || flow[idx]?.item?.lens;
  const currentLensIdx = LENSES.findIndex((l) => l.id === lensOfIndex(flowIndex));
  const overallProgress = flowIndex / flow.length;

  const advance = (newAnswers) => {
    if (flowIndex + 1 < flow.length) {
      setFlowIndex(flowIndex + 1);
      setLikertVal(null);
      setTextVal("");
    } else {
      setStage("loading");
      finalize(newAnswers || answers);
    }
  };

  const submitItem = () => {
    const it = currentFlow.item;
    const newAnswers = { ...answers };
    if (it.type === "likert") newAnswers[it.id] = { value: likertVal };
    if (it.type === "text") newAnswers[it.id] = { text: textVal };
    setAnswers(newAnswers);
    advance(newAnswers);
  };

  const submitMcq = (idx) => {
    const it = currentFlow.item;
    const newAnswers = { ...answers, [it.id]: { choice: idx } };
    setAnswers(newAnswers);
    advance(newAnswers);
  };

  const computeReasoningPct = (a) => {
    const rItems = ITEMS.filter((i) => i.lens === "reasoning");
    let got = 0;
    rItems.forEach((it) => {
      if (a[it.id]?.choice === it.correct) got += 1;
    });
    return Math.round((got / rItems.length) * 100);
  };

  const avgLikert = (a, ids) => {
    const vals = ids.map((id) => a[id]?.value).filter((v) => typeof v === "number");
    if (!vals.length) return 0;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 20);
  };

  const finalize = async (finalAnswers) => {
    const reasoningPct = computeReasoningPct(finalAnswers);
    const awarenessScores = ITEMS.filter((i) => i.lens === "awareness").map((it) => ({
      tag: it.tag,
      score: finalAnswers[it.id]?.value || 0,
    }));
    const topInterests = [...awarenessScores].sort((a, b) => b.score - a.score).slice(0, 2).map((a) => a.tag);

    const payload = {
      name: studentName || "the student",
      reasoningPct,
      reasoningDetail: ITEMS.filter((i) => i.lens === "reasoning").map((it) => ({
        tag: it.tag,
        correct: finalAnswers[it.id]?.choice === it.correct,
      })),
      topInterests,
      awarenessScores,
      moneyOrientation: finalAnswers["s1"]?.value || 0,
      independence: finalAnswers["s2"]?.value || 0,
      externalPressure: finalAnswers["s3"]?.value || 0,
      hiddenInterest: finalAnswers["s4"]?.text || "",
      disciplineAvg: avgLikert(finalAnswers, ["d1", "d2", "d3"]),
      purposeProblem: finalAnswers["p1"]?.text || "",
      purposeProud: finalAnswers["p2"]?.text || "",
      visionPicture: finalAnswers["v1"]?.text || "",
      flexibility: finalAnswers["v2"]?.value || 0,
    };

    try {
      const prompt = `You are generating a one-page, strengths-based career-guidance report for a school student, as part of a program called SixLens (framework: Reasoning, Awareness, Self-Understanding, Discipline, Purpose, Vision). This is a starting conversation for a counselor, not a diagnostic verdict. Never use clinical or judgmental language. Never say "weak" or "bad" - frame lighter areas neutrally.

Student data:
${JSON.stringify(payload, null, 2)}

Return ONLY a JSON object, no markdown fences, with this exact shape:
{
  "openingLine": "one warm sentence addressed to the student by name",
  "reasoningSummary": "2 sentences on their reasoning profile, strengths-based, mention which dimensions stood out (Logical/Numerical/Spatial/Mechanical/Verbal) based on reasoningDetail",
  "interestSummary": "2 sentences on their top interest areas from awarenessScores and what kind of work that suggests",
  "selfSummary": "2-3 sentences weaving together moneyOrientation, independence, externalPressure, and hiddenInterest if given - be gentle and specific, this is often the most sensitive section",
  "disciplineSummary": "1-2 sentences on their discipline/habits profile, framed as a starting point not a fixed trait",
  "purposeSummary": "1-2 sentences synthesizing purposeProblem and purposeProud into what seems to genuinely motivate them",
  "visionSummary": "1-2 sentences reflecting their visionPicture and flexibility score back to them",
  "suggestedDirections": ["3 to 5 specific career directions or fields that make sense given ALL the sections together, not just interests"],
  "conversationStarters": ["3 short questions a counselor could ask this student in a follow-up session, based on tensions or open threads in their answers - e.g. gap between hidden interest and stated interests, or between external pressure and independence"]
}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content.map((b) => b.text || "").join("").trim();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReport({ ...parsed, payload });
    } catch (e) {
      setReport({
        openingLine: `Here's a starting picture, ${payload.name}.`,
        reasoningSummary: `Reasoning strengths showed up most in ${payload.reasoningDetail.filter((r) => r.correct).map((r) => r.tag).join(", ") || "a mix of areas"}. This is a light signal, not a full diagnostic.`,
        interestSummary: `The strongest pull was towards ${payload.topInterests.join(" and ")}. Worth exploring these in more depth in a follow-up session.`,
        selfSummary: `There's a mix of personal motivation and outside influence at play here — worth unpacking directly with the student, especially anything left unsaid.`,
        disciplineSummary: `Their self-reported habits give a useful starting baseline for goal-setting.`,
        purposeSummary: `Their answers point to what genuinely energizes them — worth building the next session around this.`,
        visionSummary: `Their long-term picture is a good anchor for grounding shorter-term choices.`,
        suggestedDirections: payload.topInterests,
        conversationStarters: [
          "What would you choose if no one else had an opinion?",
          "What's one small step you could take this month toward that hidden interest?",
          "How do you want your daily life to feel, ten years from now?",
        ],
        payload,
      });
    }
    setStage("report");
  };

  const restart = () => {
    setStage("intro");
    setFlowIndex(0);
    setAnswers({});
    setLikertVal(null);
    setTextVal("");
    setReport(null);
    setStudentName("");
  };

  const startFlow = () => {
    setFlowIndex(0);
    setStage("lens-intro");
  };

  return (
    <div
      className="sl-root"
      style={{ width: "100%", background: "#16213A", color: "#F4F1E9", borderRadius: "16px", overflow: "hidden", minHeight: "600px" }}
    >
      {/* Header */}
      <div className="sl-noprint" style={{ padding: "24px 28px 18px", borderBottom: "1px solid #2A3752", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#C9A24B", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "4px" }}>SixLens Framework · Pilot Assessment</div>
          <div className="sl-serif" style={{ fontSize: "22px", fontWeight: 600 }}>
            {stage === "report" ? "Career Guidance Report" : stage === "intro" ? "Welcome" : LENSES[currentLensIdx]?.label || ""}
          </div>
        </div>
        <Aperture progress={stage === "report" ? 1 : overallProgress} />
      </div>

      {/* Progress segments */}
      {(stage === "lens-intro" || stage === "item") && (
        <div className="sl-noprint" style={{ display: "flex", gap: "4px", padding: "14px 28px 0" }}>
          {LENSES.map((l, i) => (
            <div key={l.id} style={{ flex: 1, height: "4px", borderRadius: "999px", background: i < currentLensIdx ? "#C9A24B" : i === currentLensIdx ? "#7C8AA5" : "#2A3752" }} />
          ))}
        </div>
      )}

      <div style={{ padding: "30px 28px", minHeight: "460px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {stage === "intro" && (
          <div className="sl-fade" style={{ maxWidth: "540px", margin: "0 auto" }}>
            <div className="sl-serif" style={{ fontSize: "24px", marginBottom: "12px" }}>Beyond aptitude. Beyond pressure. Towards purpose.</div>
            <p style={{ color: "#AEB9CE", fontSize: "14.5px", lineHeight: 1.65, marginBottom: "22px" }}>
              This takes about 12-15 minutes across six short sections. There are no wrong answers outside the
              reasoning questions — everything else is about understanding you better. Be honest, not impressive.
            </p>
            <label style={{ display: "block", fontSize: "13px", color: "#AEB9CE", marginBottom: "8px" }}>Student's first name</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Aarav"
              style={{ width: "100%", background: "#0F1830", border: "1px solid #2A3752", borderRadius: "10px", color: "#F4F1E9", padding: "12px 14px", fontSize: "14.5px", marginBottom: "22px" }}
            />
            <button
              className="sl-btn"
              onClick={startFlow}
              style={{ background: "#C9A24B", color: "#16213A", border: "none", borderRadius: "10px", padding: "13px 26px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              Begin <ArrowRight size={17} />
            </button>
          </div>
        )}

        {stage === "lens-intro" && currentFlow?.kind === "lens-intro" && (
          <div className="sl-fade" style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ color: "#C9A24B", fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>
              Lens {currentLensIdx + 1} of 6
            </div>
            <div className="sl-serif" style={{ fontSize: "26px", marginBottom: "10px" }}>{LENSES[currentLensIdx].label}</div>
            <p style={{ color: "#AEB9CE", fontSize: "15px", marginBottom: "26px" }}>{LENSES[currentLensIdx].q}</p>
            <button
              className="sl-btn"
              onClick={() => setStage("item")}
              style={{ background: "transparent", border: "1px solid #C9A24B", color: "#C9A24B", borderRadius: "10px", padding: "11px 22px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        )}

        {stage === "item" && currentFlow?.kind === "item" && (
          <div className="sl-fade" key={currentFlow.item.id} style={{ maxWidth: "560px", margin: "0 auto", width: "100%" }}>
            <div style={{ color: "#C9A24B", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>{currentFlow.item.tag}</div>
            <div className="sl-serif" style={{ fontSize: "18px", lineHeight: 1.4, marginBottom: currentFlow.item.sub ? "6px" : "22px" }}>{currentFlow.item.prompt}</div>
            {currentFlow.item.sub && <div style={{ fontSize: "19px", color: "#C9A24B", marginBottom: "22px" }}>{currentFlow.item.sub}</div>}

            {currentFlow.item.type === "mcq" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {currentFlow.item.options.map((opt, i) => (
                  <button key={i} onClick={() => submitMcq(i)} style={{ textAlign: "left", padding: "12px 15px", borderRadius: "10px", border: "1px solid #2A3752", background: "transparent", color: "#F4F1E9", fontSize: "14px", cursor: "pointer" }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentFlow.item.type === "likert" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLikertVal(v)}
                      className="sl-dot"
                      style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        border: likertVal === v ? "2px solid #C9A24B" : "1px solid #2A3752",
                        background: likertVal === v ? "rgba(201,162,75,0.15)" : "transparent",
                        color: "#F4F1E9", fontSize: "14px", cursor: "pointer",
                        transform: likertVal === v ? "scale(1.08)" : "none",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#7C8AA5", marginBottom: "24px" }}>
                  <span>{currentFlow.item.low || LIKERT_LABELS[0]}</span>
                  <span>{currentFlow.item.high || LIKERT_LABELS[4]}</span>
                </div>
                <button
                  className="sl-btn"
                  onClick={submitItem}
                  disabled={likertVal === null}
                  style={{ background: likertVal !== null ? "#C9A24B" : "#3A4664", color: likertVal !== null ? "#16213A" : "#7C8AA5", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14.5px", fontWeight: 600, cursor: likertVal !== null ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            )}

            {currentFlow.item.type === "text" && (
              <div>
                <textarea
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  placeholder="Type your answer..."
                  rows={4}
                  style={{ width: "100%", background: "#0F1830", border: "1px solid #2A3752", borderRadius: "10px", color: "#F4F1E9", padding: "13px", fontSize: "14px", fontFamily: "inherit", marginBottom: "16px", resize: "none" }}
                />
                <button
                  className="sl-btn"
                  onClick={submitItem}
                  disabled={textVal.trim().length === 0}
                  style={{ background: textVal.trim() ? "#C9A24B" : "#3A4664", color: textVal.trim() ? "#16213A" : "#7C8AA5", border: "none", borderRadius: "10px", padding: "12px 24px", fontSize: "14.5px", fontWeight: 600, cursor: textVal.trim() ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  Next <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "loading" && (
          <div className="sl-fade" style={{ textAlign: "center", color: "#AEB9CE" }}>
            <Loader2 size={30} style={{ animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
            <div style={{ fontSize: "14.5px" }}>Building the report across all six lenses...</div>
          </div>
        )}

        {stage === "report" && report && (
          <div className="sl-fade sl-print-area" ref={printRef} style={{ maxWidth: "640px", margin: "0 auto", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#C9A24B", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
              <Sparkles size={13} /> SixLens One-Pager
            </div>
            <p className="sl-serif" style={{ fontSize: "19px", lineHeight: 1.5, marginBottom: "22px" }}>{report.openingLine}</p>

            {[
              ["Reasoning", report.reasoningSummary],
              ["Awareness", report.interestSummary],
              ["Self-Understanding", report.selfSummary],
              ["Discipline", report.disciplineSummary],
              ["Purpose", report.purposeSummary],
              ["Vision", report.visionSummary],
            ].map(([title, body]) => (
              <div key={title} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#C9A24B", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{title}</div>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#F4F1E9" }}>{body}</p>
              </div>
            ))}

            <div style={{ marginTop: "22px", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", color: "#7C8AA5", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Directions worth exploring</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {report.suggestedDirections?.map((d, i) => (
                  <span key={i} style={{ fontSize: "13px", padding: "6px 13px", borderRadius: "999px", border: "1px solid #C9A24B", color: "#C9A24B" }}>{d}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "#7C8AA5", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>For the counselor — follow-up conversation starters</div>
              <ul style={{ paddingLeft: "18px", margin: 0 }}>
                {report.conversationStarters?.map((c, i) => (
                  <li key={i} style={{ fontSize: "13.5px", color: "#AEB9CE", marginBottom: "5px", lineHeight: 1.5 }}>{c}</li>
                ))}
              </ul>
            </div>

            <p style={{ fontSize: "11.5px", color: "#5C6980", borderTop: "1px solid #2A3752", paddingTop: "12px" }}>
              This report is a starting conversation for career guidance, not a diagnostic verdict. Interests and strengths evolve — revisit this periodically.
            </p>

            <div className="sl-noprint" style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
              <button
                className="sl-btn"
                onClick={() => window.print()}
                style={{ background: "#C9A24B", color: "#16213A", border: "none", borderRadius: "10px", padding: "11px 20px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px" }}
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
              <button
                className="sl-btn"
                onClick={restart}
                style={{ background: "transparent", color: "#AEB9CE", border: "1px solid #3A4664", borderRadius: "10px", padding: "11px 18px", fontSize: "13.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "7px" }}
              >
                <RotateCcw size={14} /> Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
