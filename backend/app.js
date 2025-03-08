const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { requireAuth } = require('./middleware/auth');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "nomina_prueba",
    password: process.env.DB_PASSWORD || "N0m1n@",
    port: process.env.DB_PORT || 5432,
});

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

app.use(session({
    store: new pgSession({
        pool: pool,
        ttl: 24 * 60 * 60,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'tu-secreto-seguro',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Servidor funcionando!');
});

// Ruta para iniciar el flujo de autenticación con Cognito
app.get('/login', (req, res) => {
    const clientId = process.env.COGNITO_CLIENT_ID; // Agrega tu Client ID de Cognito
    const redirectUri = 'http://localhost:3000/callback'; // URL de callback después de login
    const cognitoDomain = process.env.COGNITO_DOMAIN; // Ejemplo: tu-dominio.auth.us-east-1.amazoncognito.com

    const loginUrl = `https://${cognitoDomain}/login?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email+openid+profile`;

    res.redirect(loginUrl);
});

// Ruta de callback para manejar el código de Cognito
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ error: 'Código de autorización no proporcionado' });
    }

    try {
        const clientId = process.env.COGNITO_CLIENT_ID;
        const clientSecret = process.env.COGNITO_CLIENT_SECRET; // Si tienes Client Secret
        const redirectUri = 'http://localhost:3000/callback';
        const cognitoDomain = process.env.COGNITO_DOMAIN;

        const tokenUrl = `https://${cognitoDomain}/oauth2/token`;
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                code: code,
                redirect_uri: redirectUri
            }).toString()
        });

        const tokenData = await response.json();
        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error });
        }

        // Obtener información del usuario con el token
        const userInfoUrl = `https://${cognitoDomain}/oauth2/userInfo`;
        const userResponse = await fetch(userInfoUrl, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        const userInfo = await userResponse.json();

        // Guardar la información del usuario en la sesión
        req.session.userInfo = {
            email: userInfo.email,
            name: userInfo.name,
            phone_number: userInfo.phone_number
        };

        // Redirigir al frontend después de autenticar
        res.redirect('http://localhost:3000/empresa');
    } catch (error) {
        console.error('Error en callback:', error);
        res.status(500).json({ error: 'Error al autenticar', details: error.message });
    }
});

// Ruta protegida para crear empresa
app.post('/api/empresa', requireAuth, async (req, res) => {
    try {
        const { empresa, contacto, email, celular, direccion, departamento_id, municipio_id, nit, tipo_empresa_id } = req.body;

        if (!empresa || !contacto || !email || !celular || !direccion || !departamento_id || !municipio_id || !tipo_empresa_id) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const userEmail = req.session.userInfo.email;

        const result = await pool.query(
            `SELECT cliente_base.crear_empresa($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [empresa, contacto, email, celular, direccion, departamento_id, municipio_id, nit, tipo_empresa_id]
        );

        const empresaId = result.rows[0].crear_empresa;

        res.status(201).json({ mensaje: 'Empresa registrada y esquema creado', empresaId });
    } catch (error) {
        console.error('Error al crear empresa:', error);
        res.status(500).json({ error: 'Error al crear la empresa', details: error.message });
    }
});

// Ruta protegida para eliminar empresa
app.delete('/api/empresa/:id', requireAuth, async (req, res) => {
    try {
        const empresaId = req.params.id;
        const userEmail = req.session.userInfo.email;
        const empresaCheck = await pool.query(
            'SELECT email FROM cliente_base.empresa WHERE id = $1',
            [empresaId]
        );
        if (empresaCheck.rows.length === 0 || empresaCheck.rows[0].email !== userEmail) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta empresa' });
        }

        await pool.query(
            'SELECT cliente_base.eliminar_empresa($1)',
            [empresaId]
        );

        res.status(200).json({ mensaje: 'Empresa y esquema eliminados correctamente' });
    } catch (error) {
        console.error('Error al eliminar empresa:', error);
        res.status(500).json({ error: 'Error al eliminar la empresa', details: error.message });
    }
});

// Ruta protegida para obtener el esquema del usuario
app.get('/api/user-schema', requireAuth, async (req, res) => {
    try {
        const userEmail = req.session.userInfo.email;
        const result = await pool.query(
            'SELECT id FROM cliente_base.empresa WHERE email = $1',
            [userEmail]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró una empresa asociada a este usuario' });
        }
        const empresaId = result.rows[0].id;
        const schemaName = `empresa_${empresaId}`;
        res.json({ schema: schemaName });
    } catch (error) {
        console.error('Error al obtener esquema:', error);
        res.status(500).json({ error: 'Error al obtener el esquema', details: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;