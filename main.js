// Initialisation de Kaplay
kaplay({
    background: [135, 206, 235],
    width: 1280,
    height: 720,
    scale: 1,
    debug: true
});

// Charger les assets 
loadSprite("white_horse", "assets/white_horse.png");
loadSprite("brown_horse", "assets/brown_horse.png");
loadSprite("black_horse", "assets/black_horse.png");
loadSprite("background", "assets/background.png");

// Variables globales du jeu
let gameState = {
    herd: [],
    player: null,
    stats: {
        leadership: 100,
        trust: 100,
        cohesion: 100,   
        hierarchy: 100    
    },
    currentBox: null,  
    boxChoices: [],      
    usedBoxes: new Set(), 
    selectedHorse: null, 
};

// Définition des boxes et leurs choix avec effets spécifiques par type de cheval
const gameBoxes = [
    {
        id: "conflict",
        title: "Conflit dans le troupeau",
        description: "Deux chevaux se disputent pour l'accès à la nourriture.",
        choices: [
            {
                text: "Intervenir avec autorité",
                effects: {
                    black_horse: { // Leadership 
                        leadership: -15,
                        trust: 0,
                        hierarchy: -15,
                        cohesion: -5
                    },
                    brown_horse: { // Empathie 
                        leadership: -10,
                        trust: -5,
                        hierarchy: -15,
                        cohesion: -5
                    },
                    white_horse: { // Clairvoyance 
                        leadership: -10,
                        trust: -5,
                        hierarchy: -10,
                        cohesion: -5
                    }
                }
            },
            {
                text: "Laisser les chevaux se débrouiller",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    white_horse: {
                        leadership: 0,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: -10
                    }
                }
            },
        ]
    },
    {
        id: "new_member",
        title: "Nouveau membre",
        description: "Un cheval solitaire approche du troupeau.",
        choices: [
            {
                text: "Accueillir chaleureusement",
                effects: {
                    black_horse: {
                        leadership: -15,
                        trust: -10,
                        hierarchy: -10,
                        cohesion: -10
                    },
                    brown_horse: {
                        leadership: -10,
                        trust: -5,
                        hierarchy: -10,
                        cohesion: -5
                    },
                    white_horse: {
                        leadership: -10,
                        trust: -5,
                        hierarchy: -10,
                        cohesion: -10
                    }
                }
            },
            {
                text: "Maintenir une distance",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: -5
                    },
                    white_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    }
                }
            }
        ]
    },
    {
        id: "danger",
        title: "Signe de danger",
        description: "Le troupeau a détecté un prédateur dans les environs.",
        choices: [
            {
                text: "Prendre la fuite immédiatement",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    white_horse: {
                        leadership: 0 ,
                        trust: 0 ,
                        hierarchy: 0,
                        cohesion: 0
                    }
                }
            },
            {
                text: "Rester calme et observer",
                effects: {
                    black_horse: {
                        leadership: -15,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: -5
                    },
                    brown_horse: {
                        leadership: -10,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -5
                    },
                    white_horse: {
                        leadership: -15,
                        trust: -5,
                        hierarchy: 0,
                        cohesion: -10
                    }
                }
            },
        ]
    },
    {
        id: "food_shortage",
        title: "Pénurie de nourriture",
        description: "Les ressources sont limitées et certains chevaux n'ont pas assez à manger.",
        choices: [
            {
                text: "Partager équitablement",
                effects: {
                    black_horse: {
                        leadership: -15,
                        trust: -10,
                        hierarchy: -20,
                        cohesion: -5
                    },
                    brown_horse: {
                        leadership: -10,
                        trust: -5,
                        hierarchy: -15,
                        cohesion: -3
                    },
                    white_horse: {
                        leadership: -10,
                        trust: -10,
                        hierarchy: -20,
                        cohesion: 0
                    }
                }
            },
            {
                text: "Laisser la hiérarchie décider",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    white_horse: {
                        leadership: 0,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    }
                }
            }
        ]
    },
    {
        id: "storm_approaching",
        title: "Tempête approche",
        description: "Une tempête se dirige vers le troupeau. Il faut prendre une décision rapidement.",
        choices: [
            {
                text: "Chercher un abri immédiatement",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    white_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    }
                }
            },
            {
                text: "Attendre pour voir l'évolution",
                effects: {
                    black_horse: {
                        leadership: -15,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -15
                    },
                    brown_horse: {
                        leadership: -10,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    white_horse: {
                        leadership: -10,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    }
                }
            }
        ]
    },
    {
        id: "territory_dispute",
        title: "Conflit territorial",
        description: "Un autre troupeau s'approche de votre territoire.",
        choices: [
            {
                text: "Défendre le territoire",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    },
                    white_horse: {
                        leadership: 0,
                        trust: 0,
                        hierarchy: 0,
                        cohesion: 0
                    }
                }
            },
            {
                text: "Rechercher un compromis",
                effects: {
                    black_horse: {
                        leadership: -10,
                        trust: -15,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    brown_horse: {
                        leadership: -5,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    },
                    white_horse: {
                        leadership: -5,
                        trust: -10,
                        hierarchy: 0,
                        cohesion: -10
                    }
                }
            }
        ]
    },
    {
        id: "sick_member",
        title: "Membre malade",
        description: "Un membre du troupeau est tombé malade et ralentit le groupe.",
        choices: [
            {
                text: "Ralentir pour le soigner",
                effects: {
                    black_horse: {
                        leadership: -15,
                        trust: -10,
                        hierarchy: -5,
                        cohesion: -5
                    },
                    brown_horse: {
                        leadership: -10,
                        trust: -5,
                        hierarchy: -5,
                        cohesion: -5
                    },
                    white_horse: {
                        leadership: -10,
                        trust: -5,
                        hierarchy: -5,
                        cohesion: -5
                    }
                }
            },
            {
                text: "Continuer sans lui",
                effects: {
                    black_horse: {
                        leadership: 0,
                        trust: -10,
                        hierarchy: -10,
                        cohesion: -10
                    },
                    brown_horse: {
                        leadership: 0,
                        trust: -20,
                        hierarchy: -10,
                        cohesion: -15
                    },
                    white_horse: {
                        leadership: 0,
                        trust: -15,
                        hierarchy: -10,
                        cohesion: -10
                    }
                }
            }
        ]
    }
];

// Scène d'accueil
scene("welcome", () => {
    // Fond
    add([
        rect(width(), height()),
        color(135, 206, 235),
        fixed()
    ]);

    // Titre du jeu
    add([
        text("MINDHeard", { size: 64, font: "Times New Roman" }),
        pos(width()/2, height()/4 ),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    // Sous-titre
    add([
        text("Dynamiques sociales équines", { size: 32,font: "Times New Roman"}),
        pos(width()/2, height()/3 + 40),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);
 
    // Créer le bouton "JOUER"
    const jouerBtn = add([
        rect(200, 60),       
        pos(width()/2, height()/2 + 70),      
        anchor("center"),    
        color(0, 0, 0),      
        area(),              
        z(1),
    ]);
    
    const jouerTxt = add([
        text("JOUER", { size: 32, font: "Times New Roman"}),
        pos(width()/2, height()/2+ 70),
        anchor("center"),
        color(255, 255, 255), // blanc
        fixed(),
        z(2),
    ]);

    // Effet visuel au survol
    jouerBtn.onHover(() => {
        jouerBtn.color = rgb(19, 164, 236); // bleu clair
        setCursor("pointer");
    });

    jouerBtn.onHoverEnd(() => {
        jouerBtn.color = rgb(0, 0, 0); // noir
        setCursor("default");
    });

    jouerBtn.onClick(() => go("main"));

    // Texte d'instruction
    add([
        text("Appuyez sur ESPACE pour lancer le jeu", { size: 20, font: "Times New Roman"}),
        pos(width()/2, height()/2 + 150),
        anchor("center"),
        color(0, 0, 0),
        fixed(),
        z(9)
    ]);

   
    // Navigation au clavier
    onKeyPress("space", () => {
        go("main");
    });
});

// Scène de sélection du personnage
scene("main", () => {
    // Fond
    add([
        sprite("background"),
        scale(1.5, 1.5),
        color(56, 189, 223 ,0),
        fixed()
    ]);

    const horseTypes = [
        { name: "Noir", sprite: "black_horse", description: "Cheval noir - Un esprit de leadership" },
        { name: "Brun", sprite: "brown_horse", description: "Cheval brun - Un esprit d'empathie" },
        { name: "Blanc", sprite: "white_horse", description: "Cheval blanc - Un esprit de clairvoyance" }
    ];

    let selectedHorse = 0;
    const horsePreview = add([
        sprite(horseTypes[selectedHorse].sprite),
        pos(width()/2, height()/2),
        scale(0.8),
        anchor("center")
    ]);

    // Interface de sélection
    add([
        text("Choisissez votre apparence", { size: 32, font: "Times New Roman"}),
        pos(width()/2, 100),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    // Description du cheval sélectionné
    const descriptionText = add([
        text(horseTypes[selectedHorse].description, { size: 20, font: "Times New Roman"}),
        pos(width()/2, height()/2 + 200),
        anchor("center"),
        color(0, 0, 0),
        fixed()
    ]);

    // Boutons de navigation
    const leftButton = add([
        rect(50, 50),
        pos(width()/2 - 300, height()/2),
        anchor("center"),
        color(0, 0, 0),
        "navButton",
        area()
    ]);

    const rightButton = add([
        rect(50, 50),
        pos(width()/2 + 300, height()/2),
        anchor("center"),
        color(0, 0, 0),
        "navButton",
        area()
    ]);

    add([
        text("←", { size: 32, font: "Times New Roman"}),
        pos(width()/2 - 300, height()/2),
        anchor("center"),
        color(255, 255, 255)
    ]);

    add([
        text("→", { size: 32, font: "Times New Roman"}),
        pos(width()/2 + 300, height()/2),
        anchor("center"),
        color(255, 255, 255)
    ]);

    leftButton.onHover(() => {
        leftButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    leftButton.onHoverEnd(() => {
        leftButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    rightButton.onHover(() => {
        rightButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    rightButton.onHoverEnd(() => {
        rightButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    // Gestion des clics pour changer de cheval
    leftButton.onClick(() => {
        selectedHorse = (selectedHorse - 1 + horseTypes.length) % horseTypes.length;
        horsePreview.use(sprite(horseTypes[selectedHorse].sprite));
        if (horseTypes[selectedHorse].sprite === "black_horse") {
            horsePreview.scale = vec2(0.8);
        } else if (horseTypes[selectedHorse].sprite === "brown_horse") {
            horsePreview.scale = vec2(0.45);
        } else {
            horsePreview.scale = vec2(0.22);
        }
        descriptionText.text = horseTypes[selectedHorse].description;
    });

    rightButton.onClick(() => {
        selectedHorse = (selectedHorse + 1) % horseTypes.length;
        horsePreview.use(sprite(horseTypes[selectedHorse].sprite));
        if (horseTypes[selectedHorse].sprite === "black_horse") {
            horsePreview.scale = vec2(0.8);
        } else if (horseTypes[selectedHorse].sprite === "brown_horse") {
            horsePreview.scale = vec2(0.45);
        } else {
            horsePreview.scale = vec2(0.22);
        }
        descriptionText.text = horseTypes[selectedHorse].description;
    });

    // Bouton Commencer
    const startButton = add([
        rect(300, 50),
        pos(width()/2, height() - 100),
        anchor("center"),
        color(0, 0, 0),
        "startButton",
        area()
    ]);

    add([
        text("COMMENCER", { size: 32, font: "Times New Roman"}),
        pos(width()/2, height() - 100),
        anchor("center"),
        color(255, 255, 255)
    ]);

    startButton.onHover(() => {
        startButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    startButton.onHoverEnd(() => {
        startButton.color = rgb(0, 0, 0);
        setCursor("default");
    });

    startButton.onClick (() => {
        startGame(horseTypes[selectedHorse]);
    });

    onKeyPress("space", () => {
        startGame(horseTypes[selectedHorse]);
    });
});



// Scène de jeu
scene("game", () => {
    // Réinitialisation de l'état du jeu
    gameState.herd = [];
    gameState.player = null;
    gameState.stats = {
        leadership: 100,
        trust: 100,
        cohesion: 100,
        hierarchy: 100
    };
    gameState.currentBox = null;
    gameState.boxChoices = [];
    gameState.usedBoxes = new Set();

    // Fond
    add([
        sprite("background"),
        scale(1.5, 1.5),
        color(56, 189, 223 ,0), 
        fixed()
    ]);


    // Interface utilisateur en haut de l'écran
    const statsBg = add([
        rect(300, height()),
        pos(0, 0),
        color(0, 0, 0, 0.8),
        fixed(),
        z(99)
    ]);

    // Titre des statistiques
    add([
        text("STATISTIQUES", { size: 28, font: "Times New Roman" }),
        pos(20, 20),
        color(255, 255, 255),
        fixed(),
        z(100)
    ]);

    // Création des textes de statistiques individuels
    const statsTexts = {
        leadership: add([
            text("Leadership: 100", { size: 24, font: "Times New Roman" }),
            pos(20, 80),
            color(255, 255, 255),
            fixed(),
            z(100)
        ]),
        trust: add([
            text("Confiance: 100", { size: 24, font: "Times New Roman" }),
            pos(20, 130),
            color(255, 255, 255),
            fixed(),
            z(100)
        ]),
        cohesion: add([
            text("Cohésion: 100", { size: 24, font: "Times New Roman" }),
            pos(20, 180),
            color(255, 255, 255),
            fixed(),
            z(100)
        ]),
        hierarchy: add([
            text("Hiérarchie: 100", { size: 24, font: "Times New Roman" }),
            pos(20, 230),
            color(255, 255, 255),
            fixed(),
            z(100)
        ])
    };

    // Ajouter le cheval sélectionné en bas à gauche
    const selectedHorsePreview = add([
        sprite(gameState.selectedHorse.sprite),
        pos(150, height() - 100),
        anchor("center"),
        fixed(),
        z(100)
    ]);

    // Ajuster l'échelle selon le type de cheval
    if (gameState.selectedHorse.sprite === "black_horse") {
        selectedHorsePreview.scale = vec2(0.55);
    } else if (gameState.selectedHorse.sprite === "brown_horse") {
        selectedHorsePreview.scale = vec2(0.30);
    } else {
        selectedHorsePreview.scale = vec2(0.12);
    }

    // Fonction pour mettre à jour le compteur
    function updateRemainingCount() {
        const remaining = gameBoxes.length - gameState.usedBoxes.size;
        return `Situations restantes: ${remaining}`;
    }

    // Fonction pour afficher le changement de statistique
    function showStatChange(stat, value) {
        const color = rgb(255, 0, 0); 
        const sign = value > 0 ? "+" : "";
        
        const changeText = add([
            text(`${sign}${value}`, { size: 24, font: "Times New Roman" }),
            pos(250, statsTexts[stat].pos.y),
            color,
            fixed(),
            z(101)
        ]);

        // Animation de déplacement vers le haut et disparition
        changeText.move(vec2(0, -30), 1);
        changeText.opacity = 1;
        
        // Faire disparaître le texte progressivement
        loop(0.1, () => {
            changeText.opacity -= 0.1;
            if (changeText.opacity <= 0) {
                changeText.destroy();
            }
        });
    }

    // Fonction pour mettre à jour les statistiques
    function updateStats() {
        statsTexts.leadership.text = `Leadership: ${gameState.stats.leadership}`;
        statsTexts.trust.text = `Confiance: ${gameState.stats.trust}`;
        statsTexts.cohesion.text = `Cohésion: ${gameState.stats.cohesion}`;
        statsTexts.hierarchy.text = `Hiérarchie: ${gameState.stats.hierarchy}`;
    }

    // Fonction pour choisir une nouvelle box
    function chooseNewBox() {
        const availableBoxes = gameBoxes.filter(box => !gameState.usedBoxes.has(box.id));
        
        // Si toutes les boxes ont été utilisées, fin du jeu
        if (availableBoxes.length === 0) {
            showFinalScreen();
            return null;
        }
        return choose(availableBoxes);
    }

    // Fonction pour afficher l'écran final
    function showFinalScreen() {
        get("boxElement").forEach(element => {
            element.destroy();
        });

        // Créer le fond de l'écran final
        const finalBg = add([
            sprite("background"),
            scale(1, 1),
            pos(width()/2 + 150, height()/2),
            anchor("center"),
            color(56, 189, 223 ,0),
            fixed(),
            z(100),
            "boxElement"
        ]);

        // Titre
        add([
            text("Fin de la partie", { size: 37, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 180),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Afficher les statistiques finales
        const stats = [
            `Leadership: ${gameState.stats.leadership}`,
            `Confiance: ${gameState.stats.trust}`,
            `Cohésion: ${gameState.stats.cohesion}`,
            `Hiérarchie: ${gameState.stats.hierarchy}`
        ];

        // Calculer la moyenne des statistiques
        const average = Math.round(
            (gameState.stats.leadership + 
             gameState.stats.trust + 
             gameState.stats.cohesion + 
             gameState.stats.hierarchy) / 4
        );

        // Afficher les statistiques
        stats.forEach((stat, index) => {
            add([
                text(stat, { size: 24, font: "Times New Roman" }),
                pos(width()/2 + 150, height()/2 - 80 + (index * 40)),
                anchor("center"),
                color(255, 255, 255),
                fixed(),
                z(101),
                "boxElement"
            ]);
        });

        // Afficher la moyenne
        add([
            text(`Moyenne: ${average}`, { size: 28, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 90),
            anchor("center"),
            color(255, 0, 0),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Message de conclusion
        let conclusion = "";
        let moral = "";
        const horseType = gameState.selectedHorse.sprite;

        if (average >= 80) {
            conclusion = "Excellent leadership ! Le troupeau est très soudé.";
            if (horseType === "black_horse") {
                moral = "Malgré ton leadership instinctif, tu as su maintenir un équilibre entre autorité et respect.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie naturelle a permis de créer des liens forts au sein du troupeau.";
            } else {
                moral = "Ta clairvoyance a permis d'anticiper les défis et de guider le troupeau avec sagesse.";
            }
        } else if (average >= 60) {
            conclusion = "Bon leadership. Le troupeau est stable.";
            if (horseType === "black_horse") {
                moral = "Ton leadership instinctif a parfois été trop directif, mais le troupeau reste uni.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a permis de maintenir la cohésion, même si certaines décisions ont été difficiles.";
            } else {
                moral = "Ta clairvoyance a permis de prévoir les situations, même si certaines décisions ont été complexes.";
            }
        } else if (average >= 40) {
            conclusion = "Leadership moyen. Le troupeau est fragile.";
            if (horseType === "black_horse") {
                moral = "Ton leadership instinctif a parfois manqué de nuance, créant des tensions dans le troupeau.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a parfois été un frein à la prise de décisions nécessaires.";
            } else {
                moral = "Ta clairvoyance a parfois été troublée par les émotions du moment.";
            }
        } else {
            conclusion = "Leadership faible. Le troupeau est en difficulté.";
            if (horseType === "black_horse") {
                moral = "Ton leadership instinctif a été trop autoritaire, créant des divisions dans le troupeau.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie excessive a empêché le troupeau de prendre les décisions difficiles.";
            } else {
                moral = "Ta clairvoyance a été obscurcie par les pressions du moment.";
            }
        }

        add([
            text(conclusion, { size: 24, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 150),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Ajouter la morale
        add([
            text(moral, { size: 20, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 190),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Bouton pour recommencer
        const restartButton = add([
            rect(200, 50),
            pos(width()/2 + 150, height()/2 + 260),
            anchor("center"),
            color(50, 50, 50),
            fixed(),
            z(101),
            area(),
            "boxElement"
        ]);

        add([
            text("Recommencer", { size: 24, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 + 260),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(102),
            "boxElement"
        ]);

        restartButton.onHover(() => {
            restartButton.color = rgb(56, 189, 223);
            setCursor("pointer");
        });

        restartButton.onHoverEnd(() => {
            restartButton.color = rgb(50, 50, 50);
            setCursor("default");
        });

        restartButton.onClick(() => {
            go("main");
        });
    }

    // Fonction pour afficher une box
    function showBox(box) {
        if (!box) {
            return;
        }
        gameState.usedBoxes.add(box.id);
        
        if (gameState.currentBox) {
            get("boxElement").forEach(element => {
                element.destroy();
            });
        } 
        gameState.currentBox = box;
        
        // Le fond de la box
        const boxBg = add([
            sprite("background"),
            scale(1, 1),
            pos(width()/2 + 150, height()/2),
            anchor("center"),
            color(56, 189, 223 ,0),
            fixed(),
            z(100),
            "boxElement"
        ]);

        // Titre de la box
        add([
            text(box.title, { size: 32, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 150),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Description
        add([
            text(box.description, { size: 24, font: "Times New Roman" }),
            pos(width()/2 + 150, height()/2 - 100),
            anchor("center"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Compteur de situations restantes 
        add([
            text(updateRemainingCount(), { size: 20, font: "Times New Roman" }),
            pos(width()/2 + 50 + (width() - 350)/2 - 20, height()/2 + (height() - 200)/2 - 20),
            anchor("right"),
            color(255, 255, 255),
            fixed(),
            z(101),
            "boxElement"
        ]);

        // Créer les boutons de choix
        box.choices.forEach((choice, index) => {
            const button = add([
                rect(400, 50),
                pos(width()/2 + 150, height()/2 + (index * 70)),
                anchor("center"),
                color(50, 50, 50),
                fixed(),
                z(101),
                area(),
                "boxElement"
            ]);

            add([
                text(choice.text, { size: 20, font: "Times New Roman" }),
                pos(width()/2 + 150, height()/2 + (index * 70)),
                anchor("center"),
                color(255, 255, 255),
                fixed(),
                z(102),
                "boxElement"
            ]);

            // Gestion des événements bouton
            button.onHover(() => {
                button.color = rgb(19, 164, 236); 
                setCursor("pointer");
            });

            button.onHoverEnd(() => {
                button.color = rgb(50, 50, 50); 
                setCursor("default");
            });

            button.onClick(() => {
                const horseType = gameState.selectedHorse.sprite;
                const effects = choice.effects[horseType];
                
                const changes = Object.entries(effects)
                    .map(([stat, value]) => {
                        const statName = {
                            leadership: "Leadership",
                            trust: "Confiance",
                            hierarchy: "Hiérarchie",
                            cohesion: "Cohésion"
                        }[stat];
                        return `${statName}: ${value > 0 ? '+' : ''}${value}`;
                    });

                // Afficher les changements dans le panneau de stats
                const changesText = add([
                    text(changes.join('\n'), { size: 24, font: "Times New Roman" }),
                    pos(20, 350),
                    color(255, 0, 0), 
                    fixed(),
                    z(101),
                    "boxElement"
                ]);

                // Attendre avant d'appliquer les changements
                wait(2, () => {
                    changesText.destroy();

                    // Appliquer les effets du choix
                    Object.entries(effects).forEach(([stat, value]) => {
                        const oldValue = gameState.stats[stat];
                        gameState.stats[stat] = Math.max(0, Math.min(100, gameState.stats[stat] + value));
                        showStatChange(stat, value);
                    });
                    updateStats();

                    // Supprimer tous les éléments de la box
                    get("boxElement").forEach(element => {
                        element.destroy();
                    });
                    gameState.currentBox = null;

                    // Afficher un message de feedback
                    const feedback = add([
                        text("Votre décision a des conséquences sur le troupeau...", { size: 34, font: "Times New Roman" }),
                        pos(width()/2 + 150, height()/2),
                        anchor("center"),
                        color(0, 0, 0), 
                        fixed(),
                        z(101),
                        "boxElement"
                    ]);

                    // Attendre  avant de passer à la question suivante
                    wait(1, () => {
                        feedback.destroy();
                        // question suivante
                        const nextBox = chooseNewBox();
                        showBox(nextBox);
                    });
                });
            });
        });
    }

    // Afficher la première box au démarrage
    const firstBox = chooseNewBox();
    showBox(firstBox);

    // Mise à jour de l'interface
    onUpdate(() => {
        if (!gameState.currentBox) {
        }
    });
});

// Fonction de démarrage du jeu
function startGame(selectedHorse) {
    gameState.selectedHorse = selectedHorse;
    go("game");
}

// Attendre que tout soit chargé avant de redémarrer
onLoad(() => {
    go("welcome");
});

