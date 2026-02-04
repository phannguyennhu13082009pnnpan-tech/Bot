const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.join(__dirname, "cache/data/toaan.json");

if (!fs.existsSync(DATA_PATH)) {
  fs.ensureFileSync(DATA_PATH);
  fs.writeJsonSync(DATA_PATH, { boxes: {} }, { spaces: 2 });
}

module.exports.config = {
  name: "truyna",
  version: "2.0.0",
  hasPermission: 2,
  credits: "ChatGPT x Khôi",
  description: "Truy nã tài chính theo box",
  commandCategory: "Tòa Án",
  usages: "truyna @tag | reply | list | clear",
  cooldowns: 3,
  usePrefix: false
};

module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID } = event;
  const data = fs.readJsonSync(DATA_PATH);
  const send = (msg) => api.sendMessage(msg, threadID);

  // init box
  if (!data.boxes[threadID]) {
    data.boxes[threadID] = { wanted: {} };
  }

  const box = data.boxes[threadID];

  // ===== LIST =====
  if (args[0] === "list") {
    const ids = Object.keys(box.wanted);
    if (ids.length === 0)
      return send("✅ Box này hiện không có ai bị truy nã.");

    let msg = "🚨 TRUY NÃ CỦA BOX 🚨\n━━━━━━━━━━━━━━\n";
    let i = 1;
    for (const id of ids) {
      const name = await Users.getNameUser(id);
      msg += `${i++}. ${name}\n⚖️ Thua kiện: ${box.wanted[id].count} lần\n\n`;
    }
    return send(msg);
  }

  // ===== CLEAR =====
  if (args[0] === "clear") {
    const targetID =
      Object.keys(event.mentions)[0] ||
      (event.type === "message_reply" && event.messageReply.senderID);

    if (!targetID) return send("❎ Tag hoặc reply người cần gỡ truy nã.");

    delete box.wanted[targetID];
    fs.writeJsonSync(DATA_PATH, data, { spaces: 2 });

    const name = await Users.getNameUser(targetID);
    return send(`✅ Đã gỡ truy nã cho ${name} trong box này.`);
  }

  // ===== ADD =====
  const targetID =
    Object.keys(event.mentions)[0] ||
    (event.type === "message_reply" && event.messageReply.senderID);

  if (!targetID) return send("❎ Tag hoặc reply người cần truy nã.");

  if (!box.wanted[targetID]) {
    box.wanted[targetID] = { count: 1 };
  } else {
    box.wanted[targetID].count++;
  }

  fs.writeJsonSync(DATA_PATH, data, { spaces: 2 });

  const name = await Users.getNameUser(targetID);
  const count = box.wanted[targetID].count;

  return send(
`🚨🚨🚨 TRUY NÃ BOX 🚨🚨🚨
━━━━━━━━━━━━━━━━━━
👤 Đối tượng: ${name}
🏠 Phạm vi: BOX HIỆN TẠI
⚖️ Thua kiện: ${count} lần
⛔ Cảnh báo: KHÔNG CHO VAY – KHÔNG BẢO LÃNH
💀 Trạng thái: NỢ XẤU BOX`
  );
};
