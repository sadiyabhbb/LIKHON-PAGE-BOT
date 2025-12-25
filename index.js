const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 

// Root path-এ একটি মেসেজ যাতে আপনি বুঝতে পারেন সার্ভার চালু আছে
app.get('/', (req, res) => {
    res.send("Bot Server is Running!");
});

app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            // অনেক সময় messaging অ্যারেটি খালি থাকতে পারে, তাই চেক করা ভালো
            if (entry.messaging && entry.messaging.length > 0) {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    sendTextMessage(sender_psid, "হ্যালো! আমি আপনার বট। আপনি লিখেছেন: " + webhook_event.message.text);
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

function sendTextMessage(sender_psid, response_text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    const data = {
        recipient: { id: sender_psid },
        message: { text: response_text }
    };

    axios.post(url, data)
        .then(() => console.log('Message Sent Success'))
        .catch(err => {
            if (err.response) {
                console.error('Error Details:', err.response.data);
            } else {
                console.error('Error:', err.message);
            }
        });
}

// Render-এর জন্য এই পোর্ট সেটিংসটি ব্যবহার করুন
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
