"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ level: "error", message: "client_route_failed", digest: error.digest }));
  }, [error]);
  return <main className="legal-page"><span>ERREUR TEMPORAIRE</span><h1>Cette page n’a pas pu être chargée.</h1><article><p>Vos données enregistrées ne sont pas perdues. Vous pouvez relancer la page ou revenir à l’accueil.</p><button className="cs2-button" onClick={reset}>Réessayer</button> <Link className="legal-back" href="/">Retour à ClipScale</Link></article></main>;
}
