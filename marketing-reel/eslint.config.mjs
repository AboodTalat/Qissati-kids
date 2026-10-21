import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  // The upstream preset discovers TS/JS by default. Explicitly include the
  // new JavaScript reel's JSX without changing the earlier reels' lint scope.
  { files: ['src/r18/**/*.jsx', 'src/r19/**/*.jsx', 'src/r20/**/*.jsx', 'src/r21/**/*.jsx', 'src/r22/**/*.jsx', 'src/r23/**/*.jsx', 'src/r24/**/*.jsx', 'src/kit/**/*.jsx', 'src/r26/**/*.jsx'], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
];
