const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 
const MY_PSID = '25704185332538480'; 

// Random Messages List
const randomMessages = [
    "হ্যালো! কমেন্ট করার জন্য ধন্যবাদ। আমরা আপনার সাথে যোগাযোগ করছি।",
    "ধন্যবাদ আমাদের পোস্টে সাড়া দেওয়ার জন্য! আমরা আপনার ইনবক্সে বিস্তারিত পাঠাচ্ছি।",
    "আপনার কমেন্টটি আমরা পেয়েছি। আমাদের টিম আপনার সাথে শীঘ্রই কথা বলবে!",
    "হ্যালো! আমাদের পেজে যুক্ত থাকার জন্য ধন্যবাদ। আপনার জন্য একটি বিশেষ অফার আছে!"
];

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
            if (entry.changes) {
                entry.changes.forEach(change => {
                    // শুধুমাত্র কমেন্ট চেক করা হচ্ছে
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        
                        // র‍্যান্ডম মেসেজ সিলেক্ট করা
                        let randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];

                        // ১. ইউজারকে ইনবক্সে প্রাইভেট মেসেজ পাঠানো
                        sendPrivateReply(comment_id, randomText);

                        // ২. অ্যাডমিনকে (আপনাকে) অ্যালার্ট পাঠানো
                        let alert_msg = `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${change.value.message}`;
                        sendTextMessage(MY_PSID, alert_msg);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// ইনবক্সে প্রাইভেট রিপ্লাই ফাংশন
function sendPrivateReply(comment_id, message) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message })
        .catch(err => console.log("Private reply error"));
}

// অ্যাডমিনকে মেসেজ পাঠানোর ফাংশন
function sendTextMessage(recipient_id, text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, {
        recipient: { id: recipient_id },
        message: { text: text }
    }).catch(err => console.log("Admin alert error"));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server is Live for Comment to Inbox Task"));
