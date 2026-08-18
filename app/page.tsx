"use client";
import { useState } from "react";
import ProductApp from "./product-app";
import PremiumLanding from "./premium-landing";

export default function Home(){
 const[app,setApp]=useState(false);
 return app?<ProductApp exit={()=>setApp(false)}/>:<PremiumLanding launch={()=>setApp(true)}/>;
}
