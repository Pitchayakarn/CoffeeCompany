document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const gameSetupArea = document.getElementById('gameSetupArea');
    const playerNameInput = document.getElementById('playerNameInput');
    const startGameButton = document.getElementById('startGameButton');

    const quizArea = document.getElementById('quizArea');
    const questionNumberDisplay = document.getElementById('questionNumber');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const questionTextDisplay = document.getElementById('questionText').querySelector('p'); // Get the <p> inside
    const answerButtonsContainer = document.getElementById('answerButtons');
    const feedbackTextDisplay = document.getElementById('feedbackText');

    const endGameArea = document.getElementById('endGameArea');
    const finalScoreTextDisplay = document.getElementById('finalScoreText');
    const playAgainButton = document.getElementById('playAgainButton');

    const scoreboardArea = document.getElementById('scoreboardArea'); 
    const scoreboardListDisplay = document.getElementById('scoreboardList');

    // --- Audio Setup ---
    // NOTE: User needs to provide these audio files in the 'audio/' directory
    const backgroundMusicPath = 'audio/background.mp3'; 
    const clickSoundPath = 'audio/click.mp3';         
    const correctAnswerPath = 'audio/correct.mp3';    
    const incorrectAnswerPath = 'audio/wrong.mp3';    
    const gameStartSoundPath = 'audio/gamestart.mp3'; // Sound for game start/play again
    const gameEndSoundPath = 'audio/gameover.mp3';   // Sound for game over

    const backgroundMusic = new Audio();
    backgroundMusic.loop = true;

    const clickSound = new Audio();
    const correctAnswerSound = new Audio();
    const incorrectAnswerSound = new Audio();
    const gameStartSound = new Audio();
    const gameEndSound = new Audio();

    /**
     * Plays background music.
     * @param {string} filePath - Path to the background music file.
     */
    function playBackgroundMusic(filePath) {
        if (!filePath) return; 
        backgroundMusic.src = filePath;
        backgroundMusic.play().catch(error => {
            console.warn("Background music playback failed (user interaction might be required):", error);
        });
    }

    /**
     * Stops the background music.
     */
    function stopBackgroundMusic() {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; 
    }

    /**
     * Plays a sound effect.
     * @param {HTMLAudioElement} soundObject - The Audio object to play.
     * @param {string} filePath - Path to the sound effect file.
     */
    function playEffectSound(soundObject, filePath) {
        if (!soundObject || !filePath) return; 
        soundObject.src = filePath;
        soundObject.play().catch(error => {
            console.warn(`Sound effect (${filePath}) playback failed:`, error);
        });
    }
    // --- End Audio Setup ---

    // Global Variables (Game Logic)
    let allQuestions = [];
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let playerName = "ผู้เล่น"; 
    let scoreboard = []; 

    const NUM_QUESTIONS_PER_ROUND = 20;

    // Initialization
    async function init() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
            if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
                console.error("No questions loaded or questions.json is not an array.");
                questionTextDisplay.textContent = "ไม่สามารถโหลดคำถามได้ โปรดลองรีเฟรช";
                startGameButton.disabled = true;
                return;
            }
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            questionTextDisplay.textContent = "ไม่สามารถโหลดคำถามได้ โปรดตรวจสอบคอนโซลและไฟล์ questions.json";
            startGameButton.disabled = true;
            return;
        }

        loadScoreboard();
        displayScoreboard();

        startGameButton.addEventListener('click', startGame);
        playAgainButton.addEventListener('click', startGame); 
    }

    function loadScoreboard() {
        const storedScoreboard = localStorage.getItem('quizGameScoreboard');
        if (storedScoreboard) {
            scoreboard = JSON.parse(storedScoreboard);
        } else {
            scoreboard = [];
        }
    }

    function saveScoreboard() {
        localStorage.setItem('quizGameScoreboard', JSON.stringify(scoreboard));
    }

    function startGame() {
        playEffectSound(gameStartSound, gameStartSoundPath); // Play game start sound
        playBackgroundMusic(backgroundMusicPath);          // Start background music

        playerName = playerNameInput.value.trim();
        if (!playerName) {
            playerName = "ผู้เล่นนิรนาม"; 
        }
        playerNameInput.value = playerName; 

        gameSetupArea.style.display = 'none';
        endGameArea.style.display = 'none';
        quizArea.style.display = 'block';

        score = 0;
        currentQuestionIndex = 0;
        scoreDisplay.textContent = `คะแนน: ${score}`; 
        feedbackTextDisplay.textContent = "";

        currentQuestions = selectRoundQuestions();
        if (currentQuestions.length === 0) {
            console.error("No questions available for the round.");
            feedbackTextDisplay.textContent = "มีคำถามไม่เพียงพอที่จะเริ่มเกม โปรดตรวจสอบแหล่งที่มาของคำถาม";
            quizArea.style.display = 'none';
            gameSetupArea.style.display = 'block'; 
            stopBackgroundMusic(); // Stop music if game cannot start
            return;
        }
        displayQuestion();
    }

    function selectRoundQuestions() {
        if (allQuestions.length === 0) return [];

        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(NUM_QUESTIONS_PER_ROUND, allQuestions.length));
    }

    function displayQuestion() {
        if (currentQuestionIndex >= currentQuestions.length) {
            endGame();
            return;
        }

        const questionData = currentQuestions[currentQuestionIndex];
        questionNumberDisplay.textContent = `คำถามที่ ${currentQuestionIndex + 1} จาก ${currentQuestions.length}`; 
        questionTextDisplay.textContent = questionData.question; 

        answerButtonsContainer.innerHTML = ''; 
        feedbackTextDisplay.textContent = "";

        for (const optionKey in questionData.options) {
            const button = document.createElement('button');
            button.textContent = `${optionKey}: ${questionData.options[optionKey]}`;
            button.classList.add('answer-button'); 
            button.addEventListener('click', () => {
                playEffectSound(clickSound, clickSoundPath); // Play click sound on answer attempt
                handleAnswer(optionKey, button);
            });
            answerButtonsContainer.appendChild(button);
        }
    }

    function handleAnswer(selectedOptionKey) {
        const buttons = answerButtonsContainer.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);

        const correctAnswerKey = currentQuestions[currentQuestionIndex].answer;
        const correctAnswerText = currentQuestions[currentQuestionIndex].options[correctAnswerKey]; 

        if (selectedOptionKey === correctAnswerKey) {
            score++;
            scoreDisplay.textContent = `คะแนน: ${score}`; 
            feedbackTextDisplay.textContent = "ถูกต้อง!"; 
            feedbackTextDisplay.style.color = "green";
            playEffectSound(correctAnswerSound, correctAnswerPath); // Play correct answer sound
        } else {
            feedbackTextDisplay.textContent = `ผิดครับ/ค่ะ คำตอบที่ถูกต้องคือ ${correctAnswerKey}: ${correctAnswerText}`; 
            feedbackTextDisplay.style.color = "red";
            playEffectSound(incorrectAnswerSound, incorrectAnswerPath); // Play incorrect answer sound
        }

        currentQuestionIndex++;

        setTimeout(() => {
            if (currentQuestionIndex < currentQuestions.length) {
                displayQuestion();
            } else {
                endGame();
            }
        }, 1500); 
    }

    function endGame() {
        stopBackgroundMusic(); // Stop background music
        playEffectSound(gameEndSound, gameEndSoundPath); // Play game end sound

        quizArea.style.display = 'none';
        endGameArea.style.display = 'block';
        
        const totalQuestionsInRound = currentQuestions.length;
        finalScoreTextDisplay.textContent = `${playerName}, คะแนนสุดท้ายของคุณคือ: ${score} จาก ${totalQuestionsInRound}`; 

        scoreboard.push({ name: playerName, score: score, totalQuestions: totalQuestionsInRound });
        scoreboard.sort((a, b) => {
            if (b.score === a.score) {
                return a.name.localeCompare(b.name);
            }
            return b.score - a.score;
        });

        saveScoreboard();
        displayScoreboard();
    }

    function displayScoreboard() {
        scoreboardListDisplay.innerHTML = ''; 

        if (scoreboard.length === 0) {
            const li = document.createElement('li');
            li.textContent = "ตารางคะแนนว่างเปล่า"; 
            scoreboardListDisplay.appendChild(li);
            return;
        }

        scoreboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name} - ${entry.score}/${entry.totalQuestions}`;
            scoreboardListDisplay.appendChild(li);
        });
    }

    init();
});
