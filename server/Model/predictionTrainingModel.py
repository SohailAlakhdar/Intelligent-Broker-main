# import os
# import json
# import streamlit as st
# import pandas as pd
# import warnings
# import pickle
# from sklearn.model_selection import train_test_split
# from sklearn import datasets
# from sklearn import ensemble
# warnings.filterwarnings('ignore')
# cwd = os.getcwd()

# df = pd.read_csv(cwd+"\Data/predictionModelData.csv") #read data
# X = df.drop(["price","Address","Title"],axis=1)
# Y = df["price"]
# X_train, X_test, y_train, y_test = train_test_split(X,Y,test_size=.2, random_state=5)

# clf = ensemble.GradientBoostingRegressor(n_estimators=300,max_depth=2,learning_rate=0.15,loss="huber")
# clf.fit(X_train,y_train)
# with open (cwd+"/Data/estatePredicitonModel",'wb') as f:
#     pickle.dump(clf,f)

# print("accuracy:",clf.score(X_test,y_test)) #model accuracy

import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor
import warnings
warnings.filterwarnings('ignore')

cwd = os.getcwd()
data_path = os.path.join(cwd, "Data", "predictionModelData.csv")
model_path = os.path.join(cwd, "Data", "estatePredictionModel.pkl")

# Load dataset
df = pd.read_csv(data_path)
X = df.drop(["price", "Address", "Title"], axis=1)
Y = df["price"]

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=5)

# Train model
clf = GradientBoostingRegressor(
    n_estimators=300, max_depth=2, learning_rate=0.15, loss="huber"
)
clf.fit(X_train, y_train)

# Save model
with open(model_path, 'wb') as f:
    pickle.dump(clf, f)

print("Model Accuracy:", clf.score(X_test, y_test))