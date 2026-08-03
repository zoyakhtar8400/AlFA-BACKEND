const LS_KEY = 'pendingOrders';

function getDigitalOrdersFromLocalStorage() {
  const data = localStorage.getItem(LS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveDigitalOrdersInLocalStorage(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function addDigitalOrdersInLocalStorage(id) {
  const orders = getDigitalOrdersFromLocalStorage();
  if (!orders.includes(id)) {
    orders.push(id);
    saveDigitalOrdersInLocalStorage(orders);
  }
}

function removeDigitalOrderFromLocalStorage(id) {
  const orders = getDigitalOrdersFromLocalStorage().filter((o) => o !== id);
  saveDigitalOrdersInLocalStorage(orders);
}

module.exports = {
  getDigitalOrdersFromLocalStorage,
  saveDigitalOrdersInLocalStorage,
  addDigitalOrdersInLocalStorage,
  removeDigitalOrderFromLocalStorage,
};
