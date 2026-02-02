// ========================
// GAME MODULE (NO CACHE)
// ========================

if (!global.gameData) {
  global.gameData = {
    rank: {},     // uid: { xp, win, lose }
    cauca: {},    // uid: lastTime
    solo: {}      // threadID: match
  };
}

module.exports.config = {
  name: "game",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "full by chatgpt",
  description: "Câu cá + Solo PVP + Rank (no cache)",
  commandCategory: "Game",
  usages: "cauca | solo | rank | top",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, mentions } = event;
  const send = msg => api.sendMessage(msg, threadID);
  const Currencies = global.client.Currencies;
  const data = global.gameData;

  // ========================
  // UTIL
  // ========================
  function initUser(uid) {
    if (!data.rank[uid])
      data.rank[uid] = { xp: 0, win: 0, lose: 0 };
  }

  function addXP(uid, xp) {
    initUser(uid);
    data.rank[uid].xp = Math.max(0, data.rank[uid].xp + xp);
  }

  function getRank(xp) {
    if (xp >= 1000) return "👑 Chí Tôn";
    if (xp >= 500) return "💎 Huyền Thoại";
    if (xp >= 200) return "🥇 Cao Thủ";
    if (xp >= 50) return "🥈 Tu Sĩ";
    return "🥉 Phàm Nhân";
  }

  const cmd = args[0];

  // ========================
  // 🎣 CÂU CÁ TU TIÊN
  // ========================
  if (cmd === "cauca") {
    const now = Date.now();
    const CD = 60 * 1000;

    if (data.cauca[senderID] && now - data.cauca[senderID] < CD) {
      const s = Math.ceil((CD - (now - data.cauca[senderID])) / 1000);
      return send(`⏳ Đợi ${s}s nữa mới câu tiếp`);
    }

    data.cauca[senderID] = now;
    initUser(senderID);

    const roll = Math.random();
    let msg = "🎣 CÂU CÁ TU TIÊN\n━━━━━━━━━━━━\n";

    if (roll < 0.5) {
      const money = Math.floor(Math.random() * 200) + 100;
      await Currencies.increaseMoney(senderID, money);
      addXP(senderID, 10);
      msg += `🐟 Cá thường\n💰 +${money}$\n⭐ +10 XP`;
    } else if (roll < 0.8) {
      const money = Math.floor(Math.random() * 400) + 300;
      await Currencies.increaseMoney(senderID, money);
      addXP(senderID, 25);
      msg += `🐠 Linh cá hiếm\n💰 +${money}$\n⭐ +25 XP`;
    } else {
      addXP(senderID, -5);
      msg += `🪣 Câu trúng rác\n❌ -5 XP`;
    }

    msg += `\n🏅 Rank: ${getRank(data.rank[senderID].xp)}`;
    return send(msg);
  }

  // ========================
  // ⚔️ SOLO PVP
  // ========================
  if (cmd === "solo") {
    const sub = args[1];

    // ACCEPT
    if (sub === "accept") {
      const game = data.solo[threadID];
      if (!game) return send("❌ Không có kèo solo");
      if (senderID !== game.p2)
        return send("❌ Không phải kèo của bạn");

      initUser(game.p1);
      initUser(game.p2);

      const win = Math.random() < 0.5 ? game.p1 : game.p2;
      const lose = win === game.p1 ? game.p2 : game.p1;

      await Currencies.decreaseMoney(lose, game.bet);
      await Currencies.increaseMoney(win, game.bet);

      addXP(win, 30);
      addXP(lose, -15);

      data.rank[win].win++;
      data.rank[lose].lose++;

      delete data.solo[threadID];

      return send(
`⚔️ SOLO KẾT THÚC
━━━━━━━━━━━━
🏆 Thắng: ${win}
💰 +${game.bet}$
⭐ +30 XP

💀 Thua: ${lose}
⭐ -15 XP

🏅 Rank thắng: ${getRank(data.rank[win].xp)}`
      );
    }

    // CREATE
    const target = Object.keys(mentions)[0];
    const bet = parseInt(args[2]);

    if (!target || !bet || bet <= 0)
      return send("📌 Dùng: game solo @tag <tiền>");

    const money = (await Currencies.getData(senderID)).money;
    if (money < bet) return send("❌ Không đủ tiền");

    data.solo[threadID] = {
      p1: senderID,
      p2: target,
      bet
    };

    return send(
`⚔️ THÁCH ĐẤU SOLO
━━━━━━━━━━━━
👤 Người thách: ${senderID}
🎯 Đối thủ: ${target}
💰 Cược: ${bet}$

👉 Người được tag gõ: game solo accept`
    );
  }

  // ========================
  // 🏅 RANK CÁ NHÂN
  // ========================
  if (cmd === "rank") {
    initUser(senderID);
    const r = data.rank[senderID];

    return send(
`🏅 RANK CÁ NHÂN
━━━━━━━━━━━━
🎖 Rank: ${getRank(r.xp)}
⭐ XP: ${r.xp}
✅ Thắng: ${r.win}
❌ Thua: ${r.lose}`
    );
  }

  // ========================
  // 🏆 TOP RANK
  // ========================
  if (cmd === "top") {
    const list = Object.entries(data.rank)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    if (!list.length) return send("❌ Chưa có dữ liệu");

    let msg = "🏆 TOP GAME\n━━━━━━━━━━━━\n";
    list.forEach(([uid, r], i) => {
      msg += `${i + 1}. ${uid}\n⭐ ${getRank(r.xp)} | XP: ${r.xp}\n`;
    });

    return send(msg);
  }

  // ========================
  // HELP
  // ========================
  send(
`🎮 GAME COMMAND
━━━━━━━━━━━━
game cauca
game solo @tag <tiền>
game solo accept
game rank
game top`
  );
};
