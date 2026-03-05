document.addEventListener('DOMContentLoaded', () => {
    // Variables
    let count = parseInt(localStorage.getItem('jaap_count')) || 0;
    let savedMantra = localStorage.getItem('jaap_mantra') || "ॐ नमः शिवाय";
    const counterDisplay = document.getElementById('counterNumber'); // Fix 1: Used ID instead of class
    const tapBtn = document.getElementById('tapBtn');
    const resetBtn = document.getElementById('resetBtn');
    const mantraDisplay = document.getElementById('currentNameDisplay');
    const nameInput = document.getElementById('nameInput');
    const voiceToggle = document.getElementById('voiceToggle');
    const speedBtns = document.querySelectorAll('.speed-btn');
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    const stopAutoBtn = document.getElementById('stopAutoBtn');
    const updateMalaBtn = document.getElementById('updateMalaBtn');
    const malaInput = document.getElementById('malaInput');
    const malaLabel = document.getElementById('malaLabel');
    const malaCountDisplay = document.getElementById('malaCount');
    const malaBarFill = document.getElementById('malaBarFill');
    const beadsContainer = document.getElementById('beadsContainer');

    let currentSpeed = 1.0;
    let autoPlayInterval = null;
    let targetMalaCount = parseInt(localStorage.getItem('mala_target_count')) || 108;
    let selectedVoice = null;
    let audioInitialized = false;

    // Initial Display
    if (counterDisplay) counterDisplay.innerText = count;
    if (mantraDisplay) mantraDisplay.innerText = savedMantra;
    if (nameInput) nameInput.value = savedMantra;

    // Initialize/Load Indian Voices
    function loadVoices() {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return; // Voices not loaded yet

        // Priority 1: Exact Hindi India (hi-IN)
        // Priority 2: Any English India (en-IN)
        // Priority 3: Google Hindi
        // Priority 4: First available
        selectedVoice = voices.find(v => v.lang === 'hi-IN') ||
            voices.find(v => v.lang.includes('hi')) ||
            voices.find(v => v.lang === 'en-IN') ||
            voices.find(v => v.name.includes('Google Hindi') || v.name.includes('Google हिन्दी')) ||
            voices[0] || null;
    }

    // Load voices immediately if available, and also listen for the event
    if ('speechSynthesis' in window) {
        loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            loadVoices();
        };
    }

    // Force initialize speech synthesis on first user interaction 
    // so that it works seamlessly afterwards
    document.body.addEventListener('click', function initAudio() {
        if (!audioInitialized && 'speechSynthesis' in window) {
            loadVoices(); // Try loading voices again on first click just in case
            const silentUtterance = new SpeechSynthesisUtterance('');
            silentUtterance.volume = 0;
            window.speechSynthesis.speak(silentUtterance);
            audioInitialized = true;
            document.body.removeEventListener('click', initAudio);
        }
    }, { once: true });

    // 1. Sound Function (Fix)
    function speak(text) {
        // Fix 3: Added voice toggle check
        if ('speechSynthesis' in window && voiceToggle && voiceToggle.checked) {
            window.speechSynthesis.cancel(); // Stop current speech

            // If voice wasn't loaded early, try one more time right before speaking
            if (!selectedVoice) {
                loadVoices();
            }

            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'hi-IN'; // Force Hindi language code

            if (selectedVoice) {
                msg.voice = selectedVoice;
            }

            msg.rate = currentSpeed; // Variable speed
            window.speechSynthesis.speak(msg);
        }
    }

    // Play logic inside tap and auto play
    function doJaap() {
        count++;
        localStorage.setItem('jaap_count', count);
        if (counterDisplay) {
            counterDisplay.innerText = count;
            // Add bump animation
            counterDisplay.classList.add('bump');
            setTimeout(() => counterDisplay.classList.remove('bump'), 150);
        }

        // Sound play if toggle is on
        const mantra = mantraDisplay ? mantraDisplay.innerText : "Ram";
        speak(mantra);

        // Update Mala logic
        updateMalaProgress();
    }

    // Initialize Mala State
    updateMalaUI();

    // Fix 2: Make setName available globally because it's called via onclick in HTML
    window.setName = function () {
        if (nameInput && nameInput.value.trim() !== "") {
            const newName = nameInput.value.trim();
            if (mantraDisplay) {
                mantraDisplay.innerText = newName;
                savedMantra = newName;
                localStorage.setItem('jaap_mantra', newName); // Save custom name!
            }
        }
    };

    // 2. Tap Logic
    if (tapBtn) {
        tapBtn.addEventListener('click', () => {
            doJaap();

            // Animation for Tap button
            tapBtn.style.transform = "scale(0.95)";
            setTimeout(() => tapBtn.style.transform = "scale(1)", 100);
        });
    }

    // 3. Reset Logic
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Kya aap ginti zero karna chahte hain? (Reset Jaap count to zero?)")) {
                count = 0;
                localStorage.setItem('jaap_count', 0);
                if (counterDisplay) counterDisplay.innerText = 0;
                updateMalaUI();

                // Reset visual beads too
                if (beadsContainer) {
                    const beads = beadsContainer.querySelectorAll('.bead');
                    beads.forEach(bead => bead.classList.remove('active-bead'));
                }
            }
        });
    }

    // 4. Voice Speed Control Logic
    if (speedBtns.length > 0) {
        speedBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                speedBtns.forEach(b => b.classList.remove('active'));

                // Add active class to clicked button
                e.currentTarget.classList.add('active');

                // Update voice speed
                currentSpeed = parseFloat(e.currentTarget.getAttribute('data-speed')) || 1.0;
            });
        });
    }

    // 5. Auto Play Logic
    if (autoPlayBtn && stopAutoBtn) {
        autoPlayBtn.addEventListener('click', () => {
            if (autoPlayInterval !== null) {
                clearInterval(autoPlayInterval);
            }
            autoPlayBtn.classList.add('playing');

            // Calculate an interval based on speed to ensure voice doesn't overlap excessively 
            // 1.0x -> 1500ms, 1.3x -> ~1150ms, 0.7x -> ~2140ms
            const baseInterval = 1500;
            const intervalMs = Math.max(Math.floor(baseInterval / currentSpeed), 800);

            autoPlayInterval = setInterval(() => {
                doJaap();
                // Visual feedback for auto mode tap
                if (tapBtn) {
                    tapBtn.style.transform = "scale(0.95)";
                    tapBtn.style.boxShadow = "0 0 20px rgba(74, 222, 128, 0.5)";
                    setTimeout(() => {
                        tapBtn.style.transform = "scale(1)";
                        tapBtn.style.boxShadow = "none";
                    }, 150);
                }
            }, intervalMs);
        });

        stopAutoBtn.addEventListener('click', () => {
            if (autoPlayInterval !== null) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
                autoPlayBtn.classList.remove('playing');
                // Stop current speech output immediately upon stop
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                }
            }
        });
    }

    // 6. Mala Customizer Logic
    if (updateMalaBtn && malaInput) {
        updateMalaBtn.addEventListener('click', () => {
            const newTarget = parseInt(malaInput.value);
            if (!isNaN(newTarget) && newTarget > 0) {
                targetMalaCount = newTarget;
                localStorage.setItem('mala_target_count', targetMalaCount);
                if (malaLabel) {
                    malaLabel.innerText = `📿 Mala Progress (${targetMalaCount})`;
                }
                updateMalaUI();
            }
        });
    }

    function createBeads() {
        if (!beadsContainer) return;

        // Limiting maximum beads to maintain layout and prevent browser hang
        // Increased to 1008 based on user request, but default is 108
        const maxVisualBeads = Math.min(targetMalaCount, 1008);
        beadsContainer.innerHTML = '';

        for (let i = 0; i < maxVisualBeads; i++) {
            const bead = document.createElement('div');
            bead.classList.add('bead');
            beadsContainer.appendChild(bead);
        }
    }

    // Animated Sankalp Placeholder Logic
    const commonSankalps = ["11", "21", "51", "108", "216", "501", "1008", "5000", "11000", "21000", "51000", "1,25,000", "अपना संकल्प लें"];
    let sankalpIndex = 0;
    let sankalpInterval = null;

    function startSankalpAnimation() {
        if (!malaInput) return;
        sankalpInterval = setInterval(() => {
            if (malaInput.value === "") {
                const text = commonSankalps[sankalpIndex] === "अपना संकल्प लें"
                    ? commonSankalps[sankalpIndex]
                    : "उदा: " + commonSankalps[sankalpIndex];
                malaInput.setAttribute("placeholder", text);
                sankalpIndex = (sankalpIndex + 1) % commonSankalps.length;
            }
        }, 1200);
    }

    if (malaInput) {
        startSankalpAnimation();

        // Pause animation when typing
        malaInput.addEventListener("focus", () => {
            clearInterval(sankalpInterval);
            malaInput.setAttribute("placeholder", "Typing...");
        });

        // Resume if empty on blur
        malaInput.addEventListener("blur", () => {
            if (malaInput.value === "") {
                startSankalpAnimation();
            }
        });
    }

    function updateMalaUI() {
        if (malaLabel) {
            malaLabel.innerText = `📿 Mala Progress (${targetMalaCount})`;
        }
        createBeads();
        updateMalaProgress();
    }

    function updateMalaProgress() {
        const currentMalaCount = count % targetMalaCount;
        const totalMalasCompleted = Math.floor(count / targetMalaCount);

        if (malaCountDisplay) {
            malaCountDisplay.innerText = `${currentMalaCount} / ${targetMalaCount} (+${totalMalasCompleted} 📿)`;
        }

        if (malaBarFill) {
            const percentage = (currentMalaCount / targetMalaCount) * 100;
            malaBarFill.style.width = `${percentage}%`;
        }

        if (beadsContainer) {
            const beads = beadsContainer.querySelectorAll('.bead');
            const maxVisualBeads = beads.length;
            const scaledProgress = Math.floor((currentMalaCount / targetMalaCount) * maxVisualBeads);

            beads.forEach((bead, index) => {
                // If it reached a full lap or we're on the dots prior to current relative progress
                if (index < scaledProgress) {
                    bead.classList.add('active-bead');
                } else {
                    bead.classList.remove('active-bead');
                }
            });
            // If completely hit a multiple of target, all should flash or color
            if (currentMalaCount === 0 && count > 0) {
                beads.forEach(bead => bead.classList.add('active-bead'));
                setTimeout(() => {
                    // Only visually reset them briefly to show the looping
                    beads.forEach(bead => bead.classList.remove('active-bead'));
                }, 400);
            }
        }
    }
});