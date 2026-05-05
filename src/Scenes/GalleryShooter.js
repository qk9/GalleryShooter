class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("galleryShooter");
    }
    
    preload() {
        this.load.setPath("./assets/");

        // player's tank
        this.load.image("playerBody", "Tanks/tankBlack.png");
        this.load.image("playerGun", "Obstacles/barrelGrey_side.png");

        // parts of strong gun
        this.load.image("gunStrongArm", "Tanks/barrelBlack_outline.png");
        this.load.image("gunStrongJoint", "Obstacles/oil.png");
        this.load.image("gunStrongBarrel", "Obstacles/barrelGrey_side.png");

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
        this.init_game();
    }

    init_game() {
        // set constants
        
        this.my = {sprite: {}};
        this.path = {sprites: []};

        let gameWidth = game.config.width - 100;

        // player positions
        this.playerY = game.config.height - 150;
        this.playerSpeed = 1;
        this.playerHealth = 3;
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
        this.prepShootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.shootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // create background
        for(let currX = 64; currX < game.config.width; currX += 128) {
            for(let currY = this.sandbagY - 64; currY > 0; currY -= 128) {
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
        
        this.my.sprite.gunStrong = new GunStrong(this, 
                                                 this.gunStrongX, this.gunStrongY,
                                                 this.positions,
                                                 "gunStrongJoint", "gunStrongArm", "gunStrongBarrel", null,
                                                 this.shootStrongKey, this.gunStrongCooldown);
        
        this.input.on('pointerdown', this.my.sprite.gunWeak.fire);
        
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
            },
            { // for testing
                at: this.enemyCycleTime,
                run() {
                    this.scene.summonEnemyInColumn(Math.floor(Math.random() * this.scene.pathColumns))
                }
            }
        ]);
        this.moveTimeline.play();

        // ui
        this.healthText = this.add.text(10, game.config.height - 10 - 32, "Health: " + this.playerHealth, {fontSize: 32, strokeThickness: 3, fill: 'black', stroke: 'black'});
        this.gameOverText = null;
        this.restartKey = null;

        // for testing
        //this.testEnemy = this.summonEnemyInColumn(4);
    }

    update(time, delta) {
        if (this.my.sprite.player.health > 0) {
            this.my.sprite.player.update();
            this.my.sprite.gunWeak.update();
            this.my.sprite.gunStrong.update();
            this.clearPathNodes();
            for(let column of this.enemies) {
                for (let enemy in column) {
                    column[enemy].update();
                }
            }
            if (this.moveTimeline.complete) {
                this.moveTimeline.play(true);
            }
            this.healthText.text = "Health: " + this.my.sprite.player.health;
            if (this.my.sprite.gunStrong.x < 300 && this.healthText.x == 10) {
                this.healthText.x = 350;
            }
            else if (this.my.sprite.gunStrong.x >= 300 && this.healthText.x == 350) {
                this.healthText.x = 10;
            }
        }
        else if (this.gameOverText == null) { // game is over
            this.gameOverText = this.add.text(game.config.width / 2 - 350, game.config.height / 2 - 400, "    Game over!\nPress R to restart.", {fontSize: 64, strokeThickness: 5});
            this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            // freeze all enemies
            for (let column of this.enemies) {
                for (let enemy in column) {
                    if (Object.hasOwn(column[enemy], "moveChain")) {
                        column[enemy].moveChain.stop();
                    }
                    if (Object.hasOwn(column[enemy].weapon, "firingAnim")) {
                        column[enemy].weapon.firingAnim.stop();
                    }
                }
            }
            // stop enemy movement timeline
            this.moveTimeline.stop();
            this.healthText.text = "Health: 0";
        }
        else { // game has been over
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.init_game();
            }
        }
    }

    spawnWave(wave) {

    }

    // summon an enemy at the top of the given column.
    summonEnemyInColumn(col) {
        this.enemies[col][this.enemyIndex.toString()] = new Enemy(this, col, 0, "enemyBody", null, this.enemyIndex);
        this.enemies[col][this.enemyIndex.toString() - 1].setWeapon(new EnemyWeapon(this, 0, 0,
                                                                                    this.enemies[col][this.enemyIndex.toString() - 1],
                                                                                    (this.enemyMoveGap - 300) / 2,
                                                                                    "enemyGun", null));
        return this.enemies[col][(this.enemyIndex - 1).toString()];
    }

    increaseDifficulty() {
        if (this.enemyMoveGap > 500) {
            this.enemyMoveGap -= 250;
        }
        if (this.enemySpeed > 300) {
            this.enemySpeed -= 50;
        }
    }

    clearPathNodes() {
        for (let nodeArray of this.path.sprites) {
            for(let node of nodeArray) {
                node.makeNo();
            }
        }
    }
}