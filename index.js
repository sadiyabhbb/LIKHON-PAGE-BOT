const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 

app.get('/', (req, res) => {
    res.send("Bot Server is Running!");
});

// Webhook Verification
app.get('/webhook', (req, res) => {
    console.log("--- WEBHOOK VERIFICATION ATTEMPT ---");
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED Successfully");
        res.status(200).send(challenge);
    } else {
        console.error("VERIFICATION_FAILED: Token mismatch or missing params");
        res.sendStatus(403);
    }
});

app.post('/webhook', (req, res) => {
    let body = req.body;
    
    // ডাটা রিসিভ হলেই এটি প্রিন্ট হবে
    console.log("--- NEW WEBHOOK EVENT RECEIVED ---");
    // console.log(JSON.stringify(body, null, 2)); // সব ডাটা দেখতে চাইলে এটি আনকমেন্ট করুন

    if (body.object === 'page') {
        body.entry.forEach(function(entry) {
            
            // ১. মেসেঞ্জার মেসেজ চেক
            if (entry.messaging && entry.messaging.length > 0) {
                console.log("Event Type: Messaging (Inbox)");
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    console.log(`Received Message: "${webhook_event.message.text}" from PSID: ${sender_psid}`);
                    sendTextMessage(sender_psid, "হ্যালো! আমি আপনার বট।");
                }
            }

            // ২. কমেন্ট বা ফিড চেঞ্জ চেক
            if (entry.changes) {
                console.log("Event Type: Feed Change (Comment/Post)");
                entry.changes.forEach(change => {
                    console.log(`Change Field: ${change.field}, Verb: ${change.value.verb}, Item: ${change.value.item}`);
                    
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let user_name = change.value.from ? change.value.from.name : "Unknown User";
                        let comment_text = change.value.message;

                        console.log(`Action: New Comment detected!`);
                        console.log(`From: ${user_name}`);
                        console.log(`Text: ${comment_text}`);
                        console.log(`Comment ID: ${comment_id}`);
                        
                        sendCommentReaction(comment_id);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        console.error("EVENT_NOT_FROM_PAGE: Object is not 'page'");
        res.sendStatus(404);
    }
});

// কমেন্টে লাইক দেওয়ার ফাংশন
function sendCommentReaction(comment_id) {
    console.log(`Attempting to like comment: ${comment_id}...`);
    const url = `https://graph.facebook.com/v21.0/${comment_id}/likes?access_token=${PAGE_ACCESS_TOKEN}`;
    
    axios.post(url)
        .then(() => {
            console.log(`✅ SUCCESS: Comment ${comment_id} liked successfully.`);
        })
        .catch(err => {
            console.error('❌ REACTION ERROR:');
            if (err.response) {
                console.error('Data:', err.response.data);
            } else {
                console.error('Message:', err.message);
            }
        });
}

// মেসেজ পাঠানোর ফাংশন
function sendTextMessage(sender_psid, response_text) {
    console.log(`Attempting to send message to ${sender_psid}...`);
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    const data = {
        recipient: { id: sender_psid },
        message: { text: response_text }
    };

    axios.post(url, data)
        .then(() => {
            console.log(`✅ SUCCESS: Message sent to PSID: ${sender_psid}`);
        })
        .catch(err => {
            console.error('❌ SEND MESSAGE ERROR:');
            if (err.response) {
                console.error('Data:', err.response.data);
            } else {
                console.error('Message:', err.message);
            }
        });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log("=========================================");
    console.log(`SERVER IS LIVE ON PORT ${PORT}`);
    console.log("=========================================");
});
