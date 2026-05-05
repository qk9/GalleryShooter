class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("galleryShooter");
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
        this.prepShootStrongKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
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
        
        this.input.on('pointerdown', this.my.sprite.gunWeak.fire);
        
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
        this.moveTimeline.play();

        // create enemy wave data
        // wave segments are stored arrays in children of this.waves.
        // to spawn a wave segment containing n enemies, access an element of this.waves[n.toString()]
        // format for wave segment array: [width of spawns, spawn0, spawn1, spawn2, ..., spawnN]
        this.waves = {};
        
        this.waves["1"] = [];
        // 1 enemy
        this.waves["1"].push([1, 0]);

        this.waves["2"] = [];
        // 2 adjacent enemies
        this.waves["2"].push([2, 0, 1]);
        // 2 slightly split enemies
        this.waves["2"].push([3, 0, 2]);
        // 2 decently split enemies
        this.waves["2"].push([7, 0, 6]);
        // 2 very split enemies
        this.waves["2"].push([15, 0, 14]);

        this.waves["3"] = [];
        // 3 adjacent enemies
        this.waves["3"].push([3, 0, 1, 2]);
        // 3 slightly split enemies
        this.waves["3"].push([5, 0, 2, 4]);
        // 3 decently split enemies
        this.waves["3"].push([11, 0, 5, 10]);
        // 3 very split enemies
        this.waves["3"].push([15, 0, 7, 14]);

        this.waves["4"] = [];
        // 4 adjacent enemies
        this.waves["4"].push([4, 0, 1, 2, 3]);
        // 4 slightly split enemies
        this.waves["4"].push([7, 0, 2, 4, 6]);
        // 4 very split enemies
        this.waves["4"].push([15, 0, 4, 10, 14]);

        // two groups of two adjacent
        this.waves["4"].push([7, 0, 1, 5, 6]);
        // two groups of two fairly split
        this.waves["4"].push([11, 0, 1, 9, 10]);
        // two groups of two very split
        this.waves["4"].push([15, 0, 1, 13, 14]);

        this.waves["5"] = [];
        // 5 adjacent enemies
        this.waves["5"].push([5, 0, 1, 2, 3, 4]);
        // 5 slightly split enemies
        this.waves["5"].push([9, 0, 2, 4, 6, 8]);
        // 5 more split enemies
        this.waves["5"].push([13, 0, 3, 6, 9, 12]);

        this.waves["6"] = [];
        // 6 adjacent enemies
        this.waves["6"].push([6, 0, 1, 2, 3, 4, 5]);
        // 6 split enemies
        this.waves["6"].push([11, 0, 2, 4, 6, 8, 10]);
        // two groups of three slightly split
        this.waves["6"].push([9, 0, 1, 2, 6, 7, 8]);
        // two groups of three very split
        this.waves["6"].push([15, 0, 1, 2, 12, 13, 14]);

        this.waves["7"] = [];
        this.waves["7"].push([8, 0, 1, 2, 3, 4, 5, 6, 7]);
        // enemy in every odd row
        this.waves["7"].push([15, 1, 3, 5, 7, 9, 11, 13]);

        this.waves["8"] = [];
        // 8 adjacent enemies
        this.waves["8"].push([8, 0, 1, 2, 3, 4, 5, 6, 7]);
        // enemy in every even row
        this.waves["8"].push([15, 0, 2, 4, 6, 8, 10, 12, 14]);
        // two groups of four somewhat split
        this.waves["8"].push([12, 0, 1, 2, 3, 8, 9, 10, 11]);
        // two groups of four very split
        this.waves["8"].push([15, 0, 1, 2, 3, 11, 12, 13, 14]);

        this.waves["15"] = [];
        // enemy in every row
        this.waves["15"].push([15, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
        // five triplet enemies
        this.waves["15"].push([13, 0, 0, 0, 3, 3, 3, 6, 6, 6, 9, 9, 9, 12, 12, 12]);

        // wave spawning interface
        this.currWave = 0;
        this.waveSpawnIndex = 0;
        this.waveSegments = []; // push [numEnemies, formation] pairs here

        // ui
        this.UIText = this.add.text(10, game.config.height - 74, "Health: " + this.playerHealth + "\nScore: " + this.playerScore, {fontSize: 32, strokeThickness: 3, fill: 'black', stroke: 'black'});
        this.gameOverText = null;
        this.restartKey = null;
    }

    update(time, delta) {
        if (this.my.sprite.player.health > 0) {
            // update player bodies
            this.my.sprite.player.update();
            this.my.sprite.gunWeak.update();
            this.my.sprite.gunStrong.update();
            // render enemy movement possibilities
            this.clearPathNodes();
            for(let column of this.enemies) {
                for (let enemy in column) {
                    column[enemy].update();
                }
            }
            // maintain enemy movement cycle
            if (this.moveTimeline.complete) {
                this.moveTimeline.play(true);
            }
            // move health UI out from behind gunStrong if needed
            this.UIText.text = "Health: " + this.my.sprite.player.health + "\nScore: " + this.playerScore;
            if (this.my.sprite.gunStrong.x < 300 && this.UIText.x == 10) {
                this.UIText.x = 350;
            }
            else if (this.my.sprite.gunStrong.x >= 300 && this.UIText.x == 350) {
                this.UIText.x = 10;
            }
            // spawn next wave if needed
            if (!Object.hasOwn(this, "waveSpawner") && this.numLivingEnemies == 0) {
                this.spawnWave();
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
            this.UIText.text = "Health: 0";
        }
        else { // game has been over
            if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
                this.init_game();
            }
        }
    }

    spawnWave() {
        // reset wave data storage
        this.waveSpawnIndex = 0;
        this.waveSegments = [];
        this.waveSpawner = this.add.timeline([]);

        // iterate wave difficulty
        if (this.currWave > 0) {
            this.playerScore += 50;
            this.increaseDifficulty();
        }

        // generate current wave segments
        let enemiesToSpawn = 5 + (this.currWave * 2);
        while (enemiesToSpawn > 0) {
            let index = -1;
            if (enemiesToSpawn > 14) {
                if (Math.random() > 0.75) {
                    index = 15;
                }
            }
            if (index == -1) {
                index = Math.floor(Math.random() * Math.min(enemiesToSpawn, 8) + 1);
            }
            this.waveSegments.push(this.waves[index.toString()][Math.floor(Math.random() * this.waves[index.toString()].length)]);
            enemiesToSpawn -= index;
        }
        // construct wave spawner timeline
        for (let i = 0; i < this.waveSegments.length; i++) {
            this.waveSpawner.add({
                from: this.enemyCycleTime,
                run() {
                    let laneOffset = Math.floor(Math.random() * (this.pathColumns - this.waveSegments[this.waveSpawnIndex][0]));
                    for (let i = 1; i < this.waveSegments[this.waveSpawnIndex].length; i++) {
                        this.summonEnemyInColumn(this.waveSegments[this.waveSpawnIndex][i] + laneOffset);
                    }
                    this.waveSpawnIndex++;
                },
                target: this
            })
        }
        this.waveSpawner.add({
            from: 0,
            run() {
                this.waveSpawner.destroy();
                delete this.waveSpawner;
                this.currWave++;
            },
            target: this
        })
        this.waveSpawner.play();
    }

    // summon an enemy at the top of the given column.
    summonEnemyInColumn(col) {
        this.enemies[col][this.enemyIndex.toString()] = new Enemy(this, col, 0, "enemyBody", null, this.enemyIndex);
        this.enemies[col][this.enemyIndex.toString() - 1].setWeapon(new EnemyWeapon(this, 0, 0,
                                                                                    this.enemies[col][this.enemyIndex.toString() - 1],
                                                                                    (this.enemyMoveGap - 300) / 2,
                                                                                    "enemyGun", null));
        this.numLivingEnemies++;
        return this.enemies[col][(this.enemyIndex - 1).toString()];
    }

    increaseDifficulty() {
        if (this.enemyMoveGap > 750) {
            this.enemyMoveGap -= 125;
        }
        if (this.enemySpeed > 300) {
            this.enemySpeed -= 25;
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