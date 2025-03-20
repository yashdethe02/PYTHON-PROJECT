let userScore = 0;
let computerScore = 0;
let model;
let lastGesture = null;
let gestureStartTime = null;
let gestureCooldown = false;
const gestureHoldTime = 750; // 750ms to confirm a stable gesture
const confidenceThreshold = 0.85; // Adjust based on testing

async function setupWebcam() {
    const webcamElement = document.getElementById('webcam');
    const loadingElement = document.getElementById('loading');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamElement.srcObject = stream;
        return new Promise((resolve) => {
            webcamElement.onloadedmetadata = () => {
                loadingElement.style.display = 'none';
                webcamElement.style.display = 'block';
                resolve(webcamElement);
            };
        });
    } catch (error) {
        console.error('Error accessing webcam:', error);
        loadingElement.innerText = 'Error accessing webcam. Please check your device settings.';
    }
}

async function loadHandposeModel() {
    model = await handpose.load();
    console.log("Handpose model loaded.");
}

async function detectHandGesture() {
    const video = document.getElementById('webcam');
    const predictions = await model.estimateHands(video);

    if (predictions.length > 0) {
        const hand = predictions[0];

        // Calculate gesture confidence (improve logic if needed)
        const confidence = hand.handInViewConfidence || 1.0; 
        if (confidence < confidenceThreshold) {
            requestAnimationFrame(detectHandGesture);
            return; // Skip if confidence is too low
        }

        const gesture = classifyGesture(hand);

        // Only register the gesture if it remains stable for a set duration
        if (gesture && gesture !== lastGesture) {
            lastGesture = gesture;
            gestureStartTime = Date.now();
        } else if (gesture && Date.now() - gestureStartTime > gestureHoldTime && !gestureCooldown) {
            gestureCooldown = true; // Activate cooldown

            play(gesture); // Play once after confirmed stability

            // Reset cooldown after 1 second
            setTimeout(() => {
                gestureCooldown = false;
            }, 1000);
        }
    }

    requestAnimationFrame(detectHandGesture);
}

function classifyGesture(hand) {
    const landmarks = hand.landmarks;

    // Extract finger positions
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const indexBase = landmarks[6];
    const middleBase = landmarks[10];
    const ringBase = landmarks[14];
    const pinkyBase = landmarks[18];

    // 1️⃣ **Rock Detection**: If all fingers are curled (tips below base)
    if (
        indexTip[1] > indexBase[1] &&
        middleTip[1] > middleBase[1] &&
        ringTip[1] > ringBase[1] &&
        pinkyTip[1] > pinkyBase[1]
    ) {
        return "rock";
    }

    // 2️⃣ **Scissors Detection**: If index & middle fingers are extended, others curled
    if (
        indexTip[1] < indexBase[1] &&
        middleTip[1] < middleBase[1] &&
        ringTip[1] > ringBase[1] &&
        pinkyTip[1] > pinkyBase[1]
    ) {
        return "scissors";
    }

    // 3️⃣ **Paper Detection**: All fingers extended & spread apart
    const fingerSpread = Math.abs(indexTip[0] - pinkyTip[0]); // Distance between index & pinky

    if (
        indexTip[1] < indexBase[1] &&
        middleTip[1] < middleBase[1] &&
        ringTip[1] < ringBase[1] &&
        pinkyTip[1] < pinkyBase[1] &&
        fingerSpread > 50 // Ensure fingers are not too close
    ) {
        return "paper";
    }

    return null; // No clear gesture detected
}

function getComputerChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
}

function play(choice) {
    disableButtons();
    const computerChoice = getComputerChoice();  // Get computer choice only once per round
    fetch('/play', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ choice: choice, computer_choice: computerChoice })  // Send both choices to the server
    })
    .then(response => response.json())
    .then(data => {
        setTimeout(() => {
            const resultText = document.getElementById('result-text');
            resultText.innerText = `You chose ${data.user_choice}, computer chose ${data.computer_choice}. You ${data.result}!`;
            resultText.className = `result ${data.result}`;
            updateScore(data.result);
            enableButtons();
        }, 500);
    })
    .catch(() => {
        enableButtons();
    });
}

// Ensure event listeners are properly assigned once
document.querySelectorAll('.choices button').forEach(button => {
    button.addEventListener('click', () => play(button.innerText.toLowerCase()));
});

function disableButtons() {
    const buttons = document.querySelectorAll('.choices button');
    buttons.forEach(button => button.disabled = true);
}

function enableButtons() {
    const buttons = document.querySelectorAll('.choices button');
    buttons.forEach(button => button.disabled = false);
}

function resetGame() {
    userScore = 0;
    computerScore = 0;
    document.getElementById('user-score').innerText = userScore;
    document.getElementById('computer-score').innerText = computerScore;
    const resultText = document.getElementById('result-text');
    resultText.innerText = '';
    resultText.className = 'result';
    enableButtons();
    const buttons = document.querySelectorAll('.choices button');
    buttons.forEach(button => button.disabled = false);
    resultText.innerText = 'New game started! Make your choice.';
}

window.onload = async () => {
    await setupWebcam();
    await loadHandposeModel();
    detectHandGesture();
};
