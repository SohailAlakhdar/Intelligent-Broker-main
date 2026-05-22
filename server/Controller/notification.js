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
      .find({ estateId })
      .populate("userId", "email");

    await Promise.all(
      bids
        .filter(bid => bid.userId?.email)  // skip deleted/missing users
        .map(bid => {
          const isCurrent = bid.userId.email === userEmail;
          const subject = isCurrent
            ? "Intelligent Broker Estate Auction"
            : "Update on Intelligent Broker Auction Estate";
          const body = isCurrent
            ? "Congrats!! Your bid was successfully submitted."
            : "Someone placed a higher bid than yours! Go place a higher bid.";

          return emailNotification(bid.userId.email, subject, auctionEmailTemplate(body));
        })
    );

  } catch (err) {
    console.error("placeBidNotification error:", err);
  }
};


exports.scheduleVisitNotification = async function (visitId) {
  try {
    const visitData = await visit.visitModel
      .findOne({ _id: visitId })
      .populate([
        { path: "visitorId", select: "email" },
        { path: "estateId", populate: { path: "sellerId", select: "email" } },
      ]);

    if (!visitData) {
      console.error("scheduleVisitNotification: visit not found:", visitId);
      return;
    }

    // Guard against broken references
    const visitorEmail = visitData.visitorId?.email;
    const sellerEmail = visitData.estateId?.sellerId?.email;

    if (!visitorEmail || !sellerEmail) {
      console.error("scheduleVisitNotification: missing email on visitor or seller:", visitId);
      return;
    }

    // Consistent date format regardless of server locale
    const visitDate = new Date(visitData.date).toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const subject = "Intelligent Broker - Estate Visit";

    const userBody = `
Visit scheduled successfully.

Date: ${visitDate}
Property: ${visitData.estateId.address || "Unknown Address"}

We will notify you when the owner responds.
`;

    const ownerBody = `
New visit request received.

Date: ${visitDate}
Visitor: ${visitorEmail}

Please login to respond.
`;

    await Promise.all([
      emailNotification(visitorEmail, subject, scheduleVisitEmailTemplate(userBody)),
      emailNotification(sellerEmail, subject, scheduleVisitEmailTemplate(ownerBody)),
    ]);

  } catch (err) {
    console.error("scheduleVisitNotification error:", err);
  }
};

exports.scheduleVisitReplyNotification = async function (visitId) {
  try {
    const visitData = await visit.visitModel
      .findOne({ _id: visitId })
      .populate([
        { path: "visitorId", select: "email" },
        { path: "estateId", select: "address" },
      ]);

    if (!visitData) {
      console.error("scheduleVisitReplyNotification: visit not found:", visitId);
      return;
    }

    const visitorEmail = visitData.visitorId?.email;
    const estateAddress = visitData.estateId?.address;

    if (!visitorEmail || !estateAddress) {
      console.error("scheduleVisitReplyNotification: missing email or address:", visitId);
      return;
    }

    const subject = "Update on Intelligent Broker Estate Visit Schedule";
    const body = `Your request to visit ${estateAddress} has been updated. Please check your account.`;

    await emailNotification(visitorEmail, subject, scheduleVisitEmailTemplate(body));

  } catch (err) {
    console.error("scheduleVisitReplyNotification error:", err);
  }
};

exports.estateNotification = async function (estateData) {
  if (!estateData || !estateData.sellerId?.email) {
    console.error("estateNotification: missing estateData or seller email:", estateData);
    return;
  }

  try {
    const subject = "Update on Intelligent Broker estate status";
    const sellerBody = `Your request for ${estateData.address} estate was updated, check it.`;

    await emailNotification(estateData.sellerId.email, subject, sellerBody);

    if (estateData.status === "approved") {
      const savedEstates = await save.savedModel
        .find({ estateId: estateData._id })
        .populate("visitorId", "email");

      const visitorBody = `New updates on ${estateData.address} estate, check it.`;

      await Promise.all(
        savedEstates
          .filter(element => element.visitorId?.email)
          .map(element =>
            emailNotification(element.visitorId.email, subject, visitorBody)
          )
      );
    }

  } catch (err) {
    console.error("estateNotification error:", err);
  }
};

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