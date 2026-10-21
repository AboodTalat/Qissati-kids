import * as THREE from 'three';

export const palette = { teal: '#146466', deep: '#103f43', cream: '#fdf8f0', gold: '#c69b56', stone: '#decdb3', light: '#eee2ca', ink: '#173c3f' };

// Original, deliberately non-geographic motifs. Shared by the 3D cutouts,
// printable SVG assets and the book page; no map or landmark source is used.
export const treeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380">
<path fill="#146466" d="M144 372L144 246L80 204L91 181L144 213L143 161L113 121L132 105L163 151L204 109L221 126L173 181L173 221L230 178L246 198L173 254L180 372Z"/>
<path fill="#638d7f" d="M56 239C9 217 16 166 47 149C9 108 38 66 78 66C82 14 135 12 159 46C185 7 239 23 241 67C291 61 320 109 286 148C322 185 298 232 259 239C231 267 198 258 160 241C123 266 84 267 56 239Z"/>
<path fill="#a6bca3" d="M45 148C37 121 58 100 83 96C89 64 122 54 149 70C124 100 118 127 119 154C94 165 67 166 45 148Z"/>
</svg>`;

export const castleSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380">
<path fill="#d7bd91" d="M36 372V156H25V108H48V128H65V108H89V128H106V108H130V156H119V372Z"/>
<path fill="#f3e5c7" d="M190 372V128H179V79H202V100H219V79H243V100H260V79H284V128H273V372Z"/>
<path fill="#e9d5ae" d="M102 372V210H92V167H115V185H137V167H160V185H182V167H205V210H195V372Z"/>
<path fill="#146466" d="M60 252V207C60 181 91 181 91 207V252Z M213 222V169C213 143 242 143 242 169V222Z M131 372V303C131 270 168 270 168 303V372Z"/>
<path fill="#c69b56" d="M75 108V48H79V108Z M79 48L128 59L79 75Z M226 79V18H230V79Z M230 18L279 32L230 45Z"/>
<path fill="#fff3d1" d="M68 241V209C68 194 83 194 83 209V241Z M220 211V172C220 155 235 155 235 172V211Z"/>
</svg>`;

export const trailSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 600">
<path d="M156 579C52 521 248 468 160 407S48 310 143 252S249 155 162 70" fill="none" stroke="#c69b56" stroke-width="14" stroke-linecap="round" stroke-dasharray="5 27"/>
<path fill="#f4d88e" stroke="#146466" stroke-width="4" d="M162 27L175 58L208 70L175 83L162 116L149 83L116 70L149 58Z"/>
<path fill="none" stroke="#146466" stroke-width="6" stroke-linecap="round" d="M142 430L178 466M178 430L142 466"/>
</svg>`;

export const citySVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 430">
<path fill="#e9dcc3" d="M45 340C123 217 209 340 284 215C352 117 447 227 590 178L598 390H40Z"/>
<path fill="#c9dacb" d="M41 360C174 291 236 384 367 285C444 229 541 317 598 277V390H40Z"/>
<g fill="#e4cfa9" stroke="#146466" stroke-width="3">
<path d="M82 327V249H157V327Z M172 329V221H244V329Z M278 275V159H362V275Z M381 275V191H447V275Z M465 287V156H546V287Z"/>
</g><g fill="#146466"><path d="M103 287V267H119V287Z M131 287V267H147V287Z M193 259V239H211V259Z M298 194V176H315V194Z M327 194V176H344V194Z M400 229V209H420V229Z M484 196V175H503V196Z M518 196V175H535V196Z"/></g>
<path d="M245 351H281V337H297V320H315V304H334V289H355" fill="none" stroke="#146466" stroke-width="5"/>
<circle cx="481" cy="74" r="27" fill="#c69b56"/>
<path d="M67 388H579" stroke="#c69b56" stroke-width="3"/>
</svg>`;

export function paperTexture() {
  const size = 128;
  const pixels = new Uint8Array(size * size);
  let seed = 160610;
  for (let i = 0; i < pixels.length; i++) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    pixels[i] = 124 + Math.floor(seed / 4294967296 * 48);
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  return texture;
}
