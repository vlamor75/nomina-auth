import express from 'express';
import { crearCliente } from '../controllers/clienteController.js';
const router = express.Router();

router.post('/', crearCliente);

export default router;
