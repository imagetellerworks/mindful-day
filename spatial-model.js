(function(root){'use strict';
const groups={joy:{ko:'기쁨·생기',label:'Joy & vitality',members:['joy','freshness','innovation','movement']},calm:{ko:'평온·안정',label:'Calm & comfort',members:['warmth','calm','clarity','refinement']},dream:{ko:'몽환·매혹',label:'Dream & allure',members:['dream','attraction','personal']},reflection:{ko:'사색·슬픔',label:'Reflection & sorrow',members:['reflection','sadness']},intensity:{ko:'긴장·강렬함',label:'Tension & intensity',members:['fear','anger','ambivalence','resistance','intensity']}};
const mod=(n,m)=>((n%m)+m)%m;
function group(category,language='en'){const g=Object.values(groups).find(g=>g.members.includes(category));return g?(language==='ko'?g.ko:g.label):(language==='ko'?'나만의 감정':'Personal feeling');}
function filterRows(rows,category,query){const q=query.trim().toLocaleLowerCase();return rows.filter(r=>(category==='all'||groups[category]?.members.includes(r.category))&&(!q||(r.en+' '+r.ko).toLocaleLowerCase().includes(q)));}
const views=['helix','ribbon','canvas','wall'],viewDuration=5000;
function sequenceStep(view,elapsed,dt,enabled){
 if(!enabled)return{view,elapsed,changed:false};const total=elapsed+dt,steps=Math.floor(total/viewDuration),next=views[mod(views.indexOf(view)+steps,views.length)];return{view:next,elapsed:total%viewDuration,changed:next!==view};
}
function experienceUrl(row,view='helix',base='https://imagetellerworks.github.io/mindful-day/experience/'){const params=new URLSearchParams({from:'atlas',view:views.includes(view)?view:'helix'});if(row)params.set('word',row.id);return base+'?'+params.toString();}
function dragOffset(view,dx,dy,mobile,stageWidth){
 const horizontal=mobile?140:200;
 if(view==='ribbon')return -(Math.abs(dx)>=Math.abs(dy)?dx:dy)/horizontal;
 if(view==='helix')return Math.abs(dy)>=Math.abs(dx)?-dy/(mobile?60:83):-dx/horizontal;
 if(view==='wall'){const rowHeight=stageWidth/8.65*1.48;return -(Math.abs(dy)>=Math.abs(dx)?dy:dx)/rowHeight*8;}
 return 0;
}
const ribbonSpans=new Map();
function ribbonSpan(mobile,cardWidth,perspective,edge=2.5,vertical=false){
 const key=[mobile,cardWidth,perspective,edge,vertical].join(':');if(ribbonSpans.has(key))return ribbonSpans.get(key);
 let extent=0;
 for(let i=0;i<=40;i++){const d=edge*i/40,g=geometry('ribbon',d,d,0,mobile,390,cardWidth,vertical),a=(vertical?g.rx:g.ry)*Math.PI/180;
  for(const sign of [-1,1]){const local=sign*cardWidth*(vertical?1.6:1)*g.scale/2;extent=Math.max(extent,Math.abs(((vertical?g.y:g.x)+local*Math.cos(a))*perspective/(perspective-g.z+(vertical?-1:1)*local*Math.sin(a))));}}
 const span=extent*2;ribbonSpans.set(key,span);return span;
}
function ribbonWindowSpan(mobile,cardWidth,perspective,vertical=false){return ribbonSpan(mobile,cardWidth,perspective,2,vertical);}
function fitScale(view,width,height,mobile,cardWidth=mobile?177:228,perspective=mobile?950:1300,vertical=false){
 if(view==='ribbon')return Math.min(.85*fitScale('helix',width,height,mobile),((vertical?height:width)-(mobile?24:32))/ribbonSpan(mobile,cardWidth,perspective,2.5,vertical));
 if(!mobile||view==='canvas')return 1;
 if(view==='helix')return Math.max(.25,Math.min(1,(width-20)/(265*.66*1.6+177*.8),(height-24)/(6*60+177*1.2)));
 const pitch=width/8.65;return Math.max(.25,Math.min(1,(height-24)/(8*pitch*1.48+pitch*1.45)));
}
function geometry(view,d,index,position,mobile,stageWidth=mobile?390:1000,cardWidth=mobile?177:228,vertical=false){
 const r=mobile?265:455;let x,y,z,rx=0,ry=0,rz=0,scale=1,opacity;
 if(view==='canvas'){x=0;y=0;z=-150;scale=.8;opacity=0;}
 else if(view==='ribbon'){
  const degrees=24,step=degrees*Math.PI/180,angle=d*step,gap=24,radius=(cardWidth*(vertical?1.6:1)*1.4+gap)/(2*Math.tan(step/2));
  x=vertical?0:Math.sin(angle)*radius;y=vertical?-Math.sin(angle)*radius:0;z=(Math.cos(angle)-1)*radius;rx=vertical?d*degrees:0;ry=vertical?0:d*degrees;scale=1.4;
  opacity=Math.max(0,Math.min(1,(3.5-Math.abs(d))/.35));
 }
 else if(view==='helix'){x=Math.sin(d*.78)*r*.66;y=d*(mobile?60:83);z=(Math.cos(d*.78)-1)*r*.75;ry=-Math.sin(d*.45)*30;rx=-9;rz=d*4;scale=.85;opacity=Math.min(1,Math.max(0,(5-Math.abs(d))/1.5));}
 else{const columns=8,pitch=stageWidth/8.65;x=(mod(index,columns)-(columns-1)/2)*pitch;y=(Math.floor(index/columns)-position/columns)*pitch*1.48;z=-35;ry=-4;rx=7;rz=-4;scale=pitch*.88/cardWidth;opacity=1;}
 return{x,y,z,rx,ry,rz,scale,opacity};
}

const ribbonHold=1400,ribbonDuration=760;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function ribbonPosition(from,to,elapsed){return from+(to-from)*smooth(elapsed/ribbonDuration);}
function ribbonPose(index,from,to,elapsed,mobile,stageWidth,cardWidth,vertical=false){
 const position=ribbonPosition(from,to,elapsed);
 // Every card shares one rotation; spacing comes from the same cylindrical surface.
 return geometry('ribbon',index-position,index,position,mobile,stageWidth,cardWidth,vertical);
}
function flowDelta(view,dt){const rate={ribbon:.00018,helix:.00018,wall:.0038}[view]||0;return Math.max(0,dt)*rate;}
const api={groups,mod,group,filterRows,geometry,views,viewDuration,sequenceStep,experienceUrl,dragOffset,fitScale,ribbonWindowSpan,ribbonHold,ribbonDuration,ribbonPosition,ribbonPose,flowDelta};if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasModel=api;
})(typeof window==='object'?window:this);
