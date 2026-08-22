-- =====================================================================
-- Study-With-AI seed — Big Data Analytics (4th Year) — UNIT 1
-- =====================================================================
DO $do$
DECLARE sid uuid;
BEGIN
  SELECT id INTO sid FROM public.subjects
   WHERE name ILIKE 'Big Data Analytics' AND active LIMIT 1;
  IF sid IS NULL THEN RAISE EXCEPTION 'Subject "Big Data Analytics" not found.'; END IF;

  DELETE FROM public.subject_qa WHERE subject_id = sid AND unit_number = 1 AND question IN (
    'Explain Big Data and its major characteristics.',
    'Explain the convergence of key trends that led to the emergence of Big Data.',
    'Explain Unstructured Data and its significance in Big Data.',
    'Explain the role of Big Data in Web Analytics.',
    'Explain how Big Data is used in Marketing.',
    'Explain the use of Big Data for Fraud Detection.',
    'Explain the role of Big Data in Risk Management.',
    'Explain Credit Risk Management using Big Data.',
    'Explain Big Data and Algorithmic Trading.',
    'Explain the applications of Big Data in Healthcare.',
    'Explain the role of Big Data in Medicine.',
    'Explain the use of Big Data in Advertising.',
    'Explain major Big Data Technologies.',
    'Explain Hadoop and its role in Big Data processing.',
    'Explain the importance of Open Source Technologies in Big Data.',
    'Explain Cloud Computing and its relationship with Big Data.',
    'Explain Mobile Business Intelligence.',
    'Explain Crowdsourcing Analytics.',
    'Explain Inter-Firewall and Trans-Firewall Analytics.'
  );

  INSERT INTO public.subject_qa (subject_id, unit_number, question, answer_md, order_index, is_free) VALUES

  (sid, 1, 'Explain Big Data and its major characteristics.', $md$
**Big Data** refers to datasets so large, fast-moving or varied that traditional data-processing tools cannot capture, store, manage or analyse them within a tolerable time.

### The Five V's

**1. Volume — the scale of data**
Data measured in terabytes, petabytes and exabytes. Facebook alone generates several petabytes daily. Volume is what breaks single-machine storage and forces **distributed** systems.

**2. Velocity — the speed of generation and processing**
Data arrives continuously and often must be processed in real time — stock ticks, sensor readings, clickstreams. This distinguishes **batch** processing from **stream** processing.

**3. Variety — the diversity of formats**

| Type              | Description                  | Share of data |
| ----------------- | ---------------------------- | ------------- |
| **Structured**    | Rows and columns, fixed schema | ~20%        |
| **Semi-structured**| JSON, XML, logs             | Growing       |
| **Unstructured**  | Text, images, audio, video   | **~80%**      |

**4. Veracity — the trustworthiness of data**
Data may be incomplete, inconsistent, biased or simply wrong. Poor veracity produces confident but false conclusions — the "garbage in, garbage out" problem at scale.

**5. Value — the usefulness extracted**
The ultimate justification. Data with no extractable value is merely a storage cost.

Some authors add **Variability** (meaning changes with context) and **Visualisation**.

### Why Traditional Systems Fail

```text
Traditional RDBMS:               Big Data systems:
  scale UP (bigger server)         scale OUT (more machines)
  schema-on-write                  schema-on-read
  structured only                  any format
  ACID transactions                eventual consistency
  expensive hardware               commodity hardware
```

### Big Data vs Traditional Data

| Aspect      | Traditional        | Big Data              |
| ----------- | ------------------ | --------------------- |
| Size        | GB – TB            | TB – PB and beyond    |
| Structure   | Structured         | All types             |
| Schema      | Fixed, on write    | Flexible, on read     |
| Processing  | Centralised        | **Distributed**       |
| Hardware    | High-end servers   | Commodity clusters    |

> The definition is deliberately relative: "Big Data" means data too big **for your current tools**, so the threshold moves as technology improves.

### Example

A retailer's daily sales fit comfortably in a database. Adding clickstream data, CCTV footage, social media mentions and IoT shelf sensors produces terabytes daily in mixed formats — the same business question now requires an entirely different technology stack.
$md$, 1, true),

  (sid, 1, 'Explain the convergence of key trends that led to the emergence of Big Data.', $md$
Big Data did not appear from a single invention. It emerged when several independent technological and social trends **converged**, each removing a barrier that had previously made large-scale analytics impractical.

### The Converging Trends

**1. Explosive Data Generation**
The web, social media, smartphones, IoT sensors and e-commerce made data creation continuous and universal. Every click, message and sensor reading became a record.

**2. Collapsing Storage Cost**

```text
1980:  ~$200,000 per gigabyte
2000:  ~$10 per gigabyte
2020:  ~$0.02 per gigabyte
```

Storing everything became cheaper than deciding what to discard — a decisive economic shift.

**3. Increased Computing Power**
Multi-core processors, GPUs and commodity clusters made large-scale computation affordable. **Moore's Law** delivered the processing capacity that volume demanded.

**4. Distributed Computing Frameworks**
Google's **GFS (2003)** and **MapReduce (2004)** papers, and the resulting open-source **Hadoop (2006)**, provided a practical model for processing data across thousands of commodity machines.

**5. Cloud Computing**
AWS, Azure and GCP removed the capital barrier. An organisation could rent a thousand machines for an hour instead of buying them.

**6. Advances in Analytics and Machine Learning**
Algorithms that had existed for decades became practical once sufficient data and compute existed — deep learning in particular required both.

**7. Network Bandwidth Growth**
Broadband and mobile networks made it feasible to move large datasets.

**8. Open Source Movement**
Hadoop, Spark, Kafka and Cassandra were freely available, removing licensing costs and accelerating adoption.

### How They Combined

```text
More data generated  +  cheap storage  =  data is KEPT
        +
Cheap distributed compute  =  data can be PROCESSED
        +
Better algorithms  =  data yields INSIGHT
        +
Cloud  =  accessible to ANY organisation
        ||
        vv
      BIG DATA
```

> No single trend was sufficient. Cheap storage without distributed processing gives only expensive archives; algorithms without data give only theory.

### Example

Netflix's recommendation engine required all of these simultaneously: viewing data at scale, affordable storage, distributed processing, machine learning, and cloud infrastructure. Missing any one, the product would not have been feasible.
$md$, 2, false),

  (sid, 1, 'Explain Unstructured Data and its significance in Big Data.', $md$
**Unstructured data** has no predefined data model or organisation into rows and columns. It accounts for roughly **80–90%** of all data generated, and handling it is the defining challenge of Big Data.

### The Three Categories

| Category            | Description                          | Examples                      |
| ------------------- | ------------------------------------ | ----------------------------- |
| **Structured**      | Fixed schema, rows and columns       | RDBMS tables, spreadsheets    |
| **Semi-structured** | Tags or markers, no rigid schema     | JSON, XML, log files, email   |
| **Unstructured**    | **No predefined model**              | Text, images, audio, video    |

### Sources of Unstructured Data

* Documents, emails and reports
* Social media posts and comments
* Images, video and audio recordings
* Sensor and machine output
* Web pages
* Customer support transcripts and call recordings
* Medical images and clinical notes

### Why It Is Difficult

* **No schema** — cannot be queried with ordinary SQL
* **Requires interpretation** — meaning must be extracted, not read
* **Storage-heavy** — video and images consume enormous space
* **Computationally expensive** to analyse
* **Ambiguity** — human language carries sarcasm, context and idiom
* **Quality varies** — typos, noise, poor recordings

### Techniques for Analysis

| Technique                  | Applied to        |
| -------------------------- | ----------------- |
| **NLP** (Natural Language Processing) | Text     |
| **Sentiment analysis**     | Reviews, social media |
| **Computer vision**        | Images, video     |
| **Speech recognition**     | Audio             |
| **Text mining**            | Documents         |
| **Deep learning**          | All of the above  |

### Significance

Unstructured data is where the **richest business insight** lives. Structured sales figures tell you *what* customers bought; unstructured reviews tell you *why* they bought it, and why they will not buy again.

```text
STRUCTURED:   "Customer 4471 returned item #882"
UNSTRUCTURED: "The fabric tore after one wash and support
               ignored my emails for a week"
```

The second contains the actionable information — and only the first fits in a traditional database.

> The rise of Big Data is largely the rise of tools that can finally do something useful with the 80% of data organisations had been storing and ignoring.

### Example

An airline analyses structured on-time statistics and sees 92% punctuality. Analysing unstructured tweets reveals passengers are furious about baggage handling — a problem invisible in every structured metric being tracked.
$md$, 3, false),

  (sid, 1, 'Explain the role of Big Data in Web Analytics.', $md$
**Web analytics** is the measurement and analysis of website and web application data to understand user behaviour and improve outcomes. Big Data extends it from simple page counting to detailed behavioural modelling.

### What Is Collected

* **Clickstream data** — every page, click and navigation path
* **Session data** — duration, entry and exit pages, bounce rate
* **User attributes** — device, browser, operating system, location
* **Referral sources** — search, social, direct, paid
* **Conversion events** — purchases, signups, downloads
* **Engagement metrics** — scroll depth, time on page, video completion
* **A/B test results**

### Key Metrics

| Metric              | Meaning                                    |
| ------------------- | ------------------------------------------ |
| **Page views**      | Total pages loaded                         |
| **Unique visitors** | Distinct users                             |
| **Bounce rate**     | Left after a single page                   |
| **Conversion rate** | Proportion completing the desired action   |
| **CTR**             | Click-through rate on links or ads         |
| **Session duration**| Time spent per visit                       |

### How Big Data Transforms Web Analytics

**1. Scale** — billions of events daily, far beyond spreadsheet analysis
**2. Real-time analysis** — respond to behaviour during the session, not next week
**3. Clickstream path analysis** — reconstruct the full journey rather than isolated pages

```text
Home -> Search -> Product -> Cart -> ABANDON
                                       ^
                        where and WHY do users leave?
```

**4. Personalisation** — content adapted per user based on behaviour
**5. Predictive analytics** — forecast churn, purchase likelihood, lifetime value
**6. Funnel and cohort analysis** — measure drop-off at each stage
**7. Segmentation** — group users by behaviour rather than demographics alone

### Business Value

* Improve conversion by fixing identified drop-off points
* Optimise site structure and navigation
* Target marketing spend at channels that actually convert
* Detect and fix technical problems affecting specific devices
* Reduce customer acquisition cost

> The shift Big Data brings is from **aggregate reporting** ("10,000 visits last month") to **individual behavioural modelling** ("this user is 70% likely to abandon at checkout").

### Example

Analysis of millions of sessions shows mobile users abandon at the payment page far more often than desktop users. Investigation reveals the card form does not fit small screens — a defect no aggregate conversion figure would have located.
$md$, 4, false),

  (sid, 1, 'Explain how Big Data is used in Marketing.', $md$
Big Data has moved marketing from **broadcast messaging based on intuition** to **targeted, measurable, individualised engagement**.

### Data Sources Used

* Purchase and transaction history
* Website and app behaviour
* Social media activity and sentiment
* Email engagement
* Loyalty programme data
* Location data
* Customer service interactions
* Third-party demographic data

### Principal Applications

**1. Customer Segmentation**
Beyond age and location — segmentation by actual behaviour, value and predicted intent. **RFM analysis** (Recency, Frequency, Monetary value) is the classical technique.

**2. Personalisation and Recommendation**
Product recommendations, personalised email content and dynamic website content. Amazon attributes a large share of revenue to its recommendation engine.

**3. Customer Lifetime Value (CLV) Prediction**
Predicting the total value of a customer relationship allows acquisition spending to be justified per segment.

**4. Churn Prediction**
Identify customers likely to leave **before** they do, and intervene with retention offers.

**5. Campaign Optimisation**
A/B and multivariate testing, real-time bidding, budget allocation to channels by measured return.

**6. Sentiment Analysis**
Monitor brand perception across social media, and detect reputational problems early.

**7. Price Optimisation**
Dynamic pricing based on demand, competitor prices and customer segment.

**8. Market Basket Analysis**
Association rules revealing which products are bought together, driving cross-selling and store layout.

### Measuring Effectiveness

| Metric | Meaning                                  |
| ------ | ---------------------------------------- |
| **CAC**| Customer acquisition cost                |
| **CLV**| Customer lifetime value                  |
| **ROAS**| Return on advertising spend             |
| **Attribution** | Which touchpoints caused the sale |

The healthy relationship is **CLV > 3 × CAC**.

### Ethical Considerations

Personalisation depends on surveillance, and the boundary between helpful and intrusive is genuinely contested. **GDPR** and similar regulations now constrain collection, require consent and grant deletion rights.

> The reputational risk is real: the well-known case of a retailer inferring a customer's pregnancy from purchase patterns and mailing baby coupons before her family knew illustrates how accurate targeting can itself cause harm.

### Example

A telecom operator predicts churn from declining call volume, support complaints and competitor website visits. Targeted retention offers to the highest-risk 5% cut churn by a third at a fraction of the cost of untargeted discounting.
$md$, 5, false),

  (sid, 1, 'Explain the use of Big Data for Fraud Detection.', $md$
**Fraud detection** identifies deceptive activity intended to secure unlawful gain. Big Data enables detection in **real time**, across enormous transaction volumes, using behavioural patterns rather than fixed rules.

### Types of Fraud

* Credit card and payment fraud
* Insurance claim fraud
* Identity theft and account takeover
* Money laundering
* Insider and employee fraud
* Telecom subscription fraud
* Click and advertising fraud

### The Detection Approaches

**1. Rule-Based Detection**

```text
IF transaction > $10,000 AND country != home_country
THEN flag for review
```
Simple and explainable, but rigid — fraudsters learn the thresholds and stay just below them.

**2. Anomaly Detection**
Build a behavioural profile per customer and flag deviations.

```text
Normal: ₹500-2,000, local merchants, daytime
Alert:  ₹80,000, foreign merchant, 3 a.m.
```

**3. Machine Learning Classification**
Supervised models (random forests, gradient boosting, neural networks) trained on labelled fraud data.

**4. Network / Link Analysis**
Graph analysis revealing rings of colluding accounts sharing addresses, devices or phone numbers — fraud that is invisible when accounts are examined individually.

**5. Predictive Modelling** — scoring each transaction for fraud probability

### Why Big Data Is Essential

| Requirement            | Big Data contribution                     |
| ---------------------- | ----------------------------------------- |
| **Real-time decisions**| Stream processing scores in milliseconds  |
| **Volume**             | Millions of transactions per hour         |
| **Historical baselines**| Years of behaviour per customer          |
| **Multiple data sources**| Transactions, device, location, biometrics |
| **Pattern discovery**  | Finds fraud types nobody defined in advance |

### The Central Trade-off

```text
FALSE POSITIVE: legitimate transaction blocked
                -> angry customer, lost sale

FALSE NEGATIVE: fraud allowed
                -> direct financial loss

Aggressive detection -> more false positives
Lenient detection    -> more losses
```

A declined legitimate card at a checkout costs customer goodwill that may exceed the fraud prevented — which is why thresholds are a business decision, not a technical one.

> The most valuable modern technique is **graph analysis**: individual transactions may all look plausible while the *network* connecting them is unmistakably fraudulent.

### Example

A card is used in Delhi at 10 a.m. and Dubai at 10:30 a.m. Each transaction alone appears valid; the **physical impossibility** of the pair triggers a block. This "impossible travel" rule requires correlating events across geography in real time.
$md$, 6, false),

  (sid, 1, 'Explain the role of Big Data in Risk Management.', $md$
**Risk management** is the identification, assessment and mitigation of events that could harm an organisation. Big Data transforms it from periodic, sample-based assessment into **continuous, comprehensive** monitoring.

### Categories of Risk

| Risk type       | Description                                 |
| --------------- | ------------------------------------------- |
| **Credit**      | Borrower fails to repay                     |
| **Market**      | Losses from price movements                 |
| **Operational** | Failures of processes, people or systems    |
| **Liquidity**   | Inability to meet obligations               |
| **Compliance**  | Regulatory breach                           |
| **Reputational**| Damage to public standing                   |
| **Cyber**       | Data breach, system compromise              |

### How Big Data Changes Risk Management

**1. From Sampling to Full Population**
Traditional models analysed samples. Big Data allows analysis of **every** transaction and customer — eliminating sampling error entirely.

**2. Real-Time Risk Monitoring**
Exposure is recalculated continuously rather than at end of day, allowing intervention while positions can still be adjusted.

**3. Broader Data Sources**

```text
Traditional: financial statements, credit bureau scores
Big Data:    + transaction behaviour, social signals,
               news sentiment, satellite imagery,
               supply chain data, web activity
```

**4. Predictive Rather Than Historical**
Traditional risk assessment describes what has happened; predictive models forecast what is likely.

**5. Stress Testing and Scenario Analysis**
Simulate thousands of scenarios across the full portfolio.

**6. Early Warning Systems**
Detect deteriorating conditions before losses materialise.

### Techniques

* **Value at Risk (VaR)** — maximum expected loss at a confidence level
* **Monte Carlo simulation** — thousands of random scenarios
* **Machine learning** classification and regression
* **Network analysis** — systemic and contagion risk
* **NLP** on news, filings and reports

### Benefits and Limitations

**Benefits** — earlier detection, more accurate quantification, better capital allocation, regulatory compliance, and reduced losses.

**Limitations** — models trained on historical data **cannot anticipate unprecedented events**, data quality problems propagate into confident wrong answers, and complex models resist explanation to regulators.

> The 2008 financial crisis is the standing caution: sophisticated models failed because they assumed housing prices could not fall nationally — a scenario absent from their training data.

### Example

A bank monitors borrower transaction accounts continuously. Declining balances, missed direct debits and increasing overdraft use flag deterioration **months** before a missed loan payment — enabling restructuring rather than default.
$md$, 7, false),

  (sid, 1, 'Explain Credit Risk Management using Big Data.', $md$
**Credit risk** is the risk that a borrower fails to meet their obligations. Big Data has changed how creditworthiness is assessed, particularly for applicants with limited traditional credit history.

### The Traditional Approach and Its Limits

```text
Traditional inputs:
  credit bureau score, income, employment history,
  existing debt, collateral

Problem: excludes the "thin file" —
  young applicants, immigrants, the unbanked
  -> creditworthy people denied credit for LACK of data
```

### Alternative Data Sources

| Source                  | Signal it provides                       |
| ----------------------- | ---------------------------------------- |
| **Transaction data**    | Actual income and spending stability     |
| **Utility/rent payments**| Payment discipline without a loan history|
| **Mobile phone data**   | Top-up regularity, tenure                |
| **E-commerce history**  | Spending patterns                        |
| **Psychometric tests**  | Attitude to obligation                   |
| **Social/professional data** | Employment stability (controversial) |

### Modelling Techniques

**1. Credit Scoring Models**
Logistic regression remains standard because it is **explainable** — a regulatory requirement in most jurisdictions. Machine learning models (gradient boosting, random forests) achieve higher accuracy but are harder to justify.

**2. Probability of Default (PD)** — likelihood of default within a period
**3. Loss Given Default (LGD)** — proportion lost if default occurs
**4. Exposure at Default (EAD)** — amount outstanding at default

```text
Expected Loss = PD x LGD x EAD
```

This is the core equation of credit risk, and Big Data improves the estimate of each term.

**5. Behavioural Scoring** — continuous reassessment of existing customers from account behaviour
**6. Early Warning Systems** — detecting deterioration before default

### Benefits

* **Financial inclusion** — lending to those without formal credit history
* More accurate pricing — risk-based interest rates
* Faster decisions — instant approval
* Lower default rates
* Continuous rather than annual reassessment

### Risks and Ethical Concerns

| Concern              | Detail                                        |
| -------------------- | --------------------------------------------- |
| **Algorithmic bias** | Models can encode historical discrimination   |
| **Proxy discrimination** | Postcode may act as a proxy for ethnicity |
| **Explainability**   | Regulations require reasons for refusal       |
| **Privacy**          | Alternative data is invasive                  |
| **Data quality**     | Wrong data produces wrongly denied credit     |

Proxy discrimination is the subtlest danger: a model may never use a protected attribute yet reproduce its effect through correlated variables.

> Explainability is a legal requirement, not a preference — an applicant refused credit is generally entitled to know why, which constrains model choice regardless of accuracy.

### Example

A borrower with no credit history but two years of regular rent payments, stable mobile top-ups and consistent income deposits is scored creditworthy by an alternative-data model. Traditional scoring would have rejected them outright for absence of data rather than evidence of risk.
$md$, 8, false),

  (sid, 1, 'Explain Big Data and Algorithmic Trading.', $md$
**Algorithmic trading** uses computer programs to execute trades according to predefined rules, at speeds and volumes impossible for humans. Big Data supplies both the inputs and the analytical capability.

### Data Sources

* **Market data** — prices, volumes, order book depth, tick data
* **News feeds** — machine-readable financial news
* **Social media sentiment** — Twitter, forums
* **Economic indicators** — inflation, employment, GDP releases
* **Company filings** — earnings reports, regulatory disclosures
* **Alternative data** — satellite imagery of car parks, shipping movements, credit card aggregates, weather

### Strategies

**1. High-Frequency Trading (HFT)**
Thousands of trades per second, holding positions for milliseconds, profiting from tiny spreads. Latency is the decisive competitive factor — firms pay heavily for co-location beside exchange servers.

**2. Statistical Arbitrage** — exploit temporary mispricing between correlated instruments
**3. Trend Following** — identify and ride momentum
**4. Mean Reversion** — bet that prices return to their average
**5. Sentiment-Based Trading** — trade on NLP analysis of news and social media
**6. Market Making** — quote both buy and sell, earning the spread

### Where Big Data Contributes

| Contribution              | Effect                                     |
| ------------------------- | ------------------------------------------ |
| **Volume of history**     | Backtesting over decades of tick data      |
| **Velocity**              | Microsecond decision-making                |
| **Variety**               | Combining price, text, imagery, weather    |
| **Machine learning**      | Detecting non-obvious patterns             |
| **Real-time processing**  | Reacting before competitors                |

### Latency — the Defining Constraint

```text
News published      ->  parsed by NLP  ->  order placed
        (milliseconds matter)

Firms lay dedicated fibre and microwave links between
exchanges to shave MICROSECONDS off transmission time.
```

### Risks

* **Flash crashes** — the 2010 Flash Crash erased nearly $1 trillion in minutes before recovering
* **Overfitting** — a strategy that performs beautifully in backtests and fails live
* **Model risk** — assumptions that hold until they suddenly do not
* **Systemic risk** — many algorithms reacting identically amplify moves
* **Regulatory scrutiny** — circuit breakers and controls now mandated

> Overfitting is the practical hazard for students to understand: with enough parameters, any strategy can be made to fit historical data perfectly and predict nothing.

### Example

An algorithm parses an earnings release in milliseconds, compares reported figures against expectations, checks social sentiment, and places orders before human traders have finished reading the headline — an advantage measured entirely in latency.
$md$, 9, false),

  (sid, 1, 'Explain the applications of Big Data in Healthcare.', $md$
Healthcare generates enormous, varied data, and Big Data analytics is applied across clinical care, operations and research.

### Data Sources

* **Electronic Health Records (EHR)** — history, diagnoses, prescriptions
* **Medical imaging** — X-ray, MRI, CT scans
* **Genomic data** — a single human genome is roughly 200 GB
* **Wearables and remote monitors** — continuous vital signs
* **Clinical trial data**
* **Insurance claims**
* **Public health and epidemiological data**

### Applications

**1. Clinical Decision Support**
Systems that alert clinicians to drug interactions, suggest diagnoses and flag deteriorating patients — reducing preventable error.

**2. Predictive Analytics**

| Prediction                | Benefit                          |
| ------------------------- | -------------------------------- |
| **Hospital readmission**  | Targeted follow-up care          |
| **Sepsis onset**          | Hours of early warning — life-saving |
| **Disease outbreak**      | Public health response           |
| **Patient deterioration** | ICU intervention                 |

**3. Personalised Medicine**
Treatment tailored to genetic profile, particularly in oncology where tumour genomics guide drug selection.

**4. Medical Imaging Analysis**
Deep learning detects tumours, fractures and retinal disease at accuracy comparable to specialists, and works as a **second reader** rather than a replacement.

**5. Operational Efficiency**
Bed and staff scheduling, supply chain, reduced waiting times, optimised theatre utilisation.

**6. Drug Discovery**
Screening millions of compounds computationally, reducing a process that historically took a decade.

**7. Population Health Management**
Identifying at-risk groups and targeting preventive programmes.

**8. Fraud Detection** in insurance claims

### Challenges

| Challenge          | Detail                                      |
| ------------------ | ------------------------------------------- |
| **Privacy**        | HIPAA, GDPR — health data is highly sensitive |
| **Interoperability**| Systems that cannot exchange data          |
| **Data quality**   | Incomplete and inconsistent records         |
| **Clinical validation** | Models must be proven safe             |
| **Liability**      | Who is responsible when an algorithm errs?  |
| **Bias**           | Models trained on unrepresentative populations |

> Algorithmic bias in healthcare is not abstract: a model trained mainly on one demographic can systematically under-diagnose others, and the harm is measured in lives.

### Example

A sepsis prediction model monitors vital signs, labs and medication data continuously, alerting clinicians hours before conventional criteria are met. Since sepsis mortality rises sharply with each hour of delayed treatment, that lead time is directly life-saving.
$md$, 10, false),

  (sid, 1, 'Explain the role of Big Data in Medicine.', $md$
Big Data in medicine focuses on the **science and practice of treating disease** — genomics, drug development, clinical research and personalised therapy — as distinct from healthcare operations.

### Genomics and Precision Medicine

```text
Human genome: ~3 billion base pairs, ~200 GB per person
Sequencing cost:
   2003: ~$2.7 billion (Human Genome Project)
   2023: ~$200
```

That cost collapse is what made population-scale genomics possible.

**Applications**
* **Pharmacogenomics** — predicting drug response from genotype, avoiding ineffective or dangerous prescriptions
* **Cancer genomics** — sequencing tumours to select targeted therapy
* **Rare disease diagnosis** — identifying causal mutations
* **Hereditary risk** — BRCA testing and preventive intervention

### Drug Discovery and Development

```text
Traditional: 10-15 years, ~$2.6 billion per approved drug
             ~90% of candidates fail

Big Data contribution:
  - virtual screening of millions of compounds
  - predicting toxicity before animal testing
  - drug repurposing — finding new uses for approved drugs
  - identifying suitable trial participants
```

**Drug repurposing** is especially valuable because safety is already established, dramatically shortening timelines — a route used extensively during COVID-19.

### Clinical Trials

* Faster patient recruitment by matching EHR data to trial criteria
* **Adaptive trial designs** that adjust as results accumulate
* **Synthetic control arms** from historical data, reducing the number of patients given placebo
* Real-world evidence supplementing controlled trials

### Medical Imaging and Diagnostics

Deep learning applied to radiology, pathology and ophthalmology, with performance approaching specialist level on narrow tasks.

### Epidemiology and Public Health

Disease surveillance, outbreak modelling, contact tracing and vaccine effectiveness monitoring — all demonstrated at scale during COVID-19.

### Challenges

* **Data volume** — genomic datasets reach petabytes
* **Privacy** — genetic data identifies not only the individual but their relatives
* **Interpretation** — most genetic variants have unknown significance
* **Regulatory approval** for algorithm-driven diagnostics
* **Reproducibility** in computational biology

> Genetic data is uniquely sensitive because it is **shared and permanent**: consenting to sequencing also exposes information about family members who never consented, and it cannot be changed once leaked.

### Example

A cancer patient's tumour is sequenced, revealing a specific mutation. Rather than standard chemotherapy, a targeted drug matching that mutation is prescribed — improving response rates and reducing toxicity, an approach impossible without genomic analysis at scale.
$md$, 11, false),

  (sid, 1, 'Explain the use of Big Data in Advertising.', $md$
Big Data has transformed advertising from broadcasting to a mass audience into **targeted, measurable, individually addressed** messaging bought and sold in milliseconds.

### The Fundamental Shift

```text
TRADITIONAL:  buy a TV slot, reach everyone watching
              "Half my advertising is wasted;
               I just don't know which half."

BIG DATA:     buy a specific IMPRESSION for a specific USER
              measure exactly which half worked
```

### Programmatic Advertising and Real-Time Bidding

```text
User loads a web page
        |
Ad exchange broadcasts an impression opportunity
        |
Advertisers' systems evaluate the user profile
        |
Bids submitted, auction settled
        |
Winning ad displayed

ALL WITHIN ~100 MILLISECONDS
```

This is the largest real-time auction system in existence, running billions of times daily.

### Data Used for Targeting

| Data type        | Examples                                  |
| ---------------- | ----------------------------------------- |
| **Demographic**  | Age, gender, income, location             |
| **Behavioural**  | Browsing history, purchases, app usage    |
| **Contextual**   | The content of the current page           |
| **Intent**       | Recent searches                           |
| **Device**       | Mobile, desktop, operating system         |
| **Temporal**     | Time of day, day of week                  |

### Applications

**1. Audience segmentation and lookalike modelling** — find users resembling existing customers
**2. Retargeting** — re-engage users who viewed but did not buy
**3. Dynamic creative optimisation** — assemble the ad content per viewer
**4. Attribution modelling** — determine which touchpoints caused the conversion
**5. Ad fraud detection** — identify bot traffic and fake impressions
**6. Budget optimisation** — shift spend to what performs

### Attribution — a Genuinely Hard Problem

```text
User sees display ad -> searches -> clicks email -> buys

Which touchpoint deserves credit?
  Last-click:   email only        (simple, misleading)
  First-click:  display only
  Linear:       equal split
  Data-driven:  modelled contribution   <-- most accurate
```

### Concerns

* **Privacy** — pervasive tracking across sites
* **Third-party cookie deprecation** reshaping the industry
* **Ad fraud** — billions lost annually to fake traffic
* **Filter bubbles** and manipulation
* **Regulation** — GDPR, CCPA restricting collection

> Ad fraud is the industry's quiet scandal: a substantial share of measured impressions are served to bots, meaning much of the precision targeting is aimed at software.

### Example

A user browses running shoes, leaves, then sees an ad for those exact shoes on a news site minutes later. That ad was bought in a real-time auction based on their browsing history — the entire transaction completed before the page finished rendering.
$md$, 12, false),

  (sid, 1, 'Explain major Big Data Technologies.', $md$
Big Data technologies form a **stack** — each layer solving a different part of storing, processing and analysing data at scale.

### The Technology Stack

```text
+------------------------------------------+
| VISUALISATION  Tableau, Power BI         |
+------------------------------------------+
| ANALYTICS      Spark MLlib, R, Python    |
+------------------------------------------+
| QUERY          Hive, Pig, Impala, Presto |
+------------------------------------------+
| PROCESSING     MapReduce, Spark, Flink   |
+------------------------------------------+
| RESOURCE MGMT  YARN, Mesos, Kubernetes   |
+------------------------------------------+
| STORAGE        HDFS, NoSQL, S3           |
+------------------------------------------+
| INGESTION      Kafka, Flume, Sqoop       |
+------------------------------------------+
```

### Storage Technologies

| Technology     | Type              | Best for                    |
| -------------- | ----------------- | --------------------------- |
| **HDFS**       | Distributed FS    | Large files, batch access   |
| **HBase**      | Column-family NoSQL | Random real-time reads    |
| **Cassandra**  | Wide-column NoSQL | High write throughput       |
| **MongoDB**    | Document NoSQL    | Flexible schema, JSON       |
| **Neo4j**      | Graph database    | Relationship queries        |
| **Amazon S3**  | Object storage    | Cloud data lakes            |

### Processing Frameworks

**MapReduce** — the original batch model; disk-based, reliable, slow
**Apache Spark** — in-memory processing, up to 100× faster than MapReduce; supports batch, streaming, SQL, ML and graph in one engine
**Apache Flink** — true stream processing with low latency
**Apache Storm** — real-time stream processing

### Ingestion and Messaging

* **Apache Kafka** — distributed streaming platform; the de facto standard for event pipelines
* **Apache Flume** — log data collection
* **Apache Sqoop** — transfer between Hadoop and relational databases

### Query and Analysis

* **Hive** — SQL-like queries over Hadoop
* **Pig** — dataflow scripting language
* **Presto / Impala** — interactive low-latency SQL

### Batch vs Stream Processing

```text
BATCH:   collect data -> process periodically
         high throughput, high latency (minutes-hours)
         e.g. nightly reports

STREAM:  process each event as it arrives
         low latency (milliseconds), continuous
         e.g. fraud detection

LAMBDA ARCHITECTURE: run BOTH — batch for accuracy,
                     stream for immediacy
```

> Spark's significance was unifying batch, streaming, SQL and machine learning in a single engine — before it, each required a separate system and separate expertise.

### Example

An e-commerce platform ingests clicks via **Kafka**, stores them in **HDFS**, processes them with **Spark**, serves real-time recommendations from **Cassandra**, and reports through **Tableau** — five technologies, each chosen for one layer of the problem.
$md$, 13, false),

  (sid, 1, 'Explain Hadoop and its role in Big Data processing.', $md$
**Apache Hadoop** is an open-source framework for the distributed storage and processing of very large datasets across clusters of **commodity hardware**. It made Big Data processing economically accessible.

### Core Components

**1. HDFS (Hadoop Distributed File System)** — storage
**2. MapReduce** — processing
**3. YARN (Yet Another Resource Negotiator)** — resource management
**4. Hadoop Common** — shared utilities

### HDFS Architecture

```text
        [ NameNode ]  (master — holds metadata)
         /    |    \
  [DataNode][DataNode][DataNode]   (slaves — hold actual blocks)

File split into blocks (default 128 MB)
Each block REPLICATED 3 times across different nodes
```

**Key design decisions**
* **Write-once, read-many** — optimised for analytics, not transactions
* **Replication** provides fault tolerance without RAID
* **Rack awareness** — replicas placed across racks to survive rack failure
* **Data locality** — computation is sent to the data rather than data to the computation

That last point is the central insight: moving a program of a few kilobytes is far cheaper than moving terabytes across the network.

### MapReduce

```text
INPUT -> SPLIT -> MAP -> SHUFFLE & SORT -> REDUCE -> OUTPUT
```

**Word count example**

```text
MAP:     "the cat sat"  ->  (the,1) (cat,1) (sat,1)
SHUFFLE: group by key   ->  (the,[1,1,1]) (cat,[1,1])
REDUCE:  sum values     ->  (the,3) (cat,2)
```

### Advantages

* **Scalable** — from a few nodes to thousands
* **Cost-effective** — commodity hardware, no licensing
* **Fault tolerant** — replication and automatic task re-execution
* **Flexible** — stores any data format
* **Data locality** minimises network traffic

### Limitations

| Limitation             | Detail                                     |
| ---------------------- | ------------------------------------------ |
| **Not for small files**| NameNode memory holds metadata per file    |
| **High latency**       | Batch-oriented; not for real-time queries  |
| **No random writes**   | Append-only                                |
| **Disk-based**         | Each MapReduce stage writes to disk        |
| **NameNode bottleneck**| Historically a single point of failure     |

### Why Spark Displaced MapReduce

Spark keeps intermediate results **in memory** rather than writing to disk between stages, giving up to 100× speedup for iterative algorithms — precisely the pattern machine learning requires. Hadoop remains widely used for **storage (HDFS)** and resource management (YARN), often with Spark as the processing engine.

> Hadoop's lasting contribution is architectural: it proved that thousands of cheap, unreliable machines could be made collectively reliable through software.

### Example

Analysing 10 TB of logs on one server is infeasible. HDFS splits it across 100 machines, MapReduce processes each block locally in parallel, and results are combined — reducing hours of computation to minutes on hardware costing a fraction of a mainframe.
$md$, 14, false),

  (sid, 1, 'Explain the importance of Open Source Technologies in Big Data.', $md$
Nearly the entire Big Data ecosystem is **open source**, and this is not incidental — it is a principal reason the field grew as rapidly as it did.

### Major Open Source Big Data Projects

| Project        | Purpose                        |
| -------------- | ------------------------------ |
| **Hadoop**     | Distributed storage and processing |
| **Spark**      | Fast in-memory processing      |
| **Kafka**      | Event streaming                |
| **Cassandra**  | Distributed NoSQL database     |
| **Elasticsearch** | Search and analytics        |
| **Flink**      | Stream processing              |
| **Hive**       | SQL on Hadoop                  |
| **TensorFlow / PyTorch** | Machine learning     |
| **Airflow**    | Workflow orchestration         |

Most are governed by the **Apache Software Foundation**, which provides neutral stewardship preventing any single vendor controlling them.

### Why Open Source Mattered So Much

**1. Cost Elimination**
Commercial data warehouse licences ran into millions. Free software removed the entry barrier, letting startups and universities work at scales previously reserved for large corporations.

**2. Rapid Innovation**
Thousands of contributors worldwide improve the code. Hadoop originated from Google's published papers, was implemented openly, and evolved far faster than any single company could have managed.

**3. No Vendor Lock-In**
Organisations are not hostage to one supplier's pricing or roadmap.

**4. Transparency and Trust**
Source code can be audited — important for security and for regulated industries.

**5. Customisation**
Organisations adapt the code to their own needs.

**6. Community Support and Talent**
Large communities produce documentation, tutorials and a wide pool of trained engineers — which in turn makes adoption safer.

**7. Interoperability**
Open standards let components from different projects work together, producing the modular stack the field depends on.

### The Business Model

Open source does not mean unfunded. Companies such as Cloudera, Databricks and Confluent sell **support, managed services and enterprise features** around the free core — commercially sustainable while the software stays open.

### Challenges

* **Support** relies on community or paid vendors
* **Integration complexity** across many independent projects
* **Version compatibility** between components
* **Skill requirements** are high
* **Security patching** is the adopter's responsibility

> The causal chain is worth stating plainly: Google published the ideas, the community implemented them openly, and because the implementation was free, Big Data became something any organisation could attempt.

### Example

A startup builds a complete analytics platform on Kafka, Spark, Cassandra and Superset with **zero licensing cost** — spending on engineers and cloud instances instead. The equivalent proprietary stack would have required upfront licences beyond its funding.
$md$, 15, false),

  (sid, 1, 'Explain Cloud Computing and its relationship with Big Data.', $md$
**Cloud computing** delivers computing resources — servers, storage, databases, networking, analytics — over the internet on a **pay-as-you-go** basis. It is the natural infrastructure for Big Data.

### Essential Characteristics

* **On-demand self-service** — provision resources without human interaction
* **Broad network access** — available over standard networks
* **Resource pooling** — shared infrastructure serving many tenants
* **Rapid elasticity** — scale up and down quickly
* **Measured service** — pay for what is consumed

### Service Models

```text
SaaS  (Software as a Service)     -> Google Analytics, Salesforce
PaaS  (Platform as a Service)     -> Databricks, EMR, BigQuery
IaaS  (Infrastructure as a Service)-> EC2, virtual machines

    control DECREASES  /  convenience INCREASES  going up
```

### Deployment Models

Public, private, hybrid and community clouds — hybrid being common where regulation requires some data to stay on premises.

### Why Cloud and Big Data Fit Together

**1. Elastic Scalability**
Big Data workloads are **bursty** — a monthly analysis may need 500 machines for two hours and none afterwards.

```text
On-premises: buy 500 servers, idle 99% of the time
Cloud:       rent 500 servers for 2 hours, pay for 2 hours
```

**2. Cost Model Shift** — capital expenditure becomes operating expenditure
**3. Managed Services** — EMR, BigQuery, Redshift, Databricks remove cluster administration
**4. Virtually Unlimited Storage** — object stores such as S3 scale without planning
**5. Speed of Experimentation** — a cluster in minutes rather than a procurement cycle
**6. Global Reach** — deploy near users or data sources
**7. Built-in Resilience** — replication across availability zones

### Major Cloud Big Data Services

| Provider  | Storage      | Processing        | Warehouse   |
| --------- | ------------ | ----------------- | ----------- |
| **AWS**   | S3           | EMR, Glue         | Redshift    |
| **Azure** | Blob Storage | HDInsight, Databricks | Synapse |
| **GCP**   | Cloud Storage| Dataproc, Dataflow| BigQuery    |

### Challenges

| Challenge          | Detail                                      |
| ------------------ | ------------------------------------------- |
| **Data transfer cost** | **Egress fees** — moving data out is expensive |
| **Vendor lock-in** | Proprietary services are hard to migrate     |
| **Data sovereignty**| Regulations may require local storage        |
| **Security**       | Shared responsibility model is often misunderstood |
| **Unpredictable cost** | Poorly managed usage produces large bills |

> Egress fees deserve particular attention: storing data in the cloud is cheap, and getting it back out is not — a deliberate commercial design that creates real lock-in.

### Example

A research team spins up 200 GPU instances for a 6-hour training run, then shuts them down. The bill is a few hundred dollars; purchasing equivalent hardware would have cost hundreds of thousands and sat idle afterwards.
$md$, 16, false),

  (sid, 1, 'Explain Mobile Business Intelligence.', $md$
**Mobile Business Intelligence (Mobile BI)** delivers business intelligence — dashboards, reports and analytics — to smartphones and tablets, allowing decisions to be made away from a desk.

### Why It Emerged

* Decision-makers travel and work outside offices
* Smartphones became universal and capable
* Business demands faster decisions
* Field staff need data at the point of work
* Cloud made data accessible from anywhere

### Key Features

* **Dashboards** optimised for small screens
* **Real-time data access**
* **Push notifications and alerts** on threshold breaches
* **Offline access** with later synchronisation
* **Touch-based interaction** — tap, pinch, swipe
* **Location awareness** — data relevant to where the user is
* **Role-based security**

### Design Considerations

```text
DESKTOP BI:                  MOBILE BI:
  large screen                 small screen
  many charts per view         ONE key metric per view
  mouse precision              touch targets
  always connected             intermittent connectivity
  detailed exploration         quick decisions
```

The most common design failure is **shrinking a desktop dashboard** rather than redesigning for the device. Mobile BI must answer a specific question immediately, not present everything.

### Architecture Approaches

| Approach          | Characteristics                          |
| ----------------- | ---------------------------------------- |
| **Native app**    | Best performance and device features; separate builds per platform |
| **Web-based**     | One version for all devices; limited offline capability |
| **Hybrid**        | Web content in a native shell; a middle path |

### Benefits

* Faster decisions — act immediately rather than at the next desk session
* Increased BI adoption — executives actually use it
* Field productivity — sales staff see customer data before the meeting
* Timely alerts on critical changes
* Competitive responsiveness

### Challenges

* **Security** — lost or stolen devices holding sensitive data; mitigated by MDM, remote wipe and encryption
* **Screen size** — genuinely constrains what can be shown
* **Network variability** — must degrade gracefully
* **Battery and data consumption**
* **Device fragmentation** across platforms and versions

### Best Practices

Prioritise ruthlessly, design for touch, cache for offline use, use alerts rather than requiring users to check, and test on real devices under poor connectivity.

> Mobile BI succeeds when it answers **one** question well. Dashboards that try to replicate the desktop experience are typically opened once and abandoned.

### Example

A regional sales manager receives a push alert that a territory has fallen 15% below target. Tapping through shows the affected products and stores, and a call is made from the car — a decision that would otherwise have waited for Monday's report.
$md$, 17, false),

  (sid, 1, 'Explain Crowdsourcing Analytics.', $md$
**Crowdsourcing analytics** obtains data, insight or analytical work from a **large distributed group of people** rather than from employees or a single expert.

### Forms of Crowdsourcing in Analytics

**1. Crowdsourced Data Collection**
The crowd supplies the data itself.

| Platform          | Data contributed                |
| ----------------- | ------------------------------- |
| **Waze**          | Real-time traffic and hazards   |
| **OpenStreetMap** | Geographic mapping              |
| **Wikipedia**     | Encyclopaedic content           |
| **TripAdvisor**   | Reviews and ratings             |

**2. Crowdsourced Data Labelling**
Humans label training data for machine learning — image tagging, sentiment annotation, transcription. Platforms such as **Amazon Mechanical Turk** provide the workforce. This is essential because supervised learning requires labelled data that only humans can produce reliably.

**3. Crowdsourced Problem Solving**
Competitions where many analysts attempt the same problem — **Kaggle** being the best known. The **Netflix Prize** famously offered $1 million for a 10% improvement in recommendation accuracy, and the winning solution came from an ensemble of independent teams.

**4. Crowdsourced Prediction**
Prediction markets and forecasting platforms aggregating many independent estimates.

**5. Citizen Science**
Volunteers classifying galaxies (Galaxy Zoo) or folding proteins (Foldit) — tasks where human pattern recognition still exceeds algorithms.

### Why It Works — the Wisdom of Crowds

Aggregating many independent estimates cancels individual errors, provided three conditions hold:

```text
1. DIVERSITY    — varied perspectives
2. INDEPENDENCE — opinions formed separately
3. AGGREGATION  — a mechanism to combine them

Remove independence -> herding -> the crowd becomes a mob
```

### Advantages and Challenges

**Advantages** — access to scale and diversity, low cost, speed, and human judgement where algorithms fail.

**Challenges**

| Challenge          | Mitigation                              |
| ------------------ | --------------------------------------- |
| **Quality control**| Redundancy, gold-standard tasks, reputation scores |
| **Bias**           | Contributors are not a representative sample |
| **Malicious input**| Validation and outlier detection        |
| **Privacy**        | Sensitive data cannot be crowdsourced   |
| **Ethical concerns**| Low pay on micro-task platforms        |

> The ethical dimension is not incidental: much of the labelled data underpinning modern AI was produced by workers paid very little, and the field is increasingly scrutinised for it.

### Example

Waze aggregates speed and location from millions of drivers to produce live traffic data no sensor network could match in coverage. Each driver contributes passively, and the value emerges entirely from aggregation.
$md$, 18, false),

  (sid, 1, 'Explain Inter-Firewall and Trans-Firewall Analytics.', $md$
These terms describe **where** analytics is performed relative to an organisation's security perimeter — the firewall — and therefore what data can participate.

### Intra-Firewall Analytics

Analytics performed **entirely inside** the organisation's own network on its own data.

* Data never leaves the perimeter
* Maximum security and control
* Limited to internally held data
* The traditional enterprise model

### Inter-Firewall Analytics

Analytics performed **between organisations**, each behind its own firewall, collaborating on a shared analytical goal.

```text
[ Org A firewall ]  <---- controlled exchange ---->  [ Org B firewall ]

Both organisations contribute; neither exposes
its full internal data.
```

**Applications**
* **Banks sharing fraud patterns** without sharing customer records
* **Supply chain partners** coordinating demand forecasts
* **Healthcare consortia** conducting joint research
* **Threat intelligence sharing** between security teams

**Enabling techniques**
* **Federated learning** — models are trained locally and only model updates are shared, never raw data
* **Secure multi-party computation** — jointly compute a result without revealing inputs
* **Differential privacy** — add calibrated noise so individuals cannot be identified
* **Data anonymisation and aggregation**

### Trans-Firewall Analytics

Analytics that **crosses the firewall boundary**, combining internal data with **external** sources.

```text
[ Internal data ]  +  [ External data ]  ->  combined analysis
   sales, CRM          social media,
                       market data,
                       weather, public datasets
```

**Applications** — enriching customer profiles with third-party data, sentiment analysis of public social media alongside internal complaints, competitive intelligence, and macroeconomic risk modelling.

### Comparison

| Type              | Data location         | Risk      | Insight breadth |
| ----------------- | --------------------- | --------- | --------------- |
| **Intra-firewall**| Internal only         | **Lowest**| Narrowest       |
| **Inter-firewall**| Across organisations  | Medium    | Broader         |
| **Trans-firewall**| Internal + external   | **Highest**| **Broadest**   |

### The Central Trade-off

```text
More data sources -> richer insight
                  -> greater exposure and compliance burden
```

### Governance Requirements

Data classification, contractual agreements, encryption in transit and at rest, access controls, audit logging, and regulatory compliance (GDPR, HIPAA) — all become more demanding as analytics crosses boundaries.

> Federated learning is the most significant development here: it allows organisations to gain the benefit of collective data without any of them surrendering it.

### Example

Several banks train a shared fraud model using federated learning. Each bank's transactions never leave its own firewall; only model weight updates are exchanged. The resulting model detects fraud patterns no single bank had enough data to identify alone.
$md$, 19, false);

  RAISE NOTICE 'Big Data Analytics — Unit 1: 19 questions inserted.';
END $do$;
