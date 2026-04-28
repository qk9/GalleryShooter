class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, 
                speed, positions, pos, 
                texture, frame, 
                leftKey, rightKey, prepShootStrongKey, shootStrongKey) {
        super(scene, x, y, texture, frame);

        this.left = leftKey;
        this.right = rightKey;

        this.prepShoot = prepShootStrongKey;
        this.shootStrong = shootStrongKey;
        this.canShootStrong = true;

        this.movementSpeed = speed;
        this.positions = positions;
        this.pos = pos;
        this.oldPos = pos;

        scene.add.existing(this);
        return this;
    }

    update() {

        // take keyboard inputs
        if (this.pos > 0 && Phaser.Input.Keyboard.JustDown(this.left)) {
            this.pos = this.pos - 1;
        }
        if (this.pos < this.positions.length - 1 && Phaser.Input.Keyboard.JustDown(this.right)) {
            this.pos = this.pos + 1;
        }

        // update movement tween if needed
        if (this.oldPos != this.pos) {
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
            this.oldPos = this.pos;
        }
    }

}