// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick').includes(tabId));
  });
  document.querySelectorAll('.tool-card').forEach(c => {
    c.classList.toggle('active', c.id === tabId);
  });
}

// 1. Volume Booster
let boostCtx, boostGain, boostSource;
function handleBoostUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('boost-name').innerText = file.name;
  const player = document.getElementById('boost-player');
  player.src = URL.createObjectURL(file);
  player.style.display = 'block';

  if (!boostCtx) {
    boostCtx = new (window.AudioContext || window.webkitAudioContext)();
    boostGain = boostCtx.createGain();
    boostSource = boostCtx.createMediaElementSource(player);
    boostSource.connect(boostGain);
    boostGain.connect(boostCtx.destination);
  }
}
function updateBoost(val) {
  document.getElementById('boost-val').innerText = Math.round(val * 100) + '%';
  if (boostGain) boostGain.gain.value = parseFloat(val);
}

// 2. Pitch & Speed
function handlePitchUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('pitch-name').innerText = file.name;
  const player = document.getElementById('pitch-player');
  player.src = URL.createObjectURL(file);
  player.style.display = 'block';
}
function updateSpeed(val) {
  document.getElementById('speed-val').innerText = val + 'x';
  const player = document.getElementById('pitch-player');
  player.playbackRate = parseFloat(val);
}

// 3. Video to Audio
let v2aVideo;
function handleV2AUpload(e) {
  v2aVideo = e.target.files[0];
  if (v2aVideo) {
    document.getElementById('v2a-name').innerText = v2aVideo.name;
    document.getElementById('v2a-btn').style.display = 'block';
  }
}
async function extractAudio() {
  const status = document.getElementById('v2a-status');
  status.innerText = "Extracting audio track locally...";
  const actx = new AudioContext();
  const buffer = await actx.decodeAudioData(await v2aVideo.arrayBuffer());
  const offline = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  const wavBlob = bufferToWave(rendered, rendered.length);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(wavBlob);
  a.download = v2aVideo.name.split('.')[0] + '_audio.wav';
  a.click();
  status.innerText = "Extraction complete! Download started.";
}

// 4. Water Ejector (165Hz)
let cleanerOsc, cleanerActive = false;
function toggleWaterEject() {
  const btn = document.getElementById('cleaner-btn');
  if (!cleanerActive) {
    const ctx = new AudioContext();
    cleanerOsc = ctx.createOscillator();
    cleanerOsc.type = 'sawtooth';
    cleanerOsc.frequency.setValueAtTime(165, ctx.currentTime);
    cleanerOsc.connect(ctx.destination);
    cleanerOsc.start();
    cleanerActive = true;
    btn.innerText = "Stop Ejection Wave";
    btn.style.background = "var(--danger)";
  } else {
    if (cleanerOsc) cleanerOsc.stop();
    cleanerActive = false;
    btn.innerText = "Start Ejection Frequency";
    btn.style.background = "var(--accent)";
  }
}

// 5. Decibel Meter
let dbStream, dbCtx, dbAnalyser, dbAnim, dbActive = false;
async function toggleDecibelMeter() {
  const btn = document.getElementById('db-btn');
  if (!dbActive) {
    try {
      dbStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dbCtx = new AudioContext();
      dbAnalyser = dbCtx.createAnalyser();
      dbAnalyser.fftSize = 512;
      dbCtx.createMediaStreamSource(dbStream).connect(dbAnalyser);
      dbActive = true;
      btn.innerText = "Stop Measurement";
      btn.style.background = "var(--danger)";
      measureDb();
    } catch {
      alert("Mic permission required for dB meter.");
    }
  } else {
    if (dbStream) dbStream.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(dbAnim);
    dbActive = false;
    btn.innerText = "Start Measurement";
    btn.style.background = "var(--accent)";
    document.getElementById('db-val').innerText = "0";
    document.getElementById('db-fill').style.width = "0%";
  }
}
function measureDb() {
  const data = new Uint8Array(dbAnalyser.frequencyBinCount);
  dbAnalyser.getByteFrequencyData(data);
  let avg = data.reduce((a, b) => a + b, 0) / data.length;
  let db = avg > 0 ? Math.round(20 * Math.log10(avg) + 20) : 0;
  document.getElementById('db-val').innerText = db;
  document.getElementById('db-fill').style.width = Math.min(100, (db / 110) * 100) + '%';
  if (dbActive) dbAnim = requestAnimationFrame(measureDb);
}

// 6. Latency Sync
function triggerLatencyTest() {
  const box = document.getElementById('latency-flash');
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.connect(ctx.destination);
  box.style.background = "#fff";
  box.style.color = "#000";
  box.innerText = "PULSE!";
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
  setTimeout(() => {
    box.style.background = "#0b0f19";
    box.style.color = "#fff";
    box.innerText = "Press Trigger to Sync";
  }, 120);
}

// 7. Vocal Clarity
let clarityCtx, clarityFilter, claritySource, clarityEnabled = false;
function handleClarityUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('clarity-name').innerText = file.name;
  const player = document.getElementById('clarity-player');
  player.src = URL.createObjectURL(file);
  player.style.display = 'block';

  clarityCtx = new AudioContext();
  clarityFilter = clarityCtx.createBiquadFilter();
  clarityFilter.type = "peaking";
  clarityFilter.frequency.value = 3000;
  clarityFilter.gain.value = 0;
  claritySource = clarityCtx.createMediaElementSource(player);
  claritySource.connect(clarityFilter);
  clarityFilter.connect(clarityCtx.destination);
}
function toggleClarityFilter() {
  if (!clarityFilter) return;
  clarityEnabled = !clarityEnabled;
  clarityFilter.gain.value = clarityEnabled ? 12 : 0;
  alert(clarityEnabled ? "Vocal Clarity filter ON" : "Vocal Clarity filter OFF");
}

// 8. 8D Spatial Audio
let spatialCtx, pannerNode, spatialSource, panAngle = 0, panTimer;
function handle8DUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('8d-name').innerText = file.name;
  const audio = new Audio(URL.createObjectURL(file));
  audio.loop = true;
  spatialCtx = new AudioContext();
  pannerNode = spatialCtx.createStereoPanner();
  spatialSource = spatialCtx.createMediaElementSource(audio);
  spatialSource.connect(pannerNode);
  pannerNode.connect(spatialCtx.destination);
  window._8dAudio = audio;
}
function toggle8DEffect() {
  const btn = document.getElementById('8d-btn');
  if (!window._8dAudio) { alert("Please select a file first"); return; }
  if (window._8dAudio.paused) {
    window._8dAudio.play();
    btn.innerText = "Stop 8D Experience";
    panTimer = setInterval(() => {
      panAngle += 0.05;
      if (pannerNode) pannerNode.pan.value = Math.sin(panAngle);
    }, 50);
  } else {
    window._8dAudio.pause();
    clearInterval(panTimer);
    btn.innerText = "Activate 8D Sound Experience";
  }
}

// 9. Voice Transformer
let mediaRecorder, voiceChunks = [], recordedBlob;
async function toggleVoiceRecord() {
  const btn = document.getElementById('rec-btn');
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    voiceChunks = [];
    mediaRecorder.ondataavailable = e => voiceChunks.push(e.data);
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(voiceChunks, { type: 'audio/wav' });
      btn.innerText = "Record Voice (Mic) - Done!";
    };
    mediaRecorder.start();
    btn.innerText = "Recording... Click to Stop";
    btn.style.background = "var(--danger)";
  } else {
    mediaRecorder.stop();
    btn.style.background = "var(--accent)";
  }
}
function playVoiceEffect(type) {
  if (!recordedBlob) { alert("Please record your voice first!"); return; }
  const audio = new Audio(URL.createObjectURL(recordedBlob));
  if (type === 'helium') audio.playbackRate = 1.6;
  if (type === 'deep') audio.playbackRate = 0.7;
  audio.play();
}

// 10. Hearing Age Challenge
let toneCtx, toneOsc, toneActive = false;
function updateFreq(val) {
  document.getElementById('freq-val').innerText = val + ' Hz';
  if (toneOsc) toneOsc.frequency.setValueAtTime(val, toneCtx.currentTime);
  const est = document.getElementById('hearing-estimate');
  if (val > 17000) est.innerText = "Estimated Hearing Age: Under 20 (Teens)";
  else if (val > 15000) est.innerText = "Estimated Hearing Age: Under 30";
  else if (val > 12000) est.innerText = "Estimated Hearing Age: Under 40";
  else est.innerText = "Estimated Hearing Age: 50+";
}
function toggleTone() {
  const btn = document.getElementById('tone-btn');
  if (!toneActive) {
    toneCtx = new AudioContext();
    toneOsc = toneCtx.createOscillator();
    toneOsc.frequency.setValueAtTime(document.getElementById('freq-slider').value, toneCtx.currentTime);
    toneOsc.connect(toneCtx.destination);
    toneOsc.start();
    toneActive = true;
    btn.innerText = "Stop Tone";
    btn.style.background = "var(--danger)";
  } else {
    if (toneOsc) toneOsc.stop();
    toneActive = false;
    btn.innerText = "Play Test Tone";
    btn.style.background = "var(--accent)";
  }
}

// 11. Binaural Waves
let binCtx, oscL, oscR;
function playBinaural(beat) {
  stopBinaural();
  binCtx = new AudioContext();
  const merger = binCtx.createChannelMerger(2);
  oscL = binCtx.createOscillator();
  oscR = binCtx.createOscillator();
  oscL.frequency.value = 200;
  oscR.frequency.value = 200 + beat;
  oscL.connect(merger, 0, 0);
  oscR.connect(merger, 0, 1);
  merger.connect(binCtx.destination);
  oscL.start();
  oscR.start();
}
function stopBinaural() {
  if (binCtx) { binCtx.close(); binCtx = null; }
}

// 12. Reverse Audio
let revFile;
function handleReverseUpload(e) {
  revFile = e.target.files[0];
  if (revFile) document.getElementById('rev-name').innerText = revFile.name;
}
async function processReverseAudio() {
  if (!revFile) return;
  const ctx = new AudioContext();
  const buffer = await ctx.decodeAudioData(await revFile.arrayBuffer());
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    Array.prototype.reverse.call(buffer.getChannelData(c));
  }
  const wavBlob = bufferToWave(buffer, buffer.length);
  const player = document.getElementById('rev-player');
  player.src = URL.createObjectURL(wavBlob);
  player.style.display = 'block';
  player.play();
}

// WAV Encoder Helper
function bufferToWave(abuffer, len) {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample, offset = 0, pos = 0;
  function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
  setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
  setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
  for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
  while (offset < len) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true); pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], { type: "audio/wav" });
}

// Legal Modals Control (AdSense Requirements)
function openModal(modalId) {
  document.querySelectorAll('.modal-tab').forEach(m => m.style.display = 'none');
  const target = document.getElementById(modalId);
  if (target) target.style.display = 'block';
  document.getElementById('modal-container').style.display = 'flex';
}

function closeModalDirect() {
  document.getElementById('modal-container').style.display = 'none';
}

function closeModal(event) {
  if (event.target.id === 'modal-container') {
    closeModalDirect();
  }
}
