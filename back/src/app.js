import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { FRONT_URLS } from './config.js';
import router from './routes/cajaCaballero.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: FRONT_URLS }));
app.use(express.json({ limit: '6mb' }));
app.use(router);
app.use((req, res) => res.status(404).json({ message: 'endpoint no encontrado' }));

export default app;
