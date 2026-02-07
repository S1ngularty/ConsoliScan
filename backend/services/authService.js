const User = require("../models/userModel");
const Eligible = require("../models/eligibleModel");
const admin = require("../configs/firebase");
const { createLog } = require("./activityLogsService");
const bcrypt = require("bcrypt");

exports.register = async (request) => {
  if (!request.body) throw new Error("undefined body");
  const { name, email, age, sex, password } = request.body;

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    name,
    email,
    age,
    sex,
    password: hashPassword,
  });
  return newUser;
};

exports.login = async (request) => {
  const { email, password } = request.body;
  let userData = await User.findOne({ email }).select(
    "+password role email name status",
  );
  if (!userData) throw new Error("account does not exist");
  if (userData.status === "inactive") throw new Error("user is inactive");

  let eligibilityStatus = null;

  if (userData.role === "user") {
    eligibilityStatus = await Eligible.findOne({ user: userData._id });
  }

  const isMatched = await bcrypt.compare(password, userData.password);
  if (!isMatched) throw new Error("password does not match");
  const jwtToken = await userData.getToken();
  if (!jwtToken) throw new Error("failed to generate user token");

  const user = {
    userId: String(userData._id),
    name: userData.name,
    email: userData.email,
    role: userData.role,
    status: userData.status,
  };
  console.log(user);
  return { user, eligibilityStatus, token: jwtToken };
};

exports.verifyToken = async (request) => {
  const { user } = request;
  let eligibilityStatus = null;
  if (user.role === "user") {
    eligibilityStatus = await Eligible.findOne({ user: user.userId });
  }

  return { user, eligibilityStatus };
};

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
