import Link from "next/link";

export default function NotFound() {
  return <main className="legal-page"><span>ERREUR 404</span><h1>Cette page n’existe pas.</h1><article><p>Le lien est peut-être ancien ou incomplet.</p><Link className="legal-back" href="/">← Revenir à ClipScale</Link></article></main>;
}
