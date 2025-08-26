const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sounds = {
  shoot: new Audio('shoot.mp3'),
  hit: new Audio('hit.mp3'),
 death: new Audio('gameOver.mp3')
};
let player, bullets, enemies;
let keys, mouse;
let score, level;
let paused = false, gameOver = false;

let enemiesKilled = 0;
const achievements = [
  { id: 10, unlocked: false },
  { id: 100, unlocked: false },
  { id: 250, unlocked: false },
  { id: 500, unlocked: false },
  { id: 1000, unlocked: false },
  { id: 10000, unlocked: false }
];
const backgroundMusic = new Audio('music.mp3'); // Путь к твоей музыке
backgroundMusic.loop = true; // Зациклить музыку
backgroundMusic.volume = 0.3; // Уровень громкости
backgroundMusic.play(0); // Запуск музыки

// Вспышка экрана при выстреле/попадании
let flashAlpha = 0;
// Плавающие цифры урона
let floatingTexts = [];
// Подсказка в начале игры
let showHint = true;
let hintTimer = 180; // 3 секунды при 60fps
// Плавное затемнение Game Over
let gameOverFade = 0;

function init(){
  player = {
    x: canvas.width/2,
    y: canvas.height/2,
    size: 20,
    maxSpeed: 3,
    vx: 0,
    vy: 0,
    acceleration: 0.2,
    friction: 0.1,
    lives: 10,
    ammo: 20,
    maxAmmo: 10,
    reloadTime: 1000,
    reloading: false
  };
  score = 0;
  level = 1;
  bullets = [];
  enemies = [];
  keys = {};
  mouse = {x:0, y:0};
  paused = false;
  gameOver = false;
  enemiesKilled = 0;
  achievements.forEach(a => a.unlocked = false);
  updateAchievementsPanel();
  spawnEnemies(level);
  gameOverFade = 0;
  floatingTexts = [];
  showHint = true;
  hintTimer = 180;
}

function spawnEnemies(currentLevel){
  const count = currentLevel + 2;
  enemies = [];
  for(let i = 0; i < count; i++){
    const side = Math.floor(Math.random() * 4);
    let x = side === 0 ? 0 : side === 1 ? canvas.width : Math.random() * canvas.width;
    let y = side === 2 ? 0 : side === 3 ? canvas.height : Math.random() * canvas.height;

    const rand = Math.random();
    if(rand < 0.6){
      enemies.push({ x, y, type: 'normal', speed: 1.5, size: 20 });
    } else if(rand < 0.9){
      enemies.push({ x, y, type: 'fast', speed: 2.5, size: 15 });
    } else {
      enemies.push({
        x, y, type: 'shooter', speed: 1.2, size: 22,
        shootCooldown: 0,
        shootDelay: 120
      });
    }
  }
  if(sounds.spawn){
    sounds.spawn.volume = 0.3;
    sounds.spawn.play();
  }
}

function reloadAmmo(){
  player.reloading = true;
  setTimeout(() => {
    player.ammo = player.maxAmmo;
    player.reloading = false;
  }, player.reloadTime);
}

document.addEventListener('keydown', e => {
  if(e.key === 'Escape'){
    paused = !paused;
  } else {
    keys[e.key.toLowerCase()] = true;
  }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});

canvas.addEventListener('click', () => {
  if(paused || gameOver) return;
  if(player.reloading || player.ammo <= 0) return;
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 6,
    dy: Math.sin(angle) * 6,
    size: 5,
    type: 'player'
  });
  player.ammo--;
  sounds.shoot.play();
  flashAlpha = 0.6;

  if(player.ammo === 0) reloadAmmo();
});

function updateAchievements(){
  achievements.forEach(ach => {
    if(!ach.unlocked && enemiesKilled >= ach.id){
      ach.unlocked = true;
      showAchievement(`Достижение: Убил ${ach.id} врагов!`);
      const li = document.getElementById(`ach-${ach.id}`);
      if(li) li.classList.add('unlocked');
    }
  });
}

function updateAchievementsPanel(){
  achievements.forEach(ach => {
    const li = document.getElementById(`ach-${ach.id}`);
    if(li){
      li.classList.toggle('unlocked', ach.unlocked);
    }
  });
}

function showAchievement(text){
  const achDiv = document.createElement('div');
  achDiv.textContent = `🏆 ${text}`;
  achDiv.style.position = 'fixed';
  achDiv.style.top = '30px';
  achDiv.style.left = '50%';
  achDiv.style.transform = 'translateX(-50%)';
  achDiv.style.background = 'rgba(0, 0, 0, 0.85)';
  achDiv.style.color = '#0f0';
  achDiv.style.padding = '12px 24px';
  achDiv.style.fontSize = '18px';
  achDiv.style.fontWeight = 'bold';
  achDiv.style.border = '2px solid rgba(13, 255, 0, 1)';
  achDiv.style.borderRadius = '10px';
  achDiv.style.boxShadow = '0 0 10px #0f0';
  achDiv.style.zIndex = 9999;
  achDiv.style.pointerEvents = 'none';
  achDiv.style.opacity = '1';
  achDiv.style.transition = 'opacity 0.5s ease';

  document.body.appendChild(achDiv);

  setTimeout(() => {
    achDiv.style.opacity = '0';
    setTimeout(() => achDiv.remove(), 500);
  }, 3000);
}

// Добавляем плавающий текст урона
function addFloatingText(text, x, y, color = '#ff0'){
  floatingTexts.push({text, x, y, alpha: 1, vy: -0.7, color});
}

function update(){
  if(paused || gameOver){
    if(gameOver && gameOverFade < 1) gameOverFade += 0.01;
    return;
  }

  if(showHint){
    hintTimer--;
    if(hintTimer <= 0) showHint = false;
  }

  // Движение игрока
  if(keys['w'] || keys['arrowup']) player.vy -= player.acceleration;
  if(keys['s'] || keys['arrowdown']) player.vy += player.acceleration;
  if(keys['a'] || keys['arrowleft']) player.vx -= player.acceleration;
  if(keys['d'] || keys['arrowright']) player.vx += player.acceleration;
  if(keys['ц'] || keys['arrowup']) player.vy -= player.acceleration;
  if(keys['ы'] || keys['arrowdown']) player.vy += player.acceleration;
  if(keys['ф'] || keys['arrowleft']) player.vx -= player.acceleration;
  if(keys['в'] || keys['arrowright']) player.vx += player.acceleration;

  player.vx = Math.max(-player.maxSpeed, Math.min(player.vx, player.maxSpeed));
  player.vy = Math.max(-player.maxSpeed, Math.min(player.vy, player.maxSpeed));

  if(!keys['a'] && !keys['d']){
    player.vx *= 0.9;
    if(Math.abs(player.vx) < 0.1) player.vx = 0;
  }
  if(!keys['w'] && !keys['s']){
    player.vy *= 0.9;
    if(Math.abs(player.vy) < 0.1) player.vy = 0;
  }

  player.x += player.vx;
  player.y += player.vy;

  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));

  // Обновляем пули
  bullets.forEach(b => {
    b.x += b.dx;
    b.y += b.dy;
  });
  bullets = bullets.filter(b => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);

  // Враги движутся и стреляют (если shooter)
  enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);

    enemy.x += Math.cos(angle) * enemy.speed;
    enemy.y += Math.sin(angle) * enemy.speed;

    if(enemy.type === 'shooter'){
      if(enemy.shootCooldown > 0){
        enemy.shootCooldown--;
      } else {
        enemy.shootCooldown = enemy.shootDelay;

        // Враг стреляет замедляющими пулями без урона
        const bulletSpeed = 3;
        const bdx = Math.cos(angle) * bulletSpeed;
        const bdy = Math.sin(angle) * bulletSpeed;
        bullets.push({
          x: enemy.x,
          y: enemy.y,
          dx: bdx,
          dy: bdy,
          size: 7,
          type: 'enemy_slow'
        });
      }
    }
  });

  // Проверка попаданий пуль игрока во врагов
  for(let i = enemies.length - 1; i >= 0; i--){
    const enemy = enemies[i];
    for(let j = bullets.length - 1; j >= 0; j--){
      const b = bullets[j];
      if(b.type !== 'player') continue;
      const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
      if(dist < enemy.size/2 + b.size){
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        enemiesKilled++;
        score += 10;
        addFloatingText('+10', enemy.x, enemy.y, '#0f0');
        flashAlpha = 0.5;
        sounds.hit.play();
        updateAchievements();
        break;
      }
    }
  }

  // Проверка попаданий замедляющих пуль во игрока
  for(let i = bullets.length - 1; i >= 0; i--){
    const b = bullets[i];
    if(b.type === 'enemy_slow'){
      const dist = Math.hypot(b.x - player.x, b.y - player.y);
      if(dist < player.size/2 + b.size){
        bullets.splice(i, 1);
        player.maxSpeed = 0.5; // замедление игрока
        setTimeout(() => player.maxSpeed = 3, 3000); // через 3 секунды - нормальная скорость
        addFloatingText('Замедлен!', player.x, player.y - 20, '#0af');
      }
    }
  }

  // Проверка столкновения врагов с игроком
  enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if(dist < enemy.size/2 + player.size/2){
      player.lives--;
      addFloatingText('-1 жизнь', player.x, player.y - 20, '#f00');
      enemy.x = -100; // убираем врага
      if(player.lives <= 0){
        gameOver = true;
          sounds.death.play(); // Проигрываем звук смерти
      }
    }
  });

  // Обновляем плавающие тексты
  floatingTexts.forEach((ft, i) => {
    ft.y += ft.vy;
    ft.alpha -= 0.02;
    if(ft.alpha <= 0) floatingTexts.splice(i, 1);
  });

  // Flash плавное затухание
  if(flashAlpha > 0) flashAlpha -= 0.02;

  // Если все враги убиты, следующий уровень
  if(enemies.length === 0 && !gameOver){
    level++;
    spawnEnemies(level);
  }
}

function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  // Игрок
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size/2, 0, Math.PI * 2);
  ctx.fill();

  // Пули
  bullets.forEach(b => {
    if(b.type === 'player'){
      ctx.fillStyle = '#ff0';
    } else if(b.type === 'enemy_slow'){
      ctx.fillStyle = '#0af';
    } else {
      ctx.fillStyle = '#f00';
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size/2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Враги
  enemies.forEach(enemy => {
    if(enemy.type === 'normal'){
      ctx.fillStyle = '#f00';
    } else if(enemy.type === 'fast'){
      ctx.fillStyle = '#fa0';
    } else if(enemy.type === 'shooter'){
      ctx.fillStyle = '#a0f';
    }
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size/2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Плавающий текст
  floatingTexts.forEach(ft => {
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  });

  // HUD
  ctx.fillStyle = '#ddd';
  ctx.font = '16px Arial';
  ctx.fillText(`Жизни: ${player.lives}`, 10, 20);
  ctx.fillText(`Патроны: ${player.ammo}${player.reloading ? ' (перезарядка)' : ''}`, 10, 40);
  ctx.fillText(`Уровень: ${level}`, 10, 60);
  ctx.fillText(`Очки: ${score}`, 10, 80);

  // Подсказка
  if(showHint){
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px Arial';
    ctx.fillText('WASD/стрелки - движение, мышь + клик - стрелять, Esc - пауза', 100, canvas.height - 30);
  }

  // Пауза
  if(paused){
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Пауза', canvas.width/2, canvas.height/2);
    ctx.textAlign = 'left';
  }

  // Game Over с затемнением
  if(gameOver){
    ctx.fillStyle = `rgba(0,0,0,${gameOverFade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if(gameOverFade >= 1){
      ctx.fillStyle = '#f00';
      ctx.font = '64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Игра окончена', canvas.width/2, canvas.height/2);
      ctx.font = '24px Arial';
      ctx.fillText(`Очки: ${score}`, canvas.width/2, canvas.height/2 + 40);
      ctx.fillText('Обновите страницу для новой игры', canvas.width/2, canvas.height/2 + 80);
      ctx.textAlign = 'left';
    }
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}


init();
loop();

