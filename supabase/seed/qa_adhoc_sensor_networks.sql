-- =====================================================================
-- Study-With-AI seed — Ad Hoc and Sensor Networks (4th Year)
--
-- Idempotent: each question is deleted before being re-inserted, so running
-- this again refreshes the answers instead of duplicating them. Existing Q&A
-- for other questions in the same unit is left untouched.
--
-- Subject is resolved BY NAME, so no ids are hard-coded. If the subject does
-- not exist the block raises instead of silently inserting nothing.
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  -- Matches "Adhoc and Sensor Networks" as well as "Ad Hoc / Ad-Hoc" spellings,
  -- so a rename doesn't silently stop the seed from finding the subject.
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Ad%hoc and Sensor Networks' AND active LIMIT 1;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'Subject "Adhoc and Sensor Networks" not found — check the exact name in Admin.';
  END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Explain Ad Hoc Networks and their basic characteristics.',
    'Explain the major issues and challenges in Ad Hoc Networks.',
    'Explain the role of MAC Layer Protocols in wireless Ad Hoc Networks.',
    'Explain the requirements and characteristics of MAC protocols for wireless Ad Hoc Networks.',
    'Explain Contention-Based MAC Protocols and their working principle.',
    'Explain MAC Protocols Using Directional Antennas and their advantages.',
    'Explain Multiple-Channel MAC Protocols and their working principle.',
    'Explain Power-Aware MAC Protocols and how they improve energy efficiency in Ad Hoc Networks.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain Ad Hoc Networks and their basic characteristics.', $md$
An **ad hoc network** is a collection of wireless nodes that form a network **on the fly**, without any fixed infrastructure such as base stations, access points or wired backbones. Every node acts both as an **end system** (sending and receiving its own data) and as a **router** (forwarding packets for other nodes).

Because there is no central controller, all network functions — routing, addressing, medium access, security — must be handled cooperatively by the nodes themselves. This is why such networks are also called **infrastructureless** or **self-organising** networks.

### Basic Characteristics

* **Infrastructureless operation** — no base station or fixed backbone is required.
* **Dynamic topology** — nodes move freely, so links form and break continuously.
* **Multi-hop communication** — nodes outside direct radio range communicate through intermediate nodes.
* **Autonomous terminals** — each node is an independent host *and* a router.
* **Distributed operation** — control is shared; there is no single point of coordination.
* **Bandwidth-constrained links** — wireless capacity is lower and more variable than wired links.
* **Energy-constrained nodes** — most nodes run on batteries, so power is a first-class design concern.
* **Limited physical security** — the shared radio medium is open to eavesdropping and jamming.

### How Multi-hop Forwarding Works

```text
node A  --->  node B  --->  node C  --->  node D
(source)   (forwards)    (forwards)   (destination)

A cannot reach D directly, so B and C act as routers
```

### Comparison with Infrastructure Networks

| Feature       | Infrastructure Network | Ad Hoc Network         |
| ------------- | ---------------------- | ---------------------- |
| Base station  | Required               | Not required           |
| Topology      | Mostly fixed           | Continuously changing  |
| Routing       | Done by the network    | Done by the nodes      |
| Deployment    | Slow, planned          | Instant, unplanned     |
| Cost          | High                   | Low                    |

> An ad hoc network trades the reliability of fixed infrastructure for the ability to be deployed instantly, anywhere.

### Example

In a disaster-relief operation where cell towers have been destroyed, rescue workers' laptops and handheld radios can form an ad hoc network among themselves, relaying messages hop by hop across the affected area without any surviving infrastructure.
$md$, 1, true),

  (sid, 1, 'Explain the major issues and challenges in Ad Hoc Networks.', $md$
Ad hoc networks remove fixed infrastructure, and in doing so they inherit a set of problems that wired and cellular networks solve centrally. These challenges shape almost every protocol designed for such networks.

### Major Issues

**1. Dynamic Topology**
Nodes move continuously, so routes break without warning. A protocol must detect the break and repair the path faster than the application notices.

**2. Limited Bandwidth**
The wireless channel offers far less capacity than wired links, and that capacity is *shared* among all nodes in radio range. Control traffic therefore directly reduces useful throughput.

**3. Energy Constraints**
Most nodes are battery-powered. Since transmission and reception dominate energy use, protocols must minimise radio activity, and a node that dies removes a route for everyone using it.

**4. Hidden and Exposed Terminal Problems**
Two nodes that cannot hear each other may transmit simultaneously to a common receiver, causing collisions the sender never detects.

```text
Hidden terminal:
A ---- B ---- C
A and C cannot hear each other,
both transmit to B, packets collide at B
```

**5. Routing Overhead**
Every node is a router. Maintaining routes in a moving network costs control messages, and that cost grows quickly with network size.

**6. Security Vulnerabilities**
The open medium allows **eavesdropping, jamming, spoofing** and **denial-of-service**. There is no trusted central authority to issue or verify credentials.

**7. Scalability**
Control overhead tends to grow faster than the number of nodes, so protocols that work for 20 nodes often collapse at 200.

**8. Quality of Service**
Guaranteeing delay or bandwidth is extremely difficult when the topology, capacity and interference all change continuously.

### Summary

| Challenge         | Root Cause                | Consequence               |
| ----------------- | ------------------------- | ------------------------- |
| Route breakage    | Node mobility             | Packet loss, delay        |
| Collisions        | Shared, invisible medium  | Retransmissions           |
| Battery drain     | Radio activity            | Node and route failure    |
| Attacks           | Open medium, no authority | Loss of confidentiality   |

> Nearly every difficulty in an ad hoc network traces back to two facts: the medium is shared and invisible, and the topology will not hold still.

### Example

In a convoy of moving vehicles, a route chosen when two vehicles were adjacent may break seconds later as they separate — so the routing protocol must repair paths continuously rather than compute them once.
$md$, 2, false),

  (sid, 1, 'Explain the role of MAC Layer Protocols in wireless Ad Hoc Networks.', $md$
The **Medium Access Control (MAC) layer** sits between the physical layer and the network layer, and decides **which node may transmit, and when**. In an ad hoc network the radio channel is a single shared medium, so without such coordination simultaneous transmissions would collide and destroy each other.

### Why a MAC Layer Is Essential Here

In a wired LAN a node can *listen while it transmits* and detect a collision directly (CSMA/CD). A wireless node cannot: its own transmission is millions of times stronger than any incoming signal, so it is deaf while sending. Collisions can only be **avoided**, never detected — which is why wireless MAC protocols use **CSMA/CA** rather than CSMA/CD.

### Main Roles

* **Channel access coordination** — grant the medium to one node at a time in a given region.
* **Collision avoidance** — use carrier sensing, random backoff and handshakes to reduce overlap.
* **Addressing and framing** — attach MAC addresses and frame boundaries.
* **Reliability** — acknowledge frames and retransmit when an ACK is missing.
* **Fairness** — prevent one aggressive node from monopolising the channel.
* **Energy management** — allow radios to sleep when no traffic is expected.
* **Hidden terminal handling** — coordinate nodes that cannot hear one another.

### The RTS/CTS Handshake

```text
sender  --RTS-->  receiver     (Request To Send)
sender  <--CTS--  receiver     (Clear To Send)
sender  --DATA--> receiver
sender  <--ACK--  receiver

neighbours that hear RTS or CTS stay silent
```

The **CTS** is heard by nodes near the *receiver* — including hidden terminals the sender cannot reach — so they defer, solving the hidden terminal problem.

| Function          | Benefit to the Network        |
| ----------------- | ----------------------------- |
| Carrier sensing   | Avoids obvious collisions     |
| RTS/CTS           | Handles hidden terminals      |
| ACK               | Provides link-level reliability |
| Backoff           | Spreads retries in time       |
| Sleep scheduling  | Extends battery life          |

> The MAC layer determines the practical throughput of an ad hoc network: however good the routing protocol is, it can only move data as fast as the MAC lets nodes talk.

### Example

Two laptops in the same room both wish to transmit. Carrier sensing makes the second defer while the first is sending, and random backoff ensures they do not both restart at the same instant once the channel clears.
$md$, 3, false),

  (sid, 1, 'Explain the requirements and characteristics of MAC protocols for wireless Ad Hoc Networks.', $md$
A MAC protocol for an ad hoc network must work **without any central coordinator**, on a medium that is shared, error-prone and invisible to half the participants. This imposes requirements that do not arise in infrastructure networks.

### Requirements

**1. Fully Distributed Operation**
No base station exists, so no node can be assumed to schedule the others. Every node must decide when to transmit using only local information.

**2. Efficient Bandwidth Utilisation**
Wireless capacity is scarce. Control overhead (RTS, CTS, ACK, beacons) must stay small relative to useful data.

**3. Hidden and Exposed Terminal Handling**
The protocol must let nodes that cannot hear each other share a receiver without collisions, while *not* silencing nodes unnecessarily.

**4. Fairness**
Every node deserves a reasonable share of the channel; a node with a strong signal must not starve the others.

**5. Energy Efficiency**
Radios should sleep whenever possible, since idle listening consumes nearly as much power as receiving.

**6. Support for Mobility**
Access decisions must remain valid as neighbours appear and disappear.

**7. QoS Support**
Real-time traffic such as voice needs bounded delay, so the protocol should be able to prioritise.

**8. Scalability**
Performance must degrade gracefully as node density grows.

### Desirable Characteristics

* **Low access delay** for time-sensitive traffic
* **High throughput** under heavy load
* **Robustness** to node failure and interference
* **Simplicity**, since nodes have limited processing power
* **Adaptability** to changing traffic and topology

### Conflicting Goals

```text
energy saving   <---->   low latency
   (sleep)                (stay awake)

high throughput <---->   fairness
 (favour good links)  (serve everyone)
```

| Requirement       | Why It Is Hard                          |
| ----------------- | --------------------------------------- |
| Distributed       | No global view of the network           |
| Energy efficient  | Sleeping nodes miss packets             |
| Fair              | Signal strengths differ widely          |
| QoS               | Capacity changes moment to moment       |

> No single MAC protocol satisfies all of these at once; each design chooses which trade-off to favour for its intended application.

### Example

A protocol tuned for a battery-powered sensor field keeps radios asleep most of the time, accepting higher latency — the opposite choice from a protocol carrying battlefield voice traffic, which keeps radios awake to minimise delay.
$md$, 4, false),

  (sid, 1, 'Explain Contention-Based MAC Protocols and their working principle.', $md$
In a **contention-based MAC protocol**, no node is given a reserved slot. Instead, nodes **compete** for the channel whenever they have data, and the protocol supplies rules that make collisions unlikely and recoverable. These protocols dominate ad hoc networks because they need no central scheduler and adapt naturally to changing membership.

### Working Principle

The core mechanism is **CSMA/CA — Carrier Sense Multiple Access with Collision Avoidance**:

```text
data ready
   |
listen to channel (carrier sense)
   |
busy? ---yes---> wait, then random backoff
   |
   no
   |
optional RTS/CTS exchange
   |
transmit data
   |
wait for ACK ---none---> backoff, retry
```

**Random backoff** is the key idea: after the channel becomes free, each node waits a random number of slots before transmitting. Because the waits differ, the nodes are unlikely to restart simultaneously. On each failure the backoff window **doubles** (binary exponential backoff), spreading contention further as load rises.

### Key Mechanisms

* **Carrier sensing** — do not transmit if someone else is.
* **Random backoff** — de-synchronise competing nodes.
* **RTS/CTS** — reserve the channel and silence hidden terminals.
* **ACK** — confirm delivery, since collisions cannot be detected.
* **NAV (Network Allocation Vector)** — a virtual carrier sense timer telling a node how long to stay quiet.

### Examples of Contention-Based Protocols

| Protocol   | Distinctive Feature                       |
| ---------- | ----------------------------------------- |
| **MACA**   | Introduced RTS/CTS, dropped carrier sense |
| **MACAW**  | Added ACK and better backoff to MACA      |
| **FAMA**   | Combined carrier sensing with RTS/CTS     |
| **IEEE 802.11 DCF** | CSMA/CA + RTS/CTS + ACK, widely deployed |

### Advantages and Limitations

* **Advantages** — simple, fully distributed, no synchronisation needed, adapts to any number of nodes.
* **Limitations** — throughput falls sharply under heavy load, delay is unbounded, and fairness is not guaranteed.

> Contention-based protocols trade guaranteed performance for simplicity and flexibility — the right trade for networks whose membership cannot be known in advance.

### Example

In IEEE 802.11 DCF, two laptops sensing an idle channel each pick a random backoff — say 3 and 7 slots. The first transmits after 3 slots; the second freezes its counter, resumes when the channel clears, and transmits after its remaining 4 slots, avoiding the collision entirely.
$md$, 5, false),

  (sid, 1, 'Explain MAC Protocols Using Directional Antennas and their advantages.', $md$
Conventional ad hoc nodes use **omnidirectional antennas**, which radiate equally in all directions. Every transmission therefore silences *all* neighbours, even those whose communication would not actually have interfered. **Directional antennas** concentrate energy into a narrow beam aimed at the intended receiver, and MAC protocols built around them exploit this to raise capacity substantially.

### Working Principle

The antenna operates in two modes:

* **Omnidirectional mode** — used to listen for incoming control frames when idle.
* **Directional mode** — used to transmit and receive along a chosen beam.

```text
Omnidirectional:            Directional:

     neighbours                    neighbour
   \     |     /                       ^
    \    |    /                        |
      (  A  )   all silenced        (  A  ) ---> only this
    /    |    \                          direction silenced
   /     |     \
```

A node must first learn **where** its neighbour is. This is done through **directional RTS/CTS**: control frames are sent on specific beams, and the angle of arrival of a received frame records the neighbour's direction for later use.

### Advantages

* **Higher spatial reuse** — several transmissions can proceed simultaneously in different directions without interfering.
* **Longer transmission range** — energy focused into a beam travels further at the same power, often reducing the number of hops.
* **Reduced interference** — nodes outside the beam are unaffected.
* **Lower energy per bit** — the same range is achieved with less transmit power.
* **Improved throughput** — a direct consequence of better spatial reuse.

| Aspect            | Omnidirectional | Directional          |
| ----------------- | --------------- | -------------------- |
| Coverage          | All directions  | Narrow beam          |
| Spatial reuse     | Poor            | High                 |
| Range (same power)| Shorter         | Longer               |
| Complexity        | Low             | High                 |

### New Problems Introduced

* **Deafness** — a node beamed elsewhere does not hear an RTS aimed at it, and the sender wrongly assumes congestion.
* **New hidden terminal cases** — caused by nodes unaware of beams they never heard.
* **Neighbour location tracking** — direction information goes stale as nodes move.
* **Cost and complexity** — steerable antenna arrays are larger and more expensive.

> Directional antennas convert a shared medium into many partially independent ones, but only if the MAC layer knows where every neighbour is.

### Example

In a mesh of four nodes arranged in a square, omnidirectional transmission allows only one exchange at a time. With directional beams, the north pair and the south pair can communicate simultaneously, roughly doubling network throughput.
$md$, 6, false),

  (sid, 1, 'Explain Multiple-Channel MAC Protocols and their working principle.', $md$
A **multiple-channel MAC protocol** divides the available spectrum into several non-overlapping channels and lets different node pairs communicate on different channels **at the same time**. Where a single-channel protocol forces the whole neighbourhood to take turns, a multi-channel protocol allows genuine parallel transmission, raising aggregate throughput.

### Working Principle

Two problems must be solved: **how nodes agree on a channel**, and **how they find each other** when they may be listening elsewhere.

```text
Channel 1 (control): A and B negotiate
        |
        v
Channel 3 (data):    A <---> B transmit

meanwhile

Channel 4 (data):    C <---> D transmit
```

### Common Approaches

**1. Dedicated Control Channel**
One channel carries only control frames; all nodes monitor it when idle. A sender and receiver negotiate a free data channel there, switch to it, transmit, and return.
*Drawback:* the control channel becomes a bottleneck as load grows.

**2. Common Hopping**
All nodes follow the same pseudo-random hopping sequence. A pair wishing to communicate stops hopping, exchanges data on the current channel, then rejoins the sequence.
*Requires:* tight time synchronisation.

**3. Split Phase**
Time is divided into a **control phase** (all nodes on a common channel, negotiating) and a **data phase** (pairs move to their agreed channels).

**4. Multiple Rendezvous**
Different pairs negotiate on different channels simultaneously, removing the single control-channel bottleneck at the cost of greater complexity.

| Approach            | Strength                  | Weakness                     |
| ------------------- | ------------------------- | ---------------------------- |
| Dedicated control   | Simple, no sync needed    | Control channel saturates    |
| Common hopping      | No dedicated channel lost | Needs synchronisation        |
| Split phase         | Balanced use of spectrum  | Fixed phases waste time      |
| Multiple rendezvous | Highest throughput        | Most complex                 |

### Key Challenges

* **Channel assignment** — choosing a channel free at *both* ends.
* **The multi-channel hidden terminal problem** — a node busy on another channel misses a reservation made on the control channel.
* **Synchronisation** — needed by hopping and split-phase schemes.
* **Hardware cost** — a single radio must switch channels (adding delay); multiple radios cost more.

> Multiple channels multiply capacity, but only if nodes can reliably meet on the same channel at the same time — the rendezvous problem is the heart of every such design.

### Example

With three data channels available, nodes A–B, C–D and E–F can transmit simultaneously on channels 1, 2 and 3 instead of queuing for a single channel, giving roughly three times the aggregate throughput.
$md$, 7, false),

  (sid, 1, 'Explain Power-Aware MAC Protocols and how they improve energy efficiency in Ad Hoc Networks.', $md$
Nodes in an ad hoc network are usually battery-powered, and the radio is by far the largest consumer of energy. A **power-aware MAC protocol** is designed so that the radio spends as little time as possible in energy-hungry states, extending both node lifetime and the lifetime of the network as a whole.

### Where the Energy Goes

| Radio State  | Relative Energy | Notes                                  |
| ------------ | --------------- | -------------------------------------- |
| Transmit     | Highest         | Proportional to transmit power         |
| Receive      | High            | Nearly as costly as transmitting       |
| **Idle listening** | High      | Listening to nothing, yet still costly |
| Sleep        | Very low        | Radio off, cannot send or receive      |

The crucial insight is that **idle listening costs almost as much as receiving**. A node that stays awake waiting for traffic that never arrives wastes most of its battery, so the primary goal is to *turn the radio off*.

### Sources of Energy Waste

* **Idle listening** — awake with nothing to receive.
* **Collisions** — energy spent on frames that must be retransmitted.
* **Overhearing** — receiving frames addressed to other nodes.
* **Control overhead** — energy spent on RTS, CTS and ACK rather than data.
* **Overemitting** — transmitting when the receiver is not ready.

### Techniques Used

**1. Duty Cycling / Sleep Scheduling**
Nodes alternate between listen and sleep periods on a coordinated schedule.

```text
|--listen--|--------sleep--------|--listen--|--------sleep--------|
     ^                                ^
  exchange traffic              exchange traffic
```

**2. Power Control**
Transmit at the lowest power that reaches the receiver, rather than at maximum power — this also reduces interference and improves spatial reuse.

**3. Overhearing Avoidance**
A node that learns from an RTS/CTS that a transmission is not for it sleeps for the stated duration (using the NAV).

**4. Wake-up Radios**
A tiny, very low-power secondary radio listens for a wake-up signal and switches on the main radio only when needed.

### Representative Protocols

* **S-MAC** — fixed duty cycle with synchronised sleep schedules among neighbours.
* **T-MAC** — adaptive listen period that ends early when the channel is idle.
* **B-MAC** — low-power listening with preamble sampling.
* **PAMAS** — uses a separate signalling channel to power down nodes that would only overhear.

> The most effective energy saving in a wireless network is not transmitting more efficiently — it is not having the radio on at all.

### Example

In S-MAC with a 10% duty cycle, a node listens for 100 ms and sleeps for 900 ms in each cycle. Compared with always-on operation this cuts radio energy by roughly 90%, at the cost of extra latency while a packet waits for the next listen period.
$md$, 8, false);

  RAISE NOTICE 'Ad Hoc and Sensor Networks — Unit 1: 8 questions inserted.';
END $do$;
