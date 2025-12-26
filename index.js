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
    "আপনার কমেন্টটি আমরা পেয়েছি। আমাদের টিম আপনার সাথে শীঘ্রই কথা বলবে!"
];

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
            
            // ইনবক্সে মেসেজ দিলে রিপ্লাই চেক
            if (entry.messaging) {
                let event = entry.messaging[0];
                let sender_psid = event.sender.id;
                if (event.message && event.message.text) {
                    console.log(`Message received from: ${sender_psid}`);
                    sendTextMessage(sender_psid, "✅ পেজ বট সফলভাবে কাজ করছে!");
                }
            }

            // কমেন্ট হ্যান্ডেল করা
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        let randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];

                        console.log(`New comment detected! ID: ${comment_id} by ${commenter_name}`);

                        // ইনবক্সে প্রাইভেট রিপ্লাই পাঠানো
                        sendPrivateReply(comment_id, randomText);

                        // অ্যাডমিনকে জানানো
                        sendTextMessage(MY_PSID, `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${change.value.message}`);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// ইনবক্সে প্রাইভেট রিপ্লাই পাঠানোর ফাংশন (Error log সহ)
function sendPrivateReply(comment_id, message) {
    const url = `https://graph.facebook.com/v21.0/${comment_id}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message })
        .then(response => {
            console.log("✅ Private Reply Sent Successfully!");
        })
        .catch(err => {
            console.log("❌ Private Reply Error:");
            if (err.response) {
                // ফেসবুক থেকে আসা আসল সমস্যাটি এখানে প্রিন্ট হবে
                console.log("Status Code:", err.response.status);
                console.log("Error Message:", err.response.data.error.message);
                console.log("Error Type:", err.response.data.error.type);
            } else {
                console.log("Network Error:", err.message);
            }
        });
}

// টেক্সট মেসেজ পাঠানোর ফাংশন
function sendTextMessage(recipient_id, text) {
    const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, {
        recipient: { id: recipient_id },
        message: { text: text }
    }).catch(err => {
        console.log("❌ Message Error:", err.response ? err.response.data.error.message : err.message);
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server is running. Check logs for details."));
