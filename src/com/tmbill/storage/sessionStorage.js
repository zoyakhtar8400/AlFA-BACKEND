const setSessionStorage = (key, value) => {
	sessionStorage.setItem(key, value);
}

const getSessionStorage = (key) => {
	return sessionStorage.getItem(key);
}

const removeSessionStorage = (key) => {
	sessionStorage.removeItem(key);
}

const clearSessionStorage = () => {
	sessionStorage.clear();
}

module.exports = {
	setSessionStorage,
	getSessionStorage,
	removeSessionStorage,
	clearSessionStorage
}