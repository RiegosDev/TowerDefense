export class Projectile {
    #x; #y; #radius; #speed; #damage; #target;
    #image; // Imagem da flecha
    #angle; // Ângulo de rotação

    hasHitTarget;

    constructor(x, y, target, image) {
        this.#x = x;
        this.#y = y;
        this.#target = target;
        this.#image = image; // Guarda a imagem
        this.#angle = 0; // Começa sem rotação

        this.#radius = 10; // Raio de colisão
        this.#speed = 400;
        this.#damage = 1;
        
        this.hasHitTarget = false;
    }

    draw(ctx){
        // Lógica para rotacionar a flecha para apontar para o alvo
        ctx.save(); // Salva o estado atual do canvas (sem rotação)
        ctx.translate(this.#x, this.#y); // Move o ponto de origem do canvas para a posição da flecha
        ctx.rotate(this.#angle); // Rotaciona o canvas
        
        // Desenha a imagem da flecha já rotacionada
        const size = 25; // Tamanho da flecha
        ctx.drawImage(this.#image, -size / 2, -size / 2, size, size);
        
        ctx.restore(); // Restaura o estado do canvas para o normal (sem rotação)
    }

    update(deltaTime) {
        // Calcula o ângulo e guarda na propriedade para usar no 'draw'
        this.#angle = Math.atan2(this.#target.y - this.#y, this.#target.x - this.#x);
        
        const distanceToMove = this.#speed * (deltaTime / 1000);

        this.#x += Math.cos(this.#angle) * distanceToMove;
        this.#y += Math.sin(this.#angle) * distanceToMove;

        const distanceToTarget = Math.hypot(this.#target.x - this.#x, this.#target.y - this.#y);
        if (distanceToTarget < this.#radius + this.#target.radius) {
            this.hasHitTarget = true;
            this.#target.takeDamage(this.#damage);
        }
    }
}