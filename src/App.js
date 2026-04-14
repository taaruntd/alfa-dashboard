import { useState, useEffect, useCallback } from "react";

const DATA_URL =
  "https://raw.githubusercontent.com/taaruntd/alfa-tracker-data/main/data/alfa_fy27.json";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const TABS = ["Overview", "Monthly Detail"];

const B = {
  black: "#0a0a0a",
  charcoal: "#1c1c1c",
  graphite: "#2e2e2e",
  iron: "#4a4a4a",
  ash: "#7a7a7a",
  silver: "#b0b0b0",
  smoke: "#d8d8d8",
  offwhite: "#f0ede8",
  white: "#ffffff",
  gold: "#c8a84b",
  goldDim: "#8a7030",
  goldPale: "#f5edda",
  red: "#8b1a1a",
};

const fmt = (v) => {
  const n = parseFloat(v);
  return (!v && v !== 0) || isNaN(n)
    ? "—"
    : "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) + "L";
};
const fmtUnits = (v) =>
  !v && v !== 0 ? "—" : parseInt(v).toLocaleString("en-IN") + " units";
const fmtPct = (v) => (!v && v !== 0 ? "—" : parseFloat(v).toFixed(1) + "%");
const sumField = (monthly, field) =>
  monthly.reduce((acc, m) => {
    const v = parseFloat(m[field]);
    return acc + (isNaN(v) ? 0 : v);
  }, 0);
const timeAgo = (iso) => {
  if (!iso) return "never";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const BLANK_MONTHS = [
  "March (FY26)",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
].map((m) => ({ month: m }));

const FALLBACK = {
  lastUpdated: null,
  fiscalYear: "FY27",
  company: "Alfa Intercontinental Pvt. Ltd.",
  monthly: BLANK_MONTHS,
};

export default function AlfaTrackerFY27() {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedMonth, setSelectedMonth] = useState("March (FY26)");
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(DATA_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastFetch(new Date());
    } catch (e) {
      setError("Using cached data — live sync unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const monthly = data.monthly || BLANK_MONTHS;
  const totalHtct = sumField(monthly, "htctRev");
  const totalLtct = sumField(monthly, "ltctRev");
  const totalEpc = sumField(monthly, "epcRev");
  const totalTrading = sumField(monthly, "tradingRev");
  const totalExport = sumField(monthly, "exportRev");
  const totalRev = totalHtct + totalLtct + totalEpc + totalTrading;
  const filledMonths = monthly.filter((m) =>
    ["htctRev", "ltctRev", "epcRev", "tradingRev", "exportRev"].some(
      (f) => m[f]
    )
  ).length;
  const selectedData = monthly.find((m) => m.month === selectedMonth) || {};

  return (
    <div
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        background: B.offwhite,
        minHeight: "100vh",
        color: B.black,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0ede8; }
        ::-webkit-scrollbar-thumb { background: #1c1c1c; }
        .tab-btn { cursor: pointer; transition: all 0.18s; border: none; font-family: 'DM Mono', monospace; }
        .tab-btn:hover { background: #1c1c1c !important; color: #f0ede8 !important; }
        .month-pill { cursor: pointer; transition: all 0.12s; user-select: none; }
        .month-pill:hover { background: #1c1c1c !important; color: #f0ede8 !important; border-color: #1c1c1c !important; }
        .stat-card { transition: box-shadow 0.2s, transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
        tbody tr:hover td { background: #e8e4dc !important; }
        .refresh-btn { cursor: pointer; border: none; background: none; font-family: 'DM Mono', monospace; transition: opacity 0.15s; }
        .refresh-btn:hover { opacity: 0.7; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.25s ease; }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .live-pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* MASTHEAD */}
      <div style={{ background: B.black, borderBottom: `3px solid ${B.gold}` }}>
        <div style={{ padding: "0 40px" }}>
          <div
            style={{
              borderBottom: `1px solid ${B.graphite}`,
              padding: "9px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9,
                color: B.ash,
                letterSpacing: 2,
              }}
            >
              EST. 1985 · FORMERLY CONTINENTAL ENGINEERS
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  className="live-pulse"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: error ? B.ash : B.gold,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 9,
                    color: error ? B.ash : B.gold,
                  }}
                >
                  {loading
                    ? "SYNCING..."
                    : error
                    ? error
                    : `LIVE · Updated ${timeAgo(data.lastUpdated)}`}
                </span>
              </div>
              <button
                className="refresh-btn"
                onClick={fetchData}
                style={{ fontSize: 9, color: B.ash, letterSpacing: 1 }}
              >
                {loading ? <span className="spin">↻</span> : "↻"} REFRESH
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "18px 0 14px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `1.5px solid ${B.gold}`,
                background: B.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
                <polygon
                  points="16,0 6,14 12,14 6,30 22,12 14,12"
                  fill="#0a0a0a"
                />
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 26,
                  fontWeight: 900,
                  color: B.white,
                  letterSpacing: 5,
                  lineHeight: 1,
                }}
              >
                ALFA
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 8,
                  color: B.gold,
                  letterSpacing: 3,
                  marginTop: 4,
                }}
              >
                INTERCONTINENTAL PVT. LTD.
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 13,
                  color: B.smoke,
                }}
              >
                FY27 Performance Tracker
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: B.ash,
                  marginTop: 4,
                }}
              >
                {filledMonths} of 12 months with data
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className="tab-btn"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "9px 24px",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: activeTab === tab ? B.black : B.ash,
                  background: activeTab === tab ? B.gold : "transparent",
                  border: "none",
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="fade-in" style={{ padding: "32px 40px" }}>
        {error && (
          <div
            style={{
              background: B.goldPale,
              border: `1px solid ${B.gold}`,
              padding: "10px 16px",
              marginBottom: 20,
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: B.graphite,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ color: B.gold }}>⚠</span> {error} — showing last
            known data.
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: B.charcoal,
                }}
              >
                Annual Performance Summary
              </span>
              <div style={{ flex: 1, height: 1, background: B.charcoal }} />
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: B.ash,
                  letterSpacing: 1,
                }}
              >
                ₹ IN LAKHS
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 12,
                marginBottom: 32,
              }}
            >
              {[
                { label: "HTCT Revenue", val: totalHtct },
                { label: "LTCT Revenue", val: totalLtct },
                { label: "EPC Revenue", val: totalEpc },
                { label: "Trading", val: totalTrading },
                { label: "Export Revenue", val: totalExport },
                { label: "Total Revenue", val: totalRev, featured: true },
              ].map(({ label, val, featured }) => (
                <div
                  key={label}
                  className="stat-card"
                  style={{
                    background: featured ? B.black : B.white,
                    border: `1px solid ${featured ? B.gold : B.smoke}`,
                    borderTop: `3px solid ${featured ? B.gold : B.charcoal}`,
                    padding: "18px 16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 8,
                      letterSpacing: 1.5,
                      color: featured ? B.ash : B.iron,
                      marginBottom: 10,
                    }}
                  >
                    {label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: featured ? 19 : 16,
                      fontWeight: 700,
                      color: featured ? B.gold : val === 0 ? B.smoke : B.black,
                    }}
                  >
                    {val === 0
                      ? "—"
                      : `₹${val.toLocaleString("en-IN", {
                          maximumFractionDigits: 0,
                        })}L`}
                  </div>
                  {val === 0 && (
                    <div
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 8,
                        color: B.silver,
                        marginTop: 4,
                      }}
                    >
                      Awaiting data
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{ background: B.white, border: `1px solid ${B.smoke}` }}
            >
              <div
                style={{
                  background: B.black,
                  padding: "13px 20px",
                  borderBottom: `2px solid ${B.gold}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 14,
                    color: B.white,
                    fontWeight: 700,
                  }}
                >
                  Month-by-Month Breakdown
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr style={{ background: B.charcoal }}>
                      {[
                        "Month",
                        "HTCT Rev",
                        "HTCT Units",
                        "LTCT Rev",
                        "LTCT Units",
                        "EPC",
                        "Trading",
                        "Rej. Rate",
                        "Export",
                        "IPO Flag",
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 14px",
                            textAlign: i === 0 ? "left" : "center",
                            color: B.smoke,
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 8,
                            letterSpacing: 1.5,
                            fontWeight: 500,
                            borderBottom: `1px solid ${B.gold}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m, i) => (
                      <tr
                        key={m.month}
                        style={{
                          background: i % 2 !== 0 ? B.offwhite : B.white,
                          borderBottom: `1px solid ${B.smoke}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 14px",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 11,
                            fontWeight: 600,
                            color: B.charcoal,
                            borderRight: `2px solid ${B.charcoal}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.month}
                        </td>
                        {[
                          { v: fmt(m.htctRev), has: !!m.htctRev },
                          { v: fmtUnits(m.htctUnits), has: !!m.htctUnits },
                          { v: fmt(m.ltctRev), has: !!m.ltctRev },
                          { v: fmtUnits(m.ltctUnits), has: !!m.ltctUnits },
                          { v: fmt(m.epcRev), has: !!m.epcRev },
                          { v: fmt(m.tradingRev), has: !!m.tradingRev },
                          {
                            v: fmtPct(m.rejRate),
                            has: !!m.rejRate,
                            warn: parseFloat(m.rejRate) > 5,
                          },
                          { v: fmt(m.exportRev), has: !!m.exportRev },
                        ].map(({ v, has, warn }, ci) => (
                          <td
                            key={ci}
                            style={{
                              padding: "10px 14px",
                              textAlign: "center",
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11,
                              color: !has ? B.silver : warn ? B.red : B.black,
                              fontWeight: has ? 600 : 400,
                            }}
                          >
                            {v}
                          </td>
                        ))}
                        <td
                          style={{ padding: "10px 14px", textAlign: "center" }}
                        >
                          {m.ipo ? (
                            <span
                              style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 8,
                                background: B.gold,
                                color: B.black,
                                padding: "2px 7px",
                                letterSpacing: 1,
                              }}
                            >
                              IPO NOTE
                            </span>
                          ) : (
                            <span style={{ color: B.smoke }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr
                      style={{
                        background: B.black,
                        borderTop: `2px solid ${B.gold}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: B.gold,
                          fontWeight: 700,
                          letterSpacing: 2,
                          borderRight: `2px solid ${B.gold}`,
                        }}
                      >
                        FY27 TOTAL
                      </td>
                      {[
                        totalHtct,
                        sumField(monthly, "htctUnits"),
                        totalLtct,
                        sumField(monthly, "ltctUnits"),
                        totalEpc,
                        totalTrading,
                      ].map((v, i) => (
                        <td
                          key={i}
                          style={{
                            padding: "12px 14px",
                            textAlign: "center",
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 13,
                            color: B.gold,
                            fontWeight: 700,
                          }}
                        >
                          {v === 0
                            ? "—"
                            : i === 1 || i === 3
                            ? `${v.toLocaleString("en-IN")} u`
                            : `₹${v.toLocaleString("en-IN")}L`}
                        </td>
                      ))}
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: B.ash,
                        }}
                      >
                        AVG
                      </td>
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 13,
                          color: B.gold,
                          fontWeight: 700,
                        }}
                      >
                        {totalExport === 0
                          ? "—"
                          : `₹${totalExport.toLocaleString("en-IN")}L`}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY DETAIL */}
        {activeTab === "Monthly Detail" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: B.charcoal,
                }}
              >
                Monthly Drill-Down
              </span>
              <div style={{ flex: 1, height: 1, background: B.charcoal }} />
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 26,
              }}
            >
              {monthly.map((m) => {
                const has = [
                  "htctRev",
                  "ltctRev",
                  "epcRev",
                  "tradingRev",
                  "exportRev",
                  "ipo",
                  "product",
                  "facility",
                ].some((f) => m[f]);
                const sel = selectedMonth === m.month;
                return (
                  <div
                    key={m.month}
                    className="month-pill"
                    onClick={() => setSelectedMonth(m.month)}
                    style={{
                      padding: "6px 14px",
                      border: `1px solid ${
                        sel ? B.gold : has ? B.charcoal : B.smoke
                      }`,
                      background: sel ? B.black : has ? B.charcoal : B.white,
                      color: sel ? B.gold : has ? B.smoke : B.silver,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      fontWeight: sel ? 700 : 400,
                    }}
                  >
                    {m.month}
                    {has && !sel && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: B.gold,
                          marginLeft: 7,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: B.black,
                padding: "14px 20px",
                borderLeft: `4px solid ${B.gold}`,
                marginBottom: 18,
                display: "flex",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: B.white,
                }}
              >
                {selectedMonth}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9,
                  color: B.ash,
                }}
              >
                FY 2026–27
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
                gap: 14,
              }}
            >
              {[
                {
                  title: "HTCT",
                  fields: [
                    { l: "Revenue", v: fmt(selectedData.htctRev) },
                    { l: "Units Sold", v: fmtUnits(selectedData.htctUnits) },
                  ],
                },
                {
                  title: "LTCT",
                  fields: [
                    { l: "Revenue", v: fmt(selectedData.ltctRev) },
                    { l: "Units Sold", v: fmtUnits(selectedData.ltctUnits) },
                  ],
                },
                {
                  title: "EPC & Trading",
                  fields: [
                    { l: "EPC Revenue", v: fmt(selectedData.epcRev) },
                    { l: "Trading Revenue", v: fmt(selectedData.tradingRev) },
                  ],
                },
                {
                  title: "Test Metrics",
                  fields: [
                    {
                      l: "Rejection Rate",
                      v: fmtPct(selectedData.rejRate),
                      warn: parseFloat(selectedData.rejRate) > 5,
                    },
                  ],
                },
                {
                  title: "Export Geography",
                  fields: [
                    { l: "Revenue", v: fmt(selectedData.exportRev) },
                    { l: "Development", v: selectedData.exportDev || "—" },
                  ],
                },
                {
                  title: "Business Developments",
                  fields: [
                    { l: "Order Updates", v: selectedData.orderUpdates || "—" },
                    {
                      l: "Customer Additions",
                      v: selectedData.customers || "—",
                    },
                  ],
                },
                {
                  title: "Development",
                  fields: [
                    { l: "Product", v: selectedData.product || "—" },
                    { l: "Facility", v: selectedData.facility || "—" },
                  ],
                },
                {
                  title: "IPO Update",
                  fields: [{ l: "Note", v: selectedData.ipo || "—" }],
                  gold: true,
                },
              ].map(({ title, fields, gold }) => (
                <div
                  key={title}
                  style={{
                    background: gold ? B.black : B.white,
                    border: `1px solid ${gold ? B.gold : B.smoke}`,
                    borderTop: `3px solid ${gold ? B.gold : B.charcoal}`,
                    padding: "16px 18px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 8,
                      color: gold ? B.gold : B.iron,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 12,
                      fontWeight: 700,
                    }}
                  >
                    {title}
                  </div>
                  {fields.map(({ l, v, warn }) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "7px 0",
                        borderBottom: `1px solid ${
                          gold ? B.graphite : B.offwhite
                        }`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          color: gold ? B.ash : B.iron,
                          flexShrink: 0,
                        }}
                      >
                        {l}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          textAlign: "right",
                          maxWidth: 190,
                          fontFamily:
                            v === "—"
                              ? "'DM Mono', monospace"
                              : "Georgia, serif",
                          color:
                            v === "—"
                              ? B.smoke
                              : warn
                              ? B.red
                              : gold
                              ? B.gold
                              : B.black,
                          fontStyle: v && v.length > 30 ? "italic" : "normal",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          borderTop: `3px solid ${B.gold}`,
          background: B.black,
          padding: "13px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 11,
            color: B.ash,
            letterSpacing: 1,
          }}
        >
          ALFA INTERCONTINENTAL PVT. LTD.
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 8,
            color: B.goldDim,
            letterSpacing: 2,
          }}
        >
          {lastFetch
            ? `Last synced: ${lastFetch.toLocaleTimeString("en-IN")}`
            : "Connecting to live data..."}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            color: B.ash,
          }}
        >
          EST. 1985
        </span>
      </div>
    </div>
  );
}
