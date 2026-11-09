import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

const DURACION_TOKEN = '12h';

export const crearToken = (usuario) =>
  jwt.sign(
    { sub: usuario._id.toString(), nombre: usuario.nombre, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: DURACION_TOKEN, algorithm: 'HS256' },
  );

export const requireAuth = (req, res, next) => {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Debes iniciar sesión' });
  }
  try {
    req.usuario = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ message: 'Sesión caducada' });
  }
};

const esAdmin = (req) => req.usuario.rol === 'admin';

export const requireAdmin = [
  requireAuth,
  (req, res, next) => (esAdmin(req) ? next() : res.status(403).json({ message: 'No autorizado' })),
];

/* The :id in the URL must be the logged-in user, unless they are an admin. */
export const requirePropietario = [
  requireAuth,
  (req, res, next) =>
    esAdmin(req) || req.usuario.sub === req.params.id
      ? next()
      : res.status(403).json({ message: 'No autorizado' }),
];
