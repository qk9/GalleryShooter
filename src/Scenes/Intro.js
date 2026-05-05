class Intro extends Phaser.Scene {
    constructor() {
        super("intro");
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
        this.init_tutorial();
    }

    init_tutorial() {
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
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.shootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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
        
        this.my.sprite.gunStrong = new GunStrong(this, 
                                                 this.gunStrongX, this.gunStrongY,
                                                 this.positions,
                                                 "gunStrongJoint", "gunStrongArm", "gunStrongBarrel", null,
                                                 this.shootStrongKey, this.gunStrongCooldown);
        this.gunStrongShotSound = this.sound.add("gunStrongShotSound");

        this.input.on('pointerdown', () => {this.my.sprite.gunWeak.fire();
            this.shootKeysPressed[0] = true;
        });
        
        // load enemy data
        this.enemyShootSound = this.sound.add("enemyShootSound");
        this.enemyDeathSound = this.sound.add("enemyDeathSound", {volume: 0.6});
        // create enemy storage
        // enemies stored by current column for collision detection
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

        // create enemy turn timeline
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

        this.moveKeysPressed = [false, false];
        this.shootKeysPressed = [false, false];
        this.tutorialStage = 0;
        this.leftKey.on("down", () => {this.moveKeysPressed[0] = true;})
        this.rightKey.on("down", () => {this.moveKeysPressed[1] = true;})
        this.explainerText = this.add.text(game.config.width / 2 - 375, game.config.height / 2 - 400, "Welcome!\nUse A and D to move.", {fontSize: 64, strokeThickness: 5, align: 'center', fill: 'black', stroke: 'black'});
    }

    update() {
        // update player bodies
        this.my.sprite.player.update();
        this.my.sprite.gunWeak.update();
        this.my.sprite.gunStrong.update();
        this.clearPathNodes();
        // update enemies
        for(let column of this.enemies) {
            for (let enemy in column) {
                column[enemy].update();
            }
        }
        if (this.moveKeysPressed[0] && this.moveKeysPressed[1] && this.tutorialStage == 0) {
            this.tutorialStage = 1;
            this.explainerText.text = "Use left click to shoot.";
            this.explainerText.x = game.config.width / 2 - 450;
        }
        if (this.shootKeysPressed[0] && this.tutorialStage == 1) {
            this.tutorialStage = 2;
            this.explainerText.text = "Use [SPACE] to shoot\nyour cannon.";
            this.explainerText.x = game.config.width / 2 - 375;
            this.shootStrongKey.on("down", () => {this.shootKeysPressed[1] = true;});
        }
        if (this.shootKeysPressed[0] && this.shootKeysPressed[1] && this.tutorialStage == 2) {
            this.time.addEvent({
                delay: this.my.sprite.gunStrong.movementTime * 6.25 + 1000,
                callback: () => {
                    this.testEnemy = this.summonEnemyInColumn(7)
                    this.testEnemy.yIndex = 4;
                    this.shootKeysPressed = [false, false];
                    this.explainerText.text = "An enemy has appeared!\nTry shooting near it\nwith left click.";
                    this.explainerText.x = game.config.width / 2 - 425;},
                callbackScope: this,

            });
            this.my.sprite.gunStrong.fireKey = "L";
            this.tutorialStage = 3;
        }
        if (this.tutorialStage == 3 && this.numLivingEnemies == 1 && this.enemies[7]["0"].getMoveSum() != 7) {
            this.explainerText.text = "Notice that some Pathway\n nodes near the enemy \nhave turned yellow.";
            this.explainerText.x = game.config.width / 2 - 475;
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.explainerText.text = "These yellow nodes show\nwhere the enemy might land\nafter its next move.";
                    this.explainerText.x = game.config.width / 2 - 505;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 6000,
                callback: () => {
                    this.explainerText.text = "Since you shot to the\n";
                    if (this.enemies[7]["0"].getMoveSum() < 7) {
                        this.explainerText.text += "right ";
                    }
                    else {
                        this.explainerText.text += "left ";
                    }
                    this.explainerText.text += "of the enemy, it's\nlikely to move more ";
                    if (this.enemies[7]["0"].getMoveSum() < 7) {
                        this.explainerText.text += "left.";
                    }
                    else {
                        this.explainerText.text += "right.";
                    }
                    this.explainerText.x = game.config.width / 2 - 500;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 9000,
                callback: () => {
                    this.explainerText.text = "Try shooting at it\na few more times!";
                this.explainerText.x = game.config.width / 2 - 350;
            this.tutorialStage = 4;},
                callbackScope: this,

            });
            this.tutorialStage = 3.5;
        }
        if (this.tutorialStage == 4 && this.enemies[7]["0"].knowsDestination()) {
            this.explainerText.text = "Enemies hop to an adjacent\npathway node three times\nwhen they move.";
            this.explainerText.x = game.config.width / 2 - 500;
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.explainerText.text = "Each time you shoot near an\nenemy with your tank's gun,\none move is influenced.";
                    this.explainerText.x = game.config.width / 2 - 525;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 6000,
                callback: () => {
                    this.explainerText.text = "Since you've shot near it\nthree times, you've\ninfluenced all of its moves.";
                    this.explainerText.x = game.config.width / 2 - 550;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 9000,
                callback: () => {
                    this.explainerText.text = "Now, let's see where\nit ends up!";
                    this.explainerText.x = game.config.width / 2 - 350;
                    this.moveTimeline.play();},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 13000,
                callback: () => {
                    this.tutorialStage = 5;
                    this.my.sprite.gunStrong.fireKey = this.shootStrongKey;},
                callbackScope: this,

            });
            this.tutorialStage = 4.5;
        }
        if (this.tutorialStage == 5 && this.testEnemy.moveIndex == 0) {
            this.explainerText.text = "As you've probably noticed,\nyour tank's gun is too\nweak to kill enemies."
            this.explainerText.x = game.config.width / 2 - 510;
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.explainerText.text = "Your cannon, though, is\na different story. Try that\none! (Remember, [SPACE]).";
                    this.explainerText.x = game.config.width / 2 - 525;},
                callbackScope: this,

            });
            this.tutorialStage = 5.5;
        }
        if (this.tutorialStage == 5.5 && this.numLivingEnemies == 0) {
            this.tutorialStage = 6;
        }
        if (this.tutorialStage == 6) {
            this.explainerText.text = "Great job!\nOne last thing:"
            this.explainerText.x = game.config.width / 2 - 275;
            this.time.addEvent({
                delay: 3000,
                callback: () => {
                    this.explainerText.text = "Notice that the clock on\nyour cannon has started.";
                    this.explainerText.x = game.config.width / 2 - 475;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 6000,
                callback: () => {
                    this.explainerText.text = "If you press shoot when\nthe hand is aligned with\nthe mark at the top,";
                    this.explainerText.x = game.config.width / 2 - 475;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 9000,
                callback: () => {
                    this.explainerText.text = "then the cannon will fire\njust after the enemies\nhave finished moving.";
                    this.explainerText.x = game.config.width / 2 - 475;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 12000,
                callback: () => {
                    this.explainerText.text = "The cannon needs to\nrecharge for a while\nafter firing.";
                    this.explainerText.x = game.config.width / 2 - 400;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 15000,
                callback: () => {
                    this.explainerText.text = "When the clock turns\nfrom gray to orange,\nyou can shoot again!";
                    this.explainerText.x = game.config.width / 2 - 375;},
                callbackScope: this,

            });
            this.time.addEvent({
                delay: 18000,
                callback: () => {
                    this.explainerText.text = "Best of luck!\nPress [SPACE] to start.";
                    this.explainerText.x = game.config.width / 2 - 350;
                    this.tutorialStage = 7;
                    this.shootStrongKey.on("down", () => {this.scene.start("galleryShooter")});},
                callbackScope: this,

            });
            this.tutorialStage = 6.5;
        }
    }

    // summon an enemy at the top of the given column.
    summonEnemyInColumn(col) {
        this.enemies[col][this.enemyIndex.toString()] = new Enemy(this, col, 4, "enemyBody", null, this.enemyIndex);
        this.enemies[col][this.enemyIndex.toString() - 1].setWeapon(new EnemyWeapon(this, 0, 0,
                                                                                    this.enemies[col][this.enemyIndex.toString() - 1],
                                                                                    (this.enemyMoveGap - 300) / 2,
                                                                                    "enemyGun", null));
        this.numLivingEnemies++;
        return this.enemies[col][(this.enemyIndex - 1).toString()];
    }

    clearPathNodes() {
        for (let nodeArray of this.path.sprites) {
            for(let node of nodeArray) {
                node.makeNo();
            }
        }
    }
}