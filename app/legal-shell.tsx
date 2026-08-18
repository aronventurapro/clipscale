import Link from "next/link";

export default function LegalShell({title,children}:{title:string;children:React.ReactNode}){
 return <main className="legal-page"><Link href="/" className="legal-back">← Retour à ClipScale</Link><span>DOCUMENT D’INFORMATION · VERSION DU 18 AOÛT 2026</span><h1>{title}</h1><div className="legal-warning"><b>Avant commercialisation</b><p>Les informations d’immatriculation, l’adresse de l’éditeur et l’hébergeur contractuel devront être complétés et validés par un professionnel du droit.</p></div><article>{children}</article><footer>Contact produit : <a href="mailto:hello@clipscale.fr">hello@clipscale.fr</a></footer></main>
}
