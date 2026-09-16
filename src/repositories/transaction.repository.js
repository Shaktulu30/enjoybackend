import { runInTransaction } from '../dao/transaction.dao.js';

class TransactionRepository {
  // Ejecuta `work(session)` de forma atómica; las operaciones de los repositories reciben esa session.
  run(work) {
    return runInTransaction(work);
  }
}

export const transactionRepository = new TransactionRepository();
