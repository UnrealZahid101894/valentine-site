/* ─── MUSIC autoplay ─── */
const bgMusic = document.getElementById('bgMusic');
let musicPlaying = false;

function tryPlay() {
  bgMusic.volume = 0.5;
  bgMusic.play().then(() => { 
    musicPlaying = true; 
  }).catch(() => {});
}

tryPlay();
document.addEventListener('click', () => { 
  if (!musicPlaying) tryPlay(); 
}, { once: true });

document.addEventListener('touchstart', () => { 
  if (!musicPlaying) tryPlay(); 
}, { once: true, passive: true });

/* ─── FLOATING HEARTS ─── */
(function() {
  const layer = document.getElementById('heartsLayer');
  const emojis = ['💕', '💖', '💗', '💝', '💘', '🌹', '✨', '🫶', '💫'];
  
  setInterval(() => {
    const el = document.createElement('div');
    el.className = 'fheart';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.fontSize = (Math.random() * 14 + 13) + 'px';
    const dur = Math.random() * 5 + 7;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = (Math.random() * 1.5) + 's';
    layer.appendChild(el);
    setTimeout(() => el.remove(), (dur + 2.5) * 1000);
  }, 920);
})();

/* ─── CONFETTI ─── */
function launchConfetti() {
  const layer = document.getElementById('confettiLayer');
  const colors = ['#d42249', '#e8486a', '#f0708a', '#ffb3c6', '#ffc2cf', '#fff'];
  const shapes = ['◆', '★', '●', '■', '♥', '✦'];
  
  for (let i = 0; i < 200; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'cpice';
      p.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      p.style.left = Math.random() * 100 + '%';
      p.style.color = colors[Math.floor(Math.random() * colors.length)];
      p.style.fontSize = (Math.random() * 12 + 6) + 'px';
      p.style.animationDuration = (Math.random() * 2.5 + 1.9) + 's';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 5500);
    }, i * 11);
  }
}

/* ─── STAGE TRANSITIONS ─── */
function goTo(stageId) {
  const current = document.querySelector('.stage.active');
  const next = document.getElementById(stageId);
  if (!next || current === next) return;
  
  stopTimer();
  
  if (current) {
    current.classList.add('exiting');
    setTimeout(() => current.classList.remove('active', 'exiting'), 370);
  }
  
  setTimeout(() => next.classList.add('active'), 390);
}
window.goTo = goTo;

function handleYes() {
  stopTimer();
  goTo('stageSuccess');
  setTimeout(launchConfetti, 320);
}
window.handleYes = handleYes;

/* ─── TIMER ─── */
let timerInterval = null;
let secondsLeft = 0;

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('escapeBar').classList.remove('visible');
}

function startTimer(onExpire) {
  stopTimer();
  secondsLeft = 5;
  const countEl = document.getElementById('timerCount');
  const barEl = document.getElementById('escapeBar');
  countEl.textContent = '5';
  barEl.classList.add('visible');
  
  timerInterval = setInterval(() => {
    secondsLeft--;
    countEl.textContent = secondsLeft;
    if (secondsLeft <= 0) { 
      stopTimer(); 
      onExpire(); 
    }
  }, 1000);
}

/* ─── JUMP LOGIC (pages 1-3) ───
   State machine: idle → jumping → returned → exhausted
   • Click (idle)     → detach btn from DOM flow, place at fixed pos, jump away, start 5s timer
   • Cursor near      → jump to new random position
   • Timer expires    → reattach btn to original slot in DOM, add .returned class
   • Click (returned) → add .exhausted, advance to next stage
*/
let activeJumpBtn = null;

function randomPos(btn) {
  const bw = btn.offsetWidth || 160;
  const bh = btn.offsetHeight || 48;
  const m = 20;
  return {
    x: Math.random() * (window.innerWidth - bw - m * 2) + m,
    y: Math.random() * (window.innerHeight - bh - m * 2) + m,
  };
}

function handlePointer(cx, cy) {
  if (!activeJumpBtn) return;
  const btn = activeJumpBtn;
  const rect = btn.getBoundingClientRect();
  const bx = rect.left + rect.width / 2;
  const by = rect.top + rect.height / 2;
  if (Math.hypot(cx - bx, cy - by) < 120) {
    const p = randomPos(btn);
    btn.style.left = p.x + 'px';
    btn.style.top = p.y + 'px';
  }
}

document.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
document.addEventListener('touchmove', e => {
  if (e.touches.length) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

function setupJumpingNo(btnId, nextStageId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  let state = 'idle';
  let origParent = null;
  let origNextSibling = null;

  btn.addEventListener('click', () => {
    if (state === 'exhausted') return;

    if (state === 'idle') {
      // Remember DOM position
      origParent = btn.parentNode;
      origNextSibling = btn.nextSibling;

      // Snapshot current position before detaching
      const rect = btn.getBoundingClientRect();
      btn.classList.add('jumping');
      // Must append to body BEFORE setting left/top so getBoundingClientRect works
      document.body.appendChild(btn);
      btn.style.left = rect.left + 'px';
      btn.style.top = rect.top + 'px';

      // Bounce away next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const p = randomPos(btn);
          btn.style.left = p.x + 'px';
          btn.style.top = p.y + 'px';
        });
      });

      activeJumpBtn = btn;
      state = 'jumping';

      startTimer(() => {
        // Return to original DOM slot
        activeJumpBtn = null;
        btn.classList.remove('jumping');
        btn.style.left = '';
        btn.style.top = '';
        btn.style.width = '';

        if (origNextSibling) {
          origParent.insertBefore(btn, origNextSibling);
        } else {
          origParent.appendChild(btn);
        }
        btn.classList.add('returned');
        btn.textContent = 'Okay… one more chance? 😔';
        state = 'returned';
      });

    } else if (state === 'returned') {
      state = 'exhausted';
      btn.classList.remove('returned');
      btn.classList.add('exhausted');
      btn.textContent = 'Gave up 😔';
      setTimeout(() => goTo(nextStageId), 420);
    }
  });
}

/* ─── STAGE 4 — yes grows, no shrinks ─── */
let s4YesSize = 17, s4YesPadV = 17, s4YesPadH = 38;
let s4NoSize = 15, s4NoPadV = 14, s4NoPadH = 32, s4NoOp = 1;

function setupStage4No() {
  const btn = document.getElementById('noBtn4');
  const yesBtn = document.getElementById('btnYesFinal');
  if (!btn || !yesBtn) return;
  
  btn.addEventListener('click', () => {
    if (btn.classList.contains('exhausted')) return;
    
    s4YesSize = Math.min(s4YesSize + 2.5, 30);
    s4YesPadV = Math.min(s4YesPadV + 2, 24);
    s4YesPadH = Math.min(s4YesPadH + 5, 60);
    yesBtn.style.fontSize = s4YesSize + 'px';
    yesBtn.style.padding = s4YesPadV + 'px ' + s4YesPadH + 'px';
    
    s4NoSize = Math.max(s4NoSize - 1.5, 9);
    s4NoPadV = Math.max(s4NoPadV - 1.5, 6);
    s4NoPadH = Math.max(s4NoPadH - 2, 10);
    s4NoOp = Math.max(s4NoOp - 0.1, 0.2);
    btn.style.fontSize = s4NoSize + 'px';
    btn.style.padding = s4NoPadV + 'px ' + s4NoPadH + 'px';
    btn.style.opacity = s4NoOp + '';
    
    if (s4NoSize <= 9) { 
      btn.classList.add('exhausted'); 
      btn.textContent = '…'; 
    }
  });
}

/* ─── INIT ─── */
setupJumpingNo('noBtn1', 'stage2');
setupJumpingNo('noBtn2', 'stage3');
setupJumpingNo('noBtn3', 'stage4');
setupStage4No();
