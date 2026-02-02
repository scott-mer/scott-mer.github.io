class CardGame extends Phaser.Scene {
    constructor() {
        super({ key: 'CardGame' });
        this.playAreaCards = [];
        this.handCards = [];
        this.deckCount = 52;
    }

    preload() {
        this.load.image('card', 'card.png');
        this.load.image('deck', 'deck.png');
    }

    create() {
        const { width, height } = this.scale;

        // Dark gradient background
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
        graphics.fillRect(0, 0, width, height);

        // Play area zone (center)
        this.playAreaZone = this.add.rectangle(width / 2, height / 2 - 50, width * 0.6, height * 0.4, 0x0f3460, 0.3);
        this.playAreaZone.setStrokeStyle(2, 0x0f3460);

        // Play area label
        this.add.text(width / 2, height / 2 - 180, 'PLAY AREA', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#4a6fa5',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Create the deck
        this.createDeck();

        // Create End Hand button
        this.createEndHandButton();

        // Hand area at bottom
        this.handAreaY = height - 100;
        this.add.rectangle(width / 2, this.handAreaY, width * 0.8, 120, 0x0f3460, 0.2);
        this.add.text(width / 2, this.handAreaY - 50, 'YOUR HAND', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#4a6fa5'
        }).setOrigin(0.5);

        // Deck count text
        this.deckCountText = this.add.text(150, 420, `Cards: ${this.deckCount}`, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
    }

    createDeck() {
        const { width, height } = this.scale;

        // Deck position (left side)
        this.deckX = 150;
        this.deckY = height / 2 - 50;

        // Create deck sprite
        this.deck = this.add.image(this.deckX, this.deckY, 'deck');
        this.deck.setDisplaySize(100, 140);
        this.deck.setInteractive({ useHandCursor: true });

        // Add glow effect on hover
        this.deck.on('pointerover', () => {
            this.deck.setTint(0x6666ff);
            this.tweens.add({
                targets: this.deck,
                scaleX: this.deck.scaleX * 1.05,
                scaleY: this.deck.scaleY * 1.05,
                duration: 100
            });
        });

        this.deck.on('pointerout', () => {
            this.deck.clearTint();
            this.tweens.add({
                targets: this.deck,
                scaleX: this.deck.scaleX / 1.05,
                scaleY: this.deck.scaleY / 1.05,
                duration: 100
            });
        });

        // Click to draw card
        this.deck.on('pointerdown', () => this.drawCard());

        // Deck label
        this.add.text(this.deckX, this.deckY + 90, 'DECK', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    drawCard() {
        if (this.deckCount <= 0) return;

        const { width, height } = this.scale;
        this.deckCount--;
        this.deckCountText.setText(`Cards: ${this.deckCount}`);

        // Create new card at deck position
        const card = this.add.image(this.deckX, this.deckY, 'card');
        card.setDisplaySize(80, 112);

        // Calculate position in play area
        const playAreaCards = this.playAreaCards.length;
        const offsetX = (playAreaCards % 8) * 40 - 140;
        const offsetY = Math.floor(playAreaCards / 8) * 30 - 30;
        const targetX = width / 2 + offsetX;
        const targetY = height / 2 - 50 + offsetY;

        // Animate card to play area
        this.tweens.add({
            targets: card,
            x: targetX,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Add slight rotation for natural look
                card.rotation = Phaser.Math.FloatBetween(-0.05, 0.05);
            }
        });

        this.playAreaCards.push(card);

        // Hide deck if empty
        if (this.deckCount <= 0) {
            this.deck.setAlpha(0.3);
            this.deck.disableInteractive();
        }
    }

    createEndHandButton() {
        const { width, height } = this.scale;

        const buttonX = width - 150;
        const buttonY = height / 2 - 50;

        // Button background
        const button = this.add.rectangle(buttonX, buttonY, 140, 50, 0x4a6fa5);
        button.setStrokeStyle(2, 0x6a8fc5);
        button.setInteractive({ useHandCursor: true });

        // Button text
        const buttonText = this.add.text(buttonX, buttonY, 'END HAND', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x6a8fc5);
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        button.on('pointerout', () => {
            button.setFillStyle(0x4a6fa5);
            this.tweens.add({
                targets: [button, buttonText],
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        button.on('pointerdown', () => this.endHand());
    }

    endHand() {
        if (this.playAreaCards.length === 0) return;

        const { width } = this.scale;
        const cardsToMove = [...this.playAreaCards];
        this.playAreaCards = [];

        // Calculate hand card positions (fan layout)
        const totalCards = this.handCards.length + cardsToMove.length;
        const startX = width / 2 - (totalCards * 25);

        cardsToMove.forEach((card, index) => {
            const handIndex = this.handCards.length + index;
            const targetX = startX + handIndex * 50;
            const rotation = (handIndex - (totalCards - 1) / 2) * 0.05;

            this.tweens.add({
                targets: card,
                x: targetX,
                y: this.handAreaY,
                rotation: rotation,
                displayWidth: 60,
                displayHeight: 84,
                duration: 400,
                delay: index * 50,
                ease: 'Cubic.easeOut'
            });

            this.handCards.push(card);
        });
    }
}

// Phaser configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#1a1a2e',
    scene: CardGame
};

// Create the game
const game = new Phaser.Game(config);
