import json
import random

# --- Scoreboard Data ---
scoreboard_data = [] # Global scoreboard

def load_all_questions(filepath="questions.json"):
    """
    Loads questions from a JSON file.

    Args:
        filepath (str): The path to the JSON file containing the questions.

    Returns:
        list: A list of dictionaries, where each dictionary represents a question.
              Returns an empty list if the file is not found or is invalid.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        return questions
    except FileNotFoundError:
        print(f"Error: The file {filepath} was not found.")
        return []
    except json.JSONDecodeError:
        print(f"Error: The file {filepath} is not a valid JSON file.")
        return []

def select_game_questions(all_questions, num_questions=20):
    """
    Selects a specified number of unique questions randomly for a game session.

    Args:
        all_questions (list): A list of all available question objects (dictionaries).
        num_questions (int): The number of questions to select for the game.
                             Defaults to 20.

    Returns:
        list: A new list containing the randomly selected unique question objects.
              Returns a copy of all_questions if num_questions is greater than
              or equal to the total number of available questions.
    """
    if not all_questions:
        return []
    
    num_available = len(all_questions)
    
    # Ensure num_questions does not exceed num_available
    actual_num_questions = min(num_questions, num_available)

    if actual_num_questions == 0:
        return []
        
    return random.sample(all_questions, actual_num_questions)

def ask_question(question_data):
    """
    Presents a single question and its multiple-choice options to the user,
    and prompts for an answer. Input is validated.

    Args:
        question_data (dict): A dictionary representing a single question.

    Returns:
        str: The user's validated answer (e.g., "A", "B", "C", or "D").
    """
    print("\n" + "="*40)
    print(question_data["question"])
    print("="*40)
    
    options = question_data["options"]
    for choice, text in options.items():
        print(f"{choice}: {text}")
    
    while True:
        user_input = input("Enter your choice (A, B, C, or D): ").strip().upper()
        if user_input in options:
            return user_input
        else:
            print("Invalid choice. Please enter A, B, C, or D.")

def check_answer(question_data, user_answer):
    """
    Checks if the user's answer is correct for the given question.

    Args:
        question_data (dict): A dictionary representing a single question.
        user_answer (str): The user's answer.

    Returns:
        bool: True if the answer is correct, False otherwise.
    """
    correct_answer = question_data["answer"]
    if user_answer == correct_answer:
        print("Correct!")
        return True
    else:
        print(f"Incorrect. The correct answer was {correct_answer}: {question_data['options'][correct_answer]}")
        return False

# --- Scoreboard Functions ---
def get_player_name():
    """
    Prompts the user to enter their name.

    Returns:
        str: The name entered by the user.
    """
    while True:
        name = input("\nEnter your name: ").strip()
        if name:
            return name
        else:
            print("Name cannot be empty. Please enter a valid name.")

def add_score(player_name, score, num_questions_asked, scoreboard):
    """
    Adds a player's score to the scoreboard. Stores score as a tuple (name, score, questions_asked).

    Args:
        player_name (str): The name of the player.
        score (int): The score achieved by the player.
        num_questions_asked (int): The number of questions asked in that round.
        scoreboard (list): The list storing scoreboard data.
    """
    scoreboard.append((player_name, score, num_questions_asked))
    print(f"Score for {player_name} added to scoreboard.")

def display_scoreboard(scoreboard):
    """
    Displays the scoreboard, sorted by score in descending order.

    Args:
        scoreboard (list): The list storing scoreboard data as (name, score, num_questions_asked) tuples.
    """
    print("\n" + "="*45)
    print("--- SCOREBOARD ---")
    print("="*45)

    if not scoreboard:
        print("Scoreboard is empty.")
    else:
        # Sort by score (the second element of the tuple) in descending order
        # If scores are tied, it keeps their original insertion order relative to each other.
        sorted_scores = sorted(scoreboard, key=lambda x: x[1], reverse=True)
        
        print(f"{'Rank':<5} | {'Player Name':<20} | {'Score':<10}")
        print("-"*45)
        for i, (name, score, num_q) in enumerate(sorted_scores):
            print(f"{i+1:<5} | {name:<20} | {score}/{num_q}")
    print("="*45)

# --- Main Game Loop ---
if __name__ == "__main__":
    # 1. Initialization
    all_questions_list = load_all_questions()
    # scoreboard_data is already initialized globally

    if not all_questions_list:
        print("Could not load questions. Exiting game.")
    else:
        print("Welcome to the Ultimate Quiz Game!")
        
        while True:
            # a. Get Player Name
            player_name = get_player_name()
            
            # b. Start Game Round
            num_questions_per_round = 20
            game_questions = select_game_questions(all_questions_list, num_questions_per_round)
            
            actual_num_questions_in_round = len(game_questions) # Number of questions actually selected

            if actual_num_questions_in_round == 0:
                print("Not enough questions to start a new round. Maybe the question file is too small?")
                # This might happen if questions.json has less than num_questions_per_round
                # and select_game_questions correctly returns a smaller list or empty.
                # Or if all_questions_list was empty initially.
                # The initial check for all_questions_list should catch the latter.
                # Let's assume if we reach here with 0, it's an issue with available questions.
                # We could ask if they want to try with fewer, or just end. For now, we'll advise and offer to play again.
                play_again_input = input("Try again with available questions or quit? (type 'yes' to retry, anything else to quit): ").strip().lower()
                if play_again_input != 'yes':
                    break
                else:
                    # If they retry, and questions are still 0, this path will be hit again.
                    # A better solution might be to adjust num_questions_per_round based on available.
                    # For now, if select_game_questions returns empty, we cannot proceed with the round.
                    print("No questions available for the round even after retry. Please check question data.")
                    # This scenario should ideally be handled by select_game_questions returning what it can
                    # and the loop below proceeding with that count.
                    # The select_game_questions was modified to return min(num_questions, num_available)
                    # So, if it's 0 here, means all_questions_list is empty or became empty.
                    # The initial check for all_questions_list should prevent this.
                    # This path is more of a safeguard.
                    break


            current_score = 0
            print(f"\nWelcome {player_name}! Let's begin. You will be asked {actual_num_questions_in_round} questions.")

            # c. Ask Questions
            for i, q_data in enumerate(game_questions):
                print(f"\n--- Question {i+1} of {actual_num_questions_in_round} ---")
                user_choice = ask_question(q_data)
                if check_answer(q_data, user_choice):
                    current_score += 1
            
            # d. End of Round
            print("\n" + "="*40)
            print(f"Round Over, {player_name}!")
            print(f"You scored {current_score} out of {actual_num_questions_in_round}.")
            print("="*40)

            add_score(player_name, current_score, actual_num_questions_in_round, scoreboard_data)
            display_scoreboard(scoreboard_data)
            
            # e. Play Again?
            play_again_input = input("\nPlay another round? (yes/no): ").strip().lower()
            if play_again_input != 'yes':
                break
        
        # 3. Game End
        print("\nThanks for playing the Ultimate Quiz Game!")
