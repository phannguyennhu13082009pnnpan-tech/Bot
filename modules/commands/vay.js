module.exports.config = {
  name: "vay",
  hasPermission: 0,
  description: "Vay tiền hệ thống hoặc người chơi",
  commandCategory: "Kinh Tế",
  usages: "vay <số tiền> hethong | tag",
  cooldowns: 5,
  usePrefix: false
};

module.exports.run = async ({ api, event, Currencies }) => {
  const fs = require("fs-extra");
  const path = require("path");
  const DATA = path.join(__dirname, "cache/data/toaan.json");

  const money = parseInt(event.args[0]);
  if (!money || money <= 0)
    return api.sendMessage("❌ Số tiền không hợp lệ", event.threadID);

  const db = JSON.parse(fs.readFileSync(DATA));
  if (db.blacklist.includes(event.senderID))
    return api.sendMessage("⛔ Bạn đã bị cấm vay vĩnh viễn", event.threadID);

  let lender = "hethong";

  if (event.mentions && Object.keys(event.mentions).length > 0) {
    lender = Object.keys(event.mentions)[0];
    const lenderMoney = (await Currencies.getData(lender)).money;
    if (lenderMoney < money)
      return api.sendMessage("❌ Người cho vay không đủ tiền", event.threadID);
  }

  db.loans.push({
    borrower: event.senderID,
    lender,
    money,
    time: Date.now(),
    sued: false
  });

  if (lender !== "hethong")
    await Currencies.decreaseMoney(lender, money);

  await Currencies.increaseMoney(event.senderID, money);
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2));

  api.sendMessage(
`💸 VAY THÀNH CÔNG
━━━━━━━━━━━━━━━━━━
💰 Số tiền : ${money.toLocaleString()}$
🏦 Chủ nợ : ${lender === "hethong" ? "HỆ THỐNG" : "NGƯỜI CHƠI"}
⚖️ Lưu ý : Có thể bị kiện`,
    event.threadID
  );
};
