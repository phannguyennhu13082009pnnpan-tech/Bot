module.exports.config = {
  name: "vay",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ChatGPT",
  description: "Vay hệ thống hoặc người chơi (tạo BILL)",
  commandCategory: "Game",
  usages: "!vay system <tiền> | !vay user <tiền> @tag/reply",
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
function saveBill(data) {
  fs.writeFileSync(BILL_PATH, JSON.stringify(data, null, 2));
}

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { threadID, senderID, messageReply, mentions } = event;
  if (!args[0] || !args[1]) {
    return api.sendMessage(
`💸 MENU VAY
━━━━━━━━━━━━━━
!vay system <tiền>
!vay user <tiền> @tag
!reply + !vay user <tiền>`,
      threadID
    );
  }

  const type = args[0].toLowerCase();
  const money = parseInt(args[1]);
  if (!money || money <= 0)
    return api.sendMessage("❌ Số tiền không hợp lệ!", threadID);

  const db = loadBill();

  // ===== VAY HỆ THỐNG =====
  if (type === "system") {
    await Currencies.increaseMoney(senderID, money);

    const bill = {
      id: `BILL-SYS-${Date.now()}-${threadID}`,
      type: "system",
      borrower: senderID,
      lender: "hethong",
      money,
      threadID,
      time: Date.now(),
      paid: false
    };

    db.bills.push(bill);
    saveBill(db);

    return api.sendMessage(
`🏦 VAY HỆ THỐNG THÀNH CÔNG
━━━━━━━━━━━━━━
💰 ${money.toLocaleString()}$
🧾 BILL: ${bill.id}
⚠️ Lưu bill để tránh tranh chấp`,
      threadID
    );
  }

  // ===== VAY NGƯỜI =====
  if (type === "user") {
    let targetID;
    if (messageReply) targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0)
      targetID = Object.keys(mentions)[0];

    if (!targetID)
      return api.sendMessage("❌ Phải tag hoặc reply người cho vay!", threadID);
    if (targetID === senderID)
      return api.sendMessage("❌ Không thể tự vay chính mình!", threadID);

    const lenderMoney = (await Currencies.getData(targetID)).money || 0;
    if (lenderMoney < money)
      return api.sendMessage("❌ Người cho vay không đủ tiền!", threadID);

    await Currencies.decreaseMoney(targetID, money);
    await Currencies.increaseMoney(senderID, money);

    const bill = {
      id: `BILL-USER-${Date.now()}-${threadID}`,
      type: "user",
      borrower: senderID,
      lender: targetID,
      money,
      threadID,
      time: Date.now(),
      paid: false
    };

    db.bills.push(bill);
    saveBill(db);

    return api.sendMessage(
`🤝 VAY NGƯỜI CHƠI THÀNH CÔNG
━━━━━━━━━━━━━━
💰 ${money.toLocaleString()}$
🧾 BILL: ${bill.id}
⚠️ Không trả có thể bị kiện`,
      threadID
    );
  }

  return api.sendMessage("❌ Cú pháp sai! Gõ !vay để xem menu", threadID);
};  // ===== LƯU LOG =====
  if (!db.boxes[threadID].loans)
    db.boxes[threadID].loans = [];

  db.boxes[threadID].loans.push({
    borrower: senderID,
    lender,
    money,
    time: Date.now()
  });

  fs.writeJsonSync(DATA_PATH, db, { spaces: 2 });

  // ===== THÔNG BÁO =====
  const borrowerName = await Users.getNameUser(senderID);

  return send(
`💸 HỢP ĐỒNG VAY TIỀN
━━━━━━━━━━━━━━━━━━
👤 Người vay: ${borrowerName}
🏦 Nguồn vay: ${lenderName}
💰 Số tiền: ${money.toLocaleString()}$
⚖️ Pháp lý: Có hiệu lực trong BOX
⚠️ Không trả → có thể bị KIỆN & TRUY NÃ`
  );
};
