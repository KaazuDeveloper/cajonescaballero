import { check, validationResult } from 'express-validator';

const texto = (campo) => check(campo).isString().withMessage(`El campo ${campo} no es válido.`);

const camposPerfil = [
  texto('nombre').bail().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
  texto('correo').bail().isEmail().withMessage('El correo debe ser válido.'),
  texto('direccion').bail().trim().notEmpty().withMessage('La dirección no puede estar vacía.'),
  check('telefono').isNumeric().withMessage('El teléfono debe ser numérico.'),
];

const comprobar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

export const validacionRegistro = [
  ...camposPerfil,
  texto('contraseña').bail().isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),
  check('codigo').matches(/^\d{6}$/).withMessage('Código de verificación no válido.'),
  comprobar,
];

export const validacionPerfil = [...camposPerfil, comprobar];
