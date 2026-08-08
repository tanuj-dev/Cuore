module.exports = {
  preset: 'react-native',
  // The react-native preset skips node_modules, but @reduxjs/toolkit and its deps (immer,
  // redux, reselect) ship ESM that Jest cannot run untransformed. Any test that builds a
  // real store needs these put back through babel.
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|@react-navigation|@reduxjs/toolkit|immer|redux|redux-thunk|reselect))',
  ],
};
