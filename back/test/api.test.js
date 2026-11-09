import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcrypt';
import request from 'supertest';

// Always an in-memory database: set before importing the app so .env can never apply.
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = 'pruebas';
process.env.JWT_SECRET = 'secreto-de-pruebas';

const { default: app } = await import('../src/app.js');
const { default: conexionDB, cerrarDB } = await import('../src/mongodb_conector.js');
const { correo } = await import('../src/services/correo.js');
const { pagos } = await import('../src/services/pagos.js');

const CLAVE = 'Contrasena1';
let db, cliente, otro, admin, producto;
let correos, sesionesCreadas, estadoPago;

const crearUsuario = async (nombre, rol) => {
  const usuario = {
    nombre,
    correo: `${nombre}@ejemplo.com`,
    contraseña: await bcrypt.hash(CLAVE, 4),
    rol,
    direccion: 'Calle 1',
    telefono: '600000000',
  };
  const { insertedId } = await db.collection('usuarios').insertOne(usuario);
  const { body } = await request(app).post('/login').send({ correo: usuario.correo, contraseña: CLAVE });
  return { id: insertedId.toString(), token: body.token, correo: usuario.correo };
};

const con = (req, usuario) => req.set('Authorization', `Bearer ${usuario.token}`);

before(async () => {
  db = await conexionDB();
  correo.enviar = async (o) => void correos.push(o);
  pagos.crearSesion = async (datos) => {
    const id = `cs_${sesionesCreadas.length + 1}`;
    sesionesCreadas.push({ id, ...datos });
    return { id, url: `https://stripe.test/${id}` };
  };
  pagos.obtenerSesion = async () => ({ payment_status: estadoPago });
});

beforeEach(async () => {
  await db.dropDatabase();
  correos = [];
  sesionesCreadas = [];
  estadoPago = 'paid';
  cliente = await crearUsuario('cliente', 'cliente');
  otro = await crearUsuario('otro', 'cliente');
  admin = await crearUsuario('admin', 'admin');
  const { insertedId } = await db
    .collection('productos')
    .insertOne({ nombre: '<b>Cajón</b>', descripcion: 'Madera', precio: 100, imagen_url: 'a.png' });
  producto = insertedId.toString();
});

after(async () => {
  await cerrarDB();
  await mongo.stop();
});

test('las rutas privadas exigen sesión', async () => {
  const rutas = [
    ['get', '/usuarios'],
    ['get', `/usuarios/${cliente?.id ?? '507f1f77bcf86cd799439011'}`],
    ['get', '/pedidos'],
    ['post', '/pedidos'],
    ['post', '/productos'],
    ['post', '/comentarios'],
    ['post', '/crear-sesion-pago'],
    ['delete', '/pedidos/507f1f77bcf86cd799439011'],
  ];
  for (const [metodo, ruta] of rutas) {
    assert.equal((await request(app)[metodo](ruta)).status, 401, ruta);
  }
});

test('un token falsificado no sirve', async () => {
  const res = await con(request(app).get('/usuarios'), { token: 'aaa.bbb.ccc' });
  assert.equal(res.status, 401);
});

test('un cliente no puede usar rutas de administrador', async () => {
  assert.equal((await con(request(app).get('/usuarios'), cliente)).status, 403);
  assert.equal((await con(request(app).get('/pedidos'), cliente)).status, 403);
  assert.equal((await con(request(app).post('/productos').send({}), cliente)).status, 403);
  assert.equal((await con(request(app).delete(`/pedidos/${producto}`), cliente)).status, 403);
  assert.equal((await con(request(app).put(`/pedidos/${producto}`).send({ estado: 'x' }), cliente)).status, 403);
});

test('un cliente no puede ver ni tocar a otro cliente', async () => {
  assert.equal((await con(request(app).get(`/usuarios/${otro.id}`), cliente)).status, 403);
  assert.equal((await con(request(app).get(`/pedidos/${otro.id}`), cliente)).status, 403);
  assert.equal((await con(request(app).delete(`/usuarios/${otro.id}`), cliente)).status, 403);
  assert.equal((await con(request(app).get(`/usuarios/${otro.id}`), admin)).status, 200);
});

test('la contraseña nunca sale de la API', async () => {
  const login = await request(app).post('/login').send({ correo: cliente.correo, contraseña: CLAVE });
  assert.equal(login.body.usuario.contraseña, undefined);
  const uno = await con(request(app).get(`/usuarios/${cliente.id}`), cliente);
  assert.equal(uno.body.contraseña, undefined);
  const todos = await con(request(app).get('/usuarios'), admin);
  assert.ok(todos.body.every((u) => u.contraseña === undefined));
});

test('login: contraseña mala e inyección NoSQL', async () => {
  const mala = await request(app).post('/login').send({ correo: cliente.correo, contraseña: 'no' });
  assert.equal(mala.status, 401);
  const inyeccion = await request(app).post('/login').send({ correo: { $gt: '' }, contraseña: CLAVE });
  assert.equal(inyeccion.status, 400);
});

test('las rutas antiguas peligrosas ya no existen', async () => {
  assert.equal((await request(app).get('/correos')).status, 404);
  assert.equal((await request(app).post('/confirmar').send({})).status, 404);
  assert.equal((await request(app).get(`/usuario/${cliente.correo}`)).status, 404);
});

const datosRegistro = (extra) => ({
  nombre: 'Nueva',
  correo: 'nueva@ejemplo.com',
  contraseña: CLAVE,
  direccion: 'Calle 2',
  telefono: '611111111',
  ...extra,
});

test('registro con código enviado por correo', async () => {
  const envio = await request(app).post('/verify-code').send({ email: 'nueva@ejemplo.com' });
  assert.equal(envio.status, 200);
  const codigo = correos[0].text.match(/\d{6}/)[0];
  assert.ok(!JSON.stringify(envio.body).includes(codigo), 'el código no llega al navegador');

  const malo = codigo === '111111' ? '222222' : '111111';
  assert.equal((await request(app).post('/usuarios').send(datosRegistro({ codigo: malo }))).status, 400);

  const ok = await request(app).post('/usuarios').send(datosRegistro({ codigo, rol: 'admin' }));
  assert.equal(ok.status, 201);
  assert.equal(ok.body.usuario.rol, 'cliente', 'no se puede registrar como admin');
  assert.ok(ok.body.token);
});

test('el código se bloquea tras varios intentos fallidos', async () => {
  await request(app).post('/verify-code').send({ email: 'nueva@ejemplo.com' });
  const codigo = correos[0].text.match(/\d{6}/)[0];
  const malo = codigo === '111111' ? '222222' : '111111';
  for (let i = 0; i < 5; i++) {
    await request(app).post('/usuarios').send(datosRegistro({ codigo: malo }));
  }
  assert.equal((await request(app).post('/usuarios').send(datosRegistro({ codigo }))).status, 400);
});

test('no se puede registrar un correo repetido', async () => {
  assert.equal((await request(app).post('/verify-code').send({ email: cliente.correo })).status, 409);
  assert.equal(correos.length, 0);
});

test('editar el perfil no exige contraseña ni permite cambiar el rol', async () => {
  const res = await con(
    request(app)
      .put(`/usuarios/${cliente.id}`)
      .send({ nombre: 'Editado', correo: cliente.correo, direccion: 'Otra', telefono: '622222222', rol: 'admin' }),
    cliente,
  );
  assert.equal(res.status, 200);
  const { body } = await con(request(app).get(`/usuarios/${cliente.id}`), cliente);
  assert.equal(body.nombre, 'Editado');
  assert.equal(body.rol, 'cliente');
});

test('el precio lo pone el servidor', async () => {
  const res = await con(
    request(app)
      .post('/crear-sesion-pago')
      .send({ items: [{ id: producto, cantidad: 2, precio: 0.01 }], producto: { precio: 0.01 } }),
    cliente,
  );
  assert.equal(res.status, 200);
  assert.equal(res.body.url, 'https://stripe.test/cs_1');
  const [linea] = sesionesCreadas[0].lineas;
  assert.equal(linea.precio_unitario, 100);
  assert.equal(linea.total, 200);
  assert.equal(sesionesCreadas[0].email, cliente.correo);
});

test('pago: productos no válidos', async () => {
  for (const items of [[], [{ id: producto, cantidad: 0 }], [{ id: producto, cantidad: 999 }], [{ id: '507f1f77bcf86cd799439011', cantidad: 1 }]]) {
    assert.equal((await con(request(app).post('/crear-sesion-pago').send({ items }), cliente)).status, 400);
  }
});

test('el cajón personalizado cuesta lo que dice el servidor', async () => {
  await con(
    request(app).post('/crear-sesion-pago').send({ personalizado: { tipoMadera: 'Haya', tipoCuerdas: 4, precio: 1 } }),
    cliente,
  );
  assert.equal(sesionesCreadas[0].lineas[0].precio_unitario, 249.99);
});

const pagar = () =>
  con(request(app).post('/crear-sesion-pago').send({ items: [{ id: producto, cantidad: 1 }] }), cliente);

test('sin pago no hay pedido', async () => {
  await pagar();
  estadoPago = 'unpaid';
  assert.equal((await con(request(app).post('/pedidos').send({ session_id: 'cs_1' }), cliente)).status, 402);
  assert.equal(await db.collection('pedidos').countDocuments(), 0);
  assert.equal((await con(request(app).post('/pedidos').send({ session_id: 'inventada' }), cliente)).status, 404);
});

test('no se puede reclamar el pago de otro cliente', async () => {
  await pagar();
  assert.equal((await con(request(app).post('/pedidos').send({ session_id: 'cs_1' }), otro)).status, 404);
});

test('recargar la página de éxito no duplica el pedido ni el correo', async () => {
  await pagar();
  const primero = await con(request(app).post('/pedidos').send({ session_id: 'cs_1' }), cliente);
  const segundo = await con(request(app).post('/pedidos').send({ session_id: 'cs_1' }), cliente);
  assert.equal(primero.status, 201);
  assert.equal(segundo.status, 200);
  assert.equal(primero.body.id, segundo.body.id);
  assert.equal(await db.collection('pedidos').countDocuments(), 1);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, cliente.correo);
  assert.ok(correos[0].html.includes('&lt;b&gt;Cajón'), 'el HTML del correo va escapado');
  assert.ok(!correos[0].html.includes('<b>Cajón'));
});

test('un cliente ve sus pedidos', async () => {
  await pagar();
  await con(request(app).post('/pedidos').send({ session_id: 'cs_1' }), cliente);
  const { body } = await con(request(app).get(`/pedidos/${cliente.id}`), cliente);
  assert.equal(body.length, 1);
  assert.equal(body[0].productos[0].total, 100);
});

test('un comentario lleva el nombre de quien tiene la sesión', async () => {
  const res = await con(
    request(app)
      .post('/comentarios')
      .send({ producto_id: producto, texto: 'Muy bueno', nombreUsuario: 'admin', usuario_id: otro.id }),
    cliente,
  );
  assert.equal(res.status, 201);
  const [guardado] = await db.collection('comentarios').find().toArray();
  assert.equal(guardado.nombreUsuario, 'cliente');
  assert.equal(guardado.usuario_id.toString(), cliente.id);
});

test('un identificador con formato incorrecto da 400', async () => {
  assert.equal((await request(app).get('/comentarios/no-es-un-id')).status, 400);
});
