/**
 * R-06 (H-07): tipo de fila que devuelve Supabase.
 * El cliente del proyecto no usa tipos generados de la BD, por lo que las filas
 * ya eran `any` en los repositorios (inferido). Se declara una sola vez aquí,
 * con una única supresión de lint, en lugar de repetir `any` en cada puerto.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRow = any;
