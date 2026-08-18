export default function VisualBackground(){
 const stars=Array.from({length:46},(_,i)=>({left:`${(i*37)%101}%`,top:`${(i*61)%97}%`,delay:`-${(i%9)*.7}s`,size:`${1+(i%3)}px`}));
 return <div className="visual-world" aria-hidden="true">
   <div className="visual-sky"/>
   <div className="visual-mesh"/>
   <div className="visual-beam beam-a"/><div className="visual-beam beam-b"/><div className="visual-beam beam-c"/>
   <div className="visual-sun"><i/><i/><i/><span>CS</span></div>
   <div className="visual-horizon"/>
   <div className="visual-stars">{stars.map((star,i)=><i key={i} style={{left:star.left,top:star.top,animationDelay:star.delay,width:star.size,height:star.size}}/>)}</div>
   <div className="visual-glow glow-one"/><div className="visual-glow glow-two"/><div className="visual-glow glow-three"/>
   <div className="cursor-light"/>
 </div>
}
