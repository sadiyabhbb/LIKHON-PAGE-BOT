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
        console.error(`❌ ${fileName} পাওয়া যায়নি!`);
        return {};
    } catch (err) {
        console.error(`❌ ${fileName} লোড করতে সমস্যা:`, err.message);
        return {};
    }
};

// কনফিগারেশন লোড
const state = loadJSON('likhonstate.json');
const config = loadJSON('config.json');

const PAGE_ACCESS_TOKEN = state.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = config.VERIFY_TOKEN;
const PREFIX = config.PREFIX || "/";

app.get('/', (req, res) => res.send(`${config.THEME_SETUP?.TITLE || "Bot"} is Online 🚀`));

// ফেসবুক ওয়েবহুক ভেরিফিকেশন
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// ওয়েবহুক মেইন লজিক
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            
            // ১. ইনবক্স মেসেজ হ্যান্ডেল (মেসেঞ্জার বট স্টাইল)
            if (entry.messaging) {
                entry.messaging.forEach(event => {
                    let sender_psid = event.sender.id;
                    if (event.message && event.message.text) {
                        let text = event.message.text.trim();

                        // কমান্ড চেক
                        if (text.startsWith(PREFIX)) {
                            let args = text.slice(PREFIX.length).split(' ');
                            let command = args.shift().toLowerCase();

                            if (command === 'id') {
                                sendTextMessage(sender_psid, `আপনার PSID: ${sender_psid}`);
                            } else if (command === 'help') {
                                sendTextMessage(sender_psid, `🤖 ${config.BOTNAME}\n\nউপলব্ধ কমান্ড:\n${PREFIX}id - আপনার আইডি দেখুন\n${PREFIX}info - বটের তথ্য`);
                            } else if (command === 'info') {
                                sendTextMessage(sender_psid, `অ্যাডমিন: ${config.THEME_SETUP.ADMIN}\nথিম: ${config.THEME_SETUP.THEME}`);
                            }
                        } else {
                            // সাধারণ টেক্সট রিপ্লাই
                            console.log(`Message from ${sender_psid}: ${text}`);
                        }
                    }
                });
            }

            // ২. কমেন্ট হ্যান্ডেল (অটো ইনবক্স)
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        let replyMsg = `হ্যালো ${commenter_name}! কমেন্ট করার জন্য ধন্যবাদ। আমরা আপনাকে ইনবক্স করেছি।`;

                        console.log(`New comment by ${commenter_name}`);
                        sendPrivateReply(comment_id, replyMsg);

                        // অ্যাডমিনকে নোটিফিকেশন (অ্যাডমিন লিস্টের প্রথম জনকে)
                        if (config.ADMINS_UID && config.ADMINS_UID.length > 0) {
                            sendTextMessage(config.ADMINS_UID[0], `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${change.value.message}`);
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
        console.log("✅ Private Reply Sent!");
    } catch (err) {
        console.log("❌ Private Reply Error:", err.response ? err.response.data.error.message : err.message);
    }
}

// ফাংশন: টেক্সট মেসেজ পাঠানো
async function sendTextMessage(recipient_id, text) {
    try {
        const url = `https://graph.facebook.com/v24.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
        await axios.post(url, {
            recipient: { id: recipient_id },
            message: { text: text }
        });
    } catch (err) {
        console.log("❌ Msg Error:", err.response ? err.response.data.error.message : err.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ${config.BOTNAME} is running on port ${PORT}`));
