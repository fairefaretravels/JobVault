import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Briefcase, Users, Calculator, Package, Camera, FileText, Download, Upload,
  Plus, Trash2, Printer, ChevronLeft, FolderOpen, CheckSquare, Square,
  Hammer, Fence, PaintRoller, LayoutGrid, Wrench,
} from "lucide-react";

// ---------- Tokens ----------
const C = {
  ledger: "#1B3A4B",
  safety: "#F2A93B",
  paper: "#F7F5F0",
  ink: "#23262B",
  steel: "#C9CDD3",
  ok: "#3F7D52",
  warn: "#B3441F",
};
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;
const uid = () => Math.random().toString(36).slice(2, 10);
const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// ---------- Trade presets for Smart Quote Builder ----------
const PRESETS = {
  flooring: {
    label: "Flooring",
    icon: LayoutGrid,
    fields: [
      { key: "sqft", label: "Square footage", default: 0 },
      { key: "boxCoverage", label: "Sq ft per box", default: 24 },
      { key: "materialCostPerBox", label: "Cost per box ($)", default: 55 },
      { key: "underlayment", label: "Needs underlayment?", type: "bool", default: true },
      { key: "baseboardFt", label: "Baseboard linear ft", default: 0 },
      { key: "baseboardCostPerFt", label: "Baseboard cost/ft ($)", default: 2.5 },
      { key: "wastePct", label: "Waste %", default: 10 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 45 },
    ],
    calc: (a) => {
      const boxes = Math.ceil((a.sqft * (1 + a.wastePct / 100)) / (a.boxCoverage || 1));
      const materials = [
        { item: "Flooring boxes", qty: boxes, unit: "boxes", unitCost: a.materialCostPerBox },
        { item: "Transition strips", qty: Math.ceil(a.sqft / 300) || 1, unit: "each", unitCost: 18 },
        { item: "Adhesive / fasteners", qty: 1, unit: "kit", unitCost: 45 },
      ];
      if (a.underlayment) materials.splice(1, 0, { item: "Underlayment", qty: Math.ceil(a.sqft / 100) || 1, unit: "rolls", unitCost: 32 });
      if (Number(a.baseboardFt) > 0) materials.push({ item: "Baseboard", qty: Number(a.baseboardFt), unit: "linear ft", unitCost: a.baseboardCostPerFt });
      return materials;
    },
  },
  painting: {
    label: "Painting",
    icon: PaintRoller,
    fields: [
      { key: "wallSqft", label: "Wall area (sq ft)", default: 0 },
      { key: "coats", label: "Number of coats", default: 2 },
      { key: "coveragePerGallon", label: "Sq ft per gallon", default: 350 },
      { key: "paintCostPerGallon", label: "Cost per gallon ($)", default: 38 },
      { key: "wastePct", label: "Waste %", default: 5 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 40 },
    ],
    calc: (a) => {
      const gallons = Math.ceil((a.wallSqft * a.coats * (1 + a.wastePct / 100)) / (a.coveragePerGallon || 1));
      return [
        { item: "Paint", qty: gallons, unit: "gallons", unitCost: a.paintCostPerGallon },
        { item: "Tape, plastic, brushes", qty: 1, unit: "kit", unitCost: 60 },
      ];
    },
  },
  decking: {
    label: "Decking",
    icon: Hammer,
    fields: [
      { key: "length", label: "Deck length (ft)", default: 0 },
      { key: "width", label: "Deck width (ft)", default: 0 },
      { key: "boardWidthIn", label: 'Board width (in)', default: 5.5 },
      { key: "boardCostPerFt", label: "Board cost ($/linear ft)", default: 3.2 },
      { key: "wastePct", label: "Waste %", default: 10 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 45 },
    ],
    calc: (a) => {
      const boardWidthFt = (a.boardWidthIn || 5.5) / 12;
      const rows = Math.ceil((a.width || 0) / boardWidthFt);
      const linearFt = Math.ceil(rows * (a.length || 0) * (1 + a.wastePct / 100));
      return [
        { item: "Decking boards", qty: linearFt, unit: "linear ft", unitCost: a.boardCostPerFt },
        { item: "Joist hardware & screws", qty: 1, unit: "kit", unitCost: 80 },
      ];
    },
  },
  fencing: {
    label: "Fencing",
    icon: Fence,
    fields: [
      { key: "length", label: "Total fence length (ft)", default: 0 },
      { key: "panelWidth", label: "Panel width (ft)", default: 8 },
      { key: "panelCost", label: "Cost per panel ($)", default: 85 },
      { key: "postCost", label: "Cost per post ($)", default: 22 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 45 },
    ],
    calc: (a) => {
      const panels = Math.ceil((a.length || 0) / (a.panelWidth || 8));
      const posts = panels + 1;
      return [
        { item: "Fence panels", qty: panels, unit: "panels", unitCost: a.panelCost },
        { item: "Fence posts", qty: posts, unit: "posts", unitCost: a.postCost },
        { item: "Concrete (post-set)", qty: posts, unit: "bags", unitCost: 6 },
      ];
    },
  },
  drywall: {
    label: "Drywall",
    icon: Wrench,
    fields: [
      { key: "wallSqft", label: "Wall area (sq ft)", default: 0 },
      { key: "sheetSizeSqft", label: "Sheet size (sq ft)", default: 32 },
      { key: "sheetCost", label: "Cost per sheet ($)", default: 14 },
      { key: "wastePct", label: "Waste %", default: 10 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 42 },
    ],
    calc: (a) => {
      const sheets = Math.ceil((a.wallSqft * (1 + a.wastePct / 100)) / (a.sheetSizeSqft || 32));
      return [
        { item: "Drywall sheets", qty: sheets, unit: "sheets", unitCost: a.sheetCost },
        { item: "Joint compound & tape", qty: Math.ceil(sheets / 10) || 1, unit: "buckets", unitCost: 18 },
        { item: "Screws", qty: 1, unit: "box", unitCost: 12 },
      ];
    },
  },
  custom: {
    label: "Custom / Other",
    icon: Briefcase,
    fields: [
      { key: "qty", label: "Quantity", default: 0 },
      { key: "unitLabel", label: "Unit label", type: "text", default: "sq ft" },
      { key: "materialCostPerUnit", label: "Material cost per unit ($)", default: 0 },
      { key: "wastePct", label: "Waste %", default: 5 },
      { key: "laborHours", label: "Labor hours", default: 0 },
      { key: "laborRate", label: "Labor rate ($/hr)", default: 40 },
    ],
    calc: (a) => {
      const qty = Math.ceil((a.qty || 0) * (1 + a.wastePct / 100));
      return [{ item: "Materials", qty, unit: a.unitLabel || "units", unitCost: a.materialCostPerUnit }];
    },
  },
};

const emptyProject = (name = "") => ({
  id: uid(),
  name,
  status: "Estimate",
  createdAt: new Date().toISOString().slice(0, 10),
  trade: "flooring",
  notes: "",
  equipment: [],
  materials: [],
  quoteItems: [],
  profitMarginPct: 15,
  taxPct: 0,
  travelFee: 0,
  photos: [],
  videos: [],
  photoFiles: {}, // id -> File (kept for folder export this session)
  videoFiles: {}, // id -> File
});

const emptyCustomer = () => ({ id: uid(), name: "", phone: "", email: "", address: "", projects: [] });

// ---------- UI atoms ----------
function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg p-5 ${className}`} style={{ background: "#fff", border: `1px solid ${C.steel}` }}>
      {children}
    </div>
  );
}
function SectionLabel({ children }) {
  return (
    <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: C.ledger, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em" }}>
      {children}
    </div>
  );
}
const inputStyle = { fontFamily: "Inter, sans-serif", border: `1px solid ${C.steel}`, background: C.paper };
function TextInput(props) {
  return <input {...props} className={`w-full rounded-md px-3 py-2 text-base focus:outline-none ${props.className || ""}`} style={{ ...inputStyle, ...props.style }} />;
}
function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm mb-1.5" style={{ fontFamily: "Inter, sans-serif", fontWeight: 500, color: C.ink }}>{label}</span>
      {children}
    </label>
  );
}
function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: { background: C.ledger, color: "#fff" },
    accent: { background: C.safety, color: C.ink },
    ghost: { background: "transparent", color: C.ledger, border: `1px solid ${C.steel}` },
    danger: { background: "transparent", color: C.warn, border: "1px solid #e8c7b8" },
  };
  return (
    <button {...props} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${className}`} style={{ ...styles[variant], fontFamily: "Inter, sans-serif" }}>
      {children}
    </button>
  );
}
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="no-print max-w-5xl mx-auto px-5 mt-3">
      <div className="rounded-md px-4 py-2 text-sm" style={{ background: C.ok, color: "#fff" }}>{msg}</div>
    </div>
  );
}

// ============================================================
export default function App() {
  const [customers, setCustomers] = useState([]);
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectTab, setProjectTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const backupInputRef = useRef(null);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const activeCustomer = customers.find((c) => c.id === activeCustomerId);
  const activeProject = activeCustomer?.projects.find((p) => p.id === activeProjectId);

  const updateCustomer = (id, patch) => setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const updateProject = (patch) =>
    setCustomers((cs) =>
      cs.map((c) =>
        c.id !== activeCustomerId ? c : { ...c, projects: c.projects.map((p) => (p.id === activeProjectId ? { ...p, ...patch } : p)) }
      )
    );

  const addCustomer = () => {
    const c = emptyCustomer();
    setCustomers((cs) => [...cs, c]);
    setActiveCustomerId(c.id);
  };
  const removeCustomer = (id) => {
    if (!window.confirm("Delete this customer and all their projects?")) return;
    setCustomers((cs) => cs.filter((c) => c.id !== id));
    if (activeCustomerId === id) setActiveCustomerId(null);
  };
  const addProject = () => {
    const p = emptyProject("New Project");
    updateCustomer(activeCustomerId, { projects: [...activeCustomer.projects, p] });
    setActiveProjectId(p.id);
    setProjectTab("overview");
  };
  const removeProject = (id) => {
    if (!window.confirm("Delete this project?")) return;
    updateCustomer(activeCustomerId, { projects: activeCustomer.projects.filter((p) => p.id !== id) });
    if (activeProjectId === id) setActiveProjectId(null);
  };

  // ---- Backup everything (since this preview keeps data in memory only) ----
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(customers.map(stripFiles), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "jobvault-backup.json";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    notify("Full backup downloaded. Keep this file safe — it's your entire customer & project list.");
  };
  const importAll = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setCustomers(data);
        notify("Backup restored.");
      } catch { notify("Couldn't read that file — make sure it's a JobVault backup."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ---------- Project workspace ----------
  if (activeProject) {
    return (
      <Shell notify={notify} toast={toast}>
        <button onClick={() => setActiveProjectId(null)} className="no-print flex items-center gap-1 text-sm mb-4" style={{ color: C.ledger, fontFamily: "Inter, sans-serif" }}>
          <ChevronLeft size={16} /> Back to {activeCustomer.name || "customer"}
        </button>
        <ProjectHeader project={activeProject} customer={activeCustomer} update={updateProject} />
        <ProjectTabs tab={projectTab} setTab={setProjectTab} />
        <div className="mt-4">
          {projectTab === "overview" && <OverviewTab project={activeProject} update={updateProject} />}
          {projectTab === "quote" && <SmartQuoteTab project={activeProject} update={updateProject} notify={notify} />}
          {projectTab === "materials" && <MaterialsTab project={activeProject} update={updateProject} />}
          {projectTab === "media" && <MediaTab project={activeProject} update={updateProject} />}
          {projectTab === "documents" && <DocumentsTab project={activeProject} customer={activeCustomer} update={updateProject} />}
          {projectTab === "export" && <ProjectExportTab project={activeProject} customer={activeCustomer} notify={notify} />}
        </div>
      </Shell>
    );
  }

  // ---------- Customer's project list ----------
  if (activeCustomer) {
    return (
      <Shell notify={notify} toast={toast}>
        <button onClick={() => setActiveCustomerId(null)} className="no-print flex items-center gap-1 text-sm mb-4" style={{ color: C.ledger, fontFamily: "Inter, sans-serif" }}>
          <ChevronLeft size={16} /> All customers
        </button>
        <Card className="mb-5">
          <SectionLabel>Customer</SectionLabel>
          <div className="grid md:grid-cols-2 gap-x-6">
            <Field label="Name"><TextInput value={activeCustomer.name} onChange={(e) => updateCustomer(activeCustomer.id, { name: e.target.value })} placeholder="e.g. Sara Johnson" /></Field>
            <Field label="Phone"><TextInput value={activeCustomer.phone} onChange={(e) => updateCustomer(activeCustomer.id, { phone: e.target.value })} placeholder="(555) 555-1234" /></Field>
            <Field label="Email"><TextInput value={activeCustomer.email} onChange={(e) => updateCustomer(activeCustomer.id, { email: e.target.value })} placeholder="sara@email.com" /></Field>
            <Field label="Address"><TextInput value={activeCustomer.address} onChange={(e) => updateCustomer(activeCustomer.id, { address: e.target.value })} placeholder="123 Maple St" /></Field>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Projects</SectionLabel>
          <Button variant="accent" onClick={addProject}><Plus size={14} /> New Project</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {activeCustomer.projects.map((p) => (
            <FolderCard key={p.id} project={p} onOpen={() => { setActiveProjectId(p.id); setProjectTab("overview"); }} onDelete={() => removeProject(p.id)} />
          ))}
          {activeCustomer.projects.length === 0 && <p className="text-sm" style={{ color: "#7a8590" }}>No projects yet for this customer.</p>}
        </div>
      </Shell>
    );
  }

  // ---------- Dashboard ----------
  return (
    <Shell notify={notify} toast={toast}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <SectionLabel>Customers</SectionLabel>
        <div className="flex gap-2">
          <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={importAll} />
          <Button variant="ghost" onClick={() => backupInputRef.current.click()}><Upload size={14} /> Restore backup</Button>
          <Button variant="ghost" onClick={exportAll}><Download size={14} /> Backup everything</Button>
          <Button variant="accent" onClick={addCustomer}><Plus size={14} /> New Customer</Button>
        </div>
      </div>

      {customers.length === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: "#7a8590" }}>
            No customers yet. Click <strong>New Customer</strong> to start your first project — or <strong>Restore backup</strong> if you've used JobVault before and have a backup file.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <Card key={c.id}>
              <div className="flex justify-between items-start">
                <div className="cursor-pointer" onClick={() => setActiveCustomerId(c.id)}>
                  <div className="font-semibold" style={{ fontFamily: "Fraunces, serif", color: C.ledger }}>{c.name || "Unnamed customer"}</div>
                  <div className="text-sm" style={{ color: "#7a8590" }}>{c.phone || c.email || "No contact info yet"}</div>
                  <div className="text-xs mt-1" style={{ color: "#7a8590" }}>{c.projects.length} project{c.projects.length === 1 ? "" : "s"}</div>
                </div>
                <button onClick={() => removeCustomer(c.id)} style={{ color: C.warn }}><Trash2 size={16} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}

function stripFiles(customer) {
  return { ...customer, projects: customer.projects.map(({ photoFiles, videoFiles, ...p }) => p) };
}

function Shell({ children, toast }) {
  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: C.ink }}>
      <style>{`
        ${FONT_IMPORT}
        .td-display { font-family: 'Fraunces', serif; }
        @media print { .no-print { display:none !important; } body { background:#fff !important; } .print-area { border:none !important; box-shadow:none !important; } }
      `}</style>
      <header className="no-print" style={{ background: C.ledger }}>
        <div className="max-w-5xl mx-auto px-5 py-5 flex items-center gap-3">
          <Briefcase color={C.safety} size={24} />
          <div>
            <h1 className="td-display text-2xl text-white" style={{ fontWeight: 700 }}>JobVault</h1>
            <p className="text-xs" style={{ color: "#AFC2CC" }}>Estimating & project tracking that lives on your computer — no subscription, no login.</p>
          </div>
        </div>
      </header>
      <Toast msg={toast} />
      <main className="max-w-5xl mx-auto px-5 py-6">{children}</main>
    </div>
  );
}

function FolderCard({ project, onOpen, onDelete }) {
  const preset = PRESETS[project.trade] || PRESETS.custom;
  const Icon = preset.icon;
  return (
    <div className="rounded-lg relative" style={{ background: "#fff", border: `1px solid ${C.steel}` }}>
      <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-t text-xs font-medium" style={{ background: C.safety, color: C.ink }}>{project.status}</div>
      <div className="p-4 cursor-pointer" onClick={onOpen}>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} style={{ color: C.ledger }} />
          <span className="font-semibold" style={{ fontFamily: "Fraunces, serif", color: C.ledger }}>{project.name || "Untitled project"}</span>
        </div>
        <div className="text-xs" style={{ color: "#7a8590" }}>{preset.label} · created {project.createdAt}</div>
      </div>
      <div className="px-4 pb-3 flex justify-between items-center">
        <button onClick={onOpen} className="text-xs" style={{ color: C.ledger }}>Open <FolderOpen size={12} className="inline" /></button>
        <button onClick={onDelete} style={{ color: C.warn }}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function ProjectHeader({ project, customer, update }) {
  return (
    <Card className="mb-5">
      <div className="grid md:grid-cols-3 gap-x-6">
        <Field label="Project name"><TextInput value={project.name} onChange={(e) => update({ name: e.target.value })} /></Field>
        <Field label="Status">
          <select value={project.status} onChange={(e) => update({ status: e.target.value })} className="w-full rounded-md px-3 py-2" style={inputStyle}>
            {["Estimate", "Approved", "In Progress", "Complete", "Invoiced", "Paid"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Trade type">
          <select value={project.trade} onChange={(e) => update({ trade: e.target.value })} className="w-full rounded-md px-3 py-2" style={inputStyle}>
            {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="text-xs" style={{ color: "#7a8590" }}>Customer: {customer.name || "Unnamed"} · {customer.address}</div>
    </Card>
  );
}

function ProjectTabs({ tab, setTab }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "quote", label: "Smart Quote", icon: Calculator },
    { id: "materials", label: "Materials & Leftovers", icon: Package },
    { id: "media", label: "Photos & Videos", icon: Camera },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "export", label: "Save / Export", icon: Download },
  ];
  return (
    <nav className="no-print flex flex-wrap gap-2">
      {tabs.map((t) => {
        const Icon = t.icon; const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium"
            style={{ background: active ? C.ledger : "#fff", color: active ? "#fff" : C.ink, border: `1px solid ${active ? C.ledger : C.steel}` }}>
            <Icon size={15} /> {t.label}
          </button>
        );
      })}
    </nav>
  );
}

// ---------- Overview ----------
function OverviewTab({ project, update }) {
  const addEquip = () => update({ equipment: [...project.equipment, { id: uid(), label: "", checked: false }] });
  const toggleEquip = (id) => update({ equipment: project.equipment.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)) });
  const setEquipLabel = (id, label) => update({ equipment: project.equipment.map((e) => (e.id === id ? { ...e, label } : e)) });
  const removeEquip = (id) => update({ equipment: project.equipment.filter((e) => e.id !== id) });

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Notes</SectionLabel>
        <textarea rows={5} className="w-full rounded-md px-3 py-2" style={inputStyle} value={project.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Site access, gate codes, pets, special requests..." />
      </Card>
      <Card>
        <SectionLabel>Equipment Checklist</SectionLabel>
        {project.equipment.map((e) => (
          <div key={e.id} className="flex items-center gap-2 mb-2">
            <button onClick={() => toggleEquip(e.id)}>{e.checked ? <CheckSquare size={18} style={{ color: C.ok }} /> : <Square size={18} style={{ color: "#7a8590" }} />}</button>
            <input value={e.label} onChange={(ev) => setEquipLabel(e.id, ev.target.value)} placeholder="e.g. Trailer, miter saw, ladder" className="flex-1 rounded px-2 py-1.5" style={inputStyle} />
            <button onClick={() => removeEquip(e.id)} style={{ color: C.warn }}><Trash2 size={14} /></button>
          </div>
        ))}
        <Button variant="ghost" onClick={addEquip} className="mt-1"><Plus size={14} /> Add equipment</Button>
      </Card>
    </div>
  );
}

// ---------- Smart Quote ----------
function SmartQuoteTab({ project, update, notify }) {
  const preset = PRESETS[project.trade] || PRESETS.custom;
  const [answers, setAnswers] = useState(() => Object.fromEntries(preset.fields.map((f) => [f.key, f.default])));
  const [preview, setPreview] = useState(null);

  const setA = (key, val) => setAnswers((a) => ({ ...a, [key]: val }));

  const runCalc = () => {
    const materials = preset.calc(answers);
    const materialsCost = materials.reduce((s, m) => s + m.qty * m.unitCost, 0);
    const laborCost = (Number(answers.laborHours) || 0) * (Number(answers.laborRate) || 0) + (Number(project.travelFee) || 0);
    const subtotal = materialsCost + laborCost;
    const profit = subtotal * (project.profitMarginPct / 100);
    const preTax = subtotal + profit;
    const tax = preTax * (project.taxPct / 100);
    const final = preTax + tax;
    setPreview({ materials, materialsCost, laborCost, subtotal, profit, tax, final });
  };

  const applyToProject = () => {
    if (!preview) return;
    const newMaterials = preview.materials.map((m) => ({ id: uid(), ...m, qtyLeftover: 0, note: "" }));
    const newQuoteItems = [
      ...preview.materials.map((m) => ({ id: uid(), category: "Material", description: m.item, qty: m.qty, price: m.unitCost })),
      { id: uid(), category: "Labor", description: `Labor (${answers.laborHours || 0} hrs)`, qty: 1, price: (Number(answers.laborHours) || 0) * (Number(answers.laborRate) || 0) },
    ];
    if (Number(project.travelFee) > 0) newQuoteItems.push({ id: uid(), category: "Other", description: "Travel", qty: 1, price: project.travelFee });
    newQuoteItems.push({ id: uid(), category: "Other", description: `Profit margin (${project.profitMarginPct}%)`, qty: 1, price: preview.profit });
    update({ materials: [...project.materials, ...newMaterials], quoteItems: [...project.quoteItems, ...newQuoteItems] });
    notify("Added to Materials and the Quote — edit any line on those tabs.");
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>{preset.label} — Quick Questions</SectionLabel>
        <div className="grid md:grid-cols-2 gap-x-6">
          {preset.fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "bool" ? (
                <select value={answers[f.key] ? "yes" : "no"} onChange={(e) => setA(f.key, e.target.value === "yes")} className="w-full rounded-md px-3 py-2" style={inputStyle}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              ) : (
                <TextInput value={answers[f.key]} onChange={(e) => setA(f.key, f.type === "text" ? e.target.value : Number(e.target.value))} />
              )}
            </Field>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-x-6">
          <Field label="Profit margin %"><TextInput value={project.profitMarginPct} onChange={(e) => update({ profitMarginPct: Number(e.target.value) })} /></Field>
          <Field label="Tax %"><TextInput value={project.taxPct} onChange={(e) => update({ taxPct: Number(e.target.value) })} /></Field>
          <Field label="Travel / trip fee ($)"><TextInput value={project.travelFee} onChange={(e) => update({ travelFee: Number(e.target.value) })} /></Field>
        </div>
        <Button variant="primary" onClick={runCalc}><Calculator size={16} /> Calculate</Button>
      </Card>

      {preview && (
        <Card>
          <SectionLabel>Result</SectionLabel>
          <table className="w-full text-sm mb-4" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            <tbody>
              {preview.materials.map((m, i) => (
                <tr key={i} className="border-t" style={{ borderColor: C.steel }}>
                  <td className="py-1.5">{m.item}</td>
                  <td className="py-1.5">{m.qty} {m.unit}</td>
                  <td className="py-1.5 text-right">{money(m.qty * m.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm space-y-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
            <div className="flex justify-between"><span>Materials</span><span>{money(preview.materialsCost)}</span></div>
            <div className="flex justify-between"><span>Labor + travel</span><span>{money(preview.laborCost)}</span></div>
            <div className="flex justify-between"><span>Profit ({project.profitMarginPct}%)</span><span>{money(preview.profit)}</span></div>
            <div className="flex justify-between"><span>Tax ({project.taxPct}%)</span><span>{money(preview.tax)}</span></div>
            <div className="flex justify-between font-semibold text-base pt-2 mt-1" style={{ borderTop: `1px solid ${C.steel}`, color: C.ledger }}>
              <span>Final quote</span><span>{money(preview.final)}</span>
            </div>
          </div>
          <Button variant="accent" className="mt-4" onClick={applyToProject}><Plus size={14} /> Add to Materials &amp; Quote</Button>
        </Card>
      )}
    </div>
  );
}

// ---------- Materials & Leftovers ----------
function MaterialsTab({ project, update }) {
  const set = (id, patch) => update({ materials: project.materials.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const remove = (id) => update({ materials: project.materials.filter((m) => m.id !== id) });
  const add = () => update({ materials: [...project.materials, { id: uid(), item: "", qty: 0, unit: "", unitCost: 0, qtyLeftover: 0, note: "" }] });

  return (
    <Card>
      <SectionLabel>Materials &amp; Leftover Tracking</SectionLabel>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ color: "#7a8590" }} className="text-left">
            <th className="pb-2 font-medium">Item</th><th className="pb-2 font-medium w-20">Qty</th><th className="pb-2 font-medium w-24">Unit</th>
            <th className="pb-2 font-medium w-24">Unit cost</th><th className="pb-2 font-medium w-24">Leftover</th><th className="pb-2 font-medium">Note</th><th></th>
          </tr></thead>
          <tbody>
            {project.materials.map((m) => (
              <tr key={m.id} className="border-t" style={{ borderColor: C.steel }}>
                <td className="py-1.5 pr-2"><input value={m.item} onChange={(e) => set(m.id, { item: e.target.value })} className="w-full rounded px-2 py-1.5" style={inputStyle} /></td>
                <td className="py-1.5 pr-2"><input value={m.qty} onChange={(e) => set(m.id, { qty: e.target.value })} className="w-20 rounded px-2 py-1.5" style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }} /></td>
                <td className="py-1.5 pr-2"><input value={m.unit} onChange={(e) => set(m.id, { unit: e.target.value })} className="w-24 rounded px-2 py-1.5" style={inputStyle} /></td>
                <td className="py-1.5 pr-2"><input value={m.unitCost} onChange={(e) => set(m.id, { unitCost: e.target.value })} className="w-24 rounded px-2 py-1.5" style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace" }} /></td>
                <td className="py-1.5 pr-2"><input value={m.qtyLeftover} onChange={(e) => set(m.id, { qtyLeftover: e.target.value })} className="w-24 rounded px-2 py-1.5" style={{ ...inputStyle, color: C.ok, fontFamily: "JetBrains Mono, monospace" }} /></td>
                <td className="py-1.5 pr-2"><input value={m.note} onChange={(e) => set(m.id, { note: e.target.value })} className="w-full rounded px-2 py-1.5" style={inputStyle} /></td>
                <td><button onClick={() => remove(m.id)} style={{ color: C.warn }}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="ghost" className="mt-3" onClick={add}><Plus size={14} /> Add material</Button>
      <p className="text-xs mt-3" style={{ color: "#7a8590" }}>
        Fill in "Leftover" once the job's done — that's what lets you tell the client what's left over for warranty work or their next project.
      </p>
    </Card>
  );
}

// ---------- Photos & Videos ----------
function MediaTab({ project, update }) {
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handlePhotos = (e, stage) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      const id = uid();
      reader.onload = () => {
        update({
          photos: [...project.photos, { id, name: file.name, dataUrl: reader.result, caption: "", stage }],
          photoFiles: { ...project.photoFiles, [id]: file },
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const handleVideos = (e) => {
    const files = Array.from(e.target.files || []);
    const additions = {}; const meta = [];
    files.forEach((f) => { const id = uid(); additions[id] = f; meta.push({ id, name: f.name, caption: "", sizeMb: (f.size / 1e6).toFixed(1) }); });
    update({ videos: [...project.videos, ...meta], videoFiles: { ...project.videoFiles, ...additions } });
    e.target.value = "";
  };
  const removePhoto = (id) => update({ photos: project.photos.filter((p) => p.id !== id) });
  const updateCaption = (id, caption) => update({ photos: project.photos.map((p) => (p.id === id ? { ...p, caption } : p)) });
  const removeVideo = (id) => update({ videos: project.videos.filter((v) => v.id !== id) });
  const updateVideoCaption = (id, caption) => update({ videos: project.videos.map((v) => (v.id === id ? { ...v, caption } : v)) });

  const stages = [["before", "Before"], ["during", "During"], ["after", "After"]];

  return (
    <div className="space-y-5">
      {stages.map(([key, label]) => (
        <Card key={key}>
          <div className="flex justify-between items-center mb-3">
            <SectionLabel>{label} Photos</SectionLabel>
            <Button variant="ghost" onClick={() => { photoInputRef.current.dataset.stage = key; photoInputRef.current.click(); }}><Upload size={14} /> Add {label.toLowerCase()} photos</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {project.photos.filter((p) => p.stage === key).map((p) => (
              <div key={p.id} className="rounded-md overflow-hidden" style={{ border: `1px solid ${C.steel}` }}>
                <img src={p.dataUrl} className="w-full h-24 object-cover" alt={p.caption || p.name} />
                <div className="p-1.5">
                  <input value={p.caption} placeholder="Caption" onChange={(e) => updateCaption(p.id, e.target.value)} className="w-full text-xs rounded px-1.5 py-1" style={inputStyle} />
                  <button onClick={() => removePhoto(p.id)} className="text-xs mt-1" style={{ color: C.warn }}>Remove</button>
                </div>
              </div>
            ))}
            {project.photos.filter((p) => p.stage === key).length === 0 && <p className="text-xs col-span-full" style={{ color: "#a3acb3" }}>None yet.</p>}
          </div>
        </Card>
      ))}
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotos(e, photoInputRef.current.dataset.stage)} />

      <Card>
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Videos</SectionLabel>
          <Button variant="ghost" onClick={() => videoInputRef.current.click()}><Upload size={14} /> Add video</Button>
        </div>
        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleVideos} />
        {project.videos.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-md p-2 mb-2" style={{ border: `1px solid ${C.steel}` }}>
            <Camera size={18} style={{ color: C.ledger }} />
            <div className="flex-1">
              <div className="text-sm font-medium">{v.name} <span className="text-xs" style={{ color: "#a3acb3" }}>({v.sizeMb} MB)</span></div>
              <input value={v.caption} placeholder="What does this show?" onChange={(e) => updateVideoCaption(v.id, e.target.value)} className="w-full text-xs rounded px-2 py-1 mt-1" style={inputStyle} />
            </div>
            <button onClick={() => removeVideo(v.id)} style={{ color: C.warn }}><Trash2 size={16} /></button>
          </div>
        ))}
        {project.videos.length === 0 && <p className="text-xs" style={{ color: "#a3acb3" }}>None yet.</p>}
      </Card>
    </div>
  );
}

// ---------- Documents ----------
function DocumentsTab({ project, customer, update }) {
  const [docType, setDocType] = useState("Estimate");
  const subtotal = project.quoteItems.reduce((s, q) => s + (Number(q.qty) || 0) * (Number(q.price) || 0), 0);

  return (
    <div className="space-y-5">
      <Card className="no-print">
        <SectionLabel>Document Type</SectionLabel>
        <div className="flex gap-2">
          {["Estimate", "Invoice", "Receipt"].map((d) => (
            <Button key={d} variant={docType === d ? "primary" : "ghost"} onClick={() => setDocType(d)}>{d}</Button>
          ))}
        </div>
      </Card>

      <div className="print-area">
        <Card>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
            <div>
              <h2 className="td-display text-xl" style={{ color: C.ledger, fontWeight: 700 }}>{docType}</h2>
              <p className="text-sm" style={{ color: "#7a8590" }}>{project.name} — {customer.name}</p>
            </div>
            <div className="text-sm text-right" style={{ color: "#7a8590" }}>
              <div>{project.createdAt}</div>
              <div>{customer.address}</div>
            </div>
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr style={{ color: "#7a8590" }} className="text-left">
              <th className="pb-2 font-medium">Category</th><th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium w-16">Qty</th><th className="pb-2 font-medium w-24">Price</th><th className="pb-2 font-medium w-24 text-right">Total</th>
            </tr></thead>
            <tbody>
              {project.quoteItems.map((q) => (
                <tr key={q.id} className="border-t" style={{ borderColor: C.steel }}>
                  <td className="py-1.5">{q.category}</td>
                  <td className="py-1.5">{q.description}</td>
                  <td className="py-1.5">{q.qty}</td>
                  <td className="py-1.5">{money(q.price)}</td>
                  <td className="py-1.5 text-right">{money(q.qty * q.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end">
            <div className="w-56 text-sm" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              <div className="flex justify-between font-semibold text-base pt-2" style={{ borderTop: `1px solid ${C.steel}`, color: C.ledger }}>
                <span>Total</span><span>{money(subtotal)}</span>
              </div>
            </div>
          </div>
          {docType === "Receipt" && <p className="text-sm mt-4" style={{ color: C.ok }}>Paid in full — thank you!</p>}
        </Card>
      </div>

      <Card className="no-print">
        <Button variant="primary" onClick={() => window.print()}><Printer size={16} /> Print / save {docType.toLowerCase()} as PDF</Button>
        <p className="text-xs mt-2" style={{ color: "#7a8590" }}>Choose "Save as PDF" in the print window instead of a physical printer.</p>
      </Card>
    </div>
  );
}

// ---------- Project Export ----------
function ProjectExportTab({ project, customer, notify }) {
  const [supported] = useState(typeof window !== "undefined" && "showDirectoryPicker" in window);

  const buildMaterialsSheet = () => {
    const rows = project.materials.map((m) => ({
      Item: m.item, Qty: m.qty, Unit: m.unit, "Unit Cost": m.unitCost,
      "Total Cost": (Number(m.qty) || 0) * (Number(m.unitCost) || 0), Leftover: m.qtyLeftover, Note: m.note,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materials");
    return wb;
  };

  const downloadMaterialsXlsx = () => {
    const wb = buildMaterialsSheet();
    XLSX.writeFile(wb, `${(project.name || "project").replace(/[^a-z0-9-_]+/gi, "-")}-Materials.xlsx`);
    notify("Materials.xlsx downloaded.");
  };

  const downloadProjectJson = () => {
    const { photoFiles, videoFiles, ...clean } = project;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(project.name || "project").replace(/[^a-z0-9-_]+/gi, "-")}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const saveFullFolder = async () => {
    try {
      const root = await window.showDirectoryPicker();
      const safeName = (project.name || "Project").replace(/[\\/:*?"<>|]+/g, "-");
      const dir = await root.getDirectoryHandle(safeName, { create: true });

      const writeText = async (filename, text) => {
        const fh = await dir.getFileHandle(filename, { create: true });
        const w = await fh.createWritable(); await w.write(text); await w.close();
      };
      const writeBlob = async (dirHandle, filename, blob) => {
        const fh = await dirHandle.getFileHandle(filename, { create: true });
        const w = await fh.createWritable(); await w.write(blob); await w.close();
      };

      const { photoFiles, videoFiles, ...clean } = project;
      await writeText("Project.json", JSON.stringify(clean, null, 2));
      await writeText("Notes.txt", project.notes || "");

      const matRows = ["Item,Qty,Unit,UnitCost,TotalCost,Leftover,Note"].concat(
        project.materials.map((m) => [m.item, m.qty, m.unit, m.unitCost, (Number(m.qty) || 0) * (Number(m.unitCost) || 0), m.qtyLeftover, m.note].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      );
      await writeText("Materials.csv", matRows.join("\n"));

      if (project.photos.length) {
        const photosDir = await dir.getDirectoryHandle("Photos", { create: true });
        for (const p of project.photos) {
          const file = project.photoFiles?.[p.id];
          const blob = file || (await (await fetch(p.dataUrl)).blob());
          await writeBlob(photosDir, `${p.stage}-${p.name}`, blob);
        }
      }
      if (project.videos.length) {
        const videosDir = await dir.getDirectoryHandle("Videos", { create: true });
        for (const v of project.videos) {
          const file = project.videoFiles?.[v.id];
          if (file) await writeBlob(videosDir, v.name, file);
        }
      }
      const wb = buildMaterialsSheet();
      const xlsxOut = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      await writeBlob(dir, "Materials.xlsx", new Blob([xlsxOut]));

      notify(`Saved "${safeName}" folder to your computer with Photos, Videos, and documents.`);
    } catch (err) {
      if (err.name !== "AbortError") notify("Couldn't save the folder — your browser may not support this, or the request was cancelled.");
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionLabel>Save Full Project Folder</SectionLabel>
        <p className="text-sm mb-4" style={{ color: "#7a8590" }}>
          Pick a location on your computer and JobVault creates a real folder there — <code>{(project.name || "Project").replace(/[\\/:*?"<>|]+/g, "-")}/</code> — with Project.json, Notes.txt, Materials.csv, Materials.xlsx, and Photos/Videos subfolders.
        </p>
        {supported ? (
          <Button variant="primary" onClick={saveFullFolder}><FolderOpen size={16} /> Choose folder &amp; save everything</Button>
        ) : (
          <p className="text-sm" style={{ color: C.warn }}>
            Your browser doesn't support saving folders directly (this works in Chrome or Edge on a computer). Use the individual downloads below instead.
          </p>
        )}
      </Card>

      <Card>
        <SectionLabel>Individual Files</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={downloadProjectJson}><Download size={14} /> Project.json</Button>
          <Button variant="ghost" onClick={downloadMaterialsXlsx}><Download size={14} /> Materials.xlsx</Button>
        </div>
        <p className="text-xs mt-3" style={{ color: "#7a8590" }}>Photos can be saved individually from the Photos &amp; Videos tab by right-clicking each image.</p>
      </Card>
    </div>
  );
}
