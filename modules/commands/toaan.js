const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.join(__dirname, "cache/data/toaan.json");

if (!fs.existsSync(DATA_PATH)) {
  fs.ensureFileSync(DATA_PATH);
  fs.writeJsonSync(DATA_PATH, { boxes: {} }, { spaces: 2 });
}

module.exports.config = {
  name: "toaan",
  version: "1.0.0",
  hasPermission: 0,
  credits: "ChatGPT x Khôi",
  description: "Tòa án tài chính của box",
  commandCategory: "Tòa Án",
  usages: "toaan info | wanted | help",
  cooldowns: 3,
  usePrefix: false
};

module.exports.run = async ({ api, event, args, Users }) => {
  const { threadID, senderID } = event;
  const data = fs.readJsonSync(DATA_PATH);
  const send = (msg) => api.sendMessage(msg, threadID);

  if (!data.boxes[threadID]) {
    data.boxes[threadID] = { wanted: {} };
  }

  const box = data.boxes[threadID];

  // ===== HELP =====
  if (!args[0] || args[0] === "help") {
    return send(
`🏛️ TÒA ÁN BOX
━━━━━━━━━━━━━━
📌 toaan info → xem tình trạng bản thân
🚨 toaan wanted → danh sách
