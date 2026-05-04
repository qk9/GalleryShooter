class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, 
                speed, positions, pos, 
                health,
                texture, frame, 
                leftKey, rightKey) {
        super(scene, x, y, texture, frame);

        this.left = leftKey;
        this.right = rightKey;

        this.movementSpeed = speed;
        this.positions = positions;
        this.pos = pos;
        this.moved = false;

        this.health = health;
        this.hurtbox = new Phaser.Geom.Rectangle.FromXY(this.x - this.displayWidth / 2,
                                                        this.y - this.displayHeight / 2,
                                                        this.x + this.displayWidth / 2,
                                                        this.y + this.displayHeight / 2);

        scene.add.existing(this);
        return this;
    }

    update() {

        // take keyboard inputs
        if (this.pos > 0 && Phaser.Input.Keyboard.JustDown(this.left)) {
            this.pos = this.pos - 1;
            this.moved = true;
        }
        if (this.pos < this.positions.length - 1 && Phaser.Input.Keyboard.JustDown(this.right)) {
            this.pos = this.pos + 1;
            this.moved = true;
        }

        // move hurtbox
        this.hurtbox.left = this.x - this.displayWidth / 2;
        this.hurtbox.right = this.x + this.displayWidth / 2;
        this.hurtbox.top = this.y - this.displayHeight / 2;
        this.hurtbox.bottom = this.y + this.displayHeight / 2;

        // update movement tween if needed
        if (this.moved) {
            if (this.currTween) {
                this.currTween.stop();
                this.currTween.destroy();
            }
            let newPos = this.positions[this.pos];
            let tweenDur = Math.abs(this.x - newPos) * this.movementSpeed;
            this.currTween = this.scene.tweens.add({
                targets: this,
                x: newPos,
                y: this.y,
                duration: tweenDur,
                ease: 'Quad.easeOut'
            });
            this.moved = false;
        }
        console.log(this.health);
    }

}