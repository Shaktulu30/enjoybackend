// Operaciones genéricas de acceso a datos sobre un modelo de Mongoose.
// Devuelven objetos planos (lean); no conocen reglas de negocio.
export class BaseDAO {
  constructor(model) {
    this.model = model;
  }

  async create(data, { session } = {}) {
    const [document] = await this.model.create([data], session ? { session } : {});
    return document.toObject();
  }

  findById(id, options) {
    return this.#run(this.model.findById(id), options);
  }

  findOne(filter, options) {
    return this.#run(this.model.findOne(filter), options);
  }

  find(filter = {}, options) {
    return this.#run(this.model.find(filter), options);
  }

  count(filter = {}, { session } = {}) {
    const query = this.model.countDocuments(filter);
    return session ? query.session(session) : query;
  }

  async sum(filter, field, { session } = {}) {
    const match = this.model.find().cast(this.model, { ...filter });
    const aggregate = this.model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: `$${field}` } } }]);
    const [result] = await (session ? aggregate.session(session) : aggregate);
    return result?.total ?? 0;
  }

  updateById(id, update, options) {
    return this.model.findByIdAndUpdate(id, update, this.#updateOptions(options)).lean();
  }

  updateOne(filter, update, options) {
    return this.model.findOneAndUpdate(filter, update, this.#updateOptions(options)).lean();
  }

  #updateOptions({ session, timestamps, runValidators = true } = {}) {
    return {
      returnDocument: 'after',
      runValidators,
      ...(session && { session }),
      ...(timestamps !== undefined && { timestamps }),
    };
  }

  #run(query, { select, populate, sort, skip, limit, session } = {}) {
    if (select) query.select(select);
    if (populate) query.populate(populate);
    if (sort) query.sort(sort);
    if (skip) query.skip(skip);
    if (limit) query.limit(limit);
    if (session) query.session(session);
    return query.lean();
  }
}
