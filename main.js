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

// Charger les sons 
const sounds = {
    click: "assets/sounds/click.mp3",
    hover: "assets/sounds/hover.mp3",
    background_music: "assets/sounds/background_music.mp3",
    horse_neigh: "assets/sounds/horse_neigh.mp3",
    wolf_howl: "assets/sounds/wolf_howl.mp3",
    thunder: "assets/sounds/thunder.mp3",
};

// Fonction pour charger les sons avec gestion des erreurs
function loadGameSounds() {
    Object.entries(sounds).forEach(([name, path]) => {
        try {
            loadSound(name, path);
        } catch (error) {
            console.warn(`Impossible de charger le son ${name}: ${error.message}`);
        }
    });
}

loadGameSounds();

// Variables globales du jeu
let gameState = {
    herd: [],
    player: null,
    stats: {
        dominance: 100,
        confiance: 100,
        cohesion: 100,   
        hierarchie: 100    
    },
    currentBox: null,  
    boxChoices: [],      
    usedBoxes: new Set(), 
    selectedHorse: null,
    musicPlaying: false,
    availableSituations: [],
    soundEnabled: true
};

// Variable globale pour suivre les situations utilisées 
let globalUsedSituations = new Set();

// Fonction pour jouer un son 
function playGameSound(name, options = {}) {
    if (!gameState.soundEnabled) return;
    
    try {
        // Arrêter la musique de fond si on joue un autre son
        if (name !== "background_music" && gameState.musicPlaying) {
            try {
                stop("background_music");
                gameState.musicPlaying = false;
            } catch (error) {
                console.warn("Impossible d'arrêter la musique de fond:", error.message);
            }
        }
        
        play(name, {
            volume: options.volume || 0.5,
            loop: options.loop || false
        });
    } catch (error) {
        console.warn(`Impossible de jouer le son ${name}: ${error.message}`);
    }
}

// Définition des situations de base
const baseSituations = [
    // Situations de conflit 
    {
        id: "conflict_food",
        title: "Conflit pour la nourriture",
        description: "Deux chevaux se disputent pour l'accès à la nourriture.",
        scientificInfo: "Le savais-tu ? Les chevaux utilisent des signaux clairs de langage corporel comme les oreilles couchées ou des postures d'intimidation pour communiquer leur dominance lors de conflits pour les ressources.",
        choices: [
            {
                text: "Intervenir avec autorité",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -10, cohesion: -10 },
                    brown_horse: { dominance: -10, confiance: -15, hierarchie: -5, cohesion: -10 },
                    white_horse: { dominance: -15, confiance: -10, hierarchie:- 5, cohesion: -10 }
                }
            },
            {
                text: "Laisser les chevaux se débrouiller",
                effects: {
                    black_horse: { dominance: 5, confiance: 0, hierarchie: 5, cohesion: 0 },
                    brown_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 0 },
                    white_horse: { dominance: 5, confiance: 0, hierarchie: 5, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "conflict_territory",
        title: "Conflit territorial",
        description: "Un autre troupeau s'approche de votre territoire.",
        scientificInfo: "Le savais-tu ? La défense territoriale chez les chevaux est principalement menée par l'étalon dominant et les juments les plus expérimentées du troupeau. La surface du territoire défendu par un troupeau sauvages dépend des ressources locales disponibles..",
        choices: [
            {
                text: "Défendre le territoire",
                effects: {
                    black_horse: { dominance: 15, confiance: 0, hierarchie: 5, cohesion: 0 },
                    brown_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 5 },
                    white_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 5 }
                }
            },
            {
                text: "Rechercher un compromis",
                effects: {
                    black_horse: { dominance: -20, confiance: -15, hierarchie: -5, cohesion: -10 },
                    brown_horse: { dominance: -15, confiance: -10, hierarchie: -5, cohesion: -10 },
                    white_horse: { dominance: -15, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "conflict_hierarchy",
        title: "Conflit de hiérarchie",
        description: "Un jeune étalon remet en question l'autorité du chef du troupeau.",
        scientificInfo: "Le savais-tu ? Lors d'un duel entre l'étalon dominant et un jeune étalon qui le défie, le reste du troupeau a tendance à rester en retrait et à observer. Les conflits de hiérarchie sont plus fréquents pendant la saison des amours. ",
        choices: [
            {
                text: "Soutenir le chef actuel",
                effects: {
                    black_horse: { dominance: -15, confiance: -5, hierarchie: -15, cohesion: -10 },
                    brown_horse: { dominance: -10, confiance: -5, hierarchie: -15, cohesion: -10 },
                    white_horse: { dominance: -10, confiance: -5, hierarchie: -15, cohesion: -10 }
                }
            },
            {
                text: "Laisser la nature suivre son cours",
                effects: {
                    black_horse: { dominance: 0, confiance: 0, hierarchie: -5, cohesion: -5 },
                    brown_horse: { dominance: 0, confiance: 0, hierarchie: -5, cohesion: -5 },
                    white_horse: { dominance: 0, confiance: 0, hierarchie: -5, cohesion: -5 }
                }
            }
        ]
    },

    // Situations de danger 
    {
        id: "danger_predator",
        title: "Prédateur à l'horizon",
        description: "Un loup a été repéré dans les environs.",
        scientificInfo: "Le savais-tu ? Le cheval est une proie. Son corps, ses sens et son comportement sont adaptés pour détecter et fuir les prédateurs. Les chevaux ont un champ de vision de près de 350 degrés, leur permettant de détecter rapidement les menaces.",
        choices: [
            {
                text: "Fuir immédiatement",
                effects: {
                    black_horse: { dominance: 10, confiance: 10, hierarchie: 0, cohesion: 10},
                    brown_horse: { dominance: 5, confiance: 10, hierarchie: 0, cohesion: 15 },
                    white_horse: { dominance: 5, confiance: 10, hierarchie: 0, cohesion: 10 }
                }
            },
            {
                text: "Rester calme et observer",
                effects: {
                    black_horse: { dominance: -20, confiance: -20, hierarchie: -15, cohesion: -20 },
                    brown_horse: { dominance: -15, confiance: -15, hierarchie: -10, cohesion: -15 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "danger_storm",
        title: "Tempête approche",
        description: "Une tempête se dirige vers le troupeau.",
        scientificInfo: "Le savais-tu ? Grâce à leurs sens très développés, les chevaux sont capables de détecter les variations subtiles de la pression atmosphérique, mais aussi les changements d'humidité, les odeurs et les sons que nous ne percevons pas, ce qui leur permet d'anticiper l'arrivée de tempêtes bien avant nous.",
        choices: [
            {
                text: "Chercher un abri immédiatement",
                effects: {
                    black_horse: { dominance: 10, confiance: 10, hierarchie: 10, cohesion: 10 },
                    brown_horse: { dominance: 5, confiance: 15, hierarchie: 5, cohesion: 15 },
                    white_horse: { dominance: 0, confiance: 20, hierarchie: 0, cohesion: 20 }
                }
            },
            {
                text: "Attendre pour voir l'évolution",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -10, cohesion: -20 },
                    brown_horse: { dominance: -15, confiance: -15, hierarchie: -5, cohesion: -15 },
                    white_horse: { dominance: -10, confiance: -20, hierarchie: 0, cohesion: -15 }
                }
            }
        ]
    },
    {
        id: "danger_fire",
        title: "Feu de prairie",
        description: "Un feu se propage dans la direction du troupeau.",
        scientificInfo: " Le savais-tu? Face à un danger imminent comme un feu, les troupeaux de chevaux sauvages renforcent leur cohésion et se déplacent en groupe serré, les juments et les poulains au centre, pour maximiser leurs chances de survie collective.",
        choices: [
            {
                text: "Fuir dans la direction opposée",
                effects: {
                    black_horse: { dominance: 10, confiance: 10, hierarchie: 10, cohesion: 20 },
                    brown_horse: { dominance: 5, confiance: 15, hierarchie: 5, cohesion: 25 },
                    white_horse: { dominance: 0, confiance: 20, hierarchie: 0, cohesion: 30 }
                }
            },
            {
                text: "Chercher un point d'eau",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -10, cohesion: -20 },
                    brown_horse: { dominance: -15, confiance: -5, hierarchie: -5, cohesion: -15 },
                    white_horse: { dominance: -10, confiance: 0, hierarchie: 0, cohesion: -10 }
                }
            }
        ]
    },

    // Situations sociales 
    {
        id: "social_new_member",
        title: "Nouveau membre",
        description: "Un cheval solitaire approche du troupeau.",
        scientificInfo: "Le savais-tu ? Les chevaux sont des animaux grégaires ; pour un cheval solitaire, rejoindre un troupeau est vital pour sa survie, car la vie en groupe offre une meilleure protection contre les prédateurs et un accès plus sûr aux ressources.",
        choices: [
            {
                text: "Accueillir chaleureusement",
                effects: {
                    black_horse: { dominance: -15, confiance: -15, hierarchie: -5, cohesion: -10 },
                    brown_horse: { dominance: -10, confiance: -10, hierarchie: -5, cohesion: -10 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            },
            {
                text: "Maintenir une distance",
                effects: {
                    black_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "social_mating",
        title: "Saison des amours",
        description: "La saison des amours approche, créant des tensions dans le troupeau.",
        scientificInfo: "Le savais-tu ? Les juments sont en chaleur pendant 5-7 jours tous les 21 jours. La reproduction est essentielle à la survie des populations de chevaux sauvages. Les tensions de la saison des amours sont un processus naturel qui garantit que seuls les étalons les plus aptes et vigoureux se reproduisent, assurant la force génétique du troupeau.",
        choices: [
            {
                text: "Laisser les étalons régler la hiérarchie naturellement",
                effects: {
                    black_horse: { dominance: 20, confiance: -10, hierarchie: 20, cohesion: -10 },
                    brown_horse: { dominance: 10, confiance: -5, hierarchie: 10, cohesion: -5 },
                    white_horse: { dominance: 5, confiance: 0, hierarchie: 5, cohesion: 0 }
                }
            },
            {
                text: "Maintenir l'ordre",
                effects: {
                    black_horse: { dominance: -20, confiance: 10, hierarchie: -20, cohesion: -10 },
                    brown_horse: { dominance: -10, confiance: 15, hierarchie: -10, cohesion: -15 },
                    white_horse: { dominance: -5, confiance: 20, hierarchie: -5, cohesion: -20 }
                }
            }
        ]
    },
    {
        id: "social_foal",
        title: "Naissance d'un poulain",
        description: "Une jument du troupeau vient de mettre bas.",
        scientificInfo: "Le savais-tu ? Les poulains peuvent se tenir debout et marcher dans l'heure qui suit leur naissance. Ils doivent être capables de fuir avec le troupeau très rapidement après la naissance pour échapper aux prédateurs.",
        choices: [
            {
                text: "Protéger la mère et le poulain",
                effects: {
                    black_horse: { dominance: 10, confiance: 10, hierarchie: 0, cohesion: 10 },
                    brown_horse: { dominance: 5, confiance: 15, hierarchie: 0, cohesion: 15 },
                    white_horse: { dominance: 0, confiance: 10, hierarchie: 0, cohesion: 10 }
                }
            },
            {
                text: "Continuer normalement",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -20, cohesion: -10 },
                    brown_horse: { dominance: -15, confiance: -5, hierarchie: -15, cohesion: -5 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: -10, cohesion: 0 }
                }
            }
        ]
    },

    // Situations de ressources 
    {
        id: "resource_food",
        title: "Pénurie de nourriture",
        description: "Les ressources sont limitées et certains chevaux n'ont pas assez à manger.",
        scientificInfo: "Le savais-tu ? En situation de stress alimentaire, les chevaux dominants ont priorité sur les ressources. L'accès aux ressources est directement lié à la hiérarchie sociale.",
        choices: [
            {
                text: "Partager équitablement",
                effects: {
                    black_horse: { dominance: -10, confiance: -5, hierarchie: -15, cohesion: -10 },
                    brown_horse: { dominance: -5, confiance: -5, hierarchie: -10, cohesion: -10 },
                    white_horse: { dominance: -5, confiance: -5, hierarchie: -10, cohesion: -10 }
                }
            },
            {
                text: "Laisser la hiérarchie décider",
                effects: {
                    black_horse: { dominance: 15, confiance: -5, hierarchie: 15, cohesion: -10 },
                    brown_horse: { dominance: 10, confiance: -5, hierarchie: 10, cohesion: -5 },
                    white_horse: { dominance: 10, confiance: -5, hierarchie: 10, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "resource_water",
        title: "Point d'eau limité",
        description: "Le seul point d'eau disponible est presque à sec.",
        scientificInfo: "Le savais-tu ? Bien que les chevaux puissent survivre quelques jours sans eau, une déshydratation sévère entraîne rapidement de graves problèmes de santé et peut être fatale, rendant l'accès à l'eau une priorité absolue pour le troupeau. Un cheval peut boire jusqu'à 50 litres d'eau par jour.",
        choices: [
            {
                text: "Limiter l'accès",
                effects: {
                    black_horse: { dominance: -10, confiance: -10, hierarchie: -15, cohesion: -20 },
                    brown_horse: { dominance: -10, confiance: -10, hierarchie: -10, cohesion: -20 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: -10, cohesion: -20 }
                }
            },
            {
                text: "Chercher une autre source",
                effects: {
                    black_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
            }
     } ]
    },
    {
        id: "resource_shelter",
        title: "Abri limité",
        description: "Une tempête approche mais l'abri ne peut accueillir qu'une partie du troupeau.",
        scientificInfo: "Le savais-tu ? Face à une tempête, les chevaux ont tendance à se regrouper et à tourner leur croupe vers le vent et la pluie pour minimiser leur exposition. Cependant, si un abri est disponible, les individus dominants s'y réfugieront en priorité. Les chevaux peuvent résister à des températures allant de -40°C à +40°C.",
        choices: [
            {
                text: "Protéger les plus vulnérables",
                effects: {
                    black_horse: { dominance: -15, confiance: -10, hierarchie: -15, cohesion: -10 },
                    brown_horse: { dominance: -10, confiance: -5, hierarchie: -10, cohesion: -10 },
                    white_horse: { dominance: -10, confiance: -5, hierarchie: -10, cohesion: -10 }
                }
            },
            {
                text: "Respecter la hiérarchie",
                effects: {
                    black_horse: { dominance: 15, confiance: -10, hierarchie: 10, cohesion: -10 },
                    brown_horse: { dominance: 10, confiance: -5, hierarchie: 10, cohesion: -5 },
                    white_horse: { dominance: 5, confiance: 0, hierarchie: 5, cohesion: -5 }
                }
            }
        ]
    },

    // Situations de santé 
    {
        id: "health_sick",
        title: "Membre malade",
        description: "Un membre du troupeau est tombé malade et ralentit le groupe.",
        scientificInfo: "Le savais-tu ? Les chevaux malades sont souvent isolés du groupe pour limiter la propagation des maladies.",
        choices: [
            {
                text: "Ralentir pour le soigner",
                effects: {
                    black_horse: { dominance: -10, confiance: -10, hierarchie: -10, cohesion: -10 },
                    brown_horse: { dominance: -15, confiance: -10, hierarchie: -5, cohesion: -10 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            },
            {
                text: "Continuer sans lui",
                effects: {
                    black_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "health_injury",
        title: "Blessure grave",
        description: "Un cheval s'est gravement blessé à la jambe.",
        scientificInfo: "Le savais-tu ? Un cheval gravement blessé ou incapable de fuir devient une cible immédiate pour les prédateurs, ce qui pose un dilemme crucial pour la survie de l'individu et du troupeau entier. Bien que cela semble cruel, il est souvent laissé derrière.",
        choices: [
            {
                text: "Attendre qu'il guérisse",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -10, cohesion: -10 },
                    brown_horse: { dominance: -15, confiance: -15, hierarchie: -10, cohesion: -15 },
                    white_horse: { dominance: -10, confiance: -20, hierarchie: -10, cohesion: -10 }
                }
            },
            {
                text: "le laisser seul",
                effects: {
                    black_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 0 },
                    brown_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 0 },
                    white_horse: { dominance: 10, confiance: 0, hierarchie: 5, cohesion: 0 }
                }
            }
        ]
    },
    {
        id: "health_aging",
        title: "Vieillissement",
        description: "Les membres les plus âgés du troupeau commencent à ralentir.",
        scientificInfo: "Le savais-tu ? Les chevaux sauvages vivent en moyenne 0 ans, contre 20-30 ans en captivité, ce qui rend le vieillissement un facteur critique pour leur survie en milieu naturel..",
        choices: [
            {
                text: "Adapter le rythme",
                effects: {
                    black_horse: { dominance: -10, confiance: 0, hierarchie: -10, cohesion: 0 },
                    brown_horse: { dominance: -5, confiance: 0, hierarchie: -10, cohesion: 0 },
                    white_horse: { dominance: -5, confiance: 0, hierarchie: -10, cohesion: 0 }
                }
            },
            {
                text: "Maintenir le rythme",
                effects: {
                    black_horse: { dominance: -5, confiance: -10, hierarchie: -5, cohesion: -10 },
                    brown_horse: { dominance: -5, confiance: -10, hierarchie: -5, cohesion: -10 },
                    white_horse: { dominance: -5, confiance: -10, hierarchie: -5, cohesion: -10 }
                }
            }
        ]
    },

    // Situations environnementales 
    {
        id: "env_migration",
        title: "Migration nécessaire",
        description: "Les ressources locales s'épuisent, il faut migrer.",
        scientificInfo: "Le savais-tu ? Les chevaux sauvages peuvent parcourir jusqu'à 30 km par jour, une endurance cruciale pour leur survie lors des migrations.",
        choices: [
            {
                text: "Partir immédiatement",
                effects: {
                    black_horse: { dominance: 20, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: 10, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: 5, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Attendre le printemps",
                effects: {
                    black_horse: { dominance: -15, confiance: -5, hierarchie: -5, cohesion: -5 },
                    brown_horse: { dominance: -10, confiance: -5, hierarchie: -5, cohesion: -5 },
                    white_horse: { dominance: -10, confiance: -5, hierarchie: -5, cohesion: -5 }
                }
            }
        ]
    },
    {
        id: "env_flood",
        title: "Inondation",
        description: "Une inondation menace de couper l'accès aux ressources.",
        scientificInfo: "Le savais-tu ? Les chevaux peuvent nager sur de longues distances si nécessaire, une compétence qui peut être vitale en cas d'inondation.",
        choices: [
            {
                text: "Évacuer la zone",
                effects: {
                    black_horse: { dominance: 10, confiance: 10, hierarchie: 10, cohesion: 10 },
                    brown_horse: { dominance: 5, confiance: 15, hierarchie: 5, cohesion: 15 },
                    white_horse: { dominance: 0, confiance: 20, hierarchie: 5, cohesion: 10 }
                }
            },
            {
                text: "Rester sur les hauteurs",
                effects: {
                    black_horse: { dominance: -20, confiance: -10, hierarchie: -10, cohesion: -20 },
                    brown_horse: { dominance: -15, confiance: -5, hierarchie: -5, cohesion: -15 },
                    white_horse: { dominance: -10, confiance: 0, hierarchie: 0, cohesion: -10 }
                }
            }
        ]
    },
    {
        id: "env_heat",
        title: "Canicule",
        description: "Une vague de chaleur exceptionnelle frappe la région.",
        scientificInfo: "Le savais-tu ? Les chevaux sont sujets aux coups de chaleur (hyperthermie) qui peuvent rapidement devenir mortels si leur température corporelle interne dépasse un certain seuil, surtout en l'absence d'eau suffisante.",
        choices: [
            {
                text: "Chercher l'ombre",
                effects: {
                    black_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: 0, confiance: 0, hierarchie: 0, cohesion: 0 }
                }
            },
            {
                text: "Continuer normalement",
                effects: {
                    black_horse: { dominance: -15, confiance: -10, hierarchie: 0, cohesion: 0 },
                    brown_horse: { dominance: -10, confiance: -5, hierarchie: 0, cohesion: 0 },
                    white_horse: { dominance: -10, confiance: -10, hierarchie: 0, cohesion: 0 }
                }
            }
        ]
    }
];

// Fonction pour sélectionner des situations aléatoires
function selectRandomSituations() {
    const availableSituations = baseSituations.filter(situation => !globalUsedSituations.has(situation.id));
    if (availableSituations.length < 7) {
        globalUsedSituations.clear();
        console.log("Toutes les situations ont été utilisées. Réinitialisation du cycle.");
    }
    const shuffled = [...availableSituations].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 7);
}

// Scène d'accueil

scene("welcome", () => {
    // Jouer la musique de fond
    if (!gameState.musicPlaying) {
        try {
            play("background_music", { loop: true, volume: 0.3 });
            gameState.musicPlaying = true;
        } catch (error) {
            console.warn("Erreur lors de la lecture de la musique de fond:", error);
        }
    }

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
        color(255, 255, 255), 
        fixed(),
        z(2),
    ]);

    // Effet visuel au survol
    jouerBtn.onHover(() => {
        jouerBtn.color = rgb(19, 164, 236); 
        setCursor("pointer");
    });

    jouerBtn.onHoverEnd(() => {
        jouerBtn.color = rgb(0, 0, 0); 
        setCursor("default");
    });

    jouerBtn.onClick(() => {
        playGameSound("click", { volume: 0.3 });
        go("main");
    });

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
        { name: "Noir", sprite: "black_horse", description: "Un chef de troupeau dominant" },
        { name: "Brun", sprite: "brown_horse", description: "Un esprit d'empathie" },
        { name: "Blanc", sprite: "white_horse", description: "Un esprit de clairvoyance" }
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
        playGameSound("click", { volume: 0.3 });
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
        playGameSound("click", { volume: 0.3 });
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
        playGameSound("click", { volume: 0.3 });
        startGame(horseTypes[selectedHorse]);
    });

    onKeyPress("space", () => {
        startGame(horseTypes[selectedHorse]);
    });
});



// Scène de jeu
scene("game", () => {
    gameState.herd = [];
    gameState.player = null;
    gameState.stats = {
        dominance: 100,
        confiance: 100,
        cohesion: 100,
        hierarchie: 100
    };
    gameState.currentBox = null;
    gameState.boxChoices = [];
    gameState.usedBoxes = new Set();
    gameState.availableSituations = selectRandomSituations(); 

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

    // Création des barres de statistiques
    const statsBars = {
        dominance: {
            bg: add([
                rect(200, 20),
                pos(20, 80),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 80),
                color(255, 0, 0),
                fixed(),
                z(100)
            ]),
            text: add([
                text("Dominance: 100", { size: 20, font: "Times New Roman" }),
                pos(20, 60),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        confiance: {
            bg: add([
                rect(200, 20),
                pos(20, 130),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 130),
                color(0, 255, 0),
                fixed(),
                z(100)
            ]),
            text: add([
                text("Confiance: 100", { size: 20, font: "Times New Roman" }),
                pos(20, 110),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        cohesion: {
            bg: add([
                rect(200, 20),
                pos(20, 180),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 180),
                color(0, 0, 255),
                fixed(),
                z(100)
            ]),
            text: add([
                text("Cohésion: 100", { size: 20, font: "Times New Roman" }),
                pos(20, 160),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        },
        hierarchie: {
            bg: add([
                rect(200, 20),
                pos(20, 230),
                color(80, 80, 80),
                fixed(),
                z(99)
            ]),
            bar: add([
                rect(200, 20),
                pos(20, 230),
                color(255, 255, 0),
                fixed(),
                z(100)
            ]),
            text: add([
                text("Hiérarchie: 100", { size: 20, font: "Times New Roman" }),
                pos(20, 210),
                color(255, 255, 255),
                fixed(),
                z(100)
            ])
        }
    };

    // Ajouter le cheval sélectionné 
    const selectedHorsePreview = add([
        sprite(gameState.selectedHorse.sprite),
        pos(150, height() - 100),
        anchor("center"),
        fixed(),
        z(100)
    ]);

    // Ajuster l'échelle selon cheval
    if (gameState.selectedHorse.sprite === "black_horse") {
        selectedHorsePreview.scale = vec2(0.55);
    } else if (gameState.selectedHorse.sprite === "brown_horse") {
        selectedHorsePreview.scale = vec2(0.30);
    } else {
        selectedHorsePreview.scale = vec2(0.12);
    }

    // Fonction pour mettre à jour le compteur
    function updateRemainingCount() {
        const remaining = gameState.availableSituations.length - gameState.usedBoxes.size;
        return `Situations restantes: ${remaining}`;
    }

    // Fonction pour afficher le changement de statistique
    function showStatChange(stat, value) {
        if (!statsBars[stat] || !statsBars[stat].text) return;
        
        const color = value > 0 ? rgb(0, 255, 0) : rgb(255, 0, 0);
        const sign = value > 0 ? "+" : "";
        
        const changeText = add([
            text(`${sign}${value}`, { size: 24, font: "Times New Roman" }),
            pos(250, statsBars[stat].text.pos.y),
            color,
            fixed(),
            z(101)
        ]);

        // Animation de déplacement vers le haut et disparition
        changeText.move(vec2(0, -30), 1);
        changeText.opacity = 1;

        loop(0.1, () => {
            changeText.opacity -= 0.1;
            if (changeText.opacity <= 0) {
                changeText.destroy();
            }
        });
    }

    // Fonction pour mettre à jour les statistiques
    function updateStats() {
        Object.entries(gameState.stats).forEach(([stat, value]) => {
            if (statsBars[stat] && statsBars[stat].bar) {
                statsBars[stat].bar.width = value * 2; 
            }
            if (statsBars[stat] && statsBars[stat].text) {
                statsBars[stat].text.text = `${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${value}`;
            }
        });
    }

    // Fonction pour choisir une nouvelle box
    function chooseNewBox() {
        const availableBoxes = gameState.availableSituations.filter(box => !gameState.usedBoxes.has(box.id));
        
        if (availableBoxes.length === 0) {
            showFinalScreen();
            return null;
        }
        return choose(availableBoxes);
    }

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
            `Dominance: ${gameState.stats.dominance}`,
            `Confiance: ${gameState.stats.confiance}`,
            `Cohésion: ${gameState.stats.cohesion}`,
            `Hiérarchie: ${gameState.stats.hierarchie}`
        ];

        // Calculer la moyenne des statistiques
        const average = Math.round(
            (gameState.stats.dominance + 
             gameState.stats.confiance + 
             gameState.stats.cohesion + 
             gameState.stats.hierarchie) / 4
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
            conclusion = "Excellente gestion du troupeau! les chevaux sont très soudés.";
            if (horseType === "black_horse") {
                moral = "Malgré tout, tu as su maintenir un équilibre entre autorité et respect.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie naturelle a permis de créer des liens forts au sein du troupeau.";
            } else {
                moral = "Ta clairvoyance a permis de guider le troupeau avec sagesse.";
            }
        } else if (average >= 60) {
            conclusion = "Le troupeau est stable.";
            if (horseType === "black_horse") {
                moral = "Tu as parfois été trop directif, mais le troupeau reste uni.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a permis de maintenir la cohésion, même si certaines décisions ont été difficiles.";
            } else {
                moral = "Ta clairvoyance a permis de prévoir les situations, même si certaines décisions ont été complexes.";
            }
        } else if (average >= 40) {
            conclusion = "Le troupeau est fragile.";
            if (horseType === "black_horse") {
                moral = "Tu as parfois manqué de nuance, créant des tensions dans le troupeau.";
            } else if (horseType === "brown_horse") {
                moral = "Ton empathie a parfois été un frein à la prise de décisions nécessaires.";
            } else {
                moral = "Ta clairvoyance a parfois été troublée par les émotions du moment.";
            }
        } else {
            conclusion = " Le troupeau est en difficulté.";
            if (horseType === "black_horse") {
                moral = "Tu as été trop autoritaire, créant des divisions dans le troupeau.";
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
        globalUsedSituations.add(box.id); 
        
        if (gameState.currentBox) {
            get("boxElement").forEach(element => {
                element.destroy();
            });
        } 
        gameState.currentBox = box;
        
        // Jouer le son approprié selon le type de situation
        switch(box.id) {
            case "danger_storm":
                playGameSound("thunder", { volume: 0.4 });
                break;
            case "danger_predator":
                playGameSound("wolf_howl", { volume: 0.4 });
                break;
            case "conflict_food":
            case "conflict_territory":
            case "conflict_hierarchy":
                playGameSound("horse_neigh", { volume: 0.4 });
                break;
            case "social_new_member":
                playGameSound("horse_neigh", { volume: 0.3 });
                break;
        }
        
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

        // Compteur de situations 
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
                playGameSound("hover", { volume: 0.2 });
            });

            button.onHoverEnd(() => {
                button.color = rgb(50, 50, 50); 
                setCursor("default");
            });

            button.onClick(() => {
                playGameSound("click", { volume: 0.3 });
                const horseType = gameState.selectedHorse.sprite;
                const effects = choice.effects[horseType];
                
                const changes = Object.entries(effects)
                    .map(([stat, value]) => {
                        const statName = {
                            dominance: "Dominance",
                            confiance: "Confiance",
                            hierarchie: "Hiérarchie",
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

                    get("boxElement").forEach(element => {
                        element.destroy();
                    });
                    gameState.currentBox = null;

                    // Afficher le fait scientifique 
                    const feedback = add([
                        text(box.scientificInfo, { size: 24, font: "Times New Roman", width: 600 }),
                        pos(width()/2 + 150, height()/2),
                        anchor("center"),
                        color(255, 255, 255), 
                        fixed(),
                        z(101),
                        "boxElement"
                    ]);

                    // Jouer le hennissement 
                    wait(0.5, () => {
                        playGameSound("horse_neigh", { volume: 0.3 });

                        // Bouton Suivant
                        const nextButton = add([
                            rect(200, 50),
                            pos(width()/2 + 150, height()/2 + 100),
                            anchor("center"),
                            color(50, 50, 50),
                            fixed(),
                            z(101),
                            area(),
                            "boxElement"
                        ]);

                        add([
                            text("Suivant", { size: 24, font: "Times New Roman" }),
                            pos(width()/2 + 150, height()/2 + 100),
                            anchor("center"),
                            color(255, 255, 255),
                            fixed(),
                            z(102),
                            "boxElement"
                        ]);

                        // Gestion des événements du bouton
                        nextButton.onHover(() => {
                            nextButton.color = rgb(19, 164, 236);
                            setCursor("pointer");
                            playGameSound("hover", { volume: 0.2 });
                        });

                        nextButton.onHoverEnd(() => {
                            nextButton.color = rgb(50, 50, 50);
                            setCursor("default");
                        });

                        nextButton.onClick(() => {
                            playGameSound("click", { volume: 0.3 });
                            get("boxElement").forEach(element => {
                                element.destroy();
                            });
                            const nextBox = chooseNewBox();
                            showBox(nextBox);
                        });
                    });
                });
            });
        });
    }

    // Afficher la première box au démarrage
    const firstBox = chooseNewBox();
    showBox(firstBox);

    onUpdate(() => {
        if (!gameState.currentBox) {
        }
    });

    // Bouton de contrôle du son
    const soundButton = add([
        rect(40, 40),
        pos(width() - 30, 30),
        anchor("center"),
        color(50, 50, 50),
        fixed(),
        z(100),
        area(),
        "soundButton"
    ]);

    // Icône du son
    const soundIcon = add([
        text("🔊", { size: 24 }),
        pos(width() - 30, 30),
        anchor("center"),
        color(255, 255, 255),
        fixed(),
        z(101),
        "soundIcon"
    ]);

    // Gestion des événements du bouton son
    soundButton.onHover(() => {
        soundButton.color = rgb(19, 164, 236);
        setCursor("pointer");
    });

    soundButton.onHoverEnd(() => {
        soundButton.color = rgb(50, 50, 50);
        setCursor("default");
    });

    soundButton.onClick(() => {
        gameState.soundEnabled = !gameState.soundEnabled;
        soundIcon.text = gameState.soundEnabled ? "🔊" : "🔇";
        
        if (!gameState.soundEnabled) {
            Object.keys(sounds).forEach(sound => {
                try {
                    stop(sound);
                } catch (error) {
                    console.warn(`Impossible d'arrêter le son ${sound}: ${error.message}`);
                }
            });
        } else if (gameState.musicPlaying) {
            playGameSound("background_music", { loop: true, volume: 0.3 });
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

