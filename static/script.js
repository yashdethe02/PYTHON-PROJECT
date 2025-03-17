let userScore = 0;
let computerScore = 0;

function play(choice) {
    fetch('/play', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ choice: choice })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result-text').innerText = `You chose ${data.user_choice}, computer chose ${data.computer_choice}. You ${data.result}!`;
        updateScore(data.result);
    });
}

function updateScore(result) {
    if (result === 'win') {
        userScore++;
    } else if (result === 'lose') {
        computerScore++;
    }
    document.getElementById('user-score').innerText = userScore;
    document.getElementById('computer-score').innerText = computerScore;
}

function resetGame() {
    userScore = 0;
    computerScore = 0;
    document.getElementById('user-score').innerText = userScore;
    document.getElementById('computer-score').innerText = computerScore;
    document.getElementById('result-text').innerText = '';
}
