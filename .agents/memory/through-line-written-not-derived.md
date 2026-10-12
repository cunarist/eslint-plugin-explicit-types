---
description: A type is written out, not derived; the absence preset is a second axis
---

**The through-line:** a type is written out, not derived. If the compiler can
infer it, that is convenience; if the _reader_ has to run the compiler in their
head to know what a value is, that is a defect. The `concrete` and `naming`
rules each remove one way to leave a type implicit — utility types, `keyof`,
`typeof`, mapped types, index signatures, conditional types, and assertions.

`absence` is the exception, added later on a second axis: one spelling per idea,
so a value's empty form is a single definite thing. See that preset's section
before adding a rule to it — the through-line is the wrong test there.

See [[indexed-access-is-allowed]] for where the line stops, and [[preset-absence]] for the other axis.
