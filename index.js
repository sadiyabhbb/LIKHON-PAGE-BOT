const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 
const MY_PSID = '25704185332538480'; 

const randomMessages = [
    "হ্যালো! কমেন্ট করার জন্য ধন্যবাদ। আমরা আপনার সাথে যোগাযোগ করছি।",
    "ধন্যবাদ আমাদের পোস্টে সাড়া দেওয়ার জন্য! আমরা আপনার ইনবক্সে বিস্তারিত পাঠাচ্ছি।",
    "আপনার কমেন্টটি আমরা পেয়েছি। আমাদের টিম আপনার সাথে শীঘ্রই কথা বলবে!",
    "হ্যালো! আমাদের পেজে যুক্ত থাকার জন্য ধন্যবাদ। আপনার জন্য একটি বিশেষ অফার আছে!"
];

// ১. রেন্ডার লিংকে ঢুকলে যাতে 'Cannot GET' না দেখায়
app.get('/', (req, res) => {
    res.send("Bot is Online and Running Successfully! 🚀");
});

app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            
            // ২. ইনবক্সে মেসেজ দিলে রিপ্লাই (বট যে রান আছে তা বোঝার জন্য)
            if (entry.messaging) {
                let event = entry.messaging[0];
                let sender_psid = event.sender.id;
                
                if (event.message && event.message.text) {
                    sendTextMessage(sender_psid, "✅ পেজ বট সফলভাবে কাজ করছে! আপনার মেসেজটি আমরা পেয়েছি।");
                }
            }

            // ৩. কমেন্ট হ্যান্ডেল করে ইনবক্সে মেসেজ পাঠানো
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        let randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];

                        sendPrivateReply(comment_id, randomText);

                        let alert_msg = `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${change.value.message}`;
                        sendTextMessage(MY_PSID, alert_msg);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

function sendPrivateReply(comment_id, message) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message }).catch(err => console.log("Private reply error"));
}

function sendTextMessage(recipient_id, text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, {
        recipient: { id: recipient_id },
        message: { text: text }
    }).catch(err => console.log("Message error"));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Live with Inbox and Comment bot."));
