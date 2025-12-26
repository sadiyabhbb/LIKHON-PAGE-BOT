const axios = require('axios');

module.exports.config = {
  name: "alldown",
  version: "1.0.0",
  permission: 0,
  credits: "LIKHON",
  prefix: true,
  description: "যেকোনো সোশ্যাল মিডিয়া ভিডিও ডাউনলোড করুন (FB, YT, TikTok, Insta)",
  category: "downloader",
  usages: "alldown [লিঙ্ক]",
  cooldowns: 10
};

module.exports.run = async function({ sender_psid, args, PAGE_ACCESS_TOKEN, config }) {
  const videoUrl = args[0];

  if (!videoUrl) {
    return "⚠️ অনুগ্রহ করে একটি ভিডিও লিঙ্ক দিন।\nব্যবহার: " + config.PREFIX + "alldown [ভিডিও লিঙ্ক]";
  }

  try {
    // API থেকে ডেটা আনা
    const res = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(videoUrl)}`);
    const data = res.data;

    // API রেসপন্স চেক (আপনার API অনুযায়ী data.data.low অথবা data.data.main হতে পারে)
    const downloadLink = data.data.main || data.data.low;
    const title = data.data.title || "No Title";

    if (downloadLink) {
      // প্রথমে ইউজারকে জানানো হচ্ছে
      await sendTextMessage(sender_psid, `📥 ডাউনলোড শুরু হচ্ছে...\n📌 টাইটেল: ${title}`, PAGE_ACCESS_TOKEN);

      // ভিডিও ফাইল পাঠানো
      await sendVideoMessage(sender_psid, downloadLink, PAGE_ACCESS_TOKEN);
      return; // রান শেষ
    } else {
      return "❌ ভিডিওটি পাওয়া যায়নি বা লিঙ্কটি সাপোর্ট করছে না।";
    }

  } catch (err) {
    console.error("Downloader Error:", err.message);
    return "❌ দুঃখিত, ভিডিওটি প্রসেস করার সময় একটি ত্রুটি ঘটেছে।";
  }
};

// ভিডিও পাঠানোর জন্য সহায়ক ফাংশন
async function sendVideoMessage(recipient_id, video_url, token) {
  try {
    await axios.post(`https://graph.facebook.com/v24.0/me/messages?access_token=${token}`, {
      recipient: { id: recipient_id },
      message: {
        attachment: {
          type: "video",
          payload: {
            url: video_url,
            is_reusable: true
          }
        }
      }
    });
  } catch (err) {
    console.log("Video Send Error");
  }
}

// টেক্সট পাঠানোর জন্য সহায়ক ফাংশন
async function sendTextMessage(recipient_id, text, token) {
  try {
    await axios.post(`https://graph.facebook.com/v24.0/me/messages?access_token=${token}`, {
      recipient: { id: recipient_id },
      message: { text: text }
    });
  } catch (err) {
    console.log("Text Send Error");
  }
}
