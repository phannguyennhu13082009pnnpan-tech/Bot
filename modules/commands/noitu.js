const fs = require("fs");
const path = require("path");

const TIME_LIMIT = 30 * 1000; // 30 giây
const words = [
  "tu tiên","tiên giới","giới hạn","hạn chế","chế tạo",
  "tạo hóa","hóa thần","thần thông","thông linh",
  "linh khí","khí công","công pháp","pháp bảo"
];

const RANK_PATH = path.join(__dirname, "cache", "noitu_rank.json");
if (!fs.existsSync(RANK_PATH)) fs.writeFileSync(RANK_PATH, "{}");
let rankData = JSON.parse(fs.readFileSync(RANK_PATH));
const saveRank = () =>
  fs.writeFileSync(RANK_PATH, JSON.stringify(rankData, null, 2));

const games = {};

function getRank(xp) {
  if (xp >= 1500) return "👑 Chí Tôn";
  if (xp >= 700) return "💎 Huyền Thoại";
  if (xp >= 300) return "🥇 Đại Cao Thủ";
  if (xp >= 100) return "🥈 Cao Thủ";
  return "🥉 Tân Thủ";
}

function addXP(uid, xp) {
  if (!rankData[uid]) rankData[uid] = { xp: 0, win: 0, lose: 0 };
  rankData[uid].xp = Math.max(0, rankData[uid].xp + xp);
  saveRank();
}

module.exports.config = {
  name: "noitu",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "insagyok",
  description: "Nối từ cược tiền + rank",
  commandCategory: "Game",
  usePrefix: false,
  usages: "create | join | word | leave | rank | top",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args, Currencies }) {
  const { threadID, senderID } = event;
  const send = msg => api.sendMessage(msg, threadID);
  const sub = args[0];

  /* ================= CREATE ================= */
  if (sub === "create") {
    if (games[threadID]) return send("⚠️ Nhóm đang có bàn nối từ");

    const bet = parseInt(args[1]);
    if (!bet || bet <= 0) return send("❎ Nhập tiền cược hợp lệ");

    const money = await Currencies.getData(senderID);
    if (money.money < bet) return send("❎ Không đủ tiền");

    await Currencies.decreaseMoney(senderID, bet);

    const startWord = words[Math.floor(Math.random() * words.length)];

    games[threadID] = {
      bet,
      players: [senderID],
      turn: 0,
      lastWord: startWord,
      used: [startWord],
      lastTime: Date.now()
    };

    return send(
`🎮 NỐI TỪ – CƯỢC ${bet}$
🧩 Từ gốc: "${startWord}"
⏳ Chờ người chơi khác
👉 !noitu join`
    );
  }

  /* ================= JOIN ================= */
  if (sub === "join") {
    const game = games[threadID];
    if (!game) return send("❎ Chưa có bàn");
    if (game.players.length >= 2) return send("⚠️ Đã đủ người");

    const money = await Currencies.getData(senderID);
    if (money.money < game.bet) return send("❎ Không đủ tiền");

    await Currencies.decreaseMoney(senderID, game.bet);
    game.players.push(senderID);
    game.lastTime = Date.now();

    return send(
`✅ Đã đủ người
🔗 Từ gốc: "${game.lastWord}"
👉 Lượt đầu: ${game.players[0]}
✍️ !noitu word <từ>`
    );
  }

  /* ================= WORD ================= */
  if (sub === "word") {
    const game = games[threadID];
    if (!game) return send("❎ Không có bàn");

    if (game.players[game.turn] !== senderID)
      return send("⛔ Chưa tới lượt bạn");

    const word = args.slice(1).join(" ").toLowerCase();
    if (!word) return send("❎ Nhập từ");

    const last = game.lastWord.split(" ").pop();
    if (!word.startsWith(last))
      return lose(threadID, senderID, "Sai luật nối từ");

    if (game.used.includes(word))
      return lose(threadID, senderID, "Từ đã dùng");

    game.used.push(word);
    game.lastWord = word;
    game.turn = (game.turn + 1) % 2;
    game.lastTime = Date.now();

    return send(
`✅ Hợp lệ
🔗 Từ mới: "${word}"
👉 Tới lượt: ${game.players[game.turn]}
⏳ 30s`
    );
  }

  /* ================= LEAVE ================= */
  if (sub === "leave") {
    const game = games[threadID];
    if (!game || !game.players.includes(senderID))
      return send("❎ Không trong bàn");

    const winner = game.players.find(id => id !== senderID);
    await Currencies.increaseMoney(winner, game.bet * 2);
    addXP(winner, 15);
    addXP(senderID, -10);

    rankData[winner].win++;
    rankData[senderID].lose++;
    saveRank();

    delete games[threadID];
    return send(`🏆 ${winner} thắng do đối thủ bỏ cuộc`);
  }

  /* ================= RANK ================= */
  if (sub === "rank") {
    const r = rankData[senderID];
    if (!r) return send("❎ Chưa có rank");

    return send(
`🏅 RANK NỐI TỪ
━━━━━━━━━━━━
⭐ Rank: ${getRank(r.xp)}
📈 XP: ${r.xp}
✅ Thắng: ${r.win}
❌ Thua: ${r.lose}`
    );
  }

  /* ================= TOP ================= */
  if (sub === "top") {
    const top = Object.entries(rankData)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    if (!top.length) return send("❎ Chưa có dữ liệu");

    let msg = "🏆 TOP NỐI TỪ\n━━━━━━━━━━━━\n";
    top.forEach(([uid, r], i) => {
      msg += `${i + 1}. ${uid}\n⭐ ${getRank(r.xp)} | XP: ${r.xp}\n`;
    });
    return send(msg);
  }

  send(
`📖 HƯỚNG DẪN
!noitu create <tiền>
!noitu join
!noitu word <từ>
!noitu leave
!noitu rank
!noitu top`
  );
};

/* ================= LOSE ================= */
async function lose(threadID, loser, reason) {
  const game = games[threadID];
  const api = global.client.api;
  const Currencies = global.client.Currencies;

  const winner = game.players.find(id => id !== loser);
  await Currencies.increaseMoney(winner, game.bet * 2);

  addXP(winner, reason === "Hết thời gian" ? 15 : 20);
  addXP(loser, -10);

  rankData[winner].win++;
  rankData[loser] = rankData[loser] || { xp: 0, win: 0, lose: 0 };
  rankData[loser].lose++;
  saveRank();

  api.sendMessage(
`🏆 KẾT QUẢ
❌ Thua: ${loser}
📌 ${reason}

✅ Thắng: ${winner}
💰 +${game.bet * 2}$
⭐ ${getRank(rankData[winner].xp)}`,
    threadID
  );

  delete games[threadID];
}

/* ================= TIMEOUT ================= */
setInterval(async () => {
  const now = Date.now();
  for (const tid in games) {
    const g = games[tid];
    if (g.players.length < 2) continue;
    if (now - g.lastTime > TIME_LIMIT) {
      await lose(tid, g.players[g.turn], "Hết thời gian");
    }
  }
}, 5000);
