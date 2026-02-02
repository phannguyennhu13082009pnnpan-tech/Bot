const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");

const TZ = "Asia/Ho_Chi_Minh";
const BOT_NAME = "𝓘𝓷𝓼𝓪𝓰𝔂𝓸𝓴 𝓑𝓸𝓽";
const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

const DATA_DIR = path.join(__dirname, "..", "data");
const RENT_PATH = path.join(DATA_DIR, "rent.json");
const BILL_PATH = path.join(DATA_DIR, "bill.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(RENT_PATH)) fs.writeFileSync(RENT_PATH, "[]");
if (!fs.existsSync(BILL_PATH)) fs.writeFileSync(BILL_PATH, "[]");

let rentData = JSON.parse(fs.readFileSync(RENT_PATH));
let billData = JSON.parse(fs.readFileSync(BILL_PATH));

const saveRent = () =>
  fs.writeFileSync(RENT_PATH, JSON.stringify(rentData, null, 2));
const saveBill = () =>
  fs.writeFileSync(BILL_PATH, JSON.stringify(billData, null, 2));

const daysLeft = end =>
  Math.ceil(
    (moment(end, "DD/MM/YYYY").endOf("day") -
      moment().tz(TZ)) / 86400000
  );

const genKey = () =>
  "INSAGYOK-RENT-" +
  Math.random().toString(36).substring(2, 8).toUpperCase();

// ================= CONFIG =================
module.exports.config = {
  name: "rent",
  version: "FINAL-5.0",
  hasPermssion: 0,
  credits: "Insagyok VIP",
  description: "Thuê bot VIP theo tháng + bill + key",
  commandCategory: "System",
  usePrefix: true,
  cooldowns: 3
};

// ================= CHẶN KHI HẾT HẠN =================
module.exports.handleEvent = async ({ api, event }) => {
  if (!event.body) return;
  const item = rentData.find(i => i.threadID == event.threadID);
  if (!item) return;

  if (daysLeft(item.end) > 0) return;

  api.sendMessage(
`━━━━━━━━━━━━━━━━━━━━━━
⛔ BOT ĐÃ HẾT HẠN
━━━━━━━━━━━━━━━━━━━━━━
🤖 ${BOT_NAME}

🔒 Toàn bộ lệnh đã bị khóa
📆 Hạn sử dụng đã kết thúc

━━━━━━━━━━━━━━━━━━━━━━
🔁 GIA HẠN BOT
━━━━━━━━━━━━━━━━━━━━━━
📨 Liên hệ Admin:
${ADMIN_FB}

━━━━━━━━━━━━━━━━━━━━━━`,
    event.threadID
  );
};

// ================= LỆNH CHÍNH =================
module.exports.run = async ({ api, event, args }) => {
  const send = m => api.sendMessage(m, event.threadID);
  const isAdmin = global.config.ADMINBOT.includes(event.senderID);
  const sub = args[0];

  // ===== USER INFO =====
  if (!sub || sub === "info") {
    const item = rentData.find(i => i.threadID == event.threadID);
    if (!item) return send("❎ Nhóm chưa thuê bot");

    const left = daysLeft(item.end);
    return send(
`━━━━━━━━━━━━━━
📌 THÔNG TIN THUÊ BOT
━━━━━━━━━━━━━━
🤖 ${BOT_NAME}
📆 Từ: ${item.start}
📆 Đến: ${item.end}
⏳ Còn: ${left > 0 ? left + " ngày" : "HẾT HẠN"}
━━━━━━━━━━━━━━`
    );
  }

  // ===== USER GIA HẠN =====
  if (sub === "giahan") {
    return send(
`━━━━━━━━━━━━━━
🔁 GIA HẠN BOT
━━━━━━━━━━━━━━
📨 Liên hệ Admin:
${ADMIN_FB}
━━━━━━━━━━━━━━`
    );
  }

  // ===== THUÊ BOT THEO THÁNG =====
  if (sub === "add") {
    if (!isAdmin)
      return send("❌ Chỉ admin bot mới được thuê bot");

    const time = args[1];
    if (!time || !/^\d+T$/i.test(time))
      return send("❎ Dùng: !rent add 1T | 3T | 12T");

    const months = parseInt(time);
    const threadID = event.threadID;
    const userID = event.senderID;

    if (rentData.find(i => i.threadID == threadID))
      return send("⚠️ Nhóm này đã thuê bot");

    const start = moment().tz(TZ);
    const end = start.clone().add(months, "months");

    const startStr = start.format("DD/MM/YYYY");
    const endStr = end.format("DD/MM/YYYY");

    rentData.push({
      threadID,
      userID,
      start: startStr,
      end: endStr
    });

    const key = genKey();
    billData.push({
      key,
      threadID,
      userID,
      start: startStr,
      end: endStr,
      months,
      status: "ACTIVE",
      created: moment().tz(TZ).format("HH:mm DD/MM/YYYY")
    });

    saveRent();
    saveBill();

    return send(
`━━━━━━━━━━━━━━━━━━━━━━
🧾 BILL THUÊ BOT VIP
━━━━━━━━━━━━━━━━━━━━━━
🤖 ${BOT_NAME}

🔑 Mã bill: ${key}
🆔 ThreadID: ${threadID}
👤 Người thuê: ${userID}

📆 Bắt đầu: ${startStr}
📆 Kết thúc: ${endStr}
⏳ Thời hạn: ${months} tháng
📌 Trạng thái: ACTIVE
━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  // ===== ADMIN BILL =====
  if (isAdmin && sub === "bill") {
    const key = args[1];
    const bill = billData.find(b => b.key === key);
    if (!bill) return send("❎ Không tìm thấy bill");

    return send(
`━━━━━━━━━━━━━━
🧾 BILL BOT
━━━━━━━━━━━━━━
🔑 ${bill.key}
🆔 ${bill.threadID}
👤 ${bill.userID}
📆 ${bill.start} → ${bill.end}
📌 ${bill.status}
━━━━━━━━━━━━━━`
    );
  }

  // ===== ADMIN BILL LIST =====
  if (isAdmin && sub === "billlist") {
    if (!billData.length) return send("❎ Chưa có bill");

    let msg = "━━━━━━━━━━━━━━\n📋 BILL LIST\n━━━━━━━━━━━━━━\n";
    billData.forEach((b, i) => {
      msg += `${i + 1}. ${b.key} | ${b.status}\n`;
    });
    return send(msg);
  }
};

// ================= CRON 00:00 =================
cron.schedule(
  "0 0 * * *",
  async () => {
    const api = global.client.api;
    const botID = api.getCurrentUserID();

    for (const r of rentData) {
      const left = daysLeft(r.end);
      const nick =
        left > 0
          ? `『 ! 』 ⪼ ${BOT_NAME} | HSD: ${left} ngày`
          : `『 ! 』 ⪼ ${BOT_NAME} | HẾT HẠN`;

      try {
        await api.changeNickname(nick, r.threadID, botID);
      } catch {}
    }
    console.log("✅ Rent cron OK");
  },
  { timezone: TZ }
);
