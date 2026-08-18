"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import { SiBluesky, SiFacebook, SiInstagram, SiLinkedin, SiPinterest, SiSnapchat, SiTelegram, SiThreads, SiTiktok, SiYoutube } from "react-icons/si";
import { supabase } from "../lib/supabase";
import "./clipscale-v2.css";

type View = "overview" | "missions" | "clips" | "virality" | "publish" | "team" | "settings";
type MissionStatus = "En production" | "À valider" | "Planifiée";
type VideoMeta = { name: string; duration: number; width: number; height: number; size: number };
type ViralAnalysis = { score: number; verdict: string; summary: string; factors: { label: string; score: number; detail: string }[]; improvements: string[] };
type SocialPlatform = { id: string; name: string; short: string; tone: string; format: string; ratio: string; recommendedLength: number; tips: string[] };

const socialPlatforms: SocialPlatform[] = [
  { id: "instagram", name: "Instagram", short: "IG", tone: "instagram", format: "Reel vertical", ratio: "9:16", recommendedLength: 500, tips: ["Accroche visible dès la première image", "3 à 5 hashtags vraiment pertinents"] },
  { id: "tiktok", name: "TikTok", short: "TT", tone: "tiktok", format: "Vidéo verticale", ratio: "9:16", recommendedLength: 300, tips: ["Ton direct et naturel", "Terminez par une question simple"] },
  { id: "youtube", name: "YouTube", short: "YT", tone: "youtube", format: "Short ou vidéo", ratio: "9:16", recommendedLength: 500, tips: ["Titre clair avec le bénéfice principal", "Ajoutez une invitation à s’abonner"] },
  { id: "facebook", name: "Facebook", short: "FB", tone: "facebook", format: "Reel ou vidéo", ratio: "9:16", recommendedLength: 500, tips: ["Donnez du contexte en une phrase", "Favorisez une question ouverte"] },
  { id: "linkedin", name: "LinkedIn", short: "in", tone: "linkedin", format: "Vidéo native", ratio: "4:5", recommendedLength: 600, tips: ["Reliez la vidéo à un apprentissage métier", "Aérez le texte en paragraphes courts"] },
  { id: "threads", name: "Threads", short: "@", tone: "threads", format: "Post vidéo", ratio: "9:16", recommendedLength: 350, tips: ["Écrivez comme une conversation", "Gardez une seule idée forte"] },
  { id: "pinterest", name: "Pinterest", short: "P", tone: "pinterest", format: "Épingle vidéo", ratio: "2:3", recommendedLength: 400, tips: ["Promesse utile et recherchable", "Ajoutez des mots-clés précis"] },
  { id: "snapchat", name: "Snapchat", short: "SC", tone: "snapchat", format: "Spotlight", ratio: "9:16", recommendedLength: 150, tips: ["Message très court", "Le visuel doit se comprendre sans contexte"] },
  { id: "telegram", name: "Telegram", short: "TG", tone: "telegram", format: "Canal ou groupe", ratio: "9:16", recommendedLength: 700, tips: ["Ajoutez le contexte utile", "Terminez par un lien ou une action"] },
  { id: "bluesky", name: "Bluesky", short: "BS", tone: "bluesky", format: "Post vidéo", ratio: "9:16", recommendedLength: 280, tips: ["Soyez concis", "Placez l’idée principale au début"] },
];

const platformIcons = { instagram: SiInstagram, tiktok: SiTiktok, youtube: SiYoutube, facebook: SiFacebook, linkedin: SiLinkedin, threads: SiThreads, pinterest: SiPinterest, snapchat: SiSnapchat, telegram: SiTelegram, bluesky: SiBluesky };

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const Icon = platformIcons[platform.id as keyof typeof platformIcons];
  return <span className={`cs2-social-icon ${platform.tone}`} aria-hidden="true"><Icon /></span>;
}

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

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0, duration = 1200 }: { value: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const next = value * (1 - Math.pow(1 - progress, 4));
      setDisplay(decimals ? Number(next.toFixed(decimals)) : Math.round(next));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [decimals, duration, value, visible]);
  return <span ref={ref} className="cs5-count" aria-label={`${prefix}${value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}>{prefix}{display.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function PerformanceChart() {
  return <div className="cs2-performance-chart" role="img" aria-label="Évolution des vues sur les 7 derniers jours, de 12 400 à 38 200 vues"><div className="cs2-chart-y"><span>40k</span><span>30k</span><span>20k</span><span>10k</span><span>0</span></div><div className="cs2-chart-plot"><i /><i /><i /><i /><svg viewBox="0 0 700 210" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7558e4" stopOpacity=".28"/><stop offset="1" stopColor="#7558e4" stopOpacity="0"/></linearGradient></defs><path className="fill" d="M0 175 C70 160 95 168 150 135 S245 148 300 104 S400 116 455 76 S560 88 610 45 S665 48 700 22 L700 210 L0 210Z"/><path className="line" d="M0 175 C70 160 95 168 150 135 S245 148 300 104 S400 116 455 76 S560 88 610 45 S665 48 700 22"/><circle cx="700" cy="22" r="6"/></svg><div className="cs2-chart-x"><span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span></div></div></div>;
}

const plans = [
  { name: "Starter", price: 29, description: "Pour publier régulièrement sans perdre de temps.", features: ["1 espace de travail", "30 clips par mois", "4 réseaux connectés", "Analyse de viralité"], cta: "Commencer avec Starter" },
  { name: "Scale", price: 79, description: "Pour les créateurs et petites équipes qui accélèrent.", features: ["3 membres inclus", "150 clips par mois", "10 réseaux connectés", "Variantes IA par plateforme", "Statistiques avancées"], cta: "Choisir Scale", popular: true },
  { name: "Agency", price: 149, description: "Pour piloter plusieurs clients depuis un seul cockpit.", features: ["10 membres inclus", "Clips illimités", "Espaces clients", "Publication prioritaire", "Support dédié"], cta: "Passer à Agency" },
];

const motionSteps = [
  { number: "01", label: "Importez", detail: "Votre clip arrive dans un espace unique." },
  { number: "02", label: "Analysez", detail: "Le score viral révèle les priorités." },
  { number: "03", label: "Adaptez", detail: "Chaque réseau reçoit sa bonne variante." },
  { number: "04", label: "Publiez", detail: "Votre campagne part depuis un cockpit." },
];

const creatorResults = [
  { name: "Yomi Denzel", image: "/creator-results/yomi-denzel.webp", position: "center 36%", views: 4_500_000, compactValue: 4.5, compactSuffix: " M", share: 100, accent: "#a991ff" },
  { name: "Maouno", image: "/creator-results/maouno.webp", position: "center 59%", views: 2_500_000, compactValue: 2.5, compactSuffix: " M", share: 56, accent: "#7d9cff" },
  { name: "Keo", image: "/creator-results/keo.webp", position: "center 28%", views: 1_200_000, compactValue: 1.2, compactSuffix: " M", share: 27, accent: "#64d7b2" },
  { name: "Blyaat", image: "/creator-results/blyaat.webp", position: "center 31%", views: 79_000, compactValue: 79, compactSuffix: " k", share: 8, accent: "#f0a66a" },
];

const additionalCreators = [
  { image: "/creator-results/collaboration-1.webp", position: "center 28%" },
  { image: "/creator-results/collaboration-2.webp", position: "center 22%" },
  { image: "/creator-results/collaboration-3.webp", position: "center 35%" },
];

function Landing({ launch }: { launch: (plan?: string, requireAccount?: boolean) => void }) {
  const [spotlight, setSpotlight] = useState<"analyse" | "publication" | "pilotage">("analyse");
  const [activeCreator, setActiveCreator] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const spotlightTabs = ["analyse", "publication", "pilotage"] as const;
  const navigateSpotlight = (event: KeyboardEvent<HTMLButtonElement>, current: typeof spotlightTabs[number]) => {
    const currentIndex = spotlightTabs.indexOf(current);
    const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % spotlightTabs.length : event.key === "ArrowLeft" ? (currentIndex - 1 + spotlightTabs.length) % spotlightTabs.length : event.key === "Home" ? 0 : event.key === "End" ? spotlightTabs.length - 1 : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = spotlightTabs[nextIndex];
    setSpotlight(next);
    window.requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
  };
  return (
    <main className="cs3-landing">
      <a className="cs3-skip-link" href="#main-content">Aller au contenu principal</a>
      <div className="cs3-noise" aria-hidden="true" />
      <header className="cs3-header">
        <a href="#top" aria-label="Accueil ClipScale"><Logo /></a>
        <nav aria-label="Navigation principale"><a href="#product">Produit</a><a href="#workflow">Fonctionnement</a><a href="#features">Fonctionnalités</a><a href="#pricing">Tarifs</a></nav>
        <button type="button" className="cs3-nav-cta" onClick={() => launch("Scale", true)}>Se connecter <span aria-hidden="true">↗</span></button>
      </header>

      <section className="cs3-hero" id="main-content">
        <div className="cs3-orb cs3-orb-one" aria-hidden="true" /><div className="cs3-orb cs3-orb-two" aria-hidden="true" />
        <div className="cs3-hero-copy">
          <div className="cs3-kicker"><span><i /> NOUVEAU</span> Analyse virale et publication multicanale <b aria-hidden="true">→</b></div>
          <h1>Une vidéo.<br /><em>Partout.</em> Plus vite.</h1>
          <p>Centralisez la production, améliorez le potentiel de chaque clip et préparez sa diffusion sur plusieurs réseaux depuis un seul espace.</p>
          <div className="cs3-actions"><button type="button" className="cs3-primary" onClick={() => launch()}>Tester la démo interactive <span aria-hidden="true">→</span></button><a href="#product">Découvrir le produit <i aria-hidden="true">↓</i></a></div>
          <div className="cs3-reassurance"><span>✓ Accès immédiat</span><span>✓ Aucune carte bancaire</span><span>✓ Données de démonstration</span></div>
        </div>

        <div className="cs3-hero-visual" role="img" aria-label="Aperçu animé d’un clip analysé avec un score viral de 87 sur 100 et quatre réseaux sélectionnés">
          <div className="cs3-visual-glow" />
          <div className="cs3-float-card cs3-float-score"><small>SCORE VIRAL</small><strong><AnimatedNumber value={87} duration={1450} /><span>/100</span></strong><i><b /></i><em>Fort potentiel ↗</em></div>
          <div className="cs3-float-card cs3-float-publish"><span>✓</span><div><strong>Publication prête</strong><small>4 réseaux sélectionnés</small></div></div>
          <div className="cs3-phone">
            <div className="cs3-phone-top"><i /><span>APERÇU DU CLIP</span><b>•••</b></div>
            <div className="cs3-video-art"><div className="cs3-video-grid" /><span className="cs3-play">▶</span><div className="cs3-caption"><small>LE DÉCLIC QUI</small><strong>CHANGE TOUT.</strong></div><em>00:24</em></div>
            <div className="cs3-phone-bottom"><span><b>9:16</b><small>Format</small></span><span><b>24 s</b><small>Durée</small></span><span><b>1080p</b><small>Qualité</small></span></div>
          </div>
          <div className="cs3-network-stack">{socialPlatforms.slice(0, 5).map((item, index) => <span key={item.id} style={{ "--stack": index } as CSSProperties}><SocialIcon platform={item} /></span>)}</div>
        </div>
      </section>

      <section className="cs3-marquee" aria-label="Réseaux proposés dans le parcours de publication"><p className="cs3-sr-only">Instagram, TikTok, YouTube, Facebook, LinkedIn, Threads, Pinterest, Snapchat, Telegram et Bluesky.</p><div aria-hidden="true">{[...socialPlatforms, ...socialPlatforms].map((item, index) => <span key={`${item.id}-${index}`}><SocialIcon platform={item} />{item.name}<b>✦</b></span>)}</div></section>

      <section className="cs3-value" id="product">
        <div className="cs3-section-tag">LE CHAOS S’ARRÊTE ICI</div>
        <div className="cs3-value-head"><h2>Votre agence avance.<br />Vos outils doivent suivre.</h2><p>Fini les fichiers perdus, les validations dans les messages et les publications faites une par une. ClipScale transforme votre chaîne de production en système clair et scalable.</p></div>
        <div className="cs3-value-grid"><article><strong>01</strong><span>Une source de vérité</span><p>Missions, clips, retours et statuts réunis au même endroit.</p></article><article><strong>02</strong><span>Des décisions plus rapides</span><p>Un score lisible et des améliorations concrètes avant de publier.</p></article><article><strong>03</strong><span>Une diffusion sans répétition</span><p>Une vidéo, une légende, tous les réseaux que vous choisissez.</p></article></div>
      </section>

      <section className="cs3-spotlight" id="features">
        <div className="cs3-spotlight-copy"><div className="cs3-section-tag">LE PRODUIT EN ACTION</div><h2>Trois fonctions clés.<br /><em>Un seul espace.</em></h2><p>Chaque vue répond à une tâche précise : améliorer, diffuser ou piloter.</p><div className="cs3-tabs" role="tablist" aria-label="Démonstrations du produit">{spotlightTabs.map((tab, index) => <button type="button" id={`tab-${tab}`} key={tab} role="tab" aria-controls={`panel-${tab}`} aria-selected={spotlight === tab} tabIndex={spotlight === tab ? 0 : -1} className={spotlight === tab ? "active" : ""} onClick={() => setSpotlight(tab)} onKeyDown={(event) => navigateSpotlight(event, tab)}><b>0{index + 1}</b><span>{tab === "analyse" ? "Analyse virale" : tab === "publication" ? "Publication multicanale" : "Pilotage d’agence"}</span></button>)}</div></div>
        <div className="cs3-feature-screen" aria-live="polite">
          {spotlight === "analyse" && <div id="panel-analyse" role="tabpanel" aria-labelledby="tab-analyse" className="cs3-screen-inner cs3-analysis-demo"><header><span>✦ ANALYSE AUTOMATIQUE</span><b>Diagnostic terminé</b></header><div className="cs3-demo-score"><div><strong><AnimatedNumber value={87} duration={1100} /></strong><small>/100</small></div><span><b>Fort potentiel</b><p>Le format et la durée favorisent la rétention.</p></span></div>{[["Accroche",92],["Durée",88],["Format",96],["Qualité",82]].map(([label, score]) => <div className="cs3-demo-factor" key={label}><span>{label}</span><i><b style={{ width: `${score}%` }} /></i><strong><AnimatedNumber value={Number(score)} suffix="%" duration={900} /></strong></div>)}<aside><b>↗ Priorité n°1</b><p>Affichez votre accroche dès la première image.</p></aside></div>}
          {spotlight === "publication" && <div id="panel-publication" role="tabpanel" aria-labelledby="tab-publication" className="cs3-screen-inner cs3-publish-demo"><header><span>↑ PUBLICATION MULTICANALE</span><b>4 destinations</b></header><div className="cs3-upload-demo"><span>▶</span><div><b>clip-final-v3.mp4</b><small>9:16 · 24 secondes · Prêt</small></div><em>✓</em></div><h3>Choisissez vos réseaux</h3><div className="cs3-demo-networks">{socialPlatforms.slice(0, 8).map((item, index) => <span key={item.id} className={index < 4 ? "active" : ""}><SocialIcon platform={item} /><b>{item.name}</b><em>{index < 4 ? "✓" : "+"}</em></span>)}</div><div className="cs3-demo-cta">Préparer 4 publications →</div></div>}
          {spotlight === "pilotage" && <div id="panel-pilotage" role="tabpanel" aria-labelledby="tab-pilotage" className="cs3-screen-inner cs3-pilot-demo"><header><span>⌂ VUE D’ENSEMBLE</span><b>En direct</b></header><div className="cs3-demo-kpis"><span><small>À VALIDER</small><strong><AnimatedNumber value={7} /></strong><em>clips</em></span><span><small>EN PRODUCTION</small><strong><AnimatedNumber value={18} /></strong><em>clips</em></span><span><small>À PUBLIER</small><strong><AnimatedNumber value={4} /></strong><em>clips</em></span></div><h3>Priorités du jour</h3>{["Valider 7 clips pour Nova Studio","Compléter le brief Maison Lune","Programmer 4 publications"].map((item, index) => <div className="cs3-demo-task" key={item}><i>{index + 1}</i><span><b>{item}</b><small>{index === 0 ? "Urgent · aujourd’hui" : index === 1 ? "Brief incomplet" : "Instagram · TikTok · YouTube · Facebook"}</small></span><em>→</em></div>)}</div>}
        </div>
      </section>

      <section className="cs3-workflow" id="workflow"><div className="cs3-section-tag">SIMPLE PAR CONCEPTION</div><h2>De la vidéo brute à la diffusion.<br /><em>Sans changer d’outil.</em></h2><div className="cs3-flow-line"><i /></div><div className="cs3-flow-grid"><article><span>01</span><b>Centralisez</b><p>Créez la mission, assignez l’équipe et rassemblez les versions.</p></article><article><span>02</span><b>Optimisez</b><p>Analysez la vidéo et appliquez les recommandations prioritaires.</p></article><article><span>03</span><b>Validez</b><p>Gardez les retours client rattachés à la bonne version.</p></article><article><span>04</span><b>Diffusez</b><p>Sélectionnez vos réseaux et préparez toutes les publications.</p></article></div></section>

      <section className="cs3-bento"><article className="cs3-bento-large"><span>POUR LES AGENCES</span><h2>Plus de capacité.<br />Moins de coordination.</h2><p>Votre équipe voit ses priorités. Vos clients voient l’avancement. Vous gardez la maîtrise.</p><div><b><strong><AnimatedNumber value={1} /></strong><small>cockpit</small></b><b><strong><AnimatedNumber value={10} /></strong><small>réseaux</small></b><b><strong><AnimatedNumber value={0} /></strong><small>tableur</small></b></div></article><article className="cs3-bento-dark"><span>VIRALITÉ</span><div className="cs3-mini-ring"><AnimatedNumber value={87} /></div><h3>Comprenez avant de publier.</h3><p>Accroche, format, durée et qualité expliqués clairement.</p></article><article className="cs3-bento-purple"><span>DIFFUSION</span><div className="cs3-bento-icons">{socialPlatforms.slice(0, 4).map((item) => <SocialIcon platform={item} key={item.id} />)}</div><h3>Publiez sans vous répéter.</h3><p>Une préparation unique pour tous vos canaux.</p></article></section>

      <section className="cs3-video-demo">
        <div className="cs3-video-copy"><div className="cs3-section-tag">30 SECONDES POUR TOUT COMPRENDRE</div><h2>Voyez ClipScale<br /><em>prendre vie.</em></h2><p>Une démonstration motion design, de votre clip brut à une campagne prête pour chaque plateforme.</p><div className="cs5-motion-steps">{motionSteps.map((step) => <div key={step.number}><b>{step.number}</b><span><strong>{step.label}</strong><small>{step.detail}</small></span></div>)}</div><button type="button" onClick={() => launch()}>Essayer le cockpit interactif →</button></div>
        <div className="cs3-video-stage"><div className="cs3-video-halo" aria-hidden="true"/><div className="cs3-video-frame"><video controls autoPlay muted loop playsInline preload="auto" poster="/clipscale-motion-poster.jpg" aria-label="Démonstration animée de ClipScale en 30 secondes"><source src="/clipscale-motion-demo.mp4" type="video/mp4" /></video><span><i/> MOTION DEMO · 00:30</span><div className="cs5-video-badge score"><small>SCORE VIRAL</small><b><AnimatedNumber value={87} /></b></div><div className="cs5-video-badge ready"><i>✓</i><span><b>10 variantes prêtes</b><small>Adaptées automatiquement</small></span></div></div></div>
      </section>

      <section className="cs3-results"><div className="cs3-section-tag">RÉSULTATS ATTENDUS</div><h2>Moins d’opérations.<br />Plus de contenu publié.</h2><div className="cs3-results-grid"><article><strong><AnimatedNumber value={68} prefix="−" suffix="%" duration={1600}/></strong><p>de temps consacré à la diffusion</p><small>Scénario agence · 5 clients</small></article><article><strong><AnimatedNumber value={3} prefix="×" duration={1300}/></strong><p>plus de variantes publiées</p><small>Scénario créateur · 4 réseaux</small></article><article><strong><AnimatedNumber value={24} prefix="+" suffix="%" duration={1500}/></strong><p>de vues hebdomadaires</p><small>Projection issue du tableau de bord démo</small></article></div><p className="cs3-results-disclaimer">Ces chiffres illustrent des scénarios de démonstration. Les résultats réels dépendent du contenu, de l’audience et des plateformes.</p></section>

      <section className="cs6-proof" aria-labelledby="creator-results-title">
        <div className="cs6-proof-orb one" aria-hidden="true" /><div className="cs6-proof-orb two" aria-hidden="true" />
        <header className="cs6-proof-head"><div><div className="cs3-section-tag">DES RÉSULTATS QUI SE MESURENT</div><h2 id="creator-results-title">Des créateurs ambitieux.<br /><em>Des millions de vues.</em></h2><p>Découvrez les performances générées au fil de mes collaborations avec des créateurs reconnus.</p></div><div className="cs6-proof-total"><span>VUES GÉNÉRÉES AU TOTAL</span><strong><AnimatedNumber value={8_279_000} suffix="+" duration={1900} /></strong><small>sur ces quatre collaborations</small><i><b /></i></div></header>
        <div className="cs6-proof-shell">
          <div className="cs6-proof-focus" key={creatorResults[activeCreator].name} style={{ "--creator-accent": creatorResults[activeCreator].accent } as CSSProperties}>
            <span className="cs6-proof-rank">0{activeCreator + 1} · COLLABORATION</span><div className="cs6-proof-avatar"><img src={creatorResults[activeCreator].image} alt={`Portrait de ${creatorResults[activeCreator].name}`} style={{ objectPosition: creatorResults[activeCreator].position }} /><i /></div><div className="cs6-proof-focus-copy"><small>CRÉATEUR ACCOMPAGNÉ</small><h3>{creatorResults[activeCreator].name}</h3><p>Une stratégie de contenu pensée pour maximiser l’accroche, la rétention et la distribution multicanale.</p></div><div className="cs6-proof-number"><span>VUES GÉNÉRÉES</span><strong><AnimatedNumber value={creatorResults[activeCreator].views} duration={1700} /></strong><small>grâce à la collaboration</small></div><div className="cs6-proof-signal" aria-hidden="true">{[28,46,39,64,52,82,68,96,78,100].map((height,index) => <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }} />)}</div>
          </div>
          <div className="cs6-proof-list" aria-label="Choisir un résultat créateur">{creatorResults.map((creator,index) => <button type="button" aria-pressed={activeCreator === index} className={activeCreator === index ? "active" : ""} onClick={() => setActiveCreator(index)} key={creator.name} style={{ "--creator-accent": creator.accent } as CSSProperties}><span className="cs6-proof-mini-avatar"><img src={creator.image} alt="" style={{ objectPosition: creator.position }} /></span><span className="cs6-proof-name"><b>{creator.name}</b><small>Collaboration créateur</small></span><strong><AnimatedNumber value={creator.compactValue} decimals={creator.compactValue % 1 ? 1 : 0} suffix={creator.compactSuffix} /></strong><i><b style={{ width: `${creator.share}%` }} /></i><em>→</em></button>)}</div>
        </div>
        <div className="cs6-proof-more"><div><span>ET BIEN D’AUTRES</span><strong>Une expérience construite aux côtés de créateurs aux univers très différents.</strong><small>D’autres collaborations et résultats seront ajoutés prochainement.</small></div><div className="cs6-proof-more-stack" aria-label="Autres créateurs accompagnés">{additionalCreators.map((creator,index) => <figure key={creator.image} style={{ "--portrait-index": index } as CSSProperties}><img src={creator.image} alt={`Autre créateur accompagné ${index + 1}`} style={{ objectPosition: creator.position }} /></figure>)}</div></div>
        <p className="cs6-proof-note">Résultats communiqués par Aron Ventura · Les performances varient selon le contenu, l’audience et les plateformes.</p>
      </section>

      <section className="cs3-pricing" id="pricing"><div className="cs3-section-tag">DES OFFRES QUI ÉVOLUENT AVEC VOUS</div><div className="cs3-pricing-head"><h2>Commencez simplement.<br /><em>Passez à l’échelle.</em></h2><p>Chaque formule inclut le cockpit de production, l’analyse virale et la préparation multicanale.</p></div><div className="cs3-pricing-grid">{plans.map((plan) => <article key={plan.name} className={plan.popular ? "popular" : ""}>{plan.popular && <span className="cs3-popular-label">LE PLUS CHOISI</span>}<header><span>{plan.name}</span><p>{plan.description}</p></header><div className="cs3-price"><strong><AnimatedNumber value={plan.price} suffix="€" /></strong><small>/ mois<br />HT</small></div><ul>{plan.features.map((feature) => <li key={feature}><i>✓</i>{feature}</li>)}</ul><button type="button" onClick={() => launch(plan.name, true)}>{plan.cta}<span>→</span></button><small>Sans engagement · Annulation à tout moment</small></article>)}</div><p className="cs3-pricing-note">Le paiement sécurisé sera activé via Stripe. Créez votre compte pour préparer votre espace dès maintenant.</p></section>

      <section className="cs3-faq"><div><div className="cs3-section-tag">QUESTIONS FRÉQUENTES</div><h2>Tout ce qu’il faut savoir<br />avant de démarrer.</h2><p>Une question qui manque ? Le support est disponible directement dans l’application.</p></div><div className="cs3-faq-list">{[["ClipScale publie-t-il réellement sur mes réseaux ?","La connexion officielle de chaque plateforme sera nécessaire. ClipScale prépare déjà les variantes et le calendrier ; l’envoi réel sera activé réseau par réseau après validation OAuth."],["Mes vidéos sont-elles sécurisées ?","Oui. Le stockage est privé et chaque fichier est isolé par utilisateur. Les autres clients ne peuvent pas accéder à vos vidéos."],["Puis-je essayer sans payer ?","Oui. Votre espace démarre avec 14 jours d’essai. Stripe sera connecté à la dernière étape avant l’ouverture des abonnements payants."],["Le score viral garantit-il des vues ?","Non. Il s’agit d’une estimation qui aide à améliorer le format, l’accroche et la rétention. Aucun outil ne peut garantir la viralité."],["Puis-je gérer plusieurs clients ?","Oui, l’offre Agency prévoit plusieurs membres, des espaces clients et un suivi centralisé des validations."]].map(([question,answer],index) => <article className={openFaq === index ? "open" : ""} key={question}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{question}</span><b>{openFaq === index ? "−" : "+"}</b></button>{openFaq === index && <p>{answer}</p>}</article>)}</div></section>

      <section className="cs3-final"><div className="cs3-final-orb" /><span>PRÊT À SIMPLIFIER VOTRE PRODUCTION ?</span><h2>Votre prochaine vidéo mérite<br /><em>mieux qu’un tableur.</em></h2><p>Créez votre espace puis suivez le parcours guidé jusqu’à votre première publication.</p><button type="button" className="cs3-primary" onClick={() => launch("Scale", true)}>Créer mon espace ClipScale <b aria-hidden="true">→</b></button><small>14 jours d’essai · Aucun paiement maintenant</small></section>
      <footer className="cs3-footer"><Logo /><p>Le cockpit de croissance des agences de clipping.</p><div><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a><span>© 2026 ClipScale</span></div></footer>
    </main>
  );
}

function Status({ children }: { children: string }) {
  const slug = children.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-");
  return <span className={`cs2-status ${slug}`}>{children}</span>;
}

function AuthModal({ plan, close, authenticated }: { plan: string; close: () => void; authenticated: (userId: string) => void }) {
  const [mode, setMode] = useState<"signup" | "signin" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submit = async () => {
    setFeedback(""); setLoading(true);
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      setFeedback(error ? error.message : "Email de réinitialisation envoyé."); setLoading(false); return;
    }
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: fullName, workspace_name: workspaceName || "Mon espace ClipScale" } } });
      if (error) setFeedback(error.message);
      else if (data.session && data.user) authenticated(data.user.id);
      else setFeedback("Compte créé. Vérifiez votre boîte email pour confirmer votre adresse.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setFeedback(error.message); else if (data.user) authenticated(data.user.id);
    }
    setLoading(false);
  };
  return <div className="cs2-modal-backdrop cs4-auth-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && close()}><div className="cs4-auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="cs2-modal-close" onClick={close} aria-label="Fermer">×</button><Logo/><span>{mode === "signup" ? `ESSAI ${plan} · 14 JOURS` : mode === "signin" ? "BON RETOUR" : "ACCÈS AU COMPTE"}</span><h2 id="auth-title">{mode === "signup" ? "Créez votre cockpit." : mode === "signin" ? "Connectez-vous à ClipScale." : "Réinitialisez votre accès."}</h2><p>{mode === "signup" ? "Aucun paiement maintenant. Votre espace sécurisé est créé immédiatement." : "Retrouvez vos vidéos, publications et statistiques."}</p>{mode === "signup" && <div className="cs4-auth-row"><label>Votre nom<input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Arno Ventura" /></label><label>Nom de l’espace<input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Mon agence" /></label></div>}<label>Email professionnel<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@entreprise.com" /></label>{mode !== "reset" && <label>Mot de passe<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="8 caractères minimum" /></label>}<button className="cs2-button cs4-auth-submit" onClick={submit} disabled={loading || !email || (mode !== "reset" && password.length < 8)}>{loading ? "Un instant…" : mode === "signup" ? "Créer mon espace →" : mode === "signin" ? "Se connecter →" : "Envoyer le lien →"}</button>{feedback && <div className="cs4-auth-feedback" role="status">{feedback}</div>}<div className="cs4-auth-switch">{mode === "signup" ? <button onClick={() => setMode("signin")}>Déjà inscrit ? Se connecter</button> : <button onClick={() => setMode("signup")}>Créer un compte</button>}{mode === "signin" && <button onClick={() => setMode("reset")}>Mot de passe oublié ?</button>}</div><small>En continuant, vous acceptez les conditions et la politique de confidentialité.</small></div></div>;
}

function Onboarding({ userId, plan, done }: { userId: string; plan: string; done: () => void }) {
  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState("Mon espace ClipScale");
  const [role, setRole] = useState("Agence");
  const [teamSize, setTeamSize] = useState("1 à 3 personnes");
  const [goal, setGoal] = useState("Publier plus vite");
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    setSaving(true);
    const [profileResult, workspaceResult] = await Promise.all([
      supabase.from("profiles").update({ onboarding_step: 5, onboarding_complete: true, role_type: role, team_size: teamSize, primary_goal: goal }).eq("id", userId),
      supabase.from("workspaces").update({ name: workspace }).eq("owner_id", userId),
    ]);
    setSaving(false);
    if (!profileResult.error && !workspaceResult.error) done();
  };
  return <div className="cs4-onboarding"><header><Logo/><span>Étape {step} sur 4</span></header><div className="cs4-onboarding-progress"><i style={{width:`${step * 25}%`}}/></div><main>{step === 1 && <><span>BIENVENUE SUR CLIPSCALE</span><h1>Configurons votre espace.</h1><p>Quelques réponses suffisent pour personnaliser votre cockpit.</p><label>Nom de votre espace<input value={workspace} onChange={(e) => setWorkspace(e.target.value)} /></label></>}{step === 2 && <><span>VOTRE ACTIVITÉ</span><h1>Quel est votre profil ?</h1><p>Nous adapterons les priorités et les recommandations.</p><div className="cs4-choice-grid">{["Agence","Créateur","Freelance","Équipe marketing"].map((item) => <button className={role === item ? "active" : ""} onClick={() => setRole(item)} key={item}>{item}</button>)}</div></>}{step === 3 && <><span>VOTRE ÉQUIPE</span><h1>Combien êtes-vous ?</h1><p>Vous pourrez inviter les autres membres plus tard.</p><div className="cs4-choice-grid">{["Je travaille seul","1 à 3 personnes","4 à 10 personnes","Plus de 10"].map((item) => <button className={teamSize === item ? "active" : ""} onClick={() => setTeamSize(item)} key={item}>{item}</button>)}</div></>}{step === 4 && <><span>OBJECTIF PRINCIPAL</span><h1>Que voulez-vous améliorer ?</h1><p>Votre plan {plan} sera préparé autour de cet objectif.</p><div className="cs4-choice-grid">{["Publier plus vite","Améliorer la viralité","Gérer mes clients","Suivre les performances"].map((item) => <button className={goal === item ? "active" : ""} onClick={() => setGoal(item)} key={item}>{item}</button>)}</div></>}</main><footer>{step > 1 ? <button onClick={() => setStep(step - 1)}>← Retour</button> : <span/>}<button className="cs2-button" onClick={() => step < 4 ? setStep(step + 1) : finish()} disabled={saving || (step === 1 && !workspace.trim())}>{saving ? "Création…" : step < 4 ? "Continuer →" : "Ouvrir mon cockpit →"}</button></footer></div>;
}

function AppShell({ exit, plan, userId, signOut }: { exit: () => void; plan: string; userId: string | null; signOut: () => void }) {
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
  const [publishVideoMeta, setPublishVideoMeta] = useState<VideoMeta | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube", "facebook"]);
  const [publishCaption, setPublishCaption] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [platformCopies, setPlatformCopies] = useState<Record<string, string>>({});
  const [activeCustomize, setActiveCustomize] = useState("instagram");
  const [adaptedPlatforms, setAdaptedPlatforms] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
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
    const url = URL.createObjectURL(file);
    setPublishUrl(url);
    setPublishFileName(file.name);
    setPublishVideoMeta(null);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => setPublishVideoMeta({ name: file.name, duration: Math.round(probe.duration), width: probe.videoWidth, height: probe.videoHeight, size: file.size });
    probe.src = url;
  };
  const togglePlatform = (id: string) => setSelectedPlatforms((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    if (!next.includes(activeCustomize)) setActiveCustomize(next[0] ?? "instagram");
    return next;
  });
  const buildPlatformCopy = (id: string) => {
    const base = publishCaption.trim();
    if (id === "instagram") return `${base}\n\n#reels #video #creation`;
    if (id === "tiktok") return `${base.slice(0, 240)}\n\nVous feriez quoi à ma place ? #pourtoi #createur`;
    if (id === "youtube") return `${base}\n\nAbonnez-vous pour découvrir les prochaines vidéos.`;
    if (id === "facebook") return `${base}\n\nQu’en pensez-vous ? Dites-le-nous en commentaire.`;
    if (id === "linkedin") return `Un apprentissage à retenir :\n\n${base}\n\nEt vous, comment abordez-vous ce sujet ?`;
    if (id === "threads") return `${base.slice(0, 280)}\n\nVotre avis ?`;
    if (id === "pinterest") return `${base}\n\nEnregistrez cette vidéo pour la retrouver plus tard.`;
    if (id === "snapchat") return base.slice(0, 140);
    if (id === "telegram") return `${base}\n\nPartagez cette vidéo à une personne que cela peut aider.`;
    return `${base.slice(0, 240)}\n\nQu’en pensez-vous ?`;
  };
  const adaptCopies = () => {
    if (!publishCaption.trim() || !selectedPlatforms.length) return;
    setPlatformCopies((current) => Object.fromEntries(selectedPlatforms.map((id) => [id, current[id] || buildPlatformCopy(id)])));
    setAdaptedPlatforms([...selectedPlatforms]);
    setActiveCustomize(selectedPlatforms.includes(activeCustomize) ? activeCustomize : selectedPlatforms[0]);
    if (selectedPlatforms.includes("youtube") && !youtubeTitle.trim()) setYoutubeTitle(publishCaption.trim().split(/[.!?\n]/)[0].slice(0, 80));
    notify(`${selectedPlatforms.length} variante${selectedPlatforms.length > 1 ? "s" : ""} prête${selectedPlatforms.length > 1 ? "s" : ""}`);
  };
  const activePlatform = socialPlatforms.find((item) => item.id === activeCustomize) ?? socialPlatforms[0];
  const allCopiesReady = selectedPlatforms.length > 0 && selectedPlatforms.every((id) => adaptedPlatforms.includes(id) && platformCopies[id]?.trim());
  const publishReady = Boolean(publishUrl && publishCaption.trim() && allCopiesReady && (!selectedPlatforms.includes("youtube") || youtubeTitle.trim()) && (publishMode === "now" || scheduledAt));
  const sendSupportTicket = async () => {
    if (!userId || !supportSubject.trim() || !supportMessage.trim()) return;
    setSupportSending(true);
    const { data: membership } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
    const { error } = membership ? await supabase.from("support_tickets").insert({ workspace_id: membership.workspace_id, user_id: userId, subject: supportSubject.trim(), message: supportMessage.trim() }) : { error: new Error("Espace introuvable") };
    setSupportSending(false);
    if (error) notify("Impossible d’envoyer la demande pour le moment"); else { setShowSupport(false); setSupportSubject(""); setSupportMessage(""); notify("Demande envoyée au support"); }
  };

  return (
    <div className="cs2-app">
      <aside className="cs2-sidebar">
        <button className="cs2-brand-button" onClick={exit} aria-label="Retour au site"><Logo /></button>
        <nav aria-label="Navigation de l’application">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="cs2-demo-card"><b>Mode démo</b><p>Les données affichées sont fictives et restent dans votre navigateur.</p><button onClick={exit}>Quitter la démo</button></div>
      </aside>

      <main className="cs2-workspace">
        <header className="cs2-app-header"><div className="cs2-mobile-brand"><Logo /></div><span className="cs2-demo-pill">● MODE DÉMO</span><span className="cs2-plan-pill">✦ Plan {plan}</span><div className="cs2-header-actions"><button aria-label="Aide">?</button><div className="cs2-avatar">AV</div></div></header>
        <div className="cs2-mobile-nav">{navItems.slice(0, 5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => changeView(item.id)}><span>{item.icon}</span>{item.label === "Vue d’ensemble" ? "Accueil" : item.label}</button>)}</div>

        <section className="cs2-page">
          {view === "overview" && <>
            <div className="cs2-page-title"><div><span>MARDI 18 AOÛT</span><h1>Bonjour, Aron</h1><p>Voici ce qui demande votre attention aujourd’hui.</p></div><button className="cs2-button" onClick={() => setShowCreate(true)}>+ Nouvelle mission</button></div>
            <div className="cs2-kpis"><article><span>À valider</span><strong><AnimatedNumber value={7} /></strong><small>clips en attente</small></article><article><span>En production</span><strong><AnimatedNumber value={18} /></strong><small>clips en cours</small></article><article><span>À publier</span><strong><AnimatedNumber value={4} /></strong><small>clips approuvés</small></article><article><span>Missions actives</span><strong><AnimatedNumber value={missions.length} /></strong><small>dont 1 urgente</small></article></div>
            <section className="cs2-paid-dashboard" aria-label="Performances du compte abonné">
              <div className="cs2-paid-dashboard-head"><div><span>PERFORMANCES · 7 DERNIERS JOURS</span><h2>Vos contenus accélèrent.</h2><p>Les statistiques avancées sont accessibles avec votre abonnement {plan}.</p></div><div className="cs2-live-badge"><i /> Données synchronisées</div></div>
              <div className="cs2-growth-kpis"><article><span>Vues cumulées</span><strong><AnimatedNumber value={38200} /></strong><small>↗ 24,8% cette semaine</small></article><article><span>Taux d’engagement</span><strong><AnimatedNumber value={8.4} decimals={1} suffix="%" /></strong><small>↗ 1,2 point</small></article><article><span>Abonnés gagnés</span><strong><AnimatedNumber value={1284} prefix="+" /></strong><small>↗ 18,6% cette semaine</small></article></div>
              <div className="cs2-chart-card"><header><div><b>Évolution des vues</b><span>Instagram · TikTok · YouTube · Facebook</span></div><strong>+25%</strong></header><PerformanceChart /></div>
              <div className="cs2-channel-performance">{[["instagram",42],["tiktok",31],["youtube",18],["facebook",9]].map(([id, share]) => { const network = socialPlatforms.find((item) => item.id === id)!; return <article key={String(id)}><SocialIcon platform={network}/><div><b>{network.name}</b><span><i style={{width:`${share}%`}}/></span></div><strong>{share}%</strong></article>; })}</div>
            </section>
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
            <div className="cs2-publish-guide"><span>4 étapes guidées</span><p>Rien n’est publié sans votre confirmation. Chaque texte reste modifiable avant l’envoi.</p></div>
            <div className="cs2-publish-steps" aria-label="Étapes de publication"><span className={publishUrl ? "done" : "active"}><b>{publishUrl ? "✓" : "1"}</b> Vidéo</span><i /><span className={selectedPlatforms.length ? "done" : publishUrl ? "active" : ""}><b>{selectedPlatforms.length ? "✓" : "2"}</b> Réseaux</span><i /><span className={allCopiesReady ? "done" : publishCaption ? "active" : ""}><b>{allCopiesReady ? "✓" : "3"}</b> Variantes</span><i /><span className={publishReady ? "active" : ""}><b>4</b> Confirmation</span></div>
            <div className="cs2-publish-layout">
              <div className="cs2-publish-main">
                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>1</span><div><h2>Ajoutez votre vidéo</h2><p>Importez le fichier final. ClipScale vérifie son cadrage avant la préparation.</p></div>{publishUrl && <b>Prête</b>}</div>
                  {!publishUrl ? <label className="cs2-publish-drop"><input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectPublishVideo} /><span>↑</span><strong>Déposez votre vidéo ici</strong><small>MP4, MOV ou WebM · vertical 9:16 recommandé</small><b>Choisir une vidéo</b></label> : <div className="cs2-publish-preview"><video src={publishUrl} controls playsInline /><div><span>VIDÉO AJOUTÉE</span><strong>{publishFileName}</strong><small>{publishVideoMeta ? `${publishVideoMeta.width} × ${publishVideoMeta.height} px · ${publishVideoMeta.duration} s · ${(publishVideoMeta.size / 1048576).toFixed(1)} Mo` : "Lecture des informations…"}</small><small>{publishVideoMeta && publishVideoMeta.height <= publishVideoMeta.width ? "⚠ Format horizontal : vérifiez le recadrage avant l’envoi." : "✓ Le format vertical convient à Reels, TikTok et Shorts."}</small><label>Remplacer la vidéo<input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={selectPublishVideo} /></label></div></div>}
                </section>

                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>2</span><div><h2>Choisissez les réseaux</h2><p>Cochez les destinations voulues. Chaque carte indique le format recommandé.</p></div><button onClick={() => { const next = selectedPlatforms.length === socialPlatforms.length ? [] : socialPlatforms.map((item) => item.id); setSelectedPlatforms(next); setActiveCustomize(next[0] ?? "instagram"); }}>{selectedPlatforms.length === socialPlatforms.length ? "Tout retirer" : "Tout sélectionner"}</button></div>
                  <div className="cs2-selection-count"><b>{selectedPlatforms.length}</b> destination{selectedPlatforms.length > 1 ? "s" : ""} sélectionnée{selectedPlatforms.length > 1 ? "s" : ""}</div>
                  <div className="cs2-platform-grid">{socialPlatforms.map((item) => { const checked = selectedPlatforms.includes(item.id); return <button type="button" key={item.id} className={checked ? "selected" : ""} aria-pressed={checked} aria-label={`${checked ? "Retirer" : "Ajouter"} ${item.name}`} onClick={() => togglePlatform(item.id)}><SocialIcon platform={item} /><span><b>{item.name}</b><small>{item.format} · {item.ratio}</small></span><i>{checked ? "✓" : "+"}</i></button>; })}</div>
                </section>

                <section className="cs2-panel cs2-publish-section">
                  <div className="cs2-publish-section-head"><span>3</span><div><h2>Adaptez le message</h2><p>Écrivez l’idée principale une seule fois, puis générez une variante pour chaque réseau.</p></div>{allCopiesReady && <b>Variantes prêtes</b>}</div>
                  <label className="cs2-publish-field">Message de départ<textarea value={publishCaption} onChange={(event) => { setPublishCaption(event.target.value); setAdaptedPlatforms([]); }} maxLength={2200} placeholder="Ex. Cette erreur coûte des heures aux créateurs. Voici comment l’éviter…" /><small>{publishCaption.length}/2200</small></label>
                  <div className="cs2-adapt-toolbar"><div><b>Une base, plusieurs tons</b><small>ClipScale ajuste la longueur, le style et l’appel à l’action.</small></div><button type="button" className="cs2-adapt-button" disabled={!publishCaption.trim() || !selectedPlatforms.length} onClick={adaptCopies}>✦ Générer {selectedPlatforms.length || "les"} variante{selectedPlatforms.length > 1 ? "s" : ""}</button></div>
                  {adaptedPlatforms.length > 0 ? <div className="cs2-customize-shell">
                    <div className="cs2-platform-tabs" role="tablist" aria-label="Variantes par réseau">{socialPlatforms.filter((item) => selectedPlatforms.includes(item.id)).map((item) => <button key={item.id} role="tab" aria-selected={activeCustomize === item.id} className={activeCustomize === item.id ? "active" : ""} onClick={() => setActiveCustomize(item.id)}><SocialIcon platform={item} /><span>{item.name}</span><i>✓</i></button>)}</div>
                    <div className="cs2-platform-editor" role="tabpanel">
                      <header><SocialIcon platform={activePlatform} /><div><h3>Version {activePlatform.name}</h3><p>{activePlatform.format} · format conseillé {activePlatform.ratio}</p></div><span>ADAPTÉE</span></header>
                      {activePlatform.id === "youtube" && <label className="cs2-publish-field">Titre YouTube <em>Obligatoire</em><input value={youtubeTitle} onChange={(event) => setYoutubeTitle(event.target.value)} maxLength={100} placeholder="Ex. 3 erreurs qui bloquent votre croissance" /><small>{youtubeTitle.length}/100</small></label>}
                      <label className="cs2-publish-field">Texte pour {activePlatform.name}<textarea value={platformCopies[activePlatform.id] ?? ""} onChange={(event) => { setPlatformCopies((current) => ({ ...current, [activePlatform.id]: event.target.value })); setAdaptedPlatforms((current) => current.includes(activePlatform.id) ? current : [...current, activePlatform.id]); }} maxLength={2200} /><small className={(platformCopies[activePlatform.id]?.length ?? 0) > activePlatform.recommendedLength ? "warning" : ""}>{platformCopies[activePlatform.id]?.length ?? 0} / {activePlatform.recommendedLength} conseillés</small></label>
                      <div className="cs2-platform-requirements"><span><b>{activePlatform.ratio}</b><small>Cadrage</small></span><span><b>CC</b><small>Sous-titres</small></span><span><b>◎</b><small>Zone sûre</small></span></div>
                      <ul>{activePlatform.tips.map((tip) => <li key={tip}>✓ {tip}</li>)}</ul>
                    </div>
                  </div> : <div className="cs2-adapt-empty"><span>✦</span><div><b>Vos variantes apparaîtront ici</b><p>Vous pourrez relire et modifier chaque version avant de continuer.</p></div></div>}
                  <div className="cs2-format-tip"><span>◎</span><p><b>À vérifier dans la vidéo</b> Gardez le texte important au centre, ajoutez des sous-titres et évitez les filigranes d’une autre plateforme.</p></div>
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
                <div className="cs2-summary-networks">{selectedPlatforms.length ? socialPlatforms.filter((item) => selectedPlatforms.includes(item.id)).map((item) => <SocialIcon platform={item} key={item.id} />) : <small>Sélectionnez au moins un réseau.</small>}</div>
                <div className="cs2-summary-row"><span>Variantes</span><strong>{adaptedPlatforms.filter((id) => selectedPlatforms.includes(id)).length} / {selectedPlatforms.length || 0} prêtes</strong></div>
                <div className="cs2-summary-row"><span>Envoi</span><strong>{publishMode === "now" ? "Maintenant" : scheduledAt ? new Date(scheduledAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "À définir"}</strong></div>
                <button className="cs2-button cs2-publish-button" disabled={!publishReady} onClick={() => setShowConnect(true)}>{publishMode === "now" ? `Préparer ${selectedPlatforms.length} publication${selectedPlatforms.length > 1 ? "s" : ""}` : `Programmer sur ${selectedPlatforms.length} réseau${selectedPlatforms.length > 1 ? "x" : ""}`} →</button>
                {!publishReady && <p className="cs2-summary-help">Ajoutez la vidéo, choisissez les réseaux, puis générez et relisez les variantes.</p>}
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
            <div className="cs2-subscription-card"><div><span>{userId ? "ESSAI ACTIF · 14 JOURS" : "ABONNEMENT · DÉMONSTRATION"}</span><h2>Plan {plan}</h2><p>Statistiques avancées, publication multicanale et analyse virale incluses.</p></div><div><b>{plans.find((item) => item.name === plan)?.price ?? 79}€ <small>/ mois HT</small></b><button onClick={exit}>Comparer les offres</button></div></div>
            <div className="cs2-panel cs2-settings"><h2>Informations de l’agence</h2><label>Nom de l’espace<input defaultValue="ClipScale Studio" /></label><label>Email de contact<input type="email" defaultValue="bonjour@clipscale.app" /></label><label>Fuseau horaire<select defaultValue="Europe/Paris"><option>Europe/Paris</option><option>America/New_York</option></select></label><button className="cs2-button" onClick={() => notify("Réglages enregistrés dans la démo")}>Enregistrer</button></div>
            {userId && <button className="cs4-signout" onClick={signOut}>Se déconnecter</button>}
          </>}
        </section>
      </main>

      {showCreate && <div className="cs2-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowCreate(false)}><div className="cs2-modal" role="dialog" aria-modal="true" aria-labelledby="new-mission-title"><button className="cs2-modal-close" onClick={() => setShowCreate(false)} aria-label="Fermer">×</button><span>NOUVELLE MISSION</span><h2 id="new-mission-title">Que faut-il produire ?</h2><p>Créez la structure de la mission. Vous pourrez compléter le brief ensuite.</p><label>Nom de la mission<input autoFocus placeholder="Ex. Podcast Fondateurs #13" /></label><div className="cs2-form-row"><label>Client<input placeholder="Nom du client" /></label><label>Nombre de clips<input type="number" min="1" defaultValue="6" /></label></div><label>Échéance<input type="date" /></label><div className="cs2-modal-actions"><button onClick={() => setShowCreate(false)}>Annuler</button><button className="cs2-button" onClick={addMission}>Créer la mission</button></div></div></div>}
      {showConnect && <div className="cs2-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowConnect(false)}><div className="cs2-modal cs2-connect-modal" role="dialog" aria-modal="true" aria-labelledby="connect-title"><button className="cs2-modal-close" onClick={() => setShowConnect(false)} aria-label="Fermer">×</button><span>DERNIÈRE ÉTAPE</span><h2 id="connect-title">Connectez vos comptes</h2><p>La publication est prête. Pour envoyer réellement la vidéo, autorisez chaque réseau avec sa fenêtre officielle.</p><div className="cs2-connect-list">{socialPlatforms.filter((item) => selectedPlatforms.includes(item.id)).map((item) => <div key={item.id}><SocialIcon platform={item} /><b>{item.name}</b><small>À connecter</small></div>)}</div><div className="cs2-connect-security"><span>✓</span><p><b>Connexion OAuth sécurisée</b><br />Vos identifiants restent chez Instagram, TikTok, Google, Meta et les autres plateformes.</p></div><div className="cs2-modal-actions"><button onClick={() => setShowConnect(false)}>Revenir au brouillon</button><button className="cs2-button" onClick={() => notify("Intégration des comptes prête à être configurée")}>Configurer les connexions</button></div></div></div>}
      <button className="cs4-support-fab" onClick={() => setShowSupport(true)} aria-label="Ouvrir le support"><span>?</span><b>Support</b></button>
      {showSupport && <div className="cs2-modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setShowSupport(false)}><div className="cs2-modal cs4-support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title"><button className="cs2-modal-close" onClick={() => setShowSupport(false)} aria-label="Fermer">×</button><span>SUPPORT CLIPSCALE</span><h2 id="support-title">Comment peut-on vous aider ?</h2><p>{userId ? "Votre demande sera enregistrée dans votre espace." : "Connectez-vous pour envoyer une demande suivie à notre équipe."}</p><label>Sujet<input value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Ex. Connexion Instagram" /></label><label>Votre message<textarea value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Décrivez précisément votre question…" /></label><div className="cs4-support-options"><button onClick={() => notify("Centre d’aide bientôt disponible")}>⌕ Centre d’aide</button><button onClick={() => notify("Email : support@clipscale.app")}>✉ Nous écrire</button></div><button className="cs2-button" disabled={!userId || supportSending || !supportSubject.trim() || !supportMessage.trim()} onClick={sendSupportTicket}>{supportSending ? "Envoi…" : userId ? "Envoyer la demande →" : "Connectez-vous pour envoyer"}</button></div></div>}
      {toast && <div className="cs2-toast" role="status">✓ {toast}</div>}
    </div>
  );
}

export default function Home() {
  const [inApp, setInApp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Scale");
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const openAuthenticatedApp = async (id: string) => {
    setUserId(id); setShowAuth(false);
    const { data } = await supabase.from("profiles").select("onboarding_complete").eq("id", id).maybeSingle();
    if (data?.onboarding_complete) setInApp(true); else setShowOnboarding(true);
  };
  const launch = async (plan = "Scale", requireAccount = false) => {
    setSelectedPlan(plan);
    if (!requireAccount) { setInApp(true); return; }
    if (userId) await openAuthenticatedApp(userId); else setShowAuth(true);
  };
  const signOut = async () => { await supabase.auth.signOut(); setUserId(null); setInApp(false); };
  return <>{showOnboarding && userId ? <Onboarding userId={userId} plan={selectedPlan} done={() => { setShowOnboarding(false); setInApp(true); }} /> : inApp ? <AppShell exit={() => setInApp(false)} plan={selectedPlan} userId={userId} signOut={signOut} /> : <Landing launch={launch} />}{showAuth && <AuthModal plan={selectedPlan} close={() => setShowAuth(false)} authenticated={openAuthenticatedApp} />}</>;
}
