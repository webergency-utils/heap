#!/bin/bash -eu

npm ci
npm run build

compile_javascript_fuzzer heap fuzz_heap.cjs
