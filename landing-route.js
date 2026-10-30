(function(root){'use strict';
function legacyExperienceTarget(search,hash,base){const params=new URLSearchParams(search);if(!['word','set','study','tour','showroom'].some(key=>params.has(key))&&params.get('from')!=='atlas')return null;return base+(search||'')+(hash||'');}
if(typeof module==='object'&&module.exports)module.exports={legacyExperienceTarget};else{const base=new URL('experience/',root.location.href).href,target=legacyExperienceTarget(root.location.search,root.location.hash,base);if(target)root.location.replace(target);}
})(typeof window==='object'?window:this);
