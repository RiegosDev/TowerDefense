export class Enemy {
    #x; #y; #radius; #speed; #path; #pathIndex;
    hasReachedEnd; #health; #maxHealth; #moneyValue;
    #scoreValue; x; y; radius; isDefeated;
    #image;

    get moneyValue() { return this.#moneyValue; }
    get scoreValue() { return this.#scoreValue; }

    constructor(path, image) {
        this.#path = path;
        this.#image = image;
        this.#x = this.#path[0].x;
        this.#y = this.#path[0].y;
        this.#radius = 25; 
        this.#speed = 85; 
        this.#pathIndex = 1;
        this.hasReachedEnd = false;
        this.#maxHealth = 5; 
        this.#health = this.#maxHealth;
        this.#moneyValue = 10;
        this.#scoreValue = 15;
        this.isDefeated = false;
        this.x = this.#x;
        this.y = this.#y;
        this.radius = this.#radius;
    }

    takeDamage(amount) {
        this.#health -= amount;
        if (this.#health <= 0) {
            this.isDefeated = true;
        }
    }

    draw(ctx) {
        const size = this.#radius * 2;
        ctx.drawImage(this.#image, this.#x - this.#radius, this.#y - this.#radius, size, size);

        const healthBarWidth = 40;
        const healthBarHeight = 5;
        const healthPercentage = this.#health / this.#maxHealth;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(this.#x - healthBarWidth / 2, this.#y - this.#radius - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.#x - healthBarWidth / 2, this.#y - this.#radius - 10, healthBarWidth * healthPercentage, healthBarHeight);
    }

    update(deltaTime) {
        if (this.#pathIndex >= this.#path.length) {
            this.hasReachedEnd = true;
            return;
        } 
        const target = this.#path[this.#pathIndex];
        const angle = Math.atan2(target.y - this.#y, target.x - this.#x);
        const distanceToMove = this.#speed * (deltaTime / 1000);
        this.#x += Math.cos(angle) * distanceToMove;
        this.#y += Math.sin(angle) * distanceToMove;
        this.x = this.#x;
        this.y = this.#y;
        const distanceToTarget = Math.hypot(target.x - this.#x, target.y - this.#y);
        if (distanceToTarget < distanceToMove) {
            this.#x = target.x;
            this.#y = target.y;
            this.#pathIndex++;
        }
    }
}