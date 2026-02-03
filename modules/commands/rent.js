const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");

const TIMEZONE = "Asia/Ho_Chi_Minh";
const DATA_PATH = path.join(__dirname, "cache/data/thuebot.json");

const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

let rentData = [];
if (fs.existsSync(DATA_PATH)) {
  try {
    rentData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    rentData = [];
  }
}

const saveData = () =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(rentData, null, 2), "utf8");

const formatDate = (d) => d.split("/").reverse().join("/");
const isExpired = (d) => new Date(formatDate(d)) < Date.now();

/* ================= CONFIG GÓI ================= */
const PACKAGES = {
  chao: "🌱 GÓI CHÀO",
  thuong: "⚙️ GÓI THƯỜNG",
  vip: "👑 GÓI VIP"
};

/* ================= CONFIG ================= */
module.exports.config = {
  name: "rent",
  version: "2.0.0",
  hasPermission: 3,
  credits: "Lương Trường Khôi + ChatGPT",
  description: "Thuê bot tự động",
  commandCategory: "Admin",
  usePrefix: false,
  usages: "rent add | info | list",
  cooldowns: 1
};

/* ================= RUN ================= */
module.exports.run = async ({ api, event, args }) => {
  const send = (msg) =>
    api.sendMessage(msg, event.threadID, event.messageID);

  if (!global.config.ADMINBOT.includes(event.senderID))
    return send("⚠️ Chỉ admin chính mới dùng được!");

  const sub = args[0];

  /* ===== ADD ===== */
  if (sub === "add") {
    const timeInput = args[1];
    const pack = (args[2] || "").toLowerCase();

    if (!timeInput || !PACKAGES[pack])
      return send("❎ Sai cú pháp!\nVí dụ: rent add 40 thuong | rent add 6T vip");

    if (rentData.find((i) => i.t_id == event.threadID))
      return send("⚠️ Nhóm này đã thuê bot!");

    let days = 0;
    if (timeInput.endsWith("T")) {
      days = parseInt(timeInput) * 30;
    } else {
      days = parseInt(timeInput);
    }

    if (isNaN(days) || days <= 0)
      return send("❎ Thời gian không hợp lệ!");

    const start = moment.tz(TIMEZONE);
    const end = start.clone().add(days, "days");

    rentData.push({
      t_id: event.threadID,
      id: event.senderID,
      pack,
      time_start: start.format("DD/MM/YYYY"),
      time_end: end.format("DD/MM/YYYY")
    });

    saveData();

    await api.changeNickname(
      `『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME} | ${PACKAGES[pack]} | HSD: ${end.format(
        "DD/MM/YYYY"
      )}`,
      event.threadID,
      api.getCurrentUserID()
    );

    return send(`✅ Đã thêm **${PACKAGES[pack]}** (${days} ngày)`);
  }

  /* ===== INFO ===== */
  if (sub === "info") {
    const data = rentData.find((i) => i.t_id == event.threadID);
    if (!data) return send("❎ Nhóm chưa thuê bot!");

    const daysLeft = Math.ceil(
      (new Date(formatDate(data.time_end)) - Date.now()) / 86400000
    );

    return send(
      `👤 Người thuê: ${data.id}\n📦 Gói: ${PACKAGES[data.pack]}\n🗓 Thuê: ${data.time_start}\n⌛ Hết hạn: ${data.time_end}\n⏳ Còn: ${daysLeft} ngày`
    );
  }

  /* ===== LIST ===== */
  if (sub === "list") {
    if (rentData.length === 0)
      return send("❎ Không có nhóm thuê bot!");

    let msg = "📋 DANH SÁCH THUÊ BOT\n\n";
    rentData.forEach((e, i) => {
      msg += `${i + 1}. ${e.t_id}\n📦 ${PACKAGES[e.pack]}\n⏳ ${e.time_end}\n\n`;
    });

    return send(msg);
  }

  send("📌 Dùng: rent add | rent info | rent list");
};

/* ================= AUTO UPDATE BIỆT DANH ================= */
cron.schedule("0 0 * * *", async () => {
  for (const g of rentData) {
    if (isExpired(g.time_end)) continue;

    const daysLeft = Math.ceil(
      (new Date(formatDate(g.time_end)) - Date.now()) / 86400000
    );

    try {
      await global.client.api.changeNickname(
        `『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME} | ${PACKAGES[g.pack]} | còn ${daysLeft} ngày`,
        g.t_id,
        global.client.api.getCurrentUserID()
      );
    } catch {}
  }
});

/* ================= 15H NHẮC GIA HẠN ================= */
cron.schedule("0 15 * * *", async () => {
  for (const g of rentData) {
    if (!isExpired(g.time_end)) continue;

    try {
      await global.client.api.sendMessage(
        `⚠️ BOT ĐÃ HẾT HẠN ⚠️

✨🤖 MENU GIA HẠN BOT 🤖✨
━━━━━━━━━━━━━━━━━━
🌱 GÓI CHÀO
1 tháng: FREE
6 tháng: 30.000đ
12 tháng: 60.000đ

⚙️ GÓI THƯỜNG
1 tháng: 10.000đ
6 tháng: 50.000đ
12 tháng: 70.000đ

👑 GÓI VIP
1 tháng: 30.000đ
6 tháng: 140.000đ
12 tháng: 250.000đ
━━━━━━━━━━━━━━━━━━
📞 Admin: ${ADMIN_FB}`,
        g.t_id
      );
    } catch {}
  }
});

/* ================= KHÓA LỆNH ================= */
global.checkRent = function (threadID, commandName, senderID) {
  const data = rentData.find((i) => i.t_id == threadID);
  if (!data) return false;
  if (!isExpired(data.time_end)) return false;

  if (global.config.ADMINBOT.includes(senderID)) return false;
  if (commandName === "rent") return false;

  return true;
};
