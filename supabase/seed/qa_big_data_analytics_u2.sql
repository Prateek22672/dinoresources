-- =====================================================================
-- Study-With-AI seed — Big Data Analytics (4th Year) — UNIT 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Big Data Analytics' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Big Data Analytics" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain NoSQL databases and their need in Big Data applications.',
    'Explain Aggregate Data Models and the concept of Aggregates.',
    'Explain Key-Value and Document Data Models.',
    'Explain Relationships in NoSQL data management.',
    'Explain Graph Databases and their applications.',
    'Explain Schemaless Databases and their characteristics.',
    'Explain Materialized Views in NoSQL systems.',
    'Explain Distribution Models in NoSQL databases.',
    'Explain Sharding and its role in distributing data.',
    'Explain Master-Slave Replication.',
    'Explain Peer-to-Peer Replication.',
    'Explain the relationship between Sharding and Replication.',
    'Explain Consistency in distributed NoSQL databases.',
    'Explain the concept of Relaxing Consistency and why it may be required.',
    'Explain Version Stamps and their role in maintaining data consistency.',
    'Explain the Map-Reduce programming model.',
    'Explain Partitioning and Combining in Map-Reduce.',
    'Explain how Map-Reduce calculations can be composed.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain NoSQL databases and their need in Big Data applications.', $md$
**NoSQL** ("Not Only SQL") databases are non-relational data stores designed for **large volumes, flexible schemas and horizontal scalability** — the requirements relational databases were never built to meet.

### Why Relational Databases Struggle with Big Data

| RDBMS characteristic      | Problem at Big Data scale                    |
| ------------------------- | -------------------------------------------- |
| **Fixed schema**          | Cannot absorb varied, evolving data          |
| **Vertical scaling**      | One machine has a hard ceiling               |
| **ACID transactions**     | Expensive to maintain across a cluster       |
| **JOINs**                 | Prohibitively costly across distributed nodes|
| **Structured data only**  | ~80% of data is unstructured                 |

### The Four Types of NoSQL Database

**1. Key-Value Stores**
```text
"user:1001"  ->  { name: "Asha", city: "Pune" }
```
Simplest model; extremely fast lookups by key. *Redis, DynamoDB, Riak.*

**2. Document Stores**
Store self-describing documents (JSON/BSON) that can be queried by their contents. *MongoDB, CouchDB.*

**3. Column-Family Stores**
Data stored by column family rather than row — efficient for reading a few attributes across millions of records. *Cassandra, HBase.*

**4. Graph Databases**
Nodes and relationships as first-class citizens. *Neo4j, Amazon Neptune.*

### Comparison with RDBMS

| Aspect        | RDBMS              | NoSQL                  |
| ------------- | ------------------ | ---------------------- |
| Schema        | Fixed, on write    | **Flexible, on read**  |
| Scaling       | Vertical           | **Horizontal**         |
| Consistency   | **ACID**           | Usually BASE           |
| Joins         | Supported          | Usually avoided        |
| Best for      | Transactions       | Volume and variety     |

### BASE instead of ACID

```text
BA  Basically Available   — the system responds
S   Soft state            — state may change without input
E   Eventually consistent — replicas converge over time
```

This is a deliberate trade justified by the **CAP theorem**: since network partitions are unavoidable, a distributed store must choose between consistency and availability.

### When NOT to Use NoSQL

NoSQL is not a universal replacement. Banking ledgers, inventory and anything requiring **multi-record transactional integrity** are still best served by a relational database.

> The name is misleading: NoSQL is not "against SQL" but "not only SQL" — most real architectures use both, choosing per workload.

### Example

An e-commerce site keeps orders and payments in PostgreSQL for ACID guarantees, product catalogue in MongoDB for flexible attributes, sessions in Redis for speed, and recommendations in Neo4j — four stores, each matched to its access pattern.
$md$, 1, true),

  (sid, 2, 'Explain Aggregate Data Models and the concept of Aggregates.', $md$
An **aggregate** is a collection of related data treated as a **single unit** for storage, retrieval and update. Aggregate-oriented data models are the defining characteristic of key-value, document and column-family databases.

### The Concept

```text
RELATIONAL (normalised across tables):
   Customer table -> Order table -> OrderLine table -> Product table
   Retrieving one order requires JOINing four tables

AGGREGATE-ORIENTED:
   {
     orderId: 1001,
     customer: { id: 55, name: "Asha" },
     lines: [ { product: "Book", qty: 2, price: 300 } ],
     shipping: { city: "Pune", pin: "411001" }
   }
   ONE read returns everything
```

### Why Aggregates Matter for Distribution

This is the central point: an aggregate is the **natural unit of distribution**.

```text
Data accessed together is STORED together
        -> stored on the SAME node
        -> retrieved in ONE network request
        -> no cross-node JOIN required
```

A normalised model would scatter one order's data across many nodes, making every read a distributed join — exactly what does not scale.

### Aggregates and Transactions

Most NoSQL databases guarantee **atomic operations only within a single aggregate**. This shapes design profoundly: whatever must change together should live in the same aggregate, since there is no multi-aggregate transaction to fall back on.

### Drawing Aggregate Boundaries

There is no single correct boundary — it depends on access patterns.

```text
Design A: Order aggregate CONTAINS customer details
  + one read gets everything for order display
  - customer data duplicated across every order
  - changing an address means updating many orders

Design B: Order references Customer by ID
  + customer data stored once
  - two reads required to display an order
```

| Consideration       | Favours                       |
| ------------------- | ----------------------------- |
| Read together often | **Same aggregate**            |
| Updated separately  | **Different aggregates**      |
| Data duplicated widely | Different aggregates       |
| Needs atomic update | **Same aggregate**            |

### Aggregate-Ignorant Models

Relational and graph databases are **aggregate-ignorant** — they impose no such grouping, which makes them flexible for varied queries but harder to distribute.

> The rule of thumb: model your aggregates around **how the data is read**, not around how it decomposes logically — normalisation optimises storage, aggregates optimise access.

### Example

A shopping cart is a natural aggregate: always read and written as a whole, never partially queried, and required to update atomically. Modelling it as one document is both faster and simpler than five normalised tables.
$md$, 2, false),

  (sid, 2, 'Explain Key-Value and Document Data Models.', $md$
Key-value and document stores are both **aggregate-oriented**, differing chiefly in whether the database can see inside the stored value.

### Key-Value Model

The simplest possible model: a giant distributed hash map.

```text
KEY                VALUE
"user:1001"   ->   <opaque blob>
"session:xyz" ->   <opaque blob>
"cart:88"     ->   <opaque blob>
```

**Characteristics**
* The value is **opaque** — the database neither knows nor cares about its structure
* Only operations: `put(key, value)`, `get(key)`, `delete(key)`
* Extremely fast — O(1) lookup
* **Cannot query by value contents**

*Examples: Redis, DynamoDB, Riak, Memcached.*

### Document Model

Stores structured, self-describing documents that the database **can inspect and query**.

```text
{
  "_id": "user:1001",
  "name": "Asha",
  "city": "Pune",
  "orders": [ { "id": 55, "total": 1200 } ]
}
```

**Characteristics**
* The value is **transparent** to the database
* Supports **queries on fields**: `find({ city: "Pune" })`
* **Partial updates** possible — modify one field without rewriting the document
* **Secondary indexes** on any field
* Nested structures and arrays supported

*Examples: MongoDB, CouchDB, Elasticsearch.*

### The Key Difference

| Aspect              | Key-Value        | Document              |
| ------------------- | ---------------- | --------------------- |
| Value visibility    | **Opaque**       | **Transparent**       |
| Query by content    | **No**           | **Yes**               |
| Partial update      | No — rewrite all | **Yes**               |
| Secondary indexes   | No               | **Yes**               |
| Speed               | **Fastest**      | Fast                  |
| Flexibility         | Lower            | **Higher**            |

```text
KEY-VALUE:  "give me whatever is at this key"
DOCUMENT:   "give me every document where city = Pune"
```

### When to Use Each

* **Key-value** — session storage, caching, user preferences, shopping carts; anywhere access is always by a known key
* **Document** — content management, catalogues, user profiles, event logging; anywhere queries filter on attributes

> A document store is essentially a key-value store that agreed to understand its values — gaining query power at some cost in raw speed.

### Example

A session store keyed by session ID needs only key lookups, so Redis is ideal. A product catalogue must answer "all laptops under ₹50,000 with 16 GB RAM" — impossible in a key-value store, natural in MongoDB.
$md$, 3, false),

  (sid, 2, 'Explain Relationships in NoSQL data management.', $md$
Relational databases handle relationships through **foreign keys and JOINs**. NoSQL databases, being aggregate-oriented and distributed, must handle them differently — and this is one of the hardest aspects of NoSQL data modelling.

### The Two Strategies

**1. Embedding (Denormalisation)**
Store related data **inside** the aggregate.

```text
{
  "orderId": 1001,
  "customer": { "id": 55, "name": "Asha", "city": "Pune" },
  "lines": [ { "product": "Book", "qty": 2 } ]
}
```

* **Advantages** — one read retrieves everything; atomic updates; fast
* **Disadvantages** — data duplicated; updates must touch many documents; documents can grow unboundedly

**2. Referencing (Normalisation)**
Store an identifier and fetch separately.

```text
{ "orderId": 1001, "customerId": 55, "lines": [...] }
```

* **Advantages** — no duplication; a single update point
* **Disadvantages** — requires multiple reads (an **application-side join**); no atomicity across aggregates

### Choosing Between Them

| Situation                       | Prefer         |
| ------------------------------- | -------------- |
| Data read together always       | **Embed**      |
| Related data updated frequently | **Reference**  |
| One-to-few relationship         | Embed          |
| One-to-many (unbounded)         | Reference      |
| Many-to-many                    | Reference      |
| Consistency across items needed | Reference      |
| Read performance critical       | Embed          |

### The Consequences of Denormalisation

```text
Customer name embedded in 10,000 orders
        |
Customer changes their name
        |
10,000 documents must be updated
   -> not atomic
   -> temporary inconsistency is visible
```

This is accepted deliberately, on the reasoning that **reads vastly outnumber writes** in most applications.

### Application-Side Joins

Without database JOINs, the application performs them:

```text
1. Read the order
2. Extract customerId
3. Read the customer
4. Combine in application code
```

This shifts complexity from the database into the application — a genuine cost, not a free win.

### Where Graph Databases Fit

For relationship-heavy data — social networks, recommendations, fraud rings — both approaches are poor. **Graph databases** treat relationships as first-class entities and traverse them efficiently, which is why they exist as a separate category.

> The honest summary: NoSQL does not solve relationships, it **relocates** them — into the aggregate design, or into application code.

### Example

A blog embeds comments inside the post (read together, rarely updated separately) but references the author by ID (one author appears on hundreds of posts, and profile edits must not require rewriting them all).
$md$, 4, false),

  (sid, 2, 'Explain Graph Databases and their applications.', $md$
A **graph database** stores data as **nodes** (entities) and **edges** (relationships), with properties on both. Relationships are stored as first-class citizens rather than inferred by matching keys.

### The Data Model

```text
(Asha:Person {age:22}) -[:FRIEND_OF {since:2019}]-> (Ravi:Person)
        |
    [:LIVES_IN]
        v
   (Pune:City)
```

* **Nodes** — entities, with labels and properties
* **Edges** — typed, directed relationships, which may also carry properties
* Both are stored directly, so traversal follows physical pointers

### Why This Matters — Index-Free Adjacency

```text
RELATIONAL: finding friends-of-friends requires
            JOINing a table to itself repeatedly
            cost grows sharply with depth

GRAPH:      each node holds direct pointers to its neighbours
            traversal cost depends on the RESULT size,
            not the total database size
```

This is the decisive advantage. A 5-level relationship query that would be impractical in SQL is routine in a graph database.

### Query Language — Cypher

```text
MATCH (a:Person {name:"Asha"})-[:FRIEND_OF*2]->(fof)
WHERE NOT (a)-[:FRIEND_OF]->(fof)
RETURN fof
```

Reading it: find friends-of-friends who are not already direct friends — the classic "people you may know" query, expressed in three lines.

### Applications

| Application            | Why a graph fits                         |
| ---------------------- | ---------------------------------------- |
| **Social networks**    | Friendship is inherently a graph          |
| **Recommendations**    | "Users like you also bought…"             |
| **Fraud detection**    | Rings of accounts sharing attributes      |
| **Knowledge graphs**   | Entities and their semantic relations     |
| **Network topology**   | Infrastructure dependency mapping         |
| **Supply chains**      | Multi-tier supplier relationships         |
| **Route finding**      | Shortest path over a road network         |

### Advantages and Limitations

**Advantages** — extremely fast multi-hop traversal, intuitive modelling of connected data, flexible schema, and expressive relationship queries.

**Limitations** — poor fit for aggregate queries over the whole dataset, **harder to shard** (relationships cross partitions by nature), smaller ecosystem, and a specialised query language to learn.

The sharding difficulty is fundamental: the whole value of a graph is that connected data is adjacent, and partitioning necessarily breaks that adjacency.

> Graph databases are the one NoSQL family that is **not** aggregate-oriented — which is exactly why they excel where aggregates fail.

### Example

A bank models accounts, devices, addresses and phone numbers as nodes. A fraud ring shows up as a dense cluster sharing a device and address, invisible when each account is examined individually — a query that traverses relationships rather than filtering rows.
$md$, 5, false),

  (sid, 2, 'Explain Schemaless Databases and their characteristics.', $md$
A **schemaless** database imposes no predefined structure on stored data. Records may have different fields, and the structure can change without any migration step.

### The Contrast

```text
RELATIONAL (schema-on-write):
   CREATE TABLE users (id INT, name VARCHAR(50), age INT);
   -> every row MUST match; adding a column needs ALTER TABLE

SCHEMALESS (schema-on-read):
   { "id":1, "name":"Asha", "age":22 }
   { "id":2, "name":"Ravi", "email":"r@x.com", "tags":["a","b"] }
   -> different shapes, stored side by side, no migration
```

### Characteristics

* **No predefined schema** — structure decided per record
* **Heterogeneous records** in the same collection
* **Schema evolution without migration** — add a field simply by writing it
* **Schema-on-read** — the *application* interprets structure at read time
* Naturally suits **semi-structured** data

### Advantages

| Advantage             | Detail                                      |
| --------------------- | ------------------------------------------- |
| **Flexibility**       | New fields require no coordination          |
| **Rapid development** | Model evolves with the application          |
| **No costly migrations** | ALTER TABLE on a billion rows is painful |
| **Handles variety**   | Sparse and irregular data stored naturally  |
| **Real-world modelling** | Not every entity has the same attributes |

### The Crucial Caveat — the Schema Still Exists

```text
There is ALWAYS a schema.
The only question is WHERE it lives.

Relational: enforced by the DATABASE
Schemaless: assumed by the APPLICATION CODE
```

This is the most important idea in the topic. Code reading `user.email` assumes that field exists — an **implicit schema** that is simply unenforced. When it is missing, the failure appears at runtime rather than at write time.

### Disadvantages

* **No validation** — typos and wrong types are stored happily
* **Inconsistent data** accumulates over time
* **Application complexity** — code must handle every historical variant
* **Query difficulty** — different structures complicate querying
* **Poor self-documentation** — the structure is not discoverable from the database

### The Practical Middle Ground

Most mature NoSQL databases now offer **optional schema validation** — MongoDB's JSON Schema validation, for instance — letting teams enforce structure where it matters while keeping flexibility elsewhere. This reflects hard-won experience that fully unconstrained data becomes unmanageable at scale.

> "Schemaless" is best read as "**schema-flexible**". Teams that treat it as "no schema needed" typically rediscover why schemas were invented.

### Example

A product catalogue stores books with `author` and `ISBN`, and laptops with `RAM` and `processor`, in one collection. A relational design would need either many nullable columns or a separate table per category.
$md$, 6, false),

  (sid, 2, 'Explain Materialized Views in NoSQL systems.', $md$
A **materialized view** is a **precomputed, physically stored** result of a query. Rather than computing an answer when asked, the system stores the answer in advance and updates it as data changes.

### View vs Materialized View

```text
NORMAL VIEW:        a stored QUERY, computed on every access
                    always current, slow for complex queries

MATERIALIZED VIEW:  stored RESULTS, computed in advance
                    very fast to read, may be slightly stale
```

### Why NoSQL Needs Them Particularly

Aggregate-oriented databases optimise for reading data **as it was stored**. Any query cutting across that grain is expensive.

```text
Orders stored as aggregates keyed by orderId
   -> "get order 1001"                FAST
   -> "total sales per product"       requires scanning EVERY order

Materialized view: maintain a running per-product total
   -> the same question becomes a single fast read
```

Since NoSQL cannot rely on ad-hoc JOINs and aggregations, precomputation becomes a primary design tool rather than an optimisation.

### Strategies for Building Them

**1. Eager (Update-on-Write)**
The view is updated in the same operation that changes the data.
* Always current; slows every write

**2. Lazy (Batch/Periodic)**
Recomputed on a schedule, often via MapReduce.
* Fast writes; data may be minutes or hours stale

**3. Incremental**
Only affected portions are recomputed as changes arrive.
* A balance of both, and the most common in practice

### Implementation in Real Systems

| System        | Mechanism                                 |
| ------------- | ----------------------------------------- |
| **CouchDB**   | MapReduce views, incrementally updated    |
| **Cassandra** | Built-in materialized views               |
| **MongoDB**   | Aggregation pipeline output written with `$out` |
| **Riak**      | Application-maintained precomputed keys   |

### Trade-offs

| Advantage           | Disadvantage                     |
| ------------------- | -------------------------------- |
| **Very fast reads** | Extra **storage** consumed       |
| Complex queries precomputed | **Staleness** possible   |
| Predictable latency | Write amplification              |
| Reduces load        | Maintenance complexity           |

> Materialized views embody the central NoSQL trade: **spend storage and write effort to make reads cheap**, on the reasoning that reads dominate most workloads.

### Example

An analytics dashboard showing daily revenue per region would scan millions of orders per page load. A materialized view updated incrementally as orders arrive turns that into a single key lookup — the dashboard loads instantly and the cost is paid once per order rather than once per viewer.
$md$, 7, false),

  (sid, 2, 'Explain Distribution Models in NoSQL databases.', $md$
**Distribution models** determine how data is spread across multiple machines. NoSQL databases scale **horizontally**, and there are only two fundamental techniques — used alone or in combination.

### The Four Configurations

**1. Single Server**
All data on one machine. Simplest, no distribution complexity, and correct whenever the data genuinely fits — a graph database is often best run this way.

**2. Sharding**
Different data on different nodes.

```text
Node 1: users A-H
Node 2: users I-P
Node 3: users Q-Z
```
* Scales **writes and reads**
* No redundancy — losing a node loses that shard's data

**3. Replication (Master-Slave)**
The same data copied to several nodes, one of which accepts writes.

```text
      [ MASTER ]  <- all writes
       /   |   \
   [S1]  [S2]  [S3]  <- reads served here
```
* Scales **reads**, provides fault tolerance
* Writes remain limited by the single master

**4. Peer-to-Peer Replication**
All nodes accept both reads and writes.

```text
  [N1] <---> [N2]
    ^  \     /  ^
    |   \   /   |
    v    \ /    v
  [N4] <---> [N3]
```
* Scales reads **and** writes; no single point of failure
* Introduces **write conflicts** requiring resolution

### Combining Sharding and Replication

Production systems use both together:

```text
Shard A -> replicated across nodes 1, 2, 3
Shard B -> replicated across nodes 4, 5, 6
Shard C -> replicated across nodes 7, 8, 9

Scalability from sharding + durability from replication
```

### Comparison

| Model         | Scales reads | Scales writes | Fault tolerant | Complexity |
| ------------- | ------------ | ------------- | -------------- | ---------- |
| Single server | No           | No            | No             | **Lowest** |
| Sharding      | Yes          | **Yes**       | **No**         | Medium     |
| Master-slave  | **Yes**      | No            | Yes            | Medium     |
| Peer-to-peer  | Yes          | **Yes**       | **Yes**        | **Highest**|

### Choosing

Choose sharding when the bottleneck is **data volume or write throughput**; choose replication when it is **read volume or availability**. Most real systems eventually need both.

> Single server deserves more respect than it usually gets: distribution introduces consistency problems that vanish entirely if the data fits on one machine.

### Example

Cassandra shards data by partition key across the ring **and** replicates each partition to three nodes. Any node can serve a read, any can accept a write, and losing a machine costs neither data nor availability.
$md$, 8, false),

  (sid, 2, 'Explain Sharding and its role in distributing data.', $md$
**Sharding** (horizontal partitioning) splits a dataset across multiple machines so that each holds a **different subset**. It is the primary technique for scaling both data volume and write throughput.

### The Concept

```text
100 million users, one machine -> overwhelmed

SHARDED:
  Shard 1: users   1 - 25,000,000
  Shard 2: users  25,000,001 - 50,000,000
  Shard 3: users  50,000,001 - 75,000,000
  Shard 4: users  75,000,001 - 100,000,000

Each machine holds a quarter of the data and
handles roughly a quarter of the traffic.
```

### Sharding Strategies

**1. Range-Based Sharding**
Rows assigned by key range (A–H, I–P, Q–Z).
* Efficient for range queries
* **Risk of hotspots** — sequential keys such as timestamps send all new writes to one shard

**2. Hash-Based Sharding**
Shard determined by `hash(key) mod N`.
* Excellent even distribution
* **Range queries become impossible** — adjacent keys land on different shards
* Adding a node reshuffles nearly everything

**3. Consistent Hashing**
Keys and nodes are placed on a hash ring; a key belongs to the next node clockwise.
* Adding or removing a node moves only **1/N** of the data, not all of it
* Used by Cassandra and DynamoDB

**4. Directory-Based Sharding**
A lookup service maps keys to shards.
* Maximum flexibility; the directory becomes a bottleneck and single point of failure

### Choosing a Shard Key — the Critical Decision

A good shard key has **high cardinality**, **even distribution**, and matches **common query patterns**.

```text
BAD:  shard by country     -> India shard overwhelmed
BAD:  shard by timestamp   -> all writes hit the newest shard
GOOD: shard by user_id hash -> even spread
```

### Problems Sharding Introduces

| Problem                | Detail                                        |
| ---------------------- | --------------------------------------------- |
| **Cross-shard queries**| Must query every shard and merge results      |
| **No cross-shard joins**| Or they are prohibitively expensive           |
| **No cross-shard transactions** | Atomicity is lost across shards      |
| **Rebalancing**        | Adding nodes means moving data                |
| **Hotspots**           | Uneven access despite even data distribution  |
| **Operational complexity** | Backup, monitoring and recovery per shard |

> The shard key is effectively irreversible — changing it later usually means migrating the entire dataset, so it is the single most consequential design decision in a sharded system.

### Example

An application shards orders by `customer_id`. Queries for one customer's history hit one shard and are fast. A report of "all orders last Tuesday" must query every shard — a query pattern the shard key does not serve, and one that must be handled by a materialized view instead.
$md$, 9, false),

  (sid, 2, 'Explain Master-Slave Replication.', $md$
**Master-slave replication** designates one node as the **master**, which accepts all writes, while one or more **slaves** hold copies and serve reads.

### Architecture

```text
        WRITES
          |
          v
      [ MASTER ]
       /   |   \       replication stream
      v    v    v
   [S1]  [S2]  [S3]
      \    |    /
       READS served here
```

### How It Works

```text
1. Client sends a write to the MASTER
2. Master applies it and records it in a replication log
3. Slaves pull the log and apply the same changes
4. Reads may be served by master or any slave
```

### Advantages

* **Read scalability** — add slaves to handle more read traffic
* **Fault tolerance** — data survives the loss of any single node
* **Read resilience** — if the master fails, reads continue from slaves
* **Analytical isolation** — heavy reporting queries can run on a dedicated slave without affecting production
* **Simple consistency** — one authoritative copy means no write conflicts

### Disadvantages

| Disadvantage             | Detail                                       |
| ------------------------ | -------------------------------------------- |
| **Write bottleneck**     | All writes go through one machine            |
| **Master is a single point of failure** for writes |                        |
| **Replication lag**      | Slaves are momentarily behind                |
| **Failover complexity**  | Promoting a slave is error-prone             |

### Replication Lag and Read-Your-Writes

The most common practical problem:

```text
User posts a comment          -> written to MASTER
Page reloads, read from SLAVE -> replica hasn't caught up
User sees their comment MISSING
```

**Solutions**
* Route reads to the master for a short period after a user's write
* **Session consistency** — pin that user's reads to the master
* Read from the master for critical paths only

### Synchronous vs Asynchronous Replication

| Mode             | Behaviour                          | Trade-off                        |
| ---------------- | ---------------------------------- | -------------------------------- |
| **Synchronous**  | Master waits for slave acknowledgement | Safe, but slower writes       |
| **Asynchronous** | Master returns immediately         | Fast, but data loss possible on master failure |

### Failover

If the master fails, a slave is **promoted**. The danger is **split-brain** — two nodes believing they are master, accepting divergent writes. Preventing this requires consensus (quorum-based election), which is why automatic failover is genuinely difficult.

> Master-slave is the right model when reads greatly outnumber writes — which describes most applications, and is why it remains so common.

### Example

A news site handles 10,000 reads per second and 100 writes. One master plus five slaves serves this comfortably. The same architecture would fail immediately for a write-heavy IoT ingestion workload.
$md$, 10, false),

  (sid, 2, 'Explain Peer-to-Peer Replication.', $md$
In **peer-to-peer replication**, all nodes are equal — every node accepts both reads and writes, and replicates changes to the others. There is no master.

### Architecture

```text
   [N1] <-------> [N2]
     ^ \         / ^
     |  \       /  |
     |   \     /   |
     v    \   /    v
   [N4] <-------> [N3]

ALL nodes accept reads AND writes
```

### Advantages

* **No single point of failure** — losing any node leaves the cluster operational
* **Write scalability** — write load spreads across all nodes
* **High availability** — the cluster survives multiple failures
* **Geographic distribution** — users write to their nearest node
* **No failover procedure** — nothing to promote

### The Central Problem — Write Conflicts

```text
Node 1 receives:  set balance = 500
Node 2 receives:  set balance = 700
   (simultaneously, before replication)

Both are "correct" locally.
Which one wins?
```

This conflict is unavoidable when several nodes accept writes independently.

### Conflict Resolution Strategies

| Strategy                    | Mechanism                                  |
| --------------------------- | ------------------------------------------ |
| **Last Write Wins (LWW)**   | Highest timestamp wins — simple, **can lose data** |
| **Vector clocks**           | Detect concurrency; surface conflicts to the application |
| **CRDTs**                   | Data types that merge automatically without conflict |
| **Application resolution**  | Business logic decides                      |
| **Quorum writes**           | Prevent conflicts by requiring agreement    |

**CRDTs (Conflict-free Replicated Data Types)** are the most elegant solution — structures such as counters and sets designed so that any merge order yields the same result, eliminating conflicts by construction rather than resolving them afterwards.

### Quorum-Based Consistency

```text
N = number of replicas
W = nodes that must acknowledge a WRITE
R = nodes that must respond to a READ

If  W + R > N  ->  strong consistency guaranteed
```

Tuning W and R trades consistency against latency:

```text
N=3, W=3, R=1  -> slow writes, fast reads, strongly consistent
N=3, W=1, R=1  -> fast everything, eventually consistent
N=3, W=2, R=2  -> balanced, still strongly consistent
```

### Master-Slave vs Peer-to-Peer

| Aspect          | Master-Slave     | Peer-to-Peer      |
| --------------- | ---------------- | ----------------- |
| Write scaling   | **No**           | **Yes**           |
| Write conflicts | **None**         | **Possible**      |
| Failover needed | Yes              | **No**            |
| Complexity      | Lower            | **Higher**        |

> Peer-to-peer buys availability and write throughput by accepting conflicts — the quorum settings are where an engineer decides how much consistency to buy back.

### Example

Cassandra replicates each partition to three nodes, any of which accepts writes. An application needing strong consistency sets W=2, R=2 (since 2+2 > 3); one needing maximum speed sets W=1, R=1 and accepts eventual consistency.
$md$, 11, false),

  (sid, 2, 'Explain the relationship between Sharding and Replication.', $md$
Sharding and replication solve **different problems** and are almost always used **together** in production systems.

### What Each Solves

```text
SHARDING:    splits DIFFERENT data across nodes
             -> scales VOLUME and WRITE throughput
             -> provides NO redundancy

REPLICATION: copies the SAME data to several nodes
             -> provides REDUNDANCY and read scaling
             -> provides NO volume scaling
```

Used alone, each leaves a critical gap: sharding alone means a node failure loses data permanently; replication alone means every node must hold the entire dataset.

### Combining Them

```text
Shard A  ->  replicas on nodes 1, 2, 3
Shard B  ->  replicas on nodes 4, 5, 6
Shard C  ->  replicas on nodes 7, 8, 9

Each shard holds 1/3 of the data (sharding)
Each shard exists in 3 copies (replication)
```

This is the standard production architecture: **shard for scale, replicate for safety**.

### The Two Combinations

**Sharding + Master-Slave Replication**

```text
Shard A: master A + slaves A1, A2
Shard B: master B + slaves B1, B2
```
Each shard has its own master, so **write load is distributed across masters** while each shard retains simple single-master consistency. Used by MongoDB.

**Sharding + Peer-to-Peer Replication**

```text
Ring of nodes; each key hashes to a position
Each key is replicated to the next N nodes clockwise
```
No masters at all. Used by Cassandra and DynamoDB.

### Replication Factor

```text
RF = 3 means each piece of data exists on 3 nodes

Storage required = data size x RF
Failures tolerated = RF - 1
```

RF=3 is the near-universal default: it tolerates two simultaneous failures while tripling storage — a widely accepted balance.

### Trade-offs of Combining

| Benefit                    | Cost                                   |
| -------------------------- | -------------------------------------- |
| Scales volume **and** reads| Storage multiplied by RF               |
| Survives node failure      | Write amplification (RF copies written)|
| No single point of failure | Significant operational complexity     |
| Geographic distribution    | Cross-datacentre latency               |

> The rule worth remembering: **sharding is about capacity, replication is about survival** — neither substitutes for the other.

### Example

A cluster of 9 nodes with 3 shards and RF=3 holds 3× the raw data size, tolerates losing 2 nodes per shard, and distributes both reads and writes. Losing an entire shard's three nodes simultaneously is the only scenario that causes data loss — which is why replicas are placed in different racks or availability zones.
$md$, 12, false),

  (sid, 2, 'Explain Consistency in distributed NoSQL databases.', $md$
**Consistency** concerns whether all clients see the same data at the same time. In distributed systems it becomes a spectrum of guarantees rather than a single property.

### Types of Consistency Problems

**1. Write-Write Conflict**
Two clients update the same item simultaneously on different nodes. Without coordination, one update may be silently lost.

**2. Read-Write Inconsistency (Inconsistent Read)**
A client reads data mid-update and sees a state that never logically existed.

```text
Transfer ₹1000 from A to B

Read at the wrong instant:
   A already debited, B not yet credited
   -> ₹1000 has vanished from the reader's view
```

### Levels of Consistency

| Level                    | Guarantee                                    |
| ------------------------ | -------------------------------------------- |
| **Strong**               | Every read returns the most recent write     |
| **Sequential**           | All nodes see operations in the same order   |
| **Causal**               | Causally related operations are seen in order|
| **Read-your-writes**     | You always see your own updates              |
| **Monotonic reads**      | You never see data go backwards              |
| **Eventual**             | Replicas converge if updates stop            |

### The CAP Theorem

A distributed store can provide at most **two** of:

```text
C  Consistency          — every read sees the latest write
A  Availability         — every request receives a response
P  Partition tolerance  — works despite network splits
```

Since **partitions will happen**, P is not optional. The real choice is:

```text
CP systems: refuse requests rather than serve stale data
            (HBase, MongoDB in default configuration)

AP systems: always respond, accept temporary inconsistency
            (Cassandra, DynamoDB, Riak)
```

### Quorum-Based Tuning

```text
W + R > N  ->  strong consistency
```

with N replicas, W write acknowledgements and R read responses. This lets consistency be chosen **per operation** rather than fixed for the whole database — a critical practical capability.

### The PACELC Extension

CAP describes behaviour only during partitions. **PACELC** completes the picture:

```text
If Partition:   choose Availability or Consistency
Else (normal):  choose Latency or Consistency
```

This matters because the latency-versus-consistency trade applies **all the time**, not only during failures.

> Eventual consistency is often misunderstood as "sometimes wrong". It means replicas converge **once updates stop** — an entirely reasonable guarantee for a social feed, and an unacceptable one for a bank balance.

### Example

A shopping cart uses eventual consistency — briefly showing a stale item count is harmless. The payment step uses a strong-consistency quorum, because charging twice or losing a payment is not.
$md$, 13, false),

  (sid, 2, 'Explain the concept of Relaxing Consistency and why it may be required.', $md$
**Relaxing consistency** means deliberately accepting weaker guarantees in exchange for **availability, performance and scalability**. It is a design decision, not a defect.

### Why It Becomes Necessary

**1. The CAP Theorem Forces a Choice**
During a network partition a system must either refuse requests (preserving consistency) or serve possibly-stale data (preserving availability). There is no third option.

**2. Latency Cost of Strong Consistency**

```text
Strong consistency across regions:

Mumbai write -> must be confirmed in Virginia
                round trip ~250 ms
-> every write pays that latency

Relaxed: acknowledge locally in 5 ms, replicate in background
```

**3. Availability Requirements**
An e-commerce site that refuses orders during a partition loses revenue; one that accepts them and reconciles later does not.

**4. Scale**
Coordinating every write across every replica does not scale to global systems.

### The BASE Model

```text
BA  Basically Available   — always responds
S   Soft state            — state may change without input
E   Eventually consistent — converges over time
```

The deliberate opposite of ACID, and appropriate for a different class of problem.

### When Relaxing Is Acceptable

| Application            | Consistency needed | Reasoning                     |
| ---------------------- | ------------------ | ----------------------------- |
| Social media feed      | **Eventual**       | A post appearing late is fine |
| Product view counter   | **Eventual**       | Approximate is sufficient     |
| Shopping cart          | Eventual + merge   | Conflicts can be merged       |
| **Bank balance**       | **Strong**         | Money must not be lost        |
| **Inventory (last item)** | **Strong**      | Overselling has real cost     |
| **Seat booking**       | **Strong**         | Double-booking is unacceptable|

### Techniques for Managing Relaxed Consistency

* **Quorum tuning** — set W and R per operation
* **Conflict resolution** — LWW, vector clocks, CRDTs
* **Compensating transactions** — undo afterwards rather than prevent
* **Saga pattern** — a sequence of local transactions with compensations
* **Idempotent operations** — safe to apply more than once

### The Business Framing

The right question is not technical but economic:

```text
What does temporary inconsistency COST here?

Amazon's finding: even 100 ms of added latency
measurably reduced sales — which is why their
cart tolerates conflicts and merges them instead.
```

> Relaxed consistency is the correct default for most user-facing features and the wrong default for anything involving money or scarce inventory — and mature systems apply both within the same application.

### Example

A social platform shows a like count that may be seconds stale — nobody is harmed. The same platform processes advertising payments with full transactional consistency, because a lost charge is a real financial loss.
$md$, 14, false),

  (sid, 2, 'Explain Version Stamps and their role in maintaining data consistency.', $md$
A **version stamp** is a marker attached to a data item that changes every time the item is updated. It allows a system to detect whether data has been modified since it was read — the basis of conflict detection without locking.

### The Problem It Solves — Lost Updates

```text
Alice reads balance = 1000
Bob   reads balance = 1000
Alice writes 1000 + 500 = 1500
Bob   writes 1000 - 200 =  800

Alice's deposit is LOST.
```

### How Version Stamps Prevent This

```text
Alice reads (balance=1000, version=7)
Bob   reads (balance=1000, version=7)

Alice writes: "set 1500 IF version is still 7"  -> OK, version becomes 8
Bob   writes: "set  800 IF version is still 7"  -> version is now 8
                                                 -> REJECTED
Bob must re-read and retry.
```

This is **optimistic concurrency control** — no locks are held; conflicts are detected at write time.

### Implementations of Version Stamps

| Method               | Mechanism                                 | Note                         |
| -------------------- | ----------------------------------------- | ---------------------------- |
| **Counter**          | Increment on each update                  | Simple; needs a single authority |
| **GUID**             | New random identifier per update          | No coordination; cannot be ordered |
| **Content hash**     | Hash of the data                          | Deterministic; no coordination |
| **Timestamp**        | Time of last update                       | Requires synchronised clocks — risky |
| **Composite**        | Combination of the above                  | Common in practice           |

Timestamps are the most tempting and the most dangerous: clock skew between nodes causes updates to be silently discarded.

### Version Vectors for Peer-to-Peer Systems

A single counter is insufficient when multiple nodes accept writes. A **version vector** holds one counter per node:

```text
Node A: [A:2, B:1]
Node B: [A:1, B:2]

Neither dominates -> CONCURRENT updates -> genuine conflict
```

This detects concurrency **precisely**, distinguishing a real conflict from a simple overwrite — exactly the property a plain counter lacks.

### Roles in Maintaining Consistency

* **Conflict detection** in replicated systems
* **Optimistic locking** without blocking readers
* **Cache validation** — HTTP `ETag` is a version stamp
* **Replication** — identifying which changes a replica lacks
* **Idempotency** — recognising and discarding duplicate operations

> Version stamps make **optimistic** concurrency possible: rather than preventing conflicts by locking, they detect them cheaply and let the application decide what to do.

### Example

An HTTP API returns `ETag: "a7f3"` with a resource. The client's update sends `If-Match: "a7f3"`. If another client has modified it, the server returns **412 Precondition Failed** — the same mechanism, standardised into the web.
$md$, 15, false),

  (sid, 2, 'Explain the Map-Reduce programming model.', $md$
**MapReduce** is a programming model for processing large datasets in parallel across a distributed cluster. The programmer writes two functions — **map** and **reduce** — and the framework handles distribution, parallelism, fault tolerance and data movement.

### The Two Functions

```text
MAP:     (input key, input value)  ->  list of (intermediate key, value)
REDUCE:  (intermediate key, list of values)  ->  list of output values
```

### The Full Pipeline

```text
INPUT -> SPLIT -> MAP -> SHUFFLE & SORT -> REDUCE -> OUTPUT
```

**1. Split** — input divided into chunks, one per map task
**2. Map** — each chunk processed in parallel, emitting key-value pairs
**3. Shuffle and Sort** — the framework groups all values by key and routes them to reducers
**4. Reduce** — each key's values are aggregated
**5. Output** — results written to distributed storage

The **shuffle** is the part programmers do not write and the part that dominates performance — it moves data across the network between every map and reduce phase.

### Word Count — the Canonical Example

```text
INPUT: "the cat sat" / "the cat ran"

MAP:
   (the,1) (cat,1) (sat,1)
   (the,1) (cat,1) (ran,1)

SHUFFLE & SORT:
   (cat,[1,1])  (ran,[1])  (sat,[1])  (the,[1,1])

REDUCE:
   (cat,2) (ran,1) (sat,1) (the,2)
```

### Why It Scales

* **Map tasks are independent** — perfectly parallel, no coordination
* **Data locality** — computation is sent to the node holding the data
* **Automatic fault tolerance** — a failed task is simply re-executed elsewhere
* **Automatic parallelism** — the programmer writes sequential logic

### Limitations

| Limitation             | Detail                                          |
| ---------------------- | ----------------------------------------------- |
| **Disk-based**         | Each stage writes to disk — slow                |
| **Poor for iteration** | Machine learning re-reads data every iteration  |
| **High latency**       | Batch-oriented; unsuitable for interactive queries |
| **Rigid model**        | Not every algorithm fits map-then-reduce        |
| **Shuffle cost**       | Network transfer often dominates runtime        |

Iterative algorithms suffer worst: an algorithm running 100 iterations reads and writes the full dataset 100 times, which is why **Spark**, keeping data in memory between iterations, achieves order-of-magnitude speedups.

> MapReduce's lasting contribution is conceptual: it showed that if a computation can be expressed as independent map tasks plus a grouped aggregation, the framework can handle distribution entirely on the programmer's behalf.

### Example

Counting word frequency in 10 TB of documents is impossible on one machine. Split across 200 nodes, each maps its own chunk locally, the framework shuffles by word, and reducers total the counts — hours of work reduced to minutes.
$md$, 16, false),

  (sid, 2, 'Explain Partitioning and Combining in Map-Reduce.', $md$
**Partitioning** and **combining** are the two optimisation mechanisms that sit between map and reduce, and together they determine how much data crosses the network.

### Partitioning — Deciding Which Reducer Gets Which Key

```text
Default:  partition = hash(key) mod numberOfReducers

  (the,1) -> hash -> reducer 0
  (cat,1) -> hash -> reducer 1
  (sat,1) -> hash -> reducer 0
```

**The guarantee**: all values for the same key reach the **same reducer**. Without this, a reducer would see only a fraction of a key's values and produce wrong results.

**Custom partitioners** are used when the default distribution is poor:

```text
Problem: partitioning URLs by full URL
         -> one popular domain floods one reducer

Solution: custom partitioner distributing by domain hash
```

**Data skew** is the classic failure: if one key holds 60% of the records, one reducer does 60% of the work while the others idle, and the job takes as long as its slowest reducer.

### Combining — Local Pre-Aggregation

A **combiner** is a mini-reducer that runs on the **map node**, before the shuffle.

```text
WITHOUT COMBINER:
  Map output: (the,1)(the,1)(the,1)(the,1)(the,1)
  -> 5 records shuffled across the network

WITH COMBINER:
  Combiner locally: (the,5)
  -> 1 record shuffled
```

For word count over a large document set, this can reduce shuffle traffic by orders of magnitude — and since shuffle is usually the bottleneck, that translates directly into runtime.

### The Critical Restriction on Combiners

A combiner may only be used when the reduce function is **commutative and associative**.

```text
SAFE:    sum, count, max, min
         sum(1,2,3) == sum(sum(1,2),3)

UNSAFE:  AVERAGE
         avg(avg(1,2), 3) = avg(1.5,3) = 2.25
         avg(1,2,3)                    = 2.0     WRONG
```

Averages must instead emit (sum, count) pairs and divide only in the final reducer — a standard exam point.

The framework may run a combiner **zero, once or many times**, so it must never change the result.

### Comparison

| Aspect    | Partitioner                  | Combiner                        |
| --------- | ---------------------------- | ------------------------------- |
| Runs on   | Map side, after map          | Map side, before shuffle        |
| Purpose   | Route keys to reducers       | Reduce data volume              |
| Mandatory | Yes (default provided)       | **No — purely an optimisation** |
| Affects correctness | Yes — wrong routing breaks results | **Must not**       |

> The rule to remember: a combiner is an optimisation the framework is free to skip, so any logic whose correctness depends on it running is already wrong.

### Example

A job counting page views by URL used the default partitioner and one reducer took 40 minutes while nine finished in 2. A custom partitioner spreading the dominant domain across reducers brought total runtime to 6 minutes.
$md$, 17, false),

  (sid, 2, 'Explain how Map-Reduce calculations can be composed.', $md$
Many real problems cannot be solved in a single map-reduce pass. **Composition** chains several jobs together so the output of one becomes the input of the next.

### Why Composition Is Needed

```text
Question: "which product has the highest average rating
           among products with more than 100 reviews?"

Job 1: compute count and sum of ratings per product
Job 2: filter to count > 100, compute average, find maximum
```

A single map-reduce pass cannot do this because the filter depends on an aggregate that does not exist until the first job completes.

### Composition Patterns

**1. Sequential Chaining (Pipelining)**

```text
Job1 -> output1 -> Job2 -> output2 -> Job3 -> final
```
The simplest and most common pattern.

**2. Map-Only Jobs**
Some steps need no reduction — filtering, formatting, enrichment. Skipping the reduce phase avoids the expensive shuffle entirely.

**3. Chained Mappers**
Several map functions applied in sequence within one job, avoiding intermediate disk writes.

**4. Parallel Jobs Joined**

```text
Job A ---\
          +--> Job C (combines both)
Job B ---/
```

**5. Iterative Jobs**
The same job repeated until convergence — PageRank, k-means clustering.

```text
repeat until converged:
    run map-reduce
    feed output back as input
```

This is where MapReduce performs worst, since every iteration re-reads and re-writes the entire dataset from disk.

### Joins in MapReduce

Since there is no JOIN operator, joins must be composed manually:

| Join type          | Approach                                          |
| ------------------ | ------------------------------------------------- |
| **Reduce-side join** | Both datasets mapped with the join key; reducer combines. General but shuffle-heavy |
| **Map-side join**  | One dataset small enough to hold in memory; no shuffle at all. Much faster when applicable |
| **Broadcast join** | Small dataset distributed to every mapper         |

### Practical Difficulties

* **Intermediate storage** — every stage writes to HDFS, consuming space and time
* **Cumulative latency** — each job has startup overhead
* **Failure recovery** — a failure late in a chain may require re-running earlier stages
* **Orchestration** — dependencies must be managed by tools such as **Oozie**, **Airflow** or **Azkaban**

### Why Higher-Level Tools Emerged

Writing and chaining raw MapReduce jobs is laborious, which is precisely why **Hive** (SQL), **Pig** (dataflow scripting) and **Spark** (in-memory DAG execution) were created. Spark in particular optimises the whole chain as a single execution graph and keeps intermediate results in memory, eliminating most of the disk cost composition incurs.

> Composition is where MapReduce's simplicity becomes its weakness: the model is elegant for one pass and awkward for the multi-stage pipelines real analysis requires.

### Example

Computing PageRank over a web graph requires roughly 30 iterations. In MapReduce each iteration re-reads the full graph from disk, taking hours. Spark holds the graph in memory across iterations and completes the same computation in minutes — the difference is entirely in how composition is handled.
$md$, 18, false);

  RAISE NOTICE 'Big Data Analytics — Unit 2: 18 questions inserted.';
END $do$;
