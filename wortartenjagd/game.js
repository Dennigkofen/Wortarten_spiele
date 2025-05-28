
// Firebase SDK imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, onValue, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC6YpwyOT_KT17g-xb9IcqVwxuTscjP7RI",
    authDomain: "wortartenspiele.firebaseapp.com",
    databaseURL: "https://wortartenspiele-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "wortartenspiele",
    storageBucket: "wortartenspiele.firebasestorage.app",
    messagingSenderId: "107115524210",
    appId: "1:107115524210:web:029bf2d80a202e01285591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let isOnline = false;

// Game Variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false, gameStarted = false, gameSpeed = 2;
let score = 0, lives = 3, currentTargetWordType = 'nomen', wordsCollected = 0;

const player = { x: 100, y: 300, width: 40, height: 30, speed: 5, color: '#FFD700' };
const keys = {};
let wordItems = [], effects = [], backgroundOffset = 0;
let currentHighscores = [];

// Word types with extensive vocabulary
const wordTypes = {
    nomen: { 
        words: ['Hund', 'Katze', 'Haus', 'Auto', 'Baum', 'Kind', 'Schule', 'Ball', 'Buch', 'Tisch', 
                'Stuhl', 'Fenster', 'Tür', 'Wand', 'Boden', 'Decke', 'Lampe', 'Computer', 'Handy', 'Fernseher',
                'Küche', 'Bett', 'Sofa', 'Garten', 'Blume', 'Apfel', 'Banane', 'Brot', 'Milch', 'Wasser',
                'Lehrer', 'Schüler', 'Mutter', 'Vater', 'Bruder', 'Schwester', 'Freund', 'Familie', 'Stadt', 'Land',
                'Berg', 'See', 'Fluss', 'Meer', 'Strand', 'Park', 'Straße', 'Platz', 'Laden', 'Markt',
                'Zeit', 'Tag', 'Nacht', 'Woche', 'Monat', 'Jahr', 'Stunde', 'Minute', 'Morgen', 'Abend',
                'Sonne', 'Mond', 'Stern', 'Himmel', 'Wolke', 'Regen', 'Schnee', 'Wind', 'Wetter', 'Luft']
    },
    verb: { 
        words: ['laufen', 'essen', 'spielen', 'lesen', 'trinken', 'schlafen', 'sehen', 'machen', 'gehen', 'kommen',
                'sprechen', 'hören', 'fühlen', 'denken', 'wissen', 'lernen', 'arbeiten', 'schreiben', 'rechnen', 'singen',
                'tanzen', 'lachen', 'weinen', 'rufen', 'flüstern', 'fragen', 'antworten', 'helfen', 'kaufen', 'verkaufen',
                'öffnen', 'schließen', 'beginnen', 'aufhören', 'fahren', 'fliegen', 'schwimmen', 'springen', 'fallen', 'steigen',
                'stehen', 'sitzen', 'liegen', 'warten', 'suchen', 'finden', 'verlieren', 'gewinnen', 'geben', 'nehmen',
                'tragen', 'ziehen', 'drücken', 'werfen', 'fangen', 'bauen', 'kochen', 'backen', 'waschen', 'putzen',
                'reparieren', 'malen', 'zeichnen', 'fotografieren', 'filmen', 'reisen', 'wandern', 'klettern', 'rennen', 'joggen']
    },
    adjektiv: { 
        words: ['schön', 'groß', 'klein', 'rot', 'schnell', 'langsam', 'alt', 'neu', 'heiß', 'kalt', 'lang', 'kurz',
                'breit', 'schmal', 'dick', 'dünn', 'schwer', 'leicht', 'stark', 'schwach', 'laut', 'leise', 'hell', 'dunkel',
                'sauber', 'schmutzig', 'nass', 'trocken', 'weich', 'hart', 'glatt', 'rau', 'süß', 'sauer', 'bitter', 'salzig',
                'gut', 'schlecht', 'richtig', 'falsch', 'einfach', 'schwierig', 'wichtig', 'unwichtig', 'interessant', 'langweilig',
                'lustig', 'traurig', 'fröhlich', 'müde', 'wach', 'krank', 'gesund', 'hungrig', 'satt', 'durstig',
                'jung', 'grün', 'blau', 'gelb', 'schwarz', 'weiß', 'braun', 'orange', 'lila', 'rosa',
                'rund', 'eckig', 'spitz', 'flach', 'tief', 'hoch', 'niedrig', 'voll', 'leer', 'offen', 'geschlossen']
    },
    pronomen: { 
        words: ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'sich', 'uns', 'euch',
                'mir', 'dir', 'ihm', 'ihnen', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
                'meine', 'deine', 'seine', 'ihre', 'unsere', 'eure', 'meinen', 'deinen', 'seinen', 'ihren',
                'dieser', 'diese', 'dieses', 'jener', 'jene', 'jenes', 'welcher', 'welche', 'welches',
                'wer', 'was', 'wo', 'wie', 'wann', 'warum', 'wohin', 'woher', 'womit', 'worüber',
                'jeder', 'jede', 'jedes', 'alle', 'alles', 'niemand', 'nichts', 'etwas', 'man', 'einer']
    },
    partikel: { 
        words: ['und', 'oder', 'aber', 'denn', 'sondern', 'weil', 'dass', 'wenn', 'als', 'ob', 'obwohl', 'damit',
                'in', 'auf', 'an', 'bei', 'mit', 'nach', 'zu', 'von', 'aus', 'über', 'unter', 'durch', 'für',
                'gegen', 'ohne', 'um', 'zwischen', 'neben', 'vor', 'hinter', 'seit', 'während', 'bis', 'außer',
                'sehr', 'ziemlich', 'ganz', 'fast', 'etwa', 'ungefähr', 'besonders', 'nur', 'auch', 'noch', 'schon',
                'hier', 'dort', 'da', 'oben', 'unten', 'links', 'rechts', 'vorn', 'hinten', 'überall', 'nirgends',
                'heute', 'gestern', 'morgen', 'jetzt', 'dann', 'später', 'früher', 'immer', 'nie', 'oft', 'manchmal',
                'ja', 'nein', 'vielleicht', 'bestimmt', 'sicher', 'wahrscheinlich', 'hoffentlich', 'leider', 'natürlich']
    }
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.y = canvas.height / 2;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (!gameStarted && gameRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        gameStarted = true;
    }
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Firebase Highscore System
function updateOnlineStatus(online) {
    isOnline = online;
    const statusEl = document.getElementById('onlineStatus');
    if (online) {
        statusEl.textContent = '🌐 Online verbunden';
        statusEl.className = 'online-status';
    } else {
        statusEl.textContent = '⚠️ Offline';
        statusEl.className = 'online-status offline';
    }
}

function loadHighscores() {
    try {
        const highscoresRef = ref(database, 'highscores');
        onValue(highscoresRef, (snapshot) => {
            const data = snapshot.val();
            currentHighscores = [];
            
            if (data) {
                Object.keys(data).forEach(key => {
                    currentHighscores.push({
                        id: key,
                        ...data[key]
                    });
                });
            }
            
            currentHighscores.sort((a, b) => b.score - a.score);
            currentHighscores = currentHighscores.slice(0, 15);
            
            displayHighscores();
            updateOnlineStatus(true);
        }, (error) => {
            console.error('Firebase connection error:', error);
            updateOnlineStatus(false);
            displayHighscores();
        });
    } catch (error) {
        console.error('Firebase initialization error:', error);
        updateOnlineStatus(false);
        displayHighscores();
    }
}

function displayHighscores() {
    ['topScores', 'gameOverScores'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        
        if (currentHighscores.length === 0) {
            if (isOnline) {
                el.innerHTML = '<p class="loading">Lade Online-Highscores...</p>';
            } else {
                lives--; 
                createEffect(item.x + 50, item.y + 25, false);
                if (lives <= 0) endGame();
            }
            
            wordItems.splice(i, 1);
            continue;
        }
        
        if (item.x + item.width < 0) wordItems.splice(i, 1);
    }
}

function createEffect(x, y, positive) {
    effects.push({ 
        x, y, 
        velY: -3, 
        life: 60, 
        maxLife: 60, 
        type: 'text', 
        text: positive ? '+10' : '-1❤️', 
        color: positive ? '#2ECC71' : '#E74C3C' 
    });
    
    // Particle effects
    for (let i = 0; i < 6; i++) {
        effects.push({
            x: x + Math.random() * 30 - 15, 
            y: y + Math.random() * 30 - 15,
            velX: Math.random() * 4 - 2, 
            velY: Math.random() * 4 - 2,
            life: 30, 
            maxLife: 30, 
            type: 'particle',
            color: positive ? '#2ECC71' : '#E74C3C'
        });
    }
}

function updateEffects() {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.life--;
        
        if (effect.type === 'text') {
            effect.y += effect.velY;
        } else if (effect.type === 'particle') {
            effect.x += effect.velX;
            effect.y += effect.velY;
            effect.velY += 0.2;
        }
        
        if (effect.life <= 0) effects.splice(i, 1);
    }
}

function drawBackground() {
    if (gameStarted) { 
        backgroundOffset -= gameSpeed * 0.3; 
        if (backgroundOffset <= -200) backgroundOffset = 0; 
    }
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) {
        const x = (i * 250 + backgroundOffset) % (canvas.width + 100);
        const y = 80 + i * 50;
        
        ctx.beginPath(); 
        ctx.arc(x, y, 25, 0, Math.PI * 2); 
        ctx.arc(x + 20, y, 30, 0, Math.PI * 2); 
        ctx.arc(x + 40, y, 25, 0, Math.PI * 2); 
        ctx.fill();
    }
    
    // Ground
    ctx.fillStyle = '#8FBC8F'; 
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Ground pattern
    ctx.fillStyle = '#7A8471';
    for (let i = backgroundOffset; i < canvas.width; i += 60) {
        ctx.fillRect(i, canvas.height - 30, 30, 30);
    }
}

function drawPlayer() {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(player.x + 3, player.y + 3, player.width, player.height);
    
    // Bird body
    ctx.fillStyle = player.color; 
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(player.x + 10, player.y + 8, 15, 8);
    
    // Beak
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(player.x + player.width, player.y + 10, 8, 6);
    
    // Eye
    ctx.fillStyle = 'white'; 
    ctx.fillRect(player.x + 25, player.y + 5, 8, 8);
    ctx.fillStyle = 'black'; 
    ctx.fillRect(player.x + 27, player.y + 7, 4, 4);
}

function drawWordItems() {
    wordItems.forEach(item => {
        if (!item.collected) {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(item.x + 3, item.y + 3, item.width, item.height);
            
            // Word background - same color for all!
            ctx.fillStyle = '#4ECDC4'; 
            ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // Border
            ctx.strokeStyle = 'white'; 
            ctx.lineWidth = 2; 
            ctx.strokeRect(item.x, item.y, item.width, item.height);
            
            // Word text
            ctx.fillStyle = 'white'; 
            ctx.font = 'bold 16px Comic Sans MS'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.word, item.x + item.width/2, item.y + item.height/2);
        }
    });
}

function drawEffects() {
    effects.forEach(effect => {
        const alpha = effect.life / effect.maxLife;
        
        if (effect.type === 'text') {
            ctx.font = 'bold 24px Comic Sans MS'; 
            ctx.textAlign = 'center'; 
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha; 
            ctx.fillText(effect.text, effect.x, effect.y);
        } else if (effect.type === 'particle') {
            ctx.fillStyle = effect.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(effect.x, effect.y, 4, 4);
        }
    });
    ctx.globalAlpha = 1;
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updatePlayer(); 
    spawnWordItem(); 
    updateWordItems(); 
    updateEffects();
    
    drawBackground(); 
    drawPlayer(); 
    drawWordItems(); 
    drawEffects();
    
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    
    if (gameStarted) gameSpeed += 0.001;
    
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    
    const performanceTexts = [
        '🔄 Versuch es nochmal!',
        '📚 Weiter üben!', 
        '👍 Gut gemacht!', 
        '⭐ Sehr gut!', 
        '🏆 Grammatik-Experte!'
    ];
    const index = Math.min(4, Math.floor(score / 100));
    document.getElementById('performanceText').textContent = performanceTexts[index];
    
    if (isNewHighscore(score)) {
        document.getElementById('newHighscoreSection').style.display = 'block';
        document.getElementById('playerName').focus();
    }
    displayHighscores();
    document.getElementById('gameOver').style.display = 'flex';
}

async function submitHighscore() {
    const name = document.getElementById('playerName').value.trim() || 'Anonym';
    const submitBtn = document.getElementById('submitBtn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = '💾 Speichere...';

    try {
        await addHighscore(name, score);
        submitBtn.textContent = '✅ Gespeichert!';
        document.getElementById('newHighscoreSection').style.display = 'none';
    } catch (error) {
        console.error('Error submitting highscore:', error);
        submitBtn.textContent = '❌ Fehler - nochmal?';
        submitBtn.disabled = false;
        alert('Konnte Highscore nicht speichern. Versuche es nochmal!');
    }
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('newHighscoreSection').style.display = 'none';
    startGame();
}

// Make functions globally available
window.startGame = startGame;
window.submitHighscore = submitHighscore;
window.restartGame = restartGame;

// Initialize game
loadHighscores();
ctx.textAlign = 'left'; 
ctx.textBaseline = 'top';

// Enter key for name input
document.getElementById('playerName').addEventListener('keypress', e => { 
    if (e.key === 'Enter') submitHighscore(); 
}); {
                el.innerHTML = '<p>Keine Verbindung zur Online-Datenbank</p>';
            }
        } else {
            currentHighscores.slice(0, 10).forEach((entry, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const div = document.createElement('div');
                div.className = 'highscore-entry';
                if (entry.isNew) div.classList.add('new-entry');
                
                div.innerHTML = `
                    <span class="highscore-rank">${medals[i] || (i + 1) + '.'}</span>
                    <span class="highscore-name">${entry.name}</span>
                    <span class="highscore-score">${entry.score}</span>
                `;
                el.appendChild(div);
            });
        }
    });
}

async function addHighscore(name, score) {
    if (!isOnline) {
        throw new Error('Nicht online');
    }

    try {
        const newHighscore = {
            name: name,
            score: score,
            timestamp: serverTimestamp(),
            date: new Date().toISOString()
        };

        const highscoresRef = ref(database, 'highscores');
        await push(highscoresRef, newHighscore);
        return true;
    } catch (error) {
        console.error('Error adding highscore:', error);
        throw error;
    }
}

function isNewHighscore(score) {
    return currentHighscores.length < 10 || score > (currentHighscores[9]?.score || 0);
}

// Game Functions
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameRunning = true; 
    gameStarted = false; 
    score = 0; 
    lives = 3; 
    gameSpeed = 2;
    wordItems = []; 
    effects = []; 
    wordsCollected = 0;
    
    player.x = 100; 
    player.y = canvas.height / 2;
    
    chooseNewTargetWordType();
    gameLoop();
}

function chooseNewTargetWordType() {
    const types = Object.keys(wordTypes);
    currentTargetWordType = types[Math.floor(Math.random() * types.length)];
    const names = { 
        nomen: 'Nomen', 
        verb: 'Verben', 
        adjektiv: 'Adjektive', 
        pronomen: 'Pronomen', 
        partikel: 'Partikel' 
    };
    document.getElementById('targetWordType').textContent = names[currentTargetWordType];
    
    // Reset counter for next cycle
    wordsCollected = 0;
}

function updatePlayer() {
    if (!gameStarted) return;
    if (keys['ArrowUp']) player.y = Math.max(20, player.y - player.speed);
    if (keys['ArrowDown']) player.y = Math.min(canvas.height - 70, player.y + player.speed);
    if (keys['ArrowLeft']) player.x = Math.max(20, player.x - player.speed);
    if (keys['ArrowRight']) player.x = Math.min(canvas.width - 100, player.x + player.speed);
    if (player.x <= 0 || player.x + player.width >= canvas.width || 
        player.y <= 0 || player.y + player.height >= canvas.height - 50) endGame();
}

function spawnWordItem() {
    if (gameStarted && Math.random() < 0.02) {
        const types = Object.keys(wordTypes);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const words = wordTypes[randomType].words;
        wordItems.push({
            x: canvas.width, 
            y: Math.random() * (canvas.height - 200) + 100,
            width: 100, 
            height: 50, 
            type: randomType,
            word: words[Math.floor(Math.random() * words.length)], 
            collected: false
        });
    }
}

function updateWordItems() {
    for (let i = wordItems.length - 1; i >= 0; i--) {
        const item = wordItems[i];
        if (gameStarted) item.x -= gameSpeed;
        
        if (!item.collected && 
            player.x < item.x + item.width && 
            player.x + player.width > item.x && 
            player.y < item.y + item.height && 
            player.y + player.height > item.y) {
            
            item.collected = true;
            
            if (item.type === currentTargetWordType) {
                score += 10; 
                wordsCollected++;
                createEffect(item.x + 50, item.y + 25, true);
                
                // Check if we need to change word type (every 5 correct words)
                if (wordsCollected >= 5) {
                    chooseNewTargetWordType();
                }
            } else
