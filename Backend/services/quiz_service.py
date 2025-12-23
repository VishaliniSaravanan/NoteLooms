from pymongo import MongoClient
import datetime

def fetch_questions(db, topic, difficulty, user_id):
    try:
        questions = list(db.questions.find({
            "topic": topic,
            "difficulty": difficulty
        }).limit(10))  # Limit to 10 questions for now
        for q in questions:
            q['_id'] = str(q['_id'])  # Convert ObjectId to string for JSON serialization
        return questions
    except Exception as e:
        raise Exception(f"Failed to fetch questions: {str(e)}")

def save_question(db, question_data):
    try:
        result = db.questions.insert_one(question_data)
        return str(result.inserted_id)
    except Exception as e:
        raise Exception(f"Failed to save question: {str(e)}")

def save_user_answer(db, user_id, question_id, selected_option):
    try:
        question = db.questions.find_one({"_id": question_id})
        if not question:
            raise Exception("Question not found")
        is_correct = selected_option == question['correct_answer']
        db.user_history.insert_one({
            "user_id": user_id,
            "question_id": question_id,
            "selected_option": selected_option,
            "is_correct": is_correct,
            "attempted_at": datetime.datetime.utcnow()
        })
        return is_correct
    except Exception as e:
        raise Exception(f"Failed to save user answer: {str(e)}")