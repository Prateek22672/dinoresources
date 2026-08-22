-- =====================================================================
-- Study-With-AI seed — Social Network Analysis (4th Year) — UNITS 1 & 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Social Network Analysis' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Social Network Analysis" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number IN (1,2) AND question IN (
    'Explain Social Network Analysis and the concept of network analysis.',
    'Explain the development and evolution of Social Network Analysis.',
    'Explain the key concepts used in Social Network Analysis.',
    'Explain the important measures used in network analysis.',
    'Explain Electronic Discussion Networks as a source of network data.',
    'Explain Blogs and Online Communities as electronic sources for network analysis.',
    'Explain Web-Based Networks and their role in network analysis.',
    'Explain the mathematical representation of social networks using Networks and Graphs.',
    'Explain Degree in a network with an example.',
    'Explain Average Degree and its significance.',
    'Explain Degree Distribution in a network.',
    'Explain the Adjacency Matrix representation of a network with an example.',
    'Explain why real networks are sparse.',
    'Explain Weighted Networks with suitable examples.',
    'Explain Bipartite Networks with suitable examples.',
    'Explain Paths and Distances in a network.',
    'Explain Connectedness in networks.',
    'Explain the Clustering Coefficient and its significance in network analysis.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain Social Network Analysis and the concept of network analysis.', $md$
**Social Network Analysis (SNA)** studies social structures using **networks and graph theory**. Its defining idea is that the **relationships between actors** explain behaviour and outcomes better than the attributes of the actors themselves.

### The Core Shift in Perspective

```text
Traditional analysis:  study ATTRIBUTES
                       age, income, education of individuals

Network analysis:      study RELATIONSHIPS
                       who is connected to whom, and how
```

An individual's opportunities may depend less on their qualifications than on their **position** in a network of contacts.

### Basic Elements

* **Nodes (actors/vertices)** — people, organisations, computers, web pages
* **Edges (ties/links)** — friendships, communication, citation, hyperlinks
* **Network (graph)** — the complete structure of nodes and edges

### Types of Ties

| Tie type       | Example                        |
| -------------- | ------------------------------ |
| **Directed**   | A follows B (not necessarily mutual) |
| **Undirected** | A and B are friends            |
| **Weighted**   | Number of messages exchanged   |
| **Signed**     | Positive (friend) or negative (rival) |

### Levels of Analysis

* **Node level** — how central or influential is an individual?
* **Dyad level** — properties of a pair
* **Triad level** — triangles and balance
* **Subgroup level** — communities and cliques
* **Network level** — density, diameter, overall structure

### Applications

* Identifying influencers for marketing
* Tracing disease transmission in epidemiology
* Detecting criminal and terrorist networks
* Recommending friends and content
* Studying organisational communication
* Analysing citation and collaboration in research

> Network analysis reframes the question from *what is this person like?* to *where does this person sit?* — and for many outcomes, position matters more.

### Example

Two employees have identical qualifications. One sits between two departments that otherwise do not communicate; the other sits inside a tightly-knit group. The first hears of opportunities first and is more likely to be promoted — a difference invisible to attribute-based analysis.
$md$, 1, true),

  (sid, 1, 'Explain the development and evolution of Social Network Analysis.', $md$
Social Network Analysis emerged from the convergence of three independent traditions — **sociometry**, **anthropology** and **graph theory** — before being transformed by computing and the internet.

### The Historical Phases

**1. Foundations (1930s) — Sociometry**
**Jacob Moreno** introduced the **sociogram**, a diagram of interpersonal choices, and coined *sociometry*. This was the first systematic attempt to *draw* social structure rather than describe it.

**2. Graph Theory Foundations (1930s–1950s)**
Mathematicians formalised graphs; **Erdős and Rényi** developed **random graph theory** in 1959, providing a mathematical baseline against which real networks could be compared.

**3. The Harvard and Manchester Schools (1950s–1970s)**
Anthropologists studied kinship and community structures. **Harrison White** and colleagues at Harvard developed **blockmodelling** and structural equivalence, establishing SNA as a rigorous discipline.

**4. The Strength of Weak Ties (1973)**
**Mark Granovetter** showed that **weak ties** — acquaintances rather than close friends — are more useful for finding jobs, because they bridge otherwise separate clusters and carry **new** information.

**5. Structural Holes (1992)**
**Ronald Burt** argued that advantage comes from spanning **structural holes** — gaps between groups — giving brokerage power.

**6. The Network Science Era (1998–onwards)**
* **Watts and Strogatz (1998)** — **small-world networks**: high clustering with short path lengths
* **Barabási and Albert (1999)** — **scale-free networks** with power-law degree distributions, formed by **preferential attachment** ("the rich get richer")

**7. The Big Data Era (2000s–present)**
Online platforms produce network data at unprecedented scale, enabling analysis of millions of nodes.

| Era        | Key contribution              | Figure           |
| ---------- | ----------------------------- | ---------------- |
| 1930s      | Sociograms                    | Moreno           |
| 1959       | Random graphs                 | Erdős–Rényi      |
| 1973       | Weak ties                     | Granovetter      |
| 1992       | Structural holes              | Burt             |
| 1998       | Small-world                   | Watts–Strogatz   |
| 1999       | Scale-free, preferential attachment | Barabási–Albert |

> The field's turning point was the discovery that real networks are **not** random — they have hubs, clustering and short paths that random models cannot produce.

### Example

Granovetter's finding that most people find jobs through acquaintances rather than close friends reversed the intuition that strong relationships are most valuable — because close friends know the same openings you already know about.
$md$, 2, false),

  (sid, 1, 'Explain the key concepts used in Social Network Analysis.', $md$
SNA rests on a vocabulary of structural concepts that describe positions, groups and the shape of relationships.

### Structural Concepts

**1. Centrality** — how important or well-positioned a node is
**2. Density** — the proportion of possible ties that actually exist

```text
Density = 2E / [N(N-1)]      for an undirected network
```

**3. Cohesion** — how tightly connected a group is
**4. Clique** — a maximal subset in which every pair is directly connected
**5. Component** — a maximal connected subgraph
**6. Bridge** — an edge whose removal disconnects the network
**7. Structural hole** — a gap between two groups; whoever spans it gains **brokerage** power
**8. Homophily** — the tendency to connect with similar others ("birds of a feather")
**9. Reciprocity** — the extent to which directed ties are mutual
**10. Transitivity** — the tendency for a friend of a friend to be a friend

### Tie Strength

| Type            | Characteristics                     | Value                    |
| --------------- | ----------------------------------- | ------------------------ |
| **Strong ties** | Frequent, emotionally close         | Support, trust           |
| **Weak ties**   | Infrequent, acquaintances           | **New information**      |

Granovetter's insight is that weak ties are **more** valuable for information because they reach beyond your own cluster, where everyone already knows what you know.

### Positional Concepts

* **Isolate** — a node with no ties
* **Star / hub** — a node with many ties
* **Broker / gatekeeper** — a node connecting otherwise separate groups
* **Periphery** — nodes on the network's edge

### Network-Level Properties

* **Small-world effect** — short average path lengths despite high clustering
* **Scale-free structure** — a few hubs with very many connections, most nodes with few
* **Preferential attachment** — new nodes attach preferentially to already well-connected nodes

> Structural holes and weak ties describe the same advantage from two angles: value accrues to whoever connects groups that are not otherwise connected.

### Example

In a company network, an employee with fewer total contacts but who is the **only** link between engineering and sales holds more brokerage power than a colleague with twice as many contacts inside a single department.
$md$, 3, false),

  (sid, 1, 'Explain the important measures used in network analysis.', $md$
Network measures quantify structure at the level of individual nodes and of the whole network.

### Centrality Measures

**1. Degree Centrality** — the number of direct connections.

```text
C_D(v) = deg(v) / (N - 1)      normalised
```
Identifies **locally popular** nodes. In directed networks, **in-degree** measures prestige and **out-degree** measures gregariousness.

**2. Betweenness Centrality** — how often a node lies on shortest paths between others.

```text
C_B(v) = sum over s!=v!=t of  sigma_st(v) / sigma_st
```
Identifies **brokers and gatekeepers** — nodes that control information flow. Removing them fragments the network.

**3. Closeness Centrality** — the inverse of the average distance to all other nodes.

```text
C_C(v) = (N - 1) / sum of d(v, u)
```
Identifies nodes that can **reach everyone quickly** — ideal for spreading information.

**4. Eigenvector Centrality** — importance weighted by the importance of one's neighbours. Being connected to well-connected nodes counts for more. **PageRank** is a directed variant.

### Comparing the Centralities

| Measure     | Answers                          | Finds          |
| ----------- | -------------------------------- | -------------- |
| Degree      | How many do I know?              | Popular nodes  |
| Betweenness | Do others go through me?         | Brokers        |
| Closeness   | How fast can I reach everyone?   | Efficient spreaders |
| Eigenvector | Are my contacts important?       | Élite nodes    |

### Network-Level Measures

* **Density** — actual ties ÷ possible ties
* **Diameter** — the longest shortest path in the network
* **Average path length** — mean distance between node pairs
* **Clustering coefficient** — how often neighbours are themselves connected
* **Centralisation** — how much the network revolves around a few nodes
* **Modularity** — the strength of community structure

> The four centralities frequently disagree, and that disagreement is informative: a node high in betweenness but low in degree is a bridge, not a celebrity.

### Example

In a terrorist network, the leader may have **low degree centrality** (few direct contacts, for security) but **high betweenness** — every message passes through them. Targeting by degree alone would miss the most critical node.
$md$, 4, false),

  (sid, 1, 'Explain Electronic Discussion Networks as a source of network data.', $md$
**Electronic discussion networks** are networks constructed from digital communication — email, forums, mailing lists, newsgroups and messaging platforms. They are among the richest sources of empirical network data.

### How the Network Is Constructed

```text
Nodes = participants (email addresses, user accounts)
Edges = communication events
        A sends an email to B  ->  directed edge A -> B
        Edge weight = number of messages exchanged
```

### Sources

* **Email archives** — corporate and public
* **Mailing lists** — open-source projects, academic groups
* **Usenet newsgroups** — historical, threaded discussions
* **Web forums and message boards** — reply structures give explicit edges
* **Instant messaging and chat**

### The Enron Email Dataset

The canonical example: roughly **500,000 emails** among **150 senior employees**, released publicly during the fraud investigation. It remains the most-studied electronic discussion network because it is real, complete, and includes a known organisational hierarchy for validation.

Findings from such data include the discovery that informal communication structures often differ sharply from the official organisational chart.

### Advantages

* **Automatically recorded** — no survey bias or recall error
* **Large scale** — millions of interactions
* **Longitudinal** — timestamps allow the network's evolution to be tracked
* **Content available** — text can be analysed alongside structure
* **Unobtrusive** — behaviour is not altered by being observed

### Limitations

| Limitation           | Consequence                              |
| -------------------- | ---------------------------------------- |
| Privacy and ethics   | Consent is often impossible to obtain    |
| Incomplete data      | Only one platform is captured            |
| Ambiguous ties       | Does one email constitute a relationship? |
| Spam and automation  | Bots create spurious edges               |
| Multiple identities  | One person, several accounts             |

### Analytical Uses

* Identifying informal leaders who differ from formal managers
* Detecting communities and departmental silos
* Tracking information diffusion
* Fraud and anomaly detection

> The **threshold problem** is central: deciding how many messages constitute a tie changes the network's structure entirely, and there is no objectively correct answer.

### Example

Analysis of the Enron network revealed communication spikes and unusual clustering in the weeks preceding the scandal's disclosure — patterns that emerged from **structure and timing** alone, without reading a single message.
$md$, 5, false),

  (sid, 1, 'Explain Blogs and Online Communities as electronic sources for network analysis.', $md$
**Blogs and online communities** provide network data through explicit links, comments, memberships and interactions. Unlike email, these networks are largely **public**, which removes many of the ethical obstacles.

### Constructing Networks from Blogs

```text
Nodes = blogs or bloggers
Edges = hyperlinks between posts
        blogroll links (persistent endorsement)
        citations in posts
        comments and trackbacks
```

The resulting structure is the **blogosphere**.

### Constructing Networks from Online Communities

* **Membership networks** — users linked by shared group membership (a **bipartite** structure)
* **Interaction networks** — replies, mentions, likes
* **Friendship networks** — explicit connections declared by users
* **Co-participation networks** — users active in the same threads

### Notable Findings

**Political polarisation** — Adamic and Glance's study of political blogs during the 2004 US election found that liberal and conservative blogs formed **two densely connected clusters with very few links between them** — an early empirical demonstration of the echo chamber, established purely from link structure.

### Characteristics of These Networks

| Property                | Typical observation                    |
| ----------------------- | -------------------------------------- |
| Degree distribution     | **Power law** — a few hugely popular blogs |
| Clustering              | High — communities form around topics  |
| Reciprocity             | Low — popular blogs rarely link back   |
| Growth                  | Preferential attachment                |

### Advantages

* **Publicly available**, reducing ethical concerns
* **Explicit links** — no inference needed about who is connected
* Rich **text content** alongside structure
* **Timestamps** allow temporal analysis
* Large scale

### Limitations

* **Link ≠ agreement** — a link may be a criticism rather than an endorsement
* **Sampling difficulty** — the blogosphere has no complete directory
* **Link decay** — URLs disappear over time
* **Spam blogs (splogs)** create artificial structure
* **Activity bias** — active users are overrepresented

> Because a hyperlink is a deliberate, public act, blog networks give an unusually clean signal of *attention* — though not necessarily of approval.

### Example

Analysing links between technology blogs reveals hub blogs that others consistently cite, and distinct communities around different programming languages — communities that were never formally organised but are clearly visible in the link structure.
$md$, 6, false),

  (sid, 1, 'Explain Web-Based Networks and their role in network analysis.', $md$
**Web-based networks** treat the World Wide Web itself as a network: **web pages are nodes** and **hyperlinks are directed edges**. It is the largest network ever studied empirically.

### Structure

```text
Nodes = web pages (or whole websites)
Edges = hyperlinks, DIRECTED

page A --link--> page B    means A points to B,
                           not necessarily the reverse
```

* **In-degree** — how many pages link *to* this page (a measure of authority)
* **Out-degree** — how many pages this page links *out* to

### The Bow-Tie Structure

Broder et al. analysed 200 million pages and found the web has a characteristic shape:

```text
        +-------+     +---------+     +--------+
  IN -->|       | --> |  SCC    | --> |        |--> OUT
        +-------+     | (core)  |     +--------+
                      +---------+
        tendrils and disconnected components
```

| Component | Meaning                                          | Share |
| --------- | ------------------------------------------------ | ----- |
| **SCC**   | Strongly connected core — any page reaches any other | ~28% |
| **IN**    | Can reach the core, not reachable from it        | ~21%  |
| **OUT**   | Reachable from the core, cannot reach back       | ~21%  |
| Tendrils / disconnected | Neither                            | ~30%  |

### Link Analysis Algorithms

**PageRank** — a page is important if important pages link to it. Importance flows along links recursively, modelling a random surfer who occasionally jumps to a random page.

**HITS (Hubs and Authorities)** — distinguishes two roles:
* **Authorities** — pages with valuable content, linked to by many hubs
* **Hubs** — pages that link to many good authorities

The two reinforce each other, computed iteratively.

### Properties of the Web Graph

* **Scale-free** — degree follows a power law
* **Small-world** — average path length of roughly 19 clicks
* **High clustering** — topically related pages link to each other
* **Continuously evolving**

### Role in Network Analysis

* Foundation of **search engine ranking**
* **Spam detection** through anomalous link patterns
* **Community detection** by topic
* Validating theories of network growth at massive scale

> The web's importance to network science is that it made theories testable at a scale no survey could ever reach.

### Example

PageRank turned link structure into commercial value: rather than counting keywords, Google treated each hyperlink as a vote weighted by the voter's own importance — a purely structural insight that reshaped the industry.
$md$, 7, false),

  (sid, 2, 'Explain the mathematical representation of social networks using Networks and Graphs.', $md$
A social network is represented mathematically as a **graph** — a pair **G = (V, E)** where **V** is a set of vertices and **E** a set of edges.

### Basic Notation

```text
G = (V, E)

V = {v1, v2, ..., vN}      N = |V| = number of nodes
E = {e1, e2, ..., eL}      L = |E| = number of edges
```

### Types of Graphs

**Undirected graph** — edges have no direction; the relationship is mutual.

```text
A --- B        edge (A,B) is identical to (B,A)
```

**Directed graph (digraph)** — edges have direction.

```text
A --> B        edge (A,B) is NOT the same as (B,A)
```

**Weighted graph** — each edge carries a numeric value.

```text
A --5-- B      weight 5 = strength, frequency or capacity
```

### Maximum Number of Edges

| Graph type  | Maximum edges |
| ----------- | ------------- |
| Undirected  | N(N−1)/2      |
| Directed    | N(N−1)        |

A **complete graph** has every possible edge present.

### Representations

**1. Adjacency matrix** — an N × N matrix where `A[i][j] = 1` if an edge exists.
**2. Adjacency list** — for each node, a list of its neighbours.
**3. Edge list** — a simple list of pairs.

| Representation   | Space   | Best for            |
| ---------------- | ------- | ------------------- |
| Adjacency matrix | O(N²)   | Dense networks      |
| Adjacency list   | O(N+L)  | **Sparse networks** |
| Edge list        | O(L)    | Simple storage      |

Since real social networks are sparse, adjacency lists are almost always preferred in practice.

### Other Graph Types

* **Simple graph** — no self-loops or multiple edges
* **Multigraph** — multiple edges permitted between the same pair
* **Bipartite graph** — nodes fall into two sets; edges only cross between them
* **Signed graph** — edges labelled positive or negative

> Choosing the representation is a practical decision with real consequences: an adjacency matrix for a million-node network needs 10¹² entries, almost all of them zero.

### Example

A friendship network of 5 people is an undirected graph; a Twitter follow network is directed; a phone-call network weighted by call duration is a weighted directed graph. Each choice determines which analyses are meaningful.
$md$, 8, true),

  (sid, 2, 'Explain Degree in a network with an example.', $md$
The **degree** of a node is the **number of edges** connected to it — the most fundamental measure of a node's local importance.

### Undirected Networks

```text
k_i = degree of node i = number of edges attached to i
```

```text
      B
      |
A --- C --- D
      |
      E

k_A = 1    k_B = 1    k_C = 4    k_D = 1    k_E = 1
```

Node C is a **hub**; the others are peripheral.

### Directed Networks

Each node has two degrees:

```text
k_in    = in-degree  = edges pointing TO the node
k_out   = out-degree = edges pointing FROM the node
k_total = k_in + k_out
```

```text
A --> C        C: in-degree = 2, out-degree = 1
B --> C
C --> D
```

**In-degree** indicates **prestige or popularity**; **out-degree** indicates **activity or sociability**.

### The Handshaking Lemma

```text
sum of all degrees = 2L        (undirected)
```

Every edge contributes 1 to each of its two endpoints, so the total degree is exactly twice the number of edges. For the example above: 1+1+4+1+1 = 8 = 2 × 4 edges. ✓

For directed networks:

```text
sum of in-degrees = sum of out-degrees = L
```

### Special Cases

| Degree      | Name        | Meaning                       |
| ----------- | ----------- | ----------------------------- |
| k = 0       | **Isolate** | No connections                |
| k = 1       | Pendant     | Connected to exactly one node |
| k = N − 1   | **Universal** | Connected to everyone       |
| Very high k | **Hub**     | Disproportionately connected  |

> Degree is the cheapest centrality to compute and often the least informative — a node may have many connections yet occupy a structurally unimportant position.

### Example

On Twitter, a celebrity has an in-degree of millions and an out-degree of a few hundred. A spam bot shows the reverse — high out-degree, near-zero in-degree. The **ratio** of the two distinguishes influence from noise.
$md$, 9, false),

  (sid, 2, 'Explain Average Degree and its significance.', $md$
The **average degree** ⟨k⟩ is the mean number of connections per node — the simplest summary of how densely connected a network is.

### Formula

**Undirected network**

```text
<k> = (1/N) * sum of k_i  =  2L / N
```

The factor 2 appears because each edge contributes to two nodes' degrees.

**Directed network**

```text
<k_in> = <k_out> = L / N
```

### Worked Example

```text
Network: N = 5 nodes, L = 4 edges

<k> = 2 x 4 / 5 = 1.6

So each node has 1.6 connections on average.
```

### Significance

**1. Measures Overall Connectivity**
A high average degree means a densely connected network where information spreads readily.

**2. Determines the Percolation Threshold**
A critical result from random graph theory:

```text
<k> < 1   ->  network is FRAGMENTED into small components
<k> = 1   ->  critical point; a giant component emerges
<k> > 1   ->  a GIANT COMPONENT spans most of the network
<k> > ln(N) -> network is almost surely fully connected
```

This threshold explains why sparse networks can still be globally connected: an average degree just above 1 is enough for a giant component to form.

**3. Enables Comparison**
Networks of different sizes can be compared meaningfully by average degree.

**4. Relates to Density**

```text
density = <k> / (N - 1)
```

### Typical Values in Real Networks

| Network              | N          | ⟨k⟩    |
| -------------------- | ---------- | ------ |
| Facebook friendships | ~1 billion | ~200   |
| Actor collaboration  | ~200,000   | ~29    |
| Power grid           | ~5,000     | ~2.7   |
| Internet (routers)   | ~200,000   | ~6     |

Note that ⟨k⟩ grows far more slowly than N — the hallmark of sparsity.

> The most striking fact about average degree is how small it is: a network of a billion people holds together on roughly 200 connections each.

### Example

A social network of 1,000 users with ⟨k⟩ = 0.8 would splinter into isolated fragments. Adding enough ties to reach ⟨k⟩ = 1.2 causes a giant component to appear abruptly — a phase transition, not a gradual change.
$md$, 10, false),

  (sid, 2, 'Explain Degree Distribution in a network.', $md$
The **degree distribution** P(k) gives the probability that a randomly chosen node has degree exactly **k**. It is the single most informative statistical description of a network's structure.

### Definition

```text
P(k) = N_k / N

N_k = number of nodes with degree k
N   = total number of nodes

and   sum over all k of P(k) = 1
```

### The Two Fundamental Shapes

**1. Poisson Distribution — Random Networks**

In an Erdős–Rényi random graph, degrees follow a Poisson distribution:

```text
P(k) = e^(-<k>) * <k>^k / k!
```

* Most nodes have degree close to ⟨k⟩
* There is a **characteristic scale** — a typical node
* Very high degrees are essentially impossible

```text
P(k)
  |     ___
  |    /   \          peaked around <k>
  |   /     \
  |__/       \____
  +----------------- k
```

**2. Power Law — Scale-Free Networks**

Most **real** networks follow:

```text
P(k) ~ k^(-gamma)      typically 2 < gamma < 3
```

* Most nodes have very **few** connections
* A small number of **hubs** have enormous degree
* **No characteristic scale** — hence "scale-free"
* Appears as a **straight line on a log-log plot**

```text
P(k)
  |\
  | \                 heavy tail:
  |  \___             hubs are rare but present
  |      \______
  +----------------- k
```

### Comparison

| Property             | Random (Poisson)   | Scale-free (power law) |
| -------------------- | ------------------ | ---------------------- |
| Typical node exists? | Yes                | **No**                 |
| Hubs                 | Absent             | **Present**            |
| Robust to random failure | Moderate       | **Very robust**        |
| Robust to targeted attack | Moderate      | **Very fragile**       |

### Why It Matters

The distribution determines **robustness**. Scale-free networks survive random node failures easily, because a randomly chosen node is almost certainly peripheral. But removing the few hubs deliberately fragments them rapidly — the **robust-yet-fragile** property.

> Scale-free structure arises naturally from **growth plus preferential attachment**: networks that grow, where new nodes prefer to attach to already-popular nodes.

### Example

The internet survives thousands of random router failures with negligible effect, yet attacking a handful of major backbone routers could partition it — the direct consequence of a power-law degree distribution.
$md$, 11, false),

  (sid, 2, 'Explain the Adjacency Matrix representation of a network with an example.', $md$
The **adjacency matrix** represents a network as an **N × N** matrix **A**, where each entry records whether an edge exists between a pair of nodes.

### Definition

```text
A[i][j] = 1  if there is an edge from node i to node j
A[i][j] = 0  otherwise
```

### Example — Undirected Network

```text
Network:        A --- B
                |     |
                C --- D

         A  B  C  D
    A  [ 0  1  1  0 ]
    B  [ 1  0  0  1 ]
    C  [ 1  0  0  1 ]
    D  [ 0  1  1  0 ]
```

Note the matrix is **symmetric**: A[i][j] = A[j][i], because the relationship is mutual.

### Example — Directed Network

```text
Network:   A --> B --> C
           ^           |
           +-----------+

         A  B  C
    A  [ 0  1  0 ]
    B  [ 0  0  1 ]
    C  [ 1  0  0 ]
```

Here the matrix is **not symmetric**.

### Reading Degrees from the Matrix

```text
Undirected:  k_i = sum of row i  =  sum of column i

Directed:    k_out(i) = sum of ROW i
             k_in(i)  = sum of COLUMN i
```

### Key Properties

| Property             | Undirected      | Directed        |
| -------------------- | --------------- | --------------- |
| Symmetry             | Symmetric       | Not symmetric   |
| Diagonal             | 0 (no self-loops)| 0 usually      |
| Sum of all entries   | 2L              | L               |
| Storage              | O(N²)           | O(N²)           |

### Weighted Networks

For weighted networks the entries hold the weight rather than 1:

```text
A[i][j] = w_ij      the strength of the tie
```

### The Power of Matrix Multiplication

A remarkable property: the entry (i, j) of **Aⁿ** equals the number of **walks of length n** from node i to node j. This lets path counting be done by linear algebra, and underlies eigenvector centrality and PageRank.

### The Drawback

For a network of 1 million nodes the matrix has **10¹² entries**, nearly all zeros. Real networks are sparse, so **adjacency lists** (O(N+L)) are used in practice, with matrices reserved for small networks or for mathematical derivations.

> The adjacency matrix is mathematically elegant and computationally impractical at scale — which is exactly why both representations are taught.

### Example

For a class of 30 students, a 30×30 matrix is trivial. For Facebook's 3 billion users it would require more storage than exists on Earth — the reason graph databases use adjacency lists.
$md$, 12, false),

  (sid, 2, 'Explain why real networks are sparse.', $md$
A network is **sparse** when the number of edges is far smaller than the maximum possible. Almost every real-world network is sparse, and this is a structural fact with deep consequences.

### The Definition

```text
Maximum possible edges (undirected) = N(N-1)/2  ~  N²/2

Sparse network:   L << N²/2
                  <k> << N
```

Formally, in a sparse network L grows roughly **linearly** with N rather than quadratically.

### Evidence from Real Networks

| Network            | N (nodes)   | ⟨k⟩  | Density        |
| ------------------ | ----------- | ---- | -------------- |
| Facebook           | ~1 billion  | ~200 | ~0.0000002     |
| Internet (routers) | ~200,000    | ~6   | ~0.00003       |
| Power grid         | ~5,000      | ~2.7 | ~0.0005        |
| Actor collaboration| ~200,000    | ~29  | ~0.0001        |

Even the densest of these is essentially empty compared with a complete graph.

### Why Sparsity Occurs

**1. Cost of Maintaining Ties**
Every relationship costs time and attention. **Dunbar's number** suggests humans can sustain roughly **150** stable social relationships regardless of how many people they could theoretically know.

**2. Physical and Resource Constraints**
Adding a router link, a power line or a road costs money and materials. Infrastructure networks are sparse by economics.

**3. Cognitive Limits**
People cannot track thousands of relationships meaningfully.

**4. Growth Independent of Size**
When a new user joins Facebook, they add perhaps 100 friends — the same number whether the network has a million or a billion users. So L grows linearly with N while the *maximum* grows quadratically, and density falls as the network grows.

```text
As N increases:
   L  grows like  N
   max edges grows like N²
   -> density = L / N²  ->  0
```

### Consequences of Sparsity

* **Adjacency lists** are used instead of matrices — O(N+L) rather than O(N²)
* Many algorithms become tractable that would be impossible on dense graphs
* Networks can still be **globally connected** despite being locally sparse
* Combined with hubs, sparsity produces the **small-world** effect

> The paradox worth remembering: real networks are extremely sparse *and* have very short paths. Hubs are what reconcile the two.

### Example

Facebook's density is roughly 0.0000002 — a user knows a vanishingly small fraction of all users — yet any two users are connected through about 4 intermediaries. Sparse locally, small globally.
$md$, 13, false),

  (sid, 2, 'Explain Weighted Networks with suitable examples.', $md$
In a **weighted network**, each edge carries a numeric value **w_ij** representing the **strength, frequency, capacity or cost** of the relationship — recognising that not all ties are equal.

### Representation

```text
      5        2
  A ----- B ------- C
   \              /
    \ 8         3/
     \          /
        \  D  /

Weight = strength of the relationship
```

**Weighted adjacency matrix**

```text
        A   B   C   D
    A [ 0   5   0   8 ]
    B [ 5   0   2   0 ]
    C [ 0   2   0   3 ]
    D [ 8   0   3   0 ]
```

### Weighted Degree (Strength)

```text
s_i = sum over j of w_ij
```

**Strength** can differ dramatically from degree: a node with 3 heavy ties may be more important than one with 10 trivial ones.

```text
Node X: 3 edges, weights 10+10+10 = strength 30
Node Y: 10 edges, weights 1 each   = strength 10

Degree says Y is bigger; strength says X is stronger.
```

### Examples of Weighted Networks

| Network             | Nodes        | Weight means            |
| ------------------- | ------------ | ----------------------- |
| Phone call network  | People       | Call minutes            |
| Airline network     | Airports     | Passengers or flights   |
| Trade network       | Countries    | Trade volume            |
| Collaboration       | Researchers  | Papers co-authored      |
| Neural network      | Neurons      | Synaptic strength       |
| Road network        | Junctions    | Traffic volume or distance |

### Important Subtlety — Weight Semantics

Weights can mean opposite things:

* **Strength weights** (friendship intensity) — **higher is closer**
* **Cost weights** (distance, travel time) — **lower is closer**

Shortest-path algorithms minimise cost, so strength weights must be **inverted** before running them. Ignoring this produces results that are exactly backwards.

### Applications

* Distinguishing strong from weak ties quantitatively
* Weighted centrality measures
* Community detection using tie strength
* Modelling capacity-constrained flow

> Binary networks answer *who is connected?*; weighted networks answer *how much?* — and in many domains the second question is the one that matters.

### Example

In an airline network, a small airport with three high-capacity routes to major hubs may carry more passengers than a large airport with twenty regional routes. Unweighted degree would rank them incorrectly.
$md$, 14, false),

  (sid, 2, 'Explain Bipartite Networks with suitable examples.', $md$
A **bipartite network** has nodes divided into **two disjoint sets**, with edges **only between** the sets and never within them.

### Definition

```text
G = (U, V, E)

U and V are disjoint node sets
Every edge connects a node in U to a node in V
NO edges within U, and NO edges within V
```

```text
   Set U (people)          Set V (events)
        P1 ------------------- E1
          \                  /
        P2 --\             /
              \          /
        P3 ---- E2 -----/
```

### Real Examples

| Bipartite network      | Set U        | Set V           |
| ---------------------- | ------------ | --------------- |
| Actor–Movie            | Actors       | Films           |
| Author–Paper           | Researchers  | Publications    |
| User–Product           | Customers    | Items purchased |
| Student–Course         | Students     | Courses         |
| Person–Club            | People       | Organisations   |
| Word–Document          | Terms        | Documents       |

### One-Mode Projections

Bipartite networks are frequently **projected** onto a single set to obtain a conventional network:

```text
Actor-Movie bipartite network
        |
        v  project onto actors
Actor collaboration network:
   two actors are linked if they appeared in a film together
```

Projections can also be weighted by the number of shared events.

**Important caveat:** projection **loses information**. Two actors sharing one film and two sharing ten films become identical edges unless weights are used, and projections artificially create many triangles.

### Properties

* Contains **no odd-length cycles** — in particular, **no triangles**
* Therefore the standard clustering coefficient is always **0**, and special bipartite clustering measures are needed
* Two separate degree distributions, one per set
* **Two-mode** data, as opposed to conventional one-mode networks

### Applications

* **Recommender systems** — user–item bipartite graphs underpin collaborative filtering
* **Scientific collaboration** analysis
* **Affiliation networks** in sociology
* **Text mining** via word–document matrices

> Bipartite structure is not a special case to be removed by projection; it often carries the very information the analysis depends on.

### Example

Netflix's user–film network is bipartite. Projecting onto films links two films watched by the same users, which drives "customers who watched this also watched…" — the recommendation emerges directly from bipartite structure.
$md$, 15, false),

  (sid, 2, 'Explain Paths and Distances in a network.', $md$
A **path** is a route through a network following consecutive edges. **Distance** is the length of the shortest such route, and together they describe how easily influence and information can travel.

### Definitions

* **Walk** — any sequence of connected nodes; nodes and edges may repeat
* **Path** — a walk in which **no node repeats**
* **Path length** — the number of **edges** traversed, not nodes
* **Shortest path (geodesic)** — the path with fewest edges between two nodes
* **Distance d(i,j)** — the length of that shortest path

```text
A --- B --- C --- D
 \               /
  \----- E -----/

A to D via B,C : length 3
A to D via E   : length 2   <-- shortest path
Therefore d(A,D) = 2
```

If no path exists, **d(i,j) = ∞** and the nodes lie in different components.

### Network-Level Distance Measures

**Average path length**

```text
<d> = (1 / [N(N-1)]) * sum over all i != j of d(i,j)
```

**Diameter** — the **largest** shortest path in the network:

```text
d_max = max over all pairs of d(i,j)
```

The diameter represents the network's "worst case" — the two most distant nodes.

### The Small-World Phenomenon

Real networks have remarkably short average path lengths despite being sparse:

```text
<d>  ~  ln(N) / ln(<k>)          random networks
<d>  ~  ln(ln(N))                scale-free networks (ultra-small)
```

| Network            | N            | ⟨d⟩  |
| ------------------ | ------------ | ---- |
| Facebook           | ~1 billion   | ~4.7 |
| WWW                | ~800 million | ~19  |
| Actor network      | ~225,000     | ~3.7 |

**Milgram's experiment (1967)** found a median of about **six** intermediaries between randomly chosen Americans — the origin of "six degrees of separation".

### Computing Distances

* **BFS (Breadth-First Search)** — O(N + L) for unweighted graphs
* **Dijkstra's algorithm** — for weighted graphs with non-negative weights
* **Floyd–Warshall** — all-pairs shortest paths, O(N³)

> Hubs are what make short paths possible in sparse networks: two distant nodes are usually only a few steps from a hub they both connect through.

### Example

Facebook's average distance of 4.7 among a billion users means any two people are connected through fewer than five intermediaries — despite each knowing only a few hundred others.
$md$, 16, false),

  (sid, 2, 'Explain Connectedness in networks.', $md$
**Connectedness** describes whether and how the nodes of a network can reach one another through paths.

### Undirected Networks

**Connected graph** — a path exists between **every** pair of nodes.
**Disconnected graph** — at least one pair has no path between them.

**Component** — a maximal connected subgraph.

```text
Component 1        Component 2
 A --- B            E --- F
 |     |             \   /
 C --- D               G

Two separate components; no path from A to E
```

**Giant component** — a component containing a large fraction of all nodes. Real networks typically have one giant component plus a scattering of small isolated groups.

### Directed Networks

Direction creates two distinct notions:

**Strongly connected** — for every pair (i, j) there is a directed path from i to j **and** from j to i.

**Weakly connected** — connected if edge directions are ignored.

```text
A --> B --> C

WEAKLY connected (ignoring arrows)
NOT strongly connected: no path from C back to A
```

* **SCC (Strongly Connected Component)** — a maximal strongly connected subgraph
* The web's bow-tie structure is defined around its central SCC

### The Percolation Threshold

Whether a giant component exists depends on average degree:

```text
<k> < 1        no giant component; fragments only
<k> = 1        critical point — giant component EMERGES
<k> > 1        giant component present
<k> > ln(N)    network almost certainly fully connected
```

This is a **phase transition**: connectivity appears abruptly, not gradually.

### Measuring Connectedness

| Measure                 | Meaning                                    |
| ----------------------- | ------------------------------------------ |
| Number of components    | How fragmented the network is              |
| Giant component size    | Fraction of nodes mutually reachable       |
| **Bridge**              | Edge whose removal disconnects the network |
| **Articulation point**  | Node whose removal disconnects the network |
| Vertex/edge connectivity| Minimum removals to disconnect             |

Bridges and articulation points identify **structural vulnerabilities** — the single points of failure.

> Connectedness determines what is possible at all: information, disease and influence can only travel within a component.

### Example

A social network splits into a giant component of 95% of users plus small isolated clusters. A viral message can reach the 95% but can never reach the isolated groups, regardless of how compelling it is.
$md$, 17, false),

  (sid, 2, 'Explain the Clustering Coefficient and its significance in network analysis.', $md$
The **clustering coefficient** measures the extent to which a node's neighbours are themselves connected — quantifying the intuition that "the friend of my friend is my friend".

### Local Clustering Coefficient

For node i with degree k_i:

```text
C_i = 2 * L_i / [k_i * (k_i - 1)]

L_i   = number of edges among i's neighbours
k_i(k_i-1)/2 = maximum possible edges among them
```

**Range:** 0 (no neighbours connected) to 1 (all neighbours mutually connected — a clique).

### Worked Example

```text
Node A has neighbours B, C, D  (k = 3)
Maximum possible edges among them = 3(2)/2 = 3

Case 1: B-C, C-D, B-D all exist  -> L = 3
        C_A = 2(3) / [3 x 2] = 1.0   (perfect clustering)

Case 2: only B-C exists          -> L = 1
        C_A = 2(1) / [3 x 2] = 0.33
```

### Average Clustering Coefficient

```text
<C> = (1/N) * sum of C_i
```

### Global Clustering (Transitivity)

```text
C_global = 3 x (number of triangles) / (number of connected triples)
```

The factor 3 appears because each triangle contains three connected triples.

### Significance

**1. Detects Community Structure**
High clustering indicates tightly-knit groups.

**2. Distinguishes Real Networks from Random Ones**
Random graphs have C ≈ ⟨k⟩/N, which is tiny. Real networks show clustering **orders of magnitude higher** — one of the clearest signs that real networks are not random.

| Network       | Actual ⟨C⟩ | Random equivalent |
| ------------- | ---------- | ----------------- |
| Actor network | 0.79       | 0.00027           |
| Power grid    | 0.08       | 0.005             |
| C. elegans    | 0.28       | 0.05              |

**3. Defines the Small-World Property**
Watts and Strogatz defined a small-world network by two conditions together:

```text
HIGH clustering (like a lattice)
        +
SHORT path lengths (like a random graph)
```

This combination is what real social networks display.

**4. Predicts Link Formation**
Two people with many mutual friends are likely to become connected — the basis of friend recommendation.

**5. Indicates Redundancy and Resilience**
Clustered regions have alternative paths, so local failures are absorbed.

> High clustering also has a cost: information circulates within a cluster rather than escaping it — the structural basis of echo chambers.

### Example

"People You May Know" works almost entirely on clustering: if you share 15 mutual friends with someone, the local clustering coefficient makes a real-world connection highly probable.
$md$, 18, false);

  RAISE NOTICE 'Social Network Analysis — Units 1 & 2: 18 questions inserted.';
END $do$;
