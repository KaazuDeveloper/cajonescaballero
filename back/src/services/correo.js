import nodemailer from 'nodemailer';
import '../config.js';

export const escaparHtml = (texto) =>
  String(texto ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

let transporter;

/* An object so the tests can replace `enviar`. */
export const correo = {
  async enviar(opciones) {
    transporter ??= nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
    await transporter.sendMail({ from: process.env.MAIL_USER, ...opciones });
  },
};
