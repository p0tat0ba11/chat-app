const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // 取得 Bearer token

    if (!token) return res.status(401).json({ error: '未提供 Token' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token 無效或過期' });
        req.user = user; // 將 token 解析後的使用者資訊附加到 req
        next();
    });
}

module.exports = { authenticate };