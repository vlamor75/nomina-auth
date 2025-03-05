const express = require('express');
const { Issuer } = require('openid-client');
const session = require('express-session');
const path = require('path');
const cors = require('cors'); // Necesitarás instalar este paquete
const app = express();
require('dotenv').config();

// Configurar CORS para permitir peticiones desde la app React
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true // Importante para permitir cookies entre dominios
}));

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
    cookie: { 
        secure: false, // En producción, usa true con HTTPS
        sameSite: 'lax', // Ayuda con CORS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Configuración de Cognito
const clientId = process.env.COGNITO_CLIENT_ID;
const clientSecret = process.env.COGNITO_CLIENT_SECRET;
const redirectUri = process.env.COGNITO_REDIRECT_URI || 'http://localhost:3001/callback';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const reactAppUrl = process.env.REACT_APP_URL || 'http://localhost:3000';

// Imprimir variables para debug
console.log('Configuración de Cognito:');
console.log('User Pool ID:', userPoolId);
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
console.log('React App URL:', reactAppUrl);

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
        
        // Guardar la URL de redirección después del login (para después redirigir a React)
        req.session.postLoginRedirect = req.query.redirect || `${reactAppUrl}/dashboard`;
        
        // Ajustando los scopes para adaptarnos a lo permitido por tu configuración de Cognito
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
        
        // Redirigir a la aplicación React o a donde sea necesario
        const redirectTo = req.session.postLoginRedirect || `${reactAppUrl}/dashboard`;
        delete req.session.postLoginRedirect;
        
        res.redirect(redirectTo);
    } catch (error) {
        console.error('Error en el callback de Cognito:', error);
        res.status(500).send('Error en el callback: ' + error.message);
    }
});

// API para obtener información del usuario autenticado
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userInfo) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    
    const userData = {
        isAuthenticated: true,
        usuario: {
            id: req.session.userInfo.sub,
            nombre: req.session.userInfo.name,
            email: req.session.userInfo.email,
            apodo: req.session.userInfo.nickname,
            telefono: req.session.userInfo.phone_number,
            // Agregar otros campos necesarios
        },
        tokens: {
            // Opcional: incluir tokens si son necesarios en el frontend
            // Nota: no incluyas el id_token completo por seguridad
            expires_at: req.session.tokenSet?.expires_at
        }
    };
    
    res.json(userData);
});

// Ruta para la página principal
app.get('/home', (req, res) => {
    const isAuthenticated = !!req.session.userInfo;
    
    // Crear una página HTML básica
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
            .btn { display: inline-block; padding: 10px 15px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenido</h1>
                ${isAuthenticated 
                  ? '<a class="btn" href="/logout">Cerrar sesión</a>' 
                  : '<a class="btn" href="/login">Iniciar sesión</a>'}
            </div>
            
            ${isAuthenticated 
              ? `<div class="user-info">
                    <h2>Información del usuario</h2>
                    <p>Usuario: ${req.session.userInfo.name || req.session.userInfo.sub || 'N/A'}</p>
                    <p><a class="btn" href="${reactAppUrl}/dashboard">Ir al Dashboard</a></p>
                    <p><a href="/dashboard">Ver información de usuario</a></p>
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
    // Crear una página HTML para mostrar la información del usuario
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .user-info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .json { background: #e0e0e0; padding: 10px; border-radius: 3px; overflow-x: auto; }
            .btn { display: inline-block; padding: 10px 15px; background: #1976d2; color: white; text-decoration: none; border-radius: 4px; margin: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Dashboard</h1>
                <div>
                    <a class="btn" href="${reactAppUrl}/dashboard">Ir a React Dashboard</a>
                    <a class="btn" href="/logout">Cerrar sesión</a>
                </div>
            </div>
            
            <div class="user-info">
                <h2>Información del usuario</h2>
                <p>Usuario: ${req.session.userInfo.name || 'N/A'}</p>
                <div class="json">
                    <pre>${JSON.stringify(req.session.userInfo, null, 2)}</pre>
                </div>
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
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/home');
    });
});

// Iniciar el servidor
const PORT = 3001; // Forzamos el puerto 3001 como solicitaste
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`URL de login: http://localhost:${PORT}/login`);
});