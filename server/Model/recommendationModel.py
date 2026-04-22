# import sys
# import pymongo
# import json
# import os
# import pickle
# from pymongo import MongoClient
# from pymongo.errors import ConnectionFailure
# import pandas as pd
# from surprise import Dataset
# from surprise import accuracy
# from surprise import KNNWithMeans
# from surprise import Reader
# from operator import itemgetter
# import warnings
# warnings.simplefilter("ignore", category=RuntimeWarning)
# cwd = os.getcwd()

# client = MongoClient("mongodb://wamb:wamb123@homeexplorerdb-shard-00-00.ykmn0.mongodb.net:27017,homeexplorerdb-shard-00-01.ykmn0.mongodb.net:27017,homeexplorerdb-shard-00-02.ykmn0.mongodb.net:27017/?ssl=true&replicaSet=atlas-l781p1-shard-0&authSource=admin&retryWrites=true&w=majority")
# try:
#    client.admin.command('ismaster')
# except ConnectionFailure:
#    print("Server not available")


# db = client["HomExplorer"]
# Estate_collection = db["estates"]
# UserID = sys.argv[1]
# estate_results = Estate_collection.find({'status':"approve"})


# with open (cwd+"/Data/estateRecommendationModel",'rb') as f:
#     mymodel=pickle.load(f)

# myestates = []

# for estate in estate_results:
#    myestates.append(str(estate["_id"]))
# predections = []
# for estate in myestates:
#    predection = {"iid": estate,
#    "rate": mymodel.predict(uid=UserID, iid=estate).est
#    }
#    predections.append(predection)

# recommended = sorted(predections, key=itemgetter('rate'), reverse=True)
# recommendedIds = []
# for id in recommended[:20]:
#    recommendedIds.append(id["iid"])
# print(json.dumps(recommendedIds))

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
estates = [str(e["_id"]) for e in estate_collection.find({"status": "approve"})]

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