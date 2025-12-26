module.exports.config = {
  name: "hello",
  version: "1.0.0",
  permission: 0,
  credits: "LIKHON",
  prefix: true,
  description: "Say hello to the bot",
  category: "general",
  usages: "hello",
  cooldowns: 5
};

module.exports.run = async function({ sender_psid, args, PAGE_ACCESS_TOKEN, config, mid }) {
  return `Hey there! 😊 Replying to your message!`;
};
