class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("galleryShooter");
        this.my = {sprite: {}};

        this.playerY = game.config.height - 150;
        this.playerSpeed = 1;
        this.positions = [50, game.config.width / 4, game.config.width / 2, game.config.width * 3 / 4, game.config.width - 50];
    }
    
    preload() {
        this.load.setPath("./assets/")
        this.load.atlasXML("bodyParts", "spritesheet_default.png", "spritesheet_default.xml");
        this.load.image("playerBody", "tankBlue.png");
    }

    create() {

        //this.my.testSprite = this.add.sprite(500, 500, "playerBody");

        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.prepShootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.shootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.my.sprite.player = new Player(this, 
                                      this.positions[2], this.playerY, 
                                      this.playerSpeed, this.positions, 2,
                                      "playerBody", null, 
                                      this.leftKey, this.rightKey, 
                                      this.prepShootStrongKey, this.shootStrongKey);
        
    }

    update() {
        this.my.sprite.player.update();
    }
}