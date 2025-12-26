const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express().use(bodyParser.json());

// JSON ফাইল লোড
const loadJSON = (f) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
    } catch (e) {
        console.error(`❌ Error loading ${f}:`, e.message);
        return {};
    }
};

const state = loadJSON('likhonstate.json');
const config = loadJSON('config.json');

const PAGE_ACCESS_TOKEN = state.PAGE_ACCESS_TOKEN;
const PREFIX = config.PREFIX || "/";

// কমান্ড হ্যান্ডলার (সরাসরি src ফোল্ডার থেকে লোড হবে)
const commands = new Map();
const cmdPath = path.join(__dirname, 'src'); // এখানে 'cmds' বাদ দেওয়া হয়েছে

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
                        if (text.startsWith(PREFIX)) {
                            let args = text.slice(PREFIX.length).split(' ');
                            let commandName = args.shift().toLowerCase();
                            
                            if (commands.has(commandName)) {
                                const cmd = commands.get(commandName);
                                // কমান্ড রান করার সময় error হ্যান্ডলিং যোগ করা হয়েছে
                                try {
                                    const response = await cmd.run({ sender_psid, args, PAGE_ACCESS_TOKEN, config });
                                    if (response) sendTextMessage(sender_psid, response);
                                } catch (err) {
                                    console.error("Command Execution Error:", err);
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

async function sendTextMessage(recipient_id, text) {
    try {
        await axios.post(`https://graph.facebook.com/v24.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
            recipient: { id: recipient_id },
            message: { text: text }
        });
    } catch (err) { 
        console.log("Send Error:", err.response ? err.response.data : err.message); 
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}. Commands: ${commands.size}`));
