import { Projectile } from "./projectile.js";

export class Tower {
    // --- CORREÇÃO: Garantir que todas as propriedades privadas estão declaradas aqui ---
    #x;
    #y;
    #width;
    #height;
    #range;
    #cost;
    #fireRate;
    #fireTimer; // <-- Esta linha provavelmente sumiu
    #target;    // <-- E esta linha também

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
        this.#width = 40;
        this.#height = 40;
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

        // Adicionamos 'this.#target.isDefeated' para forçar a busca por um novo alvo
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
            return new Projectile(this.#x, this.#y, this.#target);
        }
        
        return null;
    }

    draw(ctx) {
        ctx.fillStyle = '#9f7aea';
        ctx.fillRect(this.#x - this.#width / 2, this.#y - this.#height / 2, this.#width, this.#height);
        
        ctx.beginPath();
        ctx.strokeStyle = '#9f7aea';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.arc(this.#x, this.#y, this.#range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}