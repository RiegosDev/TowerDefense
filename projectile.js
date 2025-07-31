export class Projectile {
    #x;
    #y;
    #radius;
    #speed;
    #damage;
    #target;

    hasHitTarget;

    constructor(x, y, target) {
        this.#x = x;
        this.#y = y;
        this.#target = target;

        this.#radius = 5;
        this.#speed = 400; // Speed of the projectile
        this.#damage = 1; // Damage dealt by the projectile
        
        this.hasHitTarget = false;
    }

    draw(ctx){
        ctx.fillStyle = '#ffdd57';
        ctx.beginPath();
        ctx.arc(this.#x, this.#y, this.#radius, 0, Math.PI * 2);
        ctx.fill();
    }

    update(deltaTime) {
        const angle = Math.atan2(this.#target.y - this.#y, this.#target.x - this.#x);
        const distanceToMove = this.#speed * (deltaTime / 1000);

        this.#x += Math.cos(angle) * distanceToMove;
        this.#y += Math.sin(angle) * distanceToMove;

        const distanceToTarget = Math.hypot(this.#target.x - this.#x, this.#target.y - this.#y);
        if (distanceToTarget < this.#radius + this.#target.radius) {
            this.hasHitTarget = true;
            this.#target.takeDamage(this.#damage);
            
        }
    }
}