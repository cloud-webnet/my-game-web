window.buildLevel1 = function() {
    respawnPoint = { x: 50, y: 300 };
    platforms.push(new Platform(0, 400, 600, 100));
    obstacles.push(new Obstacle(300, 380, 100, 20));
    platforms.push(new Platform(700, 300, 200, 20));
    enemies.push(new Enemy(720, 270, 150));
    platforms.push(new Platform(1000, 400, 300, 100));
    finishZone = new FinishZone(1150, 250, 80, 150);
};