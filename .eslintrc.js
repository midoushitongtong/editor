module.exports = {
  extends: ['react-app', 'react-app/jest'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['warn'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
  },
};
