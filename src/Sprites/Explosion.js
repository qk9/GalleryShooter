class Explosion extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);

        this.explodeTween = this.scene.tweens.add({
            targets: this,
            rotation: this.rotation + Math.PI * Math.sign(Math.random() - 0.5),
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 1500,
            ease: 'linear',
            persist: false,
            callbackScope: this,
            onComplete: () => {
                this.destroy();
            }
        });
        scene.add.existing(this);
        return this;
    }
}