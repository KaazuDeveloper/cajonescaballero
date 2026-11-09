import { createHmac, randomInt } from 'node:crypto';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import conexionDB from '../mongodb_conector.js';
import { JWT_SECRET } from '../config.js';
import { crearToken } from '../middlewares/auth.js';
import { correo } from '../services/correo.js';

const SIN_CONTRASENA = { projection: { contraseña: 0 } };
const MINUTOS_CODIGO = 10;
const MAX_INTENTOS_CODIGO = 5;

const usuarios = async () => (await conexionDB()).collection('usuarios');
const verificaciones = async () => (await conexionDB()).collection('verificaciones');

const errorServidor = (res, error) => {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor' });
};

const sinContrasena = ({ contraseña, ...usuario }) => usuario;
const resumenCodigo = (correoUsuario, codigo) =>
  createHmac('sha256', JWT_SECRET).update(`${correoUsuario}:${codigo}`).digest('hex');

export const getUsuarios = async (req, res) => {
  try {
    res.status(200).json(await (await usuarios()).find({}, SIN_CONTRASENA).toArray());
  } catch (error) {
    errorServidor(res, error);
  }
};

export const getUsuario = async (req, res) => {
  try {
    const usuario = await (await usuarios()).findOne({ _id: new ObjectId(req.params.id) }, SIN_CONTRASENA);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json(usuario);
  } catch (error) {
    errorServidor(res, error);
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const { correo: email, contraseña } = req.body;
    if (typeof email !== 'string' || typeof contraseña !== 'string') {
      return res.status(400).json({ message: 'Datos no válidos' });
    }
    const usuario = await (await usuarios()).findOne({ correo: email });
    if (!usuario || !(await bcrypt.compare(contraseña, usuario.contraseña))) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
    }
    res.status(200).json({ usuario: sinContrasena(usuario), token: crearToken(usuario) });
  } catch (error) {
    errorServidor(res, error);
  }
};

/* Sends a one-time code to the address; the code never reaches the browser. */
export const enviarCodigo = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Correo no válido' });
    }
    if (await (await usuarios()).findOne({ correo: email }, { projection: { _id: 1 } })) {
      return res.status(409).json({ message: 'Este email ya existe' });
    }
    const codigo = String(randomInt(100000, 1000000));
    await (await verificaciones()).updateOne(
      { correo: email },
      {
        $set: {
          resumen: resumenCodigo(email, codigo),
          expira: new Date(Date.now() + MINUTOS_CODIGO * 60_000),
          intentos: 0,
        },
      },
      { upsert: true },
    );
    await correo.enviar({
      to: email,
      subject: 'Código de verificación',
      text: `Tu código de verificación es: ${codigo}`,
    });
    res.status(200).json({ message: 'Código enviado' });
  } catch (error) {
    errorServidor(res, error);
  }
};

const codigoCorrecto = async (email, codigo) => {
  const coleccion = await verificaciones();
  const verificacion = await coleccion.findOne({ correo: email });
  if (!verificacion || verificacion.expira < new Date() || verificacion.intentos >= MAX_INTENTOS_CODIGO) {
    return false;
  }
  if (verificacion.resumen !== resumenCodigo(email, String(codigo))) {
    await coleccion.updateOne({ correo: email }, { $inc: { intentos: 1 } });
    return false;
  }
  await coleccion.deleteOne({ correo: email });
  return true;
};

export const addUsuario = async (req, res) => {
  try {
    const { nombre, correo: email, contraseña, direccion, telefono, codigo } = req.body;
    const coleccion = await usuarios();
    if (await coleccion.findOne({ correo: email }, { projection: { _id: 1 } })) {
      return res.status(409).json({ message: 'Este email ya existe' });
    }
    if (!(await codigoCorrecto(email, codigo))) {
      return res.status(400).json({ message: 'Código de verificación erróneo' });
    }
    const usuario = {
      nombre,
      correo: email,
      contraseña: await bcrypt.hash(contraseña, 10),
      rol: 'cliente',
      direccion,
      telefono,
      fecha_registro: new Date(),
    };
    const { insertedId } = await coleccion.insertOne(usuario);
    const creado = { ...usuario, _id: insertedId };
    res.status(201).json({ usuario: sinContrasena(creado), token: crearToken(creado) });
  } catch (error) {
    errorServidor(res, error);
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { nombre, correo: email, direccion, telefono } = req.body;
    const coleccion = await usuarios();
    const _id = new ObjectId(req.params.id);
    if (await coleccion.findOne({ correo: email, _id: { $ne: _id } }, { projection: { _id: 1 } })) {
      return res.status(409).json({ message: 'Este email ya existe' });
    }
    const { matchedCount } = await coleccion.updateOne(
      { _id },
      { $set: { nombre, correo: email, direccion, telefono } },
    );
    if (!matchedCount) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    errorServidor(res, error);
  }
};

export const delUsuario = async (req, res) => {
  try {
    const { deletedCount } = await (await usuarios()).deleteOne({ _id: new ObjectId(req.params.id) });
    if (!deletedCount) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json({ message: 'Usuario borrado' });
  } catch (error) {
    errorServidor(res, error);
  }
};
