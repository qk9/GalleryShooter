class Title extends Phaser.Scene {
    constructor() {
        super("title");
    }

    preload() {
        this.load.setPath("./assets/");

        // player's tank
        this.load.image("playerBody", "Tanks/tankBlack.png");
        this.load.image("playerGun", "Obstacles/barrelGrey_side.png");
        this.load.audio("gunWeakShotSound", "Sounds/laserSmall_003.ogg")

        // parts of strong gun
        this.load.image("gunStrongArm", "Tanks/barrelBlack_outline.png");
        this.load.image("gunStrongJoint", "Obstacles/oil.png");
        this.load.image("gunStrongBarrel", "Obstacles/barrelGrey_side.png");
        this.load.audio("gunStrongShotSound", "Sounds/laserLarge_001.ogg");

        // parts of firing clock
        this.load.image("clockFaceUnready", "Obstacles/barrelGrey_up.png");
        this.load.image("clockFaceReady", "Obstacles/barrelRed_up.png");
        this.load.image("clockHandUnready", "Tanks/barrelBlack.png");
        this.load.image("clockHandReady", "Tanks/barrelBeige.png");

        // enemy tanks
        this.load.image("enemyBody", "Tanks/tankBeige.png");
        this.load.image("enemyGun", "Tanks/barrelBeige_outline.png");
        this.load.image("enemySniperBody", "Tanks/tankRed.png");
        this.load.image("enemySniperGun", "Tanks/barrelRed_outline.png");
        this.load.audio("enemyShootSound", "Sounds/laserSmall_001.ogg");
        this.load.audio("enemyDeathSound", "Sounds/explosionCrunch_000.ogg");

        // enemy death explosion
        this.load.image("explosion", "Smoke/smokeOrange0.png");

        // player's fortress
        this.load.image("sandbag", "Obstacles/sandbagBeige.png");
        this.load.image("tracks", "Tanks/tracksSmall.png");

        // background
        this.load.image("sand", "Environment/sand.png");
        this.load.image("dirt", "Environment/dirt.png");

        // enemy pathway nodes
        this.load.image("pathNo", "Smoke/smokeGrey1.png");
        this.load.image("pathMaybe", "Smoke/smokeYellow1.png");
        this.load.image("pathSure", "Smoke/smokeOrange1.png");
    }

    create() {
        this.init_title();
    }

    init_title() {
        // set constants
        this.my = {sprite: {}};
        this.path = {sprites: []};

        let gameWidth = game.config.width - 100;

        // player positions
        this.playerY = game.config.height - 150;
        this.playerSpeed = 1;
        this.playerHealth = 20;
        this.playerScore = 0;
        this.positions = [
                          50, 
                          gameWidth / 5 + 50,
                          2 * gameWidth / 5 + 50,
                          3 * gameWidth / 5 + 50,
                          4 * gameWidth / 5 + 50,
                          gameWidth + 50
                         ];

        this.sandbagY = this.playerY - 80;

        // path node constants
        this.pathColumns = 15;
        this.pathRows = 10;
        this.pathHorizLeftBuffer = 50;
        this.pathHorizSpacing = (game.config.width - (2 * this.pathHorizLeftBuffer)) / (this.pathColumns - 1);
        this.pathVertTopBuffer = 10;
        this.pathVertSpacing = (this.sandbagY - this.pathVertTopBuffer) / this.pathRows;

        // strong gun stats
        this.gunStrongX = game.config.width / 2;
        this.gunStrongY = game.config.height;
        this.gunStrongCooldown = 4000;
        
        // enemy stats
        this.enemyIndex = 0;

        this.enemySpeed = 750;
        this.enemyMoveGap = 4000;

        this.enemyCycleTime = this.enemyMoveGap + 3 * this.enemySpeed;

        // create keybinds
        this.tutorialKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
        this.playKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.tutorialKey.on("down", () => {this.scene.start("intro")});
        this.playKey.on("down", () => {this.scene.start("galleryShooter")});

        // create background
        for(let currX = 64; currX < game.config.width; currX += 128) {
            for(let currY = this.sandbagY - 64; currY > -64; currY -= 128) {
                this.add.sprite(currX, currY, "dirt");
            }
            for(let currY = this.sandbagY + 64; currY < game.config.height; currY += 128) {
                this.add.sprite(currX, currY, "sand");
            }
        }

        // create cover
        let currX = 0;
        while (currX < game.config.width) {
            this.add.sprite(currX + 22, this.sandbagY, "sandbag");
            currX += 66;
        }

        // create player movement rails
        currX = 0;
        while(currX < game.config.width) {
            this.currTracks = this.add.sprite(currX + 30, this.playerY, "tracks");
            this.currTracks.angle = 90;
            currX += 114;
        }
        for (let i = 0; i < this.positions.length; i++) {
            this.currOil = this.add.sprite(this.positions[i], this.playerY, "pathMaybe");
            this.currOil.setScale(0.1, 0.1);
        }

        // create pathway nodes
        for (let i = 0; i < this.pathColumns; i++) {
            let column = [];
            this.path.sprites.push(column);
            for(let j = 0; j < this.pathRows; j++) {
                this.path.sprites[i].push(new PathNode(this, i, j, "pathMaybe", null));
                this.path.sprites[i][j].makeNo();
            }
        }

        // create player
        this.my.sprite.player = new Player(this, 
                                           this.positions[2], this.playerY, 
                                           this.playerSpeed, this.positions, 2,
                                           this.playerHealth,
                                           "playerBody", null, 
                                           this.leftKey, this.rightKey);
        this.my.sprite.player.angle = 90;

        this.my.sprite.gunWeak = new GunWeak(this, 
                                             this.my.sprite.player.x, this.my.sprite.player.y,
                                             "playerGun", null,
                                             this.my.sprite.player);
        this.gunWeakSound = this.sound.add("gunWeakShotSound", {volume: 0.8});
        
        this.shootStrongKey = "L";
        this.my.sprite.gunStrong = new GunStrong(this, 
                                                 this.gunStrongX, this.gunStrongY,
                                                 this.positions,
                                                 "gunStrongJoint", "gunStrongArm", "gunStrongBarrel", null,
                                                 this.shootStrongKey, this.gunStrongCooldown);
        this.gunStrongShotSound = this.sound.add("gunStrongShotSound");

        this.moveTimeline = this.add.timeline([
            {
                at: this.enemyCycleTime / 2,
                run() {
                    for(let column of this.scene.enemies) {
                        for (let enemy in column) {
                            if (column[enemy].moving && !Object.hasOwn(column[enemy], "moveChain")) {
                                column[enemy].move();
                            }
                        }
                    }
                }
            },
            {
                at: this.enemyCycleTime,
                run() {
                }
            }
        ]);
        this.moveTimeline.play();

        if (this.enemies) {
            for (let column of this.enemies) {
                for (let enemy in column) {
                    column[enemy].kill();
                }
            }
        }
        this.enemies = [];
        for (let i = 0; i < this.pathColumns; i++) {
            this.enemies.push({});
        }
        
        this.explosions = [];

        // store number of living enemies for next-wave rollover
        this.numLivingEnemies = 0;


        this.explainerText = this.add.text(game.config.width / 2 - 375, game.config.height / 2 - 390, 'Heavy Armor Herding\nby Iain Rogers\n\n[T] - view tutorial\n\n[SPACE] - play!', {fontSize: 64, strokeThickness: 5, align: 'center', fill: 'black', stroke: 'black'});
        this.my.sprite.player.moveTo(Math.floor(Math.random() * this.positions.length));

        this.moveSign = 1;
        this.my.sprite.gunStrong.moveToSlow((game.config.width / 2) + Math.floor(Math.random() * 350 * this.moveSign));
        this.moveSign *= -1;

        // animations
        var timer = this.time.addEvent({
            delay: 4000, // ms
            callback: () => {this.my.sprite.player.moveTo(Math.floor(Math.random() * this.positions.length))},
            callbackScope: this,
            loop: true
        });

        var timer2 = this.time.addEvent({
            delay: 8000, // ms
            callback: () => {this.my.sprite.gunStrong.moveToSlow((game.config.width / 2) + Math.floor(Math.random() * 350 * this.moveSign)); this.moveSign *= -1;},
            callbackScope: this,
            loop: true
        });
        
    }

    update() {
        this.my.sprite.gunWeak.update();
        this.my.sprite.gunStrong.update();
    }
}