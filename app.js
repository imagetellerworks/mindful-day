'use strict';
(()=>{
// Safari toolbars and the keyboard can change the visual viewport independently.
let viewportFrame=0;
function syncVisibleViewport(){
 viewportFrame=0;const viewport=window.visualViewport;
 // Pinch zoom must not reflow the page under the user's fingers.
 if(viewport&&Math.abs(viewport.scale-1)>.01)return;
 const height=Math.min(innerHeight,viewport?.height||innerHeight);
 if(height>0)document.documentElement.style.setProperty('--visible-height',height+'px');
}
function queueVisibleViewport(){if(!viewportFrame)viewportFrame=requestAnimationFrame(syncVisibleViewport);}
syncVisibleViewport();addEventListener('resize',queueVisibleViewport);addEventListener('pageshow',queueVisibleViewport);window.visualViewport?.addEventListener('resize',queueVisibleViewport);
const $=id=>document.getElementById(id),M=AtlasModel,stage=$('stage'),space=$('space'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),cache=new Map(),inkCache=new Map(),cards=new Map();
let all=[],rows=[],position=0,target=0,view=M.views.includes(location.hash.slice(1))?location.hash.slice(1):'helix',playing=!reduced.matches,drag=null,suppressUntil=0,last=0,lastAuto=0,pausedUntil=0,focusedId='',announcementTimer=0,sequenceElapsed=0,lastFit=-1;
let ribbonMotion=null,ribbonHoldMs=0,ribbonRequest=null;
let ribbonAnchorAt=0,ribbonWordsDirty=true,lastRibbonAnchor=null;
function fitPortraitWord(button){
 if(innerWidth>760||innerHeight<innerWidth)return;
 const word=button.querySelector('.word');if(!word)return;
 word.style.setProperty('--ribbon-word-size','22px');
 const available=word.clientWidth,needed=word.scrollWidth;
 if(available&&needed>available)word.style.setProperty('--ribbon-word-size',(22*available/needed)+'px');
}
function syncPortraitRibbon(now,vertical){
 if(!vertical)return;
 if(ribbonWordsDirty){cards.forEach(card=>fitPortraitWord(card.button));ribbonWordsDirty=false;}
 if(now<ribbonAnchorAt)return;ribbonAnchorAt=now+100;
 const intro=document.querySelector('.intro'),icons=document.querySelector('.view-switch');if(!intro||!icons)return;
 const text=intro.getBoundingClientRect(),icon=icons.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
 const offset=M.portraitRibbonAnchor(text.right,icon.left+icon.width/2,bounds.left,bounds.width);
 if(lastRibbonAnchor===null||Math.abs(offset-lastRibbonAnchor)>.1){space.style.setProperty('--ribbon-anchor-offset',offset+'px');lastRibbonAnchor=offset;}
}
addEventListener('resize',()=>{ribbonAnchorAt=0;ribbonWordsDirty=true;});
document.fonts?.addEventListener?.('loadingdone',()=>{ribbonAnchorAt=0;ribbonWordsDirty=true;});
const panByView=Object.fromEntries(M.views.map(name=>[name,{x:0,y:0}]));
const LANGUAGE_KEY='mindful-day-language-v2';let lang='ko';try{const saved=localStorage.getItem(LANGUAGE_KEY);if(saved==='en'||saved==='ko')lang=saved;}catch{}
const experienceBase=(location.hostname==='imagetellerworks.github.io'||((location.hostname==='127.0.0.1'||location.hostname==='localhost')&&location.pathname.startsWith('/mindful-day/')))?new URL('experience/',location.href).href:'https://imagetellerworks.github.io/mindful-day/experience/';
const opening=['fresh','ethereal','romantic','original','bold','dreamy','progressive','magical','sensual','harmonious','high voltage','heavenly','forbidden','unique','cosmic majesty','playful','crisp','ravishing','fiery','serene','otherworldly','kinetic','enraptured','clear'];
function layoutExperienceLink(){
 if(new URLSearchParams(location.search).get('cards')==='1')return;
 const link=$('experienceLink'),intro=document.querySelector('.intro');
 if(link.parentElement!==intro)intro.append(link);
}
addEventListener('resize',layoutExperienceLink);
function applyLanguage(){
 document.title='Mindful Day';document.documentElement.lang=lang;document.body.classList.toggle('lang-en',lang==='en');const ko=lang==='ko';
 $('heroEyebrow').textContent='A COLLECTION OF FEELINGS';$('heroTitle').innerHTML='<em>Mindful</em> <br class="project-title-break">Day';
 $('introCopy').innerHTML=ko?'색을 바라보는 또 하나의 방식.<br>우리가 이름 붙인 감정을<br>새로운 차원에서 만나보세요.':'A new perspective on color.<br>Explore the feelings we named,<br>in an entirely new dimension.';
 $('collectionCount').textContent=ko?'219가지 색, 저마다의 감정':'219 COLORS, COUNTLESS PERSPECTIVES';$('footerQuote').textContent=ko?'색은 말보다 먼저 마음에 닿습니다.':'COLOR IS A LANGUAGE WITHOUT WORDS.';
 $('experienceLink').firstChild.nodeValue=ko?'체험하기 ':'Experience ';
 for(const option of $('filter').options)option.textContent=option.value==='all'?(ko?'모든 감정':'All feelings'):(ko?M.groups[option.value].ko:M.groups[option.value].label);
 const names=ko?{canvas:'캔버스',ribbon:'펼침',helix:'나선',wall:'모아보기'}:{canvas:'Canvas',ribbon:'Ribbon',helix:'Helix',wall:'Wall'};document.querySelectorAll('[data-view]').forEach(button=>{button.innerHTML='<span>0'+(M.views.indexOf(button.dataset.view)+1)+'</span>'+names[button.dataset.view];button.setAttribute('aria-label',names[button.dataset.view]);button.title=names[button.dataset.view];});
 $('languageBtn').setAttribute('aria-label',ko?'Switch to English':'한국어로 전환');document.querySelectorAll('[data-language]').forEach(el=>el.classList.toggle('active',el.dataset.language===lang));document.querySelectorAll('[data-about-lang]').forEach(el=>el.hidden=el.dataset.aboutLang!==lang);document.querySelectorAll('[data-about-choice]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.aboutChoice===lang)));
 cards.forEach(card=>card.button.remove());cards.clear();if(rows.length){focusedId='';selection();}updatePlaying();
}
function image(row,transparent=false){
 const key=row.id+(transparent?':transparent':'');if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');if(!transparent){ctx.fillStyle=row.background;ctx.fillRect(0,0,512,512);}
 // The reviewed four-layer palette is rendered verbatim, without regenerating colors.
 for(const layer of row.layers){const x=256+layer.ox*512,y=256+layer.oy*512,r=layer.r*512,c=layer.col.map(Math.round).join(','),g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c},${layer.a})`);g.addColorStop(Math.min(.95,layer.soft),`rgba(${c},${layer.a})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 if(!transparent){const p=ctx.getImageData(256,256,1,1).data,lum=[...p].slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);inkCache.set(row.id,lum>.179?'#242329':'#f4f2ed');}
 const url=canvas.toDataURL();cache.set(key,url);return url;
}
let immersiveSlot=0,immersiveWord='';
function updateImmersive(){
 const row=rows.length?rows[M.mod(Math.round(position),rows.length)]:null,active=view==='canvas';document.body.classList.toggle('is-immersive',active);$('immersive').setAttribute('aria-hidden',String(!active));
 if(!row)return;const dark=parseInt(row.background.slice(1,3),16)<80;for(const [key,value]of Object.entries(active?{'--paper':row.background,'--ink':dark?'#eceee5':'#292b27','--muted':dark?'#adb3a5':'#73786d','--line':dark?'#53564c':'#d2d2c9'}:{'--paper':'#eeece7','--ink':'#292b27','--muted':'#7c7d75','--line':'#d2d2c9'}))document.documentElement.style.setProperty(key,value);
 if(immersiveWord!==row.id){image(row);immersiveSlot=1-immersiveSlot;const imgs=[$('immersiveA'),$('immersiveB')];imgs[immersiveSlot].src=image(row,true);imgs.forEach((img,i)=>img.classList.toggle('on',i===immersiveSlot));immersiveWord=row.id;$('immersiveName').textContent=row.en;$('immersiveKo').textContent=row.ko;$('immersiveName').parentElement.style.color=inkCache.get(row.id);}
}
function updatePlaying(){
 document.body.classList.toggle('sequence-playing',playing);$('interactionNote').textContent=lang==='ko'?(playing?'자동 재생 · 천천히 둘러보세요':'일시 정지 · 천천히 둘러보세요'):(playing?'AUTO PLAY · EXPLORE AT YOUR PACE':'PAUSED · EXPLORE AT YOUR PACE');
 $('play').setAttribute('aria-pressed',String(playing));$('play').setAttribute('aria-label',playing?'자동 시퀀스 일시 정지':'자동 시퀀스 재생');$('play').innerHTML=playing?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 8 5-8 5z"/></svg>';
}
function pauseForInput(){pausedUntil=performance.now()+6500;lastAuto=performance.now();sequenceElapsed=0;}
function go(delta){if(rows.length<2)return;target=Math.round(view==='ribbon'?(ribbonRequest??ribbonMotion?.to??position):target)+delta;if(view==='ribbon'){ribbonRequest=target;if(ribbonMotion)ribbonMotion.manual=true;}pauseForInput();}
function choose(index){target=index;if(view==='ribbon'){ribbonRequest=index;if(ribbonMotion)ribbonMotion.manual=true;}pauseForInput();}
function project(index){const vertical=innerWidth<=760&&innerHeight>=innerWidth;const width=stage.clientWidth,cardWidth=innerWidth<=760?177:innerWidth>=1600?265:228;const result=view==='ribbon'&&ribbonMotion?M.ribbonPose(index,ribbonMotion.from,ribbonMotion.to,ribbonMotion.elapsed,innerWidth<=760,width,cardWidth,vertical):M.geometry(view,index-position,index,position,innerWidth<=760,width,cardWidth,vertical);if(view==='wall'&&innerWidth<=760)result.y+=width/8.65*1.48*.5;return result;}
function makeCard(index){
 const row=rows[M.mod(index,rows.length)],button=document.createElement('button');button.className='art-card';button.type='button';button.setAttribute('aria-label',row.en+' · '+row.ko);button.tabIndex=-1;
 const img=document.createElement('img');img.loading='eager';img.decoding='async';img.src=image(row);img.alt='';img.draggable=false;img.width=512;img.height=512;
 if(view==='ribbon'&&typeof img.decode==='function')img.decode().catch(()=>{});
 const word=document.createElement('span');word.className='word';word.textContent=row.en;word.lang='en';const ko=document.createElement('span');ko.className='ko';ko.textContent=row.ko;
 const number=document.createElement('span');number.className='number';number.textContent=String(all.indexOf(row)+1).padStart(3,'0')+' / '+M.group(row.category,lang).toUpperCase();button.append(img,word,ko,number);
 button.addEventListener('click',()=>{if(performance.now()<suppressUntil)return;choose(index);});space.append(button);if(view==='ribbon')fitPortraitWord(button);
 const initial=project(index);return{button,index,row,state:{...initial,opacity:0}};
}
function ensureCards(){
 const count=Math.min(view==='wall'?64:21,rows.length),center=Math.round(position),start=view==='wall'&&innerWidth<=760?Math.floor(center/8)*8-32:center-Math.floor((count-1)/2),needed=new Set(Array.from({length:count},(_,i)=>start+i));
 for(const [index,card]of cards)if(!needed.has(index)){card.button.remove();cards.delete(index);}
 for(const index of needed)if(!cards.has(index))cards.set(index,makeCard(index));
}
function selection(){
 if(!rows.length){$('experienceLink').href=M.experienceUrl(null,view,experienceBase);$('selectedName').textContent='No feeling found';$('selectedKo').textContent='검색어를 바꿔보세요';$('selectedCategory').textContent='KEEP EXPLORING';$('current').textContent='000';return;}
 const row=rows[M.mod(Math.round(position),rows.length)];if(focusedId===row.id)return;focusedId=row.id;$('experienceLink').href=M.experienceUrl(row,view,experienceBase);$('selectedName').textContent=row.en;$('selectedKo').textContent=row.ko;$('selectedCategory').textContent=M.group(row.category,lang).toUpperCase();$('current').textContent=String(M.mod(Math.round(position),rows.length)+1).padStart(3,'0');if(view==='canvas')updateImmersive();clearTimeout(announcementTimer);announcementTimer=setTimeout(()=>{$('announcement').textContent=row.en+' · '+row.ko;},600);
}
function filter(resetTimer=true){
 if(resetTimer!==false)pauseForInput();rows=M.filterRows(all,$('filter').value,'');cards.forEach(card=>card.button.remove());cards.clear();position=target=0;ribbonMotion=null;ribbonRequest=null;ribbonHoldMs=0;focusedId='';$('empty').hidden=!!rows.length;$('total').textContent=String(rows.length).padStart(3,'0');$('prev').disabled=$('next').disabled=rows.length<2;selection();
}
function setView(next,automatic=false){
 if(next==='ribbon'){ribbonWordsDirty=true;ribbonAnchorAt=0;}
 view=next;ribbonMotion=null;ribbonRequest=null;ribbonHoldMs=0;if(view==='ribbon')position=target=Math.round(position);document.body.setAttribute('data-gallery-view',view);const pan=panByView[view];space.style.transform=`translate3d(${pan.x}px,${pan.y}px,0) scale(var(--gallery-fit,1))`;const row=rows.length?rows[M.mod(Math.round(position),rows.length)]:null;$('experienceLink').href=M.experienceUrl(row,view,experienceBase);history.replaceState(null,'','#'+view);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));const n=M.views.indexOf(view)+1;const mobileCurrent=$('mobileViewCurrent');if(mobileCurrent)mobileCurrent.textContent=String(n).padStart(2,'0');$('viewCoordinate').textContent='0'+n+' / '+view.toUpperCase();updateImmersive();lastAuto=performance.now();if(!automatic)sequenceElapsed=0;
}
function frame(now){
 const dt=Math.min(40,now-(last||now));last=now;const mobile=innerWidth<=760,vertical=view==='ribbon'&&mobile&&innerHeight>=innerWidth,cardWidth=mobile?177:innerWidth>=1600?265:228,perspective=vertical?1800:mobile?950:innerWidth>=1600?1600:1300;const fit=M.fitScale(view,stage.clientWidth,stage.clientHeight,mobile,cardWidth,perspective,vertical);document.body.setAttribute('data-ribbon-axis',vertical?'vertical':'horizontal');syncPortraitRibbon(now,vertical);if(view==='ribbon')document.documentElement.style.setProperty('--ribbon-window',(M.ribbonWindowSpan(mobile,cardWidth,perspective,vertical)*fit+1)+'px');if(Math.abs(fit-lastFit)>.001){space.style.setProperty('--gallery-fit',String(fit));lastFit=fit;}
 if(!document.hidden&&!$('aboutDialog').open){
 const canRun=playing&&!drag&&now>pausedUntil&&!document.activeElement?.matches('input')&&!reduced.matches;
 const sequence=M.sequenceStep(view,sequenceElapsed,dt,canRun&&rows.length>0);sequenceElapsed=sequence.elapsed;if(sequence.changed)setView(sequence.view,true);document.documentElement.style.setProperty('--sequence-progress',String(sequenceElapsed/M.viewDuration));
 if(view==='ribbon'){
  if(!ribbonMotion&&ribbonRequest!=null){if(ribbonRequest!==Math.round(position))ribbonMotion={from:Math.round(position),to:ribbonRequest,elapsed:0,manual:true};ribbonRequest=null;}
  if(!ribbonMotion&&canRun&&rows.length>1){ribbonHoldMs+=dt;if(ribbonHoldMs>=M.ribbonHold){ribbonMotion={from:Math.round(position),to:Math.round(position)+1,elapsed:0,manual:false};target=ribbonMotion.to;ribbonHoldMs=0;}}
  if(ribbonMotion&&!drag&&(ribbonMotion.manual||canRun)){
   ribbonMotion.elapsed=reduced.matches?M.ribbonDuration:Math.min(M.ribbonDuration,ribbonMotion.elapsed+dt);position=M.ribbonPosition(ribbonMotion.from,ribbonMotion.to,ribbonMotion.elapsed);
   if(ribbonMotion.elapsed>=M.ribbonDuration){position=ribbonMotion.to;target=ribbonRequest??position;ribbonMotion=null;ribbonHoldMs=0;}
  }
 }else{
  if(canRun&&rows.length>1){if(view==='canvas'){if(now-lastAuto>5000){target=Math.round(target)+1;lastAuto=now;}}else target+=M.flowDelta(view,dt);}
  const ease=reduced.matches?1:1-Math.pow(.001,dt/1000);if(drag?.moved)position=target;else position+=(target-position)*ease;if(Math.abs(target-position)<.0005)position=target;
 }
 if(rows.length){ensureCards();for(const card of cards.values()){
 const dest=project(card.index),k=reduced.matches||drag?.moved||view==='ribbon'&&ribbonMotion?1:1-Math.pow(.0002,dt/1000),s=card.state;for(const key in dest)if(key!=='layer')s[key]+=(dest[key]-s[key])*k;
 card.button.style.transform=`translate(-50%,-50%) translate3d(${s.x}px,${s.y}px,${s.z}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) rotateZ(${s.rz}deg) scale(${s.scale})`;
 card.button.style.opacity=s.opacity;card.button.style.visibility=s.opacity<.015?'hidden':'visible';card.button.style.zIndex=String(dest.layer??Math.round(s.z+1000));const current=card.index===Math.round(position),buffer=view==='ribbon'&&Math.abs(card.index-Math.round(position))>2;card.button.classList.toggle('is-buffer',buffer);card.button.setAttribute('aria-hidden',String(buffer));card.button.classList.toggle('is-current',current);card.button.setAttribute('aria-current',String(current));card.button.tabIndex=current?0:-1;
 }selection();}
 }
 requestAnimationFrame(frame);
}
$('languageBtn').addEventListener('click',()=>{lang=lang==='ko'?'en':'ko';try{localStorage.setItem(LANGUAGE_KEY,lang);}catch{}applyLanguage();pauseForInput();});
$('prev').addEventListener('click',()=>go(-1));$('next').addEventListener('click',()=>go(1));$('play').addEventListener('click',()=>{playing=!playing;lastAuto=performance.now();if(playing){pausedUntil=0;sequenceElapsed=0;}updatePlaying();});
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
$('filter').addEventListener('change',filter);
function key(e){if(e.target.closest('input,select,dialog')||e.target.closest('.view-switch,.play-button,.nav-arrow,.about-trigger'))return;if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();go(1);}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();go(-1);}else if(e.key==='Home'){e.preventDefault();choose(0);}else if(e.key==='End'){e.preventDefault();choose(rows.length-1);}else if(e.code==='Space'){e.preventDefault();playing=!playing;if(playing){pausedUntil=0;sequenceElapsed=0;}updatePlaying();}}
document.addEventListener('keydown',key);
stage.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button!==0||!rows.length)return;pauseForInput();const pan=panByView[view];drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:pan.x,startY:pan.y,moved:false};});
stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5&&!drag.moved){drag.moved=true;target=position;playing=false;updatePlaying();stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');}if(drag.moved){e.preventDefault();const pan=panByView[view];pan.x=drag.startX+dx;pan.y=drag.startY+dy;space.style.transform=`translate3d(${pan.x}px,${pan.y}px,0) scale(var(--gallery-fit,1))`;}});
function stopDrag(e){if(!drag||drag.id!==e.pointerId)return;const ended=drag;drag=null;if(ended.moved){suppressUntil=performance.now()+220;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}stage.classList.remove('dragging');pauseForInput();}
stage.addEventListener('pointerup',stopDrag);stage.addEventListener('pointercancel',stopDrag);stage.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)stopDrag(e);});
stage.addEventListener('wheel',e=>{if(e.ctrlKey||!e.deltaX&&!e.deltaY)return;e.preventDefault();pauseForInput();target=position;playing=false;updatePlaying();const pan=panByView[view];pan.x-=e.deltaX;pan.y-=e.deltaY;space.style.transform=`translate3d(${pan.x}px,${pan.y}px,0) scale(var(--gallery-fit,1))`;},{passive:false});
document.querySelectorAll('[data-about-choice]').forEach(button=>button.addEventListener('click',()=>{const language=button.dataset.aboutChoice;document.querySelectorAll('[data-about-lang]').forEach(section=>section.hidden=section.dataset.aboutLang!==language);document.querySelectorAll('[data-about-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.aboutChoice===language)));}));
$('aboutBtn').addEventListener('click',()=>{$('aboutDialog').showModal();});$('closeAbout').addEventListener('click',()=>{$('aboutDialog').close();});$('aboutDialog').addEventListener('click',e=>{if(e.target===$('aboutDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});$('aboutDialog').addEventListener('close',pauseForInput);
reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;updatePlaying();}});document.addEventListener('visibilitychange',()=>{last=performance.now();lastAuto=last;});
layoutExperienceLink();applyLanguage();setView(view,true);fetch('assets/palettes.json').then(r=>{if(!r.ok)throw Error('palette load failed');return r.json();}).then(data=>{const priority=new Map(opening.map((key,i)=>[key,i]));all=data.sort((a,b)=>(priority.get(a.id)??999)-(priority.get(b.id)??999)||a.en.localeCompare(b.en));filter(false);lastAuto=performance.now();requestAnimationFrame(frame);}).catch(()=>{$('empty').hidden=false;$('empty').textContent='컬러 컬렉션을 불러오지 못했어요. 새로고침해주세요.';});
})();
