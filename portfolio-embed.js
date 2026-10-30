(()=>{'use strict';if(new URLSearchParams(location.search).get('portfolio')!=='1')return;document.documentElement.classList.add('portfolio-embed');const style=document.createElement('style');style.textContent=`
html.portfolio-embed,html.portfolio-embed body{width:100%;height:100%;overflow:hidden!important}
.portfolio-embed main{height:100dvh!important;min-height:0!important}
.portfolio-embed .masthead,.portfolio-embed .intro,.portfolio-embed .experience-link,.portfolio-embed .collection-tools,.portfolio-embed .selection,.portfolio-embed .navigation,.portfolio-embed .bottom-controls,.portfolio-embed .interaction-note,.portfolio-embed footer,.portfolio-embed .stage-coordinate{display:none!important}
.portfolio-embed .stage{inset:0!important;mask-image:none!important;-webkit-mask-image:none!important}
.portfolio-embed .immersive-art{left:58%!important;top:50%!important;width:min(1200px,120vw)!important}
@media(max-width:760px){.portfolio-embed .immersive-art{left:50%!important;width:150vw!important}.portfolio-embed .art-card{width:177px}}
`;document.head.append(style);
const views=['ribbon','helix','wall','canvas'];let origin='';try{origin=new URL(document.referrer).origin}catch{}function send(){if(parent===window)return;const active=document.querySelector('[data-view][aria-pressed="true"]');if(active)parent.postMessage({type:'mindful-view-changed',view:active.dataset.view},origin||'*')}
addEventListener('message',event=>{if(event.source!==parent||!origin||event.origin!==origin)return;const data=event.data;if(data?.type==='mindful-select-view'&&views.includes(data.view))document.querySelector('[data-view="'+data.view+'"]')?.click();if(data?.type==='mindful-language'&&['ko','en'].includes(data.language)){const active=document.querySelector('#languageBtn [data-language].active');if(active&&active.dataset.language!==data.language)document.getElementById('languageBtn')?.click()}});
addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-view]').forEach(button=>new MutationObserver(send).observe(button,{attributes:true,attributeFilter:['aria-pressed']}));send()});addEventListener('load',send)})();
(()=>{if(new URLSearchParams(location.search).get('cards')!=='1')return;document.documentElement.classList.add('cards-embed');const style=document.createElement('style');style.textContent=`
.portfolio-embed.cards-embed .intro{display:block!important;left:8%;top:auto;bottom:20%;width:27%}
.portfolio-embed.cards-embed .experience-link{position:static!important;display:flex!important;width:max-content;align-items:center;justify-content:space-between;gap:48px;min-height:51px;min-width:164px;margin:29px 0 0;padding:14px 19px;border:1px solid #5556;border-radius:0;background:transparent;color:#4c4544;font-size:13px;font-weight:400;letter-spacing:normal;line-height:normal;backdrop-filter:blur(8px);transition:background .2s,color .2s;pointer-events:auto}
.portfolio-embed.cards-embed .experience-link:hover{background:#30372f;color:white}
.portfolio-embed.cards-embed .experience-link svg{width:20px;height:20px}
.portfolio-embed.cards-embed .stage{left:calc(32% + 16px)!important;right:0!important;top:70px!important;bottom:85px!important;mask-image:linear-gradient(to bottom,transparent,#000 8%,#000 90%,transparent)!important;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 8%,#000 90%,transparent)!important}
@media(max-width:760px){
.portfolio-embed.cards-embed .intro{left:8%;top:50%;bottom:auto;width:58%;transform:translateY(-50%);text-align:left;z-index:4}
.portfolio-embed.cards-embed .intro h1{font-size:40px;margin-bottom:0}
.portfolio-embed.cards-embed .intro-copy{display:block;font-size:12px;line-height:1.85;margin:20px 0 0;max-width:22ch;color:var(--muted);word-break:keep-all}
.portfolio-embed.cards-embed .experience-link{margin-top:24px;color:var(--ink);border-color:color-mix(in srgb,var(--ink) 40%,transparent)}
.portfolio-embed.cards-embed .stage{left:18%!important;right:-40%!important;top:12%!important;bottom:12%!important;mask-image:linear-gradient(90deg,transparent,#000 60%)!important;-webkit-mask-image:linear-gradient(90deg,transparent,#000 60%)!important}
.portfolio-embed.cards-embed .immersive-art{left:82%!important;top:50%!important;width:160vw!important}
.portfolio-embed.cards-embed .immersive{mask-image:linear-gradient(90deg,transparent,#000 65%);-webkit-mask-image:linear-gradient(90deg,transparent,#000 65%)}
}
@media(max-width:600px){.portfolio-embed.cards-embed .experience-link{min-width:142px;min-height:47px;font-size:12px;padding:10px 16px;gap:36px}}
`;document.head.append(style);addEventListener('DOMContentLoaded',()=>{const link=document.getElementById('experienceLink');if(link){link.target='_blank';link.rel='noopener';document.querySelector('.intro')?.append(link)}const play=document.getElementById('play'),helix=document.querySelector('[data-view="helix"]');if(helix?.getAttribute('aria-pressed')!=='true')helix?.click();if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&play?.getAttribute('aria-pressed')!=='true')play?.click()})})();
(()=>{'use strict';if(parent===window||new URLSearchParams(location.search).get('cards')!=='1')return;let origin='';try{origin=new URL(document.referrer).origin}catch{}if(!origin)return;
addEventListener('DOMContentLoaded',()=>{const link=document.getElementById('experienceLink'),intro=document.querySelector('.intro');if(!link)return;addEventListener('message',event=>{if(event.source===parent&&event.origin===origin&&event.data?.type==='mindful-cta-ready')link.style.visibility='hidden'});
function send(){const r=link.getBoundingClientRect();parent.postMessage({type:'mindful-cta',href:link.href,rect:{left:r.left,top:r.top,width:r.width,height:r.height},color:getComputedStyle(link).color},origin)}
const size=new ResizeObserver(send);size.observe(link);if(intro)size.observe(intro);new MutationObserver(send).observe(link,{attributes:true,attributeFilter:['href']});new MutationObserver(send).observe(document.body,{attributes:true,attributeFilter:['class','data-gallery-view']});addEventListener('resize',send);addEventListener('load',send);document.fonts?.ready.then(send);send()})
})();
