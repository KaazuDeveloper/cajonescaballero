import { Router } from 'express';
import { ObjectId } from 'mongodb';
import rateLimit from 'express-rate-limit';
import {
  addUsuario,
  delUsuario,
  enviarCodigo,
  getUsuario,
  getUsuarios,
  loginUsuario,
  updateUsuario,
} from '../controllers/usuarios.controllers.js';
import { addProducto, getProductos } from '../controllers/productos.controllers.js';
import { getMarca, getMarcas } from '../controllers/marcas.controllers.js';
import {
  addComentario,
  deleteComentario,
  getComentarios,
  getComentariosProducto,
} from '../controllers/comentarios.controllers.js';
import {
  addPedido,
  deletePedido,
  getPedidos,
  getPedidosUsuario,
  pago,
  updatePedido,
} from '../controllers/pedidos.controllers.js';
import { validacionPerfil, validacionRegistro } from '../validators/cajaCaballero.validator.js';
import { requireAdmin, requireAuth, requirePropietario } from '../middlewares/auth.js';

const router = Router();

const limite = (max) =>
  rateLimit({
    windowMs: 15 * 60_000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    message: { message: 'Demasiados intentos. Inténtalo más tarde.' },
  });

router.param('id', (req, res, next, id) =>
  ObjectId.isValid(id) ? next() : res.status(400).json({ message: 'Identificador no válido' }),
);

// Usuarios
router.post('/login', limite(20), loginUsuario);
router.post('/verify-code', limite(10), enviarCodigo);
router.post('/usuarios', limite(20), validacionRegistro, addUsuario);
router.get('/usuarios', requireAdmin, getUsuarios);
router.get('/usuarios/:id', requirePropietario, getUsuario);
router.put('/usuarios/:id', requirePropietario, validacionPerfil, updateUsuario);
router.delete('/usuarios/:id', requirePropietario, delUsuario);

// Productos y marcas
router.get('/productos', getProductos);
router.post('/productos', requireAdmin, addProducto);
router.get('/marcas', getMarcas);
router.get('/marcas/:id', getMarca);

// Comentarios
router.get('/comentarios', getComentarios);
router.get('/comentarios/:id', getComentariosProducto);
router.post('/comentarios', requireAuth, addComentario);
router.delete('/comentarios/:id', requireAdmin, deleteComentario);

// Pedidos
router.post('/crear-sesion-pago', requireAuth, pago);
router.post('/pedidos', requireAuth, addPedido);
router.get('/pedidos', requireAdmin, getPedidos);
router.get('/pedidos/:id', requirePropietario, getPedidosUsuario);
router.put('/pedidos/:id', requireAdmin, updatePedido);
router.delete('/pedidos/:id', requireAdmin, deletePedido);

export default router;
