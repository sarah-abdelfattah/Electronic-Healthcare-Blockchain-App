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

    struct Clinic {
        int256 clinicID;
        string location;
        int256 numberOfPatients;
        // Patient[] patients;
        mapping(uint256 => Patient) patients;
    }

    struct Patient {
        int256 patientID;
        string name;
        int256 age;
        int256 weight;
        int256 height;
        string gender;
        string initialBloodPressure;
        string initialHeartRate;
        string initialTemperature;
        int256 regularVisitCounts;
        int256 labVisitsCount;
        int256 numberOfRegularVisits;
        int256 numberOfLabVisits;
        mapping(uint256 => RegularVisit) regularVisits;
        mapping(uint256 => LabVisit) labVisits;
    }

    struct RegularVisit {
        int256 regularVisitID;
        int256 visitBloodPressure;
        int256 visitHeartRate;
        int256 visitTemperature;
        string diagnosis;
        VisitTypes visitType;
        Prescription prescription;
    }

    struct LabVisit {
        int256 labVisitID;
        int256 visitBloodPressure;
        int256 visitHeartRate;
        int256 visitTemperature;
        string testType;
        string testResult;
    }

    struct Prescription {
        string referral;
        string followUp;
        string lab;
        int256 numberOfMedicines;
        mapping(uint256 => Medicine) medicines;
    }

    struct Medicine {
        string name;
        string dose;
        string period;
    }

    mapping(int256 => Clinic) public clinics;

    constructor() public {
        createClinic("Egypt");
    }

    // mapping(uint => Patient) public patients;
    // mapping(uint => RegularVisit) public regularVisits;
    // mapping(uint => LabVisit) public labVisits;

    function createClinic(string memory _location) public {
        clinicsCount++;
        // Patient[] memory emptyPatients;
        Clinic memory _clinic = Clinic(
            clinicsCount,
            _location,
            0
            // emptyPatients
        );

        clinics[clinicsCount] = _clinic;
    }
}
