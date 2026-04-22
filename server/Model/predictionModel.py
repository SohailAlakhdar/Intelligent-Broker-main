# import pickle
# import sys
# import os
# import warnings
# warnings.filterwarnings('ignore')

# cwd = os.getcwd()

# data = sys.argv[1].split(",")

# with open (cwd+"/Data/estatePredicitonModel",'rb') as f:
#     mymodel=pickle.load(f)
#     print(mymodel.predict([data])[0])

import pickle
import sys
import os
import warnings
warnings.filterwarnings('ignore')

cwd = os.getcwd()

# Convert input to float
if len(sys.argv) < 2:
    print("Error: Please provide input data like 1200,3,2")
    sys.exit()

data = list(map(float, sys.argv[1].split(",")))

with open(cwd + "/Data/estatePredicitonModel", 'rb') as f:
    mymodel = pickle.load(f)
    print(mymodel.predict([data])[0])
