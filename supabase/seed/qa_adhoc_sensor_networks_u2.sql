-- =====================================================================
-- Study-With-AI seed — Adhoc and Sensor Networks (4th Year) — UNIT 2
-- Idempotent: deletes each question before re-inserting.
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Ad%hoc and Sensor Networks' AND active LIMIT 1;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'Subject "Adhoc and Sensor Networks" not found — check the exact name in Admin.';
  END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain Routing in Ad Hoc Networks and its importance.',
    'Explain the major Design Issues in routing for Ad Hoc Networks.',
    'Explain Proactive Routing Protocols and their working principle.',
    'Discuss the advantages and limitations of Proactive Routing Protocols.',
    'Explain Reactive Routing Protocols and their working principle.',
    'Discuss the advantages and limitations of Reactive Routing Protocols.',
    'Explain Hybrid Routing Protocols and their working principle.',
    'Compare Proactive, Reactive, and Hybrid Routing Protocols.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain Routing in Ad Hoc Networks and its importance.', $md$
**Routing** is the process of discovering and maintaining a path along which packets travel from a source node to a destination node. In an ad hoc network there are no dedicated routers, so **every node participates in routing** — each one is simultaneously a host generating traffic and a router forwarding other nodes' traffic.

### Why Routing Is Needed

A node's radio has a limited range. Any destination outside that range must be reached through **multi-hop forwarding**, and choosing which neighbours to forward through *is* the routing problem.

```text
      B ------- C
     /           \
    A             D
     \           /
      E ------- F

A -> D can go A-B-C-D  (3 hops)
        or   A-E-F-D  (3 hops)
Routing decides which, and repairs it when a link breaks
```

### Importance of Routing

* **Enables end-to-end communication** beyond a single radio hop.
* **Adapts to mobility** — routes must be repaired as nodes move and links break.
* **Determines performance** — a poor route means higher delay, more loss and wasted energy.
* **Balances load** — spreading traffic prevents a few nodes from becoming bottlenecks.
* **Conserves energy** — routing through nodes with more battery extends network lifetime.
* **Provides reliability** — alternative paths let the network survive node failure.

### What Makes It Different from Wired Routing

| Aspect          | Wired Network        | Ad Hoc Network              |
| --------------- | -------------------- | --------------------------- |
| Routers         | Dedicated devices    | Every node                  |
| Topology        | Stable               | Changes continuously        |
| Link quality    | Reliable             | Variable, error-prone       |
| Bandwidth       | Plentiful            | Scarce and shared           |
| Route lifetime  | Long                 | Often seconds               |

> In a wired network routing is computed once and rarely revisited; in an ad hoc network it is a continuous repair process, and its cost must be paid out of the same scarce bandwidth the data needs.

### Example

In a fleet of drones surveying an area, a drone at the far edge cannot reach the ground station directly. Routing lets its video stream hop through intermediate drones, and re-routes automatically when one drone moves away or its battery fails.
$md$, 1, true),

  (sid, 2, 'Explain the major Design Issues in routing for Ad Hoc Networks.', $md$
Designing a routing protocol for an ad hoc network means solving problems that fixed networks avoid by having stable topology and dedicated routers. These issues drive every design decision.

### Major Design Issues

**1. Mobility**
Nodes move, so links break without notice. The protocol must detect breakage and rebuild the path quickly, or packets in flight are lost.

**2. Bandwidth Constraint**
Control messages (route requests, replies, updates) consume the same scarce channel as data. A protocol that floods aggressively can consume the capacity it was meant to enable.

**3. Error-Prone Shared Channel**
Wireless links suffer fading, interference and collisions, so a "working" route can still deliver poorly. Link quality — not just existence — should influence route choice.

**4. Hidden and Exposed Terminal Problems**
These MAC-level effects cause losses that the routing layer may misread as a broken link, triggering unnecessary route repair.

**5. Energy Constraint**
Always routing through the most convenient node drains it first and partitions the network. **Energy-aware routing** spreads the burden.

**6. Scalability**
Overhead must not explode as the network grows — the reason flat protocols give way to hierarchical or hybrid designs in large networks.

**7. Route Maintenance and Loop Freedom**
Stale routing information can create **routing loops**, wasting bandwidth. Sequence numbers or similar mechanisms are needed to keep information fresh.

**8. Security**
Any node can claim to be a router, enabling **black-hole**, **wormhole** and **route-poisoning** attacks.

**9. Quality of Service**
Real-time traffic needs bounded delay, which is hard to promise on a changing topology.

### The Central Trade-off

```text
keep routes ready in advance  <----->  find routes only when needed
 (low delay, high overhead)          (low overhead, higher delay)
        PROACTIVE                          REACTIVE
```

| Issue        | Design Response                       |
| ------------ | ------------------------------------- |
| Mobility     | Fast route repair, local recovery     |
| Bandwidth    | Minimise control traffic              |
| Energy       | Energy-aware metrics, load spreading  |
| Scalability  | Hierarchy, zones, clustering          |
| Loops        | Sequence numbers, destination stamps  |

> Every ad hoc routing protocol is essentially a different answer to one question: how much bandwidth is it worth spending in advance to have a route ready when you need it?

### Example

A protocol that broadcasts topology updates every second keeps routes fresh but may consume most of the channel in a 200-node network — so large deployments prefer on-demand discovery or a hierarchical scheme.
$md$, 2, false),

  (sid, 2, 'Explain Proactive Routing Protocols and their working principle.', $md$
**Proactive routing protocols**, also called **table-driven** protocols, maintain routes to **every** destination in the network **at all times**, whether or not any traffic is currently being sent. Each node keeps one or more routing tables and refreshes them by exchanging topology information periodically.

### Working Principle

```text
periodically:
   node broadcasts its routing information to neighbours
              |
   neighbours merge it into their own tables
              |
   updated information propagates through the network
              |
   every node ends up with a route to every destination

when data arrives -> route is ALREADY in the table -> forward immediately
```

Updates are sent in two situations:

* **Periodic updates** — at fixed intervals, keeping information fresh.
* **Triggered updates** — immediately when a significant change (a broken link) is detected.

### Representative Protocols

**DSDV (Destination-Sequenced Distance Vector)**
Based on the classic distance-vector algorithm, with a **sequence number** attached to every route by its destination. A higher sequence number always wins, which guarantees **loop freedom** — the main weakness of plain distance-vector routing.

**OLSR (Optimized Link State Routing)**
A link-state protocol whose key idea is the **Multi-Point Relay (MPR)**. Instead of every node re-broadcasting every update, each node selects a small subset of neighbours as MPRs, and only those forward control traffic — greatly reducing flooding overhead.

**WRP (Wireless Routing Protocol)**
Maintains several tables, including a predecessor table, to speed convergence and avoid the count-to-infinity problem.

### Characteristics

* Routes are **always available**, so there is **no route-discovery delay**.
* Control traffic is **continuous** and largely **independent of data traffic**.
* Every node stores information about the **entire network**.

| Property            | Behaviour                  |
| ------------------- | -------------------------- |
| Route availability  | Immediate                  |
| Control overhead    | Constant, even when idle   |
| Memory required     | High (full topology)       |
| Best suited to      | Small, dense, low-mobility |

> Proactive protocols pay a constant bandwidth tax so that no packet ever has to wait for a route to be found.

### Example

In an OLSR network of 20 static sensor nodes, a node that suddenly needs to send an alarm packet transmits immediately, because a route to the gateway is already in its table — there is no discovery delay before the first packet moves.
$md$, 3, false),

  (sid, 2, 'Discuss the advantages and limitations of Proactive Routing Protocols.', $md$
Proactive (table-driven) protocols keep routes to all destinations ready in advance. That single design choice produces both their strengths and their weaknesses.

### Advantages

**1. No Route Discovery Delay**
A route is already in the table, so the first packet is forwarded immediately. This suits **real-time traffic** such as voice, where the delay of on-demand discovery would be audible.

**2. Predictable, Low Latency**
End-to-end delay is stable because it never includes a discovery phase.

**3. Complete Topology Knowledge**
Nodes hold a full view of the network, which helps with load balancing, QoS decisions and network management.

**4. Simple Forwarding**
Forwarding is a straightforward table lookup, with no buffering of packets while a route is sought.

**5. Fast Local Repair**
Because neighbour information is continuously refreshed, alternative routes are often already known when a link fails.

### Limitations

**1. Constant Control Overhead**
Updates are exchanged whether or not anyone is sending data. In a mostly idle network, nearly all traffic is control traffic.

**2. Poor Scalability**
Overhead grows quickly with node count, so large networks can spend most of their capacity maintaining routes.

**3. Wasted Effort**
Routes are maintained to **every** destination, though a typical node communicates with only a few.

**4. Struggles Under High Mobility**
If the topology changes faster than updates propagate, tables never converge and may hold **stale routes** — packets are then forwarded onto links that no longer exist.

**5. High Memory Use**
Every node stores an entry for every destination, which is costly on small sensor nodes.

**6. Energy Drain**
Periodic transmission and reception of updates prevents radios from sleeping.

| Aspect          | Advantage             | Limitation                    |
| --------------- | --------------------- | ----------------------------- |
| Delay           | Very low              | —                             |
| Overhead        | —                     | Constant, even when idle      |
| Scalability     | —                     | Degrades with network size    |
| Mobility        | Fast local repair     | Tables may never converge     |
| Energy          | —                     | Radios cannot sleep           |

> Proactive routing is efficient when the network is small, stable and busy — and wasteful when it is large, mobile or mostly idle.

### Example

In a 15-node office mesh with constant traffic, OLSR performs excellently. Scaled to 300 highly mobile vehicles, the same protocol may spend the majority of its bandwidth on updates that are stale before they arrive.
$md$, 4, false),

  (sid, 2, 'Explain Reactive Routing Protocols and their working principle.', $md$
**Reactive routing protocols**, also called **on-demand** protocols, do not maintain routes in advance. A route is discovered **only when a node actually has data to send**, and is kept only while it is in use. This eliminates the constant control overhead of proactive schemes.

### Working Principle

Reactive routing has two phases: **route discovery** and **route maintenance**.

```text
ROUTE DISCOVERY
source has data, no route
        |
broadcast RREQ (Route Request) --> flooded through network
        |
destination (or a node with a fresh route) receives RREQ
        |
unicast RREP (Route Reply) back along the reverse path
        |
source receives route, starts sending data

ROUTE MAINTENANCE
link breaks -> RERR (Route Error) sent to source -> rediscover
```

### Representative Protocols

**AODV (Ad hoc On-Demand Distance Vector)**
Nodes store only **next-hop** information rather than complete paths, keeping routing tables small. **Destination sequence numbers** guarantee loop freedom and ensure only the freshest route is used. Unused entries expire on a timer.

**DSR (Dynamic Source Routing)**
Uses **source routing**: the complete hop list is carried in each packet's header, so intermediate nodes need no routing table at all. Nodes cache multiple routes, giving quick alternatives when one breaks — at the cost of a header that grows with path length.

**TORA (Temporally Ordered Routing Algorithm)**
Provides multiple routes and localises reaction to link failures, so a break is repaired near where it happened instead of triggering network-wide rediscovery.

### Characteristics

* Control traffic is **proportional to actual communication**, not to network size.
* The **first packet is delayed** by route discovery.
* Route discovery uses **flooding**, which is expensive if it happens often.

| Property           | Behaviour                       |
| ------------------ | ------------------------------- |
| Route availability | Only after discovery            |
| Control overhead   | Low when idle, bursty when busy |
| Memory required    | Low — active routes only        |
| Best suited to     | Large, mobile, bursty-traffic   |

> Reactive protocols spend nothing while idle and pay the full cost at the moment a route is first needed.

### Example

In an AODV network, a node needing to reach a gateway broadcasts an RREQ; the reply arrives after perhaps 50 ms and data then flows normally. Nodes that never send anything generate no routing traffic at all — the opposite of proactive behaviour.
$md$, 5, false),

  (sid, 2, 'Discuss the advantages and limitations of Reactive Routing Protocols.', $md$
Reactive (on-demand) protocols find routes only when they are needed. That decision makes them efficient in idle or large networks, but introduces delay and bursty overhead.

### Advantages

**1. Low Control Overhead When Idle**
No periodic updates are exchanged. A network with little traffic generates almost no routing traffic, which conserves both bandwidth and battery.

**2. Better Scalability**
Overhead depends on the number of **active communications**, not on the number of nodes, so large networks with sparse traffic are handled well.

**3. Low Memory Requirement**
Only routes currently in use are stored, which suits memory-limited sensor nodes.

**4. Naturally Fresh Routes**
A route is discovered at the moment of use, so it reflects the topology as it is now rather than as it was at the last update.

**5. Energy Efficient While Idle**
With no periodic broadcasts, radios can sleep for longer.

### Limitations

**1. Route Discovery Delay**
The first packet must wait for the RREQ/RREP exchange. This **initial latency** is problematic for real-time traffic.

**2. Flooding Overhead**
Route discovery broadcasts an RREQ across the network. Frequent discoveries — common under high mobility — cause a **broadcast storm** that can congest the channel.

**3. Bursty, Unpredictable Overhead**
Control traffic arrives in spikes at exactly the moments the network is busiest.

**4. Packet Buffering**
Packets must be held while discovery completes, needing buffer space and risking loss if discovery is slow.

**5. Repeated Discovery Under Mobility**
A route that breaks often is rediscovered often, and the cost can exceed a proactive protocol's steady overhead.

**6. No Global View**
Nodes know only their active routes, which limits load balancing and QoS decisions.

| Aspect         | Advantage                 | Limitation                     |
| -------------- | ------------------------- | ------------------------------ |
| Idle network   | Almost no overhead        | —                              |
| First packet   | —                         | Discovery delay                |
| Scalability    | Scales with traffic       | Flooding cost per discovery    |
| Memory         | Small tables              | No global topology view        |
| Real-time use  | —                         | Unpredictable initial latency  |

> Reactive routing wins when communication is rare relative to network size, and loses when routes break so often that discovery never stops.

### Example

In a 200-node sensor field where each node reports once an hour, AODV is far more efficient than a proactive protocol. In a dense network of fast-moving vehicles with constant traffic, the repeated RREQ floods may swamp the channel.
$md$, 6, false),

  (sid, 2, 'Explain Hybrid Routing Protocols and their working principle.', $md$
A **hybrid routing protocol** combines proactive and reactive behaviour in one design, applying each where it performs best: **proactive routing nearby**, where routes are used often and overhead is contained, and **reactive routing far away**, where maintaining routes in advance would be wasteful.

### Working Principle

The network is divided by **distance in hops** rather than by geography. Each node defines a **zone** — the set of nodes within *k* hops of itself, where *k* is the **zone radius**.

```text
        zone radius k = 2

            o   o           <- outside zone: REACTIVE
          o  \ /  o
        o --- N --- o       <- inside zone: PROACTIVE
          o  / \  o            (routes always ready)
            o   o

destination inside zone  -> route already known, send now
destination outside zone -> discover on demand via border nodes
```

### ZRP — The Zone Routing Protocol

ZRP is the standard example and has three components:

* **IARP (IntrAzone Routing Protocol)** — proactive; keeps routes to every node inside the zone always ready.
* **IERP (IntErzone Routing Protocol)** — reactive; discovers routes to destinations outside the zone on demand.
* **BRP (Bordercast Resolution Protocol)** — sends route requests only to **border nodes** (nodes exactly *k* hops away) instead of flooding every node. This **bordercasting** is what makes hybrid discovery far cheaper than plain flooding.

### Why This Helps

Most traffic in real networks is local, so the proactive zone handles the majority of communication with zero delay. The occasional distant destination is found on demand, without the cost of maintaining routes to the whole network.

| Zone radius | Behaves more like | Overhead pattern            |
| ----------- | ----------------- | --------------------------- |
| k = 1       | Reactive          | Low idle, high discovery    |
| k moderate  | Balanced          | Best of both                |
| k very large| Proactive         | High idle, no discovery     |

Other hybrid designs use **clustering**: nodes elect cluster heads, route proactively within a cluster and reactively between clusters — the same principle expressed through hierarchy rather than zone radius.

> A hybrid protocol accepts that neither pure approach is right everywhere, and lets one parameter — the zone radius — tune the network between them.

### Example

With a zone radius of 2, a node reaching a neighbour three hops away uses its ready-made intrazone route for the first two hops and bordercasts only for the remainder — avoiding a network-wide flood for a nearby destination.
$md$, 7, false),

  (sid, 2, 'Compare Proactive, Reactive, and Hybrid Routing Protocols.', $md$
The three families differ in **when** they compute routes, and that single difference explains every other contrast between them.

### Core Difference

```text
PROACTIVE : compute routes ALWAYS, in advance
REACTIVE  : compute routes ONLY when data must be sent
HYBRID    : proactive nearby, reactive far away
```

### Detailed Comparison

| Criterion             | Proactive            | Reactive              | Hybrid                    |
| --------------------- | -------------------- | --------------------- | ------------------------- |
| Route availability    | Always ready         | On demand             | Ready nearby, on demand far|
| Route discovery delay | None                 | Yes, for first packet | Only for distant nodes    |
| Control overhead      | Constant, even idle  | Bursty, traffic-driven| Moderate, balanced        |
| Bandwidth use         | High when idle       | High during discovery | Balanced                  |
| Memory required       | High (full topology) | Low (active routes)   | Medium (zone topology)    |
| Scalability           | Poor                 | Good                  | Very good                 |
| Mobility tolerance    | Poor at high speed   | Good                  | Good                      |
| Energy use when idle  | High                 | Very low              | Moderate                  |
| Example protocols     | DSDV, OLSR, WRP      | AODV, DSR, TORA       | ZRP, CBRP                 |

### When to Use Each

* **Proactive** — small networks, low mobility, continuous traffic, and delay-sensitive applications such as voice.
* **Reactive** — large networks, high mobility, and sparse or bursty traffic where most nodes are idle most of the time.
* **Hybrid** — large networks where traffic is mostly local but occasionally distant; also the most tunable of the three.

### Overhead Behaviour

```text
overhead
   ^
   |  proactive ------------------  (flat, always paid)
   |
   |  hybrid    ______/‾‾‾‾‾‾‾‾‾‾   (low, rises with distance)
   |
   |  reactive  ____/\____/\____    (spikes at each discovery)
   +---------------------------> time
```

> There is no universally best family. Proactive trades bandwidth for latency, reactive trades latency for bandwidth, and hybrid buys a middle position with added complexity.

### Example

For a 10-node conference room mesh, OLSR (proactive) is ideal. For 500 sensors reporting hourly, AODV (reactive) wins. For a 200-node campus mesh where most traffic stays within a building, ZRP (hybrid) outperforms both.
$md$, 8, false);

  RAISE NOTICE 'Adhoc and Sensor Networks — Unit 2: 8 questions inserted.';
END $do$;
