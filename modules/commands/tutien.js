module.exports.config = {
  name: "tutien",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Full by ChatGPT",
  description: "Game Tu Tiên full endgame",
  commandCategory: "Game",
  usages: "[menu|info|tuvi|train|boss|pvp|shop|buy|equip|reset]",
  cooldowns: 2
};

const fs = require("fs");
const path = __dirname + "/cache/tutien.json";

let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};

function save() {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// ===== SHOP =====
const SHOP = {
  thietkiem: { name: "Thiết Kiếm", atk: 10, price: 100, slot: "kiem" },
  thanhkiem: { name: "Thanh Kiếm", atk: 18, price: 180, slot: "kiem" },
  huyetkiem: { name: "Huyết Kiếm", atk: 30, crit: 5, price: 350, slot: "kiem" },
  truongtien: { name: "Tru Tiên Kiếm", atk: 80, crit: 20, lifesteal: 10, price: 2000, slot: "kiem" },

  vaigiap: { name: "Vải Giáp", def: 8, price: 80, slot: "giap" },
  satgiap: { name: "Sắt Giáp", def: 18, price: 200, slot: "giap" },
  thanlonggiap: { name: "Thần Long Giáp", def: 60, hp: 50, price: 1200, slot: "giap" },

  tutiendan: { name: "Tu Vi Đan", price: 200, type: "dan" },
  dotphadan: { name: "Đột Phá Đan", price: 500, type: "dan" }
};

// ===== BOSS =====
const BOSSES = [
  { name: "Hắc Lang", hp: 100, atk: 10, reward: 100 },
  { name: "Huyết Ma", hp: 300, atk: 25, reward: 300 },
  { name: "Ma Tôn", hp: 800, atk: 50, reward: 800 }
];

// ===== TU VI =====
const LEVELS = [
  "Phàm Nhân",
  "Luyện Khí",
  "Trúc Cơ",
  "Kim Đan",
  "Nguyên Anh",
  "Hóa Thần",
  "Độ Kiếp",
  "Đại Thừa"
];

// ===== INIT USER =====
function init(uid) {
  if (!data[uid]) {
    data[uid] = {
      level: 0,
      tuvi: 0,
      vang: 500,
      hp: 100,
      atk: 10,
      def: 5,
      equip: { kiem: null, giap: null },
      stats: { crit: 0, lifesteal: 0 },
      lastTrain: 0
    };
    save();
  }
}

module.exports.run = async ({ api, event, args }) => {
  const uid = event.senderID;
  init(uid);
  const u = data[uid];

  const send = msg => api.sendMessage(msg, event.threadID, event.messageID);
  const cmd = args[0];

  // ===== MENU =====
  if (!cmd || cmd === "menu") {
    return send(
`🧘‍♂️ TU TIÊN MENU
━━━━━━━━━━━━
• !tutien info
• !tutien train
• !tutien boss
• !tutien pvp @tag
• !tutien shop
• !tutien buy <item>
• !tutien equip
• !tutien reset`
    );
  }

  // ===== INFO =====
  if (cmd === "info") {
    return send(
`📜 THÔNG TIN TU TIÊN
━━━━━━━━━━━━
Cảnh giới: ${LEVELS[u.level]}
Tu vi: ${u.tuvi}
Vàng: ${u.vang}

❤️ HP: ${u.hp}
⚔️ ATK: ${u.atk}
🛡 DEF: ${u.def}
🎯 Crit: ${u.stats.crit}%
🩸 Hút máu: ${u.stats.lifesteal}%`
    );
  }

  // ===== TRAIN =====
  if (cmd === "train") {
    const now = Date.now();
    if (now - u.lastTrain < 60000)
      return send("⏳ Chờ 60s mới train tiếp");

    const gain = Math.floor(Math.random() * 50) + 20;
    u.tuvi += gain;
    u.lastTrain = now;

    if (u.tuvi >= (u.level + 1) * 500 && u.level < LEVELS.length - 1) {
      u.tuvi = 0;
      u.level++;
      u.atk += 5;
      u.def += 3;
      u.hp += 20;
      send(`✨ ĐỘT PHÁ! Lên ${LEVELS[u.level]}`);
    }

    save();
    return send(`🧘‍♂️ Tu luyện +${gain} tu vi`);
  }

  // ===== SHOP =====
  if (cmd === "shop") {
    let msg = "🛒 SHOP TU TIÊN\n━━━━━━━━━━━━\n";
    for (let k in SHOP) {
      msg += `• ${k} | ${SHOP[k].name} | 💰 ${SHOP[k].price}\n`;
    }
    return send(msg);
  }

  // ===== BUY =====
  if (cmd === "buy") {
    const key = args[1];
    const item = SHOP[key];
    if (!item) return send("❌ Item không tồn tại");
    if (u.vang < item.price) return send("❌ Không đủ vàng");

    u.vang -= item.price;

    if (item.slot) {
      // tháo đồ cũ
      const oldKey = u.equip[item.slot];
      if (oldKey) {
        const old = SHOP[oldKey];
        if (old.atk) u.atk -= old.atk;
        if (old.def) u.def -= old.def;
        if (old.hp) u.hp -= old.hp;
        if (old.crit) u.stats.crit -= old.crit;
        if (old.lifesteal) u.stats.lifesteal -= old.lifesteal;
      }

      u.equip[item.slot] = key;
      if (item.atk) u.atk += item.atk;
      if (item.def) u.def += item.def;
      if (item.hp) u.hp += item.hp;
      if (item.crit) u.stats.crit += item.crit;
      if (item.lifesteal) u.stats.lifesteal += item.lifesteal;
    }

    save();
    return send(`✅ Đã mua & trang bị ${item.name}`);
  }

  // ===== EQUIP =====
  if (cmd === "equip") {
    return send(
`🛡 TRANG BỊ
━━━━━━━━━━━━
🗡 Kiếm: ${u.equip.kiem ? SHOP[u.equip.kiem].name : "Không"}
🛡 Giáp: ${u.equip.giap ? SHOP[u.equip.giap].name : "Không"}`
    );
  }

  // ===== BOSS =====
  if (cmd === "boss") {
    const boss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    let bossHp = boss.hp;
    let userHp = u.hp;

    while (bossHp > 0 && userHp > 0) {
      bossHp -= Math.max(1, u.atk - 5);
      userHp -= Math.max(1, boss.atk - u.def);
    }

    if (userHp > 0) {
      u.vang += boss.reward;
      if (Math.random() < 0.5) {
        u.vang += 200;
      }
      save();
      return send(`🏆 Đánh bại ${boss.name}\n💰 +${boss.reward} vàng`);
    } else {
      return send(`💀 Thua ${boss.name}, tu luyện thêm đi`);
    }
  }

  // ===== PVP =====
  if (cmd === "pvp") {
    if (!event.mentions || Object.keys(event.mentions).length === 0)
      return send("❌ Tag đối thủ");

    const target = Object.keys(event.mentions)[0];
    init(target);

    const a = u;
    const b = data[target];

    const aPower = a.atk + a.def + a.hp;
    const bPower = b.atk + b.def + b.hp;

    if (aPower > bPower) {
      a.vang += 200;
      b.vang = Math.max(0, b.vang - 100);
      save();
      return send("⚔️ PVP THẮNG! +200 vàng");
    } else {
      return send("⚔️ PVP THUA!");
    }
  }

  // ===== RESET SEASON =====
  if (cmd === "reset") {
    data[uid] = null;
    delete data[uid];
    save();
    return send("♻️ Reset tu tiên – bắt đầu mùa mới");
  }
};
