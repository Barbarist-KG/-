// ======================= game.js =======================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timeEl  = document.getElementById('time');
const btnStart = document.getElementById('btnStart');
const btn2game = document.getElementById("btn2game")

const GAME_TIME = 30_000; // 30 секунд

let state = {
  running:false,
  startTime:0,
  elapsed:0,
  score:0,
  circle:{ x:120, y:120, r:26, vx:160, vy:140 },
};

function rand(min,max){ return Math.random()*(max-min)+min }
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)) }

function reset(){
  state.running = true;
  state.startTime = performance.now();
  state.elapsed = 0; state.score=0; updateUI();
  state.circle = { x:rand(60, canvas.width-60), y:rand(60, canvas.height-60), r:26, vx:rand(120,180), vy:rand(120,180) };
  loop();
}

function loop(){
  if(!state.running) return;
  const now = performance.now();
  state.elapsed = now - state.startTime;
  const dt = 1/60;

  const c = state.circle;
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  if(c.x - c.r < 0){ c.x = c.r; c.vx *= -1 }
  if(c.x + c.r > canvas.width){ c.x = canvas.width - c.r; c.vx *= -1 }
  if(c.y - c.r < 0){ c.y = c.r; c.vy *= -1 }
  if(c.y + c.r > canvas.height){ c.y = canvas.height - c.r; c.vy *= -1 }

  draw();

  const left = Math.max(0, GAME_TIME - state.elapsed);
  timeEl.textContent = (left/1000).toFixed(1);
  if(left <= 0){
    state.running = false; timeEl.textContent = '0.0';
    banner('Время вышло! Итог: '+state.score);
    return;
  }

  requestAnimationFrame(loop);
}

function draw(){
  ctx.fillStyle = '#fcfcfc';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.setLineDash([10,5]);
  ctx.strokeRect(6,6,canvas.width-12,canvas.height-12);
  ctx.setLineDash([]);

  const c = state.circle;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
  ctx.fillStyle = '#ffec70';
  ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke();

  ctx.beginPath();
  ctx.arc(c.x-8, c.y-4, 3, 0, Math.PI*2);
  ctx.arc(c.x+8, c.y-4, 3, 0, Math.PI*2);
  ctx.fillStyle = '#111'; ctx.fill();
  ctx.beginPath();
  ctx.arc(c.x, c.y+6, 8, 0, Math.PI);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.stroke();
}

function onPointer(evt){
  if(!state.running) return;
  const rect = canvas.getBoundingClientRect();
  const x = (evt.clientX ?? evt.touches?.[0]?.clientX) - rect.left;
  const y = (evt.clientY ?? evt.touches?.[0]?.clientY) - rect.top;
  const c = state.circle;
  const dx = x * (canvas.width/rect.width) - c.x;
  const dy = y * (canvas.height/rect.height) - c.y;
  if(dx*dx + dy*dy <= c.r*c.r){
    state.score++;
    scoreEl.textContent = state.score;
    const speedUp = 1.06; // ускоряем, но НЕ меняем направление
    c.vx *= speedUp;
    c.vy *= speedUp;
    c.r = clamp(c.r - 0.8, 14, 40);
    pop(c.x, c.y);
  }
}

let pops = [];
function pop(x,y){
  pops.push({x,y, t:0});
  const timer = setInterval(()=>{
    draw();
    pops = pops.filter(p=>p.t<1);
    for(const p of pops){
      p.t += 0.12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10 + 30*p.t, 0, Math.PI*2);
      ctx.globalAlpha = 1 - p.t; ctx.lineWidth = 2; ctx.strokeStyle = '#ff7aa2'; ctx.stroke(); ctx.globalAlpha = 1;
    }
    if(pops.length===0){ clearInterval(timer); }
  }, 30);
}

function banner(text){
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px Comic Sans MS, system-ui';
  ctx.fillText(text, canvas.width/2, canvas.height/2);
  ctx.font = '16px system-ui';
  ctx.fillText('Нажми «Старт / заново», чтобы играть снова', canvas.width/2, canvas.height/2 + 32);
}

function updateUI(){
  scoreEl.textContent = state.score;
  timeEl.textContent = (Math.max(0, (GAME_TIME-state.elapsed)/1000)).toFixed(1);
}

canvas.addEventListener('click', onPointer);
canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); onPointer(e); }, {passive:false});
btnStart.addEventListener('click', reset);

draw();
banner('Нажми «Старт / заново»');
