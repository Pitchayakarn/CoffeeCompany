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

    const scoreboardArea = document.getElementById('scoreboardArea'); // Used if needed, list is main
    const scoreboardListDisplay = document.getElementById('scoreboardList');

    // Global Variables
    let allQuestions = [];
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let playerName = "Player";
    let scoreboard = []; // Format: [{ name: "Player1", score: 15, totalQuestions: 20 }]

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
                questionTextDisplay.textContent = "Failed to load questions. Please try refreshing.";
                startGameButton.disabled = true;
                return;
            }
        } catch (error) {
            console.error("Failed to fetch questions:", error);
            questionTextDisplay.textContent = "Failed to load questions. Please check the console for errors and ensure questions.json is present.";
            startGameButton.disabled = true;
            return;
        }

        loadScoreboard();
        displayScoreboard();

        startGameButton.addEventListener('click', startGame);
        playAgainButton.addEventListener('click', startGame); // Play again restarts the game
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
        playerName = playerNameInput.value.trim();
        if (!playerName) {
            playerName = "Anonymous Player";
        }
        playerNameInput.value = playerName; // Update input field in case it was empty

        gameSetupArea.style.display = 'none';
        endGameArea.style.display = 'none';
        quizArea.style.display = 'block';

        score = 0;
        currentQuestionIndex = 0;
        scoreDisplay.textContent = `Score: ${score}`;
        feedbackTextDisplay.textContent = "";

        currentQuestions = selectRoundQuestions();
        if (currentQuestions.length === 0) {
            console.error("No questions available for the round.");
            feedbackTextDisplay.textContent = "Not enough questions to start. Please check the question source.";
            quizArea.style.display = 'none';
            gameSetupArea.style.display = 'block'; // Go back to setup
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
        questionNumberDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
        questionTextDisplay.textContent = questionData.question;

        answerButtonsContainer.innerHTML = ''; // Clear previous buttons
        feedbackTextDisplay.textContent = "";

        for (const optionKey in questionData.options) {
            const button = document.createElement('button');
            button.textContent = `${optionKey}: ${questionData.options[optionKey]}`;
            button.classList.add('answer-button'); // For styling if needed
            button.addEventListener('click', () => handleAnswer(optionKey, button));
            answerButtonsContainer.appendChild(button);
        }
    }

    function handleAnswer(selectedOptionKey) {
        // Disable all answer buttons
        const buttons = answerButtonsContainer.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);

        const correctAnswerKey = currentQuestions[currentQuestionIndex].answer;
        const selectedOptionText = currentQuestions[currentQuestionIndex].options[selectedOptionKey];
        const correctAnswerText = currentQuestions[currentQuestionIndex].options[correctAnswerKey];

        if (selectedOptionKey === correctAnswerKey) {
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            feedbackTextDisplay.textContent = "Correct!";
            feedbackTextDisplay.style.color = "green";
        } else {
            feedbackTextDisplay.textContent = `Incorrect. Correct answer was ${correctAnswerKey}: ${correctAnswerText}`;
            feedbackTextDisplay.style.color = "red";
        }

        currentQuestionIndex++;

        setTimeout(() => {
            if (currentQuestionIndex < currentQuestions.length) {
                displayQuestion();
            } else {
                endGame();
            }
        }, 1500); // Delay before next question or ending game
    }

    function endGame() {
        quizArea.style.display = 'none';
        endGameArea.style.display = 'block';
        
        const totalQuestionsInRound = currentQuestions.length;
        finalScoreTextDisplay.textContent = `${playerName}, your final score is: ${score} out of ${totalQuestionsInRound}.`;

        // Add to scoreboard
        scoreboard.push({ name: playerName, score: score, totalQuestions: totalQuestionsInRound });
        // Sort scoreboard by score (descending), then by name (ascending for ties)
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
        scoreboardListDisplay.innerHTML = ''; // Clear existing entries

        if (scoreboard.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Scoreboard is empty.";
            scoreboardListDisplay.appendChild(li);
            return;
        }

        scoreboard.forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name} - ${entry.score}/${entry.totalQuestions}`;
            scoreboardListDisplay.appendChild(li);
        });
    }

    // Start the initialization process
    init();
});
