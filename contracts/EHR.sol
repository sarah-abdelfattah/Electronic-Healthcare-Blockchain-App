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
        int256 numberOfRegularVisits;
        int256 numberOfLabVisits;
        int256[] regularVisitsIds;
        int256[] labVisitsIds;
        // mapping(uint256 => RegularVisit) regularVisits;
        // mapping(uint256 => LabVisit) labVisits;
    }

    struct RegularVisit {
        int256 patientID;
        int256 clinicID;
        int256 regularVisitID;
        int256 visitHeartRate;
        int256 visitTemperature;
        string diagnosis;
        VisitTypes visitType;
        Prescription prescription;
    }

    struct LabVisit {
        int256 patientID;
        int256 clinicID;
        int256 labVisitID;
        int256 visitHeartRate;
        int256 visitTemperature;
        string testType;
        string testResult;
    }

    struct Prescription {
        int256 prescriptionId;
        string referral;
        string followUp;
        string lab;
        int256 numberOfMedicines;
        int256[] medicines;
        // mapping(uint256 => Medicine) medicines;
    }

    struct Medicine {
        int256 medicineId;
        int256 prescriptionId;
        string name;
        string dose;
        string period;
    }

    mapping(int256 => Clinic) public clinics;
    mapping(int256 => Patient) public patients;

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
    }

    // mapping(uint => RegularVisit) public regularVisits;
    // mapping(uint => LabVisit) public labVisits;

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
            0,
            new int256[](0),
            new int256[](0)
        );
    }
}
