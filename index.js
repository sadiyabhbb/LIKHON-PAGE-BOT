const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 
const MY_PSID = '25704185332538480'; // আপনার দেওয়া PSID

app.get('/', (req, res) => res.send("Bot Server is Running!"));

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
            // ১. ইনবক্স মেসেজ হ্যান্ডেল
            if (entry.messaging) {
                let event = entry.messaging[0];
                let sender_psid = event.sender.id;
                
                if (event.message && event.message.text) {
                    // কেউ মেসেজ দিলে তাকে অটো রিপ্লাই
                    sendTextMessage(sender_psid, "হ্যালো! আমি আপনার বট। আপনার মেসেজটি পেয়েছি।");
                }
            }

            // ২. কমেন্ট হ্যান্ডেল করা
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "একজন ইউজার";
                        let comment_text = change.value.message;

                        console.log(`New comment by ${commenter_name}: ${comment_text}`);

                        // কাজ ১: কমেন্টে লাইক দেওয়া
                        axios.post(`https://graph.facebook.com/v21.0/${comment_id}/likes?access_token=${PAGE_ACCESS_TOKEN}`)
                            .catch(e => console.log("Like error"));

                        // কাজ ২: কমেন্টে অটো রিপ্লাই দেওয়া
                        sendCommentReply(comment_id, `ধন্যবাদ ${commenter_name}! আমাদের সাথেই থাকুন। ❤️`);

                        // কাজ ৩: আপনাকে (অ্যাডমিনকে) ইনবক্সে জানানো
                        let alert_msg = `🔔 নতুন কমেন্ট এসেছে!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${comment_text}`;
                        sendTextMessage(MY_PSID, alert_msg);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// মেসেজ পাঠানোর ফাংশন
function sendTextMessage(recipient_id, text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, {
        recipient: { id: recipient_id },
        message: { text: text }
    }).catch(err => console.log("Message send error"));
}

// কমেন্টে রিপ্লাই দেওয়ার ফাংশন
function sendCommentReply(comment_id, message) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/comments?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message }).catch(err => console.log("Comment reply error"));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("Server Live with Admin Notification"));
