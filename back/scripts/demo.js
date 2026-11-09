/*
 * Local demo: the real API on a throwaway in-memory database, with payments and
 * e-mail simulated. It never connects to MONGODB_URI, Gmail or Stripe.
 * Demo logins: admin@demo.test and cliente@demo.test, password Demo12345
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = 'demo';
process.env.JWT_SECRET ??= 'solo-para-la-demo-local';

const { default: app } = await import('../src/app.js');
const { default: conexionDB } = await import('../src/mongodb_conector.js');
const { FRONT_URL, PORT } = await import('../src/config.js');
const { correo } = await import('../src/services/correo.js');
const { pagos } = await import('../src/services/pagos.js');

correo.enviar = async ({ to, subject, text }) => console.log(`[correo a ${to}] ${subject} ${text ?? ''}`);
pagos.crearSesion = async () => {
  const id = `demo_${new ObjectId()}`;
  return { id, url: `${FRONT_URL}/exito?resultado=exito&session_id=${id}` };
};
pagos.obtenerSesion = async () => ({ payment_status: 'paid' });

const db = await conexionDB();
const contraseña = await bcrypt.hash('Demo12345', 10);
const persona = (nombre, rol) => ({
  nombre,
  correo: `${rol}@demo.test`,
  contraseña,
  rol,
  direccion: 'Calle Falsa 123',
  telefono: '600000000',
  fecha_registro: new Date(),
});
await db.collection('usuarios').insertMany([persona('Admin Demo', 'admin'), persona('Cliente Demo', 'cliente')]);

const { insertedId: marca_id } = await db
  .collection('marcas')
  .insertOne({ nombre: 'Caballero', descripcion: 'Marca de demostración' });
await db.collection('productos').insertMany(
  [
    ['Cajón Clásico', 'Haya maciza y cuerdas interiores para un golpe seco y definido.', 129.99, 'Instrumentos musicales', 'CajonFlamenco.png'],
    ['Cajón Estudio', 'Sonido equilibrado para ensayos y grabación.', 189.5, 'Instrumentos musicales', 'CajonFlamenco6.jpg'],
    ['Cajón Concierto', 'Tapa de abedul pensada para el directo.', 259, 'Instrumentos musicales', 'CajonFlamenco7.png'],
    ['Cajón Ébano', 'Frontal de veta oscura con graves profundos.', 289, 'Instrumentos musicales', 'CajonFlamenco8.jpg'],
    ['Cajón Fucsia', 'Lacado a mano, para quien quiere destacar.', 199, 'Instrumentos musicales', 'CajonFlamenco2.jpg'],
    ['Cajón Marea', 'Tapa pintada con tonos de mar y arena.', 239, 'Instrumentos musicales', 'CajonFlamenco3.jpg'],
    ['Cajón Negro', 'Sobrio y resistente, listo para la carretera.', 169, 'Instrumentos musicales', 'CajonFlamenco11.png'],
    ['Cajón Iniciación', 'El primer cajón ideal para empezar.', 99, 'Instrumentos musicales', 'CajonFlamenco10.jpg'],
    ['Asiento para cajón', 'Almohadilla antideslizante para tocar más cómodo.', 24.9, 'Accesorio', 'Accesorio1.png'],
    ['Funda acolchada', 'Protección y transporte con asa y correas.', 49, 'Accesorio', 'Accesorio3.jpg'],
  ].map(([nombre, descripcion, precio, categoria, imagen]) => ({
    nombre,
    descripcion,
    precio,
    categoria,
    marca_id,
    stock: 10,
    imagen_url: `assets/img/design/${imagen}`,
    fecha_lanzamiento: new Date(),
  })),
);

app.listen(PORT, () => console.log(`Demo escuchando en el puerto ${PORT}`));
