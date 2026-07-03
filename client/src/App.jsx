import { useState } from "react";
import axios from "axios";
import "./index.css";
import jsPDF from "jspdf";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const agentEmojis = {
  investor: "🧠",
  customer: "👤",
  competitor: "⚔️",
};

const agentLabels = {
  investor: "Investor Agent",
  customer: "Customer Agent",
  competitor: "Competitor Agent",
};

const parseAgentResponse = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.map((line, i) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const label = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      return (
        <p key={i} style={{ marginBottom: "8px" }}>
          <span style={{ color: "#a855f7", fontWeight: "700" }}>{label}:</span>{" "}
          <span style={{ color: "#ccc" }}>{value}</span>
        </p>
      );
    }
    return <p key={i} style={{ color: "#ccc" }}>{line}</p>;
  });
};

const parseScoreBreakdown = (verdict) => {
  const categories = ["MARKET DEMAND", "REVENUE POTENTIAL", "COMPETITION", "SCALABILITY", "EXECUTION"];
  return categories.map((cat) => {
    const match = verdict.match(new RegExp(`${cat}:\\s*(\\d+)/20`));
    const score = match ? parseInt(match[1]) : 0;
    const percent = (score / 20) * 100;
    const color = percent >= 70 ? "#22c55e" : percent >= 40 ? "#eab308" : "#ef4444";
    return (
      <div key={cat} style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ color: "#ccc", fontSize: "0.85rem" }}>{cat}</span>
          <span style={{ color: color, fontWeight: "700", fontSize: "0.85rem" }}>{score}/20</span>
        </div>
        <div style={{ background: "#333", borderRadius: "999px", height: "6px" }}>
          <div style={{ width: `${percent}%`, background: color, height: "6px", borderRadius: "999px", transition: "width 0.5s ease" }} />
        </div>
      </div>
    );
  });
};

const extractTotalScore = (verdict) => {
  const match = verdict?.match(/TOTAL SCORE:\s*(\d+)/i) || verdict?.match(/VIABILITY SCORE:\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
};

const extractScore = (verdict) => {
  const match = verdict?.match(/TOTAL SCORE:\s*(\d+)/i) || verdict?.match(/VIABILITY SCORE:\s*(\d+)/i);
  return match ? parseInt(match[1]) : "?";
};

const getScoreColor = (score) => {
  const num = parseInt(score);
  if (num >= 70) return "#22c55e";
  if (num >= 40) return "#eab308";
  return "#ef4444";
};

const cleanVerdict = (verdict) =>
  verdict
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .split("\n")
    .filter((line) => !line.match(/^(MARKET DEMAND|REVENUE POTENTIAL|COMPETITION|SCALABILITY|EXECUTION|TOTAL SCORE):/i))
    .join("\n");

const VerdictBox = ({ verdict }) => {
  const total = extractTotalScore(verdict);
  const color = total >= 70 ? "#22c55e" : total >= 40 ? "#eab308" : "#ef4444";
  return (
    <div className="verdict-box">
      <h2>🎯 Final Verdict</h2>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "#a855f7", fontWeight: "700", marginBottom: "16px", fontSize: "0.9rem" }}>
          📊 SCORE BREAKDOWN
        </p>
        {parseScoreBreakdown(verdict)}
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", paddingTop: "12px", marginTop: "8px" }}>
          <span style={{ color: "#fff", fontWeight: "700" }}>TOTAL SCORE</span>
          <span style={{ color: color, fontWeight: "800", fontSize: "1.2rem" }}>{total}/100</span>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ verdict, onRoadmap, loadingRoadmap }) => {
  const strengths = [];
  const flaws = [];
  const fixes = [];

  verdict.split("\n").forEach((line) => {
    if (line.startsWith("STRENGTH")) strengths.push(line.split(":")[1]?.trim());
    if (line.startsWith("FATAL FLAW")) flaws.push(line.split(":")[1]?.trim());
    if (line.startsWith("FIX")) fixes.push(line.split(":")[1]?.trim());
  });

  return (
    <div style={{
      background: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "16px",
      padding: "28px",
      marginTop: "24px",
    }}>
      <h2 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "20px" }}>
        📋 Idea Summary
      </h2>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "#22c55e", fontWeight: "700", marginBottom: "10px" }}>
          ✅ What's Good
        </p>
        {strengths.slice(0, 3).map((s, i) => (
          <p key={i} style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "6px", paddingLeft: "12px" }}>
            • {s}
          </p>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ color: "#ef4444", fontWeight: "700", marginBottom: "10px" }}>
          ⚠️ Needs Work
        </p>
        {flaws.slice(0, 3).map((f, i) => (
          <p key={i} style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "6px", paddingLeft: "12px" }}>
            • {f}
          </p>
        ))}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p style={{ color: "#eab308", fontWeight: "700", marginBottom: "10px" }}>
          💡 Quick Fixes
        </p>
        {fixes.slice(0, 3).map((f, i) => (
          <p key={i} style={{ color: "#ccc", fontSize: "0.9rem", marginBottom: "6px", paddingLeft: "12px" }}>
            • {f}
          </p>
        ))}
      </div>

      <button
        onClick={onRoadmap}
        disabled={loadingRoadmap}
        style={{
          width: "100%",
          padding: "14px",
          background: "linear-gradient(135deg, #a855f7, #6366f1)",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          fontSize: "1rem",
          fontWeight: "700",
          cursor: "pointer",
        }}
      >
        {loadingRoadmap ? "Generating Roadmap..." : "🗺️ Generate Startup Roadmap"}
      </button>
    </div>
  );
};

const RoadmapCard = ({ roadmap }) => {
  const parseMonth = (month) => {
    const num = month;
    const title = roadmap.match(new RegExp(`MONTH ${num} TITLE: (.+)`))?.[1] || "";
    const focus = roadmap.match(new RegExp(`MONTH ${num} FOCUS: (.+)`))?.[1] || "";
    const tasks = [1, 2, 3].map(t =>
      roadmap.match(new RegExp(`MONTH ${num} TASK ${t}: (.+)`))?.[1]
    ).filter(Boolean);
    const milestone = roadmap.match(new RegExp(`MONTH ${num} MILESTONE: (.+)`))?.[1] || "";
    return { title, focus, tasks, milestone };
  };

  const quickWin = roadmap.match(/QUICK WIN: (.+)/)?.[1] || "";
  const biggestRisk = roadmap.match(/BIGGEST RISK: (.+)/)?.[1] || "";

  const monthColors = ["#a855f7", "#6366f1", "#22c55e"];

  return (
    <div style={{ marginTop: "24px" }}>
      <h2 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "20px" }}>
        🗺️ Startup Roadmap
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[1, 2, 3].map((num) => {
          const month = parseMonth(num);
          return (
            <div key={num} style={{
              background: "#1a1a1a",
              border: `1px solid ${monthColors[num - 1]}33`,
              borderTop: `3px solid ${monthColors[num - 1]}`,
              borderRadius: "16px",
              padding: "20px",
            }}>
              <p style={{ color: monthColors[num - 1], fontSize: "0.8rem", fontWeight: "700", marginBottom: "4px" }}>
                MONTH {num}
              </p>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: "8px" }}>{month.title}</h3>
              <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "14px" }}>{month.focus}</p>

              {month.tasks.map((task, i) => (
                <p key={i} style={{ color: "#ccc", fontSize: "0.85rem", marginBottom: "6px" }}>
                  ▸ {task}
                </p>
              ))}

              {month.milestone && (
                <div style={{
                  marginTop: "14px",
                  padding: "10px",
                  background: `${monthColors[num - 1]}11`,
                  borderRadius: "8px",
                  border: `1px solid ${monthColors[num - 1]}33`,
                }}>
                  <p style={{ color: monthColors[num - 1], fontSize: "0.8rem", fontWeight: "700" }}>
                    🎯 MILESTONE
                  </p>
                  <p style={{ color: "#ccc", fontSize: "0.82rem", marginTop: "4px" }}>{month.milestone}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "#1a1a1a", border: "1px solid #22c55e33", borderRadius: "12px", padding: "16px" }}>
          <p style={{ color: "#22c55e", fontWeight: "700", marginBottom: "8px" }}>⚡ Quick Win</p>
          <p style={{ color: "#ccc", fontSize: "0.85rem" }}>{quickWin}</p>
        </div>
        <div style={{ background: "#1a1a1a", border: "1px solid #ef444433", borderRadius: "12px", padding: "16px" }}>
          <p style={{ color: "#ef4444", fontWeight: "700", marginBottom: "8px" }}>⚠️ Biggest Risk</p>
          <p style={{ color: "#ccc", fontSize: "0.85rem" }}>{biggestRisk}</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [rawIdea, setRawIdea] = useState("");
  const [enhancedIdea, setEnhancedIdea] = useState("");
  const [result, setResult] = useState(null);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState("home");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [remainingValidations, setRemainingValidations] = useState(5);
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authPage, setAuthPage] = useState("home");

  const handleAuth = (userData, switchTo) => {
    if (switchTo) {
      setAuthPage(switchTo);
      return;
    }
    setUser(userData);
    setAuthPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleEnhance = async () => {
    if (!rawIdea.trim()) return;
    setLoadingEnhance(true);
    setEnhancedIdea("");
    setResult(null);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/enhance", { rawIdea });
      setEnhancedIdea(res.data.enhanced);
    } catch (err) {
      setError(err.response?.data?.error || "Enhancement failed. Try again.");
    } finally {
      setLoadingEnhance(false);
    }
  };

  const handleValidate = async () => {
    const ideaToValidate = enhancedIdea || rawIdea;
    if (!ideaToValidate.trim()) return;
    setLoadingValidate(true);
    setResult(null);
    setRoadmap(null);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/validate",
        { idea: ideaToValidate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      console.log('remaining:', res.data.remaining);
      setRemainingValidations(res.data.remaining);
    } catch (err) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoadingValidate(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const goToHistory = () => {
    setPage("history");
    setSelectedHistory(null);
    fetchHistory();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this validation?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(history.filter((item) => item._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoadmap = async () => {
    setLoadingRoadmap(true);
    setRoadmap(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/roadmap",
        { idea: result.idea, verdict: result.verdict },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoadmap(res.data.roadmap);
    } catch (err) {
      setError(err.response?.data?.error || "Roadmap generation failed. Try again.");
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const generatePDF = () => {
    if (!result) return;
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const fillPageBackground = () => {
      pdf.setFillColor(15, 15, 15);
      pdf.rect(0, 0, 210, 297, "F");
    };

    const checkPage = () => {
      if (y > 270) {
        pdf.addPage();
        fillPageBackground();
        y = 20;
      }
    };

    const addText = (text, fontSize, color, isBold = false) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...color);
      if (isBold) pdf.setFont("helvetica", "bold");
      else pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        checkPage();
        pdf.text(line, margin, y);
        y += fontSize * 0.45;
      });
      y += 3;
    };

    const addDivider = () => {
      checkPage();
      pdf.setDrawColor(80, 80, 80);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    fillPageBackground();
    addText("AI Startup Validator", 22, [168, 85, 247], true);
    addText("Validate before you build", 10, [136, 136, 136]);
    addText(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 9, [100, 100, 100]);
    y += 4;
    addDivider();

    addText("STARTUP IDEA", 9, [168, 85, 247], true);
    addText(result.idea, 11, [255, 255, 255]);
    y += 4;
    addDivider();

    const agentNames = {
      investor: "INVESTOR AGENT",
      customer: "CUSTOMER AGENT",
      competitor: "COMPETITOR AGENT",
    };

    Object.keys(result.agents).forEach((agent) => {
      addText(agentNames[agent], 10, [168, 85, 247], true);
      const lines = result.agents[agent].split("\n").filter(l => l.trim());
      lines.forEach((line) => {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const label = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          checkPage();
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(200, 150, 255);
          pdf.text(`${label}:`, margin, y);
          const labelWidth = pdf.getTextWidth(`${label}: `);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(200, 200, 200);
          const valueLines = pdf.splitTextToSize(value, maxWidth - labelWidth);
          pdf.text(valueLines[0] || "", margin + labelWidth, y);
          y += 5;
          valueLines.slice(1).forEach(vl => {
            checkPage();
            pdf.text(vl, margin + 4, y);
            y += 5;
          });
        } else {
          addText(line, 9, [200, 200, 200]);
        }
      });
      y += 4;
      addDivider();
    });

    addText("SCORE BREAKDOWN", 10, [168, 85, 247], true);
    const categories = ["MARKET DEMAND", "REVENUE POTENTIAL", "COMPETITION", "SCALABILITY", "EXECUTION"];
    categories.forEach((cat) => {
      const match = result.verdict.match(new RegExp(`${cat}:\\s*(\\d+)/20`));
      const score = match ? parseInt(match[1]) : 0;
      const color = score >= 14 ? [34, 197, 94] : score >= 8 ? [234, 179, 8] : [239, 68, 68];
      checkPage();
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 200, 200);
      pdf.text(cat, margin, y);
      pdf.setTextColor(...color);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${score}/20`, pageWidth - margin - 10, y);
      y += 6;
    });

    const total = extractTotalScore(result.verdict);
    const totalColor = total >= 70 ? [34, 197, 94] : total >= 40 ? [234, 179, 8] : [239, 68, 68];
    y += 2;
    addDivider();
    checkPage();
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL SCORE", margin, y);
    pdf.setTextColor(...totalColor);
    pdf.text(`${total}/100`, pageWidth - margin - 15, y);
    y += 10;
    addDivider();

    addText("FINAL VERDICT", 10, [168, 85, 247], true);
    const verdictLines = result.verdict
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .split("\n")
      .filter(line => !line.match(/^(MARKET DEMAND|REVENUE POTENTIAL|COMPETITION|SCALABILITY|EXECUTION|TOTAL SCORE):/i))
      .filter(l => l.trim());

    verdictLines.forEach((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const label = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        checkPage();
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(200, 150, 255);
        pdf.text(`${label}:`, margin, y);
        const lw = pdf.getTextWidth(`${label}: `);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(200, 200, 200);
        const vLines = pdf.splitTextToSize(value, maxWidth - lw);
        pdf.text(vLines[0] || "", margin + lw, y);
        y += 5;
        vLines.slice(1).forEach(vl => {
          checkPage();
          pdf.text(vl, margin + 4, y);
          y += 5;
        });
      } else {
        addText(line, 9, [200, 200, 200]);
      }
    });

    pdf.save("startup-report.pdf");
  };

  // Show Login/Signup overlays when requested
  if (authPage === "login" && !user) return <Login onAuth={handleAuth} />;
  if (authPage === "signup" && !user) return <Signup onAuth={handleAuth} />;

  return (
    <div className="container">
      <div className="navbar">
        <span className="nav-logo" onClick={() => setPage("home")}>🚀 AI Startup Validator</span>
        <div className="nav-links">
          {user ? (
            <>
              <span style={{ color: "#888", fontSize: "0.85rem", marginRight: "8px" }}>👋 {user.name}</span>
              <button className={page === "home" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("home")}>Validate</button>
              <button className={page === "history" ? "nav-btn active" : "nav-btn"} onClick={goToHistory}>History</button>
              <button className="nav-btn" onClick={handleLogout} style={{ borderColor: "#ef4444", color: "#ef4444" }}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => setAuthPage("login")}>Login</button>
              <button className="nav-btn" onClick={() => setAuthPage("signup")}>Sign Up</button>
            </>
          )}
        </div>
      </div>

      {page === "home" && (
        <>
          <div className="hero">
            <h1>Validate before you build</h1>
            <p>Get brutally honest AI feedback from 3 expert agents</p>
          </div>

          {remainingValidations !== null && (
            <div style={{
              background: remainingValidations <= 1 ? "#ef444420" : "#a855f720",
              border: `1px solid ${remainingValidations <= 1 ? "#ef4444" : "#a855f7"}`,
              borderRadius: "10px",
              padding: "10px 16px",
              marginBottom: "16px",
              fontSize: "0.85rem",
              color: remainingValidations <= 1 ? "#ef4444" : "#a855f7",
              fontWeight: "600",
            }}>
              ⚡ {remainingValidations} validations remaining today
            </div>
          )}

          <div className="step-label">Step 1 — Type your raw idea (any language)</div>
          <textarea rows={3} placeholder="e.g. app jo ghar pe khana deliver kare..." value={rawIdea} onChange={(e) => setRawIdea(e.target.value)} />
          <button className="btn-secondary" onClick={handleEnhance} disabled={loadingEnhance || !rawIdea.trim()}>
            {loadingEnhance ? "Enhancing..." : "✨ Enhance My Idea"}
          </button>

          {enhancedIdea && (
            <>
              <div className="step-label" style={{ marginTop: "28px" }}>Step 2 — AI Enhanced Version (edit if needed)</div>
              <textarea rows={4} value={enhancedIdea} onChange={(e) => setEnhancedIdea(e.target.value)} />
              <button onClick={handleValidate} disabled={loadingValidate}>
                {loadingValidate ? "Analyzing..." : "⚡ Validate My Idea"}
              </button>
            </>
          )}

          {loadingValidate && <div className="loading">🤖 3 AI agents are attacking your idea simultaneously...</div>}
          {error && <div className="loading" style={{ color: "#f87171" }}>{error}</div>}

          {result && (
            <>
              <div className="agents-grid">
                {Object.keys(result.agents).map((agent) => (
                  <div className="agent-card" key={agent}>
                    <h3>{agentEmojis[agent]} {agentLabels[agent]}</h3>
                    <div>{parseAgentResponse(result.agents[agent])}</div>
                  </div>
                ))}
              </div>

              <SummaryCard
                verdict={result.verdict}
                onRoadmap={handleRoadmap}
                loadingRoadmap={loadingRoadmap}
              />

              {roadmap && <RoadmapCard roadmap={roadmap} />}

              <button
                onClick={generatePDF}
                style={{
                  marginTop: "24px",
                  marginBottom: "40px",
                  background: "transparent",
                  border: "1px solid #22c55e",
                  color: "#22c55e",
                  borderRadius: "12px",
                  padding: "14px 24px",
                  cursor: "pointer",
                  fontWeight: "700",
                  width: "100%",
                  fontSize: "1rem",
                }}
              >
                📄 Download PDF Report
              </button>
            </>
          )}
        </>
      )}

      {page === "history" && (
        <>
          <div className="hero">
            <h1>📜 Validation History</h1>
            <p>Your past startup idea validations</p>
          </div>

          {loadingHistory && <div className="loading">Loading history...</div>}

          {!loadingHistory && !selectedHistory && (
            <div className="history-list">
              {history.length === 0 && (
                <p style={{ color: "#888", textAlign: "center" }}>No validations yet!</p>
              )}
              {history.map((item) => {
                const score = extractScore(item.verdict);
                return (
                  <div className="history-card" key={item._id} onClick={() => setSelectedHistory(item)}>
                    <div className="history-card-left">
                      <p className="history-idea">{item.idea}</p>
                      <p className="history-date">{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="score-badge" style={{ background: getScoreColor(score) }}>
                        {score}/100
                      </div>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        style={{
                          background: "transparent",
                          border: "1px solid #ef4444",
                          color: "#ef4444",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                          fontWeight: "700",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedHistory && (
            <>
              <button className="btn-secondary" style={{ marginBottom: "24px" }} onClick={() => setSelectedHistory(null)}>
                ← Back to History
              </button>
              <div className="agents-grid">
                {Object.keys(selectedHistory.agents).map((agent) => (
                  <div className="agent-card" key={agent}>
                    <h3>{agentEmojis[agent]} {agentLabels[agent]}</h3>
                    <div>{parseAgentResponse(selectedHistory.agents[agent])}</div>
                  </div>
                ))}
              </div>
              <VerdictBox verdict={selectedHistory.verdict} />
            </>
          )}
        </>
      )}
    </div>
  );
}