class EnemySniper extends Phaser.GameObjects.Sprite {
    constructor(scene,
                x, y,
                path,
                texture, frame,
                index) {
        super(scene,
              x * scene.pathHorizSpacing + scene.pathHorizLeftBuffer, 
              y * scene.pathVertSpacing + scene.pathVertTopBuffer + ((x + 1) % 2 * scene.pathVertSpacing / 2) - 100,
              texture, frame);

        this.xIndex = x;
        this.yIndex = y;

        this.sceneIndex = index;


        scene.add.existing(this);
        return this;
        }
}