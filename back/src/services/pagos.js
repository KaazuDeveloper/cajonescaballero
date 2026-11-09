import Stripe from 'stripe';
import '../config.js';

let cliente;
const stripe = () => (cliente ??= new Stripe(process.env.STRIPE_API_KEY));

/* An object so the tests can replace these calls. */
export const pagos = {
  crearSesion({ lineas, email, usuarioId, successUrl, cancelUrl }) {
    return stripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: { usuario_id: usuarioId },
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineas.map((l) => ({
        quantity: l.cantidad,
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(l.precio_unitario * 100),
          product_data: { name: l.nombre, description: l.descripcion || undefined },
        },
      })),
    });
  },
  obtenerSesion(id) {
    return stripe().checkout.sessions.retrieve(id);
  },
};
