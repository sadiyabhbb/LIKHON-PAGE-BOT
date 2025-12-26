const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express().use(bodyParser.json());

// আপনার ক্রেডেনশিয়ালস
const PAGE_ACCESS_TOKEN = 'EAAKgn1aOproBQeEZCP4LEKW792NGPZAnGjVp1Q4uS4ac33oOgo1q7tx9MVZC0rMXF7pkTarh0GhIZCMJriUDlwpPBL19T1BMyHDeAhwelZCnlHAc7NBKQKNX1PRi0z9zCLQhlp3oXYUdShC0rP7kZBYfN37y8H02LC3iYV0PVh291DnA6Bg0cHSIEZAg9ALLFp53ZAfVk8rAZBgZDZD'; 
const VERIFY_TOKEN = 'likhon0123'; 
const MY_PSID = '25704185332538480'; 

// র‍্যান্ডম মেসেজ লিস্ট
const randomMessages = [
    "হ্যালো! কমেন্ট করার জন্য ধন্যবাদ। আমরা আপনার ইনবক্সে বিস্তারিত পাঠাচ্ছি।",
    "ধন্যবাদ আমাদের পোস্টে সাড়া দেওয়ার জন্য! আমরা আপনার সাথে যোগাযোগ করছি।",
    "আপনার কমেন্টটি আমরা পেয়েছি। আমাদের টিম আপনার সাথে শীঘ্রই কথা বলবে!",
    "হ্যালো! আমাদের পেজে যুক্ত থাকার জন্য ধন্যবাদ। আপনার ইনবক্স চেক করুন।"
];

// ১. সার্ভার চেক করার জন্য হোম রুট
app.get('/', (req, res) => res.send("Bot Server is Online (v24.0) 🚀"));

// ২. ফেসবুক ওয়েবহুক ভেরিফিকেশন
app.get('/webhook', (req, res) => {
    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// ৩. ওয়েবহুক মেইন লজিক (কমেন্ট এবং ইনবক্স হ্যান্ডেল)
app.post('/webhook', (req, res) => {
    let body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            
            // ইনবক্সে মেসেজ আসলে অটো-রিপ্লাই (বট টেস্ট করার জন্য)
            if (entry.messaging) {
                let event = entry.messaging[0];
                let sender_psid = event.sender.id;
                if (event.message && event.message.text) {
                    console.log(`Message from: ${sender_psid}`);
                    sendTextMessage(sender_psid, "✅ পেজ বটটি এখন লাইভ এবং কাজ করছে!");
                }
            }

            // কেউ কমেন্ট করলে তাকে ইনবক্স করা
            if (entry.changes) {
                entry.changes.forEach(change => {
                    if (change.field === 'feed' && change.value.item === 'comment' && change.value.verb === 'add') {
                        let comment_id = change.value.comment_id;
                        let commenter_name = change.value.from ? change.value.from.name : "ইউজার";
                        let randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];

                        console.log(`New comment by ${commenter_name}. Sending Private Reply...`);

                        // কমেন্টকারীকে ইনবক্সে মেসেজ পাঠানো
                        sendPrivateReply(comment_id, randomText);

                        // অ্যাডমিনকে (আপনাকে) ইনবক্সে অ্যালার্ট দেওয়া
                        sendTextMessage(MY_PSID, `🔔 নতুন কমেন্ট!\n👤 নাম: ${commenter_name}\n💬 কমেন্ট: ${change.value.message}`);
                    }
                });
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    }
});

// কমেন্টকারীকে প্রাইভেট রিপ্লাই দেওয়ার ফাংশন
function sendPrivateReply(comment_id, message) {
    const url = `https://graph.facebook.com/v24.0/${comment_id}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, { message: message })
        .then(() => console.log("✅ Private Reply Sent!"))
        .catch(err => {
            console.log("❌ Private Reply Error:", err.response ? err.response.data.error.message : err.message);
        });
}

// সাধারণ টেক্সট মেসেজ পাঠানোর ফাংশন
function sendTextMessage(recipient_id, text) {
    const url = `https://graph.facebook.com/v24.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
    axios.post(url, {
        recipient: { id: recipient_id },
        message: { text: text }
    }).catch(err => {
        console.log("❌ Msg Error:", err.response ? err.response.data.error.message : err.message);
    });
}

// পোর্ট সেটআপ
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
