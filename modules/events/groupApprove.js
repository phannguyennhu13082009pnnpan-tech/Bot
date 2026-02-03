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
    i.approved === false &&
    i.approveMessageID === event.messageID
);

if (!group) return;

group.approved = true;
delete group.approveMessageID;
saveData(data);

// gửi về GROUP, không phải inbox admin
api.sendMessage(
`✅ ADMIN ĐÃ DUYỆT BOT

🤖 Bot được phép hoạt động tại nhóm này
📌 Trạng thái: CHƯA THUÊ (chỉ dùng lệnh giới hạn)

👉 Liên hệ admin để thuê bot`,
group.threadID
);
