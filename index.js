const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express().use(bodyParser.json());

// JSON ফাইল লোড করার ফাংশন
const loadJSON = (fileName) => {
    try {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return {};
    } catch (err) {
        console.error(`❌ Error loading ${fileName}:`, err.message);
        return {};
    }
};

// কনফিগারেশন এবং স্টেট ফাইল লোড করা
const state = loadJSON('likhonstate.json');
const config = loadJSON('config.json');

const PAGE_ACCESS_TOKEN = state.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = config.VERIFY_TOKEN;
const PREFIX = config.PREFIX || "/";

app.get('/', (req, res) => res.send(`${config.THEME_SETUP?.TITLE || "Bot"} Server is Live! 🚀`));

// ফেসবুক ওয়েবহুক ভেরিফিকেশন
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// মেইন ওয়েবহুক লজিক
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            
            // ১. ইনবক্স মেসেজ হ্যান্ডেল (মেসেঞ্জার বট স্টাইল)
            if (entry.messaging) {
                for (const event of entry.messaging) {
                    let sender_psid = event.sender.id;
                    if (event.message && event.message.text) {
                        let text = event.message.text.trim();

                        // কমান্ড চেক (যেমন: /uid)
                        if (text.startsWith(PREFIX)) {
                            let args = text.slice(PREFIX.length).split(' ');
                            let command = args.shift().toLowerCase();

                            // আপনার দেওয়া স্টাইলিশ ইউজার ইনফো কমান্ড
                            if (command === 'uid' || command === 'id') {
                                try {
                                    // ইউজারের নাম ফেসবুক থেকে নিয়ে আসা
                                    const userProfile = await axios.get(`https://graph.facebook.com/v24.0/${sender_psid}?fields=first_name,last_name&access_token=${PAGE_ACCESS_TOKEN}`);
                                    const fullName = `${userProfile.data.first_name} ${userProfile.data.last_name}`;

                                    const idMessage = `╭─━━━━━━━━━━━━━━━━━━━━━━─╮
┃ 👤 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎          ┃
┃━━━━━━━━━━━━━━━━━━━━━━┃
┃  🪪 𝐍𝐀𝐌𝐄: ${fullName}
┃
┃  🆔 PSID: ${sender_psid}
┃━━━━━━━━━━━━━━━━━━━━━━┃
┃ 🤸‍♀️ 𝐁𝐎𝐓 𝐃𝐄𝐕 𝐁𝐘 ${config.THEME_SETUP.ADMIN.toUpperCase()}    ┃
╰─━━━━━━━━━━━━━━━━━━━━━━─╯`;

                                    sendTextMessage(sender_psid, idMessage);
                                } catch (err) {
                                    sendTextMessage(sender_psid, `🆔 আপনার PSID: ${sender_psid}`);
                                    console.log("Profile Error:", err.message);
                                }
                            } 
                            
                            else if (command === 'help') {
                                sendTextMessage(sender_psid, `🤖 ${config.BOTNAME} কমান্ড লিস্ট:\n${PREFIX}uid - আপনার তথ্য\n${PREFIX}info - বটের তথ্য`);
                            }
                        }
                    }
                }
            }

            // ২. কমেন্ট হ্যান্ডেল (অটো প্রাইভেট রিপ্লাই)
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        let msg = `হ্যালো ${commenter_name}! কমেন্ট করার জন্য ধন্যবাদ। আমরা আপনাকে ইনবক্স করেছি।`;

                        console.log(`New comment by ${commenter_name}`);
                        sendPrivateReply(comment_id, msg);

                        // অ্যাডমিনকে নোটিফিকেশন দেওয়া
                        if (config.ADMINS_UID && config.ADMINS_UID[0]) {
                            sendTextMessage(config.ADMINS_UID[0], `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬: ${change.value.message}`);
                        }
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// ফাংশন: প্রাইভেট রিপ্লাই পাঠানো
async function sendPrivateReply(comment_id, message) {
    try {
        const url = `https://graph.facebook.com/v24.0/${comment_id}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
        await axios.post(url, { message: message });
    } catch (err) {
        console.log("❌ Private Reply Error:", err.response?.data?.error?.message || err.message);
    }
}

// ফাংশন: মেসেজ পাঠানো
async function sendTextMessage(recipient_id, text) {
    try {
        const url = `https://graph.facebook.com/v24.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
        await axios.post(url, {
            recipient: { id: recipient_id },
            message: { text: text }
        });
    } catch (err) {
        console.log("❌ Send Message Error:", err.response?.data?.error?.message || err.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ${config.BOTNAME} is live on port ${PORT}`));
