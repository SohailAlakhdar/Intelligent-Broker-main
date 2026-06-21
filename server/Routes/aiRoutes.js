
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