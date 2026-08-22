-- =====================================================================
-- Study-With-AI seed — Advanced Operating Systems (4th Year) — UNIT 1
-- Idempotent: deletes each question before re-inserting.
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Advanced Operating Systems' AND active LIMIT 1;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'Subject "Advanced Operating Systems" not found — check the exact name in Admin.';
  END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Explain the overview and major characteristics of Advanced Operating Systems.',
    'Explain the functions of an Operating System.',
    'Explain the major Design Approaches used in Operating Systems.',
    'Explain the different Types of Advanced Operating Systems.',
    'Explain Synchronization Mechanisms used in operating systems.',
    'Explain the concept of a Process and its significance in concurrent systems.',
    'Explain Concurrent Processes and the need for synchronization.',
    'Explain the Critical Section Problem and its requirements.',
    'Explain other important Synchronization Problems.',
    'Explain Language Mechanisms for Synchronization.',
    'Explain Axiomatic Verification of Parallel Programs.',
    'Explain the preliminaries and basic concepts of Process Deadlocks.',
    'Explain different Models of Deadlocks.',
    'Explain Resources and their role in deadlock situations.',
    'Explain the concept of System State in relation to deadlocks.',
    'Explain the necessary and sufficient conditions for a Deadlock.',
    'Explain systems with Single-Unit Requests.',
    'Explain Consumable Resources and deadlocks involving them.',
    'Explain Reusable Resources and deadlocks involving them.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain the overview and major characteristics of Advanced Operating Systems.', $md$
An **Advanced Operating System** extends the classical single-machine operating system to handle **multiple processors, multiple machines, real-time deadlines or embedded constraints**. Where a traditional OS manages one computer's resources, an advanced OS must coordinate resources that are **distributed, concurrent and unreliable**.

### Why They Are Needed

Modern computing is no longer one CPU running one program at a time. Multi-core processors, clusters, clouds, sensor networks and real-time controllers all impose demands a conventional OS was never designed to meet.

### Major Characteristics

* **Concurrency** — many processes execute genuinely simultaneously, not merely interleaved.
* **Resource sharing** — processors, memory and files are shared across machines.
* **Transparency** — users see a single system, though many machines are involved.
* **Scalability** — performance improves as nodes are added.
* **Fault tolerance** — the failure of one node must not stop the system.
* **No global clock** — in distributed systems there is no single notion of "now".
* **No shared memory** — coordination happens by **message passing**.
* **Heterogeneity** — different hardware and operating systems must cooperate.

### Kinds of Transparency

| Transparency | What is hidden                        |
| ------------ | ------------------------------------- |
| Access       | Differences in data representation    |
| Location     | Where a resource physically resides   |
| Migration    | That a resource has moved             |
| Replication  | That several copies exist             |
| Concurrency  | That others are using it too          |
| Failure      | That a component has failed           |

> The defining difficulty of an advanced OS is that no component ever has complete, current knowledge of the whole system — every decision is made on partial, slightly stale information.

### Example

A cloud file service shows one folder to the user, though the files may be replicated across three data centres. Location, replication and failure are all hidden — that concealment *is* the operating system's achievement.
$md$, 1, true),

  (sid, 1, 'Explain the functions of an Operating System.', $md$
An **operating system** is the software layer between hardware and applications. It has two complementary roles: as a **resource manager**, allocating hardware among competing users, and as an **extended machine**, presenting a clean abstraction in place of awkward hardware.

### Principal Functions

**1. Process Management**
Creating, scheduling, suspending and terminating processes; providing inter-process communication and synchronisation; detecting and handling deadlock.

**2. Memory Management**
Tracking which memory is in use, allocating and freeing it, and providing **virtual memory** so programs may exceed physical RAM.

**3. File System Management**
Organising data into files and directories, controlling access permissions, and mapping logical files onto physical blocks.

**4. Device (I/O) Management**
Providing device drivers, buffering, caching and spooling, so applications need not know device specifics.

**5. Protection and Security**
Authenticating users, enforcing access control, and isolating processes so one cannot corrupt another.

**6. Networking**
Providing protocol stacks and the socket interface for communication between machines.

**7. User Interface**
Offering a shell or graphical interface, and the **system call** interface used by programs.

```text
+---------------------------+
|      Applications         |
+---------------------------+
|   System call interface   |
+---------------------------+
| Process | Memory | File   |  <- OS functions
|   I/O   | Network| Security|
+---------------------------+
|        Hardware           |
+---------------------------+
```

| Role              | Meaning                                   |
| ----------------- | ----------------------------------------- |
| Resource manager  | Decides who gets what, and when           |
| Extended machine  | Hides hardware behind clean abstractions  |

> Every OS function is ultimately about one of two things: sharing something scarce fairly, or hiding something complicated.

### Example

Opening a file requires no knowledge of disk sectors, rotational delay or the SATA protocol. `open()` and `read()` are the abstraction; the OS performs the translation.
$md$, 2, false),

  (sid, 1, 'Explain the major Design Approaches used in Operating Systems.', $md$
Operating systems are structured in several distinct ways, and the choice governs performance, reliability and maintainability.

### 1. Monolithic Structure

The entire OS runs as a single program in **kernel mode**, with all components able to call each other directly.

* **Advantages** — very fast, since calls are ordinary function calls
* **Disadvantages** — a fault anywhere can crash everything; hard to maintain
* **Examples** — traditional UNIX, MS-DOS

### 2. Layered Approach

The OS is divided into layers, each using only the layer below.

```text
Layer 5 | User programs
Layer 4 | I/O management
Layer 3 | Device drivers
Layer 2 | Memory management
Layer 1 | CPU scheduling
Layer 0 | Hardware
```

* **Advantages** — modular, easier to debug and verify
* **Disadvantages** — crossing many layers costs performance; deciding layer order is difficult
* **Example** — THE operating system

### 3. Microkernel

Only essential functions — scheduling, basic memory management and inter-process communication — stay in the kernel. File systems, drivers and network stacks run as **user-space servers**.

* **Advantages** — reliable (a failed driver does not crash the kernel), secure, easy to extend
* **Disadvantages** — slower, because services communicate by message passing
* **Examples** — Mach, QNX, MINIX

### 4. Modular / Hybrid

A monolithic core that loads **modules** dynamically at runtime, blending monolithic speed with microkernel flexibility.

* **Examples** — Linux, Windows NT, macOS

### 5. Virtual Machine

A hypervisor presents several virtual copies of the hardware, each running its own OS.

* **Advantages** — strong isolation, several operating systems on one machine
* **Examples** — VMware, Xen, KVM

| Approach     | Speed     | Reliability | Extensibility |
| ------------ | --------- | ----------- | ------------- |
| Monolithic   | Very high | Low         | Low           |
| Layered      | Medium    | Medium      | Medium        |
| Microkernel  | Lower     | Very high   | Very high     |
| Modular      | High      | Medium-high | High          |
| Virtual machine | Medium | Very high   | High          |

> Essentially all these designs trade **performance** against **isolation**: the more separation between components, the more communication costs.

### Example

A crashing graphics driver takes down a monolithic kernel entirely, but in a microkernel it is a user-space process that can simply be restarted.
$md$, 3, false),

  (sid, 1, 'Explain the different Types of Advanced Operating Systems.', $md$
Advanced operating systems are classified by the kind of hardware they manage and the guarantees they must provide.

### 1. Multiprocessor Operating Systems

Manage several CPUs that **share memory** within one machine.

* Must schedule across processors and keep caches coherent
* Two organisations: **symmetric (SMP)**, where every CPU runs the OS as a peer, and **asymmetric**, where one master CPU controls the others
* Communication through **shared memory**

### 2. Distributed Operating Systems

Manage several **independent machines** connected by a network, presenting them as one system.

* **No shared memory and no global clock**
* Communication by **message passing**
* Must provide transparency, and must tolerate **partial failure** — where some nodes fail while others continue

### 3. Network Operating Systems

Machines keep their own operating systems and identity; the OS merely provides sharing of files and printers. Users are **aware** of the multiple machines — the key difference from a distributed OS.

### 4. Real-Time Operating Systems

Correctness depends on **timing** as well as on results.

* **Hard real-time** — a missed deadline is a system failure (flight control, pacemakers)
* **Soft real-time** — a missed deadline degrades quality (video playback)
* Require **predictable**, bounded scheduling rather than high average throughput

### 5. Embedded Operating Systems

Run on devices with severe constraints on memory, power and processing — sensors, appliances, controllers.

### 6. Mobile Operating Systems

Optimised for battery life, intermittent connectivity and touch interaction.

| Type            | Memory model     | Clock         | Key requirement        |
| --------------- | ---------------- | ------------- | ---------------------- |
| Multiprocessor  | Shared           | Common        | Cache coherence        |
| Distributed     | None shared      | None global   | Transparency, fault tolerance |
| Network         | None shared      | None global   | Simple sharing         |
| Real-time       | Either           | Precise       | Predictable timing     |
| Embedded        | Very limited     | Local         | Small footprint        |

> The sharpest divide is between systems with **shared memory** and those without: losing shared memory means losing the ability to coordinate with a simple lock, which is why distributed systems need entirely different algorithms.

### Example

A general-purpose OS may take 5 ms to respond usually and 200 ms occasionally — perfectly acceptable for a desktop, and fatal for an airbag controller, which needs a guaranteed bound every time.
$md$, 4, false),

  (sid, 1, 'Explain Synchronization Mechanisms used in operating systems.', $md$
**Synchronisation mechanisms** coordinate concurrent processes so that shared data remains consistent and processes cooperate in the intended order. Without them, concurrent access produces **race conditions** — results that depend on unpredictable timing.

### 1. Locks (Mutex)

The simplest mechanism: a process **acquires** a lock before entering a critical section and **releases** it afterwards. Only one process may hold it at a time.

```text
lock(m)
    critical section
unlock(m)
```

### 2. Semaphores

An integer variable accessed only through two atomic operations, introduced by Dijkstra:

* **wait(S)** (P) — decrement; if the value becomes negative, block
* **signal(S)** (V) — increment; if a process is waiting, wake one

**Binary semaphore** (0 or 1) acts as a mutex; **counting semaphore** manages a pool of *n* identical resources.

### 3. Monitors

A high-level construct combining shared data with the procedures that operate on it. **Mutual exclusion is automatic** — only one process may be active inside the monitor. **Condition variables** with `wait()` and `signal()` handle ordering.

Monitors are safer than semaphores because the compiler enforces the locking that a programmer might otherwise forget.

### 4. Spinlocks

A waiting process **busy-waits** in a loop rather than blocking. Wasteful of CPU, but efficient when the wait is shorter than the cost of a context switch — the standard choice inside multiprocessor kernels.

### 5. Barriers

All participating processes must arrive before any may continue — used in phased parallel computation.

### 6. Message Passing

Where there is no shared memory, `send` and `receive` provide both communication **and** synchronisation. The only option in distributed systems.

| Mechanism     | Waiting style | Best used for                   |
| ------------- | ------------- | ------------------------------- |
| Mutex         | Blocking      | Short critical sections         |
| Semaphore     | Blocking      | Counting resources, signalling  |
| Monitor       | Blocking      | Structured, compiler-checked    |
| Spinlock      | Busy-wait     | Very short waits, kernel code   |
| Barrier       | Blocking      | Phased parallel algorithms      |
| Message passing | Blocking    | Distributed systems             |

> Every mechanism answers the same question — *how does a process wait safely?* — and differs mainly in whether waiting burns CPU or yields it.

### Example

A bank transfer must lock both accounts before moving money. Without the lock, two simultaneous transfers could both read the same starting balance and one update would be lost.
$md$, 5, false),

  (sid, 1, 'Explain the concept of a Process and its significance in concurrent systems.', $md$
A **process** is a program in execution — the active entity that owns resources and can be scheduled. A program is a passive file on disk; a process is that program together with its current state.

### What a Process Consists Of

* **Program code** (text section)
* **Program counter** and CPU registers
* **Stack** — parameters, return addresses, local variables
* **Data section** — global variables
* **Heap** — memory allocated at runtime

### Process Control Block (PCB)

The OS represents each process by a **PCB** holding:

| Field                | Purpose                             |
| -------------------- | ----------------------------------- |
| Process ID           | Unique identifier                   |
| Process state        | Ready, running, waiting…            |
| Program counter      | Next instruction                    |
| CPU registers        | Saved on a context switch           |
| Scheduling info      | Priority, queue pointers            |
| Memory info          | Page tables, limits                 |
| Accounting info      | CPU time used                       |
| I/O status           | Open files, allocated devices       |

### Process States

```text
      admitted        dispatch         exit
NEW -----------> READY --------> RUNNING -------> TERMINATED
                   ^   \            |
                   |    \ interrupt |
                   |     <----------
                   |                |
                   \---- WAITING <--/  (I/O or event wait)
```

### Significance in Concurrent Systems

* **Isolation** — each process has its own address space, so a fault in one cannot corrupt another
* **Unit of scheduling** — the entity the CPU scheduler allocates time to
* **Unit of resource ownership** — files, memory and devices are owned per process
* **Enables concurrency** — many processes progress together, overlapping computation with I/O
* **Basis for protection** — the OS enforces boundaries between processes

### Processes vs Threads

| Aspect        | Process              | Thread                    |
| ------------- | -------------------- | ------------------------- |
| Address space | Own, isolated        | Shared with siblings      |
| Creation cost | High                 | Low                       |
| Communication | IPC required         | Shared memory, direct     |
| Fault effect  | Contained            | Can corrupt the process   |

> Isolation is what makes processes safe and what makes them expensive; threads reverse both, which is why concurrent programming with threads needs synchronisation so badly.

### Example

A web server may fork a process per client for strong isolation, or use threads for speed. The process design survives one client's crash; the thread design handles far more clients per machine.
$md$, 6, false),

  (sid, 1, 'Explain Concurrent Processes and the need for synchronization.', $md$
**Concurrent processes** are processes whose execution overlaps in time. On a single CPU they **interleave**; on multiple CPUs they run in genuine **parallel**. Either way, the order in which their individual instructions occur is **not predictable**.

### Why Concurrency Is Used

* **Better resource utilisation** — the CPU works while another process waits for I/O
* **Faster throughput** — real parallelism on multi-core hardware
* **Responsiveness** — one slow task does not freeze the whole program
* **Natural modelling** — many real problems are inherently concurrent

### The Race Condition

When processes share data, the result can depend on timing. Consider two processes each incrementing a shared counter:

```text
counter = 5

P1: read counter (5)          P2: read counter (5)
P1: add 1      (6)            P2: add 1      (6)
P1: write      (6)            P2: write      (6)

Expected 7, actual 6 — one update is LOST
```

The statement `counter++` is not atomic: it compiles into load, add and store, and a context switch may occur between any two.

### Types of Interaction

| Relationship  | Description                          | Need                    |
| ------------- | ------------------------------------ | ----------------------- |
| **Independent** | No shared data                     | No synchronisation      |
| **Competing** | Share a resource, unaware of each other | Mutual exclusion    |
| **Cooperating** | Work together knowingly            | Mutual exclusion + ordering |

### What Synchronisation Must Provide

1. **Mutual exclusion** — only one process in a critical section at a time
2. **Ordering** — enforce that A happens before B where required
3. **No deadlock** — processes must not block each other forever
4. **No starvation** — every waiting process eventually proceeds

> Concurrency does not create bugs — it exposes assumptions the programmer made about ordering that the hardware never promised.

### Example

Two ATMs withdrawing from one account simultaneously may both read a balance of ₹10,000, each approve ₹8,000, and leave the account at ₹2,000 having dispensed ₹16,000. Mutual exclusion over the balance is what prevents this.
$md$, 7, false),

  (sid, 1, 'Explain the Critical Section Problem and its requirements.', $md$
A **critical section** is the part of a process's code that accesses shared data. The **critical section problem** is designing a protocol that lets processes share data without interfering — allowing only one process into its critical section at a time.

### Structure of a Process

```text
do {
    entry section       <- request permission
        CRITICAL SECTION
    exit section        <- release permission
        remainder section
} while (true);
```

The problem is designing the **entry** and **exit** sections correctly.

### The Three Requirements

**1. Mutual Exclusion**
If one process is executing in its critical section, no other process may be in its own critical section. This is the fundamental safety property.

**2. Progress**
If no process is in its critical section and some processes wish to enter, only those *not* in their remainder section may participate in deciding who enters next, and the decision **cannot be postponed indefinitely**. In short: an idle system must not block a waiting process.

**3. Bounded Waiting**
There must be a **limit** on how many times other processes may enter their critical sections after a process has requested entry and before it is granted. This prevents **starvation**.

| Requirement      | Prevents            | Failure symptom               |
| ---------------- | ------------------- | ----------------------------- |
| Mutual exclusion | Data corruption     | Race conditions, lost updates |
| Progress         | Deadlock            | Nobody enters though free     |
| Bounded waiting  | Starvation          | One process waits forever     |

### Software Solutions

**Peterson's Solution** for two processes uses a `flag[]` array and a `turn` variable and satisfies all three requirements:

```text
flag[i] = true;          // I want to enter
turn = j;                // but you go first
while (flag[j] && turn == j) ;   // wait
    CRITICAL SECTION
flag[i] = false;
```

Setting `turn = j` — politely deferring — is what guarantees progress and bounded waiting.

### Hardware Support

Modern systems rely on **atomic instructions** such as `TestAndSet` and `CompareAndSwap`, which read and modify memory in one indivisible step, making correct locks far simpler to build.

> Getting mutual exclusion right is easy; getting it right *while also* guaranteeing progress and bounded waiting is what makes the problem genuinely hard.

### Example

A naive solution using a single `turn` variable enforces strict alternation. If P0 finishes and does not want to re-enter, P1 can only enter once and then waits forever — mutual exclusion is satisfied but **progress** is violated.
$md$, 8, false),

  (sid, 1, 'Explain other important Synchronization Problems.', $md$
Beyond mutual exclusion, several **classical synchronisation problems** are used as benchmarks — each isolates a different coordination difficulty, and a mechanism that solves all of them is considered expressive enough for real use.

### 1. Producer–Consumer (Bounded Buffer)

A producer adds items to a fixed-size buffer; a consumer removes them.

* The producer must **wait when the buffer is full**
* The consumer must **wait when the buffer is empty**
* Access to the buffer must be **mutually exclusive**

```text
semaphore empty = N;   // free slots
semaphore full  = 0;   // filled slots
semaphore mutex = 1;   // buffer access

Producer:                 Consumer:
wait(empty)               wait(full)
wait(mutex)               wait(mutex)
  add item                  remove item
signal(mutex)             signal(mutex)
signal(full)              signal(empty)
```

The order matters: acquiring `mutex` **before** `empty` would deadlock a full buffer.

### 2. Readers–Writers

Many readers may read simultaneously, but a writer needs **exclusive** access.

* **First variant** — readers have priority; writers may starve
* **Second variant** — writers have priority; readers may starve
* **Third variant** — neither starves, at the cost of complexity

### 3. Dining Philosophers

Five philosophers alternate between thinking and eating; each needs the two forks beside them.

```text
     P0
  F0    F1
P4        P1
  F4    F2
   P3  F3  P2
```

If all five pick up their left fork simultaneously, all wait forever — the canonical **deadlock**. Solutions include allowing only four to sit, requiring both forks to be picked up atomically, or making one philosopher pick up the right fork first (breaking the circular wait).

### 4. Sleeping Barber

Models a server with a limited waiting queue: the barber sleeps when idle, customers leave if no chair is free.

| Problem            | Illustrates                        |
| ------------------ | ---------------------------------- |
| Producer–Consumer  | Buffer bounds, counting semaphores |
| Readers–Writers    | Shared vs exclusive access, starvation |
| Dining Philosophers| Deadlock and circular wait         |
| Sleeping Barber    | Bounded queues, idle servers       |

> These problems persist in teaching because each maps directly onto real systems: buffers, databases, and resource allocation respectively.

### Example

A print spooler is producer–consumer; a database with many queries and occasional updates is readers–writers; a transaction system locking several rows is dining philosophers.
$md$, 9, false),

  (sid, 1, 'Explain Language Mechanisms for Synchronization.', $md$
Low-level primitives such as semaphores are powerful but **error-prone**: a forgotten `signal()`, an inverted order, or an early `return` inside a critical section produces bugs that appear only occasionally. **Language-level mechanisms** move synchronisation into the programming language so the compiler enforces correctness.

### 1. Monitors

A **monitor** encapsulates shared data with the procedures that operate on it, and guarantees that **only one process is active inside at any time**. The programmer never writes lock or unlock.

```text
monitor BankAccount {
    int balance;

    procedure deposit(amount) {
        balance = balance + amount;      // automatically exclusive
    }
    procedure withdraw(amount) {
        while (balance < amount) wait(sufficient);
        balance = balance - amount;
    }
}
```

**Condition variables** provide ordering:

* `wait(c)` — release the monitor and block
* `signal(c)` — wake one waiting process

Two signalling disciplines exist: **signal-and-wait** (Hoare), where the signaller yields immediately, and **signal-and-continue** (Mesa), where it finishes first — the latter requires `while` rather than `if` around every wait, which is why the loop above matters.

### 2. Conditional Critical Regions

Shared data is declared explicitly and accessed inside a guarded region:

```text
region v when (condition) { statements }
```

The compiler generates the necessary locking, and the condition is re-evaluated automatically.

### 3. Synchronised Methods

Java's `synchronized` keyword locks an object's monitor for the duration of a method — a direct language realisation of the monitor concept.

### 4. Message Passing Constructs

Languages such as Ada (rendezvous), Go (channels) and Erlang (actors) provide communication primitives that synchronise implicitly, avoiding shared state entirely.

| Mechanism      | Locking          | Main strength              |
| -------------- | ---------------- | -------------------------- |
| Semaphore      | Manual           | Flexible, low-level        |
| Monitor        | Automatic        | Compiler-enforced safety   |
| Critical region| Automatic        | Explicit shared data       |
| Message passing| Implicit         | No shared state at all     |

> Semaphores make correct programs possible; monitors make incorrect programs harder to write.

### Example

Forgetting `signal(mutex)` on an error path leaves a semaphore locked forever and hangs the system. A monitor releases exclusion automatically when the procedure exits, however it exits.
$md$, 10, false),

  (sid, 1, 'Explain Axiomatic Verification of Parallel Programs.', $md$
**Axiomatic verification** proves a program correct using **mathematical logic** instead of testing. For parallel programs this matters greatly: testing can only exercise some interleavings, and a race condition may appear once in a million runs. A proof covers **all** interleavings.

### Hoare Triples

The basic notation is:

```text
{ P }  S  { Q }
```

meaning: if precondition **P** holds before statement **S** executes, and S terminates, then postcondition **Q** holds afterwards.

```text
{ x = 5 }  x := x + 1  { x = 6 }
```

### Axioms and Inference Rules

| Rule            | Form                                              |
| --------------- | ------------------------------------------------- |
| Assignment      | `{ Q[e/x] } x := e { Q }`                         |
| Sequence        | From `{P} S1 {R}` and `{R} S2 {Q}` infer `{P} S1;S2 {Q}` |
| Conditional     | Both branches must establish Q                    |
| Loop (invariant)| `{I ∧ B} S {I}` gives `{I} while B do S {I ∧ ¬B}` |

### The Additional Difficulty in Parallel Programs

Sequential proofs assume no one else modifies the variables. In a parallel program that assumption fails, so two further obligations arise:

**1. Interference Freedom (Owicki–Gries)**
Every assertion in one process must remain **true** despite any statement another process might execute concurrently. If process A asserts `x > 0` and process B can set `x = 0`, the proof is invalid.

**2. Non-interference of Auxiliary Variables**
Extra variables introduced purely for the proof must not change program behaviour.

### Proof Obligations

* **Partial correctness** — if it terminates, the result is right
* **Termination** — it does terminate
* **Mutual exclusion** — never two processes in a critical section
* **Deadlock freedom** — no reachable state where all are blocked
* **Starvation freedom** — every waiting process eventually proceeds

```text
sequential proof   = correctness of each process alone
parallel proof     = the above  +  interference freedom
```

> The difficulty of parallel verification is not proving each process correct; it is proving that no other process can invalidate that proof midway.

### Example

A proof of Peterson's algorithm shows that `flag[i] ∧ turn = j` cannot hold for both processes at once, so both can never be in their critical sections — a guarantee no amount of testing could establish.
$md$, 11, false),

  (sid, 1, 'Explain the preliminaries and basic concepts of Process Deadlocks.', $md$
A **deadlock** is a state in which a set of processes are each blocked **waiting for an event that only another process in the same set can cause**. Since none can proceed, none can release what the others need, and the situation is permanent without outside intervention.

### The Essential Picture

```text
P1 holds R1 and waits for R2
P2 holds R2 and waits for R1

P1 ---waits for---> R2 ---held by---> P2
 ^                                     |
 |                                     |
 +---held by--- R1 <---waits for-------+
```

Neither will ever release, because each is blocked before reaching its release step.

### Related but Different Conditions

| Condition   | Meaning                                   | Will it resolve itself? |
| ----------- | ----------------------------------------- | ----------------------- |
| **Deadlock**| Circular wait; no progress possible       | Never                   |
| **Starvation** | A process is repeatedly passed over    | Possibly, by luck       |
| **Livelock**| Processes act but make no progress        | Possibly                |

Livelock is worth distinguishing: the processes are *not* blocked — they keep responding to each other, like two people repeatedly stepping aside in a corridor — yet nothing advances.

### Where Deadlocks Occur

* **Resource deadlock** — competing for devices, memory, files
* **Communication deadlock** — each process waiting to receive a message from the other
* **Database deadlock** — transactions holding conflicting locks

### The Four Strategies

1. **Prevention** — design so that a necessary condition can never hold
2. **Avoidance** — grant a request only if the system stays in a safe state (Banker's algorithm)
3. **Detection and recovery** — allow deadlock, detect it, then break it
4. **Ignore it** — the *ostrich algorithm*, used by most general-purpose operating systems because deadlocks are rare and the cure costs more than the disease

> Most real operating systems deliberately ignore deadlock: prevention restricts resource use, avoidance needs advance knowledge of future requests, and detection costs continuous effort — for an event that happens rarely.

### Example

Two database transactions each lock a row the other needs. The DBMS detects the cycle and **aborts** one transaction, releasing its locks so the other completes — detection and recovery in practice.
$md$, 12, false),

  (sid, 1, 'Explain different Models of Deadlocks.', $md$
Deadlock behaviour depends on **how processes are allowed to request resources**. Different request models permit different deadlock conditions, and therefore different detection algorithms.

### 1. Single-Unit Request Model

A process may request **only one resource at a time**, and blocks until it is granted.

* The wait-for graph has **exactly one outgoing edge** per process
* A **cycle** is both necessary and sufficient for deadlock
* Detection is simple: search for a cycle

### 2. AND Model (Resource Model)

A process requests **several resources simultaneously** and proceeds only when **all** are granted.

* All requested resources must be available
* A **cycle** is necessary and sufficient for deadlock
* Common in database transactions needing several locks

### 3. OR Model

A process requests several resources and proceeds when **any one** is granted.

* A cycle is **not** sufficient — a process may escape through another edge
* Deadlock requires a **knot**: a set of nodes from which no node outside the set is reachable

```text
AND model:  P needs R1 AND R2  -> blocked unless both free
OR model:   P needs R1 OR R2   -> proceeds if either is free
```

### 4. AND-OR Model

Combines both: a request such as *(R1 AND R2) OR R3*. The most general and the hardest to analyse.

### 5. P-out-of-Q Model

A process requests **any p** of a set of **q** resources — a compact generalisation of the AND-OR model.

| Model         | Deadlock condition        | Detection difficulty |
| ------------- | ------------------------- | -------------------- |
| Single-unit   | Cycle                     | Easy                 |
| AND           | Cycle                     | Easy                 |
| OR            | Knot                      | Harder               |
| AND-OR        | Knot (general form)       | Hardest              |
| P-out-of-Q    | Generalised knot          | Hard                 |

> The rule of thumb: in AND-style models look for a **cycle**; in OR-style models a cycle is survivable and you must look for a **knot**.

### Example

A transaction needing rows A and B (AND model) deadlocks if another holds them in the opposite order. A process willing to use **any** of three printers (OR model) does not deadlock merely because one is busy.
$md$, 13, false),

  (sid, 1, 'Explain Resources and their role in deadlock situations.', $md$
A **resource** is anything a process may need and may have to wait for — hardware such as printers and memory, or logical objects such as locks, files and semaphores. Deadlock is fundamentally a problem of **resource allocation**, so classifying resources explains which deadlocks are possible.

### Reusable vs Consumable

**Reusable resources**
* Fixed total number of units
* A unit is acquired, used and **released unchanged**
* Never created or destroyed
* Examples: CPU, memory, printers, files, semaphores

**Consumable resources**
* Created by a producer and **destroyed by consumption**
* No fixed total; the count varies
* Examples: messages, signals, interrupts

### Preemptable vs Non-preemptable

| Type              | Can be taken away? | Deadlock risk | Example        |
| ----------------- | ------------------ | ------------- | -------------- |
| **Preemptable**   | Yes, without harm  | Low           | CPU, memory    |
| **Non-preemptable** | No, would corrupt| **High**      | Printer, DVD writer |

Deadlocks arise almost entirely from **non-preemptable** resources: if a resource can simply be taken back, the hold-and-wait cycle is broken by force.

### The Resource Allocation Graph

```text
  P1 -----> R1        request edge (P wants R)
  R2 -----> P1        assignment edge (R held by P)

deadlock:
  P1 --> R2 --> P2 --> R1 --> P1     (a cycle)
```

**Interpreting a cycle:**

* **Single instance per resource type** — a cycle **means** deadlock
* **Multiple instances** — a cycle is only a *possibility*; another holder may release

### Role in Deadlock

* Resources that are **limited** create competition
* Resources that are **non-preemptable** make waiting permanent
* Resources acquired **incrementally** create hold-and-wait
* Resources acquired in **inconsistent order** create circular wait

> The single most effective practical defence against deadlock is a rule almost too simple to state: always acquire resources in the same global order.

### Example

Two processes copying between two files deadlock if one locks A then B while the other locks B then A. Enforcing alphabetical lock order removes the possibility entirely.
$md$, 14, false),

  (sid, 1, 'Explain the concept of System State in relation to deadlocks.', $md$
The **system state** is a snapshot of which resources exist, which are allocated, to whom, and what each process may still request. Deadlock analysis is essentially the study of which states are dangerous.

### Representing the State

| Structure         | Meaning                                        |
| ----------------- | ---------------------------------------------- |
| **Available[m]**  | Units of each resource type currently free     |
| **Max[n][m]**     | Maximum each process may ever request          |
| **Allocation[n][m]** | Units currently held by each process        |
| **Need[n][m]**    | `Max − Allocation`, still possibly required    |

### Safe, Unsafe and Deadlocked

**Safe state** — there exists at least one **safe sequence** ⟨P1, P2, …, Pn⟩ such that each process's remaining need can be met by the currently available resources plus those held by all earlier processes in the sequence. Every process can finish.

**Unsafe state** — no such sequence exists. Deadlock is **possible**, though not certain: processes might not actually make their worst-case requests.

**Deadlocked state** — a circular wait already exists; the system cannot recover on its own.

```text
+-----------------------------------+
|            All states             |
|  +-----------------------------+  |
|  |          Unsafe             |  |
|  |   +---------------------+   |  |
|  |   |     Deadlocked      |   |  |
|  |   +---------------------+   |  |
|  +-----------------------------+  |
|          Safe states              |
+-----------------------------------+
```

**Unsafe is not the same as deadlocked** — this is the key insight. Avoidance algorithms keep the system inside the safe region precisely because from there deadlock can never be reached.

### The Banker's Algorithm

Before granting any request, the system pretends to grant it and checks whether a safe sequence still exists. If yes, the request is granted; if no, the process waits — even though the resources are physically free.

### Worked Illustration

```text
Available = 3
P1 holds 2, may need 2 more
P2 holds 1, may need 1 more

Safe sequence: P2 (needs 1, gets it, finishes, releases 2)
               -> Available = 5 -> P1 finishes
```

> Avoidance is conservative by design: it refuses requests that *could* lead to trouble, accepting lower utilisation in exchange for a guarantee.

### Example

A bank with ₹10 crore in reserve and customers holding credit lines totalling ₹50 crore is in a safe state only while it can satisfy any single customer's full remaining draw — the analogy that gives the Banker's algorithm its name.
$md$, 15, false),

  (sid, 1, 'Explain the necessary and sufficient conditions for a Deadlock.', $md$
Deadlock occurs only when **four conditions hold simultaneously** — the **Coffman conditions**. All four are necessary; together, in a system with single-instance resources, they are sufficient.

### The Four Conditions

**1. Mutual Exclusion**
At least one resource is held in a non-shareable mode — only one process may use it at a time. A resource that can be shared freely (a read-only file) never contributes to deadlock.

**2. Hold and Wait**
A process holds at least one resource **while waiting** to acquire others. If processes always requested everything at once, this would not arise.

**3. No Preemption**
A resource cannot be forcibly taken from a process; it is released only voluntarily. Preemptable resources such as the CPU do not cause deadlock.

**4. Circular Wait**
A set of processes {P0, P1, …, Pn} exists such that P0 waits for a resource held by P1, P1 for one held by P2, …, and Pn for one held by P0.

```text
P0 --waits--> R1 --held--> P1
 ^                          |
 |                     waits |
 |                          v
 +--held-- R0 <--waits-- P2 <--
```

### Necessity vs Sufficiency

| Resource type          | Cycle implies              |
| ---------------------- | -------------------------- |
| Single instance each   | Deadlock — **sufficient**  |
| Multiple instances     | Only **possible** deadlock |

With multiple instances a cycle may resolve when some other holder releases a unit, so a cycle is necessary but not sufficient.

### Breaking Each Condition (Prevention)

| Condition        | How to break it                          | Practical cost                 |
| ---------------- | ---------------------------------------- | ------------------------------ |
| Mutual exclusion | Make resources shareable, use spooling   | Impossible for many devices    |
| Hold and wait    | Request all resources at once            | Poor utilisation, starvation   |
| No preemption    | Take resources back and restart          | Wasted work, complex rollback  |
| Circular wait    | Impose a global ordering on resources    | **Usually the practical choice** |

> Circular wait is the condition most worth attacking: a global lock ordering costs nothing at runtime and is easy to enforce by convention.

### Example

Two threads locking mutexes A and B in opposite orders satisfy all four conditions and deadlock. Requiring every thread to lock A before B breaks circular wait, and the deadlock becomes impossible by construction.
$md$, 16, false),

  (sid, 1, 'Explain systems with Single-Unit Requests.', $md$
In a **single-unit request system**, a process may request **only one resource unit at a time** and must block until it is granted before requesting anything else. This restriction greatly simplifies deadlock analysis.

### Characteristics

* A blocked process waits for **exactly one** resource
* Therefore each process has **at most one outgoing request edge**
* The **wait-for graph** becomes a simple structure in which every node has out-degree ≤ 1

### The Wait-For Graph

The wait-for graph is obtained from the resource allocation graph by removing resource nodes and connecting processes directly:

```text
Resource allocation graph:
P1 --> R1 --> P2 --> R2 --> P1

Wait-for graph:
P1 --> P2 --> P1        (a cycle)
```

### The Central Result

In a single-unit request system with one instance per resource type:

> **A cycle in the wait-for graph is both necessary and sufficient for deadlock.**

This is stronger than the general case. Because each process has only one outgoing edge, a cycle cannot be escaped — there is no alternative resource the process would also accept, and no other holder whose release could break the wait.

### Detection

Since out-degree is at most one, cycle detection is straightforward: follow the single edge from each node until either a node repeats (deadlock) or a non-waiting process is reached (no deadlock). This runs in **O(n)** rather than the more expensive general graph search.

```text
start at P1 -> P2 -> P3 -> P1   : node repeated -> DEADLOCK
start at P4 -> P5 -> (not waiting) : no deadlock
```

| Model            | Out-degree | Cycle means      | Detection cost |
| ---------------- | ---------- | ---------------- | -------------- |
| Single-unit      | ≤ 1        | Deadlock, always | O(n)           |
| AND (multi-unit) | Many       | Deadlock         | O(n²)          |
| OR               | Many       | Not necessarily  | Knot search    |

### Trade-off

The simplicity is bought with **reduced concurrency and efficiency**: a process needing three resources must acquire them one at a time, holding each while waiting for the next — which increases the *duration* of holding even as it simplifies detection.

> Single-unit request systems make deadlock easy to reason about, which is why theoretical treatments and many distributed algorithms adopt the model even when real systems do not.

### Example

A simple lock manager granting one lock per request and blocking until granted fits this model. Detecting deadlock is a matter of following each waiting transaction to the one it waits for, and seeing whether the chain returns to its start.
$md$, 17, false),

  (sid, 1, 'Explain Consumable Resources and deadlocks involving them.', $md$
A **consumable resource** is one that is **created** by a producing process and **destroyed** when a consuming process acquires it. Messages, signals and interrupts are the standard examples.

### Characteristics

* **No fixed total** — the number of units varies over time
* **Created** by a process at any moment
* **Consumed** — once received, the unit ceases to exist
* Never returned to a pool, because there is no pool

### Contrast with Reusable Resources

| Property       | Reusable            | Consumable            |
| -------------- | ------------------- | --------------------- |
| Total units    | Fixed               | Variable, unbounded   |
| After use      | Released unchanged  | Destroyed             |
| Created by     | Nobody — they exist | A producer process    |
| Examples       | Printer, memory     | Message, signal       |

### Communication Deadlock

Deadlock with consumable resources takes the form of processes each waiting to **receive** a message that only the other will send:

```text
P1: receive(from P2)     P2: receive(from P1)
    ... then send(P2)        ... then send(P1)

Both block on receive. Neither reaches its send.
DEADLOCK
```

This is often called **communication deadlock**, and it is common in distributed systems and message-passing programs.

### Why It Is Harder to Analyse

* The **availability of a resource depends on future behaviour** — whether some process will choose to produce it
* There is no fixed total, so the Banker's-style reasoning about "enough units to finish" does not apply
* Detection requires knowing which processes **can** produce which messages, which may depend on program logic

The standard tool is the **general resource graph** with producer edges, where deadlock corresponds to a **knot** rather than a simple cycle.

### Prevention Techniques

* **Non-blocking receive** — return immediately if no message is waiting
* **Timeouts** — abandon the wait after a period and take recovery action
* **Ordered communication protocols** — ensure a send always precedes the matching receive
* **Buffering** — allow sends to complete without a waiting receiver

> With reusable resources you ask "are there enough units?"; with consumable resources you must ask "will anyone ever produce one?" — a question about program logic, not counting.

### Example

Two processes implementing a request/reply protocol both wait for the other's request before sending their reply. Neither ever sends, and both block permanently — a deadlock involving no physical resource at all.
$md$, 18, false),

  (sid, 1, 'Explain Reusable Resources and deadlocks involving them.', $md$
A **reusable resource** exists in a **fixed number of units**, is acquired by a process, used, and then **released unchanged** for others to use. It is neither created nor destroyed by use. Printers, memory frames, CPUs, files, semaphores and database locks are all reusable.

### Characteristics

* **Fixed total** of units, known to the system
* Acquired and later **released intact**
* At any moment: `available + allocated = total`
* Typically **non-preemptable**, which is what makes deadlock possible

### The Classic Deadlock

```text
Total: 1 printer (R1), 1 scanner (R2)

P1: acquire R1  ... then request R2
P2: acquire R2  ... then request R1

P1 holds R1, waits for R2  (held by P2)
P2 holds R2, waits for R1  (held by P1)
                  DEADLOCK
```

All four Coffman conditions are present: mutual exclusion, hold and wait, no preemption, circular wait.

### Resource Allocation Graph

```text
P1 ---request---> R2
R2 ---assigned--> P2
P2 ---request---> R1
R1 ---assigned--> P1        cycle -> deadlock
```

With **one instance per type**, a cycle means deadlock. With **multiple instances**, a cycle only indicates the possibility, since another holder may release a unit.

### Handling Deadlock with Reusable Resources

| Strategy   | Mechanism                                       |
| ---------- | ----------------------------------------------- |
| Prevention | Global lock ordering; request everything at once |
| Avoidance  | Banker's algorithm using Max, Allocation, Need   |
| Detection  | Periodic cycle search, then recovery             |
| Recovery   | Abort a process, or preempt and roll back        |

Because the totals are **fixed and known**, reusable resources are far more tractable than consumable ones: the Banker's algorithm can compute safe sequences precisely because it knows exactly how many units exist.

> Reusable resources cause most real deadlocks, and are also the case we can reason about rigorously — which is why nearly every deadlock algorithm assumes them.

### Example

A database transaction holding a lock on the Customers table and requesting Orders, while another holds Orders and requests Customers, is the textbook reusable-resource deadlock. The DBMS detects the cycle and aborts the cheaper transaction, whose locks are then released intact for the other to acquire.
$md$, 19, false);

  RAISE NOTICE 'Advanced Operating Systems — Unit 1: 19 questions inserted.';
END $do$;
