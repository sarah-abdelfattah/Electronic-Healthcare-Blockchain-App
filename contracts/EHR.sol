pragma solidity ^0.5.0;

// Creating a regular visit --> creates a prescription --> creates medicines

// Only 1 admin

/******************* ROLES OF ADMINS ********************/
// Admin can add clinics

/******************* ROLES OF CLINICS ********************/
// Clinics can add patients

contract EHR {
    address systemAdmin;

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
        address clinicAddress;
        string location;
        int256 numberOfPatients;
    }

    struct Patient {
        int256 patientID;
        address patientAddress;
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
        systemAdmin = msg.sender;
    }

    function createClinic(address _clinicAddress, string memory _location)
        public
    {
        require(msg.sender == systemAdmin, "Sorry, you are not authorized");

        clinicsCount++;
        clinics[clinicsCount] = Clinic(
            clinicsCount,
            _clinicAddress,
            _location,
            0
        );
    }

    function createPatient(
        address _patientAddress,
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
            _patientAddress,
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
        // VisitTypes temp = VisitTypes.periodicCheckup;
        // if (_visitType == 0) {
        //     temp = VisitTypes.periodicCheckup;
        // } else if (_visitType == 1) {
        //     temp = VisitTypes.caseManagement;
        // } else {
        //     temp = VisitTypes.complain;
        // }

        patients[_patientID].numberOfRegularVisits =
            patients[_patientID].numberOfRegularVisits +
            1;

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
        patients[_patientID].numberOfLabVisits =
            patients[_patientID].numberOfLabVisits +
            1;

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
