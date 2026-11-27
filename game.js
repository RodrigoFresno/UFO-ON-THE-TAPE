(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
const $=id=>document.getElementById(id),images=new Map();
const asset=n=>{if(!images.has(n)){const im=new Image();im.src='assets/images/'+n+'.png';images.set(n,im);}return images.get(n);};
const ready=n=>{const im=asset(n);return im.complete&&im.naturalWidth?im:null;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>((a+540)%360)-180;
const ease=(a,b,dt,k)=>a+(b-a)*(1-Math.exp(-k*dt));
const s={started:false,muted:false,w:innerWidth,h:innerHeight,dpr:1,yaw:0,pitch:0,tyaw:0,tpitch:0,
t:0,last:performance.now(),base:null,angle:0,drag:false,lastPoint:null,audio:null,audioStarted:false,
zoom:1,depth:.5,ax:0,ay:0,tax:0,tay:0,chaseX:0,chaseY:0,shakeX:0,shakeY:0};
function resize(){s.w=innerWidth;s.h=innerHeight;s.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(s.w*s.dpr);canvas.height=Math.round(s.h*s.dpr);canvas.style.width=s.w+'px';canvas.style.height=s.h+'px';ctx.setTransform(s.dpr,0,0,s.dpr,0,0);s.angle=(screen.orientation&&screen.orientation.angle)||window.orientation||0;}
addEventListener('resize',resize,{passive:true});if(screen.orientation)screen.orientation.addEventListener('change',resize);resize();
function cover(im,w,h,z,ox,oy){if(!im)return;const k=Math.max(w/im.width,h/im.height)*z,dw=im.width*k,dh=im.height*k;ctx.drawImage(im,(w-dw)/2+ox,(h-dh)/2+oy,dw,dh);}
function world(t,dt){
 const w=s.w,h=s.h,sky=ready(118);ctx.fillStyle='#6f91ae';ctx.fillRect(0,0,w,h);
 // The UFO follows a moving flight path. The virtual camera actively chases it,
 // with a small amount of lag so the player feels like they are trying to keep it framed.
 const f=t*1.55;
 const xp=.5+.31*Math.sin(f*.72)+.13*Math.sin(f*1.63+.7);
 const yp=.48+.22*Math.sin(f*.91+1.1)+.055*Math.cos(f*.43);
 const d=.5+.5*Math.sin(f*.48-.5);
 s.depth=ease(s.depth,d,dt,1.65);
 // Repeated optical search: zoom in, hold briefly, then pull back. The range is
 // deliberately gentle; the camera movement, UFO scale and car/window layer share it.
 const pulse=.5+.5*Math.sin(t*.57-.65);
 const zTarget=1.015+.37*pulse+.10*s.depth;
 s.zoom=ease(s.zoom,zTarget,dt,1.05);
 // Camera tracks the craft with a soft follow delay instead of letting it drift away.
 const targetX=(xp-.5)*w*.70,targetY=(yp-.5)*h*.70;
 s.chaseX=ease(s.chaseX,targetX,dt,1.8);
 s.chaseY=ease(s.chaseY,targetY,dt,1.8);
 const driftX=Math.sin(t*.17)*w*.006+Math.sin(t*.51)*w*.002;
 const driftY=Math.cos(t*.13)*h*.005+Math.sin(t*.39)*h*.002;
 const manualX=s.yaw*w*.27+s.ax*w*.014;
 const manualY=s.pitch*h*.25+s.ay*h*.012;
 // Handheld correction becomes stronger while the UFO is far from the center.
 const errorX=targetX-s.chaseX,errorY=targetY-s.chaseY;
 s.shakeX=ease(s.shakeX,Math.sin(t*8.2)*Math.min(8,Math.abs(errorX)*.025),dt,4.2);
 s.shakeY=ease(s.shakeY,Math.cos(t*7.4)*Math.min(7,Math.abs(errorY)*.025),dt,4.2);
 const cx=s.chaseX+manualX+driftX+s.shakeX;
 const cy=s.chaseY+manualY+driftY+s.shakeY;
 const lens=s.zoom*(1+.012*Math.sin(t*.31)+.006*Math.sin(t*.77+.8));
 if(sky)cover(sky,w,h,lens,cx,cy);
 // Keep the recovered UFO art crisp while matching the camera's optical zoom.
 const frame=5+Math.round(s.depth*44),ufo=ready(frame)||ready(49)||ready(6);
 if(ufo){
   const base=Math.min(w*.145,116),scale=.72+s.depth*1.30;
   const width=base*scale*s.zoom,ht=width*ufo.height/ufo.width;
   const worldX=(xp-.5)*w,worldY=(yp-.5)*h;
   const ux=w/2+(worldX-s.chaseX-manualX)*s.zoom+driftX*.25;
   const uy=h/2+(worldY-s.chaseY-manualY)*s.zoom+driftY*.25;
   ctx.save();ctx.translate(ux,uy);ctx.rotate(.018*Math.sin(f*.9));ctx.globalAlpha=.98;
   ctx.drawImage(ufo,-width/2,-ht/2,width,ht);ctx.restore();
 }
 // Original car/windshield foreground is not a frozen overlay: it breathes with
 // the same optical zoom and follows camera corrections with a slight foreground parallax.
 const car=ready(0);
 if(car){
   ctx.save();ctx.globalAlpha=.48;
   const carZoom=.94+(s.zoom-1)*.72;
   cover(car,w,h,carZoom,cx*.12,cy*.12);
   ctx.restore();
 }
 const ids=[7,10,11,12,13],noise=ready(ids[Math.floor(t*5.5)%ids.length]);
 if(noise){ctx.save();ctx.globalAlpha=.014;ctx.globalCompositeOperation='screen';ctx.drawImage(noise,0,0,w,h);ctx.restore();}
}
function intro(){const sky=ready(118);if(sky)cover(sky,s.w,s.h,1.04,0,0);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,s.w,s.h);}
function render(now){const dt=Math.min(.05,(now-s.last)/1000);s.last=now;if(s.started){s.t+=dt;s.yaw=ease(s.yaw,s.tyaw,dt,11.5);s.pitch=ease(s.pitch,s.tpitch,dt,11.5);s.ax=ease(s.ax,s.tax,dt,5.5);s.ay=ease(s.ay,s.tay,dt,5.5);world(s.t,dt);$('clock').textContent=new Date(s.t*1000).toISOString().slice(11,19);$('status').textContent=Math.abs(s.yaw)<.12&&Math.abs(s.pitch)<.12?'PROCURANDO UFO':'ACOMPANHANDO UFO';}else intro();requestAnimationFrame(render);}
requestAnimationFrame(render);
function start(){s.started=true;s.t=0;s.last=performance.now();s.zoom=1;s.depth=.5;$('intro').classList.add('hidden');$('hud').classList.remove('hidden');$('rec').classList.remove('hidden');if(/iPhone|iPad|iPod/i.test(navigator.userAgent)&&typeof DeviceOrientationEvent!=='undefined')$('permission').classList.remove('hidden');else toast('MOUSE: MOVA O CURSOR PARA PROCURAR O UFO');audioStart();}
$('play').addEventListener('click',start);
function orient(e){if(e.alpha==null||e.beta==null||e.gamma==null)return;const v={a:e.alpha,b:e.beta,g:e.gamma};if(!s.base){s.base=v;return;}let yaw=wrap(v.a-s.base.a),pitch=v.b-s.base.b,roll=v.g-s.base.g;if(s.angle===90){const q=yaw;yaw=pitch;pitch=-q;}else if(s.angle===270||s.angle===-90){const q=yaw;yaw=-pitch;pitch=q;}yaw+=roll*.22;s.tyaw=clamp(yaw/42,-1,1);s.tpitch=clamp(pitch/42,-.92,.92);}
function motion(e){const a=e.accelerationIncludingGravity||e.acceleration;if(!a)return;let x=Number(a.x)||0,y=Number(a.y)||0;if(s.angle===90){const q=x;x=y;y=-q;}else if(s.angle===270||s.angle===-90){const q=x;x=-y;y=q;}s.tax=clamp(x/9.81,-1,1);s.tay=clamp(y/9.81,-1,1);}
$('enableMotion').addEventListener('click',async()=>{try{if(typeof DeviceOrientationEvent==='undefined')throw Error('orientation unavailable');if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')throw Error('orientation denied');if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'&&await DeviceMotionEvent.requestPermission()!=='granted')throw Error('motion denied');s.base=null;addEventListener('deviceorientation',orient,true);addEventListener('devicemotion',motion,true);$('permission').classList.add('hidden');toast('GIROSCÓPIO E ACELERÔMETRO ATIVOS');}catch(e){$('permission').classList.add('hidden');toast('SENSOR INDISPONÍVEL — USE O TOQUE');}});
$('noMotion').addEventListener('click',()=>$('permission').classList.add('hidden'));
canvas.addEventListener('pointerdown',e=>{if(!s.started)return;if(e.pointerType==='touch'){s.drag=true;s.lastPoint={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(!s.started)return;if(e.pointerType==='mouse'){const r=canvas.getBoundingClientRect();s.tyaw=clamp(((e.clientX-r.left)/r.width-.5)*2,-1,1);s.tpitch=clamp(((e.clientY-r.top)/r.height-.5)*2,-.92,.92);}else if(e.pointerType==='touch'&&s.drag&&s.lastPoint){const dx=e.clientX-s.lastPoint.x,dy=e.clientY-s.lastPoint.y;s.tyaw=clamp(s.tyaw-dx/s.w*2.25,-1,1);s.tpitch=clamp(s.tpitch-dy/s.h*2.25,-.92,.92);s.lastPoint={x:e.clientX,y:e.clientY};}});
const stop=()=>{s.drag=false;s.lastPoint=null;};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
$('recenter').addEventListener('click',()=>{s.base=null;s.tyaw=s.tpitch=s.yaw=s.pitch=s.tax=s.tay=s.ax=s.ay=0;toast('CÂMERA RECENTRALIZADA');});
$('sound').addEventListener('click',()=>{s.muted=!s.muted;if(s.audio)s.muted?s.audio.pause():s.audio.play().catch(()=>{});$('sound').textContent=s.muted?'♪̸':'♪';toast(s.muted?'ÁUDIO DESATIVADO':'ÁUDIO ATIVADO');});
$('exit').addEventListener('click',()=>{s.started=false;s.tyaw=s.tpitch=s.yaw=s.pitch=0;$('hud').classList.add('hidden');$('rec').classList.add('hidden');$('intro').classList.remove('hidden');if(s.audio)s.audio.pause();});
function toast(m){const el=$('toast');el.textContent=m;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400);}
function audioStart(){if(s.audioStarted||s.muted)return;s.audioStarted=true;s.audio=new Audio('assets/audio/0.mp3');s.audio.loop=true;s.audio.volume=.42;s.audio.play().catch(()=>{});}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.audio)s.audio.pause();else if(s.started&&s.audio&&!s.muted)s.audio.play().catch(()=>{});});
})();