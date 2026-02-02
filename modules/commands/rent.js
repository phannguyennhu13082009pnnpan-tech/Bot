/**
 * RENT BOT SYSTEM – VIP VERSION
 * Author: Riyuso Tegk
 * Style: Mirai Custom
 */

const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");
const crypto = require("crypto");

const TZ = "Asia/Ho_Chi_Minh";
const BOT_NAME = "𝓘𝓷𝓼𝓪𝓰𝔂𝓸𝓴 𝓑𝓸𝓽";
const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "rent.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({
  rents: [],
  approve: []
}, null, 2));

const loadData = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const saveData = data => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

const genKey = () =>
  "RENT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

const daysBetween = end =>
  Math.ceil(
    (moment(end, "DD/MM/YYYY").endOf("day") -
      moment().tz(TZ)) / 86400000
  );

const addDays = (base, days) =>
  moment(base, "DD/MM/YYYY").add(days, "days").format("DD/MM/YYYY");

module.exports.config = {
  name: "rent",
  version: "5.0.0",
  hasPermssion: 3,
  credits: "TEGK",
  description: "Hệ thống thuê bot VIP",
  commandCategory: "ADMIN",
  usages: "rent add | info | list | remove | bill",
  cooldowns: 2
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
  if (event.userID != handleReaction.adminID) return;
  if (event.reaction != "❤") return;

  const data = loadData();
  data.approve.push(handleReaction.threadID);
  saveData(data);

  api.sendMessage(
    "✅ Nhóm đã được ADMIN duyệt.\n❌ Tuy nhiên CHƯA THUÊ BOT.\n👉 Dùng !rent add để thuê.",
    handleReaction.threadID
  );
};

module.exports.run = async ({ api, event, args }) => {
  const send = msg => api.sendMessage(msg, event.threadID);
  const data = loadData();
  const isAdminBot = global.config.ADMINBOT.includes(event.senderID);
  const sub = args[0];

  // ===== CHECK APPROVE =====
  if (!isAdminBot && !data.approve.includes(event.threadID))
    return send(
      "⛔ Nhóm chưa được duyệt.\n📌 Bot đã báo admin, vui lòng chờ duyệt."
    );

  // ===== RENT ADD =====
  if (sub === "add") {
    if (!isAdminBot)
      return send("❌ Chỉ admin bot được thuê");

    const value = args[1];
    if (!value) return send("❎ !rent add <1T | số ngày>");

    let addDaysCount = 0;

    if (/^\d+T$/i.test(value)) {
      const month = parseInt(value);
      addDaysCount = month * 30;
    } else if (/^\d+$/.test(value)) {
      addDaysCount = parseInt(value);
    } else {
      return send("❎ Sai định dạng. Ví dụ: !rent add 1T hoặc !rent add 40");
    }

    let item = data.rents.find(r => r.threadID == event.threadID);
    const today = moment().tz(TZ).format("DD/MM/YYYY");

    if (!item) {
      item = {
        threadID: event.threadID,
        start: today,
        end: addDays(today, addDaysCount),
        bill: []
      };
      data.rents.push(item);
    } else {
      const base = daysBetween(item.end) > 0 ? item.end : today;
      item.end = addDays(base, addDaysCount);
    }

    const key = genKey();
    item.bill.push({
      key,
      days: addDaysCount,
      time: moment().tz(TZ).format("HH:mm DD/MM/YYYY")
    });

    saveData(data);

    return send(
`╔═══════════════╗
      🧾 BILL THUÊ BOT
╚═══════════════╝
➕ Gia hạn: ${addDaysCount} ngày
🗓️ HSD mới: ${item.end}
🔑 Key: ${key}
👤 Admin: ${event.senderID}
════════════════
`
    );
  }

  // ===== RENT INFO =====
  if (sub === "info") {
    const item = data.rents.find(r => r.threadID == event.threadID);
    if (!item) return send("❌ Nhóm chưa thuê bot");

    const left = daysBetween(item.end);
    return send(
`📌 THÔNG TIN THUÊ BOT
🗓️ Bắt đầu: ${item.start}
⏰ Hết hạn: ${item.end}
⌛ Còn lại: ${left > 0 ? left + " ngày" : "HẾT HẠN"}
`
    );
  }

  // ===== RENT LIST =====
  if (sub === "list") {
    if (!isAdminBot) return;
    if (!data.rents.length) return send("❌ Không có nhóm thuê bot");

    let msg = "📋 DANH SÁCH THUÊ BOT\n\n";
    data.rents.forEach((r, i) => {
      msg += `${i + 1}. ${r.threadID} | HSD: ${r.end}\n`;
    });
    return send(msg);
  }

  // ===== RENT REMOVE =====
  if (sub === "remove") {
    if (!isAdminBot) return;
    const stt = parseInt(args[1]);
    if (!stt || !data.rents[stt - 1]) return send("❎ STT sai");

    data.rents.splice(stt - 1, 1);
    saveData(data);
    return send("✅ Đã xoá thuê bot");
  }

  // ===== BILL LIST =====
  if (sub === "bill") {
    const item = data.rents.find(r => r.threadID == event.threadID);
    if (!item) return send("❌ Chưa có bill");

    let msg = "🧾 LỊCH SỬ BILL\n\n";
    item.bill.forEach((b, i) => {
      msg += `${i + 1}. ${b.days} ngày | ${b.time}\n🔑 ${b.key}\n\n`;
    });
    return send(msg);
  }

  return send(
`📖 HƯỚNG DẪN RENT
!rent add 1T
!rent add 40
!rent info
!rent bill
`
  );
};

/**
 * ===== CRON SET NAME 00:00 =====
 */
cron.schedule(
  "0 0 * * *",
  async () => {
    const api = global.client.api;
    const botID = api.getCurrentUserID();
    const data = loadData();

    for (const r of data.rents) {
      const left = daysBetween(r.end);
      if (left <= 0) continue;

      const nick = `『 ! 』 ⪼ ${BOT_NAME} | HSD: ${left} ngày`;
      try {
        await api.changeNickname(nick, r.threadID, botID);
      } catch {}
    }

    console.log("[RENT] Set name 00:00 xong");
  },
  { timezone: TZ }
);
