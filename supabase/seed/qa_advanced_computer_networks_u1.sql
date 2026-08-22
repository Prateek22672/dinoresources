-- =====================================================================
-- Study-With-AI seed — Advanced Computer Networks (4th Year) — UNIT 1
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

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Explain the applications of computer networks.',
    'Explain the requirements of computer networks from different perspectives.',
    'Explain Scalable Connectivity as a network requirement.',
    'Explain Cost-Effective Resource Sharing in computer networks.',
    'Explain how networks support Common Services.',
    'Explain Layering and Protocols in computer network architecture.',
    'Explain the OSI Architecture and its layered approach.',
    'Explain the Internet Architecture.',
    'Explain the Application Programming Interface (API) used for network software.',
    'Explain Sockets and their role in network communication.',
    'Explain Bandwidth and Latency and their impact on network performance.',
    'Explain the Delay × Bandwidth Product.',
    'Explain Application Performance Needs and how they influence network design.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain the applications of computer networks.', $md$
A **computer network** is a set of computing devices connected by communication links so they can exchange data and share resources. Applications are what justify the network's existence — the network itself is only the plumbing.

### Major Application Areas

**1. Communication Services**
Email, instant messaging, voice and video calling, and conferencing. These replaced physical mail and telephony and are now the default mode of business communication.

**2. Resource Sharing**
Printers, storage arrays, compute servers and licensed software are shared among many users, so expensive hardware need not be duplicated at every desk.

**3. Information Access**
The **World Wide Web** — the largest distributed information system ever built — plus digital libraries, search engines and online news.

**4. Electronic Commerce**
Online shopping, banking, payments and B2B trading, all of which depend on **secure, reliable** network transport.

**5. Entertainment**
Video-on-demand, music streaming, online gaming and live broadcast. These generate the majority of today's internet traffic and drive demand for bandwidth.

**6. Distributed Computing**
Cloud computing, cluster computing and grid computing, where a problem is split across many networked machines.

**7. Social and Collaborative Applications**
Social networks, shared document editing, version control and remote working tools.

**8. Machine-to-Machine and IoT**
Sensors, smart meters, industrial control and vehicular systems, where the endpoints are devices rather than people.

### Classified by Interaction Model

| Model              | Description                          | Example              |
| ------------------ | ------------------------------------ | -------------------- |
| **Client–Server**  | Many clients request from one server | Web, email           |
| **Peer-to-Peer**   | Nodes act as both client and server  | BitTorrent, blockchain |
| **Publish–Subscribe** | Producers post, consumers subscribe | News feeds, IoT      |
| **Streaming**      | Continuous timed delivery            | Video, VoIP          |

> Applications are not merely users of the network — their differing needs for bandwidth, delay and reliability are precisely what shape network design.

### Example

A video call and a file download both use the same internet, but the call needs **low, steady delay** and tolerates some loss, whereas the download needs **high throughput** and tolerates delay but no loss at all. The network must serve both.
$md$, 1, true),

  (sid, 1, 'Explain the requirements of computer networks from different perspectives.', $md$
A network must satisfy several groups of people whose priorities differ, and often conflict. Understanding whose requirement is being discussed is essential, because "a good network" means something different to each.

### The Three Perspectives

**1. The Application Programmer**
Wants **services the application needs** without having to implement them:

* Guaranteed delivery of every message
* Messages arriving in the order they were sent
* A simple programming interface (sockets)
* Freedom from the details of the underlying hardware

**2. The Network Operator / Designer**
Wants a network that is **manageable and economical**:

* Easy to administer, monitor and troubleshoot
* Fair sharing among users
* Graceful behaviour under fault and overload
* Scalability as users and traffic grow

**3. The Network Provider**
Wants a **profitable, efficient** system:

* High utilisation of installed capacity
* Accurate accounting and billing
* Low operating cost per bit carried

### The Three Core Requirements

Across all perspectives, three requirements recur:

* **Scalable Connectivity** — the network must connect any node to any other, and keep working as it grows.
* **Cost-Effective Resource Sharing** — links and nodes must be shared efficiently rather than dedicated.
* **Support for Common Services** — the network should provide services applications would otherwise each build for themselves.

```text
Application programmer  -> "give me reliable ordered delivery"
Network designer        -> "make it manageable and fair"
Network provider        -> "make it efficient and billable"
                    |
                    v
        Scalability + Sharing + Common Services
```

| Perspective   | Primary Concern      | Typical Metric        |
| ------------- | -------------------- | --------------------- |
| Programmer    | Correct service      | Reliability, ordering |
| Designer      | Manageability        | Uptime, fairness      |
| Provider      | Efficiency           | Utilisation, cost/bit |

> These requirements pull against each other: perfect reliability costs bandwidth, and maximum utilisation increases delay. Network architecture is the discipline of balancing them.

### Example

A programmer asks for guaranteed delivery; the provider notes that retransmissions consume capacity that could carry paying traffic. TCP resolves this by providing reliability **at the endpoints** rather than inside the network, keeping the core simple and cheap.
$md$, 2, false),

  (sid, 1, 'Explain Scalable Connectivity as a network requirement.', $md$
**Scalable connectivity** means the network must provide a path between any pair of nodes, and must continue to do so as the number of nodes grows very large. The internet demonstrates the extreme case: billions of hosts, all mutually reachable.

### Building Blocks of Connectivity

**Links and Nodes**
The simplest network is two nodes joined by a **link**. Links may be **point-to-point** (exactly two nodes) or **multiple-access** (many nodes sharing one medium).

```text
Point-to-point:      A -------- B

Multiple-access:     A ---+--- B
                          |
                          C
```

**Switched Networks**
Direct links between every pair is impossible: *n* nodes would need *n(n−1)/2* links. Instead, **switches** forward data between links, so a node needs only one link to reach everyone.

```text
Full mesh (unscalable)      Switched (scalable)
   A --- B                    A       B
   | \ / |                     \     /
   |  X  |                      [switch]
   | / \ |                     /     \
   C --- D                    C       D
```

**Internetworks**
Networks are themselves joined by **routers** or **gateways**, forming a **network of networks** — an *internetwork*. The internet is the largest example.

### Achieving Scale

* **Hierarchical addressing** — addresses carry structure so routers aggregate many destinations into one table entry.
* **Hierarchical routing** — routers keep detail about nearby networks and summaries of distant ones.
* **Indirect connectivity** — nodes reach each other through intermediaries, not direct links.
* **Multiplexing** — many flows share one physical link.

| Approach            | Links needed for n nodes |
| ------------------- | ------------------------ |
| Full mesh           | n(n−1)/2 — impossible    |
| Switched network    | n — scalable             |

> Scalability is achieved by *indirection*: nodes do not connect to each other, they connect to something that knows how to reach everything else.

### Example

A home laptop reaches a server in another continent without any direct link. Its packets pass through the home router, an ISP, several backbone routers and the destination's network — each device knowing only the next hop, never the whole path.
$md$, 3, false),

  (sid, 1, 'Explain Cost-Effective Resource Sharing in computer networks.', $md$
Network links are expensive, so dedicating one to each pair of communicating hosts would be economically impossible. **Resource sharing** lets many flows use the same physical link, and the mechanism that achieves it is **multiplexing**.

### Multiplexing

Multiplexing combines several data streams onto one link; **demultiplexing** separates them at the other end.

```text
flow 1 ---\                     /--- flow 1
flow 2 ----> [MUX] ==link==> [DEMUX] ---> flow 2
flow 3 ---/                     \--- flow 3
```

### Methods of Multiplexing

**1. Synchronous Time-Division Multiplexing (STDM)**
Time is divided into fixed slots, each permanently assigned to one flow.
*Problem:* if a flow has nothing to send, its slot is **wasted**.

**2. Frequency-Division Multiplexing (FDM)**
Each flow gets its own frequency band, used continuously.
*Problem:* the same waste, and the number of flows is fixed by the number of bands.

**3. Statistical Multiplexing**
The link is shared **on demand**: data is sent in **packets**, and whichever flow has data ready uses the next transmission opportunity.

Because flows are usually **bursty** — idle much of the time, then busy in bursts — and bursts rarely coincide, statistical multiplexing supports far more flows than STDM for the same capacity. This is the basis of packet-switched networks including the internet.

| Method       | Allocation   | Idle capacity | Suits              |
| ------------ | ------------ | ------------- | ------------------ |
| STDM         | Fixed slots  | Wasted        | Constant-rate flows |
| FDM          | Fixed bands  | Wasted        | Analog, broadcast   |
| Statistical  | On demand    | Reused        | Bursty data traffic |

### The Cost of Sharing

Statistical multiplexing has no reservation, so if too many flows burst at once the link **congests**: queues build, delay rises, and packets are dropped. Networks therefore need **congestion control** and **fair queueing** — the price paid for high efficiency.

> Statistical multiplexing exchanges guaranteed capacity for far better utilisation, and then spends effort managing the congestion that follows.

### Example

A 100 Mbps office link serves 200 employees who each browse in short bursts. Dedicating 0.5 Mbps each (STDM) would leave most capacity idle; statistical multiplexing lets any active user briefly use far more, so browsing feels fast even though the link is shared.
$md$, 4, false),

  (sid, 1, 'Explain how networks support Common Services.', $md$
Beyond simply moving bits, a network is expected to provide **common services** — functions that almost every application needs. If the network did not supply them, each application would have to reimplement them, duplicating effort and repeating mistakes.

### Why Common Services Matter

Consider two applications: a file transfer and an email client. Both need data delivered **completely, correctly and in order**. Without a shared service, each would separately implement acknowledgements, retransmission, sequencing and flow control — the same difficult code written twice, badly.

Instead the network offers a **channel abstraction** that hides these details.

### Channel Abstractions

**1. Request/Reply Channel**
Used by applications where one side asks and the other answers — the Web, remote procedure calls, database queries.

Guarantees required:
* Each message is delivered exactly once
* Messages are not corrupted
* Replies are matched to requests

**2. Message Stream Channel**
Used where a continuous flow of data is sent one way — video streaming, file transfer.

Guarantees required:
* Data arrives in order
* Data is not duplicated
* Optionally, timing is preserved

### What the Network Must Hide

* **Bit errors** — corruption caused by noise on the link.
* **Packet loss** — drops caused by congestion or failure.
* **Node and link failures** — routing around broken paths.
* **Message reordering** — packets taking different routes.
* **Duplication** — retransmissions arriving twice.
* **Third-party threats** — eavesdropping and tampering.

```text
application sees:   a reliable ordered pipe
                    ------------------------
network reality:    loss, reorder, duplication,
                    corruption, failure
```

| Problem      | Mechanism That Hides It     |
| ------------ | --------------------------- |
| Bit errors   | Checksums, error correction |
| Loss         | Acknowledgement + retransmit|
| Reordering   | Sequence numbers            |
| Duplication  | Sequence numbers            |
| Congestion   | Congestion control          |

> A good network abstraction is measured by what the application programmer never has to think about.

### Example

A browser downloading a page never handles a lost packet. TCP detects the gap, requests retransmission and delivers the bytes in order — so the application sees a clean stream, unaware of what happened underneath.
$md$, 5, false),

  (sid, 1, 'Explain Layering and Protocols in computer network architecture.', $md$
Networks are complex, and **layering** is the technique used to manage that complexity. The system is decomposed into layers, each providing a service to the layer above and using the service of the layer below, hiding its own internal details.

### The Idea of Layering

```text
+-------------------------+
|      Application        |  process-to-process
+-------------------------+
|   Reliable transport    |  hides loss, reordering
+-------------------------+
|   Host-to-host connect. |  moves packets between hosts
+-------------------------+
|        Hardware         |  bits on the wire
+-------------------------+
```

Each layer solves one part of the problem. A change inside a layer — replacing copper with fibre, say — does not disturb the layers above.

### Benefits of Layering

* **Decomposition** — one hard problem becomes several manageable ones.
* **Modularity** — a layer can be replaced without rewriting the others.
* **Reuse** — many applications share the same transport layer.
* **Abstraction** — upper layers need not understand lower mechanisms.

### Protocols

A **protocol** is the set of rules governing communication between the *same layer* on two different machines. Every protocol defines two interfaces:

* **Service interface** — how the layer above uses this protocol on the same machine.
* **Peer interface** — the message format and rules exchanged with the matching protocol on the remote machine.

```text
Host A                         Host B
[ TCP ]  <--- peer interface ---> [ TCP ]
   ^                                 ^
service interface              service interface
   |                                 |
[ App ]                           [ App ]
```

Peers never communicate directly: a message passes **down** the stack on the sender, across the physical medium, and **up** the stack on the receiver.

### Encapsulation

Each layer adds its own **header** to the data it receives from above.

```text
[ App data ]
[ TCP hdr | App data ]
[ IP hdr | TCP hdr | App data ]
[ Frame hdr | IP hdr | TCP hdr | App data ]
```

The receiver strips headers in reverse order, each layer reading only its own.

> Layering is why the internet could adopt fibre, Wi-Fi and mobile radio without changing a single application.

### Example

A web request travels HTTP → TCP → IP → Ethernet on the sender and back up in reverse on the server. HTTP is unaware of Wi-Fi; Wi-Fi is unaware of HTTP.
$md$, 6, false),

  (sid, 1, 'Explain the OSI Architecture and its layered approach.', $md$
The **OSI (Open Systems Interconnection)** model, defined by **ISO**, is a seven-layer reference architecture for network communication. It is primarily a **conceptual and teaching model** — few systems implement it literally — but its vocabulary is used universally.

### The Seven Layers

```text
7 | Application   | services to the user
6 | Presentation  | format, encrypt, compress
5 | Session       | dialog control, checkpoints
4 | Transport     | end-to-end, reliability
3 | Network       | routing, logical addressing
2 | Data Link     | framing, MAC, error detection
1 | Physical      | bits, voltages, connectors
```

**1. Physical Layer**
Transmits raw bits — voltage levels, timing, cables and connectors.

**2. Data Link Layer**
Groups bits into **frames**, adds **MAC addressing**, detects errors and controls access to a shared medium. Delivers between **directly connected** nodes.

**3. Network Layer**
Delivers packets across **multiple networks** using **logical addressing** (IP) and **routing**. Handles fragmentation and congestion.

**4. Transport Layer**
Provides **process-to-process** delivery — reliability, sequencing, flow control and error recovery. The first truly **end-to-end** layer.

**5. Session Layer**
Establishes, manages and terminates sessions; supports dialog control and synchronisation checkpoints.

**6. Presentation Layer**
Handles **syntax and semantics** — character encoding, data representation, encryption and compression.

**7. Application Layer**
Provides services directly to the user: file transfer, mail, directory access.

### Grouping the Layers

| Group           | Layers | Concern                        |
| --------------- | ------ | ------------------------------ |
| Network support | 1–3    | Moving bits between machines   |
| Transport       | 4      | Bridging the two groups        |
| User support    | 5–7    | Interoperability between apps  |

> The OSI model's lasting value is not its implementation but its vocabulary: "layer 2 switch" and "layer 3 routing" are understood everywhere.

### Example

Sending an email: the Application layer forms the message, Presentation encodes it, Session manages the exchange, Transport ensures delivery, Network routes it, Data Link frames it per hop, and Physical transmits the bits.
$md$, 7, false),

  (sid, 1, 'Explain the Internet Architecture.', $md$
The **Internet architecture**, also called the **TCP/IP model**, is the architecture actually deployed in the internet. Unlike OSI it grew from working implementations, and its structure reflects practical experience rather than committee design.

### The Four Layers

```text
+-------------------------------+
| Application  (HTTP, FTP, SMTP,|
|               DNS, SSH)       |
+-------------------------------+
| Transport    (TCP, UDP)       |
+-------------------------------+
| Internet     (IP)             |
+-------------------------------+
| Network Access (Ethernet,     |
|               Wi-Fi, PPP)     |
+-------------------------------+
```

**1. Network Access Layer** — combines OSI's physical and data link layers; moves frames across one physical network.

**2. Internet Layer** — **IP** provides a **best-effort, connectionless** datagram service: it will try to deliver a packet but guarantees nothing. Supported by ICMP, ARP and routing protocols.

**3. Transport Layer** — **TCP** offers reliable, ordered, connection-oriented byte streams; **UDP** offers unreliable, connectionless datagrams with minimal overhead.

**4. Application Layer** — merges OSI's session, presentation and application layers.

### The Hourglass Shape

```text
  many applications
 \  HTTP SMTP DNS FTP  /
  \                   /
   \    TCP   UDP    /
    \               /
     \     IP      /       <-- the narrow waist
    /               \
   /  Ethernet Wi-Fi \
  /   LTE  Fibre      \
```

**IP is the narrow waist.** Any application can run over any physical technology provided both speak IP. This single decision is why the internet absorbed Wi-Fi, mobile data and fibre without redesign.

### Design Principles

* **End-to-end argument** — keep the network simple; put function in the hosts.
* **Best-effort delivery** — the network does not guarantee, so it stays cheap and scalable.
* **Connectionless operation** — no per-flow state in routers.

| Feature      | OSI                  | Internet             |
| ------------ | -------------------- | -------------------- |
| Layers       | 7                    | 4                    |
| Origin       | Designed first       | Implemented first    |
| Status       | Reference model      | Deployed worldwide   |

> The internet succeeded by guaranteeing less: a simple, unreliable core proved easier to scale than an intelligent one.

### Example

A video call over 5G and a bank transfer over fibre both reduce to IP packets. IP does not know or care which is which — and that indifference is exactly what makes it universal.
$md$, 8, false),

  (sid, 1, 'Explain the Application Programming Interface (API) used for network software.', $md$
A network **API** is the interface an operating system offers to application programs so they can use the network without implementing protocols themselves. It is the concrete form of the **service interface** in a layered architecture.

### Purpose

The API must hide protocol machinery — connection setup, sequence numbers, retransmission, buffering — while exposing enough control for the application to express what it needs.

### The Socket API

The dominant network API is the **socket interface**, originating in Berkeley UNIX and now available on essentially every platform. A **socket** is the endpoint of a communication channel, identified by an **IP address** and a **port number**.

### Principal Operations

| Call        | Purpose                                        |
| ----------- | ---------------------------------------------- |
| `socket()`  | Create a new socket, choosing protocol family  |
| `bind()`    | Attach the socket to a local address and port  |
| `listen()`  | Mark a server socket as accepting connections  |
| `accept()`  | Accept a waiting client connection             |
| `connect()` | Initiate a connection to a server              |
| `send()`    | Transmit data                                  |
| `recv()`    | Receive data                                   |
| `close()`   | Release the socket                             |

### Client and Server Sequences

```text
SERVER                        CLIENT
socket()                      socket()
bind()
listen()
accept()  <---- connection --- connect()
recv()    <---- data --------- send()
send()    ----- data --------> recv()
close()                       close()
```

The asymmetry is important: the **server** passively waits at a known address, while the **client** actively initiates.

### Design Qualities of a Good API

* **Simplicity** — few calls, clear semantics.
* **Protocol independence** — the same calls work for TCP and UDP.
* **Efficiency** — minimal copying between user and kernel space.
* **Transparency** — the application need not know the route or medium.

> The socket API's longevity comes from a deliberate choice: it exposes the *service* (a reliable stream, or a datagram) while concealing every mechanism that provides it.

### Example

A chat application calls `send()` with a message. It never sees the segmentation into TCP segments, the acknowledgements, or the retransmission of a lost segment — the API presents only "the bytes were handed over".
$md$, 9, false),

  (sid, 1, 'Explain Sockets and their role in network communication.', $md$
A **socket** is the endpoint of a two-way communication channel between two processes across a network. It is the abstraction through which an application actually sends and receives data, and is identified by the pair **(IP address, port number)**.

### Identifying a Connection

A single socket identifies one endpoint; a **connection** is identified by four values:

```text
( source IP, source port, destination IP, destination port )

192.168.1.5 : 51000  <---->  142.250.183.4 : 443
```

This **4-tuple** is why one server port (443) can serve thousands of clients simultaneously — each connection differs in the client's address or port.

### Types of Sockets

**1. Stream Sockets (SOCK_STREAM) — TCP**
* Connection-oriented; a connection is established before data flows
* Reliable, ordered, no duplication
* Byte-stream oriented, with no message boundaries preserved
* Used by HTTP, FTP, SMTP, SSH

**2. Datagram Sockets (SOCK_DGRAM) — UDP**
* Connectionless; each datagram is independent
* Unreliable — no acknowledgement, ordering or retransmission
* Message boundaries preserved
* Low overhead and low delay
* Used by DNS, VoIP, video streaming, online gaming

**3. Raw Sockets**
* Direct access to network-layer packets, bypassing transport
* Used by diagnostic tools such as `ping` and `traceroute`

| Feature        | Stream (TCP)     | Datagram (UDP)   |
| -------------- | ---------------- | ---------------- |
| Connection     | Required         | None             |
| Reliability    | Guaranteed       | Not guaranteed   |
| Ordering       | Preserved        | Not preserved    |
| Boundaries     | Not preserved    | Preserved        |
| Overhead       | Higher           | Lower            |
| Speed          | Slower           | Faster           |

### Role in Communication

* Provide the **endpoint** applications read from and write to
* **Multiplex** many conversations onto one host using port numbers
* Let the OS **demultiplex** arriving packets to the correct process
* Give a **uniform interface** regardless of the underlying network

> Ports are what allow a single machine with one IP address to run a web server, a mail server and a database simultaneously without confusion.

### Example

A browser opens a stream socket to port 443 of a web server, while a DNS lookup from the same machine uses a datagram socket to port 53 of a resolver. The operating system keeps them apart by their differing 4-tuples.
$md$, 10, false),

  (sid, 1, 'Explain Bandwidth and Latency and their impact on network performance.', $md$
Network performance is described by two independent measures: **bandwidth**, which is about *quantity*, and **latency**, which is about *time*. Confusing them is the most common error in reasoning about network speed.

### Bandwidth (Throughput)

**Bandwidth** is the number of bits that can be transmitted per unit time, measured in **bits per second** (Mbps, Gbps).

It is determined by the physical medium, the encoding scheme and the capacity shared with other users. Bandwidth answers: *how much data fits through per second?*

### Latency (Delay)

**Latency** is the time for one bit to travel from source to destination, measured in **milliseconds**. It has three components:

```text
Latency = Propagation + Transmission + Queueing

Propagation  = distance / speed of light in medium
Transmission = message size / bandwidth
Queueing     = time waiting in buffers
```

**Round-Trip Time (RTT)** is the time for a signal to reach the destination and a response to return — usually the figure that matters to applications.

### Why They Are Independent

Bandwidth can be increased by adding capacity, but **propagation delay is bounded by physics**. A fibre from London to Sydney has a floor of roughly 55 ms one way no matter how much capacity is installed.

| Characteristic | Bandwidth              | Latency                     |
| -------------- | ---------------------- | --------------------------- |
| Measures       | Data per second        | Time per trip               |
| Improved by    | More capacity          | Shorter distance, less queueing |
| Limited by     | Medium and cost        | Speed of light              |
| Matters for    | Large transfers        | Interactive applications    |

### Impact on Applications

* **Large file transfer** is **bandwidth-bound** — doubling bandwidth roughly halves the time.
* **Small request/reply** (a web page, a database query) is **latency-bound** — dominated by RTT, and extra bandwidth changes almost nothing.
* **Real-time voice and video** are latency- and **jitter**-bound; delay above ~150 ms makes conversation awkward.

> Bandwidth problems can be bought away with money; latency problems often cannot be solved at all, only designed around.

### Example

Fetching a 1 KB web object over a link with 100 ms RTT takes ~100 ms regardless of whether the link is 10 Mbps or 10 Gbps — the transmission time is negligible and RTT dominates. Downloading a 10 GB file, by contrast, is almost entirely a bandwidth question.
$md$, 11, false),

  (sid, 1, 'Explain the Delay × Bandwidth Product.', $md$
The **delay × bandwidth product** measures how much data can be "in flight" in a network link at any instant — that is, the amount of data that has left the sender but has not yet reached the receiver.

### The Concept

Think of the link as a **hollow pipe**:

* **Latency** is the pipe's **length**
* **Bandwidth** is the pipe's **diameter**
* Their product is the pipe's **volume** — the data it holds

```text
sender >========================> receiver
        <------ delay ------->
        pipe volume = delay x bandwidth
```

### Calculation

```text
Delay x Bandwidth = one-way delay (s) x bandwidth (bits/s)
```

**Worked example**
A link with one-way delay 50 ms and bandwidth 100 Mbps:

```text
= 0.050 s x 100,000,000 bits/s
= 5,000,000 bits
= 625,000 bytes  (about 610 KB)
```

So roughly **610 KB is in transit** before the first bit arrives.

### Why It Matters

**1. Sender window sizing**
To keep a link fully utilised the sender must be able to transmit at least one delay × bandwidth product of data **before** waiting for an acknowledgement. If TCP's window is smaller, the link idles and capacity is wasted.

**2. Buffer requirements**
Receivers and routers must buffer at least this much data to avoid loss.

**3. The cost of feedback**
Reacting to anything that requires a round trip means at least **RTT × bandwidth** of data has already been sent. On long fat links, congestion feedback is always stale.

**4. Long Fat Networks (LFNs)**
Links with a large product — satellite, transcontinental fibre — need large windows and scaling options, which is why **TCP window scaling** exists.

| Link                     | RTT     | Bandwidth | Product (approx) |
| ------------------------ | ------- | --------- | ---------------- |
| LAN                      | 1 ms    | 1 Gbps    | 125 KB           |
| Cross-country fibre      | 60 ms   | 1 Gbps    | 7.5 MB           |
| Geostationary satellite  | 500 ms  | 50 Mbps   | 3.1 MB           |

> A protocol that stops to wait for acknowledgement on a high-product link can use only a fraction of the capacity that was paid for.

### Example

On a satellite link with RTT 500 ms, a sender using a 64 KB window transmits 64 KB then waits half a second — achieving about 1 Mbps on a 50 Mbps link, roughly 2% utilisation. Window scaling is what recovers the rest.
$md$, 12, false),

  (sid, 1, 'Explain Application Performance Needs and how they influence network design.', $md$
Different applications need fundamentally different things from a network. Designing for the average is a mistake — the network must be shaped by the demands of the traffic it is intended to carry.

### The Performance Dimensions

* **Bandwidth** — how much capacity the application consumes
* **Latency** — how quickly a single message must arrive
* **Jitter** — how much the *variation* in delay matters
* **Loss tolerance** — whether missing data is fatal or merely degrading
* **Reliability** — whether every byte must arrive

### Application Classes

**1. Elastic Applications**
Web browsing, email, file transfer. They **adapt** to whatever bandwidth is available and tolerate delay, but require **complete, correct** delivery. Served well by **TCP** and best-effort service.

**2. Real-Time Applications**
Voice and video calling. They need **bounded delay and low jitter**, and tolerate some loss — a lost audio packet is a small glitch, but a late one is useless.

```text
Real-time playback buffer:

packets arrive with varying delay
        |
   [ playback buffer ]   <- absorbs jitter
        |
   smooth, constant-rate output
```

A **playback buffer** trades a little extra latency for immunity to jitter, which is why video calls insert a short delay deliberately.

**3. Streaming Applications**
Video-on-demand. Needs **high bandwidth** but tolerates **seconds** of startup delay, because large buffers can be filled in advance.

**4. Interactive Applications**
Remote shells, online gaming, database queries. Small messages where **RTT dominates**; bandwidth is nearly irrelevant.

| Application    | Bandwidth | Latency  | Jitter    | Loss tolerance |
| -------------- | --------- | -------- | --------- | -------------- |
| File transfer  | High      | Tolerant | Tolerant  | None           |
| Web browsing   | Moderate  | Sensitive| Tolerant  | None           |
| Voice call     | Low       | Critical | Critical  | Some           |
| Video stream   | High      | Tolerant | Moderate  | Some           |
| Online game    | Low       | Critical | Critical  | Some           |

### Influence on Design

These needs justify **QoS** mechanisms, **traffic classification**, **priority queueing**, the existence of **UDP** alongside TCP, and **CDNs** that shorten physical distance to reduce unavoidable propagation delay.

> The internet's best-effort service suits elastic traffic well. Every QoS mechanism ever added exists because real-time traffic needs something best-effort cannot promise.

### Example

A campus network prioritises VoIP packets over backup traffic. The backup finishes a few minutes later and nobody notices; without prioritisation, calls would break up every time a backup ran.
$md$, 13, false);

  RAISE NOTICE 'Advanced Computer Networks — Unit 1: 13 questions inserted.';
END $do$;
