class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame, leftKey, rightKey, shootWeakKey, shootStrongKey, speed, positions) {
        super(scene, x, y, texture, frame);

        this.left = leftKey;
        this.right = rightKey;

        this.shootWeak = shootWeakKey;
        this.shootStrong = shootStrongKey;
        this.reloaded = true;

        this.movementSpeed = speed;
        this.positions = positions;
        this.pos = this.positions.length / 2;

        scene.add.existing(this);
        return this;
    }

    update() {

        // take keyboard inputs
        if (Phaser.Input.Keyboard.JustDown(this.left)) {
            this.pos--;
        }
        if (Phaser.Input.Keyboard.JustDown(this.right)) {
            this.pos++;
        }

        // update movement tween if needed
        let newPos = positions[pos] - (this.displayWidth / 2);
        if (this.x != newPos) {
            for(var tween of this.tweens) {
                tween.destroy();
            }
            let tweenDur = Math.abs(this.x - this.newPos) / this.speed;
            this.tweens.add({
                targets: this,
                x: newPos,
                y: this.y,
                duration: tweenDur,
                ease: 'Quad.easeOut'
            })
        }
    }
}