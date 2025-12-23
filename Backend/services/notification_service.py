from pymongo import MongoClient
import datetime

def notify_users(db, topic):
    try:
        # Broadcast notification
        broadcast_message = f"New question(s) have been added under {topic}. Come and try them now!"
        db.notifications.insert_one({
            "message": broadcast_message,
            "topic": topic,
            "created_at": datetime.datetime.utcnow()
        })

        # Targeted notifications for users who attempted this topic
        user_ids = db.user_history.distinct("user_id", {"question_id": {"$in": db.questions.distinct("_id", {"topic": topic})}})
        for user_id in user_ids:
            if user_id != 'guest':
                targeted_message = f"Hey, new content related to {topic} is live — give it a try!"
                db.notifications.insert_one({
                    "user_id": user_id,
                    "message": targeted_message,
                    "topic": topic,
                    "created_at": datetime.datetime.utcnow()
                })
    except Exception as e:
        print(f"Failed to send notifications: {str(e)}")