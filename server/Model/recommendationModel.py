
from pymongo import MongoClient
import pickle
from operator import itemgetter
import json
import os

cwd = os.getcwd()
user_id = "user123"  # Replace with input from API/CLI
model_path = os.path.join(cwd, "Data", "estateRecommendationModel.pkl")

# MongoDB connection
client = MongoClient(os.environ.get("MONGO_URI"))
db = client["HomExplorer"]
estate_collection = db["estates"]

# Get approved estates
estates = [str(e["_id"]) for e in estate_collection.find({"status": "approved"})]

# Load trained recommendation model
with open(model_path, 'rb') as f:
    model = pickle.load(f)

# Predict ratings
predictions = [
    {"iid": estate, "rate": model.predict(uid=user_id, iid=estate).est}
    for estate in estates
]

# Get top 20 recommendations
recommended_ids = [x["iid"] for x in sorted(predictions, key=itemgetter('rate'), reverse=True)[:20]]
print(json.dumps(recommended_ids))