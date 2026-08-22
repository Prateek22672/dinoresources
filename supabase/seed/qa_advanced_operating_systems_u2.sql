-- =====================================================================
-- Study-With-AI seed — Advanced Operating Systems (4th Year) — UNIT 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Advanced Operating Systems' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Advanced Operating Systems" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain Distributed Operating Systems and their basic characteristics.',
    'Explain the major Issues in Distributed Operating Systems.',
    'Explain Communication Primitives used in distributed systems.',
    'Explain the Inherent Limitations of Distributed Operating Systems.',
    'Explain Lamport''s Logical Clock with an example.',
    'Explain Vector Clocks and their significance.',
    'Explain Causal Ordering in distributed systems.',
    'Explain Global State and its importance in distributed systems.',
    'Explain Cuts in distributed systems.',
    'Explain Termination Detection.',
    'Explain Distributed Mutual Exclusion and its requirements.',
    'Explain Non-Token Based Algorithms for distributed mutual exclusion.',
    'Explain Lamport''s Algorithm for distributed mutual exclusion.',
    'Explain Token Based Algorithms for distributed mutual exclusion.',
    'Explain Suzuki-Kasami''s Broadcast Algorithm.',
    'Explain the major issues in Distributed Deadlock Detection.',
    'Explain Centralized Deadlock Detection Algorithms.',
    'Explain Distributed Deadlock Detection Algorithms.',
    'Explain the classification of Agreement Protocols.',
    'Explain solutions for Agreement Protocols.',
    'Explain applications of Agreement Protocols.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain Distributed Operating Systems and their basic characteristics.', $md$
A **distributed operating system** manages a collection of **independent computers** connected by a network and presents them to users as a **single coherent system**. Each machine has its own CPU and memory; there is no physically shared memory and no common clock.

### Basic Characteristics

* **Single system image** — users see one system, not many machines
* **No shared memory** — all coordination is by **message passing**
* **No global clock** — machines cannot agree on an exact instant
* **Autonomy of nodes** — each machine can operate independently
* **Concurrency** — many nodes execute genuinely in parallel
* **Fault tolerance** — the system survives the failure of some nodes
* **Scalability** — capacity grows by adding machines
* **Resource sharing** — files, printers and CPUs are shared across machines
* **Transparency** — location, replication, migration and failure are hidden

### Advantages

| Benefit           | Reason                                      |
| ----------------- | ------------------------------------------- |
| Economy           | Many small machines are cheaper than one large |
| Speed             | Aggregate compute power exceeds any single node |
| Reliability       | One node failing does not stop the system   |
| Incremental growth| Add machines as demand grows                |
| Geographic spread | Services run near their users               |

### The Defining Difficulty

**Partial failure.** In a single machine, a component failure stops everything, and the state is at least consistent. In a distributed system some nodes fail while others continue, and a working node **cannot distinguish** a crashed peer from a slow one — because a message that has not arrived might still arrive.

> Every hard problem in distributed systems reduces to two absences: no shared memory, and no shared clock.

### Example

A cloud storage service spanning three data centres shows one folder. Files are replicated, requests are routed to the nearest copy, and a data-centre outage is invisible — the concealment *is* the distributed OS.
$md$, 1, true),

  (sid, 2, 'Explain the major Issues in Distributed Operating Systems.', $md$
Distributed operating systems face problems that simply do not arise on a single machine, all stemming from the absence of shared memory and a common clock.

### Major Issues

**1. Global Knowledge**
No node knows the complete, current state of the system. Any information a node holds about another is inherently **stale**, because it arrived in a message that took time.

**2. Naming**
Resources must have names that resolve to locations, and the naming service must itself be distributed, consistent and fault-tolerant.

**3. Scalability**
Algorithms that work for ten nodes may collapse at a thousand. Anything requiring all-to-all communication scales as O(n²).

**4. Compatibility and Heterogeneity**
Different hardware, byte orders, and operating systems must interoperate — requiring agreed data representation.

**5. Process Synchronisation**
Mutual exclusion without shared memory needs message-based algorithms, which are far more expensive than a lock.

**6. Resource Management**
Data migration, computation migration and process migration must decide **what moves where**, using stale information.

**7. Security**
The network is untrusted: messages can be read, altered, replayed or forged. Authentication must work without a shared secret store.

**8. Fault Tolerance and Partial Failure**
Nodes and links fail independently. The system must detect failures (imperfectly) and continue.

**9. Structuring**
Deciding what the kernel does versus what servers do — monolithic, collective kernel, object-oriented or client-server organisation.

| Issue          | Root cause                    |
| -------------- | ----------------------------- |
| Stale knowledge| Message delay                 |
| Sync cost      | No shared memory              |
| Failure detection | Cannot distinguish slow from dead |
| Ordering       | No global clock               |

> The recurring theme: every node acts on information that was true *somewhere*, *some time ago*.

### Example

A load balancer routes work to the "least busy" server using statistics that are already a second old. By the time the work arrives, that server may be the busiest — a direct consequence of having no global state.
$md$, 2, false),

  (sid, 2, 'Explain Communication Primitives used in distributed systems.', $md$
Since distributed systems have no shared memory, **communication primitives** are the only means of interaction. They fall into two families: **message passing** and **remote procedure call**.

### Message Passing Primitives

The basic operations are `send(destination, message)` and `receive(source, message)`.

**Blocking vs Non-blocking**

| Type            | Sender behaviour                        |
| --------------- | --------------------------------------- |
| **Blocking**    | Waits until the message is sent/received |
| **Non-blocking**| Returns immediately; continues working   |

**Synchronous vs Asynchronous**

* **Synchronous** — sender blocks until the receiver has actually received it; the two **rendezvous**
* **Asynchronous** — the message is buffered; the sender continues immediately

**Buffered vs Unbuffered**

* **Unbuffered** — the send waits for a matching receive
* **Buffered** — the system holds the message until the receiver asks

```text
Synchronous:      S ---msg---> R
                  S waits <-ack- R      (tight coupling)

Asynchronous:     S ---msg---> [buffer] ---> R
                  S continues immediately
```

### Remote Procedure Call (RPC)

RPC makes a call to a remote machine look like an ordinary local function call, hiding the messaging entirely.

```text
client calls f(x)
   -> client stub marshals arguments
   -> message sent over network
   -> server stub unmarshals, calls real f(x)
   -> result marshalled back
client receives return value
```

**Stubs** perform marshalling (converting arguments to a transmittable form) and unmarshalling.

### Semantics Under Failure

| Semantics       | Guarantee                       | Suits            |
| --------------- | ------------------------------- | ---------------- |
| **At-least-once** | Executed one or more times     | Idempotent ops   |
| **At-most-once**| Executed once or not at all     | Non-idempotent   |
| **Exactly-once**| Executed precisely once         | Ideal, expensive |

> RPC's convenience is also its trap: it makes a network call look local, hiding the fact that it can fail in ways a local call never can.

### Example

A bank transfer must not use at-least-once semantics — a retry could debit twice. It needs at-most-once, which is why RPC systems attach unique request identifiers and filter duplicates.
$md$, 3, false),

  (sid, 2, 'Explain the Inherent Limitations of Distributed Operating Systems.', $md$
Some limitations of distributed systems are not engineering shortcomings but **fundamental** — they follow from the physics and logic of the situation and cannot be removed by better design.

### The Two Root Limitations

**1. Absence of Global Shared Memory**
No node can read another's state directly. All knowledge arrives by message, and is therefore **out of date on arrival**. There is no way to take an instantaneous snapshot of the whole system.

**2. Absence of a Global Clock**
Physical clocks drift, and synchronising them costs messages that themselves take unpredictable time. Two events on different nodes cannot be reliably ordered by timestamp alone.

### Consequences

* **No instantaneous global state** — any "state" collected is assembled from observations made at different moments
* **Unpredictable message delays** — network delay is variable and unbounded in the general case
* **Impossible perfect failure detection** — a silent node may be crashed, slow, or merely partitioned
* **Ordering ambiguity** — events must be ordered by causality, not by time
* **Partial failure** — some components fail while others continue, leaving inconsistent views

### The FLP Impossibility Result

A landmark theoretical result: in an **asynchronous** system where even **one** process may fail, there is **no deterministic algorithm** guaranteeing consensus in bounded time. Real systems work around it with timeouts, randomisation or partial synchrony assumptions.

### The CAP Theorem

A distributed data store can provide at most **two** of:

| Property                | Meaning                                  |
| ----------------------- | ---------------------------------------- |
| **Consistency**         | Every read sees the latest write         |
| **Availability**        | Every request receives a response        |
| **Partition tolerance** | Works despite network splits             |

Since partitions **will** happen, the real choice is between consistency and availability.

> These limits explain why distributed algorithms look strange compared with single-machine ones — they are working around facts that cannot be engineered away.

### Example

A node that stops responding may have crashed or may be behind a congested link. Because no test can distinguish these, systems must pick a policy — declare it dead and risk split-brain, or wait and risk hanging.
$md$, 4, false),

  (sid, 2, 'Explain Lamport''s Logical Clock with an example.', $md$
**Lamport's logical clock** orders events in a distributed system without any physical clock. It assigns each event an integer timestamp consistent with **causality**, solving the problem that physical clocks drift and cannot be perfectly synchronised.

### The Happened-Before Relation (→)

Lamport defined a partial order:

1. If a and b are in the **same process** and a comes first, then **a → b**
2. If a is a **send** and b is the matching **receive**, then **a → b**
3. **Transitivity** — if a → b and b → c then a → c

Events with no → relation either way are **concurrent** (a ∥ b).

### The Clock Rules

Each process keeps a counter **C**:

```text
RULE 1: before each local event,  C = C + 1

RULE 2: when sending,  attach the current C to the message

RULE 3: on receiving a message with timestamp t,
        C = max(C, t) + 1
```

### Worked Example

```text
P1:  e1(1) ----- e2(2) ---------send(3)------------
                                     \
P2:  ---- f1(1) ----------------- recv(4) -- f3(5) --

P1: e1=1, e2=2, send=3
P2: f1=1, then receives msg with t=3
    -> C = max(1,3)+1 = 4
    f3 = 5
```

Notice P2's clock **jumps from 1 to 4** — it must exceed the sender's timestamp to preserve causality.

### The Guarantee and Its Limit

```text
If a -> b  then  C(a) < C(b)     TRUE

If C(a) < C(b)  then  a -> b     NOT NECESSARILY
```

The implication runs **one way only**. Two concurrent events can have different timestamps, so a smaller timestamp does not prove causation. Vector clocks were invented to close this gap.

> Lamport clocks tell you that if one event caused another, the numbers agree — but never that the numbers agreeing means one caused the other.

### Example

In a chat application, a reply must show a higher timestamp than the message it answers. Lamport clocks guarantee this even if the replying user's machine has a slow physical clock.
$md$, 5, false),

  (sid, 2, 'Explain Vector Clocks and their significance.', $md$
A **vector clock** extends Lamport's clock so that causality can be determined **exactly** — it detects not only that ordering is preserved, but whether two events are genuinely **concurrent**.

### Structure

Each of *n* processes keeps a **vector of n integers**. For process Pi, `V[i]` counts its own events and `V[j]` records what it knows of Pj's progress.

### The Rules

```text
RULE 1: before a local event at Pi,   V_i[i] = V_i[i] + 1

RULE 2: when sending, attach the whole vector V_i

RULE 3: on receiving vector Vm at Pi,
            for each k:  V_i[k] = max(V_i[k], Vm[k])
            then         V_i[i] = V_i[i] + 1
```

### Comparing Vectors

| Relation           | Condition                                    |
| ------------------ | -------------------------------------------- |
| **V(a) < V(b)**    | Every element ≤ AND at least one strictly <  |
| **a → b**          | V(a) < V(b)                                  |
| **a ∥ b (concurrent)** | Neither V(a) < V(b) nor V(b) < V(a)      |

### Worked Example

```text
P1: [1,0,0] --- [2,0,0] ----send---->
                                  \
P2: [0,1,0] ------------------- recv -> [2,2,0]

Comparing [2,0,0] and [0,1,0]:
  2 > 0 in position 1, but 0 < 1 in position 2
  -> neither dominates -> CONCURRENT
```

### The Significance

```text
a -> b   IF AND ONLY IF   V(a) < V(b)
```

This **biconditional** is what Lamport clocks lack. Vector clocks can therefore:

* Detect **concurrent** events precisely
* Identify **conflicting updates** in replicated databases
* Support **causal consistency** and conflict resolution
* Underpin systems such as **Amazon Dynamo** and version-vector file systems

### Cost

Message size grows with **O(n)** — every message carries n integers, which limits scalability in very large systems.

> Lamport clocks answer "is this consistent with causality?"; vector clocks answer "did this actually cause that?"

### Example

Two users edit the same document on different replicas. Vector clocks show the versions are concurrent rather than one superseding the other, so the system knows to raise a **conflict** instead of silently discarding an edit.
$md$, 6, false),

  (sid, 2, 'Explain Causal Ordering in distributed systems.', $md$
**Causal ordering** guarantees that messages are **delivered** in an order consistent with the causal relationships between their sends. If the sending of message M1 causally precedes the sending of M2, then every process receiving both must deliver M1 first.

### The Problem It Solves

Network delays vary, so a causally later message can physically arrive first:

```text
P1: send M1 to P3 ------------------------------\
                                                 \  (slow link)
P2: recv M1, then send M2 to P3 ---\              \
                                    \ (fast link)  \
P3:                              M2 arrives    M1 arrives

P3 sees the REPLY before the MESSAGE it replies to.
```

M1 → M2 causally, yet P3 receives M2 first. Without causal ordering, the application sees an answer to a question it has not yet received.

### The Formal Requirement

```text
if  send(M1) -> send(M2)
then  deliver(M1) before deliver(M2)  at every common destination
```

Note the distinction between **receive** (arrival at the node) and **deliver** (handing to the application). Causal ordering is enforced by **holding back** a received message until its causal predecessors have been delivered.

### Implementation Approaches

**Birman–Schiper–Stephenson (BSS)**
Each message carries a **vector timestamp**. On arrival, the receiver checks whether all causally preceding messages have already been delivered; if not, the message waits in a buffer.

**Schiper–Eggli–Sandoz (SES)**
Each message carries information only about messages the sender knows the receiver has not yet seen, reducing overhead.

### Ordering Guarantees Compared

| Ordering    | Guarantee                                    | Cost      |
| ----------- | -------------------------------------------- | --------- |
| **FIFO**    | Messages from one sender arrive in send order| Cheapest  |
| **Causal**  | Respects happened-before across all senders  | Moderate  |
| **Total**   | All processes see the same order             | Expensive |

> Causal ordering is the sweet spot: strong enough that effects never precede causes, cheap enough to be practical — which is why group communication systems adopt it.

### Example

In a group chat, a reply must never appear above the message it answers, even though it travelled a different route. Causal ordering buffers the reply until the original arrives.
$md$, 7, false),

  (sid, 2, 'Explain Global State and its importance in distributed systems.', $md$
The **global state** of a distributed system is the collection of all **local states** of its processes together with the states of all **communication channels** — the messages in transit.

### Components

```text
Global State = { local state of each process }
             + { messages in transit on each channel }
```

Including channel state is essential: a message that has been sent but not received is part of the system's state, and ignoring it produces an inconsistent picture.

### The Difficulty

There is no global clock, so processes cannot record their states simultaneously. States are recorded at slightly different moments, and the assembled result may correspond to a system state that **never actually existed**.

### Consistent vs Inconsistent States

A global state is **consistent** if, for every message included as *received*, its *send* is also included.

```text
CONSISTENT:                    INCONSISTENT:
P1: send M ●                   P1: (send not recorded)
P2:      ● recv M              P2: ● recv M recorded

Send recorded before receive   Receive without a send —
                               a message from nowhere
```

An inconsistent state violates causality and is useless for reasoning.

### Chandy–Lamport Snapshot Algorithm

The standard method for recording a consistent global state without stopping the system:

```text
1. Initiator records its own state, then sends a MARKER on every outgoing channel
2. On receiving a MARKER on channel C:
     - if this is the FIRST marker: record own state,
       record channel C as EMPTY, send markers on all outgoing channels
     - otherwise: record channel C's state as the messages
       received on C since recording own state
3. Done when every process has received a marker on every incoming channel
```

### Importance

| Use                    | Why global state is needed          |
| ---------------------- | ----------------------------------- |
| **Checkpointing**      | Restart after failure               |
| **Deadlock detection** | Find cycles across nodes            |
| **Termination detection** | Confirm all work is complete     |
| **Debugging**          | Reconstruct what happened           |
| **Garbage collection** | Prove no reference remains          |

> A snapshot need not be a state the system was ever *in*; it need only be a state the system *could have been in* — that is sufficient for detecting stable properties.

### Example

Detecting distributed deadlock requires seeing all processes and channels at once. A Chandy–Lamport snapshot provides a consistent view without pausing the application.
$md$, 8, false),

  (sid, 2, 'Explain Cuts in distributed systems.', $md$
A **cut** is a graphical way of describing a global state: a line drawn across the space–time diagram of a distributed computation, dividing each process's timeline into a **past** and a **future**.

### Definition

For each process, the cut selects a point in its execution. The **cut** is the set of all events that occurred before those points.

```text
                     |  cut
P1: e1---e2---e3-----|----e4---e5
                     |
P2: f1---f2----------|----f3---f4
                     |
P3: g1---g2---g3-----|----g4
     past            |    future
```

### Consistent and Inconsistent Cuts

A cut is **consistent** if, for every event in the cut, all events that **happened-before** it are also in the cut.

```text
CONSISTENT CUT:                INCONSISTENT CUT:
P1: --send M--|-----           P1: -------|--send M--
              |                           |      \
P2: ----------|--recv M        P2: -------|-------recv M
                                          |
Send is inside; receive outside  Receive inside, send OUTSIDE
-> valid                         -> IMPOSSIBLE state
```

The inconsistent cut shows a message received but never sent — a state the system could never have occupied.

### Formal Statement

```text
Cut C is consistent  iff  for all events e in C:
      f -> e  implies  f is in C
```

That is, the cut is **left-closed** under the happened-before relation.

### Relationship to Global State

* A **consistent cut** corresponds exactly to a **consistent global state**
* The Chandy–Lamport snapshot algorithm computes precisely such a cut
* Messages crossing the cut **left to right** (sent before, received after) are the **in-transit** messages that form the channel state

| Message crosses cut | Meaning                       | Valid? |
| ------------------- | ----------------------------- | ------ |
| Left → right        | In transit at cut time        | Yes    |
| Right → left        | Received before it was sent   | No     |

> A cut is consistent exactly when no arrow in the diagram points backwards across it.

### Example

Taking a backup of three database replicas at slightly different times gives an inconsistent cut if replica B records a transaction it received from A, but A's snapshot was taken before it sent it. Restoring from that backup would resurrect a transaction with no origin.
$md$, 9, false),

  (sid, 2, 'Explain Termination Detection.', $md$
**Termination detection** is the problem of determining whether a distributed computation has **finished** — that is, whether all processes are idle **and** no messages remain in transit that could reactivate one.

### Why It Is Non-Trivial

A process being idle is not enough. An idle process can be woken by a message still travelling toward it, so a naive check that "everyone is idle" can report termination while work is still in flight.

```text
P1: idle       P2: idle       but a message is still crossing
                              the network toward P1
   -> NOT terminated
```

### The Correct Condition

```text
Terminated  =  ALL processes are passive
            AND  ALL channels are empty
```

### Process Model

| State       | Meaning                                    |
| ----------- | ------------------------------------------ |
| **Active**  | Executing; may send messages               |
| **Passive** | Idle; can only become active on receiving  |

An active process may become passive spontaneously; a passive process becomes active **only** by receiving a message.

### Detection Algorithms

**1. Dijkstra–Scholten (Tree-Based)**
Builds a spanning tree of the computation. A process reports completion to its parent only when it is passive **and** all its children have reported. Termination is declared when the root has no remaining children.

**2. Huang's Weight-Throwing**
The initiator starts with weight 1. Every message carries part of the sender's weight; a process returning to passive sends its weight back. When the initiator's weight returns to 1, the computation has terminated.

```text
initiator weight 1.0
  send msg with 0.5 -> P2 (initiator keeps 0.5)
  P2 finishes, returns 0.5
  initiator back to 1.0 -> TERMINATED
```

Weight can never be created, only divided — which is what makes the test sound.

**3. Snapshot-Based**
Take a Chandy–Lamport snapshot and check whether all processes are passive and all channels empty.

> Termination is a **stable property**: once true it stays true, which is what makes detection with a possibly-outdated snapshot valid.

### Example

A distributed graph search across 50 nodes finishes when no node is exploring and no exploration request is in flight. Weight-throwing detects this without any node needing global knowledge.
$md$, 10, false),

  (sid, 2, 'Explain Distributed Mutual Exclusion and its requirements.', $md$
**Distributed mutual exclusion** ensures that only one process at a time enters a critical section, in a system with **no shared memory** and **no central lock**. Coordination happens purely by exchanging messages.

### Why It Differs from Single-Machine Mutual Exclusion

| Aspect            | Single machine     | Distributed             |
| ----------------- | ------------------ | ----------------------- |
| Shared variable   | Available          | None                    |
| Clock             | Common             | None                    |
| Failure           | All-or-nothing     | Partial                 |
| Cost of a lock    | Nanoseconds        | Message round trips     |

A semaphore is impossible: there is no memory both processes can read.

### The Three Requirements

**1. Safety (Mutual Exclusion)**
At most one process may be in the critical section at any time. This is the essential correctness property.

**2. Liveness (Freedom from Deadlock and Starvation)**
Every request must eventually be granted. No set of processes may block each other forever, and no single process may be passed over indefinitely.

**3. Fairness (Ordering)**
Requests should be granted in the order they were **causally** made — typically in the order of their logical timestamps, not their arrival order.

### Performance Metrics

| Metric                    | Meaning                                      |
| ------------------------- | -------------------------------------------- |
| **Message complexity**    | Messages per critical-section entry           |
| **Synchronisation delay** | Time between one process leaving and the next entering |
| **Response time**         | From request to completion of the CS          |
| **Throughput**            | Rate of critical-section executions           |

### The Two Families

* **Non-token based** — a process enters after collecting **permission** from others (Lamport, Ricart–Agrawala, Maekawa)
* **Token based** — a unique **token** confers the right to enter; whoever holds it may proceed (Suzuki–Kasami, Raymond)

```text
Non-token: "may I enter?"  -> collect replies -> enter
Token:     "where is the token?" -> obtain it -> enter
```

> The token approach is usually cheaper in messages, but loses the token if its holder crashes — the classic reliability-versus-efficiency trade.

### Example

Three servers updating one shared configuration file must not write simultaneously. With no shared lock, they run a distributed mutual exclusion algorithm to serialise their writes.
$md$, 11, false),

  (sid, 2, 'Explain Non-Token Based Algorithms for distributed mutual exclusion.', $md$
In **non-token based** algorithms, there is no special object conferring access. A process wishing to enter the critical section must **request permission** from other processes and wait until it has collected enough replies.

### General Principle

```text
1. Process wants CS -> sends REQUEST to a set of processes
2. Receivers reply GRANT (immediately or after deferring)
3. Requester enters CS once all needed replies are collected
4. On exit, sends RELEASE or deferred replies
```

Logical clocks (usually **Lamport timestamps**) order competing requests so that conflicts are resolved consistently everywhere.

### Principal Algorithms

**1. Lamport's Algorithm**
Every process keeps a request queue ordered by timestamp. Requires **3(N−1)** messages per entry: REQUEST, REPLY and RELEASE to each of the other N−1 processes.

**2. Ricart–Agrawala Algorithm**
An optimisation that eliminates RELEASE messages: a process defers its REPLY until it has itself finished with the critical section. Requires **2(N−1)** messages.

```text
On receiving REQUEST(tj, Pj) at Pi:
   if Pi not requesting, or Pj's request has a SMALLER timestamp
        -> reply immediately
   else -> DEFER the reply until Pi exits its CS
```

**3. Maekawa's Algorithm**
A process need not ask everyone — only its **quorum** (request set), constructed so that any two quorums **intersect**. That intersection guarantees mutual exclusion. Requires about **3√N** messages, a major saving, but can **deadlock** and needs extra handling.

### Comparison

| Algorithm        | Messages per entry | Notes                       |
| ---------------- | ------------------ | --------------------------- |
| Lamport          | 3(N−1)             | Simple, queue-based         |
| Ricart–Agrawala  | 2(N−1)             | Deferred replies            |
| Maekawa          | ~3√N               | Quorums; deadlock possible  |

### Strengths and Weaknesses

* **Strength** — no single point of failure; a crashed process affects only those awaiting its reply
* **Weakness** — message cost grows with N; every entry needs a round of communication

> Non-token algorithms are robust because permission is distributed, and expensive for exactly the same reason.

### Example

In Ricart–Agrawala with 5 nodes, a process sends 4 REQUESTs and waits for 4 REPLYs — 8 messages. Lamport's version would need 12, since it must also broadcast RELEASE.
$md$, 12, false),

  (sid, 2, 'Explain Lamport''s Algorithm for distributed mutual exclusion.', $md$
**Lamport's algorithm** achieves distributed mutual exclusion using **logical timestamps** and a **request queue** held by every process. Requests are served in timestamp order, giving fairness.

### Assumptions

* Every process maintains a Lamport logical clock
* Channels are **FIFO** — messages between two processes arrive in send order
* Each process keeps a queue of pending requests ordered by (timestamp, process id)

### The Algorithm

**Requesting the critical section**

```text
Pi sends REQUEST(tsi, i) to all other processes
Pi places (tsi, i) in its own queue
```

**On receiving REQUEST(tsi, i)**

```text
Pj places (tsi, i) in its queue
Pj sends a timestamped REPLY to Pi
```

**Entering the critical section — both conditions must hold**

```text
1. Pi's own request is at the HEAD of its queue
   (smallest timestamp; ties broken by process id)

2. Pi has received a REPLY from every other process
   with a timestamp LATER than its own request
```

**Releasing**

```text
Pi removes its request from its queue
Pi sends RELEASE to all other processes
On receiving RELEASE, each Pj removes Pi's request from its queue
```

### Why FIFO Channels Matter

Condition 2 relies on the fact that if a later-timestamped message has arrived from Pj, then any earlier REQUEST from Pj must already have arrived. Without FIFO ordering this reasoning fails.

### Message Complexity

| Message type | Count per entry |
| ------------ | --------------- |
| REQUEST      | N − 1           |
| REPLY        | N − 1           |
| RELEASE      | N − 1           |
| **Total**    | **3(N − 1)**    |

### Properties

* **Safety** — the total order on (timestamp, id) ensures only one process is ever at the head
* **Liveness** — every request eventually reaches the head, so no starvation
* **Fairness** — requests are served in causal order

> Ties are broken by process id, which turns Lamport's *partial* order into the **total** order the algorithm needs.

### Example

P1 requests at timestamp 4 and P2 at timestamp 6. Both queues order P1 first, so P1 enters. When P1 releases, P2 becomes the head everywhere simultaneously and enters next — consistent ordering with no central coordinator.
$md$, 13, false),

  (sid, 2, 'Explain Token Based Algorithms for distributed mutual exclusion.', $md$
In **token based** algorithms, a unique message called the **token** represents the right to enter the critical section. A process may enter **only while holding the token**, so mutual exclusion follows directly from the token's uniqueness.

### Core Principle

```text
Exactly ONE token exists in the system.

hold token -> may enter CS
no token   -> must request it and wait
```

Safety is trivially guaranteed: two processes cannot both hold a unique object.

### Principal Algorithms

**1. Suzuki–Kasami Broadcast Algorithm**
A requesting process **broadcasts** its request to all others; the token holder forwards the token when done. Uses sequence numbers to distinguish current from outdated requests. Cost: **N messages** or **0** if the process already holds the token.

**2. Raymond's Tree-Based Algorithm**
Processes form a **logical tree** with the token at the root. Each node keeps a pointer toward the token holder. Requests travel up the tree and the token travels back down. Cost: **O(log N)** messages on average — much better for large systems.

**3. Ring-Based (Token Ring)**
The token circulates continuously around a logical ring. A process wanting the CS simply waits for the token to arrive. Very simple, but the token consumes bandwidth even when nobody needs it, and waiting time can be long.

### Comparison with Non-Token Algorithms

| Aspect              | Token based        | Non-token based     |
| ------------------- | ------------------ | ------------------- |
| Mutual exclusion    | By token uniqueness| By permission count |
| Messages per entry  | 0 to N             | 2(N−1) or 3(N−1)    |
| Repeated entry cost | **0** if held      | Full cost each time |
| Failure sensitivity | **Token loss is fatal** | Tolerates failures better |

### The Central Weakness

If the token holder **crashes**, the token is lost and the whole system halts. Recovery requires **token regeneration**, which must be careful not to create two tokens — a split that would destroy mutual exclusion. Detecting loss reliably is itself difficult, since a slow holder is indistinguishable from a crashed one.

> Token algorithms are efficient because permission is *held* rather than *requested* — and fragile for exactly the same reason.

### Example

A process that repeatedly enters the critical section pays **zero** messages after the first acquisition, because it simply keeps the token — an efficiency non-token algorithms can never match.
$md$, 14, false),

  (sid, 2, 'Explain Suzuki-Kasami''s Broadcast Algorithm.', $md$
**Suzuki–Kasami's algorithm** is a token-based distributed mutual exclusion algorithm in which a process wanting the critical section **broadcasts** its request, and the current token holder passes the token on.

### Data Structures

**At each process Pi**

```text
RN_i[1..N]   request numbers: RN_i[j] = latest request
             sequence number Pi has heard from Pj
```

**Inside the token**

```text
LN[1..N]     last executed: LN[j] = sequence number of
             Pj's most recently SATISFIED request
Q            queue of processes waiting for the token
```

The pairing of `RN` (requests heard) with `LN` (requests satisfied) is the heart of the algorithm.

### The Algorithm

**Requesting the CS**

```text
1. Pi increments RN_i[i]
2. Pi broadcasts REQUEST(i, RN_i[i]) to all processes
3. Pi waits until it receives the token
```

**On receiving REQUEST(j, n)**

```text
RN_i[j] = max(RN_i[j], n)

if Pi holds an IDLE token and RN_i[j] = LN[j] + 1
      -> send the token to Pj
```

The test `RN[j] = LN[j] + 1` is what distinguishes an **outstanding** request from a stale duplicate.

**Releasing the CS**

```text
1. LN[i] = RN_i[i]          (record this request as satisfied)

2. for every process j not already in Q:
       if RN_i[j] = LN[j] + 1  ->  append j to Q

3. if Q is non-empty:
       remove the head of Q and send it the token
   else:
       keep the token
```

### Message Complexity

| Situation                    | Messages |
| ---------------------------- | -------- |
| Process already holds token  | **0**    |
| Otherwise                    | **N**    |

That is (N−1) broadcast requests plus one token transfer.

### Properties

* **Safety** — guaranteed by token uniqueness
* **Liveness** — the queue ensures every requester is eventually served
* **No starvation** — requests are queued in order of discovery

> The elegance lies in the `RN` / `LN` comparison: it lets any holder decide, from purely local information, whether a given process is genuinely waiting.

### Example

With 5 processes, P3 broadcasts 4 REQUESTs and receives the token in 1 message — 5 in total. If P3 wants the CS again immediately and still holds the token, the cost is **zero messages**.
$md$, 15, false),

  (sid, 2, 'Explain the major issues in Distributed Deadlock Detection.', $md$
Detecting deadlock across machines is much harder than on a single machine, because no node can see the complete **wait-for graph** and any view it constructs is already out of date.

### The Central Problem

The global wait-for graph is **distributed** across nodes. Each site knows only its local edges, and a deadlock cycle may span several sites with no site able to see it.

```text
Site A:  P1 --waits--> P2
Site B:  P2 --waits--> P3
Site C:  P3 --waits--> P1

Cycle exists, but NO SINGLE SITE can see it.
```

### Major Issues

**1. Phantom (False) Deadlocks**
Because information arrives with delay, a detector may assemble a cycle from edges that no longer all exist — for example if a process released a resource after its edge was reported. The system then aborts a transaction unnecessarily.

**2. Undetected Deadlocks**
The opposite error: inconsistent snapshots can miss a genuine cycle.

**3. No Global State**
Constructing a consistent view requires a snapshot algorithm, which itself costs messages and time.

**4. Message Overhead**
Detection traffic competes with useful work. Frequent detection is expensive; infrequent detection leaves deadlocks unresolved longer.

**5. Detection Latency**
The longer a deadlock persists, the more resources are wasted holding locks.

**6. Duplicate Detection**
Several sites may detect the same cycle independently and each abort a victim, killing more transactions than necessary.

**7. Choosing a Victim**
Recovery requires selecting which process to abort — by age, priority, resources held, or rollback cost.

| Issue           | Consequence                      |
| --------------- | -------------------------------- |
| Phantom deadlock| Unnecessary aborts, lost work    |
| Missed deadlock | System hangs                     |
| Overhead        | Reduced throughput               |
| Duplicate abort | Excessive rollback               |

> Every distributed deadlock detector trades false positives against detection delay — there is no setting that eliminates both.

### Example

A detector sees "P1 waits for P2" and, moments later, "P2 waits for P1" — but P1 had already released and moved on. The reported cycle never existed simultaneously, and aborting P1 wastes completed work.
$md$, 16, false),

  (sid, 2, 'Explain Centralized Deadlock Detection Algorithms.', $md$
In **centralised deadlock detection**, one designated site — the **coordinator** — maintains the global wait-for graph and is solely responsible for finding cycles.

### How It Works

```text
Site A ---local WFG---\
Site B ---local WFG----> COORDINATOR -> build global WFG
Site C ---local WFG---/                -> search for cycles
                                       -> select and abort a victim
```

### Ways of Reporting

| Method            | Description                                   |
| ----------------- | --------------------------------------------- |
| **Continuous**    | Every edge change is sent immediately         |
| **Periodic**      | Sites send their graph at fixed intervals     |
| **On demand**     | The coordinator asks when it suspects deadlock|

Continuous reporting is accurate but expensive; periodic reporting is cheap but increases detection latency.

### The Ho–Ramamoorthy Algorithms

**Two-phase algorithm**
The coordinator collects status from all sites, builds a graph, then **collects again**. Only edges present in **both** collections are considered real — a simple and effective filter against phantom deadlocks.

**One-phase algorithm**
Sites maintain both a resource table and a process table; the coordinator uses only entries that are consistent between the two, again reducing false positives.

### Advantages

* **Simple** — one place holds the whole graph
* **Straightforward cycle detection** — standard graph algorithms apply
* **No duplicate detection** — only the coordinator declares deadlock, so only one victim is chosen

### Disadvantages

* **Single point of failure** — if the coordinator crashes, detection stops entirely
* **Performance bottleneck** — all sites report to one node
* **High message traffic** converging on one site
* **Phantom deadlocks** — still possible if reports are not consistent
* **Poor scalability**

> Centralised detection is the simplest correct approach and the least suitable for large systems — the coordinator becomes both the bottleneck and the liability.

### Example

A distributed database with a central lock manager collects lock waits from every node. It detects a cycle spanning three nodes and aborts the youngest transaction. If that manager fails, deadlocks accumulate undetected until it is restarted.
$md$, 17, false),

  (sid, 2, 'Explain Distributed Deadlock Detection Algorithms.', $md$
In **distributed deadlock detection**, every site participates in detection; there is no coordinator. Sites cooperate by exchanging probes or graph fragments, removing the single point of failure.

### The Main Approaches

**1. Path-Pushing**
Each site sends its portion of the wait-for graph to neighbouring sites, which merge it with their own and forward the result. A cycle becomes visible once enough fragments meet.

**2. Edge-Chasing (Probe-Based)**
Short **probe messages** are propagated along wait-for edges. If a probe returns to its originator, a cycle exists.

**3. Diffusion Computation**
Query messages are diffused through the system and replies are gathered back, confirming whether a blocked process is genuinely deadlocked.

**4. Global State Detection**
Take a consistent snapshot (Chandy–Lamport) and examine it for cycles.

### The Chandy–Misra–Haas Algorithm

The best-known edge-chasing algorithm. A probe carries three identifiers:

```text
probe(i, j, k)
  i = process that INITIATED the detection
  j = process SENDING this probe
  k = process RECEIVING it
```

**Rules**

```text
A blocked process Pi sends probe(i, i, k) to every process
it is waiting for.

On receiving probe(i, j, k) at Pk:
   if Pk is blocked:
        forward probe(i, k, m) to every process Pk waits for
   if i = k:
        the probe has returned to its initiator -> DEADLOCK
```

Because probes propagate only through **blocked** processes, an active process stops the chase — which is exactly right, since it may yet release.

### Advantages and Disadvantages

| Advantage                     | Disadvantage                        |
| ----------------------------- | ----------------------------------- |
| No single point of failure    | More complex to implement           |
| Load spread across sites      | Possible duplicate detection        |
| Scales better                 | Higher total message count          |
| Faster local detection        | Phantom deadlocks still possible    |

**Duplicate detection** is the characteristic weakness: several processes in the same cycle may each initiate a probe and each detect the deadlock, so extra rules (such as "only the lowest process id aborts") are needed to avoid multiple aborts.

> Edge-chasing is popular because probes are tiny and travel only where deadlock is actually possible — along chains of blocked processes.

### Example

P1 blocked on P2, P2 on P3, P3 on P1. P1 sends probe(1,1,2), which becomes probe(1,2,3), then probe(1,3,1). It returns to P1, whose own id matches the initiator field — deadlock confirmed with three small messages.
$md$, 18, false),

  (sid, 2, 'Explain the classification of Agreement Protocols.', $md$
**Agreement protocols** allow correct processes in a distributed system to reach a **common decision**, even when some processes are **faulty**. They are the foundation of fault-tolerant distributed computing.

### The System Model

| Assumption      | Options                                   |
| --------------- | ----------------------------------------- |
| **Synchrony**   | Synchronous (bounded delay) or asynchronous |
| **Failure type**| Crash, omission, or Byzantine (arbitrary)  |
| **Communication**| Reliable, authenticated or unauthenticated |

### Types of Faults

* **Crash fault** — a process stops permanently
* **Omission fault** — messages are lost
* **Byzantine fault** — a process behaves arbitrarily, possibly maliciously, sending conflicting information to different peers

Byzantine is the hardest because a faulty process may actively try to prevent agreement.

### The Three Classical Problems

**1. The Byzantine Agreement Problem**
A **single source** process broadcasts a value. All non-faulty processes must agree on it.

```text
Agreement:  all non-faulty processes decide the SAME value
Validity:   if the source is non-faulty, that value is its value
```

**2. The Consensus Problem**
**Every** process starts with its own initial value. All non-faulty processes must agree on one common value.

```text
Agreement:  all non-faulty processes decide the same value
Validity:   if ALL start with v, the decision must be v
```

**3. The Interactive Consistency Problem**
Every process has a value, and all non-faulty processes must agree on a **vector** containing every process's value.

### Comparison

| Problem                | Who has initial values | Agreed result       |
| ---------------------- | ---------------------- | ------------------- |
| Byzantine agreement    | One source             | A single value      |
| Consensus              | All processes          | A single value      |
| Interactive consistency| All processes          | A vector of values  |

### The Fundamental Bound

With Byzantine faults, agreement is possible **only if**:

```text
N >= 3m + 1
```

where N is the number of processes and m the number of faulty ones — so tolerating 1 traitor needs 4 processes, and 2 traitors need 7.

> The three problems are equivalent in power: a solution to any one can be used to construct solutions to the other two.

### Example

Four generals must agree to attack or retreat while one may be a traitor sending "attack" to some and "retreat" to others. With N=4 and m=1 the bound 4 ≥ 3(1)+1 holds, so agreement is achievable.
$md$, 19, false),

  (sid, 2, 'Explain solutions for Agreement Protocols.', $md$
Solutions to agreement problems depend heavily on the **fault model** and whether messages can be **authenticated**. The stronger the assumptions, the cheaper the solution.

### 1. Lamport–Shostak–Pease (Oral Messages, OM)

The classical solution for **unauthenticated** Byzantine faults. Messages can be forged, so a traitor may relay a different value than it received.

```text
Requirement:  N >= 3m + 1
Rounds:       m + 1
Messages:     O(N^(m+1))
```

**Recursive structure**

```text
OM(0): source sends its value to all; each uses what it receives

OM(m): source sends value to all
       each process acts as source in OM(m-1) for the others
       each process takes the MAJORITY of the values it collects
```

The **majority vote** at each level is what neutralises the traitors' conflicting reports.

### 2. Signed Messages (SM)

If messages carry **unforgeable digital signatures**, a traitor cannot alter a relayed value without detection. This changes the problem fundamentally:

```text
Requirement:  N >= m + 2   (much weaker)
Rounds:       m + 1
```

Authentication converts a Byzantine traitor into little more than a crash fault, because lying can be proven.

### 3. Crash-Fault Consensus

Under crash-only faults in a synchronous system, a simple algorithm suffices: each round every process broadcasts all values it knows; after **m+1** rounds all correct processes hold identical sets and choose the minimum.

### 4. Practical Protocols

| Protocol   | Fault model | Used in                         |
| ---------- | ----------- | ------------------------------- |
| **Paxos**  | Crash       | Chubby, Spanner                 |
| **Raft**   | Crash       | etcd, Consul — designed for clarity |
| **PBFT**   | Byzantine   | Permissioned blockchains        |
| **PoW / PoS** | Byzantine| Public blockchains              |

### The FLP Impossibility

In a **fully asynchronous** system with even one crash fault, **no deterministic** algorithm can guarantee consensus. Practical systems escape this with **timeouts** (partial synchrony), **randomisation**, or **failure detectors**.

> Authentication is the single most valuable assumption available: it drops the requirement from 3m+1 processes to m+2.

### Example

A blockchain with 100 validators tolerating 33 Byzantine nodes satisfies 100 ≥ 3(33)+1. Signatures are what make this practical — without them the message cost would be astronomically higher.
$md$, 20, false),

  (sid, 2, 'Explain applications of Agreement Protocols.', $md$
Agreement protocols underpin nearly every fault-tolerant distributed system in use today. Wherever separate machines must act as one, some form of agreement is running underneath.

### Major Applications

**1. Distributed Databases — Atomic Commit**
All participating sites must either **commit** or **abort** a transaction; a partial commit would corrupt the database. The **two-phase commit (2PC)** and **three-phase commit (3PC)** protocols implement this agreement.

```text
Coordinator: "prepare?"  -> all sites vote YES/NO
             all YES     -> "COMMIT"
             any NO      -> "ABORT"
```

**2. Replicated State Machines**
Replicas must apply the **same operations in the same order** to remain identical. Paxos and Raft provide the ordering agreement — the basis of etcd, ZooKeeper and Google Spanner.

**3. Leader Election**
Distributed systems frequently need a single coordinator. Agreement ensures exactly one leader is chosen and recognised by all — preventing **split-brain**, where two nodes both believe they are leader.

**4. Blockchain and Cryptocurrency**
Nodes must agree on the ordered ledger of transactions despite untrusted participants — a Byzantine agreement problem solved by Proof of Work, Proof of Stake or PBFT.

**5. Clock Synchronisation**
Agreeing on a common time value in the presence of faulty clocks.

**6. Air and Spacecraft Control**
Redundant flight computers vote on control outputs; a faulty unit must not be able to override the others. This is where Byzantine agreement was originally motivated.

**7. Distributed File Systems**
Agreeing on metadata, locks and replica membership.

| Application       | Fault model | Typical protocol |
| ----------------- | ----------- | ---------------- |
| Database commit   | Crash       | 2PC / 3PC        |
| Config service    | Crash       | Paxos / Raft     |
| Blockchain        | Byzantine   | PoW / PBFT       |
| Avionics          | Byzantine   | Signed messages  |

> The cost of agreement is why systems avoid it where they can: every consensus round costs latency, so well-designed systems minimise how often they must agree.

### Example

When you commit a transaction spanning three database shards, 2PC ensures all three commit or none do. If one shard crashes mid-protocol, the others block rather than risk an inconsistent database — a deliberate choice of consistency over availability.
$md$, 21, false);

  RAISE NOTICE 'Advanced Operating Systems — Unit 2: 21 questions inserted.';
END $do$;
