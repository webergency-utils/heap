import { defineConfig } from 'tsup';

export default defineConfig({
    entry     : [ 'src/heap.ts' ],
    format    : [ 'cjs', 'esm' ],
    dts       : true,
    sourcemap : false,
    minify    : false,
    clean     : true,
    shims     : true,
    splitting : false
});
