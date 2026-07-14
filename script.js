/* ============================================
   THE TRAIN TO TALAT - MAGICAL JOURNEY
   Cinematic Interactive JavaScript
   ============================================ */

// ============================================
// GLOBAL STATE
// ============================================
let currentStation = 1;
let totalStations = 9;
let musicStarted = false;
let musicMuted = false;
let transitionInProgress = false;
let particlesInterval = null;
let fireworksInterval = null;
let confettiInterval = null;

// DOM Elements
const bgMusic = document.getElementById('bg-music');
const whistleSound = document.getElementById('whistle-sound');
const musicControl = document.getElementById('music-control');
const musicBtn = document.getElementById('music-btn');
const transitionOverlay = document.getElementById('transition-overlay');
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const particleCanvas = document.getElementById('particle-canvas');
const fireworksCanvas = document.getElementById('fireworks-canvas');
const constellationCanvas = document.getElementById('constellation-canvas');

const pCtx = particleCanvas.getContext('2d');
const fCtx = fireworksCanvas.getContext('2d');
const cCtx = constellationCanvas ? constellationCanvas.getContext('2d') : null;

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('load', () => {
    // Set canvas sizes
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    
    // Start loading
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            initStation1();
        }, 1500);
    }, 2800);
    
    // Show music control after loading
    setTimeout(() => {
        musicControl.classList.remove('hidden');
    }, 3500);
    
    // Show progress bar
    setTimeout(() => {
        progressBar.classList.add('show');
        updateProgressBar();
    }, 4000);
});

function resizeCanvases() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    particleCanvas.width = w;
    particleCanvas.height = h;
    fireworksCanvas.width = w;
    fireworksCanvas.height = h;
    if (constellationCanvas) {
        constellationCanvas.width = w;
        constellationCanvas.height = h;
    }
}

// ============================================
// MUSIC SYSTEM
// ============================================
// Create ambient music using Web Audio API (no external files needed)
let audioCtx = null;
let musicNodes = [];

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function createAmbientMusic() {
    initAudioContext();
    
    // Create a dreamy ambient pad
    const frequencies = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23]; // C major-ish
    const notes = [];
    
    frequencies.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        gain.gain.value = 0.03;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        notes.push({ osc, gain, filter, baseFreq: freq });
    });
    
    // Add gentle modulation
    setInterval(() => {
        notes.forEach((note, i) => {
            const detune = Math.sin(Date.now() * 0.001 + i) * 5;
            note.osc.frequency.setValueAtTime(
                note.baseFreq + detune, 
                audioCtx.currentTime
            );
        });
    }, 100);
    
    musicNodes = notes;
}

function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    
    createAmbientMusic();
    musicBtn.classList.add('playing');
    
    // Also try to play bg-music if source is set
    if (bgMusic.src) {
        bgMusic.play().catch(() => {});
    }
}

function toggleMusic() {
    if (!musicStarted) {
        startMusic();
        return;
    }
    
    musicMuted = !musicMuted;
    
    musicNodes.forEach(node => {
        node.gain.gain.setValueAtTime(
            musicMuted ? 0 : 0.03,
            audioCtx.currentTime
        );
    });
    
    if (bgMusic.src) {
        bgMusic.muted = musicMuted;
    }
    
    musicBtn.classList.toggle('playing', !musicMuted);
}

musicBtn.addEventListener('click', toggleMusic);

// Start music on first user interaction
document.addEventListener('click', () => {
    if (!musicStarted) startMusic();
}, { once: true });

document.addEventListener('touchstart', () => {
    if (!musicStarted) startMusic();
}, { once: true });

// ============================================
// STATION NAVIGATION
// ============================================
function goToStation(num) {
    if (transitionInProgress || num === currentStation) return;
    if (num < 1 || num > totalStations) return;
    
    transitionInProgress = true;
    
    // Fade out current
    transitionOverlay.classList.add('active');
    
    setTimeout(() => {
        // Hide current station
        document.querySelectorAll('.station').forEach(s => {
            s.classList.remove('active');
        });
        
        // Clear all particle effects
        clearAllEffects();
        
        // Show new station
        const newStation = document.getElementById(`station${num}`);
        if (newStation) {
            newStation.classList.add('active');
            currentStation = num;
            updateProgressBar();
            
            // Initialize station-specific effects
            setTimeout(() => {
                initStationEffects(num);
            }, 300);
        }
        
        // Fade in
        setTimeout(() => {
            transitionOverlay.classList.remove('active');
            transitionInProgress = false;
        }, 600);
    }, 1200);
}

function clearAllEffects() {
    // Clear intervals
    if (particlesInterval) {
        clearInterval(particlesInterval);
        particlesInterval = null;
    }
    if (fireworksInterval) {
        clearInterval(fireworksInterval);
        fireworksInterval = null;
    }
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
    
    // Clear canvas
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    fCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    if (cCtx) cCtx.clearRect(0, 0, constellationCanvas.width, constellationCanvas.height);
    
    // Remove dynamic elements
    document.querySelectorAll('.raindrop, .petal, .confetti, .sparkle, .dust, .lantern, .firefly, .floating-heart, .final-particle').forEach(el => el.remove());
}

function updateProgressBar() {
    const percent = ((currentStation - 1) / (totalStations - 1)) * 100;
    progressFill.style.width = `${percent}%`;
    
    document.querySelectorAll('.stop').forEach((stop, i) => {
        stop.classList.toggle('active', i + 1 <= currentStation);
    });
}

// Progress bar click navigation
document.querySelectorAll('.stop').forEach(stop => {
    stop.addEventListener('click', () => {
        const station = parseInt(stop.dataset.station);
        if (station <= currentStation + 1) {
            goToStation(station);
        }
    });
});

// Next station buttons
document.querySelectorAll('.next-station-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const next = parseInt(btn.dataset.next);
        goToStation(next);
    });
});

// ============================================
// STATION-SPECIFIC INITIALIZERS
// ============================================
function initStationEffects(num) {
    switch(num) {
        case 1: initStation1(); break;
        case 2: initStation2(); break;
        case 3: initStation3(); break;
        case 4: initStation4(); break;
        case 5: initStation5(); break;
        case 6: initStation6(); break;
        case 7: initStation7(); break;
        case 8: initStation8(); break;
        case 9: initStation9(); break;
    }
}

// ---- Station 1: The Departure ----
function initStation1() {
    // Typewriter sequence
    const t1 = document.getElementById('s1-text1');
    const t2 = document.getElementById('s1-text2');
    const t3 = document.getElementById('s1-text3');
    const boardBtn = document.getElementById('board-btn');
    const whistle = document.getElementById('whistle-container');
    
    // Reset
    [t1, t2, t3].forEach(t => {
        t.classList.remove('animate');
        t.style.width = '0';
        t.style.opacity = '0';
        t.style.borderRight = '2px solid var(--gold)';
    });
    boardBtn.style.opacity = '0';
    boardBtn.style.pointerEvents = 'none';
    whistle.classList.remove('animate');
    
    // Start sequence
    setTimeout(() => {
        t1.classList.add('animate');
        t1.style.opacity = '1';
    }, 500);
    
    setTimeout(() => {
        t2.classList.add('animate');
        t2.style.opacity = '1';
    }, 3500);
    
    setTimeout(() => {
        t3.classList.add('animate');
        t3.style.opacity = '1';
    }, 6500);
    
    // Show whistle
    setTimeout(() => {
        whistle.classList.add('animate');
        whistleSound.play().catch(() => {});
    }, 9500);
    
    // Show button
    setTimeout(() => {
        boardBtn.style.transition = 'opacity 1s ease';
        boardBtn.style.opacity = '1';
        boardBtn.style.pointerEvents = 'all';
    }, 11500);
    
    // Board button click
    boardBtn.onclick = () => {
        goToStation(2);
    };
    
    // Create rain
    createRain();
}

function createRain() {
    const container = document.querySelector('.rain-container');
    if (!container) return;
    
    for (let i = 0; i < 80; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.5 + Math.random() * 0.8}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.height = `${15 + Math.random() * 20}px`;
        container.appendChild(drop);
    }
}

// ---- Station 2: The Blossom Valley ----
function initStation2() {
    const t1 = document.getElementById('s2-text1');
    const t2 = document.getElementById('s2-text2');
    const author = document.querySelector('.quote-author');
    const nextBtn = document.querySelector('#station2 .next-station-btn');
    
    // Reset
    [t1, t2].forEach(t => {
        t.classList.remove('animate');
        t.style.width = '0';
        t.style.opacity = '0';
    });
    if (author) author.classList.remove('show');
    if (nextBtn) nextBtn.classList.remove('show');
    
    // Sequence
    setTimeout(() => {
        t1.classList.add('animate');
        t1.style.opacity = '1';
    }, 500);
    
    setTimeout(() => {
        t2.classList.add('animate');
        t2.style.opacity = '1';
    }, 3500);
    
    setTimeout(() => {
        if (author) author.classList.add('show');
    }, 5500);
    
    setTimeout(() => {
        if (nextBtn) nextBtn.classList.add('show');
    }, 7000);
    
    // Create petals
    createPetals();
    
    // Parallax effect on mouse move
    const station2 = document.getElementById('station2');
    station2.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        const bg = station2.querySelector('.bg-image');
        if (bg) {
            bg.style.transform = `scale(1.1) translate(${-x}px, ${-y}px)`;
        }
    });
}

function createPetals() {
    const container = document.querySelector('.petal-container');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.animationDuration = `${5 + Math.random() * 8}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;
        const size = 8 + Math.random() * 12;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        container.appendChild(petal);
    }
}

// ---- Station 3: The Memory Coach ----
function initStation3() {
    const nextBtn = document.querySelector('#station3 .next-station-btn');
    if (nextBtn) {
        nextBtn.classList.remove('show');
        setTimeout(() => nextBtn.classList.add('show'), 4000);
    }
    
    // Create dust particles
    createDust();
    
    // Photo click handlers
    document.querySelectorAll('.polaroid').forEach(polaroid => {
        polaroid.addEventListener('click', () => {
            const img = polaroid.querySelector('img');
            const caption = polaroid.dataset.caption;
            openPhotoModal(img.src, caption);
        });
    });
}

function createDust() {
    const container = document.querySelector('.dust-particles');
    if (!container) return;
    
    for (let i = 0; i < 25; i++) {
        const dust = document.createElement('div');
        dust.className = 'dust';
        dust.style.left = `${Math.random() * 100}%`;
        dust.style.animationDuration = `${8 + Math.random() * 12}s`;
        dust.style.animationDelay = `${Math.random() * 8}s`;
        container.appendChild(dust);
    }
}

// Photo Modal
const photoModal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-img');
const modalCaption = document.querySelector('.modal-caption');
const modalClose = document.querySelector('.modal-close');

function openPhotoModal(src, caption) {
    modalImg.src = src;
    modalCaption.textContent = caption || '';
    photoModal.classList.add('active');
}

modalClose.addEventListener('click', () => {
    photoModal.classList.remove('active');
});

photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) {
        photoModal.classList.remove('active');
    }
});

// ---- Station 4: Birthday Town ----
function initStation4() {
    const bdayNum = document.getElementById('birthday-number');
    const bdayText = document.getElementById('birthday-text');
    const nextBtn = document.querySelector('#station4 .next-station-btn');
    
    bdayNum.classList.remove('show');
    bdayText.classList.remove('show');
    if (nextBtn) nextBtn.classList.remove('show');
    
    // Show "19" with dramatic effect
    setTimeout(() => {
        bdayNum.classList.add('show');
        startFireworks();
    }, 500);
    
    // Show "Happy Birthday Talat"
    setTimeout(() => {
        bdayText.classList.add('show');
        createConfetti();
        createSparkles();
    }, 2500);
    
    setTimeout(() => {
        if (nextBtn) nextBtn.classList.add('show');
    }, 5000);
}

function createConfetti() {
    const container = document.querySelector('.confetti-container');
    if (!container) return;
    
    const colors = ['#ff6b8a', '#f8b500', '#74b9ff', '#a29bfe', '#fd79a8', '#00cec9', '#fab1a0', '#ffeaa7'];
    
    for (let i = 0; i < 60; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = `${3 + Math.random() * 4}s`;
        confetti.style.animationDelay = `${Math.random() * 3}s`;
        confetti.style.width = `${6 + Math.random() * 8}px`;
        confetti.style.height = `${6 + Math.random() * 8}px`;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        container.appendChild(confetti);
    }
}

function createSparkles() {
    const container = document.querySelector('.sparkle-container');
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 2}s`;
        sparkle.style.animationDuration = `${1 + Math.random()}s`;
        container.appendChild(sparkle);
    }
}

// Canvas Fireworks
let fireworks = [];
let fireworksAnimationId = null;

function startFireworks() {
    fireworks = [];
    
    function launchFirework() {
        const x = Math.random() * fireworksCanvas.width;
        const targetY = 50 + Math.random() * (fireworksCanvas.height * 0.4);
        const color = `hsl(${Math.random() * 360}, 80%, 70%)`;
        
        fireworks.push({
            x, y: fireworksCanvas.height,
            targetY, color,
            vx: (Math.random() - 0.5) * 2,
            vy: -(8 + Math.random() * 5),
            exploded: false,
            particles: [],
            life: 0
        });
    }
    
    // Launch fireworks periodically
    fireworksInterval = setInterval(launchFirework, 800);
    launchFirework();
    launchFirework();
    
    function animate() {
        fCtx.fillStyle = 'rgba(0,0,0,0.1)';
        fCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        
        fireworks.forEach((fw, i) => {
            if (!fw.exploded) {
                // Rising
                fw.x += fw.vx;
                fw.y += fw.vy;
                fw.vy += 0.15; // gravity
                
                fCtx.fillStyle = fw.color;
                fCtx.beginPath();
                fCtx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
                fCtx.fill();
                
                // Trail
                fCtx.fillStyle = fw.color + '40';
                fCtx.beginPath();
                fCtx.arc(fw.x, fw.y + 10, 2, 0, Math.PI * 2);
                fCtx.fill();
                
                if (fw.vy >= 0 || fw.y <= fw.targetY) {
                    fw.exploded = true;
                    // Create explosion particles
                    const particleCount = 30 + Math.floor(Math.random() * 30);
                    for (let j = 0; j < particleCount; j++) {
                        const angle = (Math.PI * 2 * j) / particleCount + (Math.random() - 0.5) * 0.5;
                        const speed = 2 + Math.random() * 4;
                        fw.particles.push({
                            x: fw.x, y: fw.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 1,
                            decay: 0.01 + Math.random() * 0.02,
                            size: 2 + Math.random() * 3
                        });
                    }
                }
            } else {
                // Explosion particles
                fw.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.08;
                    p.life -= p.decay;
                    
                    if (p.life > 0) {
                        fCtx.globalAlpha = p.life;
                        fCtx.fillStyle = fw.color;
                        fCtx.beginPath();
                        fCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                        fCtx.fill();
                        fCtx.globalAlpha = 1;
                    }
                });
                
                fw.particles = fw.particles.filter(p => p.life > 0);
                fw.life++;
            }
        });
        
        fireworks = fireworks.filter(fw => !fw.exploded || fw.particles.length > 0);
        
        fireworksAnimationId = requestAnimationFrame(animate);
    }
    
    animate();
}

// ---- Station 5: The Wishes Platform ----
function initStation5() {
    const nextBtn = document.querySelector('#station5 .next-station-btn');
    if (nextBtn) {
        nextBtn.classList.remove('show');
        setTimeout(() => nextBtn.classList.add('show'), 12000);
    }
    
    // Show wishes one by one
    document.querySelectorAll('.wish-card').forEach((card, i) => {
        card.classList.remove('show');
        setTimeout(() => {
            card.classList.add('show');
        }, 500 + i * 1500);
    });
    
    // Create petals and lanterns
    createPetalsStation5();
    createLanterns();
}

function createPetalsStation5() {
    const container = document.querySelector('#station5 .petal-container');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.animationDuration = `${6 + Math.random() * 8}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(petal);
    }
}

function createLanterns() {
    const container = document.querySelector('.floating-lanterns');
    if (!container) return;
    
    for (let i = 0; i < 12; i++) {
        const lantern = document.createElement('div');
        lantern.className = 'lantern';
        lantern.style.left = `${Math.random() * 100}%`;
        lantern.style.animationDuration = `${12 + Math.random() * 10}s`;
        lantern.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(lantern);
    }
}

// ---- Station 6: The Secret Package ----
function initStation6() {
    const package_ = document.getElementById('secret-package');
    const envelope = document.getElementById('envelope-reveal');
    const nextBtn = document.getElementById('s6-next');
    
    package_.classList.remove('hidden');
    envelope.classList.remove('show');
    if (nextBtn) {
        nextBtn.classList.remove('show');
        nextBtn.classList.add('hidden');
    }
    
    package_.onclick = () => {
        package_.classList.add('hidden');
        
        // Create sparkles effect
        createPackageSparkles();
        
        setTimeout(() => {
            envelope.classList.add('show');
        }, 300);
        
        setTimeout(() => {
            if (nextBtn) {
                nextBtn.classList.remove('hidden');
                setTimeout(() => nextBtn.classList.add('show'), 100);
            }
        }, 1500);
    };
}

function createPackageSparkles() {
    const scene = document.querySelector('.package-scene');
    if (!scene) return;
    
    for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: absolute;
            width: ${4 + Math.random() * 6}px;
            height: ${4 + Math.random() * 6}px;
            background: ${Math.random() > 0.5 ? 'var(--star-gold)' : 'var(--rose)'};
            border-radius: 50%;
            left: 50%;
            top: 50%;
            pointer-events: none;
            animation: packageSparkle 1s ease-out forwards;
            animation-delay: ${Math.random() * 0.3}s;
        `;
        scene.appendChild(sparkle);
        
        // Custom animation per sparkle
        const angle = (Math.PI * 2 * i) / 20;
        const distance = 50 + Math.random() * 100;
        sparkle.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`, opacity: 0 }
        ], {
            duration: 800 + Math.random() * 400,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }
}

// ---- Station 7: The Letter Station ----
function initStation7() {
    const envelope = document.getElementById('letter-envelope');
    const letter = document.getElementById('letter-opened');
    const nextBtn = document.getElementById('s7-next');
    
    envelope.classList.remove('hidden');
    letter.classList.remove('show');
    if (nextBtn) {
        nextBtn.classList.add('hidden');
        nextBtn.classList.remove('show');
    }
    
    // Reset letter lines
    document.querySelectorAll('.letter-line').forEach(line => {
        line.classList.remove('show');
    });
    
    envelope.onclick = () => {
        envelope.classList.add('hidden');
        
        setTimeout(() => {
            letter.classList.add('show');
            
            // Reveal lines one by one
            const lines = document.querySelectorAll('.letter-line');
            lines.forEach((line, i) => {
                setTimeout(() => {
                    line.classList.add('show');
                }, 500 + i * 800);
            });
            
            // Show next button after letter is fully read
            setTimeout(() => {
                if (nextBtn) {
                    nextBtn.classList.remove('hidden');
                    setTimeout(() => nextBtn.classList.add('show'), 100);
                }
            }, 500 + lines.length * 800 + 1000);
        }, 400);
    };
    
    createDust();
}

// ---- Station 8: The Starlight Bridge ----
function initStation8() {
    const constellationText = document.getElementById('constellation-text');
    const starName = document.getElementById('star-name');
    const nextBtn = document.querySelector('#station8 .next-station-btn');
    
    constellationText.classList.remove('show');
    starName.classList.remove('show');
    if (nextBtn) nextBtn.classList.remove('show');
    
    // Show text
    setTimeout(() => {
        constellationText.classList.add('show');
    }, 500);
    
    // Start constellation drawing
    setTimeout(() => {
        drawConstellation();
    }, 2500);
    
    // Show star name
    setTimeout(() => {
        starName.classList.add('show');
    }, 6000);
    
    setTimeout(() => {
        if (nextBtn) nextBtn.classList.add('show');
    }, 9000);
    
    createFireflies();
    createStarField();
}

function createFireflies() {
    const container = document.querySelector('.firefly-container');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefly.style.left = `${Math.random() * 100}%`;
        firefly.style.top = `${Math.random() * 100}%`;
        firefly.style.animationDuration = `${5 + Math.random() * 8}s`;
        firefly.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(firefly);
    }
}

function createStarField() {
    // Draw background stars on constellation canvas
    if (!cCtx) return;
    
    cCtx.clearRect(0, 0, constellationCanvas.width, constellationCanvas.height);
    
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * constellationCanvas.width;
        const y = Math.random() * constellationCanvas.height;
        const size = Math.random() * 2;
        const brightness = 0.3 + Math.random() * 0.7;
        
        cCtx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        cCtx.beginPath();
        cCtx.arc(x, y, size, 0, Math.PI * 2);
        cCtx.fill();
    }
}

function drawConstellation() {
    if (!cCtx) return;
    
    // Define TALAT constellation points
    const centerX = constellationCanvas.width / 2;
    const centerY = constellationCanvas.height / 2 - 50;
    const letterSpacing = 80;
    
    const letters = [
        // T
        [{x: -200, y: -40}, {x: -160, y: -40}, {x: -180, y: -40}, {x: -180, y: 40}],
        // A
        [{x: -120, y: 40}, {x: -100, y: -40}, {x: -80, y: 40}, {x: -110, y: 0}, {x: -90, y: 0}],
        // L
        [{x: -40, y: -40}, {x: -40, y: 40}, {x: 0, y: 40}],
        // A
        [{x: 40, y: 40}, {x: 60, y: -40}, {x: 80, y: 40}, {x: 50, y: 0}, {x: 70, y: 0}],
        // T
        [{x: 120, y: -40}, {x: 160, y: -40}, {x: 140, y: -40}, {x: 140, y: 40}]
    ];
    
    let allPoints = [];
    letters.forEach(letter => {
        letter.forEach(pt => {
            allPoints.push({
                x: centerX + pt.x + (Math.random() - 0.5) * 10,
                y: centerY + pt.y + (Math.random() - 0.5) * 10,
                targetX: centerX + pt.x,
                targetY: centerY + pt.y,
                progress: 0
            });
        });
    });
    
    let frame = 0;
    function animateConstellation() {
        frame++;
        
        // Redraw starfield with fade
        cCtx.fillStyle = 'rgba(0,0,0,0.05)';
        cCtx.fillRect(0, 0, constellationCanvas.width, constellationCanvas.height);
        
        // Draw constellation lines
        cCtx.strokeStyle = 'rgba(212, 165, 116, 0.4)';
        cCtx.lineWidth = 1;
        
        allPoints.forEach((pt, i) => {
            // Animate to target
            if (frame > i * 5) {
                pt.progress = Math.min(1, pt.progress + 0.02);
                pt.x += (pt.targetX - pt.x) * 0.05;
                pt.y += (pt.targetY - pt.y) * 0.05;
            }
            
            // Draw point
            const glow = pt.progress;
            cCtx.fillStyle = `rgba(255, 215, 0, ${0.5 + glow * 0.5})`;
            cCtx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            cCtx.shadowBlur = 15 * glow;
            cCtx.beginPath();
            cCtx.arc(pt.x, pt.y, 3 * glow, 0, Math.PI * 2);
            cCtx.fill();
            cCtx.shadowBlur = 0;
            
            // Draw connections
            if (i > 0 && i % 4 !== 0 && pt.progress > 0.5) {
                const prev = allPoints[i - 1];
                cCtx.strokeStyle = `rgba(212, 165, 116, ${0.2 * pt.progress})`;
                cCtx.beginPath();
                cCtx.moveTo(prev.x, prev.y);
                cCtx.lineTo(pt.x, pt.y);
                cCtx.stroke();
            }
        });
        
        if (frame < 500) {
            requestAnimationFrame(animateConstellation);
        }
    }
    
    animateConstellation();
}

// ---- Station 9: Final Destination ----
function initStation9() {
    const board = document.getElementById('destination-board');
    const ft1 = document.getElementById('f-text1');
    const ft2 = document.getElementById('f-text2');
    const ft3 = document.getElementById('f-text3');
    const ft4 = document.getElementById('f-text4');
    
    // Reset
    board.classList.remove('show');
    [ft1, ft2, ft3, ft4].forEach(t => t.classList.remove('show'));
    
    // Show destination board
    setTimeout(() => {
        board.classList.add('show');
    }, 500);
    
    // Show messages one by one
    setTimeout(() => ft1.classList.add('show'), 2500);
    setTimeout(() => ft2.classList.add('show'), 4500);
    setTimeout(() => ft3.classList.add('show'), 6500);
    setTimeout(() => ft4.classList.add('show'), 8500);
    
    // Create floating effects
    createFinalParticles();
    createFloatingHearts();
    
    // Continuous soft glow effect
    startFinalGlow();
}

function createFinalParticles() {
    const container = document.querySelector('.final-particles');
    if (!container) return;
    
    const colors = ['var(--star-gold)', 'var(--rose)', 'var(--gold-light)', '#fff'];
    
    for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'final-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${2 + Math.random() * 4}px`;
        particle.style.height = particle.style.width;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = `${8 + Math.random() * 10}s`;
        particle.style.animationDelay = `${Math.random() * 8}s`;
        particle.style.boxShadow = `0 0 10px currentColor`;
        container.appendChild(particle);
    }
}

function createFloatingHearts() {
    const container = document.querySelector('.heart-container');
    if (!container) return;
    
    for (let i = 0; i < 15; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = '❤';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${15 + Math.random() * 20}px`;
        heart.style.animationDuration = `${8 + Math.random() * 10}s`;
        heart.style.animationDelay = `${Math.random() * 8}s`;
        heart.style.color = Math.random() > 0.5 ? 'var(--rose)' : '#ff6b8a';
        container.appendChild(heart);
    }
}

function startFinalGlow() {
    // Gentle canvas glow particles
    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: 1 + Math.random() * 3,
            opacity: 0.2 + Math.random() * 0.5
        });
    }
    
    function animate() {
        pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0) p.x = particleCanvas.width;
            if (p.x > particleCanvas.width) p.x = 0;
            if (p.y < 0) p.y = particleCanvas.height;
            if (p.y > particleCanvas.height) p.y = 0;
            
            pCtx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
            pCtx.shadowColor = 'rgba(255, 215, 0, 0.5)';
            pCtx.shadowBlur = 10;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fill();
            pCtx.shadowBlur = 0;
        });
        
        if (currentStation === 9) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// ============================================
// CLEANUP ON STATION CHANGE
// ============================================
const originalGoToStation = goToStation;
goToStation = function(num) {
    // Cancel any running animations
    if (fireworksAnimationId) {
        cancelAnimationFrame(fireworksAnimationId);
        fireworksAnimationId = null;
    }
    
    // Clear all canvases
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    fCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    if (cCtx) cCtx.clearRect(0, 0, constellationCanvas.width, constellationCanvas.height);
    
    originalGoToStation(num);
};

// ============================================
// KEYBOARD NAVIGATION
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentStation < totalStations) {
            goToStation(currentStation + 1);
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStation > 1) {
            goToStation(currentStation - 1);
        }
    }
});

// ============================================
// TOUCH SWIPE SUPPORT
// ============================================
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < 0 && currentStation < totalStations) {
            goToStation(currentStation + 1);
        } else if (deltaX > 0 && currentStation > 1) {
            goToStation(currentStation - 1);
        }
    }
}, { passive: true });

// ============================================
// MOUSE PARALLAX (global)
// ============================================
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    
    // Subtle parallax on active station background
    const activeStation = document.querySelector('.station.active');
    if (activeStation && !activeStation.querySelector('#station2')) {
        const bg = activeStation.querySelector('.bg-image');
        if (bg) {
            bg.style.transform = `scale(1.05) translate(${x * -10}px, ${y * -10}px)`;
        }
    }
});

// ============================================
// PRELOAD IMAGES
// ============================================
const imagesToPreload = [
    'images/station1_departure.jpg',
    'images/station2_blossom.jpg',
    'images/station3_memory.jpg',
    'images/station4_birthday.jpg',
    'images/station5_wishes.jpg',
    'images/station6_package.jpg',
    'images/station7_letter.jpg',
    'images/station8_starlight.jpg',
    'images/station9_final.jpg',
    'images/memory1.jpg',
    'images/memory2.jpg',
    'images/memory3.jpg',
    'images/memory4.jpg',
    'images/memory5.jpg',
    'images/memory6.jpg',
    'images/envelope.png',
    'images/waxseal.png'
];

imagesToPreload.forEach(src => {
    const img = new Image();
    img.src = src;
});
