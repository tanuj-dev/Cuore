let logs = [];
let listeners = [];
let idCounter = 0;

const MAX_LOGS = 100;

const ApiLogger = {
  log(entry) {
    const logEntry = {
      id: ++idCounter,
      timestamp: new Date(),
      ...entry,
    };
    logs = [logEntry, ...logs].slice(0, MAX_LOGS);
    listeners.forEach(fn => fn(logs));
  },

  getLogs() {
    return logs;
  },

  clear() {
    logs = [];
    listeners.forEach(fn => fn(logs));
  },

  subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },
};

export default ApiLogger;
