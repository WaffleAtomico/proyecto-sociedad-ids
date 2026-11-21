// R-03 / H-03: Before — visual configuration was duplicated and difficult to locate inside the component.
// After — palettes, shapes, eye variant count, and hash logic are centralized in this module.
export const PALETTES = [
  { bg: "#9FA1FF", eye: "#010736", stroke: "#010736" }, // Lavanda Racoode
  { bg: "#9747FF", eye: "#FFFAEA", stroke: "#FFFAEA" }, // Morado Racoode
  { bg: "#FFFAEA", eye: "#010736", stroke: "#9FA1FF" }, // Crema Racoode
  { bg: "#FF7A7A", eye: "#010736", stroke: "#010736" }, // Coral
  { bg: "#38BDF8", eye: "#010736", stroke: "#010736" }, // Azul cielo
  { bg: "#4ADE80", eye: "#010736", stroke: "#010736" }, // Verde menta
  { bg: "#FBBF24", eye: "#010736", stroke: "#010736" }, // Amarillo mostaza
  { bg: "#F472B6", eye: "#010736", stroke: "#010736" }, // Rosa chicle
  { bg: "#2DD4BF", eye: "#010736", stroke: "#010736" }, // Turquesa
  { bg: "#FB923C", eye: "#010736", stroke: "#010736" }, // Naranja suave
  { bg: "#C084FC", eye: "#010736", stroke: "#010736" }, // Lila claro
  { bg: "#A3E635", eye: "#010736", stroke: "#010736" }, // Lima
];

export const BLOB_SHAPES = [
  { d: "M50,12 C73,11 88,27 88,50 C88,73 73,89 50,88 C27,89 12,73 12,50 C12,27 27,11 50,12 Z", eyeY: 0 },
  { d: "M50,10 C62,28 84,48 84,66 C84,82 69,90 50,90 C31,90 16,82 16,66 C16,48 38,28 50,10 Z", eyeY: 10 },
  { d: "M50,14 C60,14 88,64 86,76 C84,86 66,88 50,88 C34,88 16,86 14,76 C12,64 40,14 50,14 Z", eyeY: 12 },
  { d: "M46,12 C72,10 84,18 87,44 C90,70 82,84 54,87 C28,90 16,82 13,56 C10,30 20,14 46,12 Z", eyeY: 0 },
  { d: "M50,24 C74,24 90,34 90,52 C90,70 74,80 50,80 C26,80 10,70 10,52 C10,34 26,24 50,24 Z", eyeY: 0 },
  { d: "M34,26 C42,16 58,16 66,26 C80,26 90,36 88,50 C92,64 82,78 66,78 C58,86 42,86 34,78 C18,78 8,64 12,50 C10,36 20,26 34,26 Z", eyeY: 0 },
  { d: "M50,11 L82,29 C86,32 87,36 87,42 L87,58 C87,64 86,68 82,71 L50,89 L18,71 C14,68 13,64 13,58 L13,42 C13,36 14,32 18,29 Z", eyeY: 0 },
  { d: "M50,11 C72,11 84,26 84,52 C84,78 72,91 50,91 C28,91 16,78 16,52 C16,26 28,11 50,11 Z", eyeY: -3 },
  { d: "M50,10 C62,10 90,38 90,50 C90,62 62,90 50,90 C38,90 10,62 10,50 C10,38 38,10 50,10 Z", eyeY: 0 },
  { d: "M50,10 L58,22 L74,17 L74,33 L88,41 L80,55 L88,69 L72,74 L68,89 L52,82 L36,89 L32,74 L16,69 L24,55 L16,41 L30,33 L30,17 L46,22 Z", eyeY: 0 },
  { d: "M50,14 C68,14 82,26 84,42 C91,44 93,54 84,58 C81,76 67,88 50,88 C33,88 18,75 16,56 C14,34 30,14 50,14 Z", eyeY: 0 },
  { d: "M42,13 C68,11 88,28 86,52 C84,76 64,89 40,86 C20,83 11,66 14,44 C17,24 24,15 42,13 Z", eyeY: 0 },
  { d: "M24,16 L38,28 C46,26 54,26 62,28 L76,16 L82,42 C86,52 84,72 72,82 C60,90 40,90 28,82 C16,72 14,52 18,42 Z", eyeY: 5 },
  { d: "M50,30 C42,14 14,16 14,42 C14,64 38,80 50,90 C62,80 86,64 86,42 C86,16 58,14 50,30 Z", eyeY: 3 },
  { d: "M50,12 C72,12 84,28 84,52 L84,84 Q75,76 67,84 Q58,76 50,84 Q42,76 33,84 Q25,76 16,84 L16,52 C16,28 28,12 50,12 Z", eyeY: -3 },
  { d: "M16,32 L30,44 L50,22 L70,44 L84,32 L82,74 C80,84 68,88 50,88 C32,88 20,84 18,74 Z", eyeY: 11 },
];
// R-04 / H-04: Constant for the number of eye variants, centralized for easier management and updates
export const EYE_VARIANTS_COUNT = 7;

export function hashString(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}