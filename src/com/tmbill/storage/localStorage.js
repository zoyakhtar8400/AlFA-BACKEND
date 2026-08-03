const setLocalStorage = (key, value) => {
  localStorage.setItem(key, value);
};

const getLocalStorage = (key) => {
  return localStorage.getItem(key);
};

const removeLocalStorage = (key) => {
  localStorage.removeItem(key);
};

const clearLocalStorage = () => {
  localStorage.clear();
};

module.exports = {
  setLocalStorage,
  clearLocalStorage,
  removeLocalStorage,
  getLocalStorage,
};
