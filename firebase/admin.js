var admin = require("firebase-admin");

var serviceAccount = require("./tenunara-firebase-adminsdk-fi2gu-4d7810e5b9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tenunara-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "tenunara.appspot.com"
});
const bucket = admin.storage().bucket();
const db = admin.firestore();
module.exports = { admin, bucket, db };
