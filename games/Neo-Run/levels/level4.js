window.buildLevel4 = function() {
    respawnPoint = { x: 50, y: 300 };
    
    // Lantai dasar (aman)
    platforms.push(new Platform(0, 400, 200, 100));
    
    // Rintangan Lava raksasa di bawah (Jangan sampai jatuh!)
    obstacles.push(new Obstacle(200, 500, 1400, 50));

    // Parkour naik (Double Jump Test)
    platforms.push(new Platform(320, 300, 80, 20)); // Pijakan 1
    platforms.push(new Platform(500, 200, 80, 20)); // Pijakan 2
    platforms.push(new Platform(700, 100, 100, 20)); // Pijakan 3 (Tertinggi)
    
    checkpoints.push(new Checkpoint(730, 60));

    // Terjun bebas ke platform bawah
    platforms.push(new Platform(950, 350, 200, 100));
    enemies.push(new Enemy(1000, 320, 100)); // Hati-hati ada musuh

    // Naik lagi menuju portal Finish
    platforms.push(new Platform(1250, 250, 60, 20));
    platforms.push(new Platform(1400, 150, 60, 20)); 
    
    finishZone = new FinishZone(1550, 50, 80, 150);
};