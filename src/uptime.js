const axios = require('axios');

module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  permission: 0,
  credits: "LIKHON",
  prefix: true,
  description: "বট কতক্ষণ ধরে সচল আছে তা দেখাবে",
  category: "system",
  usages: "uptime",
  cooldowns: 5
};

module.exports.run = async function({ sender_psid, args, PAGE_ACCESS_TOKEN, config }) {
  try {
    // প্রসেস আপটাইম হিসেব (সেকেন্ডে)
    let uptime = process.uptime();
    
    let days = Math.floor(uptime / (24 * 3600));
    let hours = Math.floor((uptime % (24 * 3600)) / 3600);
    let minutes = Math.floor((uptime % 3600) / 60);
    let seconds = Math.floor(uptime % 60);

    // সময় ফরম্যাট করা
    let uptimeString = "";
    if (days > 0) uptimeString += `${days} দিন, `;
    if (hours > 0) uptimeString += `${hours} ঘণ্টা, `;
    if (minutes > 0) uptimeString += `${minutes} মিনিট, `;
    uptimeString += `${seconds} সেকেন্ড`;

    return `╭─━━━━━━━━━━━━━─╮
┃   🚀 𝐁𝐎𝐓 𝐔𝐏𝐓𝐈𝐌𝐄     ┃
┃━━━━━━━━━━━━━┃
┃ 🕒 𝐑𝐔𝐍𝐍𝐈𝐍𝐆 𝐅𝐎𝐑:
┃ ${uptimeString}
┃
┃ ⚙️ 𝐒𝐓𝐀𝐓𝐔𝐒: Active
┃ 🤖 𝐍𝐀𝐌𝐄: ${config.BOTNAME || "Bot"}
┃━━━━━━━━━━━━━┃
┃ 🤸‍♀️ 𝐁𝐎𝐓 𝐃𝐄𝐕 𝐁𝐘 ${config.THEME_SETUP.ADMIN.toUpperCase()}
╰─━━━━━━━━━━━━━─╯`;

  } catch (err) {
    return "❌ আপটাইম হিসেব করতে সমস্যা হয়েছে।";
  }
};
