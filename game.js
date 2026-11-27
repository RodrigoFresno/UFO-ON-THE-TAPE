(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const $ = id => document.getElementById(id);
  const images = new Map();
  const asset = n => {
    if (!images.has(n)) { const im = new Image(); im.src = `assets/images/${n}.png`; images.set(n, im); }
    return images.get(n);
  };
  const ready = n => { const im = asset(n); return im.complete && im.naturalWidth ? im : null; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapAngle = a => ((a + 540) % 360) - 180;
  const state = {
    started:false, muted:false, w:innerWidth, h:innerHeight, dpr:1,
    yaw:0, pitch:0, targetYaw:0, targetPitch:0,
    elapsed:0, last:performance.now(), shake:0, gyroBase:null,
    dragging:false, lastPointer:null, audio:null, audioStarted:false,
    zoom:1, targetZoom:1, quality:1
  };

  function resize() {
    state.w = innerWidth; state.h = innerHeight;
    state.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    canvas.style.width = `${state.w}px`; canvas.style.height = `${state.h}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }
  addEventListener('resize', resize, { passive:true }); resize();

  function drawCover(im, x, y, w, h, zoom=1, offsetX=0, offsetY=0) {
    if (!im) return;
    const s = Math.max(w / im.width, h / im.height) * zoom;
    const dw = im.width * s, dh = im.height * s;
    const cx = x + (w-dw)/2 + offsetX;
    const cy = y + (h-dh)/2 + offsetY;
    ctx.drawImage(im, cx, cy, dw, dh);
  }

  // The recovered plate (118.png) already contains the sky, clouds, sun and distant city.
  // The whole plate is animated as a virtual camera view: pan, breathing zoom and handheld drift.
  function drawWorld(t, dt) {
    const w=state.w, h=state.h;
    const sky=ready(118);
    ctx.fillStyle='#718ca4'; ctx.fillRect(0,0,w,h);
    const lens = 1.035 + 0.095*Math.sin(t*0.19) + 0.045*Math.sin(t*0.47+1.1);
    const searchingZoom = 1 + Math.min(0.10, Math.hypot(state.targetYaw,state.targetPitch)*0.035);
    state.zoom += (lens*searchingZoom-state.zoom)*Math.min(1,dt*1.3);
    const driftX = Math.sin(t*0.11)*w*0.012;
    const driftY = Math.cos(t*0.16)*h*0.012;
    const panX = state.yaw*w*0.30 + driftX;
    const panY = state.pitch*h*0.22 + driftY;
    if (sky) drawCover(sky,0,0,w,h,state.zoom,panX,panY);

    // Original environmental cut-outs are kept available and are not used as a fabricated skyline.
    // Their exact scene positions are unknown because the Clickteam frame layout was not recovered.

    // UFO: original size progression in PNGs 5–49 (same recovered artwork, increasing scale).
    // Its path is independent from player input; the camera only changes the view around it.
    const phase=t;
    const ufoX = 0.5 + 0.29*Math.sin(phase*0.22) + 0.12*Math.sin(phase*0.51+0.8);
    const ufoY = 0.43 + 0.20*Math.sin(phase*0.31+1.4) + 0.07*Math.cos(phase*0.13);
    const depth = 0.5 + 0.5*Math.sin(phase*0.17-0.4);
    const frame = 5 + Math.round(depth*44);
    const ufo = ready(frame);
    const viewX = (ufoX-0.5)*w - state.yaw*w*0.30;
    const viewY = (ufoY-0.5)*h + state.pitch*h*0.22;
    if (ufo) {
      const scale = Math.min(w/390, h/700) * (0.46 + depth*1.35) * state.zoom;
      const uw=ufo.width*scale, uh=ufo.height*scale;
      ctx.save(); ctx.translate(w/2+viewX,h/2+viewY);
      ctx.rotate(0.018*Math.sin(t*0.65)); ctx.globalAlpha=0.96;
      ctx.drawImage(ufo,-uw/2,-uh/2,uw,uh); ctx.restore();
    }

    // Very subtle recovered analog noise plates; noise is not the scene/background.
    const noiseIds=[7,10,11,12,13];
    const noise=ready(noiseIds[Math.floor(t*8)%noiseIds.length]);
    if(noise){ctx.save();ctx.globalAlpha=0.025;ctx.globalCompositeOperation='screen';ctx.drawImage(noise,0,0,w,h);ctx.restore();}

    // Handheld camcorder movement: low-amplitude shake with occasional small bumps.
    state.shake=Math.max(0,state.shake-dt*1.4);
    if(Math.random()<dt*0.55) state.shake=0.12+Math.random()*0.55;
    // Tiny handheld motion is applied to the camera framing on the next frame;
    // avoid copying the canvas onto itself (which is inconsistent across browsers).

    // Recovered image 0 is a transparent foreground/window-frame plate. Keep it subtle,
    // so the actual sky remains visible and the overlay does not replace the gameplay scene.
    const frameOverlay=ready(0);
    if(frameOverlay){ctx.save();ctx.globalAlpha=0.52;drawCover(frameOverlay,0,0,w,h,1.0,0,0);ctx.restore();}
  }

  function drawIntro() {
    const sky=ready(118); if(sky) drawCover(sky,0,0,state.w,state.h,1.02,0,0);
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,state.w,state.h);
  }

  function render(now) {
    const dt=Math.min(.05,(now-state.last)/1000); state.last=now;
    if(state.started){
      state.elapsed+=dt;
      state.yaw+=(state.targetYaw-state.yaw)*Math.min(1,dt*4.2);
      state.pitch+=(state.targetPitch-state.pitch)*Math.min(1,dt*4.2);
      drawWorld(state.elapsed,dt);
      $('clock').textContent=new Date(state.elapsed*1000).toISOString().slice(11,19);
      $('status').textContent=(Math.abs(state.yaw)<.12&&Math.abs(state.pitch)<.12)?'PROCURANDO UFO':'ACOMPANHANDO UFO';
    } else drawIntro();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  function startGame(){
    state.started=true; state.elapsed=0; state.last=performance.now();
    $('intro').classList.add('hidden'); $('hud').classList.remove('hidden');
    $('rec').classList.remove('hidden');
    if(/iPhone|iPad|iPod/i.test(navigator.userAgent) && typeof DeviceOrientationEvent!=='undefined') $('permission').classList.remove('hidden');
    else toast('MOUSE: MOVA O CURSOR PARA PROCURAR O UFO');
    startAudio();
  }
  $('play').addEventListener('click',startGame);

  function onOrientation(e){
    if(e.alpha==null || e.beta==null) return;
    const current={yaw:e.alpha,pitch:e.beta,roll:e.gamma||0};
    if(!state.gyroBase){state.gyroBase=current;return;}
    let dy=wrapAngle(current.yaw-state.gyroBase.yaw);
    let dp=current.pitch-state.gyroBase.pitch;
    // Screen orientation compensation for landscape use.
    const angle=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
    if(angle===90){const old=dy;dy=dp;dp=-old;}
    else if(angle===270||angle===-90){const old=dy;dy=-dp;dp=old;}
    state.targetYaw=clamp(dy/58,-1,1);
    state.targetPitch=clamp(dp/52,-.88,.88);
  }
  $('enableMotion').addEventListener('click',async()=>{
    try{
      if(typeof DeviceOrientationEvent==='undefined') throw new Error('no orientation API');
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        const result=await DeviceOrientationEvent.requestPermission();
        if(result!=='granted') throw new Error('permission denied');
      }
      state.gyroBase=null;
      addEventListener('deviceorientation',onOrientation,true);
      $('permission').classList.add('hidden');
      toast('SENSOR ATIVO — SEGURE O IPHONE E MOVIMENTE');
    }catch(err){$('permission').classList.add('hidden');toast('SENSOR INDISPONÍVEL — USE O TOQUE');}
  });
  $('noMotion').addEventListener('click',()=>$('permission').classList.add('hidden'));

  // Desktop pointer position controls view direction. Touch drag is a fallback if sensors are denied.
  canvas.addEventListener('pointerdown',e=>{
    if(!state.started) return;
    if(e.pointerType==='touch'){state.dragging=true;state.lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);}
  });
  canvas.addEventListener('pointermove',e=>{
    if(!state.started) return;
    if(e.pointerType==='mouse'){
      const r=canvas.getBoundingClientRect();
      state.targetYaw=clamp(((e.clientX-r.left)/r.width-.5)*2,-1,1);
      state.targetPitch=clamp(((e.clientY-r.top)/r.height-.5)*2,-.88,.88);
    } else if(e.pointerType==='touch'&&state.dragging&&state.lastPointer){
      const dx=e.clientX-state.lastPointer.x,dy=e.clientY-state.lastPointer.y;
      state.targetYaw=clamp(state.targetYaw-dx/state.w*1.7,-1,1);
      state.targetPitch=clamp(state.targetPitch-dy/state.h*1.7,-.88,.88);
      state.lastPointer={x:e.clientX,y:e.clientY};
    }
  });
  const stopDrag=()=>{state.dragging=false;state.lastPointer=null;};
  canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);

  $('recenter').addEventListener('click',()=>{
    state.gyroBase=null;state.targetYaw=state.targetPitch=state.yaw=state.pitch=0;
    toast('CENTRO RECALIBRADO — MANTENHA O IPHONE NA POSIÇÃO DESEJADA');
  });
  $('sound').addEventListener('click',()=>{
    state.muted=!state.muted;
    if(state.audio){state.muted?state.audio.pause():state.audio.play().catch(()=>{});}
    $('sound').textContent=state.muted?'♪̸':'♪';toast(state.muted?'ÁUDIO DESATIVADO':'ÁUDIO ATIVADO');
  });
  $('exit').addEventListener('click',()=>{
    state.started=false;state.targetYaw=state.targetPitch=state.yaw=state.pitch=0;
    $('hud').classList.add('hidden');$('rec').classList.add('hidden');$('intro').classList.remove('hidden');
    if(state.audio) state.audio.pause();
  });
  function toast(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400);}

  // WAVs are preserved. MP3 derivatives are included for browser compatibility.
  function startAudio(){
    if(state.audioStarted||state.muted)return;
    state.audioStarted=true;
    // The extraction does not identify which numbered track is the original ambience.
    // Use the shortest general-purpose track as an optional sound test, not a claimed original soundtrack.
    state.audio=new Audio('assets/audio/0.mp3');state.audio.loop=true;state.audio.volume=.42;
    state.audio.play().catch(()=>{});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.audio)state.audio.pause();else if(state.started&&state.audio&&!state.muted)state.audio.play().catch(()=>{});});
})();
