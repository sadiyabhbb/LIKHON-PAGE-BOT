const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 

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
            
            // ১. ইনবক্স মেসেজ হ্যান্ডেল করা (আগের মতো)
            if (entry.messaging && entry.messaging.length > 0) {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;
                if (webhook_event.message && webhook_event.message.text) {
                    sendTextMessage(sender_psid, "হ্যালো! আমি আপনার বট।");
                }
            }

            // ২. কমেন্টে অটো রিঅ্যাক্ট দেওয়ার নতুন লজিক
            if (entry.changes) {
                entry.changes.forEach(change => {
                    // চেক করা হচ্ছে এটি কমেন্ট কি না এবং নতুন কমেন্ট কি না
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        console.log("New comment detected! ID:", comment_id);
                        
                        // অটো লাইক দেওয়ার ফাংশন কল করা
                        sendCommentReaction(comment_id);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// কমেন্টে লাইক (Reaction) দেওয়ার ফাংশন
function sendCommentReaction(comment_id) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/likes?access_token=${PAGE_ACCESS_TOKEN}`;
    
    axios.post(url)
        .then(() => console.log(`Successfully liked comment: ${comment_id}`))
        .catch(err => {
            console.error('Reaction Error:', err.response ? err.response.data : err.message);
        });
}

function sendTextMessage(sender_psid, response_text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    const data = {
        recipient: { id: sender_psid },
        message: { text: response_text }
    };
    axios.post(url, data).catch(err => console.error('Error:', err.message));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));
