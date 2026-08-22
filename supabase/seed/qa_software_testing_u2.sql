-- =====================================================================
-- Study-With-AI seed — Software Testing Methodologies (4th Year) — UNIT 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Software Testing Methodologies' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Software Testing Methodologies" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain Black Box Testing and its characteristics.',
    'Explain Boundary Value Analysis with suitable examples.',
    'Explain Equivalence Class Testing with suitable examples.',
    'Explain White Box Testing and its characteristics.',
    'Explain Basis Path Testing and describe the steps involved in performing it.',
    'Explain Loop Testing and its different approaches.',
    'Explain Static Testing and its purpose.',
    'Explain Inspections in Software Testing.',
    'Explain Structured Walkthroughs.',
    'Explain Technical Reviews and their role in Software Quality Assurance.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain Black Box Testing and its characteristics.', $md$
**Black box testing** examines functionality **without any knowledge of the internal code structure**. The tester supplies inputs, observes outputs, and compares them against the specification — treating the software as an opaque box.

```text
          +-------------------+
input --->|   ???  (unknown)  |---> output
          +-------------------+
     tester sees only what goes in and comes out
```

### Characteristics

* **Specification-based** — test cases derive from requirements, not code
* **No programming knowledge required** of the tester
* **User perspective** — tests what the user actually experiences
* Applicable at **all levels**, especially system and acceptance testing
* Can begin as soon as the **specification** exists, before code is written

### Principal Techniques

| Technique                    | Basis                                    |
| ---------------------------- | ---------------------------------------- |
| **Equivalence partitioning** | Divide inputs into classes behaving alike |
| **Boundary value analysis**  | Test at and around the edges              |
| **Decision table testing**   | Combinations of conditions and actions    |
| **State transition testing** | Behaviour across states and events        |
| **Use case testing**         | End-to-end user scenarios                 |
| **Error guessing**           | Experience-driven, targets likely faults  |

### Advantages

* Unbiased — the tester is not influenced by how the code was written
* Efficient for large systems
* Finds **missing functionality**, which white box testing cannot
* Tests are reusable across implementations

### Disadvantages

* **Limited coverage** — untested paths may remain
* **Redundant tests** are possible without visibility into the code
* Cannot locate the defect, only reveal it
* Ineffective at finding hidden internal errors such as dead code

| Aspect            | Black Box          | White Box            |
| ----------------- | ------------------ | -------------------- |
| Code knowledge    | Not required       | Required             |
| Basis             | Specification      | Source code          |
| Finds missing features | **Yes**       | No                   |
| Finds dead code   | No                 | **Yes**              |

> Black box testing is the only technique that can find a **missing** requirement — you cannot discover absent code by reading the code that exists.

### Example

Testing a login form: valid credentials, invalid password, empty fields, SQL injection strings, and 500-character usernames — all designed from the specification without ever reading the authentication source.
$md$, 1, true),

  (sid, 2, 'Explain Boundary Value Analysis with suitable examples.', $md$
**Boundary Value Analysis (BVA)** concentrates test cases at the **edges** of input ranges, because defects cluster there far more than in the middle of a range.

### The Rationale

Programmers make **off-by-one** errors: writing `<` where `<=` was meant, or starting a loop at 1 instead of 0. These mistakes fail only at boundaries, so a test in the middle of a valid range will never catch them.

### The Standard Rule

For a valid range **[min, max]**, test:

```text
min - 1     just below     (invalid)
min         the boundary   (valid)
min + 1     just inside    (valid)
max - 1     just inside    (valid)
max         the boundary   (valid)
max + 1     just above     (invalid)
```

### Example 1 — Age Field (valid range 18 to 60)

| Test value | Expected | Reason                |
| ---------- | -------- | --------------------- |
| 17         | Reject   | Just below minimum    |
| 18         | Accept   | Minimum boundary      |
| 19         | Accept   | Just inside minimum   |
| 59         | Accept   | Just inside maximum   |
| 60         | Accept   | Maximum boundary      |
| 61         | Reject   | Just above maximum    |

### Example 2 — Password Length (8 to 16 characters)

Test lengths **7, 8, 9, 15, 16, 17**. A defect coded as `length > 8` instead of `length >= 8` is caught by exactly one of these — the 8-character case.

### Example 3 — Array of Size 100

Test indices **0** (first), **99** (last), **−1** and **100** (out of bounds). Index 100 is the classic buffer-overflow case.

### Two-Value vs Three-Value BVA

| Approach        | Values tested per boundary       |
| --------------- | -------------------------------- |
| **Two-value**   | boundary, boundary ± 1           |
| **Three-value** | boundary − 1, boundary, boundary + 1 |

Three-value (also called robustness testing) is more thorough and produces more test cases.

> BVA is the highest-yield black-box technique per test case written, which is why it is almost always applied alongside equivalence partitioning.

### Example

A discount applies for purchases "over ₹1000". BVA tests ₹999, ₹1000 and ₹1001 — immediately exposing whether the developer implemented "over" as `>` or `>=`, an ambiguity the requirement never settled.
$md$, 2, false),

  (sid, 2, 'Explain Equivalence Class Testing with suitable examples.', $md$
**Equivalence Class Testing**, or **equivalence partitioning**, divides the input domain into classes where all members are expected to be treated **identically** by the software. One representative from each class is then tested.

### The Rationale

If the program handles input 25 correctly, it will almost certainly handle 26, 27 and 28 the same way — they follow the same code path. Testing all of them adds cost without adding information.

```text
Input domain for age:

  ...  17 | 18 ......... 60 | 61 ...
  INVALID |     VALID       | INVALID
     |            |              |
  test -5      test 35       test 99
```

### Types of Classes

* **Valid equivalence classes** — acceptable inputs
* **Invalid equivalence classes** — inputs that must be rejected

### Example 1 — Age Field (valid 18 to 60)

| Class            | Range      | Representative | Expected |
| ---------------- | ---------- | -------------- | -------- |
| Invalid (below)  | < 18       | 10             | Reject   |
| **Valid**        | 18 – 60    | 35             | Accept   |
| Invalid (above)  | > 60       | 75             | Reject   |
| Invalid (type)   | non-numeric| "abc"          | Reject   |

Four test cases replace potentially thousands.

### Example 2 — Bank Withdrawal (₹100 to ₹20,000, multiples of 100)

| Class                | Representative | Expected |
| -------------------- | -------------- | -------- |
| Below minimum        | ₹50            | Reject   |
| Valid multiple       | ₹5,000         | Accept   |
| Valid, not multiple  | ₹5,050         | Reject   |
| Above maximum        | ₹25,000        | Reject   |

### Example 3 — Password Strength

Classes: too short, valid length without special character, valid strong password, exceeds maximum length.

### Guidelines for Forming Classes

* A **range** yields one valid and two invalid classes
* A **specific value** yields one valid and two invalid classes
* A **set of values** yields one valid class per member (if handled differently) and one invalid class
* A **boolean** yields one valid and one invalid class

### Combining with BVA

Equivalence partitioning identifies **which** ranges to test; BVA identifies **where within** them to test. Used together they give strong coverage with few test cases.

> Equivalence partitioning is a reduction technique: its purpose is to justify *not* writing thousands of redundant tests.

### Example

A form accepting values 1–999 has three classes. Testing 0, 500 and 1000 covers all three; adding BVA values 1, 2, 998 and 999 gives thorough coverage in seven tests rather than 999.
$md$, 3, false),

  (sid, 2, 'Explain White Box Testing and its characteristics.', $md$
**White box testing** — also called structural, glass box or clear box testing — designs test cases from **knowledge of the internal code structure**. The tester reads the source and derives tests to exercise its logic.

```text
          +---------------------------+
input --->| if (a > b) { ... }        |---> output
          | while (i < n) { ... }     |
          +---------------------------+
        tester can SEE and target every path
```

### Characteristics

* **Code-based** — requires access to source and programming knowledge
* Applied mainly at **unit** and **integration** levels
* Measurable through **coverage metrics**
* Can find **dead code**, **infeasible paths** and **hidden logic errors**
* Typically performed by **developers**

### Coverage Criteria

| Criterion             | Requirement                                    | Strength |
| --------------------- | ---------------------------------------------- | -------- |
| **Statement coverage**| Every statement executed at least once          | Weakest  |
| **Branch coverage**   | Every decision takes both true and false        | Stronger |
| **Condition coverage**| Every sub-condition takes both values           | Stronger |
| **Path coverage**     | Every independent path executed                 | Strongest|

**Why statement coverage is weak**

```text
if (a > 0)
    x = x / a;

One test with a = 5 gives 100% STATEMENT coverage,
but never tests a <= 0 — where a divide-by-zero lurks.
Branch coverage would require it.
```

### Techniques

* **Basis path testing** — using cyclomatic complexity to find independent paths
* **Loop testing** — zero, one, typical, maximum and boundary iterations
* **Data flow testing** — tracking definition and use of variables
* **Control flow testing** — exercising the control graph

### Advantages and Disadvantages

| Advantages                        | Disadvantages                         |
| --------------------------------- | ------------------------------------- |
| Thorough internal coverage        | Cannot find **missing** functionality |
| Finds dead and unreachable code   | Requires programming skill            |
| Optimises code paths              | Expensive for large systems           |
| Measurable by coverage tools      | Tests break when code is refactored   |

> White box testing verifies that the code that exists is correct; it is structurally incapable of noticing code that should exist and does not.

### Example

A function with nested conditions has 8 possible paths. Black box tests derived from the specification exercise 3 of them. White box analysis identifies the remaining 5, one of which contains an unhandled null reference.
$md$, 4, false),

  (sid, 2, 'Explain Basis Path Testing and describe the steps involved in performing it.', $md$
**Basis path testing** is a white box technique that derives a **minimal set of independent paths** through a program, guaranteeing every statement is executed at least once and every branch taken in both directions.

### Step 1 — Draw the Control Flow Graph (CFG)

Represent the program as a graph: **nodes** are statements or blocks, **edges** are control transfers.

```text
        1
        |
        2  <-- if condition
       / \
      3   4
       \ /
        5
        |
        6
```

### Step 2 — Compute Cyclomatic Complexity

Three equivalent formulas:

```text
V(G) = E - N + 2        E = edges, N = nodes
V(G) = P + 1            P = number of predicate (decision) nodes
V(G) = R                R = number of enclosed regions
```

For the graph above: E = 6, N = 6 → **V(G) = 6 − 6 + 2 = 2**

### Step 3 — Determine the Independent Paths

An **independent path** introduces at least one edge not covered by previous paths. The number of such paths equals V(G).

```text
Path 1: 1 - 2 - 3 - 5 - 6
Path 2: 1 - 2 - 4 - 5 - 6
```

### Step 4 — Prepare Test Cases

Design one test case per independent path, choosing inputs that force execution down that path, and state the expected result for each.

### Interpreting Cyclomatic Complexity

| V(G)    | Risk assessment              |
| ------- | ---------------------------- |
| 1 – 10  | Simple, low risk             |
| 11 – 20 | Moderate complexity          |
| 21 – 50 | Complex, high risk           |
| > 50    | Untestable, must be refactored |

V(G) serves three purposes at once: it is the **number of test cases** needed for basis path coverage, an **upper bound on the testing effort**, and a **maintainability metric**.

### Worked Example

```text
read A, B
if (A > B)
    max = A
else
    max = B
print max
```

Predicate nodes P = 1, so **V(G) = 1 + 1 = 2**. Two test cases suffice: (A=5, B=3) and (A=2, B=8).

> Cyclomatic complexity is one of the few metrics that is simultaneously a test-planning number and a code-quality warning.

### Example

A module measures V(G) = 34. Rather than writing 34 test cases, the team refactors it into three functions with complexities of 8, 11 and 9 — easier to test *and* easier to maintain.
$md$, 5, false),

  (sid, 2, 'Explain Loop Testing and its different approaches.', $md$
**Loop testing** is a white box technique focusing specifically on the validity of loop constructs, because loops are where boundary and initialisation errors concentrate.

### Why Loops Deserve Special Attention

Common loop defects include off-by-one iteration counts, incorrect initialisation, wrong termination conditions, and failure to handle the zero-iteration case.

### 1. Simple Loops (n = maximum iterations)

Test the following cases:

```text
1. Skip the loop entirely        (0 iterations)
2. Exactly 1 pass
3. Exactly 2 passes
4. m passes, where m < n         (typical case)
5. n - 1 passes
6. n passes
7. n + 1 passes                  (should be impossible — verify)
```

The **zero-iteration** case is the one most often forgotten, and the one that most often fails — an empty list, an empty file, no search results.

### 2. Nested Loops

Testing every combination is combinatorially explosive, so a reduction strategy is used:

```text
1. Start at the INNERMOST loop; set all outer loops to minimum values
2. Apply simple-loop tests to the innermost loop,
   holding outer loops at their minimum iteration counts
3. Work OUTWARD, keeping already-tested inner loops at typical values
4. Continue until all loops are tested
```

### 3. Concatenated Loops

Two loops in sequence:

* If **independent** — test each as a simple loop
* If **dependent** (the second uses a value from the first) — treat them as nested

### 4. Unstructured Loops

Loops with jumps into or out of the body. **Recommendation: do not test them — redesign them.** They cannot be reasoned about reliably, and structured refactoring is cheaper than exhaustive testing.

| Loop type      | Strategy                          |
| -------------- | --------------------------------- |
| Simple         | 7 standard cases                  |
| Nested         | Inside out, others at minimum     |
| Concatenated   | Independent → separate; dependent → nested |
| Unstructured   | Refactor rather than test         |

> The zero-iteration test finds more defects than any other loop case, because developers write loops imagining the data is present.

### Example

A report loop over a result set works perfectly in testing until a filter returns no rows. The zero-iteration case was never tested, and the code divides by the record count — a crash in production from an untested empty case.
$md$, 6, false),

  (sid, 2, 'Explain Static Testing and its purpose.', $md$
**Static testing** examines software artefacts **without executing the code**. It analyses documents, design and source to find defects by inspection and analysis rather than by running the program.

### Static vs Dynamic Testing

| Aspect        | Static Testing         | Dynamic Testing        |
| ------------- | ---------------------- | ---------------------- |
| Code executed | **No**                 | Yes                    |
| Finds         | Defects in artefacts   | Failures in behaviour  |
| When          | Very early             | After build            |
| Cost of fix   | **Low**                | Higher                 |
| Examples      | Reviews, static analysis | Unit, system testing |

### Techniques

**A. Manual Review Techniques**

1. **Informal review** — a colleague reads the work; no formal process
2. **Walkthrough** — the author leads participants through the artefact
3. **Technical review** — peers with expertise examine it against standards
4. **Inspection** — the most formal, with defined roles, entry criteria, checklists and metrics

**B. Automated Static Analysis**

Tools examine source without running it, detecting:
* Syntax violations and coding-standard breaches
* Unreachable or dead code
* Uninitialised and unused variables
* Possible null dereferences
* Security patterns such as SQL injection risk
* Excessive cyclomatic complexity

### What Can Be Statically Tested

* Requirements and specifications
* Design documents and architecture
* Source code
* Test plans and test cases
* User documentation

### Purpose and Benefits

* **Early defect detection** — before code exists, when fixes are cheapest
* **Finds defects dynamic testing cannot** — unreachable code, ambiguous requirements, poor maintainability
* **Improves productivity** — fewer defects reach the testing phase
* **Knowledge sharing** — reviewers learn the system
* **Enforces standards** — consistent, maintainable code

> Roughly half of all defects originate in requirements and design, and only static testing can find them at the stage where they cost almost nothing to correct.

### Example

A requirements review finds the statement "the system shall be fast" and asks for a number. That single question prevents a performance dispute at acceptance testing months later — a defect removed before a line of code was written.
$md$, 7, false),

  (sid, 2, 'Explain Inspections in Software Testing.', $md$
An **inspection** is the most **formal** static testing technique — a rigorously structured peer examination of a work product, led by a trained moderator, following defined roles, checklists and entry/exit criteria. It was developed by **Michael Fagan** at IBM.

### Defined Roles

| Role         | Responsibility                                  |
| ------------ | ----------------------------------------------- |
| **Moderator**| Leads the inspection, enforces process, neutral  |
| **Author**   | Created the artefact; answers questions only     |
| **Reader**   | Paraphrases the work product aloud               |
| **Inspector**| Finds defects (all participants act as one)      |
| **Scribe**   | Records every defect raised                      |

The author deliberately does **not** lead — this separation is what prevents the review becoming a defence of the work.

### The Six Phases

```text
1. PLANNING       moderator checks entry criteria, selects team, schedules
2. OVERVIEW       author explains context (optional)
3. PREPARATION    each inspector studies the artefact INDIVIDUALLY
                  using checklists  <-- most defects are found here
4. INSPECTION     meeting: reader paraphrases, defects are LOGGED
5. REWORK         author corrects the defects
6. FOLLOW-UP      moderator verifies corrections; exit criteria checked
```

### The Cardinal Rule

> **Find defects — do not fix them, and do not discuss solutions during the meeting.**

Discussing fixes consumes the meeting and reduces the number of defects found. Solutions are the author's job afterwards.

### Characteristics

* Highly **formal**, with documented entry and exit criteria
* Driven by **checklists** of historically common defect types
* **Metrics collected** — defects per hour, per page, by type
* Feeds **process improvement**, not just this one artefact

### Effectiveness

Inspections typically remove **60–90%** of defects present in a work product, and are widely considered the single most effective quality technique available — more effective per hour than testing for certain defect classes.

| Technique   | Formality | Typical defect removal |
| ----------- | --------- | ---------------------- |
| Informal review | Very low | 25–40%              |
| Walkthrough | Low       | 30–50%                 |
| Technical review | Medium | 40–60%               |
| **Inspection** | **High** | **60–90%**           |

### Example

A code inspection of a payment module by four reviewers finds 23 defects in two hours, including a race condition that would appear only under concurrent load — a defect ordinary functional testing would likely have missed entirely.
$md$, 8, false),

  (sid, 2, 'Explain Structured Walkthroughs.', $md$
A **structured walkthrough** is a semi-formal static review in which the **author** leads a group of peers through a work product, explaining it step by step so that defects, omissions and misunderstandings surface.

### Key Distinction from an Inspection

```text
WALKTHROUGH:  the AUTHOR leads       -> educate + find defects
INSPECTION:   a MODERATOR leads      -> find defects (author is passive)
```

This difference in leadership defines everything else: walkthroughs are less formal, more educational, and less rigorous at defect detection.

### Participants

* **Author / Presenter** — leads the session and explains the artefact
* **Reviewers / Peers** — ask questions and raise concerns
* **Scribe** — records issues raised
* **Coordinator** — arranges the session (optional)

Managers are usually **excluded**, so that participants speak freely without appraisal concerns.

### The Process

```text
1. PREPARATION   author distributes the material in advance
2. WALKTHROUGH   author presents the artefact step by step;
                 reviewers question and raise defects
3. RECORDING     scribe logs all issues raised
4. REWORK        author addresses the issues
5. FOLLOW-UP     issues confirmed as resolved (often informally)
```

### Objectives

* **Detect defects** in the work product
* **Educate** the team about the design or code
* **Share knowledge**, reducing single-person dependency
* **Establish common understanding** of the approach
* **Gather alternative viewpoints**

### Characteristics

* **Informal to semi-formal** — no strict entry/exit criteria
* **No mandatory checklists**
* **Metrics optional**
* Shorter and cheaper than an inspection
* Applies to requirements, design, code, or test cases

### Comparison

| Aspect       | Walkthrough        | Inspection            |
| ------------ | ------------------ | --------------------- |
| Led by       | Author             | Moderator             |
| Formality    | Low–medium         | High                  |
| Checklists   | Optional           | Mandatory             |
| Entry/exit criteria | No          | Yes                   |
| Metrics      | Rarely             | Always                |
| Main goal    | Understanding + defects | Defect detection |
| Cost         | Lower              | Higher                |

> A walkthrough's teaching value is real: it is often the fastest way to bring a team to a shared understanding of a complex design.

### Example

A developer walks the team through a new caching design. A reviewer asks what happens when the cache and database disagree — a question that reveals an unhandled invalidation case. The design is corrected before implementation begins.
$md$, 9, false),

  (sid, 2, 'Explain Technical Reviews and their role in Software Quality Assurance.', $md$
A **technical review** is a peer examination of a work product by qualified technical experts, conducted to evaluate its **technical soundness**, conformance to standards, and fitness for purpose. It sits between the walkthrough and the inspection in formality.

### Participants

* **Technical experts / peers** — the core reviewers
* **Review leader** — may be the author or an appointed leader
* **Author** — presents and clarifies
* **Scribe** — records findings and decisions

Participation is by **technical competence**, not organisational position.

### Objectives

* Assess whether the artefact is **technically correct**
* Verify conformance to **standards and specifications**
* Evaluate **alternatives** and design decisions
* Achieve **consensus** on the technical approach
* Detect defects early
* Provide a documented **recommendation** — accept, accept with changes, or rework

### The Process

```text
1. PLANNING      define scope, select reviewers, distribute material
2. PREPARATION   reviewers study the artefact independently
3. REVIEW MEETING discuss findings, evaluate alternatives, decide
4. RECORDING     document defects and the technical decision
5. REWORK        author addresses findings
6. FOLLOW-UP     verify the changes
```

### Role in Software Quality Assurance

**1. Early Defect Removal** — removes defects at their source, before propagation
**2. Standards Enforcement** — coding, design and documentation conventions
**3. Risk Reduction** — technical risks identified before implementation commits resources
**4. Design Validation** — architecture assessed by experienced engineers
**5. Knowledge Transfer** — spreads understanding across the team
**6. Process Metrics** — defect data feeds continuous improvement
**7. Traceability** — confirms the artefact satisfies its requirements

### Comparison of Review Types

| Type              | Formality | Led by     | Primary aim               |
| ----------------- | --------- | ---------- | ------------------------- |
| Informal review   | None      | Anyone     | Quick feedback            |
| Walkthrough       | Low       | Author     | Understanding + defects   |
| **Technical review** | **Medium** | **Leader/peer** | **Technical soundness** |
| Inspection        | High      | Moderator  | Rigorous defect detection |

### Position in the Quality System

Technical reviews are **verification** activities — static, performed without executing code, and applied throughout development rather than at the end. They complement dynamic testing: reviews catch design and standards defects, testing catches behavioural ones.

> A technical review answers a question testing cannot reach: *is this the right technical approach?* — a judgement no test case can make.

### Example

A technical review of a proposed database schema finds a missing index that would have caused a table scan on the busiest query. Discovered in review it is a one-line change; discovered in production load testing it would mean a migration on live data.
$md$, 10, false);

  RAISE NOTICE 'Software Testing Methodologies — Unit 2: 10 questions inserted.';
END $do$;
