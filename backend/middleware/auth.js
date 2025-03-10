const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userInfo || !req.session.userInfo.email) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
};

module.exports = { requireAuth };