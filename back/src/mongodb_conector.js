import { MongoClient } from 'mongodb';
import { MONGODB_DB } from './config.js';

let conexion;

const conexionDB = async () => {
  if (!conexion) {
    conexion = await new MongoClient(process.env.MONGODB_URI).connect();
  }
  return conexion.db(MONGODB_DB);
};

export const cerrarDB = async () => {
  await conexion?.close();
  conexion = undefined;
};

export default conexionDB;
