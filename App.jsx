import React, { useState, useRef } from "react";
import { Ruler, FileText, Camera, Download, Upload, Plus, Trash2, Printer, Hammer, TreePine, Home, Fence } from "lucide-react";

// ---------- Design tokens ----------
// walnut #3D2B1F  cedar #C1623D  parchment #FAF6F0  forest #45624A  ink #2A2622  sand #E8DDC9
const COLORS = {
  walnut: "#3D2B1F",
  cedar: "#C1623D",
  parchment: "#FAF6F0",
  forest: "#45624A",
  ink: "#2A2622",
  sand: "#E8DDC9",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyProject = () => ({
  id: uid(),
  name: "",
  clientName: "",
  address: "",
  date: new Date().toISOString().slice(0, 10),
  jobTypes: [],
  notes: "",
  measurements: [],
  supplies: [],
  quoteItems: [],
  taxRate: 0,
  photos: [],
  videos: [],
});

const JOB_TYPES = [
  { id: "deck", label: "Deck", icon: Hammer, color: COLORS.cedar },
  { id: "fence", label: "Fence", icon: Fence, color: COLORS.walnut },
  { id: "repair", label: "Home Repair", icon: Home, color: "#6B5B4A" },
  { id: "landscape", label: "Landscaping", icon: TreePine, color: COLORS.forest },
];

// ---------- Small UI atoms ----------
function RulerDivider() {
  const ticks = Array.from({ length: 60 });
  return (
    <div className="w-full h-4 flex items-end overflow-hidden" aria-hidden="true">
      {ticks.map((_, i) => (
        <div
          key={i}
          style={{
            width: "1.6%",
            height: i % 5 === 0 ? "100%" : "45%",
            background: COLORS.cedar,
            opacity: i % 5 === 0 ? 0.9 : 0.4,
            marginRight: "0.06%",
          }}
        />
      ))}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      className="text-xs font-medium uppercase tracking-widest mb-2"
      style={{ color: COLORS.cedar, fontFamily: "Inter, sans-serif", letterSpacing: "0.12em" }}
    >
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg p-5 ${className}`}
      style={{ background: "#fff", border: `1px solid ${COLORS.sand}` }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span
        className="block text-sm mb-1.5"
        style={{ color: COLORS.ink, fontFamily: "Inter, sans-serif", fontWeight: 500 }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  fontFamily: "Inter, sans-serif",
  border: `1px solid ${COLORS.sand}`,
  background: COLORS.parchment,
};

function TextInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 ${props.className || ""}`}
      style={{ ...inputStyle, ...props.style }}
    />
  );
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: { background: COLORS.cedar, color: "#fff" },
    secondary: { background: COLORS.walnut, color: "#fff" },
    ghost: { background: "transparent", color: COLORS.walnut, border: `1px solid ${COLORS.sand}` },
    danger: { background: "transparent", color: "#b3441f", border: "1px solid #e8c7b8" },
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
      style={{ ...styles[variant], fontFamily: "Inter, sans-serif" }}
    >
      {children}
    </button>
  );
}

// ---------- Main App ----------
export default function App() {
  const [project, setProject] = useState(emptyProject());
  const [tab, setTab] = useState("info");
  const [toast, setToast] = useState(null);
  const importInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const update = (patch) => setProject((p) => ({ ...p, ...patch }));

  const toggleJobType = (id) => {
    setProject((p) => ({
      ...p,
      jobTypes: p.jobTypes.includes(id) ? p.jobTypes.filter((j) => j !== id) : [...p.jobTypes, id],
    }));
  };

  // ---- Measurements ----
  const addMeasurement = (m) =>
    setProject((p) => ({ ...p, measurements: [...p.measurements, { id: uid(), ...m }] }));
  const removeMeasurement = (id) =>
    setProject((p) => ({ ...p, measurements: p.measurements.filter((m) => m.id !== id) }));
  const updateMeasurement = (id, patch) =>
    setProject((p) => ({
      ...p,
      measurements: p.measurements.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));

  // ---- Supplies ----
  const addSupply = (s) => setProject((p) => ({ ...p, supplies: [...p.supplies, { id: uid(), ...s }] }));
  const removeSupply = (id) =>
    setProject((p) => ({ ...p, supplies: p.supplies.filter((s) => s.id !== id) }));
  const updateSupply = (id, patch) =>
    setProject((p) => ({ ...p, supplies: p.supplies.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  // ---- Quote ----
  const addQuoteItem = () =>
    setProject((p) => ({
      ...p,
      quoteItems: [...p.quoteItems, { id: uid(), description: "", qty: 1, price: 0, category: "Material" }],
    }));
  const removeQuoteItem = (id) =>
    setProject((p) => ({ ...p, quoteItems: p.quoteItems.filter((q) => q.id !== id) }));
  const updateQuoteItem = (id, patch) =>
    setProject((p) => ({ ...p, quoteItems: p.quoteItems.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));

  const subtotal = project.quoteItems.reduce((sum, q) => sum + (Number(q.qty) || 0) * (Number(q.price) || 0), 0);
  const tax = subtotal * ((Number(project.taxRate) || 0) / 100);
  const total = subtotal + tax;

  // ---- Media ----
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setProject((p) => ({
          ...p,
          photos: [...p.photos, { id: uid(), name: file.name, dataUrl: reader.result, caption: "" }],
        }));
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const removePhoto = (id) => setProject((p) => ({ ...p, photos: p.photos.filter((ph) => ph.id !== id) }));
  const updatePhotoCaption = (id, caption) =>
    setProject((p) => ({ ...p, photos: p.photos.map((ph) => (ph.id === id ? { ...ph, caption } : ph)) }));

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const additions = files.map((f) => ({ id: uid(), name: f.name, caption: "", sizeMb: (f.size / 1e6).toFixed(1) }));
    setProject((p) => ({ ...p, videos: [...p.videos, ...additions] }));
    e.target.value = "";
  };
  const removeVideo = (id) => setProject((p) => ({ ...p, videos: p.videos.filter((v) => v.id !== id) }));
  const updateVideoCaption = (id, caption) =>
    setProject((p) => ({ ...p, videos: p.videos.map((v) => (v.id === id ? { ...v, caption } : v)) }));

  // ---- Export / Import ----
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (project.name || "project").replace(/[^a-z0-9-_]+/gi, "-");
    a.href = url;
    a.download = `${safeName}-tdfences.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Project file saved to your Downloads folder.");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setProject({ ...emptyProject(), ...data });
        showToast(`Loaded "${data.name || "project"}" from file.`);
      } catch {
        showToast("That file couldn't be read — make sure it's a project file saved from this tool.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const startNewProject = () => {
    if (window.confirm("Start a new project? Anything not downloaded will be lost.")) {
      setProject(emptyProject());
      setTab("info");
      showToast("Started a new project.");
    }
  };

  const printQuote = () => {
    setTab("quote");
    setTimeout(() => window.print(), 80);
  };

  const TABS = [
    { id: "info", label: "Project", icon: FileText },
    { id: "measure", label: "Measurements & Supplies", icon: Ruler },
    { id: "quote", label: "Quote", icon: FileText },
    { id: "media", label: "Photos & Videos", icon: Camera },
    { id: "export", label: "Save & Print", icon: Download },
  ];

  return (
    <div style={{ background: COLORS.parchment, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: COLORS.ink }}>
      <style>{`
        ${FONT_IMPORT}
        .td-display { font-family: 'Fraunces', serif; }
        input:focus, textarea:focus, select:focus { box-shadow: 0 0 0 2px ${COLORS.cedar}55; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .print-area { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print" style={{ background: COLORS.walnut }}>
        <div className="max-w-5xl mx-auto px-5 pt-6 pb-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="td-display text-2xl text-white" style={{ fontWeight: 600 }}>
              T&amp;D Decks &amp; Fences
            </h1>
            <p className="text-sm" style={{ color: COLORS.sand }}>
              Project measurements, supplies, quotes &amp; client media — all kept on your computer.
            </p>
          </div>
          <Button variant="ghost" onClick={startNewProject} style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
            <Plus size={16} /> New Project
          </Button>
        </div>
        <RulerDivider />
      </header>

      {/* Tabs */}
      <nav className="no-print max-w-5xl mx-auto px-5 mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition"
              style={{
                background: active ? COLORS.cedar : "#fff",
                color: active ? "#fff" : COLORS.ink,
                border: `1px solid ${active ? COLORS.cedar : COLORS.sand}`,
              }}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* Toast */}
      {toast && (
        <div
          className="no-print max-w-5xl mx-auto px-5 mt-3"
        >
          <div className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.forest, color: "#fff" }}>
            {toast}
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-5 py-6">
        {tab === "info" && <ProjectInfoTab project={project} update={update} toggleJobType={toggleJobType} />}
        {tab === "measure" && (
          <MeasureTab
            project={project}
            addMeasurement={addMeasurement}
            removeMeasurement={removeMeasurement}
            updateMeasurement={updateMeasurement}
            addSupply={addSupply}
            removeSupply={removeSupply}
            updateSupply={updateSupply}
          />
        )}
        {tab === "quote" && (
          <QuoteTab
            project={project}
            addQuoteItem={addQuoteItem}
            removeQuoteItem={removeQuoteItem}
            updateQuoteItem={updateQuoteItem}
            update={update}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        )}
        {tab === "media" && (
          <MediaTab
            project={project}
            photoInputRef={photoInputRef}
            videoInputRef={videoInputRef}
            handlePhotoUpload={handlePhotoUpload}
            handleVideoUpload={handleVideoUpload}
            removePhoto={removePhoto}
            removeVideo={removeVideo}
            updatePhotoCaption={updatePhotoCaption}
            updateVideoCaption={updateVideoCaption}
          />
        )}
        {tab === "export" && (
          <ExportTab
            project={project}
            downloadJson={downloadJson}
            printQuote={printQuote}
            importInputRef={importInputRef}
            handleImport={handleImport}
          />
        )}
      </main>
    </div>
  );
}

// ---------- Tab: Project Info ----------
function ProjectInfoTab({ project, update, toggleJobType }) {
  return (
    <Card>
      <SectionLabel>Project Details</SectionLabel>
      <div className="grid md:grid-cols-2 gap-x-6">
        <Field label="Project name">
          <TextInput
            placeholder="e.g. Henderson Backyard Deck"
            value={project.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field label="Client name">
          <TextInput
            placeholder="e.g. Mike Henderson"
            value={project.clientName}
            onChange={(e) => update({ clientName: e.target.value })}
          />
        </Field>
        <Field label="Job address">
          <TextInput
            placeholder="123 Maple St, Alpharetta, GA"
            value={project.address}
            onChange={(e) => update({ address: e.target.value })}
          />
        </Field>
        <Field label="Date">
          <TextInput type="date" value={project.date} onChange={(e) => update({ date: e.target.value })} />
        </Field>
      </div>

      <SectionLabel>What kind of job is this?</SectionLabel>
      <div className="flex flex-wrap gap-2 mb-5">
        {JOB_TYPES.map((jt) => {
          const Icon = jt.icon;
          const active = project.jobTypes.includes(jt.id);
          return (
            <button
              key={jt.id}
              onClick={() => toggleJobType(jt.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: active ? jt.color : "#fff",
                color: active ? "#fff" : COLORS.ink,
                border: `1px solid ${active ? jt.color : COLORS.sand}`,
              }}
            >
              <Icon size={16} /> {jt.label}
            </button>
          );
        })}
      </div>

      <Field label="Notes">
        <textarea
          rows={4}
          className="w-full rounded-md px-3 py-2 text-base focus:outline-none"
          style={inputStyle}
          placeholder="Anything important to remember about this job..."
          value={project.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </Field>
    </Card>
  );
}

// ---------- Tab: Measurements & Supplies ----------
function MeasureTab({ project, addMeasurement, removeMeasurement, updateMeasurement, addSupply, removeSupply, updateSupply }) {
  const [deck, setDeck] = useState({ length: "", width: "", boardWidthIn: 5.5 });
  const [fence, setFence] = useState({ length: "", panelWidth: 8, spacing: 8 });

  const runDeckCalc = () => {
    const L = Number(deck.length) || 0;
    const W = Number(deck.width) || 0;
    const boardWidthFt = (Number(deck.boardWidthIn) || 5.5) / 12;
    if (!L || !W) return;
    const sqft = L * W;
    const rows = Math.ceil(W / boardWidthFt);
    const linearFt = Math.ceil(rows * L);
    addMeasurement({ label: "Deck area", value: sqft.toFixed(1), unit: "sq ft" });
    addSupply({ item: "Decking boards", qty: linearFt, unit: "linear ft", note: `Based on ${deck.boardWidthIn}" wide boards` });
  };

  const runFenceCalc = () => {
    const L = Number(fence.length) || 0;
    const panelW = Number(fence.panelWidth) || 8;
    if (!L) return;
    const panels = Math.ceil(L / panelW);
    const posts = panels + 1;
    addMeasurement({ label: "Fence run", value: L, unit: "linear ft" });
    addSupply({ item: "Fence panels", qty: panels, unit: "panels", note: `${panelW} ft wide each` });
    addSupply({ item: "Fence posts", qty: posts, unit: "posts", note: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Quick Estimators</SectionLabel>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-md p-4" style={{ background: COLORS.parchment, border: `1px solid ${COLORS.sand}` }}>
            <div className="font-medium mb-3 flex items-center gap-2" style={{ color: COLORS.cedar }}>
              <Hammer size={16} /> Deck
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <TextInput placeholder="Length ft" value={deck.length} onChange={(e) => setDeck({ ...deck, length: e.target.value })} />
              <TextInput placeholder="Width ft" value={deck.width} onChange={(e) => setDeck({ ...deck, width: e.target.value })} />
              <TextInput placeholder='Board in"' value={deck.boardWidthIn} onChange={(e) => setDeck({ ...deck, boardWidthIn: e.target.value })} />
            </div>
            <Button variant="primary" onClick={runDeckCalc}><Plus size={14} /> Add to measurements</Button>
          </div>
          <div className="rounded-md p-4" style={{ background: COLORS.parchment, border: `1px solid ${COLORS.sand}` }}>
            <div className="font-medium mb-3 flex items-center gap-2" style={{ color: COLORS.walnut }}>
              <Fence size={16} /> Fence
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <TextInput placeholder="Total length ft" value={fence.length} onChange={(e) => setFence({ ...fence, length: e.target.value })} />
              <TextInput placeholder="Panel width ft" value={fence.panelWidth} onChange={(e) => setFence({ ...fence, panelWidth: e.target.value })} />
            </div>
            <Button variant="secondary" onClick={runFenceCalc}><Plus size={14} /> Add to measurements</Button>
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: "#8a7a68" }}>
          These give you a starting point — every row below can be edited by hand.
        </p>
      </Card>

      <Card>
        <SectionLabel>Measurements</SectionLabel>
        <EditableTable
          rows={project.measurements}
          columns={[
            { key: "label", label: "What", placeholder: "e.g. Deck area" },
            { key: "value", label: "Value", placeholder: "0", width: "w-24" },
            { key: "unit", label: "Unit", placeholder: "sq ft", width: "w-28" },
          ]}
          onAdd={() => addMeasurement({ label: "", value: "", unit: "" })}
          onUpdate={updateMeasurement}
          onRemove={removeMeasurement}
          addLabel="Add measurement"
        />
      </Card>

      <Card>
        <SectionLabel>Supplies Needed</SectionLabel>
        <EditableTable
          rows={project.supplies}
          columns={[
            { key: "item", label: "Item", placeholder: "e.g. 2x6 cedar boards" },
            { key: "qty", label: "Qty", placeholder: "0", width: "w-20" },
            { key: "unit", label: "Unit", placeholder: "each", width: "w-24" },
            { key: "note", label: "Note", placeholder: "optional" },
          ]}
          onAdd={() => addSupply({ item: "", qty: "", unit: "", note: "" })}
          onUpdate={updateSupply}
          onRemove={removeSupply}
          addLabel="Add supply item"
        />
      </Card>
    </div>
  );
}

function EditableTable({ rows, columns, onAdd, onUpdate, onRemove, addLabel }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>
          <thead>
            <tr style={{ color: "#8a7a68" }}>
              {columns.map((c) => (
                <th key={c.key} className="text-left font-medium pb-2 pr-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  {c.label}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t" style={{ borderColor: COLORS.sand }}>
                {columns.map((c) => (
                  <td key={c.key} className="py-2 pr-2">
                    <input
                      value={row[c.key] ?? ""}
                      placeholder={c.placeholder}
                      onChange={(e) => onUpdate(row.id, { [c.key]: e.target.value })}
                      className={`rounded px-2 py-1.5 w-full focus:outline-none ${c.width || ""}`}
                      style={inputStyle}
                    />
                  </td>
                ))}
                <td className="py-2">
                  <button onClick={() => onRemove(row.id)} style={{ color: "#b3441f" }} aria-label="Remove row">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="py-4 text-center" style={{ color: "#a89683", fontFamily: "Inter, sans-serif" }}>
                  Nothing added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button variant="ghost" className="mt-3" onClick={onAdd}>
        <Plus size={14} /> {addLabel}
      </Button>
    </div>
  );
}

// ---------- Tab: Quote ----------
function QuoteTab({ project, addQuoteItem, removeQuoteItem, updateQuoteItem, update, subtotal, tax, total }) {
  return (
    <div className="space-y-6">
      <div className="print-area">
        <Card>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
            <div>
              <h2 className="td-display text-xl" style={{ color: COLORS.walnut, fontWeight: 600 }}>
                Quote
              </h2>
              <p className="text-sm" style={{ color: "#8a7a68" }}>
                {project.name || "Untitled project"} {project.clientName ? `— ${project.clientName}` : ""}
              </p>
            </div>
            <div className="text-sm text-right" style={{ color: "#8a7a68" }}>
              <div>{project.date}</div>
              <div>{project.address}</div>
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr style={{ color: "#8a7a68" }} className="text-left">
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium w-16">Qty</th>
                <th className="pb-2 font-medium w-24">Unit price</th>
                <th className="pb-2 font-medium w-24 text-right">Total</th>
                <th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {project.quoteItems.map((q) => (
                <tr key={q.id} className="border-t" style={{ borderColor: COLORS.sand }}>
                  <td className="py-2 pr-2 no-print">
                    <select
                      value={q.category}
                      onChange={(e) => updateQuoteItem(q.id, { category: e.target.value })}
                      className="rounded px-2 py-1.5 w-full"
                      style={inputStyle}
                    >
                      <option>Material</option>
                      <option>Labor</option>
                      <option>Other</option>
                    </select>
                  </td>
                  <td className="py-1 pr-2 hidden print:table-cell">{q.category}</td>
                  <td className="py-2 pr-2">
                    <input
                      value={q.description}
                      placeholder="e.g. Composite decking install"
                      onChange={(e) => updateQuoteItem(q.id, { description: e.target.value })}
                      className="rounded px-2 py-1.5 w-full no-print-border"
                      style={inputStyle}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={q.qty}
                      onChange={(e) => updateQuoteItem(q.id, { qty: e.target.value })}
                      className="rounded px-2 py-1.5 w-16"
                      style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      value={q.price}
                      onChange={(e) => updateQuoteItem(q.id, { price: e.target.value })}
                      className="rounded px-2 py-1.5 w-24"
                      style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }}
                    />
                  </td>
                  <td className="py-2 text-right" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    ${((Number(q.qty) || 0) * (Number(q.price) || 0)).toFixed(2)}
                  </td>
                  <td className="no-print">
                    <button onClick={() => removeQuoteItem(q.id)} style={{ color: "#b3441f" }} aria-label="Remove item">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button variant="ghost" onClick={addQuoteItem} className="no-print mb-4">
            <Plus size={14} /> Add line item
          </Button>

          <div className="flex justify-end">
            <div className="w-64 text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span style={{ fontFamily: "Inter, sans-serif" }} className="no-print">
                  Tax %{" "}
                  <input
                    value={project.taxRate}
                    onChange={(e) => update({ taxRate: e.target.value })}
                    className="w-14 ml-1 rounded px-1 py-0.5"
                    style={inputStyle}
                  />
                </span>
                <span className="hidden print:inline" style={{ fontFamily: "Inter, sans-serif" }}>
                  Tax ({project.taxRate || 0}%)
                </span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 mt-1 font-semibold text-base" style={{ borderTop: `1px solid ${COLORS.sand}`, color: COLORS.walnut }}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="no-print">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={16} /> Print or save quote as PDF
        </Button>
        <p className="text-xs mt-2" style={{ color: "#8a7a68" }}>
          When the print window opens, choose "Save as PDF" instead of a printer to keep a copy on your computer.
        </p>
      </Card>
    </div>
  );
}

// ---------- Tab: Media ----------
function MediaTab({ project, photoInputRef, videoInputRef, handlePhotoUpload, handleVideoUpload, removePhoto, removeVideo, updatePhotoCaption, updateVideoCaption }) {
  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Demo Photos</SectionLabel>
        <p className="text-sm mb-3" style={{ color: "#8a7a68" }}>
          Add photos to show the client exactly what they're getting — past work, material samples, the job site.
        </p>
        <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        <Button variant="primary" onClick={() => photoInputRef.current.click()}>
          <Upload size={16} /> Add photos
        </Button>

        {project.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            {project.photos.map((ph) => (
              <div key={ph.id} className="rounded-md overflow-hidden" style={{ border: `1px solid ${COLORS.sand}` }}>
                <img src={ph.dataUrl} alt={ph.caption || ph.name} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <input
                    value={ph.caption}
                    placeholder="Caption (optional)"
                    onChange={(e) => updatePhotoCaption(ph.id, e.target.value)}
                    className="w-full text-xs rounded px-2 py-1"
                    style={inputStyle}
                  />
                  <button onClick={() => removePhoto(ph.id)} className="text-xs mt-1 flex items-center gap-1" style={{ color: "#b3441f" }}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionLabel>Demo Videos</SectionLabel>
        <p className="text-sm mb-3" style={{ color: "#8a7a68" }}>
          Video files are large, so this tool keeps track of the file name and a caption rather than storing the video itself. Attach the actual video file when you text or email the client.
        </p>
        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
        <Button variant="secondary" onClick={() => videoInputRef.current.click()}>
          <Upload size={16} /> Add video reference
        </Button>

        {project.videos.length > 0 && (
          <div className="mt-4 space-y-2">
            {project.videos.map((v) => (
              <div key={v.id} className="flex items-center gap-3 rounded-md p-2" style={{ border: `1px solid ${COLORS.sand}` }}>
                <Camera size={18} style={{ color: COLORS.walnut }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{v.name} <span className="text-xs" style={{ color: "#a89683" }}>({v.sizeMb} MB)</span></div>
                  <input
                    value={v.caption}
                    placeholder="What does this video show?"
                    onChange={(e) => updateVideoCaption(v.id, e.target.value)}
                    className="w-full text-xs rounded px-2 py-1 mt-1"
                    style={inputStyle}
                  />
                </div>
                <button onClick={() => removeVideo(v.id)} style={{ color: "#b3441f" }} aria-label="Remove video">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Tab: Export ----------
function ExportTab({ project, downloadJson, printQuote, importInputRef, handleImport }) {
  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Save This Project</SectionLabel>
        <p className="text-sm mb-4" style={{ color: "#8a7a68" }}>
          Everything you've entered — measurements, supplies, the quote, and photo captions — downloads as one file straight to your computer. Nothing is stored anywhere online.
        </p>
        <Button variant="primary" onClick={downloadJson}>
          <Download size={16} /> Download project file
        </Button>
      </Card>

      <Card>
        <SectionLabel>Open a Saved Project</SectionLabel>
        <p className="text-sm mb-4" style={{ color: "#8a7a68" }}>
          Pick a project file you downloaded earlier to keep working on it.
        </p>
        <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        <Button variant="ghost" onClick={() => importInputRef.current.click()}>
          <Upload size={16} /> Open project file
        </Button>
      </Card>

      <Card>
        <SectionLabel>Send the Client a Quote</SectionLabel>
        <p className="text-sm mb-4" style={{ color: "#8a7a68" }}>
          Opens the quote and your computer's print window — choose "Save as PDF" to get a file you can email or text.
        </p>
        <Button variant="secondary" onClick={printQuote}>
          <Printer size={16} /> Print / save quote as PDF
        </Button>
      </Card>
    </div>
  );
}
