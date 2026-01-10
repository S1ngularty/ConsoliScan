const admin = require("firebase-admin");

const serviceAccount = require("../singularity-9b3ba-firebase-adminsdk-fbsvc-5b80cb32c8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
