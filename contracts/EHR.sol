pragma solidity ^0.5.0;

contract EHR {
    enum VisitTypes {
        periodicCheckup,
        caseManagement,
        complain
    }

    int256 public patientsCount = 0;
    int256 public clinicsCount = 0;
    int256 public regularVisitsCount = 0;
    int256 public labVisitsCount = 0;
    int256 public prescriptionsCount = 0;
    int256 public medicinesCount = 0;

    struct Clinic {
        int256 clinicID;
        string location;
        int256 numberOfPatients;
    }

    struct Patient {
        int256 patientID;
        int256 clinicID;
        string name;
        int256 age;
        int256 weight;
        int256 height;
        string gender;
        int256 initialHeartRate;
        int256 initialTemperature;
        int256 numberOfRegularVisits; //TODO
        int256 numberOfLabVisits; //TODO
    }

    struct RegularVisit {
        int256 regularVisitID;
        int256 patientID;
        int256 clinicID;
        int256 visitHeartRate;
        int256 visitTemperature;
        string diagnosis;
        VisitTypes visitType;
    }

    struct LabVisit {
        int256 labVisitID;
        int256 patientID;
        int256 clinicID;
        int256 visitHeartRate;
        int256 visitTemperature;
        string testType;
        string testResult;
    }

    struct Prescription {
        int256 regularVisitID;
        string referral;
        string followUp;
        string lab;
        int256 numberOfMedicines;
        int256 medicineOffset;
    }

    struct Medicine {
        int256 medicineId;
        int256 regularVisitID;
        string name;
        string dose;
        string period;
    }

    mapping(int256 => Clinic) public clinics;
    mapping(int256 => Patient) public patients;
    mapping(int256 => RegularVisit) public regularVisits;
    mapping(int256 => LabVisit) public labVisits;
    mapping(int256 => Prescription) public prescriptions;
    mapping(int256 => Medicine) public medicines;

    constructor() public {
        // Initial clinics
        createClinic("Egypt");
        createClinic("KSA");
        createClinic("Germany");

        // Initial patients
        createPatient(1, "Sarah", 23, 53, 171, "female", 68, 36);
        createPatient(1, "Mohammed", 25, 63, 181, "male", 68, 36);
        createPatient(2, "Ahmed", 25, 63, 181, "male", 68, 36);
        createPatient(2, "Alaa", 25, 63, 181, "female", 68, 36);

        // Initial regular visits (with their medicines)
        createRegularVisit(
            1,
            1,
            11,
            11,
            "flu",
            VisitTypes.periodicCheckup,
            "",
            "yes",
            "",
            2
        );
        createMedicine(1, "m1", "d1", "p1");
        createMedicine(1, "m2", "d2", "p2");

        createRegularVisit(
            1,
            1,
            11,
            11,
            "cough",
            VisitTypes.complain,
            "test",
            "yes",
            "",
            1
        );
        createMedicine(2, "m3", "d3", "p3");

        createRegularVisit(
            2,
            1,
            11,
            11,
            "cough and flu",
            VisitTypes.caseManagement,
            "test",
            "none",
            "none",
            2
        );
        createMedicine(3, "m4", "d4", "p4");
        createMedicine(3, "m5", "d5", "p4");

        // Initial lab visits
        createLabVisit(1, 1, 44, 55, "RBC", "good");
        createLabVisit(2, 1, 44, 55, "WBC", "moderate");
    }

    function createClinic(string memory _location) public {
        clinicsCount++;
        clinics[clinicsCount] = Clinic(clinicsCount, _location, 0);
    }

    function createPatient(
        int256 _clinicID,
        string memory _name,
        int256 _age,
        int256 _weight,
        int256 _height,
        string memory _gender,
        int256 _initialHeartRate,
        int256 _initialTemperature
    ) public {
        patientsCount++;
        patients[patientsCount] = Patient(
            patientsCount,
            _clinicID,
            _name,
            _age,
            _weight,
            _height,
            _gender,
            _initialHeartRate,
            _initialTemperature,
            0,
            0
        );
    }

    function createRegularVisit(
        int256 _patientID,
        int256 _clinicID,
        int256 _visitHeartRate,
        int256 _visitTemperature,
        string memory _diagnosis,
        VisitTypes _visitType,
        string memory _referral,
        string memory _followUp,
        string memory _lab,
        int256 _numberOfMedicines
    ) public {
        regularVisitsCount++;

        regularVisits[regularVisitsCount] = RegularVisit(
            regularVisitsCount,
            _patientID,
            _clinicID,
            _visitHeartRate,
            _visitTemperature,
            _diagnosis,
            _visitType
        );

        createPrescription(
            regularVisitsCount,
            _referral,
            _followUp,
            _lab,
            _numberOfMedicines
        );
    }

    function createLabVisit(
        int256 _patientID,
        int256 _clinicID,
        int256 _visitHeartRate,
        int256 _visitTemperature,
        string memory _testType,
        string memory _testResult
    ) public {
        labVisitsCount++;
        labVisits[labVisitsCount] = LabVisit(
            labVisitsCount,
            _patientID,
            _clinicID,
            _visitHeartRate,
            _visitTemperature,
            _testType,
            _testResult
        );
    }

    function createPrescription(
        int256 _regularVisitID,
        string memory _referral,
        string memory _followUp,
        string memory _lab,
        int256 _numberOfMedicines
    ) public {
        prescriptionsCount++;
        prescriptions[_regularVisitID] = Prescription(
            _regularVisitID,
            _referral,
            _followUp,
            _lab,
            _numberOfMedicines,
            medicinesCount
        );
    }

    function createMedicine(
        int256 _regularVisitID,
        string memory _name,
        string memory _dose,
        string memory _period
    ) public {
        medicinesCount++;
        medicines[medicinesCount] = Medicine(
            medicinesCount,
            _regularVisitID,
            _name,
            _dose,
            _period
        );
    }
}

// Creating a regular visit --> creates a prescription --> creates medicines
