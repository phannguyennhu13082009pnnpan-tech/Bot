const fs = require("fs");
const path = require("path");

const BILL_PATH = path.join(__dirname, "cache/data/bill.json");
if (!fs.existsSync(BILL_PATH)) fs.writeFileSync(BILL_PATH, "[]");

const loadBill = () => JSON.parse(fs.readFileSync(BILL_PATH, "utf8"));
const saveBill = (data) =>
  fs.writeFileSync(BILL_PATH, JSON.stringify(data, null, 2));

module.exports.config = {
  name: "trano",
  version: "1.0.0",
  hasPermission: 0,
  description: "Trả nợ (đủ tiền / trả dần / gom sạch)",
  commandCategory: "Kinh Tế",
  usages: "trano <billID> [số tiền]",
  cooldowns: 3,
  usePrefix: false
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const { senderID, threadID } = event;
  const data = loadBill();

  const billID = args[0];
  const payAmount = args[1] ? parseInt(args[1]) : null;

  if (!billID)
    return api.sendMessage("❌ Dùng: trano <billID> [số tiền]", threadID);

  const bill = data.find((b) => b.id === billID && b.borrower === senderID);
  if (!bill)
    return api.sendMessage("❌ Không tìm thấy bill của bạn!", threadID);

  let userMoney = (await Currencies.getData(senderID)).money || 0;

  // =====================
  // CÁCH 2: TRẢ MỘT PHẦN
  // =====================
  if (payAmount && payAmount > 0) {
    if (userMoney < payAmount)
      return api.sendMessage("❌ Bạn không đủ tiền!", threadID);

    await Currencies.decreaseMoney(senderID, payAmount);

    if (bill.type === "user" && bill.lender !== "hethong") {
      await Currencies.increaseMoney(bill.lender, payAmount);
    }

    bill.money -= payAmount;

    if (bill.money <= 0) {
      data.splice(data.indexOf(bill), 1);
      saveBill(data);
      return api.sendMessage("✅ Đã trả HẾT nợ!", threadID);
    }

    saveBill(data);
    return api.sendMessage(
      `💸 Đã trả ${payAmount.toLocaleString()}$\n❗ Còn nợ: ${bill.money.toLocaleString()}$`,
      threadID
    );
  }

  // =====================
  // CÁCH 3: ĐỦ TIỀN → TRẢ HẾT
  // =====================
  if (userMoney >= bill.money) {
    await Currencies.decreaseMoney(senderID, bill.money);

    if (bill.type === "user" && bill.lender !== "hethong") {
      await Currencies.increaseMoney(bill.lender, bill.money);
    }

    data.splice(data.indexOf(bill), 1);
    saveBill(data);

    return api.sendMessage("✅ Đã trả sạch nợ!", threadID);
  }

  // =====================
  // CÁCH 1: KHÔNG ĐỦ → GOM SẠCH
  // =====================
  if (userMoney > 0) {
    await Currencies.decreaseMoney(senderID, userMoney);

    if (bill.type === "user" && bill.lender !== "hethong") {
      await Currencies.increaseMoney(bill.lender, userMoney);
    }

    bill.money -= userMoney;
    bill.badDebt = (bill.badDebt || 0) + 1;
    saveBill(data);

    return api.sendMessage(
`⚠️ KHÔNG ĐỦ TIỀN
━━━━━━━━━━━━━━
💰 Đã thu: ${userMoney.toLocaleString()}$
❌ Còn nợ: ${bill.money.toLocaleString()}$

🚨 Nợ xấu: ${bill.badDebt}`,
      threadID
    );
  }

  return api.sendMessage("❌ Bạn không còn đồng nào để trả!", threadID);
};
