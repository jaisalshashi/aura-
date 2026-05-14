// src/audioEngine.js
export function createAudioEngine() {
  let ctx = null;
  let activeNodes = [];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function stopAll() {
    activeNodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch {} });
    activeNodes = [];
  }

  function playRain(vol = 0.5) {
    stopAll();
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 600; bp.Q.value = 0.4;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2500;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
    activeNodes.push(src, bp, lp, g);
  }

  function playCafe(vol = 0.4) {
    stopAll();
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 4; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 350; bp.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(bp); bp.connect(g); g.connect(c.destination); src.start();
    activeNodes.push(src, bp, g);
    const iv = setInterval(() => {
      if (!activeNodes.length) { clearInterval(iv); return; }
      const osc = c.createOscillator(); const og = c.createGain();
      osc.frequency.value = 1100 + Math.random() * 500; osc.type = "sine";
      og.gain.setValueAtTime(0.09, c.currentTime); og.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);
      osc.connect(og); og.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.35);
    }, 4000 + Math.random() * 5000);
    activeNodes.push({ stop: () => clearInterval(iv), disconnect: () => {} });
  }

  function playNature(vol = 0.5) {
    stopAll();
    const c = getCtx();
    const wBuf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
    const wd = wBuf.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    const wind = c.createBufferSource(); wind.buffer = wBuf; wind.loop = true;
    const wlp = c.createBiquadFilter(); wlp.type = "lowpass"; wlp.frequency.value = 400;
    const wg = c.createGain(); wg.gain.value = vol * 0.35;
    wind.connect(wlp); wlp.connect(wg); wg.connect(c.destination); wind.start();
    activeNodes.push(wind, wlp, wg);
    const lBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const ld = lBuf.getChannelData(0);
    for (let i = 0; i < ld.length; i++) ld[i] = Math.random() * 2 - 1;
    const leaves = c.createBufferSource(); leaves.buffer = lBuf; leaves.loop = true;
    const lhp = c.createBiquadFilter(); lhp.type = "highpass"; lhp.frequency.value = 3500;
    const lg = c.createGain(); lg.gain.value = vol * 0.12;
    leaves.connect(lhp); lhp.connect(lg); lg.connect(c.destination); leaves.start();
    activeNodes.push(leaves, lhp, lg);
    function chirp() {
      if (!activeNodes.length) return;
      const osc = c.createOscillator(); const og = c.createGain();
      const f = 2000 + Math.random() * 1500; osc.type = "sine";
      osc.frequency.setValueAtTime(f, c.currentTime);
      osc.frequency.linearRampToValueAtTime(f * 1.35, c.currentTime + 0.07);
      osc.frequency.linearRampToValueAtTime(f, c.currentTime + 0.15);
      og.gain.setValueAtTime(0, c.currentTime); og.gain.linearRampToValueAtTime(0.13, c.currentTime + 0.02);
      og.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      osc.connect(og); og.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.25);
      setTimeout(chirp, 1200 + Math.random() * 3500);
    }
    setTimeout(chirp, 600);
  }

  function playLofi(vol = 0.5) {
    stopAll();
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.004 ? (Math.random() * 2 - 1) * 0.5 : 0;
    const crackle = c.createBufferSource(); crackle.buffer = buf; crackle.loop = true;
    const cg = c.createGain(); cg.gain.value = 0.18;
    crackle.connect(cg); cg.connect(c.destination); crackle.start();
    activeNodes.push(crackle, cg);
    [261.63, 329.63, 392.00, 493.88].forEach(freq => {
      const osc = c.createOscillator(); const lp = c.createBiquadFilter(); const g = c.createGain();
      osc.type = "sawtooth"; osc.frequency.value = freq;
      lp.type = "lowpass"; lp.frequency.value = 750; g.gain.value = vol * 0.038;
      osc.connect(lp); lp.connect(g); g.connect(c.destination); osc.start();
      activeNodes.push(osc, lp, g);
    });
    function hihat() {
      if (!activeNodes.length) return;
      const hb = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
      const hd = hb.getChannelData(0); for (let i = 0; i < hd.length; i++) hd[i] = Math.random() * 2 - 1;
      const h = c.createBufferSource(); h.buffer = hb;
      const hf = c.createBiquadFilter(); hf.type = "highpass"; hf.frequency.value = 8000;
      const hg = c.createGain(); hg.gain.setValueAtTime(0.07, c.currentTime); hg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
      h.connect(hf); hf.connect(hg); hg.connect(c.destination); h.start(); h.stop(c.currentTime + 0.06);
      setTimeout(hihat, 480);
    }
    setTimeout(hihat, 240);
    function kick() {
      if (!activeNodes.length) return;
      const osc = c.createOscillator(); const kg = c.createGain();
      osc.frequency.setValueAtTime(150, c.currentTime); osc.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.1);
      kg.gain.setValueAtTime(0.4, c.currentTime); kg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      osc.connect(kg); kg.connect(c.destination); osc.start(); osc.stop(c.currentTime + 0.22);
      setTimeout(kick, 960);
    }
    setTimeout(kick, 0);
  }

  return { playRain, playCafe, playNature, playLofi, stopAll };
}
