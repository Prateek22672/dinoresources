-- =====================================================================
-- Study-With-AI seed — Information Security (4th Year) — UNIT 1
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Information Security' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Information Security" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Explain the history and evolution of Information Security.',
    'Define Information Security and explain its importance.',
    'Explain the Critical Characteristics of Information.',
    'Explain the CNSS Security Model.',
    'Explain the Components of an Information System.',
    'Explain how the components of an Information System can be secured.',
    'Explain the need for balancing Security and Access.',
    'Explain the different Approaches to Information Security Implementation.',
    'Explain the role of Security in the Software Development Life Cycle (SDLC).',
    'Explain the fundamental Security Principles.',
    'Explain the major Security Services.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain the history and evolution of Information Security.', $md$
Information security evolved from **physical protection of machines** into a discipline concerned with protecting information itself across global networks.

### The Phases

**1. The Early Years (1960s) — Physical Security**
Mainframes were protected by locking the room. Security meant badges, guards and controlled access. There were no networks, so the physical perimeter *was* the security boundary.

**2. The 1970s–80s — ARPANET and the First Concerns**
ARPANET connected computers, and with connection came remote access — and the first vulnerabilities. The **RAND Report R-609** (1970) is widely regarded as the beginning of computer security as a field: it was the first document to identify that security extended beyond physical protection to **policy, personnel and data**.

Key developments: the **Bell-LaPadula model** (confidentiality), the **Biba model** (integrity), and the **Orange Book (TCSEC)** defining evaluation criteria.

**3. The 1990s — Networks and the Internet**
The internet became commercial and ubiquitous. Security became everyone's problem rather than a defence concern:
* The **Morris Worm (1988)** demonstrated internet-wide vulnerability
* Firewalls and antivirus became standard
* Encryption moved into commercial use (SSL, 1995)

**4. The 2000s — Sophistication and Regulation**
Organised cybercrime emerged with financial motives. Major regulation appeared: **HIPAA**, **SOX**, **PCI-DSS**. Attacks became professional rather than experimental.

**5. The 2010s–Present — Nation-States, Cloud and AI**
* **Stuxnet (2010)** — malware causing **physical** destruction
* Massive breaches: Target, Equifax, Yahoo
* Ransomware as a business model
* **GDPR (2018)** making privacy a legal obligation with severe penalties
* Cloud, IoT and AI expanding the attack surface enormously

### The Direction of Travel

```text
PHYSICAL security -> COMPUTER security -> NETWORK security
                  -> INFORMATION security -> CYBER RESILIENCE

Focus shifted from "keep attackers out"
            to    "detect and recover when they get in"
```

> The decisive change is philosophical: modern security assumes **breach is inevitable** and optimises for detection and recovery, rather than assuming a perimeter can be held.

### Example

In 1970 securing a computer meant locking a door. Today an organisation's data sits in three cloud regions, is accessed from personal phones worldwide, and is targeted by automated attacks continuously — the same objective requiring an entirely different discipline.
$md$, 1, true),

  (sid, 1, 'Define Information Security and explain its importance.', $md$
**Information security** is the protection of information and information systems from unauthorised **access, use, disclosure, disruption, modification or destruction**, in order to preserve confidentiality, integrity and availability.

### The CIA Triad

```text
        CONFIDENTIALITY
              /\
             /  \
            /    \
           /      \
    INTEGRITY -- AVAILABILITY
```

| Principle           | Protects against         | Achieved by                    |
| ------------------- | ------------------------ | ------------------------------ |
| **Confidentiality** | Unauthorised disclosure  | Encryption, access control     |
| **Integrity**       | Unauthorised modification| Hashing, digital signatures    |
| **Availability**    | Denial of access         | Redundancy, backups, DDoS defence |

### Beyond the Triad

* **Authentication** — verifying identity
* **Authorisation** — determining permitted actions
* **Non-repudiation** — preventing denial of an action
* **Accountability** — tracing actions to individuals

### Why Information Security Matters

**1. Financial Loss**
Data breaches cost organisations millions — direct losses, remediation, fines and lost business.

**2. Legal and Regulatory Obligation**
GDPR permits fines of up to **4% of global annual turnover**. HIPAA, PCI-DSS and similar frameworks carry their own penalties.

**3. Reputational Damage**
Customer trust, once lost, is expensive and slow to rebuild — frequently the largest long-term cost.

**4. Business Continuity**
Ransomware can halt operations entirely. Hospitals have diverted patients; factories have stopped production.

**5. Protection of Intellectual Property**
Trade secrets and research represent years of investment.

**6. Personal Privacy**
Individuals suffer identity theft, financial loss and personal harm.

**7. National Security**
Critical infrastructure — power, water, transport — is now digitally controlled and targeted.

### The Fundamental Asymmetry

```text
DEFENDER: must protect EVERY vulnerability, ALWAYS
ATTACKER: needs to find ONE, ONCE
```

This asymmetry explains why perfect security is unattainable and why **risk management** — deciding what to protect and how much to spend — is the practical discipline rather than absolute protection.

> Security is not a product to be installed but a **process** to be maintained; a system secure today is not secure next month unless it is actively kept so.

### Example

A hospital hit by ransomware cannot access patient records. Confidentiality may be intact, but **availability** has failed — and in a clinical setting that failure is measured in patient outcomes, not rupees.
$md$, 2, false),

  (sid, 1, 'Explain the Critical Characteristics of Information.', $md$
Information has characteristics that determine its **value** and define what must be protected. These extend the CIA triad into a fuller set.

### The Critical Characteristics

**1. Availability**
Authorised users can access information **without interference** and in the required format. Threatened by DoS attacks, hardware failure and natural disaster.

**2. Accuracy**
Information is free from error and has the value the user expects. Inaccurate data leads to wrong decisions even when perfectly secured.

**3. Authenticity**
Information is genuine and original — not a fabrication or reproduction. Email spoofing attacks authenticity.

**4. Confidentiality**
Only those authorised may access it. Protected by classification, encryption and access control.

**5. Integrity**
Information is whole, complete and uncorrupted. Verified by **hashing** and checksums.

**6. Utility**
Information has **value for a purpose**. Data that cannot be used serves no purpose — census data of names without addresses may be accurate and confidential yet useless.

**7. Possession**
**Ownership or control** of the information. This is subtly distinct from confidentiality:

```text
Someone steals an ENCRYPTED backup tape.

POSSESSION is lost      — they hold the data
CONFIDENTIALITY is intact — they cannot read it

If they later break the encryption,
confidentiality is lost too.
```

This distinction matters legally: breach notification laws often trigger on loss of possession, regardless of whether the data was readable.

### Summary

| Characteristic  | Question it answers                    |
| --------------- | -------------------------------------- |
| Availability    | Can I get it when needed?              |
| Accuracy        | Is it correct?                         |
| Authenticity    | Is it genuine?                         |
| Confidentiality | Is it kept secret?                     |
| Integrity       | Is it unaltered and complete?          |
| Utility         | Is it useful for the purpose?          |
| Possession      | Who holds or controls it?              |

> Possession and utility are the two most commonly overlooked — yet a stolen encrypted database and an unusable dataset are both real security failures.

### Example

A payroll file is encrypted (confidentiality preserved) but the only copy is corrupted (integrity lost) and unreadable (availability lost). Two of three characteristics failed despite the encryption working perfectly.
$md$, 3, false),

  (sid, 1, 'Explain the CNSS Security Model.', $md$
The **CNSS (Committee on National Security Systems) Security Model** — also called the **McCumber Cube** — is a three-dimensional framework for evaluating information security comprehensively.

### The Three Dimensions

```text
                 Information Characteristics
                 (Confidentiality, Integrity, Availability)
                      |
                      |
                      +-------- Information States
                     /          (Storage, Processing, Transmission)
                    /
        Security Measures
        (Policy, Education, Technology)
```

**Dimension 1 — Information Characteristics (the CIA triad)**
* Confidentiality
* Integrity
* Availability

**Dimension 2 — Information States**
* **Storage** — data at rest, in databases, disks, backups
* **Processing** — data in use, in memory and CPU
* **Transmission** — data in motion across networks

**Dimension 3 — Security Measures**
* **Policy** — rules, procedures, standards
* **Education** — awareness and training
* **Technology** — technical controls

### The 27 Cells

```text
3 characteristics x 3 states x 3 measures = 27 cells
```

Each cell represents a specific security requirement that must be addressed. The model's value is **completeness**: it forces consideration of combinations that would otherwise be forgotten.

### Worked Examples of Cells

| Characteristic | State        | Measure    | Control                        |
| -------------- | ------------ | ---------- | ------------------------------ |
| Confidentiality| Storage      | Technology | Disk encryption                |
| Confidentiality| Transmission | Technology | TLS                            |
| Confidentiality| Processing   | Policy     | Clean desk / screen lock policy|
| Integrity      | Storage      | Technology | Checksums, RAID                |
| Availability   | Storage      | Policy     | Backup and retention policy    |
| Integrity      | Processing   | Education  | Training on data entry accuracy|

### Why the Model Is Useful

* **Systematic coverage** — reveals gaps that ad-hoc approaches miss
* **Balanced** — prevents over-reliance on technology alone
* **Audit framework** — each cell can be assessed for adequacy
* Emphasises that **policy and education** are security measures equal in standing to technology

### The Commonly Neglected Cells

Organisations typically over-invest in **technology + storage/transmission** and under-invest in **education** and in protecting data during **processing** — where it is necessarily decrypted and most exposed.

> The model's real lesson is dimensional: a control that secures data at rest and in transit still leaves it plainly readable while being processed, and no amount of encryption addresses an untrained employee.

### Example

An organisation encrypts databases (confidentiality/storage/technology) and uses TLS (confidentiality/transmission/technology) but conducts no staff training. An employee emails a customer list to a personal account — the confidentiality/processing/education cell was empty, and that is where the breach occurred.
$md$, 4, false),

  (sid, 1, 'Explain the Components of an Information System.', $md$
An **information system** is far more than software. It comprises six components, **each of which must be secured** — and each of which represents a distinct attack surface.

### The Six Components

**1. Software**
Applications, operating systems and utilities. Historically the most exploited component because software is complex, developed under time pressure, and security is frequently an afterthought. Vulnerabilities include buffer overflows, injection flaws and logic errors.

**2. Hardware**
Physical devices — servers, workstations, network equipment, storage. Vulnerable to theft, physical damage and hardware-level attacks. **Physical security is the foundation**: an attacker with physical access to a machine can generally defeat its software controls.

**3. Data**
Frequently the **most valuable** asset, and the actual target of most attacks. Data outlives the systems that process it, so protection must follow the data itself — through classification, encryption and access control.

**4. People**
```text
The WEAKEST LINK in nearly every security incident.
```
Threats include social engineering, insider misuse, negligence, weak passwords and policy violations. Controls are training, awareness, background checks and separation of duties.

**5. Procedures**
Written instructions for accomplishing tasks. Often overlooked as a security component, yet procedures **are** information an attacker can exploit — knowing exactly how a help desk verifies identity enables an effective social-engineering attack.

**6. Networks**
Connectivity between components. The introduction of networking is what turned computer security into information security, since the perimeter is no longer physical.

### Vulnerability Summary

| Component   | Principal threats                      | Principal controls           |
| ----------- | -------------------------------------- | ---------------------------- |
| **Software**| Bugs, injection, malware               | Patching, secure coding, testing |
| **Hardware**| Theft, damage, tampering               | Physical security, disposal  |
| **Data**    | Breach, corruption, loss               | Encryption, backup, classification |
| **People**  | Social engineering, insider misuse     | Training, vetting, least privilege |
| **Procedures** | Disclosure, non-compliance          | Documentation control, audit |
| **Networks**| Interception, intrusion, DoS           | Firewalls, IDS, encryption   |

> Security is only as strong as its weakest component, and that component is almost always **people** — which is why awareness training consistently returns more per rupee than additional technology.

### Example

A company deploys firewalls, encryption and endpoint protection. An attacker telephones the help desk, impersonates an executive and has a password reset. Five components were secured; the **people** component was not, and that was sufficient.
$md$, 5, false),

  (sid, 1, 'Explain how the components of an Information System can be secured.', $md$
Each component of an information system requires **its own controls**, and security is achieved only when all six are addressed together.

### Securing Each Component

**1. Software Security**
* Secure coding practices and code review
* Input validation to prevent injection
* Regular **patching** — the single highest-value control
* Static and dynamic application security testing
* Least privilege for application accounts

**2. Hardware Security**
* Physical access control — locks, badges, CCTV
* Environmental controls — fire suppression, cooling, UPS
* Asset tracking and inventory
* **Secure disposal** — degaussing or physical destruction of drives
* Tamper-evident seals

**3. Data Security**
* **Classification** — public, internal, confidential, restricted
* **Encryption at rest and in transit**
* Access control on a need-to-know basis
* **Backups**, tested by actual restoration
* Data loss prevention (DLP)
* Defined retention and secure deletion

**4. People Security**
* Security awareness training, including **phishing simulations**
* Background verification for sensitive roles
* Acceptable use policies
* **Separation of duties** — no single person controls a whole sensitive process
* Prompt offboarding on departure

**5. Procedure Security**
* Documented, reviewed and version-controlled procedures
* Treat sensitive procedures as **confidential information**
* Change management
* Incident response plans, rehearsed rather than merely written

**6. Network Security**
* Firewalls and **network segmentation**
* IDS/IPS
* VPN for remote access
* Encryption of traffic
* Network access control (802.1X)

### Defence in Depth

```text
   [ Policy & Training ]
     [ Physical Security ]
       [ Perimeter — firewall ]
         [ Network — segmentation, IDS ]
           [ Host — hardening, antivirus ]
             [ Application — secure coding ]
               [ DATA — encryption ]

No single layer is trusted to hold.
```

### Prioritisation

| Control                  | Relative cost | Relative benefit |
| ------------------------ | ------------- | ---------------- |
| **Patching**             | Low           | **Very high**    |
| **Awareness training**   | Low           | **Very high**    |
| **Backups (tested)**     | Medium        | **Very high**    |
| **MFA**                  | Low           | **Very high**    |
| Advanced threat tooling  | High          | Medium           |

> The unglamorous controls — patching, backups, MFA and training — prevent the overwhelming majority of real incidents, and are routinely under-funded relative to expensive tooling.

### Example

An organisation survives a ransomware attack not because of advanced detection but because it had **tested, offline backups**. Systems were restored in a day and no ransom was paid — the cheapest control proving decisive.
$md$, 6, false),

  (sid, 1, 'Explain the need for balancing Security and Access.', $md$
Security and access are in **fundamental tension**: every control that protects information also makes it harder to use. Managing that tension is a core responsibility of security management.

### The Trade-off

```text
MAXIMUM SECURITY:          MAXIMUM ACCESS:
  no network access          no passwords
  no external media          no restrictions
  no user permissions        everyone sees everything
        |                          |
   UNUSABLE                   INDEFENSIBLE
```

A perfectly secure system is one nobody can use; a perfectly accessible one protects nothing. The correct position lies between, and depends on the organisation.

### Why Excessive Security Fails

Over-restriction does not merely inconvenience users — it **causes** security failures, because users route around controls:

| Control                       | User workaround                     |
| ----------------------------- | ----------------------------------- |
| Passwords changed weekly      | Written on a note under the keyboard |
| Email attachments blocked     | Personal cloud storage used instead  |
| VPN too slow                  | Work done on unmanaged devices       |
| Access requests take 3 days   | Credentials shared between colleagues|

This is the crucial insight: **a control that is too onerous is not a strong control, it is an unenforced one**.

### Why Excessive Access Fails

Unrestricted access means one compromised account exposes everything, insiders can act freely, and there is no accountability or regulatory compliance.

### Achieving the Balance

* **Risk-based approach** — protect according to asset value, not uniformly
* **Data classification** — heavy controls on restricted data, light on public
* **Least privilege** — the minimum access needed for the role
* **Role-based access control** — permissions by job function
* **Usable security** — SSO and MFA rather than more passwords
* **User involvement** — consult users when designing controls

### The Business Framing

```text
Cost of the control  vs  Cost of the risk it prevents

A ₹10 lakh control protecting a ₹1 lakh asset
is a poor decision, however secure it is.
```

> Security exists to enable the business, not to obstruct it. A control that prevents legitimate work has simply relocated the cost rather than removing it.

### Example

A hospital restricts record access so tightly that doctors cannot retrieve notes during emergencies. Staff respond by sharing a generic login left permanently signed in — the control produced *worse* security than a well-designed, role-based system with emergency override and full auditing.
$md$, 7, false),

  (sid, 1, 'Explain the different Approaches to Information Security Implementation.', $md$
Security programmes are implemented through two contrasting organisational approaches, distinguished by where the initiative originates.

### Bottom-Up Approach

Security initiatives begin with **system administrators and technical staff**, who understand the systems and identify risks directly.

```text
   [ Technical staff / administrators ]
              |
        initiative rises
              v
       [ Middle management ]
              |
              v
        [ Senior management ]
```

**Advantages**
* Deep technical knowledge of actual vulnerabilities
* Practical, implementable measures
* Staff are personally invested

**Disadvantages**
* **Rarely succeeds** — this is the key point
* Lacks authority to enforce policy organisation-wide
* No budget or resource allocation power
* No coordination across departments
* Cannot compel other teams to comply

### Top-Down Approach

Security is initiated and driven by **upper management**, who issue policy, allocate resources and enforce compliance.

```text
   [ Senior management / CISO ]
              |
        policy and funding flow down
              v
       [ Middle management ]
              |
              v
      [ Technical implementation ]
```

**Advantages**
* **Authority** to enforce compliance
* **Budget** and resource allocation
* Consistent organisation-wide policy
* Clear accountability
* Aligned with business objectives
* **Far higher success rate**

**Disadvantages**
* May lack technical detail if not informed by practitioners
* Risk of policy disconnected from operational reality
* Slower to initiate

### Comparison

| Aspect              | Bottom-Up     | Top-Down          |
| ------------------- | ------------- | ----------------- |
| Initiated by        | Technical staff| **Management**   |
| Authority           | **Low**       | **High**          |
| Funding             | Limited       | Allocated         |
| Coordination        | Poor          | Strong            |
| Technical accuracy  | **High**      | Depends on input  |
| **Success rate**    | **Low**       | **High**          |

### The Systems Development Life Cycle Approach

The most effective method combines both: **top-down authority** with **bottom-up technical input**, structured through a formal **SecSDLC** with defined phases, deliverables and accountability.

> Security is fundamentally a **management problem** rather than a technical one. Technical staff can identify what is wrong; only management can authorise, fund and enforce the fix.

### Example

An administrator identifies that unencrypted laptops pose a serious risk and raises it repeatedly for a year without result — no budget, no mandate. After a competitor's breach, the board mandates encryption; it is deployed across 2,000 laptops in six weeks. The technical problem never changed, only the authority behind it.
$md$, 8, false),

  (sid, 1, 'Explain the role of Security in the Software Development Life Cycle (SDLC).', $md$
Security must be integrated into **every phase** of the SDLC rather than added at the end. The security-focused variant is the **SecSDLC**.

### Why Security Cannot Be Added Later

```text
Cost of fixing a defect by phase found:

Requirements  : 1x
Design        : 5x
Implementation: 10x
Testing       : 20x
Production    : 100x or more
```

A security flaw in the **architecture** — such as choosing an insecure authentication model — may require a rewrite if discovered after implementation. Retrofitted security is expensive, incomplete and fragile.

### Security Activities by Phase

**1. Investigation / Planning**
* Define security objectives and scope
* Preliminary risk assessment
* Identify regulatory obligations
* Obtain management authorisation

**2. Analysis**
* Detailed **risk assessment**
* **Threat modelling** — identify assets, threats, attack surfaces
* Define security requirements alongside functional ones
* Legal and compliance analysis

**3. Logical Design**
* Select security architecture and models
* Design access control and authentication
* Plan encryption strategy
* Design for **failure** — incident response and continuity

**4. Physical Design**
* Select specific technologies and vendors
* Define configurations
* Design **security testing** procedures

**5. Implementation**
* **Secure coding practices**
* Code review and static analysis
* Security testing — SAST, DAST, penetration testing
* Developer security training

**6. Maintenance and Change**
* **Patch management**
* Continuous monitoring
* Periodic vulnerability assessment
* Incident response
* Regular review as threats evolve — the longest and most neglected phase

### Threat Modelling — the Highest-Value Activity

Performed in the analysis phase, asking systematically:

```text
What are we building?      -> data flow diagrams
What can go wrong?         -> STRIDE threat categories
What will we do about it?  -> controls
Did we do a good job?      -> validation
```

**STRIDE**: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.

### Shift Left

Modern practice moves security **earlier** ("shift left") and automates it into CI/CD pipelines — **DevSecOps** — so that vulnerabilities are caught at commit time rather than at release.

> Security added after the fact protects only what the architecture happened to allow; security designed in shapes the architecture itself.

### Example

A team performs threat modelling during design and identifies that session tokens in URLs would leak through browser history and referrer headers. Changing the design costs an afternoon. Discovering it after launch would have required a token redesign, forced logout of all users, and a breach notification.
$md$, 9, false),

  (sid, 1, 'Explain the fundamental Security Principles.', $md$
Security design rests on a set of principles, most articulated by **Saltzer and Schroeder (1975)** and still authoritative.

### The Core Principles

**1. Least Privilege**
Every user and process receives the **minimum access** necessary. Limits the damage from compromise or error — arguably the single most valuable principle.

**2. Defence in Depth**
Multiple independent layers, so that no single failure is fatal.

```text
Firewall -> IDS -> host hardening -> app security -> encryption
```

**3. Fail-Safe Defaults (Fail Secure)**
The default is **deny**; access is granted explicitly. A failure should leave the system secure, not open.

```text
if (authorised) allow;      <- correct: default denies
else deny;
```

**4. Economy of Mechanism (Simplicity)**
Keep designs as simple as possible. Complexity is the enemy of security because complex systems cannot be fully analysed.

**5. Complete Mediation**
**Every** access is checked, every time — not merely the first, and never relying on cached decisions.

**6. Open Design**
Security must not depend on the secrecy of the design — **Kerckhoffs's principle**. The algorithm may be public; only the key is secret. "Security through obscurity" fails because secrets leak.

**7. Separation of Privilege**
Require more than one condition for access — the basis of **multi-factor authentication** and dual authorisation.

**8. Least Common Mechanism**
Minimise shared mechanisms between users, since shared components become covert channels.

**9. Psychological Acceptability**
Controls must be **usable**, or users will circumvent them.

**10. Weakest Link**
Security is only as strong as the weakest component — usually people.

### Summary

| Principle          | One-line statement                      |
| ------------------ | --------------------------------------- |
| Least privilege    | Grant the minimum necessary             |
| Defence in depth   | Never rely on one layer                 |
| Fail-safe defaults | Deny unless explicitly permitted        |
| Economy of mechanism | Simpler is more secure                |
| Complete mediation | Check every access, every time          |
| **Open design**    | **Secrecy of design is not security**   |
| Separation of privilege | Require more than one condition    |
| Psychological acceptability | Unusable controls get bypassed |

> Open design is the principle most often violated by inexperienced designers: a proprietary "secret" algorithm inspires confidence and provides none, because its secrecy will not survive contact with a determined analyst.

### Example

A system stores passwords using a custom, undisclosed hashing scheme. It appears secure until the source leaks and the scheme proves trivially reversible. Standard bcrypt — fully public, analysed by thousands — would have been far stronger precisely because it is open.
$md$, 10, false),

  (sid, 1, 'Explain the major Security Services.', $md$
**Security services** are the capabilities a security architecture provides to counter threats. The classification comes from the **ITU-T X.800** standard.

### The Five Core Services

**1. Authentication**
Assurance that a communicating entity is who it claims to be.

* **Peer entity authentication** — verifying identity at connection setup
* **Data origin authentication** — verifying the source of a message

Achieved through passwords, certificates, biometrics and **multi-factor authentication**.

**2. Access Control**
Preventing unauthorised **use** of a resource — determining what an authenticated entity is permitted to do.

| Model    | Basis                                   |
| -------- | --------------------------------------- |
| **DAC**  | Owner grants permissions                |
| **MAC**  | System-enforced labels; owner cannot override |
| **RBAC** | Permissions by job role                 |
| **ABAC** | Attributes and context (time, location) |

**3. Data Confidentiality**
Protection against unauthorised disclosure — including protection against **traffic analysis**, where an observer infers information from message patterns even without reading contents.

Achieved by encryption: symmetric (AES) and asymmetric (RSA, ECC).

**4. Data Integrity**
Assurance that data has not been altered. Achieved through hashing (SHA-256), **message authentication codes (HMAC)** and digital signatures.

Note the distinction: a plain hash detects **accidental** corruption; an HMAC or signature detects **deliberate** tampering, because an attacker who alters data can also recompute a plain hash.

**5. Non-Repudiation**
Preventing an entity from denying an action.

* **Non-repudiation of origin** — the sender cannot deny sending
* **Non-repudiation of delivery** — the receiver cannot deny receiving

Achieved by **digital signatures**, which only the private key holder could have produced — which is why symmetric MACs cannot provide non-repudiation.

### Supporting Services

* **Availability** — resistance to denial of service
* **Accountability / audit** — logging actions for later review
* **Key management** — generation, distribution, storage, revocation

### Services vs Mechanisms

```text
SERVICE:   WHAT is provided       (confidentiality)
MECHANISM: HOW it is provided     (AES encryption)

One service may use several mechanisms;
one mechanism may support several services.
```

> Non-repudiation is the service most often confused: it requires **asymmetric** cryptography, because anything both parties can compute cannot prove which of them did.

### Example

Signing a contract digitally provides four services at once: **authentication** (the signature identifies the signer), **integrity** (any alteration invalidates it), **non-repudiation** (the signer cannot deny it), and with TLS, **confidentiality** in transit.
$md$, 11, false);

  RAISE NOTICE 'Information Security — Unit 1: 11 questions inserted.';
END $do$;
