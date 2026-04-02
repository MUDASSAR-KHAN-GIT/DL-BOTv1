const fs = require("fs");
const { PREFIX, MODE, OWNER_NUMBER } = require("./config");

// Load plugins once (faster lookup using Map)
const plugins = new Map();

fs.readdirSync("./plugins").forEach(file => {
  if (file.endsWith(".js")) {
    const plugin = require(`./plugins/${file}`);
    if (plugin?.pattern && plugin?.run) {
      plugins.set(plugin.pattern, plugin);
    }
  }
});

module.exports = async (conn, msg) => {
  try {
    if (!msg?.message) return;

    const from = msg.key.remoteJid;
    const isGroup = from.endsWith("@g.us");

    const sender = isGroup
      ? msg.key.participant
      : msg.key.remoteJid;

    const senderNum = sender.split("@")[0];

    // 🚫 ignore bot itself (prevents loops)
    if (msg.key.fromMe) return;

    // 🧠 improved message extraction
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    if (!body.startsWith(PREFIX)) return;

    // 🔐 mode control
    if (MODE === "private" && senderNum !== OWNER_NUMBER) return;
    if (MODE === "inbox" && isGroup) return;
    if (MODE === "groups" && !isGroup) return;

    const [rawCommand, ...args] = body.slice(PREFIX.length).trim().split(" ");
    const command = rawCommand.toLowerCase();

    const plugin = plugins.get(command);
    if (!plugin) return;

    // ⚡ unified context object
    const context = {
      from,
      sender,
      senderNum,
      args,
      isGroup,
      isCreator: senderNum === OWNER_NUMBER,

      reply: (txt) =>
        conn.sendMessage(from, { text: txt }, { quoted: msg })
    };

    // 🧩 safe plugin execution (prevents bot crash)
    try {
      await plugin.run(conn, msg, context);
    } catch (err) {
      console.log(`Plugin Error [${command}]:`, err);
      context.reply("❌ Plugin execution failed");
    }

  } catch (e) {
    console.log("Handler Error:", e);
  }
};