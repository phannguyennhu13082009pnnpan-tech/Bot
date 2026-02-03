const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const cron = require("node-cron");

const TZ = "Asia/Ho_Chi_Minh";
const BOT_NAME = "𝓘𝓷𝓼𝓪𝓰𝔂𝓸𝓴 𝓑𝓸𝓽";
const ADMIN_FB = "https://www.facebook.com/share/1AqqydaH5m/";

/* =======================
  DATA – DÙNG CHUNG thuebot.json
======================= */
const DATA_PATH = path.join(
  __dirname,
  "data",
  "thuebot.json"
);

if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, "[]", "utf8");
}

const loadData = () =>
  JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

const saveData = data =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");

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
  if (/^\d+$/.test(input)) return parseInt(input);      // 40
  if (/^\d+T$/i.test(input)) return parseInt(input) * 30; // 1T
  return null;
};

const genKey = () =>
  "RB-" + Math.random().toString(36).slice(2, 10).toUpperCase();

/* =======================
  CONFIG
======================= */
module.exports.config = {
  name: "rent",
  version: "5.0.0",
  hasPermssion: 3,
  credits: "rent-thuebot-json",
  description: "Thuê bot – dùng chung data thuebot.json",
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

  let rents = loadData();
  const sub = args[0];

  /* ===== rent add ===== */
  if (sub === "add") {
    const days = parseTime(args[1]);
    if (!days || days <= 0)
      return send("❎ Dùng: rent add <40 | 1T | 2T>");

    const threadID = event.threadID;
    const now = moment().tz(TZ);

    let item = rents.find(r => r.id == threadID);

    if (!item) {
      const end = now.clone().add(days, "days");
      item = {
        t_id: String(Date.now()),
        id: threadID,
        time_start: now.format("DD/MM/YYYY"),
        time_end: end.format("DD/MM/YYYY"),
        key: genKey(),
        history: []
      };
      rents.push(item);
    } else {
      const curEnd = moment(item.time_end, "DD/MM/YYYY");
      const end = curEnd.isAfter(now)
        ? curEnd.add(days, "days")
        : now.clone().add(days, "days");
      item.time_end = end.format("DD/MM/YYYY");
    }

    item.history = item.history || [];
    item.history.push({
      type: "ADD",
      days,
      time: now.format("HH:mm DD/MM/YYYY")
    });

    saveData(rents);

    return send(
`✅ THUÊ BOT THÀNH CÔNG
━━━━━━━━━━━━━━
🤖 Bot: ${BOT_NAME}
⏳ +${days} ngày
🗓️ Hết hạn: ${item.time_end}
🔑 Key bill: ${item.key}
━━━━━━━━━━━━━━`
    );
  }

  /* ===== rent list ===== */
  if (sub === "list") {
    if (!rents.length) return send("❎ Chưa có nhóm thuê bot");

    let msg = "[ DANH SÁCH THUÊ BOT ]\n\n";
    rents.forEach((r, i) => {
      const d = daysLeft(r.time_end);
      msg += `${i + 1}. ${r.id} | ${
        d > 0 ? "Còn " + d + " ngày" : "Hết hạn"
      }\n`;
    });
    return send(msg);
  }

  /* ===== rent bill ===== */
  if (sub === "bill") {
    const item = rents.find(r => r.id == event.threadID);
    if (!item) return send("❎ Nhóm này chưa thuê bot");

    let msg =
`🧾 BILL THUÊ BOT
━━━━━━━━━━━━━━
🤖 Bot: ${BOT_NAME}
🗓️ Từ: ${item.time_start}
⏰ Đến: ${item.time_end}
⌛ Còn: ${Math.max(daysLeft(item.time_end), 0)} ngày
🔑 Key: ${item.key}

📜 LỊCH SỬ:
`;

    (item.history || []).forEach((h, i) => {
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
    saveData(rents);
    return send("✅ Đã xóa thuê bot");
  }

  /* ===== rent giahan ===== */
  if (sub === "giahan") {
    const days = parseTime(args[1]);
    if (!days) return send("❎ Dùng: rent giahan <ngày | 1T>");

    const item = rents.find(r => r.id == event.threadID);
    if (!item) return send("❎ Nhóm chưa thuê bot");

    const now = moment().tz(TZ);
    let end = moment(item.time_end, "DD/MM/YYYY");
    end = end.isAfter(now) ? end.add(days, "days") : now.add(days, "days");

    item.time_end = end.format("DD/MM/YYYY");
    item.history = item.history || [];
    item.history.push({
      type: "GIAHAN",
      days,
      time: now.format("HH:mm DD/MM/YYYY")
    });

    saveData(rents);
    return send(`✅ Gia hạn thành công +${days} ngày`);
  }

  return send(
`📖 HƯỚNG DẪN
rent add <40 | 1T>
rent list
rent bill
rent giahan <ngày | 1T>
rent remove <stt>`
  );
};

/* =======================
  CRON 00:00 – AUTO NHẮN
======================= */
cron.schedule(
  "0 0 * * *",
  async () => {
    const api = global.client.api;
    let rents = loadData();

    for (const r of rents) {
      try {
        const remain = daysLeft(r.time_end);

        if (remain > 0) {
          await api.sendMessage(
`⏰ THÔNG BÁO THUÊ BOT
━━━━━━━━━━━━━━
🤖 Bot: ${BOT_NAME}
📅 Còn lại: ${remain} ngày
━━━━━━━━━━━━━━`,
            r.id
          );
        } else {
          await api.sendMessage(
`❌ BOT ĐÃ HẾT HẠN
━━━━━━━━━━━━━━
⛔ Bot đã hết hạn sử dụng
📌 Gia hạn tại admin:
${ADMIN_FB}
━━━━━━━━━━━━━━`,
            r.id
          );
        }
      } catch {}
    }

    console.log("✔ Rent cron 00:00 OK (dùng thuebot.json)");
  },
  { timezone: TZ }
);
