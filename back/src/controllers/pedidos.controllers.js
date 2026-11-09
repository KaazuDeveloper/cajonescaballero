import { ObjectId } from 'mongodb';
import conexionDB from '../mongodb_conector.js';
import { FRONT_URL, PRECIO_CAJON_PERSONALIZADO } from '../config.js';
import { correo, escaparHtml } from '../services/correo.js';
import { pagos } from '../services/pagos.js';

const MAX_UNIDADES = 20;
const MAX_DISENO = 4_000_000;
const DISENO_VALIDO = /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/;

const errorServidor = (res, error) => {
  console.error(error);
  res.status(500).json({ message: 'Error en el servidor' });
};

const redondear = (n) => Math.round(n * 100) / 100;
const texto = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, 40) : undefined);

/* Every price comes from the server; the browser only says what it wants to buy. */
const calcularLineas = async (database, { items, personalizado }) => {
  if (personalizado) {
    return [
      {
        nombre: 'Cajón personalizado',
        descripcion: 'Venta de cajón personalizado',
        cantidad: 1,
        precio_unitario: PRECIO_CAJON_PERSONALIZADO,
        total: PRECIO_CAJON_PERSONALIZADO,
        tipo_madera: texto(personalizado.tipoMadera),
        numero_cuerdas: texto(personalizado.tipoCuerdas),
        personalizado: true,
      },
    ];
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return null;
  const pedidos = items.map(({ id, cantidad }) => ({ id, cantidad }));
  const validos = pedidos.every(
    ({ id, cantidad }) =>
      typeof id === 'string' && ObjectId.isValid(id) && Number.isInteger(cantidad) && cantidad > 0 && cantidad <= MAX_UNIDADES,
  );
  if (!validos) return null;

  const productos = await database
    .collection('productos')
    .find({ _id: { $in: pedidos.map(({ id }) => new ObjectId(id)) } })
    .toArray();
  const porId = new Map(productos.map((p) => [p._id.toString(), p]));
  if (pedidos.some(({ id }) => !porId.has(id))) return null;

  return pedidos.map(({ id, cantidad }) => {
    const p = porId.get(id);
    return {
      _id: id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      cantidad,
      precio_unitario: p.precio,
      total: redondear(p.precio * cantidad),
      imagen_url: p.imagen_url || '',
    };
  });
};

export const pago = async (req, res) => {
  try {
    const database = await conexionDB();
    const lineas = await calcularLineas(database, req.body);
    if (!lineas) return res.status(400).json({ message: 'Productos no válidos' });

    const usuario = await database.collection('usuarios').findOne({ _id: new ObjectId(req.usuario.sub) });
    if (!usuario) return res.status(401).json({ message: 'Debes iniciar sesión' });

    const sesion = await pagos.crearSesion({
      lineas,
      email: usuario.correo,
      usuarioId: req.usuario.sub,
      successUrl: `${FRONT_URL}/exito?resultado=exito&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${FRONT_URL}/cancelacion?resultado=cancelado`,
    });
    await database.collection('sesiones_pago').insertOne({
      session_id: sesion.id,
      usuario_id: req.usuario.sub,
      lineas,
      fecha: new Date(),
    });
    res.status(200).json({ url: sesion.url });
  } catch (error) {
    errorServidor(res, error);
  }
};

const correoConfirmacion = (productos) => `
  <h1>Tu pedido se ha realizado correctamente</h1>
  <p>Detalles del pedido:</p>
  <ul>
    ${productos
      .map(
        (p) => `<li>
          <p>Nombre: ${escaparHtml(p.nombre)}</p>
          <p>Descripción: ${escaparHtml(p.descripcion)}</p>
          <p>Cantidad: ${p.cantidad}</p>
          <p>Precio unitario: ${p.precio_unitario}€</p>
          <p>Total: ${p.total}€</p>
        </li>`,
      )
      .join('')}
  </ul>
  <p>Total del pedido: ${redondear(productos.reduce((suma, p) => suma + p.total, 0))}€</p>`;

/* An order only exists once Stripe confirms that this user's session was paid. */
export const addPedido = async (req, res) => {
  try {
    const { session_id: sessionId, dataUrl } = req.body;
    if (typeof sessionId !== 'string') return res.status(400).json({ message: 'Falta el pago' });

    const database = await conexionDB();
    const registro = await database
      .collection('sesiones_pago')
      .findOne({ session_id: sessionId, usuario_id: req.usuario.sub });
    if (!registro) return res.status(404).json({ message: 'Pago no encontrado' });

    const sesion = await pagos.obtenerSesion(sessionId);
    if (sesion.payment_status !== 'paid') return res.status(402).json({ message: 'Pago no completado' });

    const diseno =
      typeof dataUrl === 'string' && dataUrl.length <= MAX_DISENO && DISENO_VALIDO.test(dataUrl) ? dataUrl : '';
    const productos = registro.lineas.map((l) => ({
      ...l,
      estado: 'pendiente',
      ...(l.personalizado ? { dataUrl: diseno } : {}),
    }));

    const pedidos = database.collection('pedidos');
    const { upsertedCount } = await pedidos.updateOne(
      { session_id: sessionId },
      {
        $setOnInsert: {
          usuario_id: new ObjectId(req.usuario.sub),
          productos,
          estado: 'pendiente',
          fecha: new Date(),
        },
      },
      { upsert: true },
    );
    const pedido = await pedidos.findOne({ session_id: sessionId }, { projection: { _id: 1 } });

    if (upsertedCount) {
      const usuario = await database.collection('usuarios').findOne({ _id: new ObjectId(req.usuario.sub) });
      correo
        .enviar({ to: usuario.correo, subject: 'Confirmación de pedido', html: correoConfirmacion(productos) })
        .catch((error) => console.error('Error al enviar la confirmación:', error));
    }
    res.status(upsertedCount ? 201 : 200).json({ id: pedido._id });
  } catch (error) {
    errorServidor(res, error);
  }
};

export const getPedidosUsuario = async (req, res) => {
  try {
    const database = await conexionDB();
    res
      .status(200)
      .json(await database.collection('pedidos').find({ usuario_id: new ObjectId(req.params.id) }).toArray());
  } catch (error) {
    errorServidor(res, error);
  }
};

export const getPedidos = async (req, res) => {
  try {
    const database = await conexionDB();
    res.status(200).json(await database.collection('pedidos').find({}).toArray());
  } catch (error) {
    errorServidor(res, error);
  }
};

export const deletePedido = async (req, res) => {
  try {
    const database = await conexionDB();
    const { deletedCount } = await database.collection('pedidos').deleteOne({ _id: new ObjectId(req.params.id) });
    if (!deletedCount) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.status(200).json({ message: 'Pedido eliminado' });
  } catch (error) {
    errorServidor(res, error);
  }
};

export const updatePedido = async (req, res) => {
  try {
    const { estado } = req.body;
    if (typeof estado !== 'string' || !estado) return res.status(400).json({ message: 'El estado es requerido' });
    const database = await conexionDB();
    const { matchedCount } = await database
      .collection('pedidos')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: { estado } });
    if (!matchedCount) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.status(200).json({ message: 'Estado del pedido actualizado' });
  } catch (error) {
    errorServidor(res, error);
  }
};
