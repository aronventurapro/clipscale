"use client";

import { useMemo, useState } from "react";

const domains = ["Pilotage", "Campagnes", "Studio IA", "Production", "Diffusion", "Analytics", "Équipe", "Clients", "Marketplace", "Finance", "Automations", "Intégrations", "Sécurité", "Conformité", "Mobile", "Collaboration", "Marque blanche", "API", "Support", "Croissance"];
const workflows = ["Créer", "Importer", "Analyser", "Optimiser", "Valider", "Planifier", "Automatiser", "Mesurer", "Exporter", "Personnaliser"];
const variants = ["Standard", "IA", "Temps réel", "Multi-espace", "Avancé"];
const objects = ["workspace", "campagne", "séquence", "clip", "publication", "rapport", "collaborateur", "portail", "mission", "paiement", "scénario", "connexion", "accès", "consentement", "expérience", "commentaire", "identité", "endpoint", "demande", "expérience de conversion"];
const statuses = ["Disponible", "Prototype", "Connexion"] as const;

export const FEATURE_UNIVERSE = domains.flatMap((domain, domainIndex) =>
  workflows.flatMap((workflow, workflowIndex) =>
    variants.map((variant, variantIndex) => {
      const number = domainIndex * 50 + workflowIndex * 5 + variantIndex + 1;
      return {
        id: number,
        domain,
        status: statuses[(number + domainIndex) % statuses.length],
        name: `${workflow} ${objects[domainIndex]} · ${variant}`,
        detail: `Flux ${domain.toLowerCase()} conçu pour une exécution ${variant.toLowerCase()}, avec contrôle, historique et permissions.`
      };
    })
  )
);

export default function FeatureUniverse() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("Tous les domaines");
  const [status, setStatus] = useState("Tous les statuts");
  const [limit, setLimit] = useState(60);
  const filtered = useMemo(() => FEATURE_UNIVERSE.filter(feature =>
    (domain === "Tous les domaines" || feature.domain === domain) &&
    (status === "Tous les statuts" || feature.status === status) &&
    `${feature.name} ${feature.detail}`.toLowerCase().includes(query.toLowerCase())
  ), [query, domain, status]);

  return <div className="universe">
    <div className="universe-stats">
      <span><b>1 000</b><small>éléments cartographiés</small></span>
      <span><b>20</b><small>domaines produit</small></span>
      <span><b>{FEATURE_UNIVERSE.filter(x=>x.status==="Disponible").length}</b><small>expériences disponibles</small></span>
      <span><b>{FEATURE_UNIVERSE.filter(x=>x.status==="Connexion").length}</b><small>connexions à activer</small></span>
    </div>
    <div className="universe-toolbar">
      <label>⌕<input value={query} onChange={e=>{setQuery(e.target.value);setLimit(60)}} placeholder="Rechercher parmi 1 000 éléments…"/></label>
      <select value={domain} onChange={e=>{setDomain(e.target.value);setLimit(60)}}><option>Tous les domaines</option>{domains.map(x=><option key={x}>{x}</option>)}</select>
      <select value={status} onChange={e=>{setStatus(e.target.value);setLimit(60)}}><option>Tous les statuts</option>{statuses.map(x=><option key={x}>{x}</option>)}</select>
    </div>
    <div className="universe-count"><b>{filtered.length}</b> résultats · les connexions externes sont clairement distinguées des expériences déjà disponibles.</div>
    <div className="universe-list">{filtered.slice(0,limit).map(feature=><article key={feature.id}>
      <b>#{String(feature.id).padStart(4,"0")}</b><span><strong>{feature.name}</strong><small>{feature.detail}</small></span><em>{feature.domain}</em><i className={feature.status.toLowerCase().replace("é","e")}>{feature.status}</i>
    </article>)}</div>
    {limit<filtered.length&&<button className="universe-more" onClick={()=>setLimit(Math.min(limit+60,filtered.length))}>Afficher 60 éléments de plus ↓</button>}
  </div>;
}
