"use client";

import { useMemo, useState } from "react";

export function RoiLab({launch}:{launch:()=>void}){
  const [sources,setSources]=useState(8);
  const [minutes,setMinutes]=useState(60);
  const [clips,setClips]=useState(6);
  const [manual,setManual]=useState(50);
  const result=useMemo(()=>({
    output:sources*clips,
    sourceHours:Math.round(sources*minutes/60),
    manualHours:Math.round(sources*clips*manual/60),
    assistedHours:Math.max(2,Math.round(sources*clips*manual/60*.38)),
  }),[sources,minutes,clips,manual]);
  const saved=Math.max(0,result.manualHours-result.assistedHours);
  return <section className="roi-lab" id="simulateur">
    <div className="roi-copy"><span>05 / SIMULATEUR</span><h2>Calculez votre capacité<br/><em>avant de vous engager.</em></h2><p>Estimation indicative fondée sur votre volume. Elle ne constitue pas une promesse de performance.</p>
      <div className="roi-controls">
        <label>Vidéos longues / mois <b>{sources}</b><input aria-label="Vidéos longues par mois" type="range" min="1" max="40" value={sources} onChange={e=>setSources(+e.target.value)}/></label>
        <label>Durée moyenne <b>{minutes} min</b><input aria-label="Durée moyenne en minutes" type="range" min="15" max="180" step="15" value={minutes} onChange={e=>setMinutes(+e.target.value)}/></label>
        <label>Clips par source <b>{clips}</b><input aria-label="Clips par source" type="range" min="2" max="20" value={clips} onChange={e=>setClips(+e.target.value)}/></label>
        <label>Montage manuel / clip <b>{manual} min</b><input aria-label="Temps de montage manuel par clip" type="range" min="20" max="120" step="5" value={manual} onChange={e=>setManual(+e.target.value)}/></label>
      </div>
    </div>
    <div className="roi-result"><small>VOTRE SCÉNARIO MENSUEL</small><strong>{result.output}<i> clips</i></strong><div><span><b>{result.sourceHours} h</b> de contenu source</span><span><b>{saved} h</b> potentiellement économisées</span><span><b>{result.assistedHours} h</b> de production assistée estimée</span></div><button onClick={launch}>Tester ce scénario dans la démo →</button><p>Hypothèse : workflow assisté réduisant de 62 % le temps opérationnel. Résultat réel variable selon le niveau de finition.</p></div>
  </section>
}

export function Comparison(){
  const rows=[
    ["Clips IA / mois","40","250","Usage étendu"],
    ["Espaces clients","1","15","Illimités"],
    ["Validation client","—","Incluse","Incluse"],
    ["Marque blanche","—","Portail","Portail + domaine"],
    ["Automations","3","Illimitées","Illimitées + API"],
    ["Support","Email","Prioritaire","Dédié"],
  ];
  return <section className="plan-comparison" aria-labelledby="compare-title"><div><span>COMPARAISON RAPIDE</span><h2 id="compare-title">Choisissez sans zone grise.</h2><p>Les fonctionnalités nécessitant une connexion externe restent signalées avant activation.</p></div><div className="compare-table" role="table"><div role="row" className="compare-head"><b>Fonctionnalité</b><b>Starter</b><b>Agency</b><b>Scale</b></div>{rows.map(row=><div role="row" key={row[0]}>{row.map((cell,i)=><span role="cell" key={`${i}-${cell}`} className={i===2?"highlight":""}>{cell}</span>)}</div>)}</div></section>
}

export function Readiness(){
  const items=[
    ["Interface & workflows","Disponible","Démo interactive, responsive et navigable"],
    ["Catalogue produit","Disponible","1 000 éléments filtrables et documentés"],
    ["Traitement vidéo","À connecter","Pipeline de stockage, transcription et rendu"],
    ["Réseaux sociaux","À connecter","API officielles TikTok, Meta, YouTube et LinkedIn"],
    ["Paiements","À connecter","Stripe, facturation, remboursements et webhooks"],
    ["Authentification","À connecter","Comptes, sessions, rôles et double facteur"],
  ];
  return <section className="readiness" id="transparence"><div className="section-head centered"><span>TRANSPARENCE PRODUIT</span><h2>Ce qui fonctionne.<br/><em>Ce qui doit être connecté.</em></h2><p>Aucune intégration externe n’est présentée comme active avant sa mise en production.</p></div><div>{items.map(item=><article key={item[0]}><i className={item[1]==="Disponible"?"ready":"next"}/><span><b>{item[0]}</b><small>{item[2]}</small></span><em>{item[1]}</em></article>)}</div></section>
}
