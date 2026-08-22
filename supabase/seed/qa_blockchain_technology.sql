-- =====================================================================
-- Study-With-AI seed — Block Chain Technology (4th Year) — UNITS 1 & 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Block%Chain Technology' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Block Chain Technology" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number IN (1,2) AND question IN (
    'Explain the Double Spend Problem and how it motivated the development of blockchain technology.',
    'Explain the Byzantine Generals'' Computing Problem and its relevance to blockchain.',
    'Explain how Blockchain works.',
    'Differentiate between Centralization and Decentralization.',
    'Explain Distributed Consensus in blockchain networks.',
    'Explain how consensus can be achieved without identity using a blockchain.',
    'Explain Incentives and Proof of Work.',
    'Explain Cryptocurrency and its relationship with blockchain.',
    'Explain Non-Fungible Tokens (NFTs).',
    'Explain Mining in a blockchain network.',
    'Explain Public Blockchain.',
    'Explain Private Blockchain.',
    'Explain Semi-Private Blockchain.',
    'Explain Sidechains.',
    'Explain the major vulnerabilities and security challenges associated with blockchain technology.',
    'Explain Cryptographic Hash Functions and their role in blockchain.',
    'Explain SHA-256 and its use in blockchain technology.',
    'Explain Hash Pointers and their role in blockchain data structures.',
    'Explain Merkle Trees and their significance in blockchain.',
    'Explain the concept of a Distributed Ledger.',
    'Explain the Proof of Work consensus algorithm.',
    'Explain the Proof of Stake consensus algorithm.',
    'Explain Delegated Proof of Stake.',
    'Explain Proof of Elapsed Time.',
    'Compare Proof of Work, Proof of Stake, Delegated Proof of Stake, and Proof of Elapsed Time.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain the Double Spend Problem and how it motivated the development of blockchain technology.', $md$
The **double spend problem** is the risk that the same digital token is spent more than once. It is the central obstacle to digital cash, and blockchain exists primarily to solve it.

### Why Digital Money Is Different

Physical cash cannot be double spent — handing someone a note means you no longer have it. Digital data is **perfectly copyable**, so a digital coin is just a file that can be duplicated and sent to two people.

```text
Alice has 1 coin

Alice --coin--> Bob      (transaction 1)
Alice --coin--> Carol    (transaction 2, same coin)

Both look valid in isolation.
Which one counts?
```

### The Traditional Solution — A Trusted Third Party

Banks and payment processors solve this by maintaining a **central ledger**. Every transaction is checked against one authoritative balance.

**Problems with this approach**
* **Single point of failure** — the bank going down stops everything
* **Requires trust** in the institution
* **Censorship** — the authority can block transactions
* **Cost** — intermediaries charge fees
* **Exclusion** — the unbanked cannot participate

### The Blockchain Solution

Blockchain removes the trusted third party by making the ledger **public, replicated and append-only**, with agreement reached through **distributed consensus**.

```text
1. Every transaction is BROADCAST to the whole network
2. Nodes verify the sender actually owns the coin
3. Valid transactions are grouped into a BLOCK
4. Consensus (e.g. Proof of Work) decides which block is next
5. The block is CHAINED to the previous one by hash
6. Altering history would require redoing all subsequent work
```

If Alice broadcasts two conflicting transactions, only **one** can enter the confirmed chain. The other is rejected by every honest node, because the coin has already been spent according to the shared ledger.

> Satoshi Nakamoto's contribution was not cryptography — hashes and signatures already existed — but a way to make a *distributed* network agree on transaction **order** without any authority.

### Example

Alice tries to pay both a shop and a friend with the same bitcoin. Both transactions propagate, but miners can include only one in a block. Once confirmed, the second is permanently invalid — the network reached agreement without any bank.
$md$, 1, true),

  (sid, 1, 'Explain the Byzantine Generals'' Computing Problem and its relevance to blockchain.', $md$
The **Byzantine Generals' Problem** asks how distributed parties can reach agreement when some of them may be **traitors** sending conflicting information. It is the theoretical foundation of blockchain consensus.

### The Allegory

Several generals surround a city. They must **all attack** or **all retreat** — a partial attack is defeated. They can communicate only by messenger, and some generals may be traitors who send "attack" to some and "retreat" to others.

```text
        General A (loyal)
       /                \
   "attack"          "attack"
     /                    \
General B (loyal)      General C (TRAITOR)
     \                    /
      \  "attack"    "retreat"  <-- lies differently to each
       \                /
        General D (loyal) — receives conflicting reports
```

### The Formal Requirements

```text
AGREEMENT: all loyal generals decide the SAME plan
VALIDITY:  if the commander is loyal, that plan is the commander's
```

### The Key Result

Agreement is possible **only if**:

```text
N >= 3m + 1
```

with N total generals and m traitors. Tolerating one traitor needs four generals; two traitors need seven. Fewer than that, and the traitors can always create ambiguity that loyal generals cannot resolve.

### Relevance to Blockchain

Blockchain is exactly this problem in practice:

| Byzantine Generals   | Blockchain                          |
| -------------------- | ----------------------------------- |
| Generals             | Network nodes                       |
| Traitors             | Malicious or faulty nodes           |
| Messengers           | Peer-to-peer network                |
| Agreeing on a plan   | Agreeing on the next block          |
| Loyal majority wins  | Honest majority controls the chain  |

A blockchain must reach agreement on transaction **order** among nodes that are **anonymous, unaccountable and possibly malicious** — a harsher setting than the original problem, since participants can also leave and rejoin at will.

### How Bitcoin Sidesteps the Bound

Rather than counting nodes — which is impossible when identities are free to create (a **Sybil attack**) — Bitcoin counts **computational work**. Voting power is proportional to hash rate, which cannot be faked. The security assumption becomes **"more than 50% of hash power is honest"** rather than a count of participants.

> The insight that makes permissionless blockchain possible is replacing "one node, one vote" with "one CPU cycle, one vote" — because CPU cycles are costly and identities are not.

### Example

A blockchain with 33% malicious nodes still functions if honest nodes hold the majority of hash power, satisfying the practical form of the Byzantine bound — which is why 51% attacks, not 34% attacks, are the concern for Proof of Work chains.
$md$, 2, false),

  (sid, 1, 'Explain how Blockchain works.', $md$
A **blockchain** is a distributed, append-only ledger of transactions grouped into **blocks**, each cryptographically linked to the one before it.

### Structure of a Block

```text
+--------------------------------------+
| BLOCK HEADER                         |
|   Previous block hash  <-- the chain |
|   Merkle root (of all transactions)  |
|   Timestamp                          |
|   Difficulty target                  |
|   Nonce                              |
+--------------------------------------+
| TRANSACTIONS                         |
|   Tx1, Tx2, Tx3, ...                 |
+--------------------------------------+
```

### The Chain

```text
Block 1          Block 2          Block 3
+--------+      +--------+      +--------+
| hash 0 |<-----| hash 1 |<-----| hash 2 |
| Tx...  |      | Tx...  |      | Tx...  |
+--------+      +--------+      +--------+
 (genesis)

Each block stores the HASH of the previous block.
```

This is why the chain is tamper-evident: changing any transaction changes that block's hash, which invalidates the "previous hash" field of the next block, and so on through the entire chain.

### The Transaction Lifecycle

```text
1. A user creates and SIGNS a transaction with their private key
2. The transaction is BROADCAST to the peer-to-peer network
3. Nodes VALIDATE it — signature valid, funds available, no double spend
4. Valid transactions enter the MEMPOOL (pending pool)
5. Miners/validators select transactions and assemble a BLOCK
6. CONSENSUS (PoW/PoS) determines who adds the next block
7. The block is BROADCAST; other nodes verify and append it
8. The transaction is CONFIRMED; more blocks on top = more final
```

### Core Properties

| Property         | Achieved by                            |
| ---------------- | -------------------------------------- |
| **Immutability** | Hash chaining + accumulated work       |
| **Transparency** | Every node holds a full copy           |
| **Decentralisation** | No central authority               |
| **Security**     | Cryptographic signatures and hashes    |
| **Consensus**    | PoW, PoS or similar                    |

### Handling Forks

Two miners may find blocks simultaneously, splitting the chain temporarily. Nodes follow the **longest chain** (in Bitcoin, the chain with the most accumulated work); the shorter branch is orphaned and its transactions return to the mempool.

> "Immutable" is a practical rather than absolute claim: history can be rewritten by anyone able to redo all the work since — which is precisely what makes deep confirmations valuable.

### Example

A bitcoin transaction is broadcast, enters the mempool, is mined into a block within roughly 10 minutes, and is treated as final after 6 further blocks — by which point reversing it would require redoing about an hour of the entire network's work.
$md$, 3, false),

  (sid, 1, 'Differentiate between Centralization and Decentralization.', $md$
**Centralization** concentrates control and data in a single authority; **decentralization** distributes them across many independent participants. Blockchain's defining claim is decentralization.

### Structural Comparison

```text
CENTRALIZED              DECENTRALIZED           DISTRIBUTED
      o                     o     o              o---o---o
     /|\                   /|\   /|\             |\ /|\ /|
    o o o                 o o o o o o            o-o-o-o-o
  one hub               several hubs            no hubs at all
```

### Detailed Differences

| Aspect             | Centralized              | Decentralized             |
| ------------------ | ------------------------ | ------------------------- |
| **Control**        | Single authority         | Distributed among peers   |
| **Data storage**   | One location             | Replicated across nodes   |
| **Point of failure** | **Single**             | None critical             |
| **Decision-making**| Top-down                 | By consensus              |
| **Trust model**    | Trust the authority      | Trust the protocol/maths  |
| **Transparency**   | Limited                  | Usually public            |
| **Speed**          | **Fast**                 | Slower (consensus costs time) |
| **Cost**           | Lower operationally      | Higher (redundant work)   |
| **Censorship**     | Possible                 | Very difficult            |
| **Scalability**    | **Easier**               | Harder                    |
| **Example**        | Bank, PayPal             | Bitcoin, Ethereum         |

### Advantages of Each

**Centralization**
* Fast decisions and high throughput
* Simple to manage, upgrade and debug
* Clear accountability and legal recourse
* Cheaper to operate

**Decentralization**
* No single point of failure
* Censorship resistance
* No need to trust an intermediary
* Transparency and auditability
* Continues operating if some nodes fail

### The Trade-off

Decentralization is not free. Every node processes every transaction, so throughput is limited:

```text
Visa:     ~65,000 transactions/second (centralized)
Bitcoin:  ~7 transactions/second      (decentralized)
```

This gap is the **scalability trilemma**: decentralization, security and scalability — a system can strongly optimise for only two.

> Decentralization is a **spectrum**, not a binary. Many "decentralized" systems concentrate in practice — Bitcoin mining pools and Ethereum staking services being clear examples.

### Example

A bank can reverse a fraudulent transfer because it controls the ledger. Bitcoin cannot — the same property that prevents censorship also prevents remedy, which is the trade users accept.
$md$, 4, false),

  (sid, 1, 'Explain Distributed Consensus in blockchain networks.', $md$
**Distributed consensus** is the process by which nodes in a blockchain network agree on a **single, consistent version** of the ledger, despite having no central authority and despite some participants being faulty or malicious.

### What Must Be Agreed

The hard problem is not *which transactions are valid* — that can be checked independently — but **in what order** they occurred. Ordering is what prevents double spending.

### Required Properties

| Property        | Meaning                                            |
| --------------- | -------------------------------------------------- |
| **Agreement**   | All honest nodes accept the same chain              |
| **Validity**    | Only valid transactions are agreed                  |
| **Termination** | The network eventually decides                      |
| **Integrity**   | A decided value cannot be reversed (probabilistically) |

### The Difficulty

* Nodes are **anonymous** and may join or leave at will
* Some are **malicious**
* The network is **asynchronous** — messages are delayed or lost
* **Sybil attacks** — one attacker can create unlimited identities, so counting nodes is meaningless

### Consensus Mechanisms

| Mechanism  | Voting power based on | Used by            |
| ---------- | --------------------- | ------------------ |
| **PoW**    | Computational work    | Bitcoin            |
| **PoS**    | Staked coins          | Ethereum (post-Merge) |
| **DPoS**   | Delegated votes       | EOS, TRON          |
| **PoET**   | Random wait time      | Hyperledger Sawtooth |
| **PBFT**   | Known validator votes | Permissioned chains|

### Probabilistic vs Deterministic Finality

```text
PROBABILISTIC (Bitcoin):
  each additional block makes reversal exponentially harder
  6 confirmations ~ practically irreversible

DETERMINISTIC (PBFT-style):
  once committed, a block is FINAL immediately
  requires known validator set
```

### The Longest-Chain Rule

When forks occur, nodes adopt the chain with the **most accumulated work**. Honest nodes naturally converge because they all follow the same rule, so temporary disagreement resolves itself without any coordinator.

> Consensus mechanisms all solve the Sybil problem the same way: make participation **costly** in something that cannot be forged — electricity, capital or trusted hardware.

### Example

Two miners find valid blocks at the same instant, splitting the network. The next block extends one branch, making it longer; nodes on the shorter branch switch, and its transactions return to the mempool. Consensus is restored automatically within minutes.
$md$, 5, false),

  (sid, 1, 'Explain how consensus can be achieved without identity using a blockchain.', $md$
In a **permissionless** blockchain, anyone may join anonymously. Traditional consensus algorithms assume a **known set of participants** and count votes — which fails immediately when identities are free to create.

### The Sybil Attack

```text
Naive approach:  one node = one vote

Attacker creates 1,000,000 fake identities
-> attacker controls the vote
-> consensus is meaningless
```

Since creating a network identity costs nothing, identity-based voting cannot work in an open network.

### The Solution — Vote With a Costly Resource

Blockchain replaces identity with a resource that **cannot be faked or cheaply duplicated**:

| Mechanism | Voting power from      | Cost to attacker              |
| --------- | ---------------------- | ----------------------------- |
| **PoW**   | Computational work     | Hardware + electricity        |
| **PoS**   | Coins staked           | Capital, slashable if dishonest |
| **PoET**  | Trusted hardware timer | Specialised hardware          |

Creating a million identities is trivial; acquiring a million times the hash power or capital is not.

### How Bitcoin Does It Without Identity

```text
1. Anyone may attempt to create a block — no registration
2. To be accepted, a block must contain a valid PROOF OF WORK
3. Finding the proof requires real, verifiable expenditure
4. Nodes accept the chain with the MOST accumulated work
5. The identity of the miner is IRRELEVANT — only the work counts
```

The elegance is that the proof is **hard to produce and trivial to verify**, so every node can independently check a block without knowing or trusting who made it.

### Incentive Alignment

Consensus is not merely enforced but **made profitable**:

* Miners earn **block rewards** and **transaction fees**
* Producing an invalid block wastes the electricity spent, since honest nodes reject it
* Attacking a chain devalues the very asset the attacker holds

> The system does not prevent dishonesty — it makes honesty the more profitable strategy, which is a stronger guarantee in an anonymous network.

### Example

An attacker spins up 10,000 Bitcoin nodes for free. They gain **no** influence over consensus, because nodes do not vote — only miners producing valid proof of work extend the chain, and that requires hardware and electricity the attacker must actually buy.
$md$, 6, false),

  (sid, 1, 'Explain Incentives and Proof of Work.', $md$
**Proof of Work (PoW)** requires participants to expend real computational effort to add a block, while **incentives** ensure that doing so honestly is the most profitable strategy.

### How Proof of Work Operates

Miners search for a **nonce** such that the block's hash falls below a target value.

```text
find nonce such that:
    SHA-256( block header + nonce )  <  target

Target with many leading zeros = harder puzzle
```

Because hash output is unpredictable, the only method is **brute force** — trying nonces until one succeeds.

```text
nonce = 1  -> hash 8f3a...   no
nonce = 2  -> hash c72b...   no
...
nonce = 4823901 -> hash 0000a3f...  SUCCESS
```

**The asymmetry that makes it work**: finding the nonce takes quadrillions of attempts; **verifying** it takes one hash computation. Expensive to produce, trivial to check.

### Difficulty Adjustment

Bitcoin retargets difficulty every **2016 blocks** (about two weeks) to keep block time near 10 minutes regardless of how much hash power joins or leaves.

### The Incentive Structure

**1. Block Reward**
Newly created coins paid to whoever mines the block. Bitcoin's reward **halves** roughly every four years, capping total supply at 21 million.

**2. Transaction Fees**
Users attach fees; miners prioritise higher-fee transactions. As block rewards decline, fees become the long-term incentive.

### Why Honesty Is Rational

| Behaviour            | Outcome for the miner            |
| -------------------- | -------------------------------- |
| Mine honestly        | Earn reward + fees               |
| Include invalid tx   | Block **rejected**; energy wasted|
| Attempt a 51% attack | Enormous cost; devalues holdings |

An attacker with enough hardware to attack the chain would generally earn more by mining honestly — and a successful attack would collapse the price of the asset they had just spent a fortune to acquire.

### Criticisms

* **Energy consumption** — comparable to a mid-sized country
* **Mining centralisation** — pools concentrate hash power
* **Hardware arms race** — ASICs exclude ordinary participants

> PoW's security rests on economics rather than cryptography: it is not that attacks are impossible, but that they cost more than they can earn.

### Example

Bitcoin's network performs hundreds of quintillions of hashes per second. Producing one block takes the whole network about 10 minutes, yet any laptop verifies that block in microseconds — the asymmetry that lets anyone audit a system nobody can cheaply attack.
$md$, 7, false),

  (sid, 1, 'Explain Cryptocurrency and its relationship with blockchain.', $md$
A **cryptocurrency** is a digital asset that uses cryptography to secure transactions and control the creation of new units, operating without a central bank. Blockchain is the ledger technology that makes it possible.

### Key Characteristics

* **Decentralised** — no central issuing authority
* **Cryptographically secured** — digital signatures prove ownership
* **Pseudonymous** — addresses rather than names
* **Immutable transactions** — confirmed transfers cannot be reversed
* **Limited supply** in many designs (Bitcoin caps at 21 million)
* **Borderless** — transfers ignore national boundaries
* **Programmable** where smart contracts exist

### How Ownership Works

There is no file representing a coin. Ownership is the ability to produce a valid signature:

```text
Private key  -> proves ownership, must stay secret
Public key   -> derived from private key
Address      -> derived from public key, shared publicly

To spend: sign the transaction with the PRIVATE KEY
Anyone can verify the signature using the PUBLIC key
```

**Losing the private key means losing the funds permanently** — there is no recovery mechanism, because there is no authority to appeal to.

### The Relationship with Blockchain

| Blockchain provides       | Cryptocurrency needs it for       |
| ------------------------- | --------------------------------- |
| Distributed ledger        | Recording all balances            |
| Consensus                 | Agreeing on transaction order     |
| Immutability              | Preventing history rewriting      |
| Double-spend prevention   | Ensuring each coin is spent once  |
| Decentralisation          | Removing the need for a bank      |

**The distinction matters:** blockchain is the underlying technology and has many non-currency uses — supply chain tracking, identity, voting, records. Cryptocurrency was simply its first application.

```text
Blockchain  =  the technology
Cryptocurrency = one application of it
```

### Major Types

* **Bitcoin** — digital store of value, deliberately limited scripting
* **Ethereum** — programmable platform with smart contracts
* **Stablecoins** — pegged to fiat currency to reduce volatility
* **Privacy coins** — Monero, Zcash, with enhanced anonymity

> Bitcoin was designed as electronic cash; its dominant use became a store of value — a reminder that a technology's use is decided by its users, not its author.

### Example

Sending bitcoin creates a signed message assigning coins to another address. Miners include it in a block; the global ledger updates; the recipient can now sign with their own key. No bank was involved and no coin object ever moved — only ledger entries changed.
$md$, 8, false),

  (sid, 1, 'Explain Non-Fungible Tokens (NFTs).', $md$
A **Non-Fungible Token (NFT)** is a unique, indivisible digital token on a blockchain, representing ownership of a specific item. Unlike currency, one NFT is **not interchangeable** with another.

### Fungible vs Non-Fungible

```text
FUNGIBLE (Bitcoin, rupees):
  1 BTC = 1 BTC       identical and interchangeable
  divisible into fractions

NON-FUNGIBLE (NFT):
  Token #1 != Token #2   each is unique
  indivisible — you cannot own 0.5 of one
```

A ₹100 note can be swapped for any other ₹100 note; a specific painting cannot be swapped for a different painting.

### Technical Basis

NFTs are implemented as smart contracts, most commonly on Ethereum:

| Standard   | Purpose                                  |
| ---------- | ---------------------------------------- |
| **ERC-721**| One contract, each token uniquely identified |
| **ERC-1155**| Supports both fungible and non-fungible in one contract |

Each token carries a **unique token ID** and a **metadata URI** pointing to the item it represents.

### What Is Actually Stored On-Chain

```text
ON-CHAIN:   token ID, owner's address, metadata URI
OFF-CHAIN:  usually the actual image or file (IPFS or a web server)
```

This is the most misunderstood aspect: the blockchain typically stores a **pointer**, not the artwork. If the off-chain file disappears, the token remains but points to nothing.

### Applications

* **Digital art and collectibles**
* **Gaming assets** — items owned by players rather than the game company
* **Virtual real estate**
* **Music and media rights**
* **Event ticketing** — resale is traceable
* **Certificates and credentials**
* **Identity and domain names**

### Important Limitations

* **Ownership ≠ copyright** — owning an NFT rarely grants intellectual property rights
* **Link rot** — off-chain files can vanish
* **Anyone can mint** an NFT of work they do not own
* **Extreme price volatility** and speculation
* **Environmental cost** on PoW chains

> An NFT proves *who holds the token*; whether that confers any legal right over the underlying work depends entirely on terms written outside the blockchain.

### Example

A concert ticket issued as an NFT is verifiably authentic and its resale history is public, letting organisers cap scalping. This is a genuinely better fit than digital art, because the token *is* the entitlement rather than a pointer to it.
$md$, 9, false),

  (sid, 1, 'Explain Mining in a blockchain network.', $md$
**Mining** is the process of validating transactions, assembling them into a block, and competing to add that block to the blockchain — earning a reward for doing so. In Proof of Work systems it is how new blocks and new coins are created.

### The Mining Process

```text
1. COLLECT transactions from the mempool
2. VERIFY each — valid signature, sufficient funds, no double spend
3. BUILD a candidate block:
      previous block hash, Merkle root, timestamp, difficulty, nonce
4. SEARCH for a nonce such that
      hash(block header) < target
5. BROADCAST the solved block to the network
6. Other nodes VERIFY and append it
7. Miner receives BLOCK REWARD + TRANSACTION FEES
```

### The Puzzle

```text
target with 19 leading zeros:
0000000000000000000a3f2b...

Miner tries:
  nonce 1 -> 7f3c...   fail
  nonce 2 -> b19e...   fail
  ... quintillions of attempts ...
  nonce X -> 00000000000000000009e4... SUCCESS
```

Only brute force works, since hash output cannot be predicted or reversed.

### The Coinbase Transaction

Each block begins with a special transaction creating new coins from nothing and paying them to the miner — the mechanism by which currency is issued without a central bank.

### Difficulty and Block Time

Bitcoin adjusts difficulty every 2016 blocks to hold average block time at 10 minutes. More hash power joining raises difficulty; hash power leaving lowers it.

### Mining Pools

Solo mining is effectively a lottery with vanishing odds. Pools combine hash power and share rewards proportionally to contributed work, giving steady small payouts instead of rare large ones.

**Concern:** pools concentrate hash power. A few pools controlling a majority of the network undermines the decentralisation the design depends on.

### Evolution of Hardware

```text
CPU  ->  GPU  ->  FPGA  ->  ASIC
                          (purpose-built, thousands of times faster)
```

This progression pushed ordinary participants out of mining entirely — an unintended centralising pressure.

> Mining's real function is not "creating coins" but **ordering transactions**; the coins are the payment for doing that work.

### Example

A miner assembles 2,500 transactions, searches for a valid nonce for roughly 10 minutes across the whole network, and on success collects the block subsidy plus fees. Every other miner working on that height discards their work and starts on the next block.
$md$, 10, false),

  (sid, 1, 'Explain Public Blockchain.', $md$
A **public blockchain** is fully open and permissionless: anyone may read it, submit transactions, and participate in consensus without approval from any authority.

### Characteristics

* **Permissionless** — no registration required
* **Fully transparent** — all transactions are publicly visible
* **Decentralised** — thousands of independent nodes
* **Censorship-resistant** — no party can block valid transactions
* **Immutable** — rewriting history requires overwhelming resources
* **Incentivised** — participants are paid in the native token
* **Anonymous or pseudonymous** — identities are addresses

### How It Works

```text
Anyone can:
   - download the full ledger
   - run a node and verify every rule independently
   - submit transactions
   - mine or stake

No permission needed at any step.
```

### Examples

| Blockchain | Consensus | Primary purpose            |
| ---------- | --------- | -------------------------- |
| Bitcoin    | PoW       | Digital currency           |
| Ethereum   | PoS       | Smart contract platform    |
| Litecoin   | PoW       | Faster payments            |
| Cardano    | PoS       | Research-driven platform   |

### Advantages

* **Maximum decentralisation** and trustlessness
* **Full transparency** — anyone can audit
* **High security** through the size of the network
* **Global access** with no gatekeeper
* **Strong immutability**

### Disadvantages

| Disadvantage      | Detail                                   |
| ----------------- | ---------------------------------------- |
| **Low throughput**| Bitcoin ~7 TPS, Ethereum ~15–30 TPS      |
| **High energy**   | Especially PoW chains                    |
| **No privacy**    | All transactions permanently public      |
| **Slow finality** | Minutes to hours for confidence          |
| **Costly**        | Fees rise sharply under congestion       |
| **Governance difficulty** | Upgrades require broad agreement |

### Suitability

Public chains suit cryptocurrency, decentralised finance, censorship-resistant applications and public records. They suit **poorly** any application needing confidentiality, high throughput, or regulatory data controls — which is why enterprises usually choose permissioned alternatives.

> The transparency that makes a public chain auditable also makes it unusable for anything confidential — a property, not a defect.

### Example

Bitcoin has run continuously since 2009 with no owner or administrator. Anyone can verify the entire transaction history from the genesis block using open-source software and ordinary hardware.
$md$, 11, false),

  (sid, 1, 'Explain Private Blockchain.', $md$
A **private blockchain** is a permissioned ledger controlled by a single organisation. Participation — reading, writing and validating — requires authorisation.

### Characteristics

* **Permissioned** — participants are known and approved
* **Restricted access** — read and write rights are granted explicitly
* **Centralised control** — one organisation sets the rules
* **High throughput** — thousands of transactions per second
* **Energy efficient** — no mining required
* **Privacy** — data visible only to authorised parties
* **Mutable in practice** — the controlling body can amend records

### How It Differs Operationally

```text
PUBLIC:   anyone joins; consensus by PoW/PoS; slow but trustless
PRIVATE:  members are vetted; consensus by PBFT/Raft;
          fast because validators are known and accountable
```

Because validators have real-world identities and legal accountability, expensive Sybil resistance is unnecessary — which is precisely why private chains are so much faster.

### Examples

| Platform                | Typical use                        |
| ----------------------- | ---------------------------------- |
| **Hyperledger Fabric**  | Enterprise supply chain, finance   |
| **R3 Corda**            | Banking and financial agreements   |
| **Quorum**              | Private Ethereum for institutions  |

### Advantages

* **Very high performance** — thousands of TPS
* **Privacy and confidentiality**
* **Regulatory compliance** — data controls, right to erasure
* **Low cost** — no mining
* **Fast finality** — deterministic, immediate
* **Easy governance** — upgrades decided by the owner

### Disadvantages

* **Centralised** — arguably not a blockchain in spirit
* **Requires trust** in the operator
* **Fewer nodes** means weaker tamper resistance
* **Mutable** — the operator could alter history
* **Not censorship-resistant**

### The Legitimate Criticism

If one organisation controls the network, a **replicated database** would often serve the same purpose more simply. Private blockchains earn their place mainly where **several mutually distrustful organisations** need a shared record — which is really a **consortium** use case.

> The honest test for a private blockchain: if you removed the blockchain and used a shared database with audit logs, what would you lose? If the answer is "nothing", it was not needed.

### Example

A pharmaceutical company tracks drugs from factory to pharmacy on Hyperledger Fabric. Only authorised partners see the data, throughput handles millions of items, and regulators get an auditable trail — none of which a public chain could provide.
$md$, 12, false),

  (sid, 1, 'Explain Semi-Private Blockchain.', $md$
A **semi-private blockchain** — also called a **hybrid** or **consortium** blockchain — combines features of public and private chains. Part of it is open to the public while another part remains permissioned.

### The Two Common Forms

**1. Hybrid Blockchain**
One organisation runs a private chain but exposes selected data publicly.

```text
+-------------------------------+
|   PRIVATE portion             |
|   - sensitive records         |
|   - permissioned access       |
+-------------------------------+
|   PUBLIC portion              |
|   - verifiable hashes/proofs  |
|   - anyone may audit          |
+-------------------------------+
```

**2. Consortium Blockchain**
Several organisations jointly govern the network — no single owner, but not open either.

```text
Bank A ---\
Bank B ----+--- shared ledger, jointly validated
Bank C ---/

No single party controls it; outsiders cannot join freely.
```

### Characteristics

* **Partially decentralised** — control shared among known members
* **Selective transparency** — some data public, some restricted
* **Controlled participation** — validators are approved
* **Good performance** — far faster than public chains
* **Configurable privacy**

### Advantages

| Advantage        | Explanation                                 |
| ---------------- | ------------------------------------------- |
| **Balance**      | Public verifiability with private detail    |
| **Performance**  | Hundreds to thousands of TPS                |
| **Compliance**   | Sensitive data stays controlled             |
| **Shared trust** | No single organisation dominates            |
| **Cost**         | No mining expense                           |

### Disadvantages

* More **complex** to design and govern
* Less decentralised than a public chain
* Requires **agreement between members**, which can be slow
* Members could collude to alter records

### Where It Fits

Semi-private chains suit situations with **several mutually distrustful organisations** that must share a record but cannot expose everything publicly — interbank settlement, supply chains spanning competitors, healthcare data exchange, trade finance.

> The consortium model is arguably the most commercially realistic form of blockchain: it solves a genuine multi-party trust problem that a single company's database cannot.

### Example

A trade-finance consortium of eight banks shares a ledger of letters of credit. Each bank validates transactions, no single bank controls the record, and a public hash anchor lets auditors verify nothing was altered — without revealing commercial terms.
$md$, 13, false),

  (sid, 1, 'Explain Sidechains.', $md$
A **sidechain** is a separate blockchain that runs **alongside** a main chain (the "parent" or "mainchain") and is connected to it by a **two-way peg**, allowing assets to move between the two.

### The Motivation

Main chains such as Bitcoin are deliberately conservative — slow to change, limited in throughput and scripting. Sidechains allow experimentation and additional capacity **without altering the main chain**.

### The Two-Way Peg

```text
MAIN CHAIN                        SIDECHAIN
   |                                  |
   | 1. LOCK coins in a special output|
   |--------------------------------->|
   |                                  | 2. equivalent coins ISSUED
   |                                  |
   |                                  | 3. transact freely, fast
   |                                  |
   |<---------------------------------|
   | 5. coins UNLOCKED                | 4. coins BURNED/locked
```

The total supply is preserved: coins are immobilised on one chain while their representation exists on the other.

### Peg Mechanisms

| Type                | Trust model                        |
| ------------------- | ---------------------------------- |
| **Federated peg**   | A group of trusted signatories     |
| **SPV peg**         | Cryptographic proof of the lock    |
| **Merge-mined**     | Secured by the mainchain's miners  |

Federated pegs are common in practice but reintroduce trust in the federation — the main criticism of the approach.

### Benefits

* **Scalability** — transactions move off the congested main chain
* **Experimentation** — new features tested without risking the main chain
* **Specialisation** — one sidechain for privacy, another for smart contracts
* **Faster and cheaper** transactions
* **Main chain unchanged**, preserving its stability and security

### Risks

* **Weaker security** — a sidechain has its own, usually smaller, validator set
* **Peg vulnerability** — the bridge is the most attacked component in practice
* **Federation trust** — federated pegs are partly centralised
* **Complexity**

### Examples

| Sidechain     | Parent   | Purpose                     |
| ------------- | -------- | --------------------------- |
| **Liquid**    | Bitcoin  | Fast confidential transfers |
| **Rootstock** | Bitcoin  | Smart contracts             |
| **Polygon PoS**| Ethereum| Low-cost scaling            |

> Bridges between chains have been the single largest source of losses in the industry — the peg, not the chain, is where sidechain security actually lives.

### Example

A trader moves bitcoin to the Liquid sidechain for two-minute confidential settlement between exchanges, then pegs back to the main chain for long-term custody — gaining speed temporarily without ever leaving the Bitcoin asset.
$md$, 14, false),

  (sid, 1, 'Explain the major vulnerabilities and security challenges associated with blockchain technology.', $md$
Blockchain provides strong guarantees at the protocol level, but real systems fail regularly — usually at the layers **around** the chain rather than in the cryptography itself.

### Consensus-Level Attacks

**1. 51% Attack**
An entity controlling a majority of hash power (PoW) or stake (PoS) can reorganise recent blocks and double spend.

```text
Attacker mines a SECRET chain
   -> spends coins on the public chain
   -> releases a longer secret chain
   -> the original spend is erased
```

Realistic for **smaller chains**; Ethereum Classic and Bitcoin Gold have both suffered such attacks.

**2. Selfish Mining** — withholding blocks to gain a disproportionate share of rewards
**3. Eclipse Attack** — isolating a node so it sees only attacker-supplied data
**4. Sybil Attack** — creating many identities; mitigated by PoW/PoS cost
**5. Long-Range Attack** — rewriting distant history in PoS, countered by checkpointing

### Smart Contract Vulnerabilities

| Vulnerability          | Description                              |
| ---------------------- | ---------------------------------------- |
| **Reentrancy**         | A contract is re-entered before state updates — the **DAO hack**, $60M |
| **Integer overflow**   | Arithmetic wrapping around               |
| **Access control flaws** | Missing permission checks              |
| **Front-running / MEV**| Observing pending transactions and jumping ahead |
| **Oracle manipulation**| Feeding false external data              |

Smart contracts are **immutable once deployed**, so a bug cannot simply be patched — the reason audits matter so much.

### Key and Wallet Security

* **Private key loss** — funds are permanently unrecoverable
* **Phishing and malware** — the most common real-world loss
* **Exchange compromises** — Mt. Gox, roughly 850,000 BTC

**Most losses come from key handling, not from broken cryptography.**

### Systemic and Practical Issues

* **Scalability** — low throughput causes congestion and high fees
* **Privacy** — pseudonymity is weaker than anonymity; chain analysis routinely deanonymises users
* **Regulatory uncertainty**
* **Bridge attacks** — cross-chain bridges have lost billions
* **Quantum risk** — future quantum computers threaten ECDSA signatures

### Where Failures Actually Occur

```text
Cryptography      : essentially never broken
Consensus         : rarely, mainly on small chains
Smart contracts   : FREQUENTLY
Bridges           : FREQUENTLY
Key management    : MOST COMMON cause of loss
```

> The blockchain itself is rarely the weak point. Attackers target the code written on top of it and the humans holding the keys.

### Example

The 2016 DAO reentrancy bug drained $60 million. The Ethereum protocol worked exactly as designed — the flaw was in application logic, and resolving it required a contentious hard fork that split the chain permanently.
$md$, 15, false),

  (sid, 2, 'Explain Cryptographic Hash Functions and their role in blockchain.', $md$
A **cryptographic hash function** maps input data of any size to a fixed-size output — the **hash** or **digest**. It is the fundamental building block of blockchain.

```text
H(input of any length) -> fixed-length output

H("hello")            -> 2cf24dba5fb0a30e...  (256 bits)
H(entire 500 MB file) -> 9f86d081884c7d65...  (256 bits)
```

### Essential Properties

**1. Deterministic** — identical input always yields identical output
**2. Fast to compute**
**3. Pre-image resistance (one-way)** — given H(x), finding x is computationally infeasible
**4. Second pre-image resistance** — given x, finding y ≠ x with H(y) = H(x) is infeasible
**5. Collision resistance** — finding **any** two inputs with the same hash is infeasible
**6. Avalanche effect** — changing one bit changes roughly half the output bits

```text
H("blockchain")  -> ef7797e13d3a75526946a3bcf00daec9...
H("Blockchain")  -> 9f0d4e6c2b8a1f3e7c5d9b2a4f6e8c1d...
                    completely different from ONE capital letter
```

### Roles in Blockchain

| Role                    | How hashing is used                          |
| ----------------------- | -------------------------------------------- |
| **Block linking**       | Each block stores the previous block's hash  |
| **Block identification**| A block's hash is its unique identifier      |
| **Merkle trees**        | Summarise all transactions into one root     |
| **Proof of Work**       | Mining searches for a hash below a target    |
| **Addresses**           | Derived by hashing public keys               |
| **Transaction IDs**     | The hash of the transaction data             |
| **Digital signatures**  | The message hash is what gets signed         |

### Why Immutability Follows from Hashing

```text
Block 1        Block 2        Block 3
[hash: A] <--- [prev: A] <--- [prev: B]
               [hash: B]      [hash: C]

Alter Block 1  ->  its hash changes to A'
               ->  Block 2's "prev: A" no longer matches
               ->  Block 2's hash changes
               ->  the entire chain after it breaks
```

Tampering is instantly detectable by any node, and repairing the chain would require redoing all subsequent Proof of Work.

> Hash functions give blockchain its tamper-evidence for free: nobody has to check for changes, because any change breaks the arithmetic everyone is already verifying.

### Example

Changing a single rupee in a transaction from ten years ago alters that block's hash, breaking every one of the ~500,000 blocks built on top — which is why old transactions are considered permanent.
$md$, 16, true),

  (sid, 2, 'Explain SHA-256 and its use in blockchain technology.', $md$
**SHA-256** (Secure Hash Algorithm 256-bit) is a cryptographic hash function from the SHA-2 family, designed by the NSA and published by NIST in 2001. It produces a **256-bit (32-byte)** digest and is the hash function underpinning Bitcoin.

### Characteristics

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| Output size      | 256 bits (64 hexadecimal characters) |
| Block size       | 512 bits                           |
| Rounds           | 64                                 |
| Possible outputs | 2²⁵⁶ ≈ 1.15 × 10⁷⁷                 |

The output space is comparable to the number of atoms in the observable universe, which is why brute-force search is infeasible.

### Example Outputs

```text
SHA-256("hello")
  = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824

SHA-256("Hello")
  = 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

One capital letter -> a completely unrelated output
```

### The Algorithm in Outline

```text
1. PADDING       append a 1 bit, then zeros, then the length
                 so the total is a multiple of 512 bits
2. PARSING       split into 512-bit blocks
3. INITIALISE    eight 32-bit working variables from the
                 fractional parts of square roots of primes
4. COMPRESSION   64 rounds of bitwise operations, modular
                 addition, rotations and XOR per block
5. OUTPUT        concatenate the final hash values -> 256 bits
```

### Uses in Bitcoin

| Use                    | Detail                                       |
| ---------------------- | -------------------------------------------- |
| **Mining (PoW)**       | **Double** SHA-256 of the block header       |
| **Block hash**         | Identifies and links blocks                  |
| **Merkle tree**        | Hashing transaction pairs upward             |
| **Transaction ID**     | Double SHA-256 of the transaction            |
| **Address generation** | SHA-256 followed by RIPEMD-160               |

**Why double hashing?** Bitcoin applies SHA-256 twice — `SHA256(SHA256(x))` — as a defensive measure against length-extension attacks, a known weakness of the Merkle–Damgård construction.

### Security Status

* **No practical collision** has ever been found
* Best known attacks affect only reduced-round variants
* Considered secure against classical computers
* **Quantum concern** — Grover's algorithm would halve effective security to 128 bits, which remains secure; the greater quantum risk is to **signatures**, not hashes

> SHA-256's role in mining is unusual: it was chosen not because it is hard to compute but because it is *unpredictable*, which is what makes the search fair.

### Example

Bitcoin miners compute SHA-256 hundreds of quintillions of times per second seeking a header hash with enough leading zeros. Each attempt is trivial; the difficulty comes entirely from how few of the 2²⁵⁶ outputs qualify.
$md$, 17, false),

  (sid, 2, 'Explain Hash Pointers and their role in blockchain data structures.', $md$
A **hash pointer** is a data structure that stores both **where** some data is located and the **cryptographic hash** of that data. The hash allows a reader to verify that the data has not been altered since the pointer was created.

### Ordinary Pointer vs Hash Pointer

```text
NORMAL POINTER:
   [ address ] ---------> data
   tells you WHERE the data is

HASH POINTER:
   [ address | hash ] ---> data
   tells you WHERE it is
   AND lets you VERIFY it is unchanged
```

### How Verification Works

```text
1. Follow the pointer and retrieve the data
2. Compute hash(retrieved data)
3. Compare with the stored hash

Match    -> data is intact
Mismatch -> data has been TAMPERED WITH
```

### Building a Blockchain from Hash Pointers

A blockchain is simply a **linked list built with hash pointers instead of ordinary pointers**.

```text
Block 3               Block 2               Block 1
+-------------+       +-------------+       +-------------+
| prev: H(B2) |------>| prev: H(B1) |------>| prev: null  |
| data        |       | data        |       | data        |
+-------------+       +-------------+       +-------------+

Head of chain stores H(B3) — one hash secures EVERYTHING
```

### The Tamper-Evidence Property

```text
Attacker modifies Block 1
   -> H(B1) changes
   -> Block 2's "prev" no longer matches -> detected
   -> to hide it, Block 2 must be changed
   -> which changes H(B2), breaking Block 3
   -> ... and so on to the head of the chain
```

Holding **only the final hash** is enough to detect tampering **anywhere** in the entire history — an extraordinarily efficient integrity guarantee.

### Other Structures Built from Hash Pointers

| Structure          | Built from                     | Used for                     |
| ------------------ | ------------------------------ | ---------------------------- |
| **Blockchain**     | Linked list of hash pointers   | Ordered transaction history  |
| **Merkle tree**    | Binary tree of hash pointers   | Efficient membership proofs  |
| **DAG**            | Graph of hash pointers         | IOTA, Git commits            |

Git uses precisely this idea: each commit references its parent by hash, which is why Git history is tamper-evident.

> One hash at the head of the chain certifies gigabytes of history — the reason a lightweight client can verify integrity without storing the ledger.

### Example

A node holding only the latest block hash can detect any alteration in a decade of transactions, because a single changed byte anywhere propagates a mismatch all the way to the head.
$md$, 18, false),

  (sid, 2, 'Explain Merkle Trees and their significance in blockchain.', $md$
A **Merkle tree** (hash tree) is a binary tree in which every leaf is the hash of a data block and every internal node is the hash of its two children. The single hash at the top is the **Merkle root**.

### Structure

```text
                 ROOT
              H(H12 + H34)
              /          \
          H12              H34
      H(H1+H2)          H(H3+H4)
        /    \            /    \
      H1      H2        H3      H4
      |       |         |       |
     Tx1     Tx2       Tx3     Tx4
```

If the number of transactions is odd, the last hash is **duplicated** to complete the pair.

### Construction

```text
1. Hash each transaction        -> leaf nodes
2. Pair adjacent hashes and hash the concatenation
3. Repeat upward
4. Continue until a single hash remains -> MERKLE ROOT
```

Only the **Merkle root** is stored in the block header, summarising every transaction in the block in 32 bytes.

### Merkle Proof — the Key Benefit

To prove Tx3 is in the block, a verifier needs only the hashes along the path to the root:

```text
To verify Tx3, you need:  H4, H12

  compute H3   = hash(Tx3)
  compute H34  = hash(H3 + H4)
  compute ROOT = hash(H12 + H34)
  compare with the block header's Merkle root
```

Just **2 hashes** instead of all 4 transactions. For a block of **n** transactions the proof size is **log₂(n)**:

| Transactions | Hashes needed |
| ------------ | ------------- |
| 4            | 2             |
| 1,024        | 10            |
| 1,048,576    | **20**        |

### Significance in Blockchain

* **Efficient verification** — logarithmic rather than linear
* **Simplified Payment Verification (SPV)** — light wallets verify transactions without downloading the whole chain
* **Tamper detection** — changing any transaction changes the root
* **Compact block headers** — one 32-byte root represents thousands of transactions
* **Bandwidth saving** for mobile and constrained clients

> The Merkle root is what allows a phone wallet to trust a transaction while storing less than a millionth of the blockchain.

### Example

Verifying one transaction in a block of a million would require the entire block without a Merkle tree. With one, a mobile wallet downloads **20 hashes** — about 640 bytes — and proves membership conclusively.
$md$, 19, false),

  (sid, 2, 'Explain the concept of a Distributed Ledger.', $md$
A **distributed ledger** is a database of records **replicated and synchronised across many independent nodes**, with no central administrator. Every participant holds a copy, and consensus keeps the copies identical.

### Contrast with a Centralised Ledger

```text
CENTRALISED                    DISTRIBUTED
   [ ledger ]                  [L]---[L]---[L]
       |                         \    |    /
   /   |   \                      [L]-[L]-[L]
  U    U    U               every node holds a full copy
one authoritative copy       consensus keeps them equal
```

### Key Characteristics

* **Replication** — every node has the full record
* **Synchronisation** — consensus keeps copies consistent
* **No central authority**
* **Transparency** — participants can audit
* **Immutability** — records are append-only
* **Cryptographic security** — signatures and hashes
* **Fault tolerance** — surviving nodes preserve the data

### Distributed Ledger Technology (DLT) vs Blockchain

**Blockchain is one type of distributed ledger**, not a synonym.

| Structure     | Organisation           | Example        |
| ------------- | ---------------------- | -------------- |
| **Blockchain**| Sequential chain of blocks | Bitcoin    |
| **DAG**       | Directed acyclic graph | IOTA, Hedera   |
| **Hashgraph** | Gossip-based consensus | Hedera         |
| **Holochain** | Agent-centric ledgers  | Holochain      |

DAG-based ledgers have no blocks and no mining — transactions directly reference earlier ones — yet remain distributed ledgers.

### Types by Access

| Type          | Who may participate           |
| ------------- | ----------------------------- |
| **Permissionless** | Anyone                   |
| **Permissioned**   | Approved members only    |

### Advantages and Limitations

**Advantages** — no single point of failure, tamper resistance, transparency, reduced reconciliation between organisations, disintermediation.

**Limitations** — storage duplication at every node, slower than centralised systems, consensus overhead, privacy difficulties, and the challenge of correcting genuine errors in an append-only record.

> The real commercial value of DLT is usually **reconciliation elimination**: when several organisations share one authoritative record, the expensive work of comparing separate ledgers disappears.

### Example

Several banks maintaining separate ledgers spend heavily reconciling differences. A shared distributed ledger means one agreed record — the reconciliation cost vanishes because there is nothing left to reconcile.
$md$, 20, false),

  (sid, 2, 'Explain the Proof of Work consensus algorithm.', $md$
**Proof of Work (PoW)** requires participants to demonstrate that they have expended real computational effort before being allowed to add a block. It was the first workable solution to permissionless consensus.

### The Mechanism

```text
Find a nonce such that:
    HASH(block header + nonce)  <  target

Lower target = more leading zeros required = harder
```

The only strategy is brute force, because hash outputs cannot be predicted.

```text
nonce 1       -> a3f7...  fail
nonce 2       -> 9c21...  fail
...
nonce 8471293 -> 00000a3f...  SUCCESS
```

### The Essential Asymmetry

```text
PRODUCING the proof : quintillions of hash attempts
VERIFYING the proof : ONE hash computation
```

This is what makes the system work: every node can cheaply audit work that was enormously expensive to create.

### Difficulty Adjustment

Bitcoin recalculates difficulty every **2016 blocks** (~2 weeks) targeting a 10-minute block interval. If hash power doubles, difficulty doubles, and block time returns to 10 minutes.

### Security Model

An attacker must control **>50% of network hash power** to reliably rewrite history. The cost is the hardware and electricity to out-compute the entire honest network — and success would devalue the asset being attacked.

### Advantages

* **Proven** — securing Bitcoin since 2009
* **Truly permissionless** — no capital or approval needed to start
* **Objective** — the valid chain is determined by measurable work
* **Sybil resistant** — identities are worthless without hash power

### Disadvantages

| Disadvantage             | Detail                                  |
| ------------------------ | --------------------------------------- |
| **Energy consumption**   | Comparable to a mid-sized nation        |
| **Low throughput**       | ~7 TPS for Bitcoin                      |
| **Hardware centralisation** | ASICs and pools concentrate power    |
| **Slow finality**        | ~60 minutes for high confidence          |
| **Wasted computation**   | Hashing serves no purpose beyond security |

### The Energy Debate

The energy is not incidental — it **is** the security. Making blocks cheap to produce would make attacks cheap too. Whether that cost is worth paying is a value judgement, and it motivated the development of Proof of Stake.

> PoW converts electricity into irreversibility: the chain is hard to rewrite precisely because it was expensive to write.

### Example

Reversing a 6-confirmation Bitcoin transaction would require out-mining the global network for an hour — hundreds of millions of dollars in hardware and power for a single double spend.
$md$, 21, false),

  (sid, 2, 'Explain the Proof of Stake consensus algorithm.', $md$
**Proof of Stake (PoS)** selects who creates the next block based on the amount of cryptocurrency a participant has **staked** as collateral, rather than on computational work.

### The Core Idea

```text
PoW:  influence proportional to COMPUTING POWER
PoS:  influence proportional to STAKED CAPITAL
```

Validators lock coins as a bond. Dishonest behaviour causes that bond to be destroyed — a mechanism called **slashing**.

### How It Works

```text
1. Validators LOCK coins as stake
2. The protocol SELECTS a proposer, weighted by stake
      (with randomisation to prevent predictability)
3. The proposer creates a block
4. Other validators ATTEST that it is valid
5. With sufficient attestations the block is FINALISED
6. Honest validators earn rewards
7. Dishonest validators are SLASHED — stake destroyed
```

### Selection Methods

| Method                 | Basis                                   |
| ---------------------- | --------------------------------------- |
| **Randomised**         | Stake-weighted random choice            |
| **Coin age**           | Stake amount × time held                |
| **Committee-based**    | Random committees vote per slot         |

Pure "largest stake wins" would let the wealthiest validator dominate, so randomisation is essential.

### Security Model

An attacker needs **>51% of the total staked supply**. Unlike PoW, the attack is **self-punishing**: acquiring that much stake requires buying an enormous share of the asset, and attacking it destroys both the stake (through slashing) and the asset's value.

### Advantages

* **Energy efficient** — Ethereum's Merge cut consumption by roughly **99.95%**
* **Lower entry barrier** — no specialised hardware
* **Faster finality** — deterministic finality in modern designs
* **Economic penalties** — misbehaviour costs money directly
* **Less hardware centralisation**

### Disadvantages

| Disadvantage            | Detail                                       |
| ----------------------- | -------------------------------------------- |
| **Wealth concentration**| "The rich get richer" — large stakes earn more |
| **Nothing-at-stake**    | Historically, validating multiple forks was free; solved by slashing |
| **Long-range attacks**  | Old keys could rewrite distant history; countered by checkpoints |
| **Less battle-tested**  | Shorter track record than PoW                |
| **Staking centralisation** | Exchanges and pools concentrate stake     |

> PoS replaces an **external** cost (electricity) with an **internal** one (capital at risk) — which is more efficient but ties security to the token's own value.

### Example

Ethereum requires 32 ETH to run a validator. A validator signing two conflicting blocks is slashed and ejected, losing a substantial portion of that stake — the penalty that makes honest behaviour the rational choice.
$md$, 22, false),

  (sid, 2, 'Explain Delegated Proof of Stake.', $md$
**Delegated Proof of Stake (DPoS)** is a variant of PoS in which coin holders **vote** for a small number of **delegates** (witnesses or block producers) who validate transactions and produce blocks on their behalf. It is a representative democracy rather than direct participation.

### How It Works

```text
1. Token holders VOTE for delegates
      voting power proportional to holdings
2. The top N vote-getters become active BLOCK PRODUCERS
      (EOS: 21, TRON: 27)
3. Producers take TURNS producing blocks in a schedule
4. Rewards are shared with the voters who elected them
5. Underperforming or dishonest delegates are VOTED OUT
```

```text
Thousands of holders
        |  vote
        v
   21 delegates  ->  produce blocks in rotation
        |
   continuous accountability — votes can change at any time
```

### Advantages

* **Very high throughput** — thousands of TPS, since only a few nodes must agree
* **Fast finality** — blocks confirm in seconds
* **Energy efficient**
* **Democratic accountability** — bad actors are removed by vote
* **Low hardware requirements** for ordinary holders
* **Scalable** — consensus among 21 nodes is far faster than among thousands

### Disadvantages

| Disadvantage            | Detail                                    |
| ----------------------- | ----------------------------------------- |
| **Centralisation**      | Only 21–27 producers control the network  |
| **Voter apathy**        | Most holders never vote                   |
| **Vote buying**         | Delegates may bribe voters with rewards   |
| **Cartel formation**    | Producers may collude to stay elected     |
| **Plutocracy**          | Large holders dominate the outcome        |

### Comparison with PoS

| Aspect        | PoS                     | DPoS                   |
| ------------- | ----------------------- | ---------------------- |
| Validators    | Many (thousands)        | **Few (21–27)**        |
| Selection     | Stake-weighted random   | **Elected by vote**    |
| Throughput    | Moderate                | **Very high**          |
| Decentralisation | **Higher**           | Lower                  |
| Finality      | Fast                    | **Very fast**          |

### The Honest Assessment

DPoS deliberately trades decentralisation for performance. With 21 producers it resembles a **permissioned** system whose membership is decided by token vote. Whether that is acceptable depends on the application — it is a reasonable choice for a high-throughput platform and a poor one for censorship-resistant money.

> DPoS is best understood not as a weaker PoS but as a different design point: it accepts a small validator set in exchange for the throughput that public chains otherwise cannot reach.

### Example

EOS achieves thousands of transactions per second with 21 block producers. Critics note this is far closer to a consortium chain than to Bitcoin's decentralisation — a criticism EOS does not really dispute, since throughput was the explicit goal.
$md$, 23, false),

  (sid, 2, 'Explain Proof of Elapsed Time.', $md$
**Proof of Elapsed Time (PoET)** is a consensus algorithm developed by Intel in which each participant waits a **random period** and whoever's wait expires first produces the next block. It achieves fair leader election without wasting energy.

### The Mechanism

```text
1. Each validator requests a RANDOM wait time
      from a trusted execution environment (TEE)
2. All validators SLEEP for their assigned duration
3. The one with the SHORTEST wait wakes first
      -> becomes the leader and creates the block
4. The TEE issues a CERTIFICATE proving:
      - the wait time was genuinely random
      - the validator actually waited
5. Other validators verify the certificate
```

### The Role of Trusted Hardware

The obvious attack is to simply claim a short wait time without waiting. PoET prevents this using **Intel SGX** (Software Guard Extensions), a hardware enclave that:

* Generates the wait time **verifiably at random**
* Cannot be tampered with by the machine's owner
* Produces an **attestation** others can check

```text
Without trusted hardware: everyone claims "my wait was 0 seconds"
With SGX:                 the claim is cryptographically provable
```

### Advantages

* **Energy efficient** — validators sleep rather than compute
* **Fair** — every participant has an equal chance, independent of wealth or hardware power
* **Low cost** — no mining rigs, no large stake required
* **High throughput** — suits permissioned enterprise networks
* **Scales well** with participant count

### Disadvantages

| Disadvantage              | Detail                                     |
| ------------------------- | ------------------------------------------ |
| **Hardware dependency**   | Requires Intel SGX — vendor lock-in        |
| **Trust in the manufacturer** | Security ultimately rests on Intel     |
| **SGX vulnerabilities**   | Several side-channel attacks (Foreshadow, Plundervolt) have been demonstrated |
| **Not truly trustless**   | Contradicts the permissionless ideal       |
| **Limited to permissioned use** | Unsuitable for public chains         |

### Where It Is Used

**Hyperledger Sawtooth** is the primary implementation — an enterprise, permissioned framework where trusting a hardware vendor is an acceptable assumption.

### The Fundamental Tension

PoET replaces "trust no one" with "trust Intel". For a public chain that is a fatal weakness; for a consortium of known companies already trusting their own hardware suppliers, it is a reasonable and highly efficient trade.

> PoET achieves the *fairness* of a lottery with none of the energy cost — provided you accept that the lottery operator is a hardware vendor.

### Example

A supply-chain consortium of twelve companies runs Sawtooth with PoET. Leader election is fair and nearly free in energy terms, and since all members already run Intel servers, the trust assumption costs them nothing they had not already accepted.
$md$, 24, false),

  (sid, 2, 'Compare Proof of Work, Proof of Stake, Delegated Proof of Stake, and Proof of Elapsed Time.', $md$
The four algorithms solve the same problem — choosing who adds the next block — using fundamentally different scarce resources.

### The Basis of Each

```text
PoW  : computational work    (electricity + hardware)
PoS  : staked capital        (coins at risk)
DPoS : delegated votes       (elected representatives)
PoET : random wait time      (trusted hardware)
```

### Comprehensive Comparison

| Criterion             | PoW              | PoS              | DPoS             | PoET             |
| --------------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| **Resource**          | Computing power  | Staked coins     | Votes            | Wait time        |
| **Energy use**        | **Very high**    | Very low         | Very low         | Very low         |
| **Throughput**        | Low (~7 TPS)     | Medium (~30–100) | **Very high (1000s)** | High         |
| **Finality**          | Probabilistic    | Fast, deterministic | **Very fast** | Fast             |
| **Decentralisation**  | **High**         | High             | **Low**          | Medium           |
| **Entry barrier**     | Hardware cost    | Capital (stake)  | Low (voting)     | SGX hardware     |
| **Attack threshold**  | 51% hash power   | 51% stake        | Majority of delegates | Compromise SGX |
| **Permission model**  | Permissionless   | Permissionless   | Permissionless   | **Permissioned** |
| **Maturity**          | **Most proven**  | Proven           | Proven           | Limited          |
| **Examples**          | Bitcoin          | Ethereum, Cardano| EOS, TRON        | Hyperledger Sawtooth |

### Principal Weakness of Each

| Algorithm | Main weakness                                    |
| --------- | ------------------------------------------------ |
| **PoW**   | Enormous energy consumption; ASIC centralisation |
| **PoS**   | Wealth concentration — the rich get richer       |
| **DPoS**  | Very few validators; close to centralised        |
| **PoET**  | Depends on trusting Intel hardware               |

### Choosing Between Them

```text
Maximum security & decentralisation, cost no object  -> PoW
Public chain, energy-conscious, good decentralisation -> PoS
High throughput matters most, some centralisation OK  -> DPoS
Permissioned enterprise network, known members        -> PoET
```

### The Underlying Trilemma

All four are positions on the **scalability trilemma**: no system yet maximises decentralisation, security and scalability simultaneously.

```text
        Decentralisation
             /\
            /  \
     PoW   /    \   PoS
          /      \
         /  DPoS  \
        /__________\
   Security      Scalability
```

> There is no best algorithm — only the right trade for a given application. PoW buys security with electricity; DPoS buys speed with centralisation; PoET buys efficiency with vendor trust.

### Example

Bitcoin keeps PoW despite its energy cost because its purpose — censorship-resistant money — depends on maximum decentralisation. Ethereum moved to PoS because a smart-contract platform needs throughput and sustainability more than it needs PoW's specific guarantees.
$md$, 25, false);

  RAISE NOTICE 'Block Chain Technology — Units 1 & 2: 25 questions inserted.';
END $do$;
