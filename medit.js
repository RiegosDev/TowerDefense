import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Projectile } from './projectile.js';

class Game {
    // --- PROPRIEDADES ---
    #canvas; #ctx; #lastTime; #deltaTime; #gameState = 'idle';
    #playerHealth; #playerMoney; #playerScore; #victoryScore; #gameStartTime;
    #enemies; #towers; #projectiles; #path;
    #waves; #currentWaveIndex; #enemiesToSpawn; #spawnTimer; #spawnInterval;
    #moneyDisplayElement; #scoreDisplayElement; #lifeDisplayElement; #victoryScoreDisplayElement; #startButtonElement;
    #statusTimerElement; #statusMoneyRewardElement; #statusTowerCountElement; #statusTowerCostElement; #statusScoreRewardElement; #statusWaveElement;
    #feedbackMessage = ''; #messageTimer = 0; #mouseX = 0; #mouseY = 0;
    #enemyImages = []; #baseImage; #towerImage; #projectileImage; #backgroundImages = {}; #assetsLoaded = false;
    #bgMusicElement; #levelConfigs; #currentLevel;
    #winBgImage; 
    #victorySfxElement; 

    get victoryScore() { return this.#victoryScore; }

    constructor() {
        this.#canvas = document.getElementById('game-canvas');
        this.#ctx = this.#canvas.getContext('2d');
        this.#moneyDisplayElement = document.getElementById('money-display');
        this.#scoreDisplayElement = document.getElementById('score-display');
        this.#lifeDisplayElement = document.getElementById('life-display');
        this.#victoryScoreDisplayElement = document.getElementById('victory-score-display');
        this.#startButtonElement = document.getElementById('start-game-button');
        this.#bgMusicElement = document.getElementById('bg-music');
        this.#victorySfxElement = document.getElementById('victory-sfx'); 
        this.#statusTimerElement = document.getElementById('status-timer');
        this.#statusMoneyRewardElement = document.getElementById('status-money-reward');
        this.#statusTowerCountElement = document.getElementById('status-tower-count');
        this.#statusTowerCostElement = document.getElementById('status-tower-cost');
        this.#statusScoreRewardElement = document.getElementById('status-score-reward');
        this.#statusWaveElement = document.getElementById('status-act-wave');

        this.#canvas.width = 1280; this.#canvas.height = 720;
        
        this.#levelConfigs = [
            { level: 1, victoryScore: 5100, pathTurns: 7, pathMargin: 100, waves: [ { count: 25, interval: 2300 }, { count: 40, interval: 1000 }, { count: 60, interval: 600 }, { count: 150, interval: 400 }, { count: 350, interval: 150 } ], bgImageName: 'bg1.png' },
            { level: 2, victoryScore: 7500, pathTurns: 9, pathMargin: 80, waves: [ { count: 40, interval: 2350 }, { count: 60, interval: 900 }, { count: 80, interval: 600 }, { count: 200, interval: 350 }, { count: 350, interval: 200}, { count: 450, interval: 100} ], bgImageName: 'bg2.png' },
            { level: 3, victoryScore: 10000, pathTurns: 12, pathMargin: 70, waves: [ { count: 50, interval: 2200 }, { count: 80, interval: 900 }, { count: 120, interval: 500 }, { count: 300, interval: 310 }, { count: 300, interval: 80 }, { count: 400, interval: 100 }, { count: 600, interval: 70 } ], bgImageName: 'bg3.png' }
        ];
        
        this.#addEventListeners();
        this.#loadAssets();
    }
    
    #loadAssets() {
        this.#startButtonElement.textContent = 'Carregando...'; this.#startButtonElement.disabled = true;
        const assetUrls = [ './img/monstro1.png', './img/monstro2.png', './img/monstro3.png', './img/monstro4.png', './img/monstro5.png', './img/casa.png', './img/torre.png', './img/flecha.png', './img/bg1.png', './img/bg2.png', './img/bg3.png', './img/bgwin.png' ];
        const promises = assetUrls.map(url => new Promise((resolve, reject) => { const img = new Image(); img.src = url; img.onload = () => resolve({img, name: url.split('/').pop()}); img.onerror = () => reject(`Erro ao carregar ${url}`); }));
        
        Promise.all(promises).then(assets => {
            this.#enemyImages = assets.slice(0, 5).map(a => a.img);
            this.#baseImage = assets[5].img; this.#towerImage = assets[6].img; this.#projectileImage = assets[7].img;
            this.#backgroundImages['bg1.png'] = assets[8].img; this.#backgroundImages['bg2.png'] = assets[9].img; this.#backgroundImages['bg3.png'] = assets[10].img;
            this.#winBgImage = assets[11].img;
            this.#assetsLoaded = true;
            this.#startButtonElement.textContent = 'Iniciar Jogo'; this.#startButtonElement.disabled = false;
            console.log('Assets carregados com sucesso!');
            this.#currentLevel = 1;
            this.#setupLevel(this.#currentLevel);
            this.#animate(0); 
        }).catch(error => { console.error(error); this.#startButtonElement.textContent = 'Erro ao Carregar'; });
    }

    #setupLevel(levelNumber) {
        const config = this.#levelConfigs[levelNumber - 1];
        if (!config) { console.error("Configuração de nível não encontrada!"); return; }
        this.#playerHealth = 10; this.#playerMoney = 100 + ((levelNumber - 1) * 50);
        this.#playerScore = 0; this.#victoryScore = config.victoryScore;
        this.#enemies = []; this.#towers = []; this.#projectiles = [];
        this.#path = this.#generateRandomPath(config.pathTurns, config.pathMargin);
        this.#waves = config.waves; this.#currentWaveIndex = 0;
        this.#loadWave();
        this.#victoryScoreDisplayElement.textContent = `Meta: ${this.victoryScore}`;
        this.#updateStatusPanel(); this.#drawUI();
    }
    
    #startGame() { if (this.#gameState !== 'idle') { this.#feedbackMessage = 'Waves já iniciadas!'; this.#messageTimer = 2000; return; } if (!this.#assetsLoaded) { this.#feedbackMessage = 'Aguarde o carregamento!'; this.#messageTimer = 2000; return; } this.#gameState = 'playing'; this.#bgMusicElement.currentTime = 0; this.#bgMusicElement.play(); this.#gameStartTime = performance.now(); setTimeout(() => { this.#lastTime = performance.now(); }, 1500); }
    
    #goToNextLevel() { if (this.#currentLevel < this.#levelConfigs.length) { this.#currentLevel++; this.#setupLevel(this.#currentLevel); this.#gameState = 'idle'; } else { console.log("Todos os níveis concluídos!"); } }
    
    // MODIFICADO: Adicionado 'async' para a função e 'try...catch' para o som
    async #animate(timeStamp) {
        if (!this.#lastTime) { this.#lastTime = timeStamp; requestAnimationFrame(this.#animate.bind(this)); return; }
        this.#deltaTime = timeStamp - this.#lastTime;
        this.#lastTime = timeStamp;

        if (this.#messageTimer > 0) this.#messageTimer -= this.#deltaTime;
        this.#updateStatusPanel();

        if (this.#gameState === 'playing') {
            this.#handleEnemySpawning(this.#deltaTime);
            this.#towers.forEach(t => { const p = t.update(this.#deltaTime, this.#enemies); if (p) this.#projectiles.push(p); });
            this.#projectiles.forEach(p => p.update(this.#deltaTime));
            this.#enemies.forEach(e => e.update(this.#deltaTime));
            const defeated = this.#enemies.filter(e => e.isDefeated);
            defeated.forEach(e => { let moneyReward = e.moneyValue; if (this.#towers.length >= 70) { moneyReward = 3; } else if (this.#towers.length >= 50) { moneyReward = 5; } else if (this.#towers.length >= 30) { moneyReward = 7; } else if (this.#towers.length >= 20) { moneyReward = 8; } this.#playerMoney += moneyReward; const baseScore = e.scoreValue; const scoreReduction = Math.floor(this.#playerScore / 500); const scoreReward = Math.max(5, baseScore - scoreReduction); this.#playerScore += scoreReward; });
            const reachedEnd = this.#enemies.filter(e => e.hasReachedEnd);
            if (reachedEnd.length > 0) { this.#playerHealth -= reachedEnd.length; }
            this.#enemies = this.#enemies.filter(e => !e.isDefeated && !e.hasReachedEnd);
            this.#projectiles = this.#projectiles.filter(p => !p.hasHitTarget);
            if (this.#playerHealth <= 0) { this.#gameState = 'defeat'; this.#fadeOutMusic(); }
            
            // MODIFICADO: Condição de vitória agora usa try...catch
            if (this.#playerScore >= this.#victoryScore && this.#enemies.length === 0 && this.#enemiesToSpawn === 0) {
                this.#gameState = 'victory';
                this.#fadeOutMusic();
                if (this.#victorySfxElement) {
                    try {
                        this.#victorySfxElement.currentTime = 0;
                        await this.#victorySfxElement.play();
                    } catch (err) {
                        console.error("Erro ao tocar o som de vitória (provavelmente bloqueado pelo navegador):", err);
                    }
                }
            }
        }
        
        this.#drawScene();
        requestAnimationFrame(this.#animate.bind(this));
    }
    
    // --- MÉTODOS PRIVADOS ---
    #addEventListeners() { this.#startButtonElement.addEventListener('click', () => this.#startGame()); this.#canvas.addEventListener('click', (event) => { const rect = this.#canvas.getBoundingClientRect(); const scaleX = this.#canvas.width / rect.width; const scaleY = this.#canvas.height / rect.height; const gameX = (event.clientX - rect.left) * scaleX; const gameY = (event.clientY - rect.top) * scaleY; if (this.#gameState === 'playing') { this.#placeTower(gameX, gameY); } else if (this.#gameState === 'defeat') { window.location.reload(); } else if (this.#gameState === 'victory') { this.#goToNextLevel(); } }); this.#canvas.addEventListener('mousemove', (event) => { const rect = this.#canvas.getBoundingClientRect(); const scaleX = this.#canvas.width / rect.width; const scaleY = this.#canvas.height / rect.height; this.#mouseX = (event.clientX - rect.left) * scaleX; this.#mouseY = (event.clientY - rect.top) * scaleY; }); }
    
    #updateStatusPanel() {
        if (this.#gameState === 'playing') {
            const elapsed = performance.now() - this.#gameStartTime;
            const totalSeconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            this.#statusTimerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        let currentMoneyReward = 10;
        if (this.#towers.length >= 70) { currentMoneyReward = 3; } else if (this.#towers.length >= 50) { currentMoneyReward = 5; } else if (this.#towers.length >= 30) { currentMoneyReward = 7; } else if (this.#towers.length >= 20) { currentMoneyReward = 8; }
        this.#statusMoneyRewardElement.textContent = currentMoneyReward;
        const baseScore = 15;
        const scoreReduction = Math.floor(this.#playerScore / 500);
        const currentScoreReward = Math.max(5, baseScore - scoreReduction);
        this.#statusScoreRewardElement.textContent = currentScoreReward;
        this.#statusTowerCountElement.textContent = this.#towers.length;
        this.#statusTowerCostElement.textContent = 50;
        
        const currentWave = this.#currentWaveIndex + 1;
        const totalWaves = this.#waves.length;
        if (currentWave <= totalWaves && this.#gameState !== 'idle') {
            this.#statusWaveElement.textContent = `${currentWave} / ${totalWaves}`;
        } else if (this.#gameState === 'idle') {
             this.#statusWaveElement.textContent = `- / ${totalWaves}`;
        }
    }
    
    #loadWave() { if (this.#currentWaveIndex < this.#waves.length) { const wave = this.#waves[this.#currentWaveIndex]; this.#enemiesToSpawn = wave.count; this.#spawnInterval = wave.interval; this.#spawnTimer = this.#spawnInterval; const waveNumber = this.#currentWaveIndex + 1; if(this.#currentLevel > 1 || waveNumber > 1) { if (waveNumber === this.#waves.length) { this.#feedbackMessage = 'Finaaaaaall Wavee!!'; } else { this.#feedbackMessage = `Wave ${waveNumber} chegando!`; } this.#messageTimer = 3000; } } else { this.#enemiesToSpawn = 0; } }
    #placeTower(x, y) { const cost = 50; if (this.#playerMoney >= cost) { this.#playerMoney -= cost; this.#towers.push(new Tower(x, y, this.#towerImage, this.#projectileImage)); } else { this.#feedbackMessage = 'Fundos insuficientes!'; this.#messageTimer = 2000; } }
    #handleEnemySpawning(dt) { if (this.#enemiesToSpawn === 0 && this.#enemies.length === 0 && this.#currentWaveIndex < this.#waves.length - 1) { this.#currentWaveIndex++; this.#loadWave(); } this.#spawnTimer -= dt; if (this.#spawnTimer <= 0 && this.#enemiesToSpawn > 0) { const randomImageIndex = Math.floor(Math.random() * this.#enemyImages.length); const enemyImage = this.#enemyImages[randomImageIndex]; this.#enemies.push(new Enemy(this.#path, enemyImage)); this.#enemiesToSpawn--; this.#spawnTimer = this.#spawnInterval; } }
    #drawScene() { this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height); this.#drawBackground(); this.#drawMap(); this.#drawBase(); this.#towers.forEach(t => t.draw(this.#ctx)); this.#projectiles.forEach(p => p.draw(this.#ctx)); this.#enemies.forEach(e => e.draw(this.#ctx)); this.#drawUI(); if (this.#gameState === 'playing') { this.#drawPlacementPreview(); } this.#drawEndScreen(); }
    #drawUI() { this.#moneyDisplayElement.textContent = `$$: ${this.#playerMoney}`; this.#scoreDisplayElement.textContent = `Score: ${this.#playerScore}`; this.#lifeDisplayElement.textContent = `Life: ${this.#playerHealth}`; if (this.#messageTimer > 0) { const totalDuration = 3000; const fadeDuration = 500; let opacity = 1; if (this.#messageTimer > totalDuration - fadeDuration) { opacity = 1 - (this.#messageTimer - (totalDuration - fadeDuration)) / fadeDuration; } else if (this.#messageTimer < fadeDuration) { opacity = this.#messageTimer / fadeDuration; } this.#ctx.fillStyle = `rgba(255, 255, 100, ${opacity})`; this.#ctx.font = 'bold 48px Arial'; this.#ctx.textAlign = 'center'; this.#ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`; this.#ctx.lineWidth = 2; this.#ctx.strokeText(this.#feedbackMessage, this.#canvas.width / 2, this.#canvas.height / 2); this.#ctx.fillText(this.#feedbackMessage, this.#canvas.width / 2, this.#canvas.height / 2); this.#ctx.textAlign = 'left'; } }
    #drawBackground() { const config = this.#levelConfigs[this.#currentLevel - 1]; if(!config) return; const bgImage = this.#backgroundImages[config.bgImageName]; if (bgImage) { this.#ctx.drawImage(bgImage, 0, 0, this.#canvas.width, this.#canvas.height); } else { this.#ctx.fillStyle = '#000'; this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height); } }
    #drawMap() { if(!this.#path) return; this.#ctx.strokeStyle = '#05064eff'; this.#ctx.lineWidth = 20; this.#ctx.beginPath(); this.#ctx.moveTo(this.#path[0].x, this.#path[0].y); for (let i = 1; i < this.#path.length; i++) { this.#ctx.lineTo(this.#path[i].x, this.#path[i].y); } this.#ctx.stroke(); }
    #drawBase() { if(!this.#path) return; const lastPoint = this.#path[this.#path.length - 1]; const size = 150; if (this.#baseImage) { this.#ctx.save(); this.#ctx.beginPath(); this.#ctx.arc(lastPoint.x, lastPoint.y, size / 2, 0, Math.PI * 2, true); this.#ctx.strokeStyle = '#000108ff'; this.#ctx.lineWidth = 15; this.#ctx.stroke(); this.#ctx.closePath(); this.#ctx.clip(); this.#ctx.drawImage(this.#baseImage, lastPoint.x - size / 2, lastPoint.y - size / 2, size, size); this.#ctx.restore(); } else { this.#ctx.fillStyle = '#63b3ed'; this.#ctx.beginPath(); this.#ctx.arc(lastPoint.x, lastPoint.y, 30, 0, Math.PI * 2); this.#ctx.fill(); } }
    #drawPlacementPreview() { const cost = 50; this.#ctx.fillStyle = this.#playerMoney < cost ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'; this.#ctx.beginPath(); this.#ctx.arc(this.#mouseX, this.#mouseY, 20, 0, Math.PI * 2); this.#ctx.fill(); this.#ctx.beginPath(); this.#ctx.arc(this.#mouseX, this.#mouseY, 150, 0, Math.PI * 2); this.#ctx.stroke(); }
    
    #drawEndScreen() { // MODIFICADO
        if (this.#gameState === 'playing') return;

        // Bloco de vitória modificado
        if (this.#gameState === 'victory') {
            // NOVO: Desenha a imagem de fundo de vitória
            if (this.#winBgImage) {
                this.#ctx.drawImage(this.#winBgImage, 0, 0, this.#canvas.width, this.#canvas.height);
            } else {
                // Fallback caso a imagem não carregue
                this.#ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
            }

            const isFinalLevel = this.#currentLevel === this.#levelConfigs.length;
            this.#ctx.textAlign = 'center';
            this.#ctx.fillStyle = 'white';
            // NOVO: Sombra no texto para melhor legibilidade sobre a imagem
            this.#ctx.shadowColor = 'black';
            this.#ctx.shadowBlur = 10;
            
            this.#ctx.font = '60px Arial';
            this.#ctx.fillText('Parabéns!', this.#canvas.width / 2, this.#canvas.height / 2 - 40);
            this.#ctx.font = '30px Arial';
            this.#ctx.fillText(`Você venceu o Nível ${this.#currentLevel}!`, this.#canvas.width / 2, this.#canvas.height / 2 + 20);
            this.#ctx.font = '24px Arial';

            if (isFinalLevel) {
                this.#ctx.fillText('Aguarde para mais novidades do nosso game!', this.#canvas.width / 2, this.#canvas.height / 2 + 70);
            } else {
                this.#ctx.fillText(`Clique para ir para o Nível ${this.#currentLevel + 1}`, this.#canvas.width / 2, this.#canvas.height / 2 + 70);
            }
            // NOVO: Reseta a sombra
            this.#ctx.shadowBlur = 0;

        // Bloco de derrota (sem alterações)
        } else if (this.#gameState === 'defeat') {
            this.#ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
            this.#ctx.textAlign = 'center';
            this.#ctx.fillStyle = 'white';
            this.#ctx.font = '60px Arial';
            this.#ctx.fillText('Que pena!', this.#canvas.width / 2, this.#canvas.height / 2 - 40);
            this.#ctx.font = '30px Arial';
            this.#ctx.fillText('Você perdeu!', this.#canvas.width / 2, this.#canvas.height / 2 + 20);
            this.#ctx.font = '24px Arial';
            this.#ctx.fillText('Clique para reiniciar', this.#canvas.width / 2, this.#canvas.height / 2 + 70);
        }
        this.#ctx.textAlign = 'left';
    }

    #generateRandomPath(numberOfTurns, margin) {
        console.log("Gerando novo caminho aleatório...");
        const path = [];
        const canvasWidth = this.#canvas.width;
        const canvasHeight = this.#canvas.height;
        const statusPanelRect = { x: canvasWidth - 250 - 40, y: 0, width: 300, height: 200, };
        const isPointInForbiddenZone = (point) => { return ( point.x > statusPanelRect.x - margin && point.y < statusPanelRect.y + statusPanelRect.height + margin ); };
        let currentX = 0;
        let currentY = Math.random() * (canvasHeight - margin * 2) + margin;
        path.push({ x: currentX, y: currentY });
        let lastDirection = 'horizontal';
        for (let i = 0; i < numberOfTurns; i++) {
            let nextPoint; let pointIsValid = false; let attempts = 0;
            while (!pointIsValid && attempts < 50) {
                if (lastDirection === 'horizontal') { let newX = currentX + margin + Math.random() * (canvasWidth / (numberOfTurns + 1 - i)); let tempX = Math.min(newX, canvasWidth - margin); nextPoint = { x: tempX, y: currentY };
                } else { let tempY = Math.random() * (canvasHeight - margin * 2) + margin; nextPoint = { x: currentX, y: tempY }; }
                if (!isPointInForbiddenZone(nextPoint)) { pointIsValid = true;
                } else { console.log("Ponto inválido gerado, tentando novamente..."); attempts++; }
            }
            currentX = nextPoint.x; currentY = nextPoint.y; path.push({ x: currentX, y: currentY });
            lastDirection = lastDirection === 'horizontal' ? 'vertical' : 'horizontal';
        }
        let finalPoint; let finalPointIsValid = false;
        while (!finalPointIsValid) {
            let finalX = canvasWidth - margin; finalPoint = { x: finalX, y: currentY };
            if (!isPointInForbiddenZone(finalPoint)) { finalPointIsValid = true;
            } else { currentY = (statusPanelRect.y + statusPanelRect.height + margin); finalPoint = { x: finalX, y: currentY }; console.log("Base na zona proibida, ajustando..."); }
        }
        path.push(finalPoint);
        return path;
    }

    #fadeOutMusic(duration = 1000) {
        const fadeInterval = 50;
        const volumeStep = this.#bgMusicElement.volume / (duration / fadeInterval);
        const fade = setInterval(() => {
            if (this.#bgMusicElement.volume > volumeStep) { this.#bgMusicElement.volume -= volumeStep;
            } else { this.#bgMusicElement.pause(); this.#bgMusicElement.volume = 1; clearInterval(fade); }
        }, fadeInterval);
    }
}

window.onload = () => { new Game(); };
// Commit try