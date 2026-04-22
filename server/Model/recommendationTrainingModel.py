# import pymongo
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
# userid=[]
# estateid=[]
# rates=[]

# db = client["HomExplorer"]
# rate_collection = db["rates"]
# Estate_collection = db["estates"]
# results  = rate_collection.find()
# for result in results:
#    userid.append(str(result['userId']))
#    estateid.append(str(result['estateId']))
#    rates.append(result['rate'])
# myratings = {
# "item" : estateid,
# "user" : userid,
# "rate": rates
# }
# df = pd.DataFrame(myratings)

# reader = Reader(rating_scale=(1, 5))
# data = Dataset.load_from_df(df[["user", "item", "rate"]],reader=reader)
# sim_options ={
#    "name": "cosine",
#    "user_based": False
# }
# algo = KNNWithMeans(sim_options=sim_options)
# trainingSet = data.build_full_trainset()
# algo.fit(trainingSet)

# with open (cwd+"/Data/estateRecommendationModel",'wb') as f:
#     pickle.dump(algo,f)

# print("Model Trained")

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