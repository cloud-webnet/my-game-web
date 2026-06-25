window.buildLevel3 = function() {
    respawnPoint = { x: 50, y: 800 };
    platforms.push(new Platform(0, 900, 300, 100));
    platforms.push(new Platform(400, 750, 100, 20));
    platforms.push(new Platform(200, 600, 100, 20));
    platforms.push(new Platform(400, 450, 100, 20));
    checkpoints.push(new Checkpoint(430, 410)); 
    platforms.push(new Platform(150, 300, 100, 20));
    enemies.push(new Enemy(150, 270, 50));
    platforms.push(new Platform(400, 150, 300, 20));
    finishZone = new FinishZone(550, 0, 80, 150);
};