const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express().use(bodyParser.json());

// JSON ফাইল লোড (যেহেতু index.js ফাইলটি বাইরেই আছে, তাই সরাসরি লোড হবে)
const loadJSON = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

const state = loadJSON('likhonstate.json');
const config = loadJSON('config.json');

const PAGE_ACCESS_TOKEN = state.PAGE_ACCESS_TOKEN;
const PREFIX = config.PREFIX || "/";

// কমান্ড হ্যান্ডলার (src/cmds ফোল্ডার থেকে লোড হবে)
const commands = new Map();
const cmdPath = path.join(__dirname, 'src', 'cmds'); 

if (fs.existsSync(cmdPath)) {
    const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.js'));
    for (const file of cmdFiles) {
        const cmd = require(path.join(cmdPath, file));
        if (cmd.config && cmd.config.name) {
            commands.set(cmd.config.name, cmd);
            console.log(`✅ Loaded: ${cmd.config.name}`);
        }
    }
} else {
    console.error("❌ 'src/cmds' ফোল্ডারটি পাওয়া যায়নি!");
}

app.get('/', (req, res) => res.send(`${config.BOTNAME} is Online! 🚀`));

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
                                const response = await cmd.run({ sender_psid, args, PAGE_ACCESS_TOKEN, config });
                                if (response) sendTextMessage(sender_psid, response);
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
    } catch (err) { console.log("Send Error"); }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}. Commands: ${commands.size}`));
