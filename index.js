const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express().use(bodyParser.json());

// JSON ফাইল লোড করার ফাংশন
const loadJSON = (f) => {
    try {
        const filePath = path.join(__dirname, f);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else {
            console.error(`⚠️ Warning: ${f} ফাইলটি পাওয়া যায়নি!`);
            return {};
        }
    } catch (e) {
        console.error(`❌ Error loading ${f}:`, e.message);
        return {};
    }
};

// ফাইল পাথ লোড (আপনার চাহিদা অনুযায়ী)
const state = loadJSON('likhonstate.json'); 
const config = loadJSON('config/config.json');

const PAGE_ACCESS_TOKEN = state.PAGE_ACCESS_TOKEN;
const PREFIX = config.PREFIX || "/";

// কমান্ড হ্যান্ডলার (src ফোল্ডার থেকে)
const commands = new Map();
const cmdPath = path.join(__dirname, 'src');

if (fs.existsSync(cmdPath)) {
    const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.js'));
    for (const file of cmdFiles) {
        try {
            const cmd = require(path.join(cmdPath, file));
            if (cmd.config && cmd.config.name) {
                commands.set(cmd.config.name, cmd);
                console.log(`✅ Loaded: ${cmd.config.name}`);
            }
        } catch (e) {
            console.error(`❌ Error loading file ${file}:`, e.message);
        }
    }
} else {
    console.error("❌ 'src' ফোল্ডারটি পাওয়া যায়নি!");
}

app.get('/', (req, res) => res.send(`${config.BOTNAME || "Bot"} is Online! 🚀`));

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === config.VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else { res.sendStatus(403); }
});

app.post('/webhook', (req, res) => {
    let body = req.body;
    if (body.object === 'page') {
        body.entry.forEach(entry => {
            if (entry.messaging) {
                entry.messaging.forEach(async (event) => {
                    let sender_psid = event.sender.id;
                    
                    if (event.message && event.message.text) {
                        let text = event.message.text.trim();
                        let mid = event.message.mid; // মেসেজ আইডি সংগ্রহ

                        // কমান্ড চেক করা (Prefix সহ)
                        if (text.startsWith(PREFIX)) {
                            let args = text.slice(PREFIX.length).split(' ');
                            let commandName = args.shift().toLowerCase();
                            
                            if (commands.has(commandName)) {
                                const cmd = commands.get(commandName);
                                try {
                                    // mid পাঠানো হলো যাতে রিপ্লাই দেওয়া যায়
                                    const response = await cmd.run({ sender_psid, args, PAGE_ACCESS_TOKEN, config, mid });
                                    if (response) sendTextMessage(sender_psid, response, PAGE_ACCESS_TOKEN, mid);
                                } catch (err) {
                                    console.error("Command Execution Error:", err);
                                }
                            }
                        } 
                        // Prefix ছাড়া কমান্ড (যেমন: prefix.js এর জন্য)
                        else {
                            let args = text.split(' ');
                            let commandName = args.shift().toLowerCase();
                            if (commands.has(commandName) && commands.get(commandName).config.prefix === false) {
                                const cmd = commands.get(commandName);
                                try {
                                    const response = await cmd.run({ sender_psid, args, PAGE_ACCESS_TOKEN, config, mid });
                                    if (response) sendTextMessage(sender_psid, response, PAGE_ACCESS_TOKEN, mid);
                                } catch (err) {
                                    console.error(err);
                                }
                            }
                        }
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// টেক্সট মেসেজ এবং রিপ্লাই ফাংশন
async function sendTextMessage(recipient_id, text, token, mid = null) {
    try {
        const payload = {
            recipient: { id: recipient_id },
            message: { text: text },
            messaging_type: "RESPONSE"
        };

        // যদি mid থাকে তবে সেটি 'reply_to' হিসেবে যুক্ত হবে
        if (mid) {
            payload.message.reply_to = { message_id: mid };
        }

        await axios.post(`https://graph.facebook.com/v24.0/me/messages?access_token=${token}`, payload);
    } catch (err) { 
        console.log("Send Error:", err.response ? JSON.stringify(err.response.data) : err.message); 
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}. Total Commands: ${commands.size}`));
