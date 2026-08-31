let pages=[];
let current=0;
let opened=false;
let touchStartX=0;
let touchStartY=0;
let changing=false;
const ASSET_VERSION="3.6.0";
const assetUrl=src=>`${src}${src.includes("?")?"&":"?"}v=${ASSET_VERSION}`;

const $=id=>document.getElementById(id);
const landing=$("landing"),reader=$("reader"),image=$("pageImage");
const pageCanvas=$("pageCanvas"),pageCtx=pageCanvas.getContext("2d",{alpha:false,desynchronized:true});
const coverCanvas=$("coverCanvas"),coverSource=$("coverSource"),coverCtx=coverCanvas.getContext("2d",{alpha:false,desynchronized:true});
const contents=$("contents"),scrim=$("scrim"),thumbGrid=$("thumbGrid");

function drawSourceAtNativeResolution(source,canvas,ctx,container){
  if(!source.naturalWidth||!source.naturalHeight||!ctx)return;
  const bounds=container.getBoundingClientRect();
  const scale=Math.min(bounds.width/source.naturalWidth,bounds.height/source.naturalHeight,1);
  const cssWidth=Math.max(1,Math.floor(source.naturalWidth*scale));
  const cssHeight=Math.max(1,Math.floor(source.naturalHeight*scale));

  // Keep the canvas backing store at the source image's native pixel size.
  // Safari then performs one high-quality downsample instead of repeatedly
  // rasterising a transformed or fractionally sized <img> layer.
  if(canvas.width!==source.naturalWidth)canvas.width=source.naturalWidth;
  if(canvas.height!==source.naturalHeight)canvas.height=source.naturalHeight;
  canvas.style.width=`${cssWidth}px`;
  canvas.style.height=`${cssHeight}px`;
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(source,0,0,source.naturalWidth,source.naturalHeight);
}

function fitPageToWholePixels(){
  drawSourceAtNativeResolution(image,pageCanvas,pageCtx,$("book"));
}

function renderCoverCanvas(){
  drawSourceAtNativeResolution(coverSource,coverCanvas,coverCtx,landing);
}


async function boot(){
  if(coverSource.complete){renderCoverCanvas()}else{coverSource.addEventListener("load",renderCoverCanvas,{once:true})}
  pages=await fetch("pages.json",{cache:"no-store"}).then(r=>r.json());
  buildContents();
  const hash=location.hash.replace("#page-","");
  const requested=pages.findIndex(p=>String(p.number).toLowerCase()===hash.toLowerCase());
  if(requested>=0){openReader(requested,false)}
  else render(0,false);
  preload(0);
}

function buildContents(){
  thumbGrid.innerHTML=pages.map((p,i)=>`
    <button class="thumb ${p.portrait?"portrait":""}" data-index="${i}" type="button">
      <img src="${assetUrl(p.src)}" loading="lazy" decoding="async" alt="">
      <span class="thumb-copy"><strong>${p.number}</strong><span>${escapeHTML(p.title)}</span></span>
    </button>`).join("");
  thumbGrid.addEventListener("click",e=>{
    const button=e.target.closest("[data-index]");
    if(!button)return;
    closeContents();
    openReader(Number(button.dataset.index),false);
  });
}

function openReader(index=0,animate=true){
  opened=true;
  landing.hidden=true;
  reader.hidden=false;
  document.body.classList.add("reading");
  render(index,animate);
}

function render(index,animate=true,direction="next"){
  index=Math.max(0,Math.min(pages.length-1,index));
  if(changing)return;
  const p=pages[index];
  current=index;
  const nextSrc=assetUrl(p.src);
  if(animate){
    changing=true;
    image.classList.remove("turn-next","turn-prev");
  }
  image.src=nextSrc;
  image.alt="";
  pageCanvas.setAttribute("aria-label",`NÜ-LINE Edition I — ${p.title}`);
  const finishRender=()=>{
    fitPageToWholePixels();
    if(!animate){changing=false;return}
    changing=false;
  };
  if(image.decode){image.decode().then(finishRender).catch(finishRender)}else{image.onload=finishRender;}
  $("pageNumber").textContent=p.number==="cover"?"Cover":`Page ${p.number}`;
  $("pageTitle").textContent=p.title;
  $("progressBar").style.width=`${((index+1)/pages.length)*100}%`;
  $("prevBtn").disabled=index===0;
  $("prevSmall").disabled=index===0;
  $("nextBtn").disabled=index===pages.length-1;
  $("nextSmall").disabled=index===pages.length-1;
  document.querySelectorAll(".thumb").forEach((t,i)=>t.classList.toggle("active",i===index));
  history.replaceState(null,"",p.number==="cover"?"#cover":`#page-${p.number}`);
  preload(index);
}

function next(){if(current<pages.length-1)render(current+1,true,"next")}
function prev(){if(current>0)render(current-1,true,"prev")}
function preload(index){
  [index+1,index-1,index+2].filter(i=>pages[i]).forEach(i=>{const x=new Image();x.src=assetUrl(pages[i].src)});
}
function openContents(){
  contents.classList.add("open");
  contents.setAttribute("aria-hidden","false");
  scrim.hidden=false;
}
function closeContents(){
  contents.classList.remove("open");
  contents.setAttribute("aria-hidden","true");
  scrim.hidden=true;
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

$("openBook").onclick=()=>openReader(0,false);
$("prevBtn").onclick=$("prevSmall").onclick=prev;
$("nextBtn").onclick=$("nextSmall").onclick=next;
$("contentsBtn").onclick=openContents;
$("closeContents").onclick=closeContents;
scrim.onclick=closeContents;

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){if(opened){e.preventDefault();next()}}
  if(e.key==="ArrowLeft"||e.key==="PageUp"){if(opened){e.preventDefault();prev()}}
  if(e.key==="Escape"){closeContents();closeContact();closeBrochures()}
  if((e.key==="c"||e.key==="C")&&opened)openContents();
});

$("book").addEventListener("touchstart",e=>{
  const t=e.changedTouches[0];touchStartX=t.screenX;touchStartY=t.screenY;
},{passive:true});
$("book").addEventListener("touchend",e=>{
  const t=e.changedTouches[0];
  const dx=t.screenX-touchStartX,dy=t.screenY-touchStartY;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){dx<0?next():prev()}
},{passive:true});

// Version 3.4 — desktop mouse-wheel and trackpad page navigation.
// The brochure is a single-screen reader rather than a vertically scrolling document,
// so translate deliberate vertical wheel gestures into previous/next page actions.
let wheelDelta=0;
let wheelResetTimer=0;
let wheelLockedUntil=0;
function readerOverlayOpen(){
  return contents.classList.contains("open")||contactPanel?.classList.contains("open")||brochurePanel?.classList.contains("open");
}
function handleReaderWheel(e){
  if(!opened||reader.hidden||readerOverlayOpen())return;
  const now=Date.now();
  e.preventDefault();
  if(now<wheelLockedUntil)return;

  const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;
  const delta=e.deltaY*unit;
  if(Math.abs(delta)<1)return;

  // If the user reverses direction, start a fresh gesture.
  if(wheelDelta&&Math.sign(delta)!==Math.sign(wheelDelta))wheelDelta=0;
  wheelDelta+=delta;
  clearTimeout(wheelResetTimer);
  wheelResetTimer=setTimeout(()=>{wheelDelta=0},180);

  if(Math.abs(wheelDelta)>=45){
    wheelDelta>0?next():prev();
    wheelDelta=0;
    wheelLockedUntil=now+420;
  }
}
reader.addEventListener("wheel",handleReaderWheel,{passive:false});

// Also let desktop users click the left or right half of the brochure page.
$("book").addEventListener("click",e=>{
  if(readerOverlayOpen()||e.target.closest("button,a,input,select,textarea"))return;
  const rect=$("book").getBoundingClientRect();
  e.clientX<rect.left+rect.width/2?prev():next();
});

window.addEventListener("hashchange",()=>{
  if(location.hash==="#contact"){openContact();return}
  if(location.hash==="#brochures"){openBrochures();return}
  const h=location.hash.replace("#page-","");
  if(location.hash==="#cover"){if(opened)render(0,false);return}
  const i=pages.findIndex(p=>String(p.number).toLowerCase()===h.toLowerCase());
  if(i>=0)openReader(i,false);
});

window.addEventListener("resize",()=>{fitPageToWholePixels();renderCoverCanvas()},{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(()=>{fitPageToWholePixels();renderCoverCanvas()},150),{passive:true});
if("ResizeObserver" in window){
  new ResizeObserver(fitPageToWholePixels).observe($("book"));
  new ResizeObserver(renderCoverCanvas).observe(landing);
}

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
boot().catch(err=>{console.error(err);document.body.innerHTML="<p style='padding:40px;color:white'>The digital book could not load. Please refresh the page.</p>"});


// Version 3 — secure website enquiry connection
const contactPanel=$("contactPanel");
const enquiryForm=$("enquiryForm");
const formStatus=$("formStatus");
const enquirySuccess=$("enquirySuccess");
const brochurePanel=$("brochurePanel");
const brochureForm=$("brochureForm");
const brochureStatus=$("brochureStatus");
const brochureDownloads=$("brochureDownloads");
let websiteSupabase=null;

function initWebsiteSupabase(){
  const cfg=window.NULINE_WEBSITE_CONFIG||{};
  if(window.supabase&&cfg.supabaseUrl&&cfg.supabaseAnonKey){
    websiteSupabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  }
}
function openContact(){
  contactPanel.classList.add("open");
  contactPanel.setAttribute("aria-hidden","false");
  document.body.classList.add("contact-open");
  history.replaceState(null,"","#contact");
  setTimeout(()=>contactPanel.querySelector("input,select,textarea")?.focus(),250);
}
function closeContact(){
  contactPanel.classList.remove("open");
  contactPanel.setAttribute("aria-hidden","true");
  document.body.classList.remove("contact-open");
  if(location.hash==="#contact")history.replaceState(null,"",opened?(pages[current]?.number==="cover"?"#cover":`#page-${pages[current]?.number}`):"#cover");
}
function brochureAccessUnlocked(){
  try{return sessionStorage.getItem("nulineBrochuresUnlocked")==="1"}catch{return false}
}
function openBrochures(){
  brochurePanel.classList.add("open");
  brochurePanel.setAttribute("aria-hidden","false");
  document.body.classList.add("brochure-open");
  if(brochureAccessUnlocked()){
    brochureForm.hidden=true;
    brochureDownloads.hidden=false;
  }else{
    brochureForm.hidden=false;
    brochureDownloads.hidden=true;
    setTimeout(()=>brochureForm.querySelector("input,select")?.focus(),250);
  }
  history.replaceState(null,"","#brochures");
}
function closeBrochures(){
  brochurePanel.classList.remove("open");
  brochurePanel.setAttribute("aria-hidden","true");
  document.body.classList.remove("brochure-open");
  if(location.hash==="#brochures")history.replaceState(null,"",opened?(pages[current]?.number==="cover"?"#cover":`#page-${pages[current]?.number}`):"#cover");
}
function createReference(){
  const d=new Date();
  const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const code=Math.random().toString(36).slice(2,7).toUpperCase();
  return `WEB-${stamp}-${code}`;
}
function normaliseText(value){return String(value||"").trim()}

$("contactBtn").onclick=openContact;
$("beginProjectBtn").onclick=openContact;
$("brochuresBtn").onclick=openBrochures;
$("closeBrochures").onclick=closeBrochures;
$("closeContact").onclick=closeContact;
$("closeSuccess").onclick=()=>{closeContact();enquirySuccess.hidden=true;enquiryForm.hidden=false};
contactPanel.addEventListener("click",e=>{if(e.target===contactPanel)closeContact()});
brochurePanel.addEventListener("click",e=>{if(e.target===brochurePanel)closeBrochures()});

brochureForm.addEventListener("submit",async e=>{
  e.preventDefault();
  brochureStatus.textContent="";
  if(!brochureForm.reportValidity())return;
  const fd=new FormData(brochureForm);
  if(normaliseText(fd.get("website")))return;
  if(!websiteSupabase){
    brochureStatus.textContent="The secure brochure connection is not configured yet. Please email paul@nu-lineglazing.co.uk.";
    return;
  }
  const submit=$("submitBrochureRequest");
  submit.disabled=true;
  submit.querySelector("span").textContent="Preparing library…";
  const reference=createReference().replace("WEB-","BRO-");
  const interest=normaliseText(fd.get("brochure_interest"));
  const payload={
    reference,
    status:"new",
    source:"website",
    name:normaliseText(fd.get("name")),
    company:normaliseText(fd.get("company")),
    email:normaliseText(fd.get("email")).toLowerCase(),
    phone:normaliseText(fd.get("phone")),
    project_location:"",
    project_type:normaliseText(fd.get("project_type"))||"Brochure request",
    budget:"",
    timescale:"",
    systems:[interest],
    project_details:`Brochure download request: ${interest}.`,
    consent:true,
    page_url:location.href.split("#")[0],
    user_agent:navigator.userAgent.slice(0,500)
  };
  try{
    const {error}=await websiteSupabase.from("website_enquiries").insert(payload);
    if(error)throw error;
    try{sessionStorage.setItem("nulineBrochuresUnlocked","1")}catch{}
    brochureForm.reset();
    brochureForm.hidden=true;
    brochureDownloads.hidden=false;
    $("brochureReference").textContent=reference;
    brochureDownloads.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){
    console.error(err);
    brochureStatus.textContent="We could not unlock the brochures. Please try again or email paul@nu-lineglazing.co.uk.";
  }finally{
    submit.disabled=false;
    submit.querySelector("span").textContent="Access brochures";
  }
});

enquiryForm.addEventListener("submit",async e=>{
  e.preventDefault();
  formStatus.textContent="";
  if(!enquiryForm.reportValidity())return;
  const fd=new FormData(enquiryForm);
  if(normaliseText(fd.get("website")))return;
  if(!websiteSupabase){
    formStatus.textContent="The secure enquiry connection is not configured yet. Please email paul@nu-lineglazing.co.uk.";
    return;
  }
  const submit=$("submitEnquiry");
  submit.disabled=true;
  submit.querySelector("span").textContent="Sending securely…";
  const reference=createReference();
  const payload={
    reference,
    status:"new",
    source:"website",
    name:normaliseText(fd.get("name")),
    company:normaliseText(fd.get("company")),
    email:normaliseText(fd.get("email")).toLowerCase(),
    phone:normaliseText(fd.get("phone")),
    project_location:normaliseText(fd.get("project_location")),
    project_type:normaliseText(fd.get("project_type")),
    budget:normaliseText(fd.get("budget")),
    timescale:normaliseText(fd.get("timescale")),
    systems:fd.getAll("systems"),
    project_details:normaliseText(fd.get("project_details")),
    consent:true,
    page_url:location.href.split("#")[0],
    user_agent:navigator.userAgent.slice(0,500)
  };
  try{
    const {error}=await websiteSupabase.from("website_enquiries").insert(payload);
    if(error)throw error;
    enquiryForm.reset();
    enquiryForm.hidden=true;
    enquirySuccess.hidden=false;
    $("enquiryReference").textContent=reference;
  }catch(err){
    console.error(err);
    formStatus.textContent="We could not send the enquiry. Please try again or email paul@nu-lineglazing.co.uk.";
  }finally{
    submit.disabled=false;
    submit.querySelector("span").textContent="Send project enquiry";
  }
});

initWebsiteSupabase();
if(location.hash==="#contact")setTimeout(openContact,200);
if(location.hash==="#brochures")setTimeout(openBrochures,200);
