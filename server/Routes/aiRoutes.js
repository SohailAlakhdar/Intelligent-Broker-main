// const express = require("express");
// const aiController = require("../Controller/aiController");
// const auth = require("../Controller/userController").verifyJWT;
// const router  = express.Router();

// /*----------Sprint 6----------*/

// router.post("/predictEstatePrice",function(req,res){
//   aiController.predictEstate(req, res);
// })

// router.get("/getRecommendedEstate",auth,function(req,res){ // add auth middleware
//   aiController.getRecommendedEstate(req, res);
// })

// router.get("/TrainModels", async function(req,res){
//   await aiController.TrainPredictModel();
//   await aiController.recommendationTrainingModel();
//   res.send("Models Training")
// })



// module.exports = router;

const express = require("express");
const aiController = require("../Controller/aiController");
const { verifyJWT } = require("../Controller/userController");

const router = express.Router();

/*----------Sprint 6----------*/

// Predict estate price
router.post("/predictEstatePrice", aiController.predictEstate);

// Get recommended estates (with authentication)
router.get("/getRecommendedEstate", verifyJWT, aiController.getRecommendedEstate);

// Train AI models
router.get("/TrainModels", async (req, res) => {
  try {
    await aiController.TrainPredictModel();
    await aiController.recommendationTrainingModel();

    res.status(200).send("Models Training Completed");
  }
  catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;