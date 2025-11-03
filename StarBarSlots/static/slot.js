const socket = io();
const spinBtn = document.getElementById("spinBtn");
const previewBtn = document.getElementById("previewBtn");
const demoBtn = document.getElementById("demoBtn");
const buyBtn = document.getElementById("buyBtn");
const reels = document.querySelectorAll(".reel");
const resultLabel = document.getElementById("result");
const balanceLabel = document.getElementById("balance");
const slotWrapper = document.getElementById("slotWrapper");
const lightContainer = document.getElementById("lightContainer");
const sparkleContainer = document.getElementById("sparkleContainer");
const sndSpin = document.getElementById("sndSpin");
const sndJackpot = document.getElementById("sndJackpot");
const sndTwoMatch = document.getElementById("sndTwoMatch");
const sndLose = document.getElementById("sndLose");
const sndBuy = document.getElementById("sndBuy");
const sndLever = document.getElementById("sndLever");
const sndStartup = document.getElementById("sndStartup");
let demoMode = false;
let demoInterval = null;
let spinning = false;
let lights = [];
let lightTimer = null;
let flashTimeout = null;
spinBtn.addEventListener("click", () => { activateLever(); resultLabel.textContent = ""; spinBtn.disabled = true; previewBtn.disabled = true; spinning = true; socket.emit("spin"); try{ sndSpin.currentTime=0; sndSpin.play(); }catch(e){} });
previewBtn.addEventListener("click", () => { activateLever(); resultLabel.textContent = ""; spinBtn.disabled = true; previewBtn.disabled = true; spinning = true; socket.emit("preview_spin"); try{ sndSpin.currentTime=0; sndSpin.play(); }catch(e){} });
demoBtn.addEventListener("click", () => { demoMode = !demoMode; demoBtn.textContent = demoMode ? "DEMO ON 🔁" : "DEMO OFF 💤"; demoBtn.classList.toggle("active", demoMode); slotWrapper.classList.toggle("demo-active", demoMode); if (demoMode) startDemo(); else stopDemo(); });
buyBtn.addEventListener("click", () => { socket.emit("buy_coins"); try{ sndBuy.currentTime=0; sndBuy.play(); }catch(e){} });
function activateLever(){ const lever = document.getElementById("lever"); lever.classList.add("pull"); try{ sndLever.currentTime=0; sndLever.play(); }catch(e){} setTimeout(()=> lever.classList.remove("pull"), 600); }
function createLights(){ const width=360,height=160,lightCount=30; lightContainer.innerHTML=""; lights=[]; for(let i=0;i<lightCount;i++){ const l=document.createElement("div"); l.className="light"; const color = i%3===0 ? "gold" : i%3===1 ? "red":"magenta"; l.style.background=color; l.style.boxShadow=`0 0 8px ${color}`; positionLight(l,i,lightCount,width,height); lightContainer.appendChild(l); lights.push(l);} }
function positionLight(light,i,total,width,height){ const perimeter=2*(width+height); const step=perimeter/total; const pos=i*step; let x,y; if(pos<width){x=pos;y=0}else if(pos<width+height){x=width;y=pos-width}else if(pos<2*width+height){x=width-(pos-(width+height));y=height}else{x=0;y=height-(pos-(2*width+height))} light.style.left=x+"px"; light.style.top=y+"px"; }
function startLights(){ let index=0; lightTimer=setInterval(()=>{ lights.forEach((l,i)=> l.classList.toggle("on", i===index)); index=(index+1)%lights.length; },100); }
function stopLights(){ clearInterval(lightTimer); lights.forEach(l=> l.classList.remove("on")); }
function startDemo(){ createLights(); startLights(); if(demoInterval) clearInterval(demoInterval); demoInterval=setInterval(()=>{ if(!spinning){ activateLever(); socket.emit("preview_spin"); try{ sndSpin.currentTime=0; sndSpin.play(); }catch(e){} } },5000); }
function stopDemo(){ if(demoInterval) clearInterval(demoInterval); if(lightTimer) clearInterval(lightTimer); lights=[]; lightContainer.innerHTML=""; }
function startCoinShower(intensity="jackpot"){ const container=document.getElementById("coinContainer"); const numCoins=intensity==="jackpot"?30:10; const maxDuration=intensity==="jackpot"?4:2.5; for(let i=0;i<numCoins;i++){ const coin=document.createElement("div"); coin.className="coin"; coin.style.left=Math.random()*100+"vw"; coin.style.animationDuration=(1.5+Math.random()*maxDuration)+"s"; coin.style.animationDelay=Math.random()*0.3+"s"; coin.style.transform=`rotate(${Math.random()*360}deg)`; if(intensity==="small") coin.style.top=(10+Math.random()*20)+"vh"; container.appendChild(coin); setTimeout(()=>coin.remove(),5000); } }
function startSparkleEffect(){ const container=document.getElementById("sparkleContainer"); const numSparkles=20; for(let i=0;i<numSparkles;i++){ const s=document.createElement("div"); s.className="sparkle"; s.style.left=Math.random()*100+"%"; s.style.top=Math.random()*100+"%"; s.style.animationDuration=(0.8+Math.random()*0.6)+"s"; s.style.animationDelay=Math.random()*0.4+"s"; container.appendChild(s); setTimeout(()=>s.remove(),1500); } }
function startWinnerFlash(){ lights.forEach(l=> l.classList.add("flash")); reels.forEach(r=> r.classList.add("flash")); flashTimeout=setTimeout(stopWinnerFlash,4000); }
function stopWinnerFlash(){ if(flashTimeout) clearTimeout(flashTimeout); lights.forEach(l=> l.classList.remove("flash")); reels.forEach(r=> r.classList.remove("flash")); }
socket.on("update_reel", data=>{ if(reels[data.reel]) reels[data.reel].textContent=data.symbol; });
socket.on("result", data=>{ resultLabel.textContent=data.message; resultLabel.style.color=data.color; spinBtn.disabled=false; previewBtn.disabled=false; spinning=false; const msg=data.message.toLowerCase(); stopWinnerFlash(); if(msg.includes("jackpot")){ try{ sndJackpot.currentTime=0; sndJackpot.play(); }catch(e){} startWinnerFlash(); startCoinShower("jackpot"); startSparkleEffect(); } else if(msg.includes("two match")){ try{ sndTwoMatch.currentTime=0; sndTwoMatch.play(); }catch(e){} startCoinShower("small"); startSparkleEffect(); } else if(msg.includes("preview only")){} else { try{ sndLose.currentTime=0; sndLose.play(); }catch(e){} } });
socket.on("balance_update", data=>{ balanceLabel.textContent=data.balance; balanceLabel.style.color=data.balance<=0? "gray":"lime"; });
socket.on("show_buy_button", data=>{ buyBtn.classList.toggle("hidden", !data.show); });
window.addEventListener("load", ()=>{ createLights(); try{ sndStartup.play(); }catch(e){} setTimeout(()=>{ const s=document.getElementById("splashScreen"); if(s) s.style.display="none"; },2200); });
