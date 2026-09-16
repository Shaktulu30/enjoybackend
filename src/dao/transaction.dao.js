import mongoose from 'mongoose';

// Ejecuta `work(session)` dentro de una transacción de MongoDB. Mongoose reintenta ante conflictos transitorios.
export const runInTransaction = (work) => mongoose.connection.transaction(work);
