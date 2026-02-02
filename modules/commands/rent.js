const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");

const TZ = "Asia/Ho_Chi_Minh";
const BOT_NAME = "𝓘𝓷𝓼𝓪𝓰𝔂𝓸𝓴 𝓑𝓸𝓽";
const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

const DATA_PATH = path.join(__dirname, "data", "rent.json");
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]");

let data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const save = () =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

/* ================= UTIL ================= */

const daysLeft = end =>
  Math.ceil(
    (moment(end, "DD/MM/YYYY").endOf("day") -
      moment().tz(TZ)) / 86400000
  );

const makeKey = threadID =>
  "INS-" +
  threadID.toString().slice(-4) +
  "-" +
  Math.random().toString(36).substring(2, 8).toUpperCase();

const billThue = (month, end, key) => `
━━━━━━━━━━━━━━━━━━━━━━
        🧾 BILL THUÊ BOT
━━━━━━━━━━━━━━━━━━━━━━

🤖 Bot: ${BOT_NAME}
📦 Gói thuê: ${month} tháng
🧾 Key: ${key}
⏰ Hết hạn: ${end}

✅ Bot đã kích hoạt thành công
📌 Hỗ trợ / gia hạn:
${ADMIN_FB}

━━━━━━━━━━━━━━━━━━━━━━
`;

const billHetHan = key => `
━━━━━━━━━━━━━━━━━━━━━━
        ⚠️ BOT HẾT HẠN
━━━━━━━━━━━━━━━━━━━━━━

❌ Gói thuê đã hết hạn
🧾 Key: ${key}

📌 Để gia hạn bot, vui lòng
liên hệ Admin tại:
${ADMIN_FB}

━━━━━━━━━━━━━━━━━━━━━━
`;

/* ================= CONFIG ================= */

module.exports.config = {
  name: "rent",
  version: "FULL-4.0",
  hasPermssion: 0,
  credits: "full-by-chatgpt",
  description: "Thuê bot - Gia hạn - Bill - Setname",
  commandCategory: "Admin",
  usePrefix: false,
  usages: "!rent add | info | list | remove | giahan",
  cooldowns: 2
};

/* ================= RUN ================= */

module.exports.run = async ({ api, event, args }) => {
  const send = msg => api.sendMessage(msg, event.threadID);

  const group = data.find(i => i.threadID == event.threadID);

  // ❌ CHƯA DUYỆT → IM LẶNG
  if (!group || group.approved !== true) return;

  const isAdmin = global.config.ADMINBOT.includes(event.senderID);
  const sub = args[0];

  // code rent phía dưới giữ nguyên

  /* ===== THÀNH VIÊN CHECK INFO ===== */
  if (sub === "info") {
    const item = data.find(i => i.threadID == event.threadID);
    if (!item) return send("❌ Nhóm chưa thuê bot");

    const left = daysLeft(item.end);
    if (left <= 0) return send(billHetHan(item.key));

    return send(`
━━━━━━━━━━━━━━━━━━━━━━
        📌 THUÊ BOT
━━━━━━━━━━━━━━━━━━━━━━

🤖 Bot: ${BOT_NAME}
🧾 Key: ${item.key}
📅 Từ: ${item.start}
⏰ Đến: ${item.end}
⌛ Còn: ${left} ngày

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  /* ===== THÀNH VIÊN XIN GIA HẠN ===== */
  if (sub === "giahan") {
    const item = data.find(i => i.threadID == event.threadID);
    if (!item) return send("❌ Nhóm chưa thuê bot");

    return send(billHetHan(item.key));
  }

  /* ===== ADMIN ===== */
  if (!isAdmin) return;

  /* !rent add 1T */
  if (sub === "add") {
    const pack = args[1];
    if (!pack || !pack.endsWith("T"))
      return send("❎ Ví dụ: !rent add 1T");

    const month = parseInt(pack);
    const old = data.find(i => i.threadID == event.threadID);

    const start = moment().tz(TZ);
    const end = start.clone().add(month, "months").format("DD/MM/YYYY");

    if (old) {
      old.end = moment(old.end, "DD/MM/YYYY")
        .add(month, "months")
        .format("DD/MM/YYYY");
      save();
      return send(billThue(month, old.end, old.key));
    }

    const key = makeKey(event.threadID);
    data.push({
      threadID: event.threadID,
      userID: event.senderID,
      start: start.format("DD/MM/YYYY"),
      end,
      key
    });
    save();
    return send(billThue(month, end, key));
  }

  /* !rent list */
  if (sub === "list") {
    if (!data.length) return send("❌ Không có nhóm thuê bot");
    let msg = "📋 DANH SÁCH THUÊ BOT\n\n";
    data.forEach((i, idx) => {
      const d = daysLeft(i.end);
      msg += `${idx + 1}. ${i.threadID} | ${
        d > 0 ? d + " ngày" : "Hết hạn"
      }\n`;
    });
    return send(msg);
  }

  /* !rent remove <stt> */
  if (sub === "remove") {
    const stt = parseInt(args[1]);
    if (!stt || !data[stt - 1]) return send("❌ STT không hợp lệ");
    data.splice(stt - 1, 1);
    save();
    return send("✅ Đã xóa nhóm thuê bot");
  }
};

/* ================= CRON 00:00 ================= */

cron.schedule(
  "0 0 * * *",
  async () => {
    const api = global.client.api;
    const botID = api.getCurrentUserID();

    for (const item of data) {
      const left = daysLeft(item.end);
      if (left <= 0) continue;

      const nick = `『 ! 』 ⪼ ${BOT_NAME} | HSD: ${left} ngày`;
      try {
        await api.changeNickname(nick, item.threadID, botID);
      } catch {}
    }

    save();
    console.log("✅ RENT CRON 00:00 OK");
  },
  { timezone: TZ }
);
