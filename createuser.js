const mongoose = require("mongoose");
const User = require("./models/user");

mongoose.connect("mongodb://127.0.0.1:27017/wanderlust")
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const username = "Yousuf";
    const email = "yousuf@example.com";
    const newPassword = "yygs123"; // change this to your desired password

    // Find existing user
    let user = await User.findOne({ email });

    if (!user) {
      // If user doesn’t exist, create a new one
      user = new User({ username, email });
      await User.register(user, newPassword);
      console.log("✅ New user created with password!");
    } else {
      // If user exists, update their password
      await user.setPassword(newPassword);
      await user.save();
      console.log("🔄 Password updated for existing user!");
    }

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ Error:", err);
  });
