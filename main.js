import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Projectile } from './projectile.js';

class Game {
    #canvas;
    #ctx;
    #lastTime;
    #deltaTime;
    #enemies;
    #path;
    #playerHealth;
    #playerMoney;
    #towers;
    #mouseX = 0;
    #mouseY = 0;
    #projectiles;
    #playerScore;
    #victoryScore; // <-- CORREÇÃO: Propriedade declarada
    #waves;
    #currentWaveIndex;
    #enemiesToSpawn;
    #spawnTimer;
    #spawnInterval;
    #feedbackMessage = '';
    #messageTimer = 0;
    #gameState = 'playing';

    constructor() {
        this.#canvas = document.getElementById('game-canvas');
        this.#ctx = this.#canvas.getContext('2d');
        this.#canvas.width = 1280;
        this.#canvas.height = 720;

        this.#lastTime = 0;
        this.#deltaTime = 0;
        this.#playerHealth = 3;
        this.#playerMoney = 100;
        this.#playerScore = 0;
        this.#victoryScore = 1050; // Agora este valor será usado na condição de vitória

        this.#enemies = [];
        this.#towers = [];
        this.#projectiles = [];
        
        this.#addEventListeners();

        this.#path = [
            { x: 0, y: 360 }, { x: 300, y: 360 }, { x: 300, y: 150 },
            { x: 800, y: 150 }, { x: 800, y: 550 }, { x: 400, y: 550 },
            { x: 400, y: 300 }, { x: 1000, y: 300 }, { x: 1000, y: 100 },
        ];

        // --- GAME BALANCE: Ondas mais difíceis ---
        this.#waves = [
            { count: 15, interval: 900 }, 
            { count: 25, interval: 700 },
            { count: 30, interval: 450 } 
        ];
        this.#currentWaveIndex = 0;
        this.#loadWave();

        console.log('Tower Defense (vanilla JS) - Fase 1 (Modo Picante) Iniciada!');
        this.#animate(0);
    }

    #loadWave() {
        if (this.#currentWaveIndex < this.#waves.length) {
            const currentWave = this.#waves[this.#currentWaveIndex];
            this.#enemiesToSpawn = currentWave.count;
            this.#spawnInterval = currentWave.interval;
            this.#spawnTimer = this.#spawnInterval;
        } else {
            this.#enemiesToSpawn = 0;
        }
    }

    #addEventListeners() {
        this.#canvas.addEventListener('click', (event) => {
            if (this.#gameState === 'playing') {
                this.#placeTower(event.offsetX, event.offsetY);
            } else if (this.#gameState === 'defeat') {
                window.location.reload();
            }
        });
        this.#canvas.addEventListener('mousemove', (event) => {
            this.#mouseX = event.offsetX;
            this.#mouseY = event.offsetY;
        });
    }

    #placeTower(x, y) {
        const towerCost = 50;
        if (this.#playerMoney >= towerCost) {
            this.#playerMoney -= towerCost;    
            this.#towers.push(new Tower(x, y));    
        } else {
            this.#feedbackMessage = 'Fundos insuficientes!';
            this.#messageTimer = 2000;
        }
    }

    #handleEnemySpawning(deltaTime) {
        if (this.#enemiesToSpawn === 0 && this.#enemies.length === 0 && this.#currentWaveIndex < this.#waves.length) {
            this.#currentWaveIndex++;
            this.#loadWave();
        }

        this.#spawnTimer -= deltaTime;
        if (this.#spawnTimer <= 0 && this.#enemiesToSpawn > 0) {
            this.#enemies.push(new Enemy(this.#path));
            this.#enemiesToSpawn--;
            this.#spawnTimer = this.#spawnInterval;
        }
    }

    #drawUI() {
        this.#ctx.fillStyle = 'white';
        this.#ctx.font = '32px "Segoe UI", sans-serif';
        this.#ctx.textAlign = 'center';
        this.#ctx.fillText('Riegos.dev - Tower Defense', this.#canvas.width / 2, 40);
        this.#ctx.textAlign = 'left';

        this.#ctx.fillStyle = 'gold';
        this.#ctx.font = '24px Arial';
        this.#ctx.fillText(`$$: ${this.#playerMoney}`, 20, 80);

        this.#ctx.fillStyle = 'lightgreen';
        this.#ctx.fillText(`Life: ${this.#playerHealth}`, this.#canvas.width - 150, 80);

        this.#ctx.fillStyle = 'cyan';
        this.#ctx.fillText(`Score: ${this.#playerScore}`, this.#canvas.width / 2 - 70, 80);

        if (this.#messageTimer > 0) {
            this.#ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
            this.#ctx.font = '28px Arial';
            this.#ctx.textAlign = 'center';
            this.#ctx.fillText(this.#feedbackMessage, this.#canvas.width / 2, this.#canvas.height / 2);
            this.#ctx.textAlign = 'left';
        }
    }

    #drawMap() {
        this.#ctx.strokeStyle = '#555';
        this.#ctx.lineWidth = 20;
        this.#ctx.beginPath();
        this.#ctx.moveTo(this.#path[0].x, this.#path[0].y);
        for (let i = 1; i < this.#path.length; i++) {
            this.#ctx.lineTo(this.#path[i].x, this.#path[i].y);
        }
        this.#ctx.stroke();
    }

    #drawBase() {
        const lastPoint = this.#path[this.#path.length - 1];
        this.#ctx.fillStyle = '#63b3ed';
        this.#ctx.fillRect(lastPoint.x - 25, lastPoint.y - 25, 50, 50);
    }
    
    #drawPlacementPreview() {
        const towerCost = 50;
        if (this.#playerMoney < towerCost) {
            this.#ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        } else {
            this.#ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        }
        this.#ctx.beginPath();
        this.#ctx.arc(this.#mouseX, this.#mouseY, 20, 0, Math.PI * 2);
        this.#ctx.fill();
        this.#ctx.beginPath();
        this.#ctx.arc(this.#mouseX, this.#mouseY, 150, 0, Math.PI * 2);
        this.#ctx.stroke();
    }

    #drawEndScreen() {
        if (this.#gameState === 'playing') return;

        this.#ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        this.#ctx.textAlign = 'center';
        this.#ctx.fillStyle = 'white';

        if (this.#gameState === 'victory') {
            this.#ctx.font = '60px Arial';
            this.#ctx.fillText('Parabéns!', this.#canvas.width / 2, this.#canvas.height / 2 - 40);
            this.#ctx.font = '30px Arial';
            this.#ctx.fillText('Você venceu o Nível 1!', this.#canvas.width / 2, this.#canvas.height / 2 + 20);
            this.#ctx.font = '20px Arial';
            this.#ctx.fillText('Aguarde para mais novidades do nosso game!', this.#canvas.width / 2, this.#canvas.height / 2 + 60);
        } else if (this.#gameState === 'defeat') {
            this.#ctx.font = '60px Arial';
            this.#ctx.fillText('Que pena!', this.#canvas.width / 2, this.#canvas.height / 2 - 40);
            this.#ctx.font = '30px Arial';
            this.#ctx.fillText('Você perdeu!', this.#canvas.width / 2, this.#canvas.height / 2 + 20);
            this.#ctx.font = '24px Arial';
            this.#ctx.fillText('Clique para reiniciar', this.#canvas.width / 2, this.#canvas.height / 2 + 70);
        }
        this.#ctx.textAlign = 'left';
    }

    #animate(timeStamp) {
        this.#deltaTime = timeStamp - this.#lastTime;
        this.#lastTime = timeStamp;

        if (this.#messageTimer > 0) this.#messageTimer -= this.#deltaTime;

        if (this.#gameState === 'playing') {
            this.#handleEnemySpawning(this.#deltaTime);

            this.#towers.forEach(tower => {
                const projectile = tower.update(this.#deltaTime, this.#enemies);
                if (projectile) this.#projectiles.push(projectile);
            });

            this.#projectiles.forEach(projectile => projectile.update(this.#deltaTime));
            this.#enemies.forEach(enemy => enemy.update(this.#deltaTime));

            const defeatedEnemies = this.#enemies.filter(e => e.isDefeated);
            defeatedEnemies.forEach(enemy => {
                this.#playerMoney += enemy.moneyValue;
                this.#playerScore += enemy.scoreValue;
            });

            const enemiesReachedEnd = this.#enemies.filter(e => e.hasReachedEnd);
            if (enemiesReachedEnd.length > 0) {
                this.#playerHealth -= enemiesReachedEnd.length;
            }

            this.#enemies = this.#enemies.filter(e => !e.isDefeated && !e.hasReachedEnd);
            this.#projectiles = this.#projectiles.filter(p => !p.hasHitTarget);

            if (this.#playerHealth <= 0) this.#gameState = 'defeat';
            
            // --- LÓGICA DE VITÓRIA CORRIGIDA ---
            // Checa se o score alvo foi atingido E não há mais inimigos na tela ou para nascer
            if (this.#playerScore >= this.#victoryScore && this.#enemies.length === 0 && this.#enemiesToSpawn === 0) {
                this.#gameState = 'victory';
            }
        }
        
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#drawMap();
        this.#drawBase();
        this.#towers.forEach(tower => tower.draw(this.#ctx));
        this.#projectiles.forEach(projectile => projectile.draw(this.#ctx));
        this.#enemies.forEach(enemy => enemy.draw(this.#ctx));
        this.#drawUI();
        if (this.#gameState === 'playing') this.#drawPlacementPreview();
        this.#drawEndScreen();

        requestAnimationFrame(this.#animate.bind(this));
    }
}

window.onload = () => { new Game(); };