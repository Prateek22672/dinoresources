-- =====================================================================
-- Study-With-AI seed — Wireless Sensor Networks (4th Year) — UNITS 1 & 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Wireless Sensor Networks' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Wireless Sensor Networks" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number IN (1,2) AND question IN (
    'Explain Wireless Sensor Networks and provide an overview of their characteristics.',
    'Explain the major Applications of Wireless Sensor Networks.',
    'Explain Localization in Wireless Sensor Networks and its importance.',
    'Explain the key issues involved in sensor node localization.',
    'Explain the major Localization Approaches used in WSNs.',
    'Explain Coarse-Grained Node Localization using minimal information.',
    'Explain Fine-Grained Node Localization using detailed information.',
    'Explain Network-Wide Localization.',
    'Explain Time Synchronization in Wireless Sensor Networks.',
    'Explain the key issues involved in time synchronization.',
    'Explain Traditional Approaches to time synchronization.',
    'Explain Fine-Grained Clock Synchronization.',
    'Explain Coarse-Grained Data Synchronization.',
    'Explain Global Synchronization.',
    'Explain Preamble Synchronization.',
    'Explain Medium Access Control (MAC) Protocols for Wireless Sensor Networks.',
    'Explain the background and need for MAC protocols in WSNs.',
    'Explain the fundamentals and major functions of MAC Protocols in WSNs.',
    'Explain Low-Power MAC Algorithms and their importance in Wireless Sensor Networks.',
    'Explain the IEEE 802.15.4 LR-WPANs Standard and its relevance to Wireless Sensor Networks.',
    'Explain Sensor MAC (S-MAC) and its working principle.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain Wireless Sensor Networks and provide an overview of their characteristics.', $md$
A **Wireless Sensor Network (WSN)** is a network of spatially distributed **autonomous sensor nodes** that monitor physical or environmental conditions — temperature, humidity, pressure, vibration, motion — and cooperatively pass their data to a central **sink** or **base station**.

### Architecture of a Sensor Node

```text
+------------------------------------------+
|  Sensing Unit   | sensor + ADC           |
|  Processing Unit| microcontroller + memory|
|  Transceiver    | radio (send/receive)    |
|  Power Unit     | battery (often non-replaceable) |
+------------------------------------------+
```

### Major Characteristics

* **Severe energy constraints** — batteries are usually not replaceable, so lifetime is the dominant design goal
* **Limited processing and memory** — often kilobytes of RAM
* **Dense deployment** — hundreds or thousands of nodes
* **Data-centric rather than address-centric** — queries ask "where is the temperature above 40°C?" rather than addressing a specific node
* **Application-specific** — the network is designed around one task
* **Self-organising** — no infrastructure or manual configuration
* **Multi-hop communication** — data is relayed toward the sink
* **Prone to failure** — nodes die as batteries deplete
* **Redundancy** — many nodes cover overlapping regions, so data is correlated

### WSN vs Ad Hoc Networks

| Aspect          | Ad Hoc Network     | Wireless Sensor Network |
| --------------- | ------------------ | ----------------------- |
| Node count      | Tens               | Hundreds to thousands   |
| Power           | Rechargeable       | Often non-replaceable   |
| Addressing      | Node-centric       | **Data-centric**        |
| Traffic pattern | Any-to-any         | **Many-to-one (to sink)** |
| Node failure    | Uncommon           | **Expected and routine**|
| Data            | Independent        | **Highly correlated**   |

> Because energy dominates every decision, WSN protocols will happily accept higher latency and lower throughput in exchange for keeping radios switched off.

### Example

A forest-fire monitoring network of 500 nodes reports temperature every 10 minutes. Nodes sleep 99% of the time, aggregate readings on the way to the sink to avoid transmitting 500 near-identical values, and continue functioning as individual nodes fail.
$md$, 1, true),

  (sid, 1, 'Explain the major Applications of Wireless Sensor Networks.', $md$
WSNs are deployed wherever physical conditions must be monitored over an area too large, too remote or too hazardous for wired instrumentation.

### Application Domains

**1. Environmental Monitoring**
Forest fire detection, flood warning, air and water quality, precision agriculture (soil moisture and nutrients), habitat and wildlife tracking.

**2. Military and Defence**
Battlefield surveillance, intrusion detection, enemy movement tracking, nuclear/biological/chemical attack detection, targeting support.

**3. Health Care**
Patient vital-sign monitoring, wearable body-area networks, drug administration tracking, elderly fall detection, remote diagnostics.

**4. Industrial and Structural**
Machine condition monitoring and predictive maintenance, structural health monitoring of bridges and buildings, pipeline leak detection, process control.

**5. Home and Building Automation**
Smart lighting and HVAC, security systems, energy metering, appliance automation.

**6. Smart Cities and Transportation**
Traffic flow monitoring, smart parking, waste-bin fill levels, street lighting, air quality.

**7. Disaster Management**
Earthquake and landslide early warning, tsunami detection, post-disaster survivor location.

### Matching Application to Requirement

| Application        | Dominant requirement       | Typical duty cycle |
| ------------------ | -------------------------- | ------------------ |
| Fire detection     | Fast response              | Moderate           |
| Habitat monitoring | **Very long lifetime**     | Very low           |
| Structural health  | High sampling accuracy     | Event-driven       |
| Battlefield        | Security and stealth       | Low                |
| Health monitoring  | **Reliability**            | Continuous         |

### Why the Application Determines the Design

There is no general-purpose WSN. A habitat-monitoring network sampling once an hour can sleep 99.9% of the time and last years. A patient monitor must respond within seconds and cannot sleep at all. The **same hardware** requires entirely different protocols.

> WSNs are the clearest case in networking where the application dictates the protocol stack rather than the reverse.

### Example

The Great Duck Island deployment monitored seabird burrows on an uninhabited island for months. Researchers collected data that would have been impossible to gather by direct observation, because human presence would have disturbed the very behaviour being studied.
$md$, 2, false),

  (sid, 1, 'Explain Localization in Wireless Sensor Networks and its importance.', $md$
**Localization** is the process by which sensor nodes determine their **physical positions**. Since nodes are frequently scattered randomly — dropped from aircraft or spread across terrain — they do not know where they are when deployed.

### Why Position Matters

A sensor reading without a location is largely meaningless.

```text
"Temperature is 85 degrees"        -> useless
"Temperature is 85 degrees at (x,y)" -> actionable
```

### Importance of Localization

**1. Data Meaningfulness** — a reading must be tied to a place
**2. Geographic Routing** — protocols such as GPSR forward packets toward a destination's coordinates, needing no routing tables
**3. Coverage Assessment** — determining whether the region is adequately monitored, and finding gaps
**4. Target Tracking** — following an intruder or vehicle requires knowing the observing nodes' positions
**5. Energy Efficiency** — location-aware protocols can select shorter routes and put redundant nodes to sleep
**6. Node Deployment Planning** — identifying where more nodes are needed
**7. Location-Based Queries** — "report readings within 100 m of the river"

### Why Not Simply Use GPS?

| GPS limitation      | Consequence for WSN                     |
| ------------------- | --------------------------------------- |
| **High cost**       | Prohibitive across thousands of nodes   |
| **High power draw** | Drains a small battery rapidly          |
| **Indoor failure**  | No signal inside buildings or tunnels   |
| **Physical size**   | Too large for miniature nodes           |
| **Obstruction**     | Fails under dense foliage, underground  |

GPS is therefore fitted to only a **few** nodes, called **anchors** or **beacons**, whose positions are known. All remaining nodes estimate their positions **relative to the anchors**.

```text
     A (anchor, knows position)
    / \
   /   \
  U --- U      unknown nodes estimate position
   \   /       from distances to anchors
     A
```

> The whole field exists because of a cost trade-off: fitting GPS to 5% of nodes and computing the other 95% is dramatically cheaper than fitting all of them.

### Example

In a fire-detection network, a node reporting a high temperature is useless unless firefighters know **which** node it is. Localization converts an alarm into a map coordinate.
$md$, 3, false),

  (sid, 1, 'Explain the key issues involved in sensor node localization.', $md$
Localization must be achieved cheaply, with minimal energy, on hardware with limited capability — and each of those constraints creates a distinct difficulty.

### Key Issues

**1. Cost Constraints**
Adding GPS or specialised ranging hardware to every node is economically impossible in large deployments.

**2. Energy Consumption**
Localization requires transmitting and receiving beacons and performing computation. Every joule spent on position is a joule not available for sensing.

**3. Accuracy Requirements**
Different applications need different precision, and precision costs energy:

| Application            | Accuracy needed |
| ---------------------- | --------------- |
| Environmental monitoring | 5 – 10 m      |
| Target tracking        | 1 – 2 m         |
| Indoor asset tracking  | < 1 m           |

**4. Measurement Errors**
* **RSSI** is highly unreliable — signal strength varies with obstacles, humidity and antenna orientation
* **Multipath propagation** — reflected signals distort distance estimates
* **Non-line-of-sight** conditions inflate measured distances

**5. Anchor Node Density and Placement**
Too few anchors leaves positions ambiguous; **collinear anchors** produce ambiguous solutions regardless of how many there are. Geometry matters as much as count.

**6. Error Propagation**
In iterative schemes, nodes that localize themselves become anchors for others, so early errors **accumulate** through the network.

**7. Computational Limits**
Nodes cannot run complex optimisation algorithms.

**8. Mobility**
If nodes move, positions must be recomputed continuously.

**9. Security**
A malicious node can broadcast **false position** information, corrupting everyone's estimates.

```text
Accuracy  <----->  Energy cost
Accuracy  <----->  Hardware cost
Coverage  <----->  Anchor count
```

> Every localization scheme is a chosen point on these trade-off curves — there is no design that is simultaneously cheap, accurate and energy-free.

### Example

A network relying on RSSI reports 8 m accuracy in open ground and 25 m indoors, because walls attenuate signals unpredictably. The algorithm did not change — only the environment did.
$md$, 4, false),

  (sid, 1, 'Explain the major Localization Approaches used in WSNs.', $md$
Localization approaches are classified along several dimensions, the most important being whether they **measure distances** or merely use **connectivity**.

### Range-Based vs Range-Free

**Range-based** — measures actual distance or angle, then computes position.

| Technique | Measures                          | Accuracy | Cost   |
| --------- | --------------------------------- | -------- | ------ |
| **RSSI**  | Received signal strength          | Low      | **Free** |
| **ToA**   | Time of arrival                   | High     | High (needs sync) |
| **TDoA**  | Time difference of arrival (RF vs ultrasound) | High | Medium |
| **AoA**   | Angle of arrival                  | High     | High (antenna array) |

**Range-free** — uses only connectivity information; no distance measurement.

* **Centroid** — a node's position is the average of the anchors it can hear
* **DV-Hop** — estimates distance from hop count multiplied by average hop distance
* **APIT** — tests whether the node lies inside triangles formed by anchor triples
* **Amorphous** — similar to DV-Hop with gradient refinement

### Computation Techniques

**Trilateration** — position from distances to three anchors:

```text
      A1
     /  \  d1
    /    \
  A2--d2--X       intersection of three circles
    \    /
     \  / d3
      A3
```

**Triangulation** — position from **angles** to anchors
**Multilateration** — uses more than three anchors, with least-squares fitting to reduce error

### Centralized vs Distributed

| Approach        | Computation      | Suits                    |
| --------------- | ---------------- | ------------------------ |
| **Centralized** | At the sink      | Small networks; more accurate |
| **Distributed** | At each node     | Large networks; scalable |

### Comparison of the Two Families

| Aspect        | Range-based    | Range-free    |
| ------------- | -------------- | ------------- |
| Hardware      | Extra required | **None**      |
| Accuracy      | **High**       | Lower         |
| Energy cost   | Higher         | **Lower**     |
| Suits         | Small, precise | Large, dense  |

> Range-free methods are popular in practice precisely because they need no additional hardware — accuracy is traded for deployability at scale.

### Example

A 1,000-node agricultural network uses DV-Hop with 50 GPS anchors, achieving roughly 10 m accuracy at zero additional hardware cost — entirely adequate for irrigation decisions, and far cheaper than fitting 1,000 GPS receivers.
$md$, 5, false),

  (sid, 1, 'Explain Coarse-Grained Node Localization using minimal information.', $md$
**Coarse-grained localization** estimates node positions using only **minimal information** — typically connectivity or proximity — without measuring distances or angles. Accuracy is modest, but the cost is essentially zero.

### The Principle

If a node can **hear** an anchor, it must lie within that anchor's radio range. Overlapping several such constraints narrows the possible region.

```text
Node hears anchors A1, A2, A3
  -> node lies within the INTERSECTION of their ranges

      (A1)-----
        \  ///XXX\\\
         \ XX node XX
          \\\ region ///
             -----(A2)
```

### Principal Techniques

**1. Centroid Method**
The simplest approach: a node estimates its position as the **average** of the positions of all anchors it can hear.

```text
(x, y) = ( (x1+x2+...+xn)/n , (y1+y2+...+yn)/n )
```

Accuracy improves with anchor density and depends heavily on anchors being **evenly distributed**.

**2. DV-Hop (Distance Vector Hop)**

```text
Step 1: anchors flood the network; each node records the
        minimum HOP COUNT to each anchor

Step 2: each anchor computes average distance per hop:
           avg_hop = (sum of true distances to other anchors)
                     / (sum of hop counts to them)

Step 3: unknown node estimates distance = hops x avg_hop

Step 4: trilateration using these estimated distances
```

**3. APIT (Approximate Point In Triangle)**
For each triple of audible anchors, the node tests whether it lies **inside** the triangle they form. Its position is the centre of the intersection of all triangles containing it.

**4. Amorphous Localization**
Similar to DV-Hop but refines estimates using neighbour information and local gradients.

### Advantages and Limitations

| Advantages                        | Limitations                       |
| --------------------------------- | --------------------------------- |
| **No extra hardware**             | Low accuracy (roughly one radio range) |
| Very low energy cost              | Needs **high node density**       |
| Simple computation                | Assumes circular radio range      |
| Scales to thousands of nodes      | Sensitive to anchor placement     |

The **circular range assumption** is the main practical weakness — real radio patterns are irregular, so the geometry the method relies on is only approximate.

> Coarse-grained localization is the pragmatic default for large deployments: 10 m accuracy that costs nothing usually beats 1 m accuracy that doubles the hardware bill.

### Example

In a 500-node field with 40 anchors, DV-Hop places nodes within roughly one-third of the radio range — around 10 m for a 30 m range. For deciding which irrigation valve to open, that is entirely sufficient.
$md$, 6, false),

  (sid, 1, 'Explain Fine-Grained Node Localization using detailed information.', $md$
**Fine-grained localization** achieves high accuracy by **measuring physical quantities** — signal timing, strength or angle — rather than relying on connectivity alone. It requires more capable hardware and more energy, and delivers accuracy of metres or better.

### Measurement Techniques

**1. Time of Arrival (ToA)**

```text
distance = signal propagation time x speed of signal
```

Requires **tight clock synchronisation** between sender and receiver. Radio travels at 3 × 10⁸ m/s, so a 1 metre error corresponds to about **3 nanoseconds** — an extremely demanding requirement.

**2. Time Difference of Arrival (TDoA)**

The elegant solution to the synchronisation problem: transmit two signals of **different speeds** simultaneously.

```text
Send RF and ULTRASOUND at the same instant

RF arrives almost instantly (300,000,000 m/s)
Ultrasound arrives later    (340 m/s)

distance = (t_ultrasound - t_rf) x speed_of_sound
```

Because both are measured by the **same receiver clock**, no synchronisation between nodes is needed at all. Cricket and AHLoS use this method, achieving centimetre accuracy.

**3. Angle of Arrival (AoA)**
An antenna array measures the **direction** a signal came from. Two anchors and two angles determine a position by triangulation — but antenna arrays are bulky and expensive.

**4. RSSI (Received Signal Strength Indicator)**

```text
P_received = P_transmitted / d^n      n = path loss exponent (2-4)
```

Free — every radio reports RSSI — but highly unreliable due to multipath, obstacles and antenna orientation.

### Comparison

| Technique | Accuracy   | Extra hardware       | Sync needed |
| --------- | ---------- | -------------------- | ----------- |
| ToA       | 1 – 3 m    | Precise clock        | **Yes**     |
| **TDoA**  | **1 – 10 cm** | Ultrasound transducer | **No**   |
| AoA       | 1 – 5 m    | Antenna array        | No          |
| RSSI      | 3 – 15 m   | **None**             | No          |

### Position Computation

Measurements feed into **trilateration**, **triangulation** or **maximum likelihood estimation**, with least-squares fitting used to reconcile inconsistent measurements.

> TDoA's trick — comparing two signals at one receiver rather than one signal at two receivers — sidesteps the hardest problem in the field.

### Example

The Cricket indoor system reaches centimetre accuracy using RF plus ultrasound, enough to determine which **room**, and even which part of a room, a device occupies — impossible with RSSI.
$md$, 7, false),

  (sid, 1, 'Explain Network-Wide Localization.', $md$
**Network-wide localization** determines the positions of **all** nodes in the network simultaneously, rather than each node solving for itself in isolation. It treats localization as a single global optimisation problem.

### The Motivation

Individual localization suffers from **error propagation**: a node localizes itself with some error, then acts as a reference for others, and errors accumulate outward from the anchors.

```text
Individual:   A -> N1 -> N2 -> N3
              error grows at every step

Network-wide: solve for ALL positions together,
              distributing error evenly
```

### Approaches

**1. Centralized Optimisation**
All measurements are sent to the sink, which solves a global optimisation and distributes results.

* **Advantage** — highest accuracy; global view
* **Disadvantage** — heavy communication cost, single point of failure, poor scalability

**2. Multidimensional Scaling (MDS)**
Given a matrix of pairwise distances, MDS finds coordinates that best reproduce them.

```text
Step 1: build a distance matrix (shortest-path distances
        used where direct measurement is unavailable)
Step 2: apply MDS to obtain a RELATIVE map
Step 3: use anchors to rotate, translate and scale it
        into ABSOLUTE coordinates
```

The relative map is correct in shape before any anchor is used — anchors only fix its orientation and position.

**3. Iterative / Incremental Localization**
Nodes adjacent to anchors localize first, then become anchors themselves. Simple and distributed, but this is precisely where **error propagation** arises.

**4. Distributed Optimisation**
Each node repeatedly refines its estimate using neighbours' estimates until the network converges. Scalable and robust, at the cost of many iterations.

### Comparison

| Approach     | Accuracy | Scalability | Communication |
| ------------ | -------- | ----------- | ------------- |
| Centralized  | **Highest** | Poor     | Very high     |
| MDS          | High     | Medium      | High          |
| Iterative    | Medium   | Good        | Low           |
| Distributed  | Good     | **Excellent** | Medium      |

### Refinement

A common practical pattern is **coarse then fine**: obtain rough positions cheaply, then run a refinement phase where nodes adjust positions to reduce inconsistency with measured distances.

> Solving globally rather than node-by-node converts accumulating error into evenly distributed error — usually a far better outcome even if no single node is perfectly placed.

### Example

MDS-MAP builds a relative map of a 200-node network from hop-count distances alone, then uses just **three** anchors to align it with real coordinates — three GPS units instead of forty.
$md$, 8, false),

  (sid, 1, 'Explain Time Synchronization in Wireless Sensor Networks.', $md$
**Time synchronization** aligns the local clocks of sensor nodes so that events observed at different nodes can be meaningfully compared and ordered.

### Why It Is Needed

Each node has its own crystal oscillator, and these **drift** relative to one another due to manufacturing tolerance, temperature and ageing. Typical drift is 1–100 **parts per million**:

```text
40 ppm drift = 40 microseconds per second
             = 3.5 seconds per day
```

Without correction, nodes rapidly disagree about when anything happened.

### The Clock Model

```text
C(t) = a * t + b

a = clock DRIFT (rate; ideally 1)
b = clock OFFSET (constant difference)
```

Synchronisation estimates **a** and **b** for each node relative to a reference.

### Why Synchronization Matters in WSNs

**1. Data Fusion** — readings from several nodes can only be combined if their timestamps are comparable
**2. TDMA Scheduling** — nodes must agree on slot boundaries or transmissions collide
**3. Duty Cycling** — nodes that sleep must wake at the **same time** as their neighbours, or messages are missed
**4. Event Ordering** — determining which of two events occurred first
**5. Localization** — ToA-based ranging requires nanosecond-level synchronisation
**6. Target Tracking** — computing speed and direction from sightings at different nodes

### Sources of Message Delay

Understanding delay is central, because synchronisation error comes almost entirely from **uncertainty** in these components:

| Delay component | Deterministic? | Notes                     |
| --------------- | -------------- | ------------------------- |
| Send time       | **Variable**   | OS scheduling — high uncertainty |
| Access time     | **Variable**   | Waiting for the channel — largest and least predictable |
| Transmission    | Deterministic  | Message length ÷ bit rate |
| Propagation     | Deterministic  | Distance ÷ speed of light |
| Reception       | Deterministic  | Message length ÷ bit rate |
| Receive time    | **Variable**   | Interrupt handling        |

**Access time is the dominant source of error**, which is why the best protocols timestamp messages in the **MAC layer**, after channel access has already been won.

> The single most effective technique in WSN synchronisation is moving the timestamp as close to the radio as possible — it removes the unpredictable delays rather than trying to estimate them.

### Example

Two nodes detect a vehicle 0.5 s apart in their own clocks. If their clocks differ by 2 s, the fusion algorithm may conclude the vehicle travelled backwards — synchronisation is what makes the measurement usable.
$md$, 9, false),

  (sid, 1, 'Explain the key issues involved in time synchronization.', $md$
Time synchronization in WSNs is constrained by energy, hardware and the unpredictability of wireless communication.

### Key Issues

**1. Energy Cost**
Every synchronisation exchange costs radio time. Frequent synchronisation gives accuracy but shortens network lifetime — a direct trade-off.

```text
high sync frequency -> better accuracy, shorter lifetime
low  sync frequency -> worse accuracy, longer lifetime
```

**2. Clock Drift**
Drift means accuracy **degrades continuously** after each synchronisation, so resynchronisation must be periodic. Temperature changes alter drift rates unpredictably.

**3. Non-Deterministic Message Delay**
Send, access and receive times vary unpredictably. **Channel access delay** is the worst offender, potentially milliseconds under contention.

**4. Scalability**
Synchronising thousands of nodes multi-hop means error **accumulates with hop count**:

```text
error at hop n  ~  sqrt(n) x per-hop error
```

**5. Limited Hardware**
Low-cost crystals, low-resolution timers and limited computation restrict achievable precision.

**6. Dynamic Topology**
Nodes fail, sleep and move, so synchronisation must adapt rather than assume a fixed structure.

**7. Fault Tolerance**
The failure of a reference node must not desynchronise the network.

**8. Security**
An attacker injecting false timestamps can disrupt TDMA schedules and data fusion.

**9. Precision vs Cost**

| Application         | Precision needed | Approach                |
| ------------------- | ---------------- | ----------------------- |
| Data logging        | Seconds          | Very infrequent sync    |
| TDMA scheduling     | Microseconds     | Regular sync            |
| ToA localization    | Nanoseconds      | Specialised hardware    |
| Acoustic tracking   | Microseconds     | MAC-layer timestamping  |

> Because accuracy decays with time and costs energy to restore, the real design question is not "how accurate?" but "how accurate, how often, and for how long can we afford it?"

### Example

A network synchronising every 10 s achieves ±1 ms accuracy but exhausts its batteries in 6 months. Synchronising every 10 minutes gives ±50 ms and lasts 3 years. The application decides which is correct.
$md$, 10, false),

  (sid, 1, 'Explain Traditional Approaches to time synchronization.', $md$
**Traditional approaches** are the synchronisation protocols developed for the internet and conventional distributed systems. Understanding why they fail in WSNs explains why specialised protocols exist.

### 1. Network Time Protocol (NTP)

The standard internet protocol, organised in a hierarchy of **strata** with atomic clocks or GPS at stratum 0.

```text
Client                    Server
  |----- T1 request ------->|  T2 received
  |                         |
  |<---- T4 reply ----------|  T3 sent

offset      = [(T2-T1) + (T3-T4)] / 2
round trip  = (T4-T1) - (T3-T2)
```

Accuracy: milliseconds over the internet, sub-millisecond on a LAN.

**Why it fails in WSNs**
* Assumes **symmetric** delay in both directions — invalid on a contention-based wireless channel
* Requires **continuous connectivity**, but WSN nodes sleep
* **Too much message exchange** for an energy-constrained node
* Designed for stable infrastructure, not a changing multi-hop topology

### 2. GPS-Based Synchronization

Every node fitted with GPS obtains time directly from satellites, accurate to about **100 ns**.

**Why it fails in WSNs**
* **Cost** — prohibitive at scale
* **Power** — a GPS receiver draws far more than a sensor node's budget
* **No indoor or underground coverage**
* **Size** — too large for miniature nodes

### 3. Berkeley Algorithm

A master **polls** all nodes, computes an average time (discarding outliers), and sends each node an **adjustment** rather than an absolute time. Tolerates the absence of an accurate reference, but requires heavy polling traffic.

### 4. Cristian's Algorithm

A client requests time from a server and compensates for half the round-trip delay. Simple, but assumes symmetric delay and depends on a single server.

### Summary of Suitability

| Protocol | Accuracy | Energy cost | Suitable for WSN? |
| -------- | -------- | ----------- | ----------------- |
| NTP      | ms       | High        | No                |
| GPS      | ns       | Very high   | Anchors only      |
| Berkeley | ms       | High        | No                |
| Cristian | ms       | Medium      | No                |

> Traditional protocols optimise for accuracy assuming abundant energy and connectivity. WSN protocols invert both assumptions — which is why RBS, TPSN and FTSP had to be invented.

### Example

Running NTP on a sensor node would consume more energy on synchronisation than on sensing — the protocol works correctly and defeats the purpose of the deployment.
$md$, 11, false),

  (sid, 1, 'Explain Fine-Grained Clock Synchronization.', $md$
**Fine-grained clock synchronization** achieves **microsecond-level** agreement between node clocks, which is required for TDMA scheduling, acoustic localization and precise event ordering.

### The Central Technique — MAC-Layer Timestamping

The dominant source of error is unpredictable **channel access delay**. Fine-grained protocols eliminate it by timestamping the message **after** the channel has been acquired, immediately before the bits leave the radio.

```text
Application timestamp  -> includes OS + access delay (milliseconds of error)
MAC-layer timestamp    -> excludes both  (microseconds of error)
```

### Principal Protocols

**1. RBS — Reference Broadcast Synchronization**

The key insight: synchronise **receivers with each other**, not with the sender.

```text
        broadcast
  [ Reference node ] ---> R1 records arrival time t1
                     ---> R2 records arrival time t2

offset between R1 and R2 = t1 - t2
```

Because both receivers hear the **same** broadcast, all sender-side delays — send time, access time — are **common to both** and cancel out exactly. Only receive-time variation remains.

* **Accuracy** — a few microseconds
* **Cost** — many messages between receivers

**2. TPSN — Timing-sync Protocol for Sensor Networks**

Builds a **hierarchical tree** rooted at the sink, then performs pairwise sender–receiver synchronisation down the tree.

```text
              root
             /    \
        level 1   level 1
         /   \
    level 2  level 2
```

Uses MAC-layer timestamping and a two-way exchange to measure both offset and propagation delay.

* **Accuracy** — roughly 2× better than RBS
* **Weakness** — the tree must be rebuilt when nodes fail

**3. FTSP — Flooding Time Synchronization Protocol**

A root is **elected** dynamically and floods timestamped messages. Nodes use **linear regression** over several timestamps to estimate both offset **and drift**, so accuracy holds between synchronisations.

* **Accuracy** — around 1 μs single-hop
* **Strength** — robust to root failure, since a new root is elected automatically

### Comparison

| Protocol | Accuracy   | Messages | Robustness  |
| -------- | ---------- | -------- | ----------- |
| RBS      | ~30 μs     | High     | Good        |
| TPSN     | ~17 μs     | Medium   | Tree-fragile|
| **FTSP** | **~1–2 μs**| Low      | **Best**    |

> RBS's contribution was conceptual: by comparing two receivers rather than sender and receiver, the largest error source is cancelled rather than estimated.

### Example

A TDMA schedule with 1 ms slots needs synchronisation well under 100 μs to avoid slot overlap. FTSP delivers this; NTP-style synchronisation would not.
$md$, 12, false),

  (sid, 1, 'Explain Coarse-Grained Data Synchronization.', $md$
**Coarse-grained data synchronization** accepts accuracy of **milliseconds to seconds**, which is entirely adequate for many WSN applications and costs far less energy than fine-grained methods.

### The Rationale

Not every application needs microsecond precision:

| Application            | Precision required |
| ---------------------- | ------------------ |
| Temperature logging    | Seconds            |
| Agricultural moisture  | Minutes            |
| Structural vibration   | **Microseconds**   |
| Acoustic localization  | **Microseconds**   |

Where seconds suffice, spending energy on microseconds is waste.

### Techniques

**1. Post-Facto Synchronization**
Nodes run **unsynchronised** most of the time. When an event of interest occurs, nodes synchronise **retrospectively** — comparing clocks only for that event.

```text
event occurs
    |
nodes exchange local timestamps AFTERWARDS
    |
relative ordering reconstructed at the sink
```

This is highly energy-efficient because no synchronisation happens during long idle periods.

**2. Time Stamp Synchronization (TSS)**
Timestamps are converted to **relative age** at each hop rather than to absolute time:

```text
"this reading is 4.2 seconds old"
```

Each forwarding node adds the time the message spent with it. No global clock is needed at all.

**3. Sink-Based Synchronization**
Nodes send readings with local timestamps; the **sink** translates them into a common time base using known clock offsets.

**4. Periodic Beacon Synchronization**
The sink broadcasts a beacon at long intervals; nodes reset their clocks on receipt. Simple, and accuracy is limited by drift between beacons.

### Advantages and Limitations

| Advantages                     | Limitations                     |
| ------------------------------ | ------------------------------- |
| **Very low energy cost**       | Accuracy only ms–s              |
| Simple to implement            | Unsuitable for TDMA             |
| Long battery life              | Cannot support ToA localization |
| Tolerant of node sleep         | Poor for fast event ordering    |

> The "relative age" idea is the neatest trick here: by never converting to absolute time until the sink, the network avoids needing a shared clock at all.

### Example

A soil-moisture network reports every 30 minutes. Timestamps accurate to ±2 seconds are far more precise than the application needs, and the resulting energy saving extends deployment from months to years.
$md$, 13, false),

  (sid, 1, 'Explain Global Synchronization.', $md$
**Global synchronization** establishes a **single common time base across the entire network**, so that every node — regardless of how many hops from the reference — shares one notion of time.

### The Goal

```text
For every pair of nodes i, j anywhere in the network:
        | C_i(t) - C_j(t) |  <  epsilon
```

This is stronger than **local** synchronisation, where only neighbours need to agree.

### Approaches

**1. Tree-Based (Hierarchical) Global Synchronization**

```text
              ROOT (reference)
             /              \
        level 1            level 1
        /     \                \
   level 2   level 2         level 2
```

Time propagates from root to leaves through pairwise synchronisation. **TPSN** uses this structure.

* **Advantage** — systematic, efficient
* **Weakness** — error accumulates with depth; tree must be repaired when nodes fail

**2. Flooding-Based Global Synchronization**
The root floods timestamped messages; every node synchronises to the root's time. **FTSP** uses this with dynamic root election, giving strong robustness.

**3. Cluster-Based Synchronization**
Nodes form clusters, synchronise within a cluster, and cluster heads synchronise with each other — a two-level scheme that limits error accumulation.

**4. Diffusion-Based (Fully Distributed)**
Each node repeatedly averages its clock with its neighbours'. The network **converges** to a common time with no root at all.

* **Advantage** — no single point of failure, fully scalable
* **Weakness** — slow convergence

### The Central Problem — Error Accumulation

```text
error over n hops  ~  sqrt(n) x per-hop error

per-hop error 1 us, 10 hops  ->  roughly 3 us
per-hop error 1 us, 100 hops ->  roughly 10 us
```

This is why network **diameter** matters so much to global synchronisation quality.

| Approach   | Accuracy | Scalability | Robustness |
| ---------- | -------- | ----------- | ---------- |
| Tree-based | High     | Medium      | Low        |
| Flooding   | High     | Good        | **High**   |
| Cluster    | Medium   | **High**    | Medium     |
| Diffusion  | Medium   | **High**    | **High**   |

> Global synchronisation is only necessary when data must be fused across the whole network; many applications need agreement only among neighbours, which is far cheaper.

### Example

A seismic network spanning 50 km must timestamp tremor arrivals consistently at every station to triangulate the epicentre. Local synchronisation would be useless — the calculation depends on comparing distant nodes.
$md$, 14, false),

  (sid, 1, 'Explain Preamble Synchronization.', $md$
**Preamble synchronization** operates at the **physical layer**: a known bit pattern — the **preamble** — precedes every frame so the receiver can lock onto the signal's timing before the real data arrives.

### Frame Structure

```text
+------------+------+--------------+-----+
|  PREAMBLE  | SFD  |   PAYLOAD    | CRC |
+------------+------+--------------+-----+
  bit sync    frame     the data     error
              sync                   check
```

* **Preamble** — typically alternating `10101010…`, letting the receiver recover the **bit clock**
* **SFD (Start of Frame Delimiter)** — a unique pattern marking exactly where data begins, giving **frame synchronisation**

### Functions

**1. Bit Synchronisation** — the receiver's sampling clock aligns with incoming bit boundaries
**2. Frame Synchronisation** — the SFD identifies the precise start of the payload
**3. Automatic Gain Control** — the receiver adjusts amplification to the signal level
**4. Channel Estimation** — the known pattern allows distortion to be measured and corrected

### Low Power Listening (LPL) — Preamble Sampling

In WSNs the preamble is exploited for **energy saving**, most notably in **B-MAC**:

```text
RECEIVER: wakes briefly every T seconds, samples the channel,
          sleeps again if nothing is heard

SENDER:   transmits a LONG PREAMBLE, longer than T,
          guaranteeing the receiver wakes during it

|<-------- long preamble -------->|--data--|
      ^        ^        ^
   receiver checks periodically; catches the preamble,
   stays awake for the data
```

This removes the need for synchronisation between sender and receiver entirely — the long preamble substitutes for a shared schedule.

**Cost:** the long preamble is expensive for the **sender** and forces all neighbours to overhear it. **X-MAC** improves this using a **strobed preamble** of short bursts with gaps, letting the intended receiver reply early and cut the preamble short.

| Scheme  | Preamble        | Sender cost | Receiver cost |
| ------- | --------------- | ----------- | ------------- |
| B-MAC   | One long burst  | High        | Very low      |
| X-MAC   | Strobed bursts  | Lower       | Very low      |

> Preamble sampling trades sender energy for receiver energy — a good bargain when a network has many idle listeners and few transmissions.

### Example

With a 100 ms check interval, B-MAC lets a receiver keep its radio on about 1% of the time. A sender must transmit a preamble slightly longer than 100 ms, but since most nodes mostly listen, total network energy falls dramatically.
$md$, 15, false),

  (sid, 2, 'Explain Medium Access Control (MAC) Protocols for Wireless Sensor Networks.', $md$
A **MAC protocol** for a WSN decides **which node may transmit and when**, on a shared wireless channel. What distinguishes WSN MAC design from all other wireless MAC design is that **energy efficiency outranks throughput and latency**.

### The Different Priority Ordering

```text
Traditional wireless MAC:  throughput > latency > fairness > energy
WSN MAC:                   ENERGY > latency > throughput > fairness
```

### Sources of Energy Waste

| Source              | Description                                |
| ------------------- | ------------------------------------------ |
| **Idle listening**  | Radio on, nothing to receive — **the largest waste** |
| **Collisions**      | Corrupted frames must be retransmitted     |
| **Overhearing**     | Receiving frames meant for other nodes     |
| **Control overhead**| RTS/CTS/ACK carry no application data      |
| **Overemitting**    | Transmitting when the receiver is not ready|

Idle listening dominates because a radio listening to nothing consumes nearly as much power as one receiving data.

### Classification of WSN MAC Protocols

**1. Contention-Based**
Nodes compete for the channel (CSMA-based).
* Examples: **S-MAC, T-MAC, B-MAC, X-MAC**
* Flexible, no synchronisation required, but collisions occur

**2. Schedule-Based**
Nodes transmit in assigned slots (TDMA-based).
* Examples: **TRAMA, LEACH**
* Collision-free and energy-efficient, but requires synchronisation and adapts poorly

**3. Hybrid**
Combines both — for example **Z-MAC**, which uses TDMA under high load and CSMA under low load.

| Type        | Collisions | Sync needed | Adapts to traffic |
| ----------- | ---------- | ----------- | ----------------- |
| Contention  | Possible   | No          | **Well**          |
| Schedule    | **None**   | **Yes**     | Poorly            |
| Hybrid      | Rare       | Partial     | Well              |

### Key Techniques

* **Duty cycling** — periodic sleep and wake
* **Low power listening** — brief channel sampling
* **Overhearing avoidance** — sleep when a frame is for someone else
* **Message aggregation** — combine several readings into one transmission

> The measure of a WSN MAC protocol is not how fast it moves data but how long the radio stays off.

### Example

A node with a 1% duty cycle listens for 10 ms every second. Compared with always-on operation this extends battery life from days to years — and no amount of throughput optimisation could achieve a comparable gain.
$md$, 16, true),

  (sid, 2, 'Explain the background and need for MAC protocols in WSNs.', $md$
MAC protocols exist because the wireless medium is **shared**: without coordination, simultaneous transmissions collide and destroy one another. In WSNs, a further constraint applies — that coordination must itself consume almost no energy.

### Why the Medium Needs Managing

Radio is a **broadcast** medium. When two nearby nodes transmit at once, the signals interfere and both frames are lost, wasting the energy of both senders and requiring retransmission.

### Why Wireless Is Harder Than Wired

In wired Ethernet a node can detect a collision **while transmitting** (CSMA/CD). A wireless node cannot: its own transmission overwhelms its receiver, so it is effectively deaf while sending. Collisions can only be **avoided** in advance, never detected in progress.

### The Hidden and Exposed Terminal Problems

```text
HIDDEN TERMINAL:
A ---- B ---- C

A and C cannot hear each other.
Both transmit to B -> collision at B that neither sender detects.

EXPOSED TERMINAL:
A ---- B      C ---- D

B transmits to A. C hears B and stays silent unnecessarily —
C's transmission to D would not have interfered.
```

Hidden terminals cause **lost throughput through collisions**; exposed terminals cause **lost throughput through excessive caution**.

### Why WSNs Need Their Own MAC Protocols

| WSN characteristic          | Implication for MAC design           |
| --------------------------- | ------------------------------------ |
| Non-replaceable batteries   | Energy is the primary metric         |
| Dense deployment            | High contention                      |
| Many-to-one traffic         | Congestion near the sink             |
| Correlated data             | Aggregation is possible              |
| Low data rates              | Radios can sleep most of the time    |
| Node failure expected       | Protocol must self-heal              |

### Why IEEE 802.11 Is Unsuitable

* Keeps the radio **always on** in its basic mode
* Heavy RTS/CTS overhead relative to tiny sensor payloads
* Optimised for throughput, not lifetime
* Assumes mains or rechargeable power

> A sensor network's traffic is so light that a general-purpose MAC spends nearly all its energy listening to an idle channel — which is the specific problem WSN MAC protocols were created to solve.

### Example

A node transmitting 10 bytes per minute using 802.11 would still keep its radio listening for the other 59.99 seconds. S-MAC lets it sleep for 90% of that time, cutting energy use by an order of magnitude for identical data delivery.
$md$, 17, false),

  (sid, 2, 'Explain the fundamentals and major functions of MAC Protocols in WSNs.', $md$
A WSN MAC protocol coordinates access to the shared radio channel while keeping radios switched off as much as possible.

### Fundamental Functions

**1. Channel Access Coordination**
Decide which node transmits and when, using contention (CSMA), scheduling (TDMA), or a hybrid.

**2. Collision Avoidance**
Carrier sensing, random backoff and RTS/CTS handshakes reduce simultaneous transmission. Since collisions waste energy at **both** ends, avoidance matters more than in mains-powered networks.

**3. Energy Management — the defining function**

```text
Duty cycling:   |--listen--|-------sleep-------|--listen--|
Overhearing avoidance:  sleep when a frame is for someone else
Low power listening:    sample the channel briefly
```

**4. Framing and Addressing**
Delimit frames and identify sender and receiver.

**5. Error Control**
CRC detection with acknowledgement and retransmission. **ARQ** is preferred over heavy forward error correction because computation also costs energy.

**6. Flow Control**
Prevent a fast sender from overwhelming a receiver with small buffers.

**7. Latency Management**
Sleeping introduces delay; the protocol must bound it for event-driven applications.

**8. Fairness and Throughput**
Ensure no node is starved — though in WSNs fairness is the lowest priority.

### Performance Metrics

| Metric              | Priority in WSN |
| ------------------- | --------------- |
| **Energy efficiency** | **Highest**   |
| Latency             | Medium          |
| Throughput          | Lower           |
| Fairness            | Lowest          |
| Scalability         | High            |
| Adaptability        | High            |

### The Central Trade-off

```text
long sleep periods  -> more energy saved, HIGHER latency
short sleep periods -> lower latency, MORE energy consumed
```

Every WSN MAC protocol is essentially a chosen point on this curve, and adaptive protocols such as T-MAC try to move along it dynamically according to traffic.

> Fairness — a core goal in most MAC design — is nearly irrelevant here: all nodes serve one application, so starving a node matters only if its data matters.

### Example

S-MAC with a fixed 10% duty cycle gives predictable energy use but delays messages up to a full sleep period. T-MAC ends the listen period early when the channel is idle, saving more energy at light load while keeping latency low when traffic appears.
$md$, 18, false),

  (sid, 2, 'Explain Low-Power MAC Algorithms and their importance in Wireless Sensor Networks.', $md$
**Low-power MAC algorithms** are designed with the explicit goal of minimising radio energy consumption, since the radio dominates a sensor node's power budget.

### Energy Cost by Radio State

| State           | Relative power | Note                                 |
| --------------- | -------------- | ------------------------------------ |
| Transmit        | ~1.0           | Highest                              |
| Receive         | ~0.9           | Nearly as costly                     |
| **Idle listen** | ~0.8           | **Costly and produces nothing**      |
| Sleep           | ~0.001         | Effectively free                     |

The decisive fact: **idle listening costs almost as much as receiving**. Therefore the goal is not efficient transmission but **maximising sleep time**.

### Principal Techniques

**1. Duty Cycling**

```text
|--listen--|---------sleep---------|--listen--|

duty cycle = listen / (listen + sleep)
1% duty cycle -> roughly 99% energy saving
```

**2. Low Power Listening (LPL) / Preamble Sampling**
Receivers sample the channel briefly; senders use a **long preamble** so the receiver is guaranteed to detect it. Used by **B-MAC**.

**3. Strobed Preamble**
**X-MAC** replaces the long preamble with short bursts separated by gaps, letting the target receiver acknowledge early and truncate the preamble — saving energy for both sender and neighbours.

**4. Scheduled Sleep**
Neighbours agree on synchronised sleep/wake schedules, as in **S-MAC**.

**5. Adaptive Listening**
**T-MAC** ends the active period early if no activity occurs, adapting to actual traffic.

**6. TDMA Scheduling**
Nodes sleep except during their assigned slot; collision-free and highly efficient, but requires synchronisation.

### Comparison of Major Protocols

| Protocol | Technique             | Sync needed | Strength                  |
| -------- | --------------------- | ----------- | ------------------------- |
| **S-MAC**| Fixed duty cycle      | Yes         | Simple, predictable       |
| **T-MAC**| Adaptive duty cycle   | Yes         | Better under variable load|
| **B-MAC**| Preamble sampling     | **No**      | Very low receiver cost    |
| **X-MAC**| Strobed preamble      | No          | Lower sender cost         |
| **TRAMA**| TDMA scheduling       | Yes         | Collision-free            |

### Importance

* **Extends network lifetime** from days to years
* Enables deployment where batteries **cannot be replaced**
* Reduces total cost of ownership
* Makes long-term unattended monitoring feasible at all

> A 1% duty cycle turns a three-day deployment into a nearly one-year deployment using identical hardware — no other optimisation in WSN design comes close to this leverage.

### Example

A node with a 2200 mAh battery drawing 20 mA continuously lasts about 4.5 days. At a 1% duty cycle it draws roughly 0.2 mA average and lasts well over a year.
$md$, 19, false),

  (sid, 2, 'Explain the IEEE 802.15.4 LR-WPANs Standard and its relevance to Wireless Sensor Networks.', $md$
**IEEE 802.15.4** is the standard for **Low-Rate Wireless Personal Area Networks (LR-WPANs)**, defining the **physical** and **MAC** layers for low-cost, low-power, low-data-rate wireless devices. It is the foundation on which **ZigBee**, **6LoWPAN**, **Thread** and most commercial WSN hardware are built.

### Physical Layer

| Band       | Region     | Channels | Data rate |
| ---------- | ---------- | -------- | --------- |
| 868 MHz    | Europe     | 1        | 20 kbps   |
| 915 MHz    | Americas   | 10       | 40 kbps   |
| **2.4 GHz**| **Worldwide** | **16** | **250 kbps** |

Uses **DSSS** (Direct Sequence Spread Spectrum) for interference resistance. The low data rate is deliberate — it keeps power consumption and cost down.

### Device Types

* **FFD (Full Function Device)** — can act as coordinator, router or end device; implements the full protocol
* **RFD (Reduced Function Device)** — a simple end device that talks only to a coordinator; minimal memory and power

Most sensor nodes are RFDs, which is what keeps them cheap.

### Network Topologies

```text
STAR                    PEER-TO-PEER (mesh)
     RFD                   FFD --- FFD
      |                     |  \  /  |
RFD--PAN--RFD              FFD --- FFD
   coordinator
```

**Cluster-tree** is a hybrid: a tree of coordinators, each with star-connected leaves.

### Superframe Structure (Beacon-Enabled Mode)

```text
| Beacon |  CAP  |  CFP  |  INACTIVE (sleep)  | Beacon |
         contention  guaranteed
         access      time slots
         (CSMA/CA)   (GTS)
```

* **CAP** — nodes contend using slotted CSMA/CA
* **CFP** — up to 7 **Guaranteed Time Slots** for latency-sensitive traffic
* **Inactive period** — all devices sleep, which is where the energy saving comes from

In **non-beacon mode**, unslotted CSMA/CA is used with no superframe.

### Relevance to WSNs

* **Low power** — designed for multi-year battery operation
* **Low cost** — simple radios, small memory footprint
* **Standardised** — interoperability between vendors
* **Both topologies** — star for simplicity, mesh for range
* **GTS** — provides bounded latency where needed
* Basis of **ZigBee** and **6LoWPAN**, which add networking and IPv6 respectively

> 802.15.4 deliberately specifies only PHY and MAC, leaving routing to higher layers — which is exactly why so many different stacks could be built on top of it.

### Example

A ZigBee home automation network uses 802.15.4 at 2.4 GHz. Battery sensors are RFDs sleeping in the inactive period; mains-powered switches are FFDs forming a mesh that relays traffic — one standard serving both roles.
$md$, 20, false),

  (sid, 2, 'Explain Sensor MAC (S-MAC) and its working principle.', $md$
**S-MAC (Sensor-MAC)** was the first MAC protocol designed specifically for wireless sensor networks. It reduces energy consumption primarily by introducing **coordinated periodic sleep**.

### The Four Mechanisms

**1. Periodic Listen and Sleep**

```text
|<---------------- frame ---------------->|
| LISTEN |            SLEEP               |
|  ~10%  |             ~90%               |

Radio is OFF during sleep -> the main energy saving
```

**2. Schedule Synchronisation with Virtual Clusters**

Neighbouring nodes adopt a **common schedule** so they are awake at the same time, exchanging **SYNC** packets to maintain it.

```text
A node listens first:
  - hears a schedule  -> ADOPTS it (becomes a follower)
  - hears nothing     -> CHOOSES its own and broadcasts it

Nodes on borders adopt BOTH schedules,
forming virtual clusters that stay connected.
```

Border nodes consume more energy but preserve network connectivity — a deliberate trade.

**3. Collision and Overhearing Avoidance**

The listen period is divided:

```text
| SYNC | RTS | CTS |   DATA   | ACK |
```

Uses **RTS/CTS** with the **NAV (Network Allocation Vector)**. A node hearing an RTS or CTS not addressed to it learns how long the exchange will last and **sleeps** for that duration — avoiding overhearing entirely.

**4. Message Passing (Fragmentation)**

A long message is split into fragments transmitted in a **burst** after a single RTS/CTS exchange, with one ACK per fragment. This amortises the handshake cost across many fragments — important because sensor messages are small and handshakes are proportionally expensive.

### Advantages and Disadvantages

| Advantages                       | Disadvantages                       |
| -------------------------------- | ----------------------------------- |
| Large energy saving vs always-on | **Increased latency** from sleeping  |
| No global synchronisation needed | Fixed duty cycle ignores real traffic|
| Simple and robust                | Border nodes consume extra energy    |
| Handles overhearing well         | Poor under bursty or heavy load      |

### The Central Weakness and Its Successors

S-MAC's **fixed** duty cycle is set at deployment and cannot adapt. Under light traffic it wastes energy listening; under heavy traffic it delays messages.

* **T-MAC** ends the active period early when the channel is idle — adaptive duty cycling
* **B-MAC** removes scheduling altogether using preamble sampling

> S-MAC's lasting contribution is the idea of **coordinated** sleep: nodes save energy without losing the ability to hear each other, because they sleep *together*.

### Example

With a 10% duty cycle, S-MAC reduces energy consumption by roughly 90% compared with always-on listening. The cost is up to one full frame period of delay per hop — meaning a 5-hop path could add several seconds, acceptable for monitoring but not for alarms.
$md$, 21, false);

  RAISE NOTICE 'Wireless Sensor Networks — Units 1 & 2: 21 questions inserted.';
END $do$;
