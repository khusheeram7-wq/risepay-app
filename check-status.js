const axios = require('axios');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, increment, getDoc } = require("firebase/firestore");

// Aapka Same Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHoR7wojkpTZZPR-gcfDnPW8aOTuoiaAU",
    authDomain: "nexapay-342d0.firebaseapp.com",
    databaseURL: "https://nexapay-342d0-default-rtdb.firebaseio.com",
    projectId: "nexapay-342d0",
    storageBucket: "nexapay-342d0.firebasestorage.app",
    messagingSenderId: "305096071099",
    appId: "1:305096071099:web:3db1e75a2669adbcae569e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = async (req, res) => {
    // CORS Bypass Server Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { order_id } = req.body;

            if (!order_id) {
                return res.status(400).json({ success: false, message: 'Order ID is mandatory to check status.' });
            }

            const payload = {
                order_id: order_id
            };

            // Divine Pay Status API Hit Karein
            const response = await axios.post('https://divinepay.us.cc/api/payin/status', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'sk_live_1eac1f4567b5896b35552648d2d8e7f0a3a788e0269e9771'
                }
            });

            // Gateway Response Logic
            if (response.data && response.data.success) {
                const statusData = response.data.data;

                // Agar Payment SUCCESS ho chuki hai
                if (statusData.status === 'success') {
                    // Humne order_id mein UserID rakhi thi (e.g., NEXA_20014035_12345)
                    const parts = order_id.split('_');
                    const userId = parts[1];

                    // Firebase mein balance instantly update karein
                    if (userId && statusData.amount) {
                        const userRef = doc(db, "users", userId);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            await updateDoc(userRef, {
                                recharge: increment(parseFloat(statusData.amount))
                            });
                        }
                    }
                }

                // Frontend ko final status wapas bhej dein
                return res.status(200).json({ 
                    success: true, 
                    message: `Current Status: ${statusData.status.toUpperCase()}`,
                    data: statusData
                });

            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: response.data.message || 'Status fetch failed from gateway.' 
                });
            }
        } catch (error) {
            console.error("Status API Breakdown:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, message: 'Internal Server Error in status polling.' });
        }
    } else {
        return res.status(405).send('Method Not Allowed');
    }
};
