const fs = require("fs");
const path = require("path");

const DATA = path.join(__dirname, "cache", "cauca.json");
if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "{}");

const load = () => JSON.parse(fs.readFileSync(DATA));
const save = d => fs.writeFileSync(DATA, JSON.stringify(d, null, 2));

const BASE_CD = 30000;

const FISH = [
  { name: "🐟 Cá thường", rate: 50, min: 200, max: 500, exp: 5 },
  { name: "🐠 Cá hiếm", rate: 30, min: 800, max: 1500, exp: 15 },
  { name: "🐉 Cá huyền thoại", rate: 15, min: 3000, max: 5000, exp: 50 },
  { name: "🐲 CÁ VÀNG EVENT", rate: 5, min: 10000, max: 20000, exp: 200 }
];

const ROD_PRICE = [0, 5000, 15000, 40000, 100000, 250000];

module.exports.config = {
  name: "cauca",
  version: "5.0.0",
  hasPermission: 0,
  credits: "full-by-chatgpt",
  description: "Game câu cá FULL MAX",
  commandCategory: "Game",
  cooldowns: 1
};

module.exports.run = async ({ api, event, args, Currencies }) => {
  const uid = event.senderID;
  const tid = event.threadID;
  const db = load();

  if (!db[uid]) {
    db[uid] = {
      level: 1,
      exp: 0,
      vip: false,
      rod: 1,
      last: 0,
      bag: {},
      totalEarn: 0
    };
  }

  const u = db[uid];
  const sub = args[0];

  // ===== INFO =====
  if (sub === "info") {
    const bag = Object.entries(u.bag)
      .map(([k,v]) => `• ${k}: ${v.toLocaleString()}$`)
      .join("\n") || "Trống";

    return api.sendMessage(
      `🎣 PROFILE CÂU CÁ\n\n` +
      `⭐ Level: ${u.level}\n` +
      `📈 EXP: ${u.exp}/${u.level * 100}\n` +
      `🎣 Cần câu: Lv.${u.rod}\n` +
      `👑 VIP: ${u.vip ? "Có" : "Không"}\n` +
      `💰 Tổng tiền câu: ${u.totalEarn.toLocaleString()}$\n\n` +
      `🎒 TÚI CÁ:\n${bag}`,
      tid
    );
  }

  // ===== SHOP =====
  if (sub === "shop") {
    return api.sendMessage(
      `🛒 SHOP CẦN CÂU\n\n` +
      `Lv1: FREE\n` +
      `Lv2: 5,000$\n` +
      `Lv3: 15,000$\n` +
      `Lv4: 40,000$\n` +
      `Lv5: 100,000$\n\n` +
      `👉 Mua: cauca mua <level>`,
      tid
    );
  }

  // ===== BUY =====
  if (sub === "mua") {
    const lv = parseInt(args[1]);
    if (!lv || lv <= u.rod || lv > 5)
      return api.sendMessage("❌ Level cần câu không hợp lệ!", tid);

    const price = ROD_PRICE[lv];
    const money = (await Currencies.getData(uid)).money;
    if (money < price)
      return api.sendMessage("❌ Không đủ tiền!", tid);

    await Currencies.decreaseMoney(uid, price);
    u.rod = lv;
    save(db);

    return api.sendMessage(`✅ Đã mua cần câu Lv.${lv}`, tid);
  }

  // ===== BÁN =====
  if (sub === "ban") {
    const fishName = args.slice(1).join(" ");
    if (!fishName) {
      const total = Object.values(u.bag).reduce((a,b)=>a+b,0);
      if (!total) return api.sendMessage("❌ Không có cá!", tid);

      await Currencies.increaseMoney(uid, total);
      u.bag = {};
      save(db);

      return api.sendMessage(`💰 Đã bán tất cả cá: +${total.toLocaleString()}$`, tid);
    }

    if (!u.bag[fishName])
      return api.sendMessage("❌ Bạn không có loại cá này!", tid);

    const money = u.bag[fishName];
    delete u.bag[fishName];

    await Currencies.increaseMoney(uid, money);
    save(db);

    return api.sendMessage(`💰 Đã bán ${fishName}: +${money.toLocaleString()}$`, tid);
  }

  // ===== TOP =====
  if (sub === "top") {
    const type = args[1];
    let list = Object.entries(db);

    if (type === "money") {
      list.sort((a,b)=>b[1].totalEarn - a[1].totalEarn);
      return api.sendMessage(
        `🏆 TOP TIỀN CÂU CÁ\n\n` +
        list.slice(0,10).map((e,i)=>
          `${i+1}. ${e[0]} – ${e[1].totalEarn.toLocaleString()}$`
        ).join("\n"),
        tid
      );
    }

    list.sort((a,b)=>b[1].level - a[1].level);
    return api.sendMessage(
      `🏆 TOP LEVEL CÂU CÁ\n\n` +
      list.slice(0,10).map((e,i)=>
        `${i+1}. ${e[0]} – Lv.${e[1].level}`
      ).join("\n"),
      tid
    );
  }

  // ===== COOLDOWN =====
  const cd = BASE_CD - u.rod * 3000;
  if (Date.now() - u.last < cd)
    return api.sendMessage("⏳ Đợi chút rồi hãy câu tiếp!", tid);

  u.last = Date.now();

  // ===== RANDOM CÁ =====
  let buff = (u.vip ? 10 : 0) + u.rod * 2;
  let roll = Math.random() * 100;
  let acc = 0, fish;

  for (const f of FISH) {
    acc += f.rate + buff;
    if (roll <= acc) { fish = f; break; }
  }

  if (!fish) {
    save(db);
    return api.sendMessage("🎣 Cá cắn rồi tuột mất!", tid);
  }

  let money = Math.floor(Math.random()*(fish.max-fish.min))+fish.min;
  let exp = fish.exp;

  if (u.vip) {
    money *= 2;
    exp = Math.floor(exp * 1.5);
  }

  u.exp += exp;
  if (u.exp >= u.level * 100) {
    u.exp = 0;
    u.level++;
    api.sendMessage(`🎉 LÊN LEVEL ${u.level}!`, tid);
  }

  u.bag[fish.name] = (u.bag[fish.name] || 0) + money;
  u.totalEarn += money;

  save(db);

  api.sendMessage(
    `🎣 CÂU CÁ THÀNH CÔNG\n` +
    `➤ ${fish.name}\n` +
    `💰 ${money.toLocaleString()}$\n` +
    `⭐ EXP +${exp}`,
    tid
  );
};
