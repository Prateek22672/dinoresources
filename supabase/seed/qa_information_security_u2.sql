-- =====================================================================
-- Study-With-AI seed — Information Security (4th Year) — UNIT 2
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Information Security' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Information Security" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 2 AND question IN (
    'Explain the need for Information Security.',
    'Explain the Business Needs for Information Security.',
    'Explain the major categories of threats to information security.',
    'Explain Compromise to Intellectual Property as a security threat.',
    'Explain Deviations in Quality of Services as a security threat.',
    'Explain Espionage or Trespass.',
    'Explain Forces of Nature as a threat to information systems.',
    'Explain Human Error or Failure.',
    'Explain Information Extortion.',
    'Explain Sabotage or Vandalism.',
    'Explain Software Attacks.',
    'Explain Technical Hardware and Software Failures.',
    'Explain Technical Obsolescence.',
    'Explain Theft as a security threat.',
    'Explain the Deadly Sins in Software Security and their impact on information security.',
    'Explain Malware Infection attacks.',
    'Explain Theft attacks.',
    'Explain Bots and their role in security attacks.',
    'Explain Insider Abuse.',
    'Explain Insider Attacks.',
    'Explain Unauthorized Privilege Escalation.',
    'Explain Password Sniffing.',
    'Explain Website Defacement attacks.',
    'Explain Financial Fraud attacks.',
    'Explain attacks that exploit Wireless Networks.',
    'Explain Unauthorized Intellectual Property Access.',
    'Explain attacks that exploit User Social Network Profiles.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 2, 'Explain the need for Information Security.', $md$
Information security is needed because organisations now depend entirely on information systems, while the threats against them have become continuous, automated and professional.

### Why the Need Has Grown

**1. Total Dependence on Information Systems**
Business operations, financial records, customer data and communications are all digital. System unavailability halts the organisation.

**2. Increasing Value of Information**
Data has become a primary asset — customer databases, intellectual property and analytics often exceed the value of physical assets.

**3. Expanding Attack Surface**
```text
1990: a few computers on an internal network
Today: cloud services, mobile devices, IoT sensors,
       remote workers, third-party integrations
```
Every addition is another entry point.

**4. Professional, Organised Attackers**
Attacks are no longer curiosity-driven. Organised crime, nation-states and ransomware-as-a-service operations pursue financial and strategic gain.

**5. Automation of Attacks**
Automated tools scan the entire internet continuously. **Every** connected system is probed within minutes of coming online, regardless of its obscurity.

**6. Legal and Regulatory Obligation**
GDPR, HIPAA, PCI-DSS and the Indian DPDP Act impose duties with substantial penalties for failure.

**7. Cost of Breaches**
Direct losses, remediation, regulatory fines, litigation, and lost customers — frequently far exceeding the cost of prevention.

**8. Reputational Consequences**
Trust is slow to build and immediately destroyed.

### The Fundamental Asymmetry

```text
DEFENDER: must secure every system, every day, without error
ATTACKER: needs one weakness, once
```

### What Security Enables

Security is not merely protective — it is an **enabler**:

| Without security          | With security                    |
| ------------------------- | -------------------------------- |
| Cannot process payments   | E-commerce is possible           |
| Cannot store health data  | Digital healthcare is possible   |
| Cannot allow remote work  | Distributed workforce is possible|
| Cannot use cloud          | Elastic scaling is possible      |

> Security is best understood as a business enabler rather than a cost centre: it is what makes otherwise unacceptable activities acceptable.

### Example

A hospital's ransomware infection forces a return to paper records, diverts ambulances and postpones surgery. The security failure produced clinical consequences — demonstrating that information security and physical safety are no longer separable.
$md$, 1, true),

  (sid, 2, 'Explain the Business Needs for Information Security.', $md$
Information security serves **four fundamental business needs**, and framing it this way is what secures management support and budget.

### The Four Business Needs

**1. Protecting the Functionality of the Organisation**
Security is a **management responsibility**, not merely a technical one. Both general and IT management are accountable for implementing security that supports rather than obstructs operations. Security enables the organisation to function; it does not exist for its own sake.

**2. Enabling the Safe Operation of Applications**
Organisations run critical applications — ERP, email, customer platforms, payment systems. These must operate in a **secure environment** without exposing the organisation to unacceptable risk. Management must create that environment so applications can be trusted.

**3. Protecting the Data the Organisation Collects and Uses**
Data is frequently the organisation's most valuable asset.

```text
Data at rest    -> encryption, access control, backup
Data in motion  -> TLS, VPN
Data in use     -> memory protection, screen locks
```

Without data, most organisations cannot conduct transactions or deliver value at all.

**4. Safeguarding Technology Assets**
The organisation must have secure infrastructure appropriate to its **size and needs**:

* Small organisations may need only firewalls and antivirus
* Larger organisations require PKI, identity management, SIEM and dedicated security staff

Over-provisioning wastes money; under-provisioning leaves exposure.

### Framing Security to Management

Security investment competes with other business priorities, and must be justified in business terms:

| Technical framing         | Business framing                      |
| ------------------------- | ------------------------------------- |
| "We need a WAF"           | "This prevents the ₹2 crore breach cost we modelled" |
| "Patch the servers"       | "This closes the vulnerability used in the competitor's outage" |
| "Buy a SIEM"              | "This reduces detection time from 200 days to 2" |

### Return on Security Investment

```text
ROSI = (risk reduction x annual loss expectancy) - control cost
       ----------------------------------------------------
                        control cost
```

This is imperfect — breach costs are hard to estimate — but it forces the correct question: **is this control worth more than it costs?**

> The most common cause of under-funded security is not scepticism but poor translation: risks described in technical language rarely secure budget, while risks described in rupees usually do.

### Example

A CISO requesting funding for multi-factor authentication presents it as "80% of breaches begin with stolen credentials; MFA prevents nearly all of them, at ₹200 per user per year against a modelled breach cost of ₹4 crore." The proposal is approved — the same control, framed as a business decision.
$md$, 2, false),

  (sid, 2, 'Explain the major categories of threats to information security.', $md$
A **threat** is a potential danger to an information asset. Whitman and Mattord's classification identifies **twelve categories**, providing a systematic checklist for risk assessment.

### The Twelve Categories

| # | Threat Category                            | Example                          |
| - | ------------------------------------------ | -------------------------------- |
| 1 | **Compromise to intellectual property**    | Software piracy, copyright breach|
| 2 | **Deviations in quality of service**       | ISP or power outage              |
| 3 | **Espionage or trespass**                  | Unauthorised access, hacking     |
| 4 | **Forces of nature**                       | Flood, fire, earthquake          |
| 5 | **Human error or failure**                 | Accidental deletion, misconfiguration |
| 6 | **Information extortion**                  | Ransomware, blackmail            |
| 7 | **Sabotage or vandalism**                  | Website defacement, destruction  |
| 8 | **Software attacks**                       | Viruses, worms, DoS              |
| 9 | **Technical hardware failures**            | Disk crash, memory faults        |
| 10| **Technical software failures**            | Bugs, unpatched vulnerabilities  |
| 11| **Technical obsolescence**                 | Unsupported legacy systems       |
| 12| **Theft**                                  | Stolen laptops, stolen data      |

### Alternative Classifications

**By source**
```text
INTERNAL: employees, contractors  — often the costliest
EXTERNAL: hackers, competitors, nation-states
```

**By intent**
```text
DELIBERATE: attacks, sabotage, theft
ACCIDENTAL: human error, equipment failure, natural events
```

**By nature**
```text
HUMAN:        error, attack, insider misuse
ENVIRONMENTAL: fire, flood, power
TECHNICAL:    hardware and software failure
```

### Which Threats Matter Most

Contrary to intuition, **human error consistently ranks among the highest-impact categories** — misconfigured cloud storage, mistaken deletion and accidental disclosure cause more incidents than sophisticated attacks.

```text
Media attention:  advanced persistent threats, nation-states
Actual frequency: human error, phishing, unpatched software
```

### Threat vs Vulnerability vs Risk

```text
THREAT:        a potential danger            (a hacker exists)
VULNERABILITY: a weakness                    (unpatched server)
RISK:          threat exploiting vulnerability x impact

RISK = THREAT x VULNERABILITY x ASSET VALUE
```

A threat with no matching vulnerability presents no risk — which is why patching, by eliminating vulnerabilities, is so effective.

> The value of a complete taxonomy is that it prevents fixation: organisations that plan only for hackers are routinely destroyed by fire, flood or an administrator's mistake.

### Example

A risk assessment reveals that the highest-probability threat is not attack but **human error** in cloud configuration. Investment shifts to automated configuration checks and training — addressing the actual risk rather than the imagined one.
$md$, 3, false),

  (sid, 2, 'Explain Compromise to Intellectual Property as a security threat.', $md$
**Intellectual property (IP)** is the creation of the mind — inventions, designs, software, literary works and trade secrets — in which an organisation holds legal rights. Compromise of IP is among the most damaging threats because the asset itself is the organisation's competitive advantage.

### Forms of Intellectual Property

| Type            | Protects                          | Duration            |
| --------------- | --------------------------------- | ------------------- |
| **Copyright**   | Original works, software code     | Author's life + years |
| **Patent**      | Inventions and processes          | ~20 years           |
| **Trademark**   | Brand names, logos                | Renewable           |
| **Trade secret**| Confidential business information | Indefinite while secret |

**Trade secrets** are uniquely fragile: they are protected **only while secret**. Once disclosed, protection is lost permanently and cannot be restored — unlike a patent, which survives publication.

### Forms of Compromise

**1. Software Piracy** — the most common form; unlicensed copying and distribution
**2. Copyright Infringement** — unauthorised reproduction of protected works
**3. Trade Secret Theft** — often by departing employees taking designs or client lists
**4. Patent Infringement** — using a patented process without licence
**5. Reverse Engineering** — deriving designs from a product
**6. Industrial Espionage** — deliberate theft by competitors or nation-states

### Why Organisations Are Vulnerable

* IP is **digital** and therefore perfectly copyable at zero cost
* **Insiders** have legitimate access to it
* Cloud and collaboration tools move IP outside the perimeter
* Enforcement across jurisdictions is slow and expensive
* Detection is difficult — copying leaves the original intact

That last point is critical: unlike physical theft, **IP theft is not self-announcing**. The organisation may never know.

### Protective Measures

| Measure                  | Purpose                              |
| ------------------------ | ------------------------------------ |
| **Legal registration**   | Establishes enforceable rights       |
| **NDAs and contracts**   | Binds employees and partners         |
| **Access control**       | Need-to-know restriction             |
| **DLP systems**          | Detect IP leaving the organisation   |
| **Digital watermarking** | Trace the source of a leak           |
| **Exit procedures**      | Revoke access, remind of obligations |
| **Code obfuscation**     | Impede reverse engineering           |
| **Employee awareness**   | Many breaches are unintentional      |

> The highest-risk moment for trade secrets is **employee departure**, and it is also the moment organisations most often fail to act — access is frequently left active for weeks.

### Example

An engineer resigning to join a competitor copies CAD files representing four years of development. The files remain intact, no system alarms, and the loss surfaces only when the competitor launches a strikingly similar product — by which point the trade secret protection is already gone.
$md$, 4, false),

  (sid, 2, 'Explain Deviations in Quality of Services as a security threat.', $md$
**Deviations in quality of service (QoS)** occur when a supporting service fails to deliver as expected, disrupting the availability of information systems. It is a threat to **availability** even though no attacker is involved.

### The Nature of the Threat

Organisations depend on services they do not control:

```text
Your systems depend on:
   Internet Service Provider
   Electrical power utility
   Cloud provider
   Telecommunications carrier
   Water (for data centre cooling)
   Third-party SaaS services

A failure in ANY of these disrupts YOUR operations.
```

### Categories of Service Deviation

**1. Internet Service Issues**
ISP outage, degraded bandwidth, high latency, routing failures. Increasingly severe as organisations move to cloud services — no internet means no access to anything.

**2. Communications and Other Service Provider Issues**
Telephone, VoIP, mobile network and messaging failures affecting operations and incident response.

**3. Power Irregularities**

| Irregularity  | Description                       | Mitigation        |
| ------------- | --------------------------------- | ----------------- |
| **Blackout**  | Complete loss of power            | UPS + generator   |
| **Brownout**  | Prolonged voltage drop            | Voltage regulator |
| **Fault**     | Momentary loss                    | UPS               |
| **Sag**       | Brief voltage drop                | UPS               |
| **Spike**     | Momentary voltage increase        | Surge protector   |
| **Surge**     | Prolonged voltage increase        | Surge protector   |

Power quality problems damage equipment as well as interrupting service — a spike can destroy hardware permanently.

### Why This Threat Is Underestimated

There is no attacker, so it attracts less attention than hacking — yet **downtime costs the same regardless of cause**. An outage from a failed ISP is as expensive as one from a DDoS attack.

### Mitigation

* **Redundant ISPs** with diverse physical routes
* **UPS and generators** with regularly tested fuel supplies
* **Multi-region cloud deployment**
* **Service Level Agreements** with meaningful penalties
* **Business continuity planning**
* **Monitoring** of third-party service status

### The Cloud Concentration Problem

```text
Moving to the cloud transfers the risk;
it does not eliminate it.

A major cloud region outage takes down thousands
of organisations SIMULTANEOUSLY — and none of them
can do anything but wait.
```

> Dependence on third-party services trades direct control for reliability that is usually better — but on the rare occasions it fails, the organisation is entirely powerless.

### Example

A retailer's payment processing depends on a single ISP. A contractor severs the fibre while excavating, and the store cannot process card payments for six hours. No attacker was involved; the revenue loss was identical to a successful DoS attack.
$md$, 5, false),

  (sid, 2, 'Explain Espionage or Trespass.', $md$
**Espionage or trespass** occurs when an unauthorised individual gains access to information they are not entitled to see. It covers the whole spectrum from casual snooping to state-sponsored intelligence operations.

### The Two Forms

**1. Trespass** — unauthorised access, whether physical or electronic
**2. Espionage** — deliberate gathering of confidential information, usually for competitive or strategic advantage

### Competitive Intelligence vs Industrial Espionage

```text
COMPETITIVE INTELLIGENCE (legal):
   analysing public filings, marketing materials,
   published research, attending trade shows

INDUSTRIAL ESPIONAGE (illegal):
   unauthorised access, theft, bribery,
   planted employees, hacking
```

The boundary is **legality of the collection method**, not the value of the information obtained.

### Methods

* **Shoulder surfing** — observing screens, keyboards or ATM entry
* **Dumpster diving** — recovering discarded documents and media
* **Social engineering** — manipulating people into disclosure
* **Physical trespass** — entering restricted areas, tailgating
* **Electronic intrusion** — hacking systems and networks
* **Insider recruitment** — bribing or planting employees
* **Eavesdropping** — intercepting communications

### The Hacker Spectrum

| Type                | Motivation                       |
| ------------------- | -------------------------------- |
| **Expert hacker**   | Skill, challenge, sometimes profit |
| **Unskilled hacker (script kiddie)** | Uses others' tools; notoriety |
| **Hacktivist**      | Political or ideological cause   |
| **Cyberterrorist**  | Fear and disruption              |
| **Nation-state**    | Strategic and economic advantage |

**Nation-state actors** are the hardest to defend against: they possess effectively unlimited resources, extreme patience, and access to undisclosed zero-day vulnerabilities.

### Advanced Persistent Threats (APTs)

```text
Characteristics:
   ADVANCED   — sophisticated, custom tooling
   PERSISTENT — remains undetected for MONTHS or years
   THREAT     — organised, well-resourced, targeted

Average dwell time before detection: often 200+ days
```

### Controls

Physical access control, network segmentation, encryption, strong authentication and MFA, monitoring and anomaly detection, background checks, and **secure disposal** of documents and media.

> Dumpster diving and shoulder surfing persist because they require no technical skill and defeat every technical control — which is why physical and procedural security remain essential.

### Example

An attacker photographs a whiteboard through an office window from an adjacent building, capturing the architecture of an unreleased product. Every firewall, encryption key and access control in the organisation was irrelevant to that attack.
$md$, 6, false),

  (sid, 2, 'Explain Forces of Nature as a threat to information systems.', $md$
**Forces of nature** — also called acts of God — are environmental events that damage information systems. They are **unavoidable**, often unpredictable, and can be catastrophic, which makes preparation rather than prevention the only viable response.

### Types of Natural Threats

| Threat            | Primary damage                            |
| ----------------- | ----------------------------------------- |
| **Fire**          | Destroys equipment, media, facilities      |
| **Flood**         | Water damage to hardware and premises      |
| **Earthquake**    | Structural collapse, equipment damage      |
| **Lightning**     | Power surges destroying electronics        |
| **Landslide**     | Facility destruction                       |
| **Tornado / cyclone** | Structural and power damage            |
| **Electrostatic discharge (ESD)** | Component damage; frequently underestimated |
| **Dust contamination** | Equipment degradation and overheating |
| **Extreme temperature** | Overheating, hardware failure         |

**ESD** deserves particular mention: a static discharge too small for a person to feel can destroy a microchip, and it is the most common natural threat in ordinary offices.

### Why They Cannot Be Prevented

```text
Deliberate attacks -> can be DETERRED and PREVENTED
Natural forces     -> can only be PREPARED FOR

Focus shifts entirely from prevention to
CONTINUITY and RECOVERY.
```

### Controls and Preparation

**Preventive / protective**
* Fire suppression — **gas-based** systems in server rooms, since water destroys equipment
* Waterproofing and raised flooring
* Surge protection and lightning arrestors
* Climate control and dust filtration
* Anti-static flooring, wrist straps and humidity control
* Seismic bracing in earthquake zones

**Recovery**
* **Offsite backups** — the single most important control
* **Geographic separation** of primary and backup sites
* **Disaster Recovery Plan (DRP)**
* **Business Continuity Plan (BCP)**
* **Insurance**

### Key Planning Metrics

```text
RTO (Recovery Time Objective)  — how quickly must we restore?
RPO (Recovery Point Objective) — how much data can we afford to lose?
```

These two figures drive the entire recovery architecture and its cost.

### The Geographic Separation Rule

```text
Backup site too close  -> the same event destroys both
Backup site too far    -> latency and operational difficulty

Standard guidance: sufficiently distant to be outside
the same disaster zone (typically 50-100+ km).
```

> The recurring failure is untested backups: organisations discover during a real disaster that their backups were incomplete, corrupted, or that nobody knew the restore procedure.

### Example

A data centre's fire suppression uses water sprinklers. A minor electrical fire triggers them, and while the fire is extinguished, water destroys every server in the room. Gas-based suppression would have controlled the fire without damaging the equipment.
$md$, 7, false),

  (sid, 2, 'Explain Human Error or Failure.', $md$
**Human error or failure** covers acts performed without malicious intent that nonetheless compromise security. It is consistently among the **largest causes of security incidents** — frequently exceeding deliberate attacks.

### Common Forms

* **Accidental deletion** of files or databases
* **Misconfiguration** — the leading cause of cloud data exposure
* **Sending data to the wrong recipient** — misaddressed email
* **Weak passwords** and password reuse
* **Falling for phishing** — the entry point for most breaches
* **Losing devices** containing sensitive data
* **Improper disposal** of documents or drives
* **Failing to apply patches**
* **Bypassing controls** for convenience
* **Data entry errors**

### Why Humans Fail

| Cause                | Detail                                  |
| -------------------- | --------------------------------------- |
| **Lack of training** | Unaware of the risk                     |
| **Inexperience**     | Unfamiliar with procedures              |
| **Improper training**| Trained incorrectly                     |
| **Fatigue and pressure** | Errors rise sharply under stress    |
| **Poor system design** | Interfaces that invite mistakes       |
| **Complexity**       | Too many controls to follow correctly   |
| **Complacency**      | "It will not happen here"               |

### The Cloud Misconfiguration Problem

```text
An administrator sets a storage bucket to "public"
intending temporary testing, and forgets.

Result: millions of records exposed with no attacker,
        no vulnerability, and no alert.
```

This single error pattern has caused many of the largest data exposures on record.

### Controls

**1. Training and Awareness** — the primary control, including realistic **phishing simulations**
**2. Clear Procedures** — documented, tested and accessible
**3. Technical Safeguards**
* Confirmation prompts for destructive actions
* Automated configuration checking
* DLP to catch misaddressed data
* Automated backups enabling recovery
* Undo and soft-delete features

**4. Separation of Duties** — errors are caught by a second person
**5. Least Privilege** — limits how much damage one mistake can cause
**6. Usable Design** — make the secure path the easy path

### The Design Principle

```text
Blaming users is ineffective.

If a system permits a catastrophic mistake
with a single click and no confirmation,
that is a DESIGN failure, not a user failure.
```

> Human error cannot be eliminated, only **contained**. The realistic objective is that no single mistake by any individual can cause irreversible harm.

### Example

An administrator runs a `DELETE` without a `WHERE` clause on a production database. The error is entirely human — but the organisation recovers in twenty minutes because point-in-time backups existed and had been tested. The error was contained by design, not prevented by discipline.
$md$, 8, false),

  (sid, 2, 'Explain Information Extortion.', $md$
**Information extortion** occurs when an attacker steals or blocks access to information and demands payment for its return, or for not disclosing it. Ransomware has made this the most prominent security threat of recent years.

### Forms of Extortion

**1. Ransomware**
Malware encrypts the victim's data and demands payment for the decryption key.

```text
Infection -> encrypts files -> displays ransom note
          -> demands cryptocurrency payment
          -> promises a decryption key
```

**2. Double Extortion**
The modern evolution, and a direct response to organisations improving their backups:

```text
Step 1: EXFILTRATE the data first
Step 2: THEN encrypt it
Step 3: demand payment to decrypt
        AND to not publish the stolen data

Good backups defeat step 3's first half —
but not the threat of publication.
```

**3. Triple Extortion** — additionally threatening the victim's own customers, or launching DDoS to increase pressure

**4. Data Breach Extortion** — no encryption at all; simply "pay or we publish"

### The Ransomware Business Model

**Ransomware-as-a-Service (RaaS)** has industrialised the crime: developers write the malware and rent it to affiliates who conduct attacks, sharing proceeds. This separates technical skill from execution and vastly increases the number of attackers.

### Impact

| Impact                | Detail                                    |
| --------------------- | ----------------------------------------- |
| **Operational**       | Complete business shutdown                |
| **Financial**         | Ransom, recovery cost, lost revenue       |
| **Reputational**      | Public disclosure of the breach           |
| **Regulatory**        | Fines for the underlying data breach      |
| **Safety**            | Hospitals and utilities put lives at risk |

### Should the Ransom Be Paid?

| Argument to pay              | Argument not to pay                    |
| ---------------------------- | -------------------------------------- |
| Faster recovery              | **No guarantee** of a working key       |
| May be cheaper than downtime | Funds further criminal activity         |
| Prevents data publication    | Marks the organisation as a payer       |
|                              | Data may be published regardless        |
|                              | May be **illegal** under sanctions law  |

Official guidance from most law enforcement agencies is **not to pay** — while acknowledging that organisations facing existential loss frequently do.

### Prevention

* **Offline, immutable backups** — the single most effective defence
* Prompt patching
* Email filtering and phishing training
* Network **segmentation** to limit spread
* Endpoint detection and response
* **MFA** on all remote access
* A tested incident response plan

> Backups defeat encryption but not exfiltration, which is precisely why attackers adopted double extortion — the defence forced the offence to evolve.

### Example

A manufacturer restores from offline backups in two days without paying, only to receive a follow-up demand threatening to publish stolen design documents. The backups solved availability; nothing could restore confidentiality once the data had left.
$md$, 9, false),

  (sid, 2, 'Explain Sabotage or Vandalism.', $md$
**Sabotage or vandalism** involves the deliberate destruction, damage or defacement of information systems and assets. The motive is disruption or reputational harm rather than financial gain.

### The Distinction

```text
SABOTAGE:  destruction to DISRUPT operations
           (deleting data, destroying equipment)

VANDALISM: defacement to EMBARRASS or make a statement
           (website defacement, graffiti)
```

### Forms

**1. Website Defacement** — replacing content with the attacker's message; highly visible and reputationally damaging
**2. Data Destruction** — deleting or corrupting databases and backups
**3. Physical Destruction** — damaging servers, cabling or facilities
**4. Logic Bombs** — malicious code triggering on a condition or date, frequently planted by insiders before departure
**5. Denial of Service** — rendering services unavailable
**6. Hacktivism** — politically or ideologically motivated attacks
**7. Cyberterrorism** — attacks on critical infrastructure to cause fear

### Who Commits It

| Actor                  | Typical motivation                  |
| ---------------------- | ----------------------------------- |
| **Disgruntled employees** | Revenge — and they have access    |
| **Hacktivists**        | Ideological protest                 |
| **Competitors**        | Commercial disruption               |
| **Cyberterrorists**    | Fear and political effect           |
| **Vandals**            | Notoriety                           |

**Disgruntled insiders are the most dangerous**, because they already possess access, know exactly which systems matter, and understand what monitoring exists.

### The Insider Sabotage Pattern

```text
Employee learns of dismissal or passed-over promotion
        |
plants a LOGIC BOMB while still trusted
        |
leaves the organisation
        |
code triggers WEEKS LATER — after access is revoked
```

This delayed trigger is what makes logic bombs so effective: the obvious suspect had no access at the time of the damage.

### Impact

* Operational disruption and downtime
* Data loss, sometimes permanent
* Reputational damage — defacement is public and screenshot-able
* Recovery costs
* Loss of customer confidence

### Controls

* **Prompt access revocation** on termination — immediate, not next week
* **Separation of duties** — no single person can destroy everything
* **Code review** — detects logic bombs before deployment
* **Backups**, including offline and immutable copies
* **Monitoring** of privileged actions
* **Change control** on production systems
* Physical security
* Exit interviews and fair treatment of departing staff

> A significant proportion of insider sabotage is preventable through management practice rather than technology: employees treated fairly on departure rarely sabotage.

### Example

A system administrator, aware of impending redundancy, plants a script deleting server configurations 90 days later. It executes long after departure, taking systems offline for days. Code review and separation of duties would have caught it; revoking access alone did not.
$md$, 10, false),

  (sid, 2, 'Explain Software Attacks.', $md$
**Software attacks** occur when malicious software or techniques are used to compromise systems. This is the largest and most varied threat category.

### Malware Types

| Type            | Defining behaviour                                |
| --------------- | ------------------------------------------------- |
| **Virus**       | Attaches to a host file; needs **user action**    |
| **Worm**        | **Self-replicating**; spreads without user action |
| **Trojan horse**| Disguised as legitimate software                  |
| **Rootkit**     | Hides deeply in the system to evade detection     |
| **Spyware**     | Covertly collects information                     |
| **Ransomware**  | Encrypts data and demands payment                 |
| **Adware**      | Displays unwanted advertising                     |
| **Keylogger**   | Records keystrokes                                |
| **Logic bomb**  | Triggers on a condition                           |
| **Backdoor**    | Provides hidden ongoing access                    |
| **Botnet agent**| Enrols the machine under remote control           |

### Attack Techniques

**1. Denial of Service (DoS/DDoS)** — exhausting resources to deny legitimate access
**2. Injection Attacks**

```text
SQL injection:
   input:  ' OR '1'='1
   query:  SELECT * FROM users WHERE pass = '' OR '1'='1'
   -> the condition is always TRUE -> authentication bypassed
```

Also command injection, LDAP injection and XML injection.

**3. Cross-Site Scripting (XSS)** — injecting scripts that execute in other users' browsers
**4. Cross-Site Request Forgery (CSRF)** — tricking an authenticated user into unintended actions
**5. Buffer Overflow** — overwriting memory to execute injected code
**6. Man-in-the-Middle** — intercepting and possibly altering communication
**7. Password Attacks** — brute force, dictionary, credential stuffing
**8. Zero-Day Exploits** — attacking vulnerabilities before a patch exists

### Attack Vectors

```text
Email attachments and links  <- most common entry point
Malicious websites
Infected removable media
Software supply chain compromise
Unpatched network services
```

### Defences

| Defence                     | Addresses                          |
| --------------------------- | ---------------------------------- |
| **Patching**                | Known vulnerabilities              |
| **Antivirus / EDR**         | Malware                            |
| **Input validation**        | Injection attacks                  |
| **Firewalls / IPS**         | Network-based attacks              |
| **Email filtering**         | The primary delivery vector        |
| **User training**           | Phishing and social engineering    |
| **Least privilege**         | Limits damage from any compromise  |
| **Backups**                 | Ransomware recovery                |

> Almost every injection vulnerability traces to one root cause — **trusting user input**. Parameterised queries and output encoding eliminate entire attack classes rather than individual exploits.

### Example

A web form concatenates user input directly into an SQL query. An attacker enters `' OR '1'='1` and bypasses authentication entirely. Using a parameterised query would have made the input data rather than code, rendering the attack impossible by construction.
$md$, 11, false),

  (sid, 2, 'Explain Technical Hardware and Software Failures.', $md$
**Technical failures** are defects or malfunctions in hardware or software that compromise availability, integrity or confidentiality — without any attacker involved.

### Technical Hardware Failures

Occur when equipment contains flaws or wears out.

| Failure               | Consequence                            |
| --------------------- | -------------------------------------- |
| **Hard disk crash**   | Data loss, service outage              |
| **Memory (RAM) faults**| Corruption, crashes                   |
| **CPU defects**       | Incorrect computation                  |
| **Power supply failure**| Complete system loss                 |
| **Network equipment failure** | Loss of connectivity           |
| **Cooling failure**   | Overheating and cascading damage       |

**Mean Time Between Failures (MTBF)** quantifies expected reliability, and at scale the statistics become certain: a data centre with 10,000 drives experiences failures **daily** as a matter of routine, not exception.

**The Intel Pentium FDIV bug (1994)** illustrates hardware defects: a flawed division instruction produced incorrect results and cost roughly $475 million to recall — the hardware equivalent of a software bug.

### Technical Software Failures

Software ships with defects because it is complex and developed under time and cost pressure.

* **Bugs** — coding errors producing incorrect behaviour
* **Unpatched vulnerabilities** — known flaws left unfixed
* **Configuration errors** — insecure defaults left unchanged
* **Compatibility failures** — components that do not work together
* **Untested code paths** — error handlers that themselves fail
* **Integer overflow, race conditions, memory leaks**

### Why Software Is Inherently Defective

```text
Modern OS:        tens of millions of lines of code
Industry average: roughly 1-25 defects per 1,000 lines

Exhaustive testing is IMPOSSIBLE —
the state space is effectively infinite.
```

### The Patch Management Problem

```text
Vulnerability disclosed
        |
Patch released
        |
        <---- ORGANISATIONS DELAY HERE ---->
        |
Patch applied

Most successful attacks exploit vulnerabilities
for which a patch ALREADY EXISTED.
```

WannaCry is the canonical case: the patch had been available for two months.

### Controls

**Hardware** — redundancy (RAID, clustering), monitoring and predictive replacement, environmental controls, spare parts, maintenance contracts.

**Software** — prompt patching, testing before deployment, secure coding, vulnerability scanning, and vendor support agreements.

**Both** — backups, disaster recovery planning and high-availability architecture.

> Redundancy is what converts an inevitable component failure into a non-event: with RAID and clustering, hardware failure becomes a maintenance ticket rather than an outage.

### Example

A RAID array loses a disk. Because the array is redundant, service continues uninterrupted and the drive is replaced during the next maintenance window. The identical failure on a single-disk server would have caused hours of downtime and possible data loss.
$md$, 12, false),

  (sid, 2, 'Explain Technical Obsolescence.', $md$
**Technical obsolescence** occurs when systems become outdated to the point of being unreliable, unsupportable and insecure. It is a **management failure** rather than a technical event, because it results from deferred planning rather than sudden breakdown.

### How Systems Become Obsolete

```text
Vendor releases software
        |
supported and patched for N years
        |
END OF SUPPORT announced
        |
NO MORE SECURITY PATCHES
        |
newly discovered vulnerabilities remain
PERMANENTLY UNPATCHED
```

### Why Obsolescence Is a Security Threat

**1. No Security Patches**
This is the decisive problem. Once support ends, every newly discovered vulnerability remains exploitable forever. Attackers specifically target end-of-life systems because the flaws never get fixed.

**2. Incompatibility** with modern security tools that no longer support the platform
**3. Weak or Broken Cryptography** — obsolete systems rely on algorithms since broken (DES, MD5, SHA-1, TLS 1.0)
**4. No Vendor Support** when problems arise
**5. Skills Shortage** — few engineers remain who understand the technology
**6. Spare Parts Unavailable** for legacy hardware
**7. Compliance Failure** — regulations frequently prohibit unsupported systems

### Why Organisations Keep Obsolete Systems

| Reason                        | Reality                                  |
| ----------------------------- | ---------------------------------------- |
| "It still works"              | Until it is exploited                    |
| Upgrade cost                  | Usually less than a breach               |
| Critical application dependency | The genuine hard case                  |
| Fear of disruption            | Manageable with planning                 |
| No lifecycle planning         | The actual root cause                    |

The genuinely difficult case is a critical application that **only runs on the obsolete platform** — common in industrial control, healthcare and banking.

### Management Responsibility

Obsolescence is entirely **predictable**. End-of-life dates are published years in advance, so an organisation caught unprepared has failed to plan, not been surprised.

### Controls

* **Asset inventory** with lifecycle tracking
* **Technology refresh planning** and budgeting
* **Vendor roadmap monitoring**
* **Compensating controls** where replacement is genuinely impossible:
  * Network **isolation** — segment the legacy system away from everything else
  * Strict access control
  * Enhanced monitoring
  * Virtual patching via IPS

> Where a legacy system cannot be replaced, **isolation is the only responsible answer** — it should be treated as already compromised and contained accordingly.

### Example

A hospital runs imaging equipment on Windows XP because the manufacturer never certified a newer version. Replacement would cost crores. The correct response is not to accept the risk but to place the device on an isolated VLAN with no internet access and tightly controlled connections — containing an unpatchable system rather than pretending it is safe.
$md$, 13, false),

  (sid, 2, 'Explain Theft as a security threat.', $md$
**Theft** is the illegal taking of another's property — physical, electronic or intellectual. It threatens **confidentiality** and **availability** simultaneously, and unlike most threats it may leave no trace in system logs.

### Types of Theft

**1. Physical Theft**
Laptops, mobile devices, storage media, servers and printed documents. Laptop theft is particularly damaging because a single device may hold thousands of records.

**2. Electronic Theft**
Copying data without removing the original — the critical difference from physical theft:

```text
PHYSICAL THEFT:   the item is GONE -> immediately noticed
ELECTRONIC THEFT: the data is COPIED -> original intact
                                     -> may NEVER be noticed
```

This is why data theft is frequently discovered only when the data appears for sale, sometimes years later.

**3. Intellectual Property Theft** — designs, source code, trade secrets
**4. Identity Theft** — using stolen personal information to impersonate
**5. Financial Theft** — fraudulent transfers and card fraud
**6. Service Theft** — unauthorised use of computing resources, such as cryptojacking

### Why Theft Is Difficult to Prevent

* **Insiders** have legitimate access
* Data is **trivially copyable** at no cost
* Devices are portable and easily removed
* Cloud services enable exfiltration through ordinary web traffic
* Detection often depends on behavioural analysis rather than access violation

### Controls

**Physical**
* Cable locks and secure storage
* Access control, CCTV and visitor management
* Asset tagging and inventory
* Secure disposal — **degaussing or physical destruction**, never simple deletion

**Electronic**
* **Full disk encryption** — the decisive control for lost or stolen devices
* Data Loss Prevention (DLP)
* USB port control
* Email and upload monitoring
* Access logging and anomaly detection
* Remote wipe capability

**Administrative**
* Least privilege and need-to-know
* Employment agreements and NDAs
* Background verification
* Prompt offboarding

### The Value of Encryption

```text
UNENCRYPTED stolen laptop:
   data breach, regulatory notification, fines, reputational harm

ENCRYPTED stolen laptop:
   a hardware loss — most breach notification laws
   provide a SAFE HARBOUR for encrypted data
```

> Full disk encryption converts a reportable data breach into an insurance claim — which is why it is one of the highest-return controls available.

### Example

An employee's laptop containing 50,000 customer records is stolen from a car. Because the drive was encrypted with a strong passphrase, the organisation is not required to notify regulators or customers. The identical theft without encryption would have triggered mandatory disclosure and substantial fines.
$md$, 14, false),

  (sid, 2, 'Explain the Deadly Sins in Software Security and their impact on information security.', $md$
The **"deadly sins" of software security** are recurring programming errors that produce the majority of exploitable vulnerabilities. Named by Howard, LeBlanc and Viega, they remain the foundation of secure coding education.

### The Principal Sins

**1. Buffer Overruns**
Writing beyond an allocated buffer, allowing memory corruption and arbitrary code execution.

```text
char buf[10];
strcpy(buf, userInput);   // no bounds check
// input longer than 10 overwrites adjacent memory,
// including the RETURN ADDRESS
```
*Fix:* bounds-checked functions, safe languages.

**2. Format String Problems**

```text
printf(userInput);        // WRONG — input treated as format string
printf("%s", userInput);  // correct
```
Allows reading and writing arbitrary memory.

**3. SQL Injection**
Concatenating user input into queries. *Fix:* **parameterised queries**.

**4. Command Injection**
Passing user input to a shell. *Fix:* avoid shell invocation; validate strictly.

**5. Cross-Site Scripting (XSS)**
Rendering user input as HTML without encoding. *Fix:* **output encoding**, Content Security Policy.

**6. Failing to Handle Errors**
Errors ignored, or error messages leaking internal details such as stack traces and database structure.

**7. Information Leakage**
Exposing system details through error messages, comments, headers or debug output.

**8. Race Conditions (TOCTOU)**
Time-of-check to time-of-use — the state changes between validation and use.

**9. Poor Usability**
Security so inconvenient that users disable or bypass it.

**10. Use of Weak Password Systems** — weak hashing, no salting, weak policies
**11. Failing to Store and Protect Data Securely** — hardcoded keys, unencrypted sensitive data
**12. Improper Use of Cryptography** — writing custom algorithms, reusing IVs, weak randomness

### The Common Root Causes

```text
1. TRUSTING USER INPUT          -> injection, overflow, XSS
2. Failing to handle errors     -> leakage, unexpected states
3. Rolling your own crypto      -> broken confidentiality
```

Nearly every sin reduces to the first.

### Impact on Information Security

| Sin                | CIA impact                             |
| ------------------ | -------------------------------------- |
| Buffer overrun     | All three — full system compromise     |
| SQL injection      | Confidentiality and integrity          |
| XSS                | Confidentiality — session theft        |
| Weak crypto        | Confidentiality                        |
| Error handling     | Confidentiality — information leakage  |

### Prevention

Secure coding standards, code review, static and dynamic analysis, **input validation as a discipline**, using vetted libraries rather than custom implementations, and developer security training.

> The most important single rule in secure coding: **never write your own cryptography**. Standard, publicly analysed implementations exist precisely because subtle errors in custom crypto are invisible until exploited.

### Example

A login page builds its query by string concatenation. An attacker enters `admin'--`, commenting out the password check and logging in as administrator. A parameterised query treats that input as a literal username, and the attack simply fails.
$md$, 15, false),

  (sid, 2, 'Explain Malware Infection attacks.', $md$
**Malware infection** occurs when malicious software is installed on a system, typically without the user's knowledge, to steal data, damage systems or provide ongoing attacker access.

### Infection Vectors

| Vector                    | Description                                |
| ------------------------- | ------------------------------------------ |
| **Email attachments**     | The most common — documents with macros    |
| **Phishing links**        | Leading to exploit pages                   |
| **Drive-by downloads**    | Infection merely from visiting a page      |
| **Malicious advertising** | Ads on legitimate sites                    |
| **Removable media**       | Infected USB drives                        |
| **Software bundling**     | Malware packaged with free software        |
| **Supply chain**          | Compromised legitimate software updates    |
| **Network exploitation**  | Worms attacking unpatched services         |

**Supply chain infection** is the most dangerous because the malware arrives through a **trusted, signed update** — the SolarWinds compromise reached roughly 18,000 organisations this way.

### The Infection Lifecycle

```text
1. DELIVERY     — malware reaches the system
2. EXECUTION    — user opens it, or an exploit runs it
3. PERSISTENCE  — survives reboot (registry, scheduled task, service)
4. EVASION      — disables antivirus, hides processes
5. COMMAND & CONTROL — contacts the attacker
6. PAYLOAD      — steal, encrypt, spread, mine
```

Understanding this sequence matters because **each stage is an opportunity to detect and break the chain**.

### Evasion Techniques

* **Polymorphism** — the code changes with each infection, defeating signatures
* **Metamorphism** — the code rewrites itself entirely
* **Packing and encryption** of the payload
* **Fileless malware** — resides only in memory, leaving nothing on disk
* **Living off the land** — abusing legitimate tools such as PowerShell and WMI
* **Sandbox detection** — remaining dormant when it detects analysis

Fileless and living-off-the-land techniques are particularly effective against traditional antivirus, since there is no malicious file to scan.

### Indicators of Infection

Degraded performance, unexpected network connections, disabled security software, unfamiliar processes, modified system files, unexplained account activity.

### Defences — Layered

```text
PREVENT: email filtering, patching, application whitelisting,
         disabling macros, user training
DETECT:  antivirus, EDR, network monitoring, anomaly detection
RESPOND: isolate, eradicate, restore from backup, investigate
```

### Why Antivirus Alone Is Insufficient

Signature-based detection cannot recognise novel or polymorphic malware. **Behavioural detection** and **EDR** are needed, watching what software *does* rather than what it *is*.

> Disabling Office macros by policy prevents a large proportion of real-world infections at essentially zero cost — one of the highest-value controls available.

### Example

An employee opens an invoice attachment. A macro downloads a payload that establishes persistence, contacts a command server, and spreads laterally. Antivirus misses the novel variant, but EDR flags a Word process spawning PowerShell — a behaviour that is never legitimate — and isolates the machine.
$md$, 16, false),

  (sid, 2, 'Explain Theft attacks.', $md$
**Theft attacks** are deliberate operations aimed at obtaining data, credentials, money or resources. Unlike opportunistic theft, these are planned attacks with a specific objective.

### Categories

**1. Data Theft (Exfiltration)**
Stealing databases, customer records, financial data or intellectual property.

```text
Exfiltration channels:
   HTTPS uploads to cloud storage   <- blends with normal traffic
   DNS tunnelling                   <- rarely monitored
   Email to external accounts
   Encrypted archives over legitimate services
   Physical removal via USB
```

Attackers deliberately choose channels that resemble ordinary traffic — which is why volume-based detection matters more than protocol blocking.

**2. Credential Theft**

| Technique              | Method                                  |
| ---------------------- | --------------------------------------- |
| **Phishing**           | Fake login pages                        |
| **Keylogging**         | Recording keystrokes                    |
| **Credential dumping** | Extracting from memory (Mimikatz)       |
| **Password spraying**  | Common passwords across many accounts   |
| **Credential stuffing**| Reusing credentials from other breaches |

**Credential stuffing** succeeds because of password reuse: a breach at one site yields working logins at many others.

**3. Financial Theft** — fraudulent transfers, card data theft, business email compromise
**4. Identity Theft** — using stolen personal data to impersonate
**5. Resource Theft** — cryptojacking, using compromised systems for mining or as proxies
**6. Session Theft** — stealing session tokens to bypass authentication entirely

### The Attack Chain

```text
Initial access -> privilege escalation -> discovery
              -> collection -> STAGING -> exfiltration
```

The **staging** step is a useful detection point: attackers typically compress and encrypt data into a single archive before transfer, producing an unusual pattern.

### Detection

* **Data Loss Prevention** monitoring content leaving the network
* **Volume anomalies** — unusual outbound data
* **Off-hours access** to large datasets
* **Unusual destinations**
* **UEBA** — deviation from a user's established behaviour

### Prevention

* **Encryption** at rest and in transit
* **MFA** — defeats most credential theft outright
* Least privilege limiting what any account can reach
* Network segmentation
* Egress filtering
* Removable media control

> MFA is the highest-leverage control against theft attacks: it renders stolen passwords largely useless, and password theft is the entry point for the overwhelming majority of breaches.

### Example

An attacker phishes credentials, logs in successfully, and spends weeks quietly collecting files. DLP finally alerts when a 4 GB encrypted archive is uploaded to a personal cloud account at 2 a.m. — the staging and exfiltration step, not the original theft, is what was detectable.
$md$, 17, false),

  (sid, 2, 'Explain Bots and their role in security attacks.', $md$
A **bot** (short for robot) is a compromised computer under remote attacker control. A network of such machines is a **botnet**, and it is the delivery mechanism for most large-scale attacks.

### Terminology

```text
BOT        — one infected machine ("zombie")
BOTNET     — a network of bots
BOTMASTER  — the attacker controlling them
C&C        — Command and Control infrastructure
```

### Architecture

```text
        [ BOTMASTER ]
              |
      [ C&C SERVER ]
        /     |     \
     bot     bot     bot  ... thousands to millions
        \     |     /
          [ TARGET ]
```

**C&C architectures**

| Type            | Characteristic                        | Weakness              |
| --------------- | ------------------------------------- | --------------------- |
| **Centralised** | IRC or HTTP server                    | Single point — easily taken down |
| **Peer-to-peer**| Bots relay commands to each other     | Resilient, harder to disrupt |
| **DGA**         | Bots compute new domains daily        | Defeats static blocklists |

**Domain Generation Algorithms** are particularly effective: both bot and botmaster compute the same pseudo-random domain each day, so blocking known domains achieves nothing.

### What Botnets Are Used For

* **DDoS attacks** — the most visible use
* **Spam distribution** — historically the majority of global spam
* **Credential stuffing** — distributed login attempts evading rate limits
* **Cryptomining** — stealing computing power
* **Click fraud**
* **Proxy networks** — anonymising other attacks
* **Data harvesting** from infected machines

### IoT Botnets

**Mirai (2016)** marked a shift by targeting IoT devices — cameras and routers — using **default credentials**. These devices are ideal bots:

```text
Numerous            — billions deployed
Rarely patched      — often never updated
Always connected    — permanent availability
Weak default credentials
No security interface — users cannot inspect them
```

Mirai directed roughly 100,000 devices at DNS provider Dyn, taking down Twitter, Netflix and Reddit.

### Detection

Unusual outbound connections, traffic to known C&C addresses, DNS queries for algorithmically generated domains, participation in scanning, and degraded performance.

### Defences

* Patching and changing **default credentials**
* Network segmentation isolating IoT devices
* Egress filtering
* DNS monitoring and sinkholing
* Coordinated **C&C takedowns** by law enforcement

> The economics are the core problem: an IoT manufacturer bears none of the cost when its insecure device joins a botnet, so there is little commercial incentive to secure it.

### Example

A home security camera with the default password `admin/admin` is compromised within minutes of connecting. The owner notices nothing — the camera works normally — while it participates in DDoS attacks worldwide.
$md$, 18, false),

  (sid, 2, 'Explain Insider Abuse.', $md$
**Insider abuse** is the misuse of authorised access by someone within the organisation. It is distinguished from an insider *attack* by intent: abuse frequently involves policy violation and personal benefit rather than deliberate harm.

### Forms of Insider Abuse

* **Excessive privilege use** — accessing data beyond what the role requires
* **Snooping** — viewing records out of curiosity: celebrity medical files, colleagues' salaries, ex-partners' accounts
* **Policy violations** — using personal cloud storage, installing unauthorised software
* **Misuse of resources** — using company systems for personal business
* **Data hoarding** — copying data "in case it is useful later"
* **Credential sharing** — lending logins to colleagues
* **Circumventing controls** for convenience
* **Unauthorised disclosure** — discussing confidential matters externally

### Why Insider Abuse Is Difficult to Detect

```text
Authentication:  SUCCEEDS — they are a legitimate user
Authorisation:   PASSES   — they have the permission
No malware, no exploit, no policy technically broken

The only signal is the PATTERN of access.
```

This is why traditional security controls — firewalls, antivirus, IDS — are essentially blind to it.

### The Abuse–Attack Spectrum

| Behaviour                    | Intent            | Severity |
| ---------------------------- | ----------------- | -------- |
| Checking a celebrity's record| Curiosity         | Abuse    |
| Using company email personally| Convenience      | Abuse    |
| Copying client list on departure | Personal gain | Serious abuse |
| Selling data to a competitor | Malicious         | **Attack** |
| Sabotaging systems           | Revenge           | **Attack** |

### Detection Approaches

**UEBA (User and Entity Behaviour Analytics)** is the principal technique — building a baseline per user and flagging deviation:

```text
Baseline: 20 records/day, 9am-6pm, own department only

Flagged:  200 records at 11pm across three departments
```

Also: access to records outside one's assigned cases, repeated failed access to restricted areas, and large data transfers.

### Controls

* **Least privilege** and regular access reviews
* **Comprehensive audit logging**, particularly of read access
* **UEBA** monitoring
* **DLP**
* **Separation of duties**
* **Clear policy** — many employees genuinely do not know a behaviour is prohibited
* **Awareness training** explaining *why* rules exist

### The Cultural Dimension

Insider abuse is reduced more by **management practice** than by technology: fair treatment, clear expectations, visible monitoring and a route to raise grievances all reduce it measurably.

> Publicising that access is logged and reviewed deters far more snooping than any technical control — most casual abuse assumes nobody is watching.

### Example

A hospital employee looks up a celebrity's medical record out of curiosity. No system was breached and every permission check passed — but the access is a serious privacy violation, detected only because audit logs flagged a record outside the employee's assigned patients.
$md$, 19, false),

  (sid, 2, 'Explain Insider Attacks.', $md$
An **insider attack** is a **deliberate, malicious** act by someone with authorised access. It is among the most damaging threat categories because the attacker begins inside every perimeter defence.

### Types of Malicious Insiders

**1. Malicious insider** — deliberately causes harm
**2. Compromised insider** — a legitimate account taken over by an outsider
**3. Third-party insider** — contractors, vendors, partners with granted access

The **compromised** category is important: technically the attacker is external, but every detection challenge is identical to a genuine insider.

### Motivations

| Motivation      | Typical trigger                       |
| --------------- | ------------------------------------- |
| **Financial**   | Debt, bribery, selling data           |
| **Revenge**     | Dismissal, passed-over promotion      |
| **Ideology**    | Political or ethical conviction       |
| **Espionage**   | Recruited by a competitor or state    |
| **Ego**         | Demonstrating capability              |

### Why Insider Attacks Are So Damaging

```text
An outsider must:            An insider ALREADY has:
   find a way in                legitimate credentials
   discover what is valuable    knowledge of what matters
   escalate privilege           the necessary access
   avoid detection              knowledge of the monitoring
```

The insider skips the entire early attack chain — and knows precisely which controls exist and how to work within them.

### Common Insider Attack Actions

* Mass data exfiltration before resignation
* **Logic bombs** planted for later execution
* Sabotage of systems or backups
* Creating hidden backdoor accounts
* Selling credentials or access
* Deliberately introducing vulnerabilities

### The Departure Risk Window

```text
Notice given / dismissal decided
        |
   HIGHEST RISK PERIOD
        |
Last working day
        |
Access revoked  <- frequently DELAYED, sometimes for weeks
```

Data theft peaks in the weeks before departure, and delayed offboarding leaves an obvious opening.

### Detection

**UEBA** for behavioural deviation, DLP for data movement, privileged access monitoring, and correlation with HR events — resignation, disciplinary action or poor appraisal are legitimate risk signals.

### Prevention

| Control                 | Effect                                    |
| ----------------------- | ----------------------------------------- |
| **Least privilege**     | Limits reachable damage                   |
| **Separation of duties**| No single person controls a whole process |
| **Immediate offboarding** | Closes the departure window             |
| **Background checks**   | Screens for prior indicators              |
| **Comprehensive logging** | Enables detection and deterrence        |
| **Fair treatment**      | Removes the most common motivation        |

> The single most cost-effective control is procedural: revoking access **at the moment** employment ends, rather than whenever IT processes the ticket.

### Example

A database administrator, informed of redundancy, spends their notice period copying the customer database and creating a hidden administrative account. Both actions use legitimate privileges. Only access logging and prompt offboarding would have caught or prevented it.
$md$, 20, false),

  (sid, 2, 'Explain Unauthorized Privilege Escalation.', $md$
**Unauthorised privilege escalation** is gaining access rights beyond those legitimately granted. It is the pivotal step converting a limited foothold into full system control.

### The Two Types

**Vertical escalation** — gaining **higher** privileges

```text
ordinary user  ->  administrator / root
```

**Horizontal escalation** — accessing **another user's** resources at the same level

```text
User A  ->  User B's account and data
```

### Techniques

| Technique                     | Mechanism                                |
| ----------------------------- | ---------------------------------------- |
| **Kernel exploits**           | Vulnerabilities in the OS core           |
| **Buffer overflow**           | Overwriting memory to execute code       |
| **SUID/setuid abuse**         | Exploiting programs that run as root     |
| **Misconfigured permissions** | World-writable system files              |
| **Weak service accounts**     | Services running with excessive rights   |
| **DLL hijacking**             | Substituting a malicious library         |
| **Credential harvesting**     | Extracting stored passwords or tokens    |
| **Token impersonation**       | Stealing an access token (Windows)       |
| **Race conditions (TOCTOU)**  | Exploiting the check-to-use gap          |
| **Sudo misconfiguration**     | Overly permissive sudoers rules          |

### Horizontal Escalation in Web Applications

The most common real-world form, and often trivially simple:

```text
GET /account?id=1001     <- your own account
GET /account?id=1002     <- someone else's

If the application checks AUTHENTICATION but not
AUTHORISATION, this succeeds.
```

This is **IDOR — Insecure Direct Object Reference** — and it remains among the most frequently found web vulnerabilities because developers verify *who you are* without verifying *what you may access*.

### Position in the Attack Chain

```text
Initial access (low privilege)
        |
   PRIVILEGE ESCALATION   <- converts a foothold into a breach
        |
Persistence -> lateral movement -> data theft
```

### Detection Indicators

Unexpected `sudo`/`su` use, new administrative accounts, group membership changes, unusual process parent-child relationships (a web server spawning a shell), execution of known exploit tools, and access to files outside the user's pattern.

### Prevention

* **Least privilege** — the foundational control
* **Prompt patching**, particularly of the kernel
* Remove unnecessary **setuid** binaries
* Regular permission audits
* **Authorisation checks on every request**, not just authentication
* Application whitelisting
* MFA on administrative accounts

> The recurring web application error is worth stating explicitly: authentication answers "who are you?", authorisation answers "may you do this?" — and checking only the first is how IDOR vulnerabilities arise.

### Example

A web application returns any invoice whose ID is supplied, having verified only that the user is logged in. Changing the ID in the URL exposes every customer's invoices — a complete confidentiality breach requiring no technical skill whatever.
$md$, 21, false),

  (sid, 2, 'Explain Password Sniffing.', $md$
**Password sniffing** is the capture of credentials as they travel across a network. It is a **passive** attack against confidentiality, and consequently very difficult to detect.

### How It Works

A network interface in **promiscuous mode** captures all traffic on its segment, and the attacker extracts credentials from unencrypted protocols.

```text
Vulnerable protocols (credentials in CLEARTEXT):

   HTTP    — web login forms
   FTP     — file transfer
   Telnet  — remote shell
   POP3 / IMAP — email retrieval
   SMTP    — email sending
   SNMPv1/v2 — community strings
```

### Sniffing in Switched Networks

Switches forward frames only to the destination port, so passive sniffing captures little. Attackers therefore use **active** techniques to redirect traffic:

| Technique         | Method                                          |
| ----------------- | ----------------------------------------------- |
| **ARP spoofing**  | Forged ARP replies redirect traffic to the attacker |
| **MAC flooding**  | Overflow the switch table, forcing broadcast     |
| **DHCP spoofing** | Supply a malicious default gateway               |
| **Rogue access point** | Users connect to the attacker's Wi-Fi       |

### The Public Wi-Fi Risk

Open wireless networks are inherently broadcast — any device in range can capture frames. An **evil twin** access point named plausibly ("Airport_Free_WiFi") captures everything users send through it.

### Related Credential Attacks

* **Keyloggers** — capture at the keyboard, before encryption applies
* **SSL stripping** — downgrading HTTPS to HTTP in transit
* **Man-in-the-middle** — intercepting and relaying an entire session

**SSL stripping** is important: the user believes they are protected, while the attacker silently maintains HTTPS to the server and HTTP to the victim.

### Defences

| Defence                | Effect                                    |
| ---------------------- | ----------------------------------------- |
| **Encrypt everything** | HTTPS, SSH, SFTP, VPN — the primary control|
| **HSTS**               | Prevents SSL stripping                    |
| **MFA**                | A sniffed password alone becomes useless  |
| **Certificate validation** | Detects interception                  |
| **Dynamic ARP inspection** | Blocks ARP spoofing                   |
| **802.1X**             | Network access control                    |
| **VPN on public Wi-Fi**| Encrypts everything end-to-end            |

### Why Detection Is Impractical

A passive sniffer transmits nothing, so there is nothing to observe. Indirect methods exist — promiscuous mode detection, ARP monitoring — but are unreliable.

```text
Correct assumption: traffic IS being observed.
Therefore: make it UNREADABLE rather than trying to detect observers.
```

> MFA is what makes sniffing survivable: even a perfectly captured password fails without the second factor, which is why credential theft alone is no longer sufficient for attackers.

### Example

A user logs into an internal tool over plain HTTP from a café. An attacker on the same network captures the password in cleartext. The same login over HTTPS yields only encrypted bytes — the entire outcome determined by one configuration choice.
$md$, 22, false),

  (sid, 2, 'Explain Website Defacement attacks.', $md$
**Website defacement** is the unauthorised modification of a website's visual appearance or content. It is the digital equivalent of graffiti — highly visible, publicly embarrassing, and often politically motivated.

### Motivations

* **Hacktivism** — political or ideological messaging
* **Notoriety** — demonstrating capability, often signed by the attacker
* **Protest** against the organisation or its government
* **Competitive damage**
* **Distraction** — masking a more serious intrusion occurring simultaneously

That last motivation is the one defenders most often miss: a defacement attracts all attention while data is quietly exfiltrated elsewhere.

### Attack Methods

| Method                     | Mechanism                                  |
| -------------------------- | ------------------------------------------ |
| **SQL injection**          | Modify content stored in the database      |
| **File upload vulnerabilities** | Upload a web shell                    |
| **CMS vulnerabilities**    | Unpatched WordPress, Joomla, Drupal plugins|
| **Weak credentials**       | Guessed or default admin passwords         |
| **Stolen FTP/SSH credentials** | Direct file replacement                |
| **DNS hijacking**          | Redirect visitors without touching the server |
| **Server misconfiguration**| Writable web directories                   |

**Unpatched CMS plugins** are by far the most common real-world cause — automated scanners find vulnerable installations continuously.

### Impact

* **Reputational damage** — highly visible, immediately screenshotted and shared
* **Loss of customer trust** — visitors question whether their data is safe
* **SEO penalties** — search engines may flag or delist the site
* **Malware distribution** — defaced pages often serve malware to visitors
* **Regulatory attention** — evidence of inadequate controls
* **Business disruption**

### Detection

* **File integrity monitoring** — alerts on any change to web files
* **Website monitoring services** checking content continuously
* Web server log analysis
* Automated content comparison against a known-good baseline

### Prevention

* **Patch the CMS and every plugin** promptly
* Strong credentials with **MFA** on administrative interfaces
* **Correct file permissions** — the web server should not be able to write to its own content directories
* **Web Application Firewall**
* Input validation and restricted file upload
* **Secure DNS** with registrar locking
* Separate the admin interface from public access

### Recovery

```text
1. Take the site offline or serve a maintenance page
2. PRESERVE EVIDENCE — logs and the defaced files
3. Identify and CLOSE the entry point
4. Restore from a known-clean backup
5. Search for backdoors and web shells left behind
6. Reset all credentials
7. Monitor closely for reinfection
```

> Step 5 is the one most often skipped and most often fatal: restoring the page without removing the attacker's web shell means the site is defaced again within days.

### Example

An organisation's homepage is replaced with a political message. Investigation reveals an unpatched CMS plugin allowed a web shell upload. Restoring the page without removing the shell would have permitted repeated defacement — the visible damage was the symptom, not the vulnerability.
$md$, 23, false),

  (sid, 2, 'Explain Financial Fraud attacks.', $md$
**Financial fraud attacks** use deception or technical compromise to obtain money or financial advantage. They are the most commercially motivated category of attack and the most professionalised.

### Major Types

**1. Business Email Compromise (BEC)**
Among the costliest categories in absolute terms, despite requiring little technical skill.

```text
Attacker researches the organisation
        |
impersonates the CEO or a known supplier
        |
emails Finance: "urgent confidential payment required"
        |
funds are transferred to the attacker's account
```

BEC succeeds through **authority, urgency and secrecy** — deliberately discouraging the verification that would expose it.

**2. Payment Card Fraud** — card-not-present fraud, skimming, **Magecart** attacks injecting scripts into checkout pages
**3. Account Takeover** — using stolen credentials to drain accounts
**4. Invoice Fraud** — altering bank details on genuine invoices
**5. Wire Transfer Fraud**
**6. Cryptocurrency Fraud** — irreversible transactions make this particularly attractive to criminals
**7. Insurance and Loan Fraud** — falsified claims and applications
**8. Money Laundering** — moving criminal proceeds through legitimate channels

### Why Financial Fraud Succeeds

| Factor                | Detail                                    |
| --------------------- | ----------------------------------------- |
| **Social engineering**| Exploits trust and hierarchy, not systems |
| **Urgency**           | Prevents careful verification             |
| **Authority**         | Staff hesitate to question executives     |
| **Process weakness**  | No independent verification step          |
| **Irreversibility**   | Wire transfers and crypto cannot be recalled |

Note that most of these are **process** weaknesses, not technical ones — which is why technical controls alone do not prevent BEC.

### Detection

* Transaction anomaly detection — amount, destination, timing
* Behavioural analysis of account usage
* Velocity checks on transaction frequency
* Device fingerprinting and geolocation
* Machine learning scoring of transactions

### Prevention

**Process controls — the most effective**
* **Dual authorisation** for payments above a threshold
* **Out-of-band verification** — telephone the requester on a **known** number, never one supplied in the email
* Formal supplier bank-detail change procedures
* Segregation of duties

**Technical controls**
* MFA on financial systems
* Email authentication — SPF, DKIM, DMARC
* Anti-phishing filtering
* Transaction monitoring

**Human controls**
* Training staff that **urgency is itself a warning sign**
* Explicit authority to question any request, including from executives

> The decisive control against BEC is procedural, not technical: a rule that all payment changes are verified by callback to a previously known number defeats the entire attack class.

### Example

A finance officer receives an email appearing to come from the CEO requesting an urgent confidential transfer. Company policy requires callback verification for all such requests. The call to the CEO's known number exposes the fraud in thirty seconds — a control costing nothing that prevented a substantial loss.
$md$, 24, false),

  (sid, 2, 'Explain attacks that exploit Wireless Networks.', $md$
Wireless networks are inherently vulnerable because the transmission medium is **broadcast radio** — anyone within range can receive the signal without any physical connection.

### The Fundamental Difference

```text
WIRED:    an attacker must physically connect
WIRELESS: an attacker needs only to be WITHIN RANGE
          — outside the building, in a car park,
            or with a directional antenna, far further
```

### Attack Types

**1. Eavesdropping (Passive Sniffing)**
Capturing traffic with any wireless adapter. Trivial on open networks; requires breaking encryption otherwise.

**2. Evil Twin / Rogue Access Point**

```text
Legitimate AP:  "Airport_WiFi"
Attacker's AP:  "Airport_Free_WiFi"   <- stronger signal

Devices connect to the attacker, who relays traffic
onward while capturing everything.
```

**3. WEP/WPA Cracking** — WEP is broken and crackable in minutes; WPA2 is vulnerable to offline dictionary attacks against weak passphrases
**4. KRACK** — a 2017 flaw in the WPA2 four-way handshake permitting decryption
**5. Deauthentication Attacks** — forged deauth frames disconnect clients, enabling handshake capture or forcing connection to an evil twin
**6. WPS PIN Attack** — the 8-digit PIN is brute-forceable in hours; WPS should be disabled
**7. Jamming** — radio interference denying service
**8. Wardriving** — systematically locating and mapping wireless networks
**9. Bluetooth Attacks** — bluejacking, bluesnarfing, BlueBorne

### Wireless Security Protocols

| Protocol   | Status                          | Recommendation      |
| ---------- | ------------------------------- | ------------------- |
| **WEP**    | **Completely broken**           | Never use           |
| **WPA**    | Weak (TKIP)                     | Avoid               |
| **WPA2**   | Strong with a good passphrase   | Acceptable          |
| **WPA3**   | Current standard; resists offline attacks | **Preferred** |

WPA3's principal improvement is **SAE (Simultaneous Authentication of Equals)**, which prevents the offline dictionary attacks that make weak WPA2 passphrases dangerous.

### Defences

* **WPA3**, or WPA2 with a long random passphrase
* **802.1X / WPA2-Enterprise** for organisations — per-user credentials rather than a shared key
* **Disable WPS**
* Hide or separate guest networks; **isolate** guests from internal resources
* **VPN** for sensitive traffic over any wireless network
* Wireless IDS to detect rogue access points
* MAC filtering (weak — MAC addresses are trivially spoofed)
* Reduce transmit power to limit signal leakage outside the building

### The Public Wi-Fi Rule

```text
Treat every public network as hostile.
Use a VPN, verify HTTPS, and avoid sensitive
transactions where possible.
```

> Enterprise networks should use **802.1X** rather than a shared passphrase: a shared key must be changed for everyone whenever any single employee leaves.

### Example

An attacker in a hotel lobby operates an access point named "Hotel_Guest_WiFi". Guests connect automatically because the signal is strongest. The attacker relays traffic normally while capturing every unencrypted session — and the users notice nothing at all.
$md$, 25, false),

  (sid, 2, 'Explain Unauthorized Intellectual Property Access.', $md$
**Unauthorised intellectual property access** occurs when someone views, copies or uses proprietary information without permission. It targets the assets that constitute an organisation's competitive advantage.

### Intellectual Property at Risk

* Source code and algorithms
* Product designs, CAD files and schematics
* Research data and formulations
* Business strategies and financial models
* Customer lists and pricing structures
* Manufacturing processes
* Unpublished patent applications

### Who Seeks It

| Actor              | Objective                             |
| ------------------ | ------------------------------------- |
| **Competitors**    | Shortcut years of R&D                 |
| **Nation-states**  | Economic and strategic advantage      |
| **Insiders**       | Personal gain, or value at a new employer |
| **Cybercriminals** | Resale                                |

**Nation-state IP theft** is the most severe: effectively unlimited resources, extreme patience, and no legal recourse for the victim.

### Access Methods

* **Insider copying** — the most common route
* **Network intrusion** and lateral movement to design repositories
* **Supply chain compromise** through partners with legitimate access
* **Social engineering** of engineers and researchers
* **Physical access** — photographing whiteboards, taking documents
* **Cloud misconfiguration** exposing repositories publicly
* **Departing employees** taking work products

### Why It Is Hard to Detect

```text
IP theft is COPYING, not removal.

The original remains in place.
No system is damaged.
No alert is triggered.
Access may be entirely legitimate.

Discovery often occurs only when a competitor
launches a suspiciously similar product.
```

### Impact

Loss of competitive advantage, wasted R&D investment, reduced market share, weakened patent position, and diminished company valuation.

### Protection

**Technical**
* **Classification and labelling** of IP
* Access control on strict need-to-know
* **Encryption** at rest and in transit
* **DLP** monitoring for design files and code
* Repository access logging and review
* **Watermarking** to trace leaks to their source
* Restricted printing, USB and cloud upload

**Legal**
* Patent, copyright and trademark registration
* NDAs with employees, contractors and partners
* Non-compete clauses where enforceable
* Clear IP ownership terms in contracts

**Procedural**
* Background checks for sensitive roles
* **Structured exit procedures** with IP obligation reminders
* Compartmentalisation — no single engineer sees the whole design
* Vendor security assessment

> Compartmentalisation is the most underused control: if no individual can access the complete design, no single insider can steal it.

### Example

A departing engineer copies the complete source repository. No alarm sounds, since repository access is part of their job. The theft surfaces eighteen months later when a competitor releases a product with identical architectural quirks — by which time the trade secret protection is irrecoverable.
$md$, 26, false),

  (sid, 2, 'Explain attacks that exploit User Social Network Profiles.', $md$
Social network profiles contain extensive personal and professional information that attackers use for **reconnaissance, social engineering and account compromise**.

### What Attackers Harvest

| Information               | Attack use                              |
| ------------------------- | --------------------------------------- |
| **Full name, birthday**   | Identity theft, security questions       |
| **Employer and job title**| Targeting for spear phishing             |
| **Colleagues and managers**| Impersonation in BEC attacks            |
| **Email format**          | Deriving corporate address patterns      |
| **Pet and family names**  | **Password and security-answer guessing**|
| **Location and travel**   | Timing attacks; physical targeting       |
| **Interests**             | Crafting convincing lures                |
| **Technologies used**     | Identifying exploitable systems          |

**LinkedIn** is particularly valuable to attackers: it publishes organisational hierarchy, job functions and often the exact technologies a person works with.

### Attack Types

**1. Spear Phishing**
Targeted phishing informed by profile research.

```text
Generic phishing:  "Dear Customer, your account is locked"
                   -> low success rate

Spear phishing:    "Hi Priya, following our conversation at
                    the Bengaluru conference last week, here
                    is the proposal from Ravi in Finance"
                   -> HIGH success rate
```

**2. Business Email Compromise** — using the published hierarchy to impersonate executives credibly
**3. Password and Security Question Attacks** — pet names, schools and birthdays are common answers, and are frequently public
**4. Social Engineering** — building rapport before making a request
**5. Fake Profiles and Catfishing** — long-term relationship building for espionage
**6. Watering Hole Attacks** — compromising sites the target's community frequents
**7. Account Takeover** — credential stuffing and password reset abuse
**8. Physical Targeting** — holiday posts revealing an empty home or an absent executive

### The OSINT Process

```text
1. Identify the target organisation
2. Enumerate employees (LinkedIn)
3. Determine the email format (firstname.lastname@)
4. Identify roles, relationships and reporting lines
5. Gather personal details (Facebook, Instagram, X)
6. Craft a highly convincing, personalised attack
```

This is **passive reconnaissance** — it touches no organisational system, generates no logs, and is therefore entirely undetectable.

### Defences

**For individuals**
* Restrict profile visibility and audit privacy settings
* Limit personal detail — birthdays, family names, locations
* **Never use publicly known answers** for security questions
* Avoid posting travel plans in real time
* Verify connection requests
* Use MFA and unique passwords

**For organisations**
* Social media policy for employees
* Awareness training demonstrating how profiles enable attacks
* Limit disclosure of internal structure
* **Verification procedures** for all sensitive requests
* Monitor for impersonating accounts

> The essential point for students: information that is individually harmless becomes dangerous when **aggregated**. A pet's name, a school and a birthday are each trivial; together they answer most password reset questions.

### Example

An attacker builds a target profile from LinkedIn (role, manager, technologies) and Instagram (a recent holiday). The phishing email references the holiday, appears to come from the manager, and requests an urgent action while the executive is known to be away — a message the recipient has little reason to doubt.
$md$, 27, false);

  RAISE NOTICE 'Information Security — Unit 2: 27 questions inserted.';
END $do$;
