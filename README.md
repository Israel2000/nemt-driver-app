
An NEMT provider operates under strict Medicaid, state Department of Health, and broker audits (like Modivcare and MTM). A single missing form can lead to immediate trip claim denials, contract termination, or legal liability.

To build your software or run an NEMT business, organize these forms into the following operational buckets:

---

### Driver Qualification File (DQF) & Onboarding

Every driver must have an active, audited qualification profile on record:

* **Employment & Tax Forms:** Standard W-4 or W-9 / 1099 independent contractor agreement, Form I-9 (Employment Eligibility Verification), direct deposit authorization, and emergency contact details.
* **Driver’s License & MVR:** Copy of valid driver’s license (appropriate class) plus an official **Motor Vehicle Record (MVR)** check (must be pulled annually to verify clean driving history).
* **Screening & Clearance Releases:**
* Background check consent (FCRA disclosure) for county, state, and national criminal records.
* Sex Offender Registry check.
* **OIG / SAM Exclusion Clearance:** Monthly screening consent verifying the driver is not excluded from federal healthcare programs (mandatory for Medicaid reimbursement).
* 5-to-10 panel drug and alcohol screening results (pre-employment + random testing policy consent).


* **Medical Fitness Form:** DOT Medical Examiner’s Certificate (Form MCSA-5876) or a physician's physical exam clearance clearing the driver to lift, bend, and assist riders.
* **Training & Certifications (with Expiration Trackers):**
* First Aid & CPR Certification cards (American Red Cross / AHA).
* **PASS (Passenger Assistance Safety and Sensitivity)** or CTAA certification.
* Defensive Driving completion certificate.
* Wheelchair Securement & Lift Operation sign-off.
* Bloodborne Pathogen (BBP) & Infection Control training certificate.
* HIPAA / Patient Privacy training acknowledgment.



---

### Non-Driver Staff Onboarding (Custodians, Dispatchers, Office Staff)

Staff without direct driving duties still interact with facilities, secure company assets, or touch sensitive systems:

* **Standard HR Forms:** W-4 / W-9, I-9, direct deposit, employee handbook sign-off.
* **Background Check Authorization:** Criminal background check (essential if cleaning after-hours or entering areas where customer files/devices are kept).
* **HIPAA & Confidentiality Agreement:** Legally required because custodians and dispatchers work around physical manifests, computer screens, or paper logs containing Protected Health Information (PHI).
* **OSHA & Safety Compliance (specifically for custodians/cleaners):**
* Hazard Communication / Safety Data Sheet (SDS) acknowledgment.
* Bloodborne Pathogens & Biohazard Cleaning certification (handling bodily fluid spills or sanitizing wheelchair vans).
* Hepatitis B vaccination acceptance or declination form.



---

### Vehicle & Fleet Compliance Forms

Every vehicle in your fleet requires an active documentation file:

* **Vehicle Registration & Title:** Active state commercial registration.
* **Certificate of Insurance (COI):** Commercial auto liability policy showing minimum statutory coverage (often $1M–$1.5M), naming brokers/Medicaid as additional insureds.
* **ADA Accessibility Certification:** Manufacturer certifications showing wheelchair lift/ramp weight ratings (minimum 600–800 lbs) and floor-tie tie-down compliance.
* **Inspection Checklists:**
* **Daily Pre-Trip & Post-Trip Inspection (DVIR):** Driver checklist covering brakes, tires, lights, horn, wheelchair lift operation, tie-down strap wear, fire extinguisher, and first aid/spill kit.
* **Annual State/City Safety Inspection:** Official state certified mechanics inspection.



---

### Operational & Trip Compliance Forms (In-App)

Your driver app and SaaS dispatch system must capture and store proof for every trip:

* **Trip Manifest / Trip Attestation Form:**
* Patient name, Medicaid/Broker ID, and authorization code.
* Exact pickup and drop-off timestamps with GPS coordinates.
* Starting, pickup, and ending odometer readings (loaded vs. unloaded miles).
* Driver digital signature.
* Passenger digital signature (or authorized facility staff signature if the patient cannot sign).


* **Incident / Accident Report Form:** Used immediately when a vehicle accident, patient fall, rider refusal, medical emergency, or damage to medical equipment occurs.

---

### SaaS Architecture Recommendation

| Feature to Build | Why Drivers / Companies Need It |
| --- | --- |
| **Document Vault & Expiry Alerts** | Automated push alerts/emails at 30, 15, and 7 days before a driver's license, CPR card, or vehicle registration expires. |
| **Hard Dispatch Lockout** | Automatically blocks dispatchers from assigning a driver whose CPR, insurance, or background check has expired, preventing illegal dispatches and claim denials. |
| **Digital DQF Upload Flow** | Allows drivers to photo-scan and upload renew documents directly through your `nemt-driver-app`. |

Are you designing the database schema for the driver profile and vehicle compliance tables, or focusing on the in-app forms for the mobile app first?