class GalleryShooter extends Phaser.Scene {
    constructor() {
        super("galleryShooter");
        this.my = {sprite: {}};
        this.path = {sprites: []};

        let gameWidth = game.config.width - 100;

        this.playerY = game.config.height - 150;
        this.playerSpeed = 1;
        this.positions = [
                          50, 
                          gameWidth / 4, 
                          gameWidth / 2,
                          gameWidth * 3 / 4,
                          gameWidth
                         ];

        this.sandbagY = this.playerY - 80;

        // constants for path node loading
        this.pathColumns = 15;
        this.pathRows = 10;
        this.pathHorizLeftBuffer = 50;
        this.pathHorizSpacing = (game.config.width - (2 * this.pathHorizLeftBuffer)) / (this.pathColumns - 1);
        this.pathVertTopBuffer = 10;
        this.pathVertSpacing = (this.sandbagY - this.pathVertTopBuffer) / this.pathRows;

        this.gunStrongX = game.config.width / 2;
        this.gunStrongY = game.config.height;

        this.enemyIndex = 0;

        this.enemySpeed = 200;

        this.enemyCycleTime = 1000 + 3 * this.enemySpeed;

        this.prototypes = {sprite: {}};
    }
    
    preload() {
        this.load.setPath("./assets/")

        // player's tank
        this.load.image("playerBody", "Tanks/tankRed.png");
        this.load.image("playerGun", "Tanks/barrelRed_outline.png");

        // parts of strong gun
        this.load.image("gunStrongArm", "Tanks/barrelBlack_outline.png");
        this.load.image("gunStrongJoint", "Obstacles/oil.png");
        this.load.image("gunStrongBarrel", "Obstacles/barrelGrey_side.png");

        // enemy tanks
        this.load.image("enemyBody", "Tanks/tankBeige.png");
        this.load.image("enemyGun", "Tanks/barrelBeige_outline.png")

        // player's fortress
        this.load.image("sandbag", "Obstacles/sandbagBeige.png");
        this.load.image("tracks", "Tanks/tracksSmall.png");

        // background
        this.load.image("sand", "Environment/sand.png");
        this.load.image("dirt", "Environment/dirt.png");

        // enemy pathway nodes
        this.load.image("pathMaybe", "Smoke/smokeYellow1.png");
        this.load.image("pathSure", "Smoke/smokeOrange1.png");
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

        // create pathway nodes
        for (let i = 0; i < this.pathColumns; i++) {
            let column = [];
            this.path.sprites.push(column);
            for(let j = 0; j < this.pathRows; j++) {
                this.path.sprites[i].push(new PathNode(this, i, j, "pathMaybe", null));
                this.path.sprites[i][j].makeMaybe();
            }
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
        
        // create enemy storage

        // enemies stored by current column for projectile collision detection
        this.enemies = [];
        for (let i = 0; i < this.pathColumns; i++) {
            this.enemies.push({});
        }

        // enemy movement timeline
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
            { // for testing
                from: this.enemyCycleTime / 2,
                run() {
                    this.scene.summonEnemyInColumn(Math.floor(Math.random() * this.scene.pathColumns))
                }
            }
        ]);
        this.moveTimeline.play();

        //this.testEnemy = this.summonEnemyInColumn(4);
        //this.summonEnemyInColumn(2);
        //this.summonEnemyInColumn(6);
        //this.testEnemy.move();
        //this.testEnemy.moves = ["right", "right", "any"];
        //this.testEnemy.showPossibleMoves();
        //this.testEnemy.move();

        // test showPossibleMoves loop
        /*var testPathDrawTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                let movesFull = true;
                let justReset = false;
                let moveToAdd = "right";
                for(let move of this.testEnemy.moves) {
                    if (move != moveToAdd) {
                        movesFull = false;
                    }
                }
                if (movesFull) {
                    this.testEnemy.resetMoves();
                    justReset = true;
                }
                if (justReset) {
                    this.testEnemy.xIndex++;
                    justReset = false;
                }
                else {
                    this.testEnemy.addMove(moveToAdd);
                }
                for (let nodeArray of this.path.sprites) {
                    for(let node of nodeArray) {
                        node.hide();
                    }
                }
                this.testEnemy.showPossibleMoves(3);
            },
            loop: true
        })*/
    }

    update(time, delta) {
        this.my.sprite.player.update();
        this.my.sprite.gunWeak.update();
        this.my.sprite.gunStrong.update();
        for(let column of this.enemies) {
            for (let enemy in column) {
                column[enemy].update();
            }
        }
        if (this.moveTimeline.complete) {
            this.moveTimeline.play(true);
        }
        //console.log("xIndex: ", this.testEnemy.xIndex, "yIndex: ", this.testEnemy.yIndex, "moveIndex: ", this.testEnemy.moveIndex);
    }

    // summon an enemy at the top of the given column.
    summonEnemyInColumn(col) {
        this.enemies[col][this.enemyIndex.toString()] = new Enemy(this, col, 0, this.enemySpeed, "enemyBody", null, this.enemyIndex);
        return this.enemies[col][(this.enemyIndex - 1).toString()];
    }

    clearPathNodes() {
        for (let nodeArray of this.path.sprites) {
            for(let node of nodeArray) {
                node.hide();
            }
        }
    }
}