module.exports.config = {
  name: "kienno",
  hasPermission: 0,
  description: "Kiện nợ",
  commandCategory: "Tòa Án",
  usages: "!kienno @tag | reply",
  cooldowns: 10,
  usePrefix: true
};

module.exports.run = async ({ api, event, Currencies }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const DATA = path.join(__dirname, "cache/data/toaan.json");

  const args = event.args || [];

  let target =
    event.type === "message_reply"
      ? event.messageReply.senderID
      : Object.keys(event.mentions || {})[0];

  if (!target)
    return api.sendMessage("❌ Phải tag hoặc reply người nợ!", event.threadID);

  const db = JSON.parse(fs.readFileSync(DATA));
  const loan = db.loans.find(l => l.borrower == target && !l.sued);

  if (!loan)
    return api.sendMessage("❌ Không có khoản vay hợp lệ!", event.threadID);

  let rate = 50 + (db.bribe[event.senderID] || 0);
  let roll = Math.random() * 100;

  loan.sued = true;
  db.bribe[event.senderID] = 0;

  if (roll < rate && Math.random() < 0.98) {
    const debt = (await Currencies.getData(target)).money;
    await Currencies.decreaseMoney(target, debt);
    await Currencies.increaseMoney(event.senderID, debt);

    if (!db.wanted[target]) db.wanted[target] = { count: 0 };
    db.wanted[target].count++;

    if (db.wanted[target].count >= 3)
      db.blacklist.push(target);

    api.sendMessage(`⚖️ PHÁN QUYẾT\n✅ NGUYÊN ĐƠN THẮNG\n💸 Tịch thu ${debt}$`, event.threadID);
  } else {
    const comp = Math.floor(loan.money / 2);
    await Currencies.increaseMoney(event.senderID, comp);
    api.sendMessage(`⚖️ PHÁN QUYẾT\n❌ KIỆN THẤT BẠI\n💵 Bồi thường ${comp}$`, event.threadID);
  }

  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));
};
