class FiringClock extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
                gunStrong,
                texture, frame) {
        super(scene, x, y, texture, frame);

        this.gunStrong = gunStrong;
        this.rotation = Math.PI / -3.8;

        this.handFire = this.scene.add.sprite(this.x, this.y, this.scene.textures.get("enemyGun"));

        this.handFire.setScale(0.2, 0.4);
        this.handFire.setOrigin(0.5, 0.25);

        this.handFireAngle = Math.PI / -2;
        this.handFire.rotation = this.handFireAngle;

        scene.add.existing(this);
        return this;
    }

    update(time) {
        this.scene.children.bringToTop(this);
        this.scene.children.bringToTop(this.handFire);
        this.x = this.gunStrong.jointMiddle.x;
        this.y = this.gunStrong.jointMiddle.y;
        this.handFire.x = this.x;
        this.handFire.y = this.y;
        // update hand position
        this.handFireAngle = (((time + (this.gunStrong.movementTime * 6.25) - (this.scene.enemySpeed * 3.1) % this.scene.enemyCycleTime) / this.scene.enemyCycleTime) * 2 * Math.PI);
        this.handFire.rotation = this.handFireAngle;

    }

    changeState(state) {
        if (state) {
            this.setTexture(this.scene.textures.get("clockFaceReady"));
            this.handFire.setTexture(this.scene.textures.get("enemyGun"));
        }
        else {
            this.setTexture(this.scene.textures.get("clockFaceUnready"));
            this.handFire.setTexture(this.scene.textures.get("clockHandUnready"));
        }
    }
}