class Store {
  constructor(db) {
    this.db = db;
  }

  async checkIfstoreExists() {}

  /**
   *
   */
  async getStoredetails() {
    let storeDetais = await this.db.Store.findAll({ raw: true, limit: 1 });
    return storeDetais;
  }

  /**
   * Update Result
   */
  async upateStore(storeDetais) {
    await this.db.Store.update(storeDetais, {
      where: {},
    });
  }

  /**
   * Update Store Settings
   */
  async upateStore_settings(settings) {
    await this.db.Store.update(
      { settings: settings },
      {
        where: {},
      },
    );
  }
}

module.exports = Store;
