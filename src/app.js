import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { initializePassport } from './config/passport.config.js';
import apiRouter from './routes/index.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

initializePassport();
app.use(passport.initialize());

app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
