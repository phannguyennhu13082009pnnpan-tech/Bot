const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "cache", "tutien.json");
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, "{}");

let users = JSON.parse(fs.readFileSync(DATA_PATH));
const save = () => fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));

/* ================== CONFIG ================== */

const HE_CANH = [
  "Luyện Khí",
  "Trúc Cơ",
  "Kim Đan",
  "Nguyên Anh",
  "Hóa Thần",
  "Luyện Hư",
  "Hợp Thể",
  "Độ Kiếp",
  "Đại Thừa"
];

const QUAI = [
  { name: "Lang Yêu", hp: 50, exp: 20 },
  { name: "Hắc Hùng", hp: 120, exp: 50 },
  { name: "Huyết Ma", hp: 300, exp: 120 }
];

const BOSS = [
  { name: "Ma Tôn", hp: 800, exp: 400 },
  { name: "Thiên Ma", hp: 1500, exp: 900 }
];

const SHOP = {
  kiếm: { name: "Huyết Kiếm", atk: 20, price: 200 },
  giáp: { name: "Hộ Thân Giáp", def: 15, price: 180 }
};

/* ================== INIT USER ================== */

function init(uid, name) {
  if (!users[uid]) {
    users[uid] = {
      name,
      vip: false,
      tuvi: 0,
      hp: 100,
      atk: 10,
      def: 5,
      canh: 0,
      vang: 100,
      trangbi: {},
      dead: false
    };
    save();
  }
}

function getCanh(u) {
  return HE_CANH[u.canh] || "Phàm Nhân";
}

/* ================== MIRAI CONFIG ================== */

module.exports.config = {
  name: "tutien",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "TEGK",
  description: "Game tu tiên full",
  commandCategory: "Game",
  usages: "menu",
  cooldowns: 2
};

/* ================== MAIN ================== */

module.exports.run = async ({ api, event, args }) => {
  const uid = event.senderID;
  const name = event.senderName || "Tu Sĩ";
  init(uid, name);

  const u = users[uid];
  const send = msg => api.sendMessage(msg, event.threadID);

  const cmd = args[0];

  /* ===== MENU ===== */
  if (!cmd || cmd === "menu") {
    return send(
`🧘‍♂️ GAME TU TIÊN
━━━━━━━━━━━━━━
• !tutien info
• !tutien train
• !tutien quai
• !tutien boss
• !tutien pvp @tag
• !tutien shop
• !tutien buy <item>
• !tutien vip
━━━━━━━━━━━━━━`
    );
  }

  /* ===== INFO ===== */
  if (cmd === "info") {
    return send(
`📜 THÔNG TIN TU SĨ
━━━━━━━━━━━━━━
👤 ${u.name}
⚡ Cảnh giới: ${getCanh(u)}
🔮 Tu vi: ${u.tuvi}
❤️ HP: ${u.hp}
🗡 ATK: ${u.atk}
🛡 DEF: ${u.def}
💰 Vàng: ${u.vang}
👑 VIP: ${u.vip ? "Có" : "Không"}
━━━━━━━━━━━━━━`
    );
  }

  /* ===== TRAIN ===== */
  if (cmd === "train") {
    if (u.dead) return send("☠️ Đã chết, không tu luyện được");
    const gain = u.vip ? 30 : 15;
    u.tuvi += gain;

    if (u.tuvi >= (u.canh + 1) * 100) {
      u.canh++;
      u.tuvi = 0;
      send(`⚡ Đột phá thành công ➜ ${getCanh(u)}`);
    }

    save();
    return send(`🧘 Tu luyện +${gain} tu vi`);
  }

  /* ===== ĐÁNH QUÁI ===== */
  if (cmd === "quai") {
    const q = QUAI[Math.floor(Math.random() * QUAI.length)];
    if (u.atk + Math.random() * 20 < q.hp) {
      u.hp -= 20;
      if (u.hp <= 0) {
        u.dead = true;
        u.tuvi = Math.max(0, u.tuvi - 50);
        save();
        return send("☠️ Thua quái, trọng thương");
      }
      save();
      return send("⚔️ Đánh quái thất bại");
    }

    u.tuvi += q.exp;
    u.vang += 30;
    save();
    return send(`⚔️ Hạ ${q.name} ➜ +${q.exp} tu vi`);
  }

  /* ===== BOSS ===== */
  if (cmd === "boss") {
    const b = BOSS[Math.floor(Math.random() * BOSS.length)];
    if (u.atk + Math.random() * 50 < b.hp) {
      u.dead = true;
      u.tuvi = Math.max(0, u.tuvi - 100);
      save();
      return send(`💀 Bị ${b.name} đánh bại`);
    }

    u.tuvi += b.exp;
    u.vang += 100;

    if (Math.random() < 0.5) {
      u.trangbi.kiem = SHOP.kiếm;
      u.atk += 20;
    }

    save();
    return send(`🔥 Hạ ${b.name} ➜ +${b.exp} tu vi`);
  }

  /* ===== PVP ===== */
  if (cmd === "pvp") {
    const target = Object.keys(event.mentions)[0];
    if (!target || !users[target]) return send("❌ Tag đối thủ");

    const o = users[target];
    if (u.atk + Math.random() * 30 < o.atk) {
      u.tuvi = Math.max(0, u.tuvi - 50);
      save();
      return send("❌ Thua PVP");
    }

    u.tuvi += 50;
    save();
    return send("🏆 Thắng PVP");
  }

  /* ===== SHOP ===== */
  if (cmd === "shop") {
    return send(
`🛒 SHOP
━━━━━━━━━━━━━━
• kiếm – 200 vàng
• giáp – 180 vàng
Dùng: !tutien buy <item>`
    );
  }

  if (cmd === "buy") {
    const item = SHOP[args[1]];
    if (!item) return send("❌ Item không tồn tại");
    if (u.vang < item.price) return send("❌ Không đủ vàng");

    u.vang -= item.price;
    if (item.atk) u.atk += item.atk;
    if (item.def) u.def += item.def;
    save();

    return send(`✅ Mua ${item.name} thành công`);
  }

  /* ===== VIP ===== */
  if (cmd === "vip") {
    u.vip = true;
    save();
    return send("👑 Kích hoạt VIP (demo)");
  }
};
