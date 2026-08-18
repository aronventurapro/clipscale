"use client";

import { useMemo, useState, type ChangeEvent, type CSSProperties } from "react";
import "./clipscale-v2.css";

type View = "overview" | "missions" | "clips" | "virality" | "publish" | "team" | "settings";
type MissionStatus = "En production" | "À valider" | "Planifiée";
type VideoMeta = { name: string; duration: number; width: number; height: number; size: number };
type ViralAnalysis = { score: number; verdict: string; summary: string; factors: { label: string; score: number; detail: string }[]; improvements: string[] };
type SocialPlatform = { id: string; name: string; short: string; tone: string; format: string };

const socialPlatforms: SocialPlatform[] = [
  { id: "instagram", name: "Instagram", short: "IG", tone: "instagram", format: "Reels · 9:16" },
  { id: "tiktok", name: "TikTok", short: "TT", tone: "tiktok", format: "Vidéo · 9:16" },
  { id: "youtube", name: "YouTube", short: "YT", tone: "youtube", format: "Shorts ou vidéo" },
  { id: "facebook", name: "Facebook", short: "FB", tone: "facebook", format: "Reels ou vidéo" },
  { id: "linkedin", name: "LinkedIn", short: "in", tone: "linkedin", format: "Vidéo native" },
  { id: "threads", name: "Threads", short: "@", tone: "threads", format: "Publication vidéo" },
  { id: "pinterest", name: "Pinterest", short: "P", tone: "pinterest", format: "Épingle vidéo" },
  { id: "snapchat", name: "Snapchat", short: "SC", tone: "snapchat", format: "Spotlight" },
  { id: "telegram", name: "Telegram", short: "TG", tone: "telegram", format: "Canal ou groupe" },
  { id: "bluesky", name: "Bluesky", short: "BS", tone: "bluesky", format: "Publication vidéo" },
];

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
  { id: "virality", label: "Viralité", icon: "↗" },
  { id: "publish", label: "Publier", icon: "↑" },
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
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [platform, setPlatform] = useState("TikTok");
  const [hook, setHook] = useState("");
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [publishUrl, setPublishUrl] = useState("");
  const [publishFileName, setPublishFileName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube", "facebook"]);
  const [publishCaption, setPublishCaption] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const filteredClips = useMemo(() => clipFilter === "Tous" ? clips : clips.filter((clip) => clip.status === clipFilter), [clips, clipFilter]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const changeView = (next: View) => { setView(next); setShowCreate(false); };
  const addMission = () => { setMissions((current) => [...current, { id: Date.now(), client: "Nouveau client", title: "Nouvelle mission", clips: "0 / 6", due: "À définir", status: "Planifiée", tone: "green" }]); setShowCreate(false); setView("missions"); notify("Mission créée dans la démo"); };
  const advanceClip = (id: number) => { setClips((current) => current.map((clip) => clip.id === id ? { ...clip, status: clip.status === "Montage" ? "À valider" : clip.status === "À valider" ? "Approuvé" : clip.status === "Approuvé" ? "Publié" : clip.status } : clip)); notify("Statut du clip mis à jour"); };
  const selectVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url); setVideoMeta(null); setAnalysis(null);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setVideoMeta({ name: file.name, duration: Math.round(probe.duration), width: probe.videoWidth, height: probe.videoHeight, size: file.size });
    probe.src = url;
  };
  const analyzeVideo = () => {
    if (!videoMeta) return;
    const vertical = videoMeta.height > videoMeta.width;
    const durationPoints = videoMeta.duration >= 12 && videoMeta.duration <= 40 ? 25 : videoMeta.duration <= 60 ? 17 : 8;
    const formatPoints = vertical ? 22 : 8;
    const qualityPoints = Math.max(videoMeta.width, videoMeta.height) >= 1080 ? 18 : 10;
    const hookLength = hook.trim().length;
    const hookPoints = hookLength >= 18 && hookLength <= 90 ? 25 : hookLength > 0 ? 13 : 5;
    const score = Math.min(96, 10 + durationPoints + formatPoints + qualityPoints + hookPoints);
    const improvements = [
      !vertical ? "Recadrez le clip en 9:16 plein écran pour TikTok, Reels et Shorts." : "Gardez les éléments importants dans la zone centrale pour éviter les boutons des plateformes.",
      videoMeta.duration > 40 ? "Coupez les respirations et visez 20 à 35 secondes pour améliorer la rétention." : "Ajoutez un changement visuel ou un zoom toutes les 2 à 3 secondes.",
      hookLength < 18 ? "Renforcez les 2 premières secondes avec une promesse précise ou une phrase qui crée de la curiosité." : "Affichez votre accroche en sous-titre dès la première image.",
      "Terminez par une question simple pour provoquer les commentaires et les partages.",
    ];
    setAnalysis({
      score,
      verdict: score >= 80 ? "Fort potentiel" : score >= 65 ? "Bon potentiel" : score >= 50 ? "Potentiel moyen" : "À retravailler",
      summary: score >= 80 ? `Ce clip possède une structure technique solide pour ${platform}. Son format et sa durée favorisent la rétention.` : `Le clip peut fonctionner sur ${platform}, mais quelques ajustements augmenteraient nettement ses chances de retenir l’audience.`,
      factors: [
        { label: "Accroche", score: Math.round(hookPoints / 25 * 100), detail: hookLength >= 18 ? "Promesse claire et exploitable" : "Accroche trop courte ou absente" },
        { label: "Durée", score: Math.round(durationPoints / 25 * 100), detail: `${videoMeta.duration} secondes` },
        { label: "Format", score: Math.round(formatPoints / 22 * 100), detail: vertical ? "Vertical 9:16 adapté" : "Format horizontal à recadrer" },
        { label: "Qualité", score: Math.round(qualityPoints / 18 * 100), detail: `${videoMeta.width} × ${videoMeta.height} px` },
      ],
      improvements,
    });
  };
  const selectPublishVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (publishUrl) URL.revokeObjectURL(publishUrl);
    setPublishUrl(URL.createObjectURL(file));
    setPublishFileName(file.name);
  };
  const togglePlatform = (id: string) => setSelectedPlatforms((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const publishReady = Boolean(publishUrl && publishCaption.trim() && selectedPlatforms.length && (!selectedPlatforms.includes("youtube") || youtubeTitle.trim()) && (publishMode === "now" || scheduledAt));

  return (
    <div className="cs2-app">
      <aside className="cs2-sidebar">
        <button className="cs2-brand-button" onClick={exit} aria-label="Retour au site"><Logo /></button>
        <nav aria-label="Navigation de l’application">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="cs2-demo-card"><b>Mode démo</b><p>Les données affichées sont fictives et restent dans votre navigateur.</p><button onClick={exit}>Quitter la démo</button></div>
      </aside>

      <main className="cs2-workspace">
        <header className="cs2-app-header"><div className="cs2-mobile-brand"><Logo /></div><span className="cs2-demo-pill">● MODE DÉMO</span><div className="cs2-header-actions"><button aria-label="Aide">?</button><div className="cs2-avatar">AV</div></div></header>
        <div className="cs2-mobile-nav">{navItems.slice(0, 5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label === "Vue d’ensemble" ? "Accueil" : item.label}</button>)}</div>

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
            <div className="cs2-page-title"><div><span>CONTENUS</span><h1>Clips</h1><p>Retrouvez les versions, validations et statuts de publication.</p></div><button className="cs2-button" onClick={() => changeView("virality")}>Analyser un clip</button></div>
            <div className="cs2-filter-row">{["Tous", "Montage", "À valider", "Approuvé", "Publié"].map((filter) => <button className={clipFilter === filter ? "active" : ""} onClick={() => setClipFilter(filter)} key={filter}>{filter}</button>)}</div>
            <div className="cs2-clip-grid">{filteredClips.map((clip) => <article className="cs2-clip-card" key={clip.id}><div className="cs2-video-placeholder"><span>▶</span><small>{clip.format}</small></div><div className="cs2-clip-info"><Status>{clip.status}</Status><h3>{clip.title}</h3><p>{clip.mission}</p><button onClick={() => advanceClip(clip.id)} disabled={clip.status === "Publié"}>{clip.status === "Publié" ? "Publication terminée" : "Passer à l’étape suivante →"}</button></div></article>)}</div>
          </>}

          {view === "virality" && <>
            <div className="cs2-page-title"><div><span>ANALYSE AUTOMATIQUE</span><h1>Score de viralité</h1><p>Importez un clip et obtenez un diagnostic immédiatement exploitable.</p></div></div>
            <div className="cs2-viral-layout">
              <section className="cs2-panel cs2-analyzer">
                <div className="cs2-analyzer-head"><span className="cs2-ai-icon">↗</span><div><h2>Analysez votre prochain clip</h2><p>La vidéo reste sur votre appareil pendant cette démonstration.</p></div></div>
                {!videoUrl ? <label className="cs2-upload-zone"><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectVideo} /><span>＋</span><strong>Déposez votre vidéo ici</strong><small>MP4, MOV ou WebM · 500 Mo maximum</small><b>Choisir un clip</b></label> : <div className="cs2-uploaded-video"><video src={videoUrl} controls playsInline /><div><strong>{videoMeta?.name ?? "Chargement de la vidéo…"}</strong>{videoMeta && <small>{videoMeta.duration} s · {videoMeta.width} × {videoMeta.height} px · {(videoMeta.size / 1048576).toFixed(1)} Mo</small>}<label>Remplacer<input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectVideo} /></label></div></div>}
                <div className="cs2-analyzer-form"><label>Plateforme cible<select value={platform} onChange={(event) => setPlatform(event.target.value)}><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option></select></label><label>Accroche des premières secondes<textarea value={hook} onChange={(event) => setHook(event.target.value)} placeholder="Ex. Cette erreur m’a fait perdre 10 000 €…" maxLength={140} /><small>{hook.length}/140</small></label></div>
                <button className="cs2-button cs2-analyze-button" onClick={analyzeVideo} disabled={!videoMeta}>{videoMeta ? "Analyser le potentiel viral →" : "Ajoutez une vidéo pour commencer"}</button>
                <p className="cs2-analysis-note">Le score est une estimation basée sur le format, la durée, la qualité et l’accroche. Il ne garantit pas les performances réelles.</p>
              </section>

              <section className={`cs2-panel cs2-analysis-result ${analysis ? "ready" : ""}`} aria-live="polite">
                {!analysis ? <div className="cs2-empty-analysis"><span>◎</span><h2>Votre diagnostic apparaîtra ici</h2><p>Ajoutez une vidéo et son accroche pour obtenir le score, les points forts et les améliorations prioritaires.</p></div> : <>
                  <div className="cs2-score-header"><div className="cs2-score-ring" style={{ "--score": `${analysis.score * 3.6}deg` } as CSSProperties}><span><strong>{analysis.score}</strong><small>/100</small></span></div><div><span className="cs2-potential-label">{analysis.verdict}</span><h2>Potentiel viral estimé</h2><p>{analysis.summary}</p></div></div>
                  <div className="cs2-factor-list"><h3>Détail du score</h3>{analysis.factors.map((factor) => <div className="cs2-factor" key={factor.label}><div><b>{factor.label}</b><span>{factor.detail}</span><strong>{factor.score}%</strong></div><div><i style={{ width: `${factor.score}%` }} /></div></div>)}</div>
                  <div className="cs2-improvements"><h3>Comment l’améliorer</h3>{analysis.improvements.map((item, index) => <article key={item}><b>{index + 1}</b><p>{item}</p></article>)}</div>
                  <button className="cs2-secondary-action" onClick={() => { setAnalysis(null); setHook(""); }}>Analyser une autre version</button>
                </>}
              </section>
            </div>
          </>}

          {view === "publish" && <>
            <div className="cs2-page-title cs2-publish-title"><div><span>DIFFUSION MULTICANALE</span><h1>Publiez partout, en une fois.</h1><p>Ajoutez votre vidéo, choisissez les réseaux et préparez une publication groupée.</p></div><span className="cs2-setup-badge">Mode configuration</span></div>
            <div className="cs2-publish-steps" aria-label="Étapes de publication"><span className={publishUrl ? "done" : "active"}><b>{publishUrl ? "✓" : "1"}</b> Vidéo</span><i /><span className={publishUrl ? "active" : ""}><b>2</b> Réseaux</span><i /><span className={publishCaption ? "active" : ""}><b>3</b> Message</span><i /><span><b>4</b> Publication</span></div>
            <div className="cs2-publish-layout">
              <div className="cs2-publish-main">
                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>1</span><div><h2>Ajoutez votre vidéo</h2><p>Un seul fichier sera adapté aux réseaux sélectionnés.</p></div>{publishUrl && <b>Prête</b>}</div>
                  {!publishUrl ? <label className="cs2-publish-drop"><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectPublishVideo} /><span>↑</span><strong>Déposez votre vidéo ici</strong><small>MP4, MOV ou WebM · vertical 9:16 recommandé</small><b>Choisir une vidéo</b></label> : <div className="cs2-publish-preview"><video src={publishUrl} controls playsInline /><div><span>VIDÉO AJOUTÉE</span><strong>{publishFileName}</strong><small>Utilisez l’aperçu pour vérifier le son et le cadrage.</small><label>Remplacer la vidéo<input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectPublishVideo} /></label></div></div>}
                </section>

                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>2</span><div><h2>Choisissez les réseaux</h2><p>Cochez chaque destination. Vous connecterez les comptes avant le premier envoi.</p></div><button onClick={() => setSelectedPlatforms(selectedPlatforms.length === socialPlatforms.length ? [] : socialPlatforms.map((item) => item.id))}>{selectedPlatforms.length === socialPlatforms.length ? "Tout retirer" : "Tout sélectionner"}</button></div>
                  <div className="cs2-platform-grid">{socialPlatforms.map((item) => { const checked = selectedPlatforms.includes(item.id); return <button type="button" key={item.id} className={checked ? "selected" : ""} aria-pressed={checked} onClick={() => togglePlatform(item.id)}><span className={`cs2-social-icon ${item.tone}`}>{item.short}</span><span><b>{item.name}</b><small>{item.format}</small></span><i>{checked ? "✓" : "+"}</i></button>; })}</div>
                </section>

                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>3</span><div><h2>Préparez le message</h2><p>Commencez avec un texte commun, puis ajustez les champs obligatoires.</p></div></div>
                  <label className="cs2-publish-field">Légende commune<textarea value={publishCaption} onChange={(event) => setPublishCaption(event.target.value)} maxLength={2200} placeholder="Écrivez une accroche claire, apportez la valeur, puis terminez par un appel à l’action…" /><small>{publishCaption.length}/2200</small></label>
                  {selectedPlatforms.includes("youtube") && <label className="cs2-publish-field">Titre YouTube <em>Obligatoire</em><input value={youtubeTitle} onChange={(event) => setYoutubeTitle(event.target.value)} maxLength={100} placeholder="Ex. 3 erreurs qui bloquent votre croissance" /><small>{youtubeTitle.length}/100</small></label>}
                  <div className="cs2-format-tip"><span>✦</span><p><b>Conseil ClipScale</b> Gardez le texte important au centre, ajoutez des sous-titres et évitez les filigranes d’une autre plateforme.</p></div>
                </section>

                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>4</span><div><h2>Choisissez le moment</h2><p>Publiez dès validation ou programmez une date précise.</p></div></div>
                  <div className="cs2-publish-choice"><button className={publishMode === "now" ? "active" : ""} onClick={() => setPublishMode("now")}><b>⚡ Maintenant</b><small>Lancement dès que les comptes sont autorisés</small></button><button className={publishMode === "schedule" ? "active" : ""} onClick={() => setPublishMode("schedule")}><b>◷ Programmer</b><small>Choisissez votre date et votre heure</small></button></div>
                  {publishMode === "schedule" && <label className="cs2-publish-field cs2-date-field">Date et heure<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>}
                </section>
              </div>

              <aside className="cs2-panel cs2-publish-summary">
                <span className="cs2-summary-label">RÉSUMÉ</span><h2>Votre publication</h2>
                <div className={`cs2-summary-video ${publishUrl ? "has-video" : ""}`}>{publishUrl ? <video src={publishUrl} muted playsInline /> : <><span>▶</span><small>Aucune vidéo</small></>}</div>
                <div className="cs2-summary-row"><span>Destinations</span><strong>{selectedPlatforms.length}</strong></div>
                <div className="cs2-summary-networks">{selectedPlatforms.length ? socialPlatforms.filter((item) => selectedPlatforms.includes(item.id)).map((item) => <span className={`cs2-social-icon ${item.tone}`} key={item.id}>{item.short}</span>) : <small>Sélectionnez au moins un réseau.</small>}</div>
                <div className="cs2-summary-row"><span>Envoi</span><strong>{publishMode === "now" ? "Maintenant" : scheduledAt ? new Date(scheduledAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "À définir"}</strong></div>
                <button className="cs2-button cs2-publish-button" disabled={!publishReady} onClick={() => setShowConnect(true)}>{publishMode === "now" ? `Préparer ${selectedPlatforms.length} publication${selectedPlatforms.length > 1 ? "s" : ""}` : `Programmer sur ${selectedPlatforms.length} réseau${selectedPlatforms.length > 1 ? "x" : ""}`} →</button>
                {!publishReady && <p className="cs2-summary-help">Ajoutez une vidéo, une légende et tous les champs requis.</p>}
                <div className="cs2-real-posting-note"><b>Publication réelle sécurisée</b><p>Chaque réseau demandera votre autorisation officielle. ClipScale ne demande jamais vos mots de passe sociaux.</p></div>
              </aside>
            </div>
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
      {showConnect && <div className="cs2-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowConnect(false)}><div className="cs2-modal cs2-connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title"><button className="cs2-modal-close" onClick={() => setShowConnect(false)} aria-label="Fermer">×</button><span>DERNIÈRE ÉTAPE</span><h2 id="connect-title">Connectez vos comptes</h2><p>La publication est prête. Pour envoyer réellement la vidéo, autorisez chaque réseau avec sa fenêtre officielle.</p><div className="cs2-connect-list">{socialPlatforms.filter((item) => selectedPlatforms.includes(item.id)).map((item) => <div key={item.id}><span className={`cs2-social-icon ${item.tone}`}>{item.short}</span><b>{item.name}</b><small>À connecter</small></div>)}</div><div className="cs2-connect-security"><span>✓</span><p><b>Connexion OAuth sécurisée</b><br />Vos identifiants restent chez Instagram, TikTok, Google, Meta et les autres plateformes.</p></div><div className="cs2-modal-actions"><button onClick={() => setShowConnect(false)}>Revenir au brouillon</button><button className="cs2-button" onClick={() => notify("Intégration des comptes prête à être configurée")}>Configurer les connexions</button></div></div></div>}
      {toast && <div className="cs2-toast" role="status">✓ {toast}</div>}
    </div>
  );
}

export default function Home() {
  const [inApp, setInApp] = useState(false);
  return inApp ? <AppShell exit={() => setInApp(false)} /> : <Landing launch={() => setInApp(true)} />;
}
