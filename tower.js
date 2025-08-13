import { Projectile } from "./projectile.js";

export class Tower {
    #x; #y; #width; #height; #range; #cost;
    #fireRate; #fireTimer; #target;
    #image; // Imagem da torre
    #projectileImage; // Imagem do projétil que esta torre vai atirar

    constructor(x, y, image, projectileImage) {
        this.#x = x;
        this.#y = y;
        this.#image = image; // Guarda a imagem da torre
        this.#projectileImage = projectileImage; // Guarda a imagem do projétil
        this.#width = 80; // Aumentando a área de colisão/tamanho
        this.#height = 80;
        this.#range = 150;
        this.#cost = 50;
        this.#fireRate = 1; 
        this.#fireTimer = 0;
        this.#target = null;
    }

    update(deltaTime, enemies) {
        if (this.#fireTimer > 0) {
            this.#fireTimer -= deltaTime;
        }

        if (!this.#target || this.#target.isDefeated || Math.hypot(this.#target.x - this.#x, this.#target.y - this.#y) > this.#range) {
            this.#target = null;
            let closestDistance = Infinity;
            for (const enemy of enemies) {
                const distance = Math.hypot(enemy.x - this.#x, enemy.y - this.#y);
                if (distance < this.#range && distance < closestDistance) {
                    closestDistance = distance;
                    this.#target = enemy;
                }
            }
         }

        if (this.#target && this.#fireTimer <= 0) {
            this.#fireTimer = 1000 / this.#fireRate;
            // Passa a imagem do projétil para seu construtor
            return new Projectile(this.#x, this.#y, this.#target, this.#projectileImage);
        }
        
        return null;
    }

    draw(ctx) {
        // Desenha a imagem da torre no lugar do quadrado
        if (this.#image) {
            ctx.drawImage(this.#image, this.#x - this.#width / 2, this.#y - this.#height / 2, this.#width, this.#height);
        } else {
            // Fallback caso a imagem não carregue
            ctx.fillStyle = '#9f7aea';
            ctx.fillRect(this.#x - this.#width / 2, this.#y - this.#height / 2, this.#width, this.#height);
        }
        
        // O desenho do raio de alcance continua o mesmo
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'; // Cor mais sutil
        ctx.lineWidth = 1;
        ctx.arc(this.#x, this.#y, this.#range, 0, Math.PI * 2);
        ctx.stroke();
    }
}