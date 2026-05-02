class PathNode extends Phaser.GameObjects.Sprite {

    // PathNodes will be stored at scene.path.sprites[this.xIndex, this.yIndex]

    constructor(scene, x, y,
                texture, frame) {
        super(scene, x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer, 
              y * scene.pathVertSpacing + scene.pathVertTopBuffer + ((x + 1) % 2 * scene.pathVertSpacing / 2),
              texture, frame);
        
        this.xIndex = x;
        this.yIndex = y;
        this.x = x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer;
        this.y = y * scene.pathVertSpacing + scene.pathVertTopBuffer +
                ((x + 1) % 2 * scene.pathVertSpacing / 2);

        this.setScale(0.1, 0.1);

        scene.add.existing(this);
        return this;
    }

    // resets path nodes after enemies finish moving
    hide() {
        this.setVisible(false);
        this.setTexture(this.scene.textures.get("pathMaybe"));
    }

    hideIfUnsure() {
        if (this.texture.key != "pathSure") {
            this.hide();
        }
    }

    makeMaybe() {
        if (this.texture.key != "pathSure") {
            this.visible = true;
            this.setTexture(this.scene.textures.get("pathMaybe"));
        }
    }

    makeSure() {
        this.visible = true;
        this.setTexture(this.scene.textures.get("pathSure"));
    }

    getConnections() {
        let connections = {};
        if (this.yIndex > 0) {
            connections.up = this.scene.path.sprites[this.xIndex][this.yIndex - 1];
        }
        else {
            connections.up = false;
        }
        if (this.yIndex + 1 < this.scene.path.sprites[0].length) {
            connections.down = this.scene.path.sprites[this.xIndex][this.yIndex + 1];
        }
        else {
            connections.down = false;
        }
        if (this.xIndex > 0) {
            if (this.yIndex - (this.xIndex % 2) > -1) {
            connections.leftUp = this.scene.path.sprites[this.xIndex - 1][this.yIndex - (this.xIndex % 2)];
            }
            else {
                connections.leftUp = false;
            }
            if (this.yIndex + ((this.xIndex + 1) % 2) < this.scene.path.sprites.length) {
                connections.leftDown = this.scene.path.sprites[this.xIndex - 1][this.yIndex + ((this.xIndex + 1) % 2)];
            }
            else {
                connections.leftDown = false;
            }
        }
        if (this.xIndex + 1 < this.scene.path.sprites.length) {
            if (this.yIndex - (this.xIndex % 2) > -1) {
            connections.rightUp = this.scene.path.sprites[this.xIndex + 1][this.yIndex - (this.xIndex % 2)];
            }
            else {
                connections.rightUp = false;
            }
            if (this.yIndex + ((this.xIndex + 1) % 2) < this.scene.path.sprites[0].length) {
                connections.rightDown = this.scene.path.sprites[this.xIndex + 1][this.yIndex + ((this.xIndex + 1) % 2)];
            }
            else {
                connections.rightDown = false;
            }
        }
        return connections;
    }
}