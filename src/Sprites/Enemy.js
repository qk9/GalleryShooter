class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
                texture, frame,
                index) {
        super(scene,
              x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer, 
              y * scene.pathVertSpacing + scene.pathVertTopBuffer + ((x + 1) % 2 * scene.pathVertSpacing / 2) - 100,
              texture, frame);

        this.xIndex = x;
        this.yIndex = y;

        this.sceneIndex = index;
        this.scene.enemyIndex++;

        this.moves = ["any", "any", "any"];
        this.moveIndex = 0;
        this.moving = false;

        this.leftLine = new Phaser.Geom.Line(this.x - this.displayWidth / 2, this.y,
                                             this.x - this.displayWidth / 2 - 50, this.y);
        this.rightLine = new Phaser.Geom.Line(this.x + this.displayWidth / 2, this.y,
                                              this.x + this.displayWidth / 2 + 50, this.y);
        this.hurtbox = new Phaser.Geom.Rectangle.FromXY(this.x - this.displayWidth / 2 - 20,
                                                        this.y - this.displayHeight / 2 - 20,
                                                        this.x + this.displayWidth / 2 + 20,
                                                        this.y + this.displayHeight / 2 + 20);

        // temp
        this.graphics = this.scene.add.graphics();
        this.graphics.lineStyle(1, 0x000000, 1.0);

        this.setScale(0.5, 0.5);
        this.rotation = Math.PI;

        this.weapon = null;

        this.startTween = this.scene.tweens.add({
            targets: this,
            y: this.scene.path.sprites[this.xIndex][this.yIndex].y,
            duration: 500,
            ease: 'Quad.easeOut',
            persist: false,
            callbackScope: this,
            onComplete: () => {
                this.addToMoveCycle();
                this.startTween.destroy();
                delete this.startTween;
            }
        })
        
        scene.add.existing(this);
        return this;
    }

    setWeapon(weapon) {
        this.weapon = weapon;
    }

    update() {

        // move herding hitbox lines
        this.leftLine.x1 = this.x - this.displayWidth / 2;
        this.leftLine.x2 = this.x - this.displayWidth / 2 - 50;
        this.leftLine.y1 = this.y;
        this.leftLine.y2 = this.y;

        this.rightLine.x1 = this.x + this.displayWidth / 2;
        this.rightLine.x2 = this.x + this.displayWidth / 2 + 50;
        this.rightLine.y1 = this.y;
        this.rightLine.y2 = this.y;

        // debug: display hitboxes
        /*this.graphics.clear();
        
        this.graphics.strokeLineShape(this.leftLine);
        this.graphics.strokeRectShape(this.hurtbox);
        this.graphics.strokeLineShape(this.rightLine);*/

        // move hurtbox
        this.hurtbox.left = this.x - this.displayWidth / 2 - 20;
        this.hurtbox.right = this.x + this.displayWidth / 2 + 20;
        this.hurtbox.top = this.y - this.displayHeight / 2 - 20;
        this.hurtbox.bottom = this.y + this.displayHeight / 2 + 20;

        if (this.weapon != null) {
            this.weapon.update();
        }

        if (this.getMoveSum() != this.xIndex) {
            this.showPossibleMoves();
        }
    }

    addToMoveCycle() {
        this.moving = true;
    }

    getMoveSum() {
        let sum = this.xIndex;
        for (let move of this.moves) {
            if (move == "left") {
                sum--;
            }
            if (move == "right") {
                sum++;
            }
        }
        return sum;
    }

    addMove(dir) {
        this.moves.shift();
        this.moves.push(dir);
    }

    knowsDestination() {
        let flag = true;
        for (let move of this.moves) {
            if (move == "any") {
                flag = false;
            }
        }
        return flag;
    }

    resetMoves() {
        if (Object.hasOwn(this, "moveChain")) {
            delete this.moveChain;
        }
        this.moves = ["any", "any", "any"];
    }

    // calculates all possible enemy moves considering the current contents
    //     of this.moves and the number of remaining hops this turn.
    // If the destination nodes include nodes from multiple separate columns,
    //     then they are highlighted in yellow.
    // If all possible destinations are in the same column,
    //     then they are highlighted in red.
    showPossibleMoves() {
        // determine interval of columns that the enemy could end up in
        let leftIndex = this.xIndex - (this.moves.length - this.moveIndex);
        let rightIndex = this.xIndex + (this.moves.length - this.moveIndex);

        // adjust possible column and row range based on contents of this.moves
        let vertMoves = (this.moves.length - this.moveIndex);
        for (let i = this.moveIndex; i < this.moves.length; i++) {
            if (this.moves.at(i) === "right") {
                leftIndex += 2;
                vertMoves--;
            }
            else if (this.moves.at(i) === "left") {
                rightIndex -= 2;
                vertMoves--;
            }
            if (leftIndex < 0) {
                leftIndex = 0;
            }
            else if (rightIndex >= this.scene.path.sprites.length) {
                rightIndex = this.scene.path.sprites.length - 1;
            }
        }

        for (leftIndex; leftIndex <= rightIndex; leftIndex++) {
            // evil hexagon grid math
            let topHexOffset = Math.floor((Math.abs(this.xIndex - leftIndex) + (this.xIndex + 1) % 2) / 2);
            if (this.moveIndex == 0) {
                topHexOffset += 1;
            }
            let botHexOffset = Math.floor((Math.abs(this.xIndex - leftIndex) + this.xIndex % 2) / 2);
            let vertOffset = Math.max(Math.floor(((this.moves.length - this.moveIndex) - Math.abs(this.xIndex - leftIndex) + 1 - vertMoves) / 2), 0);

            // highlight nodes
            for (let currYIndex = Math.max(this.yIndex - (this.moves.length - this.moveIndex) + topHexOffset + vertOffset, 0);
                 currYIndex <= Math.min(this.yIndex + (this.moves.length - this.moveIndex) - botHexOffset - vertOffset, this.scene.path.sprites[0].length - 1);
                 currYIndex++) {
                if (vertMoves == 0) {
                    this.scene.path.sprites[leftIndex][currYIndex].makeSure();
                }
                else {
                    this.scene.path.sprites[leftIndex][currYIndex].makeMaybe();
                }
            }

            // the evil hexagon grid math is extremely close to displaying all possible moves for any given combo. There is one edge case that I know of. This if/else statement handles that.
            if (rightIndex == this.xIndex + (this.moves.length - this.moveIndex) - 2 && (this.moves.length - this.moveIndex) == 3) { // the array is ["left", "any", "any"] in some order
                if (this.xIndex < this.scene.path.sprites.length - 1 && this.yIndex - (this.xIndex) % 2 > 0) { // if the upper edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex + 1][this.yIndex - 1 - (this.xIndex) % 2].makeNoIfUnsure();
                }
                if (this.xIndex < this.scene.path.sprites.length - 1 && this.yIndex + 2  + (this.xIndex + 1) % 2 < this.scene.path.sprites[0].length) { // if the lower edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex + 1][this.yIndex + 2 + (this.xIndex + 1) % 2].makeNoIfUnsure();
                }
            }
            else if (vertMoves == 2 && (this.moves.length - this.moveIndex) == 3) { // the array is ["right", "any", "any"] in some order
                if (this.xIndex > 0 && this.yIndex - (this.xIndex) % 2 > 0) { // if the upper edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex - 1][this.yIndex - 1 - (this.xIndex) % 2].makeNoIfUnsure();
                }
                if (this.xIndex > 0 && this.yIndex + 2 + (this.xIndex + 1) % 2 < this.scene.path.sprites[0].length) { // if the lower edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex - 1][this.yIndex + 2 + (this.xIndex + 1) % 2].makeNoIfUnsure();
                }
            }
        }
    }

    getValidMove(index) {
        let validMoves = [];
        //let moveNames = [];
        let dirs = ["leftUp", "leftDown", "down", "rightDown", "rightUp", "up"];
        let connections = this.scene.path.sprites[this.xIndex][this.yIndex].getConnections();
        let lowIndex = -1;
        let highIndex = -1;
        switch(this.moves.at(index)) {
            case "left":
                lowIndex = 0;
                highIndex = 1;
                if (index == 0) {
                    lowIndex = 1;
                }
                break;
            case "right":
                lowIndex = 3;
                highIndex = 4;
                if (index == 0) {
                    highIndex = 3;
                }
                break;
            default:
                lowIndex = 0;
                highIndex = 5;
                if (index == 0) {
                    lowIndex = 1;
                    highIndex = 3;
                }
                break;
        }
        for (let i = lowIndex; i <= highIndex; i++) {
            if (connections[dirs[i]]) {
                validMoves.push(connections[dirs[i]]);
                //moveNames.push(dirs[i]);
            }
        }
        if (validMoves.length == 0) {
            console.log("No valid moves!");
        }
        /*else {
            let log = "";
            for (let name of moveNames) {
                log += name + ", ";
            }
            console.log(log);
        }
        let finalMoveIndex = Math.floor(Math.random() * validMoves.length);
        console.log("moving", moveNames[finalMoveIndex]);*/
        return validMoves[/*finalMoveIndex*/Math.floor(Math.random() * validMoves.length)];
    }

    // move cycle takes (this.speed * 3) frames to execute.
    move() {
        // if the enemy is done moving
        if (this.moveIndex >= this.moves.length) {
            this.moveIndex = 0;
            if (/*this.yIndex < this.oldYIndex*/true) {
                this.weapon.attack(this.scene.my.sprite.player.pos);
            }
            this.resetMoves();
            return;
        }
        // if the enemy is at the very bottom of the map
        if (this.yIndex == this.scene.path.sprites[0].length - 1 && this.xIndex % 2 == 0) {
            this.moving = false;
            this.atBottom();
            return;
        }
        // if the enemy just started moving
        if (this.moveIndex == 0) {
            this.oldYIndex = this.yIndex;
        }
        this.showPossibleMoves();

        let node = this.getValidMove(this.moveIndex);

        let rotAngle = Phaser.Math.Angle.Between(this.x, this.y, node.x, node.y) + Math.PI / 2;
        if (Math.abs(rotAngle - this.rotation) > Math.PI) {
            rotAngle = Math.sign(rotAngle) * -2 * Math.PI + rotAngle;
        }

        this.moveChain = this.scene.tweens.chain({
            targets: this,
            tweens: [
                {
                    rotation: rotAngle,
                    duration: this.scene.enemySpeed / 4,
                    ease: 'Exp.easeInOut'
                },
                {
                    x: node.x,
                    y: node.y,
                    duration: 3 * this.scene.enemySpeed / 4,
                    ease: 'Quad.easeOut'
                }
            ],
            callbackScope: this,
            onComplete: () => {
                this.move();
            }
        });

        this.updateXIndex(node.xIndex);
        this.yIndex = node.yIndex;
        this.moveIndex++;
    }

    updateXIndex(newIndex) {
        delete this.scene.enemies[this.xIndex][this.sceneIndex.toString()];
        this.scene.enemies[newIndex][this.sceneIndex.toString()] = this;
        this.xIndex = newIndex;
    }

    atBottom() {
        this.scene.my.sprite.player.health -= 10;
        this.kill();
    }

    kill() {
        if (Object.hasOwn(this, "moveChain")) {
            this.moveChain.stop();
            this.moveChain.destroy();
        }
        delete this.scene.enemies[this.xIndex][this.sceneIndex.toString()];
        this.graphics.destroy();
        if (Object.hasOwn(this.weapon, "firingAnim")) {
            this.weapon.firingAnim.stop();
            this.weapon.firingAnim.destroy();
        }
        this.scene.numLivingEnemies--;
        this.weapon.targetGeom.clear();
        this.weapon.targetGeom.destroy();
        this.weapon.destroy();
        this.destroy();
    }
}