"use client";

import { useMemo, useState } from "react";
import "./clipscale-v2.css";

type View = "overview" | "missions" | "clips" | "team" | "settings";
type MissionStatus = "En production" | "À valider" | "Planifiée";

const initialMissions = [
  { id: 1, client: "Nova Studio", title: "Podcast Fondateurs #12", clips: "7 / 12", due: "Aujourd’hui", status: "À valider" as MissionStatus, tone: "violet" },
  { id: 2, client: "Maison Lune", title: "Lancement collection été", clips: "10 / 18", due: "22 août", status: "En production" as MissionStatus, tone: "blue" },
  { id: 3, client: "Growth Notes", title: "Interview — série acquisition", clips: "0 / 8", due: "26 août", status: "Planifiée" as MissionStatus, tone: "orange" },
];

const initialClips = [
  { id: 1, title: "Le déclic qui a tout changé", mission: "Podcast Fondateurs #12", format: "9:16 · 42 s", status: "À valider" },
  { id: 2, title: "3 erreurs de recrutement", mission: "Podcast Fondateurs #12", format: "9:16 · 31 s", status: "Montage" },
  { id: 3, title: "Pourquoi lancer en été", mission: "Lancement collection été", format: "1:1 · 24 s", status: "Approuvé" },
  { id: 4, title: "La règle des 80/20", mission: "Lancement collection été", format: "9:16 · 37 s", status: "Publié" },
];

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "⌂" },
  { id: "missions", label: "Missions", icon: "▣" },
  { id: "clips", label: "Clips", icon: "▶" },
  { id: "team", label: "Équipe", icon: "◎" },
  { id: "settings", label: "Réglages", icon: "⚙" },
];

function Logo() {
  return <span className="cs2-logo"><span className="cs2-logo-mark">C</span>ClipScale</span>;
}

function Landing({ launch }: { launch: () => void }) {
  return (
    <main className="cs2-landing">
      <header className="cs2-site-header">
        <a href="#top" aria-label="Accueil ClipScale"><Logo /></a>
        <nav aria-label="Navigation principale">
          <a href="#workflow">Comment ça marche</a><a href="#audiences">Pour qui</a><a href="#beta">Bêta</a>
        </nav>
        <button className="cs2-button cs2-button-small" onClick={launch}>Explorer la démo</button>
      </header>

      <section className="cs2-hero" id="top">
        <div className="cs2-eyebrow"><span /> Conçu pour les agences de clipping</div>
        <h1>Pilotez vos clips.<br /><em>Sans le chaos.</em></h1>
        <p>Missions, clippeurs, validations et suivi client dans un espace simple. Remplacez les tableurs, les messages éparpillés et les relances manuelles.</p>
        <div className="cs2-hero-actions">
          <button className="cs2-button" onClick={launch}>Voir le produit <span>→</span></button>
          <a className="cs2-text-link" href="#workflow">Découvrir le fonctionnement</a>
        </div>
        <small>Démo interactive · Aucun paiement demandé</small>
      </section>

      <section className="cs2-product-frame" aria-label="Aperçu du tableau de bord ClipScale">
        <div className="cs2-frame-bar"><i /><i /><i /><span>Tableau de bord</span></div>
        <div className="cs2-frame-content">
          <aside><Logo /><b>Vue d’ensemble</b><span>Missions</span><span>Clips</span><span>Équipe</span></aside>
          <div className="cs2-frame-main">
            <div className="cs2-frame-title"><div><small>MARDI 18 AOÛT</small><h2>Bonjour, Aron</h2></div><button>+ Nouvelle mission</button></div>
            <div className="cs2-mini-stats"><div><small>CLIPS À VALIDER</small><strong>7</strong></div><div><small>EN PRODUCTION</small><strong>18</strong></div><div><small>À PUBLIER</small><strong>4</strong></div></div>
            <div className="cs2-mini-panel"><b>Priorités du jour</b><span><i className="violet" /> Valider 7 clips pour Nova Studio <em>Aujourd’hui</em></span><span><i className="blue" /> Brief à compléter pour Maison Lune <em>20 min</em></span></div>
          </div>
        </div>
      </section>

      <section className="cs2-section" id="workflow">
        <div className="cs2-section-heading"><span>UN FLUX CLAIR</span><h2>Du brief à la publication,<br />sans perdre le fil.</h2><p>Chaque personne sait quoi faire, quand le faire et où retrouver l’information.</p></div>
        <div className="cs2-steps">
          <article><b>01</b><h3>Créez la mission</h3><p>Ajoutez le client, le contenu source, le nombre de clips et l’échéance.</p></article>
          <article><b>02</b><h3>Produisez ensemble</h3><p>Assignez les clippeurs et centralisez versions, retours et validations.</p></article>
          <article><b>03</b><h3>Livrez avec confiance</h3><p>Suivez l’avancement et partagez un état clair avec votre client.</p></article>
        </div>
      </section>

      <section className="cs2-section cs2-audiences" id="audiences">
        <div className="cs2-section-heading"><span>UN OUTIL, DEUX EXPÉRIENCES</span><h2>Chacun voit l’essentiel.</h2></div>
        <div className="cs2-audience-grid">
          <article><span className="cs2-card-icon">A</span><small>POUR LES AGENCES</small><h3>Une vue nette sur toute la production.</h3><ul><li>Priorités et retards visibles</li><li>Charge de l’équipe centralisée</li><li>Validations client suivies</li></ul></article>
          <article><span className="cs2-card-icon alt">C</span><small>POUR LES CLIPPEURS</small><h3>Un espace de travail sans distraction.</h3><ul><li>Briefs complets au même endroit</li><li>Retours rattachés à la bonne version</li><li>Échéances faciles à suivre</li></ul></article>
        </div>
      </section>

      <section className="cs2-beta" id="beta">
        <div><span>BÊTA PRIVÉE</span><h2>Voyez ClipScale en action.</h2><p>Explorez un espace de démonstration avec des données fictives et testez le parcours complet.</p></div>
        <button className="cs2-button cs2-button-light" onClick={launch}>Ouvrir la démo <span>→</span></button>
      </section>
      <footer><Logo /><p>Le cockpit simple des agences de clipping.</p><span>© 2026 ClipScale · Version bêta</span></footer>
    </main>
  );
}

function Status({ children }: { children: string }) {
  const slug = children.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");
  return <span className={`cs2-status ${slug}`}>{children}</span>;
}

function AppShell({ exit }: { exit: () => void }) {
  const [view, setView] = useState<View>("overview");
  const [missions, setMissions] = useState(initialMissions);
  const [clips, setClips] = useState(initialClips);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");
  const [clipFilter, setClipFilter] = useState("Tous");
  const filteredClips = useMemo(() => clipFilter === "Tous" ? clips : clips.filter((clip) => clip.status === clipFilter), [clips, clipFilter]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const changeView = (next: View) => { setView(next); setShowCreate(false); };
  const addMission = () => { setMissions((current) => [...current, { id: Date.now(), client: "Nouveau client", title: "Nouvelle mission", clips: "0 / 6", due: "À définir", status: "Planifiée", tone: "green" }]); setShowCreate(false); setView("missions"); notify("Mission créée dans la démo"); };
  const advanceClip = (id: number) => { setClips((current) => current.map((clip) => clip.id === id ? { ...clip, status: clip.status === "Montage" ? "À valider" : clip.status === "À valider" ? "Approuvé" : clip.status === "Approuvé" ? "Publié" : clip.status } : clip)); notify("Statut du clip mis à jour"); };

  return (
    <div className="cs2-app">
      <aside className="cs2-sidebar">
        <button className="cs2-brand-button" onClick={exit} aria-label="Retour au site"><Logo /></button>
        <nav aria-label="Navigation de l’application">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="cs2-demo-card"><b>Mode démo</b><p>Les données affichées sont fictives et restent dans votre navigateur.</p><button onClick={exit}>Quitter la démo</button></div>
      </aside>

      <main className="cs2-workspace">
        <header className="cs2-app-header"><div className="cs2-mobile-brand"><Logo /></div><span className="cs2-demo-pill">● MODE DÉMO</span><div className="cs2-header-actions"><button aria-label="Aide">?</button><div className="cs2-avatar">AV</div></div></header>
        <div className="cs2-mobile-nav">{navItems.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label === "Vue d’ensemble" ? "Accueil" : item.label}</button>)}</div>

        <section className="cs2-page">
          {view === "overview" && <>
            <div className="cs2-page-title"><div><span>MARDI 18 AOÛT</span><h1>Bonjour, Aron</h1><p>Voici ce qui demande votre attention aujourd’hui.</p></div><button className="cs2-button" onClick={() => setShowCreate(true)}>+ Nouvelle mission</button></div>
            <div className="cs2-kpis"><article><span>À valider</span><strong>7</strong><small>clips en attente</small></article><article><span>En production</span><strong>18</strong><small>clips en cours</small></article><article><span>À publier</span><strong>4</strong><small>clips approuvés</small></article><article><span>Missions actives</span><strong>{missions.length}</strong><small>dont 1 urgente</small></article></div>
            <div className="cs2-grid-2">
              <article className="cs2-panel"><div className="cs2-panel-head"><div><h2>Priorités du jour</h2><p>Commencez par ces actions.</p></div><span>2 actions</span></div><button className="cs2-priority" onClick={() => changeView("clips")}><i className="violet" /><div><b>Valider 7 clips</b><span>Nova Studio · Podcast Fondateurs #12</span></div><em>Voir les clips →</em></button><button className="cs2-priority" onClick={() => changeView("missions")}><i className="blue" /><div><b>Compléter un brief</b><span>Maison Lune · Lancement collection été</span></div><em>Voir la mission →</em></button></article>
              <article className="cs2-panel"><div className="cs2-panel-head"><div><h2>Production</h2><p>Avancement des missions actives.</p></div><button onClick={() => changeView("missions")}>Tout voir</button></div>{missions.slice(0, 3).map((mission) => <div className="cs2-progress-row" key={mission.id}><span className={`cs2-client-dot ${mission.tone}`}>{mission.client[0]}</span><div><b>{mission.title}</b><small>{mission.client}</small></div><div className="cs2-progress"><i style={{ width: `${Math.max(10, Number(mission.clips.split("/")[0]) / Number(mission.clips.split("/")[1]) * 100)}%` }} /></div><strong>{mission.clips}</strong></div>)}</article>
            </div>
          </>}

          {view === "missions" && <>
            <div className="cs2-page-title"><div><span>PRODUCTION</span><h1>Missions</h1><p>Suivez chaque campagne du brief à la livraison.</p></div><button className="cs2-button" onClick={() => setShowCreate(true)}>+ Nouvelle mission</button></div>
            <div className="cs2-panel cs2-table-panel"><div className="cs2-toolbar"><div className="cs2-search">⌕ <input aria-label="Rechercher une mission" placeholder="Rechercher une mission…" /></div><span>{missions.length} missions</span></div><div className="cs2-table cs2-mission-table"><div className="cs2-tr cs2-th"><span>Mission</span><span>Statut</span><span>Progression</span><span>Échéance</span><span /></div>{missions.map((mission) => <div className="cs2-tr" key={mission.id}><span className="cs2-main-cell"><i className={`cs2-client-dot ${mission.tone}`}>{mission.client[0]}</i><span><b>{mission.title}</b><small>{mission.client}</small></span></span><span><Status>{mission.status}</Status></span><span><b>{mission.clips}</b> clips</span><span>{mission.due}</span><button onClick={() => notify("Mission ouverte dans la démo")}>Ouvrir →</button></div>)}</div></div>
          </>}

          {view === "clips" && <>
            <div className="cs2-page-title"><div><span>CONTENUS</span><h1>Clips</h1><p>Retrouvez les versions, validations et statuts de publication.</p></div><button className="cs2-button" onClick={() => notify("Import simulé — mode démo")}>Importer un clip</button></div>
            <div className="cs2-filter-row">{["Tous", "Montage", "À valider", "Approuvé", "Publié"].map((filter) => <button className={clipFilter === filter ? "active" : ""} onClick={() => setClipFilter(filter)} key={filter}>{filter}</button>)}</div>
            <div className="cs2-clip-grid">{filteredClips.map((clip) => <article className="cs2-clip-card" key={clip.id}><div className="cs2-video-placeholder"><span>▶</span><small>{clip.format}</small></div><div className="cs2-clip-info"><Status>{clip.status}</Status><h3>{clip.title}</h3><p>{clip.mission}</p><button onClick={() => advanceClip(clip.id)} disabled={clip.status === "Publié"}>{clip.status === "Publié" ? "Publication terminée" : "Passer à l’étape suivante →"}</button></div></article>)}</div>
          </>}

          {view === "team" && <>
            <div className="cs2-page-title"><div><span>COLLABORATION</span><h1>Équipe</h1><p>Répartissez la charge avant qu’elle ne devienne un problème.</p></div><button className="cs2-button" onClick={() => notify("Invitation simulée — mode démo")}>Inviter un membre</button></div>
            <div className="cs2-team-grid">{[["Lina Morel", "LM", "Monteuse", 4, 75, "Disponible jeudi"], ["Yanis Cohen", "YC", "Clippeur", 3, 55, "Disponible demain"], ["Maya Laurent", "ML", "Clippeuse", 5, 90, "Charge élevée"]].map(([name, initials, role, tasks, load, availability]) => <article className="cs2-team-card" key={String(name)}><div className="cs2-team-avatar">{initials}</div><h3>{name}</h3><p>{role}</p><div><span>{tasks} clips actifs</span><strong>{load}%</strong></div><div className="cs2-load"><i style={{ width: `${load}%` }} /></div><small>{availability}</small></article>)}</div>
          </>}

          {view === "settings" && <>
            <div className="cs2-page-title"><div><span>ESPACE</span><h1>Réglages</h1><p>Configurez les informations principales de votre agence.</p></div></div>
            <div className="cs2-panel cs2-settings"><h2>Informations de l’agence</h2><label>Nom de l’espace<input defaultValue="ClipScale Studio" /></label><label>Email de contact<input type="email" defaultValue="bonjour@clipscale.app" /></label><label>Fuseau horaire<select defaultValue="Europe/Paris"><option>Europe/Paris</option><option>America/New_York</option></select></label><button className="cs2-button" onClick={() => notify("Réglages enregistrés dans la démo")}>Enregistrer</button></div>
          </>}
        </section>
      </main>

      {showCreate && <div className="cs2-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowCreate(false)}><div className="cs2-modal" role="dialog" aria-modal="true" aria-labelledby="new-mission-title"><button className="cs2-modal-close" onClick={() => setShowCreate(false)} aria-label="Fermer">×</button><span>NOUVELLE MISSION</span><h2 id="new-mission-title">Que faut-il produire ?</h2><p>Créez la structure de la mission. Vous pourrez compléter le brief ensuite.</p><label>Nom de la mission<input autoFocus placeholder="Ex. Podcast Fondateurs #13" /></label><div className="cs2-form-row"><label>Client<input placeholder="Nom du client" /></label><label>Nombre de clips<input type="number" min="1" defaultValue="6" /></label></div><label>Échéance<input type="date" /></label><div className="cs2-modal-actions"><button onClick={() => setShowCreate(false)}>Annuler</button><button className="cs2-button" onClick={addMission}>Créer la mission</button></div></div></div>}
      {toast && <div className="cs2-toast" role="status">✓ {toast}</div>}
    </div>
  );
}

export default function Home() {
  const [inApp, setInApp] = useState(false);
  return inApp ? <AppShell exit={() => setInApp(false)} /> : <Landing launch={() => setInApp(true)} />;
}
