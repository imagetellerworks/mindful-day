(function(root){
'use strict';

// This finite editorial vocabulary describes a color impression. It does not
// infer a person's intentions, circumstances, diagnosis, or emotional state.
const WORDS=[
 {id:'cheerful',en:'cheerful',ko:'명랑한'},
 {id:'lively',en:'lively',ko:'활기찬'},
 {id:'playful',en:'playful',ko:'장난스러운'},
 {id:'cozy',en:'cozy',ko:'포근한'},
 {id:'calm',en:'calm',ko:'차분한'},
 {id:'clear',en:'clear',ko:'맑은'},
 {id:'quiet',en:'quiet',ko:'고요한'},
 {id:'subdued',en:'subdued',ko:'가라앉은'},
 {id:'somber',en:'somber',ko:'침울한'},
 {id:'tense',en:'tense',ko:'긴장한'},
 {id:'fiery',en:'fiery',ko:'불같은'},
 {id:'dreamy',en:'dreamy',ko:'몽환적인'},
 {id:'intense',en:'intense',ko:'강렬한'},
 {id:'mixed',en:'mixed',ko:'복합적인'}
];
const FEEL_KO=Object.fromEntries(WORDS.map(w=>[w.id,w.ko]));
const BY_ID=Object.fromEntries(WORDS.map(w=>[w.id,w]));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const round=v=>Math.round(v*10000)/10000;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// HSL conversion can produce values such as -7e-15 at a full-saturation
// boundary. The canvas rounds them to zero; tolerate only floating-point noise.
const RGB_EPSILON=1e-7;
const rgbValid=rgb=>Array.isArray(rgb)&&rgb.length===3&&rgb.every(v=>finite(v)&&v>=-RGB_EPSILON&&v<=255+RGB_EPSILON);
function rgbFrom(value){
 if(rgbValid(value))return value.map(v=>clamp(v,0,255));
 if(typeof value!=='string'||!/^#[\da-f]{6}$/i.test(value))return null;
 return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
}
function oklch(rgb){
 const lin=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
 const [r,g,b]=lin;
 const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
 const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
 const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
 const L=.2104542553*l+.793617785*m-.0040720468*s;
 const a=1.9779984951*l-2.428592205*m+.4505937099*s;
 const bb=.0259040371*l+.7827717662*m-.808675766*s;
 return {L,C:Math.hypot(a,bb),h:(Math.atan2(bb,a)*180/Math.PI+360)%360};
}
const hueGap=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
const warm=h=>h<105||h>=335;
const cool=h=>h>=105&&h<=285;
function alphaAt(layer,x,y){
 const d=Math.hypot(x-layer.ox,y-layer.oy)/layer.r;
 if(d>=1)return 0;
 // soft is the effective solid-stop fraction passed to drawOrb, after S.soft.
 const solid=clamp(layer.soft,0,.95);
 return clamp(layer.a)*(d<=solid?1:(1-d)/(1-solid));
}
function paintAt(layers,background,x,y){
 let rgb=background.slice();
 for(const layer of layers){const a=alphaAt(layer,x,y);rgb=rgb.map((v,i)=>layer.col[i]*a+v*(1-a));}
 return {rgb,...oklch(rgb)};
}
const median=values=>{const sorted=values.slice().sort((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
function representative(samples){
 // Select an existing painted pixel, rather than averaging unlike hues.
 const L=median(samples.map(s=>s.L)),C=median(samples.map(s=>s.C));
 return samples.reduce((best,s)=>Math.abs(s.L-L)+Math.abs(s.C-C)*2<Math.abs(best.L-L)+Math.abs(best.C-C)*2?s:best);
}
function diagnosticColor(sample){return {rgb:sample.rgb.map(v=>Math.round(v)),L:round(sample.L),C:round(sample.C),h:round(sample.h)};}
function result(word,rule,ko,en,diagnostics){
 const w=BY_ID[word];return {word:w.id,ko:w.ko,en:w.en,rule,reason:{ko,en},diagnostics};
}
function fallback(rule='unmapped',diagnostics={}){
 return result('mixed',rule,'한 가지 감정으로 좁히기 어려운 배색이에요.','This palette has more than one possible emotional association.',diagnostics);
}

/**
 * Match one settled orb without changing its generator, palette, or geometry.
 * layers are renderer-order RGBA radial layers with already adjusted col RGB.
 * soft is drawOrb's effective solid-stop, not the raw softness control. Sampling
 * reproduces that gradient's source-over sRGB composition at representative
 * points; it does not average core and exterior into a synthetic hue. This is a
 * compact approximation of a canvas, not a psychological measurement.
 */
function match(input={}){
 const {layers:inputLayers,background}=input||{};
 const bg=rgbFrom(background);
 if(!bg||!Array.isArray(inputLayers)||inputLayers.length!==4||!inputLayers.every(l=>l&&rgbValid(l.col)&&finite(l.r)&&l.r>0&&finite(l.ox)&&finite(l.oy)&&finite(l.soft)&&finite(l.a)))return fallback('invalid-input');
 const layers=inputLayers.map(l=>({...l,col:l.col.map(v=>clamp(v,0,255))}));
 const bodyLayer=layers[1],coreLayer=layers[3],innerLayer=layers[2];
 const bodyPoints=[];
 for(const ratio of [.52,.66,.80,.90])for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,x=bodyLayer.ox+Math.cos(angle)*bodyLayer.r*ratio,y=bodyLayer.oy+Math.sin(angle)*bodyLayer.r*ratio;
  bodyPoints.push({x,y,coreAlpha:alphaAt(coreLayer,x,y),innerAlpha:alphaAt(innerLayer,x,y),sample:paintAt(layers,bg,x,y)});
 }
 // Prefer visible body outside the small core/support. Fall back conservatively
 // when an unusual geometry covers the entire body.
 const clean=bodyPoints.filter(p=>p.coreAlpha<=.08&&p.innerAlpha<=.18);
 const withoutCore=bodyPoints.filter(p=>p.coreAlpha<=.15);
 const body=representative((clean.length?clean:withoutCore.length?withoutCore:bodyPoints).map(p=>p.sample));
 const corePoints=[paintAt(layers,bg,coreLayer.ox,coreLayer.oy)];
 for(let i=0;i<8;i++){const a=i*Math.PI/4;corePoints.push(paintAt(layers,bg,coreLayer.ox+Math.cos(a)*coreLayer.r*.2,coreLayer.oy+Math.sin(a)*coreLayer.r*.2));}
 const core=representative(corePoints),bgColor={rgb:bg,...oklch(bg)};
 // Include actual support-ring pixels so a bright opposing accent cannot be
 // hidden by a neutral core. Transparent raw layer colors alone do not count.
 const samples=bodyPoints.map(p=>p.sample).concat(corePoints),supportSamples=[];
 for(const [index,layer] of layers.entries())for(let i=0;i<12;i++){
  const a=i*Math.PI/6,sample=paintAt(layers,bg,layer.ox+Math.cos(a)*layer.r*.45,layer.oy+Math.sin(a)*layer.r*.45);
  samples.push(sample);if(index===2)supportSamples.push(sample);
 }
 const gap=Math.min(body.C,core.C)>.045?hueGap(body.h,core.h):0;
 const lightGap=Math.abs(body.L-core.L),maxChroma=Math.max(...samples.map(p=>p.C));
 const backgroundContrast=Math.max(Math.abs(body.L-bgColor.L),Math.abs(core.L-bgColor.L));
 const accents=samples.filter(p=>p.C>=.10);
 const bodyOpposition=(body.C>=.055&&accents.some(p=>hueGap(body.h,p.h)>=75&&Math.max(body.C,p.C)>=.13))||
  (core.C>=.10&&bodyPoints.some(p=>p.coreAlpha<=.15&&p.sample.C>=.13&&hueGap(p.sample.h,core.h)>=75));
 // A pale exterior must not conceal a vivid opposing support/core pair.
 const supportOpposition=core.C>=.10&&supportSamples.some(p=>p.C>=.10&&hueGap(p.h,core.h)>=75&&Math.max(p.C,core.C)>=.13);
 const opposing=bodyOpposition||supportOpposition;
 const bodyChroma=Math.max(...bodyPoints.filter(p=>p.coreAlpha<=.15).map(p=>p.sample.C),body.C);
 const vividAccent=maxChroma>.16;
 const diagnostics={body:diagnosticColor(body),core:diagnosticColor(core),background:diagnosticColor(bgColor),hueGap:round(gap),lightGap:round(lightGap),maxChroma:round(maxChroma),bodyChroma:round(bodyChroma),backgroundContrast:round(backgroundContrast),opposing,supportOpposition,vividAccent};
 if(samples.every(p=>p.rgb.every((v,i)=>Math.abs(v-bg[i])<.5)))return fallback('invisible',diagnostics);

 // Ordered, finite editorial rules. Contrast changes the impression's strength;
 // it never contributes a score toward intentions such as hope or enthusiasm.
 if(opposing){
  if(bgColor.L<.38||Math.min(body.L,core.L)<.46)return result('tense','dark-opposition','어두운 바탕이나 핵에 선명한 대립색이 맞닿아 있어요.','Vivid opposing hues meet a dark background or core.',diagnostics);
  if(body.L>=.64&&core.L>=.57)return result('playful','light-opposition','밝은 바탕색과 다른 색의 선명한 악센트가 어울려요.','A light body meets a vivid contrasting accent.',diagnostics);
  return fallback('complex-opposition',diagnostics);
 }
 const warmBody=warm(body.h)&&body.C>.055,warmCore=warm(core.h)&&core.C>.055;
 if(warmBody&&warmCore&&body.L>=.65&&core.L>=.60&&maxChroma>=.14&&gap<=65)return result('cheerful','bright-warm','밝고 따뜻한 외곽과 핵이 가까운 색상으로 이어져요.','A bright warm body and core stay in related hues.',diagnostics);
 if(warmBody&&warmCore&&Math.min(body.L,core.L)<.53&&maxChroma>=.14&&gap<=65)return result('fiery','deep-warm','깊고 선명한 따뜻한 색이 핵과 외곽에 이어져요.','Deep, vivid warm hues connect the body and core.',diagnostics);
 if(body.C>=.06&&bodyChroma>=.15&&core.L<.50&&body.L>=.35&&lightGap>=.25)return result('intense','vivid-dark-core','선명한 몸체와 어두운 핵의 명도 차이가 또렷해요.','A vivid body meets a distinctly darker core.',diagnostics);
 if(body.L>=.60&&core.L>=.48&&maxChroma>=.16&&gap>=20&&gap<75)return result('lively','vivid-related','선명하고 가까운 색들이 밝은 핵과 어울려요.','Vivid related hues meet a light core.',diagnostics);
 // The original generator deliberately pairs a near-neutral luminous envelope
 // with a colored core. This is its own visual family, not a relaxed threshold
 // for calm. Deep backgrounds and hard or opposing accents remain excluded.
 const embedded=Math.hypot(coreLayer.ox-bodyLayer.ox,coreLayer.oy-bodyLayer.oy)<=bodyLayer.r*.75&&coreLayer.r<=bodyLayer.r*.55;
 const fading=bodyLayer.soft<=.80&&coreLayer.soft<=.75;
 if(embedded&&fading&&bgColor.L>=.75&&body.L>=.80&&body.C<=.065&&core.C>=.07&&core.L>=.50&&lightGap<=.40&&maxChroma<=.19)return result('dreamy','pale-envelope','옅고 부드러운 외곽 안에 색이 또렷한 핵이 떠 있어요.','A colored core floats inside a pale, softly fading envelope.',diagnostics);
 const soft=lightGap<=.24&&backgroundContrast<=.48&&!vividAccent;
 const coolBody=cool(body.h)&&body.C>.025,coolCore=core.C<=.045||cool(core.h);
 if(soft&&coolBody&&coolCore&&body.L>=.77&&core.L>=.75&&gap<=55)return result('clear','pale-cool','옅고 밝은 차가운 색이 큰 명도 차이 없이 이어져요.','Pale, light cool hues stay close in lightness.',diagnostics);
 if(soft&&coolBody&&coolCore&&body.C<=.12&&body.L>=.50&&core.L>=.55&&gap<=60)return result('calm','soft-cool','부드러운 차가운 색과 핵이 낮은 대비로 이어져요.','A soft cool body and core meet with restrained contrast.',diagnostics);
 if(soft&&warm(body.h)&&body.C>.018&&(warm(core.h)||core.C<=.045)&&body.L>=.58&&core.L>=.55&&gap<=55)return result('cozy','soft-warm','부드러운 따뜻한 색과 밝은 핵이 낮은 대비로 어울려요.','Soft warm hues meet a light core with restrained contrast.',diagnostics);
 if(maxChroma<.13&&body.L<.46&&core.L<.56)return result('somber','dark-muted','어두운 외곽과 채도가 낮은 핵이 무게감을 만들어요.','A dark body and muted core create a heavy impression.',diagnostics);
 if(maxChroma<.10&&body.L<.64&&core.L<.67)return result('subdued','muted','낮은 채도와 가라앉은 밝기가 이어져요.','Muted hues and subdued lightness stay connected.',diagnostics);
 if(maxChroma<.055&&lightGap<=.23&&backgroundContrast<=.48)return result('quiet','soft-neutral','채도가 낮은 뉴트럴 색들이 큰 대비 없이 이어져요.','Low-chroma neutral colors stay close without sharp contrast.',diagnostics);
 return fallback('unmapped',diagnostics);
}

const api={WORDS,FEEL_KO,match};
if(typeof module==='object'&&module.exports)module.exports=api;else root.SingleOrbMood=api;
})(typeof window==='object'?window:this);
