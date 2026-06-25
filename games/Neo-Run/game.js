const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- PENGATURAN FISIKA & GAME ---
const GRAVITY = 0.6;
const FRICTION = 0.8;
const MAX_SPEED = 6;
const JUMP_POWER = -11;

// --- STATE GAME GLOBAL ---
let player;
let platforms = [];
let obstacles = [];
let checkpoints = [];
let enemies = [];
let particles = [];
let impactParticles = []; 
let finishZone;

let camera = { x: 0, y: 0 };
let respawnPoint = { x: 50, y: 100 };

let deathCount = 0;
let currentLevel = 1;
let score = 0; 
const MAX_LEVEL = 5;

// Variabel Kontrol Flow
let gameState = 'MENU'; // MENU, PLAYING, END
let hackerName = "Player";
let playerColor = '#2dd4bf'; // Default Cyan
const colorPalette = ['#2dd4bf', '#ef4444', '#eab308', '#a78bfa', '#f97316', '#3b82f6'];
let colorIndex = 0;

// --- SISTEM AUDIO ---
const bgMusic = document.getElementById('bgMusic');
const btnMusic = document.getElementById('btn-music');

// UBAH: Setel ke true agar musik default ON
let isMusicPlaying = true; 
bgMusic.volume = 0.2; 

// UBAH: Atur tampilan tombol awal agar langsung hijau/cyan (ON)
btnMusic.innerText = "🎵 MUSIC: ON";
btnMusic.style.borderColor = "#2dd4bf";
btnMusic.style.color = "#2dd4bf";

btnMusic.addEventListener('click', function() {
    if (isMusicPlaying) {
        bgMusic.pause(); 
        this.innerText = "🎵 MUSIC: OFF";
        this.style.borderColor = "#6b7280"; 
        this.style.color = "#6b7280";
    } else {
        bgMusic.play(); 
        this.innerText = "🎵 MUSIC: ON";
        this.style.borderColor = "#2dd4bf"; 
        this.style.color = "#2dd4bf";
    }
    isMusicPlaying = !isMusicPlaying; 
    this.blur(); 
});

let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (isMusicPlaying && bgMusic.paused) bgMusic.play(); 
}

function playSFX(type) {
    if (!audioCtx || gameState !== 'PLAYING') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'jump') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'stomp') {
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'die_fall' || type === 'die_lava' || type === 'die_enemy') { 
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'levelComplete') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
    }
}

// --- LOGIKA MATA MENGIKUTI KURSOR DI MENU ---
document.addEventListener('mousemove', (e) => trackEyes(e.clientX, e.clientY));
document.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) trackEyes(e.touches[0].clientX, e.touches[0].clientY);
});

function trackEyes(mouseX, mouseY) {
    if (gameState !== 'MENU') return;
    
    const eyes = document.querySelectorAll('.mc-eye');
    eyes.forEach(eye => {
        const rect = eye.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        
        // Hitung sudut dari mata ke arah mouse
        const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
        
        // Batasi gerakan maksimal 6 pixel agar mata tidak keluar kotak
        const distance = Math.min(6, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) * 0.02);
        
        const px = Math.cos(angle) * distance;
        const py = Math.sin(angle) * distance;
        
        eye.style.transform = `translate(${px}px, ${py}px)`;
    });
}

// --- LOGIKA DOM / UI BUTTONS ---
// 1. Ganti Warna
document.getElementById('btn-change-color').addEventListener('click', () => {
    colorIndex = (colorIndex + 1) % colorPalette.length;
    playerColor = colorPalette[colorIndex];
    document.getElementById('color-preview').style.backgroundColor = playerColor;
    document.getElementById('color-preview').style.boxShadow = `0 0 15px ${playerColor}`;
    if(player) player.color = playerColor;
});

// 2. Main Game
document.getElementById('btn-start').addEventListener('click', () => {
    let nameInput = document.getElementById('player-name').value;
    hackerName = nameInput.trim() === "" ? "PLAYER" : nameInput.toUpperCase();
    
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('btn-ingame-menu').classList.remove('hidden'); 
    
    initAudio();
    score = 0; deathCount = 0; currentLevel = 1;
    loadLevel(currentLevel);
    gameState = 'PLAYING';
});

// 3. Tombol Kembali ke Menu (Saat Di Dalam Game)
document.getElementById('btn-ingame-menu').addEventListener('click', () => {
    gameState = 'MENU';
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('btn-ingame-menu').classList.add('hidden');
});

// 4. Tombol Keluar (Ke Index HTML Terluar)
document.getElementById('btn-exit-portal').addEventListener('click', () => {
    window.location.href = '../../index.html'; 
});

// 5. Tombol Pop Up Tamat
document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('end-popup').classList.add('hidden');
    document.getElementById('btn-ingame-menu').classList.remove('hidden');
    score = 0; deathCount = 0; currentLevel = 1;
    loadLevel(currentLevel);
    gameState = 'PLAYING';
});

document.getElementById('btn-to-menu').addEventListener('click', () => {
    document.getElementById('end-popup').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    gameState = 'MENU';
});

// --- STATE KONTROL ---
const keys = { right: false, left: false, up: false };

window.addEventListener('keydown', (e) => {
    if(gameState !== 'PLAYING') return;
    initAudio();
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') { keys.up = true; if (player) player.jump(); }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') keys.up = false;
});

function setupMobileControls() {
    const handleTouch = (btn, isPressing, isJump = false) => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            if(gameState !== 'PLAYING') return;
            initAudio();
            if (isJump) { keys.up = isPressing; if(player) player.jump(); }
            else if (btn.id === 'btn-left') keys.left = isPressing;
            else if (btn.id === 'btn-right') keys.right = isPressing;
        });
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (isJump) keys.up = !isPressing;
            else if (btn.id === 'btn-left') keys.left = !isPressing;
            else if (btn.id === 'btn-right') keys.right = !isPressing;
        });
    };
    handleTouch(document.getElementById('btn-left'), true); 
    handleTouch(document.getElementById('btn-right'), true); 
    handleTouch(document.getElementById('btn-jump'), true, true);
}
setupMobileControls();

// --- CLASS PARTIKEL ---
class Particle {
    constructor() {
        this.x = camera.x + Math.random() * canvas.width; this.y = camera.y + Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 4; this.vy = (Math.random() - 0.5) * 4;
        this.color = Math.random() > 0.5 ? '#2dd4bf' : '#8b5cf6';
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < camera.x) this.x = camera.x + canvas.width;
        if (this.x > camera.x + canvas.width) this.x = camera.x;
        if (this.y < camera.y) this.y = camera.y + canvas.height;
        if (this.y > camera.y + canvas.height) this.y = camera.y;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); ctx.restore();
    }
}

class ImpactParticle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 8; this.vy = Math.random() * -6 - 2;
        this.life = 1.0; this.color = color; this.size = Math.random() * 4 + 2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vy += GRAVITY * 0.5; this.life -= 0.05; }
    draw(ctx) {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.life); ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.restore();
    }
}

function spawnImpact(x, y, color, count) {
    for (let i = 0; i < count; i++) impactParticles.push(new ImpactParticle(x, y, color));
}

// --- CLASS PEMAIN ---
class Player {
    constructor(x, y) {
        this.width = 30; this.height = 30; this.visualW = 30; this.visualH = 30; 
        this.x = x; this.y = y; this.vx = 0; this.vy = 0;
        this.isGrounded = false; this.wasGrounded = false; 
        this.jumpCount = 0; this.maxJumps = 2; 
        this.color = playerColor; 
        this.animTimer = 0; 
    }

    jump() {
        if (this.isGrounded || this.jumpCount < this.maxJumps) {
            this.vy = JUMP_POWER; this.isGrounded = false; this.jumpCount++;
            playSFX('jump');
            this.visualW = this.width * 0.5; this.visualH = this.height * 1.5;
        }
    }

    draw() {
        ctx.save();
        let targetW = this.width; let targetH = this.height; let rotation = 0;

        if (!this.isGrounded) {
            let stretchY = 1 + Math.min(Math.abs(this.vy) * 0.08, 0.6); 
            let stretchX = 1 / stretchY; 
            targetW = this.width * stretchX; targetH = this.height * stretchY;
        } else if (Math.abs(this.vx) > 0.5) {
            targetH = this.height - Math.abs(Math.sin(this.animTimer * 0.5)) * 4; 
            rotation = this.vx > 0 ? 0.15 : -0.15; 
        } else {
            targetH = this.height + Math.sin(this.animTimer * 0.1) * 2;
        }

        this.visualW += (targetW - this.visualW) * 0.3; this.visualH += (targetH - this.visualH) * 0.3;

        let drawX = this.x + (this.width - this.visualW) / 2; let drawY = this.y + (this.height - this.visualH);
        
        // Transformasi untuk karakter
        ctx.translate(drawX + this.visualW / 2, drawY + this.visualH / 2);
        ctx.rotate(rotation);
        ctx.translate(-(drawX + this.visualW / 2), -(drawY + this.visualH / 2));

        // Gambar Badan
        ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.fillStyle = this.color;
        ctx.fillRect(drawX, drawY, this.visualW, this.visualH);
        
        // Gambar Mata
        ctx.fillStyle = '#050505';
        let lookDir = this.vx > 0 ? (this.visualW * 0.4) : (this.vx < 0 ? (this.visualW * 0.1) : (this.visualW * 0.25));
        ctx.fillRect(drawX + lookDir, drawY + 5 + (this.visualH - this.height)/2, 6, 6);
        ctx.fillRect(drawX + lookDir + 10, drawY + 5 + (this.visualH - this.height)/2, 6, 6);
        
        ctx.restore(); // Tutup rotasi/translasi agar Name Tag tidak ikut miring/gepeng

        // --- TAMBAHAN: GAMBAR NAME TAG DI ATAS KARAKTER ---
        ctx.save();
        ctx.fillStyle = this.color; // Warna teks mengikuti warna karakter
        ctx.font = "bold 12px 'Fira Code', monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 5; 
        ctx.shadowColor = this.color;
        // Posisikan tulisan tepat di tengah karakter dan sedikit di atasnya
        ctx.fillText(hackerName, this.x + (this.width / 2), this.y - 15);
        ctx.restore();
    }

    update() {
        this.animTimer++; let prevVy = this.vy; 

        if (keys.right) this.vx += 1; else if (keys.left) this.vx -= 1; else this.vx *= FRICTION;
        if (this.vx > MAX_SPEED) this.vx = MAX_SPEED; if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

        this.x += this.vx;
        platforms.forEach(p => {
            if (checkCollision(this, p)) {
                if (this.vx > 0) this.x = p.x - this.width; else if (this.vx < 0) this.x = p.x + p.width;
                this.vx = 0;
            }
        });

        this.vy += GRAVITY; this.y += this.vy; this.isGrounded = false;

        platforms.forEach(p => {
            if (checkCollision(this, p)) {
                if (this.vy > 0) { 
                    this.y = p.y - this.height; this.isGrounded = true; this.jumpCount = 0; 
                    if (!this.wasGrounded && prevVy > 4) {
                        spawnImpact(this.x + this.width / 2, this.y + this.height, '#8b5cf6', 8); 
                        this.visualH = this.height * 0.6; this.visualW = this.width * 1.5;
                    }
                    this.vy = 0;
                } else if (this.vy < 0) { 
                    this.y = p.y + p.height; this.vy = 0;
                }
            }
        });

        this.wasGrounded = this.isGrounded;

        obstacles.forEach(obs => { if (checkCollision(this, obs)) hitHazard('die_lava'); });
        checkpoints.forEach(cp => {
            if (!cp.active && checkCollision(this, cp)) {
                cp.active = true; respawnPoint = { x: cp.x + 10, y: cp.y - 40 }; playSFX('checkpoint');
            }
        });

        for (let i = enemies.length - 1; i >= 0; i--) {
            let enemy = enemies[i];
            if (checkCollision(this, enemy)) {
                let isStomping = this.vy > 0 && (this.y + this.height - this.vy) <= enemy.y + (enemy.height / 2);
                if (isStomping) {
                    this.vy = JUMP_POWER * 0.8; this.jumpCount = 1; 
                    spawnImpact(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ef4444', 20);
                    enemies.splice(i, 1); score += 10; playSFX('stomp');
                } else hitHazard('die_enemy');
            }
        }

        if (finishZone && checkCollision(this, finishZone)) nextLevel();
        if (this.y > camera.y + canvas.height + 150) hitHazard('die_fall');
    }
}

// --- KELAS DUNIA ---
class Platform {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
    draw() {
        ctx.fillStyle = '#050505'; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
class Obstacle {
    constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; }
    draw() { ctx.fillStyle = '#d946ef'; ctx.fillRect(this.x, this.y, this.width, this.height); }
}
class Checkpoint {
    constructor(x, y) { this.x = x; this.y = y; this.width = 40; this.height = 40; this.active = false; }
    draw() {
        ctx.strokeStyle = this.active ? '#22c55e' : '#6b7280'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x, this.y, this.width, this.height); ctx.setLineDash([]); 
        ctx.fillStyle = this.active ? '#22c55e' : '#6b7280'; ctx.font = "12px monospace"; ctx.fillText("SAVE", this.x + 5, this.y + 25);
    }
}
class EndPortalParticle {
    constructor(x, y, w, h) { this.portalX = x; this.portalY = y; this.portalW = w; this.portalH = h; this.reset(); this.y = y + Math.random() * h; }
    reset() {
        this.x = this.portalX + Math.random() * this.portalW; this.y = this.portalY + this.portalH;
        this.size = Math.random() * 4 + 1; this.speedY = -(Math.random() * 2 + 0.5);
        const colors = ['#ffffff', '#a78bfa', '#60a5fa', '#e879f9'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1.0; this.decay = Math.random() * 0.03 + 0.01;
    }
    update() { this.y += this.speedY; this.life -= this.decay; if (this.life <= 0 || this.y < this.portalY) this.reset(); }
    draw(ctx) { ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0; }
}
class FinishZone {
    constructor(x, y, w, h) { 
        this.x = x; this.y = y; this.width = w; this.height = h; this.particles = [];
        for(let i=0; i<40; i++) this.particles.push(new EndPortalParticle(x, y, w, h));
    }
    draw() {
        ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = '#60a5fa'; 
        ctx.fillStyle = '#020617'; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 4; ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0; ctx.beginPath(); ctx.rect(this.x, this.y, this.width, this.height); ctx.clip(); 
        this.particles.forEach(p => { p.update(); p.draw(ctx); });
        ctx.shadowBlur = 20; ctx.shadowColor = '#000000'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 15;
        ctx.strokeRect(this.x, this.y, this.width, this.height); ctx.restore();
        ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.font = "bold 18px monospace";
        ctx.fillText("ENTER", this.x + this.width/2 - 25, this.y - 15); ctx.shadowBlur = 0;
    }
}
class Enemy {
    constructor(x, y, distance) { this.startX = x; this.x = x; this.y = y; this.width = 30; this.height = 30; this.speed = 2; this.distance = distance; }
    update() { this.x += this.speed; if (this.x > this.startX + this.distance || this.x < this.startX) this.speed *= -1; }
    draw() {
        ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#050505'; ctx.fillRect(this.x + 5, this.y + 5, 8, 4); ctx.fillRect(this.x + 17, this.y + 5, 8, 4); ctx.shadowBlur = 0;
    }
}

// --- FUNGSI SISTEM UTAMA ---
function checkCollision(r1, r2) {
    return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
}

function hitHazard(reason = 'die_fall') { deathCount++; playSFX(reason); spawnPlayer(); }

function spawnPlayer() {
    player = new Player(respawnPoint.x, respawnPoint.y);
    camera.x = player.x - canvas.width / 2; camera.y = player.y - canvas.height / 2;
}

function nextLevel() {
    playSFX('levelComplete');
    if (currentLevel < MAX_LEVEL) {
        currentLevel++; loadLevel(currentLevel);
    } else {
        // MUNCULKAN POPUP TAMAT
        gameState = 'END';
        document.getElementById('btn-ingame-menu').classList.add('hidden');
        document.getElementById('final-stats').innerHTML = `Name: <b style="color:#2dd4bf">${hackerName}</b><br>Score: ${score} | Deaths: ${deathCount}`;
        document.getElementById('end-popup').classList.remove('hidden');
    }
}

function loadLevel(levelNumber) {
    platforms = []; obstacles = []; checkpoints = []; enemies = []; finishZone = null; impactParticles = []; 
    particles = []; for(let i=0; i<150; i++) particles.push(new Particle());

    if (typeof window[`buildLevel${levelNumber}`] === 'function') {
        window[`buildLevel${levelNumber}`]();
    } else {
        console.error("Level Data " + levelNumber + " Error!");
    }
    spawnPlayer();
}

// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => { p.update(); p.draw(); });

    if (gameState === 'PLAYING') {
        camera.x += ((player.x + player.width / 2 - canvas.width / 2) - camera.x) * 0.1;
        camera.y += ((player.y + player.height / 2 - canvas.height / 1.5) - camera.y) * 0.1;

        player.update();
        enemies.forEach(e => { e.update(); });
        for (let i = impactParticles.length - 1; i >= 0; i--) {
            let ip = impactParticles[i]; ip.update();
            if (ip.life <= 0) impactParticles.splice(i, 1);
        }
    }

    if (gameState === 'PLAYING' || gameState === 'END') {
        ctx.save(); ctx.translate(-camera.x, -camera.y); 
        platforms.forEach(p => p.draw()); obstacles.forEach(o => o.draw()); checkpoints.forEach(cp => cp.draw());
        enemies.forEach(e => { e.draw(); });
        for (let i = impactParticles.length - 1; i >= 0; i--) { impactParticles[i].draw(ctx); }
        if(finishZone) finishZone.draw();
        player.draw(); ctx.restore();

        // GAMBAR UI KOTAK SKOR KIRI ATAS
        ctx.fillStyle = 'rgba(5, 5, 5, 0.8)'; ctx.fillRect(10, 10, 200, 100);
        ctx.strokeStyle = '#2dd4bf'; ctx.strokeRect(10, 10, 200, 100);
        ctx.fillStyle = '#2dd4bf'; ctx.font = "14px 'Fira Code', monospace";
        ctx.fillText(`LEVEL  : ${currentLevel}/${MAX_LEVEL}`, 20, 35);
        ctx.fillStyle = deathCount > 0 ? '#ef4444' : '#2dd4bf'; ctx.fillText(`DEATHS : ${deathCount}`, 20, 55);
        ctx.fillStyle = '#eab308'; ctx.fillText(`SCORE  : ${score}`, 20, 75);
        ctx.fillStyle = '#8b5cf6'; ctx.fillText(`ID     : ${hackerName}`, 20, 95);
    }
}

// Mulai
window.onload = () => {
    loadLevel(1); 
    gameState = 'MENU';
    animate();
};