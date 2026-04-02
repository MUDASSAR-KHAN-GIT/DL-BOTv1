require("dotenv").config();

module.exports = {
  OWNER_NUMBER: process.env.OWNER_NUMBER || "923216046022",
  BOT_NAME: process.env.BOT_NAME || "DL-Bot",
  PREFIX: process.env.PREFIX || ".",
  MODE: process.env.MODE || "public",
  SESSION_ID: process.env.SESSION_ID || "IK~H4sIAAAAA..."
};
