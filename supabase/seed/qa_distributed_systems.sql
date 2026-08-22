-- =====================================================================
-- Study-With-AI seed — Distributed Systems (4th Year) — UNITS 1 & 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Distributed Systems' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Distributed Systems" not found — create it in Admin first.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number IN (1,2) AND question IN (
    'Explain Distributed Systems and their basic characteristics.',
    'Explain different Examples of Distributed Systems.',
    'Explain the major Trends in Distributed Systems.',
    'Explain the focus on Resource Sharing in Distributed Systems.',
    'Explain the major Challenges in Distributed Systems.',
    'Explain Physical Models of Distributed Systems.',
    'Explain Architectural Models of Distributed Systems.',
    'Explain Fundamental Models of Distributed Systems.',
    'Explain Inter Process Communication in Distributed Systems.',
    'Explain External Data Representation and Marshalling.',
    'Explain Multicast Communication.',
    'Explain Network Virtualization and Overlay Networks.',
    'Explain MPI as a case study of Inter Process Communication.',
    'Explain Remote Procedure Call (RPC) and its working in Distributed Systems.',
    'Explain the concept of Indirect Communication.',
    'Explain Group Communication.',
    'Explain Publish-Subscribe Systems.',
    'Explain Message Queues.',
    'Explain Shared Memory Approaches for communication.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain Distributed Systems and their basic characteristics.', $md$
A **distributed system** is a collection of **independent computers** that appears to its users as a **single coherent system**. The components communicate only by passing messages over a network.

Leslie Lamport's definition captures the essential difficulty:

> "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable."

### Basic Characteristics

* **Concurrency** — components execute genuinely in parallel
* **No global clock** — coordination cannot rely on a shared notion of time
* **Independent failures** — components fail separately, and survivors must continue
* **Message passing** — the only means of interaction; no shared memory
* **Resource sharing** — hardware, data and services are shared
* **Openness** — built on published standards, extensible
* **Scalability** — capacity grows by adding machines
* **Transparency** — complexity is hidden from users
* **Heterogeneity** — different hardware, OS and languages interoperate

### The Two Defining Absences

Nearly every difficulty in the field follows from two facts:

```text
1. NO SHARED MEMORY   -> cannot coordinate with a simple lock
2. NO GLOBAL CLOCK    -> cannot order events by timestamp
```

### Partial Failure — the Central Problem

In a single machine, failure is total and obvious. In a distributed system, some components fail while others continue, and a working node **cannot distinguish**:

```text
a CRASHED peer   from   a SLOW peer   from   a PARTITIONED network
```

All three look identical: no reply has arrived. This ambiguity is not an engineering gap — it is provably unavoidable in an asynchronous system.

### Advantages and Disadvantages

| Advantages                | Disadvantages                    |
| ------------------------- | -------------------------------- |
| Economy — commodity hardware | Complexity of design          |
| Reliability through redundancy | Security over open networks  |
| Incremental growth        | Difficult debugging              |
| Geographic distribution   | Network dependence               |
| Performance through parallelism | Partial failure handling    |

> A distributed system is not a faster computer; it is a fundamentally different kind of system in which every fact you hold about another node is already out of date.

### Example

Google Search runs across hundreds of thousands of machines worldwide. A user sees one search box; behind it, machines fail continuously and are replaced without any user noticing — that concealment is the system's achievement.
$md$, 1, true),

  (sid, 1, 'Explain different Examples of Distributed Systems.', $md$
Distributed systems appear wherever computation must span more than one machine — which today is nearly everywhere.

### The World Wide Web

The largest distributed system ever built. Servers, browsers, DNS, CDNs and caches cooperate through HTTP. It is **open** (published standards), **scalable** (billions of documents) and has **no central control**.

### Cloud Computing

AWS, Azure and GCP provide computing as a utility. Users see a service; behind it are data centres across continents, with virtualisation, load balancing and replication hidden entirely.

### Distributed File Systems

**GFS**, **HDFS** and **Amazon S3** store data across thousands of machines with replication for durability. A file appears as one object though it exists in fragments on many disks.

### Peer-to-Peer Systems

**BitTorrent**, **blockchain** networks and **IPFS** have no servers at all — every node is both client and server. Blockchain adds Byzantine fault tolerance, since peers may be actively malicious.

### Distributed Databases

**Cassandra**, **MongoDB**, **Google Spanner** — data partitioned and replicated across nodes, trading consistency for availability in different ways.

### Massively Multiplayer Online Games

Thousands of players share a world state that must remain consistent enough to be playable, with strict latency requirements.

### Financial Systems

Interbank settlement, payment networks and stock exchanges — where correctness under partial failure is a legal requirement, not a preference.

### Internet of Things

Sensors, gateways and cloud analytics forming a distributed pipeline with severely constrained edge devices.

### Comparison

| System        | Scale       | Consistency need | Failure tolerance |
| ------------- | ----------- | ---------------- | ----------------- |
| **Web**       | Global      | Weak             | High              |
| **Cloud storage** | Global  | Tunable          | Very high         |
| **Blockchain**| Global      | Eventual, Byzantine | Very high      |
| **Banking**   | Regional    | **Strong**       | High              |
| **MMO games** | Regional    | Soft real-time   | Medium            |

> These examples differ mainly in **what they are willing to sacrifice**. The web sacrifices consistency for reach; banking sacrifices availability for correctness.

### Example

Netflix streams from CDN edge servers worldwide, stores metadata in Cassandra, runs recommendations on distributed compute clusters, and deliberately injects failures with Chaos Monkey to prove the system survives them — several distributed systems cooperating as one product.
$md$, 2, false),

  (sid, 1, 'Explain the major Trends in Distributed Systems.', $md$
Distributed systems have been reshaped by several trends that changed both what is possible and what is expected.

### 1. Pervasive Networking and the Internet

Universal connectivity means almost every application is now distributed by default. Bandwidth grew while cost fell, making data movement practical.

### 2. Mobile and Ubiquitous Computing

Smartphones, wearables and embedded devices participate as first-class nodes. This introduced **intermittent connectivity**, **variable bandwidth**, **location awareness** and **energy constraints** as ordinary design requirements.

```text
Traditional node: always on, fixed location, mains power
Mobile node:      intermittent, moving, battery-constrained
```

### 3. Distributed Multimedia Systems

Streaming video and audio impose **continuous, timely** delivery requirements very different from file transfer — bandwidth reservation, jitter control and quality adaptation.

### 4. Cloud Computing and Utility Computing

Computing became a metered utility. This shifted capital expenditure to operating expenditure and made **elastic scaling** routine.

### 5. Virtualisation and Containers

Virtual machines, then **containers** (Docker) and orchestration (**Kubernetes**), decoupled software from hardware — making deployment portable and scaling automatic.

### 6. Microservices Architecture

```text
MONOLITH:      one large application, one deployment
MICROSERVICES: many small services, independently deployed

  + independent scaling and deployment
  + technology diversity
  - every internal call becomes a NETWORK call,
    inheriting all distributed systems problems
```

### 7. Edge and Fog Computing

Processing moved **closer to data sources** to reduce latency and bandwidth — essential for IoT and real-time control.

### 8. Serverless Computing

Functions execute on demand with no server management, billed per invocation.

### 9. Big Data and Distributed Analytics

Hadoop, Spark and Kafka made large-scale distributed processing accessible.

### 10. Blockchain and Decentralised Systems

Trustless coordination among mutually distrustful parties — Byzantine fault tolerance moving from theory into deployment.

| Trend          | Principal driver              |
| -------------- | ----------------------------- |
| Cloud          | Cost and elasticity           |
| Mobile         | Ubiquity of devices           |
| Microservices  | Development agility           |
| Edge           | **Latency**                   |
| Blockchain     | Removing trusted intermediaries |

> Microservices deserve particular caution: they convert function calls into network calls, meaning a team adopting them inherits every distributed systems problem in this syllabus.

### Example

A modern retail app runs microservices on Kubernetes in the cloud, caches at CDN edge nodes, processes events through Kafka, and analyses behaviour with Spark — five of these trends operating simultaneously in one product.
$md$, 3, false),

  (sid, 1, 'Explain the focus on Resource Sharing in Distributed Systems.', $md$
**Resource sharing** is the primary motivation for building distributed systems. Hardware, data and services are made available to users and applications across the network rather than being duplicated at every location.

### Categories of Shared Resources

| Category     | Examples                                    |
| ------------ | ------------------------------------------- |
| **Hardware** | Printers, storage, compute clusters, GPUs   |
| **Data**     | Databases, files, web content               |
| **Software** | Applications, libraries, licensed software  |
| **Services** | Authentication, email, payment processing   |

### Why Sharing Matters

* **Economy** — expensive resources need not be duplicated
* **Collaboration** — several users work on shared data
* **Availability** — resources reachable from anywhere
* **Utilisation** — idle capacity is put to use

### The Service Model

Resources are shared through **services** — software managing a resource and offering a well-defined interface.

```text
CLIENT  --request-->  SERVER (manages the resource)
        <--response--

The client cannot access the resource directly.
The server enforces access control and consistency.
```

This encapsulation matters: the server is the only component that can guarantee correct concurrent access.

### Problems Sharing Introduces

**1. Concurrency Control**
Multiple clients accessing one resource simultaneously must not corrupt it. Requires locking, transactions or optimistic concurrency.

**2. Consistency**
When resources are replicated for performance, copies must be kept consistent — the central difficulty of distributed data.

**3. Naming**
Shared resources need names that resolve to locations, handled by distributed naming services such as DNS.

**4. Access Control and Security**
Sharing over an open network means authentication, authorisation and encryption become mandatory.

**5. Failure Handling**
A shared resource that fails affects every user of it.

### Sharing Patterns

| Pattern           | Characteristic                          |
| ----------------- | --------------------------------------- |
| **Client-server** | Centralised resource, many clients      |
| **Peer-to-peer**  | Every node both shares and consumes     |
| **Cluster**       | Pooled resources presented as one       |

> Resource sharing is what makes distributed systems worth building, and simultaneously the source of every hard problem in them — concurrency, consistency and security all arise from sharing.

### Example

A university file server lets hundreds of students access shared course material. The server enforces permissions, handles concurrent reads, and replicates data for durability — three distinct problems that would not exist if every student had a private copy.
$md$, 4, false),

  (sid, 1, 'Explain the major Challenges in Distributed Systems.', $md$
Distributed systems face challenges that do not arise in centralised computing, most stemming from the network and from partial failure.

### 1. Heterogeneity

Differences in hardware, operating systems, programming languages and data representations must be reconciled — through **middleware**, agreed protocols and standard data formats.

### 2. Openness

Systems should be extensible using **published interfaces**. Openness enables interoperability but complicates version management and security.

### 3. Security

The network is untrusted, so systems must address:
* **Confidentiality** — encryption
* **Integrity** — checksums and signatures
* **Availability** — resistance to denial of service
* **Authentication** — proving identity without a shared secret store

### 4. Scalability

A system must remain effective as it grows.

```text
Bottlenecks to avoid:
  - centralised components (one server)
  - centralised data       (one table)
  - centralised algorithms (requiring global knowledge)
```

Any algorithm requiring complete global state cannot scale.

### 5. Failure Handling

The defining challenge — **partial failure**.

| Technique             | Purpose                          |
| --------------------- | -------------------------------- |
| **Detection**         | Timeouts, heartbeats             |
| **Masking**           | Retries, replication             |
| **Tolerance**         | Graceful degradation             |
| **Recovery**          | Checkpoints, rollback            |
| **Redundancy**        | Replicated components            |

### 6. Concurrency

Shared resources accessed simultaneously require synchronisation — but without shared memory, locks must be implemented by message passing, which is far more expensive.

### 7. Transparency

Hiding distribution from users. **Access, location, migration, replication, concurrency** and **failure** transparency are the standard forms. Failure transparency is the hardest and can never be complete.

### 8. Quality of Service

Meeting requirements for reliability, latency and throughput despite variable network conditions.

### The Eight Fallacies of Distributed Computing

The classic list of false assumptions that cause systems to fail:

```text
1. The network is reliable
2. Latency is zero
3. Bandwidth is infinite
4. The network is secure
5. Topology doesn't change
6. There is one administrator
7. Transport cost is zero
8. The network is homogeneous
```

> Every one of these fallacies is an assumption that seems harmless in development and becomes an outage in production.

### Example

A microservice architecture works perfectly in testing where all services run locally. Deployed across regions, network latency turns a 5 ms call chain into 500 ms — fallacies 1, 2 and 7 all failing simultaneously.
$md$, 5, false),

  (sid, 1, 'Explain Physical Models of Distributed Systems.', $md$
A **physical model** describes a distributed system in terms of its **hardware composition** — the actual computers, networks and their arrangement — abstracting away software details.

### The Three Generations

**1. Early Distributed Systems (1970s–1990s)**

```text
Scale:        10-100 nodes
Network:      LAN (Ethernet)
Heterogeneity: limited
Services:     printing, file sharing, email
```
Local, homogeneous and manually administered.

**2. Internet-Scale Distributed Systems (1990s–2000s)**

```text
Scale:        thousands of nodes
Network:      internet, heterogeneous links
Heterogeneity: high — many OS, hardware, languages
Administration: multiple organisations
Services:     web, e-commerce, search
```
The web forced systems to work across administrative boundaries with no central control.

**3. Contemporary Distributed Systems (2000s–present)**

```text
Scale:        ultra-large — hundreds of thousands of nodes
Nodes:        servers, mobiles, sensors, embedded devices
Network:      wired, wireless, cellular, satellite
Autonomy:     nodes join and leave constantly
Services:     cloud, IoT, mobile, edge
```

### Key Dimensions of a Physical Model

| Dimension          | Question it answers                       |
| ------------------ | ----------------------------------------- |
| **Scale**          | How many nodes?                           |
| **Heterogeneity**  | How varied is the hardware and software?  |
| **Openness**       | Can new components be added?              |
| **Quality of service** | What guarantees on latency and reliability? |

### Distributed System Architectures by Physical Arrangement

* **Cluster** — many machines in one location on a fast local network, working as one
* **Grid** — machines across organisations pooled for large computation
* **Cloud** — virtualised resources in data centres, rented on demand
* **Edge/Fog** — computation placed near data sources
* **Peer-to-peer** — no dedicated infrastructure at all

### The Evolution in One View

```text
Early:        few nodes, one LAN, one administrator
Internet:     many nodes, global network, many administrators
Contemporary: enormous scale, mobile and embedded nodes,
              virtualised, continuously changing membership
```

> The trend is toward nodes that are **more numerous, more varied and less permanent** — which is why modern designs assume membership changes constantly rather than treating it as an exception.

### Example

A cluster of 50 identical servers in one rack shares a fast local network and one administrator — an early-generation physical model. A global IoT platform with millions of intermittently connected sensors is contemporary, and needs entirely different assumptions about failure and membership.
$md$, 6, false),

  (sid, 1, 'Explain Architectural Models of Distributed Systems.', $md$
An **architectural model** describes how a distributed system is **structured** — what the components are, what roles they play, and how they are placed and connected.

### Architectural Elements

**1. Communicating entities** — processes, objects, components, or web services
**2. Communication paradigms** — how they interact
**3. Roles and responsibilities** — client, server, or peer
**4. Placement** — where components run

### Communication Paradigms

| Paradigm                 | Nature                                  |
| ------------------------ | --------------------------------------- |
| **Interprocess communication** | Low-level message passing, sockets |
| **Remote invocation**    | RPC, RMI — request/reply                |
| **Indirect communication** | Decoupled — publish-subscribe, queues |

### Architectural Styles

**1. Client-Server**

```text
CLIENT --request--> SERVER
       <--response--
```
Simple and dominant. Server is a potential bottleneck and single point of failure.

**2. Multi-Tier (Three-Tier)**

```text
[ Presentation ] -> [ Application logic ] -> [ Data ]
```
Each tier scales independently — the standard enterprise architecture.

**3. Peer-to-Peer**

```text
Every node is BOTH client and server
```
Highly scalable and resilient; harder to manage and secure.

**4. Service-Oriented / Microservices**
Small independent services communicating over the network, each independently deployable.

**5. Publish-Subscribe**
Producers and consumers fully decoupled through a broker.

### Placement Strategies

| Strategy                | Purpose                              |
| ----------------------- | ------------------------------------ |
| **Mapping to hardware** | Which machine runs what              |
| **Caching**             | Keep data near the consumer          |
| **Mobile code**         | Send the program to the data (applets, JavaScript) |
| **Mobile agents**       | Code that migrates between machines  |

Placement is not a detail — moving a component across a network boundary changes its latency by orders of magnitude.

### Architectural Patterns

* **Layering** — hierarchical abstraction
* **Tiered architecture** — physical distribution of layers
* **Proxy** — a local stand-in for a remote object
* **Brokerage** — intermediary matching requesters to providers
* **Reflection** — the system can inspect and modify its own structure

> The architectural model is where most distributed systems succeed or fail: an elegant algorithm cannot rescue a design that placed a chatty component on the wrong side of a network link.

### Example

An online store uses three-tier architecture: browsers (presentation), application servers (logic), and a replicated database (data). Adding a caching layer and CDN is a **placement** decision that reduces latency without changing the architecture's structure.
$md$, 7, false),

  (sid, 1, 'Explain Fundamental Models of Distributed Systems.', $md$
**Fundamental models** are abstract descriptions capturing the essential properties every distributed system shares, allowing designers to reason rigorously about correctness independent of any particular technology.

The three fundamental models address **timing**, **failure** and **security**.

### 1. The Interaction Model

Concerns communication and timing.

**Synchronous distributed system** — known bounds exist on:
* Message delivery time
* Process execution speed
* Clock drift rate

**Asynchronous distributed system** — **no bounds** on any of these.

```text
SYNCHRONOUS:  a timeout PROVES failure
              (if the bound has passed, the node is dead)

ASYNCHRONOUS: a timeout proves NOTHING
              (the message might still arrive)
```

The internet is asynchronous, which is why failure detection is fundamentally unreliable, and why the **FLP impossibility result** — no deterministic consensus with even one faulty process — applies to real systems.

**Event ordering** must therefore use **logical clocks** and the happened-before relation rather than physical time.

### 2. The Failure Model

Classifies how components can fail.

| Failure type      | Description                                     |
| ----------------- | ----------------------------------------------- |
| **Omission**      | A process or channel fails to perform an action |
| — Process omission| Crash — the process halts                       |
| — Channel omission| Message lost in transit                         |
| **Arbitrary (Byzantine)** | Any behaviour — wrong values, malicious |
| **Timing**        | Response outside its specified time bound       |

**Failure masking** converts a severe failure into a benign one — for example replication turning a crash into a delay.

```text
Crash failure     : easiest to handle
Omission failure  : harder
Byzantine failure : hardest — requires N >= 3m+1
```

### 3. The Security Model

Concerns threats to processes, channels and objects.

**Threats**
* To processes — impersonation of client or server
* To channels — eavesdropping, tampering, replay
* To objects — unauthorised access

**Defences**
* **Cryptography** — confidentiality and integrity
* **Authentication** — proving identity
* **Access control** — enforcing authorisation
* **Secure channels** — TLS providing both

The security model assumes an **enemy** capable of copying, altering and injecting any message — the appropriate assumption for an open network.

> These models are worth learning because they make impossibility results precise: knowing a system is asynchronous with Byzantine failures tells you immediately which guarantees are unattainable.

### Example

Designing a payment system, the asynchronous interaction model means timeouts cannot prove a payment failed; the failure model dictates whether crash tolerance suffices or Byzantine tolerance is needed; the security model requires every message be authenticated and encrypted.
$md$, 8, false),

  (sid, 2, 'Explain Inter Process Communication in Distributed Systems.', $md$
**Inter Process Communication (IPC)** is the mechanism by which processes on different machines exchange data. Since distributed systems have no shared memory, IPC is the **only** means of interaction.

### The Fundamental Primitives

```text
send(destination, message)
receive(source, message)
```

Everything else — RPC, message queues, publish-subscribe — is built on these two.

### Synchronous vs Asynchronous

| Mode             | Sender behaviour                       |
| ---------------- | -------------------------------------- |
| **Synchronous**  | Blocks until the receiver has received |
| **Asynchronous** | Continues immediately after sending    |

```text
SYNCHRONOUS (rendezvous):
   sender ---msg---> receiver
   sender BLOCKS until receipt confirmed
   -> tight coupling, simple reasoning

ASYNCHRONOUS:
   sender ---msg---> [buffer] ---> receiver
   sender continues immediately
   -> loose coupling, better throughput, needs buffering
```

### Message Destinations

* **Direct addressing** — messages sent to a specific process
* **Indirect addressing** — sent to a **port** or **mailbox**, decoupling sender from receiver identity

Indirect addressing is important: it allows the receiving process to be replaced or replicated without senders knowing.

### Sockets — the Standard Implementation

```text
Socket = (IP address, port number)

TCP socket:  connection-oriented, reliable, ordered stream
UDP socket:  connectionless, unreliable, message boundaries preserved
```

| Aspect        | UDP datagram        | TCP stream           |
| ------------- | ------------------- | -------------------- |
| Connection    | None                | Established first    |
| Reliability   | None                | Guaranteed           |
| Ordering      | Not preserved       | Preserved            |
| Message boundaries | **Preserved**  | **Lost**             |
| Overhead      | Low                 | Higher               |

The loss of message boundaries in TCP is a common source of bugs — applications must frame their own messages.

### Failure Model for IPC

* **Omission failures** — messages dropped
* **Ordering failures** — messages arriving out of order
* Requires acknowledgements, timeouts, retransmission and sequence numbers

### Delivery Guarantees

```text
MAYBE:         no guarantee (UDP)
AT-LEAST-ONCE: retransmit until acknowledged — may DUPLICATE
AT-MOST-ONCE:  duplicates filtered — may not execute at all
EXACTLY-ONCE:  ideal, expensive, requires idempotency or transactions
```

> The choice of guarantee is an application decision: an idempotent operation is safe with at-least-once, while a payment requires at-most-once with careful duplicate detection.

### Example

A client sends a UDP request and receives no reply. It cannot tell whether the request was lost, the server crashed, or the reply was lost — so it must decide whether retrying risks executing the operation twice.
$md$, 9, false),

  (sid, 2, 'Explain External Data Representation and Marshalling.', $md$
Different machines represent data differently. **External data representation** is an agreed format for transmitting structured data, and **marshalling** is the process of converting between internal and external forms.

### The Problem

```text
Machine A: little-endian, 32-bit int, ASCII
Machine B: big-endian, 64-bit int, Unicode

Sending raw memory bytes produces GARBAGE at the receiver.
```

**Byte order (endianness)** is the classic example:

```text
The integer 1 in 32 bits:

Big-endian    : 00 00 00 01
Little-endian : 01 00 00 00

Same value, opposite byte order.
```

Beyond endianness, machines differ in integer width, floating-point format, character encoding, structure padding and pointer representation — none of which survive raw transmission.

### Marshalling and Unmarshalling

```text
MARSHALLING:   internal representation -> external format
               (also flattens structures into a byte sequence)

UNMARSHALLING: external format -> internal representation
```

Marshalling must also handle **pointers**, which are meaningless on another machine — referenced data must be copied into the message.

### Approaches

**1. CORBA CDR (Common Data Representation)**
Compact binary format for the 15 primitive CORBA types. Efficient, but requires an agreed interface definition on both sides.

**2. Java Object Serialization**
Objects flattened including class information, enabling reconstruction. Convenient but **Java-only** and verbose.

**3. XML**
Self-describing and human-readable, but very verbose — large messages and slow parsing.

**4. JSON**
Lighter than XML, human-readable, ubiquitous in web APIs. Still text-based, so larger and slower than binary formats.

**5. Protocol Buffers / Thrift / Avro**
Binary, schema-based, compact and fast — the standard for high-performance modern systems.

### Comparison

| Format      | Size     | Speed   | Human-readable | Cross-language |
| ----------- | -------- | ------- | -------------- | -------------- |
| **XML**     | Largest  | Slowest | **Yes**        | Yes            |
| **JSON**    | Large    | Slow    | **Yes**        | Yes            |
| **Java serialization** | Medium | Medium | No       | **No**         |
| **Protocol Buffers** | **Smallest** | **Fastest** | No | Yes      |

### The Trade-off

```text
Human-readable (JSON/XML)  -> easier debugging, larger and slower
Binary (protobuf)          -> compact and fast, requires tooling to inspect
```

> The practical rule: use JSON for public APIs where developer convenience dominates, and a binary format for internal service-to-service traffic where volume dominates.

### Example

A Java client calling a Python service cannot use Java serialization at all. Both marshal to JSON or Protocol Buffers — a neutral external representation both languages understand.
$md$, 10, false),

  (sid, 2, 'Explain Multicast Communication.', $md$
**Multicast** sends a single message to **multiple recipients** simultaneously — a one-to-many communication primitive, in contrast to unicast (one-to-one) and broadcast (one-to-all).

### The Three Modes

```text
UNICAST:    A -> B                   one recipient
BROADCAST:  A -> everyone            all nodes on the network
MULTICAST:  A -> a specific GROUP    selected recipients only
```

### Why Multicast Matters

Sending the same data to 1,000 recipients by unicast means 1,000 transmissions. Multicast sends once, and the network duplicates the message only where paths diverge — a substantial saving in bandwidth and sender load.

### Applications

* **Fault tolerance** — replicating updates to all replicas
* **Service discovery** — finding available services
* **Event notification** — informing all interested parties
* **Streaming media** — one stream, many viewers
* **Distributed databases** — propagating updates
* **Group collaboration** — shared editing

### Reliability Guarantees

| Guarantee            | Meaning                                        |
| -------------------- | ---------------------------------------------- |
| **Unreliable (basic)** | Best effort; some members may miss it        |
| **Reliable**         | All correct members receive it, or none do     |
| **Atomic**           | All-or-nothing delivery across the group       |

### Ordering Guarantees — the Critical Distinction

```text
FIFO ordering:   messages from ONE sender arrive in send order
CAUSAL ordering: causally related messages arrive in order
TOTAL ordering:  ALL members see ALL messages in the SAME order
```

**Total ordering** is the strongest and most expensive. It is essential for **replicated state machines**: replicas applying the same operations in different orders will diverge.

```text
Replica A applies: deposit 100, then apply 5% interest -> 1155
Replica B applies: apply 5% interest, then deposit 100 -> 1150

Same operations, different order, DIFFERENT result.
```

### Implementation

* **IP multicast** — network-level, efficient, but unreliable and poorly supported across the internet
* **Application-level multicast** — overlay networks implementing multicast in software; more flexible, less efficient
* **Gossip protocols** — probabilistic dissemination, highly scalable and robust

> Ordering, not delivery, is usually the hard part: getting a message to everyone is straightforward compared with getting everyone to agree on the order.

### Example

A distributed database replicates writes to three nodes using totally-ordered multicast. Without total ordering, concurrent updates applied in different sequences would leave the replicas permanently inconsistent.
$md$, 11, false),

  (sid, 2, 'Explain Network Virtualization and Overlay Networks.', $md$
**Network virtualization** creates logical networks decoupled from physical infrastructure. An **overlay network** is a virtual network built **on top of** an existing network, with its own topology and routing.

### The Concept

```text
        OVERLAY (logical)
     A -------- B -------- C
        \              /
          \          /
            \      /
   ------------------------------
        PHYSICAL (underlay)
   A -- R1 -- R2 -- R3 -- B -- R4 -- C

One logical hop A-B may cross several physical routers.
```

### Why Overlays Are Used

* **Deploy new services** without changing the underlying network
* **Custom routing** policies the underlay does not provide
* **Application-specific optimisation**
* **Security** through encrypted tunnels
* **Multicast** where the network does not support it
* **Abstraction** from physical topology

### Types of Overlay Networks

**1. Peer-to-Peer Overlays**

| Type            | Structure                | Lookup cost | Example    |
| --------------- | ------------------------ | ----------- | ---------- |
| **Unstructured**| Random connections       | Flooding — inefficient | Gnutella |
| **Structured**  | Distributed hash table   | **O(log N)**| Chord, Pastry, Kademlia |

**Distributed Hash Tables (DHTs)** are the important case: keys and nodes share an identifier space, and each node knows a small routing table allowing any key to be located in O(log N) hops without any central directory.

**2. Content Delivery Networks (CDNs)** — overlay caches placed near users
**3. Virtual Private Networks (VPNs)** — encrypted tunnels forming a private overlay
**4. Software-Defined Networking (SDN)** — separating control plane from data plane

### Advantages and Disadvantages

| Advantages                     | Disadvantages                        |
| ------------------------------ | ------------------------------------ |
| Deploy without changing the network | **Added latency** — extra hops   |
| Application-specific routing   | Overhead of encapsulation            |
| Rapid innovation               | Underlay conditions are invisible    |
| Works across administrative domains | Possible **routing inefficiency** |

The invisibility of the underlay causes a real problem: two overlay neighbours may be physically on opposite sides of the world, so a "one hop" logical route can be very slow.

> Overlays are how the internet evolves without being redesigned: BitTorrent, Tor, blockchain and CDNs are all overlays running on infrastructure that knows nothing about them.

### Example

BitTorrent builds an overlay where peers connect to those holding the pieces they need. The physical network sees only ordinary TCP connections; the overlay's structure — who connects to whom — is chosen entirely by the application.
$md$, 12, false),

  (sid, 2, 'Explain MPI as a case study of Inter Process Communication.', $md$
**MPI (Message Passing Interface)** is a standardised, portable specification for message passing, and the dominant model in **high-performance computing**.

### Why MPI Exists

Before MPI, every supercomputer vendor supplied its own incompatible message-passing library, so parallel programs could not be ported. MPI standardised the interface, allowing one program to run on any conforming system.

### Core Concepts

* **Communicator** — a group of processes that may communicate (`MPI_COMM_WORLD` contains all)
* **Rank** — a unique integer identifying each process within a communicator
* **Message** — data plus an envelope (source, destination, tag, communicator)

### Point-to-Point Communication

```text
MPI_Send(buffer, count, datatype, dest, tag, comm)
MPI_Recv(buffer, count, datatype, source, tag, comm, status)
```

**Blocking vs non-blocking**

| Call            | Behaviour                                  |
| --------------- | ------------------------------------------ |
| `MPI_Send`      | Blocking — returns when the buffer is reusable |
| `MPI_Isend`     | **Non-blocking** — returns immediately     |
| `MPI_Recv`      | Blocking                                   |
| `MPI_Irecv`     | Non-blocking                               |
| `MPI_Wait`      | Wait for a non-blocking operation to finish|

Non-blocking calls allow **communication to overlap with computation**, which is the principal source of performance gains in real MPI programs.

### Collective Operations

Operations involving all processes in a communicator:

| Operation        | Effect                                            |
| ---------------- | ------------------------------------------------- |
| **Broadcast**    | One process sends to all                          |
| **Scatter**      | Distribute distinct chunks to each process        |
| **Gather**       | Collect data from all to one                      |
| **Reduce**       | Combine values (sum, max) into one process        |
| **Allreduce**    | Reduce, with the result given to all              |
| **Barrier**      | All processes wait until every one arrives        |

```text
SCATTER:  [1,2,3,4] at root -> P0:1  P1:2  P2:3  P3:4
GATHER:   P0:1 P1:2 P2:3 P3:4 -> [1,2,3,4] at root
REDUCE:   P0:1 P1:2 P2:3 P3:4 -> sum = 10 at root
```

Collectives are heavily optimised by MPI implementations, often using tree algorithms — usually far faster than equivalent hand-written point-to-point code.

### Why MPI Suits HPC

* **Explicit control** over data movement — essential for performance tuning
* **Extremely low latency** on high-speed interconnects
* **Portable** across supercomputers
* **Scales** to hundreds of thousands of processes

### Limitations

* **Low-level and error-prone** — deadlocks from mismatched sends and receives are common
* **No fault tolerance** — traditionally, one process failing aborts the entire job
* Static process model in MPI-1
* Steep learning curve

> MPI's design assumption — that hardware is reliable and failure is rare — is exactly opposite to the assumption behind cloud distributed systems, which is why the two worlds use different tools.

### Example

A weather simulation divides the atmosphere into a grid across 1,000 processors. Each computes its own region and exchanges boundary values with neighbours using `MPI_Isend`/`MPI_Irecv`, overlapping that exchange with interior computation to hide communication latency entirely.
$md$, 13, false),

  (sid, 2, 'Explain Remote Procedure Call (RPC) and its working in Distributed Systems.', $md$
**Remote Procedure Call (RPC)** allows a program to call a procedure on a **remote machine** as though it were local, hiding the underlying message passing.

### The Goal — Access Transparency

```text
Local call:   result = add(3, 4);
Remote call:  result = add(3, 4);      <- looks IDENTICAL
```

The programmer writes ordinary function calls; the RPC system handles marshalling, transmission and error handling.

### How RPC Works

```text
CLIENT                                    SERVER
  |                                          |
1. calls add(3,4)                            |
  v                                          |
[ CLIENT STUB ]                              |
2. marshals arguments into a message         |
  |                                          |
3. -------- network message -------->  [ SERVER STUB ]
                                       4. unmarshals arguments
                                          v
                                       5. calls the real add(3,4)
                                          v
                                       6. marshals the result
  |                                          |
7. <------- network message ---------        |
  v                                          |
[ CLIENT STUB ]                              |
8. unmarshals result, returns to caller      |
```

### Stubs

**Stubs** are the automatically generated code performing marshalling. They are produced by a compiler from an **Interface Definition Language (IDL)** specification, so the programmer never writes them by hand.

### Failure Semantics — the Critical Difference from Local Calls

A local call either executes or the program crashes. A remote call has failure modes with no local equivalent:

```text
Client sends request, no reply arrives.

Did the request get lost?          -> not executed
Did the server crash mid-execution?-> partially executed
Did the reply get lost?            -> fully executed

The client CANNOT distinguish these.
```

| Semantics         | Guarantee                        | Suitable for        |
| ----------------- | -------------------------------- | ------------------- |
| **Maybe**         | No guarantee                     | Non-critical        |
| **At-least-once** | Executed one or more times       | **Idempotent** operations |
| **At-most-once**  | Executed once or not at all      | Non-idempotent      |
| **Exactly-once**  | Ideal; requires transactions     | Financial operations|

### The Danger of Transparency

RPC's convenience is also its principal criticism: making a network call **look** local encourages programmers to forget that it can be slow, can fail, and can partially execute. A loop calling a remote function 1,000 times looks harmless and is catastrophic.

### Related Technologies

**RMI** (Java, object-oriented), **CORBA** (language-neutral), **gRPC** (modern, Protocol Buffers, HTTP/2), **REST** (resource-oriented over HTTP).

> The lesson of decades of RPC experience: transparency should hide the *mechanism*, never the *cost*.

### Example

A payment service exposes `charge(account, amount)`. Because it is not idempotent, at-least-once semantics could charge twice. The implementation therefore attaches a unique transaction ID and filters duplicates — achieving at-most-once semantics in practice.
$md$, 14, false),

  (sid, 2, 'Explain the concept of Indirect Communication.', $md$
**Indirect communication** allows entities to communicate **without knowing about each other** — messages pass through an intermediary rather than directly between named parties.

### The Two Forms of Decoupling

```text
SPACE UNCOUPLING: sender does not know the receiver's identity,
                  and receivers may change without the sender knowing

TIME UNCOUPLING:  sender and receiver need not exist at the same time
                  (the message is held until collected)
```

Direct communication such as RPC provides **neither**: the caller must know the callee's address, and both must be running simultaneously.

### Comparison

| Paradigm            | Space uncoupled | Time uncoupled |
| ------------------- | --------------- | -------------- |
| **RPC / RMI**       | No              | No             |
| **Group communication** | Yes         | No             |
| **Publish-subscribe** | **Yes**       | Possibly       |
| **Message queues**  | **Yes**         | **Yes**        |
| **Tuple spaces**    | **Yes**         | **Yes**        |

### The Main Techniques

**1. Group Communication** — a message sent to a group is delivered to all members; the sender does not know who they are.

**2. Publish-Subscribe** — publishers emit events; subscribers register interest; a broker matches and delivers.

**3. Message Queues** — producers place messages in a queue; consumers collect them later.

**4. Shared Memory Abstractions** — distributed shared memory and **tuple spaces**, where processes write and read tuples without addressing each other.

### Advantages

* **Loose coupling** — components can be changed, replaced or scaled independently
* **Scalability** — publishers and subscribers added without reconfiguration
* **Fault tolerance** — a receiver may be down when the message is sent
* **Load levelling** — queues absorb bursts
* **Flexibility** — new consumers added without touching producers

### Disadvantages

| Disadvantage           | Detail                                    |
| ---------------------- | ----------------------------------------- |
| **Added latency**      | An extra hop through the intermediary     |
| **Broker dependency**  | The intermediary can become a bottleneck or single point of failure |
| **Harder to debug**    | No direct call chain to follow            |
| **Weaker guarantees**  | Delivery and ordering must be reasoned about explicitly |
| **No natural reply**   | Request/response requires extra machinery |

> Indirect communication trades the simplicity of a direct call for the ability to change either end without changing the other — which is why it dominates event-driven and microservice architectures.

### Example

An order service publishes an `OrderPlaced` event. Inventory, billing and email services each subscribe. Adding a fraud-check service later requires **no change** to the order service — the decoupling that a direct RPC design could not provide.
$md$, 15, false),

  (sid, 2, 'Explain Group Communication.', $md$
**Group communication** provides the abstraction of a **group** of processes that can be addressed collectively — a message sent to the group is delivered to every member.

### Core Concept

```text
        sender
          |
      [ GROUP ]
       /  |  \
     P1  P2  P3      all members receive the message
```

The sender addresses the **group**, not individual members, so membership can change without the sender's knowledge.

### Group Membership Management

A **group membership service** handles:
* **Join and leave** operations
* **Failure detection** — removing crashed members
* **Membership change notification** to remaining members
* **Group address expansion** — mapping the group to current members

### Types of Groups

| Type            | Characteristic                              |
| --------------- | ------------------------------------------- |
| **Closed**      | Only members may send to the group          |
| **Open**        | Non-members may also send                   |
| **Peer group**  | All members are equal                       |
| **Hierarchical**| A coordinator manages the group             |
| **Static**      | Fixed membership                            |
| **Dynamic**     | Members join and leave at runtime           |

### Reliability and Ordering

Delivery guarantees:
* **Unreliable** — best effort
* **Reliable** — all correct members receive it
* **Atomic** — all-or-nothing

Ordering guarantees:

```text
FIFO:    messages from one sender delivered in send order
CAUSAL:  causally related messages delivered in causal order
TOTAL:   all members deliver all messages in the SAME order
```

**View-synchronous communication** is the strongest and most useful property: message delivery is synchronised with membership changes, so all members agree both on the group's composition and on which messages were delivered in each membership "view". This removes an entire class of ambiguity when a member fails mid-broadcast.

### Applications

* **Replication** — keeping replicas identical
* **Fault tolerance** — replicated state machines
* **Distributed caching** — invalidation messages
* **Collaborative applications**
* **Cluster management** and leader election

### Implementation Systems

**ISIS**, **JGroups**, **Spread** — toolkits providing reliable, ordered group communication with membership management.

> Group communication is the natural foundation for **replicated state machines**: if all replicas receive the same messages in the same order, they remain identical by construction.

### Example

Three database replicas form a group. Every update is multicast with total ordering, so all three apply operations in identical sequence and stay consistent. When one replica fails, the membership service notifies the others, which continue as a group of two.
$md$, 16, false),

  (sid, 2, 'Explain Publish-Subscribe Systems.', $md$
A **publish-subscribe** system decouples message producers from consumers entirely. **Publishers** emit events without knowing who will receive them; **subscribers** register interest without knowing who produces them.

### Architecture

```text
Publisher A --\                      /--> Subscriber 1
               \                    /
Publisher B -----> [ EVENT BROKER ] ----> Subscriber 2
               /                    \
Publisher C --/                      \--> Subscriber 3

Publishers and subscribers NEVER reference each other.
```

### Subscription Models

**1. Topic-Based (Channel-Based)**
Subscribers register for named topics.

```text
subscribe("sports/cricket")
publish("sports/cricket", event)
```
Simple and efficient; matching is a straightforward string comparison.

**2. Content-Based**
Subscribers specify predicates over event content.

```text
subscribe(type == "stock" AND price > 500 AND symbol == "INFY")
```
Far more expressive, and considerably more expensive to match — the broker must evaluate every subscription against every event.

**3. Type-Based** — subscription by event type in object-oriented systems

### Implementation Approaches

* **Centralised broker** — simple, but a bottleneck and single point of failure
* **Distributed broker network** — brokers cooperate, routing events toward interested subscribers
* **Peer-to-peer** — no dedicated brokers

### Delivery Guarantees

| Guarantee       | Meaning                                     |
| --------------- | ------------------------------------------- |
| **At-most-once**| May be lost, never duplicated               |
| **At-least-once**| Never lost, may be duplicated              |
| **Exactly-once**| Ideal; expensive to implement               |
| **Durable subscription** | Events retained while a subscriber is offline |

### Advantages

* **Full decoupling** in space, time and synchronisation
* **Scalability** — participants added independently
* **Flexibility** — new subscribers require no change to publishers
* **Asynchronous** — publishers never block

### Disadvantages

* **Delivery uncertainty** — the publisher does not know who received the event
* **Broker bottleneck** and dependency
* **No natural request/response**
* **Debugging difficulty** — implicit, invisible flow of control
* **Ordering guarantees** are limited across topics

### Systems

**Apache Kafka** (log-based, durable, high throughput), **RabbitMQ**, **MQTT** (lightweight, IoT), **Redis Pub/Sub**, **Google Cloud Pub/Sub**.

> Kafka's design deserves note: it persists events in an ordered log rather than deleting them on delivery, so subscribers can replay history — an unusually useful property for debugging and for adding new consumers later.

### Example

A stock platform publishes price updates to `stocks/INFY`. Trading algorithms, dashboards and alerting services subscribe independently. Adding a compliance monitor later requires no change whatever to the publisher.
$md$, 17, false),

  (sid, 2, 'Explain Message Queues.', $md$
A **message queue** provides **point-to-point** indirect communication: producers place messages into a queue, and consumers remove them. Each message is delivered to **exactly one** consumer.

### The Key Difference from Publish-Subscribe

```text
MESSAGE QUEUE (point-to-point):
   Producer -> [ QUEUE ] -> ONE consumer receives each message

PUBLISH-SUBSCRIBE:
   Publisher -> [ TOPIC ] -> EVERY subscriber receives it
```

This distinction determines their use: queues **distribute work**, publish-subscribe **broadcasts events**.

### How It Works

```text
Producer                QUEUE                 Consumer
   |                 [m1,m2,m3]                  |
   |--- send m4 --->  [m1..m4]                   |
   |                  [m2,m3,m4] ---- receive m1 -->|
   |                                              | process
   |                  [m2,m3,m4] <--- acknowledge -|
                       (m1 removed permanently)
```

**Acknowledgement is critical**: the message is removed only after the consumer confirms successful processing. If the consumer crashes mid-processing, the message becomes available again — guaranteeing at-least-once delivery.

### Properties

* **Time uncoupling** — producer and consumer need not run simultaneously
* **Space uncoupling** — neither knows the other's identity
* **Persistence** — messages survive broker restarts if configured durable
* **Load levelling** — a queue absorbs bursts, protecting slower consumers
* **Load balancing** — several consumers on one queue share the work

### Competing Consumers Pattern

```text
                    /--> Consumer 1
   [ QUEUE ] -------+---> Consumer 2
                    \--> Consumer 3

Each message goes to exactly ONE consumer.
Adding consumers increases throughput linearly.
```

This is the standard way to scale background processing.

### Delivery and Ordering

| Aspect              | Typical behaviour                      |
| ------------------- | -------------------------------------- |
| **Delivery**        | At-least-once (duplicates possible)    |
| **Ordering**        | FIFO within a queue; **lost with multiple consumers** |
| **Dead letter queue** | Holds messages that repeatedly fail  |

The ordering caveat matters: as soon as multiple consumers process one queue in parallel, message order is no longer guaranteed.

### Systems

**RabbitMQ**, **Amazon SQS**, **ActiveMQ**, **IBM MQ**, **Azure Service Bus**.

### Advantages and Disadvantages

* **Advantages** — reliability, buffering against load spikes, scalability, and resilience when consumers are unavailable
* **Disadvantages** — added latency, broker complexity, ordering difficulties, and duplicate handling requiring **idempotent** consumers

> Because at-least-once delivery is the practical norm, consumers must be written to be idempotent — processing the same message twice must be harmless.

### Example

An e-commerce site places order confirmation emails on a queue. During a sale, 10,000 orders queue instantly while three email workers process them steadily. Customers are never made to wait for email sending, and no order is lost if a worker crashes.
$md$, 18, false),

  (sid, 2, 'Explain Shared Memory Approaches for communication.', $md$
**Shared memory approaches** provide the illusion of memory shared between processes on **different machines**, allowing communication by reading and writing variables rather than sending messages.

### The Motivation

```text
MESSAGE PASSING:            SHARED MEMORY:
   send(dest, data)            x = 42;
   receive(src, data)          y = x;

Programmers find shared memory more natural —
it is how single-machine concurrency already works.
```

### Distributed Shared Memory (DSM)

DSM presents a single virtual address space across machines. The runtime intercepts memory accesses and fetches or invalidates pages across the network transparently.

```text
Machine A            Machine B
  |                     |
  +---- virtual shared address space ----+
             (implemented over the network)
```

**Implementation approaches**
* **Page-based** — the virtual memory system fetches pages on demand
* **Object-based** — sharing at the granularity of objects
* **Library-based** — explicit shared variables declared by the programmer

### The Central Problem — False Sharing

```text
Page (4 KB) contains variable X and variable Y

Machine A writes X
Machine B writes Y

The two variables are unrelated, yet they share a PAGE,
so the page ping-pongs across the network repeatedly.
```

This is why page-based DSM often performs poorly in practice — the granularity of sharing does not match the granularity of use.

### Consistency Models

| Model              | Guarantee                                    | Cost      |
| ------------------ | -------------------------------------------- | --------- |
| **Strict**         | Reads always return the latest write         | Impossible in practice |
| **Sequential**     | All processes see one consistent order       | Expensive |
| **Causal**         | Causally related writes ordered              | Moderate  |
| **Release**        | Consistency enforced only at synchronisation points | **Cheap** |
| **Entry**          | Per-variable consistency at acquire          | Cheapest  |

**Release consistency** is the practical choice: rather than keeping memory consistent at all times, consistency is enforced only when a lock is acquired or released — dramatically reducing network traffic.

### Tuple Spaces (Linda Model)

A different shared-memory abstraction based on an associative shared space:

```text
out(tuple)   — place a tuple into the space
in(pattern)  — remove a matching tuple (blocking)
rd(pattern)  — read without removing

Processes communicate through the SPACE,
never addressing each other.
```

Tuple spaces provide both space and time uncoupling — **JavaSpaces** is a well-known implementation.

### Shared Memory vs Message Passing

| Aspect            | Shared memory        | Message passing      |
| ----------------- | -------------------- | -------------------- |
| Programming ease  | **Easier**           | More explicit        |
| Performance control | Poor               | **Precise**          |
| Scalability       | Limited              | **Better**           |
| Data movement     | Hidden               | Explicit             |

> DSM is a valuable idea that largely lost in practice: hiding data movement made programs easier to write and their performance impossible to reason about, which is why MPI dominates HPC despite being harder.

### Example

A parallel matrix computation using DSM reads and writes a shared array with no explicit communication. Performance collapses when neighbouring processors update adjacent elements on the same page — false sharing that an explicit message-passing design would have avoided by construction.
$md$, 19, false);

  RAISE NOTICE 'Distributed Systems — Units 1 & 2: 19 questions inserted.';
END $do$;
