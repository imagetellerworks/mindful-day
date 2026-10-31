(function(root){'use strict';
const stages=['touch','shake','practice','mood','category','colors','slider','mode','mix','background','save','image','image-share','record','idle','rename','done'];
function create(now=0){return{stage:'touch',startedAt:now,enteredAt:now,touches:0,practice:0,mix:0,idleTouches:0,pending:null,exported:false,renamed:false,wordOpened:false};}
function enter(s,stage,now){s.stage=stage;s.enteredAt=now;s.pending=null;return s;}
function event(s,type,now=0){
 if(s.stage==='done')return s;
 if(type==='export'){s.exported=true;if(['idle','rename'].includes(s.stage))enter(s,'idle',now);return s;}
 if(type==='dismiss'){if(['save','image','image-share'].includes(s.stage))return enter(s,'record',now);if(s.stage==='mood')return enter(s,'colors',now);if(['colors','slider','mode','mix','background'].includes(s.stage))return enter(s,'save',now);return enter(s,'idle',now);}
 if(s.stage==='save'&&type==='image-open')return enter(s,'image',now);
 if(s.stage==='image'&&type==='image-created')return enter(s,'image-share',now);
 if(['save','image','image-share'].includes(s.stage)&&type==='image-saved')return enter(s,'record',now);
 if(s.stage==='record'&&type==='record-stop')return enter(s,'idle',now);
 if(['colors','slider','mode','mix','background'].includes(s.stage)&&type==='colors-close')return enter(s,'save',now);
 if(type==='motion-unavailable'&&['shake','practice'].includes(s.stage))return enter(s,'mood',now);
 if(type==='settled'){if(s.pending)enter(s,s.pending,now);return s;}
 if(type==='tick'){if(s.stage==='idle'&&!s.exported&&!s.renamed&&s.idleTouches>=5&&now-s.startedAt>=30000&&now-s.enteredAt>=12000)enter(s,'rename',now);return s;}
 if(type==='review-open'){s.renamed=true;if(s.stage==='rename')s.wordOpened=true;return s;}
 if(type==='review-close'&&s.stage==='rename'&&s.wordOpened)return enter(s,'done',now);
 const explore=type==='touch'||type==='shake';
 if(s.stage==='touch'&&type==='touch'){s.touches=Math.min(3,s.touches+1);if(s.touches===3)s.pending='shake';}
 else if(s.stage==='shake'&&type==='enable')enter(s,'practice',now);
 else if(['shake','practice'].includes(s.stage)&&type==='shake'){if(s.stage==='shake')enter(s,'practice',now);s.practice++;if(s.practice>=2)s.pending='mood';}
 else if(s.stage==='mood'&&type==='mood-open')enter(s,'category',now);
 else if(s.stage==='category'&&type==='mood-close')enter(s,'colors',now);
 else if(s.stage==='colors'&&type==='colors-open')enter(s,'slider',now);
 else if(s.stage==='slider'&&['palette','browse'].includes(type))enter(s,'mode',now);
 else if(s.stage==='mode'&&type==='mode')enter(s,'mix',now);
 else if(s.stage==='mix'&&(explore||type==='palette')){s.mix++;if(s.mix>=2)s.pending='background';}
 else if(s.stage==='background'&&['background','background-skip'].includes(type))s.pending='save';
 else if(s.stage==='idle'&&explore)s.idleTouches++;
 else if(s.stage==='idle'&&['palette','category','mode'].includes(type)){s.idleTouches=0;s.enteredAt=now;}
 return s;
}
const api={stages,create,event};if(typeof module==='object'&&module.exports)module.exports=api;else root.AdaptiveGuide=api;
})(typeof window==='object'?window:this);
