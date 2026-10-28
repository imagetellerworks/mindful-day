(function(root,factory){
'use strict';
if(typeof module==='object'&&module.exports)module.exports=factory(require('./single-orb-model.js'),require('./palette-guide-data.js'),require('./semantic-mixing-model.js'));
else root.ColorFeedback=factory(root.SingleOrbMood,root.PaletteGuideData,root.SemanticMixing);
})(typeof window==='object'?window:this,function(SingleOrbMood,PaletteGuideData,SemanticMixing){
'use strict';
if(!SingleOrbMood||typeof SingleOrbMood.match!=='function')throw new Error('SingleOrbMood must be loaded first');
if(!PaletteGuideData||!Array.isArray(PaletteGuideData.PATTERNS))throw new Error('PaletteGuideData must be loaded first');
if(!SemanticMixing||typeof SemanticMixing.combine!=='function')throw new Error('SemanticMixing must be loaded first');

const SCENE_VERSION='color-scene/v1',FEEDBACK_VERSION='color-feedback/v2';
const PAGE_FEEDBACK_VERSION='color-feedback/v3',PROPOSAL_VERSION='color-proposal/v3';
const EXPLORATION_FEEDBACK_VERSION='color-feedback/v4',EXPLORATION_PROPOSAL_VERSION='color-proposal/v4';
const MODEL_VERSION='color-feedback/v8',GENERATOR_VERSION='original-64468a3/v1';
// The generator and initial 14-word classifier stay untouched. The survey
// layer adds source-documented alternatives; the viewer makes the association.
const ALTERNATIVES=[
 ['sunny','sunny','해맑은'],['joyful','joyful','기쁜'],['buoyant','buoyant','들뜬'],['bubbly','bubbly','발랄한'],['excited','excited','신나는'],
 ['warm','warm','따뜻한'],['tender','tender','다정한'],['comfortable','comfortable','편안한'],['gentle','gentle','부드러운'],['content','content','흡족한'],['relaxed','relaxed','느긋한'],['mellow','mellow','여유로운'],
 ['peaceful','peaceful','평온한'],['serene','serene','잔잔한'],['refreshed','refreshed','산뜻한'],['composed','composed','담담한'],['rested','rested','개운한'],['still','still','정적인'],['restrained','restrained','절제된'],['detached','detached','무심한'],
 ['pensive','pensive','생각에 잠긴'],['wistful','wistful','아련한'],['lonesome','lonesome','쓸쓸한'],['melancholy','melancholy','서글픈'],['heavy','heavy','무거운'],['withdrawn','withdrawn','움츠러든'],['forlorn','forlorn','허전한'],['resigned','resigned','체념한'],['solemn','solemn','엄숙한'],['lonely','lonely','외로운'],
 ['uneasy','uneasy','불안한'],['unsettled','unsettled','뒤숭숭한'],['restless','restless','초조한'],['conflicted','conflicted','갈등하는'],['edgy','edgy','날이 선'],['overwhelmed','overwhelmed','압도된'],['alarmed','alarmed','놀란'],['guarded','guarded','방어적인'],['vulnerable','vulnerable','위태로운'],
 ['fierce','fierce','격렬한'],['heated','heated','달아오른'],['angry','angry','화가 난'],['irritated','irritated','짜증나는'],['stifled','stifled','답답한'],['bold','bold','대담한'],['curious','curious','궁금한'],['enchanted','enchanted','매혹된'],['delicate','delicate','여린'],['sensitive','sensitive','예민한'],['uncertain','uncertain','확신이 없는'],['complex','complex','엇갈린'],
 ['hypnotic','hypnotic','최면적인'],['mysterious','mysterious','신비로운'],['hazy','hazy','아스라한'],['fantastical','fantastical','환상적인'],['enraptured','enraptured','황홀한'],['eerie','eerie','기묘한'],['surreal','surreal','초현실적인'],['fairytale','fairytale','동화 같은'],['magical','magical','마법 같은'],['magnificent','magnificent','장엄한'],['luminous','luminous','눈부신'],['otherworldly','otherworldly','초월적인'],['ethereal','ethereal','투명하고 신비로운'],['heavenly','heavenly','성스럽고 완벽한'],
 ['sensual','sensual','관능적인'],['romantic','romantic','설레는'],['enchanting','enchanting','매혹적인']
].map(([id,en,ko])=>({id,en,ko}));
const FRICTION_WORDS=[["ambivalent","양가적인","반대되는 두 마음이 동시에 남는 느낌"],["torn","마음이 갈리는","양쪽으로 끌려 어느 쪽도 놓기 어려운 느낌"],["bittersweet","씁쓸하고도 달콤한","기쁨과 슬픔이 함께 남는 느낌"],["poignant","가슴이 저릿한","아름다움이나 그리움에 아픔이 스미는 느낌"],["dissonant","어긋나는","서로 다른 결이 엇박자를 만드는 느낌"],["discordant","조화롭지 않은","요소들이 어울리지 않고 따로 노는 느낌"],["clashing","충돌하는","강한 두 기운이 맞부딪히는 느낌"],["jarring","거슬리는","대비가 갑작스럽고 감각을 건드리는 느낌"],["unbalanced","균형이 흔들리는","한쪽으로 쏠려 중심이 불안정한 느낌"],["wavering","흔들리는","마음이나 인상이 한곳에 머물지 못하는 느낌"],["strained","팽팽한","힘을 준 채 긴장이 이어지는 느낌"],["unresolved","풀리지 않는","끝맺거나 해소하지 못한 기운이 남는 느낌"],["agitated","동요하는","감정이 일렁이며 쉽게 가라앉지 않는 느낌"],["overstimulated","자극이 과한","여러 자극이 한꺼번에 몰려드는 느낌"],["overloaded","버거운","받아들이기에는 감정이나 정보가 너무 많은 느낌"],["disoriented","방향을 잃은","어디로 향해야 할지 감을 잡기 어려운 느낌"],["fragmented","조각난","하나로 모이지 않고 여러 조각으로 흩어진 느낌"],["disconnected","단절된","요소 사이의 연결이나 감정의 흐름이 끊긴 느낌"],["alienated","소외된","주변과 섞이지 못하고 떨어져 있는 느낌"],["hollow","공허한","안쪽이 비어 있는 듯 충만하지 못한 느낌"]].map(([id,ko,nuance])=>({id,en:id,ko,nuance}));
const ART_WORDS=PaletteGuideData.ART_WORDS;
const WORDS=SingleOrbMood.WORDS.concat(ALTERNATIVES,FRICTION_WORDS,ART_WORDS).map(w=>Object.freeze({...w}));
const BY_ID=Object.fromEntries(WORDS.map(w=>[w.id,w]));
const FEEL_KO=Object.freeze(Object.fromEntries(WORDS.map(w=>[w.id,w.ko])));
const SOFT_WORDS=new Set(['calm','cozy','clear','quiet','dreamy','warm','tender','comfortable','gentle','content','relaxed','mellow','peaceful','serene','refreshed','composed','rested','still','delicate','enchanted']);
const SOFT_WORDS_V3=new Set([...SOFT_WORDS,'ethereal','hazy','heavenly','fairytale']);
const modelLevel=version=>version==='color-feedback/v8'?8:version==='color-feedback/v7'?7:version==='color-feedback/v6'?6:version==='color-feedback/v5'?5:version==='color-feedback/v4'?4:version==='color-feedback/v3'?3:version==='color-feedback/v1'?1:2;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const round=v=>Math.round(v*1e6)/1e6;
const clone=v=>JSON.parse(JSON.stringify(v));
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function check(condition,message){if(!condition)throw new TypeError(message);}
function num(v,name,min,max){check(finite(v)&&v>=min&&v<=max,`${name} is out of range`);return round(v);}
function version(v,fallback,name){if(v==null)return fallback;check(typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,79}$/.test(v),`${name} is invalid`);return v;}
function layers(input,raw=false){
 check(Array.isArray(input)&&input.length===4,'An orb must contain four layers');
 return input.map((l,i)=>{
  check(l&&typeof l==='object',`Layer ${i} is invalid`);
  check(Array.isArray(l.col)&&l.col.length===3,'Layer color must be RGB');
  const col=l.col.map(v=>{check(finite(v)&&v>=-1e-7&&v<=255+1e-7&&(raw||Number.isInteger(v)),'Rendered RGB must be an integer from 0 to 255');return raw?round(clamp(v,0,255)):v;});
  return {col,r:num(l.r,'Layer radius',.000001,4),ox:num(l.ox,'Layer x offset',-4,4),oy:num(l.oy,'Layer y offset',-4,4),soft:num(l.soft,'Layer solid stop',0,1),a:num(l.a,'Layer opacity',0,1)};
 });
}

/** A bounded, identity-free renderer snapshot. Colors are already transformed. */
function canonicalScene(input){
 check(input&&typeof input==='object','A scene is required');
 check(input.schemaVersion==null||input.schemaVersion===SCENE_VERSION,'Unsupported scene schema');
 check(typeof input.background==='string'&&/^#[\da-f]{6}$/i.test(input.background),'A six-digit background color is required');
 check(Array.isArray(input.orbs)&&input.orbs.length>=1&&input.orbs.length<=3,'Choose one to three orbs');
 const mode=input.mode|| (input.orbs.length===1?'single':'mixing');
 check(mode==='single'||mode==='mixing','Scene mode is invalid');
 check(mode!=='single'||input.orbs.length===1,'Single mode contains one orb');
 const aspect=input.aspect||[9,16];check(Array.isArray(aspect)&&aspect.length===2,'Aspect is invalid');
 const tf=input.transform||{},modelVersion=version(input.modelVersion,MODEL_VERSION,'Model version');
 const out={schemaVersion:SCENE_VERSION,generatorVersion:version(input.generatorVersion,GENERATOR_VERSION,'Generator version'),modelVersion,mode,aspect:aspect.map(v=>num(v,'Aspect',.01,100)),background:input.background.toLowerCase(),transform:{hue:num(tf.hue??0,'Hue',-3600,3600),sat:num(tf.sat??1,'Saturation',0,10),light:num(tf.light??0,'Lightness',-2,2),contrast:num(tf.contrast??1,'Contrast',0,10),soft:num(tf.soft??1,'Softness',0,10)},orbs:input.orbs.map((o,i)=>{
  check(o&&o.position&&typeof o.position==='object','Orb position is required');
  const orb={slot:i,position:{x:num(o.position.x,'Orb x',-2,3),y:num(o.position.y,'Orb y',-2,3)},scale:num(o.scale,'Orb scale',.000001,8),layers:layers(o.layers)};
  if(o.paletteId!=null){check(typeof o.paletteId==='string'&&o.paletteId.length<=80,'Palette ID is invalid');orb.paletteId=o.paletteId;}
  if(o.rawLayers!=null)orb.rawLayers=layers(o.rawLayers,true);
  if(modelLevel(modelVersion)>=4&&o.colorName!=null){check(typeof o.colorName==='string'&&o.colorName.trim().length>0&&o.colorName.length<=80&&!/[\u0000-\u001f]/.test(o.colorName),'Color name is invalid');orb.colorName=o.colorName.trim();}
  return orb;
 })};
 return freeze(out);
}
// Stable checksums identify snapshots/proposals; these are not authentication.
function hash(value){let a=2166136261,b=2246822507;for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,3266489909);}return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');}
function fingerprint(scene){return 'scene/v1:'+hash(JSON.stringify(canonicalScene(scene)));}
function proposalToken(key,ids,history){return history==null?'proposal/v1:'+hash(JSON.stringify([key,ids])):'proposal/v2:'+hash(JSON.stringify([key,ids,history]));}
function pageToken(key,ids,page,timeline){return 'proposal/v3:'+hash(JSON.stringify([key,ids,page,timeline]));}
function explorationToken(key,stage,ids,page,family,timeline){return 'proposal/v4:'+hash(JSON.stringify([key,stage,ids,page,family,timeline]));}
const hex=value=>[1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
function lab(rgb){
 const [r,g,b]=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,bb=.0259040371*l+.7827717662*m-.808675766*s;
 return {L,a,b:bb,C:Math.hypot(a,bb),h:(Math.atan2(bb,a)*180/Math.PI+360)%360};
}
const hueGap=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
function paint(scene,x,y){
 let rgb=hex(scene.background),coverage=0;const ratio=scene.aspect[1]/scene.aspect[0],contributions=scene.orbs.map(()=>0);
 for(const [index,orb] of scene.orbs.entries())for(const l of orb.layers){
  const radius=l.r*orb.scale,dx=x-orb.position.x-l.ox*orb.scale,dy=y-orb.position.y*ratio-l.oy*orb.scale,d=Math.hypot(dx,dy)/radius;
  if(d>=1)continue;
  const solid=clamp(l.soft,0,.95),alpha=l.a*(d<=solid?1:(1-d)/(1-solid));
  rgb=rgb.map((v,i)=>l.col[i]*alpha+v*(1-alpha));coverage=alpha+coverage*(1-alpha);
  // Source-over also attenuates the visible contribution of every older orb.
  for(let i=0;i<contributions.length;i++)contributions[i]*=1-alpha;
  contributions[index]+=alpha;
 }
 return {...lab(rgb),coverage,contributions,x,y,rgb};
}
function ownCoverage(orb,x,y,ratio){let opacity=0;for(const l of orb.layers){const d=Math.hypot(x-orb.position.x-l.ox*orb.scale,y-orb.position.y*ratio-l.oy*orb.scale)/(l.r*orb.scale);if(d>=1)continue;const solid=clamp(l.soft,0,.95),alpha=l.a*(d<=solid?1:(1-d)/(1-solid));opacity=alpha+opacity*(1-alpha);}return opacity;}
function sampleScene(scene){
 const ratio=scene.aspect[1]/scene.aspect[0],grid=[];
 for(let y=0;y<24;y++)for(let x=0;x<24;x++)grid.push(paint(scene,(x+.5)/24,(y+.5)/24*ratio));
 const visible=grid.filter(p=>p.coverage>.06);
 const completeIndices=[];
 // The same body/support/core probes used for component impressions must be
 // inside the viewport and remain visible after later orbs are painted. This
 // prevents an offscreen or covered vivid core from describing a quiet poster.
 for(const [index,orb] of scene.orbs.entries()){
  const probes=[];
  for(const l of orb.layers){
   probes.push([orb.position.x+l.ox*orb.scale,orb.position.y*ratio+l.oy*orb.scale]);
   for(let i=0;i<12;i++){const a=i*Math.PI/6,d=l.r*.45;probes.push([orb.position.x+(l.ox+Math.cos(a)*d)*orb.scale,orb.position.y*ratio+(l.oy+Math.sin(a)*d)*orb.scale]);}
  }
  const body=orb.layers[1];
  for(const d of [.52,.66,.80,.90])for(let i=0;i<24;i++){const a=i*Math.PI/12;probes.push([orb.position.x+(body.ox+Math.cos(a)*body.r*d)*orb.scale,orb.position.y*ratio+(body.oy+Math.sin(a)*body.r*d)*orb.scale]);}
  let complete=true,hasProbe=false;
  for(const [x,y] of probes){
   const own=ownCoverage(orb,x,y,ratio);if(own<=.06)continue;
   if(x<0||x>1||y<0||y>ratio){complete=false;continue;}
   const p=paint(scene,x,y);hasProbe=true;
   if(p.coverage>.06)visible.push(p);
   if(p.contributions[index]/own<.96)complete=false;
  }
  if(complete&&hasProbe)completeIndices.push(index);
 }
 const visibleIndices=scene.orbs.map((_,i)=>i).filter(i=>visible.some(p=>p.contributions[i]>.025));
 const bg=lab(hex(scene.background));
 if(!visible.length)return {grid,visible,bg,visibleIndices,completeIndices,opposing:false,maxChroma:0,minL:bg.L,maxL:bg.L,lightGap:0};
 const hues=new Map();for(const p of visible)if(p.C>=.09){const k=Math.floor(p.h/15),prev=hues.get(k);if(!prev||prev.C<p.C)hues.set(k,p);}
 const accents=[...hues.values()];let opposing=false;
 for(let i=0;i<accents.length;i++)for(let j=i+1;j<accents.length;j++)if(hueGap(accents[i].h,accents[j].h)>=75&&Math.max(accents[i].C,accents[j].C)>=.13)opposing=true;
 const minL=Math.min(...visible.map(p=>p.L)),maxL=Math.max(...visible.map(p=>p.L));
 return {grid,visible,bg,visibleIndices,completeIndices,opposing,maxChroma:Math.max(...visible.map(p=>p.C)),minL,maxL,lightGap:maxL-minL};
}
function visiblePair(samples){
 const colored=samples.visible.filter(p=>p.C>.045),warm=colored.filter(p=>p.h<105||p.h>=335).length/Math.max(1,colored.length),cool=colored.filter(p=>p.h>=105&&p.h<=285).length/Math.max(1,colored.length);
 const sorted=samples.visible.map(p=>p.L).sort((a,b)=>a-b),middle=sorted[Math.floor(sorted.length/2)]??samples.bg.L;
 if(samples.maxChroma<.055)return ['quiet','mixed'];
 if(samples.maxChroma<.13&&middle<.46)return ['somber','subdued'];
 if(samples.maxChroma<.10&&middle<.67)return ['subdued','quiet'];
 if(warm>=.75&&samples.maxChroma>=.14&&middle>=.65&&samples.minL>=.60)return ['cheerful','lively'];
 if(warm>=.75&&samples.maxChroma>=.14&&samples.minL<.53)return ['fiery','intense'];
 if(samples.maxChroma>=.16&&samples.lightGap>.28)return ['intense','mixed'];
 if(cool>=.75&&samples.maxChroma<=.16&&samples.lightGap<=.28&&samples.minL>=.50&&samples.bg.L>=.50)return samples.minL>=.75?['clear','calm']:['calm','quiet'];
 if(warm>=.75&&samples.maxChroma<=.16&&samples.lightGap<=.28&&samples.minL>=.55&&samples.bg.L>=.50)return ['cozy','quiet'];
 if(samples.maxChroma<=.19&&samples.bg.L>=.75&&middle>=.75)return ['dreamy','mixed'];
 return ['mixed',samples.maxChroma>.15?'intense':samples.minL<.50?'subdued':samples.maxChroma<.10?'quiet':'dreamy'];
}
function editorialV1(scene){
 const samples=sampleScene(scene),parts=samples.visibleIndices.filter(i=>samples.completeIndices.includes(i)).map(i=>SingleOrbMood.match({layers:scene.orbs[i].layers,background:scene.background}));
 const allVisiblePartsComplete=parts.length===samples.visibleIndices.length;
 // Hard guards see only actual in-viewport source-over paint, never the hidden
 // original palette of an orb behind another orb or beyond the canvas edge.
 const strongOpposition=samples.opposing;
 let ids,rule;
 if(strongOpposition){
  if(samples.bg.L<.38||samples.minL<.46){ids=['tense','intense'];rule='dark-opposition';}
  else{ids=['playful','lively'];rule='light-opposition';}
 }else{
  const words=parts.map(p=>p.word),primary=allVisiblePartsComplete&&words.length&&words.every(w=>w===words[0])?words[0]:null;
  const pairs={cheerful:['cheerful','lively'],lively:['lively','cheerful'],playful:['playful','lively'],cozy:['cozy','quiet'],calm:['calm','quiet'],clear:['clear','calm'],quiet:['quiet','mixed'],subdued:['subdued','somber'],somber:['somber','subdued'],tense:['tense','intense'],fiery:['fiery','intense'],dreamy:['dreamy','mixed'],intense:['intense','mixed']};
  if(primary&&pairs[primary]){ids=pairs[primary];rule=samples.visibleIndices.length===1?parts[0].rule:'shared-impression';}
  else if(!allVisiblePartsComplete||!samples.visibleIndices.length){ids=visiblePair(samples);rule='visible-composition';}
  else{
   const distinct=[...new Set(words.filter(w=>w!=='mixed'))];
   if(samples.maxChroma>.16&&samples.lightGap>.28){ids=['intense','mixed'];rule='complex-vivid';}
   else if(distinct.length){ids=[distinct[0],distinct.find(w=>w!==distinct[0])||'mixed'];rule='multiple-impressions';}
   else{ids=['mixed',samples.maxChroma<.055?'quiet':samples.minL<.5?'subdued':samples.maxChroma>.15?'intense':'dreamy'];rule='ambiguous';}
  }
 }
 // Deep darkness and visible vivid opposition cannot be turned into comfort by
 // learned votes or a pale component orb. The second word remains an alternative.
 if(strongOpposition){ids=ids.filter(id=>!SOFT_WORDS.has(id));if(ids.length!==2)ids=['tense','intense'];}
 return {ids,rule,samples,strongOpposition};
}

function visualFeatures(base){
 const {samples}=base,visible=samples.visible,colored=visible.filter(p=>p.C>.018),total=Math.max(1,colored.length);
 const fraction=test=>colored.filter(test).length/total;
 const sorted=visible.map(p=>p.L).sort((a,b)=>a-b);
 return {rule:base.rule,opposition:base.strongOpposition,tension:base.strongOpposition&&base.rule==='dark-opposition',backgroundL:samples.bg.L,minL:samples.minL,maxL:samples.maxL,medianL:sorted[Math.floor(sorted.length/2)]??samples.bg.L,maxChroma:samples.maxChroma,lightGap:samples.lightGap,
  red:fraction(p=>p.h>=15&&p.h<45),orange:fraction(p=>p.h>=45&&p.h<80),yellow:fraction(p=>p.h>=80&&p.h<115),green:fraction(p=>p.h>=115&&p.h<180),teal:fraction(p=>p.h>=180&&p.h<225),blue:fraction(p=>p.h>=225&&p.h<285),purple:fraction(p=>p.h>=285&&p.h<325),pink:fraction(p=>p.h>=325||p.h<15),acid:fraction(p=>p.h>=80&&p.h<150),warm:fraction(p=>p.h<115||p.h>=325),greenNature:fraction(p=>p.h>=115&&p.h<225),lightNeutral:visible.filter(p=>p.L>=.78&&p.C<=.045).length/Math.max(1,visible.length)};
}
function layerContributions(orb,x,y,ratio){
 const contributions=[0,0,0,0];
 for(const [index,layer] of orb.layers.entries()){
  const d=Math.hypot(x-orb.position.x-layer.ox*orb.scale,y-orb.position.y*ratio-layer.oy*orb.scale)/(layer.r*orb.scale),solid=clamp(layer.soft,0,.95),alpha=d>=1?0:layer.a*(d<=solid?1:(1-d)/(1-solid));
  for(let i=0;i<4;i++)contributions[i]*=1-alpha;contributions[index]+=alpha;
 }
 return contributions;
}
function roleRelationship(scene,index,sceneSamples){
 const orb=scene.orbs[index],ratio=scene.aspect[1]/scene.aspect[0],roleNames=['halo','body','inner','core'],area=[0,0,0,0],grid=sceneSamples.grid;
 const contributionAt=(x,y,painted)=>{const own=layerContributions(orb,x,y,ratio),coverage=own.reduce((sum,value)=>sum+value,0),attenuation=coverage?(painted.contributions[index]||0)/coverage:0;return own.map(value=>value*attenuation);};
 for(const point of grid){const contribution=contributionAt(point.x,point.y,point);contribution.forEach((value,i)=>area[i]+=value/grid.length);}
 const total=area.reduce((sum,value)=>sum+value,0),roles=orb.layers.map((layer,layerIndex)=>{
  const samples=[];
  for(const radius of layerIndex===3?[0,.2,.4]:layerIndex===0?[.7,.85,.95]:[.45,.65,.8,.9])for(let step=0;step<24;step++){
   const angle=step*Math.PI/12,x=orb.position.x+(layer.ox+Math.cos(angle)*layer.r*radius)*orb.scale,y=orb.position.y*ratio+(layer.oy+Math.sin(angle)*layer.r*radius)*orb.scale;
   if(x<0||x>1||y<0||y>ratio)continue;
   const point=paint(scene,x,y),contribution=contributionAt(x,y,point)[layerIndex];if(contribution>.025)samples.push({...point,contribution});
  }
  samples.sort((a,b)=>b.contribution-a.contribution);const representative=samples.slice(0,Math.max(1,Math.ceil(samples.length/2))),median=values=>values.slice().sort((a,b)=>a-b)[Math.floor(values.length/2)];
  let color=null;if(representative.length){const L=median(representative.map(point=>point.L)),C=median(representative.map(point=>point.C)),point=representative.reduce((best,value)=>Math.abs(value.L-L)+Math.abs(value.C-C)<Math.abs(best.L-L)+Math.abs(best.C-C)?value:best),rgb=point.rgb.map(Math.round);color={rgb,hex:'#'+rgb.map(value=>value.toString(16).padStart(2,'0')).join(''),L:round(point.L),C:round(point.C),h:round(point.h)};}
  return {role:roleNames[layerIndex],sourceRGB:layer.col.slice(),geometry:{radius:layer.r,offsetX:layer.ox,offsetY:layer.oy,opacity:layer.a,solidStop:layer.soft},visibleArea:round(area[layerIndex]),shareOfOrb:round(total?area[layerIndex]/total:0),sampleCount:samples.length,color};
 });
 const body=roles[1],core=roles[3],background={rgb:hex(scene.background),...lab(hex(scene.background))},gap=body.color&&core.color?hueGap(body.color.h,core.color.h):0;
 const paleSkyBody=!!body.color&&body.color.h>=225&&body.color.h<=285&&body.color.L>=.72&&body.color.C>=.012&&body.color.C<=.075;
 const avocadoCore=!!core.color&&core.color.h>=110&&core.color.h<=175&&core.color.C>=.055&&core.color.L>=.46&&core.color.L<=.83;
 const visibleAccent=core.shareOfOrb>=.012&&core.visibleArea>=.001;
 return {slot:index,method:'visible-source-over-layer-probes',areaMethod:'24x24 viewport contribution estimate',roles,background:{rgb:background.rgb,L:round(background.L),C:round(background.C),h:round(background.h)},bodyCore:{hueGap:round(gap),lightnessDifference:body.color&&core.color?round(core.color.L-body.color.L):null,chromaDifference:body.color&&core.color?round(core.color.C-body.color.C):null,coreShare:core.shareOfOrb,paleSkyBody,avocadoCore,visibleAccent},rule:paleSkyBody&&avocadoCore&&visibleAccent?'green-vitality-in-pale-sky':'layered-color-relationship',reason:{ko:paleSkyBody&&avocadoCore&&visibleAccent?'넓고 옅은 하늘색 몸체와 작은 아보카도색 핵을 함께 읽어, 생기와 옅은 색의 대비를 제안해요.':'핵·몸체·안쪽·번짐의 실제 가시 색과 면적, 배경과의 대비를 구분해 읽어요.',en:paleSkyBody&&avocadoCore&&visibleAccent?'A broad pale sky-blue body and a small avocado-green core retain both vitality and pale contrast.':'Visible core, body, inner layer, halo, and background relationships are read separately.'}};
}
function patternMatches(when,features){
 return Object.entries(when).every(([name,condition])=>{
  const value=features[name];
  if(Array.isArray(condition))return condition.includes(value);
  if(condition&&typeof condition==='object')return finite(value)&&(condition.min==null||value>=condition.min)&&(condition.max==null||value<=condition.max);
  return value===condition;
 });
}
// Relative chroma describes the visible color's distance toward its sRGB
// gamut boundary at the same OKLCH lightness and hue. It is not a word score.
function relativeChroma(p){
 const h=p.h*Math.PI/180,inside=C=>{
  const a=C*Math.cos(h),b=C*Math.sin(h),l=(p.L+.3963377774*a+.2158037573*b)**3,m=(p.L-.1055613458*a-.0638541728*b)**3,s=(p.L-.0894841775*a-1.291485548*b)**3;
  return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].every(v=>v>=-1e-7&&v<=1+1e-7);
 };
 let low=0,high=.5;for(let i=0;i<16;i++){const mid=(low+high)/2;if(inside(mid))low=mid;else high=mid;}return clamp(p.C/Math.max(low,.001));
}
function toneInterpretation(family,p,relationship,current,modelVersion){
 const relative=relativeChroma(p),background=relationship.background,bodyGap=Math.abs(p.L-background.L);
 const profileFamily=family==='teal'?'blue':family,deepBoundary=({red:.50,orange:.57,yellow:.66,green:.48,blue:.45,purple:.50,pink:.50})[profileFamily]||.48;
 const lightnessClass=p.L<deepBoundary?'deep':p.L>=.78?'light':p.L>=.65?'bright':'mid',chromaClass=p.C>=.075&&relative>=.70?'vivid':p.C<.075||relative<.40?'muted':'moderate';
 const tone=p.L>=.78&&p.C<.12?'pastel':lightnessClass==='deep'?'deep':chromaClass==='vivid'?'vivid':chromaClass==='muted'?'muted':'base';
 const darkAccent=tone!=='deep'&&background.L<.28&&p.L>=.55&&p.C>=.10&&relative>=.65&&bodyGap>=.34;
 // Black imagery belongs to v8 only, and is read from the painted main
 // role. Source RGB, a tiny bright core, or a pastel envelope cannot trigger it.
 const blackProfile=modelLevel(modelVersion)>=8&&background.L<.28&&background.C<.05&&p.C>=.045&&relative>=.45&&
  !(['dark-chromatic-conflict','unresolved-color-relationship','avocado-core-pale-sky'].includes(current.context)||current.context==='mint-vitality'&&tone!=='vivid')&&
  (tone==='deep'||darkAccent&&chromaClass==='vivid')&&PaletteGuideData.BLACK_PROFILES.find(item=>item.colorFamily===family&&item.tone===(tone==='deep'?'deep':'vivid'));
 const profile=blackProfile||PaletteGuideData.TONE_PROFILES.find(item=>item.colorFamily===profileFamily&&item.tone===(darkAccent?'dark-accent':tone))||PaletteGuideData.TONE_PROFILES.find(item=>item.colorFamily===profileFamily&&item.tone===tone);
 const evidence={class:tone,lightnessClass,chromaClass,lightness:round(p.L),chroma:round(p.C),relativeChroma:round(relative),backgroundLightness:background.L,backgroundLightnessGap:round(bodyGap),attention:darkAccent?'high':'ordinary',profileId:profile?.id||null};
 if(!profile||!blackProfile&&['dark-chromatic-conflict','unresolved-color-relationship','deep-muted-blue','dark-earth','dark-neutral'].includes(current.context))return {evidence};
 // The user's pale sky/avocado relationship and a small living green center
 // remain explicit refinements, even when the broad envelope is pastel.
 if(current.context==='avocado-core-pale-sky'||current.context==='mint-vitality'&&tone!=='vivid')return {evidence:{...evidence,profileId:current.context}};
 return {evidence,ids:profile.candidates.slice(),context:profile.id,reason:profile.rationale,sources:profile.sourceIds,userReferenceIds:profile.userReferenceIds,basis:profile.basis,family:profile.family||(['bold','intense'].includes(profile.candidates[0])?'intensity':undefined)};
}
function foundationPair(base,modelVersion,relationship,features){
 if(!relationship)return null;
 // Read actual visible painted roles, not the largest chroma or a dark halo
 // pixel. A small bright core cannot erase the broader mint/rose body.
 const roles=relationship.roles.filter(role=>role.color&&role.shareOfOrb>=.12&&role.role!=='halo'),body=roles.find(role=>role.role==='body');
 const main=body&&body.shareOfOrb>=.2&&body.color.C>=.023?body:roles.filter(role=>role.color.C>=.023).sort((a,b)=>b.shareOfOrb-a.shareOfOrb)[0]||body||roles[0];
 if(!main)return null;
 const p=main.color;
 const family=p.C<.023?'neutral':p.h>=35&&p.h<90&&p.C<.13&&p.L<.70&&(modelLevel(modelVersion)<7||relativeChroma(p)<.58)?'brown':p.h>=325||p.h<(modelLevel(modelVersion)>=8&&p.L<.5?8:20)&&p.rgb[2]>p.rgb[1]+3?'pink':p.h<(modelLevel(modelVersion)>=7?35:45)?'red':p.h<80?'orange':p.h<115?'yellow':p.h<180?'green':p.h<225?'teal':p.h<285?'blue':'purple';
 const foundation=PaletteGuideData.FOUNDATIONS.find(item=>item.id===family);
 let ids=foundation.candidates.slice(),wordFamily=foundation.family,context='base',reason=`실제 주조색인 ${foundation.name}에서 이 기본 연상을 먼저 읽습니다.`;
 const core=relationship.roles.find(role=>role.role==='core'),coreColor=core?.color;
 const conflicts=[];
 for(const [i,a] of roles.entries())for(const b of roles.slice(i+1))if(a.color.C>=.035&&b.color.C>=.035&&Math.max(a.color.C,b.color.C)>=.075&&hueGap(a.color.h,b.color.h)>=110)conflicts.push([a,b]);
 const darkConflict=conflicts.some(pair=>pair.every(role=>role.color.C>=.12))&&(p.L<.5||relationship.background.L<.4);
 let supported=true;
 if(darkConflict){ids=['tense','intense'];wordFamily='tension';context='dark-chromatic-conflict';reason='실제로 넓게 보이는 서로 먼 고채도 색들이 어두운 맥락에서 충돌해 긴장과 강렬함을 제안합니다. 검정 배경이나 명도 차이만으로 판정하지 않습니다.';}
 else if(conflicts.length){
  // An unresolved juxtaposition keeps the main association but must not be
  // advertised as a completed prematch just to fill the catalog.
  ids=[ids[0],'uncertain'];context='unresolved-color-relationship';supported=false;reason='주조색의 기본 연상은 남기되, 다른 넓은 색과의 대립을 해석할 근거가 부족해 사람의 검토가 필요합니다.';
 }else if(family==='pink'){
  if(p.L>=.76&&p.C<.10){ids=['tender','delicate'];context='soft-pink';reason='옅고 부드러운 분홍의 다정함과 여림을 남깁니다. 낮은 채도를 우울함으로 바꾸지 않습니다.';}
  else if(p.L<.57&&coreColor&&coreColor.L<.3){ids=['romantic','wistful'];context='shadowed-rose';reason='짙은 로즈의 설렘에 실제로 어두운 핵이 더해져 아련함을 함께 제안합니다. 분홍의 기본 연상을 지우지 않습니다.';}
  else if(p.C>=.16){ids=['romantic','enchanting'];context='vivid-rose';reason='선명한 분홍의 설렘과 매혹을 제안합니다. 선명함 자체를 날이 섬으로 번역하지 않습니다.';}
 }else if(family==='green'){
  if(p.L>=.65&&coreColor&&coreColor.h>=115&&coreColor.h<180&&coreColor.L>=.6&&coreColor.C>=.10){ids=['refreshed','lively'];context='mint-vitality';reason='넓은 초록·민트의 산뜻함과 같은 계열의 밝은 초록 핵이 가진 생기를 함께 남깁니다.';}
  else{ids=['peaceful','refreshed'];wordFamily='cool';context='green-rest';reason='초록의 평온함과 산뜻함을 기본으로 읽습니다. 밝은 핵이나 어두운 배경과의 명도 차이는 색의 생기를 강조할 수 있습니다.';}
 }else if(family==='blue'||family==='teal'){
  if(family==='blue'&&p.L<.48&&p.C<.13&&relationship.background.L<.4){ids=['somber','melancholy'];wordFamily='melancholy';context='deep-muted-blue';reason='주조색 자체가 어둡고 탁한 파랑이며 어두운 배경으로 이어져 침울함과 서글픔을 제안합니다. 작은 어두운 핵만으로 슬픔을 판정하지 않습니다.';}
  else{ids=family==='blue'?['calm','clear']:['refreshed','calm'];context='water-clarity';reason='넓게 보이는 푸른색·물빛의 차분함과 맑음을 유지합니다. 같은 계열의 짙은 핵은 깊이를 더하며 날이 섬의 근거가 되지 않습니다.';}
 }else if(family==='brown'&&p.L<.42&&relationship.background.L<.4){ids=['lonesome','pensive'];wordFamily='melancholy';context='dark-earth';reason='실제로 갈색인 주조색이 어둡고 배경도 어두울 때 쓸쓸함과 사색을 제안합니다. 따뜻한 색 전체를 갈색으로 취급하지 않습니다.';}
 else if(family==='red'&&p.C>=.16&&p.L<.66){ids=['fiery','heated'];wordFamily='fiery';context='red-heat';reason='주조색 자체가 짙고 선명한 빨강일 때 불같은 열기와 달아오름을 제안합니다.';}
 else if(family==='neutral'&&p.L<.4){ids=['solemn','heavy'];wordFamily='melancholy';context='dark-neutral';reason='주조색 자체가 어두운 무채색이어서 엄숙함과 무게를 제안합니다.';}
 // Keep narrow, source-linked interpretations such as avocado inside sky,
 // Rose Bloom and the differentiated purple glows; never the broad generic
 // muted/depth catch-alls that caused the pink and Mint Leaf regressions.
 const special=!conflicts.length&&PaletteGuideData.PATTERNS.find(pattern=>pattern.minModelVersion&&modelLevel(pattern.minModelVersion)<=6&&((pattern.referenceId&&((family==='pink'&&pattern.referenceId==='rose-bloom')||(['green','teal'].includes(family)&&pattern.referenceId==='jade-petal')))||pattern.id==='avocado-core-pale-sky'||family==='purple'&&['violet-mystery','hypnotic-violet-glow','lavender-magic','soft-lavender'].includes(pattern.id))&&patternMatches(pattern.when,features));
 if(special){ids=special.candidates.slice();wordFamily=special.family;context=special.id;reason=special.rationale;}
 const tone=modelLevel(modelVersion)>=7?toneInterpretation(family,p,relationship,{context},modelVersion):null;
 if(tone?.ids){ids=tone.ids;context=tone.context;reason=tone.reason;wordFamily=tone.family||(['calm','clear','composed','peaceful','refreshed','relaxed'].includes(ids[0])?'cool':['sunny','cheerful','lively','excited','playful'].includes(ids[0])?'joyful':['fiery','fierce','heated'].includes(ids[0])?'fiery':ids[0]==='dreamy'?'dream':ids[0]==='hazy'?'haze':ids[0]==='hypnotic'?'hypnotic':foundation.family);}
 const contrast={bodyCoreHueGap:relationship.bodyCore.hueGap,bodyCoreLightnessDifference:relationship.bodyCore.lightnessDifference,bodyCoreChromaDifference:relationship.bodyCore.chromaDifference,coreShare:relationship.bodyCore.coreShare,emotionByContrastAlone:false};
 const basis={family,mainRole:main.role,mainColor:{...p},baseCandidates:foundation.candidates.slice(),baseAssociations:foundation.associations.slice(),context,contrast,...(tone?.basis?{interpretationBasis:tone.basis}:{}),...(tone?{tone:tone.evidence}:{})};
 const sourceIds=[...new Set(foundation.sources.concat(special?.sources||[],tone?.sources||[]))],rationale=`${foundation.name}의 기본 연상: ${foundation.associations.join('·')}. ${reason}`;
 return {...base,modelVersion,ids,family:wordFamily,strongOpposition:darkConflict,rule:supported?'guide:foundation-'+family+'-'+context:'editorial-boundary',guide:{version:PaletteGuideData.VERSION,id:supported?'foundation-'+family+'-'+context:null,name:foundation.name+'의 기본 연상과 배색 맥락',rationale,sourceIds,userReferenceIds:['user-general','user-foundations',...(tone?.userReferenceIds||[])],status:'provisional-review',minModelVersion:tone?.basis?'color-feedback/v8':modelLevel(modelVersion)>=7?'color-feedback/v7':'color-feedback/v6',foundation:basis}};
}
function guidePair(base,modelVersion,colorName,relationship){
 const features=visualFeatures(base),level=modelLevel(modelVersion);if(level>=4&&colorName)features.nameKey=colorName.toLowerCase().replace(/[^a-z]/g,'');
 if(level>=5&&relationship){features.paleSkyBody=relationship.bodyCore.paleSkyBody;features.avocadoCore=relationship.bodyCore.avocadoCore;features.visibleCoreAccent=relationship.bodyCore.visibleAccent;}
 if(level>=6){const matched=foundationPair(base,modelVersion,relationship,features);if(matched)return matched;}
 const pattern=PaletteGuideData.PATTERNS.find(pattern=>(!pattern.minModelVersion||modelLevel(pattern.minModelVersion)<=level)&&patternMatches(pattern.when,features));
 if(pattern)return {...base,modelVersion,ids:pattern.candidates.slice(),family:pattern.family,guide:{version:PaletteGuideData.VERSION,id:pattern.id,name:pattern.name,rationale:pattern.rationale,sourceIds:pattern.sources.slice(),userReferenceIds:pattern.userReferences.slice(),status:pattern.status||'editorial',minModelVersion:pattern.minModelVersion||'color-feedback/v2',...(level>=4&&pattern.referenceId?{referenceId:pattern.referenceId,symbolicAssociations:pattern.symbolicAssociations||[],nameEvidence:pattern.when.nameKey?{name:colorName,role:'secondary',visualCompatibility:'matched-curated-boundary'}:null}:{})},rule:'guide:'+pattern.id};
 // Uncovered boundaries receive two concrete, rejectable alternatives. These
 // are conservative editorial fallbacks, never a fabricated certainty score.
 const pair=features.maxChroma<.055?['quiet','still']:features.medianL<.60&&features.backgroundL<.55?['subdued','pensive']:features.maxChroma>.15?['intense','edgy']:features.medianL>=.70?(level>=3?['hazy','curious']:['dreamy','curious']):['pensive','uncertain'];
 return {...base,modelVersion,ids:pair,family:level>=3&&pair[0]==='hazy'?'haze':undefined,rule:'editorial-boundary',guide:{version:PaletteGuideData.VERSION,id:null,name:'경계에 있는 배색',rationale:'직접 대응하는 디자인 사례가 부족해 두 가지 해석을 제안합니다.',sourceIds:[],userReferenceIds:['user-interaction'],status:'provisional-review'}};
}
function visibleComponentBase(scene,base,index){
 // Visibility comes from the complete painting, while an orb's own word is
 // read from that orb's paint at those visible positions. A later pink orb
 // must not turn the still-visible neutral orb underneath into "dreamy".
 const individual={...scene,orbs:[scene.orbs[index]]};
 const visible=base.samples.visible.filter(sample=>sample.contributions[index]>.025).map(sample=>paint(individual,sample.x,sample.y)),minL=visible.length?Math.min(...visible.map(p=>p.L)):base.samples.bg.L,maxL=visible.length?Math.max(...visible.map(p=>p.L)):base.samples.bg.L;
 const samples={...base.samples,visible,minL,maxL,maxChroma:visible.length?Math.max(...visible.map(p=>p.C)):0,lightGap:maxL-minL};
 return {ids:visiblePair(samples),rule:'visible-component',samples,strongOpposition:false};
}
function editorial(scene){
 const legacy=editorialV1(scene);
 // Explicit older snapshots retain their old word sequence and proposal
 // checksums. New canvases identify this expanded model as v2.
 if(scene.modelVersion==='color-feedback/v1')return {...legacy,legacy:true,modelVersion:scene.modelVersion};
 const relationships=modelLevel(scene.modelVersion)>=5?legacy.samples.visibleIndices.map(index=>roleRelationship(scene,index,legacy.samples)):[],relationshipFor=index=>relationships.find(relationship=>relationship.slot===index);
 if(scene.mode!=='mixing'||legacy.samples.visibleIndices.length<2){const index=legacy.samples.visibleIndices[0]||0,matched=guidePair(legacy,scene.modelVersion,scene.orbs[index]?.colorName,relationshipFor(index));return relationships.length?{...matched,colorRelationships:relationships}:matched;}
 const components=legacy.samples.visibleIndices.map(index=>{
  let matched;
  if(legacy.samples.completeIndices.includes(index)){
   const individual={...scene,mode:'single',orbs:[scene.orbs[index]]};matched=guidePair(editorialV1(individual),scene.modelVersion,scene.orbs[index].colorName,relationshipFor(index));
  }else matched=guidePair(visibleComponentBase(scene,legacy,index),scene.modelVersion,scene.orbs[index].colorName,relationshipFor(index));
  return {slot:index,candidates:matched.ids.slice(),rule:matched.rule,guide:matched.guide};
 });
 // Color is first read for each visible orb. Combining those word meanings
 // is a separate, finite linguistic relation graph, not an RGB word average.
 // In v6 the first word is the declared primary interpretation. Alternatives
 // remain available for correction; enumerating all eight alternative paths
 // must not silently replace mint + calm with unrelated anxious meanings.
 const primary=modelLevel(scene.modelVersion)>=6;
 const attentionWords=modelLevel(scene.modelVersion)>=7?components.filter(component=>component.guide?.foundation?.tone?.attention==='high'&&['bold','intense'].includes(component.candidates[0])).map(component=>component.candidates[0]):[];
 const semantic={...SemanticMixing.combine(components.map(component=>({candidates:primary?component.candidates.slice(0,1):component.candidates})),{attentionWords}),...(primary?{mixingPolicy:'editorial-primary-per-orb',componentAlternatives:components.map(component=>component.candidates.slice())}:{})},proposed=semantic.ids.filter(id=>BY_ID[id]&&id!=='mixed');
 let ids=proposed.length===2&&proposed[0]!==proposed[1]?proposed:['pensive','uncertain'],visualGuard=null;
 const darkOpposition=legacy.strongOpposition&&legacy.rule==='dark-opposition';
 // Sadness combined with joy may remain wistful. Cross-orb hue contrast alone
 // must not replace that meaning with fear; guard only soothing proposals.
 const soothing=modelLevel(scene.modelVersion)>=3?SOFT_WORDS_V3:SOFT_WORDS;
 if(modelLevel(scene.modelVersion)<6&&legacy.strongOpposition&&ids.some(id=>soothing.has(id))){ids=legacy.ids.slice();visualGuard=legacy.rule;}
 return {...legacy,ids,modelVersion:scene.modelVersion,legacy:false,rule:'semantic:'+semantic.rule,family:visualGuard?(darkOpposition?'tension':'vibrant'):undefined,components,...(relationships.length?{colorRelationships:relationships}:{}),semantic:{...semantic,visualGuard},guide:{version:PaletteGuideData.VERSION,id:null,name:'오브별 감정의 의미 조합',rationale:visualGuard?'오브별 의미를 조합한 뒤 강한 색 대비를 확인해 편안한 감정 후보를 조정했습니다.':semantic.reason?.ko||'각 오브에 매칭된 단어의 관계를 조합했습니다.',sourceIds:[...new Set(components.flatMap(component=>component.guide?.sourceIds||[]))],userReferenceIds:['user-interaction']}};
}
// Rejection narrows the available suggestions for this unchanged picture. No
// word is a diagnosis or a factual name of the colors; the viewer makes that
// association. Each family has a finite, deliberately related vocabulary.
const FAMILIES={
 tension:['tense','intense','uneasy','unsettled','restless','conflicted','edgy','overwhelmed','alarmed','guarded','stifled','vulnerable'],
 vibrant:['playful','lively','cheerful','bubbly','buoyant','excited','joyful','sunny','bold','alarmed','curious','mixed'],
 joyful:['cheerful','lively','sunny','joyful','buoyant','bubbly','playful','excited','warm','tender','content','mixed'],
 fiery:['fiery','intense','fierce','heated','angry','irritated','restless','edgy','bold','overwhelmed','stifled','conflicted'],
 cool:['clear','calm','peaceful','serene','refreshed','composed','quiet','rested','still','relaxed','mellow','gentle'],
 warm:['cozy','quiet','warm','tender','comfortable','gentle','content','relaxed','mellow','calm','peaceful','serene'],
 neutral:['quiet','mixed','still','restrained','detached','composed','subdued','pensive','calm','serene','mellow','complex'],
 melancholy:['somber','subdued','melancholy','lonesome','heavy','pensive','withdrawn','forlorn','resigned','wistful','solemn','lonely'],
 dream:['dreamy','mixed','wistful','curious','enchanted','pensive','delicate','sensitive','quiet','gentle','complex','uncertain'],
 intensity:['intense','mixed','tense','restless','bold','conflicted','edgy','sensitive','overwhelmed','alarmed','unsettled','curious'],
 ambiguous:['mixed','complex','curious','uncertain','pensive','sensitive','detached','composed','delicate','quiet','wistful','subdued']
};
const FAMILIES_V3={...FAMILIES,
 airy:['ethereal','hazy','serene','delicate','clear','still','refreshed','gentle','quiet','composed','peaceful','rested'],
 haze:['hazy','delicate','pensive','wistful','quiet','still','curious','serene','mellow','sensitive','subdued','ethereal'],
 storybook:['fairytale','enraptured','heavenly','tender','warm','magical','enchanted','joyful','bubbly','gentle','luminous','content'],
 magic:['magical','fantastical','enraptured','enchanted','curious','fairytale','luminous','delicate','wistful','hypnotic','dreamy','sensitive'],
 mystery:['mysterious','hypnotic','otherworldly','curious','pensive','uncertain','eerie','surreal','guarded','unsettled','edgy','complex'],
 hypnotic:['hypnotic','enraptured','mysterious','otherworldly','fantastical','surreal','curious','enchanted','sensitive','complex','intense','pensive'],
 uncanny:['eerie','uneasy','surreal','unsettled','edgy','mysterious','conflicted','guarded','alarmed','tense','intense','overwhelmed'],
 surreal:['surreal','fantastical','magical','curious','enraptured','mysterious','hypnotic','otherworldly','bold','playful','complex','sensitive'],
 majestic:['magnificent','luminous','otherworldly','intense','bold','enraptured','mysterious','solemn','heated','fiery','curious','overwhelmed'],
 radiant:['luminous','enraptured','heavenly','joyful','buoyant','bold','cheerful','warm','excited','sunny','enchanted','content']
};
const FAMILIES_V4={...FAMILIES_V3,rose:['sensual','romantic','enchanting','warm','tender','enraptured','enchanted','gentle','joyful','content','magical','cozy']};
const FAMILIES_V5={...FAMILIES_V4,vitality:['refreshed','lively','clear','buoyant','playful','curious','relaxed','peaceful','content','joyful','calm','tender']};
const FAMILIES_V7={...FAMILIES_V5,friction:FRICTION_WORDS.map(word=>word.id)};
const FAMILIES_V8={...FAMILIES_V7,...Object.fromEntries(PaletteGuideData.BLACK_PROFILES.map(profile=>[profile.family,profile.candidates.concat(profile.alternatives)]))};
function familyFor(base){
 if(base.family)return base.family;
 const ids=base.ids;
 if(modelLevel(base.modelVersion)>=8){const profile=PaletteGuideData.BLACK_PROFILES.find(profile=>profile.candidates.includes(ids[0])||profile.alternatives.includes(ids[0]));if(profile)return profile.family;}
 if(modelLevel(base.modelVersion)>=4&&ids.some(id=>['sensual','romantic','enchanting'].includes(id)))return 'rose';
 if(modelLevel(base.modelVersion)>=3){
  for(const [family,words] of [['uncanny',['eerie']],['majestic',['magnificent']],['mystery',['otherworldly','mysterious']],['hypnotic',['hypnotic']],['surreal',['surreal']],['airy',['ethereal']],['haze',['hazy']],['storybook',['fairytale','heavenly']],['magic',['magical','fantastical']],['radiant',['luminous','enraptured']]])if(ids.some(id=>words.includes(id)))return family;
 }
 if(base.semantic&&ids.some(id=>['edgy','conflicted','uneasy','unsettled','restless','guarded','vulnerable'].includes(id)))return 'tension';
 if(base.semantic&&ids.some(id=>['wistful','pensive','lonesome','melancholy','heavy','withdrawn','forlorn','resigned','solemn','lonely'].includes(id)))return 'melancholy';
 if(base.strongOpposition)return base.rule==='dark-opposition'?'tension':'vibrant';
 if(ids.includes('fiery'))return 'fiery';
 if(ids.some(id=>['cheerful','lively','playful'].includes(id)))return 'joyful';
 if(ids.some(id=>['somber','subdued'].includes(id)))return 'melancholy';
 if(ids.includes('cozy'))return 'warm';
 if(ids.some(id=>id==='clear'||id==='calm'))return 'cool';
 if(ids.includes('quiet'))return 'neutral';
 if(ids.includes('intense')||ids.includes('tense'))return 'intensity';
 if(ids.includes('dreamy'))return 'dream';
 return 'ambiguous';
}
function poolFor(base){
 const family=familyFor(base),families=modelLevel(base.modelVersion)>=8?FAMILIES_V8:modelLevel(base.modelVersion)>=7?FAMILIES_V7:modelLevel(base.modelVersion)>=5?FAMILIES_V5:modelLevel(base.modelVersion)>=4?FAMILIES_V4:modelLevel(base.modelVersion)>=3?FAMILIES_V3:FAMILIES,replacement={vibrant:'sensitive',joyful:'gentle',neutral:'comfortable',dream:'mellow',intensity:'fierce',ambiguous:'restless'},alternatives=base.legacy?families[family]:families[family].map(id=>id==='mixed'?replacement[family]||'uncertain':id),pool=[...new Set(base.ids.concat(alternatives))].filter(id=>base.legacy||id!=='mixed');
 // Complete pairs make a pass unambiguous: every word is seen before any
 // repeats. Base suggestions always lead; only the last alternative is trimmed.
 if(pool.length%2)pool.pop();
 if(base.strongOpposition&&(base.rule==='dark-opposition'||base.semantic?.visualGuard==='dark-opposition'||family==='tension'))check(pool.every(id=>!SOFT_WORDS.has(id)),'Tense colors cannot use a soothing pool');
 return {family,pool};
}
function canonicalHistory(input=[]){
 check(Array.isArray(input),'Rejection history must be an array');
 return input.map(item=>{
  check(item&&item.action==='rejected','History must contain explicit rejections');
  check(Array.isArray(item.candidates)&&item.candidates.length===2,'A rejected pair must contain two candidates');
  const ids=item.candidates;
  check(ids.every(id=>typeof id==='string'&&BY_ID[id])&&ids[0]!==ids[1],'Rejected candidates must be distinct known words');
  return {candidates:ids.slice(),action:'rejected'};
 });
}
function pageNumber(value){check(Number.isSafeInteger(value)&&value>=0,'Page must be a nonnegative safe integer');return value;}
/** Viewing another pair is distinct from explicitly rejecting a pair. */
function canonicalTimeline(input=[]){
 check(Array.isArray(input),'Suggestion timeline must be an array');
 return freeze(input.map(event=>{
  check(event&&typeof event==='object'&&(event.action==='viewed'||event.action==='rejected'),'Timeline actions must be viewed or rejected');
  const page=pageNumber(event.page),ids=event.candidates;
  check(Array.isArray(ids)&&ids.length===2&&ids.every(id=>typeof id==='string'&&BY_ID[id])&&ids[0]!==ids[1],'Timeline candidates must be two distinct known words');
  return {page,candidates:ids.slice(),action:event.action};
 }));
}
function rejectionHistory(timeline){return freeze(timeline.filter(event=>event.action==='rejected').map(event=>({page:event.page,candidates:event.candidates.slice(),action:'rejected'})));}
function canonicalPageHistory(input){
 check(Array.isArray(input),'Paged feedback requires its rejection history');
 const history=canonicalTimeline(input);check(history.every(event=>event.action==='rejected'),'Rejection history must contain only rejected timeline events');return history;
}
const samePair=(a,b)=>a.length===b.length&&a.every(id=>b.includes(id));
const sameOrder=(a,b)=>a.length===b.length&&a.every((id,index)=>id===b[index]);
function sequencePair(pool,round){
 const pairs=pool.length/2,pass=Math.floor(round/pairs),within=round%pairs;
 // Starting the next pass at a different pair avoids an immediate repeat even
 // after the finite editorial vocabulary has been rejected in full.
 const pair=(within+pass)%pairs,start=pair*2;
 return {ids:pool.slice(start,start+2),pass};
}
function proposalState(base,history){
 const {family,pool}=poolFor(base);
 for(let i=0;i<history.length;i++)check(samePair(history[i].candidates,sequencePair(pool,i).ids),'Rejection history does not replay this scene');
 return {family,pool,...sequencePair(pool,history.length)};
}
function navigationState(base,page,inputTimeline,{finalIds}={}){
 pageNumber(page);const timeline=canonicalTimeline(inputTimeline),{family,pool}=poolFor(base);let previous=null;
 for(const event of timeline){
  check(samePair(event.candidates,sequencePair(pool,event.page).ids),'Timeline candidates do not replay this scene page');
  if(event.action==='rejected')check(previous&&previous.action==='viewed'&&previous.page===event.page&&sameOrder(previous.candidates,event.candidates),'A rejection must follow its matching viewed pair');
  previous=event;
 }
 if(finalIds)check(previous&&previous.action==='viewed'&&previous.page===page&&sameOrder(previous.candidates,finalIds),'The final choice must match the last viewed page and pair');
 return {family,pool,timeline,...sequencePair(pool,page)};
}
const DIRECTIONS=freeze([{id:'brighter',en:'Brighter',ko:'더 밝은 느낌'},{id:'subdued',en:'Subdued',ko:'더 가라앉고 우울한 느낌'}]);
const FRICTION_DIRECTION=freeze({id:'friction',en:'Conflicting',ko:'엇갈리고 균형이 흔들리는 느낌'});
function familyName(value){check(typeof value==='string'&&/^[a-z][a-z0-9-]{0,39}$/.test(value),'Exploration family is invalid');return value;}
function canonicalExplorationTimeline(input=[]){
 check(Array.isArray(input),'Exploration timeline must be an array');
 return freeze(input.map(event=>{
  check(event&&typeof event==='object','Exploration event is invalid');
  if(event.action==='direction'){
   check(DIRECTIONS.concat(FRICTION_DIRECTION).some(option=>option.id===event.direction),'Exploration direction is invalid');
   return {action:'direction',direction:event.direction,fromFamily:familyName(event.fromFamily),toFamily:familyName(event.toFamily)};
  }
  const normalized=canonicalTimeline([event])[0];return {...normalized,family:familyName(event.family)};
 }));
}
function explorationHistory(timeline){return freeze(timeline.filter(event=>event.action==='rejected').map(event=>({page:event.page,candidates:event.candidates.slice(),action:'rejected',family:event.family})));}
function darkOpposition(base){return base.strongOpposition&&(base.samples.bg.L<.38||base.samples.minL<.46);}
function initialExplorationPool(base){let pool=[...new Set(poolFor(base).pool.map(id=>id==='mixed'?'uncertain':id))];if(pool.length%2)pool.pop();return pool;}
function explorationPool(base,family){
 if(family===familyFor(base))return initialExplorationPool(base);
 const choices=(modelLevel(base.modelVersion)>=8?FAMILIES_V8[family]:modelLevel(base.modelVersion)>=7?FAMILIES_V7[family]:null)||FAMILIES_V4[family]||FAMILIES_V5[family];check(Array.isArray(choices),'Unknown exploration family');
 let pool=[...new Set(choices)].filter(id=>id!=='mixed'&&BY_ID[id]);
 if(darkOpposition(base))pool=pool.filter(id=>!SOFT_WORDS_V3.has(id)&&!['romantic','enchanting','sensual'].includes(id));
 if(pool.length%2)pool.pop();check(pool.length>=4,'Exploration family has too few compatible words');return pool;
}
function nextExplorationFamily(base,direction,current,visited){
 if(direction==='friction'){check(modelLevel(base.modelVersion)>=7&&current!=='friction','This model cannot enter that feeling family');return 'friction';}
 const routes=darkOpposition(base)?{brighter:['intensity','fiery','majestic','uncanny'],subdued:['melancholy','mystery','uncanny','tension']}:{brighter:['joyful','radiant','rose','storybook','warm','vitality','cool'],subdued:['melancholy','haze','neutral','mystery','uncanny','tension']};
 const route=routes[direction];check(route,'Exploration direction is invalid');
 const eligible=route.filter(family=>family!==current&&explorationPool(base,family).length>=4),unseen=eligible.find(family=>!visited.includes(family));
 if(unseen)return unseen;
 const start=route.indexOf(current);for(let step=1;step<=route.length;step++){const family=route[(Math.max(start,0)+step)%route.length];if(eligible.includes(family))return family;}
 check(false,'No alternative exploration family is available');
}
function explorationState(base,inputTimeline){
 const timeline=canonicalExplorationTimeline(inputTimeline),initialFamily=familyFor(base),visited=[initialFamily];let family=initialFamily,pool=initialExplorationPool(base),seen=new Set(),previous=null,segmentStart=0,direction=null;
 for(let index=0;index<timeline.length;index++){
  const event=timeline[index];
  if(event.action==='direction'){
   check(previous&&(pool.every(id=>seen.has(id))||modelLevel(base.modelVersion)>=7&&event.direction==='friction'&&family!=='friction'&&seen.size>=2),'A direction can be chosen only after every current-family word was explicitly rejected, or a v7 friction request follows an explicit rejection');
   check(event.fromFamily===family,'The exploration direction leaves a different family');
   const target=nextExplorationFamily(base,event.direction,family,visited);check(event.toFamily===target,'The exploration direction does not match its next compatible family');
   family=target;pool=explorationPool(base,family);seen=new Set();visited.push(family);segmentStart=index+1;direction=event.direction;
  }else{
   check(event.family===family,'The viewed pair belongs to a different exploration family');
   check(samePair(event.candidates,sequencePair(pool,event.page).ids),'Exploration candidates do not replay their family page');
   if(previous?.action==='direction')check(event.action==='viewed'&&event.page===0,'A new exploration family starts with its first page');
   if(event.action==='rejected'){
    check(previous&&previous.action==='viewed'&&previous.family===family&&previous.page===event.page&&sameOrder(previous.candidates,event.candidates),'A rejection must follow its matching viewed exploration pair');event.candidates.forEach(id=>seen.add(id));
   }
  }
  previous=event;
 }
 return {timeline,initialFamily,family,pool,visited,seen,previous,segment:timeline.slice(segmentStart),direction,exhausted:pool.every(id=>seen.has(id))};
}
function validIdentity(id){return typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(id);}
function validDate(value){return typeof value==='string'&&value.length<=40&&Number.isFinite(Date.parse(value));}
function recordErrors(record){
 const errors=[];
 try{
  check(record&&[FEEDBACK_VERSION,PAGE_FEEDBACK_VERSION,EXPLORATION_FEEDBACK_VERSION,'color-feedback/v1'].includes(record.schemaVersion),'Unsupported feedback schema');
  check(validIdentity(record.id),'Feedback ID is invalid');
  check(validDate(record.createdAt),'Feedback date is invalid');
  check(record.source==='human-choice','Only explicit human choices are accepted');
  const scene=canonicalScene(record.scene),key=fingerprint(scene);
  check(record.sceneKey===key,'Feedback snapshot fingerprint differs');
  check(record.generatorVersion===scene.generatorVersion&&record.modelVersion===scene.modelVersion,'Feedback versions differ');
  check(Array.isArray(record.suggestions)&&record.suggestions.length===2,'Two suggestions are required');
  const ids=record.suggestions.map(w=>w&&w.id);
  check(ids.every(id=>BY_ID[id])&&ids[0]!==ids[1],'Suggestions must be two distinct known words');
  check(ids.includes(record.selectedWord),'Selected word must belong to the displayed pair');
  check(record.suggestions.every(w=>w.en===BY_ID[w.id].en&&w.ko===BY_ID[w.id].ko),'Suggestion text differs from its word');
  const base=editorial(scene),legacy=record.schemaVersion==='color-feedback/v1',paged=record.schemaVersion===PAGE_FEEDBACK_VERSION,exploring=record.schemaVersion===EXPLORATION_FEEDBACK_VERSION;
  check(!legacy||record.history==null,'Legacy feedback cannot include unbound history');
  let permitted;
  if(exploring){
   check(Array.isArray(record.history),'Exploration feedback requires its rejection history');
   const state=explorationState(base,record.timeline),provided=canonicalExplorationTimeline(record.history),history=explorationHistory(state.timeline);pageNumber(record.page);
   check(provided.every(event=>event.action==='rejected')&&JSON.stringify(provided)===JSON.stringify(history),'Feedback rejection history differs from its exploration timeline');
   check(record.family===state.family&&state.previous?.action==='viewed'&&state.previous.page===record.page&&sameOrder(state.previous.candidates,ids),'The final choice must match the last viewed exploration family and pair');
   check(record.proposalToken===explorationToken(key,'words',ids,record.page,record.family,state.timeline),'Feedback proposal token differs');permitted=sequencePair(state.pool,record.page).ids;
  }else if(paged){
   const state=navigationState(base,record.page,record.timeline,{finalIds:ids}),history=rejectionHistory(state.timeline),provided=canonicalPageHistory(record.history);
   check(JSON.stringify(provided)===JSON.stringify(history),'Feedback rejection history differs from its timeline');
   check(record.proposalToken===pageToken(key,ids,record.page,state.timeline),'Feedback proposal token differs');permitted=state.ids;
  }else{
   const history=legacy?undefined:canonicalHistory(record.history);
   check(record.proposalToken===proposalToken(key,ids,history),'Feedback proposal token differs');permitted=legacy?base.ids:proposalState(base,history).ids;
  }
  check(ids.every(id=>permitted.includes(id)),'Suggestions do not match this scene');
 }catch(error){errors.push(error.message);}
 return errors;
}
function validateRecord(record){const errors=recordErrors(record);return {ok:errors.length===0,errors};}
function distance(a,b){
 let sum=0,weight=0;
 for(let i=0;i<a.grid.length;i++){const x=a.grid[i],y=b.grid[i],w=Math.max(x.coverage,y.coverage);if(w<.02)continue;sum+=((x.L-y.L)**2+(x.a-y.a)**2+(x.b-y.b)**2)*w;weight+=w;}
 const bg=Math.hypot(a.bg.L-b.bg.L,a.bg.a-b.bg.a,a.bg.b-b.bg.b);
 return (weight?Math.sqrt(sum/weight):0)+bg*.5;
}
/** Retrieval of accepted local choices; no model/LLM training or user inference. */
function learn(input,records=[],context){
 const scene=canonicalScene(input),key=fingerprint(scene),base=editorial(scene),initial=poolFor(base),permitted=context?.pool||initial.pool,expectedFamily=context?.family||initial.family,expectedDirection=context?.direction||null,deduped=new Map();
 for(const record of Array.isArray(records)?records:[]){
  if(!validateRecord(record).ok)continue;
  if(deduped.has(record.id))continue;deduped.set(record.id,record);
 }
 const neighbors=[];
 for(const record of deduped.values()){
  const other=record.scene;
  if(record.schemaVersion===EXPLORATION_FEEDBACK_VERSION){const direction=record.timeline.findLast(event=>event.action==='direction')?.direction||null;if(record.family!==expectedFamily||direction!==expectedDirection)continue;}
  else if(expectedDirection||expectedFamily!==initial.family)continue;
  if(other.generatorVersion!==scene.generatorVersion||other.modelVersion!==scene.modelVersion||other.mode!==scene.mode||other.orbs.length!==scene.orbs.length||!permitted.includes(record.selectedWord))continue;
  const otherBase=editorial(other);
  if(otherBase.strongOpposition!==base.strongOpposition||(otherBase.samples.bg.L<.38)!==(base.samples.bg.L<.38))continue;
  const d=record.sceneKey===key?0:distance(base.samples,otherBase.samples);
  // A later explicit selection supersedes an earlier rejection of that same
  // word in this one session. Its original history is still preserved intact.
  if(d<=.035)neighbors.push({id:record.id,selectedWord:record.selectedWord,rejected:[...new Set((record.history||[]).flatMap(item=>item.candidates))].filter(id=>id!==record.selectedWord),distance:d,exact:record.sceneKey===key});
 }
 // An exact snapshot is a better reference than merely similar pictures.
 const exact=neighbors.filter(n=>n.exact),pool=exact.length>=3?exact:neighbors;
 pool.sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
 const nearest=pool.slice(0,30),counts=Object.fromEntries(permitted.map(id=>[id,0])),rejections=Object.fromEntries(permitted.map(id=>[id,0]));
 nearest.forEach(n=>counts[n.selectedWord]++);
 nearest.forEach(n=>n.rejected.forEach(id=>{if(id in rejections)rejections[id]++;}));
 const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]||rejections[a[0]]-rejections[b[0]]||permitted.indexOf(a[0])-permitted.indexOf(b[0]));
 const support=nearest.length,agreement=support?ranked[0][1]/support:0,margin=support?(ranked[0][1]-ranked[1][1])/support:0;
 const positiveRate=ranked[0][1]/Math.max(1,ranked[0][1]+rejections[ranked[0][0]]),supported=support>=3&&agreement>=.75&&margin>=.25&&positiveRate>=.75;
 return freeze({status:supported?'supported':'insufficient',wordId:supported?ranked[0][0]:null,support,agreement:round(agreement),margin:round(margin),scope:'local-reference',method:exact.length>=3?'exact-snapshot':'nearby-snapshots',neighborIds:nearest.map(n=>n.id),rejections});
}
function suggestPair(input,{records=[],history:inputHistory=[]}={}){
 const scene=canonicalScene(input),base=editorial(scene),history=canonicalHistory(inputHistory),state=proposalState(base,history),learning=learn(scene,records),ids=state.ids.slice();
 const applied=learning.status==='supported'&&ids.includes(learning.wordId);
 if(applied)ids.sort((a,b)=>(a===learning.wordId?-1:b===learning.wordId?1:0));
 const sceneKey=fingerprint(scene);
 return freeze({sceneKey,token:proposalToken(sceneKey,ids,history),candidates:ids.map(id=>({...BY_ID[id]})),history,round:history.length,pass:state.pass,family:state.family,poolSize:state.pool.length,rule:base.rule,matchStatus:coverage({...base,candidates:ids,learning}),source:applied?'local-reference':'editorial',learning,guide:base.guide||null,components:base.components||[],semantic:base.semantic||null,...(base.colorRelationships?{colorRelationships:base.colorRelationships}:{})});
}
/** Coverage describes editorial support, never RGB novelty or human approval. */
function coverage(proposal){
 check(proposal&&typeof proposal==='object','A palette proposal is required');
 const components=proposal.components||[],semantic=proposal.semantic,scope=components.length>1?'multi':'single',rule=semantic?.rule||proposal.rule||(proposal.guide?.id?'guide:'+proposal.guide.id:proposal.guide?'editorial-boundary':null);
 const learned=proposal.learning;
 if(learned?.status==='supported'&&learned.support>=3&&learned.agreement>=.75&&learned.margin>=.25&&Array.isArray(proposal.candidates)&&proposal.candidates.some(word=>(typeof word==='string'?word:word.id)===learned.wordId))return freeze({matched:true,reason:'accepted-reference-support',scope,rule,unmatchedSlots:[]});
 if(scope==='single')return freeze({matched:!!proposal.guide?.id,reason:proposal.guide?.id?'documented-palette-pattern':'editorial-boundary',scope,rule,unmatchedSlots:proposal.guide?.id?[]:[components[0]?.slot??0]});
 const unmatchedSlots=components.filter(component=>!component.guide?.id).map(component=>component.slot),fallback=new Set(['coexisting-impressions']);
 const interpretations=semantic?.relationships?.interpretations||[],supported=!!semantic&&typeof semantic.rule==='string'&&!fallback.has(semantic.rule)&&interpretations.length>0&&interpretations.every(path=>!fallback.has(path.rule));
 return freeze({matched:unmatchedSlots.length===0&&supported,reason:unmatchedSlots.length?'unclassified-component':supported?'documented-components-and-semantic-relation':'unsupported-semantic-relation',scope,rule,unmatchedSlots});
}
function suggestPage(input,{records=[],page=0,timeline:inputTimeline=[],direction,review=false,exploration=false}={}){
 check(typeof exploration==='boolean'&&typeof review==='boolean','Exploration and review options must be booleans');
 if(direction!=null)check(typeof direction==='string'&&DIRECTIONS.concat(FRICTION_DIRECTION).some(option=>option.id===direction),'Exploration direction is invalid');
 const current=canonicalScene(input);if(exploration||modelLevel(current.modelVersion)>=5)return suggestExploration(current,{records,page,timeline:inputTimeline,direction,review});
 const scene=canonicalScene(input),base=editorial(scene),state=navigationState(base,page,inputTimeline),learning=learn(scene,records),previous=state.timeline.findLast(event=>event.action==='viewed'&&event.page===page),ids=previous?previous.candidates.slice():state.ids.slice();
 // Going back restores exactly what was shown, even if new reference data
 // arrived meanwhile. Learning can order a page when it is first visited.
 const applied=!previous&&learning.status==='supported'&&ids.includes(learning.wordId);
 if(applied)ids.sort((a,b)=>(a===learning.wordId?-1:b===learning.wordId?1:0));
 const timeline=canonicalTimeline(state.timeline.concat({page,candidates:ids.slice(),action:'viewed'})),history=rejectionHistory(timeline),sceneKey=fingerprint(scene);
 return freeze({schemaVersion:PROPOSAL_VERSION,sceneKey,token:pageToken(sceneKey,ids,page,timeline),candidates:ids.map(id=>({...BY_ID[id]})),page,timeline,history,round:history.length,pass:state.pass,family:state.family,poolSize:state.pool.length,rule:base.rule,matchStatus:coverage({...base,candidates:ids,learning}),source:applied?'local-reference':'editorial',learning,guide:base.guide||null,components:base.components||[],semantic:base.semantic||null,...(base.colorRelationships?{colorRelationships:base.colorRelationships}:{})});
}
function suggestExploration(scene,{records=[],page=0,timeline=[],direction,review=false}={}){
 pageNumber(page);const base=editorial(scene);let state=explorationState(base,timeline);
 if(direction!=null){
  check(state.exhausted||modelLevel(scene.modelVersion)>=7&&direction==='friction'&&state.family!=='friction'&&state.seen.size>=2,'Choose a direction only after explicitly rejecting every current-family candidate, or request friction after one explicit rejection');check(page===0,'A new direction starts on page zero');
  const target=nextExplorationFamily(base,direction,state.family,state.visited);
  state=explorationState(base,state.timeline.concat({action:'direction',direction,fromFamily:state.family,toFamily:target}));
 }
 const sceneKey=fingerprint(scene),history=explorationHistory(state.timeline),shared={schemaVersion:EXPLORATION_PROPOSAL_VERSION,sceneKey,family:state.family,poolSize:state.pool.length,round:history.length,history,timeline:state.timeline,matchStatus:coverage(base),guide:base.guide||null,components:base.components||[],semantic:base.semantic||null,colorRelationships:base.colorRelationships||[],exploration:{initialFamily:state.initialFamily,direction:state.direction,visitedFamilies:state.visited.slice(),explicitlyRejected:[...state.seen],exhausted:state.exhausted}};
 if(modelLevel(scene.modelVersion)>=7)shared.exploration.canExploreFriction=state.family!=='friction'&&state.seen.size>=2;
 if(state.exhausted&&!review){const lastPage=state.previous?.page??0;return freeze({...shared,stage:'direction',page:lastPage,candidates:[],directions:modelLevel(scene.modelVersion)>=7&&state.family!=='friction'?DIRECTIONS.concat(FRICTION_DIRECTION):DIRECTIONS,source:'user-direction-required',token:explorationToken(sceneKey,'direction',[],lastPage,state.family,state.timeline)});}
 if(review)check(state.segment.some(event=>event.action==='viewed'&&event.page===page),'Only a previously viewed page in this family can be reviewed');
 const learning=learn(scene,records,{family:state.family,pool:state.pool,direction:state.direction}),previous=state.segment.findLast(event=>event.action==='viewed'&&event.page===page),sequence=sequencePair(state.pool,page),ids=previous?previous.candidates.slice():sequence.ids.slice(),applied=!previous&&learning.status==='supported'&&ids.includes(learning.wordId);
 if(applied)ids.sort((a,b)=>(a===learning.wordId?-1:b===learning.wordId?1:0));
 const nextTimeline=canonicalExplorationTimeline(state.timeline.concat({page,candidates:ids.slice(),action:'viewed',family:state.family}));
 return freeze({...shared,matchStatus:coverage({...base,candidates:ids,learning}),stage:'words',page,candidates:ids.map(id=>({...BY_ID[id]})),timeline:nextTimeline,history:explorationHistory(nextTimeline),pass:sequence.pass,learning,source:applied?'local-reference':state.direction?'user-directed-editorial':'editorial',token:explorationToken(sceneKey,'words',ids,page,state.family,nextTimeline)});
}
function makeFeedback({scene:input,proposal,selectedWord,id,createdAt}={}){
 const scene=canonicalScene(input),sceneKey=fingerprint(scene);
 check(proposal&&proposal.sceneKey===sceneKey,'The palette changed after these suggestions were shown');
 check(Array.isArray(proposal.candidates)&&proposal.candidates.length===2,'Two displayed suggestions are required');
 check(proposal.candidates.every(w=>w&&BY_ID[w.id]&&w.en===BY_ID[w.id].en&&w.ko===BY_ID[w.id].ko),'Displayed suggestion text differs from its word');
 const paged=proposal.schemaVersion===PROPOSAL_VERSION,exploring=proposal.schemaVersion===EXPLORATION_PROPOSAL_VERSION;
 check(proposal.schemaVersion==null||paged||exploring,'Unsupported proposal schema');
 const suggestions=proposal.candidates.map(w=>({...BY_ID[w.id]}));
 const ids=suggestions.map(w=>w.id);let history,page,timeline;
 if(exploring){
  check(proposal.stage==='words','A direction menu cannot be saved as a word choice');page=pageNumber(proposal.page);timeline=canonicalExplorationTimeline(proposal.timeline);history=explorationHistory(timeline);
  check(JSON.stringify(canonicalExplorationTimeline(proposal.history))===JSON.stringify(history),'The displayed proposal rejection history differs from its timeline');
  check(proposal.token===explorationToken(sceneKey,'words',ids,page,proposal.family,timeline),'The displayed proposal is invalid');
 }else if(paged){
  page=pageNumber(proposal.page);timeline=canonicalTimeline(proposal.timeline);history=rejectionHistory(timeline);
  check(JSON.stringify(canonicalPageHistory(proposal.history))===JSON.stringify(history),'The displayed proposal rejection history differs from its timeline');
  check(proposal.token===pageToken(sceneKey,ids,page,timeline),'The displayed proposal is invalid');
 }else{history=canonicalHistory(proposal.history);check(proposal.token===proposalToken(sceneKey,ids,history),'The displayed proposal is invalid');}
 const record={schemaVersion:exploring?EXPLORATION_FEEDBACK_VERSION:paged?PAGE_FEEDBACK_VERSION:FEEDBACK_VERSION,id,createdAt,generatorVersion:scene.generatorVersion,modelVersion:scene.modelVersion,sceneKey,proposalToken:proposal.token,scene,suggestions,history,...(paged||exploring?{page,timeline}:{}),...(exploring?{family:proposal.family}:{}),selectedWord,source:'human-choice'};
 const validation=validateRecord(record);check(validation.ok,validation.errors.join('; '));
 return freeze(clone(record));
}

return Object.freeze({SCENE_VERSION,FEEDBACK_VERSION,PAGE_FEEDBACK_VERSION,PROPOSAL_VERSION,EXPLORATION_FEEDBACK_VERSION,EXPLORATION_PROPOSAL_VERSION,MODEL_VERSION,GENERATOR_VERSION,WORDS:Object.freeze(WORDS),ART_WORDS:freeze(ART_WORDS),FRICTION_WORDS:freeze(FRICTION_WORDS),FEEL_KO,DIRECTIONS,canonicalScene,canonicalTimeline,canonicalExplorationTimeline,fingerprint,suggestPair,suggestPage,coverage,makeFeedback,validateRecord,learn});
});
