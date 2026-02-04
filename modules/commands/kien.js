module.exports.config = {
  name: "kienno",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Kiện nợ theo BILL",
  commandCategory: "Game",
  usages: "!kienno <BILL_KEY>",
  cooldowns: 2
};

const fs = require("fs");
const path = require("path");
const BILL_PATH = path.join(__dirname, "cache/data/bill.json");

function loadBill() {
  if (!fs.existsSync(BILL_PATH))
    fs.writeFileSync(BILL_PATH, JSON.stringify({ bills: [] }, null, 2));
  return JSON.parse(fs.readFileSync(BILL_PATH));
}

module.exports.run = async ({ api, event }) => {
  const { threadID, senderID, body } = event;
  const args = body.split(/\s+/);
  if (!args[1])
    return api.sendMessage("❌ Thiếu BILL!\n👉 !kienno <BILL_KEY>", threadID);

  const billKey = args[1];
  const db = loadBill();
  const bill = db.bills.find(b => b.id === billKey);

  if (!bill)
    return api.sendMessage("❌ BILL không tồn tại!", threadID);
  if (bill.paid)
    return api.sendMessage("⚠️ BILL này đã được trả!", threadID);
  if (bill.threadID !== threadID)
    return api.sendMessage("❌ BILL không thuộc box này!", threadID);

  // chỉ người cho vay hoặc hệ thống mới được kiện
  if (bill.type === "user" && bill.lender !== senderID)
    return api.sendMessage("❌ Bạn không có quyền kiện BILL này!", threadID);

  // ===== XỬ ÁN (98% THẮNG) =====
  const winRate = 0.98;
  const isWin = Math.random() < winRate;

  if (isWin) {
    return api.sendMessage(
`⚖️ KIỆN NỢ THÀNH CÔNG
━━━━━━━━━━━━━━
🧾 BILL: ${bill.id}
💰 Số tiền: ${bill.money.toLocaleString()}$
📌 Phán quyết:
👉 Người nợ phải trả NGAY
👉 Có thể bị truy nã / khóa vay`,
      threadID
    );
  } else {
    const compensation = Math.floor(bill.money / 2);
    return api.sendMessage(
`⚖️ KIỆN NỢ THẤT BẠI
━━━━━━━━━━━━━━
🧾 BILL: ${bill.id}
💸 Bồi thường: ${compensation.toLocaleString()}$
📌 Án phí do hệ thống chi trả`,
      threadID
    );
  }
};
