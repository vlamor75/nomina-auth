const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Proteger la ruta del dashboard
router.get('/', (req, res, next) => {
    if (req.session.tokenSet) {
        next(); // Si el usuario está autenticado, pasa al controlador
    } else {
        res.redirect('/login'); // Si no, redirige al login
    }
}, dashboardController.showDashboard);

module.exports = router;