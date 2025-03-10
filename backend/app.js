const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const session = require('express-session');
// Es posible que necesites instalar node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Importar funciones de esquema (manera actualizada)
const schemaUtils = require('./utils/schemaUtils');

// Configurar variables de entorno
dotenv.config();

// Crear la conexión a la base de datos
console.log("DB Connection Config:", {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? "******" : undefined, // No mostrar la contraseña real
    port: process.env.DB_PORT || 5432
});

// Si la contraseña no está definida, establecer un valor por defecto
if (!process.env.DB_PASSWORD) {
    console.error("DB_PASSWORD no está definido en el archivo .env");
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    }
});

// Prueba de conexión a la base de datos
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conexión a la base de datos exitosa:', res.rows[0]);
    }
});

// Crear tabla session en el esquema cliente_base en lugar de público
pool.query(`
  CREATE TABLE IF NOT EXISTS "cliente_base"."session" (
    "sid" varchar NOT NULL,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  )
`, (err, res) => {
  if (err) {
    console.error('Error al crear tabla session en cliente_base:', err);
  } else {
    console.log('Tabla session verificada/creada en esquema cliente_base');
  }
});

// Middleware de autenticación
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userInfo || !req.session.userInfo.email) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    next();
};

// Crear una función que cierre sobre el pool para el middleware useUserSchema
const useUserSchema = (req, res, next) => {
    return schemaUtils.useUserSchema(pool, req, res, next);
};

const app = express();

// Configurar CORS
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Configurar sesiones (sin almacenamiento en BD por ahora)
app.use(session({
    secret: process.env.SESSION_SECRET,
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
    // Verificar si ya está autenticado
    if (req.session.userInfo) {
        return res.redirect('http://localhost:3000/dashboard'); // Redirigir al dashboard si ya está autenticado
    }

    const clientId = process.env.COGNITO_CLIENT_ID || '4jmcmm89ocil96840h63pb36ph';
    const redirectUri = 'http://localhost:3001/callback'; // Importante: debe coincidir con lo configurado en Cognito
    const cognitoDomain = process.env.COGNITO_DOMAIN || 'us-east-1v3ui3urrs.auth.us-east-1.amazoncognito.com';

    
    
    const loginUrl = `https://${cognitoDomain}/oauth2/authorize?client_id=${clientId}&response_type=code&scope=email+openid&redirect_uri=${encodeURIComponent(redirectUri)}`;

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
        const clientSecret = process.env.COGNITO_CLIENT_SECRET;
        const redirectUri = 'http://localhost:3001/callback';
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
            console.error('Error en respuesta de token:', tokenData);
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
        console.log('Información de usuario obtenida:', userInfo);

        // Configurar el esquema para este usuario (pasando el pool)
        const schemaInfo = await schemaUtils.setupUserSchema(
            pool,  // Pasar el pool como primer argumento
            userInfo.email, 
            userInfo.name, 
            userInfo.phone_number
        );

        // Guardar la información del usuario y esquema en la sesión
        req.session.userInfo = {
            email: userInfo.email,
            name: userInfo.name,
            phone_number: userInfo.phone_number,
            empresaId: schemaInfo.empresaId,
            empresaNombre: schemaInfo.empresaNombre,
            schemaName: schemaInfo.schemaName
        };
        req.session.tokenSet = tokenData;

        console.log('Redirigiendo al dashboard después de autenticar');
        // Redirigir al dashboard del frontend después de autenticar
        res.redirect('http://localhost:3000/dashboard');
    } catch (error) {
        console.error('Error en callback:', error);
        res.status(500).json({ error: 'Error al autenticar', details: error.message });
    }
});

// Ruta para obtener información del usuario autenticado
app.get('/api/auth/me', (req, res) => {
    console.log('Solicitud a /api/auth/me. Sesión:', req.session.userInfo ? 'Existe' : 'No existe');
    if (req.session.userInfo && req.session.userInfo.email) {
        res.json({
            isAuthenticated: true,
            userInfo: req.session.userInfo
        });
    } else {
        res.json({
            isAuthenticated: false
        });
    }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    // Guardar el ID del cliente antes de destruir la sesión
    const clientId = process.env.COGNITO_CLIENT_ID || '4jmcmm89ocil96840h63pb36ph';
    const cognitoDomain = process.env.COGNITO_DOMAIN || 'us-east-1v3ui3urrs.auth.us-east-1.amazoncognito.com';
    const logoutUri = 'http://localhost:3001/login';
    
    // Destruir la sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        
        // Redirigir a la página de logout de Cognito
        const logoutUrl = `https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
        res.redirect(logoutUrl);
    });
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
        const schemaName = `empresa_${empresaId}`;
        
        console.log(`Iniciando eliminación de empresa ${empresaId} con esquema ${schemaName}`);
        
        // Verificar que la empresa pertenezca al usuario
        const empresaCheck = await pool.query(
            'SELECT email FROM cliente_base.empresa WHERE id = $1',
            [empresaId]
        );
        
        if (empresaCheck.rows.length === 0 || empresaCheck.rows[0].email !== userEmail) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta empresa' });
        }

        // IMPORTANTE: Intentar eliminar el esquema directamente con comillas dobles en el nombre
        console.log(`Intentando eliminar esquema "${schemaName}"...`);
        try {
            await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
            console.log(`Esquema "${schemaName}" eliminado correctamente (o no existía)`);
        } catch (schemaError) {
            console.error(`Error al eliminar esquema "${schemaName}":`, schemaError);
        }
        
        // Ahora eliminar el registro de la empresa
        console.log(`Eliminando registro de empresa ${empresaId}...`);
        await pool.query('DELETE FROM cliente_base.empresa WHERE id = $1', [empresaId]);
        console.log(`Registro de empresa ${empresaId} eliminado correctamente`);

        // Limpiar la información del usuario en la sesión
        if (req.session.userInfo && req.session.userInfo.empresaId === parseInt(empresaId)) {
            delete req.session.userInfo.empresaId;
            delete req.session.userInfo.empresaNombre;
            delete req.session.userInfo.schemaName;
            console.log('Información de la empresa eliminada de la sesión');
        }

        res.status(200).json({ 
            mensaje: 'Empresa eliminada correctamente',
            schemaEliminado: true
        });
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

// Ruta para obtener información del usuario y su esquema
app.get('/api/user-context', requireAuth, (req, res) => {
    if (!req.session || !req.session.userInfo) {
        return res.status(401).json({ isAuthenticated: false });
    }
    
    res.json({
        isAuthenticated: true,
        userInfo: {
            email: req.session.userInfo.email,
            name: req.session.userInfo.name,
            phone: req.session.userInfo.phone_number
        },
        empresa: {
            id: req.session.userInfo.empresaId,
            nombre: req.session.userInfo.empresaNombre,
            schema: req.session.userInfo.schemaName
        }
    });
});

// Ejemplo de ruta protegida que usa el esquema del usuario
app.get('/api/personas', requireAuth, useUserSchema, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM persona');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener datos de persona:', error);
        res.status(500).json({ error: 'Error al obtener datos', details: error.message });
    }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;