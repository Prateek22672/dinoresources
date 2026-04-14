Propositional Logic works with **atomic, indivisible statements** that are either true or false.

Each symbol represents one complete fact — for example, `P = "It is raining"`. You can combine facts using connectives:

| Connective | Symbol | Meaning |
|---|---|---|
| AND | ∧ | Both must be true |
| OR | ∨ | At least one is true |
| NOT | ¬ | Negates the statement |
| IMPLIES | → | If the left is true, so is the right |

**Key limitation:** it cannot express relationships *between* objects or generalise over a collection.

---

**First-Order Logic (FOL)** extends this by introducing three powerful additions:

- **Predicates** — functions that express relationships. e.g., `Loves(John, Mary)`
- **Variables** — range over objects in a domain. e.g., `x`, `y`
- **Quantifiers** — express scope:
  - `∀x` (Universal) — "for all x"
  - `∃x` (Existential) — "there exists an x"

### Example comparison

```
-- Propositional Logic (limited)
P = "Socrates is mortal"    ← one specific fact, can't generalise

-- First-Order Logic (expressive)
∀x: Human(x) → Mortal(x)   ← "every human is mortal" — works for all humans
Human(Socrates)             ← a fact
∴ Mortal(Socrates)          ← derived automatically
```

FOL is the foundation of knowledge bases in expert systems and is used in Prolog.