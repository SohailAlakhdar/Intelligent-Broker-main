const nodemailer = require('nodemailer');
const bid = require("../Model/bidEstateModel");
const visit = require("../Model/visitModel");
const estate = require("../Model/estateModel");
const save = require("../Model/savedModel");
const { auctionEmailTemplate } = require('../utils/templates/auction.templete.js');
const { scheduleVisitEmailTemplate } = require('../utils/templates/scheduleVisit.templete.js');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "sohailalakhdar@gmail.com",
    pass: process.env.APP_PASSWORD
    // pass: process.env.emailPass
  }
});


let mailOptions = {
  from: process.env.APP_GMAI,
  to: '',
  subject: '',
  text: ""
};


exports.placeBidNotification = async function (estateId, userEmail) {
  try {
    const bids = await bid.bidModel
      .find({ estateId: estateId })
      .populate('userId', 'email');

    bids.forEach(bid => {
      let subject;
      let body;
      if (bid.userId.email === userEmail) {
        // The user who just placed the bid
        subject = "Intelligent Broker Estate Auction";
        body = "Congrats!! Your bid was successfully submitted.";
      } else {
        // Other bidders
        subject = "Update on Intelligent Broker Auction Estate";
        body = "Someone placed a higher bid than yours! Go place a higher bid.";
      }
      emailNotification(bid.userId.email, subject, auctionEmailTemplate(body));
    });
  } catch (err) {
    console.log("Error in placeBidNotification:", err);
  }
};

exports.scheduleVisitNotificataion = async function (visitId) {
  try {
    let visitData = await visit.visitModel.findOne({ _id: visitId }).populate([
      { path: 'visitorId', select: 'email' }, { path: 'estateId', populate: { path: 'sellerId', select: 'email' } }]);
    if (!visitData) {
      console.log("Visit not found");
      return;
    }
    const visitDate = new Date(
      visitData.date
    ).toLocaleString();
    const subject = "Intelligent Broker - Estate Visit";
    const userBody = `
Visit scheduled successfully.

Date: ${visitDate}
Property: ${visitData.estateId.address}

We will notify you when owner responds.
`;

    const ownerBody = `
New visit request received.

Date: ${visitDate}
Visitor: ${visitData.visitorId.email}

Please login to respond.
`;
    await Promise.all([

      emailNotification(
        visitData.visitorId.email,
        subject,
        scheduleVisitEmailTemplate(userBody)
      ),

      emailNotification(
        visitData.estateId.sellerId.email,
        subject,
        scheduleVisitEmailTemplate(ownerBody)
      )

    ]);

  } catch (err) {
    console.log(err);
  }
}

exports.scheduleVisitReplyNotification  = async function (visitId) {
  try {
    let visitData = await visit.visitModel.findOne({ _id: visitId }).populate([{ path: 'visitorId', select: 'email' }, { path: 'estateId', select: 'address' }]);
    if (!visitData) {
      console.log("Visit not found");
      return;
    }

    const subject =
      "Update on Intelligent Broker Estate Visit Schedule";
    const body =
      `Your request to visit ${visitData.estateId.address}
       has been updated. Please check your account.`;
    await emailNotification(visitData.visitorId.email, subject, scheduleVisitEmailTemplate(body));
  } catch (err) {
    console.log(err);
  }
}

exports.estateNotification = async function (estateData) {
  try {
    let subject = "Update on Intelligent Broker estate status";
    let body = "Your request for " + estateData.address + " estate was Updated check it ";
    emailNotification(estateData.sellerId.email, subject, body)
    if (estateData.status === "approve") {
      body = "New updates on " + estateData.estateId.address + " estate check it";
      let savedEstatesData = await save.savedModel.find({ estateId: estateData._id }).populate('visitorId', 'email');
      savedEstatesData.forEach(element => {
        emailNotification(element.sellerId.email, subject, body)
      });
    }
  } catch (err) {
    console.log(err);
  }
}

async function emailNotification(to, subject, html) {
  try {
    mailOptions = {
      from: process.env.APP_GMAIL, // always define sender
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

  } catch (err) {
    console.error("Error sending email:", err);
  }
}