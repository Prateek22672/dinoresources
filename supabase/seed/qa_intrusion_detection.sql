-- =====================================================================
-- Study-With-AI seed — Intrusion Detection and Prevention Systems (4th Year)
-- UNITS 1 & 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Intrusion Detection and Prevention Systems' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Intrusion Detection and Prevention Systems" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number IN (1,2) AND question IN (
    'Explain the concept of Intrusion and the need for Intrusion Detection and Prevention Systems.',
    'Explain Attack Taxonomies and their role in classifying intrusions.',
    'Explain Probes and their role in intrusion attempts.',
    'Explain Privilege Escalation Attacks.',
    'Explain Denial of Service (DoS) and Distributed Denial of Service (DDoS) Attacks.',
    'Differentiate between Active Attacks and Passive Attacks.',
    'Explain Malicious Attacks.',
    'Explain Insider Attacks.',
    'Explain Sniffer Attacks.',
    'Explain Side-Channel Attacks.',
    'Explain Worm Attacks.',
    'Explain Distributed Attacks.',
    'Explain the different types of Intrusion Detection Systems (IDS).',
    'Explain the major Detection Approaches used in Intrusion Detection Systems.',
    'Explain Misuse Detection and its working principle.',
    'Explain Anomaly Detection and its working principle.',
    'Explain Specification-Based Detection.',
    'Explain Hybrid Detection and its advantages.',
    'Explain the Taxonomy of Anomaly Detection Systems.',
    'Explain the application of Fuzzy Logic in Intrusion Detection.',
    'Explain the application of Bayes Theory in Intrusion Detection.',
    'Explain the use of Artificial Neural Networks in Intrusion Detection.',
    'Explain the use of Support Vector Machines in Intrusion Detection.',
    'Explain Evolutionary Computation and its application to intrusion detection.',
    'Explain Association Rules and their application in intrusion detection.',
    'Explain Clustering and its application in intrusion detection.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain the concept of Intrusion and the need for Intrusion Detection and Prevention Systems.', $md$
An **intrusion** is any unauthorised activity that attempts to compromise the **confidentiality, integrity or availability** (the CIA triad) of a computer system or network.

### What Constitutes an Intrusion

* Unauthorised access to systems or data
* Privilege escalation beyond what was granted
* Malware installation
* Data theft or modification
* Service disruption
* Policy violations, including by legitimate users

### Why Prevention Alone Is Insufficient

Firewalls, authentication and encryption are **preventive** controls, but they cannot stop everything:

| Preventive control fails against | Reason                              |
| -------------------------------- | ----------------------------------- |
| **Insider threats**              | The user is already authorised      |
| **Zero-day exploits**            | No patch or signature exists yet    |
| **Stolen credentials**           | The attacker looks legitimate       |
| **Misconfiguration**             | The control is simply not enforced  |
| **Encrypted attacks**            | Firewalls cannot inspect the payload|

This is the core justification for detection: **assume prevention will eventually fail**, and ensure the failure is noticed.

### IDS vs IPS

```text
IDS (Detection):   monitors, analyses, ALERTS
                   passive — placed out of band (on a SPAN port)

IPS (Prevention):  monitors, analyses, BLOCKS
                   active — placed IN-LINE in the traffic path
```

| Aspect          | IDS              | IPS                   |
| --------------- | ---------------- | --------------------- |
| Placement       | Out of band      | **In-line**           |
| Action          | Alert only       | Alert and **block**   |
| Failure impact  | Attack proceeds  | May block legitimate traffic |
| Latency added   | None             | Some                  |
| False positive cost | Wasted analyst time | **Denied service** |

The trade-off is critical: an IPS false positive **blocks real users**, so IPS rules are tuned conservatively while IDS can afford to be sensitive.

### Need for IDPS

* **Detect** attacks that bypass preventive controls
* **Provide visibility** into what is actually happening on the network
* **Support forensics** after an incident
* **Meet compliance requirements** (PCI-DSS, HIPAA, ISO 27001)
* **Deter** attackers who know they are monitored

> Security's working assumption today is not "keep attackers out" but "detect them quickly once they are in" — a shift IDPS exists to serve.

### Example

An attacker uses stolen valid credentials to log in. The firewall permits it and authentication succeeds — nothing preventive is violated. An IDS notices the login originates from an unusual country at 3 a.m. and accesses records the user never touches, and raises an alert.
$md$, 1, true),

  (sid, 1, 'Explain Attack Taxonomies and their role in classifying intrusions.', $md$
An **attack taxonomy** is a structured classification of attacks. Classification matters because it lets defenders reason about categories of threat rather than an endless list of individual exploits.

### Classification by Attack Objective

The widely used **DARPA/KDD taxonomy** defines four classes:

| Class    | Full name                  | Goal                                  | Example         |
| -------- | -------------------------- | ------------------------------------- | --------------- |
| **DoS**  | Denial of Service          | Make a resource unavailable           | SYN flood, Smurf|
| **Probe**| Surveillance / scanning    | Gather information for a later attack | Port scan, Nmap |
| **R2L**  | Remote to Local            | Gain local access from remote         | Password guessing, phishing |
| **U2R**  | User to Root               | Escalate from user to administrator   | Buffer overflow |

### Classification by Attacker Location

* **External attacks** — from outside the network perimeter
* **Internal (insider) attacks** — from within, by an authorised user

### Classification by Attack Behaviour

* **Passive** — observing without altering (eavesdropping, traffic analysis)
* **Active** — modifying or disrupting (spoofing, injection, DoS)

### Classification by Target

Network, host, application, data, or physical layer.

### Classification by Attack Vector

Malware, social engineering, exploitation of software flaws, misconfiguration, supply chain compromise.

### The Cyber Kill Chain

A widely used process taxonomy describing attack **stages**:

```text
1. Reconnaissance   -> gather information
2. Weaponisation    -> build the exploit
3. Delivery         -> transmit it
4. Exploitation     -> trigger the vulnerability
5. Installation     -> establish persistence
6. Command & Control-> establish remote control
7. Actions on Objectives -> steal, destroy, disrupt
```

The value of this model is that **breaking any single link** disrupts the whole attack — defenders need not stop every stage.

### Role of Taxonomies

* **Structured defence** — controls can be mapped to attack classes
* **Detection design** — different classes need different detection techniques
* **Common vocabulary** for incident reporting
* **Dataset labelling** for machine-learning research
* **Risk assessment and prioritisation**

> Taxonomies matter most for detection design: a probe and a DoS produce completely different traffic signatures, so one detector cannot serve both well.

### Example

Labelling an incident as **U2R** immediately tells responders to examine local privilege logs and setuid binaries, rather than the network perimeter — the classification directs the investigation.
$md$, 2, false),

  (sid, 1, 'Explain Probes and their role in intrusion attempts.', $md$
A **probe** is a reconnaissance activity in which an attacker gathers information about a target system or network without necessarily causing damage. It is the **first stage** of most structured attacks.

### Purpose

Probing answers the questions an attacker needs before acting:

* Which hosts are alive?
* Which ports are open, and what services listen on them?
* What operating system and software versions are running?
* Which known vulnerabilities apply?
* How is the network laid out?

### Types of Probes

**1. Port Scanning**

| Scan type       | Method                              | Stealth  |
| --------------- | ----------------------------------- | -------- |
| **TCP Connect** | Completes the full handshake        | Low — logged |
| **SYN (half-open)** | Sends SYN, never completes      | Higher   |
| **FIN / NULL / Xmas** | Unusual flag combinations     | High     |
| **UDP scan**    | Probes UDP services                 | Slow     |

**2. Network Mapping** — ping sweeps and traceroute to build a topology
**3. OS Fingerprinting** — inferring the operating system from subtle differences in TCP/IP stack behaviour
**4. Service and Version Detection** — banner grabbing to identify software versions
**5. Vulnerability Scanning** — automated testing against known vulnerability databases

### Why Probes Are Significant

```text
PROBE  ->  identifies weakness  ->  targeted EXPLOIT

Detecting the probe gives defenders warning
BEFORE the actual attack begins.
```

Probing is the one attack stage that is **loud by nature** — the attacker must send traffic and receive responses, which is exactly what makes it detectable.

### Detection Characteristics

| Indicator                        | Suggests            |
| -------------------------------- | ------------------- |
| Many connections to sequential ports | Port scan       |
| High rate of failed connections  | Scanning           |
| Connections to unused IP addresses | Network sweep    |
| Unusual TCP flag combinations    | Stealth scan       |
| Probing from a single source to many hosts | Reconnaissance |

### Evasion Techniques

Attackers slow scans over days (**low and slow**), randomise port order, use **decoy** source addresses, or distribute scanning across many hosts — all designed to stay below detection thresholds.

> A probe causes no damage, which is precisely why it should never be ignored: it is the clearest early warning a defender ever gets.

### Example

An IDS observes 1,500 connection attempts from one address to sequential ports on a server within 30 seconds. No harm was done, but the pattern is unmistakably an Nmap scan — and blocking that address now may prevent the exploit that would have followed.
$md$, 3, false),

  (sid, 1, 'Explain Privilege Escalation Attacks.', $md$
A **privilege escalation attack** is an attempt to gain higher access rights than were granted — typically moving from an ordinary user account to administrator or root.

### The Two Forms

**1. Vertical Privilege Escalation (Elevation of Privilege)**
Gaining **higher** privileges than the current account holds.

```text
normal user  ->  administrator / root
```

**2. Horizontal Privilege Escalation**
Accessing resources belonging to **another user at the same level**.

```text
User A  ->  accesses User B's account/data
(same privilege level, different owner)
```

### Common Techniques

| Technique                    | Mechanism                                   |
| ---------------------------- | ------------------------------------------- |
| **Buffer overflow**          | Overwrite memory to execute injected code   |
| **Setuid/SUID abuse**        | Exploit programs running as root            |
| **Kernel exploits**          | Vulnerabilities in the OS kernel itself     |
| **Misconfigured permissions**| World-writable system files or scripts      |
| **DLL / library hijacking**  | Substitute a malicious library              |
| **Credential theft**         | Harvest stored passwords or tokens          |
| **Race conditions (TOCTOU)** | Exploit the gap between check and use       |
| **Insecure services**        | Services running with excessive privilege   |

### Why It Matters

Initial compromise usually yields only **limited** access — a low-privilege web account, or a standard user session. Privilege escalation is what converts a foothold into full control.

```text
Kill chain position:

Exploitation -> low-privilege foothold
        |
   PRIVILEGE ESCALATION   <-- this step
        |
Installation -> persistence -> data theft
```

### Detection Indicators

* Unexpected `sudo` or `su` usage
* New accounts created, especially administrative ones
* Changes to group memberships
* Access to files outside the user's normal pattern
* Execution of known exploit binaries
* Unusual process parent–child relationships (a web server spawning a shell)

### Prevention

* **Principle of least privilege** — grant only what is required
* **Prompt patching** of kernel and system software
* Remove unnecessary **setuid** binaries
* **Application whitelisting**
* **Multi-factor authentication** for administrative accounts
* Regular permission audits

> The most valuable single control is least privilege: it does not prevent escalation attempts but sharply limits what a successful one achieves.

### Example

An attacker compromises a web application running as `www-data` — a deliberately limited account. They then exploit an unpatched kernel flaw to obtain root, gaining the ability to read every database and install persistence. The web flaw was the entry; the escalation was the actual breach.
$md$, 4, false),

  (sid, 1, 'Explain Denial of Service (DoS) and Distributed Denial of Service (DDoS) Attacks.', $md$
A **Denial of Service (DoS)** attack makes a resource unavailable to legitimate users by exhausting its capacity. A **Distributed** DoS (DDoS) does the same from **many** sources simultaneously.

### DoS vs DDoS

```text
DoS:                          DDoS:
  attacker                      attacker
     |                             |
     v                        [ botnet C&C ]
  [ target ]                   /   |   \
                            bot  bot  bot ... (thousands)
                               \  |  /
                              [ target ]
```

DDoS is far harder to defend against because the traffic comes from thousands of legitimate-looking addresses, so simple blocking fails.

### Categories of Attack

**1. Volumetric Attacks** — saturate bandwidth
* **UDP flood**, **ICMP flood**
* **Amplification attacks** — the most efficient form:

```text
Attacker sends small query with SPOOFED source (the victim's IP)
        |
   DNS/NTP server sends a MUCH LARGER response to the victim

DNS amplification: ~50x
NTP amplification: ~500x
```

**2. Protocol Attacks** — exhaust connection state
* **SYN flood** — send SYN packets, never complete the handshake, filling the connection table
* **Ping of Death**, **Smurf attack**

**3. Application-Layer Attacks** — exhaust server processing
* **HTTP flood** — many apparently legitimate requests
* **Slowloris** — hold connections open with partial requests
* Hardest to detect, because each request looks valid

### Impact

Service downtime, revenue loss, reputational damage — and frequently DDoS is used as a **smokescreen** to distract defenders while a genuine intrusion proceeds elsewhere.

### Defences

| Defence                    | Purpose                              |
| -------------------------- | ------------------------------------ |
| **Rate limiting**          | Cap requests per source              |
| **SYN cookies**            | Defeat SYN floods without state      |
| **Traffic scrubbing**      | Filter through a cleaning service    |
| **CDN / anycast**          | Absorb and distribute load           |
| **Blackhole routing**      | Drop traffic to the targeted address |
| **Ingress filtering (BCP38)** | Prevent source-address spoofing   |

> Amplification attacks persist because they exploit **other people's** misconfigured servers — which is why ingress filtering at the network edge is a shared responsibility rather than a victim's problem.

### Example

A 1 Gbps attacker sends spoofed DNS queries with the victim's address as source. Open resolvers reply with 50× larger responses, delivering 50 Gbps to the victim — the attacker's modest connection multiplied into an overwhelming flood.
$md$, 5, false),

  (sid, 1, 'Differentiate between Active Attacks and Passive Attacks.', $md$
Attacks divide fundamentally into those that **only observe** and those that **alter or disrupt** — a distinction that determines both their impact and how they can be countered.

### Passive Attacks

The attacker **monitors** without modifying anything. The system continues to function normally.

**Types**
* **Eavesdropping / sniffing** — capturing traffic
* **Traffic analysis** — inferring information from patterns, volumes and timing even when content is encrypted

**Characteristics**
* **Very difficult to detect** — nothing changes
* Threatens **confidentiality** only
* Prevention rather than detection is the answer

### Active Attacks

The attacker **modifies** data or **disrupts** operation.

**Types**
* **Masquerade** — impersonating a legitimate entity
* **Replay** — capturing and retransmitting valid messages
* **Modification** — altering messages in transit
* **Denial of Service** — preventing legitimate use
* **Man-in-the-middle** — intercepting and possibly altering a conversation

**Characteristics**
* **Detectable**, since behaviour changes
* Threatens **integrity** and **availability**
* Detection and recovery are feasible

### Comparison

| Aspect               | Passive              | Active                    |
| -------------------- | -------------------- | ------------------------- |
| Data modified?       | **No**               | **Yes**                   |
| Detectable?          | **Very hard**        | Yes                       |
| System harmed?       | No                   | Yes                       |
| CIA affected         | Confidentiality      | Integrity, Availability   |
| Primary countermeasure | **Prevention (encryption)** | **Detection and recovery** |
| Victim awareness     | Usually none         | Usually apparent          |

### The Strategic Difference

```text
PASSIVE:  cannot reliably DETECT  ->  must PREVENT (encrypt everything)
ACTIVE:   cannot reliably PREVENT ->  must DETECT and RECOVER
```

This asymmetry is why encryption is the standard answer to eavesdropping while IDS and integrity checks are the answer to tampering.

### Traffic Analysis — the Subtle Threat

Even with strong encryption, an observer learns **who talks to whom, when, how often and how much** — frequently enough to draw damaging conclusions. Encrypted traffic to a medical clinic still reveals a relationship with that clinic.

> Passive attacks are the more insidious precisely because there is no incident to respond to — the victim may never learn it happened.

### Example

An attacker capturing Wi-Fi traffic reads unencrypted credentials with no trace left (passive). The same attacker modifying a bank transfer's account number is immediately visible once the transaction is reconciled (active).
$md$, 6, false),

  (sid, 1, 'Explain Malicious Attacks.', $md$
**Malicious attacks** are deliberate actions intended to harm a system, steal data or disrupt operations. The defining feature is **intent** — distinguishing them from accidental damage or user error.

### Categories of Malware

| Type            | Defining behaviour                                   |
| --------------- | ---------------------------------------------------- |
| **Virus**       | Attaches to a host file; needs **user action** to spread |
| **Worm**        | **Self-replicating**; spreads without user action    |
| **Trojan**      | Disguised as legitimate software                     |
| **Ransomware**  | Encrypts data and demands payment                    |
| **Spyware**     | Covertly collects information                        |
| **Rootkit**     | Hides its presence at a deep system level            |
| **Keylogger**   | Records keystrokes                                   |
| **Botnet agent**| Enrols the machine into an attacker-controlled network |
| **Logic bomb**  | Triggers on a condition or date                      |
| **Adware**      | Displays unwanted advertising                        |

### Other Malicious Attack Types

**Social engineering** — manipulating people rather than systems: phishing, spear phishing, pretexting, baiting. Consistently the most successful attack vector, because it bypasses technical controls entirely.

**Injection attacks** — SQL injection, command injection, cross-site scripting (XSS)
**Session attacks** — session hijacking, cross-site request forgery (CSRF)
**Password attacks** — brute force, dictionary, credential stuffing, rainbow tables
**Supply chain attacks** — compromising a trusted vendor to reach their customers

### Attacker Motivations

| Motivation      | Typical actor                    |
| --------------- | -------------------------------- |
| Financial gain  | Cybercriminals, ransomware groups|
| Espionage       | Nation-states, competitors       |
| Hacktivism      | Ideologically motivated groups   |
| Disruption      | Nation-states, vandals           |
| Revenge         | Disgruntled insiders             |

### Detection Indicators

Unexpected outbound connections, unusual process behaviour, modified system files, degraded performance, disabled security software, unexplained account activity.

### Defences

Layered controls: antivirus and EDR, patching, least privilege, network segmentation, email filtering, **user awareness training**, tested backups.

> Technical controls have improved faster than human judgement, which is why phishing remains the most common entry point despite being the least sophisticated attack.

### Example

Ransomware arrives as a phishing attachment, encrypts network shares, and demands payment. Antivirus may miss a novel variant, but an IDS detects the **abnormal volume of file modifications** — behavioural detection catching what signatures missed.
$md$, 7, false),

  (sid, 1, 'Explain Insider Attacks.', $md$
An **insider attack** originates from someone with **legitimate authorised access** — an employee, contractor or partner. It is among the most damaging categories precisely because perimeter defences are irrelevant.

### Types of Insiders

**1. Malicious Insider** — deliberately causes harm for revenge, profit or ideology
**2. Negligent Insider** — causes harm through carelessness: weak passwords, mishandled data, falling for phishing
**3. Compromised Insider** — a legitimate account taken over by an external attacker

The third category is important: the activity is technically an outsider's, but it **appears** to be an insider's, and detection must treat it as such.

### Why Insider Attacks Are Hard to Detect

| Factor                      | Consequence                          |
| --------------------------- | ------------------------------------ |
| **Legitimate credentials**  | Authentication succeeds normally     |
| **Authorised access**       | No permission is violated            |
| **Knowledge of systems**    | Knows what is valuable and where     |
| **Knows the monitoring**    | Can avoid the controls in place      |
| **Trusted position**        | Activity attracts less suspicion     |
| **Behind the perimeter**    | Firewalls and IDS at the edge see nothing |

### Common Insider Activities

* Copying sensitive data to removable media or personal cloud storage
* Accessing records unrelated to the person's role
* Emailing confidential data externally
* Installing unauthorised software or backdoors
* Sabotaging systems before or after resignation
* Abusing administrative privileges

### Detection Approaches — Behavioural, Not Signature-Based

**UEBA (User and Entity Behaviour Analytics)** builds a baseline of each user's normal behaviour and flags deviations:

```text
Baseline: accesses ~20 customer records/day, 9am-6pm, from office

Alert:    accessed 5,000 records at 2am from home
          -> deviation from established pattern
```

Other indicators include large downloads, access to unusual systems, off-hours activity, and **activity spikes shortly before a resignation**.

### Prevention

* **Least privilege** and regular access reviews
* **Separation of duties** — no single person controls a full sensitive process
* **DLP (Data Loss Prevention)** to monitor data leaving the organisation
* **Comprehensive logging** of privileged actions
* **Prompt offboarding** — revoke access immediately on departure
* Background screening for sensitive roles

> Insider threat is fundamentally a **behavioural** detection problem: nothing is technically forbidden, so only the *pattern* of activity distinguishes an attack from a workday.

### Example

A departing employee downloads the entire customer database on their last week. Every access is authorised and no control is violated — only the **volume and timing** relative to their normal pattern reveals the theft.
$md$, 8, false),

  (sid, 1, 'Explain Sniffer Attacks.', $md$
A **sniffer attack** captures and analyses network traffic to extract sensitive information. It is a **passive** attack, making it exceptionally difficult to detect.

### How Sniffing Works

A network interface normally discards frames not addressed to it. In **promiscuous mode** it accepts **all** frames it can see.

```text
NORMAL mode:       accepts only frames addressed to this MAC
PROMISCUOUS mode:  accepts EVERY frame on the segment
```

### Sniffing in Different Environments

**Hub-based networks (legacy)** — a hub broadcasts every frame to every port, so any host can see all traffic. Trivial to sniff.

**Switched networks** — a switch forwards frames only to the destination port, so passive sniffing captures little. Attackers therefore use **active techniques** to redirect traffic:

| Technique         | Method                                            |
| ----------------- | ------------------------------------------------- |
| **ARP spoofing**  | Send forged ARP replies so traffic is sent to the attacker |
| **MAC flooding**  | Overflow the switch's CAM table, forcing it to broadcast like a hub |
| **Port mirroring abuse** | Configure a SPAN port to copy traffic       |
| **DHCP spoofing** | Supply a malicious default gateway                |

**Wireless networks** — radio is inherently broadcast, so any receiver in range can capture frames. Weak or absent encryption makes this trivial.

### What Attackers Extract

* Credentials sent over unencrypted protocols (HTTP, FTP, Telnet, POP3)
* Session cookies enabling session hijacking
* Email content and message contents
* Network topology and host inventory
* Confidential data in transit

### Detection

Because sniffing is passive it leaves almost no trace. Indirect methods exist:

* **ARP monitoring** — detect duplicate or changing MAC-to-IP mappings
* **Promiscuous mode detection** — some hosts respond differently to specially crafted packets
* **Latency tests** — a sniffing host may respond more slowly under load
* **Honeypot credentials** — plant fake credentials and alert if they are ever used

### Prevention

* **Encrypt everything** — HTTPS, SSH, VPN, WPA3
* **Switched networks** with **port security** and **dynamic ARP inspection**
* **802.1X** network access control
* Network **segmentation** to limit what any one segment can observe

> Encryption is the only reliable countermeasure. Detection is unreliable by nature, so the correct assumption is that traffic **is** being observed and must therefore be unreadable.

### Example

An attacker on a café Wi-Fi network runs Wireshark and captures a login sent over plain HTTP, reading the password directly. The same login over HTTPS yields only encrypted bytes — the attack succeeds or fails entirely on whether encryption was used.
$md$, 9, false),

  (sid, 1, 'Explain Side-Channel Attacks.', $md$
A **side-channel attack** extracts secret information from the **physical implementation** of a system rather than from weaknesses in its algorithms. The cryptography may be mathematically perfect while the hardware running it leaks the key.

### The Core Idea

```text
Traditional attack:  break the ALGORITHM
Side-channel attack: observe the IMPLEMENTATION

An algorithm can be provably secure while its
execution leaks timing, power, sound or heat.
```

### Types of Side Channels

| Channel            | What is measured                    | Example attack           |
| ------------------ | ----------------------------------- | ------------------------ |
| **Timing**         | Execution duration                  | RSA key recovery         |
| **Power analysis** | Power consumption (SPA / DPA)       | Smart card key extraction|
| **Electromagnetic**| EM emissions                        | TEMPEST                  |
| **Acoustic**       | Sound of components or keystrokes   | RSA key from CPU noise   |
| **Cache**          | Cache hit/miss timing               | **Spectre, Meltdown**    |
| **Thermal**        | Heat signatures                     | Activity inference       |
| **Fault injection**| Induced errors from voltage/clock glitching | Bypassing checks |

### Timing Attack — Worked Illustration

```text
Naive password comparison:

for i in 0..len:
    if input[i] != secret[i]: return FALSE   <-- returns EARLY
return TRUE

Wrong first character  -> returns in 1 comparison  (fast)
Correct first character-> returns in 2 comparisons (slower)

Measuring the difference reveals the password
ONE CHARACTER AT A TIME.
```

The fix is **constant-time comparison** — always comparing every byte regardless of mismatch.

### Cache Attacks — Spectre and Meltdown

These 2018 vulnerabilities exploited **speculative execution**: the CPU executes instructions ahead of time and discards wrong guesses, but the **cache state** left behind reveals what was speculatively accessed. They affected nearly every modern processor and could not be fully fixed in software.

### Countermeasures

* **Constant-time algorithms** — execution time independent of secret data
* **Blinding** — randomise inputs to cryptographic operations
* **Masking** — split secrets into randomised shares
* **Noise injection** — obscure power and EM signatures
* **Physical shielding**
* **Cache partitioning** and disabling speculative optimisations

> Side-channel attacks are the clearest demonstration that security is a property of **systems**, not algorithms — AES is unbroken, yet AES implementations have leaked keys repeatedly.

### Example

A smart card performing RSA shows distinct power traces for squaring versus multiplication. Plotting consumption during one signature reveals the exponent bits directly — the private key extracted without touching the mathematics.
$md$, 10, false),

  (sid, 1, 'Explain Worm Attacks.', $md$
A **worm** is self-replicating malware that spreads across networks **without any user action** — the property that distinguishes it from a virus and makes it capable of extraordinarily rapid propagation.

### Worm vs Virus

| Aspect          | Virus                     | Worm                    |
| --------------- | ------------------------- | ----------------------- |
| Requires a host file | **Yes**              | No — standalone         |
| Needs user action | **Yes** (open a file)   | **No**                  |
| Spread mechanism | File sharing, email attachments | Network, automatically |
| Speed           | Slow                      | **Extremely fast**      |

### The Propagation Cycle

```text
1. SCAN     for vulnerable hosts (IP scanning)
2. EXPLOIT  a vulnerability to gain execution
3. TRANSFER a copy of itself to the new host
4. EXECUTE  on the new host
5. REPEAT   from the new host  -> EXPONENTIAL growth
```

Because each infected host begins scanning, growth follows a **logistic curve** — slow at first, then explosive, then saturating as targets are exhausted.

### Notable Worms

| Worm            | Year | Notable for                                    |
| --------------- | ---- | ---------------------------------------------- |
| **Morris Worm** | 1988 | First major internet worm; ~10% of hosts affected |
| **Code Red**    | 2001 | 359,000 hosts in 14 hours                      |
| **SQL Slammer** | 2003 | **90% of vulnerable hosts in 10 minutes**      |
| **Conficker**   | 2008 | Millions of machines; sophisticated C&C        |
| **Stuxnet**     | 2010 | Targeted industrial control systems; physical damage |
| **WannaCry**    | 2017 | Ransomware worm using EternalBlue exploit      |

SQL Slammer's speed is instructive: it fitted in a single UDP packet, requiring no handshake, so propagation was limited only by bandwidth.

### Damage Caused

Network congestion from scanning traffic alone, payload actions (data destruction, backdoors, ransomware), service outages, and enrolment into botnets.

### Detection

* Sudden surge in **outbound** connection attempts
* Many connections to the **same port** across many addresses
* Identical traffic patterns from multiple internal hosts
* Sharp rise in failed connections
* Unusual growth in network traffic volume

### Prevention

**Patching is the single most effective control** — most major worms exploited vulnerabilities for which patches already existed. Beyond that: network segmentation, host firewalls, disabling unused services, IPS at segment boundaries, and egress filtering.

> The recurring lesson of worm history is that the vulnerability was known and patched **before** the outbreak — the failure was in deployment, not in discovery.

### Example

WannaCry spread through SMB using EternalBlue in May 2017, hitting 200,000 machines across 150 countries in days. Microsoft had released the patch **two months earlier** — organisations that had applied it were unaffected.
$md$, 11, false),

  (sid, 1, 'Explain Distributed Attacks.', $md$
A **distributed attack** is coordinated from **many sources simultaneously** against one or more targets. Distribution multiplies the attacker's power while making attribution and defence far harder.

### Why Distribution Is Effective

```text
SINGLE SOURCE:                 DISTRIBUTED:
  one IP address                 thousands of IP addresses
  -> easily blocked              -> blocking is impractical
  limited bandwidth              -> aggregate bandwidth is enormous
  easily attributed              -> true origin is hidden
```

### The Botnet

Most distributed attacks are launched from a **botnet** — a network of compromised machines under central control.

```text
        [ Attacker / Botmaster ]
                  |
        [ Command & Control (C&C) ]
           /      |      \
        bot     bot      bot   ... thousands of infected hosts
           \      |      /
              [ TARGET ]
```

**C&C architectures**
* **Centralised (IRC/HTTP)** — simple, but taking down the C&C server disables the botnet
* **Peer-to-peer** — resilient, with no single point of failure
* **Domain Generation Algorithms (DGA)** — bots compute new domains daily, defeating static blocklists

### Types of Distributed Attacks

**1. DDoS** — the most common form, exhausting bandwidth or resources
**2. Distributed password attacks** — spreading brute-force attempts across many sources to evade per-IP lockout
**3. Distributed scanning** — reconnaissance spread thinly to stay below detection thresholds
**4. Spam and phishing campaigns**
**5. Cryptojacking** — using compromised machines to mine cryptocurrency
**6. Click fraud**

### IoT Botnets

The **Mirai** botnet (2016) demonstrated a shift: it infected IoT devices — cameras and routers — using **default credentials**. Such devices are numerous, rarely patched, always connected, and often have no security interface at all.

### Defences

| Defence                | Purpose                                |
| ---------------------- | -------------------------------------- |
| **Traffic scrubbing**  | Filter attack traffic upstream         |
| **CDN / anycast**      | Distribute load geographically         |
| **Rate limiting**      | Cap per-source activity                |
| **Behavioural analysis** | Distinguish bots from real users      |
| **C&C takedown**       | Disable the botnet at its controller   |
| **Ingress filtering**  | Prevent spoofing at the network edge   |

> The defensive difficulty is fundamental: each individual source may send perfectly ordinary traffic, and only the **aggregate** is an attack.

### Example

Mirai directed roughly 100,000 IoT devices at DNS provider Dyn in 2016, taking down Twitter, Netflix and Reddit. No individual camera sent unusual traffic — the attack existed only in the aggregate.
$md$, 12, false),

  (sid, 1, 'Explain the different types of Intrusion Detection Systems (IDS).', $md$
IDS are classified by **where they are deployed** and by **how they detect** intrusions.

### Classification by Deployment

**1. Network-Based IDS (NIDS)**

Monitors traffic on a network segment, typically via a SPAN/mirror port.

* **Advantages** — monitors many hosts at once, no impact on host performance, invisible to attackers
* **Disadvantages** — **cannot inspect encrypted traffic**, may miss host-level activity, struggles at high bandwidth
* **Examples** — Snort, Suricata, Zeek

**2. Host-Based IDS (HIDS)**

Runs on an individual host, monitoring logs, file integrity, processes and system calls.

* **Advantages** — sees decrypted data, detects insider activity, monitors file integrity
* **Disadvantages** — consumes host resources, must be deployed per host, can be disabled if the host is compromised
* **Examples** — OSSEC, Tripwire, Wazuh

**3. Hybrid IDS** — combines both, feeding a central console

**4. Wireless IDS (WIDS)** — monitors wireless traffic for rogue access points and evil twins

**5. Network Behaviour Analysis (NBA)** — examines flow records for anomalies rather than packet contents

### NIDS vs HIDS

| Aspect              | NIDS                | HIDS                |
| ------------------- | ------------------- | ------------------- |
| Scope               | Network segment     | Single host         |
| Encrypted traffic   | **Cannot inspect**  | **Can inspect**     |
| Deployment effort   | Few sensors         | Every host          |
| Host performance    | No impact           | Some impact         |
| Detects insider misuse | Poorly           | **Well**            |
| Detects network scans | **Well**          | Poorly              |

The two are **complementary**, not alternatives — which is why serious deployments run both.

### Classification by Detection Method

* **Signature-based (misuse)** — matches known attack patterns
* **Anomaly-based** — flags deviations from a learnt baseline
* **Specification-based** — flags deviations from defined correct behaviour
* **Hybrid** — combines these

### Classification by Response

```text
PASSIVE IDS:  logs and alerts only
ACTIVE (IPS): blocks, resets connections, reconfigures firewall
```

> The rise of pervasive encryption has quietly shifted the balance toward HIDS and endpoint detection, since a NIDS increasingly sees only opaque traffic.

### Example

A NIDS detects a port scan from outside but cannot see what happens inside an HTTPS session. A HIDS on the web server sees the decrypted request and detects the SQL injection payload — neither alone would have caught the full attack chain.
$md$, 13, false),

  (sid, 2, 'Explain the major Detection Approaches used in Intrusion Detection Systems.', $md$
IDS use several fundamentally different strategies to decide whether activity is an intrusion, each with distinct strengths.

### The Three Primary Approaches

**1. Misuse (Signature-Based) Detection**
Compares activity against a database of **known attack patterns**.

```text
"Does this match a KNOWN ATTACK?"   -> alert
```

* **Strength** — very accurate for known attacks; few false positives
* **Weakness** — **cannot detect zero-day attacks**; needs constant updating

**2. Anomaly-Based Detection**
Builds a model of **normal** behaviour and flags deviations.

```text
"Does this differ from NORMAL?"   -> alert
```

* **Strength** — can detect **unknown/zero-day** attacks
* **Weakness** — high false-positive rate; needs a clean training period

**3. Specification-Based Detection**
Uses **manually defined rules of correct behaviour** and flags violations.

```text
"Does this violate the SPECIFICATION?"   -> alert
```

* **Strength** — detects unknown attacks with low false positives
* **Weakness** — specifications are laborious to write and maintain

### Comparison

| Aspect                | Misuse       | Anomaly      | Specification |
| --------------------- | ------------ | ------------ | ------------- |
| Detects known attacks | **Excellent**| Good         | Good          |
| Detects zero-days     | **No**       | **Yes**      | **Yes**       |
| False positives       | **Low**      | **High**     | Low           |
| Maintenance           | Signature updates | Retraining | Manual specs |
| Training needed       | No           | **Yes**      | No            |

### The Base-Rate Fallacy — Why False Positives Dominate

This is the central practical problem in intrusion detection:

```text
1,000,000 events/day, of which 100 are attacks
Detector: 99% accurate

True positives  = 99
False positives = 1% of 999,900 = ~9,999

Of ~10,098 alerts, only 99 are real — under 1%.
```

Even a highly accurate detector produces overwhelming noise when attacks are rare. This is why **alert fatigue** causes real intrusions to be missed, and why reducing false positives matters more than raising detection rates.

**4. Hybrid Detection** combines approaches to mitigate this.

> The measure of an IDS in practice is not what it detects but what an analyst can actually act on — a detector producing 10,000 daily alerts protects nobody.

### Example

A signature-based IDS misses a novel zero-day. An anomaly detector flags the unusual outbound traffic it causes — but also flags 200 benign events that day. Running both, and alerting only on correlation, catches the attack without drowning the analyst.
$md$, 14, true),

  (sid, 2, 'Explain Misuse Detection and its working principle.', $md$
**Misuse detection** — also called **signature-based** detection — identifies intrusions by matching observed activity against a database of **known attack patterns**. It is the most widely deployed IDS approach.

### Working Principle

```text
1. Attack patterns (SIGNATURES) are defined and stored
2. Traffic or system activity is CAPTURED
3. Each event is COMPARED against the signature database
4. A MATCH raises an alert
5. No match -> treated as normal
```

The defining assumption is that **attacks have distinguishable, repeatable patterns**.

### Signature Types

| Type              | Matches on                            |
| ----------------- | ------------------------------------- |
| **String/pattern**| Specific byte sequences in the payload|
| **Header**        | Suspicious protocol header values     |
| **Port**          | Traffic to known-malicious ports      |
| **Stateful**      | Sequences of events across a session  |
| **Protocol anomaly** | Violations of protocol standards   |

### A Snort Rule — Concrete Example

```text
alert tcp any any -> 192.168.1.0/24 80
   ( msg:"SQL Injection Attempt";
     content:"' OR '1'='1";
     sid:1000001; )
```

Reading it: alert on TCP traffic from anywhere to port 80 on the internal network containing the string `' OR '1'='1'`.

### Detection Techniques

* **Pattern matching** — direct string comparison
* **State transition analysis** — models an attack as a sequence of state changes
* **Rule-based expert systems** — if-then rules encoding attack knowledge
* **Protocol analysis** — deep inspection against RFC-defined behaviour

### Advantages

* **High accuracy** for known attacks
* **Very low false-positive rate**
* Alerts are **specific and actionable** — the analyst knows exactly which attack
* Requires no training period
* Computationally efficient

### Disadvantages

| Disadvantage             | Detail                                       |
| ------------------------ | -------------------------------------------- |
| **Cannot detect zero-days** | No signature exists for a novel attack    |
| **Constant updates**     | The database must track new threats daily    |
| **Evasion is possible**  | Encoding, fragmentation and polymorphism defeat exact matching |
| **Encrypted traffic**    | Payload cannot be inspected                  |
| **Database growth**      | Tens of thousands of signatures cost performance |

### Evasion Techniques

Attackers defeat exact matching by **polymorphism** (changing the payload each time), **encoding** (URL or Unicode encoding), **fragmentation** (splitting the pattern across packets), and **insertion** of padding.

> Signature detection answers "have I seen this before?" — which makes it excellent at yesterday's attacks and blind to tomorrow's.

### Example

A signature for `' OR '1'='1` catches the classic injection. An attacker sending `' Or '1'='1` or the URL-encoded `%27%20OR%20%271%27%3D%271` slips past unless the IDS normalises input first — which is why normalisation matters as much as the signature.
$md$, 15, false),

  (sid, 2, 'Explain Anomaly Detection and its working principle.', $md$
**Anomaly detection** builds a statistical model of **normal** behaviour and flags significant deviations as potential intrusions. Its defining advantage is the ability to detect **previously unknown attacks**.

### Working Principle

```text
TRAINING PHASE:
   observe normal activity  ->  build a PROFILE/BASELINE

DETECTION PHASE:
   compare current activity against the profile
   deviation > threshold  ->  ALERT
```

The underlying assumption is that **attacks look different from normal behaviour** — usually true, but not always.

### What Is Profiled

| Category    | Example metrics                              |
| ----------- | -------------------------------------------- |
| **Network** | Traffic volume, protocol mix, packet size, connection rate |
| **User**    | Login times, commands used, files accessed, session duration |
| **System**  | CPU and memory use, system call sequences, process behaviour |
| **Application** | Request rates, URL patterns, query structure |

### Techniques

**1. Statistical** — mean, standard deviation, thresholds; flag values beyond *n* standard deviations
**2. Machine learning** — neural networks, SVM, decision trees
**3. Clustering** — group normal behaviour; outliers are anomalies
**4. Data mining** — association rules and frequent-pattern analysis
**5. Time-series analysis** — detect deviation from temporal patterns

### Advantages

* **Detects zero-day and novel attacks** — the decisive benefit
* Detects **insider misuse** that violates no rule but deviates from habit
* No signature database to maintain
* Adapts to the specific environment

### Disadvantages

| Disadvantage              | Detail                                        |
| ------------------------- | --------------------------------------------- |
| **High false positives**  | Legitimate but unusual behaviour is flagged   |
| **Training requirement**  | Needs a period of clean, attack-free data     |
| **Poisoning risk**        | If attacks occur during training, they become "normal" |
| **Concept drift**         | Normal behaviour changes over time; the model ages |
| **Vague alerts**          | "This is unusual" — but not *what* it is      |
| **Computational cost**    | Higher than signature matching                |

### The Two Fundamental Errors

```text
FALSE POSITIVE: normal behaviour flagged as attack
                -> analyst fatigue, wasted effort

FALSE NEGATIVE: attack classified as normal
                -> the breach succeeds

Lower the threshold -> more false positives
Raise the threshold -> more false negatives
```

Tuning the threshold is a business decision about which error is more costly, not a technical optimum.

### Example

A finance user normally accesses ~50 records daily during office hours. On one night the account reads 10,000 records. No rule was broken and no signature matched — but the **deviation** is stark, and only anomaly detection would catch it.
$md$, 16, false),

  (sid, 2, 'Explain Specification-Based Detection.', $md$
**Specification-based detection** defines the **correct, legitimate behaviour** of a program or protocol manually, then flags any deviation as a potential intrusion. It sits between misuse and anomaly detection, taking the best property of each.

### The Key Difference

```text
MISUSE:        defines what is BAD  -> anything unlisted is allowed
ANOMALY:       LEARNS what is normal -> statistically derived
SPECIFICATION: defines what is GOOD  -> anything else is an alert
```

Crucially, the specification is **manually written** rather than learnt, which is why it does not suffer the false positives of a statistical baseline.

### Working Principle

```text
1. A security expert writes a SPECIFICATION of legitimate behaviour
      - valid protocol state transitions
      - permitted system calls for a program
      - allowed file and network access
2. Actual behaviour is MONITORED
3. Any deviation from the specification -> ALERT
```

### What Is Specified

* **Protocol specifications** — legitimate state transitions from RFCs
* **Program behaviour** — the system calls a program may legitimately make
* **Access patterns** — which files and resources a process may touch
* **Policy rules** — organisational security policy expressed formally

### Worked Illustration

```text
Specification for a web server process:

MAY:  listen on port 80/443
      read files under /var/www
      write to /var/log/apache
MAY NOT: execute a shell
         write outside /var/log
         open outbound connections

Observed: web server process spawns /bin/sh
       -> VIOLATION -> alert
```

This catches a web shell **regardless of the exploit used**, because the behaviour violates the specification even though no signature matched.

### Advantages and Disadvantages

| Advantages                          | Disadvantages                        |
| ----------------------------------- | ------------------------------------ |
| **Detects unknown attacks**         | Specifications are **labour-intensive** |
| **Low false-positive rate**         | Requires deep expertise              |
| No training period needed           | Must be updated when software changes|
| No risk of poisoned training data   | Impractical for large, complex applications |
| Precise, explainable alerts         | Incomplete specifications leave gaps |

### Where It Is Practical

Specification-based detection works best where behaviour is **well-defined and stable**: network protocols, embedded and industrial control systems, SCADA, and critical daemons. It scales poorly to large general-purpose applications whose legitimate behaviour is too varied to enumerate.

> It achieves what anomaly detection promises — catching unknown attacks with few false alarms — at the cost of the human effort that anomaly detection tries to automate away.

### Example

A SCADA specification states a controller sends readings every 5 seconds to one specific server. Malware causing it to contact an external address violates the specification immediately, even though the malware is entirely novel and no baseline was ever trained.
$md$, 17, false),

  (sid, 2, 'Explain Hybrid Detection and its advantages.', $md$
**Hybrid detection** combines two or more detection approaches — typically **misuse** and **anomaly** detection — so that each compensates for the other's weaknesses.

### The Rationale

```text
MISUSE:  low false positives, but BLIND to zero-days
ANOMALY: catches zero-days, but MANY false positives

Combined: broad coverage with manageable alert volume
```

### Architectures

**1. Sequential (Cascaded)**

```text
Traffic -> [ Misuse detection ] -> known attack? -> ALERT
                    |
              no match
                    v
           [ Anomaly detection ] -> unusual? -> ALERT
```

Efficient, because the cheap signature check filters most traffic before the expensive statistical analysis runs.

**2. Parallel**

```text
            /-> [ Misuse ]   --\
Traffic ---|                    +--> [ Correlation ] -> decision
            \-> [ Anomaly ]  --/
```

Both run simultaneously; a correlation engine weighs the results — for example alerting with high confidence only when **both** agree, sharply reducing false positives.

**3. Layered / Multi-Stage**
Different techniques applied at network, host and application layers.

### Advantages

| Advantage                     | How it arises                              |
| ----------------------------- | ------------------------------------------ |
| **Broader coverage**          | Known and unknown attacks both addressed   |
| **Fewer false positives**     | Correlation filters isolated anomalies     |
| **Higher confidence**         | Agreement between methods is strong evidence|
| **Better prioritisation**     | Alerts can be scored rather than binary    |
| **Resilience**                | Evading one method does not evade all      |
| **Richer context**            | Signature identifies *what*, anomaly shows *how unusual* |

### Disadvantages

* Greater **complexity** to build and tune
* Higher **computational cost**
* More configuration and maintenance
* Correlation logic itself must be tuned

### Why Hybrid Dominates in Practice

Modern commercial systems — **SIEM** platforms, **XDR**, and next-generation IPS — are all hybrids. The base-rate problem makes pure anomaly detection unusable at scale, while pure signature detection misses precisely the attacks that matter most. Correlation is what makes detection operationally viable.

> The real contribution of a hybrid system is not detecting more, but **alerting less** — turning thousands of weak signals into a handful of credible ones.

### Example

An anomaly detector notes unusual outbound traffic from a workstation; alone it is one of 300 daily anomalies. A signature engine simultaneously flags a known C&C domain in that traffic. Correlated, the two produce a single high-confidence alert an analyst will actually investigate.
$md$, 18, false),

  (sid, 2, 'Explain the Taxonomy of Anomaly Detection Systems.', $md$
Anomaly detection systems are classified along several dimensions — the technique used, how the model is built, and what is monitored.

### Classification by Technique

**1. Statistical Anomaly Detection**

| Model            | Approach                                    |
| ---------------- | ------------------------------------------- |
| **Univariate**   | Each metric modelled independently          |
| **Multivariate** | Correlations between metrics considered     |
| **Time series**  | Temporal patterns, seasonality              |
| **Threshold**    | Simple limits on counts or rates            |

Strength: mathematically grounded and explainable. Weakness: assumes a distribution that may not hold.

**2. Machine Learning Based**

* **Supervised** — trained on labelled normal and attack data (SVM, decision trees, neural networks)
* **Unsupervised** — no labels needed; clustering and outlier detection
* **Semi-supervised** — trained only on normal data, which is usually the realistic case

**3. Data Mining Based** — association rules, frequent episodes, sequence mining
**4. Knowledge Based** — expert systems, finite state machines, description languages
**5. Soft Computing** — fuzzy logic, genetic algorithms, artificial immune systems

### Classification by Model Construction

```text
SELF-LEARNING:    the system builds its own profile from observation
PROGRAMMED:       an expert defines what is normal
```

### Classification by Data Source

* **Network-based** — packets and flows
* **Host-based** — system calls, logs, file integrity
* **Application-based** — application-level requests
* **Hybrid**

### Classification by Analysis Timing

| Mode         | Characteristic                    |
| ------------ | --------------------------------- |
| **Real-time**| Continuous, immediate detection   |
| **Batch (offline)** | Periodic analysis of stored data |

### Classification by Behaviour Modelled

* **User behaviour** — login patterns, command usage
* **Program behaviour** — system call sequences
* **Network behaviour** — traffic characteristics
* **Protocol behaviour** — conformance to standards

### Summary Structure

```text
Anomaly Detection
├── Technique     : statistical | ML | data mining | knowledge | soft computing
├── Model         : self-learning | programmed
├── Data source   : network | host | application
├── Timing        : real-time | batch
└── Subject       : user | program | network | protocol
```

> The most consequential axis in practice is **self-learning vs programmed**: self-learning adapts but can be poisoned; programmed is trustworthy but does not scale.

### Example

A system combining a **statistical, self-learning, network-based, real-time** detector with a **knowledge-based, programmed, host-based** one covers both traffic anomalies and forbidden host behaviour — spanning several branches of the taxonomy deliberately.
$md$, 19, false),

  (sid, 2, 'Explain the application of Fuzzy Logic in Intrusion Detection.', $md$
**Fuzzy logic** allows reasoning with **degrees of truth** rather than strict true/false values. Applied to intrusion detection, it addresses the fact that the boundary between normal and attack behaviour is genuinely blurred.

### The Problem with Crisp Boundaries

```text
CRISP RULE:  if connections > 100 then ATTACK

99 connections  -> completely normal
100 connections -> definitely an attack

A one-connection difference flips the verdict — clearly wrong.
```

Real behaviour does not change character at an arbitrary threshold, so crisp rules produce both false positives and false negatives near the boundary.

### The Fuzzy Approach

Membership is a **degree between 0 and 1**:

```text
Connections    Membership in "HIGH"
    50               0.0
    80               0.3
   100               0.6
   150               0.9
   200               1.0
```

An event can be **partly** normal and **partly** suspicious simultaneously.

### Components of a Fuzzy IDS

**1. Fuzzification** — convert numeric inputs into fuzzy sets (LOW, MEDIUM, HIGH)
**2. Fuzzy rule base** — expert rules using linguistic terms:

```text
IF connection_rate is HIGH
   AND failed_logins is MEDIUM
   AND duration is SHORT
THEN attack_probability is HIGH
```

**3. Inference engine** — evaluates all rules, combining their degrees of activation
**4. Defuzzification** — convert the fuzzy conclusion into a crisp decision or score

### Advantages

* **Handles imprecision** naturally — the boundary problem disappears
* **Reduces false positives** near thresholds
* **Human-readable rules** — experts can write and audit them directly
* Produces a **graded severity score** rather than a binary verdict
* Tolerant of noisy data

### Disadvantages

| Disadvantage                | Detail                                 |
| --------------------------- | -------------------------------------- |
| **Rule design is manual**   | Requires domain expertise              |
| **Membership function tuning** | Choosing shapes and ranges is subjective |
| **Computational cost**      | Higher than crisp rules                |
| **Does not learn**          | Static unless combined with GA or neural methods |

### Common Hybrid Combinations

* **Fuzzy + genetic algorithms** — evolve optimal rules and membership functions
* **Neuro-fuzzy (ANFIS)** — a neural network learns the membership functions
* **Fuzzy + clustering** — fuzzy c-means, where points belong partly to several clusters

> Fuzzy logic's real contribution is producing a **severity score** rather than a binary alarm — which is exactly what an analyst triaging hundreds of alerts needs.

### Example

A user logging in at 11 p.m. has membership 0.4 in "unusual hour". Combined with 0.3 in "unusual location", a fuzzy IDS scores the event 0.35 — logged for review rather than raising an alarm, whereas a crisp rule would have to choose alert or ignore.
$md$, 20, false),

  (sid, 2, 'Explain the application of Bayes Theory in Intrusion Detection.', $md$
**Bayes theory** provides a principled way to update the probability that an event is an intrusion as evidence accumulates. It is one of the most widely used statistical foundations in intrusion detection.

### Bayes' Theorem

```text
P(A|B) = [ P(B|A) x P(A) ] / P(B)

P(A|B) = POSTERIOR  — probability of attack GIVEN the evidence
P(B|A) = LIKELIHOOD — probability of the evidence given an attack
P(A)   = PRIOR      — base rate of attacks
P(B)   = EVIDENCE   — overall probability of observing it
```

### Applied to Intrusion Detection

```text
P(Attack | Observed Behaviour) =
      P(Behaviour | Attack) x P(Attack)
      -----------------------------------
              P(Behaviour)
```

### Naive Bayes Classifier

The most common implementation, assuming features are **conditionally independent**:

```text
P(Attack | f1, f2, ..., fn)
     is proportional to  P(Attack) x P(f1|Attack) x ... x P(fn|Attack)
```

The independence assumption is usually false — packet size and protocol are related — yet the classifier performs surprisingly well in practice, which is why it remains popular.

### Bayesian Networks

A directed acyclic graph capturing **dependencies** between variables, removing the naive independence assumption at the cost of greater complexity.

```text
   [ Port Scan ]
        |
        v
  [ Exploit Attempt ] ---> [ Privilege Escalation ]
```

This models the fact that a scan raises the probability of a subsequent exploit — enabling **multi-stage attack detection**.

### The Base-Rate Fallacy — Why the Prior Matters

Bayes theory makes explicit the most important problem in intrusion detection:

```text
P(Attack) = 0.0001        (attacks are rare)
P(Alert|Attack) = 0.99    (detector is accurate)
P(Alert|Normal) = 0.01    (1% false positive rate)

P(Attack|Alert) = (0.99 x 0.0001) /
                  [(0.99 x 0.0001) + (0.01 x 0.9999)]
                = about 0.0098  ->  under 1%
```

**Over 99% of alerts from a 99%-accurate detector are false.** This is not a flaw in the detector — it is arithmetic, and it explains why analysts drown in alerts.

### Advantages and Limitations

* **Advantages** — sound probabilistic foundation, handles uncertainty, incorporates prior knowledge, gives graded confidence, fast to train
* **Limitations** — the independence assumption is often violated, priors are hard to estimate accurately, and it requires representative training data

> Bayes theory's greatest service to intrusion detection is diagnostic: it proves mathematically why lowering false-positive rates matters far more than raising detection rates.

### Example

An IDS observes an unusual port and an unusual time. Naive Bayes combines the two likelihoods with the low prior for attacks and produces a posterior of 3% — correctly indicating that the evidence, though suggestive, is far from conclusive.
$md$, 21, false),

  (sid, 2, 'Explain the use of Artificial Neural Networks in Intrusion Detection.', $md$
**Artificial Neural Networks (ANNs)** learn complex, non-linear relationships between input features and attack classes, making them well suited to detecting patterns too subtle for hand-written rules.

### Structure

```text
Input layer      Hidden layer(s)      Output layer
  duration  ---\
  protocol  ----\    (o)---(o)
  src_bytes -----+--- (o)---(o) ---> Normal / Attack
  dst_bytes ----/    (o)---(o)
  flags     ---/
```

Each connection carries a **weight**, learnt during training so the network maps inputs to correct outputs.

### How Learning Works

```text
1. Feed a training example forward through the network
2. Compare the output with the known label -> ERROR
3. BACKPROPAGATE the error, adjusting weights to reduce it
4. Repeat over many examples and epochs until error converges
```

### Types Used in IDS

| Network type        | Suited to                                   |
| ------------------- | ------------------------------------------- |
| **MLP (feedforward)** | General classification of connection records |
| **RNN / LSTM**      | **Sequential data** — system call sequences, session behaviour |
| **CNN**             | Traffic represented as matrices or images   |
| **Autoencoder**     | **Unsupervised anomaly detection** — trained only on normal data |
| **SOM (Kohonen)**   | Clustering and visualisation                |

### Autoencoders — Particularly Apt for Anomaly Detection

An autoencoder is trained to **reconstruct its input**. Trained only on normal traffic, it reconstructs normal data accurately but fails on attacks:

```text
normal input  -> low reconstruction error  -> normal
attack input  -> HIGH reconstruction error -> anomaly
```

This requires **no attack samples at all** — a decisive advantage, since real attack data is scarce and unbalanced.

### Advantages

* Learns **complex non-linear** patterns
* Detects **novel attack variants** that resemble known ones
* Tolerant of noisy and incomplete data
* Improves with more data
* No manual feature-relationship engineering

### Disadvantages

| Disadvantage             | Detail                                     |
| ------------------------ | ------------------------------------------ |
| **Black box**            | Cannot explain *why* something was flagged |
| **Training cost**        | Computationally expensive                  |
| **Needs large labelled datasets** | Rare in security                  |
| **Overfitting risk**     | May memorise training data                 |
| **Adversarial examples** | Small crafted changes fool the network     |
| **Retraining required**  | As attacks and normal behaviour evolve     |

The **explainability** problem is severe operationally: an analyst told only "this is 87% likely an attack" cannot act confidently or justify a response.

> Adversarial vulnerability is the deeper concern — an attacker who understands the model can craft traffic that is malicious yet confidently classified as normal.

### Example

An LSTM trained on normal system call sequences flags a web server suddenly issuing `execve` — a sequence never seen in training. The network detects the web shell without any signature, but cannot explain its reasoning beyond a confidence score.
$md$, 22, false),

  (sid, 2, 'Explain the use of Support Vector Machines in Intrusion Detection.', $md$
**Support Vector Machines (SVMs)** classify data by finding the **optimal separating hyperplane** — the boundary that maximises the margin between classes. They perform notably well on the high-dimensional, limited-sample data typical of intrusion detection.

### The Core Idea

```text
      normal  o  o                 attack
              o o    |    x   x
              o      |      x   x
                     |
             maximum margin hyperplane

The boundary is placed as FAR as possible from
the nearest points of each class.
```

The nearest points that determine the boundary are the **support vectors** — and crucially, only these matter. All other training points could be removed without changing the model.

### The Kernel Trick

Real intrusion data is rarely linearly separable. SVMs map data into a **higher-dimensional space** where separation becomes possible, without explicitly computing the transformation:

| Kernel         | Use                                    |
| -------------- | -------------------------------------- |
| **Linear**     | Linearly separable data                |
| **Polynomial** | Moderate non-linearity                 |
| **RBF (Gaussian)** | **Most common in IDS** — highly flexible |
| **Sigmoid**    | Neural-network-like behaviour          |

### One-Class SVM — for Anomaly Detection

The most practically important variant for IDS. Trained on **normal data only**, it learns a boundary enclosing normal behaviour:

```text
inside the boundary  -> normal
outside              -> ANOMALY
```

This solves a real problem: attack samples are scarce and unrepresentative, whereas normal traffic is abundant.

### Advantages

* **Effective in high dimensions** — well suited to many-feature network data
* **Works with limited training data**
* **Strong generalisation** through margin maximisation
* **Robust to overfitting**, especially with proper regularisation
* Globally optimal solution — unlike neural networks, no local minima
* **One-class variant** needs no attack samples

### Disadvantages

| Disadvantage              | Detail                                     |
| ------------------------- | ------------------------------------------ |
| **Poor scaling**          | Training is roughly O(n²)–O(n³); slow on very large datasets |
| **Kernel/parameter selection** | Choosing kernel, C and gamma requires tuning |
| **Binary by nature**      | Multi-class needs one-vs-one or one-vs-rest |
| **Limited interpretability** | The hyperplane is hard to explain       |
| **Sensitive to feature scaling** | Features must be normalised          |

### SVM vs Neural Networks in IDS

| Aspect            | SVM                | Neural Network      |
| ----------------- | ------------------ | ------------------- |
| Training data needed | **Less**        | More                |
| Large-scale training | Slower          | **Faster**          |
| Local minima      | **None**           | Possible            |
| High dimensions   | **Excellent**      | Good                |

> SVMs remain attractive in security research precisely because labelled attack data is scarce — they extract more from small datasets than deep networks can.

### Example

A one-class SVM trained on a fortnight of normal traffic flags a connection with unusual duration and byte-count combination. No attack data was ever used in training, yet the connection falls outside the learnt normal boundary and is correctly identified as a data exfiltration attempt.
$md$, 23, false),

  (sid, 2, 'Explain Evolutionary Computation and its application to intrusion detection.', $md$
**Evolutionary computation** applies principles of **natural selection** — populations, mutation, crossover and survival of the fittest — to search for good solutions. In intrusion detection it is used chiefly to **evolve detection rules** rather than write them by hand.

### The Genetic Algorithm Cycle

```text
1. INITIALISE a random population of candidate rules
2. EVALUATE each using a FITNESS function
3. SELECT the fitter individuals
4. CROSSOVER — combine parent rules to produce offspring
5. MUTATE — introduce small random changes
6. REPLACE the population
7. REPEAT until fitness converges
```

### Representing a Rule as a Chromosome

```text
Chromosome: [ protocol | src_port | dst_port | duration | flag | CLASS ]
            [   TCP    |   any    |    80    |  > 1000  | SYN  | ATTACK ]

Crossover: combine parts of two rules
Mutation:  change one field, e.g. port 80 -> 443
```

### The Fitness Function

Fitness must balance the two competing goals of detection:

```text
fitness = w1 x detection_rate  -  w2 x false_positive_rate
```

The weights encode the operational preference — a system where false positives are costly uses a larger w2. This is where domain judgement enters an otherwise automatic process.

### Applications in IDS

* **Rule generation** — evolving signature rules automatically
* **Feature selection** — finding which of dozens of features actually matter
* **Parameter optimisation** — tuning thresholds, or an SVM's C and gamma
* **Optimising other classifiers** — evolving neural network weights or fuzzy membership functions

### Related Techniques

| Technique                  | Distinguishing feature                       |
| -------------------------- | -------------------------------------------- |
| **Genetic Algorithm (GA)** | Fixed-length chromosomes                     |
| **Genetic Programming (GP)** | Evolves tree-structured programs/rules     |
| **Artificial Immune Systems** | Models the biological immune system's self/non-self discrimination |
| **Particle Swarm Optimisation** | Swarm-based search                      |

**Artificial Immune Systems** are conceptually apt: the immune system solves exactly the IDS problem — distinguishing self from non-self and remembering past intruders.

### Advantages and Disadvantages

* **Advantages** — automatic rule discovery, adapts to new environments, explores large search spaces, produces **human-readable rules** (unlike neural networks), and optimises multiple objectives simultaneously
* **Disadvantages** — computationally expensive, no guarantee of the global optimum, results vary between runs, and fitness function design requires expertise

> Evolutionary methods are valuable precisely because their output is **inspectable**: an evolved rule can be read, audited and deployed, which a neural network's weights cannot.

### Example

A genetic algorithm runs over labelled traffic for several hours and produces a rule flagging TCP connections to port 445 with SYN flags exceeding 500 per minute. No analyst wrote it, yet it is readable, explainable and can be deployed in Snort directly.
$md$, 24, false),

  (sid, 2, 'Explain Association Rules and their application in intrusion detection.', $md$
**Association rule mining** discovers relationships of the form "if A occurs, then B tends to occur" within large datasets. Originally developed for market-basket analysis, it is applied in intrusion detection to discover attack patterns automatically.

### Rule Form and Metrics

```text
Rule:  X -> Y      "if X occurs, Y is likely"
```

| Metric        | Formula                              | Meaning                        |
| ------------- | ------------------------------------ | ------------------------------ |
| **Support**   | P(X ∪ Y)                             | How often the rule applies     |
| **Confidence**| P(Y\|X) = support(X∪Y)/support(X)    | How reliable the rule is       |
| **Lift**      | confidence / P(Y)                    | How much better than chance    |

**Lift** matters: a rule can have high confidence simply because Y is common. Lift > 1 indicates a genuine association.

### The Apriori Algorithm

```text
1. Find all frequent 1-itemsets (above minimum support)
2. Use them to generate candidate 2-itemsets
3. Prune candidates whose subsets are not frequent
      <-- the APRIORI PROPERTY: any subset of a frequent
          itemset must itself be frequent
4. Repeat for larger itemsets
5. Generate rules from the frequent itemsets
```

The pruning step is what makes the search tractable.

### Application to Intrusion Detection

**1. Discovering Attack Patterns**

```text
{ port_scan, failed_login } -> { privilege_escalation }
   support 0.02, confidence 0.85

Meaning: when a scan is followed by failed logins,
escalation follows 85% of the time.
```

**2. Building Normal Profiles**
Mine associations in normal traffic; activity violating established associations is anomalous.

**3. Feature Selection** — identify which attributes genuinely co-occur with attacks
**4. Multi-Stage Attack Detection** — **sequential pattern mining** adds ordering, capturing attack sequences over time
**5. Alert Correlation** — group related alerts into a single incident

### Advantages and Limitations

**Advantages**
* **Automatic discovery** of patterns nobody thought to look for
* **Human-readable rules**, easily audited and deployed
* Handles large datasets
* No labelled attack data required

**Limitations**

| Limitation                | Detail                                   |
| ------------------------- | ---------------------------------------- |
| **Rule explosion**        | Thousands of rules, most uninteresting   |
| **Threshold sensitivity** | Support and confidence choices dominate results |
| **Correlation ≠ causation** | An association may be coincidental     |
| **Computationally expensive** | Especially on large itemsets         |
| **Rare attacks missed**   | Low support means genuine attacks fall below the threshold |

The last point is a serious weakness for security: **attacks are rare by definition**, so setting support high enough to control rule explosion may exclude the very events of interest.

> Association mining is best used as a **discovery** tool feeding human review, not as an autonomous detector — its output is hypotheses, not verdicts.

### Example

Mining a month of logs reveals `{failed_login ≥ 5, off_hours} → {account_lockout}` with 0.9 confidence. Sessions matching the antecedent **without** lockout become interesting — suggesting an attacker who found working credentials before the threshold triggered.
$md$, 25, false),

  (sid, 2, 'Explain Clustering and its application in intrusion detection.', $md$
**Clustering** groups similar data points together without using labels. It is an **unsupervised** technique, which makes it valuable in intrusion detection where labelled attack data is scarce or unavailable.

### The Core Assumption

```text
1. Normal traffic vastly OUTNUMBERS attack traffic
2. Attack traffic differs QUALITATIVELY from normal

Therefore: LARGE clusters = normal
           SMALL/distant clusters or outliers = ATTACKS
```

### Clustering Algorithms Used

| Algorithm      | Approach                    | Strength for IDS               |
| -------------- | --------------------------- | ------------------------------ |
| **K-Means**    | Partition into k clusters   | Fast, simple                   |
| **DBSCAN**     | Density-based               | **Finds outliers naturally**; no k needed |
| **Hierarchical** | Builds a tree of clusters | No need to fix k; interpretable|
| **K-Medoids**  | Uses actual data points     | Robust to outliers             |
| **SOM**        | Neural, topology-preserving | Good for visualisation         |

**DBSCAN** is particularly well suited: it explicitly labels low-density points as **noise**, which maps directly onto the notion of an anomaly. It also requires no advance choice of cluster count — a real advantage when the number of attack types is unknown.

### K-Means Outline

```text
1. Choose k initial centroids
2. Assign each point to its nearest centroid
3. Recompute centroids as the mean of assigned points
4. Repeat until assignments stabilise
```

### Applications in Intrusion Detection

**1. Anomaly detection** — points far from any cluster centre are suspicious
**2. Attack categorisation** — group similar attacks to identify families
**3. Traffic profiling** — establish behavioural baselines
**4. Alert aggregation** — cluster related alerts into single incidents, reducing analyst load
**5. Data reduction** — represent large datasets by cluster summaries

### Advantages

* **No labelled data required** — the decisive benefit
* Can discover **previously unknown** attack types
* Adapts to the specific environment
* Handles large volumes
* Reveals structure analysts had not anticipated

### Disadvantages

| Disadvantage                 | Detail                                    |
| ---------------------------- | ----------------------------------------- |
| **Assumption may fail**      | If attacks are numerous, they form their own large cluster and look normal |
| **Parameter selection**      | Choosing k, or DBSCAN's eps, strongly affects results |
| **Distance metric matters**  | Mixed categorical and numeric features are awkward |
| **Scaling sensitivity**      | Features must be normalised or one dominates |
| **Clusters need interpretation** | The algorithm says "different", not "malicious" |
| **High-dimensional distance** | Distances become less meaningful as dimensions grow |

> The core assumption is also the core risk: during a large-scale attack, malicious traffic may become the majority — and a clustering detector would then classify it as normal.

### Example

K-means over a day of connection records produces three large clusters (web, email, file transfer) and a small cluster of 40 connections with unusual duration and byte counts. Investigation shows a slow data exfiltration channel — found with no signature and no labelled training data.
$md$, 26, false);

  RAISE NOTICE 'Intrusion Detection and Prevention Systems — Units 1 & 2: 26 questions inserted.';
END $do$;
