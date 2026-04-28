class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("galleryShooter");
        this.my = {sprite: {}};

        this.playerY = game.config.height - 150;
        this.playerSpeed = 1;
        this.positions = [50, game.config.width / 4, game.config.width / 2, game.config.width * 3 / 4, game.config.width - 50];

        this.sandbagY = this.playerY - 80;

        this.gunStrongX = game.config.width / 2;
        this.gunStrongY = game.config.height;
    }
    
    preload() {
        this.load.setPath("./assets/")

        this.load.image("playerBody", "Tanks/tankRed.png");
        this.load.image("playerGun", "Tanks/barrelRed_outline.png");

        this.load.image("gunStrongArm", "Tanks/barrelBlack_outline.png");
        this.load.image("gunStrongJoint", "Obstacles/oil.png");
        this.load.image("gunStrongBarrel", "Obstacles/barrelGrey_side.png");

        this.load.image("sandbag", "Obstacles/sandbagBeige.png");
        this.load.image("tracks", "Tanks/tracksSmall.png");

        this.load.image("sand", "Environment/sand.png");
        this.load.image("dirt", "Environment/dirt.png");
    }

    create() {

        // create keybinds
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.prepShootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.shootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // temp, for testing
        this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

        // create background
        for(let currX = 64; currX < game.config.width; currX += 128) {
            for(let currY = this.sandbagY - 64; currY > 0; currY -= 128) {
                this.add.sprite(currX, currY, "sand");
            }
            for(let currY = this.sandbagY + 64; currY < game.config.height; currY += 128) {
                this.add.sprite(currX, currY, "dirt");
            }
        }

        // create cover
        let currX = 0;
        while (currX < game.config.width) {
            this.add.sprite(currX + 22, this.sandbagY, "sandbag");
            currX += 66;
        }

        // create rails
        currX = 0;
        while(currX < game.config.width) {
            this.currTracks = this.add.sprite(currX + 30, this.playerY, "tracks");
            this.currTracks.angle = 90;
            currX += 114;
        }

        // create player
        this.my.sprite.player = new Player(this, 
                                      this.positions[2], this.playerY, 
                                      this.playerSpeed, this.positions, 2,
                                      "playerBody", null, 
                                      this.leftKey, this.rightKey);
        this.my.sprite.player.angle = 90;

        this.my.sprite.gunWeak = new GunWeak(this, 
                                             this.my.sprite.player.x, this.my.sprite.player.y,
                                             "playerGun", null,
                                             this.my.sprite.player);
        
        this.my.sprite.gunStrong = new GunStrong(this, 
                                                 this.gunStrongX, this.gunStrongY,
                                                 this.positions,
                                                 "gunStrongJoint", "gunStrongArm", "gunStrongBarrel", null,
                                                this.mKey, this.shootStrongKey);
        
        this.input.on('pointerdown', this.my.sprite.gunWeak.fire);
        
    }

    update() {
        this.my.sprite.player.update();
        this.my.sprite.gunWeak.update();
        this.my.sprite.gunStrong.update();
    }
}