const canvas = document.getElementById('particle-bg');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const particles = [];
const numParticles = 80;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.initProperties();
        
        const angle = Math.random() * Math.PI * 2;
        this.speedX = Math.cos(angle) * this.speedMultiplier;
        this.speedY = Math.sin(angle) * this.speedMultiplier;
    }

    initProperties() {
        this.size = Math.random() * 2 + 0.5;
        let baseSpeed = Math.random() * 1.5 + 0.1;
        this.speedMultiplier = baseSpeed * (this.size * 0.5);
        this.alpha = Math.random() * 0.5 + 0.1;
    }

    reset() {
        this.initProperties();
        const edge = Math.floor(Math.random() * 4);

        if (edge === 0) { 
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.speedX = (Math.random() - 0.5) * 2 * this.speedMultiplier; 
            this.speedY = Math.random() * this.speedMultiplier + 0.1;       
        } else if (edge === 1) { 
            this.x = canvas.width + 10;
            this.y = Math.random() * canvas.height;
            this.speedX = -(Math.random() * this.speedMultiplier + 0.1);    
            this.speedY = (Math.random() - 0.5) * 2 * this.speedMultiplier; 
        } else if (edge === 2) { 
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.speedX = (Math.random() - 0.5) * 2 * this.speedMultiplier; 
            this.speedY = -(Math.random() * this.speedMultiplier + 0.1);    
        } else { 
            this.x = -10;
            this.y = Math.random() * canvas.height;
            this.speedX = Math.random() * this.speedMultiplier + 0.1;       
            this.speedY = (Math.random() - 0.5) * 2 * this.speedMultiplier; 
        }
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -20 || this.x > canvas.width + 20 || 
            this.y < -20 || this.y > canvas.height + 20) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(200, 200, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
}

// ==========================================
// 1. SISTEM LOADING SCREEN TERMINAL
// ==========================================
const gameCards = document.querySelectorAll('.game-card');
const loadingScreen = document.getElementById('loading-screen');
const mainLayout = document.querySelector('.main-layout');
const loadGameTitle = document.getElementById('load-game-title');
const loaderBar = document.getElementById('loader-bar');
const loaderPercentage = document.getElementById('loader-percentage');

// Membuat fungsi Master untuk Loading agar bisa dipakai berkali-kali
function runTerminalLoader(loadingText, onCompleteCallback) {
    // Sembunyikan konten utama & munculkan layar loading
    mainLayout.style.display = 'none';
    loadingScreen.classList.remove('hidden');
    loadGameTitle.innerText = loadingText;

    let progress = 0;
    loaderBar.style.width = '0%';
    loaderPercentage.innerText = '0%';

    // Kecepatan loading (diatur sedikit lebih cepat agar pengunjung tidak bosan)
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 20) + 5; 

        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Jeda sejenak di angka 100% lalu jalankan perintah selanjutnya
            setTimeout(() => {
                onCompleteCallback();
            }, 300); 
        }

        loaderBar.style.width = progress + '%';
        loaderPercentage.innerText = progress + '%';

    }, 80); 
}

// SKENARIO A: Saat Game Diklik (Pergi dari Halaman Utama)
gameCards.forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault(); 
        const targetUrl = this.getAttribute('href');
        const gameTitle = this.querySelector('.game-title').innerText;

        runTerminalLoader("booting " + gameTitle, () => {
            window.location.href = targetUrl;
        });
    });
});

// SKENARIO B: Saat Web Baru Dibuka ATAU Kembali dari Game (Tombol Back)
window.addEventListener('pageshow', function(e) {
    // Menjalankan loading koneksi saat halaman utama dimuat
    runTerminalLoader("establishing connection to portal ...", () => {
        // Setelah loading selesai, sembunyikan layar loading dan buka UI web
        loadingScreen.classList.add('hidden');
        mainLayout.style.display = 'flex';
    });
});

// ==========================================
// 2. SISTEM ANIMASI PARTIKEL (LOOP 60FPS)
// ==========================================
function animate() {
    ctx.fillStyle = '#050505'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}
animate();