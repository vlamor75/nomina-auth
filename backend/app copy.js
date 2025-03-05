const express = require('express');
const { Issuer } = require('openid-client');
const session = require('express-session');
const path = require('path');
const app = express();
require('dotenv').config();

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use('/images', express.static(path.join(__dirname, 'views/images')));

// Configurar sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // En producción, usa true con HTTPS
}));

// Configuración de Cognito
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
const redirectUri = process.env.COGNITO_REDIRECT_URI || 'http://localhost:3001/callback';
const userPoolId = process.env.COGNITO_USER_POOL_ID;

// Imprimir variables para debug
console.log('Configuración de Cognito:');
console.log('User Pool ID:', userPoolId);
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);

// Función para inicializar el cliente de Cognito
async function initializeCognitoClient() {
    try {
        // Corregir la URL para el issuer
        const issuerUrl = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`;
        console.log(`Descubriendo issuer en: ${issuerUrl}`);
        
        const cognitoIssuer = await Issuer.discover(issuerUrl);
        console.log('Issuer descubierto exitosamente:', cognitoIssuer.metadata.issuer);
        
        const client = new cognitoIssuer.Client({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [redirectUri],
            response_types: ['code']
        });
        console.log('Cliente inicializado correctamente');
        return client;
    } catch (error) {
        console.error('Error al inicializar el cliente de Cognito:', error);
        throw error;
    }
};

// Ruta raíz para redireccionar a home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Ruta para iniciar sesión
app.get('/login', async (req, res) => {
    try {
        const client = await initializeCognitoClient();
        
        // Ajustando los scopes para adaptarnos a lo permitido por tu configuración de Cognito
        // Usar solo 'openid' como scope básico
        const authUrl = client.authorizationUrl({
            scope: 'openid',
            response_type: 'code',
            redirect_uri: redirectUri
        });
        
        console.log('URL de autenticación:', authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Error al redirigir a Cognito:', error);
        res.status(500).send('Error al redirigir a Cognito: ' + error.message);
    }
});

// Ruta para procesar el callback de Cognito
app.get('/callback', async (req, res) => {
    try {
        console.log('Callback recibido con parámetros:', req.query);
        
        if (req.query.error) {
            console.error('Error enviado por Cognito:', req.query.error, '-', req.query.error_description);
            return res.status(400).send(`Error de autenticación: ${req.query.error} - ${req.query.error_description || ''}`);
        }
        
        const client = await initializeCognitoClient();
        const params = client.callbackParams(req);
        console.log('Params extraídos:', params);
        
        const tokenSet = await client.callback(redirectUri, params);
        console.log('TokenSet obtenido correctamente');

        // Guardar tokens y datos del usuario en la sesión
        req.session.tokenSet = tokenSet;
        req.session.userInfo = tokenSet.claims();

        console.log('Usuario autenticado:', req.session.userInfo);
        
        // Redirigir a /home
        res.redirect('/home');
    } catch (error) {
        console.error('Error en el callback de Cognito:', error);
        res.status(500).send('Error en el callback: ' + error.message);
    }
});

// Ruta para la página principal
app.get('/home', (req, res) => {
    const isAuthenticated = !!req.session.userInfo;
    
    // Crear una página HTML básica si no tienes archivos EJS
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Home</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .user-info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenido</h1>
                ${isAuthenticated 
                  ? '<a href="/logout">Cerrar sesión</a>' 
                  : '<a href="/login">Iniciar sesión</a>'}
            </div>
            
            ${isAuthenticated 
              ? `<div class="user-info">
                    <h2>Información del usuario</h2>
                    <p>Usuario: ${req.session.userInfo.sub || 'N/A'}</p>
                    <p><a href="/dashboard">Ir al Dashboard</a></p>
                 </div>` 
              : '<p>Por favor inicia sesión para ver tu información.</p>'}
        </div>
    </body>
    </html>
    `;
    
    res.send(htmlContent);
});

// Middleware para proteger rutas
const requireAuth = (req, res, next) => {
    if (req.session.userInfo) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Ruta para el dashboard (protegida)
app.get('/dashboard', requireAuth, (req, res) => {
    // Crear una página HTML básica si no tienes archivos EJS
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .user-info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Dashboard</h1>
                <a href="/logout">Cerrar sesión</a>
            </div>
            
            <div class="user-info">
                <h2>Información del usuario</h2>
                <pre>${JSON.stringify(req.session.userInfo, null, 2)}</pre>
                <p><a href="/home">Volver al Inicio</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    res.send(htmlContent);
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    const cognitoLogoutUrl = `https://us-east-1v3ui3urrs.auth.us-east-1.amazoncognito.com/logout?client_id=4jmcmm89ocil96840h63pb36ph&logout_uri=http://localhost:3001/login`;
    
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect(cognitoLogoutUrl); // Redirige a Cognito para cerrar sesión completamente
    });
});


// Iniciar el servidor
const PORT = 3001; // Forzamos el puerto 3001 como solicitaste
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`URL de login: http://localhost:${PORT}/login`);
});