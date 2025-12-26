const axios = require('axios');

module.exports.config = {
  name: "uid",
  version: "1.0.0",
  permission: 0,
  credits: "LIKHON",
  prefix: true,
  description: "ইউজার ইনফো এবং PSID দেখাবে",
  category: "utility",
  usages: "uid",
  cooldowns: 5
};

module.exports.run = async function({ sender_psid, args, PAGE_ACCESS_TOKEN, config }) {
  try {
    const userProfile = await axios.get(`https://graph.facebook.com/v24.0/${sender_psid}?fields=first_name,last_name&access_token=${PAGE_ACCESS_TOKEN}`);
    const fullName = `${userProfile.data.first_name} ${userProfile.data.last_name}`;

    return `╭─━━━━━━━━━━━━━━━━━━━━━━─╮
┃ 👤 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎          ┃
┃━━━━━━━━━━━━━━━━━━━━━━┃
┃  🪪 𝐍𝐀𝐌𝐄: ${fullName}
┃
┃  🆔 PSID: ${sender_psid}
┃━━━━━━━━━━━━━━━━━━━━━━┃
┃ 🤸‍♀️ 𝐁𝐎𝐓 𝐃𝐄𝐕 𝐁𝐘 ${config.THEME_SETUP.ADMIN.toUpperCase()}    ┃
╰─━━━━━━━━━━━━━━━━━━━━━━─╯`;
  } catch (err) {
    return `🆔 আপনার PSID: ${sender_psid}\n(প্রোফাইল নাম লোড করা সম্ভব হয়নি)`;
  }
};
