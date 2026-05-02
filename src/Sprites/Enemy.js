class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y,
                speed,
                texture, frame) {
        super(scene,
              x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer, 
              y * scene.pathVertSpacing + scene.pathVertTopBuffer + ((x + 1) % 2 * scene.pathVertSpacing / 2),
              texture, frame);

        this.xIndex = x;
        this.yIndex = y;

        //this.x = x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer;
        //this.y = y * scene.pathVertSpacing + scene.pathVertTopBuffer + ((x + 1) % 2 * scene.pathVertSpacing / 2);
        this.speed = speed;
        this.moves = ["any", "any", "any"];

        this.leftLine = new Phaser.Geom.Line(this.x - this.displayWidth / 2, this.y,
                                             this.x - this.displayWidth / 2 - 150, this.y);
        this.rightLine = new Phaser.Geom.Line(this.x + this.displayWidth / 2, this.y,
                                              this.x + this.displayWidth / 2 + 150, this.y);
        this.hurtbox = new Phaser.Geom.Rectangle.FromXY(this.x - this.displayWidth / 2,
                                                        this.y - this.displayHeight / 2,
                                                        this.x + this.displayWidth / 2,
                                                        this.y + this.displayHeight / 2);

        this.setScale(0.5, 0.5);
        
        scene.add.existing(this);
        return this;
    }

    update() {
        this.x = this.scene.path.sprites[this.xIndex][this.yIndex].x;
        this.y = this.scene.path.sprites[this.xIndex][this.yIndex].y;
    }

    getMoveSum() {
        let sum = 0;
        for (let move in this.moves) {
            if (move === "left") {
                sum--;
            }
            if (move === "right") {
                sum++;
            }
        }
        return sum;
    }

    addMove(dir) {
        this.moves.shift();
        this.moves.push(dir);
    }

    resetMoves() {
        this.moves = ["any", "any", "any"];
    }

    // calculates all possible enemy moves considering the current contents of this.moves and highlights the possible destination PathNodes.
    // If the destinations lay in multiple separate columns, then they are highlighted in yellow.
    // If all possible destinations are in the same column, then they are highlighted in red.
    showPossibleMoves(radius) {
        // determine interval of columns that the enemy could end up in
        let leftIndex = this.xIndex - radius;
        let rightIndex = this.xIndex + radius;
        let vertMoves = 3;
        for (let move of this.moves) {
            if (move === "right") {
                leftIndex += 2;
                vertMoves--;
            }
            else if (move === "left") {
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
            let botHexOffset = Math.floor((Math.abs(this.xIndex - leftIndex) + this.xIndex % 2) / 2);

            let vertOffset = Math.max(Math.floor((radius - Math.abs(this.xIndex - leftIndex) + 1 - vertMoves) / 2), 0);

            for (let currYIndex = Math.max(this.yIndex - radius + topHexOffset + vertOffset + 1, 0);
                 currYIndex <= Math.min(this.yIndex + radius - botHexOffset - vertOffset, this.scene.path.sprites[0].length - 1);
                 currYIndex++) {
                if (vertMoves == 0) {
                    this.scene.path.sprites[leftIndex][currYIndex].makeSure();
                }
                else {
                    this.scene.path.sprites[leftIndex][currYIndex].makeMaybe();
                }
            }

            // the evil hexagon grid math is extremely close to displaying all possible moves for any given combo. There is one edge case that I know of. This if/else statement handles that.
            if (rightIndex == this.xIndex + radius - 2) { // the array is ["left", "any", "any"] in some order
                if (this.xIndex < this.scene.path.sprites.length - 1 && this.yIndex - (this.xIndex) % 2 > 0) { // if the upper edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex + 1][this.yIndex - 1 - (this.xIndex) % 2].hideIfUnsure();
                }
                if (this.xIndex < this.scene.path.sprites.length - 1 && this.yIndex + 2  + (this.xIndex + 1) % 2 < this.scene.path.sprites[0].length) { // if the lower edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex + 1][this.yIndex + 2 + (this.xIndex + 1) % 2].hideIfUnsure();
                }
            }
            else if (vertMoves == 2) { // the array is ["right", "any", "any"] in some order
                if (this.xIndex > 0 && this.yIndex - (this.xIndex) % 2 > 0) { // if the upper edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex - 1][this.yIndex - 1 - (this.xIndex) % 2].hideIfUnsure();
                }
                if (this.xIndex > 0 && this.yIndex + 2 + (this.xIndex + 1) % 2 < this.scene.path.sprites[0].length) { // if the lower edge case node exists, then unhighlight it
                    this.scene.path.sprites[this.xIndex - 1][this.yIndex + 2 + (this.xIndex + 1) % 2].hideIfUnsure();
                }
            }
        }
    }

    move() {

    }
}