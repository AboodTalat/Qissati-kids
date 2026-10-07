import { Config } from '@remotion/cli/config';
Config.setRspack(true);
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setEntryPoint('./src/index.jsx');
// Three.js needs ANGLE in Chromium exports, including renders started in Studio.
Config.setChromiumOpenGlRenderer('angle');
