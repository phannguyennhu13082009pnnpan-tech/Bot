module.exports.config = {
  name: "money",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Upgrade by ChatGPT",
  description: "Hồ sơ tài chính sang trọng",
  commandCategory: "Kinh Tế",
  usages: "money | money all | money @tag",
  cooldowns: 3,
  usePrefix: false
};

module.exports.run = async ({ api, event, Currencies, Users }) => {
  const { threadID, senderID, mentions, messageReply, body } = event;

  const getMoney = async (uid) => {
    const data = await Currencies.getData(uid);
    return data?.money || 0;
  };

  const format = (n) => n.toLocaleString("vi-VN");

  // ===== MONEY ALL (BXH) =====
  if (body.toLowerCase().includes("all")) {
    const info = await api.getThreadInfo(threadID);
    let list = [];

    for (const uid of info.participantIDs) {
      const name = await Users.getNameUser(uid);
      const money = await getMoney(uid);
      list.push({ name, money });
    }

    list.sort((a, b) => b.money - a.money);

    let msg = "🏆 BẢNG XẾP HẠNG TÀI SẢN 🏆\n━━━━━━━━━━━━━━━━━━\n";
    list.slice(0, 10).forEach((u, i) => {
      const medal = ["🥇", "🥈", "🥉"][i] || "🔹";
      msg += `${medal} ${u.name} ┃ ${format(u.money)} ₫\n`;
    });

    msg += "━━━━━━━━━━━━━━━━━━\n💡 Tiền phản ánh đẳng cấp.";
    return api.sendMessage(msg, threadID);
  }

  // ===== TARGET =====
  let targetID = senderID;
  if (messageReply) targetID = messageReply.senderID;
  if (Object.keys(mentions).length > 0)
    targetID = Object.keys(mentions)[0];

  const name = await Users.getNameUser(targetID);
  const money = await getMoney(targetID);

  // ===== VIP CHECK (ví dụ) =====
  const vip = money >= 100000000 ? "👑 VIP GOLD" : "🔰 THƯỜNG";
  const bonus = vip.includes("VIP") ? "x2 tiền • x2 EXP" : "Không";

  const msg =
`╔═══════════════════════════════╗
║        💳 HỒ SƠ TÀI CHÍNH CÁ NHÂN     ║
╠═════════════════════════════════╣
║ 👤 Chủ tài khoản : ${name}
║ ────────────────────────────────────
║ 💰 Số dư khả dụng : ${format(money)} ₫
║ 🏦 Tài sản lưu trữ: ${format(Math.floor(money * 0.3))} ₫
║ 📈 Tổng tài sản  : ${format(Math.floor(money * 1.3))} ₫
║ ────────────────────────────────────
║ 🏷️ Cấp tài khoản : ${vip}
║ ⚡ Quyền lợi     : ${bonus}
║ ────────────────────────────────────
║ ⏰ Cập nhật      : ${new Date().toLocaleTimeString("vi-VN")}
╚═════════════════════════════════╝`;

  return api.sendMessage(msg, threadID);
};
