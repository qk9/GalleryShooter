class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
                startLane,
                speed,
                texture, frame) {
        super(scene, x, y, texture, frame);
        this.speed = speed;
        this.memberCount = 1;
        this.members = [];

        this.setScale(0.5, 0.5);
        
        scene.add.existing(this);
        return this;
    }

    update() {
        
    }

    mergeInto(other) {
        other.memberCount++;
        this.destroy();
    }
}