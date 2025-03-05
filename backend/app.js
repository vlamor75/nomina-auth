const express = require('express');
const { Issuer } = require('openid-client');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Configuración de CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// ✅ Configuración de sesión con almacenamiento en memoria
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new session.MemoryStore(), // Almacena las sesiones en memoria
    cookie: {
        secure: false, // Debe ser 'false' en localhost
        sameSite: 'lax', // Permite enviar cookies sin restricciones
        httpOnly: true
    }
}));

const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
const redirectUri = process.env.COGNITO_REDIRECT_URI || 'http://localhost:3001/callback';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const reactAppUrl = process.env.REACT_APP_URL || 'http://localhost:3000';

// ✅ Función para inicializar Cognito
async function initializeCognitoClient() {
    try {
        const issuerUrl = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`;
        const cognitoIssuer = await Issuer.discover(issuerUrl);
        return new cognitoIssuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [redirectUri],
            response_types: ['code']
        });
    } catch (error) {
        console.error('Error al inicializar Cognito:', error);
        throw error;
    }
}

// ✅ Middleware para verificar autenticación
const requireAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
};

// ✅ Ruta de Login: Verifica si ya hay sesión antes de redirigir a Cognito
app.get('/login', async (req, res) => {
    try {
        if (req.session.userInfo) {
            console.log('Sesión ya activa, redirigiendo al Dashboard...');
            return res.redirect(`${reactAppUrl}/dashboard`);
        }

        const client = await initializeCognitoClient();
        req.session.postLoginRedirect = req.query.redirect || `${reactAppUrl}/dashboard`;

        // 🔹 Se agrega `lang=es` para forzar español en Cognito
        const authUrl = client.authorizationUrl({
            scope: 'openid',
            response_type: 'code',
            redirect_uri: redirectUri
        }) + "&lang=es";

        console.log('Redirigiendo a Cognito:', authUrl);
        res.redirect(authUrl);
    } catch (error) {
        res.status(500).send('Error en login: ' + error.message);
    }
});


// ✅ Ruta de Callback: Guarda la sesión antes de redirigir
app.get('/callback', async (req, res) => {
    try {
        const client = await initializeCognitoClient();
        const params = client.callbackParams(req);
        const tokenSet = await client.callback(redirectUri, params);
        
        req.session.tokenSet = tokenSet;
        req.session.userInfo = tokenSet.claims();
        
        console.log('Usuario autenticado:', req.session.userInfo);

        // ✅ Guarda la sesión antes de redirigir al frontend
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
                return res.status(500).send('Error al guardar la sesión');
            }
            res.redirect(`${reactAppUrl}/dashboard`);
        });

    } catch (error) {
        res.status(500).send('Error en el callback: ' + error.message);
    }
});

// ✅ Ruta para verificar si el usuario está autenticado
app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ isAuthenticated: true, userInfo: req.session.userInfo });
});

// ✅ Ruta de Logout: Elimina la sesión y redirige a Cognito para cerrar sesión
app.get('/logout', (req, res) => {
    if (!req.session) {
        console.log("No hay sesión activa.");
    }

    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }

        console.log("Sesión eliminada, redirigiendo a Cognito...");

        // ✅ Usa la URL correcta de logout de Cognito
        const logoutUrl = `https://us-east-1v3ui3urrs.auth.us-east-1.amazoncognito.com/logout?client_id=${clientId}&logout_uri=http://localhost:3000/login`;
        res.redirect(logoutUrl);
    });
});



// ✅ Iniciar el servidor
app.listen(3001, () => console.log('Servidor en http://localhost:3001'));
