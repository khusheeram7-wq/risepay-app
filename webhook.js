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
    // Webhook POST request hi accept karega
    if (req.method === 'POST') {
        try {
            // Payload Schema (As per Screenshot image_34.png)
            const { type, status, orderAmount, realAmount, order_id, platOrderNum, utr } = req.body;

            // ==========================================
            // LOGIC FOR DEPOSIT (PAYIN)
            // ==========================================
            if (type === 'PAYIN') {
                if (status === 'success' && order_id) {
                    // Humne order_id "NEXA_{userId}_{timestamp}" format me banaya tha
                    const parts = order_id.split('_');
                    const userId = parts[1]; 

                    if (userId && realAmount) {
                        const userRef = doc(db, "users", userId);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            // User ke firebase account mein balance auto-add kar diya
                            await updateDoc(userRef, {
                                recharge: increment(parseFloat(realAmount))
                            });
                        }
                    }
                }
            } 
            // ==========================================
            // LOGIC FOR WITHDRAWAL (PAYOUT)
            // ==========================================
            else if (type === 'PAYOUT') {
                if (status === 'success' && platOrderNum) {
                    console.log(`Payout successfully processed! Order: ${platOrderNum} | UTR: ${utr}`);
                    // Yahan future mein aapke Firebase withdrawal logs update karne ka code aa jayega
                }
            }

            // MANDATORY RESPONSE FOR GATEWAY
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error("Webhook processing error:", error.message);
            // Error hone par bhi 200 bhejna behtar hai taaki gateway baar baar hit na kare
            return res.status(200).json({ success: false, message: error.message });
        }
    } else {
        return res.status(405).send('Method Not Allowed');
    }
};
