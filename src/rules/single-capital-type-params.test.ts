import { type ExpectedSuggestion, spanOf, testRule } from "#testing";

import { singleCapitalTypeParamsRule } from "./single-capital-type-params.ts";

const NOT_SINGLE_CAPITAL = { messageId: "notSingleCapital" };

/** The suggestion to rename `name` to `suggestion`, leaving `output`. */
function rename(name: string, suggestion: string, output: string): ExpectedSuggestion {
  return { messageId: "rename", data: { name, suggestion }, output };
}

const highlighted =
  "function first<Item>(items: Item[]): Item | null {\n  return items[0] ?? null;\n}";

/** Every capital in use, so no rename is free. */
const crowded =
  "type Box<Item> = [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, Item];";

testRule("single-capital-type-params", singleCapitalTypeParamsRule, {
  valid: [
    // allows a single capital on every kind of declaration
    "function f<T>(value: T): T {\n  return value;\n}",
    "type Box<T> = { value: T };",
    "interface Box<T> {\n  value: T;\n}",
    "class Box<T> {\n  constructor(readonly value: T) {}\n}",
    "const f = <T,>(value: T): T => value;",
    "type Fn = <T>(value: T) => T;",
    "class C {\n  run<T>(value: T): T {\n    return value;\n  }\n}",

    // allows several parameters with any distinct capitals, in any order
    "type Pair<K, V> = [K, V];",
    "function zip<B, A>(left: A[], right: B[]): [A, B][] {\n  return [];\n}",

    // allows modifiers, constraints, and defaults around the name
    "function f<const T extends string = string>(value: T): T {\n  return value;\n}",
    "interface Producer<out T> {\n  make(): T;\n}",

    // leaves `infer` and mapped type keys to their own rules
    "type First<T> = T extends [infer Head, ...unknown[]] ? Head : never;",
    "type Flags<T> = { [Key in keyof T]: boolean };",
  ],
  invalid: [
    // rejects a descriptive name, highlighting only the name, and suggests its initial
    {
      code: highlighted,
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          data: { name: "Item" },
          ...spanOf(highlighted, "Item"),
          suggestions: [
            rename(
              "Item",
              "I",
              "function first<I>(items: I[]): I | null {\n  return items[0] ?? null;\n}",
            ),
          ],
        },
      ],
    },

    // reads past a `T` prefix to the meaningful letter
    {
      code: "type Box<TValue> = { value: TValue };",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          data: { name: "TValue" },
          suggestions: [rename("TValue", "V", "type Box<V> = { value: V };")],
        },
      ],
    },

    // rejects a lowercase single letter
    {
      code: "type Box<t> = { value: t };",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          data: { name: "t" },
          suggestions: [rename("t", "T", "type Box<T> = { value: T };")],
        },
      ],
    },

    // reports each parameter, each suggestion leaving the others alone
    {
      code: "type Entry<Key, Value> = [Key, Value];",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          data: { name: "Key" },
          suggestions: [rename("Key", "K", "type Entry<K, Value> = [K, Value];")],
        },
        {
          ...NOT_SINGLE_CAPITAL,
          data: { name: "Value" },
          suggestions: [rename("Value", "V", "type Entry<Key, V> = [Key, V];")],
        },
      ],
    },

    // skips a capital already used in the declaration
    {
      code: "type Tagged<Item> = { item: Item; tag: I };",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [rename("Item", "T", "type Tagged<T> = { item: T; tag: I };")],
        },
      ],
    },
    {
      code: "function wrap<T, Item>(tag: T, item: Item): [T, Item] {\n  return [tag, item];\n}",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [
            rename(
              "Item",
              "I",
              "function wrap<T, I>(tag: T, item: I): [T, I] {\n  return [tag, item];\n}",
            ),
          ],
        },
      ],
    },

    // ignores capitals used outside the declaration, which it cannot capture
    {
      code: "type I = number;\ntype Box<Item> = { value: Item };",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [rename("Item", "I", "type I = number;\ntype Box<I> = { value: I };")],
        },
      ],
    },

    // renames a method's parameter within the method only
    {
      code: "class Store<T> {\n  find<Key>(key: Key): T | null {\n    return null;\n  }\n}",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [
            rename(
              "Key",
              "K",
              "class Store<T> {\n  find<K>(key: K): T | null {\n    return null;\n  }\n}",
            ),
          ],
        },
      ],
    },

    // checks interfaces, classes, and function types alike
    {
      code: "interface Box<Item> {\n  value: Item;\n}",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [rename("Item", "I", "interface Box<I> {\n  value: I;\n}")],
        },
      ],
    },
    {
      code: "type Fn = <Input>(value: Input) => Input;",
      errors: [
        {
          ...NOT_SINGLE_CAPITAL,
          suggestions: [rename("Input", "I", "type Fn = <I>(value: I) => I;")],
        },
      ],
    },

    // reports without a suggestion when every capital is taken
    { code: crowded, errors: [{ ...NOT_SINGLE_CAPITAL, suggestions: [] }] },
  ],
});
