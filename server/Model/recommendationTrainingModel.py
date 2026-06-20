
from surprise import Dataset, Reader, KNNWithMeans
import pandas as pd
import pickle
from pymongo import MongoClient
import os
import warnings
warnings.filterwarnings('ignore')

cwd = os.getcwd()
client = MongoClient(os.environ.get("MONGO_URI"))
db = client["HomExplorer"]

# Fetch ratings
ratings = list(db["rates"].find())
df = pd.DataFrame({
    "user": [str(r["userId"]) for r in ratings],
    "item": [str(r["estateId"]) for r in ratings],
    "rate": [r["rate"] for r in ratings]
})

# Prepare dataset for surprise
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(df[["user", "item", "rate"]], reader)
sim_options = {"name": "cosine", "user_based": False}
algo = KNNWithMeans(sim_options=sim_options)
trainset = data.build_full_trainset()
algo.fit(trainset)

# Save recommendation model
model_path = os.path.join(cwd, "Data", "estateRecommendationModel.pkl")
with open(model_path, 'wb') as f:
    pickle.dump(algo, f)

print("Recommendation Model Trained")