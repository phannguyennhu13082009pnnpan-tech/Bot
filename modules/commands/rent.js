const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");

const TZ = "Asia/Ho_Chi_Minh";
const BOT_NAME = "𝓘𝓷𝓼𝓪𝓰𝔂𝓸𝓴 𝓑𝓸𝓽";
const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

const DATA_PATH = path.join(__dirname, "rent_data.json");
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "[]", "utf8");

let rents = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const save = () =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(rents, null, 2), "utf8");

/* =======================
  TIỆN ÍCH
======================= */
const daysLeft = end => {
  return Math.ceil(
    (moment(end, "DD/MM/YYYY").endOf("day").valueOf() -
      moment().tz(TZ).valueOf()) / 86400000
  );
};

const parseTime = input => {
  if (!input) return null;
  if (/^\d+$/.test(input)) return parseInt(input);
  if (/^\d+T$/i.test(input)) return parseInt(input) * 30;
  return null;
};

const genKey = () =>
  "RB-" + Math.random().toString(36).slice(2, 10).toUpperCase();

/* =======================
  VIP + BIỆT DANH
======================= */
const getBotNickname = (item) => {
  const remain = Math.max(daysLeft(item.end), 0);
  const tag = item.vip ? "👑 VIP" : "🤖 THƯỜNG";
  return `『 ${tag} 』 ⪼ ${BOT_NAME} | HSD: ${remain} ngày`;
};

/* =======================
  CONFIG
======================= */
module.exports.config = {
  name: "rent",
  version: "4.2.0",
  hasPermssion: 3,
  credits: "rent-vip-bd",
  description: "Thuê bot + VIP + set BD + auto notify 00h",
  commandCategory: "Admin",
  usePrefix: false,
  usages: "add | list | bill | remove | giahan",
  cooldowns: 2
};

/* =======================
  MAIN
======================= */
module.exports.run = async ({ api, event, args }) => {
  const send = msg =>
    api.sendMessage(msg, event.threadID, event.messageID);

  if (!global.config.ADMINBOT.includes(event.senderID))
    return send("❌ Chỉ admin bot mới dùng được lệnh này");

  const sub = args[0];

  /* ===== rent add ===== */
  if (sub === "add") {
    const days = parseTime(args[1]);
    const isVip = args[2] && args[2].toLowerCase() === "vip";

    if (!days || days <= 0)
      return send("❎ Dùng: rent add <40 | 1T> [vip]");

    const threadID = event.threadID;
    let item = rents.find(r => r.threadID == threadID);

    const now = moment().tz(TZ);
    let end;

    if (!item) {
      end = now.clone().add(days, "days");
      item = {
        threadID,
        start: now.format("DD/MM/YYYY"),
        end: end.format("DD/MM/YYYY"),
        key: genKey(),
        vip: isVip || false,
        history: []
      };
      rents.push(item);
    } else {
      const curEnd = moment(item.end, "DD/MM/YYYY");
      end = curEnd.isAfter(now)
        ? curEnd.add(days, "days")
        : now.clone().add(days, "days");
      item.end = end.format("DD/MM/YYYY");
      if (isVip) item.vip = true;
    }

    item.history.push({
      type: "ADD",
      days,
      time: now.format("HH:mm DD/MM/YYYY")
    });

    save();

    // SET BIỆT DANH BOT
    try {
      const botID = api.getCurrentUserID();
      await api.changeNickname(
        getBotNickname(item),
        threadID,
        botID
      );
    } catch {}

    return send(
`✅ THUÊ BOT THÀNH CÔNG
━━━━━━━━━━━━━━
🤖 Bot: ${BOT_NAME}
⭐ Gói: ${item.vip ? "VIP 👑" : "THƯỜNG 🤖"}
⏳ +${days} ngày
🗓️ HSD: ${item.end}
🔑 Key bill: ${item.key}
━━━━━━━━━━━━━━`
    );
  }

  /* ===== rent list ===== */
  if (sub === "list") {
    if (!rents.length) return send("❎ Chưa có nhóm thuê bot");

    let msg = "[ DANH SÁCH THUÊ BOT ]\n\n";
    rents.forEach((r, i) => {
      const d = daysLeft(r.end);
      msg += `${i + 1}. ${r.threadID} | ${r.vip ? "VIP" : "THƯỜNG"} | ${
        d > 0 ? d + " ngày" : "Hết hạn"
      }\n`;
    });
    return send(msg);
  }

  /* ===== rent bill ===== */
  if (sub === "bill") {
    const item = rents.find(r => r.threadID == event.threadID);
    if (!item) return send("❎ Nhóm này chưa thuê bot");

    let msg =
`🧾 BILL THUÊ BOT
━━━━━━━━━━━━━━
🤖 Bot: ${BOT_NAME}
⭐ Gói: ${item.vip ? "VIP 👑" : "THƯỜNG 🤖"}
🗓️ Từ: ${item.start}
⏰ Đến: ${item.end}
⌛ Còn: ${Math.max(daysLeft(item.end), 0)} ngày
🔑 Key: ${item.key}

📜 LỊCH SỬ:
`;

    item.history.forEach((h, i) => {
      msg += `${i + 1}. ${h.type} +${h.days} ngày | ${h.time}\n`;
    });

    msg +=
`━━━━━━━━━━━━━━
📌 Gia hạn tại admin:
${ADMIN_FB}`;

    return send(msg);
  }

  /* ===== rent remove ===== */
  if (sub === "remove") {
    const idx = parseInt(args[1]) - 1;
    if (isNaN(idx) || !rents[idx])
      return send("❎ STT không hợp lệ");

    rents.splice(idx, 1);
    save();
    return send("✅ Đã xóa thuê bot");
  }

  /* ===== rent giahan ===== */
  if (sub === "giahan") {
    const days = parseTime(args[1]);
    if (!days) return send("❎ Dùng: rent giahan <40 | 1T>");

    const item = rents.find(r => r.threadID == event.threadID);
    if (!item) return send("❎ Nhóm chưa thuê bot");

    const now = moment().tz(TZ);
    let end = moment(item.end, "DD/MM/YYYY");
    end = end.isAfter(now) ? end.add(days, "days") : now.add(days, "days");

    item.end = end.format("DD/MM/YYYY");
    item.history.push({
      type: "GIAHAN",
      days,
      time: now.format("HH:mm DD/MM/YYYY")
    });

    save();

    try {
      const botID = api.getCurrentUserID();
      await api.changeNickname(
        getBotNickname(item),
        event.threadID,
        botID
      );
    } catch {}

    return send(`✅ Gia hạn thành công +${days} ngày`);
  }

  return send(
`📖 HƯỚNG DẪN
rent add <40 | 1T> [vip]
rent list
rent bill
rent giahan <ngày | 1T>
rent remove <stt>`
  );
};

/* =======================
  CRON 00:00 – AUTO NHẮN + UPDATE BD
======================= */
cron.schedule(
  "0 0 * * *",
  async () => {
    const api = global.client.api;

    for (const r of rents) {
      try {
        const remain = daysLeft(r.end);

        await api.sendMessage(
remain > 0
? `⏰ BOT ${r.vip ? "VIP 👑" : "THƯỜNG 🤖"}
━━━━━━━━━━━━━━
📅 Còn: ${remain} ngày
━━━━━━━━━━━━━━`
: `❌ BOT ĐÃ HẾT HẠN
━━━━━━━━━━━━━━
📌 Gia hạn tại admin:
${ADMIN_FB}
━━━━━━━━━━━━━━`,
          r.threadID
        );

        const botID = api.getCurrentUserID();
        await api.changeNickname(
          getBotNickname(r),
          r.threadID,
          botID
        );
      } catch {}
    }

    save();
    console.log("✔ Rent cron 00:00 OK");
  },
  { timezone: TZ }
);
