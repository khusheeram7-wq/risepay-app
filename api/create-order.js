module.exports = async (req, res) => {
    // CORS Bypass
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight request handle
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { amount, userId } = req.body;
            
            const orderId = `NEXA_${userId}_${Date.now()}`;

            const payload = {
                amount: parseFloat(amount),
                order_id: orderId,
                currency: 'INR',
                redirect_url: `https://risepay-app.vercel.app/deposit.html`, 
                webhook_url: `https://risepay-app.vercel.app/api/webhook`
            };

            // AXIOS hata diya, inbuilt Fetch use kar rahe hain (Yeh kabhi crash nahi hoga)
            const response = await fetch('https://divinepay.us.cc/api/payin/payin/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'sk_live_1eac1f4567b5896b35552648d2d8e7f0a3a788e0269e9771'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data && data.payment_url) {
                return res.status(200).json({ success: true, payment_url: data.payment_url, orderId });
            } else {
                return res.status(400).json({ success: false, message: 'Gateway response missing payment_url.' });
            }
        } catch (error) {
            console.error("Gateway Error Details:", error.message);
            return res.status(500).json({ success: false, message: 'Internal Gateway Error' });
        }
    } else {
        // Agar koi browser me direct link kholega toh yeh dikhega
        return res.status(405).send('Method Not Allowed. Backend is live! Please use the App to make payments.');
    }
};
