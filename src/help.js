module.exports.config = {
  name: "help",
  version: "1.0.0",
  permission: 0,
  credits: "LIKHON",
  prefix: true,
  description: "বটের সব কমান্ডের তালিকা দেখুন",
  category: "system",
  usages: "help",
  cooldowns: 5
};

module.exports.run = async function({ sender_psid, args, PAGE_ACCESS_TOKEN, config }) {
  const fs = require('fs');
  const path = require('path');

  try {
    const cmdPath = path.join(__dirname);
    const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.js'));

    let helpText = `╭─━━━━━━━━━━━━━─╮\n┃    📖  𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓   ┃\n┃━━━━━━━━━━━━━┃\n`;
    
    cmdFiles.forEach((file, index) => {
      const cmd = require(path.join(cmdPath, file));
      if (cmd.config && cmd.config.name) {
        helpText += `┃ ${index + 1}. ${config.PREFIX}${cmd.config.name}\n`;
      }
    });

    helpText += `┃━━━━━━━━━━━━━┃\n┃ 💡 মোট কমান্ড: ${cmdFiles.length}\n┃ 🤸‍♀️ 𝐃𝐄𝐕: ${config.THEME_SETUP.ADMIN}\n╰─━━━━━━━━━━━━━─╯`;

    return helpText;

  } catch (err) {
    console.error(err);
    return "❌ কমান্ড লিস্ট লোড করতে সমস্যা হয়েছে।";
  }
};
