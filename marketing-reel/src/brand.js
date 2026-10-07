import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Production snapshot of app/globals.css and lib/site.js. No private order data.
export const brand = {
  teal: '#146466', cream: '#fdf8f0', gold: '#f4b740', ink: '#2e2a26',
  instagram: '@qissati_kids', orderUrl: 'https://www.qissatikids.com/ar/order',
};
loadFont({ family: 'Cairo', url: staticFile('fonts/Cairo.ttf'), weight: '200 1000', display: 'block' });
