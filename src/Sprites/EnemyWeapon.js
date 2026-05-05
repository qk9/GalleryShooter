class EnemyWeapon extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
           enemy, delay,
           texture, frame) {
        super(scene, x, y, texture, frame);

        this.enemy = enemy;

        this.firingDelay = delay;
        this.targetGeom = this.scene.add.graphics();

        this.setOrigin(0.5, 0.8);
        this.setScale(0.3, 0.6);

        scene.add.existing(this);
        return this;
    }

    update() {
        this.x = this.enemy.x;
        this.y = this.enemy.y;
        if (!Object.hasOwn(this, "firingAnim")) {
            this.rotation = this.enemy.rotation;
        }
    }

    attack(position) {
        this.targetX = this.x/*this.scene.positions[position]*/;
        this.targetY = this.scene.my.sprite.player.y;
        let rotAngle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY) + Math.PI / 2;
        if (Math.abs(rotAngle - this.rotation) > Math.PI) {
            if (rotAngle > this.rotation) {
                rotAngle -= 2 * Math.PI;
            }
            else {
                rotAngle += 2 * Math.PI;
            }
            //rotAngle = Math.sign(rotAngle) * -2 * Math.PI + rotAngle;
        }
        let backAngle = this.rotation;
        if (rotAngle > this.rotation) {
            backAngle -= 2 * Math.PI;
        }
        
        this.firingAnim = this.scene.add.timeline([
            {
                at: 0,
                tween: {
                    targets: this,
                    rotation: rotAngle,
                    ease: 'Quad.easeInOut',
                    duration: this.firingDelay
                },
                run() {
                    this.drawTarget(this.targetX, this.targetY);
                },
                target: this
            },
            {
                at: this.firingDelay,
                run() {
                    this.fire(this.targetX, this.targetY);
                },
                target: this
            },
            {
                from: 100,
                tween: {
                    targets: this,
                    rotation: backAngle,
                    ease: 'Quad.easeInOut',
                    duration: this.firingDelay
                }
            },
            {
                from: this.firingDelay,
                run() {
                    delete this.firingAnim;
                },
                target: this
            }
        ]);
        this.firingAnim.play();
    }

    fire(targetX, targetY) {
        // create hitbox line directly from barrel tip through mouse pointer to screen border
        let ang = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY) // "this" will be active pointer, should change later
        var line = new Phaser.Geom.Line(this.x + (0.45 * 58 * Math.cos(ang)), this.y + (0.45 * 58 * Math.sin(ang)), targetX, targetY);
        
        this.handleCollisionChecks(line);

        // draw laser graphic based on hitbox line
        var graphics = this.scene.add.graphics();
        this.drawLaser(graphics, line.x1, line.y1, line.x2, line.y2, 10);
        this.targetGeom.clear();
        this.scene.children.bringToTop(this);
    }

    handleCollisionChecks(line) {
        let player = this.scene.my.sprite.player;
        if (Phaser.Geom.Intersects.LineToRectangle(line, player.hurtbox)) {
            player.health--;
        }
    }

    drawLaser(graphics, x1, y1, x2, y2, steps) {

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
        graphics.lineStyle(6, 0x49BA7C, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(3, 0x84D9A9, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(1, 0xffffff, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 1000,
            ease: 'Expo.Out'
        })
    }

    drawTarget(targetX, targetY) {
        // draw target circle
        let circle = new Phaser.Geom.Circle(targetX, targetY, 20);
        let line1 = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line, targetX + (circle.radius / 3), targetY + (circle.radius / 3), Math.PI / 4, circle.radius)
        let line2 = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line, targetX - (circle.radius / 3), targetY + (circle.radius / 3), 3 * Math.PI / 4, circle.radius)
        let line3 = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line, targetX + (circle.radius / 3), targetY - (circle.radius / 3), Math.PI / -4, circle.radius)
        let line4 = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line, targetX - (circle.radius / 3), targetY - (circle.radius / 3), 3 * Math.PI / -4, circle.radius)
        this.targetGeom.lineStyle(6, 0x000000, 0.5)
        this.targetGeom.strokeCircleShape(circle);
        this.targetGeom.strokeLineShape(line1);
        this.targetGeom.strokeLineShape(line2);
        this.targetGeom.strokeLineShape(line3);
        this.targetGeom.strokeLineShape(line4);
        this.targetGeom.lineStyle(4, 0x33cc33, 1)
        this.targetGeom.strokeCircleShape(circle);
        this.targetGeom.strokeLineShape(line1);
        this.targetGeom.strokeLineShape(line2);
        this.targetGeom.strokeLineShape(line3);
        this.targetGeom.strokeLineShape(line4);
    }
}