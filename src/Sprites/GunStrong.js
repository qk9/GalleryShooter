class GunStrong extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, positions, jointTexture, armTexture, barrelTexture, frame, mKey, fireKey) {
        super(scene, x, y, jointTexture, frame);
        this.positions = positions;
        this.pos = 2;
        this.movementTime = 800;
        this.mKey = mKey;
        this.fireKey = fireKey;

        // innermost joint
        this.setRotation(Math.PI / -2);
        this.setScale(1);

        // joint angles
        this.angInner = 2 * Math.PI / -3; // angle of innermost joint
        this.angMiddle = Math.PI / 10; // angle of middle joint
        this.angOuter = Math.PI / -3; // angle of outermost joint

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

        // outermost joint
        this.jointOuter = this.scene.add.sprite(this.jointMiddle.x + (107 * Math.cos(this.angMiddle)), this.jointMiddle.y + (107 * Math.sin(this.angMiddle)), jointTexture);
        this.jointOuter.setScale(0.6);
        this.jointOuter.setRotation(this.angOuter + (Math.PI / 2));

        // barrel
        this.barrel = this.scene.add.sprite(this.jointOuter.x + (45 * Math.cos(this.angOuter)), this.jointOuter.y + (45 * Math.sin(this.angOuter)), barrelTexture);
        this.barrel.setRotation(this.angOuter + (Math.PI / 2));
        
        // place arms above joints
        this.scene.children.bringToTop(this.armInner);
        this.scene.children.bringToTop(this.armOuter);
        this.scene.children.bringToTop(this.barrel);

        // coordinates for fire()
        this.targetX = 0;
        this.targetY = 0;

        scene.add.existing(this);
        return this;
    }

    update() {
        // listen for inputs
        if (Phaser.Input.Keyboard.JustDown(this.mKey)) {
            this.move();
        }

        if(Phaser.Input.Keyboard.JustDown(this.fireKey)) {
            this.attack();
        }

        // adjust arms and joints to correct positions
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
        let newPos = x;
        let tweenDur = this.movementTime/*Math.abs(this.x - newPos) * this.movementSpeed*/;
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
        let tweenDur = this.movementTime/*Math.abs(this.inRads - endAngle) / Math.PI * 1000*/;
        this.currInnerTwistTween = this.scene.tweens.add({
            targets: this,
            angInner: inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
        })
        this.currInnerVisualTween = this.scene.tweens.add({
            targets: this,
            rotation: -1 * inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    twistMiddleToAngle(inRads) {
        let endAngle = inRads;
        // prevent middle joint from pointing too close to straight down
        if (Math.abs(Math.PI / 2 - endAngle) < Math.PI / 4) {
            if (endAngle > Math.PI / 2) {
                endAngle = 3 * Math.PI / 4;
            }
            else {
                endAngle = 1 * Math.PI / 4;
            }
        }
        if (this.currMiddleTwistTween) {
            this.currMiddleTwistTween.stop();
            this.currMiddleTwistTween.destroy();
        }
        if (this.currMiddleVisualTween) {
            this.currMiddleVisualTween.stop();
            this.currMiddleVisualTween.destroy();
        }
        let tweenDur = this.movementTime/*Math.abs(this.angMiddle - endAngle) / Math.PI * 1000*/;
        this.currMiddleTwistTween = this.scene.tweens.add({
            targets: this,
            angMiddle: endAngle,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
        })
        this.currMiddleVisualTween = this.scene.tweens.add({
            targets: this.jointMiddle,
            rotation: -2 * endAngle,
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
        let tweenDur = this.movementTime/*Math.abs(this.angOuter - inRads) / Math.PI * 1000*/;
        this.currOuterTwistTween = this.scene.tweens.add({
            targets: this,
            angOuter: inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut',
        })
        this.currOuterVisualTween = this.scene.tweens.add({
            targets: this.jointOuter,
            rotation: -4 * inRads,
            duration: tweenDur,
            ease: 'Quad.easeInOut'
        })
    }

    storeTargetCoords(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    fire(targetX, targetY) {
        // store pointers to mouse and gun barrel
        let gunBarrel = this.scene.my.sprite.gunStrong.barrel;

        // create hitbox line directly from barrel tip through target point to screen border
        let ang = Phaser.Math.Angle.Between(gunBarrel.x, gunBarrel.y, targetX, targetY)  
        var line = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line(), 
                                               gunBarrel.x + (0.5 * 62 * Math.cos(ang)),
                                               gunBarrel.y + (0.5 * 62 * Math.sin(ang)),
                                               ang, 1500);
        
        // draw laser graphic based on hitbox line
        var laserGraphics = this.scene.add.graphics();
        var shadowGraphics = this.scene.add.graphics();
        this.scene.my.sprite.gunStrong.drawStrongLaser(laserGraphics, shadowGraphics, line.x1, line.y1, line.x2, line.y2, 5);
        this.scene.children.bringToTop(gunBarrel);
    }

    drawStrongLaser(laserGraphics, shadowGraphics, x1, y1, x2, y2, steps) {
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
        laserGraphics.lineStyle(60, 0x873918, 1.0);
        laserGraphics.strokePoints(points, false, false, points.length);
        laserGraphics.lineStyle(40, 0xAB4D29, 1.0);
        laserGraphics.strokePoints(points, false, false, points.length);
        laserGraphics.lineStyle(25, 0xD17152, 1.0);
        laserGraphics.strokePoints(points, false, false, points.length);
        laserGraphics.lineStyle(5, 0xffffff, 1.0);
        laserGraphics.strokePoints(points, false, false, points.length);
        laserGraphics.scene.tweens.add({
            targets: laserGraphics,
            alpha: 0,
            duration: 5000,
            ease: 'Expo.Out'
        })
        shadowGraphics.lineStyle(60, 0x444444, 0.2);
        shadowGraphics.strokePoints(points, false, false, points.length);
        shadowGraphics.scene.tweens.add({
            targets: shadowGraphics,
            alpha: 0,
            duration: 30000,
            ease: 'Quad.Out'
        })
    }

    attack() {
        let player = this.scene.my.sprite.player;
        let pointer = this.scene.input.activePointer;
        if (this.timeline) {
            this.timeline.stop();
            this.timeline.destroy();
        }
        this.timeline = this.scene.add.timeline([
            {
                at: 1000,
                run() {
                    this.moveTo(player.positions[player.pos] + ((Math.random() - 0.5) * 200));
                },
                target: this
            },
            {
                from: 1000,
                run() {
                    this.twistInnerToAngle(Phaser.Math.Angle.Between(this.x, this.y, pointer.x, this.y - 150));
                },
                target: this
            },
            {
                from: 1000,
                run() {
                    this.twistMiddleToAngle(Phaser.Math.Angle.Between(this.jointMiddle.x, this.jointMiddle.y, pointer.x, this.jointMiddle.y + 30));
                },
                target: this
            },
            {
                from: 1000,
                run() {
                    this.storeTargetCoords(pointer.x, pointer.y);
                    this.twistOuterToAngle(Phaser.Math.Angle.Between(this.jointOuter.x, this.jointOuter.y, pointer.x, pointer.y));
                },
                target: this
            },
            {
                from: 1000,
                run() {
                    this.fire(this.targetX, this.targetY);
                },
                target: this
            }
        ])
        this.timeline.play();
    }
}