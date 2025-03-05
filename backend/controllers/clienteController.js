import { pool } from '../config/db.js';

export const crearCliente = async (req, res) => {
    try {
        const { nombre, email } = req.body;

        if (!nombre || !email) {
            return res.status(400).json({ error: 'Nombre y email son obligatorios' });
        }

        const result = await pool.query(
            "INSERT INTO cliente_base.clientes (nombre, email) VALUES ($1, $2) RETURNING id",
            [nombre, email]
        );

        const clienteId = result.rows[0].id;
        await pool.query("SELECT cliente_base.crear_esquema_cliente($1)", [clienteId]);

        res.status(201).json({ mensaje: "Cliente registrado y esquema creado", clienteId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
