(function(root){'use strict';
const groups={joy:{ko:'기쁨·생기',label:'Joy & vitality',members:['joy','freshness','innovation','movement']},calm:{ko:'평온·안정',label:'Calm & comfort',members:['warmth','calm','clarity','refinement']},dream:{ko:'몽환·매혹',label:'Dream & allure',members:['dream','attraction','personal']},reflection:{ko:'사색·슬픔',label:'Reflection & sorrow',members:['reflection','sadness']},intensity:{ko:'긴장·강렬함',label:'Tension & intensity',members:['fear','anger','ambivalence','resistance','intensity']}};
const mod=(n,m)=>((n%m)+m)%m;
function group(category,language='en'){const g=Object.values(groups).find(g=>g.members.includes(category));return g?(language==='ko'?g.ko:g.label):(language==='ko'?'나만의 감정':'Personal feeling');}
function filterRows(rows,category,query){const q=query.trim().toLocaleLowerCase();return rows.filter(r=>(category==='all'||groups[category]?.members.includes(r.category))&&(!q||(r.en+' '+r.ko).toLocaleLowerCase().includes(q)));}
const views=['canvas','ribbon','helix','wall'];
function sequenceStep(view,elapsed,dt,enabled){
 if(!enabled)return{view,elapsed,changed:false};const total=elapsed+dt,steps=Math.floor(total/10000),next=views[mod(views.indexOf(view)+steps,views.length)];return{view:next,elapsed:total%10000,changed:next!==view};
}
function experienceUrl(row,view='canvas',base='https://imagetellerworks.github.io/mindful-day/experience/'){const params=new URLSearchParams({from:'atlas',view:views.includes(view)?view:'canvas'});if(row)params.set('word',row.id);return base+'?'+params.toString();}
function dragOffset(view,dx,dy,mobile,stageWidth){
 const horizontal=mobile?140:200;
 if(view==='ribbon')return -(Math.abs(dx)>=Math.abs(dy)?dx:dy)/horizontal;
 if(view==='helix')return Math.abs(dy)>=Math.abs(dx)?-dy/(mobile?60:83):-dx/horizontal;
 if(view==='wall'){const rowHeight=stageWidth/8.65*1.48;return -(Math.abs(dy)>=Math.abs(dx)?dy:dx)/rowHeight*8;}
 return 0;
}
function geometry(view,d,index,position,mobile,stageWidth=mobile?390:1000,cardWidth=mobile?177:228){
 const r=mobile?265:455;let x,y,z,rx=0,ry=0,rz=0,scale=1,opacity;
 if(view==='canvas'){x=0;y=0;z=-150;scale=.8;opacity=0;}
 else if(view==='ribbon'){x=d*(mobile?140:200);y=Math.abs(d)*12;z=-Math.abs(d)*(mobile?120:155);ry=-Math.max(-1,Math.min(1,d))*48;opacity=Math.min(1,Math.max(0,(5-Math.abs(d))/1.5));}
 else if(view==='helix'){x=Math.sin(d*.78)*r*.66;y=d*(mobile?60:83);z=(Math.cos(d*.78)-1)*r*.75;ry=-Math.sin(d*.45)*30;rx=-9;rz=d*4;scale=.85;opacity=Math.min(1,Math.max(0,(5-Math.abs(d))/1.5));}
 else{const columns=8,pitch=stageWidth/8.65;x=(mod(index,columns)-(columns-1)/2)*pitch;y=(Math.floor(index/columns)-position/columns)*pitch*1.48;z=-35;ry=-4;rx=7;rz=-4;scale=pitch*.88/cardWidth;opacity=1;}
 return{x,y,z,rx,ry,rz,scale,opacity};
}
const api={groups,mod,group,filterRows,geometry,views,sequenceStep,experienceUrl,dragOffset};if(typeof module==='object'&&module.exports)module.exports=api;else root.AtlasModel=api;
})(typeof window==='object'?window:this);
