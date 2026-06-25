// ==========================================
// 1. SISTEM PERINGATAN SEBELUM REFRESH/KELUAR
// ==========================================
function showWarningPopup(e) {
    // Tandai di memori browser bahwa user sedang proses reload/menutup tab
    sessionStorage.setItem('is_reloading', 'true');
    e.preventDefault();
    e.returnValue = ''; 
}
// Pasang alarm peringatan
window.addEventListener('beforeunload', showWarningPopup);

// ==========================================
// 2. SISTEM DETEKSI REFRESH (LEMPAR KE PORTAL)
// ==========================================
const navEntries = performance.getEntriesByType("navigation");
const isReloadViaNav = navEntries.length > 0 && navEntries[0].type === "reload";
const isReloadViaStorage = sessionStorage.getItem('is_reloading') === 'true';

if (isReloadViaNav || isReloadViaStorage) {
    // Bersihkan memori agar tidak nyangkut
    sessionStorage.removeItem('is_reloading'); 
    
    // Deteksi cerdas: Apakah ini di komputer lokal (file://) ATAU Live Server VS Code (127.0.0.1)
    const isLocalFile = window.location.protocol === "file:";
    const isLiveServer = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    
    // Jika lokal/Live Server, mundur 2 folder. Jika di Cloudflare, pergi ke root (/)
    if (isLocalFile || isLiveServer) {
        window.location.replace("../../index.html"); 
    } else {
        window.location.replace("/"); 
    }
}

// ==========================================
// 3. SISTEM EXIT / DISCONNECT SCREEN
// ==========================================
const btnExit = document.getElementById('btn-exit-portal');
const exitScreen = document.getElementById('exit-screen');
const exitText1 = document.getElementById('exit-text-1');
const exitText2 = document.getElementById('exit-text-2');
const exitBarContainer = document.getElementById('exit-bar-container');
const exitBar = document.getElementById('exit-bar');

if (btnExit) {
    btnExit.addEventListener('click', function(e) {
        e.preventDefault(); 
        
        // MATIKAN alarm peringatan browser agar tidak merusak animasi terminal
        window.removeEventListener('beforeunload', showWarningPopup);
        sessionStorage.removeItem('is_reloading');
        
        // Munculkan layar hitam
        exitScreen.classList.remove('hidden');
        
        // Jalankan animasi teks putus koneksi
        setTimeout(() => { exitText1.innerText = "> CLOSING LOCAL INSTANCE ..."; }, 200);
        setTimeout(() => { 
            exitText2.innerText = "> DISCONNECTING FROM SERVER ... [OK]"; 
            exitBarContainer.style.display = 'block';
            setTimeout(() => { exitBar.style.width = '100%'; }, 50);
        }, 800);
        
        // Setelah 1.6 detik, arahkan kembali ke portal utama dengan deteksi cerdas yang sama
        setTimeout(() => {
            const isLocalFile = window.location.protocol === "file:";
            const isLiveServer = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
            
            if (isLocalFile || isLiveServer) {
                window.location.href = "../../index.html";
            } else {
                window.location.href = "/";
            }
        }, 1600);
    });
}