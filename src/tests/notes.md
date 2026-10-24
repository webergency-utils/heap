# Testing Notes

## Rules
- Tests must be executed using Vitest (`npm test` / `npm run coverage`).
- Always isolate tests and avoid shared mutable state across test cases.
- Keep tests clean and well-structured following the AAA (Arrange, Act, Assert) pattern.
- Maintain 100% line, statement, function, and branch coverage on `src/heap.ts`.

## Anti-Patterns
- Do not rely on internal array ordering beyond the binary heap parent-child invariant.
- Do not ignore `TypeError` or `RangeError` in fuzzing or property tests.

## Mocking Conventions
- Prefer testing real `Heap` instances with custom comparators and `id_getter` functions over mocking internal methods.
