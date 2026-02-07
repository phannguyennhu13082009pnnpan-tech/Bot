module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const fs = require("fs");
const pathApproved = __dirname + "/approvedThreads.json";
const pathPending = __dirname + "/pendingApprove.json";

const ADMIN_ID = "61561101096216"; // 🔴 UID ADMIN

let approved = fs.existsSync(pathApproved)
  ? JSON.parse(fs.readFileSync(pathApproved))
  : [];

let pending = fs.existsSync(pathPending)
  ? JSON.parse(fs.readFileSync(pathPending))
  : {};

// ❌ Box chưa duyệt
if (!approved.includes(event.threadID)) {

  // 📩 Gửi yêu cầu duyệt cho admin (chỉ 1 lần)
  if (!Object.values(pending).includes(event.threadID)) {
    api.getThreadInfo(event.threadID, (err, info) => {
      if (err) return;

      api.sendMessage(
`🔔 YÊU CẦU DUYỆT BOX
━━━━━━━━━━━━━━
👥 Box: ${info.threadName || "Không tên"}
🆔 ThreadID: ${event.threadID}

👉 Admin thả 👍 hoặc ❤️ vào tin này để duyệt`,
        ADMIN_ID,
        (e, msg) => {
          if (!e) {
            pending[msg.messageID] = event.threadID;
            fs.writeFileSync(pathPending, JSON.stringify(pending, null, 2));
          
              api.sendMessage(
`┏━━━━━━━━━━━━━━━━━━━━━━┓
┃   ✅ BOX ĐÃ ĐƯỢC DUYỆT   ┃
┗━━━━━━━━━━━━━━━━━━━━━━┛

🎉 Quyền sử dụng bot đã được kích hoạt
🤖 Bot bắt đầu hoạt động trong box này

━━━━━━━━━━━━━━━━━━━━━━
💎 Để sử dụng đầy đủ tính năng:
👉 Vui lòng **thuê bot của Admin**
📩 Liên hệ Admin để được hỗ trợ

🙏 Cảm ơn đã tin tưởng & sử dụng`,
  approveThreadID
                  }
            
