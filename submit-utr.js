const axios = require('axios');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, increment, getDoc } = require("firebase/firestore");

// Aapka Firebase Configuration
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
    // CORS Bypass
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            // Frontend se Order ID, UTR aur Amount aayega
            const { order_id, utr, amount } = req.body;

            if (!order_id || !utr) {
                return res.status(400).json({ success: false, message: 'Order ID and UTR are required.' });
            }

            // Divine Pay Submit UTR Payload
            const payload = {
                order_id: order_id,
                utr: utr
            };

            // Divine Pay UTR Verification API Hit Karein (Exact Headers with x-api-key)
            const response = await axios.post('https://divinepay.us.cc/api/payin/submit-utr', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'sk_live_1eac1f4567b5896b35552648d2d8e7f0a3a788e0269e9771'
                }
            });

            // Agar Gateway ne UTR Verify kar liya (Success)
            if (response.data && response.data.success) {
                
                // Humne order_id mein UserID chhupa rakhi thi (e.g., NEXA_20014035_12345)
                const parts = order_id.split('_');
                const userId = parts[1];

                // Automatically User ke Firebase wallet me balance add kar do
                if (userId && amount) {
                    const userRef = doc(db, "users", userId);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        await updateDoc(userRef, {
                            recharge: increment(parseFloat(amount))
                        });
                    }
                }

                return res.status(200).json({ 
                    success: true, 
                    message: 'Payment Verified Successfully by Gateway & Wallet Updated!', 
                    data: response.data.data 
                });
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: response.data.message || 'Invalid UTR or Payment not found.' 
                });
            }
        } catch (error) {
            console.error("Submit UTR Error:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, message: 'Internal Server Error while verifying UTR.' });
        }
    } else {
        return res.status(405).send('Method Not Allowed');
    }
};
