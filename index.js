const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 

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
                console.log("SENDER PSID:", sender_psid); // এটি লগে আপনার আইডি দেখাবে
                
                if (event.message && event.message.text) {
                    sendTextMessage(sender_psid, "আপনার মেসেজ পেয়েছি!");
                }
            }

            // ২. কমেন্টে অটো লাইক ও রিপ্লাই
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        
                        // অটো লাইক দেওয়া
                        axios.post(`https://graph.facebook.com/v21.0/${comment_id}/likes?access_token=${PAGE_ACCESS_TOKEN}`);

                        // কমেন্টে অটো রিপ্লাই দেওয়া
                        sendCommentReply(comment_id, "ধন্যবাদ কমেন্ট করার জন্য! ❤️");
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// কমেন্টে রিপ্লাই দেওয়ার ফাংশন
function sendCommentReply(comment_id, message) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/comments?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message }).catch(err => console.log("Reply Error"));
}

function sendTextMessage(sender_psid, text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { recipient: { id: sender_psid }, message: { text: text } });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log("Server Live"));
