-- =====================================================================
-- Study-With-AI seed — Software Testing Methodologies (4th Year) — UNIT 1
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Software Testing Methodologies' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Software Testing Methodologies" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Define Software Testing and explain its importance in software development.',
    'Explain the evaluation of software testing and the factors used to evaluate a testing process.',
    'Explain common Software Testing Myths and Facts.',
    'Explain the goals of Software Testing.',
    'Explain the Software Testing Model and its major activities.',
    'Explain the important terminology used in Software Testing.',
    'Explain the Software Testing Life Cycle (STLC) and describe its different phases.',
    'Explain Software Testing Methodology and its major activities.',
    'Explain Verification and Validation activities and differentiate between Verification and Validation.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Define Software Testing and explain its importance in software development.', $md$
**Software testing** is the process of executing a program with the intent of **finding defects**, and of verifying that the software meets its specified requirements. It is an investigation carried out to give stakeholders information about the **quality** of the product.

### Formal Definitions

* **IEEE** — the process of exercising software to verify that it satisfies specified requirements and to detect errors
* **Myers** — the process of executing a program with the intent of finding errors

The second definition matters: testing is a **destructive** activity by design. A test that finds nothing has, in one sense, told you very little.

### Importance

**1. Defect Detection**
Finds errors before users do, when they are far cheaper to fix.

**2. Cost of Late Defects**
The cost of fixing a defect rises sharply with the phase in which it is found:

| Phase found  | Relative cost |
| ------------ | ------------- |
| Requirements | 1×            |
| Design       | 5×            |
| Coding       | 10×           |
| Testing      | 20×           |
| Production   | **100× or more** |

**3. Quality Assurance** — confirms the product meets requirements and standards
**4. Reliability** — builds confidence the software behaves correctly under expected conditions
**5. Security** — uncovers vulnerabilities before attackers do
**6. Customer Satisfaction** — a defective release damages reputation more than a delayed one
**7. Legal and Safety Compliance** — mandatory in medical, aviation and financial domains

### The Limits of Testing

> **Testing can show the presence of defects, but never their absence.** — Dijkstra

Exhaustive testing is impossible: even a program with two 32-bit integer inputs has 2⁶⁴ combinations. Testing is therefore a **risk-reduction** activity, not a proof of correctness.

### Example

The Ariane 5 rocket exploded in 1996 because of an unhandled 64-bit to 16-bit conversion in reused code that was never re-tested for the new flight profile. A test costing a few thousand dollars would have prevented a loss of about $370 million.
$md$, 1, true),

  (sid, 1, 'Explain the evaluation of software testing and the factors used to evaluate a testing process.', $md$
**Evaluating a testing process** means judging how effective, efficient and trustworthy the testing itself is. Testing consumes a large share of project effort, so it must be measured like any other engineering activity.

### Why Evaluation Is Needed

Without measurement there is no way to know whether testing is finding the defects that matter, whether it is finishing on time, or when it is safe to stop.

### Key Evaluation Factors

**1. Test Coverage**
How much of the software has been exercised.

| Coverage type | Measures                                |
| ------------- | --------------------------------------- |
| Statement     | Lines executed                          |
| Branch        | Both outcomes of each decision          |
| Path          | Independent paths through the code      |
| Requirement   | Requirements with at least one test     |

**2. Defect Detection Efficiency (DDE)**

```text
DDE = (defects found in testing / total defects) x 100
```

Total defects includes those found later by users, so DDE can only be computed retrospectively.

**3. Defect Removal Efficiency (DRE)**

```text
DRE = defects removed before release
      -------------------------------- x 100
      defects before + after release
```

**4. Defect Density**

```text
Defect density = number of defects / size (KLOC or function points)
```

**5. Test Effectiveness** — the ratio of defects found to tests executed
**6. Test Efficiency** — effort and time consumed per defect found
**7. Test Case Quality** — clarity, repeatability, traceability to requirements
**8. Mean Time Between Failures (MTBF)** — a reliability measure of the delivered product

### Evaluating Test Cases Themselves

**Mutation testing** deliberately introduces small faults ("mutants") into the code. If the test suite fails to detect them, the suite is weak — an assessment of the *tests* rather than the software.

> A suite with 100% statement coverage can still miss most defects; coverage measures what was *executed*, not what was *checked*.

### Example

A project reports 95% statement coverage yet users find many defects. Investigation shows tests execute code without asserting outcomes — high coverage, low effectiveness.
$md$, 2, false),

  (sid, 1, 'Explain common Software Testing Myths and Facts.', $md$
Misconceptions about testing lead to poor planning, inadequate budgets and defective releases. Correcting them is part of establishing a mature testing culture.

### Common Myths and the Facts

**Myth 1 — "Testing is too expensive."**
**Fact:** Testing costs far less than fixing defects in production. A defect found after release can cost 100× more than one found in design, before counting reputational damage.

**Myth 2 — "Testing is time-consuming and delays delivery."**
**Fact:** Testing performed *in parallel* with development shortens overall schedules by preventing rework and late surprises.

**Myth 3 — "Only fully developed products can be tested."**
**Fact:** Testing should start at the **requirements** stage. Reviewing requirements and designs catches defects long before code exists.

**Myth 4 — "Complete testing is possible."**
**Fact:** Exhaustive testing is **impossible** — the input space is effectively infinite. Testing is risk-based prioritisation.

**Myth 5 — "A tested product is bug-free."**
**Fact:** Testing reduces risk; it cannot prove absence of defects.

**Myth 6 — "Missed defects are the testers' fault."**
**Fact:** Quality is a shared responsibility of the whole team. Blaming testers discourages honest reporting.

**Myth 7 — "Testers should only find bugs, not prevent them."**
**Fact:** Early involvement in reviews **prevents** defects, which is far cheaper than finding them later.

**Myth 8 — "Automation removes the need for manual testing."**
**Fact:** Automation excels at repetitive regression checks. Exploratory testing, usability and intuition remain human strengths.

**Myth 9 — "Anyone can test."**
**Fact:** Effective testing requires domain knowledge, analytical skill and specific technique.

| Myth                        | Reality                          |
| --------------------------- | -------------------------------- |
| Testing is expensive        | Defects are more expensive       |
| Test at the end             | Test from requirements onward    |
| Complete testing possible   | Infeasible; prioritise by risk   |
| Automation replaces manual  | They cover different risks       |

> The most damaging myth is that testing is a phase. Treating it as an activity spanning the whole lifecycle is what distinguishes mature organisations.

### Example

A team defers all testing to the final two weeks and discovers an architectural flaw requiring redesign. Catching it during a design review would have cost days, not months.
$md$, 3, false),

  (sid, 1, 'Explain the goals of Software Testing.', $md$
Testing serves several goals at once, and they can be grouped by the time horizon over which they matter.

### Short-Term (Immediate) Goals

**1. Bug Discovery**
The primary immediate goal — find defects at any stage before release.

**2. Bug Prevention**
Analysing found defects reveals patterns, which feed back into better design and coding practice. Prevention is more valuable than detection.

### Long-Term Goals

**1. Reliability** — the software behaves correctly over sustained use
**2. Quality** — correctness, maintainability, portability, usability
**3. Customer Satisfaction** — the delivered product meets real needs
**4. Risk Management** — identify and reduce the risk of costly failure

### Post-Implementation Goals

**1. Reduced Maintenance Cost** — fewer field defects means less corrective maintenance
**2. Improved Testing Process** — lessons from each project strengthen the next

### Quality Attributes Targeted

| Attribute       | Question it answers                    |
| --------------- | -------------------------------------- |
| Correctness     | Does it do what was specified?          |
| Reliability     | Does it keep working over time?         |
| Usability       | Can users accomplish their tasks?       |
| Efficiency      | Does it use resources sensibly?         |
| Maintainability | Can it be changed safely?               |
| Portability     | Does it run in other environments?      |
| Security        | Does it resist misuse?                  |

### The Testing Mindset

```text
Wrong goal: "prove the software works"
Right goal: "find the cases where it does not"
```

A tester who sets out to confirm correctness will design gentle tests and find little. A tester who sets out to break the software finds the defects that matter.

> Testing that aims to demonstrate success is not testing — it is a demonstration.

### Example

A payment module tested only with valid amounts passes easily. Tested with zero, negative, very large and concurrent transactions, it reveals three defects — the difference is entirely in the goal the tester adopted.
$md$, 4, false),

  (sid, 1, 'Explain the Software Testing Model and its major activities.', $md$
A **software testing model** describes how testing activities relate to development activities across the lifecycle. The best-known is the **V-Model**, which pairs each development phase with a corresponding test phase.

### The V-Model

```text
Requirements ------------------> Acceptance Testing
    \                                   /
  Specification --------------> System Testing
       \                             /
     Design ----------------> Integration Testing
          \                       /
        Coding ---------> Unit Testing
              \             /
                CONSTRUCTION
```

The left arm descends through development; the right arm ascends through testing. Each horizontal pair means: **the test plan for that level is written from that development document**, and written **early** — not after coding.

### Major Activities

**1. Test Planning** — scope, strategy, resources, schedule, risks
**2. Test Design** — deriving test cases from requirements and design
**3. Test Environment Setup** — hardware, software, data
**4. Test Execution** — running tests and recording actual results
**5. Defect Reporting** — logging, prioritising and tracking defects
**6. Retesting and Regression** — confirming fixes and checking nothing else broke
**7. Test Closure** — reporting metrics and capturing lessons

### Levels of Testing

| Level        | Tests            | Derived from        |
| ------------ | ---------------- | ------------------- |
| Unit         | Individual modules | Detailed design   |
| Integration  | Module interfaces  | Architecture      |
| System       | Whole system       | Specification     |
| Acceptance   | Business fitness   | Requirements      |

### Strengths and Weaknesses of the V-Model

* **Strengths** — early test planning, clear traceability, defects caught at the right level
* **Weaknesses** — rigid, poorly suited to changing requirements, no working software until late

> The V-Model's real contribution is the insight that **test design should begin when the corresponding document is written**, not when code is finished.

### Example

While the requirements document is being written, the team writes acceptance tests from it. Ambiguities surface immediately — "the system shall respond quickly" cannot be turned into a test, which exposes the requirement as untestable before any code exists.
$md$, 5, false),

  (sid, 1, 'Explain the important terminology used in Software Testing.', $md$
Precise vocabulary matters in testing, because words like "bug" are used loosely in conversation but have distinct technical meanings.

### The Error–Defect–Failure Chain

```text
ERROR (human mistake)
   |
   v
DEFECT / FAULT / BUG (in the artefact)
   |
   v  (when that code executes)
FAILURE (observable wrong behaviour)
```

| Term        | Definition                                    | Where it lives |
| ----------- | --------------------------------------------- | -------------- |
| **Error**   | A human mistake                               | In the person  |
| **Defect**  | The resulting flaw in code or document        | In the product |
| **Failure** | Deviation from expected behaviour at run time | In execution   |
| **Fault**   | Synonym for defect                            | In the product |

A defect that is never executed causes **no failure** — which is why defects can lie dormant for years.

### Other Essential Terms

* **Test case** — a set of inputs, execution conditions and **expected results**
* **Test suite** — a collection of related test cases
* **Test script** — the automated implementation of a test case
* **Test data** — the inputs used
* **Test bed / environment** — hardware and software configuration for testing
* **Test oracle** — the mechanism for deciding whether the result is correct
* **Verification** — are we building the product right?
* **Validation** — are we building the right product?
* **Debugging** — locating and fixing a defect (a **developer** activity, not testing)
* **Regression testing** — re-running tests after change
* **Smoke testing** — a quick check that the build is stable enough to test
* **Sanity testing** — a narrow check of specific functionality after a fix
* **Severity** — the technical impact of a defect
* **Priority** — the business urgency of fixing it

### Severity vs Priority

| Case                                   | Severity | Priority |
| -------------------------------------- | -------- | -------- |
| System crashes on a rarely used report | High     | Low      |
| Company logo misspelt on home page     | Low      | High     |

These are **independent** dimensions, which is why bug trackers record both.

> The test oracle is the most underrated concept: without a reliable way to decide "is this output correct?", executing tests proves nothing.

### Example

A developer mistypes `<=` as `<` (error), producing an off-by-one defect. It causes no failure until a boundary input is used — which is precisely why boundary value testing exists.
$md$, 6, false),

  (sid, 1, 'Explain the Software Testing Life Cycle (STLC) and describe its different phases.', $md$
The **Software Testing Life Cycle (STLC)** is the sequence of phases carried out by the testing team, each with defined entry criteria, activities, deliverables and exit criteria.

### The Six Phases

```text
Requirement Analysis
        v
   Test Planning
        v
 Test Case Development
        v
Test Environment Setup
        v
   Test Execution
        v
   Test Closure
```

**1. Requirement Analysis**
* **Activities** — study requirements, identify testable ones, raise ambiguities, perform feasibility analysis
* **Deliverable** — Requirement Traceability Matrix (RTM)
* **Exit** — requirements understood and clarified

**2. Test Planning**
* **Activities** — define scope, strategy, effort estimation, resource and tool selection, risk analysis
* **Deliverable** — Test Plan document
* **Exit** — plan approved

**3. Test Case Development**
* **Activities** — write test cases, prepare test data, create automation scripts, review
* **Deliverable** — test cases, test data, scripts
* **Exit** — reviewed and signed off

**4. Test Environment Setup**
* **Activities** — configure hardware and software, install the build, run smoke tests
* **Deliverable** — ready environment
* **Exit** — smoke test passes
* *This phase can run in parallel with phase 3*

**5. Test Execution**
* **Activities** — execute tests, compare actual against expected, log defects, retest fixes, run regression
* **Deliverable** — test results, defect reports, updated RTM
* **Exit** — planned tests executed, critical defects closed

**6. Test Closure**
* **Activities** — evaluate exit criteria, prepare summary report, analyse metrics, capture lessons
* **Deliverable** — Test Closure Report
* **Exit** — sign-off obtained

### Entry and Exit Criteria

| Phase        | Entry                        | Exit                        |
| ------------ | ---------------------------- | --------------------------- |
| Planning     | Requirements available       | Plan approved               |
| Development  | Plan approved                | Test cases reviewed         |
| Execution    | Environment and build ready  | Tests run, defects closed   |
| Closure      | Execution complete           | Report signed off           |

> STLC's value is its **exit criteria**: they turn "have we tested enough?" from an opinion into a checkable condition.

### Example

A team cannot begin execution because the smoke test fails on the new build. The environment phase's exit criteria correctly block progress, avoiding days wasted testing a broken deployment.
$md$, 7, false),

  (sid, 1, 'Explain Software Testing Methodology and its major activities.', $md$
A **software testing methodology** is the overall strategy governing how testing is carried out — which techniques are used, at which levels, in what order, and to what standard.

### Components of a Methodology

* **Test strategy** — the overall approach and its rationale
* **Test levels** — unit, integration, system, acceptance
* **Test types** — functional, performance, security, usability
* **Techniques** — black box, white box, grey box
* **Entry and exit criteria** — when to start and when to stop
* **Metrics** — how progress and quality are measured

### Major Activities

**1. Test Strategy Definition**
Decide scope, risk priorities, automation approach and tooling.

**2. Test Level Planning**

| Level        | Focus                    | Usually performed by |
| ------------ | ------------------------ | -------------------- |
| Unit         | One module in isolation  | Developers           |
| Integration  | Interfaces between modules | Developers/testers |
| System       | End-to-end behaviour     | Testers              |
| Acceptance   | Business fitness         | Users/customer       |

**3. Test Type Selection**
* **Functional** — does it do what it should?
* **Non-functional** — performance, load, stress, security, usability
* **Structural** — internal logic coverage
* **Change-related** — retesting and regression

**4. Test Design Technique Selection**
* **Black box** — equivalence partitioning, boundary value analysis, decision tables
* **White box** — statement, branch, path and loop coverage
* **Experience-based** — error guessing, exploratory testing

**5. Integration Approach**

| Approach     | Order                         | Needs         |
| ------------ | ----------------------------- | ------------- |
| Big bang     | All modules at once           | Nothing extra |
| Top-down     | High-level first              | **Stubs**     |
| Bottom-up    | Low-level first               | **Drivers**   |
| Sandwich     | Both directions               | Both          |

**6. Execution and Reporting**
Run tests, log defects, track metrics, report status.

> The methodology's job is to make testing **repeatable**: two competent testers following it should arrive at comparable coverage.

### Example

For a banking application, the methodology mandates white-box unit testing with 90% branch coverage, bottom-up integration using drivers, system-level security testing, and user acceptance testing by the bank's own staff.
$md$, 8, false),

  (sid, 1, 'Explain Verification and Validation activities and differentiate between Verification and Validation.', $md$
**Verification** and **validation** are the two complementary halves of quality assurance, and confusing them is a common source of project failure.

### The Distinction in One Line

```text
VERIFICATION:  "Are we building the product RIGHT?"
VALIDATION:    "Are we building the RIGHT product?"
```

Verification checks the product against its **specification**. Validation checks it against the **user's actual need**.

### Verification

**Definition** — evaluating work products (documents, design, code) to determine whether they satisfy the requirements laid down at the start of that phase.

**Characteristics**
* **Static** — usually performed **without executing** the code
* Performed **throughout** development
* Finds defects **early and cheaply**

**Activities**
* Requirement reviews
* Design reviews
* Code walkthroughs
* Inspections
* Static analysis

### Validation

**Definition** — evaluating the **executable** software to determine whether it satisfies the intended use and user expectations.

**Characteristics**
* **Dynamic** — requires **running** the software
* Performed **after** the product or component is built
* Finds defects that only appear in behaviour

**Activities**
* Unit, integration, system testing
* Acceptance testing
* Performance and usability testing

### Side-by-Side Comparison

| Aspect         | Verification              | Validation                |
| -------------- | ------------------------- | ------------------------- |
| Question       | Building it right?        | Building the right thing? |
| Method         | Static — reviews          | Dynamic — execution       |
| Executes code? | No                        | Yes                       |
| Checks against | Specification             | User needs                |
| Timing         | Throughout                | After build               |
| Performed by   | Developers, reviewers, QA | Testers, users            |
| Cost of defect | Low                       | Higher                    |
| Example        | Design review             | System testing            |

### Why Both Are Necessary

A product can pass verification completely and still fail validation — it correctly implements a specification that was **wrong**. This is the single most expensive kind of project failure, because everything built on the wrong requirement must be discarded.

> Verification cannot detect a wrong requirement; only validation can. That is why user involvement early is worth more than any amount of internal review.

### Example

A team builds a report exactly as specified — verification passes at every stage. At acceptance the customer explains they needed a **weekly** breakdown, not monthly. The software is correct against the spec and useless in practice: a validation failure.
$md$, 9, false);

  RAISE NOTICE 'Software Testing Methodologies — Unit 1: 9 questions inserted.';
END $do$;
