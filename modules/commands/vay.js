const fs = require("fs-extra");
const path = require("path");

const DATA_PATH = path.join(__dirname, "cache/data/toaan.json");

// init data
if (!fs.existsSync(DATA_PATH)) {
  fs.ensureFileSync(DATA_PATH);
  fs.writeJsonSync(
    DATA_PATH,
    {
      boxes: {}
    },
    { spaces: 2 }
  );
}

module.exports.config = {
  name: "vay",
  version: "3.0.0",
  hasPermission: 0,
  credits: "ChatGPT x Khôi",
  description: "Vay tiền hệ thống hoặc người chơi (có tòa án)",
  commandCategory: "Tài Chính",
  usages: "vay <số tiền> | vay <số tiền> @tag",
  cooldowns: 5,
  usePrefix: false
};

module.exports.run = async ({ api, event, args, Currencies, Users }) => {
  const { threadID, senderID, mentions } = event;
  const send = (msg) => api.sendMessage(msg, threadID);

  const db = fs.readJsonSync(DATA_PATH);

  // init box
  if (!db.boxes[threadID]) {
    db.boxes[threadID] = {
      wanted: {},
      blacklist: []
    };
  }

  const box = db.boxes[threadID];

  // ===== CHECK CẤM VAY =====
  if (box.blacklist.includes(senderID)) {
    return send("⛔ Bạn đã bị CẤM VAY VĨNH VIỄN trong box này!");
  }

  if (box.wanted[senderID] && box.wanted[senderID].count >= 3) {
    return send("🚨 Bạn đang bị truy nã nặng, KHÔNG ĐƯỢC PHÉP VAY!");
  }

  // ===== PARSE MONEY =====
  let raw = args[0];
  if (!raw)
    return send("❌ Vui lòng nhập số tiền cần vay!");

  raw = raw
    .toLowerCase()
    .replace(/k/g, "000")
    .replace(/,/g, "")
    .trim();

  const money = Number(raw);

  if (isNaN(money) || money <= 0)
    return send("❌ Số tiền không hợp lệ!");

  // ===== XÁC ĐỊNH NGƯỜI CHO VAY =====
  let lender = "hethong";
  let lenderName = "🏦 HỆ THỐNG";

  if (Object.keys(mentions).length > 0) {
    lender = Object.keys(mentions)[0];
    lenderName = await Users.getNameUser(lender);

    if (lender === senderID)
      return send("❌ Không thể tự vay chính mình!");

    const lenderMoney = (await Currencies.getData(lender)).money || 0;
    if (lenderMoney < money)
      return send("❌ Người cho vay không đủ tiền!");
  }

  // ===== CỘNG TIỀN =====
  await Currencies.increaseMoney(senderID, money);

  if (lender !== "hethong") {
    await Currencies.decreaseMoney(lender, money);
  }

  // ===== LƯU LOG =====
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
