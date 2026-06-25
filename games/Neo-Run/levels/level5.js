window.buildLevel5 = function() {
    respawnPoint = { x: 50, y: 300 };
    platforms.push(new Platform(0, 400, 200, 100));
    enemies.push(new Enemy(100, 370, 50));
    
    obstacles.push(new Obstacle(200, 500, 1800, 100)); // Lautan lava raksasa
    
    platforms.push(new Platform(300, 300, 50, 20));
    platforms.push(new Platform(450, 200, 50, 20));
    platforms.push(new Platform(600, 300, 50, 20));
    
    platforms.push(new Platform(800, 350, 100, 20)); // Safe house kecil
    checkpoints.push(new Checkpoint(830, 310));
    
    platforms.push(new Platform(1000, 200, 50, 20));
    platforms.push(new Platform(1200, 350, 50, 20));
    platforms.push(new Platform(1400, 150, 50, 20));
    
    platforms.push(new Platform(1600, 400, 300, 100));
    enemies.push(new Enemy(1650, 370, 150));
    
    finishZone = new FinishZone(1800, 250, 80, 150);
};