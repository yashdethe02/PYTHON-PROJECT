from flask import Flask, render_template, jsonify, request
import random
import numpy as np

app = Flask(__name__)

user_score = 0
computer_score = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/play', methods=['POST'])
def play():
    global user_score, computer_score
    user_choice = request.json['choice']
    computer_choice = request.json['computer_choice']
    result = determine_winner(user_choice, computer_choice)
    
    if result == 'win':
        user_score += 1
    elif result == 'lose':
        computer_score += 1
    
    return jsonify({'user_choice': user_choice, 'computer_choice': computer_choice, 'result': result, 'user_score': user_score, 'computer_score': computer_score})

@app.route('/reset', methods=['POST'])
def reset():
    global user_score, computer_score
    user_score = 0
    computer_score = 0
    return jsonify({'user_score': user_score, 'computer_score': computer_score})

def determine_winner(user, computer):
    if user == computer:
        return 'tie'
    # Rock beats Scissors
    elif user == 'rock' and computer == 'scissors':
        return 'win'
    # Paper beats Rock
    elif user == 'paper' and computer == 'rock':
        return 'win'
    # Scissors beat Paper
    elif user == 'scissors' and computer == 'paper':
        return 'win'
    else:
        return 'lose'

if __name__ == '__main__':
    app.run(debug=True)
