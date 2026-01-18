const User = require("../models/userModel");
const admin = require("../configs/firebase");
const { createLog } = require("./activityLogsService");

exports.googleAuth = async (request, response) => {
  const { token } = request.body;
  const decoded = await admin.auth().verifyIdToken(token);

  const { uid, email, name, picture } = decoded;
  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    user = await User.create({
      firebaseUid: uid,
      name,
      email,
      avatar: {
        url: picture,
      },
    });
  }

  if (!user) throw new Error("user is undefined");
  const jwtToken = await user.getToken();

  response.cookie("token", jwtToken, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  createLog(
    user._id,
    "LOGIN",
    "SUCCESS",
    `${user.name} logged in to the system as ${user.role}`,
  );

  return {
    token: jwtToken,
    role: user.role,
  };
};

exports.logout = async (request, response) => {
  response.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  createLog(
    request.user.userId,
    "LOGOUT",
    "SUCCESS",
    `${request.user.name} logged out to the system as ${request.user.role}`,
  );
  return;
};
