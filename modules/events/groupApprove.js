const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "modules", "commands", "cache", "rent.json");
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]");

const loadData = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const saveData = data => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

module.exports.config = {
  name: "approveRent",
  version: "1.0.0",
  credits: "full-by-chatgpt",
  description: "Admin thả tim để duyệt nhóm dùng bot",
};

module.exports.handleEvent = async ({ api, event }) => {
  try {
    // chỉ bắt reaction
    if (!event.reaction) return;

    const botID = api.getCurrentUserID();
    const admins = global.config.ADMINBOT;

    // chỉ admin bot mới được duyệt
    if (!admins.includes(event.userID)) return;

    // chỉ nhận ❤️
    if (event.reaction !== "❤") return;

    const data = loadData();

    // tìm nhóm chưa duyệt
    const group = data.find(
      i =>
        i.threadID == event.threadID &&
        i.approved === false &&
        i.approveMessageID === event.messageID
    );

    if (!group) return;

    // duyệt
    group.approved = true;
    delete group.approveMessageID;

    saveData(data);

    // thông báo duyệt
    api.sendMessage(
      `✅ NHÓM ĐÃ ĐƯỢC DUYỆT

📌 Trạng thái: ĐÃ DUYỆT
⚠️ Lưu ý:
- Nhóm CHƯA thuê bot
- Chỉ được dùng lệnh cơ bản (nếu có)
- Muốn dùng full → liên hệ admin để thuê bot

💬 Admin bot đã xác nhận`,
      event.threadID
    );
  } catch (e) {
    console.log("approveRent error:", e);
  }
};
