-- =====================================================================
-- Study-With-AI seed — Advanced Computer Networks (4th Year) — UNIT 2
-- Idempotent: deletes each question before re-inserting.
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Advanced Computer Networks' AND active LIMIT 1;
  IF sid IS NULL THEN
    RAISE EXCEPTION 'Subject "Advanced Computer Networks" not found — check the exact name in Admin.';
  END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain Switching and Bridging in internetworks.',
    'Explain Datagram Switching with its characteristics.',
    'Explain Virtual Circuit Switching and its working.',
    'Explain Source Routing.',
    'Explain Bridges and LAN Switches.',
    'Explain the concept of an Internetwork.',
    'Explain the IP Service Model.',
    'Explain Global Addresses in IP internetworks.',
    'Explain Datagram Forwarding in IP.',
    'Explain Subnetting and its purpose.',
    'Explain Classless Addressing.',
    'Explain Address Translation using ARP.',
    'Explain DHCP and its role in IP networks.',
    'Explain ICMP and its functions.',
    'Explain Virtual Networks and their purpose.',
    'Explain Tunneling and its role in internetworking.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain Switching and Bridging in internetworks.', $md$
A **switch** is a device with multiple network links that forwards data arriving on one link out on another, letting many nodes communicate without a direct link between every pair. Switching is the mechanism that makes **scalable connectivity** possible.

### Why Switching Is Needed

Connecting *n* nodes directly needs *n(n−1)/2* links. With a switch, each node needs only **one** link.

```text
      A       B
       \     /
       [SWITCH]
       /     \
      C       D

A->D : arrives on port A, forwarded out port D
```

### How a Switch Decides

Every switch performs three steps:

1. **Receive** the packet on an incoming port
2. **Look up** the destination in a forwarding table
3. **Forward** it out the correct outgoing port

The differences between switching methods lie entirely in **how the table is built and consulted**.

### The Three Switching Approaches

| Approach              | Table built by          | Address carried        |
| --------------------- | ----------------------- | ---------------------- |
| **Datagram**          | Routing protocols       | Full destination address |
| **Virtual circuit**   | Connection setup phase  | Short circuit identifier |
| **Source routing**    | Not needed              | The whole path         |

### Bridging

A **bridge** connects two or more LAN segments at the **data link layer (Layer 2)**, forwarding frames based on **MAC addresses**. A **LAN switch** is simply a bridge with many ports.

Bridges **learn** rather than being configured: when a frame arrives, the bridge records which port its *source* address came from, gradually building its table.

> Switching separates the number of links from the number of nodes — that single idea is what allows a network to grow beyond a handful of machines.

### Example

In an office, a 24-port switch lets 24 computers communicate using 24 cables. A full mesh would require 276 cables and 23 network cards in every machine.
$md$, 1, true),

  (sid, 2, 'Explain Datagram Switching with its characteristics.', $md$
In **datagram switching** — also called **connectionless** switching — every packet is treated **independently**. Each packet carries the **full destination address**, and each switch decides its next hop by consulting a forwarding table at the moment the packet arrives. There is no setup phase and no per-connection state.

### Working Principle

```text
each packet carries: [ destination address | data ]

switch receives packet
        |
look up destination in forwarding table
        |
forward out the chosen port

packets of the SAME conversation may take DIFFERENT routes
```

Because each packet is routed afresh, two packets between the same pair of hosts can follow different paths and **arrive out of order**.

### Characteristics

* **No connection setup** — a host can send immediately, with no round-trip delay before the first packet.
* **Stateless switches** — switches hold no per-connection information, so they are simpler and cheaper.
* **Independent routing** — every packet is routed separately.
* **Robust to failure** — if a switch or link fails, subsequent packets simply route around it; existing conversations survive.
* **Possible reordering, loss and duplication** — the network makes no promises.
* **Best-effort delivery** — no guarantee of bandwidth or delay.

| Property           | Datagram Switching        |
| ------------------ | ------------------------- |
| Setup phase        | None                      |
| State in switches  | Per-destination only      |
| Route per packet   | Decided independently     |
| Failure recovery   | Automatic, fast           |
| Ordering guarantee | None                      |
| Header overhead    | Larger (full address)     |

### Why the Internet Chose It

IP is a datagram network. The absence of per-connection state is precisely what allows the internet to scale to billions of hosts, and its robustness in the face of failure was an original design goal.

> Datagram switching buys robustness and scalability by refusing to promise anything — the endpoints, not the network, repair what goes wrong.

### Example

Two packets of the same download may travel via different cities if a link becomes congested between them. TCP at the receiver reorders them, so the application never notices.
$md$, 2, false),

  (sid, 2, 'Explain Virtual Circuit Switching and its working.', $md$
**Virtual circuit (VC) switching** is a **connection-oriented** approach: a path is established **before** any data is sent, and all packets of that conversation follow it. It combines the predictability of circuit switching with the efficiency of packet switching.

### The Two Phases

**1. Connection Setup**
A setup message travels from source to destination. At each switch along the way an entry is created in the **VC table**, mapping an incoming port and identifier to an outgoing port and identifier.

**2. Data Transfer**
Each data packet carries only a short **Virtual Circuit Identifier (VCI)** instead of a full address. Switches swap the VCI at each hop and forward.

```text
SETUP:
host A --setup--> S1 --setup--> S2 --setup--> host B
        (each switch adds a VC table entry)

DATA:
packet [ VCI=5 | data ] -> S1 -> [ VCI=11 | data ] -> S2 -> host B
```

### The VC Table

| Incoming port | Incoming VCI | Outgoing port | Outgoing VCI |
| ------------- | ------------ | ------------- | ------------ |
| 2             | 5            | 1             | 11           |

Identifiers are only **locally unique**, which is why they can be short — an important saving on every packet.

### Characteristics

* **Setup delay** — one round trip before the first byte moves.
* **Per-connection state** in every switch along the path.
* **Ordered delivery** — all packets follow one path, so they arrive in order.
* **Small headers** — a VCI is far shorter than a full address.
* **Resource reservation possible** — capacity can be reserved at setup, enabling **QoS guarantees**.
* **Fragile to failure** — if a switch on the path fails, the circuit is lost and must be re-established.

| Aspect        | Virtual Circuit | Datagram        |
| ------------- | --------------- | --------------- |
| Setup         | Required        | None            |
| Header        | Short VCI       | Full address    |
| Ordering      | Guaranteed      | Not guaranteed  |
| QoS           | Supportable     | Difficult       |
| Failure       | Circuit breaks  | Reroutes        |

> Virtual circuits trade robustness for predictability — which is why they suit telephony and QoS-sensitive traffic, and why the internet did not adopt them.

### Example

**MPLS**, **ATM** and **Frame Relay** are virtual-circuit technologies. MPLS is widely used inside carrier networks precisely because reserved, predictable paths make traffic engineering possible.
$md$, 3, false),

  (sid, 2, 'Explain Source Routing.', $md$
In **source routing**, the **sender** determines the complete path the packet will take and places that path inside the packet itself. Switches do not decide anything — they simply read the next hop from the header and forward.

### Working Principle

The header carries an ordered list of hops plus a pointer to the current position.

```text
packet leaves A:   [ ptr | B, C, D | data ]
at switch B:       [ ptr-> | C, D | data ]
at switch C:       [ ptr-> | D | data ]
arrives at D
```

Three implementations are common:

* **Rotation** — the used hop moves to the end of the list
* **Stripping** — the used hop is removed from the header
* **Pointer** — the list is unchanged and a pointer advances (most common)

### Characteristics

* **No forwarding tables** are needed in switches — the intelligence is entirely in the sender.
* **The sender must know the topology**, which is the method's central difficulty.
* **Variable-length header**, growing with path length.
* **Complete path control**, which is valuable for diagnostics and for protocols that want to pin a route.

| Aspect            | Source Routing        |
| ----------------- | --------------------- |
| Switch complexity | Very low              |
| Sender knowledge  | Full topology needed  |
| Header size       | Grows with hop count  |
| Route control     | Total                 |
| Scalability       | Poor in large networks|

### Where It Is Used

* **DSR (Dynamic Source Routing)** in ad hoc networks, where nodes discover and cache full paths
* **IP loose/strict source routing options** — largely **disabled today** because attackers used them to bypass firewalls and spoof return paths
* **Diagnostics**, where forcing a path is useful for isolating a fault

> Source routing is elegant when the sender genuinely knows the topology, and both unscalable and a security liability when it does not.

### Example

In DSR, node A discovers the path A–B–C–D and writes it into every packet. Switches B and C need no routing tables at all — they simply read the next hop and forward.
$md$, 4, false),

  (sid, 2, 'Explain Bridges and LAN Switches.', $md$
A **bridge** is a device that connects two or more LAN segments at the **data link layer (Layer 2)** and forwards frames between them based on **MAC addresses**. A **LAN switch** is a bridge with many ports — the terms are used interchangeably in modern equipment.

### Learning Bridges

A bridge is not configured with a table; it **learns** one by observing traffic:

```text
frame arrives on port 3 with source MAC = X
        |
bridge records: X is reachable via port 3
        |
future frames destined for X -> forwarded only out port 3
```

If the destination is unknown, the bridge **floods** the frame out every port except the one it arrived on. Entries **age out** after a timeout so the table follows machines when they move.

### Benefits

* **Collision domain separation** — each port is its own collision domain, so traffic on one segment does not collide with another.
* **Traffic filtering** — frames stay local when both endpoints are on the same segment, greatly reducing load.
* **Transparency** — hosts need no configuration and are unaware the bridge exists.
* **Increased total bandwidth** — several pairs can communicate simultaneously on different ports.

### The Loop Problem and Spanning Tree

Redundant bridges create **loops**, and because Ethernet frames have **no TTL**, a looping frame circulates forever — a **broadcast storm** that can collapse the network.

The **Spanning Tree Protocol (STP)** solves this: bridges elect a **root bridge**, compute shortest paths to it, and **block** the ports that would create loops, leaving a loop-free tree. Blocked ports are reactivated automatically if an active link fails.

| Feature          | Bridge / LAN Switch        | Router                    |
| ---------------- | -------------------------- | ------------------------- |
| Layer            | 2 (data link)              | 3 (network)               |
| Address used     | MAC                        | IP                        |
| Table built by   | Learning from traffic      | Routing protocols         |
| Broadcast domain | One (shared)               | Separated                 |
| Loop handling    | Spanning Tree              | TTL in the header         |

> Bridges scale a LAN but not an internetwork: they leave one broadcast domain, so broadcast traffic eventually limits growth — which is where routers take over.

### Example

An office switch learns that PC-A is on port 1 and PC-B on port 2. Traffic between them is forwarded only on those ports, leaving the other 22 ports free for simultaneous conversations.
$md$, 5, false),

  (sid, 2, 'Explain the concept of an Internetwork.', $md$
An **internetwork** is a network built by connecting **multiple, possibly dissimilar networks** so that they behave as one logical network. The global **Internet** is the largest example, but the concept applies to any organisation joining Ethernet, Wi-Fi and WAN links into a single reachable whole.

### The Problem It Solves

Individual network technologies differ in addressing, frame format, maximum packet size and reliability. A host on Ethernet cannot speak directly to a host on a satellite link. An internetwork hides these differences behind a **common protocol** — in practice, **IP**.

```text
[ Ethernet LAN ] --- R1 --- [ Wi-Fi ] --- R2 --- [ WAN ]
        H1                                        H2

H1 and H2 communicate as if on one network.
R1, R2 are ROUTERS joining dissimilar networks.
```

### Key Elements

* **Routers (gateways)** — devices joining networks, forwarding at Layer 3.
* **A common addressing scheme** — IP addresses, independent of any hardware addressing.
* **A common packet format** — the IP datagram.
* **A common service model** — best-effort delivery.

### What IP Must Reconcile

| Difference between networks | How IP handles it                      |
| --------------------------- | -------------------------------------- |
| Different addressing        | Its own global IP address space        |
| Different frame formats     | IP datagram encapsulated in each       |
| Different maximum sizes     | **Fragmentation** to fit the MTU       |
| Different reliability       | Offers only best-effort to everyone    |

### The Value of the Abstraction

Because IP asks so little of the underlying network — only that it can carry a packet from one router to the next — almost any technology can join. This is why the internet absorbed Wi-Fi, mobile data and fibre without redesign.

> An internetwork is a deliberate act of abstraction: it defines the smallest common capability every member network can provide, and builds everything else on top.

### Example

An email from a phone on 5G to a server on fibre crosses several distinct networks. Each forwards the same IP datagram inside its own frame format, and neither endpoint knows or cares what technologies lay between.
$md$, 6, false),

  (sid, 2, 'Explain the IP Service Model.', $md$
The **IP service model** is the contract IP offers to the layers above it. It is deliberately minimal, and understanding exactly what IP does *not* promise is the key to understanding the internet's design.

### The Service Offered

IP provides a **connectionless, best-effort, unreliable datagram delivery** service.

* **Connectionless** — no setup; each datagram is independent.
* **Best-effort** — IP tries to deliver, but gives up rather than working hard.
* **Unreliable** — no acknowledgement and no retransmission.

### What IP Explicitly Does NOT Guarantee

| Failure          | IP's behaviour                       |
| ---------------- | ------------------------------------ |
| Packet loss      | Packet is simply dropped             |
| Reordering       | Packets may arrive out of order      |
| Duplication      | Packets may arrive more than once    |
| Delay            | Unbounded, varies constantly         |
| Corruption       | Header checked; **payload is not**   |

Note the last point: IP's checksum covers only the **header**, protecting routing decisions. Payload integrity is left to the transport layer.

### The IP Datagram

```text
+----------------------------------+
| Version | IHL | TOS | Total Len  |
| Identification | Flags | Frag Off|
| TTL | Protocol | Header Checksum |
| Source IP Address                |
| Destination IP Address           |
| Options (if any)                 |
+----------------------------------+
| Payload (TCP / UDP segment)      |
+----------------------------------+
```

Key fields: **TTL** prevents infinite loops by decrementing at each router; **Protocol** identifies the transport protocol above; **Fragmentation fields** allow a datagram to be split to fit a smaller MTU.

### Why Deliberately Weak

This follows the **end-to-end argument**: functions such as reliability are best implemented at the endpoints, because only the endpoints know what the application actually needs. Building reliability into the network would penalise applications that do not want it — voice would rather lose a packet than wait for it.

> IP guarantees almost nothing, and that is its greatest strength: a network that promises little is cheap, fast and able to run over anything.

### Example

During congestion a router drops packets without notifying anyone. TCP infers the loss from missing acknowledgements and retransmits; a VoIP application using UDP ignores it and plays a tiny gap instead. Both behaviours are correct — and only the endpoints could have chosen them.
$md$, 7, false),

  (sid, 2, 'Explain Global Addresses in IP internetworks.', $md$
For an internetwork to work, every interface must have an address that is **globally unique** and **independent of the underlying hardware**. IP addresses provide this, and their internal **structure** is what makes routing at internet scale possible.

### Structure of an IPv4 Address

An IPv4 address is **32 bits**, written as four dotted decimal octets, and is divided into two parts:

```text
   192.168.10.25
   |---------|--|
   network    host
```

* **Network part** — identifies which network the host is on
* **Host part** — identifies the specific interface on that network

This hierarchy is essential: routers need only store a route to each **network**, not to each of the billions of individual hosts.

### Classful Addressing (Historical)

| Class | Leading bits | Network/Host split | Networks | Hosts per network |
| ----- | ------------ | ------------------ | -------- | ----------------- |
| A     | 0            | 8 / 24             | 126      | ~16 million       |
| B     | 10           | 16 / 16            | ~16,000  | ~65,000           |
| C     | 110          | 24 / 8             | ~2 million | 254             |

Classful addressing wasted addresses badly: an organisation with 300 hosts needed a Class B, receiving 65,000 addresses and wasting most of them. This drove the move to **classless addressing (CIDR)**.

### Key Properties

* **Globally unique** — no two interfaces on the public internet share an address.
* **Assigned to interfaces, not hosts** — a router has several addresses, one per interface.
* **Hierarchical** — enables route aggregation.
* **Independent of hardware** — an IP address survives a change of network card, unlike a MAC address.

### Special Addresses

* **Network address** — host part all zeros (`192.168.10.0`)
* **Broadcast address** — host part all ones (`192.168.10.255`)
* **Loopback** — `127.0.0.1`
* **Private ranges** — `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, not routed on the public internet

> A MAC address says *who* a device is; an IP address says *where* it is. Routing needs location, which is why IP addresses are hierarchical and MAC addresses are not.

### Example

A router receiving a packet for `192.168.10.25` needs only an entry for the network `192.168.10.0/24` — one line covering 254 hosts. Without hierarchy it would need 254 separate entries.
$md$, 8, false),

  (sid, 2, 'Explain Datagram Forwarding in IP.', $md$
**Forwarding** is the per-packet action a router takes: examine a datagram's destination address and send it out the appropriate interface. It is distinct from **routing**, which is the background process of building the tables that forwarding consults.

### The Forwarding Algorithm

```text
datagram arrives
        |
extract destination IP address
        |
is destination on a DIRECTLY CONNECTED network?
        |                      |
       yes                     no
        |                      |
deliver directly        look up in forwarding table
(ARP for MAC)                  |
                        forward to NEXT-HOP router
                               |
                        decrement TTL; TTL = 0 -> discard,
                        send ICMP Time Exceeded
```

### Longest Prefix Match

A destination may match several table entries. The router always chooses the entry with the **longest (most specific) prefix**.

| Destination `192.168.10.25` | Table entry     | Match length |
| --------------------------- | --------------- | ------------ |
| matches                     | `0.0.0.0/0`     | 0 (default)  |
| matches                     | `192.168.0.0/16`| 16           |
| matches                     | **`192.168.10.0/24`** | **24 — chosen** |

The `0.0.0.0/0` entry is the **default route**, used when nothing more specific matches — which is how a home router sends everything unknown to its ISP.

### Hop-by-Hop Forwarding

No router knows the complete path. Each knows only the **next hop**, and the path emerges from many independent decisions. This is why the internet survives failures so well: when a link dies, routers recompute locally and later packets simply take the new path.

### Other Actions During Forwarding

* **TTL decrement** — prevents packets circulating forever in a routing loop
* **Header checksum recomputation** — since TTL changed
* **Fragmentation** — if the datagram exceeds the outgoing link's MTU
* **ARP** — to find the MAC address of the next hop on the local link

> Forwarding is deliberately simple and stateless, because it must happen millions of times per second. All the intelligence lives in routing, which runs in the background.

### Example

A packet for `8.8.8.8` leaving a home PC matches only the default route, so it goes to the home router; that router also uses its default route to the ISP; the ISP's core routers have progressively more specific entries. No single device knew the whole path.
$md$, 9, false),

  (sid, 2, 'Explain Subnetting and its purpose.', $md$
**Subnetting** divides a single IP network into several smaller logical networks called **subnets**, by borrowing bits from the **host** part of the address to create a **subnet** part.

### The Problem It Solves

Classful addressing forced a choice between wastefully large networks and impractically small ones. An organisation given a Class B address (65,534 hosts) could not put them all on one physical LAN — broadcast traffic alone would overwhelm it. Subnetting lets one assigned network be split internally.

### How It Works

```text
Original:   | network | host          |
Subnetted:  | network | subnet | host |
                       ^^^^^^
              bits borrowed from host part
```

The **subnet mask** marks which bits are network-plus-subnet:

```text
IP address :  192.168.10.25    = 11000000.10101000.00001010.00011001
Subnet mask:  255.255.255.0    = 11111111.11111111.11111111.00000000
                                  --------network-------- --host--

Network address = IP AND mask = 192.168.10.0
```

### Worked Example

Splitting `192.168.10.0/24` into four subnets requires **2 borrowed bits** (2² = 4), giving `/26`:

| Subnet | Network address    | Usable host range              | Broadcast        |
| ------ | ------------------ | ------------------------------ | ---------------- |
| 1      | 192.168.10.0/26    | .1 – .62                       | 192.168.10.63    |
| 2      | 192.168.10.64/26   | .65 – .126                     | 192.168.10.127   |
| 3      | 192.168.10.128/26  | .129 – .190                    | 192.168.10.191   |
| 4      | 192.168.10.192/26  | .193 – .254                    | 192.168.10.255   |

Each subnet loses two addresses — the network address and the broadcast address — so a `/26` yields 62 usable hosts, not 64.

### Purposes of Subnetting

* **Reduce broadcast traffic** — each subnet is its own broadcast domain
* **Improve security** — traffic between subnets passes a router where it can be filtered
* **Simplify management** — subnets can mirror departments or floors
* **Conserve addresses** — allocate only what each segment needs
* **Improve performance** — less contention within each segment

> Subnetting is invisible outside the organisation: the internet still sees one network, while internally it may be dozens.

### Example

A company with `192.168.10.0/24` gives Sales `/26`, Engineering `/26` and Guest Wi-Fi `/26`. A broadcast from a guest laptop never reaches Engineering, and the router between them can enforce access rules.
$md$, 10, false),

  (sid, 2, 'Explain Classless Addressing.', $md$
**Classless addressing**, formally **CIDR (Classless Inter-Domain Routing)**, abandons the fixed A/B/C class boundaries and allows the network/host split to fall at **any bit position**. It was introduced to solve two crises of the early 1990s: **address exhaustion** and **routing table explosion**.

### CIDR Notation

An address is written with a **prefix length** — the number of network bits:

```text
192.168.10.0/24     ->  24 network bits, 8 host bits, 254 usable hosts
203.0.113.0/28      ->  28 network bits, 4 host bits, 14 usable hosts
10.0.0.0/8          ->  8 network bits,  24 host bits, ~16 million hosts
```

### Efficient Allocation

Classful addressing forced enormous waste. CIDR allows a block sized to actual need:

| Hosts needed | Classful allocation      | CIDR allocation | Waste removed |
| ------------ | ------------------------ | --------------- | ------------- |
| 300          | Class B (65,534)         | `/23` (510)     | ~65,000       |
| 10           | Class C (254)            | `/28` (14)      | ~240          |
| 1,000        | Class B (65,534)         | `/22` (1,022)   | ~64,500       |

### Route Aggregation (Supernetting)

CIDR's second benefit is combining several contiguous networks into **one** routing table entry:

```text
192.168.0.0/24
192.168.1.0/24     ---- aggregate ---->  192.168.0.0/22
192.168.2.0/24                           (one entry, not four)
192.168.3.0/24
```

An ISP can advertise a single prefix covering thousands of customers, which is what keeps the global routing table manageable rather than growing without bound.

### Longest Prefix Match

With variable prefixes, a destination may match several entries. Routers always select the **longest** match, so a specific route always overrides a general one.

> CIDR did not create new addresses — it stopped wasting the ones that existed, and stopped the routing table from growing faster than the internet.

### Example

An ISP holding `203.0.113.0/24` gives one customer `/28` (14 hosts) and another `/29` (6 hosts), sized to need. To the rest of the internet it advertises only the single `/24`, so no external router learns about either customer.
$md$, 11, false),

  (sid, 2, 'Explain Address Translation using ARP.', $md$
**ARP (Address Resolution Protocol)** maps a **logical IP address** to the **physical MAC address** of a device on the same local network. It is required because IP addresses are used for end-to-end routing, but actual frame delivery on a LAN uses MAC addresses.

### Why It Is Needed

```text
Host knows:      destination IP  192.168.1.20
Host must build: Ethernet frame with destination MAC ??

ARP fills that gap.
```

### How ARP Works

```text
1. A checks its ARP cache for 192.168.1.20
       |
   found? -> use the cached MAC, done
       |
   not found
       |
2. A BROADCASTS an ARP Request:
      "Who has 192.168.1.20? Tell 192.168.1.10"
      (sent to MAC FF:FF:FF:FF:FF:FF — every host sees it)
       |
3. Every host examines it; only 192.168.1.20 replies
       |
4. B UNICASTS an ARP Reply:
      "192.168.1.20 is at 00:1A:2B:3C:4D:5E"
       |
5. A caches the mapping and sends the frame
```

The request is **broadcast** because the sender does not yet know whom to ask; the reply is **unicast** because the responder does.

### The ARP Cache

Mappings are cached with a **timeout** (typically minutes) so ARP is not needed for every packet, while still allowing the table to follow hardware changes. Hosts also learn from requests they overhear — a host that sees A's request learns A's mapping for free.

### ARP for Remote Destinations

If the destination is on **another** network, the host does **not** ARP for it. It ARPs for its **default gateway** instead, and the router repeats the process on the next network.

| Destination        | ARP is issued for      |
| ------------------ | ---------------------- |
| Same subnet        | The destination host   |
| Different subnet   | The default gateway    |

### Security Weakness

ARP has **no authentication**. Any host may send an unsolicited reply, allowing **ARP spoofing / cache poisoning**, where an attacker claims another host's IP to intercept traffic — the basis of many LAN man-in-the-middle attacks.

> ARP is the joint between logical and physical addressing, and its complete lack of authentication remains one of the oldest unfixed weaknesses in Ethernet networks.

### Example

Pinging `192.168.1.20` for the first time triggers an ARP broadcast; subsequent pings use the cached entry, which is why the first ping often shows a noticeably higher round-trip time.
$md$, 12, false),

  (sid, 2, 'Explain DHCP and its role in IP networks.', $md$
**DHCP (Dynamic Host Configuration Protocol)** automatically assigns IP addresses and related configuration to hosts as they join a network, removing the need to configure every device by hand.

### The Problem It Solves

Manual configuration does not scale and is error-prone: every host needs an address, subnet mask, default gateway and DNS server, and a duplicated address breaks connectivity for both machines. In a network where laptops and phones come and go constantly, manual assignment is impossible.

### The DORA Exchange

```text
CLIENT                              SERVER
   |---- DHCP DISCOVER (broadcast) --->|   "is there a DHCP server?"
   |<--- DHCP OFFER ------------------|   "you may have 192.168.1.50"
   |---- DHCP REQUEST (broadcast) --->|   "I accept that offer"
   |<--- DHCP ACK --------------------|   "confirmed, lease 24h"
```

**DISCOVER** and **REQUEST** are broadcast because the client has no address yet, and the REQUEST is broadcast so that any *other* servers that made offers know their offer was declined.

### What DHCP Supplies

| Parameter        | Purpose                          |
| ---------------- | -------------------------------- |
| IP address       | The host's own address           |
| Subnet mask      | Identifies the local network     |
| Default gateway  | Router for off-network traffic   |
| DNS servers      | Name resolution                  |
| Lease time       | How long the address is valid    |

### Leases

Addresses are **leased**, not given permanently. A client renews at roughly **50% of the lease** (T1) and, failing that, at 87.5% (T2). Expired leases return to the pool, so addresses used by departed devices are reclaimed automatically.

### DHCP Relay

DHCP relies on broadcasts, which routers do not forward. A **DHCP relay agent** on the router forwards requests as unicast to a central server, so one server can serve many subnets.

### Security Considerations

* **Rogue DHCP servers** can hand out a malicious gateway address, enabling interception
* **DHCP starvation** exhausts the pool by requesting every address
* **DHCP snooping** on switches mitigates both by trusting only designated ports

> DHCP turns joining a network from a configuration task into an automatic event — which is exactly why a phone connects to Wi-Fi with no user input at all.

### Example

A laptop joining office Wi-Fi completes DORA in milliseconds and receives an address for 24 hours. Reconnecting later, it usually receives the **same** address, because servers prefer to honour previous assignments.
$md$, 13, false),

  (sid, 2, 'Explain ICMP and its functions.', $md$
**ICMP (Internet Control Message Protocol)** carries error reports and diagnostic messages for IP. IP itself is unreliable and has no way to report problems, so ICMP supplies the feedback channel that makes the network diagnosable.

### Position in the Stack

ICMP messages are **encapsulated inside IP datagrams** (protocol number 1), yet ICMP is considered part of the **network layer** — it is a helper for IP rather than a transport for applications.

```text
[ IP header | ICMP header | ICMP data ]
```

The ICMP data typically includes the **IP header and first 8 bytes** of the datagram that caused the error, so the sender can tell which flow was affected.

### Error-Reporting Messages

| Message                  | Meaning                                        |
| ------------------------ | ---------------------------------------------- |
| **Destination Unreachable** | No route, host down, or port closed         |
| **Time Exceeded**        | TTL reached zero — a loop, or a traceroute hop |
| **Parameter Problem**    | Malformed header field                         |
| **Source Quench**        | Congestion signal (deprecated)                 |
| **Redirect**             | A better first-hop router exists               |

### Query Messages

| Message               | Purpose                       |
| --------------------- | ----------------------------- |
| **Echo Request/Reply**| Reachability testing (`ping`) |
| **Timestamp**         | Clock and delay estimation    |

### How the Diagnostic Tools Use It

**ping** sends an **Echo Request** and measures the time until the **Echo Reply**, confirming reachability and reporting round-trip time.

**traceroute** exploits **Time Exceeded** cleverly:

```text
send packet with TTL=1  -> first router discards, replies Time Exceeded
send packet with TTL=2  -> second router replies
send packet with TTL=3  -> third router replies
... continue until the destination itself answers
```

Each reply reveals one router's address, so the whole path is mapped without any router cooperating deliberately.

### Important Limits

* ICMP **reports** errors but never **corrects** them
* No ICMP message is generated for a lost ICMP message — which would cause message storms
* Many networks **filter ICMP** for security, which is why some hosts do not respond to ping despite being reachable

> ICMP is the reason a network failure produces a diagnosis rather than mere silence.

### Example

Running `traceroute` to a distant server lists each router in turn. Every line is a Time Exceeded message from a router that discarded a packet whose TTL had expired — errors deliberately provoked to reveal the path.
$md$, 14, false),

  (sid, 2, 'Explain Virtual Networks and their purpose.', $md$
A **virtual network** is a logical network built **on top of** a physical one, whose structure is defined by software rather than by cabling. Nodes that are physically distant can appear to be on the same network, and nodes on the same switch can be kept entirely separate.

### Why They Are Needed

Physical topology rarely matches organisational need. Members of one department may sit on different floors; a company may need traffic isolation without buying separate switches; a remote worker may need to appear inside the corporate network.

### Principal Forms

**1. VLAN (Virtual LAN)**
Divides one physical switch into several logical broadcast domains. Each frame carries a **VLAN tag** (IEEE 802.1Q) identifying its VLAN.

```text
one physical switch
+-------------------------------+
| VLAN 10 (Sales)   ports 1-8   |
| VLAN 20 (Finance) ports 9-16  |
+-------------------------------+
Broadcasts stay inside their VLAN.
Traffic between VLANs must pass a router.
```

**2. VPN (Virtual Private Network)**
Creates a secure, encrypted tunnel across a public network, so a remote host behaves as if it were on the private LAN.

**3. Overlay Networks**
Logical topologies built above IP — used by peer-to-peer systems, CDNs and data-centre fabrics.

### Purposes

* **Segmentation** — separate departments without extra hardware
* **Security** — isolate sensitive traffic; a compromise in one VLAN does not expose another
* **Broadcast control** — smaller broadcast domains, less wasted bandwidth
* **Flexibility** — a user moving desks keeps their VLAN through configuration alone
* **Cost saving** — one switch serves several logical networks

| Aspect            | Physical Network       | Virtual Network        |
| ----------------- | ---------------------- | ---------------------- |
| Defined by        | Cabling                | Software configuration |
| Changing it       | Requires rewiring      | A configuration change |
| Cost of a segment | New hardware           | None                   |
| Isolation         | Physical               | Logical (tag-enforced) |

> Virtual networks decouple logical structure from physical layout — which is why modern data centres and clouds are almost entirely virtual.

### Example

A company puts finance staff across three floors into VLAN 20. Their broadcasts never reach other departments, and a router between VLANs enforces which systems each may access — all without moving a single cable.
$md$, 15, false),

  (sid, 2, 'Explain Tunneling and its role in internetworking.', $md$
**Tunneling** carries a packet of one protocol inside the payload of another, so it can traverse a network that would not otherwise understand or permit it. The inner packet is **encapsulated** at the tunnel entrance and **decapsulated** at the exit.

### How It Works

```text
original packet:        [ IP hdr | data ]

at tunnel entrance:     [ OUTER IP hdr | IP hdr | data ]
                          ^ addressed to the tunnel EXIT

travels across the intermediate network as ordinary traffic

at tunnel exit:         outer header stripped
                        [ IP hdr | data ]  -> forwarded normally
```

The intermediate network sees only the outer header and forwards it like any other packet — it never inspects or needs to understand the payload.

### Why Tunneling Is Used

**1. Protocol Incompatibility**
Carrying **IPv6** across an IPv4-only network by wrapping IPv6 packets in IPv4 — the main mechanism of IPv6 transition.

**2. Virtual Private Networks**
Encapsulating and **encrypting** private traffic so it can cross the public internet securely.

**3. Connecting Isolated Networks**
Joining two private sites over a public network so they behave as one.

**4. Mobility**
**Mobile IP** tunnels packets from a host's home network to its current location.

**5. Traffic Engineering**
**MPLS** tunnels steer traffic along chosen paths inside carrier networks.

### Costs

| Drawback              | Consequence                                  |
| --------------------- | -------------------------------------------- |
| Header overhead       | Extra bytes per packet reduce usable payload |
| Reduced effective MTU | May force fragmentation                      |
| Processing cost       | Encapsulation and encryption take CPU        |
| Harder troubleshooting| Inner traffic is invisible to intermediate devices |
| Possible security bypass | Tunnels can carry traffic past firewalls  |

> Tunneling is the standard answer whenever a network must carry something it was not designed for — the cost is always extra headers and reduced visibility.

### Example

A remote employee's VPN client wraps each packet in an encrypted outer header addressed to the company gateway. The ISP forwards it as ordinary internet traffic, seeing neither the internal addresses nor the contents; the gateway unwraps it and injects it into the corporate LAN.
$md$, 16, false);

  RAISE NOTICE 'Advanced Computer Networks — Unit 2: 16 questions inserted.';
END $do$;
