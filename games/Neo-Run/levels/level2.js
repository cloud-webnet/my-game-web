window.buildLevel2 = function() {
    respawnPoint = { x: 50, y: 300 };
    platforms.push(new Platform(0, 400, 200, 100));
    obstacles.push(new Obstacle(200, 450, 800, 50)); 
    platforms.push(new Platform(300, 350, 80, 20)); 
    platforms.push(new Platform(550, 250, 80, 20)); 
    platforms.push(new Platform(800, 350, 80, 20)); 
    platforms.push(new Platform(1000, 400, 400, 100));
    enemies.push(new Enemy(1100, 370, 200));
    finishZone = new FinishZone(1250, 250, 80, 150);
};