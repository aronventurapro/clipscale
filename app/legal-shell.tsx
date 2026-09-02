import Link from "next/link";

export default function LegalShell({title,children}:{title:string;children:React.ReactNode}){
 return <main className="legal-page"><Link href="/" className="legal-back">← Retour à ClipScale</Link><span>DOCUMENT D’INFORMATION · VERSION DU 2 SEPTEMBRE 2026</span><h1>{title}</h1><div className="legal-warning"><b>Version bêta — pas encore commercialisée</b><p>Les informations d’immatriculation et l’adresse de l’éditeur doivent encore être complétées avant l’ouverture des abonnements. Ce document décrit néanmoins le traitement actuellement réalisé par le service.</p></div><article>{children}</article><footer>Contact produit et données personnelles : <a href="mailto:hello@clipscale.fr">hello@clipscale.fr</a></footer></main>
}
