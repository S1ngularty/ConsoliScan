const admin = require("firebase-admin");

var serviceAccount = require("../singularity-9b3ba-firebase-adminsdk-fbsvc-5b80cb32c8.json");

admin.initializeApp({
  credential: serviceAccount,
});

module.exports = admin;
