const express = require("express");
const uploadPic = require("../Controller/uploadPic");
const estate = require("../Controller/estateController");
const { validation } = require("../middlewares/validation.middleware.js");
const { updateEstateSchema, updateEstateImageSchema, placeBidSchema, getAllEstatesSchema, addEstateSchema, approveEstateSchema, addAndUpdateRateSchema, getRatesSchema, deleteEstateSchema, scheduleVisitSchema, approveScheduleVisitSchema } = require("../middlewares/estate.validation.js");
const auth = require("../Controller/userController").verifyJWT;
const adminCheck = require("../Controller/userController").serverAdminCheck;
const router = express.Router();

router.post("/insertManyEstates", function (req, res) {

  estate.insertManyEstates(req, res);
})

router.get("/getEstates/:partition", validation(getAllEstatesSchema), function (req, res) {
  estate.getAllEstates(req, res);
})

router.get("/findEstate/:estateId", function (req, res) {
  estate.findEstate(req, res);
})

router.delete("/deleteEstate", auth, validation(deleteEstateSchema), function (req, res) {
  estate.deleteEstate(req, res);
})

const upFi = uploadPic.upload.fields([
  { name: 'contract' },  // only 1 contract
  { name: 'pic', maxCount: 10 }       // match your MAX_PICS limit
]);

router.post("/addEstate", auth, upFi, validation(addEstateSchema), function (req, res) {
  estate.addEstate(req, res);
})

router.put("/updateEstateImage", auth, upFi, validation(updateEstateImageSchema), function (req, res) {
  estate.updateEstateImage(req, res);
})

router.put("/updateEstate", auth, upFi, validation(updateEstateSchema), function (req, res) {
  estate.updateEstate(req, res);
})

router.post("/approveEstate", auth, adminCheck, validation(approveEstateSchema), function (req, res) {
  estate.approveEstate(req, res);
})

router.get("/getCategoryAndType", function (req, res) {
  estate.getCategoryAndType(req, res);
})

router.get("/getApproveEstateRequests", auth, function (req, res) {
  estate.getApproveEstateRequests(req, res);
})

router.get("/myEstates", auth, function (req, res) {
  estate.getMyEstates(req, res);
})

/*----------Sprint 2----------*/
router.post("/addAndUpdateRate", auth, validation(addAndUpdateRateSchema), function (req, res) {
  estate.addAndUpdateRate(req, res);
})

router.get("/getRates", auth, validation(getRatesSchema), function (req, res) {
  estate.getRates(req, res);
})

router.post("/saveAndUnsave", auth, function (req, res) {
  estate.saveAndUnsave(req, res);
})

router.get("/getSavedEstates", auth, function (req, res) {
  estate.getSavedEstates(req, res);
})

router.post("/search", function (req, res) {
  estate.search(req, res);
})

/*----------Sprint 3----------*/

router.get("/getVisitsDates/", auth, function (req, res) {
  estate.getVisitsDates(req, res);
})

router.post("/scheduleVisit", auth, validation(scheduleVisitSchema), function (req, res) {
  estate.scheduleAndUpdateVisit(req, res);
})

router.post("/approveScheduleVisit", auth, validation(approveScheduleVisitSchema), function (req, res) {
  estate.approveScheduleVisit(req, res);
})


/*----------Sprint 4----------*/

router.post("/placeBid", auth, validation(placeBidSchema), function (req, res) {
  estate.placeBid(req, res);
})

router.post("/approveAuction", auth, adminCheck, function (req, res) {
  estate.approveAuction(req, res);
})

router.get("/auctionOperations/:estateId", auth, function (req, res) {
  estate.auctionOperations(req, res);
})

/*---------Sprint 5-----------*/
router.get("/estateReport", auth, adminCheck, function (req, res) {
  estate.estateReport(req, res);
})

/*--------Sprint 6 ------------*/
router.post("/predictEstatePrice", function (req, res) {
  estate.predictEstatePrice(req, res);
})


module.exports = router;
