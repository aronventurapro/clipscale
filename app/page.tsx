"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import {
  SiBluesky,
  SiFacebook,
  SiInstagram,
  SiLinkedin,
  SiPinterest,
  SiSnapchat,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiYoutube,
} from "react-icons/si";
import { supabase } from "../lib/supabase";
import { uploadVideoResumable } from "../lib/resumable-upload";
import "./clipscale-v2.css";
import "./clipscale-v13.css";
import "./clipscale-premium.css";

type View =
  | "overview"
  | "missions"
  | "clips"
  | "virality"
  | "scripts"
  | "publish"
  | "team"
  | "messages"
  | "billing"
  | "admin"
  | "settings";
type MissionStatus = "En production" | "À valider" | "Planifiée" | "Terminée";
type VideoMeta = {
  name: string;
  duration: number;
  width: number;
  height: number;
  size: number;
};
type ViralAnalysis = {
  score: number;
  verdict: string;
  summary: string;
  factors: { label: string; score: number; detail: string }[];
  improvements: string[];
  strengths: string[];
  retention: number;
  confidence: number;
  run: number;
};
type BillingSubscription = {
  plan: "starter" | "pro" | "agency";
  status: "active" | "trialing" | "past_due" | "inactive";
  monthly_minutes: number;
  monthly_rendered_minutes: number;
  member_limit: number;
  cancel_at_period_end: boolean;
};
type ClipItem = {
  id: string;
  videoId: string;
  title: string;
  mission: string;
  format: string;
  status: "Montage" | "À valider" | "Approuvé" | "Publié";
  score: number;
  retention: number;
  tone: string;
  start: number;
  end: number;
  version?: number;
  framingX?: number;
  framingY?: number;
  style?: string;
  aspectRatio?: string;
  zoomEnabled?: boolean;
  silenceRemoval?: boolean;
  captionStyle?: Record<string, unknown>;
};
type ClipDraft = {
  title: string;
  start: number;
  end: number;
  framingX: number;
  framingY: number;
  style: string;
  aspectRatio: string;
  zoomEnabled: boolean;
  silenceRemoval: boolean;
  captionColor: string;
  activeColor: string;
  fontSize: number;
};
type AccessGrant = {
  id: string;
  email: string;
  active: boolean;
  access_level: "starter" | "scale" | "agency";
  note: string | null;
  created_at: string;
};
type SocialPlatform = {
  id: string;
  name: string;
  short: string;
  tone: string;
  format: string;
  ratio: string;
  recommendedLength: number;
  tips: string[];
};
type AccountRole = "Agence" | "Créateur" | "Clippeur";

const OWNER_EMAIL = "aron.venturapro@gmail.com";

const socialPlatforms: SocialPlatform[] = [
  {
    id: "instagram",
    name: "Instagram",
    short: "IG",
    tone: "instagram",
    format: "Reel vertical",
    ratio: "9:16",
    recommendedLength: 500,
    tips: [
      "Accroche visible dès la première image",
      "3 à 5 hashtags vraiment pertinents",
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    short: "TT",
    tone: "tiktok",
    format: "Vidéo verticale",
    ratio: "9:16",
    recommendedLength: 300,
    tips: ["Ton direct et naturel", "Terminez par une question simple"],
  },
  {
    id: "youtube",
    name: "YouTube",
    short: "YT",
    tone: "youtube",
    format: "Short ou vidéo",
    ratio: "9:16",
    recommendedLength: 500,
    tips: [
      "Titre clair avec le bénéfice principal",
      "Ajoutez une invitation à s’abonner",
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "FB",
    tone: "facebook",
    format: "Reel ou vidéo",
    ratio: "9:16",
    recommendedLength: 500,
    tips: [
      "Donnez du contexte en une phrase",
      "Favorisez une question ouverte",
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "in",
    tone: "linkedin",
    format: "Vidéo native",
    ratio: "4:5",
    recommendedLength: 600,
    tips: [
      "Reliez la vidéo à un apprentissage métier",
      "Aérez le texte en paragraphes courts",
    ],
  },
  {
    id: "threads",
    name: "Threads",
    short: "@",
    tone: "threads",
    format: "Post vidéo",
    ratio: "9:16",
    recommendedLength: 350,
    tips: ["Écrivez comme une conversation", "Gardez une seule idée forte"],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    short: "P",
    tone: "pinterest",
    format: "Épingle vidéo",
    ratio: "2:3",
    recommendedLength: 400,
    tips: ["Promesse utile et recherchable", "Ajoutez des mots-clés précis"],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    short: "SC",
    tone: "snapchat",
    format: "Spotlight",
    ratio: "9:16",
    recommendedLength: 150,
    tips: ["Message très court", "Le visuel doit se comprendre sans contexte"],
  },
  {
    id: "telegram",
    name: "Telegram",
    short: "TG",
    tone: "telegram",
    format: "Canal ou groupe",
    ratio: "9:16",
    recommendedLength: 700,
    tips: ["Ajoutez le contexte utile", "Terminez par un lien ou une action"],
  },
  {
    id: "bluesky",
    name: "Bluesky",
    short: "BS",
    tone: "bluesky",
    format: "Post vidéo",
    ratio: "9:16",
    recommendedLength: 280,
    tips: ["Soyez concis", "Placez l’idée principale au début"],
  },
];

const platformIcons = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  facebook: SiFacebook,
  linkedin: SiLinkedin,
  threads: SiThreads,
  pinterest: SiPinterest,
  snapchat: SiSnapchat,
  telegram: SiTelegram,
  bluesky: SiBluesky,
};

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const Icon = platformIcons[platform.id as keyof typeof platformIcons];
  return (
    <span className={`cs2-social-icon ${platform.tone}`} aria-hidden="true">
      <Icon />
    </span>
  );
}

type MissionItem = {
  id: string;
  client: string;
  title: string;
  clips: string;
  due: string;
  status: MissionStatus;
  tone: string;
};

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "⌂" },
  { id: "missions", label: "Missions", icon: "▣" },
  { id: "clips", label: "Clips", icon: "▶" },
  { id: "virality", label: "Viralité", icon: "↗" },
  { id: "scripts", label: "Studio scripts", icon: "✦" },
  { id: "publish", label: "Publier", icon: "↑" },
  { id: "team", label: "Équipe", icon: "◎" },
  { id: "messages", label: "Messagerie", icon: "◇" },
  { id: "billing", label: "Paiements", icon: "€" },
  { id: "admin", label: "Administration", icon: "▦" },
  { id: "settings", label: "Réglages", icon: "⚙" },
];

function Logo() {
  return (
    <span className="cs2-logo">
      <Image
        unoptimized
        src="/clipscale-mark.webp"
        width={44}
        height={33}
        alt=""
        aria-hidden="true"
        priority
      />
      <strong>
        <b>CLIP</b>SCALE
      </strong>
    </span>
  );
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1200,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
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
  return (
    <span
      ref={ref}
      className="cs5-count"
      aria-label={`${prefix}${value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}
    >
      {prefix}
      {display.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

const motionSteps = [
  {
    number: "01",
    label: "Importez",
    detail: "Votre clip arrive dans un espace unique.",
  },
  {
    number: "02",
    label: "Analysez",
    detail: "Le score viral révèle les priorités.",
  },
  {
    number: "03",
    label: "Adaptez",
    detail: "Chaque réseau reçoit sa bonne variante.",
  },
  {
    number: "04",
    label: "Publiez",
    detail: "Votre campagne part depuis un cockpit.",
  },
];

const creatorResults = [
  {
    name: "Yomi Denzel",
    image: "/creator-results/yomi-denzel.webp",
    position: "center 36%",
    views: 4_500_000,
    compactValue: 4.5,
    compactSuffix: " M",
    share: 100,
    accent: "#a991ff",
  },
  {
    name: "Maouno",
    image: "/creator-results/maouno.webp",
    position: "center 59%",
    views: 2_500_000,
    compactValue: 2.5,
    compactSuffix: " M",
    share: 56,
    accent: "#7d9cff",
  },
  {
    name: "Keo",
    image: "/creator-results/keo.webp",
    position: "center 28%",
    views: 1_200_000,
    compactValue: 1.2,
    compactSuffix: " M",
    share: 27,
    accent: "#64d7b2",
  },
  {
    name: "Blyaat",
    image: "/creator-results/blyaat.webp",
    position: "center 31%",
    views: 79_000,
    compactValue: 79,
    compactSuffix: " k",
    share: 8,
    accent: "#f0a66a",
  },
];

const additionalCreators = [
  { image: "/creator-results/collaboration-1.webp", position: "center 28%" },
  { image: "/creator-results/collaboration-2.webp", position: "center 22%" },
  { image: "/creator-results/collaboration-3.webp", position: "center 35%" },
];

function Landing({
  launch,
  theme,
  toggleTheme,
}: {
  launch: (plan?: string, mode?: "signup" | "signin") => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const [spotlight, setSpotlight] = useState<
    "analyse" | "publication" | "pilotage"
  >("analyse");
  const [activeCreator, setActiveCreator] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const spotlightTabs = ["analyse", "publication", "pilotage"] as const;
  const navigateSpotlight = (
    event: KeyboardEvent<HTMLButtonElement>,
    current: (typeof spotlightTabs)[number],
  ) => {
    const currentIndex = spotlightTabs.indexOf(current);
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % spotlightTabs.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + spotlightTabs.length) % spotlightTabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? spotlightTabs.length - 1
              : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = spotlightTabs[nextIndex];
    setSpotlight(next);
    window.requestAnimationFrame(() =>
      document.getElementById(`tab-${next}`)?.focus(),
    );
  };
  return (
    <main className="cs3-landing">
      <a className="cs3-skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <div className="cs3-noise" aria-hidden="true" />
      <header className="cs3-header">
        <a href="#top" aria-label="Accueil ClipScale">
          <Logo />
        </a>
        <nav aria-label="Navigation principale">
          <a href="/missions">Missions</a>
          <a href="/clippeurs">Clippeurs</a>
          <a href="/comment-ca-marche">Fonctionnement</a>
          <a href="/tarifs">Tarifs</a>
          <a href="/cas-clients">Cas clients</a>
        </nav>
        <div className="cs-theme-actions">
          <button
            type="button"
            className="cs-theme-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Activer le mode clair"
                : "Activer le mode sombre"
            }
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          <button
            type="button"
            className="cs3-nav-cta"
            onClick={() => launch("Scale", "signin")}
          >
            Se connecter <span aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <section className="cs3-hero" id="main-content">
        <div className="cs3-orb cs3-orb-one" aria-hidden="true" />
        <div className="cs3-orb cs3-orb-two" aria-hidden="true" />
        <div className="cs3-hero-copy">
          <div className="cs3-kicker">
            <span>
              <i /> CLIPSCALE
            </span>{" "}
            L’agence qui construit votre équipe de clipping{" "}
            <b aria-hidden="true">→</b>
          </div>
          <h1>
            Trouvez. Produisez.
            <br />
            <em>Mesurez.</em>
          </h1>
          <p>
            Confiez votre besoin à ClipScale. Nous sélectionnons les bons
            clippeurs, pilotons la production et vous gardez une vision claire
            des résultats.
          </p>
          <div className="cs16-single-cta">
            <button
              type="button"
              className="cs3-primary"
              onClick={() => launch("Scale", "signup")}
            >
              Créer mon espace ClipScale <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="cs16-signin-link"
              onClick={() => launch("Scale", "signin")}
            >
              Déjà inscrit ? <b>Se connecter</b>
            </button>
          </div>
          <div className="cs3-reassurance">
            <span>✓ Un interlocuteur ClipScale</span>
            <span>✓ Clippeurs sélectionnés</span>
            <span>✓ Production suivie de bout en bout</span>
          </div>
        </div>

        <div
          className="cs3-hero-visual"
          role="img"
          aria-label="Aperçu animé d’un clip analysé avec un score viral de 87 sur 100 et quatre réseaux sélectionnés"
        >
          <div className="cs3-visual-glow" />
          <div className="cs3-float-card cs3-float-score">
            <small>SCORE VIRAL</small>
            <strong>
              <AnimatedNumber value={87} duration={1450} />
              <span>/100</span>
            </strong>
            <i>
              <b />
            </i>
            <em>Fort potentiel ↗</em>
          </div>
          <div className="cs3-float-card cs3-float-publish">
            <span>✓</span>
            <div>
              <strong>Publication prête</strong>
              <small>4 réseaux sélectionnés</small>
            </div>
          </div>
          <div className="cs3-phone">
            <div className="cs3-phone-top">
              <i />
              <span>APERÇU DU CLIP</span>
              <b>•••</b>
            </div>
            <div className="cs3-video-art">
              <div className="cs3-video-grid" />
              <span className="cs3-play">▶</span>
              <div className="cs3-caption">
                <small>LE DÉCLIC QUI</small>
                <strong>CHANGE TOUT.</strong>
              </div>
              <em>00:24</em>
            </div>
            <div className="cs3-phone-bottom">
              <span>
                <b>9:16</b>
                <small>Format</small>
              </span>
              <span>
                <b>24 s</b>
                <small>Durée</small>
              </span>
              <span>
                <b>1080p</b>
                <small>Qualité</small>
              </span>
            </div>
          </div>
          <div className="cs3-network-stack">
            {socialPlatforms.slice(0, 5).map((item, index) => (
              <span key={item.id} style={{ "--stack": index } as CSSProperties}>
                <SocialIcon platform={item} />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="cs3-marquee cs14-marquee"
        aria-label="Réseaux proposés dans le parcours de publication"
      >
        <p className="cs3-sr-only">
          Instagram, TikTok, YouTube, Facebook, LinkedIn, Threads, Pinterest,
          Snapchat, Telegram et Bluesky.
        </p>
        <div className="cs14-marquee-track" aria-hidden="true">
          {[0, 1].map((group) => (
            <div className="cs14-marquee-group" key={group}>
              {socialPlatforms.map((item, index) => (
                <span key={`${group}-${item.id}-${index}`}>
                  <SocialIcon platform={item} />
                  <b>{item.name}</b>
                  <small>CLIP READY</small>
                  <em>✦</em>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="cs3-value" id="product">
        <div className="cs3-section-tag">LE CHAOS S’ARRÊTE ICI</div>
        <div className="cs3-value-head">
          <h2>
            Votre contenu avance.
            <br />
            ClipScale garde le cap.
          </h2>
          <p>
            Fini les prestataires éparpillés, les validations perdues et les
            délais flous. ClipScale constitue l’équipe et pilote toute la chaîne
            de production.
          </p>
        </div>
        <div className="cs3-value-grid">
          <article>
            <strong>01</strong>
            <span>Une source de vérité</span>
            <p>Missions, clips, retours et statuts réunis au même endroit.</p>
          </article>
          <article>
            <strong>02</strong>
            <span>Des décisions plus rapides</span>
            <p>
              Un score lisible et des améliorations concrètes avant de publier.
            </p>
          </article>
          <article>
            <strong>03</strong>
            <span>Une diffusion sans répétition</span>
            <p>Une vidéo, une légende, tous les réseaux que vous choisissez.</p>
          </article>
        </div>
      </section>

      <section className="cs3-spotlight" id="features">
        <div className="cs3-spotlight-copy">
          <div className="cs3-section-tag">LE PRODUIT EN ACTION</div>
          <h2>
            Trois fonctions clés.
            <br />
            <em>Un seul espace.</em>
          </h2>
          <p>
            Chaque vue répond à une tâche précise : améliorer, diffuser ou
            piloter.
          </p>
          <div
            className="cs3-tabs"
            role="tablist"
            aria-label="Démonstrations du produit"
          >
            {spotlightTabs.map((tab, index) => (
              <button
                type="button"
                id={`tab-${tab}`}
                key={tab}
                role="tab"
                aria-controls={`panel-${tab}`}
                aria-selected={spotlight === tab}
                tabIndex={spotlight === tab ? 0 : -1}
                className={spotlight === tab ? "active" : ""}
                onClick={() => setSpotlight(tab)}
                onKeyDown={(event) => navigateSpotlight(event, tab)}
              >
                <b>0{index + 1}</b>
                <span>
                  {tab === "analyse"
                    ? "Analyse virale"
                    : tab === "publication"
                      ? "Publication multicanale"
                      : "Pilotage d’agence"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="cs3-feature-screen" aria-live="polite">
          {spotlight === "analyse" && (
            <div
              id="panel-analyse"
              role="tabpanel"
              aria-labelledby="tab-analyse"
              className="cs3-screen-inner cs3-analysis-demo"
            >
              <header>
                <span>✦ ANALYSE AUTOMATIQUE</span>
                <b>Diagnostic terminé</b>
              </header>
              <div className="cs3-demo-score">
                <div>
                  <strong>
                    <AnimatedNumber value={87} duration={1100} />
                  </strong>
                  <small>/100</small>
                </div>
                <span>
                  <b>Fort potentiel</b>
                  <p>Le format et la durée favorisent la rétention.</p>
                </span>
              </div>
              {[
                ["Accroche", 92],
                ["Durée", 88],
                ["Format", 96],
                ["Qualité", 82],
              ].map(([label, score]) => (
                <div className="cs3-demo-factor" key={label}>
                  <span>{label}</span>
                  <i>
                    <b style={{ width: `${score}%` }} />
                  </i>
                  <strong>
                    <AnimatedNumber
                      value={Number(score)}
                      suffix="%"
                      duration={900}
                    />
                  </strong>
                </div>
              ))}
              <aside>
                <b>↗ Priorité n°1</b>
                <p>Affichez votre accroche dès la première image.</p>
              </aside>
            </div>
          )}
          {spotlight === "publication" && (
            <div
              id="panel-publication"
              role="tabpanel"
              aria-labelledby="tab-publication"
              className="cs3-screen-inner cs3-publish-demo"
            >
              <header>
                <span>↑ PUBLICATION MULTICANALE</span>
                <b>4 destinations</b>
              </header>
              <div className="cs3-upload-demo">
                <span>▶</span>
                <div>
                  <b>clip-final-v3.mp4</b>
                  <small>9:16 · 24 secondes · Prêt</small>
                </div>
                <em>✓</em>
              </div>
              <h3>Choisissez vos réseaux</h3>
              <div className="cs3-demo-networks">
                {socialPlatforms.slice(0, 8).map((item, index) => (
                  <span key={item.id} className={index < 4 ? "active" : ""}>
                    <SocialIcon platform={item} />
                    <b>{item.name}</b>
                    <em>{index < 4 ? "✓" : "+"}</em>
                  </span>
                ))}
              </div>
              <div className="cs3-demo-cta">Préparer 4 publications →</div>
            </div>
          )}
          {spotlight === "pilotage" && (
            <div
              id="panel-pilotage"
              role="tabpanel"
              aria-labelledby="tab-pilotage"
              className="cs3-screen-inner cs3-pilot-demo"
            >
              <header>
                <span>⌂ VUE D’ENSEMBLE</span>
                <b>En direct</b>
              </header>
              <div className="cs3-demo-kpis">
                <span>
                  <small>À VALIDER</small>
                  <strong>
                    <AnimatedNumber value={7} />
                  </strong>
                  <em>clips</em>
                </span>
                <span>
                  <small>EN PRODUCTION</small>
                  <strong>
                    <AnimatedNumber value={18} />
                  </strong>
                  <em>clips</em>
                </span>
                <span>
                  <small>À PUBLIER</small>
                  <strong>
                    <AnimatedNumber value={4} />
                  </strong>
                  <em>clips</em>
                </span>
              </div>
              <h3>Priorités du jour</h3>
              {[
                "Valider 7 clips pour Nova Studio",
                "Compléter le brief Maison Lune",
                "Programmer 4 publications",
              ].map((item, index) => (
                <div className="cs3-demo-task" key={item}>
                  <i>{index + 1}</i>
                  <span>
                    <b>{item}</b>
                    <small>
                      {index === 0
                        ? "Urgent · aujourd’hui"
                        : index === 1
                          ? "Brief incomplet"
                          : "Instagram · TikTok · YouTube · Facebook"}
                    </small>
                  </span>
                  <em>→</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="cs3-workflow" id="workflow">
        <div className="cs3-section-tag">UN WORKFLOW DE BOUT EN BOUT</div>
        <h2>
          Du brief à la livraison.
          <br />
          <em>Un seul interlocuteur.</em>
        </h2>
        <div className="cs3-flow-line">
          <i />
        </div>
        <div className="cs13-flow-grid">
          <article>
            <span>01</span>
            <b>Brief client</b>
            <p>
              Vous précisez l’objectif, les références, le volume et le budget.
            </p>
          </article>
          <article>
            <span>02</span>
            <b>Cadrage</b>
            <p>ClipScale transforme votre besoin en mission exploitable.</p>
          </article>
          <article>
            <span>03</span>
            <b>Matching</b>
            <p>Nous sélectionnons les clippeurs les plus adaptés.</p>
          </article>
          <article>
            <span>04</span>
            <b>Production</b>
            <p>ClipScale suit les versions, les retours et les délais.</p>
          </article>
          <article>
            <span>05</span>
            <b>Validation</b>
            <p>Vous approuvez les livrables depuis votre espace client.</p>
          </article>
        </div>
      </section>

      <section className="cs3-bento" id="missions">
        <article className="cs3-bento-large">
          <span>POUR LES CLIENTS</span>
          <h2>
            Plus de contenu.
            <br />
            Moins de coordination.
          </h2>
          <p>
            Vous suivez l’avancement. ClipScale coordonne les talents, le
            contrôle qualité et les échéances.
          </p>
          <div>
            <b>
              <strong>
                <AnimatedNumber value={1} />
              </strong>
              <small>interlocuteur</small>
            </b>
            <b>
              <strong>
                <AnimatedNumber value={10} />
              </strong>
              <small>réseaux</small>
            </b>
            <b>
              <strong>
                <AnimatedNumber value={0} />
              </strong>
              <small>tableur</small>
            </b>
          </div>
        </article>
        <article className="cs3-bento-dark" id="clippeurs">
          <span>CLIPPEURS</span>
          <div className="cs3-mini-ring">
            <AnimatedNumber value={100} />
          </div>
          <h3>Des profils réellement adaptés.</h3>
          <p>Spécialité, portfolio, disponibilité et fiabilité vérifiés.</p>
        </article>
        <article className="cs3-bento-purple">
          <span>PILOTAGE</span>
          <div className="cs3-bento-icons">
            {socialPlatforms.slice(0, 4).map((item) => (
              <SocialIcon platform={item} key={item.id} />
            ))}
          </div>
          <h3>Validez sans vous disperser.</h3>
          <p>Briefs, versions et retours restent dans un espace commun.</p>
        </article>
      </section>

      <section className="cs3-video-demo">
        <div className="cs3-video-copy">
          <div className="cs3-section-tag">
            30 SECONDES POUR TOUT COMPRENDRE
          </div>
          <h2>
            Voyez ClipScale
            <br />
            <em>prendre vie.</em>
          </h2>
          <p>
            Une démonstration motion design, de votre clip brut à une campagne
            prête pour chaque plateforme.
          </p>
          <div className="cs5-motion-steps">
            {motionSteps.map((step) => (
              <div key={step.number}>
                <b>{step.number}</b>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </span>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => launch("Scale")}>
            Ouvrir mon espace sécurisé →
          </button>
        </div>
        <div className="cs3-video-stage">
          <div className="cs3-video-halo" aria-hidden="true" />
          <div className="cs3-video-frame">
            <video
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="/clipscale-motion-poster.jpg"
              aria-label="Démonstration animée de ClipScale en 30 secondes"
            >
              <source src="/clipscale-motion-demo.mp4" type="video/mp4" />
            </video>
            <span>
              <i /> MOTION DEMO · 00:30
            </span>
            <div className="cs5-video-badge score">
              <small>SCORE VIRAL</small>
              <b>
                <AnimatedNumber value={87} />
              </b>
            </div>
            <div className="cs5-video-badge ready">
              <i>✓</i>
              <span>
                <b>10 variantes prêtes</b>
                <small>Adaptées automatiquement</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="cs3-results">
        <div className="cs3-section-tag">RÉSULTATS ATTENDUS</div>
        <h2>
          Moins d’opérations.
          <br />
          Plus de contenu publié.
        </h2>
        <div className="cs3-results-grid">
          <article>
            <strong>
              <AnimatedNumber
                value={68}
                prefix="−"
                suffix="%"
                duration={1600}
              />
            </strong>
            <p>de temps consacré à la diffusion</p>
            <small>Scénario agence · 5 clients</small>
          </article>
          <article>
            <strong>
              <AnimatedNumber value={3} prefix="×" duration={1300} />
            </strong>
            <p>plus de variantes publiées</p>
            <small>Scénario créateur · 4 réseaux</small>
          </article>
          <article>
            <strong>
              <AnimatedNumber
                value={24}
                prefix="+"
                suffix="%"
                duration={1500}
              />
            </strong>
            <p>de vues hebdomadaires</p>
            <small>Projection issue du tableau de bord démo</small>
          </article>
        </div>
        <p className="cs3-results-disclaimer">
          Ces chiffres illustrent des scénarios de démonstration. Les résultats
          réels dépendent du contenu, de l’audience et des plateformes.
        </p>
      </section>

      <section
        className="cs6-proof"
        id="cas-clients"
        aria-labelledby="creator-results-title"
      >
        <div className="cs6-proof-orb one" aria-hidden="true" />
        <div className="cs6-proof-orb two" aria-hidden="true" />
        <header className="cs6-proof-head">
          <div>
            <div className="cs3-section-tag">
              RÉFÉRENCES PUBLIQUES ANALYSÉES
            </div>
            <h2 id="creator-results-title">
              Des formats qui captent.
              <br />
              <em>Des mécaniques à comprendre.</em>
            </h2>
            <p>
              Analyse éditoriale de contenus publics pour illustrer les
              accroches, la rétention et la distribution. Ces créateurs ne sont
              pas présentés comme clients.
            </p>
          </div>
          <div className="cs6-proof-total">
            <span>VUES OBSERVÉES SUR L’ENSEMBLE</span>
            <strong>
              <AnimatedNumber value={8_279_000} suffix="+" duration={1900} />
            </strong>
            <small>sur cet échantillon public</small>
            <i>
              <b />
            </i>
          </div>
        </header>
        <div className="cs6-proof-shell">
          <div
            className="cs6-proof-focus"
            key={creatorResults[activeCreator].name}
            style={
              {
                "--creator-accent": creatorResults[activeCreator].accent,
              } as CSSProperties
            }
          >
            <span className="cs6-proof-rank">
              0{activeCreator + 1} · RÉFÉRENCE PUBLIQUE
            </span>
            <div className="cs6-proof-avatar">
              <Image
                unoptimized
                src={creatorResults[activeCreator].image}
                fill
                sizes="180px"
                alt={`Portrait de ${creatorResults[activeCreator].name}`}
                style={{
                  objectFit: "cover",
                  objectPosition: creatorResults[activeCreator].position,
                }}
              />
              <i />
            </div>
            <div className="cs6-proof-focus-copy">
              <small>FORMAT PUBLIC ÉTUDIÉ</small>
              <h3>{creatorResults[activeCreator].name}</h3>
              <p>
                Une lecture pédagogique des choix de rythme, d’accroche et de
                distribution visibles publiquement.
              </p>
            </div>
            <div className="cs6-proof-number">
              <span>VUES DE LA RÉFÉRENCE</span>
              <strong>
                <AnimatedNumber
                  value={creatorResults[activeCreator].views}
                  duration={1700}
                />
              </strong>
              <small>sur les contenus de référence</small>
            </div>
            <div className="cs6-proof-signal" aria-hidden="true">
              {[28, 46, 39, 64, 52, 82, 68, 96, 78, 100].map(
                (height, index) => (
                  <i
                    key={index}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${index * 70}ms`,
                    }}
                  />
                ),
              )}
            </div>
          </div>
          <div
            className="cs6-proof-list"
            aria-label="Choisir un résultat créateur"
          >
            {creatorResults.map((creator, index) => (
              <button
                type="button"
                aria-pressed={activeCreator === index}
                className={activeCreator === index ? "active" : ""}
                onClick={() => setActiveCreator(index)}
                key={creator.name}
                style={{ "--creator-accent": creator.accent } as CSSProperties}
              >
                <span className="cs6-proof-mini-avatar">
                  <Image
                    unoptimized
                    src={creator.image}
                    fill
                    sizes="48px"
                    alt=""
                    style={{
                      objectFit: "cover",
                      objectPosition: creator.position,
                    }}
                  />
                </span>
                <span className="cs6-proof-name">
                  <b>{creator.name}</b>
                  <small>Référence publique · non client</small>
                </span>
                <strong>
                  <AnimatedNumber
                    value={creator.compactValue}
                    decimals={creator.compactValue % 1 ? 1 : 0}
                    suffix={creator.compactSuffix}
                  />
                </strong>
                <i>
                  <b style={{ width: `${creator.share}%` }} />
                </i>
                <em>→</em>
              </button>
            ))}
          </div>
        </div>
        <div className="cs6-proof-more">
          <div>
            <span>ET BIEN D’AUTRES</span>
            <strong>
              Des références publiques aux univers différents, utilisées
              uniquement pour expliquer les formats.
            </strong>
            <small>
              Les premiers cas clients vérifiés seront ajoutés avec autorisation
              et contexte.
            </small>
          </div>
          <div
            className="cs6-proof-more-stack"
            aria-label="Autres créateurs accompagnés"
          >
            {additionalCreators.map((creator, index) => (
              <figure
                key={creator.image}
                style={{ "--portrait-index": index } as CSSProperties}
              >
                <Image
                  unoptimized
                  src={creator.image}
                  fill
                  sizes="64px"
                  alt={`Autre référence publique ${index + 1}`}
                  style={{
                    objectFit: "cover",
                    objectPosition: creator.position,
                  }}
                />
              </figure>
            ))}
          </div>
        </div>
        <p className="cs6-proof-note">
          Références publiques à visée pédagogique · Aucune affiliation ni
          relation client n’est sous-entendue.
        </p>
      </section>

      <section className="cs3-pricing" id="pricing">
        <div className="cs3-section-tag">
          UNE PROPOSITION ADAPTÉE À VOTRE BESOIN
        </div>
        <div className="cs3-pricing-head">
          <h2>
            Un périmètre clair.
            <br />
            <em>Un budget maîtrisé.</em>
          </h2>
          <p>
            Volume, plateformes, complexité et fréquence déterminent votre
            accompagnement. ClipScale vous répond avec une proposition
            détaillée.
          </p>
        </div>
        <div className="cs3-pricing-grid">
          {[
            [
              "Brief gratuit",
              "Décrivez votre objectif, vos sources et votre rythme cible.",
            ],
            [
              "Équipe sélectionnée",
              "ClipScale choisit les talents et définit le circuit de production.",
            ],
            [
              "Pilotage inclus",
              "Versions, retours, échéances et validation restent centralisés.",
            ],
          ].map(([title, text], index) => (
            <article key={title} className={index === 1 ? "popular" : ""}>
              {index === 1 && (
                <span className="cs3-popular-label">CLIPSCALE S’EN CHARGE</span>
              )}
              <header>
                <span>{title}</span>
                <p>{text}</p>
              </header>
              <ul>
                <li>
                  <i>✓</i>Un interlocuteur unique
                </li>
                <li>
                  <i>✓</i>Suivi depuis votre espace
                </li>
                <li>
                  <i>✓</i>Aucun engagement avant proposition
                </li>
              </ul>
              <button
                type="button"
                className="cs3-nav-cta"
                onClick={() => launch("Scale")}
              >
                {index === 0 ? "Déposer mon brief" : "Ouvrir mon espace"}
                <span>→</span>
              </button>
            </article>
          ))}
        </div>
        <p className="cs3-pricing-note">
          Aucun tarif fictif : le budget final est confirmé avec vous avant le
          démarrage.
        </p>
      </section>

      <section className="cs3-faq">
        <div>
          <div className="cs3-section-tag">QUESTIONS FRÉQUENTES</div>
          <h2>
            Tout ce qu’il faut savoir
            <br />
            avant de démarrer.
          </h2>
          <p>
            Une question qui manque ? Le support est disponible directement dans
            l’application.
          </p>
        </div>
        <div className="cs3-faq-list">
          {[
            [
              "ClipScale publie-t-il réellement sur mes réseaux ?",
              "La connexion officielle de chaque plateforme sera nécessaire. ClipScale prépare déjà les variantes et le calendrier ; l’envoi réel sera activé réseau par réseau après validation OAuth.",
            ],
            [
              "Mes vidéos sont-elles sécurisées ?",
              "Oui. Le stockage est privé et chaque fichier est isolé par utilisateur. Les autres clients ne peuvent pas accéder à vos vidéos.",
            ],
            [
              "Puis-je essayer sans payer ?",
              "Oui. Votre espace démarre avec 14 jours d’essai. Stripe sera connecté à la dernière étape avant l’ouverture des abonnements payants.",
            ],
            [
              "Le score viral garantit-il des vues ?",
              "Non. Il s’agit d’une estimation qui aide à améliorer le format, l’accroche et la rétention. Aucun outil ne peut garantir la viralité.",
            ],
            [
              "Puis-je gérer plusieurs clients ?",
              "Oui, l’offre Agency prévoit plusieurs membres, des espaces clients et un suivi centralisé des validations.",
            ],
          ].map(([question, answer], index) => (
            <article className={openFaq === index ? "open" : ""} key={question}>
              <button
                type="button"
                aria-expanded={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <span>{question}</span>
                <b>{openFaq === index ? "−" : "+"}</b>
              </button>
              {openFaq === index && <p>{answer}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="cs3-final">
        <div className="cs3-final-orb" />
        <span>PRÊT À SIMPLIFIER VOTRE PRODUCTION ?</span>
        <h2>
          Votre prochaine vidéo mérite
          <br />
          <em>mieux qu’un tableur.</em>
        </h2>
        <p>
          Créez votre espace puis suivez le parcours guidé jusqu’à votre
          première publication.
        </p>
        <button
          type="button"
          className="cs3-primary"
          onClick={() => launch("Scale")}
        >
          Créer mon espace ClipScale <b aria-hidden="true">→</b>
        </button>
        <small>14 jours d’essai · Aucun paiement maintenant</small>
      </section>
      <footer className="cs3-footer">
        <Logo />
        <p>
          L’agence qui sélectionne les clippeurs et pilote votre production.
        </p>
        <div>
          <a href="/conditions">CGV</a>
          <a href="/mentions-legales">Mentions légales</a>
          <a href="/confidentialite">Confidentialité</a>
          <span>© 2026 ClipScale</span>
        </div>
      </footer>
    </main>
  );
}

function Status({ children }: { children: string }) {
  const slug = children
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "-");
  return <span className={`cs2-status ${slug}`}>{children}</span>;
}

function AuthModal({
  plan,
  close,
  authenticated,
  initialMode,
}: {
  plan: string;
  close: () => void;
  authenticated: (userId: string) => void;
  initialMode: "signup" | "signin";
}) {
  const [mode, setMode] = useState<"signup" | "signin" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const submit = async () => {
    setFeedback("");
    setLoading(true);
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setFeedback(error ? error.message : "Email de réinitialisation envoyé.");
      setLoading(false);
      return;
    }
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            workspace_name: workspaceName || "Mon espace ClipScale",
          },
        },
      });
      if (error && email.trim().toLowerCase() === OWNER_EMAIL)
        setFeedback(
          "Votre compte propriétaire est déjà activé. Cliquez sur « Déjà inscrit ? Se connecter ».",
        );
      else if (error)
        setFeedback("Création impossible. Vérifiez l’adresse puis réessayez.");
      else if (data.session && data.user) authenticated(data.user.id);
      else
        setFeedback(
          "Compte créé. Vérifiez votre boîte email pour confirmer votre adresse.",
        );
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setFeedback("Email ou mot de passe incorrect.");
      else if (data.user) authenticated(data.user.id);
    }
    setLoading(false);
  };
  const signInWithGoogle = async () => {
    setFeedback("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setFeedback(
        "Connexion Google indisponible. Réessayez dans quelques instants.",
      );
      setLoading(false);
    }
  };
  return (
    <div
      className="cs2-modal-backdrop cs4-auth-backdrop"
      role="presentation"
      onMouseDown={(event) => event.currentTarget === event.target && close()}
    >
      <div
        className="cs4-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button className="cs2-modal-close" onClick={close} aria-label="Fermer">
          ×
        </button>
        <Logo />
        <span>
          {mode === "signup"
            ? `ESSAI ${plan} · 14 JOURS`
            : mode === "signin"
              ? "BON RETOUR"
              : "ACCÈS AU COMPTE"}
        </span>
        <h2 id="auth-title">
          {mode === "signup"
            ? "Créez votre cockpit."
            : mode === "signin"
              ? "Connectez-vous à ClipScale."
              : "Réinitialisez votre accès."}
        </h2>
        <p>
          {mode === "signup"
            ? "Aucun paiement maintenant. Votre espace sécurisé est créé immédiatement."
            : "Retrouvez vos vidéos, publications et statistiques."}
        </p>
        {mode !== "reset" && (
          <>
            <button
              type="button"
              className="cs4-google-auth"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <span aria-hidden="true">G</span>
              {loading ? "Connexion…" : "Continuer avec Google"}
            </button>
            <div className="cs4-auth-divider">
              <span>ou avec votre email</span>
            </div>
          </>
        )}
        {mode === "signup" && (
          <div className="cs4-auth-row">
            <label>
              Votre nom
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Arno Ventura"
              />
            </label>
            <label>
              Nom de l’espace
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Mon agence"
              />
            </label>
          </div>
        )}
        <label>
          Email professionnel
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="vous@entreprise.com"
          />
        </label>
        {mode !== "reset" && (
          <label>
            Mot de passe
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="8 caractères minimum"
            />
          </label>
        )}
        <button
          className="cs2-button cs4-auth-submit"
          onClick={submit}
          disabled={
            loading || !email || (mode !== "reset" && password.length < 8)
          }
        >
          {loading
            ? "Un instant…"
            : mode === "signup"
              ? "Créer mon espace →"
              : mode === "signin"
                ? "Se connecter →"
                : "Envoyer le lien →"}
        </button>
        {feedback && (
          <div className="cs4-auth-feedback" role="status">
            {feedback}
          </div>
        )}
        <div className="cs4-auth-switch">
          {mode === "signup" ? (
            <button onClick={() => setMode("signin")}>
              Déjà inscrit ? Se connecter
            </button>
          ) : (
            <button onClick={() => setMode("signup")}>Créer un compte</button>
          )}
          {mode === "signin" && (
            <button onClick={() => setMode("reset")}>
              Mot de passe oublié ?
            </button>
          )}
        </div>
        <small>
          En continuant, vous acceptez les conditions et la politique de
          confidentialité.
        </small>
      </div>
    </div>
  );
}

function Onboarding({
  userId,
  done,
}: {
  userId: string;
  done: (role: AccountRole) => void;
}) {
  const [step, setStep] = useState(1);
  const [workspace, setWorkspace] = useState("Mon espace ClipScale");
  const [role, setRole] = useState<AccountRole>("Agence");
  const [teamSize, setTeamSize] = useState("1 à 3 personnes");
  const [goal, setGoal] = useState("Publier plus vite");
  const [saving, setSaving] = useState(false);
  const finish = async () => {
    setSaving(true);
    const [profileResult, workspaceResult] = await Promise.all([
      supabase
        .from("profiles")
        .update({
          onboarding_step: 5,
          onboarding_complete: true,
          role_type: role,
          team_size: teamSize,
          primary_goal: goal,
        })
        .eq("id", userId),
      supabase
        .from("workspaces")
        .update({ name: workspace })
        .eq("owner_id", userId),
    ]);
    setSaving(false);
    if (!profileResult.error && !workspaceResult.error) done(role);
  };
  const roleGoals =
    role === "Clippeur"
      ? [
          "Trouver des missions",
          "Montrer mon portfolio",
          "Être payé plus vite",
          "Développer ma réputation",
        ]
      : [
          "Publier plus vite",
          "Trouver des clippeurs",
          "Gérer mes clients",
          "Suivre les performances",
        ];
  return (
    <div className="cs4-onboarding">
      <header>
        <Logo />
        <span>Étape {step} sur 4</span>
      </header>
      <div className="cs4-onboarding-progress">
        <i style={{ width: `${step * 25}%` }} />
      </div>
      <main>
        {step === 1 && (
          <>
            <span>BIENVENUE SUR CLIPSCALE</span>
            <h1>Configurons votre espace.</h1>
            <p>
              Vous êtes connecté. Nous allons maintenant préparer l’interface
              adaptée à votre activité.
            </p>
            <label>
              Nom public ou nom de votre espace
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
              />
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <span>CHOISISSEZ VOTRE PARCOURS</span>
            <h1>Quel espace souhaitez-vous utiliser ?</h1>
            <p>
              Ce choix intervient après la connexion et détermine votre tableau
              de bord.
            </p>
            <div className="cs4-choice-grid cs13-role-grid">
              {[
                ["Agence", "Je publie des missions et pilote les productions"],
                ["Créateur", "Je cherche des clippeurs pour mes contenus"],
                ["Clippeur", "Je trouve des missions et livre mes clips"],
              ].map(([item, detail]) => (
                <button
                  className={role === item ? "active" : ""}
                  onClick={() => setRole(item as AccountRole)}
                  key={item}
                >
                  <b>{item}</b>
                  <small>{detail}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <span>
              {role === "Clippeur" ? "VOTRE DISPONIBILITÉ" : "VOTRE ÉQUIPE"}
            </span>
            <h1>
              {role === "Clippeur"
                ? "Quel est votre rythme ?"
                : "Combien êtes-vous ?"}
            </h1>
            <p>Vous pourrez modifier ce choix plus tard.</p>
            <div className="cs4-choice-grid">
              {(role === "Clippeur"
                ? [
                    "Disponible maintenant",
                    "1 à 2 missions",
                    "3 à 5 missions",
                    "Planning complet",
                  ]
                : [
                    "Je travaille seul",
                    "1 à 3 personnes",
                    "4 à 10 personnes",
                    "Plus de 10",
                  ]
              ).map((item) => (
                <button
                  className={teamSize === item ? "active" : ""}
                  onClick={() => setTeamSize(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <span>OBJECTIF PRINCIPAL</span>
            <h1>Que voulez-vous obtenir en premier ?</h1>
            <p>Votre prochaine vue sera préparée autour de cet objectif.</p>
            <div className="cs4-choice-grid">
              {roleGoals.map((item) => (
                <button
                  className={goal === item ? "active" : ""}
                  onClick={() => setGoal(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
      <footer>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)}>← Retour</button>
        ) : (
          <span />
        )}
        <button
          className="cs2-button"
          onClick={() => (step < 4 ? setStep(step + 1) : finish())}
          disabled={saving || (step === 1 && !workspace.trim())}
        >
          {saving
            ? "Création…"
            : step < 4
              ? "Continuer →"
              : role === "Clippeur"
                ? "Ouvrir mon espace clippeur →"
                : "Ouvrir mon cockpit →"}
        </button>
      </footer>
    </div>
  );
}

function ClipperWorkspace({
  userName,
  signOut,
  changeRole,
}: {
  userName: string;
  signOut: () => void;
  changeRole: () => void;
}) {
  return (
    <main className="cs15-clipper-portal">
      <header>
        <Logo />
        <div>
          <span className="cs15-session-dot" />
          Session sécurisée
        </div>
        <button onClick={signOut}>Se déconnecter</button>
      </header>
      <section className="cs15-clipper-shell">
        <aside>
          <div className="cs15-avatar">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <h2>{userName}</h2>
          <p>Profil clippeur</p>
          <nav>
            <button className="active">⌂ Tableau de bord</button>
            <button>◎ Missions</button>
            <button>◇ Candidatures</button>
            <button>▶ Portfolio</button>
            <button>€ Paiements</button>
            <button>⚙ Réglages</button>
          </nav>
          <button className="cs15-switch" onClick={changeRole}>
            Changer de type d’espace
          </button>
        </aside>
        <div className="cs15-clipper-main">
          <div className="cs15-welcome">
            <div>
              <span>ESPACE CLIPPEUR</span>
              <h1>Bonjour {userName.split(" ")[0]}.</h1>
              <p>
                Votre activité réelle apparaîtra ici dès votre première
                candidature.
              </p>
            </div>
            <button>Compléter mon profil →</button>
          </div>
          <div className="cs15-stats">
            {[
              ["Revenus disponibles", "0 €"],
              ["Candidatures", "0"],
              ["Missions actives", "0"],
              ["Livraisons à venir", "0"],
            ].map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>Aucune donnée fictive</small>
              </article>
            ))}
          </div>
          <div className="cs15-clipper-grid">
            <article>
              <header>
                <div>
                  <span>MISSIONS RECOMMANDÉES</span>
                  <h2>Trouvez votre première mission.</h2>
                </div>
                <button>Explorer les missions →</button>
              </header>
              <div className="cs15-empty">
                <b>◎</b>
                <h3>Aucune recommandation pour le moment</h3>
                <p>
                  Complétez vos spécialités, logiciels, plateformes, langues et
                  tarifs pour recevoir des missions adaptées.
                </p>
                <button>Créer mon profil professionnel</button>
              </div>
            </article>
            <article>
              <span>PROGRESSION DU PROFIL</span>
              <h2>Votre vitrine professionnelle</h2>
              <div className="cs15-progress">
                <i>
                  <b style={{ width: "20%" }} />
                </i>
                <strong>20%</strong>
              </div>
              {[
                "Photo et présentation",
                "Spécialités et logiciels",
                "Portfolio vidéo",
                "Tarifs et disponibilité",
              ].map((item, index) => (
                <p key={item}>
                  <i>{index === 0 ? "✓" : "○"}</i>
                  {item}
                </p>
              ))}
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

function AppShell({
  exit,
  plan,
  userId,
  userEmail,
  userName,
  signOut,
  theme,
  toggleTheme,
}: {
  exit: () => void;
  plan: string;
  userId: string;
  userEmail: string | null;
  userName: string;
  signOut: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const [view, setView] = useState<View>("overview");
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionTitle, setMissionTitle] = useState("");
  const [missionClient, setMissionClient] = useState("");
  const [missionTarget, setMissionTarget] = useState(6);
  const [missionDue, setMissionDue] = useState("");
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [failedJobs, setFailedJobs] = useState<Array<{ id: string; video_id: string; error_message: string | null; attempts: number; max_attempts: number }>>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");
  const [clipFilter, setClipFilter] = useState("Tous");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [videoRecordId, setVideoRecordId] = useState<string | null>(null);
  const [videoUploadState, setVideoUploadState] = useState<
    "idle" | "uploading" | "ready" | "error"
  >("idle");
  const [clipExporting, setClipExporting] = useState<string | null>(null);
  const videoFileRef = useRef<File | null>(null);
  const analysisVideoRef = useRef<HTMLVideoElement | null>(null);
  const [platform, setPlatform] = useState("TikTok");
  const [hook, setHook] = useState("");
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [analysisRun, setAnalysisRun] = useState(0);
  const [analysisProvider, setAnalysisProvider] = useState<
    "openai" | "local" | null
  >(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [publishFileName, setPublishFileName] = useState("");
  const [publishVideoMeta, setPublishVideoMeta] = useState<VideoMeta | null>(
    null,
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
    "tiktok",
    "youtube",
    "facebook",
  ]);
  const [publishCaption, setPublishCaption] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [platformCopies, setPlatformCopies] = useState<Record<string, string>>(
    {},
  );
  const [activeCustomize, setActiveCustomize] = useState("instagram");
  const [adaptedPlatforms, setAdaptedPlatforms] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showConnect, setShowConnect] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [scriptTopic, setScriptTopic] = useState(
    "Comment transformer une seule vidéo longue en 20 clips performants",
  );
  const [scriptAudience, setScriptAudience] = useState(
    "Créateurs et agences de contenu",
  );
  const [scriptGoal, setScriptGoal] = useState(
    "Générer des demandes de démonstration",
  );
  const [scriptTone, setScriptTone] = useState("Direct et premium");
  const [scriptDuration, setScriptDuration] = useState("60 secondes");
  const [scriptStructure, setScriptStructure] = useState(
    "Problème → tension → solution → preuve → CTA",
  );
  const [scriptCta, setScriptCta] = useState("Teste ClipScale gratuitement");
  const [scriptReferences, setScriptReferences] = useState(
    "Yomi Denzel, Ali Abdaal, chaîne Think Media",
  );
  const [scriptKeywords, setScriptKeywords] = useState(
    "clipping vidéo, contenu court, automatisation, créateur",
  );
  const [generatedScript, setGeneratedScript] = useState<null | {
    title: string;
    hook: string;
    body: string[];
    description: string;
    seoTitle: string;
    tags: string[];
  }>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [complimentaryAccess, setComplimentaryAccess] =
    useState<AccessGrant | null>(null);
  const [billingSubscription, setBillingSubscription] =
    useState<BillingSubscription | null>(null);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantSaving, setGrantSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [accountDataBusy, setAccountDataBusy] = useState<"export" | "delete" | null>(null);
  const [workspaceName, setWorkspaceName] = useState("ClipScale Studio");
  const [contactEmail, setContactEmail] = useState(userEmail || "");
  const [workspaceTimezone, setWorkspaceTimezone] = useState("Europe/Paris");
  const [accountOpen, setAccountOpen] = useState(false);
  const [editorClip, setEditorClip] = useState<ClipItem | null>(null);
  const [editorDraft, setEditorDraft] = useState<ClipDraft | null>(null);
  const [editorUndo, setEditorUndo] = useState<ClipDraft[]>([]);
  const [editorRedo, setEditorRedo] = useState<ClipDraft[]>([]);
  const [editorVideoUrl, setEditorVideoUrl] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const toastTimer = useRef<number | null>(null);
  const isDemo = false;
  const displayName =
    userName.trim() || userEmail?.split("@")[0] || "Aron Ventura";
  const firstName = displayName.split(/\s+/)[0];
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "AV";
  const todayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date())
    .toUpperCase();
  const filteredClips = useMemo(
    () =>
      clipFilter === "Tous"
        ? clips
        : clips.filter((clip) => clip.status === clipFilter),
    [clips, clipFilter],
  );
  const clipMetrics = useMemo(() => {
    const count = clips.length;
    const average = (key: "score" | "retention") =>
      count
        ? Math.round(
            clips.reduce((total, clip) => total + Number(clip[key] || 0), 0) /
              count,
          )
        : 0;
    return {
      score: average("score"),
      retention: average("retention"),
      ready: clips.filter(
        (clip) => clip.status === "Approuvé" || clip.status === "Publié",
      ).length,
    };
  }, [clips]);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.id !== "admin" || isAdmin),
    [isAdmin],
  );
  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!userId) return;
    const timer = window.setTimeout(() => {
      const savedView = window.localStorage.getItem(
        `clipscale-view-${userId}`,
      ) as View | null;
      if (savedView && navItems.some((item) => item.id === savedView))
        setView(savedView);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);
  const loadMissions = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("missions")
      .select(
        "id,client_name,title,target_clips,completed_clips,due_date,status",
      )
      .order("created_at", { ascending: false });
    if (error) {
      notify("Les missions n’ont pas pu être chargées");
      return;
    }
    const statusLabels: Record<string, MissionStatus> = {
      planned: "Planifiée",
      active: "En production",
      review: "À valider",
      completed: "Terminée",
      archived: "Terminée",
    };
    setMissions(
      (data ?? []).map((item, index) => ({
        id: item.id,
        client: item.client_name,
        title: item.title,
        clips: `${item.completed_clips} / ${item.target_clips}`,
        due: item.due_date
          ? new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "short",
            }).format(new Date(`${item.due_date}T12:00:00`))
          : "À définir",
        status: statusLabels[item.status] || "Planifiée",
        tone: ["violet", "blue", "orange", "green"][index % 4],
      })),
    );
  }, [userId]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadMissions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMissions]);
  const loadStudioClips = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("studio_clips")
      .select(
        "id,video_id,title,start_seconds,end_seconds,status,score,retention,edit_version,framing_x,framing_y,edit_style,aspect_ratio,zoom_enabled,silence_removal,caption_style,studio_videos(filename,width,height)",
      )
      .order("created_at", { ascending: false });
    if (error || !data) return;
    setClips(
      data.map(
        (
          row: {
            id: string;
            video_id: string;
            title: string;
            start_seconds: number;
            end_seconds: number;
            status: ClipItem["status"];
            score: number;
            retention: number;
            edit_version?: number;
            framing_x?: number;
            framing_y?: number;
            edit_style?: string;
            aspect_ratio?: string;
            zoom_enabled?: boolean;
            silence_removal?: boolean;
            caption_style?: Record<string, unknown>;
            studio_videos:
              | { filename?: string; width?: number; height?: number }
              | { filename?: string; width?: number; height?: number }[]
              | null;
          },
          index: number,
        ) => {
          const source = Array.isArray(row.studio_videos)
            ? row.studio_videos[0]
            : row.studio_videos;
          const duration = Math.max(
            1,
            Math.round(Number(row.end_seconds) - Number(row.start_seconds)),
          );
          const vertical =
            Number(source?.height || 0) > Number(source?.width || 0);
          return {
            id: row.id,
            videoId: row.video_id,
            title: row.title,
            mission: source?.filename || "Vidéo importée",
            format: `${row.aspect_ratio || (vertical ? "9:16" : "Source")} · ${duration} s`,
            status: row.status,
            score: row.score,
            retention: row.retention,
            tone: ["violet", "blue", "orange", "green"][index % 4],
            start: Number(row.start_seconds),
            end: Number(row.end_seconds),
            version: row.edit_version || 1,
            framingX: Number(row.framing_x) || 0,
            framingY: Number(row.framing_y) || 0,
            style: row.edit_style || "dynamic",
            aspectRatio: row.aspect_ratio || "9:16",
            zoomEnabled: row.zoom_enabled ?? true,
            silenceRemoval: row.silence_removal ?? false,
            captionStyle: row.caption_style || {},
          } as ClipItem;
        },
      ),
    );
  }, [userId]);
  const loadFailedJobs = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("processing_jobs").select("id,video_id,error_message,attempts,max_attempts").eq("status", "failed").in("job_type", ["transcribe", "analyse"]).order("updated_at", { ascending: false }).limit(5);
    setFailedJobs((data || []) as Array<{ id: string; video_id: string; error_message: string | null; attempts: number; max_attempts: number }>);
  }, [userId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStudioClips();
      void loadFailedJobs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadFailedJobs, loadStudioClips]);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const resume = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token || !active) return;
      const { data: jobs } = await supabase
        .from("processing_jobs")
        .select("id,job_type,status")
        .in("status", ["queued", "processing"])
        .order("created_at", { ascending: false })
        .limit(5);
      for (const job of jobs || []) {
        if (job.job_type !== "transcribe" && job.job_type !== "analyse")
          continue;
        const response = await fetch(
          `/api/studio/process?jobId=${encodeURIComponent(job.id)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as {
          status?: string;
          output?: { count?: number };
        };
        if (response.ok && payload.status === "completed") {
          await loadStudioClips();
          notify(
            `${payload.output?.count || 0} clips terminés automatiquement`,
          );
        }
      }
    };
    void resume();
    const timer = window.setInterval(() => void resume(), 12_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadStudioClips, userId]);
  const loadAccess = useCallback(async () => {
    const normalizedEmail = userEmail?.trim().toLowerCase();
    if (!userId || !normalizedEmail) {
      setIsAdmin(false);
      setComplimentaryAccess(null);
      setBillingSubscription(null);
      setAccessGrants([]);
      return;
    }
    const [
      { data: admin, error: adminError },
      { data: grant, error: grantError },
      { data: subscription, error: subscriptionError },
    ] = await Promise.all([
      supabase
        .from("admin_users")
        .select("email")
        .eq("email", normalizedEmail)
        .maybeSingle(),
      supabase
        .from("access_grants")
        .select("id,email,active,access_level,note,created_at")
        .eq("email", normalizedEmail)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("user_subscriptions")
        .select("plan,status,monthly_minutes,monthly_rendered_minutes,member_limit,cancel_at_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const adminMode =
      !adminError &&
      normalizedEmail === OWNER_EMAIL &&
      admin?.email?.toLowerCase() === OWNER_EMAIL;
    setIsAdmin(adminMode);
    setComplimentaryAccess(grantError ? null : (grant as AccessGrant | null));
    setBillingSubscription(
      subscriptionError ? null : (subscription as BillingSubscription | null),
    );
    if (adminMode) {
      const { data, error } = await supabase
        .from("access_grants")
        .select("id,email,active,access_level,note,created_at")
        .order("created_at", { ascending: false });
      setAccessGrants(error ? [] : ((data ?? []) as AccessGrant[]));
    } else setAccessGrants([]);
  }, [userEmail, userId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccess();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccess]);
  const addAccessGrant = async () => {
    const email = grantEmail.trim().toLowerCase();
    if (!userId || !isAdmin || !/^\S+@\S+\.\S+$/.test(email)) {
      notify("Saisissez une adresse e-mail valide");
      return;
    }
    setGrantSaving(true);
    const { error } = await supabase
      .from("access_grants")
      .upsert(
        {
          email,
          active: true,
          access_level: "agency",
          note: grantNote.trim() || null,
          granted_by: userId,
        },
        { onConflict: "email" },
      );
    setGrantSaving(false);
    if (error) {
      notify("Accès non enregistré — reconnectez-vous puis réessayez");
      return;
    }
    setGrantEmail("");
    setGrantNote("");
    await loadAccess();
    notify("Accès Agency offert activé");
  };
  const toggleAccessGrant = async (grant: AccessGrant) => {
    const { error } = await supabase
      .from("access_grants")
      .update({ active: !grant.active, updated_at: new Date().toISOString() })
      .eq("id", grant.id);
    if (error) {
      notify("Modification impossible");
      return;
    }
    await loadAccess();
    notify(grant.active ? "Accès suspendu" : "Accès réactivé");
  };
  const updatePassword = async () => {
    if (newPassword.length < 12) {
      notify("Utilisez au moins 12 caractères");
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      notify("Mot de passe non modifié");
      return;
    }
    setNewPassword("");
    notify("Mot de passe sécurisé et mis à jour");
  };
  const authorizationHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token || ""}` };
  };
  const startCheckout = async (plan: "starter" | "pro" | "agency") => {
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { ...(await authorizationHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const payload = await response.json().catch(() => ({ error: "Paiement indisponible" })) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      notify(payload.error || "Paiement indisponible");
      return;
    }
    const checkout = new URL(payload.url);
    if (checkout.protocol !== "https:" || checkout.hostname !== "buy.stripe.com") {
      notify("Lien de paiement refusé");
      return;
    }
    window.location.assign(checkout.toString());
  };
  const exportAccountData = async () => {
    setAccountDataBusy("export");
    const response = await fetch("/api/account/export", { headers: await authorizationHeaders() });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Export indisponible" })) as { error?: string };
      setAccountDataBusy(null);
      notify(payload.error || "Export indisponible");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clipscale-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setAccountDataBusy(null);
    notify("Archive de vos données téléchargée");
  };
  const requestAccountDeletion = async () => {
    if (!window.confirm("Demander la suppression définitive du compte, des projets et des fichiers ? Le support vérifiera votre identité avant exécution.")) return;
    setAccountDataBusy("delete");
    const response = await fetch("/api/account/deletion-request", { method: "POST", headers: await authorizationHeaders() });
    const payload = await response.json().catch(() => ({ error: "Demande indisponible" })) as { error?: string; message?: string };
    setAccountDataBusy(null);
    notify(response.ok ? payload.message || "Demande enregistrée" : payload.error || "Demande indisponible");
  };
  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("workspace_settings")
      .select("workspace_name,contact_email,timezone")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setWorkspaceName(data.workspace_name);
        setContactEmail(data.contact_email || userEmail || "");
        setWorkspaceTimezone(data.timezone);
      });
  }, [userEmail, userId]);
  const saveWorkspaceSettings = async () => {
    if (workspaceName.trim().length < 2 || !contactEmail.includes("@")) {
      notify("Vérifiez le nom et l’adresse de contact");
      return;
    }
    const { error } = await supabase
      .from("workspace_settings")
      .upsert({
        user_id: userId,
        workspace_name: workspaceName.trim(),
        contact_email: contactEmail.trim().toLowerCase(),
        timezone: workspaceTimezone,
        updated_at: new Date().toISOString(),
      });
    notify(
      error
        ? "Réglages non enregistrés"
        : "Réglages enregistrés dans votre espace",
    );
  };
  const generateScript = () => {
    const mainKeyword = scriptKeywords.split(",")[0]?.trim() || scriptTopic;
    setGeneratedScript({
      title: `${scriptTopic} : la méthode complète en ${scriptDuration}`,
      hook: `Tu perds encore des heures à republier le même contenu ? Voici comment transformer une seule idée en une machine à contenu — sans sacrifier la qualité.`,
      body: [
        `0–5 s · ACCROCHE — « Une seule vidéo peut alimenter toute ta semaine. Le problème, ce n’est pas ton contenu : c’est ton système. »`,
        `5–18 s · PROBLÈME — Montre le temps perdu entre le montage, les formats, les légendes et les publications. Adresse-toi directement à ${scriptAudience.toLowerCase()}.`,
        `18–38 s · SOLUTION — Présente une méthode en trois temps : détecter les moments forts, adapter chaque extrait au réseau, puis programmer la diffusion depuis un seul cockpit.`,
        `38–50 s · PREUVE — Appuie le propos avec un résultat concret et une capture du tableau de bord. Inspire-toi du rythme et des transitions observés chez ${scriptReferences || "les chaînes de référence"}, sans reproduire leur texte ni leur identité.`,
        `50–${scriptDuration.replace(" secondes", "")} s · CTA — « ${scriptCta}. » Affiche le bénéfice final à l’écran et termine sur une action unique.`,
      ],
      description: `${scriptTopic}. Dans cette vidéo pensée pour ${scriptAudience.toLowerCase()}, découvre une méthode concrète pour ${scriptGoal.toLowerCase()}. Structure : ${scriptStructure}. Références créatives analysées : ${scriptReferences || "aucune"}.`,
      seoTitle: `${mainKeyword.charAt(0).toUpperCase() + mainKeyword.slice(1)} : méthode 2026 pour publier plus vite`,
      tags: scriptKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
    });
    notify("Script personnalisé généré");
  };
  const changeView = (next: View) => {
    setView(next);
    setShowCreate(false);
    setAccountOpen(false);
    if (userId) window.localStorage.setItem(`clipscale-view-${userId}`, next);
  };
  const addMission = async () => {
    if (!missionTitle.trim() || !missionClient.trim() || missionTarget < 1) {
      notify("Complétez le nom, le client et le nombre de clips");
      return;
    }
    const { error } = await supabase
      .from("missions")
      .insert({
        user_id: userId,
        client_name: missionClient.trim(),
        title: missionTitle.trim(),
        target_clips: missionTarget,
        due_date: missionDue || null,
        status: "planned",
      });
    if (error) {
      notify("La mission n’a pas pu être enregistrée");
      return;
    }
    setMissionTitle("");
    setMissionClient("");
    setMissionTarget(6);
    setMissionDue("");
    setShowCreate(false);
    setView("missions");
    await loadMissions();
    notify("Mission enregistrée dans votre espace");
  };
  const advanceClip = async (id: string) => {
    const current = clips.find((clip) => clip.id === id);
    if (!current) return;
    const status =
      current.status === "Montage"
        ? "À valider"
        : current.status === "À valider"
          ? "Approuvé"
          : current.status === "Approuvé"
            ? "Publié"
            : current.status;
    if (status === current.status) return;
    setClips((items) =>
      items.map((clip) => (clip.id === id ? { ...clip, status } : clip)),
    );
    const { error } = await supabase
      .from("studio_clips")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      setClips((items) =>
        items.map((clip) => (clip.id === id ? current : clip)),
      );
      notify("Le statut n’a pas pu être sauvegardé");
      return;
    }
    notify("Statut du clip sauvegardé");
  };
  const deleteSourceVideo = async (clip: ClipItem) => {
    if (
      !window.confirm(
        `Supprimer définitivement « ${clip.mission} » et tous ses clips ? Cette action est irréversible.`,
      )
    )
      return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`/api/studio/videos/${clip.videoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token || ""}` },
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      notify(payload.error || "Suppression impossible");
      return;
    }
    setClips((items) => items.filter((item) => item.videoId !== clip.videoId));
    notify("Vidéo source et clips associés supprimés définitivement");
  };
  const openClipEditor = async (clip: ClipItem) => {
    const caption = clip.captionStyle || {};
    const draft: ClipDraft = {
      title: clip.title,
      start: clip.start,
      end: clip.end,
      framingX: clip.framingX || 0,
      framingY: clip.framingY || 0,
      style: clip.style || "dynamic",
      aspectRatio: clip.aspectRatio || "9:16",
      zoomEnabled: clip.zoomEnabled ?? true,
      silenceRemoval: clip.silenceRemoval ?? false,
      captionColor: String(caption.color || "#FFFFFF"),
      activeColor: String(caption.activeColor || "#8A6CFF"),
      fontSize: Number(caption.fontSize) || 64,
    };
    setEditorClip(clip);
    setEditorDraft(draft);
    setEditorUndo([]);
    setEditorRedo([]);
    setEditorVideoUrl("");
    const { data: video } = await supabase
      .from("studio_videos")
      .select("file_path")
      .eq("id", clip.videoId)
      .eq("user_id", userId)
      .single();
    if (video?.file_path) {
      const { data } = await supabase.storage
        .from("studio-videos")
        .createSignedUrl(video.file_path, 900);
      if (data?.signedUrl) setEditorVideoUrl(data.signedUrl);
    }
  };
  const changeEditorDraft = (patch: Partial<ClipDraft>) => {
    setEditorDraft((current) => {
      if (!current) return current;
      setEditorUndo((items) => [...items, current].slice(-30));
      setEditorRedo([]);
      return { ...current, ...patch };
    });
  };
  const undoEditor = () => {
    const previous = editorUndo.at(-1);
    if (!previous || !editorDraft) return;
    setEditorRedo((items) => [...items, editorDraft]);
    setEditorUndo((items) => items.slice(0, -1));
    setEditorDraft(previous);
  };
  const redoEditor = () => {
    const next = editorRedo.at(-1);
    if (!next || !editorDraft) return;
    setEditorUndo((items) => [...items, editorDraft]);
    setEditorRedo((items) => items.slice(0, -1));
    setEditorDraft(next);
  };
  const saveClipEditor = async () => {
    if (!editorClip || !editorDraft) return;
    setEditorSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`/api/studio/clips/${editorClip.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session?.access_token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: editorClip.version || 1,
        ...editorDraft,
        captionStyle: {
          color: editorDraft.captionColor,
          activeColor: editorDraft.activeColor,
          fontSize: editorDraft.fontSize,
        },
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setEditorSaving(false);
    if (!response.ok) {
      notify(payload.error || "Sauvegarde impossible");
      return;
    }
    await loadStudioClips();
    setEditorClip(null);
    setEditorDraft(null);
    setEditorVideoUrl("");
    notify("Montage sauvegardé — nouveau rendu prêt");
  };
  const selectVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedVideoTypes = new Set([
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ]);
    const allowedExtension = /\.(mp4|mov|webm)$/i.test(file.name);
    if (!allowedVideoTypes.has(file.type) || !allowedExtension) {
      event.target.value = "";
      notify("Format refusé : utilisez un fichier MP4, MOV ou WebM");
      return;
    }
    if (file.size < 1_024) {
      event.target.value = "";
      notify("Le fichier vidéo est vide ou invalide");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      notify("La vidéo dépasse la limite de 500 Mo");
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    videoFileRef.current = file;
    setVideoUrl(url);
    setVideoMeta(null);
    setVideoRecordId(null);
    setVideoUploadState("uploading");
    setVideoUploadProgress(0);
    setAnalysis(null);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onerror = () => {
      setVideoUploadState("error");
      notify("Impossible de lire cette vidéo");
    };
    probe.onloadedmetadata = async () => {
      const meta = {
        name: file.name,
        duration: Math.round(probe.duration),
        width: probe.videoWidth,
        height: probe.videoHeight,
        size: file.size,
      };
      setVideoMeta(meta);
      const safeName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .slice(-100);
      const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
      let uploadError: unknown = null;
      if (file.size > 6 * 1024 * 1024) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) uploadError = new Error("Session absente");
        else
          try {
            await uploadVideoResumable(
              file,
              path,
              session.access_token,
              setVideoUploadProgress,
            );
          } catch (error) {
            uploadError = error;
          }
      } else {
        const upload = await supabase.storage
          .from("studio-videos")
          .upload(path, file, { contentType: file.type, upsert: false });
        uploadError = upload.error;
        if (!upload.error) setVideoUploadProgress(100);
      }
      if (uploadError) {
        setVideoUploadState("error");
        notify("La vidéo reste utilisable, mais sa sauvegarde a échoué");
        return;
      }
      const saved = await supabase
        .from("studio_videos")
        .insert({
          user_id: userId,
          file_path: path,
          filename: file.name,
          mime_type: file.type || "video/mp4",
          size_bytes: file.size,
          duration_seconds: meta.duration,
          width: meta.width,
          height: meta.height,
          platform,
          hook,
          status: "uploaded",
        })
        .select("id")
        .single();
      if (saved.error) {
        await supabase.storage.from("studio-videos").remove([path]);
        setVideoUploadState("error");
        notify("La fiche vidéo n’a pas pu être enregistrée");
        return;
      }
      setVideoRecordId(saved.data.id);
      setVideoUploadState("ready");
      notify("Vidéo sauvegardée dans votre espace sécurisé");
    };
    probe.src = url;
  };
  const analyzeVideo = async () => {
    if (!videoMeta) return;
    setIsAnalyzing(true);
    const vertical = videoMeta.height > videoMeta.width;
    const durationPoints =
      videoMeta.duration >= 12 && videoMeta.duration <= 40
        ? 25
        : videoMeta.duration <= 60
          ? 17
          : 8;
    const formatPoints = vertical ? 22 : 8;
    const qualityPoints =
      Math.max(videoMeta.width, videoMeta.height) >= 1080 ? 18 : 10;
    const hookLength = hook.trim().length;
    const hookPoints =
      hookLength >= 18 && hookLength <= 90 ? 25 : hookLength > 0 ? 13 : 5;
    const cadenceScore =
      videoMeta.duration <= 35 ? 86 : videoMeta.duration <= 60 ? 72 : 54;
    const clarityScore =
      hookLength >= 18 && hookLength <= 90 ? 88 : hookLength > 0 ? 64 : 35;
    const emotionScore = hookLength >= 30 ? 76 : 58;
    const subtitleScore =
      vertical && Math.min(videoMeta.width, videoMeta.height) >= 720
        ? 88
        : vertical
          ? 74
          : 56;
    const baseScore =
      10 + durationPoints + formatPoints + qualityPoints + hookPoints;
    const creativeAdjustment = Math.round(
      ((cadenceScore + clarityScore + emotionScore + subtitleScore) / 4 - 70) *
        0.18,
    );
    const score = Math.max(38, Math.min(97, baseScore + creativeAdjustment));
    const nextRun = analysisRun + 1;
    const improvements = [
      !vertical
        ? "Recadrez le clip en 9:16 plein écran pour TikTok, Reels et Shorts."
        : "Gardez les éléments importants dans la zone centrale pour éviter les boutons des plateformes.",
      videoMeta.duration > 40
        ? "Coupez les respirations et visez 20 à 35 secondes pour améliorer la rétention."
        : "Ajoutez un changement visuel ou un zoom toutes les 2 à 3 secondes.",
      hookLength < 18
        ? "Renforcez les 2 premières secondes avec une promesse précise ou une phrase qui crée de la curiosité."
        : "Affichez votre accroche en sous-titre dès la première image.",
      "Terminez par une question simple pour provoquer les commentaires et les partages.",
    ];
    let result: ViralAnalysis = {
      score,
      verdict:
        score >= 80
          ? "Fort potentiel"
          : score >= 65
            ? "Bon potentiel"
            : score >= 50
              ? "Potentiel moyen"
              : "À retravailler",
      summary:
        score >= 80
          ? `Ce clip possède une structure technique solide pour ${platform}. Son format et sa durée favorisent la rétention.`
          : `Le clip peut fonctionner sur ${platform}, mais quelques ajustements augmenteraient nettement ses chances de retenir l’audience.`,
      factors: [
        {
          label: "Accroche",
          score: Math.round((hookPoints / 25) * 100),
          detail:
            hookLength >= 18
              ? "Promesse claire et exploitable"
              : "Accroche trop courte ou absente",
        },
        {
          label: "Durée",
          score: Math.round((durationPoints / 25) * 100),
          detail: `${videoMeta.duration} secondes`,
        },
        {
          label: "Format",
          score: Math.round((formatPoints / 22) * 100),
          detail: vertical
            ? "Vertical 9:16 adapté"
            : "Format horizontal à recadrer",
        },
        {
          label: "Qualité",
          score: Math.round((qualityPoints / 18) * 100),
          detail: `${videoMeta.width} × ${videoMeta.height} px`,
        },
        {
          label: "Rythme visuel",
          score: cadenceScore,
          detail:
            cadenceScore >= 78 ? "Cadence dynamique" : "Plans à resserrer",
        },
        {
          label: "Clarté du message",
          score: clarityScore,
          detail:
            clarityScore >= 78
              ? "Promesse facile à comprendre"
              : "Idée principale à simplifier",
        },
        {
          label: "Charge émotionnelle",
          score: emotionScore,
          detail:
            emotionScore >= 75
              ? "Tension narrative présente"
              : "Ajouter contraste ou surprise",
        },
        {
          label: "Lisibilité mobile",
          score: subtitleScore,
          detail:
            subtitleScore >= 78
              ? "Bonne lecture sur petit écran"
              : "Sous-titres à renforcer",
        },
      ],
      improvements,
      strengths: [
        vertical
          ? "Format vertical adapté aux usages mobiles"
          : "Image source exploitable pour plusieurs recadrages",
        hookLength >= 18
          ? "Accroche suffisamment précise pour créer une promesse"
          : "Sujet identifiable dès le début",
        qualityPoints >= 18
          ? "Définition suffisante pour exporter en haute qualité"
          : "Fichier léger et rapide à traiter",
      ],
      retention: Math.max(24, Math.min(92, Math.round(score * 0.82))),
      confidence: Math.max(
        68,
        Math.min(94, 78 + Math.round((qualityPoints + hookPoints) / 7)),
      ),
      run: nextRun,
    };
    let provider: "openai" | "local" = "local";
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("missing-session");
      let frameDataUrl = "";
      const video = analysisVideoRef.current;
      if (video && video.videoWidth && video.videoHeight) {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          1,
          768 / Math.max(video.videoWidth, video.videoHeight),
        );
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas
          .getContext("2d")
          ?.drawImage(video, 0, 0, canvas.width, canvas.height);
        frameDataUrl = canvas.toDataURL("image/jpeg", 0.72);
      }
      const response = await fetch("/api/studio/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          hook,
          frameDataUrl,
          video: {
            filename: videoMeta.name,
            duration: videoMeta.duration,
            width: videoMeta.width,
            height: videoMeta.height,
          },
        }),
      });
      const payload = (await response.json()) as {
        analysis?: Omit<ViralAnalysis, "run">;
        provider?: "openai";
        error?: string;
      };
      if (!response.ok || !payload.analysis)
        throw new Error(payload.error || "analysis-failed");
      result = { ...payload.analysis, run: nextRun };
      provider = "openai";
    } catch {
      notify("OpenAI indisponible : diagnostic technique local utilisé");
    }
    setAnalysis(result);
    setAnalysisProvider(provider);
    setAnalysisRun(nextRun);
    if (videoRecordId) {
      const { error } = await supabase
        .from("studio_videos")
        .update({
          platform,
          hook,
          score: result.score,
          retention: result.retention,
          confidence: result.confidence,
          analysis: result,
          status: "analyzed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", videoRecordId)
        .eq("user_id", userId);
      if (error) notify("Analyse terminée, mais la sauvegarde a échoué");
      else if (provider === "openai")
        notify("Analyse OpenAI terminée et sauvegardée");
    }
    setIsAnalyzing(false);
  };
  const generateClipPlan = async () => {
    if (!videoMeta || !analysis || !videoRecordId) {
      notify("Analysez et sauvegardez d’abord la vidéo");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      notify("Reconnectez-vous pour lancer le traitement");
      return;
    }
    notify(
      "Transcription complète et sélection des meilleurs passages lancées…",
    );
    const started = await fetch("/api/studio/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId: videoRecordId }),
    });
    const startPayload = (await started.json()) as {
      jobId?: string;
      error?: string;
    };
    if (!started.ok || !startPayload.jobId) {
      notify(startPayload.error || "Traitement impossible");
      return;
    }
    for (let attempt = 0; attempt < 150; attempt += 1) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, attempt < 8 ? 2_000 : 5_000),
      );
      const response = await fetch(
        `/api/studio/process?jobId=${encodeURIComponent(startPayload.jobId)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        },
      );
      const job = (await response.json()) as {
        status?: string;
        progress?: number;
        output?: { count?: number };
        error?: string;
      };
      if (!response.ok || job.status === "failed") {
        notify(job.error || "Le traitement a échoué — relance disponible");
        return;
      }
      if (job.status === "completed") {
        await loadStudioClips();
        changeView("clips");
        notify(
          `${job.output?.count || 0} meilleurs passages créés à partir de la transcription`,
        );
        return;
      }
      if (job.progress) notify(`Traitement vidéo · ${job.progress}%`);
    }
    notify(
      "Le traitement continue en arrière-plan et reprendra à votre retour",
    );
  };
  const retryProcessingJob = async (jobId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { notify("Reconnectez-vous pour relancer le traitement"); return; }
    const response = await fetch("/api/studio/process", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ retryJobId: jobId }) });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) { notify(payload.error || "Relance impossible"); return; }
    setFailedJobs((jobs) => jobs.filter((job) => job.id !== jobId));
    notify("Traitement relancé — il continuera même si vous fermez ClipScale");
  };
  const exportClip = async (clip: ClipItem) => {
    setClipExporting(clip.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("missing-session");
      notify("Rendu vertical sandbox lancé — quelques instants…");
      const submitted = await fetch("/api/studio/render", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clipId: clip.id }),
      });
      const submission = (await submitted.json()) as {
        renderId?: string;
        error?: string;
      };
      if (!submitted.ok || !submission.renderId)
        throw new Error(submission.error || "render-submission-failed");
      for (let attempt = 0; attempt < 80; attempt += 1) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, attempt < 4 ? 2_000 : 4_000),
        );
        const response = await fetch(
          `/api/studio/render?id=${encodeURIComponent(submission.renderId)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          },
        );
        const render = (await response.json()) as {
          status?: string;
          url?: string;
          error?: string;
        };
        if (!response.ok)
          throw new Error(render.error || "render-status-failed");
        if (render.status === "failed")
          throw new Error(render.error || "render-failed");
        if (render.status === "done" && render.url) {
          const link = document.createElement("a");
          link.href = render.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.click();
          notify("MP4 vertical prêt — rendu sandbox filigrané");
          return;
        }
      }
      throw new Error("render-timeout");
    } catch {
      const video = analysisVideoRef.current;
      if (
        !video ||
        !videoFileRef.current ||
        clip.videoId !== videoRecordId ||
        !("captureStream" in video) ||
        typeof MediaRecorder === "undefined"
      ) {
        notify(
          "Rendu distant indisponible — réouvrez la source pour l’export local",
        );
        return;
      }
      try {
        video.pause();
        video.currentTime = clip.start;
        await new Promise<void>((resolve) => {
          const done = () => {
            video.removeEventListener("seeked", done);
            resolve();
          };
          video.addEventListener("seeked", done);
        });
        const stream = (
          video as HTMLVideoElement & { captureStream(): MediaStream }
        ).captureStream();
        const mimeType = MediaRecorder.isTypeSupported(
          "video/webm;codecs=vp9,opus",
        )
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        const finished = new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });
        recorder.start(500);
        await video.play();
        await new Promise<void>((resolve) => {
          const tick = () =>
            video.currentTime >= clip.end || video.ended
              ? resolve()
              : requestAnimationFrame(tick);
          tick();
        });
        recorder.stop();
        video.pause();
        await finished;
        const blob = new Blob(chunks, { type: "video/webm" });
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = `${clip.title.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 60)}.webm`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(href), 1500);
        notify("Rendu distant indisponible — extrait WebM exporté localement");
      } catch {
        notify("L’export a échoué sur ce navigateur");
      }
    } finally {
      setClipExporting(null);
    }
  };
  const selectPublishVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedVideoTypes = new Set([
      "video/mp4",
      "video/quicktime",
      "video/webm",
    ]);
    if (
      !allowedVideoTypes.has(file.type) ||
      !/\.(mp4|mov|webm)$/i.test(file.name) ||
      file.size < 1_024 ||
      file.size > 500 * 1024 * 1024
    ) {
      event.target.value = "";
      notify("Vidéo refusée : MP4, MOV ou WebM, 500 Mo maximum");
      return;
    }
    if (publishUrl) URL.revokeObjectURL(publishUrl);
    const url = URL.createObjectURL(file);
    setPublishUrl(url);
    setPublishFileName(file.name);
    setPublishVideoMeta(null);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () =>
      setPublishVideoMeta({
        name: file.name,
        duration: Math.round(probe.duration),
        width: probe.videoWidth,
        height: probe.videoHeight,
        size: file.size,
      });
    probe.src = url;
  };
  const togglePlatform = (id: string) =>
    setSelectedPlatforms((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      if (!next.includes(activeCustomize))
        setActiveCustomize(next[0] ?? "instagram");
      return next;
    });
  const buildPlatformCopy = (id: string) => {
    const base = publishCaption.trim();
    if (id === "instagram") return `${base}\n\n#reels #video #creation`;
    if (id === "tiktok")
      return `${base.slice(0, 240)}\n\nVous feriez quoi à ma place ? #pourtoi #createur`;
    if (id === "youtube")
      return `${base}\n\nAbonnez-vous pour découvrir les prochaines vidéos.`;
    if (id === "facebook")
      return `${base}\n\nQu’en pensez-vous ? Dites-le-nous en commentaire.`;
    if (id === "linkedin")
      return `Un apprentissage à retenir :\n\n${base}\n\nEt vous, comment abordez-vous ce sujet ?`;
    if (id === "threads") return `${base.slice(0, 280)}\n\nVotre avis ?`;
    if (id === "pinterest")
      return `${base}\n\nEnregistrez cette vidéo pour la retrouver plus tard.`;
    if (id === "snapchat") return base.slice(0, 140);
    if (id === "telegram")
      return `${base}\n\nPartagez cette vidéo à une personne que cela peut aider.`;
    return `${base.slice(0, 240)}\n\nQu’en pensez-vous ?`;
  };
  const adaptCopies = () => {
    if (!publishCaption.trim() || !selectedPlatforms.length) return;
    setPlatformCopies((current) =>
      Object.fromEntries(
        selectedPlatforms.map((id) => [
          id,
          current[id] || buildPlatformCopy(id),
        ]),
      ),
    );
    setAdaptedPlatforms([...selectedPlatforms]);
    setActiveCustomize(
      selectedPlatforms.includes(activeCustomize)
        ? activeCustomize
        : selectedPlatforms[0],
    );
    if (selectedPlatforms.includes("youtube") && !youtubeTitle.trim())
      setYoutubeTitle(
        publishCaption
          .trim()
          .split(/[.!?\n]/)[0]
          .slice(0, 80),
      );
    notify(
      `${selectedPlatforms.length} variante${selectedPlatforms.length > 1 ? "s" : ""} prête${selectedPlatforms.length > 1 ? "s" : ""}`,
    );
  };
  const activePlatform =
    socialPlatforms.find((item) => item.id === activeCustomize) ??
    socialPlatforms[0];
  const allCopiesReady =
    selectedPlatforms.length > 0 &&
    selectedPlatforms.every(
      (id) => adaptedPlatforms.includes(id) && platformCopies[id]?.trim(),
    );
  const publishReady = Boolean(
    publishUrl &&
    publishCaption.trim() &&
    allCopiesReady &&
    (!selectedPlatforms.includes("youtube") || youtubeTitle.trim()) &&
    (publishMode === "now" || scheduledAt),
  );
  const sendSupportTicket = async () => {
    if (!userId || !supportSubject.trim() || !supportMessage.trim()) return;
    setSupportSending(true);
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("support_tickets")
      .insert({
        workspace_id: membership?.workspace_id || null,
        user_id: userId,
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
    setSupportSending(false);
    if (error) notify("Impossible d’envoyer la demande pour le moment");
    else {
      setShowSupport(false);
      setSupportSubject("");
      setSupportMessage("");
      notify("Demande envoyée au support");
    }
  };

  return (
    <div className="cs2-app">
      <aside className="cs2-sidebar">
        <button
          className="cs2-brand-button"
          onClick={() => changeView("overview")}
          aria-label="Accueil ClipScale"
        >
          <Logo />
        </button>
        <button
          className="cs10-workspace-card"
          onClick={() => changeView("settings")}
        >
          <span>{initials}</span>
          <span>
            <b>ClipScale Studio</b>
            <small>
              {isAdmin
                ? "Espace propriétaire"
                : isDemo
                  ? "Aperçu interactif"
                  : "Espace agence"}
            </small>
          </span>
          <em>⌄</em>
        </button>
        <nav aria-label="Navigation de l’application">
          {visibleNavItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => changeView(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {isDemo ? (
          <div className="cs2-demo-card">
            <b>Aperçu interactif</b>
            <p>Explorez le cockpit avec un jeu de données d’exemple.</p>
            <button onClick={exit}>Revenir au site</button>
          </div>
        ) : (
          <div className="cs2-demo-card cs10-production-card">
            <b>
              <i /> Espace opérationnel
            </b>
            <p>Session sécurisée · données du compte synchronisées.</p>
            <button onClick={() => changeView("settings")}>
              Gérer l’espace →
            </button>
          </div>
        )}
      </aside>

      <main className="cs2-workspace">
        <header className="cs2-app-header">
          <div className="cs2-mobile-brand">
            <Logo />
          </div>
          <div className="cs10-breadcrumb">
            <small>CLIPSCALE STUDIO</small>
            <b>{navItems.find((item) => item.id === view)?.label}</b>
          </div>
          <span className={`cs2-demo-pill ${isDemo ? "preview" : "live"}`}>
            {isAdmin
              ? "● PROPRIÉTAIRE"
              : isDemo
                ? "● APERÇU"
                : "● BÊTA GRATUITE"}
          </span>
          <span className="cs2-plan-pill">
            ✦ {complimentaryAccess || isAdmin ? "Agency" : "Bêta"}
          </span>
          <div className="cs2-header-actions">
            <button
              className="cs-theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Activer le mode clair"
                  : "Activer le mode sombre"
              }
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
            </button>
            <button
              aria-label="Ouvrir le support"
              onClick={() => setShowSupport(true)}
            >
              ?
            </button>
            <div className="cs10-account-wrap">
              <button
                className="cs10-account-button"
                onClick={() => setAccountOpen((current) => !current)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
              >
                <span className="cs2-avatar">{initials}</span>
                <span>
                  <b>{firstName}</b>
                  <small>
                    {isAdmin ? "Propriétaire" : isDemo ? "Visiteur" : "Membre"}
                  </small>
                </span>
                <em>⌄</em>
              </button>
              {accountOpen && (
                <div className="cs10-account-menu" role="menu">
                  <header>
                    <span className="cs2-avatar">{initials}</span>
                    <div>
                      <b>{displayName}</b>
                      <small>{userEmail || "Session d’aperçu"}</small>
                    </div>
                  </header>
                  <div className="cs10-account-plan">
                    <span>Plan actuel</span>
                    <strong>
                      {complimentaryAccess || isAdmin
                        ? "Agency · Accès complet"
                        : isDemo
                          ? "Aperçu interactif"
                          : "Bêta gratuite"}
                    </strong>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => changeView("settings")}
                  >
                    ⚙ Réglages du compte
                  </button>
                  <button role="menuitem" onClick={exit}>
                    ↗ Voir le site public
                  </button>
                  {userId && (
                    <button
                      role="menuitem"
                      className="danger"
                      onClick={signOut}
                    >
                      ⇥ Se déconnecter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="cs2-mobile-nav">
          {navItems
            .filter((item) =>
              [
                "overview",
                "scripts",
                "virality",
                "publish",
                "settings",
              ].includes(item.id),
            )
            .map((item) => (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                onClick={() => changeView(item.id)}
              >
                <span>{item.icon}</span>
                {item.label === "Vue d’ensemble"
                  ? "Accueil"
                  : item.label === "Studio scripts"
                    ? "Scripts"
                    : item.label}
              </button>
            ))}
        </div>

        <section className={`cs2-page cs12-view cs12-view-${view}`} key={view}>
          {view === "overview" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>{todayLabel}</span>
                  <h1>Bonjour, {firstName}.</h1>
                  <p>
                    {isDemo
                      ? "Explorez le fonctionnement du cockpit ClipScale."
                      : "Votre espace est prêt. Voici les priorités de production du jour."}
                  </p>
                </div>
                <button
                  className="cs2-button"
                  onClick={() => setShowCreate(true)}
                >
                  + Nouvelle mission
                </button>
              </div>
              {!isDemo && (
                <div className="cs10-command-bar">
                  <div>
                    <span className="cs10-command-icon">✦</span>
                    <div>
                      <b>Cockpit Agency opérationnel</b>
                      <small>
                        Compte sécurisé · accès complet · dernière
                        synchronisation à l’instant
                      </small>
                    </div>
                  </div>
                  <div>
                    <button onClick={() => changeView("virality")}>
                      ↗ Analyser un clip
                    </button>
                    <button onClick={() => changeView("scripts")}>
                      ✦ Créer un script
                    </button>
                    <button onClick={() => changeView("publish")}>
                      ↑ Préparer une diffusion
                    </button>
                  </div>
                </div>
              )}
              <div className="cs2-kpis">
                <article>
                  <span>À valider</span>
                  <strong>
                    <AnimatedNumber
                      value={
                        isDemo
                          ? 7
                          : clips.filter((clip) => clip.status === "À valider")
                              .length
                      }
                    />
                  </strong>
                  <small>
                    {isDemo ? "clips en attente" : "aucun clip en attente"}
                  </small>
                </article>
                <article>
                  <span>En production</span>
                  <strong>
                    <AnimatedNumber
                      value={
                        isDemo
                          ? 18
                          : clips.filter((clip) => clip.status === "Montage")
                              .length
                      }
                    />
                  </strong>
                  <small>
                    {isDemo ? "clips en cours" : "aucune production en cours"}
                  </small>
                </article>
                <article>
                  <span>À publier</span>
                  <strong>
                    <AnimatedNumber
                      value={
                        isDemo
                          ? 4
                          : clips.filter((clip) => clip.status === "Approuvé")
                              .length
                      }
                    />
                  </strong>
                  <small>
                    {isDemo ? "clips approuvés" : "aucun clip prêt"}
                  </small>
                </article>
                <article>
                  <span>Missions actives</span>
                  <strong>
                    <AnimatedNumber value={missions.length} />
                  </strong>
                  <small>
                    {isDemo ? "dont 1 urgente" : "créez votre première mission"}
                  </small>
                </article>
              </div>
              <section
                className="cs2-paid-dashboard"
                aria-label="Performances du compte"
              >
                <div className="cs2-paid-dashboard-head">
                  <div>
                    <span>PERFORMANCES · 7 DERNIERS JOURS</span>
                    <h2>Vos contenus accélèrent.</h2>
                    <p>
                      {isDemo
                        ? "Aperçu des statistiques avancées disponibles dans ClipScale."
                        : `Statistiques consolidées de votre espace ${complimentaryAccess || isAdmin ? "Agency" : plan}.`}
                    </p>
                  </div>
                  <div className="cs2-live-badge">
                    <i />{" "}
                    {isDemo ? "Données d’exemple" : "Données synchronisées"}
                  </div>
                </div>
                <div className="cs2-growth-kpis">
                  <article>
                    <span>Vues cumulées</span>
                    <strong>
                      <AnimatedNumber value={isDemo ? 38200 : 0} />
                    </strong>
                    <small>
                      {isDemo
                        ? "↗ 24,8% cette semaine"
                        : "En attente de vos publications"}
                    </small>
                  </article>
                  <article>
                    <span>Taux d’engagement</span>
                    <strong>
                      <AnimatedNumber
                        value={isDemo ? 8.4 : 0}
                        decimals={1}
                        suffix="%"
                      />
                    </strong>
                    <small>
                      {isDemo ? "↗ 1,2 point" : "Aucune donnée disponible"}
                    </small>
                  </article>
                  <article>
                    <span>Abonnés gagnés</span>
                    <strong>
                      <AnimatedNumber
                        value={isDemo ? 1284 : 0}
                        prefix={isDemo ? "+" : ""}
                      />
                    </strong>
                    <small>
                      {isDemo
                        ? "↗ 18,6% cette semaine"
                        : "Aucune progression mesurée"}
                    </small>
                  </article>
                </div>
                <div className="cs2-chart-card">
                  <header>
                    <div>
                      <b>Évolution des vues</b>
                      <span>Instagram · TikTok · YouTube · Facebook</span>
                    </div>
                    <strong>—</strong>
                  </header>
                  <div className="cs11-empty-chart">
                    <span>↗</span>
                    <b>Vos performances apparaîtront ici.</b>
                    <p>
                      Connectez un réseau puis publiez votre premier clip pour
                      commencer le suivi.
                    </p>
                    <button onClick={() => changeView("publish")}>
                      Préparer une publication →
                    </button>
                  </div>
                </div>
                <div className="cs2-channel-performance">
                  {[
                    ["instagram", isDemo ? 42 : 0],
                    ["tiktok", isDemo ? 31 : 0],
                    ["youtube", isDemo ? 18 : 0],
                    ["facebook", isDemo ? 9 : 0],
                  ].map(([id, share]) => {
                    const network = socialPlatforms.find(
                      (item) => item.id === id,
                    )!;
                    return (
                      <article key={String(id)}>
                        <SocialIcon platform={network} />
                        <div>
                          <b>{network.name}</b>
                          <span>
                            <i style={{ width: `${share}%` }} />
                          </span>
                        </div>
                        <strong>{share}%</strong>
                      </article>
                    );
                  })}
                </div>
              </section>
              <div className="cs2-grid-2">
                <article className="cs2-panel">
                  <div className="cs2-panel-head">
                    <div>
                      <h2>Priorités du jour</h2>
                      <p>Commencez par ces actions.</p>
                    </div>
                    <span>{isDemo ? "2 actions" : "0 action"}</span>
                  </div>
                  {isDemo ? (
                    <>
                      <button
                        className="cs2-priority"
                        onClick={() => changeView("clips")}
                      >
                        <i className="violet" />
                        <div>
                          <b>Valider 7 clips</b>
                          <span>Nova Studio · Podcast Fondateurs #12</span>
                        </div>
                        <em>Voir les clips →</em>
                      </button>
                      <button
                        className="cs2-priority"
                        onClick={() => changeView("missions")}
                      >
                        <i className="blue" />
                        <div>
                          <b>Compléter un brief</b>
                          <span>Maison Lune · Lancement collection été</span>
                        </div>
                        <em>Voir la mission →</em>
                      </button>
                    </>
                  ) : (
                    <div className="cs11-empty-panel">
                      <span>✓</span>
                      <b>Aucune action en attente.</b>
                      <p>
                        Vos validations et échéances importantes seront
                        regroupées ici.
                      </p>
                    </div>
                  )}
                </article>
                <article className="cs2-panel">
                  <div className="cs2-panel-head">
                    <div>
                      <h2>Production</h2>
                      <p>Avancement des missions actives.</p>
                    </div>
                    <button onClick={() => changeView("missions")}>
                      Tout voir
                    </button>
                  </div>
                  {missions.length ? (
                    missions.slice(0, 3).map((mission) => (
                      <div className="cs2-progress-row" key={mission.id}>
                        <span className={`cs2-client-dot ${mission.tone}`}>
                          {mission.client[0]}
                        </span>
                        <div>
                          <b>{mission.title}</b>
                          <small>{mission.client}</small>
                        </div>
                        <div className="cs2-progress">
                          <i
                            style={{
                              width: `${Math.max(10, (Number(mission.clips.split("/")[0]) / Number(mission.clips.split("/")[1])) * 100)}%`,
                            }}
                          />
                        </div>
                        <strong>{mission.clips}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="cs11-empty-panel">
                      <span>▣</span>
                      <b>Aucune mission active.</b>
                      <p>
                        Créez une mission pour lancer votre première production.
                      </p>
                      <button onClick={() => setShowCreate(true)}>
                        + Nouvelle mission
                      </button>
                    </div>
                  )}
                </article>
              </div>
            </>
          )}

          {view === "missions" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>PRODUCTION</span>
                  <h1>Missions</h1>
                  <p>Suivez chaque campagne du brief à la livraison.</p>
                </div>
                <button
                  className="cs2-button"
                  onClick={() => setShowCreate(true)}
                >
                  + Nouvelle mission
                </button>
              </div>
              <div className="cs2-panel cs2-table-panel">
                <div className="cs2-toolbar">
                  <div className="cs2-search">
                    ⌕{" "}
                    <input
                      aria-label="Rechercher une mission"
                      placeholder="Rechercher une mission…"
                    />
                  </div>
                  <span>{missions.length} missions</span>
                </div>
                <div className="cs2-table cs2-mission-table">
                  <div className="cs2-tr cs2-th">
                    <span>Mission</span>
                    <span>Statut</span>
                    <span>Progression</span>
                    <span>Échéance</span>
                    <span />
                  </div>
                  {missions.map((mission) => (
                    <div className="cs2-tr" key={mission.id}>
                      <span className="cs2-main-cell">
                        <i className={`cs2-client-dot ${mission.tone}`}>
                          {mission.client[0]}
                        </i>
                        <span>
                          <b>{mission.title}</b>
                          <small>{mission.client}</small>
                        </span>
                      </span>
                      <span>
                        <Status>{mission.status}</Status>
                      </span>
                      <span>
                        <b>{mission.clips}</b> clips
                      </span>
                      <span>{mission.due}</span>
                      <button
                        onClick={() =>
                          notify(
                            isDemo
                              ? "Mission ouverte dans l’aperçu"
                              : "Mission ouverte",
                          )
                        }
                      >
                        Ouvrir →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === "clips" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>CONTENT OPERATING SYSTEM</span>
                  <h1>Clips</h1>
                  <p>
                    Repérez immédiatement les contenus à fort potentiel, les
                    erreurs à corriger et la prochaine action.
                  </p>
                </div>
                <button
                  className="cs2-button"
                  onClick={() => changeView("virality")}
                >
                  ✦ Nouvelle analyse
                </button>
              </div>
              {failedJobs.length > 0 && (
                <div className="cs15-failed-jobs" role="status">
                  <div><b>Certains traitements nécessitent votre attention</b><span>Les crédits ont été restitués après l’échec. Vous pouvez relancer jusqu’à la limite indiquée.</span></div>
                  {failedJobs.map((job) => (
                    <article key={job.id}>
                      <span>{job.error_message || "Traitement interrompu"}</span>
                      <small>Tentative {job.attempts}/{job.max_attempts}</small>
                      <button onClick={() => void retryProcessingJob(job.id)} disabled={job.attempts >= job.max_attempts}>{job.attempts >= job.max_attempts ? "Limite atteinte" : "Relancer"}</button>
                    </article>
                  ))}
                </div>
              )}
              <div className="cs8-clip-summary">
                <article>
                  <span>Score moyen</span>
                  <strong>
                    <AnimatedNumber value={clipMetrics.score} suffix="/100" />
                  </strong>
                  <small>
                    {clips.length
                      ? `${clips.length} clip${clips.length > 1 ? "s" : ""} analysé${clips.length > 1 ? "s" : ""}`
                      : "Aucun clip analysé"}
                  </small>
                </article>
                <article>
                  <span>Rétention estimée</span>
                  <strong>
                    <AnimatedNumber value={clipMetrics.retention} suffix="%" />
                  </strong>
                  <small>
                    {clips.length
                      ? "Moyenne des diagnostics"
                      : "En attente d’une analyse"}
                  </small>
                </article>
                <article>
                  <span>Prêts à publier</span>
                  <strong>
                    <AnimatedNumber value={clipMetrics.ready} suffix=" clips" />
                  </strong>
                  <small>
                    {clipMetrics.ready
                      ? "Validés dans votre bibliothèque"
                      : "Aucun clip prêt"}
                  </small>
                </article>
                <article>
                  <span>Erreur prioritaire</span>
                  <strong>
                    {clips.length && clipMetrics.score < 70 ? "Potentiel" : "—"}
                  </strong>
                  <small>
                    {clips.length
                      ? "Calculé sur vos vrais diagnostics"
                      : "Aucune erreur détectée"}
                  </small>
                </article>
              </div>
              <div className="cs2-filter-row">
                {["Tous", "Montage", "À valider", "Approuvé", "Publié"].map(
                  (filter) => (
                    <button
                      className={clipFilter === filter ? "active" : ""}
                      onClick={() => setClipFilter(filter)}
                      key={filter}
                    >
                      {filter}
                    </button>
                  ),
                )}
              </div>
              <div className="cs2-clip-grid cs8-clip-grid">
                {filteredClips.length ? (
                  filteredClips.map((clip, index) => (
                    <article
                      className="cs2-clip-card cs8-clip-card"
                      key={clip.id}
                    >
                      <div
                        className={`cs2-video-placeholder cs8-thumb ${clip.tone}`}
                      >
                        <span>▶</span>
                        <div>
                          <b>{String(index + 1).padStart(2, "0")}</b>
                          <em>
                            {clip.score >= 85
                              ? "TOP POTENTIEL"
                              : clip.score >= 72
                                ? "À OPTIMISER"
                                : "À RETRAVAILLER"}
                          </em>
                        </div>
                        <small>{clip.format}</small>
                      </div>
                      <div className="cs2-clip-info">
                        <div className="cs8-clip-top">
                          <Status>{clip.status}</Status>
                          <span
                            className={clip.score >= 80 ? "high" : "medium"}
                          >
                            <b>{clip.score}</b>/100
                          </span>
                        </div>
                        <h3>{clip.title}</h3>
                        <p>{clip.mission}</p>
                        <div className="cs8-mini-metrics">
                          <span>
                            <small>RÉTENTION</small>
                            <b>{clip.retention}%</b>
                            <i>
                              <em style={{ width: `${clip.retention}%` }} />
                            </i>
                          </span>
                          <span>
                            <small>EXTRAIT</small>
                            <b>
                              {Math.round(clip.start)}–{Math.round(clip.end)} s
                            </b>
                          </span>
                        </div>
                        <div className="cs8-card-actions cs15-card-actions">
                          <button onClick={() => void openClipEditor(clip)}>
                            Modifier
                          </button>
                          <button
                            onClick={() => exportClip(clip)}
                            disabled={clipExporting === clip.id}
                          >
                            {clipExporting === clip.id
                              ? "Export…"
                              : "Télécharger"}
                          </button>
                          <button
                            onClick={() => void advanceClip(clip.id)}
                            disabled={clip.status === "Publié"}
                          >
                            {clip.status === "Publié"
                              ? "✓ Publié"
                              : "Étape suivante →"}
                          </button>
                          <button
                            className="danger"
                            onClick={() => void deleteSourceVideo(clip)}
                          >
                            Supprimer la source
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="cs11-empty-clips">
                    <span>▶</span>
                    <h2>Votre bibliothèque est vide.</h2>
                    <p>
                      Importez votre premier clip pour obtenir son score, sa
                      rétention estimée et les améliorations prioritaires.
                    </p>
                    <button
                      className="cs2-button"
                      onClick={() => changeView("virality")}
                    >
                      Analyser mon premier clip →
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {view === "virality" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>ANALYSE AUTOMATIQUE</span>
                  <h1>Score de viralité</h1>
                  <p>
                    Importez un clip et obtenez un diagnostic immédiatement
                    exploitable.
                  </p>
                </div>
              </div>
              <div className="cs2-viral-layout">
                <section className="cs2-panel cs2-analyzer">
                  <div className="cs2-analyzer-head">
                    <span className="cs2-ai-icon">↗</span>
                    <div>
                      <h2>Analysez votre prochain clip</h2>
                      <p>
                        La vidéo reste sur votre appareil pendant l’analyse et
                        n’est jamais envoyée sans action de votre part.
                      </p>
                    </div>
                  </div>
                  {!videoUrl ? (
                    <label className="cs2-upload-zone">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={selectVideo}
                      />
                      <span>＋</span>
                      <strong>Déposez votre vidéo ici</strong>
                      <small>MP4, MOV ou WebM · 500 Mo maximum</small>
                      <b>Choisir un clip</b>
                    </label>
                  ) : (
                    <div className="cs2-uploaded-video">
                      <video
                        ref={analysisVideoRef}
                        src={videoUrl}
                        controls
                        playsInline
                      />
                      <div>
                        <strong>
                          {videoMeta?.name ?? "Chargement de la vidéo…"}
                        </strong>
                        {videoMeta && (
                          <small>
                            {videoMeta.duration} s · {videoMeta.width} ×{" "}
                            {videoMeta.height} px ·{" "}
                            {(videoMeta.size / 1048576).toFixed(1)} Mo
                          </small>
                        )}
                        <small
                          className={`cs15-upload-state ${videoUploadState}`}
                        >
                          {videoUploadState === "uploading"
                            ? `◷ Sauvegarde sécurisée · ${videoUploadProgress}%`
                            : videoUploadState === "ready"
                              ? "✓ Vidéo enregistrée dans votre espace"
                              : videoUploadState === "error"
                                ? "⚠ Sauvegarde indisponible — analyse locale possible"
                                : ""}
                        </small>
                        <label>
                          Remplacer
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={selectVideo}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                  <div className="cs2-analyzer-form">
                    <label>
                      Plateforme cible
                      <select
                        value={platform}
                        onChange={(event) => setPlatform(event.target.value)}
                      >
                        <option>TikTok</option>
                        <option>Instagram Reels</option>
                        <option>YouTube Shorts</option>
                      </select>
                    </label>
                    <label>
                      Accroche des premières secondes
                      <textarea
                        value={hook}
                        onChange={(event) => setHook(event.target.value)}
                        placeholder="Ex. Cette erreur m’a fait perdre 10 000 €…"
                        maxLength={140}
                      />
                      <small>{hook.length}/140</small>
                    </label>
                  </div>
                  <button
                    className="cs2-button cs2-analyze-button"
                    onClick={() => void analyzeVideo()}
                    disabled={!videoMeta || isAnalyzing}
                  >
                    {isAnalyzing
                      ? "Analyse OpenAI en cours…"
                      : videoMeta
                        ? "Analyser avec OpenAI →"
                        : "Ajoutez une vidéo pour commencer"}
                  </button>
                  <p className="cs2-analysis-note">
                    Le score est une estimation basée sur le format, la durée,
                    la qualité et l’accroche. Il ne garantit pas les
                    performances réelles.
                  </p>
                </section>

                <section
                  className={`cs2-panel cs2-analysis-result ${analysis ? "ready" : ""}`}
                  aria-live="polite"
                >
                  {!analysis ? (
                    <div className="cs2-empty-analysis">
                      <span>◎</span>
                      <h2>Votre diagnostic apparaîtra ici</h2>
                      <p>
                        Ajoutez une vidéo et son accroche pour obtenir le score,
                        les points forts et les améliorations prioritaires.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="cs2-score-header">
                        <div
                          className="cs2-score-ring"
                          style={
                            {
                              "--score": `${analysis.score * 3.6}deg`,
                            } as CSSProperties
                          }
                        >
                          <span>
                            <strong>{analysis.score}</strong>
                            <small>/100</small>
                          </span>
                        </div>
                        <div>
                          <span className="cs2-potential-label">
                            {analysis.verdict} · ANALYSE #{analysis.run} ·{" "}
                            {analysisProvider === "openai"
                              ? "OPENAI"
                              : "DIAGNOSTIC LOCAL"}
                          </span>
                          <h2>Potentiel viral estimé</h2>
                          <p>{analysis.summary}</p>
                        </div>
                      </div>
                      <div className="cs8-analysis-kpis">
                        <span>
                          <small>RÉTENTION ESTIMÉE</small>
                          <strong>{analysis.retention}%</strong>
                        </span>
                        <span>
                          <small>CONFIANCE DU DIAGNOSTIC</small>
                          <strong>{analysis.confidence}%</strong>
                        </span>
                        <span>
                          <small>ERREURS DÉTECTÉES</small>
                          <strong>{analysis.improvements.length}</strong>
                        </span>
                      </div>
                      <div className="cs2-factor-list">
                        <h3>Détail du score</h3>
                        {analysis.factors.map((factor) => (
                          <div className="cs2-factor" key={factor.label}>
                            <div>
                              <b>{factor.label}</b>
                              <span>{factor.detail}</span>
                              <strong>{factor.score}%</strong>
                            </div>
                            <div>
                              <i style={{ width: `${factor.score}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="cs8-strengths">
                        <h3>Ce qui fonctionne déjà</h3>
                        {analysis.strengths.map((item) => (
                          <p key={item}>
                            <span>✓</span>
                            {item}
                          </p>
                        ))}
                      </div>
                      <div className="cs2-improvements">
                        <h3>Comment l’améliorer</h3>
                        {analysis.improvements.map((item, index) => (
                          <article key={item}>
                            <b>{index + 1}</b>
                            <p>{item}</p>
                          </article>
                        ))}
                      </div>
                      <button
                        className="cs2-button cs15-generate-clips"
                        onClick={() => void generateClipPlan()}
                        disabled={!videoRecordId}
                      >
                        ✂ Générer mes extraits vidéo →
                      </button>
                      <button
                        className="cs2-secondary-action cs8-rerun"
                        onClick={() => void analyzeVideo()}
                      >
                        ↻ Recalculer l’analyse
                      </button>
                      <button
                        className="cs2-secondary-action"
                        onClick={() => {
                          setAnalysis(null);
                          setHook("");
                        }}
                      >
                        Analyser une autre version
                      </button>
                    </>
                  )}
                </section>
              </div>
            </>
          )}

          {view === "publish" && (
            <>
              <div className="cs2-page-title cs2-publish-title">
                <div>
                  <span>DIFFUSION MULTICANALE</span>
                  <h1>Publiez partout, en une fois.</h1>
                  <p>
                    Ajoutez votre vidéo, choisissez les réseaux et préparez une
                    publication groupée.
                  </p>
                </div>
                <span className="cs2-setup-badge">Mode configuration</span>
              </div>
              <div className="cs2-publish-guide">
                <span>4 étapes guidées</span>
                <p>
                  Rien n’est publié sans votre confirmation. Chaque texte reste
                  modifiable avant l’envoi.
                </p>
              </div>
              <div
                className="cs2-publish-steps"
                aria-label="Étapes de publication"
              >
                <span className={publishUrl ? "done" : "active"}>
                  <b>{publishUrl ? "✓" : "1"}</b> Vidéo
                </span>
                <i />
                <span
                  className={
                    selectedPlatforms.length
                      ? "done"
                      : publishUrl
                        ? "active"
                        : ""
                  }
                >
                  <b>{selectedPlatforms.length ? "✓" : "2"}</b> Réseaux
                </span>
                <i />
                <span
                  className={
                    allCopiesReady ? "done" : publishCaption ? "active" : ""
                  }
                >
                  <b>{allCopiesReady ? "✓" : "3"}</b> Variantes
                </span>
                <i />
                <span className={publishReady ? "active" : ""}>
                  <b>4</b> Confirmation
                </span>
              </div>
              <div className="cs2-publish-layout">
                <div className="cs2-publish-main">
                  <section className="cs2-panel cs2-publish-section">
                    <div className="cs2-publish-section-head">
                      <span>1</span>
                      <div>
                        <h2>Ajoutez votre vidéo</h2>
                        <p>
                          Importez le fichier final. ClipScale vérifie son
                          cadrage avant la préparation.
                        </p>
                      </div>
                      {publishUrl && <b>Prête</b>}
                    </div>
                    {!publishUrl ? (
                      <label className="cs2-publish-drop">
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={selectPublishVideo}
                        />
                        <span>↑</span>
                        <strong>Déposez votre vidéo ici</strong>
                        <small>
                          MP4, MOV ou WebM · vertical 9:16 recommandé
                        </small>
                        <b>Choisir une vidéo</b>
                      </label>
                    ) : (
                      <div className="cs2-publish-preview">
                        <video src={publishUrl} controls playsInline />
                        <div>
                          <span>VIDÉO AJOUTÉE</span>
                          <strong>{publishFileName}</strong>
                          <small>
                            {publishVideoMeta
                              ? `${publishVideoMeta.width} × ${publishVideoMeta.height} px · ${publishVideoMeta.duration} s · ${(publishVideoMeta.size / 1048576).toFixed(1)} Mo`
                              : "Lecture des informations…"}
                          </small>
                          <small>
                            {publishVideoMeta &&
                            publishVideoMeta.height <= publishVideoMeta.width
                              ? "⚠ Format horizontal : vérifiez le recadrage avant l’envoi."
                              : "✓ Le format vertical convient à Reels, TikTok et Shorts."}
                          </small>
                          <label>
                            Remplacer la vidéo
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime,video/webm"
                              onChange={selectPublishVideo}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="cs2-panel cs2-publish-section">
                    <div className="cs2-publish-section-head">
                      <span>2</span>
                      <div>
                        <h2>Choisissez les réseaux</h2>
                        <p>
                          Cochez les destinations voulues. Chaque carte indique
                          le format recommandé.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next =
                            selectedPlatforms.length === socialPlatforms.length
                              ? []
                              : socialPlatforms.map((item) => item.id);
                          setSelectedPlatforms(next);
                          setActiveCustomize(next[0] ?? "instagram");
                        }}
                      >
                        {selectedPlatforms.length === socialPlatforms.length
                          ? "Tout retirer"
                          : "Tout sélectionner"}
                      </button>
                    </div>
                    <div className="cs2-selection-count">
                      <b>{selectedPlatforms.length}</b> destination
                      {selectedPlatforms.length > 1 ? "s" : ""} sélectionnée
                      {selectedPlatforms.length > 1 ? "s" : ""}
                    </div>
                    <div className="cs2-platform-grid">
                      {socialPlatforms.map((item) => {
                        const checked = selectedPlatforms.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            className={checked ? "selected" : ""}
                            aria-pressed={checked}
                            aria-label={`${checked ? "Retirer" : "Ajouter"} ${item.name}`}
                            onClick={() => togglePlatform(item.id)}
                          >
                            <SocialIcon platform={item} />
                            <span>
                              <b>{item.name}</b>
                              <small>
                                {item.format} · {item.ratio}
                              </small>
                            </span>
                            <i>{checked ? "✓" : "+"}</i>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="cs2-panel cs2-publish-section">
                    <div className="cs2-publish-section-head">
                      <span>3</span>
                      <div>
                        <h2>Adaptez le message</h2>
                        <p>
                          Écrivez l’idée principale une seule fois, puis générez
                          une variante pour chaque réseau.
                        </p>
                      </div>
                      {allCopiesReady && <b>Variantes prêtes</b>}
                    </div>
                    <label className="cs2-publish-field">
                      Message de départ
                      <textarea
                        value={publishCaption}
                        onChange={(event) => {
                          setPublishCaption(event.target.value);
                          setAdaptedPlatforms([]);
                        }}
                        maxLength={2200}
                        placeholder="Ex. Cette erreur coûte des heures aux créateurs. Voici comment l’éviter…"
                      />
                      <small>{publishCaption.length}/2200</small>
                    </label>
                    <div className="cs2-adapt-toolbar">
                      <div>
                        <b>Une base, plusieurs tons</b>
                        <small>
                          ClipScale ajuste la longueur, le style et l’appel à
                          l’action.
                        </small>
                      </div>
                      <button
                        type="button"
                        className="cs2-adapt-button"
                        disabled={
                          !publishCaption.trim() || !selectedPlatforms.length
                        }
                        onClick={adaptCopies}
                      >
                        ✦ Générer {selectedPlatforms.length || "les"} variante
                        {selectedPlatforms.length > 1 ? "s" : ""}
                      </button>
                    </div>
                    {adaptedPlatforms.length > 0 ? (
                      <div className="cs2-customize-shell">
                        <div
                          className="cs2-platform-tabs"
                          role="tablist"
                          aria-label="Variantes par réseau"
                        >
                          {socialPlatforms
                            .filter((item) =>
                              selectedPlatforms.includes(item.id),
                            )
                            .map((item) => (
                              <button
                                key={item.id}
                                role="tab"
                                aria-selected={activeCustomize === item.id}
                                className={
                                  activeCustomize === item.id ? "active" : ""
                                }
                                onClick={() => setActiveCustomize(item.id)}
                              >
                                <SocialIcon platform={item} />
                                <span>{item.name}</span>
                                <i>✓</i>
                              </button>
                            ))}
                        </div>
                        <div className="cs2-platform-editor" role="tabpanel">
                          <header>
                            <SocialIcon platform={activePlatform} />
                            <div>
                              <h3>Version {activePlatform.name}</h3>
                              <p>
                                {activePlatform.format} · format conseillé{" "}
                                {activePlatform.ratio}
                              </p>
                            </div>
                            <span>ADAPTÉE</span>
                          </header>
                          {activePlatform.id === "youtube" && (
                            <label className="cs2-publish-field">
                              Titre YouTube <em>Obligatoire</em>
                              <input
                                value={youtubeTitle}
                                onChange={(event) =>
                                  setYoutubeTitle(event.target.value)
                                }
                                maxLength={100}
                                placeholder="Ex. 3 erreurs qui bloquent votre croissance"
                              />
                              <small>{youtubeTitle.length}/100</small>
                            </label>
                          )}
                          <label className="cs2-publish-field">
                            Texte pour {activePlatform.name}
                            <textarea
                              value={platformCopies[activePlatform.id] ?? ""}
                              onChange={(event) => {
                                setPlatformCopies((current) => ({
                                  ...current,
                                  [activePlatform.id]: event.target.value,
                                }));
                                setAdaptedPlatforms((current) =>
                                  current.includes(activePlatform.id)
                                    ? current
                                    : [...current, activePlatform.id],
                                );
                              }}
                              maxLength={2200}
                            />
                            <small
                              className={
                                (platformCopies[activePlatform.id]?.length ??
                                  0) > activePlatform.recommendedLength
                                  ? "warning"
                                  : ""
                              }
                            >
                              {platformCopies[activePlatform.id]?.length ?? 0} /{" "}
                              {activePlatform.recommendedLength} conseillés
                            </small>
                          </label>
                          <div className="cs2-platform-requirements">
                            <span>
                              <b>{activePlatform.ratio}</b>
                              <small>Cadrage</small>
                            </span>
                            <span>
                              <b>CC</b>
                              <small>Sous-titres</small>
                            </span>
                            <span>
                              <b>◎</b>
                              <small>Zone sûre</small>
                            </span>
                          </div>
                          <ul>
                            {activePlatform.tips.map((tip) => (
                              <li key={tip}>✓ {tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="cs2-adapt-empty">
                        <span>✦</span>
                        <div>
                          <b>Vos variantes apparaîtront ici</b>
                          <p>
                            Vous pourrez relire et modifier chaque version avant
                            de continuer.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="cs2-format-tip">
                      <span>◎</span>
                      <p>
                        <b>À vérifier dans la vidéo</b> Gardez le texte
                        important au centre, ajoutez des sous-titres et évitez
                        les filigranes d’une autre plateforme.
                      </p>
                    </div>
                  </section>

                  <section className="cs2-panel cs2-publish-section">
                    <div className="cs2-publish-section-head">
                      <span>4</span>
                      <div>
                        <h2>Choisissez le moment</h2>
                        <p>
                          Publiez dès validation ou programmez une date précise.
                        </p>
                      </div>
                    </div>
                    <div className="cs2-publish-choice">
                      <button
                        className={publishMode === "now" ? "active" : ""}
                        onClick={() => setPublishMode("now")}
                      >
                        <b>⚡ Maintenant</b>
                        <small>
                          Lancement dès que les comptes sont autorisés
                        </small>
                      </button>
                      <button
                        className={publishMode === "schedule" ? "active" : ""}
                        onClick={() => setPublishMode("schedule")}
                      >
                        <b>◷ Programmer</b>
                        <small>Choisissez votre date et votre heure</small>
                      </button>
                    </div>
                    {publishMode === "schedule" && (
                      <label className="cs2-publish-field cs2-date-field">
                        Date et heure
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(event) =>
                            setScheduledAt(event.target.value)
                          }
                        />
                      </label>
                    )}
                  </section>
                </div>

                <aside className="cs2-panel cs2-publish-summary">
                  <span className="cs2-summary-label">RÉSUMÉ</span>
                  <h2>Votre publication</h2>
                  <div
                    className={`cs2-summary-video ${publishUrl ? "has-video" : ""}`}
                  >
                    {publishUrl ? (
                      <video src={publishUrl} muted playsInline />
                    ) : (
                      <>
                        <span>▶</span>
                        <small>Aucune vidéo</small>
                      </>
                    )}
                  </div>
                  <div className="cs2-summary-row">
                    <span>Destinations</span>
                    <strong>{selectedPlatforms.length}</strong>
                  </div>
                  <div className="cs2-summary-networks">
                    {selectedPlatforms.length ? (
                      socialPlatforms
                        .filter((item) => selectedPlatforms.includes(item.id))
                        .map((item) => (
                          <SocialIcon platform={item} key={item.id} />
                        ))
                    ) : (
                      <small>Sélectionnez au moins un réseau.</small>
                    )}
                  </div>
                  <div className="cs2-summary-row">
                    <span>Variantes</span>
                    <strong>
                      {
                        adaptedPlatforms.filter((id) =>
                          selectedPlatforms.includes(id),
                        ).length
                      }{" "}
                      / {selectedPlatforms.length || 0} prêtes
                    </strong>
                  </div>
                  <div className="cs2-summary-row">
                    <span>Envoi</span>
                    <strong>
                      {publishMode === "now"
                        ? "Maintenant"
                        : scheduledAt
                          ? new Date(scheduledAt).toLocaleString("fr-FR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "À définir"}
                    </strong>
                  </div>
                  <button
                    className="cs2-button cs2-publish-button"
                    disabled={!publishReady}
                    onClick={() => setShowConnect(true)}
                  >
                    {publishMode === "now"
                      ? `Préparer ${selectedPlatforms.length} publication${selectedPlatforms.length > 1 ? "s" : ""}`
                      : `Programmer sur ${selectedPlatforms.length} réseau${selectedPlatforms.length > 1 ? "x" : ""}`}{" "}
                    →
                  </button>
                  {!publishReady && (
                    <p className="cs2-summary-help">
                      Ajoutez la vidéo, choisissez les réseaux, puis générez et
                      relisez les variantes.
                    </p>
                  )}
                  <div className="cs2-real-posting-note">
                    <b>Publication réelle sécurisée</b>
                    <p>
                      Chaque réseau demandera votre autorisation officielle.
                      ClipScale ne demande jamais vos mots de passe sociaux.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}

          {view === "scripts" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>STUDIO IA · SCRIPT PERSONNALISÉ</span>
                  <h1>Transformez une idée en vidéo complète.</h1>
                  <p>
                    Configurez le sujet, le style, les références et l’objectif.
                    ClipScale prépare le titre, l’accroche, le script, la
                    description et le référencement.
                  </p>
                </div>
                <button className="cs2-button" onClick={generateScript}>
                  ✦ Générer le script
                </button>
              </div>
              <div className="cs7-script-layout">
                <section className="cs2-panel cs7-script-form">
                  <header>
                    <span>01</span>
                    <div>
                      <h2>Direction créative</h2>
                      <p>
                        Plus le brief est précis, plus le résultat est cohérent
                        avec votre univers.
                      </p>
                    </div>
                  </header>
                  <label>
                    Sujet de la vidéo
                    <textarea
                      value={scriptTopic}
                      onChange={(e) => setScriptTopic(e.target.value)}
                    />
                  </label>
                  <div className="cs7-fields">
                    <label>
                      Audience
                      <input
                        value={scriptAudience}
                        onChange={(e) => setScriptAudience(e.target.value)}
                      />
                    </label>
                    <label>
                      Objectif
                      <input
                        value={scriptGoal}
                        onChange={(e) => setScriptGoal(e.target.value)}
                      />
                    </label>
                    <label>
                      Ton
                      <select
                        value={scriptTone}
                        onChange={(e) => setScriptTone(e.target.value)}
                      >
                        <option>Direct et premium</option>
                        <option>Éducatif et rassurant</option>
                        <option>Énergique et provocateur</option>
                        <option>Storytelling cinématique</option>
                        <option>Humoristique et naturel</option>
                      </select>
                    </label>
                    <label>
                      Durée
                      <select
                        value={scriptDuration}
                        onChange={(e) => setScriptDuration(e.target.value)}
                      >
                        <option>30 secondes</option>
                        <option>45 secondes</option>
                        <option>60 secondes</option>
                        <option>90 secondes</option>
                        <option>3 minutes</option>
                        <option>8 minutes</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Structure
                    <select
                      value={scriptStructure}
                      onChange={(e) => setScriptStructure(e.target.value)}
                    >
                      <option>
                        Problème → tension → solution → preuve → CTA
                      </option>
                      <option>Accroche → histoire → leçon → CTA</option>
                      <option>Liste → exemples → synthèse → CTA</option>
                      <option>
                        Opinion forte → arguments → objection → CTA
                      </option>
                    </select>
                  </label>
                  <label>
                    Chaînes et créateurs de référence
                    <textarea
                      value={scriptReferences}
                      onChange={(e) => setScriptReferences(e.target.value)}
                      placeholder="Noms ou liens YouTube/TikTok. Utilisés comme références de rythme et de structure, jamais pour copier."
                    />
                    <small>
                      ClipScale s’inspire des caractéristiques éditoriales, sans
                      reproduire les textes ni l’identité des créateurs.
                    </small>
                  </label>
                  <label>
                    Mots-clés SEO
                    <input
                      value={scriptKeywords}
                      onChange={(e) => setScriptKeywords(e.target.value)}
                    />
                  </label>
                  <label>
                    Appel à l’action
                    <input
                      value={scriptCta}
                      onChange={(e) => setScriptCta(e.target.value)}
                    />
                  </label>
                  <button
                    className="cs2-button cs7-generate"
                    onClick={generateScript}
                  >
                    ✦ Générer une version personnalisée
                  </button>
                </section>
                <section
                  className="cs2-panel cs7-script-output"
                  aria-live="polite"
                >
                  {generatedScript ? (
                    <>
                      <div className="cs7-output-top">
                        <span>VERSION 01 · {scriptTone.toUpperCase()}</span>
                        <button
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(
                                [
                                  generatedScript.title,
                                  generatedScript.hook,
                                  ...generatedScript.body,
                                  generatedScript.description,
                                ].join("\n\n"),
                              )
                              .then(() => notify("Script copié"))
                          }
                        >
                          Copier tout
                        </button>
                      </div>
                      <article>
                        <small>TITRE DE LA VIDÉO</small>
                        <h2>{generatedScript.title}</h2>
                      </article>
                      <article className="hook">
                        <small>ACCROCHE</small>
                        <p>{generatedScript.hook}</p>
                      </article>
                      <article>
                        <small>SCRIPT DÉCOUPÉ PAR SCÈNE</small>
                        <div className="cs7-scenes">
                          {generatedScript.body.map((line, index) => (
                            <p key={line}>
                              <b>0{index + 1}</b>
                              <span>{line}</span>
                            </p>
                          ))}
                        </div>
                      </article>
                      <article>
                        <small>TITRE SEO</small>
                        <p>{generatedScript.seoTitle}</p>
                      </article>
                      <article>
                        <small>DESCRIPTION RÉFÉRENCÉE</small>
                        <p>{generatedScript.description}</p>
                      </article>
                      <div className="cs7-tags">
                        {generatedScript.tags.map((tag) => (
                          <span key={tag}>#{tag.replaceAll(" ", "")}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="cs7-script-empty">
                      <span>✦</span>
                      <h2>Votre script apparaîtra ici.</h2>
                      <p>
                        Vous obtiendrez un résultat structuré, modifiable et
                        prêt à tourner.
                      </p>
                      <ul>
                        <li>Un titre orienté clic</li>
                        <li>Une accroche pour les premières secondes</li>
                        <li>Un découpage scène par scène</li>
                        <li>Une description et des mots-clés SEO</li>
                      </ul>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {view === "admin" && isAdmin && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>ACCÈS PROPRIÉTAIRE SÉCURISÉ</span>
                  <h1>Administration</h1>
                  <p>
                    Accordez ou retirez un accès gratuit complet à ClipScale
                    depuis une simple adresse e-mail.
                  </p>
                </div>
                <span className="cs7-admin-live">● Propriétaire actif</span>
                <button
                  className="cs2-button"
                  onClick={() =>
                    notify("Vous êtes déjà dans le centre de commande")
                  }
                >
                  Centre de commande actif
                </button>
              </div>
              <div className="cs7-admin-kpis">
                <article>
                  <span>Accès offerts</span>
                  <strong>
                    <AnimatedNumber
                      value={accessGrants.filter((item) => item.active).length}
                    />
                  </strong>
                  <small>comptes actuellement actifs</small>
                </article>
                <article>
                  <span>Accès suspendus</span>
                  <strong>
                    <AnimatedNumber
                      value={accessGrants.filter((item) => !item.active).length}
                    />
                  </strong>
                  <small>réactivables à tout moment</small>
                </article>
                <article>
                  <span>Niveau attribué</span>
                  <strong>Agency</strong>
                  <small>toutes les fonctions incluses</small>
                </article>
                <article>
                  <span>Activation</span>
                  <strong>Instantanée</strong>
                  <small>à la prochaine connexion</small>
                </article>
              </div>
              <div className="cs9-admin-access">
                <section className="cs2-panel cs9-grant-form">
                  <div className="cs9-admin-heading">
                    <span>01</span>
                    <div>
                      <h2>Offrir un accès complet</h2>
                      <p>
                        La personne devra créer son compte ou se connecter avec
                        exactement cette adresse.
                      </p>
                    </div>
                  </div>
                  <label>
                    Adresse e-mail
                    <input
                      type="email"
                      value={grantEmail}
                      onChange={(event) => setGrantEmail(event.target.value)}
                      placeholder="client@exemple.com"
                    />
                  </label>
                  <label>
                    Note interne — facultatif
                    <input
                      value={grantNote}
                      onChange={(event) => setGrantNote(event.target.value)}
                      placeholder="Ex. Partenaire, créateur, bêta-testeur…"
                    />
                  </label>
                  <button
                    className="cs2-button"
                    disabled={grantSaving || !grantEmail.trim()}
                    onClick={addAccessGrant}
                  >
                    {grantSaving
                      ? "Activation…"
                      : "Activer l’accès Agency offert →"}
                  </button>
                  <div className="cs9-security-note">
                    <b>Accès sécurisé</b>
                    <p>
                      Aucun mot de passe client n’est créé ou partagé. Chaque
                      accès reste lié à l’adresse enregistrée et peut être
                      suspendu instantanément.
                    </p>
                  </div>
                </section>
                <section className="cs2-panel cs9-grant-list">
                  <div className="cs9-admin-heading">
                    <span>02</span>
                    <div>
                      <h2>Accès accordés</h2>
                      <p>
                        {accessGrants.length
                          ? `${accessGrants.length} adresse${accessGrants.length > 1 ? "s" : ""} enregistrée${accessGrants.length > 1 ? "s" : ""}`
                          : "Aucun accès offert pour le moment"}
                      </p>
                    </div>
                  </div>
                  {accessGrants.length ? (
                    <div className="cs9-access-rows">
                      {accessGrants.map((grant) => (
                        <article
                          key={grant.id}
                          className={grant.active ? "active" : "paused"}
                        >
                          <div className="cs9-access-avatar">
                            {grant.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <b>{grant.email}</b>
                            <span>
                              {grant.note || "Accès gratuit complet"} ·{" "}
                              {new Date(grant.created_at).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                          </div>
                          <em>{grant.active ? "Agency offert" : "Suspendu"}</em>
                          <button
                            onClick={() => toggleAccessGrant(grant)}
                            disabled={grant.email.toLowerCase() === OWNER_EMAIL}
                          >
                            {grant.email.toLowerCase() === OWNER_EMAIL
                              ? "Propriétaire"
                              : grant.active
                                ? "Suspendre"
                                : "Réactiver"}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="cs9-empty-access">
                      <span>✦</span>
                      <b>La liste est vide.</b>
                      <p>Ajoutez votre première adresse avec le formulaire.</p>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {view === "team" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>COLLABORATION</span>
                  <h1>Équipe</h1>
                  <p>
                    Répartissez la charge avant qu’elle ne devienne un problème.
                  </p>
                </div>
                <button
                  className="cs2-button"
                  onClick={() =>
                    notify(
                      isDemo
                        ? "Invitation disponible après connexion"
                        : "Invitation préparée — renseignez l’e-mail du membre",
                    )
                  }
                >
                  Inviter un membre
                </button>
              </div>
              {isDemo ? (
                <div className="cs2-team-grid">
                  {[
                    ["Lina Morel", "LM", "Monteuse", 4, 75, "Disponible jeudi"],
                    [
                      "Yanis Cohen",
                      "YC",
                      "Clippeur",
                      3,
                      55,
                      "Disponible demain",
                    ],
                    ["Maya Laurent", "ML", "Clippeuse", 5, 90, "Charge élevée"],
                  ].map(([name, initials, role, tasks, load, availability]) => (
                    <article className="cs2-team-card" key={String(name)}>
                      <div className="cs2-team-avatar">{initials}</div>
                      <h3>{name}</h3>
                      <p>{role}</p>
                      <div>
                        <span>{tasks} clips actifs</span>
                        <strong>{load}%</strong>
                      </div>
                      <div className="cs2-load">
                        <i style={{ width: `${load}%` }} />
                      </div>
                      <small>{availability}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="cs11-empty-clips cs11-empty-team">
                  <span>◎</span>
                  <h2>Vous êtes seul pour le moment.</h2>
                  <p>
                    Invitez vos clippeurs, monteurs ou responsables clients pour
                    répartir les missions.
                  </p>
                  <button
                    className="cs2-button"
                    onClick={() =>
                      notify(
                        "Invitation préparée — renseignez l’e-mail du membre",
                      )
                    }
                  >
                    Inviter mon premier membre →
                  </button>
                </div>
              )}
            </>
          )}

          {view === "messages" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>CONVERSATIONS · CENTRALISÉES</span>
                  <h1>Messagerie</h1>
                  <p>
                    Échangez avec vos clippeurs et vos clients sans perdre les
                    décisions dans les messages privés.
                  </p>
                </div>
                <a
                  className="cs2-button cs13-link-button"
                  href="/marketplace?tab=activite"
                >
                  Voir mes candidatures
                </a>
              </div>
              <div className="cs13-messages">
                <aside>
                  <header>
                    <b>Conversations</b>
                    <span>0 non lu</span>
                  </header>
                  <div className="cs13-empty-mini">
                    <span>◇</span>
                    <b>Aucune conversation</b>
                    <p>
                      Une conversation apparaîtra dès qu’une candidature sera
                      sélectionnée.
                    </p>
                  </div>
                </aside>
                <section>
                  <div className="cs13-empty-room">
                    <span>◇</span>
                    <h2>Vos échanges restent liés à la mission.</h2>
                    <p>
                      Fichiers, validations, échéances et décisions seront
                      regroupés dans un fil unique.
                    </p>
                    <a href="/marketplace">Ouvrir la marketplace →</a>
                  </div>
                </section>
              </div>
            </>
          )}

          {view === "billing" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>PAIEMENTS ET FACTURATION</span>
                  <h1>Suivez chaque euro.</h1>
                  <p>
                    Abonnements, commissions, règlements clippeurs et factures
                    dans une vue lisible.
                  </p>
                </div>
                <button className="cs2-button" onClick={() => document.getElementById("subscription-plans")?.scrollIntoView({ behavior: "smooth" })}>
                  Choisir un forfait
                </button>
              </div>
              <section className="cs20-plans" id="subscription-plans" aria-label="Forfaits ClipScale">
                {([
                  ["starter", "Starter", "39 €", "120 min source · 30 min rendues · 1 membre"],
                  ["pro", "Pro", "89 €", "400 min source · 100 min rendues · 3 membres"],
                  ["agency", "Agency", "179 €", "1 000 min source · 250 min rendues · 10 membres"],
                ] as const).map(([plan, label, price, limits]) => (
                  <article key={plan} className={plan === "pro" ? "featured" : ""}>
                    {plan === "pro" && <span>RECOMMANDÉ</span>}
                    <h2>{label}</h2>
                    <strong>{price}<small>/mois</small></strong>
                    <p>{limits}</p>
                    <button
                      className="cs2-button"
                      disabled={Boolean(billingSubscription && ["active", "trialing"].includes(billingSubscription.status))}
                      onClick={() => void startCheckout(plan)}
                    >
                      {billingSubscription && ["active", "trialing"].includes(billingSubscription.status)
                        ? billingSubscription.plan === plan ? `${label} actif` : "Abonnement déjà actif"
                        : `Choisir ${label}`}
                    </button>
                  </article>
                ))}
              </section>
              <p className="cs20-billing-note">Activation uniquement après confirmation sécurisée de Stripe. Aucun dépassement automatique : le traitement est bloqué lorsque le quota est épuisé.</p>
              <div className="cs13-billing-kpis">
                <article>
                  <span>Solde disponible</span>
                  <strong>0 €</strong>
                  <small>Aucun règlement reçu</small>
                </article>
                <article>
                  <span>À verser</span>
                  <strong>0 €</strong>
                  <small>Aucun clip validé</small>
                </article>
                <article>
                  <span>Commissions</span>
                  <strong>0 €</strong>
                  <small>Aucune opération</small>
                </article>
                <article>
                  <span>Factures</span>
                  <strong>0</strong>
                  <small>Aucun document émis</small>
                </article>
              </div>
              <section className="cs2-panel cs13-billing-panel">
                <header>
                  <div>
                    <span>HISTORIQUE RÉEL</span>
                    <h2>Transactions</h2>
                  </div>
                  <button onClick={() => notify("Aucune facture à exporter")}>
                    Exporter
                  </button>
                </header>
                <div className="cs13-empty-payment">
                  <span>€</span>
                  <h3>Aucun mouvement pour le moment.</h3>
                  <p>
                    Vos abonnements et factures apparaîtront ici après leur
                    confirmation par Stripe. Aucun faux règlement n’est affiché.
                  </p>
                  <div>
                    <b>Protection active</b>
                    <small>
                      Paiement sécurisé · commission transparente · facture
                      automatique · suivi des litiges
                    </small>
                  </div>
                </div>
              </section>
            </>
          )}

          {view === "settings" && (
            <>
              <div className="cs2-page-title">
                <div>
                  <span>ESPACE</span>
                  <h1>Réglages</h1>
                  <p>
                    Configurez les informations principales de votre agence.
                  </p>
                </div>
              </div>
              <div className="cs2-subscription-card">
                <div>
                  <span>
                    {isAdmin
                      ? "COMPTE PROPRIÉTAIRE · ACCÈS COMPLET"
                      : complimentaryAccess
                        ? "ACCÈS OFFERT PAR L’ADMINISTRATEUR"
                        : billingSubscription?.status === "active" || billingSubscription?.status === "trialing"
                          ? `ABONNEMENT ${billingSubscription.plan.toUpperCase()} · ACTIF`
                        : userId
                          ? "COMPTE GRATUIT · TRAITEMENT VERROUILLÉ"
                          : "APERÇU INTERACTIF"}
                  </span>
                  <h2>
                    {isAdmin || complimentaryAccess
                      ? "Plan Agency"
                      : billingSubscription?.status === "active" || billingSubscription?.status === "trialing"
                        ? `Plan ${billingSubscription.plan.charAt(0).toUpperCase()}${billingSubscription.plan.slice(1)}`
                        : "Découverte ClipScale"}
                  </h2>
                  <p>
                    {isAdmin || complimentaryAccess
                      ? "Toutes les fonctionnalités Agency sont débloquées sur ce compte."
                      : billingSubscription?.status === "active" || billingSubscription?.status === "trialing"
                        ? `${billingSubscription.monthly_minutes} minutes source et ${billingSubscription.monthly_rendered_minutes} minutes rendues par mois.`
                        : "Vous pouvez découvrir l’espace. Un abonnement est requis avant tout traitement payant."}
                  </p>
                </div>
                <div>
                  <b>
                    {isAdmin || complimentaryAccess
                      ? "Complet"
                      : billingSubscription?.status === "active" || billingSubscription?.status === "trialing"
                        ? `${billingSubscription.member_limit} membre${billingSubscription.member_limit > 1 ? "s" : ""}`
                      : isDemo
                        ? "Gratuit"
                        : "0 €"}{" "}
                    <small>
                      {isAdmin
                        ? "compte propriétaire"
                        : complimentaryAccess
                          ? "accès offert"
                          : billingSubscription?.cancel_at_period_end
                            ? "annulation programmée"
                          : isDemo
                            ? "aperçu"
                            : "sans abonnement"}
                    </small>
                  </b>
                  <button onClick={exit}>Voir le site public</button>
                </div>
              </div>
              <div className="cs2-panel cs2-settings">
                <h2>Informations de l’agence</h2>
                <label>
                  Nom de l’espace
                  <input
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    maxLength={100}
                  />
                </label>
                <label>
                  Email de contact
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    maxLength={320}
                  />
                </label>
                <label>
                  Fuseau horaire
                  <select
                    value={workspaceTimezone}
                    onChange={(event) =>
                      setWorkspaceTimezone(event.target.value)
                    }
                  >
                    <option>Europe/Paris</option>
                    <option>America/New_York</option>
                  </select>
                </label>
                <button
                  className="cs2-button"
                  onClick={() => void saveWorkspaceSettings()}
                >
                  Enregistrer
                </button>
              </div>
              <div className="cs2-panel cs13-referral">
                <div>
                  <span>ACQUISITION</span>
                  <h2>Programme ambassadeur</h2>
                  <p>
                    Invitez une agence ou un clippeur avec votre lien personnel.
                    Les récompenses seront créditées après l’activation des
                    paiements.
                  </p>
                </div>
                <div>
                  <small>VOTRE CODE</small>
                  <strong>CLIP-{initials}</strong>
                  <button
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(
                          `${window.location.origin}/?ref=CLIP-${initials}`,
                        )
                        .then(() => notify("Lien de parrainage copié"))
                    }
                  >
                    Copier le lien →
                  </button>
                </div>
              </div>
              {userId && (
                <div className="cs2-panel cs2-settings">
                  <h2>Sécurité du compte</h2>
                  <p className="cs2-settings-copy">
                    Modifiez votre mot de passe directement, sans nouvelle
                    validation par e-mail.
                  </p>
                  <label>
                    Nouveau mot de passe
                    <input
                      type="password"
                      minLength={12}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="12 caractères minimum"
                    />
                  </label>
                  <button
                    className="cs2-button"
                    disabled={passwordSaving || newPassword.length < 12}
                    onClick={updatePassword}
                  >
                    {passwordSaving
                      ? "Mise à jour…"
                      : "Changer mon mot de passe"}
                  </button>
                </div>
              )}
              {userId && (
                <div className="cs2-panel cs2-settings cs19-data-rights">
                  <span>DONNÉES PERSONNELLES</span>
                  <h2>Vos données restent sous votre contrôle.</h2>
                  <p className="cs2-settings-copy">Téléchargez une copie structurée de vos informations ou demandez la suppression définitive de votre compte. Une vérification protège votre compte contre les suppressions frauduleuses.</p>
                  <div>
                    <button className="cs2-button" disabled={accountDataBusy !== null} onClick={() => void exportAccountData()}>{accountDataBusy === "export" ? "Préparation…" : "Exporter mes données"}</button>
                    <button className="cs19-danger-button" disabled={accountDataBusy !== null} onClick={() => void requestAccountDeletion()}>{accountDataBusy === "delete" ? "Enregistrement…" : "Demander la suppression"}</button>
                  </div>
                  <small>La suppression n’est jamais automatique après un simple clic : l’identité est contrôlée, les sessions sont révoquées et les fichiers actifs sont retirés.</small>
                </div>
              )}
              {userId && (
                <button className="cs4-signout" onClick={signOut}>
                  Se déconnecter
                </button>
              )}
            </>
          )}
        </section>
      </main>

      {showCreate && (
        <div
          className="cs2-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.currentTarget === event.target && setShowCreate(false)
          }
        >
          <div
            className="cs2-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-mission-title"
          >
            <button
              className="cs2-modal-close"
              onClick={() => setShowCreate(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <span>NOUVELLE MISSION</span>
            <h2 id="new-mission-title">Que faut-il produire ?</h2>
            <p>
              Créez la structure de la mission. Elle restera synchronisée avec
              votre compte.
            </p>
            <label>
              Nom de la mission
              <input
                autoFocus
                value={missionTitle}
                onChange={(event) => setMissionTitle(event.target.value)}
                maxLength={120}
                placeholder="Ex. Podcast Fondateurs #13"
              />
            </label>
            <div className="cs2-form-row">
              <label>
                Client
                <input
                  value={missionClient}
                  onChange={(event) => setMissionClient(event.target.value)}
                  maxLength={100}
                  placeholder="Nom du client"
                />
              </label>
              <label>
                Nombre de clips
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={missionTarget}
                  onChange={(event) =>
                    setMissionTarget(Number(event.target.value))
                  }
                />
              </label>
            </div>
            <label>
              Échéance
              <input
                type="date"
                value={missionDue}
                onChange={(event) => setMissionDue(event.target.value)}
              />
            </label>
            <div className="cs2-modal-actions">
              <button onClick={() => setShowCreate(false)}>Annuler</button>
              <button className="cs2-button" onClick={() => void addMission()}>
                Créer la mission
              </button>
            </div>
          </div>
        </div>
      )}
      {showConnect && (
        <div
          className="cs2-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.currentTarget === event.target && setShowConnect(false)
          }
        >
          <div
            className="cs2-modal cs2-connect-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
          >
            <button
              className="cs2-modal-close"
              onClick={() => setShowConnect(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <span>DERNIÈRE ÉTAPE</span>
            <h2 id="connect-title">Connectez vos comptes</h2>
            <p>
              La publication est prête. Pour envoyer réellement la vidéo,
              autorisez chaque réseau avec sa fenêtre officielle.
            </p>
            <div className="cs2-connect-list">
              {socialPlatforms
                .filter((item) => selectedPlatforms.includes(item.id))
                .map((item) => (
                  <div key={item.id}>
                    <SocialIcon platform={item} />
                    <b>{item.name}</b>
                    <small>À connecter</small>
                  </div>
                ))}
            </div>
            <div className="cs2-connect-security">
              <span>✓</span>
              <p>
                <b>Connexion OAuth sécurisée</b>
                <br />
                Vos identifiants restent chez Instagram, TikTok, Google, Meta et
                les autres plateformes.
              </p>
            </div>
            <div className="cs2-modal-actions">
              <button onClick={() => setShowConnect(false)}>
                Revenir au brouillon
              </button>
              <button
                className="cs2-button"
                onClick={() =>
                  notify("Intégration des comptes prête à être configurée")
                }
              >
                Configurer les connexions
              </button>
            </div>
          </div>
        </div>
      )}
      {editorClip && editorDraft && (
        <div
          className="cs2-modal-backdrop cs17-editor-backdrop"
          role="presentation"
        >
          <div
            className="cs17-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <header>
              <div>
                <span>ÉDITEUR CLIPSCALE</span>
                <h2 id="editor-title">Montage et sous-titres</h2>
              </div>
              <div>
                <button
                  onClick={undoEditor}
                  disabled={!editorUndo.length}
                  aria-label="Annuler"
                >
                  ↶
                </button>
                <button
                  onClick={redoEditor}
                  disabled={!editorRedo.length}
                  aria-label="Rétablir"
                >
                  ↷
                </button>
                <button
                  onClick={() => {
                    setEditorClip(null);
                    setEditorDraft(null);
                    setEditorVideoUrl("");
                  }}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            </header>
            <div className="cs17-editor-grid">
              <section
                className={`cs17-preview ratio-${editorDraft.aspectRatio.replace(":", "-")}`}
              >
                {editorVideoUrl ? (
                  <video
                    src={`${editorVideoUrl}#t=${editorDraft.start},${editorDraft.end}`}
                    controls
                    playsInline
                  />
                ) : (
                  <div>Chargement de la source…</div>
                )}
                <strong
                  style={{
                    color: editorDraft.captionColor,
                    fontSize: `${Math.max(18, editorDraft.fontSize / 2)}px`,
                  }}
                >
                  <em style={{ color: editorDraft.activeColor }}>
                    MOT IMPORTANT
                  </em>
                  <br />
                  sous-titres dynamiques
                </strong>
              </section>
              <section className="cs17-controls">
                <label>
                  Titre
                  <input
                    value={editorDraft.title}
                    onChange={(e) =>
                      changeEditorDraft({ title: e.target.value })
                    }
                    maxLength={120}
                  />
                </label>
                <div className="cs17-time-row">
                  <label>
                    Début
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editorDraft.start}
                      onChange={(e) =>
                        changeEditorDraft({ start: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Fin
                    <input
                      type="number"
                      min={editorDraft.start + 1}
                      step="0.1"
                      value={editorDraft.end}
                      onChange={(e) =>
                        changeEditorDraft({ end: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <div className="cs17-timeline">
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(2, ((editorDraft.end - editorDraft.start) / Math.max(editorDraft.end, 1)) * 100))}%`,
                    }}
                  />
                  <small>
                    {editorDraft.start.toFixed(1)} s →{" "}
                    {editorDraft.end.toFixed(1)} s
                  </small>
                </div>
                <div className="cs17-time-row">
                  <label>
                    Format
                    <select
                      value={editorDraft.aspectRatio}
                      onChange={(e) =>
                        changeEditorDraft({ aspectRatio: e.target.value })
                      }
                    >
                      <option>9:16</option>
                      <option>1:1</option>
                      <option>4:5</option>
                      <option>16:9</option>
                    </select>
                  </label>
                  <label>
                    Style
                    <select
                      value={editorDraft.style}
                      onChange={(e) =>
                        changeEditorDraft({ style: e.target.value })
                      }
                    >
                      <option value="clean">Sobre</option>
                      <option value="podcast">Podcast</option>
                      <option value="storytelling">Storytelling</option>
                      <option value="dynamic">Énergique</option>
                      <option value="premium">Premium</option>
                    </select>
                  </label>
                </div>
                <label>
                  Cadrage horizontal
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={editorDraft.framingX}
                    onChange={(e) =>
                      changeEditorDraft({ framingX: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Cadrage vertical
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={editorDraft.framingY}
                    onChange={(e) =>
                      changeEditorDraft({ framingY: Number(e.target.value) })
                    }
                  />
                </label>
                <div className="cs17-time-row">
                  <label>
                    Texte
                    <input
                      type="color"
                      value={editorDraft.captionColor}
                      onChange={(e) =>
                        changeEditorDraft({ captionColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Mot actif
                    <input
                      type="color"
                      value={editorDraft.activeColor}
                      onChange={(e) =>
                        changeEditorDraft({ activeColor: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  Taille des sous-titres
                  <input
                    type="range"
                    min="24"
                    max="96"
                    value={editorDraft.fontSize}
                    onChange={(e) =>
                      changeEditorDraft({ fontSize: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="cs17-check">
                  <input
                    type="checkbox"
                    checked={editorDraft.zoomEnabled}
                    onChange={(e) =>
                      changeEditorDraft({ zoomEnabled: e.target.checked })
                    }
                  />{" "}
                  Zoom automatique
                </label>
                <label className="cs17-check">
                  <input
                    type="checkbox"
                    checked={editorDraft.silenceRemoval}
                    onChange={(e) =>
                      changeEditorDraft({ silenceRemoval: e.target.checked })
                    }
                  />{" "}
                  Repérer les silences à couper
                </label>
              </section>
            </div>
            <footer>
              <small>Sauvegarde versionnée · historique conservé</small>
              <button
                onClick={() => {
                  setEditorClip(null);
                  setEditorDraft(null);
                }}
              >
                Annuler
              </button>
              <button
                className="cs2-button"
                onClick={() => void saveClipEditor()}
                disabled={editorSaving}
              >
                {editorSaving ? "Sauvegarde…" : "Sauvegarder le montage"}
              </button>
            </footer>
          </div>
        </div>
      )}
      <button
        className="cs4-support-fab"
        onClick={() => setShowSupport(true)}
        aria-label="Ouvrir le support"
      >
        <span>?</span>
        <b>Support</b>
      </button>
      {showSupport && (
        <div
          className="cs2-modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.currentTarget === event.target && setShowSupport(false)
          }
        >
          <div
            className="cs2-modal cs4-support-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
          >
            <button
              className="cs2-modal-close"
              onClick={() => setShowSupport(false)}
              aria-label="Fermer"
            >
              ×
            </button>
            <span>SUPPORT CLIPSCALE</span>
            <h2 id="support-title">Comment peut-on vous aider ?</h2>
            <p>
              {userId
                ? "Votre demande sera enregistrée dans votre espace."
                : "Connectez-vous pour envoyer une demande suivie à notre équipe."}
            </p>
            <label>
              Sujet
              <input
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Ex. Connexion Instagram"
              />
            </label>
            <label>
              Votre message
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Décrivez précisément votre question…"
              />
            </label>
            <div className="cs4-support-options">
              <button
                onClick={() => notify("Centre d’aide bientôt disponible")}
              >
                ⌕ Centre d’aide
              </button>
              <button onClick={() => notify("Email : support@clipscale.app")}>
                ✉ Nous écrire
              </button>
            </div>
            <button
              className="cs2-button"
              disabled={
                !userId ||
                supportSending ||
                !supportSubject.trim() ||
                !supportMessage.trim()
              }
              onClick={sendSupportTicket}
            >
              {supportSending
                ? "Envoi…"
                : userId
                  ? "Envoyer la demande →"
                  : "Connectez-vous pour envoyer"}
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="cs2-toast" role="status">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [inApp, setInApp] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Scale");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState("Aron Ventura");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cookieChoice, setCookieChoice] = useState<
    "accepted" | "essential" | null
  >(null);
  useEffect(() => {
    const preferencesTimer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("clipscale-theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      const savedCookies = window.localStorage.getItem(
        "clipscale-cookie-choice",
      );
      if (savedCookies === "accepted" || savedCookies === "essential")
        setCookieChoice(savedCookies);
    }, 0);
    const hydrate = async () => {
      let sessionResult = await supabase.auth.getSession();
      for (const delay of [400, 1_200]) {
        if (!sessionResult.error) break;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        sessionResult = await supabase.auth.getSession();
      }
      const { data: sessionData, error: sessionIssue } = sessionResult;
      if (sessionIssue) {
        const permanentFailure = /invalid refresh token|refresh token not found/i.test(
          sessionIssue.message,
        );
        if (permanentFailure) await supabase.auth.signOut({ scope: "local" });
        setSessionError(
          permanentFailure
            ? "Votre session a expiré. Reconnectez-vous pour continuer."
            : "La session n’a pas pu être renouvelée. Vérifiez votre connexion puis réessayez.",
        );
        setSessionLoading(false);
        return;
      }
      const session = sessionData.session;
      if (!session?.user) {
        setSessionLoading(false);
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email?.toLowerCase() ?? null);
      setUserName(
        String(
          session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Aron Ventura",
        ),
      );
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_complete,role_type")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profileError)
        setSessionError(
          "Votre session est active, mais le profil n’a pas pu être chargé. Réessayez.",
        );
      else if (
        profile?.onboarding_complete &&
        ["Agence", "Créateur", "Clippeur"].includes(String(profile.role_type))
      ) {
        setAccountRole(profile.role_type as AccountRole);
        setInApp(true);
      } else setShowOnboarding(true);
      setSessionLoading(false);
    };
    void hydrate();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUserId(null);
        setUserEmail(null);
        setAccountRole(null);
        setInApp(false);
        setShowOnboarding(false);
      }
    });
    return () => {
      window.clearTimeout(preferencesTimer);
      data.subscription.unsubscribe();
    };
  }, []);
  const openAuthenticatedApp = async (id: string) => {
    const { data: authData } = await supabase.auth.getUser();
    setUserId(id);
    setUserEmail(authData.user?.email?.toLowerCase() ?? null);
    setUserName(
      String(
        authData.user?.user_metadata?.full_name ||
          authData.user?.user_metadata?.name ||
          authData.user?.email?.split("@")[0] ||
          "Aron Ventura",
      ),
    );
    setShowAuth(false);
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_complete,role_type")
      .eq("id", id)
      .maybeSingle();
    if (error) {
      setSessionError(
        "Connexion réussie, mais votre profil n’a pas pu être chargé.",
      );
      return;
    }
    if (
      data?.onboarding_complete &&
      ["Agence", "Créateur", "Clippeur"].includes(String(data.role_type))
    ) {
      setAccountRole(data.role_type as AccountRole);
      setInApp(true);
    } else setShowOnboarding(true);
  };
  const launch = async (
    plan = "Scale",
    mode: "signup" | "signin" = "signup",
  ) => {
    setSelectedPlan(plan);
    if (userId) {
      await openAuthenticatedApp(userId);
      return;
    }
    setAuthMode(mode);
    setShowAuth(true);
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setUserEmail(null);
    setAccountRole(null);
    setInApp(false);
    setShowOnboarding(false);
  };
  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("clipscale-theme", next);
      return next;
    });
  const chooseCookies = (choice: "accepted" | "essential") => {
    window.localStorage.setItem("clipscale-cookie-choice", choice);
    setCookieChoice(choice);
  };
  if (sessionLoading)
    return (
      <div className={`cs-theme cs-theme-${theme}`}>
        <div className="cs10-session-loader">
          <Logo />
          <div>
            <i />
            <i />
            <i />
          </div>
          <p>Ouverture sécurisée de votre espace…</p>
        </div>
      </div>
    );
  return (
    <div className={`cs-theme cs-theme-${theme}`}>
      {sessionError && (
        <div className="cs15-session-error" role="alert">
          {sessionError}
          <button onClick={() => location.reload()}>Réessayer</button>
        </div>
      )}
      {showOnboarding && userId ? (
        <Onboarding
          userId={userId}
          done={(role) => {
            setAccountRole(role);
            setShowOnboarding(false);
            setInApp(true);
          }}
        />
      ) : inApp && userId && accountRole === "Clippeur" ? (
        <ClipperWorkspace
          userName={userName}
          signOut={signOut}
          changeRole={() => {
            setInApp(false);
            setShowOnboarding(true);
          }}
        />
      ) : inApp && userId ? (
        <AppShell
          exit={() => setInApp(false)}
          plan={selectedPlan}
          userId={userId}
          userEmail={userEmail}
          userName={userName}
          signOut={signOut}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <Landing launch={launch} theme={theme} toggleTheme={toggleTheme} />
      )}
      {showAuth && (
        <AuthModal
          key={authMode}
          plan={selectedPlan}
          initialMode={authMode}
          close={() => setShowAuth(false)}
          authenticated={openAuthenticatedApp}
        />
      )}
      {!cookieChoice && (
        <aside
          className="cs7-cookie"
          aria-label="Préférences de confidentialité"
        >
          <div>
            <b>Vos choix, clairement.</b>
            <p>
              Les éléments essentiels assurent le fonctionnement de ClipScale.
              Les mesures d’audience optionnelles nous aident à améliorer le
              produit.
            </p>
            <a href="/confidentialite">En savoir plus</a>
          </div>
          <div>
            <button onClick={() => chooseCookies("essential")}>
              Essentiels uniquement
            </button>
            <button
              className="cs2-button"
              onClick={() => chooseCookies("accepted")}
            >
              Tout accepter
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
