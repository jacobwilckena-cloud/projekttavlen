import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const STATUS_NAVN = { ide: "Idé", igang: "I gang", faerdig: "Færdig" };

const css = `
  :root{
    --papir:#F7F5F0; --blaek:#26251F; --blyant:#8A867C; --linje:#E3E0D7;
    --tape:#2E63C9; --tape-lys:#E8EEFB; --ok:#3E7C4F; --ok-lys:#E7F1EA;
    --advarsel:#B4552D; --laas:#A89F8D; --kort:#FFFFFF;
    --laast-bg:#F2F0EA; --brik-bg:#EDEAE2; --skygge:rgba(38,37,31,.08);
  }
  @media (prefers-color-scheme: dark){
    :root{
      --papir:#191813; --blaek:#EDEAE2; --blyant:#9B968A; --linje:#35332C;
      --tape:#7AA2EE; --tape-lys:#22304D; --ok:#7CB98D; --ok-lys:#243B2C;
      --advarsel:#E08A62; --laas:#6E6A5E; --kort:#22211B;
      --laast-bg:#1E1D17; --brik-bg:#2B2A22; --skygge:rgba(0,0,0,.35);
    }
  }
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;background:var(--papir)}
  .tavle-rod{
    font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;
    background:var(--papir);color:var(--blaek);min-height:100vh;
    padding:max(16px,env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom));
    max-width:560px;margin:0 auto;font-size:16px;line-height:1.45;
  }
  h1{font-size:26px;font-weight:800;letter-spacing:-.5px;margin:4px 0 2px}
  .undertitel{color:var(--blyant);font-size:14px;margin:0 0 18px;display:flex;align-items:center;gap:8px}
  .live-prik{width:8px;height:8px;border-radius:50%;background:var(--laas);flex:none}
  .live-prik.paa{background:var(--ok)}

  .filtre{margin:2px 0 4px}
  .filter-raekke{
    display:flex;gap:7px;overflow-x:auto;padding:4px 2px 6px;
    -webkit-overflow-scrolling:touch;scrollbar-width:none;
  }
  .filter-raekke::-webkit-scrollbar{display:none}
  .chip{
    flex:none;border:1px solid var(--linje);background:var(--kort);color:var(--blyant);
    border-radius:99px;padding:8px 14px;font-size:14px;font-weight:600;min-height:38px;
    cursor:pointer;white-space:nowrap;
  }
  .chip.valgt{border-color:var(--tape);background:var(--tape-lys);color:var(--tape)}

  .sektion{margin-top:22px}
  .sektion-titel{
    display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;
    text-transform:uppercase;letter-spacing:.8px;color:var(--blyant);margin:0 0 10px 2px;
  }
  .sektion-antal{background:var(--brik-bg);border-radius:99px;padding:1px 8px;font-size:12px}

  .kort{
    background:var(--kort);border:1px solid var(--linje);border-radius:14px;
    box-shadow:0 1px 3px var(--skygge);margin-bottom:10px;overflow:hidden;
  }
  .kort.laast{background:var(--laast-bg);opacity:.92}
  .kort.faerdigt .kort-navn{text-decoration:line-through;color:var(--blyant)}

  .kort-hoved{
    display:flex;align-items:center;gap:10px;padding:13px 14px;min-height:52px;
    cursor:pointer;user-select:none;
  }
  .prio-tal{
    flex:none;width:28px;height:28px;border-radius:50%;background:var(--brik-bg);
    display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:var(--blyant);
  }
  .kort.laast .prio-tal{background:transparent;border:1px dashed var(--laas)}
  .kort-navn{font-weight:650;font-size:16.5px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .kort-meta{color:var(--blyant);font-size:13px;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:5px}
  .pil{flex:none;color:var(--blyant);transition:transform .18s}
  .pil.aaben{transform:rotate(180deg)}

  .kort-krop{padding:0 14px 12px;border-top:1px solid var(--linje)}
  .raekke-titel{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--blyant);margin:13px 0 7px}

  .brikker{display:flex;flex-wrap:wrap;gap:6px}
  .brik{
    display:inline-flex;align-items:center;gap:5px;background:var(--brik-bg);
    border-radius:99px;padding:5px 11px;font-size:13.5px;
  }
  .brik.ok{background:var(--ok-lys);color:var(--ok)}
  .brik.vent{color:var(--blyant)}

  .status-knap{
    flex:none;border:1px solid var(--linje);background:transparent;color:inherit;
    border-radius:99px;padding:7px 12px;font-size:13.5px;font-weight:600;
    display:inline-flex;align-items:center;gap:5px;min-height:34px;cursor:pointer;
  }
  .status-knap.igang{border-color:var(--tape);color:var(--tape);background:var(--tape-lys)}
  .status-knap.faerdig{border-color:transparent;color:var(--ok);background:var(--ok-lys)}
  .status-menu{
    position:absolute;right:12px;top:46px;background:var(--kort);border:1px solid var(--linje);
    border-radius:12px;box-shadow:0 8px 24px var(--skygge);z-index:20;overflow:hidden;min-width:150px;
  }
  .status-menu button{
    display:flex;width:100%;border:0;background:none;color:inherit;text-align:left;
    padding:12px 15px;font-size:15px;gap:8px;align-items:center;min-height:44px;cursor:pointer;
  }
  .status-menu button:not(:last-child){border-bottom:1px solid var(--linje)}
  .kort-hoved-wrap{position:relative}

  .budget-linje{font-size:14px;color:var(--blyant);margin:2px 0 6px}
  .budget-bar{height:6px;border-radius:99px;background:var(--brik-bg);overflow:hidden;margin:6px 0 4px}
  .budget-fyld{height:100%;border-radius:99px;background:var(--tape)}
  .budget-fyld.over{background:var(--advarsel)}
  .budget-over-tekst{color:var(--advarsel);font-weight:650}
  .udgift-link{border:0;background:none;color:var(--tape);font-size:14px;font-weight:600;padding:8px 0;cursor:pointer}
  .udgift-felt{display:flex;gap:8px;margin-top:4px}
  .udgift-felt input{
    flex:1;border:1px solid var(--linje);border-radius:10px;padding:10px 12px;font-size:16px;
    background:var(--papir);color:inherit;min-height:44px;
  }
  .udgift-felt button{
    border:0;border-radius:10px;background:var(--tape);color:#fff;font-weight:650;
    padding:0 16px;font-size:15px;min-height:44px;cursor:pointer;
  }

  .noter-tekst{font-size:15px;white-space:pre-wrap;color:inherit;margin:0}

  .liste-punkt{
    display:flex;align-items:center;gap:10px;padding:7px 0;font-size:15.5px;min-height:40px;
  }
  .liste-punkt input[type=checkbox]{width:21px;height:21px;flex:none;accent-color:var(--ok)}
  .liste-punkt.koebt span{text-decoration:line-through;color:var(--blyant)}
  .liste-punkt .fjern{margin-left:auto;border:0;background:none;color:var(--blyant);padding:6px;cursor:pointer}
  .liste-tilfoej{display:flex;gap:8px;margin-top:4px}
  .liste-tilfoej input{
    flex:1;border:1px solid var(--linje);border-radius:10px;padding:10px 12px;font-size:16px;
    background:var(--papir);color:inherit;min-height:44px;
  }
  .liste-tilfoej button{
    border:1px solid var(--linje);border-radius:10px;background:none;color:var(--tape);
    font-weight:650;padding:0 14px;font-size:15px;min-height:44px;cursor:pointer;
  }

  .handling-raekke{
    display:flex;align-items:center;gap:2px;border-top:1px solid var(--linje);
    margin-top:13px;padding-top:7px;
  }
  .ikon-knap{
    border:0;background:none;color:var(--blyant);padding:9px;border-radius:9px;
    min-width:42px;min-height:42px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;
  }
  .ikon-knap:disabled{opacity:.3}
  .handling-raekke .tekst-knap{
    border:0;background:none;color:var(--blyant);font-size:14.5px;font-weight:600;
    padding:9px 11px;min-height:42px;border-radius:9px;cursor:pointer;
  }
  .handling-raekke .tekst-knap.slet{color:var(--advarsel)}
  .handling-spacer{flex:1}

  .tom{color:var(--blyant);font-size:15px;text-align:center;padding:34px 12px}

  .plus-knap{
    position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(24px + env(safe-area-inset-bottom));
    width:58px;height:58px;border-radius:50%;border:0;background:var(--tape);color:#fff;
    box-shadow:0 6px 18px var(--skygge);font-size:30px;line-height:1;cursor:pointer;z-index:30;
  }

  .ark-bag{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:40;display:flex;align-items:flex-end;justify-content:center}
  .ark{
    background:var(--kort);width:100%;max-width:560px;border-radius:18px 18px 0 0;
    padding:18px 18px calc(18px + env(safe-area-inset-bottom));max-height:88vh;overflow:auto;
  }
  .ark h2{margin:0 0 14px;font-size:19px}
  .felt{margin-bottom:14px}
  .felt label{display:block;font-size:13px;font-weight:700;color:var(--blyant);margin-bottom:5px;text-transform:uppercase;letter-spacing:.6px}
  .felt input,.felt textarea{
    width:100%;border:1px solid var(--linje);border-radius:10px;padding:11px 12px;font-size:16px;
    background:var(--papir);color:inherit;min-height:44px;font-family:inherit;
  }
  .felt textarea{min-height:84px;resize:vertical}
  .afh-liste{border:1px solid var(--linje);border-radius:10px;overflow:hidden}
  .afh-liste label{
    display:flex;align-items:center;gap:10px;padding:11px 12px;font-size:15px;min-height:46px;
  }
  .afh-liste label:not(:last-child){border-bottom:1px solid var(--linje)}
  .afh-liste label.deaktiveret{opacity:.45}
  .afh-liste input[type=checkbox]{width:21px;height:21px;accent-color:var(--tape)}
  .afh-liste .cyklus{margin-left:auto;font-size:12.5px;color:var(--advarsel)}
  .afh-liste .fdg{margin-left:auto;font-size:12.5px;color:var(--ok)}
  .hjaelp{font-size:13px;color:var(--blyant);margin-top:6px}
  .ark-knapper{display:flex;gap:10px;margin-top:8px}
  .ark-knapper button{flex:1;border-radius:12px;padding:14px;font-size:16px;font-weight:650;min-height:50px;cursor:pointer}
  .ark-knapper .annuller{border:1px solid var(--linje);background:none;color:inherit}
  .ark-knapper .gem{border:0;background:var(--tape);color:#fff}

  .toast{
    position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom));
    background:var(--blaek);color:var(--papir);border-radius:12px;padding:12px 16px;font-size:14.5px;
    box-shadow:0 8px 22px var(--skygge);z-index:60;display:flex;align-items:center;gap:12px;
    max-width:min(92vw,520px);
  }
  .toast.gron{background:var(--ok)}
  .toast .fortryd{border:0;background:rgba(255,255,255,.18);color:inherit;border-radius:8px;padding:7px 12px;font-weight:700;font-size:14px;cursor:pointer}

  @media (prefers-reduced-motion: reduce){ .pil{transition:none} }
`;

// ---------- Inline SVG-ikoner ----------
const Ikon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const Laas = (p) => <Ikon {...p} d={<><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} />;
const Flueben = (p) => <Ikon {...p} d={<path d="M4 12.5 10 18 20 6"/>} />;
const PilOp = (p) => <Ikon {...p} d={<path d="M12 19V5m-6 6 6-6 6 6"/>} />;
const PilNed = (p) => <Ikon {...p} d={<path d="M12 5v14m6-6-6 6-6-6"/>} />;
const Kryds = (p) => <Ikon {...p} d={<path d="M6 6l12 12M18 6 6 18"/>} />;
const Vinkel = ({ aaben }) => (
  <span className={`pil ${aaben ? "aaben" : ""}`}><Ikon d={<path d="M6 9l6 6 6-6"/>} /></span>
);

function omnummerer(liste) {
  const sorteret = [...liste].sort((a, b) => (a.prioritet ?? 999) - (b.prioritet ?? 999));
  return sorteret.map((p, i) => ({ ...p, prioritet: i + 1 }));
}

const nytId = () =>
  (crypto.randomUUID ? crypto.randomUUID() :
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    }));

export default function App() {
  const [projekter, setProjekter] = useState([]);
  const [indlaeser, setIndlaeser] = useState(true);
  const [live, setLive] = useState(false);
  const [aabne, setAabne] = useState(new Set());
  const [statusMenu, setStatusMenu] = useState(null);
  const [udgiftFelt, setUdgiftFelt] = useState({});
  const [listeFelt, setListeFelt] = useState({});
  const [form, setForm] = useState(null);
  const [rumFilter, setRumFilter] = useState(null);      // null = alle rum
  const [statusFilter, setStatusFilter] = useState(null); // null = alle statusser
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const senesteSlettet = useRef(null);
  const refetchTimer = useRef(null);

  // ---------- Supabase ----------
  const hentAlle = useCallback(async () => {
    const { data, error } = await supabase.from("projekter").select("*").order("prioritet");
    if (!error && data) {
      setProjekter(data.map(r => ({ ...r, kraever: r.kraever || [], liste: r.liste || [] })));
    }
    setIndlaeser(false);
  }, []);

  // Skriver hele tavlen: upsert alle rækker og slet dem, der er fjernet.
  // Tavlen er lille, så det er den simpleste og mest robuste model.
  async function gemAlle(næste) {
    const foer = projekter;
    setProjekter(næste); // optimistisk – realtime bekræfter bagefter
    const raekker = næste.map(({ id, navn, status, prioritet, kraever, budget, brugt, noter, liste, rum }) =>
      ({ id, navn, status, prioritet, kraever, budget, brugt, noter, liste, rum: rum || "" }));
    const { error: fejl1 } = raekker.length
      ? await supabase.from("projekter").upsert(raekker)
      : { error: null };
    const slettede = foer.filter(p => !næste.some(n => n.id === p.id)).map(p => p.id);
    const { error: fejl2 } = slettede.length
      ? await supabase.from("projekter").delete().in("id", slettede)
      : { error: null };
    if (fejl1 || fejl2) {
      setProjekter(foer);
      visToast("Kunne ikke gemme – tjek forbindelsen");
    }
  }

  useEffect(() => { hentAlle(); }, [hentAlle]);

  // Realtime: den anden telefons ændringer henter tavlen igen (let debouncet)
  useEffect(() => {
    const kanal = supabase
      .channel("projekter-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "projekter" }, () => {
        clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(hentAlle, 300);
      })
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(kanal); clearTimeout(refetchTimer.current); };
  }, [hentAlle]);

  // ---------- Hjælpere ----------
  const find = (id) => projekter.find(x => x.id === id);
  const erBlokeret = (p) => p.status !== "faerdig" && (p.kraever || []).some(id => { const d = find(id); return d && d.status !== "faerdig"; });
  const blokeringer = (p) => (p.kraever || []).map(find).filter(d => d && d.status !== "faerdig");
  const laaserOpFor = (p) => projekter.filter(x => (x.kraever || []).includes(p.id) && x.status !== "faerdig");
  const nedstroems = (id, set = new Set()) => {
    projekter.forEach(p => {
      if ((p.kraever || []).includes(id) && !set.has(p.id)) { set.add(p.id); nedstroems(p.id, set); }
    });
    return set;
  };

  function visToast(indhold, gron, fortryd) {
    clearTimeout(toastTimer.current);
    setToast({ indhold, gron, fortryd });
    toastTimer.current = setTimeout(() => setToast(null), fortryd ? 6000 : 3200);
  }

  // ---------- Handlinger ----------
  function saetStatus(id, nyStatus) {
    const p = find(id);
    setStatusMenu(null);
    if (erBlokeret(p) && nyStatus !== "ide") {
      const b = blokeringer(p);
      visToast(<><Laas /> {b.map(d => `”${d.navn}”`).join(" og ")} skal være færdig{b.length > 1 ? "e" : ""} først</>);
      return;
    }
    const foerKlar = new Set(projekter.filter(x => !erBlokeret(x) && x.status !== "faerdig").map(x => x.id));
    const næste = projekter.map(x => x.id === id ? { ...x, status: nyStatus } : x);
    gemAlle(næste);
    if (nyStatus === "faerdig") {
      const nu = næste.filter(x => {
        const blk = x.status !== "faerdig" && (x.kraever || []).some(k => { const d = næste.find(n => n.id === k); return d && d.status !== "faerdig"; });
        return !blk && x.status !== "faerdig";
      });
      const nyKlar = nu.filter(x => !foerKlar.has(x.id));
      if (nyKlar.length) {
        visToast(<><Flueben /> {nyKlar.map(x => `”${x.navn}”`).join(" og ")} er låst op!</>, true);
      }
    }
  }

  function flyt(id, retning) {
    const sorteret = omnummerer(projekter);
    const i = sorteret.findIndex(x => x.id === id);
    const j = i + retning;
    if (j < 0 || j >= sorteret.length) return;
    [sorteret[i], sorteret[j]] = [sorteret[j], sorteret[i]];
    gemAlle(omnummerer(sorteret.map((p, k) => ({ ...p, prioritet: k + 1 }))));
  }

  function sletProjekt(id) {
    const p = find(id);
    senesteSlettet.current = p;
    const resten = projekter
      .filter(x => x.id !== id)
      .map(x => ({ ...x, kraever: (x.kraever || []).filter(k => k !== id) }));
    gemAlle(omnummerer(resten));
    visToast(<>”{p.navn}” slettet</>, false, true);
  }

  function fortrydSlet() {
    const p = senesteSlettet.current;
    if (!p) return;
    senesteSlettet.current = null;
    setToast(null);
    gemAlle(omnummerer([...projekter, p]));
  }

  function tilfoejUdgift(id) {
    const tekst = (udgiftFelt[id] || "").trim();
    const beloeb = parseInt(tekst, 10);
    if (!beloeb || beloeb <= 0) return;
    setUdgiftFelt(f => ({ ...f, [id]: "" }));
    gemAlle(projekter.map(x => x.id === id ? { ...x, brugt: (x.brugt || 0) + beloeb } : x));
  }

  function tilfoejListePunkt(id) {
    const tekst = (listeFelt[id] || "").trim();
    if (!tekst) return;
    setListeFelt(f => ({ ...f, [id]: "" }));
    gemAlle(projekter.map(x => x.id === id ? { ...x, liste: [...(x.liste || []), { tekst, koebt: false }] } : x));
  }

  function skiftKoebt(id, idx) {
    gemAlle(projekter.map(x => x.id === id
      ? { ...x, liste: x.liste.map((v, i) => i === idx ? { ...v, koebt: !v.koebt } : v) } : x));
  }

  function fjernListePunkt(id, idx) {
    gemAlle(projekter.map(x => x.id === id
      ? { ...x, liste: x.liste.filter((_, i) => i !== idx) } : x));
  }

  function aabnForm(p) {
    setForm(p ? {
      id: p.id, navn: p.navn, kraever: [...(p.kraever || [])],
      budget: p.budget || "", brugt: p.brugt || "", noter: p.noter || "", rum: p.rum || "",
    } : { id: null, navn: "", kraever: [], budget: "", brugt: "", noter: "", rum: "" });
  }

  function gemProjekt() {
    const navn = form.navn.trim();
    if (!navn) { visToast("Giv projektet et navn"); return; }
    if (form.id) {
      gemAlle(omnummerer(projekter.map(x => x.id === form.id ? {
        ...x, navn, kraever: form.kraever,
        budget: parseInt(form.budget, 10) || 0,
        brugt: parseInt(form.brugt, 10) || 0,
        noter: form.noter, rum: form.rum.trim(),
      } : x)));
    } else {
      gemAlle(omnummerer([...projekter, {
        id: nytId(), navn, status: "igang", prioritet: projekter.length + 1,
        kraever: form.kraever,
        budget: parseInt(form.budget, 10) || 0,
        brugt: parseInt(form.brugt, 10) || 0,
        noter: form.noter, liste: [], rum: form.rum.trim(),
      }]));
    }
    setForm(null);
  }

  // ---------- Visning ----------
  const sorteret = omnummerer(projekter);
  const rumListe = [...new Set(sorteret.map(p => (p.rum || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "da"));
  const passerFilter = (p) =>
    (!rumFilter || (p.rum || "").trim() === rumFilter) &&
    (!statusFilter || p.status === statusFilter);
  const synlige = sorteret.filter(passerFilter);
  const klar = synlige.filter(p => p.status !== "faerdig" && !erBlokeret(p));
  const laast = synlige.filter(p => p.status !== "faerdig" && erBlokeret(p));
  const faerdige = synlige.filter(p => p.status === "faerdig");

  const skiftAaben = (id) => setAabne(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  function Kort({ p }) {
    const aaben = aabne.has(p.id);
    const blokeret = erBlokeret(p);
    const afh = blokeringer(p);
    const opl = laaserOpFor(p);
    const over = p.budget > 0 && p.brugt > p.budget;
    const pct = p.budget > 0 ? Math.min(100, Math.round((p.brugt / p.budget) * 100)) : 0;
    const i = sorteret.findIndex(x => x.id === p.id);

    return (
      <div className={`kort ${blokeret ? "laast" : ""} ${p.status === "faerdig" ? "faerdigt" : ""}`}>
        <div className="kort-hoved-wrap">
          <div className="kort-hoved" onClick={() => skiftAaben(p.id)}>
            <span className="prio-tal">{blokeret ? <Laas size={13} /> : p.prioritet}</span>
            <span className="kort-navn">{p.navn}</span>
            {!aaben && (
              <span className="kort-meta">
                {blokeret
                  ? <>Venter på {afh.length === 1 ? `”${afh[0].navn}”` : `${afh.length} projekter`}</>
                  : (p.budget > 0 ? `${p.brugt || 0} / ${p.budget} kr.` : STATUS_NAVN[p.status])}
              </span>
            )}
            <button className={`status-knap ${p.status}`}
              onClick={(e) => { e.stopPropagation(); setStatusMenu(statusMenu === p.id ? null : p.id); }}>
              {p.status === "faerdig" && <Flueben size={13} />}{STATUS_NAVN[p.status]}
            </button>
            <Vinkel aaben={aaben} />
          </div>
          {statusMenu === p.id && (
            <div className="status-menu">
              {Object.entries(STATUS_NAVN).map(([k, v]) => (
                <button key={k} onClick={() => saetStatus(p.id, k)}>
                  {k === p.status ? <Flueben size={14} /> : <span style={{ width: 14 }} />}{v}
                </button>
              ))}
            </div>
          )}
        </div>

        {aaben && (
          <div className="kort-krop">
            {afh.length > 0 && (
              <>
                <div className="raekke-titel">Venter på</div>
                <div className="brikker">
                  {afh.map(d => <span key={d.id} className="brik vent"><Laas size={12} />{d.navn}</span>)}
                </div>
              </>
            )}
            {opl.length > 0 && (
              <>
                <div className="raekke-titel">Låser op for</div>
                <div className="brikker">
                  {opl.map(d => <span key={d.id} className="brik">{d.navn}</span>)}
                </div>
              </>
            )}

            {p.budget > 0 && (
              <>
                <div className="raekke-titel">Budget</div>
                <div className="budget-linje">
                  {p.brugt || 0} af {p.budget} kr.
                  {over && <span className="budget-over-tekst"> – {p.brugt - p.budget} kr. over</span>}
                </div>
                {(p.brugt || 0) > 0 && (
                  <div className="budget-bar"><div className={`budget-fyld ${over ? "over" : ""}`} style={{ width: `${pct}%` }} /></div>
                )}
              </>
            )}
            {udgiftFelt[p.id] !== undefined ? (
              <div className="udgift-felt">
                <input type="number" inputMode="numeric" placeholder="Beløb i kr." autoFocus
                  value={udgiftFelt[p.id]}
                  onChange={e => setUdgiftFelt(f => ({ ...f, [p.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && tilfoejUdgift(p.id)} />
                <button onClick={() => tilfoejUdgift(p.id)}>Tilføj</button>
              </div>
            ) : (
              <button className="udgift-link" onClick={() => setUdgiftFelt(f => ({ ...f, [p.id]: "" }))}>+ Tilføj udgift</button>
            )}

            {p.noter && (
              <>
                <div className="raekke-titel">Noter</div>
                <p className="noter-tekst">{p.noter}</p>
              </>
            )}

            <div className="raekke-titel">Indkøbsliste</div>
            {(p.liste || []).map((v, idx) => (
              <div key={idx} className={`liste-punkt ${v.koebt ? "koebt" : ""}`}>
                <input type="checkbox" checked={v.koebt} onChange={() => skiftKoebt(p.id, idx)} />
                <span>{v.tekst}</span>
                <button className="fjern" aria-label={`Fjern ${v.tekst}`} onClick={() => fjernListePunkt(p.id, idx)}><Kryds size={14} /></button>
              </div>
            ))}
            <div className="liste-tilfoej">
              <input placeholder="fx maling, skruer …" value={listeFelt[p.id] || ""}
                onChange={e => setListeFelt(f => ({ ...f, [p.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && tilfoejListePunkt(p.id)} />
              <button onClick={() => tilfoejListePunkt(p.id)}>Tilføj</button>
            </div>

            <div className="handling-raekke">
              <button className="ikon-knap" aria-label="Flyt op" disabled={i <= 0} onClick={() => flyt(p.id, -1)}><PilOp /></button>
              <button className="ikon-knap" aria-label="Flyt ned" disabled={i >= sorteret.length - 1} onClick={() => flyt(p.id, 1)}><PilNed /></button>
              <span className="handling-spacer" />
              <button className="tekst-knap" onClick={() => aabnForm(p)}>Redigér</button>
              <button className="tekst-knap slet" onClick={() => sletProjekt(p.id)}>Slet</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tavle-rod" onClick={() => statusMenu && setStatusMenu(null)}>
      <style>{css}</style>
      <h1>Projekttavlen</h1>
      <p className="undertitel">
        <span className={`live-prik ${live ? "paa" : ""}`} />
        {live ? "Synkroniseret live" : "Forbinder …"}
      </p>

      {!indlaeser && projekter.length > 0 && (
        <div className="filtre">
          {rumListe.length > 0 && (
            <div className="filter-raekke">
              <button className={`chip ${!rumFilter ? "valgt" : ""}`} onClick={() => setRumFilter(null)}>Alle rum</button>
              {rumListe.map(r => (
                <button key={r} className={`chip ${rumFilter === r ? "valgt" : ""}`}
                  onClick={() => setRumFilter(rumFilter === r ? null : r)}>{r}</button>
              ))}
            </div>
          )}
          <div className="filter-raekke">
            <button className={`chip ${!statusFilter ? "valgt" : ""}`} onClick={() => setStatusFilter(null)}>Alle</button>
            {Object.entries(STATUS_NAVN).map(([k, v]) => (
              <button key={k} className={`chip ${statusFilter === k ? "valgt" : ""}`}
                onClick={() => setStatusFilter(statusFilter === k ? null : k)}>{v}</button>
            ))}
          </div>
        </div>
      )}

      {indlaeser ? (
        <div className="tom">Henter tavlen …</div>
      ) : projekter.length === 0 ? (
        <div className="tom">Tavlen er tom. Tryk på + for at tilføje jeres første projekt.</div>
      ) : synlige.length === 0 ? (
        <div className="tom">Ingen projekter matcher filtrene.</div>
      ) : (
        <>
          {(klar.length > 0 || (!rumFilter && !statusFilter)) && (
            <div className="sektion">
              <div className="sektion-titel">Klar nu <span className="sektion-antal">{klar.length}</span></div>
              {klar.length === 0 && <div className="tom">Ingen projekter er klar lige nu.</div>}
              {klar.map(p => <Kort key={p.id} p={p} />)}
            </div>
          )}
          {laast.length > 0 && (
            <div className="sektion">
              <div className="sektion-titel"><Laas size={13} /> Låst <span className="sektion-antal">{laast.length}</span></div>
              {laast.map(p => <Kort key={p.id} p={p} />)}
            </div>
          )}
          {faerdige.length > 0 && (
            <div className="sektion">
              <div className="sektion-titel"><Flueben size={13} /> Færdige <span className="sektion-antal">{faerdige.length}</span></div>
              {faerdige.map(p => <Kort key={p.id} p={p} />)}
            </div>
          )}
        </>
      )}

      <button className="plus-knap" aria-label="Tilføj projekt" onClick={() => aabnForm(null)}>+</button>

      {form && (
        <div className="ark-bag" onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <div className="ark">
            <h2>{form.id ? "Redigér projekt" : "Nyt projekt"}</h2>
            <div className="felt"><label>Navn</label>
              <input autoFocus value={form.navn} placeholder="fx Mal soveværelset"
                onChange={e => setForm(f => ({ ...f, navn: e.target.value }))} /></div>
            <div className="felt"><label>Rum</label>
              <input list="rum-forslag" value={form.rum} placeholder="fx Stue, Gang, Køkken"
                onChange={e => setForm(f => ({ ...f, rum: e.target.value }))} />
              <datalist id="rum-forslag">
                {rumListe.map(r => <option key={r} value={r} />)}
              </datalist>
              <div className="hjaelp">Skriv frit – eksisterende rum foreslås automatisk.</div>
            </div>
            <div className="felt"><label>Kræver først</label>
              <div className="afh-liste">
                {sorteret.filter(x => x.id !== form.id).length === 0 && (
                  <label className="deaktiveret"><span>Ingen andre projekter endnu</span></label>
                )}
                {sorteret.filter(x => x.id !== form.id).map(x => {
                  const cirkel = form.id ? nedstroems(form.id).has(x.id) : false;
                  return (
                    <label key={x.id} className={`${cirkel ? "deaktiveret" : ""}`}>
                      <input type="checkbox" disabled={cirkel} checked={form.kraever.includes(x.id)}
                        onChange={e => setForm(f => ({ ...f, kraever: e.target.checked ? [...f.kraever, x.id] : f.kraever.filter(k => k !== x.id) }))} />
                      <span>{x.navn}</span>
                      {cirkel ? <span className="cyklus">ville skabe en cirkel</span> : (x.status === "faerdig" ? <span className="fdg">færdig ✓</span> : null)}
                    </label>
                  );
                })}
              </div>
              <div className="hjaelp">Vælg de projekter, der skal være færdige, før dette kan gå i gang.</div>
            </div>
            <div className="felt"><label>Budget (kr.)</label>
              <input type="number" inputMode="numeric" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0" /></div>
            <div className="felt"><label>Brugt indtil nu (kr.)</label>
              <input type="number" inputMode="numeric" value={form.brugt} onChange={e => setForm(f => ({ ...f, brugt: e.target.value }))} placeholder="0" /></div>
            <div className="felt"><label>Noter (mål, links, beslutninger)</label>
              <textarea value={form.noter} onChange={e => setForm(f => ({ ...f, noter: e.target.value }))} placeholder="fx væg 143 cm bred, 249 cm høj" /></div>
            <div className="ark-knapper">
              <button className="annuller" onClick={() => setForm(null)}>Annullér</button>
              <button className="gem" onClick={gemProjekt}>Gem</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.gron ? "gron" : ""}`}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{toast.indhold}</span>
          {toast.fortryd && <button className="fortryd" onClick={fortrydSlet}>Fortryd</button>}
        </div>
      )}
    </div>
  );
}
