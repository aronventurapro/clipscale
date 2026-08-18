"use client";
import { useState } from "react";
import { Comparison, Readiness, RoiLab } from "./optimization-layer";
import VisualBackground from "./visual-background";

const videos=[
 {id:"TSJDrJZXRJs",creator:"Yomi Denzel",title:"Transformer une longue interview en dizaines de formats courts",tag:"FORMAT LONG",accent:"violet"},
 {id:"_tcjtPiVYRY",creator:"Kéo",title:"Repérer les hooks, histoires et séquences à fort potentiel",tag:"STORYTELLING",accent:"cyan"},
 {id:"DWGQnHkKFJI",creator:"Gaspard G",title:"Extraire les idées fortes d’une conversation éditoriale",tag:"ÉDITORIAL",accent:"orange"},
 {id:"AFdrWd68seY",creator:"Gaspard G · interview",title:"Construire une série de clips autour d’un parcours créateur",tag:"INTERVIEW",accent:"green"},
];
const plans=[
 {name:"Starter",monthly:49,yearly:39,eyebrow:"CRÉATEUR SOLO",desc:"Pour transformer vos contenus longs sans complexité.",features:["40 clips IA / mois","1 espace de marque","Sous-titres & recadrage","Calendrier éditorial","Analytics essentiels"],cta:"Démarrer avec Starter"},
 {name:"Agency",monthly:199,yearly:159,eyebrow:"LE PLUS CHOISI",desc:"Le cockpit complet pour gérer plusieurs clients.",features:["250 clips IA / mois","15 espaces clients","Équipe & validations","Analytics multiréseaux","Portail marque blanche"],cta:"Choisir Agency",popular:true},
 {name:"Scale",monthly:499,yearly:399,eyebrow:"AGENCE EN CROISSANCE",desc:"Pour industrialiser la production et la distribution.",features:["Clips IA illimités*","Clients & équipe illimités","API, webhooks & SSO","Domaine marque blanche","Support prioritaire"],cta:"Passer à l’échelle"},
];
const faqs=[
 ["ClipScale remplace-t-il mon monteur ?","Non. L’IA accélère la détection, le dérush et les sous-titres. Le monteur garde la direction créative et le contrôle final."],
 ["Puis-je gérer plusieurs clients ?","La démo permet déjà d’explorer les portails, campagnes, validations et analytics. La persistance des comptes sera activée avec le backend et l’authentification."],
 ["Comment fonctionne le paiement au CPM ?","Vous définissez un budget et un montant pour 1 000 vues. ClipScale suit les performances éligibles et prépare les paiements."],
 ["Les vidéos sont-elles réellement publiées ?","La version actuelle est un prototype produit. Les connexions directes aux plateformes seront activées avec les intégrations officielles."],
];

function Mark(){return <span className="mark" aria-hidden="true"><i/><i/><i/></span>}
function Spark({className=""}:{className?:string}){return <span className={`spark ${className}`}>✦</span>}

export default function PremiumLanding({launch}:{launch:()=>void}){
 const[faq,setFaq]=useState(0);const[annual,setAnnual]=useState(true);const[activeVideo,setActiveVideo]=useState<string|null>(null);const[persona,setPersona]=useState("Agence");
 return <main className="premium-landing" onPointerMove={e=>{e.currentTarget.style.setProperty("--mx",`${e.clientX}px`);e.currentTarget.style.setProperty("--my",`${e.clientY}px`)}}>
  <a className="skip-link" href="#main-content">Aller au contenu</a>
  <VisualBackground/><div className="noise"/>
  <nav className="premium-nav" aria-label="Navigation principale"><button aria-label="Retour en haut" className="brand" onClick={()=>scrollTo({top:0,behavior:"smooth"})}><Mark/>ClipScale <small>OS</small></button><div><a href="#product">Produit</a><a href="#showcase">Workflow</a><a href="/marketplace">Marketplace</a><a href="#pricing">Tarifs</a></div><span><a href="#creators">Exemples</a><button onClick={launch}>Tester la démo <b>↗</b></button></span></nav>

  <section className="premium-hero" id="main-content">
   <div className="hero-grid"/><div className="hero-orbit o1"/><div className="hero-orbit o2"/>
   <div className="hero-copy">
    <div className="release-pill"><span>DÉMO</span> Prototype transparent · aucune fausse donnée <b>→</b></div>
    <h1>{persona==="Agence"?<>L’agence de clipping.<br/><em>Enfin pilotable.</em></>:persona==="Créateur"?<>Une vidéo longue.<br/><em>Des semaines de contenu.</em></>:<>Votre contenu client.<br/><em>Validé sans friction.</em></>}</h1>
    <p>{persona==="Agence"?"Centralisez vos clients, monteurs, validations, publications et analyses dans un seul cockpit.":persona==="Créateur"?"Repérez les meilleurs passages, préparez les formats courts et gardez le contrôle créatif jusqu’à la publication.":"Transformez chaque brief en production claire, avec commentaires horodatés, versions et validation client."}</p>
    <div className="persona-switch" aria-label="Choisir votre profil">{["Agence","Créateur","Monteur"].map(x=><button aria-pressed={persona===x} className={persona===x?"active":""} onClick={()=>setPersona(x)} key={x}>{x}</button>)}</div>
    <div className="premium-actions"><button onClick={launch}>Explorer le produit gratuitement <b>→</b></button><a href="#simulateur"><i>↗</i> Calculer mon gain de temps</a></div>
    <div className="factual-proof"><span><b>13</b> modules interactifs</span><span><b>1 000</b> éléments de roadmap</span><span><b>0</b> résultat inventé</span></div>
   </div>
   <div className="cinema-stage">
    <div className="phone-card phone-left"><div className="phone-video v1"><span className="caption-word">ARRÊTE DE</span><span className="caption-word active">SCROLLER</span><i>▶</i></div><footer><span>FORMAT A</span><span>EXEMPLE</span></footer></div>
    <div className="phone-card phone-main"><header><span>ClipScale AI</span><b>aperçu</b></header><div className="phone-video v2"><Spark/><div className="speaker"><i/><i/></div><p>LE DÉCLIC QUI<br/><em>CHANGE TOUT</em></p><span className="playing">▶ 0:24</span></div><footer><span>FORMAT B</span><span>DÉMO</span></footer></div>
    <div className="phone-card phone-right"><div className="phone-video v3"><span className="caption-word">3 ERREURS</span><span className="caption-word active">À ÉVITER</span><i>▶</i></div><footer><span>FORMAT C</span><span>EXEMPLE</span></footer></div>
    <div className="floating-chip chip-one"><i>✦</i><span><small>ANALYSE DU HOOK</small><b>Signal indicatif</b></span></div>
    <div className="floating-chip chip-two"><i>↗</i><span><small>STATUT</small><b>Prêt à valider</b></span></div>
   </div>
   <div className="scroll-cue"><span>SCROLL TO EXPLORE</span><i/></div>
  </section>

  <section className="logo-stream"><p>UN WORKFLOW UNIQUE POUR TOUTE LA CHAÎNE DE PRODUCTION</p><div className="logo-track"><div>{["IMPORT","TRANSCRIPTION","HOOKS","MONTAGE","VALIDATION","DIFFUSION","ANALYTICS","IMPORT","TRANSCRIPTION","HOOKS","MONTAGE","VALIDATION","DIFFUSION","ANALYTICS"].map((x,i)=><span key={i}><i>{["⇧","✦","◎","▶","✓","↗","◈"][i%7]}</i>{x}</span>)}</div></div></section>

  <section className="manifesto" id="product"><div className="manifesto-label"><span>01</span><p>LE NOUVEAU STANDARD</p></div><div><h2>Votre contenu ne manque pas de valeur.<br/>Il manque de <em>distribution.</em></h2><p>Les meilleures idées restent enfermées dans des vidéos d’une heure. ClipScale les détecte, les transforme et les distribue dans tous les feeds — avec un système qui devient plus intelligent à chaque publication.</p></div></section>

  <section className="transformation" id="showcase">
   <div className="section-head"><span>02 / DU LONG AU VIRAL</span><h2>Une vidéo entre.<br/><em>Une campagne entière sort.</em></h2></div>
   <div className="transform-stage">
    <div className="source-panel"><header><span><i/>SOURCE_047.MP4</span><b>48:26</b></header><div className="source-visual"><div className="waveform">{Array.from({length:42}).map((_,i)=><i key={i} style={{height:`${20+(i*17)%65}%`}}/>)}</div><span className="source-play">▶</span><div className="source-timeline"><i/><b style={{left:"32%"}}/><b style={{left:"61%"}}/><b style={{left:"84%"}}/></div></div><footer><span>Transcription terminée</span><b>12 840 mots</b></footer></div>
    <div className="ai-tunnel"><span>ANALYSE</span><i/><Spark/><i/><span>10 CLIPS</span></div>
    <div className="output-stack"><article className="vertical-output out1"><div><span>“TOUT LE MONDE<br/>FAIT CETTE <em>ERREUR</em>”</span><i>94</i></div><footer>TikTok · 0:42</footer></article><article className="vertical-output out2"><div><span>LA MÉTHODE<br/><em>EN 3 ÉTAPES</em></span><i>89</i></div><footer>Reels · 0:31</footer></article><article className="vertical-output out3"><div><span>CE CONSEIL<br/>VAUT DE <em>L’OR</em></span><i>86</i></div><footer>Shorts · 0:58</footer></article></div>
   </div>
   <div className="transform-stats">{[["48:26","de contenu source"],["8 min","pour obtenir les premiers clips"],["10","formats prêts à publier"],["94/100","meilleur score de viralité"]].map(x=><div key={x[1]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div>
  </section>

  <section className="bento-section">
   <div className="section-head centered"><span>03 / UN SYSTÈME, PAS UN OUTIL</span><h2>Tout le workflow.<br/><em>Sans les frictions.</em></h2><p>De la première idée au dernier paiement, chaque détail est connecté.</p></div>
   <div className="premium-bento">
    <article className="bento-card bento-ai"><div className="bento-copy"><span>CLIPSCALE AI</span><h3>Les moments qui méritent<br/>d’être vus.</h3><p>L’IA lit le contexte, détecte l’émotion et classe les passages selon leur potentiel.</p></div><div className="ai-rings"><i/><i/><i/><Spark/><span className="signal s1">Hook fort · 94</span><span className="signal s2">Émotion · 89</span><span className="signal s3">Clarté · 92</span></div></article>
    <article className="bento-card bento-workflow"><div className="bento-copy"><span>PRODUCTION</span><h3>Une équipe en mouvement.</h3><p>Brief, montage, révision et validation dans un pipeline vivant.</p></div><div className="mini-kanban">{["BRIEF","MONTAGE","VALIDATION"].map((x,i)=><div key={x}><span>{x}<b>{[8,12,5][i]}</b></span>{Array.from({length:i+2}).map((_,j)=><article key={j}><i className={["violet","cyan","orange"][(i+j)%3]}/><b>{["Le déclic qui…","3 erreurs à…","La règle des…"][j%3]}</b><small>{["ML","NB","AV"][j%3]}</small></article>)}</div>)}</div></article>
    <article className="bento-card bento-performance"><div className="bento-copy"><span>PERFORMANCE</span><h3>Chaque vue a une valeur.</h3><p>Reliez contenu, rétention, leads et revenus après connexion des plateformes.</p></div><div className="performance-orb"><div><b>DÉMO</b><span>DONNÉES ILLUSTRATIVES</span><i>Connexion requise</i></div></div></article>
    <article className="bento-card bento-distribute"><div className="bento-copy"><span>DISTRIBUTION</span><h3>Partout. Au bon moment.</h3><p>Planifiez chaque format sur chaque plateforme.</p></div><div className="platform-orbits"><span className="center-mark"><Mark/></span><i className="po1">♪</i><i className="po2">◎</i><i className="po3">▶</i><i className="po4">in</i></div></article>
   </div>
  </section>

  <section className="creator-showcase" id="creators">
   <div className="creator-intro"><span>04 / LABORATOIRE CRÉATIF</span><h2>Imaginez tout ce qu’un<br/><em>seul format long peut devenir.</em></h2><p>Quatre contenus publics de grands créateurs francophones, sélectionnés pour montrer les hooks, récits et idées qu’un workflow de clipping peut décliner.</p><div className="creator-note"><i>i</i><span>Sources publiques intégrées via YouTube.<br/>Aucune affiliation ni performance attribuée à ClipScale.</span></div><button className="creator-cta" onClick={launch}>Tester ce workflow dans la démo →</button></div>
   <div className="video-wall">{videos.map((v,i)=><article className={`creator-video cv${i}`} key={v.id}><div className="embed-wrap">{activeVideo===v.id?<iframe loading="lazy" src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<button className="video-consent" onClick={()=>setActiveVideo(v.id)} aria-label={`Charger la vidéo de ${v.creator}`}><i>▶</i><b>Charger la vidéo de {v.creator}</b><small>Le lecteur YouTube est chargé uniquement après votre clic.</small></button>}</div><footer><span className={v.accent}>{v.tag}</span><h3>{v.title}</h3><p>Source publique · {v.creator}</p></footer></article>)}</div>
  </section>

  <RoiLab launch={launch}/>
  <Readiness/>

  <section className="premium-pricing" id="pricing"><div className="pricing-glow"/><div className="pricing-copy"><span>06 / TROUVER VOTRE RYTHME</span><h2>Trois offres. Une seule ambition :<br/><em>publier mieux, plus souvent.</em></h2><p>Commencez léger, passez en mode agence puis industrialisez sans changer d’outil.</p><div className="billing-toggle"><button className={!annual?"active":""} onClick={()=>setAnnual(false)}>Mensuel</button><button className={annual?"active":""} onClick={()=>setAnnual(true)}>Annuel <b>−20%</b></button></div><div className="price-proof"><span>✓ Sans engagement</span><span>✓ Migration incluse</span><span>✓ Support en français</span></div></div><div className="pricing-grid">{plans.map(plan=><article className={`plan-card ${plan.popular?"popular":""}`} key={plan.name}>{plan.popular&&<div className="popular-label">RECOMMANDÉ POUR UNE AGENCE</div>}<header><span>{plan.eyebrow}</span><h3>{plan.name}</h3><p>{plan.desc}</p></header><div className="price"><b>{annual?plan.yearly:plan.monthly}€</b><span>/ mois<br/><small>HT {annual?"· facturé annuellement":"· sans engagement"}</small></span></div><ul>{plan.features.map(x=><li key={x}>✓ <span>{x}</span></li>)}</ul><button onClick={launch}>{plan.cta} <b>→</b></button></article>)}</div><small className="pricing-footnote">* Usage raisonnable. Les connexions sociales, paiements et API nécessitent l’activation des intégrations officielles.</small></section>
  <Comparison/>

  <section className="faq-section"><div><span>07 / QUESTIONS</span><h2>Tout ce que vous<br/>devez savoir.</h2><p>Une autre question ? <a href="mailto:hello@clipscale.fr">Parlez-nous.</a></p></div><div className="faq-list">{faqs.map((f,i)=><article className={faq===i?"open":""} key={f[0]}><button aria-expanded={faq===i} aria-controls={`faq-${i}`} onClick={()=>setFaq(faq===i?-1:i)}><span>0{i+1}</span><b>{f[0]}</b><i aria-hidden="true">{faq===i?"−":"＋"}</i></button><p id={`faq-${i}`}>{f[1]}</p></article>)}</div></section>

  <footer className="premium-footer"><div className="footer-main"><div><button aria-label="Retour en haut" className="brand" onClick={()=>scrollTo({top:0,behavior:"smooth"})}><Mark/>ClipScale</button><p>Le système d’exploitation des<br/>agences de clipping.</p></div><div><span>PRODUIT</span><a href="#product">Fonctionnalités</a><a href="/marketplace">Marketplace réelle</a><a href="#pricing">Tarifs</a></div><div><span>RESSOURCES</span><a href="#simulateur">Simulateur</a><a href="#transparence">État du produit</a><button onClick={launch}>Démo produit</button></div><div><span>LÉGAL</span><a href="/confidentialite">Confidentialité</a><a href="/conditions">Conditions</a><a href="/mentions-legales">Mentions légales</a></div></div><div className="footer-bottom"><span>© 2026 ClipScale. Built to scale attention.</span><div><i/> Marketplace V1 persistante</div><button onClick={()=>scrollTo({top:0,behavior:"smooth"})}>RETOUR EN HAUT ↑</button></div></footer>
  <aside className="conversion-dock"><span><Mark/><b>Prêt à transformer une vidéo ?</b><small>Explorez tout le workflow en 2 minutes.</small></span><a href="#pricing">Voir les offres</a><button onClick={launch}>Ouvrir la démo →</button></aside>
 </main>
}
