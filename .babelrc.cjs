module.exports = function (api) {
  api.cache(true);

  const presets = [
    '@babel/preset-env',
    {
      sourceType: 'module',
    },
  ];
  const targets = { node: '20' };
  const plugins = ['@babel/plugin-transform-modules-commonjs'];

  return {
    presets,
    plugins,
    targets,
  };
};
