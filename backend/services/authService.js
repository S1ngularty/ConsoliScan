const User = require("../models/userModel");
const admin = require("../configs/firebase");

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

  response.cookie("token", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  
  return {
    token: jwtToken,
    role: user.role,
  };
};
