exports.showDashboard = (req, res) => {
    const userInfo = req.session.user; // Información del usuario desde la sesión
    res.render('dashboard', {
        userInfo: {
            username: userInfo.preferred_username || userInfo.sub,
            email: userInfo.email
        }
    });
};