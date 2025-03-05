const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();


const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "nomina_prueba",
    password: "N0m1n@",
    port: 5432
});



const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('¡Servidor funcionando!');
});

const PORT = process.env.PORT || 5000;

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: 'Conexión exitosa con la base de datos', timestamp: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: 'Error conectando a la base de datos', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
