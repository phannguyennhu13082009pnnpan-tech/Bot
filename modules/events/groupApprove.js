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
// 2️⃣ chờ 10 giây rồi gửi MENU (tránh spam)
    setTimeout(() => {
      api.sendMessage(
`✨🤖 MENU THUÊ BOT TỰ ĐỘNG 🤖✨
━━━━━━━━━━━━━━━━━━
📌 QUYỀN LỢI KHI THUÊ BOT
✔️ Bot hoạt động 24/7 – ổn định
✔️ Phản hồi nhanh, ít lỗi
✔️ Hỗ trợ & cập nhật thường xuyên
✔️ Gia hạn linh hoạt theo thời gian thuê
━━━━━━━━━━━━━━━━━━
📦 BẢNG GIÁ THUÊ BOT

🌱 GÓI CHÀO
⏳ 1 tháng: FREE
⏳ 6 tháng: 30.000đ
⏳ 12 tháng: 60.000đ

━━━━━━━━━━━━━━━━━━
⚙️ GÓI THƯỜNG
⏳ 1 tháng: 10.000đ
⏳ 6 tháng: 50.000đ
⏳ 12 tháng: 70.000đ

━━━━━━━━━━━━━━━━━━
👑 GÓI VIP
⏳ 1 tháng: 30.000đ
⏳ 6 tháng: 140.000đ
⏳ 12 tháng: 250.000đ

━━━━━━━━━━━━━━━━━━
📞 LIÊN HỆ ADMIN
👉 https://www.facebook.com/share/1AqqydaH5m/
━━━━━━━━━━━━━━━━━━`,
        group.threadID
      );
    }, 10 * 1000); // 10 giây

  } catch (e) {
    console.log("approveRent error:", e);
  }
};
