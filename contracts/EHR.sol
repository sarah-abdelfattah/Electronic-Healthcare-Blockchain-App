pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

// Creating a regular visit --> creates a prescription --> creates medicines
// Address = public key
// Only 1 admin

/******************* ROLES OF ADMINS ********************/
// Admin can add clinics

/******************* ROLES OF CLINICS ********************/
// Clinics can add patients

contract EHR {
    address systemAdmin;

    int256 public patientsCount = 0;
    int256 public clinicsCount = 0;
    int256 public regularVisitsCount = 0;
    int256 public labVisitsCount = 0;
    int256 public prescriptionsCount = 0;
    int256 public medicinesCount = 0;

    mapping(int256 => Clinic) public clinics;
    mapping(int256 => Patient) public patients;
    mapping(int256 => RegularVisit) public regularVisits;
    mapping(int256 => LabVisit) public labVisits;
    mapping(int256 => Prescription) public prescriptions;
    mapping(int256 => Medicine) public medicines;

    mapping(address => bool) public availableClinics;
    mapping(address => int256) public mapClinicAddressToID;
    mapping(address => Patient[]) clinicPatients; //clinic ID -> patients

    enum VisitTypes {
        periodicCheckup,
        caseManagement,
        complain
    }

    struct Clinic {
        int256 clinicID;
        address clinicAddress;
        bytes32 hashMessage;
        string data;
    }

    struct Patient {
        int256 patientID;
        address patientAddress;
        bytes32 hashMessage;
        string data;
        address addedBy;
    }

    struct RegularVisit {
        int256 regularVisitID;
        int256 patientID;
        int256 clinicID;
        int256 visitHeartRate;
        int256 visitTemperature;
        string diagnosis;
        // VisitTypes visitType;
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

    constructor() public {
        systemAdmin = msg.sender;
    }

    function createClinic(
        address _clinicAddress,
        bytes32 _hash,
        bytes memory _signature,
        string memory _data
    ) public {
        // string memory hashedMessage
        // string memory hashedRes = string(
        //     abi.encodePacked(_signature, systemAdmin)
        // );
        // require(
        //     compareStrings(hashedRes, hashedMessage),
        //     "Sorry, digest message is different"
        // );

        address recoveredAddress = recover(_hash, _signature);
        require(
            recoveredAddress == systemAdmin,
            "Sorry, you are not authorized"
        );

        clinicsCount++;
        clinics[clinicsCount] = Clinic(
            clinicsCount,
            _clinicAddress,
            _hash,
            _data
        );

        availableClinics[_clinicAddress] = true;
        // mapClinicAddressToID[_clinicAddress] = clinicsCount;
        // clinicPatients[_clinicAddress] = [];
    }

    function getClinic(int256 _id) public view returns (Clinic memory) {
        require(msg.sender == systemAdmin, "Sorry, you are no authorized");
        return clinics[_id];
    }

    function createPatient(
        address _patientAddress,
        bytes32 _hash,
        bytes memory _signature,
        string memory _data
    ) public {
        address recoveredAddress = recover(_hash, _signature);
        require(isClinic(recoveredAddress), "Sorry, you are not authorized");

        patientsCount++;
        patients[patientsCount] = Patient(
            patientsCount,
            _patientAddress,
            _hash,
            _data,
            recoveredAddress
        );

        clinicPatients[recoveredAddress].push(patients[patientsCount]);
    }

    function getPatient(int256 _id) public view returns (Patient memory) {
        require(
            isClinic(msg.sender) || msg.sender == systemAdmin,
            "Sorry, you are not authorized"
        );
        return patients[_id];
    }

    function getMyPatientsCount(address _sender) public view returns (uint256) {
        require(isClinic(_sender), "Sorry, you are not authorized");
        return clinicPatients[_sender].length;
    }

    function getMyPatients(uint256 _id, address _sender)
        public
        view
        returns (Patient memory)
    {
        require(isClinic(_sender), "Sorry, you are not authorized");
        return clinicPatients[_sender][_id];
    }

    // function createRegularVisit(
    //     int256 _patientID,
    //     int256 _clinicID,
    //     int256 _visitHeartRate,
    //     int256 _visitTemperature,
    //     string memory _diagnosis,
    //     VisitTypes _visitType,
    //     string memory _referral,
    //     string memory _followUp,
    //     string memory _lab,
    //     int256 _numberOfMedicines
    // ) public {
    //     // VisitTypes temp = VisitTypes.periodicCheckup;
    //     // if (_visitType == 0) {
    //     //     temp = VisitTypes.periodicCheckup;
    //     // } else if (_visitType == 1) {
    //     //     temp = VisitTypes.caseManagement;
    //     // } else {
    //     //     temp = VisitTypes.complain;
    //     // }

    //     patients[_patientID].numberOfRegularVisits =
    //         patients[_patientID].numberOfRegularVisits +
    //         1;

    //     regularVisitsCount++;

    //     regularVisits[regularVisitsCount] = RegularVisit(
    //         regularVisitsCount,
    //         _patientID,
    //         _clinicID,
    //         _visitHeartRate,
    //         _visitTemperature,
    //         _diagnosis,
    //         _visitType
    //     );

    //     createPrescription(
    //         regularVisitsCount,
    //         _referral,
    //         _followUp,
    //         _lab,
    //         _numberOfMedicines
    //     );
    // }

    // function createLabVisit(
    //     int256 _patientID,
    //     int256 _clinicID,
    //     int256 _visitHeartRate,
    //     int256 _visitTemperature,
    //     string memory _testType,
    //     string memory _testResult
    // ) public {
    //     patients[_patientID].numberOfLabVisits =
    //         patients[_patientID].numberOfLabVisits +
    //         1;

    //     labVisitsCount++;
    //     labVisits[labVisitsCount] = LabVisit(
    //         labVisitsCount,
    //         _patientID,
    //         _clinicID,
    //         _visitHeartRate,
    //         _visitTemperature,
    //         _testType,
    //         _testResult
    //     );
    // }

    // function createPrescription(
    //     int256 _regularVisitID,
    //     string memory _referral,
    //     string memory _followUp,
    //     string memory _lab,
    //     int256 _numberOfMedicines
    // ) public {
    //     prescriptionsCount++;
    //     prescriptions[_regularVisitID] = Prescription(
    //         _regularVisitID,
    //         _referral,
    //         _followUp,
    //         _lab,
    //         _numberOfMedicines,
    //         medicinesCount
    //     );
    // }

    // function createMedicine(
    //     int256 _regularVisitID,
    //     string memory _name,
    //     string memory _dose,
    //     string memory _period
    // ) public {
    //     medicinesCount++;
    //     medicines[medicinesCount] = Medicine(
    //         medicinesCount,
    //         _regularVisitID,
    //         _name,
    //         _dose,
    //         _period
    //     );
    // }

    /**************************** HELPER FUNCTIONS *****************************/
    function isClinic(address _a) public view returns (bool) {
        return (availableClinics[_a]);
    }

    // function getClinicID(int256 _id) public view returns (Clinic memory) {
    //     require(msg.sender == systemAdmin, "Sorry, you are no authorized");
    //     return clinics[_id];
    // }

    function compareStrings(string memory a, string memory b)
        public
        pure
        returns (bool)
    {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * Based upon ECDSA library from OpenZeppelin Solidity
     * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/cryptography/ECDSA.sol
     */
    function recover(bytes32 hash, bytes memory signature)
        public
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        if (signature.length != 65) {
            return (address(0));
        }

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v, r, s);
        }
    }
}
