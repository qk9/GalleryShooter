class GunWeak extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
                texture, frame,
                player) {
        super(scene, x, y, texture, frame);

        this.player = player;
        this.setOrigin(0.5, 0.8);
        this.setScale(0.5, 1);

        scene.add.existing(this);
        return this;
    }

    update() {
        // sync position with player
        if (this.x != this.player.x - 2) {
            this.x = this.player.x - 2;
        }

        // point towards mouse
        let pointer = this.scene.input.activePointer;
        if (pointer.y < this.scene.sandbagY - 22) {
            this.angle = Phaser.Math.RadToDeg(Phaser.Math.Angle.Between(this.x, this.y, pointer.x, pointer.y)) + 90;
        }
    }

    fire() {
        // store pointers to mouse and gun barrel
        let pointer = this.scene.input.activePointer;
        let gunWeak = this.scene.my.sprite.gunWeak;

        // create hitbox line directly from barrel tip through mouse pointer to screen border
        let ang = Phaser.Math.Angle.Between(gunWeak.x, gunWeak.y, this.x, this.y) // "this" will be active pointer, should change later
        var line = Phaser.Geom.Line.SetToAngle(new Phaser.Geom.Line(), 
                                               gunWeak.x + (0.75 * 58 * Math.cos(ang)),
                                               gunWeak.y + (0.75 * 58 * Math.sin(ang)),
                                               ang, 1310);
        
        gunWeak.handleCollisionChecks(line);

        // draw laser graphic based on hitbox line
        var graphics = this.scene.add.graphics();
        gunWeak.drawWeakLaser(graphics, line.x1, line.y1, line.x2, line.y2, 10);
        this.scene.children.bringToTop(gunWeak);
    }

    handleCollisionChecks(line) {
        // check for enemy collision
        let highCoord = Math.max(line.x1, line.x2);
        let lowCoord = Math.min(line.x1, line.x2);
        let lowIndex = Math.max(Math.round((lowCoord - this.scene.pathHorizLeftBuffer) / this.scene.pathHorizSpacing), 0);
        let highIndex = Math.min(Math.round((highCoord - this.scene.pathHorizLeftBuffer) / this.scene.pathHorizSpacing), this.scene.pathColumns - 1);
        for (lowIndex; lowIndex <= highIndex; lowIndex++) {
            let currList = this.scene.enemies[lowIndex];
            for (let enemy in currList) {
                let currEnemy = currList[enemy];
                if (Phaser.Geom.Intersects.LineToLine(line, currEnemy.leftLine) && currEnemy.getMoveSum() < this.scene.path.sprites.length - 1) {
                    console.log(currEnemy.getMoveSum());
                    currEnemy.addMove("right");
                }
                else if (Phaser.Geom.Intersects.LineToLine(line, currEnemy.rightLine) && currEnemy.getMoveSum() > 0) {
                    console.log(currEnemy.getMoveSum());
                    currEnemy.addMove("left");
                }
            }
        }
    }

    drawWeakLaser(graphics, x1, y1, x2, y2, steps) {

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
        graphics.lineStyle(20, 0x24738F, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(14, 0x71B8E3, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.lineStyle(4, 0xffffff, 1.0);
        graphics.strokePoints(points, false, false, points.length);
        graphics.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 1000,
            ease: 'Expo.Out'
        })
    }
}