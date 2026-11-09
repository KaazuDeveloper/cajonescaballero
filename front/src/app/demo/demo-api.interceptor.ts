import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/*
 * Public portfolio demo: answers every API call in the browser, with fictional
 * data kept in the visitor's localStorage. No server, real accounts or payments.
 */
export const CODIGO_DEMO = '123456';
export const CLIENTE_DEMO = 'cliente@demo.test';
export const ADMIN_DEMO = 'admin@demo.test';

const CLAVE = 'demoDb';
const MARCA = 'marca1';
const CAJON = 'Instrumentos musicales';
const PERSONALIZADO = 249.99;

type Registro = Record<string, any>;
interface Datos {
  usuarios: Registro[];
  productos: Registro[];
  comentarios: Registro[];
  sesiones: Registro[];
  pedidos: Registro[];
}

const producto = (n: number, nombre: string, descripcion: string, precio: number, categoria: string, imagen: string): Registro => ({
  _id: `p${n}`,
  nombre,
  descripcion,
  precio,
  categoria,
  marca_id: MARCA,
  stock: 10,
  imagen_url: `assets/img/design/${imagen}`,
  fecha_lanzamiento: new Date(2026, 0, 20 - n).toISOString(),
});

const persona = (id: string, nombre: string, correo: string, rol: string): Registro => ({
  _id: id,
  nombre,
  correo,
  rol,
  direccion: 'Calle Ejemplo 1, Córdoba',
  telefono: '600000000',
});

const iniciales = (): Datos => ({
  usuarios: [persona('u1', 'Cliente Demo', CLIENTE_DEMO, 'cliente'), persona('u2', 'Admin Demo', ADMIN_DEMO, 'admin')],
  productos: [
    producto(1, 'Cajón Clásico', 'Haya maciza y cuerdas interiores para un golpe seco y definido.', 129.99, CAJON, 'CajonFlamenco.png'),
    producto(2, 'Cajón Estudio', 'Sonido equilibrado para ensayos y grabación.', 189.5, CAJON, 'CajonFlamenco6.jpg'),
    producto(3, 'Cajón Concierto', 'Tapa de abedul pensada para el directo.', 259, CAJON, 'CajonFlamenco7.png'),
    producto(4, 'Cajón Ébano', 'Frontal de veta oscura con graves profundos.', 289, CAJON, 'CajonFlamenco8.jpg'),
    producto(5, 'Cajón Fucsia', 'Lacado a mano, para quien quiere destacar.', 199, CAJON, 'CajonFlamenco2.jpg'),
    producto(6, 'Cajón Marea', 'Tapa pintada con tonos de mar y arena.', 239, CAJON, 'CajonFlamenco3.jpg'),
    producto(7, 'Cajón Negro', 'Sobrio y resistente, listo para la carretera.', 169, CAJON, 'CajonFlamenco11.png'),
    producto(8, 'Cajón Iniciación', 'El primer cajón ideal para empezar.', 99, CAJON, 'CajonFlamenco10.jpg'),
    producto(9, 'Asiento para cajón', 'Almohadilla antideslizante para tocar más cómodo.', 24.9, 'Accesorio', 'Accesorio1.png'),
    producto(10, 'Funda acolchada', 'Protección y transporte con asa y correas.', 49, 'Accesorio', 'Accesorio3.jpg'),
  ],
  comentarios: [],
  sesiones: [],
  pedidos: [],
});

const leer = (): Datos => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? '') as Datos;
  } catch {
    return iniciales();
  }
};

const guardar = (datos: Datos): void => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    /* Storage full (large designs): the demo keeps working without saving. */
  }
};

const id = (): string => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const base64Url = (texto: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(texto))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const token = (u: Registro): string =>
  `${base64Url('{"alg":"none"}')}.${base64Url(
    JSON.stringify({ sub: u['_id'], nombre: u['nombre'], rol: u['rol'], exp: Math.floor(Date.now() / 1000) + 43200 }),
  )}.demo`;

const claims = (req: HttpRequest<unknown>): Registro | null => {
  const parte = req.headers.get('Authorization')?.split('.')[1];
  if (!parte) return null;
  const bytes = Uint8Array.from(atob(parte.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const ok = (body: unknown, status = 200): Observable<HttpEvent<unknown>> =>
  of(new HttpResponse({ status, body })).pipe(delay(120));
const fallo = (status: number, message: string): Observable<never> =>
  throwError(() => new HttpErrorResponse({ status, error: { message } }));

const calcularLineas = (datos: Datos, body: Registro): Registro[] => {
  if (body['personalizado']) {
    return [
      {
        nombre: 'Cajón personalizado',
        descripcion: 'Venta de cajón personalizado',
        cantidad: 1,
        precio_unitario: PERSONALIZADO,
        total: PERSONALIZADO,
        tipo_madera: body['personalizado'].tipoMadera,
        numero_cuerdas: body['personalizado'].tipoCuerdas,
        personalizado: true,
      },
    ];
  }
  return (body['items'] as Registro[]).flatMap(({ id: productoId, cantidad }) => {
    const p = datos.productos.find((x) => x['_id'] === productoId);
    if (!p) return [];
    return [{ _id: p['_id'], nombre: p['nombre'], descripcion: p['descripcion'], cantidad, precio_unitario: p['precio'], total: Math.round(p['precio'] * cantidad * 100) / 100, imagen_url: p['imagen_url'] }];
  });
};

const sesion = (datos: Datos, u: Registro) => ({ usuario: u, token: token(u) });

export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const ruta = req.url.slice(environment.apiUrl.length).split('/').filter(Boolean);
  const [recurso, param] = ruta;
  const metodo = req.method;
  const body = (req.body ?? {}) as Registro;
  const quien = claims(req);
  const datos = leer();
  const persistir = (respuesta: unknown, status = 200) => {
    guardar(datos);
    return ok(respuesta, status);
  };

  switch (recurso) {
    case 'productos':
      if (metodo === 'GET') return ok(datos.productos);
      datos.productos.unshift({ ...body, _id: id(), precio: Number(body['precio']), stock: Number(body['stock']), fecha_lanzamiento: new Date().toISOString() });
      return persistir({ message: 'ok' });

    case 'marcas': {
      const marca = { _id: MARCA, nombre: 'La Caja Caballero' };
      return ok(param ? marca : [marca]);
    }

    case 'comentarios':
      if (metodo === 'GET') return ok(param ? datos.comentarios.filter((c) => c['producto_id'] === param) : datos.comentarios);
      if (metodo === 'DELETE') {
        datos.comentarios = datos.comentarios.filter((c) => c['_id'] !== param);
        return persistir({ message: 'ok' });
      }
      if (!quien) return fallo(401, 'Debes iniciar sesión');
      datos.comentarios.unshift({ _id: id(), producto_id: body['producto_id'], texto: body['texto'], nombreUsuario: quien['nombre'], fecha: new Date().toISOString() });
      return persistir({ id: 'ok' }, 201);

    case 'login': {
      const u = datos.usuarios.find((x) => x['correo'] === body['correo']);
      return u ? ok(sesion(datos, u)) : fallo(401, 'Correo electrónico o contraseña incorrectos');
    }

    case 'verify-code':
      return datos.usuarios.some((x) => x['correo'] === body['email']) ? fallo(409, 'Este email ya existe') : ok({ message: 'ok' });

    case 'usuarios': {
      if (metodo === 'POST') {
        if (body['codigo'] !== CODIGO_DEMO) return fallo(400, 'Código erróneo');
        const nuevo = { _id: id(), nombre: body['nombre'], correo: body['correo'], direccion: body['direccion'], telefono: body['telefono'], rol: 'cliente' };
        datos.usuarios.push(nuevo);
        return persistir(sesion(datos, nuevo), 201);
      }
      if (!param) return ok(datos.usuarios);
      const u = datos.usuarios.find((x) => x['_id'] === param);
      if (!u) return fallo(404, 'Usuario no encontrado');
      if (metodo === 'GET') return ok(u);
      Object.assign(u, { nombre: body['nombre'], correo: body['correo'], direccion: body['direccion'], telefono: body['telefono'] });
      return persistir({ id: param });
    }

    case 'crear-sesion-pago': {
      if (!quien) return fallo(401, 'Debes iniciar sesión');
      const sessionId = `demo_${id()}`;
      datos.sesiones.push({ session_id: sessionId, usuario_id: quien['sub'], lineas: calcularLineas(datos, body) });
      return persistir({ url: `${location.origin}/exito?resultado=exito&session_id=${sessionId}` });
    }

    case 'pedidos': {
      if (metodo === 'POST') {
        if (!quien) return fallo(401, 'Debes iniciar sesión');
        const existente = datos.pedidos.find((p) => p['session_id'] === body['session_id']);
        if (existente) return ok({ id: existente['_id'] });
        const registro = datos.sesiones.find((s) => s['session_id'] === body['session_id'] && s['usuario_id'] === quien['sub']);
        if (!registro) return fallo(404, 'Pago no encontrado');
        const pedido = {
          _id: id(),
          session_id: body['session_id'],
          usuario_id: quien['sub'],
          estado: 'pendiente',
          productos: registro['lineas'].map((l: Registro) => ({ ...l, estado: 'pendiente', ...(l['personalizado'] ? { dataUrl: body['dataUrl'] ?? '' } : {}) })),
        };
        datos.pedidos.unshift(pedido);
        return persistir({ id: pedido._id }, 201);
      }
      if (metodo === 'GET') return ok(param ? datos.pedidos.filter((p) => p['usuario_id'] === param) : datos.pedidos);
      if (metodo === 'DELETE') datos.pedidos = datos.pedidos.filter((p) => p['_id'] !== param);
      else datos.pedidos.filter((p) => p['_id'] === param).forEach((p) => (p['estado'] = body['estado']));
      return persistir({ message: 'ok' });
    }

    default:
      return fallo(404, 'endpoint no encontrado');
  }
};
