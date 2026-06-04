const axios = require('axios');

module.exports = async (req, res) => {
    // CORS bypass
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { amount, userId } = req.body;
            
            // Order ID generation
            const orderId = `NEXA_${userId}_${Date.now()}`;

            // ⚠️ Yahan body mein se API key hata di gayi hai (Docs ke mutabiq)
            const payload = {
                order_id: orderId,
                amount: parseFloat(amount).toFixed(2),
                currency: 'INR',
                redirect_url: `https://risepay-app.vercel.app/deposit.html`, 
                webhook_url: `https://risepay-app.vercel.app/api/webhook`
            };

            // ⚠️ Asli Jaadu Yahan Hai: Authorization Header
            const response = await axios.post('https://divinepay.us.cc/api/payin/payin/create', payload, {
                headers: { 
                    'Content-Type': 'application/json',
                    // APNI SECRET KEY YAHAN DAALEIN (Bearer aur space ke baad)
                    'Authorization': `Bearer sk_live_1eac1f4567b5896b35552648d2d8e7f0a3a788e0269e9771` 
                }
            });

            if (response.data && response.data.payment_url) {
                return res.status(200).json({ success: true, payment_url: response.data.payment_url, orderId });
            } else {
                return res.status(400).json({ success: false, message: 'Gateway integration signature mismatch.' });
            }
        } catch (error) {
            // Error trace karne ke liye backend console log
            console.error("Gateway Error Details:", error.response ? error.response.data : error.message);
            return res.status(500).json({ success: false, message: 'Internal Gateway Error' });
        }
    } else {
        return res.status(405).send('Method Not Allowed');
    }
};
