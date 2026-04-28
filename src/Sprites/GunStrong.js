class GunStrong extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, positions, jointTexture, armTexture, barrelTexture, frame, mKey, fireKey) {
        super(scene, x, y, jointTexture, frame);
        this.positions = positions;
        this.pos = 2;
        this.movementSpeed = 4;
        this.mKey = mKey;
        this.fireKey = fireKey;

        // innermost joint
        this.setRotation(Math.PI / -2);
        this.setScale(1);

        // joint angles
        this.angInner = 2 * Math.PI / -3;
        this.angMiddle = Math.PI / 10;
        this.angOuter = Math.PI / -2;

        // inner arm
        this.armInner = this.scene.add.sprite(this.x + (35 * Math.cos(this.angInner)), this.y + (35 * Math.sin(this.angInner)), armTexture)
        this.armInner.setOrigin(0.5, 0.9);
        this.armInner.setScale(1);
        this.armInner.setRotation(this.angInner + (Math.PI / 2));

        // middle joint
        this.jointMiddle = this.scene.add.sprite(this.x + (117 * Math.cos(this.angInner)), this.y + (117 * Math.sin(this.angInner)), jointTexture);
        this.jointMiddle.setScale(0.85);

        // outer arm
        this.armOuter = this.scene.add.sprite(this.jointMiddle.x + (35 * Math.cos(this.angMiddle)), this.jointMiddle.y + (35 * Math.sin(this.angMiddle)), armTexture);
        this.armOuter.setOrigin(0.5, 0.9);
        this.armOuter.setScale(1);
        this.armOuter.setRotation(this.angMiddle + (Math.PI / 2));

        // outer joint
        this.jointOuter = this.scene.add.sprite(this.jointMiddle.x + (107 * Math.cos(this.angMiddle)), this.jointMiddle.y + (107 * Math.sin(this.angMiddle)), jointTexture);
        this.jointOuter.setScale(0.6);
        this.jointOuter.setRotation(this.angOuter + (Math.PI / 2));

        // barrel
        this.barrel = this.scene.add.sprite(this.jointOuter.x + (45 * Math.cos(this.angOuter)), this.jointOuter.y + (45 * Math.sin(this.angOuter)), barrelTexture);
        this.barrel.setRotation(this.angOuter + (Math.PI / 2));
        
        // place arms above joints
        this.scene.children.bringToTop(this.armInner);
        this.scene.children.bringToTop(this.jointOuter);
        this.scene.children.bringToTop(this.armOuter);


        scene.add.existing(this);
        return this;
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.move();
        }

        if(Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.fire();
        }

        this.armInner.x = this.x + (35 * Math.cos(this.angInner));
        this.armInner.y = this.y + (35 * Math.sin(this.angInner));
        this.armInner.setRotation(this.angInner + (Math.PI / 2));

        this.jointMiddle.x = this.x + (117 * Math.cos(this.angInner));
        this.jointMiddle.y = this.y + (117 * Math.sin(this.angInner));
        
        this.armOuter.x = this.jointMiddle.x + (35 * Math.cos(this.angMiddle));
        this.armOuter.y = this.jointMiddle.y + (35 * Math.sin(this.angMiddle));
        this.armOuter.setRotation(this.angMiddle + (Math.PI / 2));

        this.jointOuter.x = this.jointMiddle.x + (107 * Math.cos(this.angMiddle));
        this.jointOuter.y = this.jointMiddle.y + (107 * Math.sin(this.angMiddle));

        this.barrel.x = this.jointOuter.x + (45 * Math.cos(this.angOuter));
        this.barrel.y = this.jointOuter.y + (45 * Math.sin(this.angOuter));
        this.barrel.setRotation(this.angOuter + (Math.PI / 2));
    }

    move() {
        this.moveTo(this.scene.my.sprite.player.pos);
    }

    moveTo(x) {
        if (this.currMoveTween) {
                this.currMoveTween.stop();
                this.currMoveTween.destroy();
            }
        if (this.currBaseTwistTween) {
            this.currBaseTwistTween.stop();
            this.currBaseTwistTween.destroy();
        }
        let newPos = this.positions[x];
        let tweenDur = Math.abs(this.x - newPos) * this.movementSpeed;
        this.currMoveTween = this.scene.tweens.add({
            targets: this,
            x: newPos,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        });
        let rotDistance = (this.x - newPos) / -40;
        this.currBaseTwistTween = this.scene.tweens.add({
            targets: this,
            rotation: this.rotation + rotDistance,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    twistInnerToAngle(inRads) {
        if (this.currInnerTwistTween) {
            this.currInnerTwistTween.stop();
            this.currInnerTwistTween.destroy();
        }
        let tweenDur = Math.abs(inRads) / Math.PI * 1000;
        this.currInnerTwistTween = this.scene.tweens.add({
            targets: this,
            angInner: inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
            onStop: this.tweenEnded
        })
        this.currInnerVisualTween = this.scene.tweens.add({
            targets: this,
            rotation: -1 * inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    twistMiddleToAngle(inRads) {
        if (this.currMiddleTwistTween) {
            this.currMiddleTwistTween.stop();
            this.currMiddleTwistTween.destroy();
        }
        if (this.currMiddleVisualTween) {
            this.currMiddleVisualTween.stop();
            this.currMiddleVisualTween.destroy();
        }
        let tweenDur = Math.abs(inRads) / Math.PI * 1000;
        this.currMiddleTwistTween = this.scene.tweens.add({
            targets: this,
            angMiddle: inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
            onStop: this.tweenEnded
        })
        this.currMiddleVisualTween = this.scene.tweens.add({
            targets: this.jointMiddle,
            rotation: -2 * inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    twistOuterToAngle(inRads) {
        if (this.currOuterTwistTween) {
            this.currOuterTwistTween.stop();
            this.currOuterTwistTween.destroy();
        }
        if (this.currOuterVisualTween) {
            this.currOuterVisualTween.stop();
            this.currOuterVisualTween.destroy();
        }
        let tweenDur = Math.abs(inRads) / Math.PI * 1000;
        this.currOuterTwistTween = this.scene.tweens.add({
            targets: this,
            angOuter: inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
            onStop: this.tweenEnded
        })
        this.currOuterVisualTween = this.scene.tweens.add({
            targets: this.jointOuter,
            rotation: -4 * inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    tweenEnded() {
        console.log("tween finished");
        return true;
    }

    fire() {
        // store pointers to mouse and gun barrel
        let pointer = this.scene.input.activePointer;
        let gunBarrel = this.scene.my.sprite.gunStrong.barrel;

        // create hitbox line directly from barrel tip through mouse pointer to screen border
        let ang = Phaser.Math.Angle.Between(gunBarrel.x, gunBarrel.y, pointer.x, pointer.y)  
        var line = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line(), 
                                               gunBarrel.x + (0.5 * 62 * Math.cos(ang)),
                                               gunBarrel.y + (0.5 * 62 * Math.sin(ang)),
                                               ang, 1500);
        
        // draw laser graphic based on hitbox line
        var graphics = this.scene.add.graphics();
        this.scene.my.sprite.gunStrong.drawStrongLaser(graphics, line.x1, line.y1, line.x2, line.y2, 5);
        this.scene.children.bringToTop(gunBarrel);
    }

    drawStrongLaser(graphics, x1, y1, x2, y2, steps) {
        // generate segments
        let ang = Phaser.Math.Angle.Between(x1, y1, x2, y2);
        ang += Math.PI / 2;
        let x = x1;
        let y = y1;
        let points = [{x, y}];
        for (let i = 1; i <= steps; i++) {
            let x = (((steps - i) / steps) * x1) + ((i / steps)* x2);
            let y = (((steps - i) / steps) * y1 + (i / steps) * y2);
            let offset = Math.random() - 0.5;
            x += Math.cos(ang) * offset * 50;
            y += Math.sin(ang) * offset * 50;
            points.push({x, y});
        }
        
        // draw
        graphics.lineStyle(60, 0x873918, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(40, 0xAB4D29, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(25, 0xD17152, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(5, 0xffffff, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 5000,
            ease: 'Expo.Out'
        })
    }
}