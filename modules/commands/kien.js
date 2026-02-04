module.exports.config = {
  name: "kien",
  hasPermission: 0,
  description: "Kiện nợ",
  commandCategory: "Tòa Án",
  usages: "kien tag/reply",
  cooldowns: 10,
  usePrefix: true
};

module.exports.run = async ({ api, event, Currencies, Users }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const DATA = path.join(__dirname, "cache/data/toaan.json");

  const target = event.type === "message_reply"
    ? event.messageReply.senderID
    : Object.keys(event.mentions || {})[0];

  if (!target)
    return api.sendMessage("❌ Phải tag hoặc reply người nợ", event.threadID);

  const db = JSON.parse(fs.readFileSync(DATA));
  const loan = db.loans.find(l => l.borrower == target && !l.sued);
  if (!loan)
    return api.sendMessage("❌ Không có khoản vay hợp lệ", event.threadID);

  let rate = 50 + (db.bribe[event.senderID] || 0);
  const roll = Math.random() * 100;

  loan.sued = true;
  db.bribe[event.senderID] = 0;

  if (roll < rate && Math.random() < 0.98) {
    const debtMoney = (await Currencies.getData(target)).money;
    await Currencies.decreaseMoney(target, debtMoney);
    await Currencies.increaseMoney(event.senderID, debtMoney);

    db.wanted[target] ??= { count: 0 };
    db.wanted[target].count++;

    if (db.wanted[target].count >= 3)
      db.blacklist.push(target);

    api.sendMessage(`⚖️ PHÁN QUYẾT
━━━━━━━━━━━━━━━━━━
✅ NGUYÊN ĐƠN THẮNG
💰 Tịch thu toàn bộ tiền con nợ
🚨 Số lần thua kiện: ${db.wanted[target].count}`, event.threadID);
  } else {
    const comp = Math.floor(loan.money / 2);
    await Currencies.increaseMoney(event.senderID, comp);

    api.sendMessage(`⚖️ PHÁN QUYẾT
━━━━━━━━━━━━━━━━━━
❌ KIỆN THẤT BẠI
💸 Bồi thường: ${comp.toLocaleString()}$`, event.threadID);
  }

  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
};
