App = {
  loading: false,
  contracts: {},
  savedClinics: [],
  savedPatients: [],
  savedRegularVisits: [],
  savedLabVisits: [],
  savedPrescriptions: [],
  savedMedicines: [],

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  /******************** SETUP *********************/
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider)
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */ })
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */ })
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    var accounts = await web3.eth.getAccounts();
    App.account = accounts[0];
  },

  loadContract: async () => {
    const EHR_Contract = await $.getJSON('EHR.json')
    App.contracts.EHR = TruffleContract(EHR_Contract) //this is a wrapper
    App.contracts.EHR.setProvider(App.web3Provider)
    App.EHR_Contract = await App.contracts.EHR.deployed() //gets our actual values from the blockchain
  },

  render: async () => {
    if (App.loading) {
      // to prevent double render
      return
    }

    App.setLoading(true)

    $('#account').html(App.account) // Render Account

    // await App.renderClinics()
    // await App.renderPatients()
    await App.renderRegularVisits()
    await App.renderPrescriptions()
    await App.renderMedicines()
    // await App.renderLabVisits()

    App.setLoading(false)  // Update loading state
  },

  /******************** HELPERS *********************/
  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  },

  /******************** CLINICS *********************/
  renderClinics: async () => {
    // 1- load total count of clinics from the blockchain
    const clinicCount = await App.EHR_Contract.clinicsCount()
    const $clinicTemplate = $('.clinicTemplate')

    // 2- render each task one by one (creating our own template)
    for (let i = 1; i <= clinicCount; i++) {
      let clinic = await App.EHR_Contract.clinics(i);
      let id = clinic[0].toNumber()
      let location = clinic[1]
      let numberOfPatients = clinic[2].toNumber()

      // 3- Show the task on the screen --> Putting it in a html
      let $newTemplate = $clinicTemplate.clone()
      $newTemplate.find('.clinicID').html(id)
      $newTemplate.find('.clinicLocation').html(location)
      $newTemplate.find('.clinicNumberOfPatients').html(numberOfPatients)
      let viewPatientsBtn = $newTemplate.find('.clinicViewButton')[0]
      viewPatientsBtn.innerText = "View"
      viewPatientsBtn.id = id
      viewPatientsBtn.removeAttribute("hidden");
      viewPatientsBtn.addEventListener('click', function handleClick(event) {
        App.viewClinicsPatient(event.target.id)
      });

      //4- putting it our table
      $('#clinicTable').append($newTemplate)

      App.savedClinics.push(clinic)
    }
  },

  viewClinicsPatient: async (clinicID) => {
    let clinicPatients = (App.savedPatients).filter((patient) => patient[1].toNumber() == clinicID)
    const $clinicPatientsTemplate = $('.clinicPatientsTemplate')

    for (let i = 0; i < clinicPatients.length; i++) {
      let $newTemplate = $clinicPatientsTemplate.clone()

      $newTemplate.find('.clinicPatientID').html(clinicPatients[i][0].toNumber())
      $newTemplate.find('.clinicPatientName').html(clinicPatients[i][2])
      $newTemplate.find('.clinicPatientAge').html(clinicPatients[i][3].toNumber())
      $newTemplate.find('.clinicPatientWeight').html(clinicPatients[i][4].toNumber())
      $newTemplate.find('.clinicPatientHeight').html(clinicPatients[i][5].toNumber())
      $newTemplate.find('.clinicPatientGender').html(clinicPatients[i][6])
      $newTemplate.find('.clinicPatientHeartRate').html(clinicPatients[i][7].toNumber())
      $newTemplate.find('.clinicPatientTemperature').html(clinicPatients[i][8].toNumber())
      //regular visits
      let regularVisits = $newTemplate.find('.clinicPatientNumberOfRegularVisits')[0]
      let p = document.createElement("p");
      let count = document.createTextNode(clinicPatients[i][9].toNumber());
      p.appendChild(count);
      regularVisits.appendChild(p);

      let btn = document.createElement("button");
      let text = document.createTextNode("Show");
      btn.id = clinicPatients[i][0].toNumber() + "-" + clinicPatients[i][1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientRegularVisits(event.target.id)
      });
      regularVisits.appendChild(btn);

      //regular visits
      let labVisits = $newTemplate.find('.clinicPatientNumberOfLabVisits')[0]
      p = document.createElement("p");
      count = document.createTextNode(clinicPatients[i][10].toNumber());
      p.appendChild(count);
      labVisits.appendChild(p);

      btn = document.createElement("button");
      text = document.createTextNode("Show");
      btn.id = clinicPatients[i][0].toNumber() + "-" + clinicPatients[i][1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientLabVisits(event.target.id)
      });
      labVisits.appendChild(btn);

      $('#clinicPatientsTable').append($newTemplate)
    }
  },

  createClinic: async () => {
    App.setLoading(true)
    const location = $('#newClinicLocation').val()
    const result = await App.EHR_Contract.createClinic(location, { from: App.account })
    window.location.reload()
  },

  /******************** PATIENTS *********************/
  renderPatients: async () => {
    const patientsCount = await App.EHR_Contract.patientsCount()
    const $patientTemplate = $('.patientTemplate')

    for (let i = 1; i <= patientsCount; i++) {
      let patient = await App.EHR_Contract.patients(i);

      let $newTemplate = $patientTemplate.clone()
      $newTemplate.find('.patientID').html(patient[0].toNumber())
      $newTemplate.find('.patientClinic').html(patient[1].toNumber())
      $newTemplate.find('.patientName').html(patient[2])
      $newTemplate.find('.patientAge').html(patient[3].toNumber())
      $newTemplate.find('.patientWeight').html(patient[4].toNumber())
      $newTemplate.find('.patientHeight').html(patient[5].toNumber())
      $newTemplate.find('.patientGender').html(patient[6])
      $newTemplate.find('.patientHeartRate').html(patient[7].toNumber())
      $newTemplate.find('.patientTemperature').html(patient[8].toNumber())
      //regular visits
      let regularVisits = $newTemplate.find('.patientRegularVisits')[0]
      let p = document.createElement("p");
      let count = document.createTextNode(patient[9].toNumber());
      p.appendChild(count);
      regularVisits.appendChild(p);

      let btn = document.createElement("button");
      let text = document.createTextNode("Show");
      btn.id = patient[0].toNumber() + "-" + patient[1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientRegularVisits(event.target.id)
      });
      regularVisits.appendChild(btn);

      //lab visits
      let labVisits = $newTemplate.find('.patientLabVisits')[0]
      p = document.createElement("p");
      count = document.createTextNode(patient[10].toNumber());
      p.appendChild(count);
      labVisits.appendChild(p);

      btn = document.createElement("button");
      text = document.createTextNode("Show");
      btn.id = patient[0].toNumber() + "-" + patient[1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientLabVisits(event.target.id)
      });
      labVisits.appendChild(btn);

      $('#patientsTable').append($newTemplate)
      App.savedPatients.push(patient)
    }
  },

  viewPatientRegularVisits: async (bothIDs) => {
    //TODO:
    console.log("viewPatientRegularVisits", bothIDs)
  },

  viewPatientLabVisits: async (bothIDs) => {
    //TODO:
    console.log("viewPatientLabVisits", bothIDs)
  },

  createPatient: async () => {
    App.setLoading(true)
    const name = $('#newPatientName').val()
    const clinic = $('#newPatientClinic').val()
    const age = $('#newPatientAge').val()
    const weight = $('#newPatientWeight').val()
    const height = $('#newPatientHeight').val()
    const gender = $('#newPatientGender').val()
    const heartRate = $('#newPatientInitialHeartRate').val()
    const temperature = $('#newPatientInitialTemperature').val()

    const result = await App.EHR_Contract.createPatient(clinic, name, age, weight, height, gender, heartRate, temperature,
      { from: App.account })
    window.location.reload()
  },

  /******************** REGULAR VISITS *********************/
  renderRegularVisits: async () => {
    const regularVisitsCount = await App.EHR_Contract.regularVisitsCount()
    const $regularVisitTemplate = $('.regularVisitTemplate')

    for (let i = 1; i <= regularVisitsCount; i++) {
      let regularVisit = await App.EHR_Contract.regularVisits(i);

      let $newTemplate = $regularVisitTemplate.clone()
      $newTemplate.find('.regularVisitID').html(regularVisit[0].toNumber())
      $newTemplate.find('.regularVisitHeartRate').html(regularVisit[3].toNumber())
      $newTemplate.find('.regularVisitTemperature').html(regularVisit[4].toNumber())
      $newTemplate.find('.regularVisitDiagnosis').html(regularVisit[5])
      let types = ["Periodic Checkup", "Case Management", "Complain"]
      $newTemplate.find('.regularVisitType').html(types[regularVisit[6].toNumber()])

      // patients
      let patient = $newTemplate.find('.regularVisitPatient')[0]
      let p = document.createElement("p");
      let count = document.createTextNode(regularVisit[1].toNumber());
      p.appendChild(count);
      patient.appendChild(p);
      let btn = document.createElement("button");
      let text = document.createTextNode("Show");
      btn.id = regularVisit[1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientsRegularVisit(event.target.id)
      });
      patient.appendChild(btn);

      // clinics
      let clinic = $newTemplate.find('.regularVisitClinic')[0]
      p = document.createElement("p");
      count = document.createTextNode(regularVisit[2].toNumber());
      p.appendChild(count);
      clinic.appendChild(p);
      btn = document.createElement("button");
      text = document.createTextNode("Show");
      btn.id = regularVisit[2].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewClinicsRegularVisit(event.target.id)
      });
      clinic.appendChild(btn);

      // Prescription
      let viewPatientsBtn = $newTemplate.find('.regularVisitPrescription')[0]
      viewPatientsBtn.innerText = "View"
      viewPatientsBtn.id = regularVisit[0].toNumber()
      viewPatientsBtn.removeAttribute("hidden");
      viewPatientsBtn.addEventListener('click', function handleClick(event) {
        App.viewPrescription(event.target.id)
      });

      $('#regularVisitsTable').append($newTemplate)
      App.savedRegularVisits.push(regularVisit)
    }
  },

  viewPatientsRegularVisit: async (patientID) => {
    let patientRegularVisits = (App.savedRegularVisits).filter((regularVisit) => regularVisit[1].toNumber() == patientID)

    const $regularVisitPatientTemplate = $('.regularVisitPatientTemplate')

    for (let i = 0; i < patientRegularVisits.length; i++) {
      let $newTemplate = $regularVisitPatientTemplate.clone()
      $newTemplate.find('.regularVisitPatientID').html(patientRegularVisits[i][0].toNumber())
      $newTemplate.find('.regularVisitPatientClinicID').html(patientRegularVisits[i][2].toNumber())
      $newTemplate.find('.regularVisitPatientHeartRate').html(patientRegularVisits[i][3].toNumber())
      $newTemplate.find('.regularVisitPatientTemperature').html(patientRegularVisits[i][4].toNumber())
      $newTemplate.find('.regularVisitPatientDiagnosis').html(patientRegularVisits[i][5])
      let types = ["Periodic Checkup", "Case Management", "Complain"]
      $newTemplate.find('.regularVisitPatientType').html(types[patientRegularVisits[i][6].toNumber()])

      // Prescription
      let viewPatientsBtn = $newTemplate.find('.regularVisitPatientPrescription')[0]
      viewPatientsBtn.innerText = "View"
      viewPatientsBtn.id = patientRegularVisits[i][0].toNumber()
      viewPatientsBtn.removeAttribute("hidden");
      viewPatientsBtn.addEventListener('click', function handleClick(event) {
        App.viewPrescription(event.target.id)
      });

      $('#RegularVisitsPatientsTable').append($newTemplate)
    }
  },

  viewClinicsRegularVisit: async (clinicID) => {
    let clinicRegularVisits = (App.savedRegularVisits).filter((regularVisit) => regularVisit[2].toNumber() == clinicID)

    const $regularVisitClinicTemplate = $('.regularVisitClinicTemplate')

    for (let i = 0; i < clinicRegularVisits.length; i++) {
      let $newTemplate = $regularVisitClinicTemplate.clone()
      $newTemplate.find('.regularVisitClinicID').html(clinicRegularVisits[i][0].toNumber())
      $newTemplate.find('.regularVisitClinicPatientID').html(clinicRegularVisits[i][1].toNumber())
      $newTemplate.find('.regularVisitClinicHeartRate').html(clinicRegularVisits[i][3].toNumber())
      $newTemplate.find('.regularVisitClinicTemperature').html(clinicRegularVisits[i][4].toNumber())
      $newTemplate.find('.regularVisitClinicDiagnosis').html(clinicRegularVisits[i][5])
      let types = ["Periodic Checkup", "Case Management", "Complain"]
      $newTemplate.find('.regularVisitClinicType').html(types[clinicRegularVisits[i][6].toNumber()])

      // Prescription
      let viewClinicsBtn = $newTemplate.find('.regularVisitClinicPrescription')[0]
      viewClinicsBtn.innerText = "View"
      viewClinicsBtn.id = clinicRegularVisits[i][0].toNumber()
      viewClinicsBtn.removeAttribute("hidden");
      viewClinicsBtn.addEventListener('click', function handleClick(event) {
        App.viewPrescription(event.target.id)
      });

      $('#RegularVisitsClinicsTable').append($newTemplate)
    }
  },

  /******************** PRESCRIPTION *********************/
  renderPrescriptions: async () => {
    const prescriptionCount = await App.EHR_Contract.prescriptionsCount()

    for (let i = 1; i <= prescriptionCount; i++) {
      let prescription = await App.EHR_Contract.prescriptions(i);
      App.savedPrescriptions.push(prescription)
    }
  },

  viewPrescription: async (prescriptionID) => {
    let prescription = (App.savedPrescriptions).find((p) => p[0].toNumber() == prescriptionID)
    const $prescriptionTemplate = $('.prescriptionTemplate')

    let $newTemplate = $prescriptionTemplate.clone()
    $newTemplate.find('.prescriptionID').html(prescription[0].toNumber())
    $newTemplate.find('.prescriptionReferral').html(prescription[1])
    $newTemplate.find('.prescriptionFollowUp').html(prescription[2])
    $newTemplate.find('.prescriptionLab').html(prescription[3])

    // medicines
    let medicines = $newTemplate.find('.prescriptionMedicines')[0]
    let p = document.createElement("p");
    let count = document.createTextNode(prescription[4].toNumber());
    p.appendChild(count);
    medicines.appendChild(p);
    let btn = document.createElement("button");
    let text = document.createTextNode("Show");
    // btn.id = prescription[5].toNumber() + "-" + prescription[4].toNumber() //offset-count
    btn.id = prescription[0].toNumber() //prescriptionId
    btn.appendChild(text);
    btn.addEventListener('click', function handleClick(event) {
      App.viewMedicines(event.target.id)
    });
    medicines.appendChild(btn);

    $('#prescriptionTable').append($newTemplate)
  },

  /******************** MEDICINES *********************/
  renderMedicines: async () => {
    const medicinesCount = await App.EHR_Contract.medicinesCount()

    for (let i = 1; i <= medicinesCount; i++) {
      let medicine = await App.EHR_Contract.medicines(i);
      App.savedMedicines.push(medicine)
    }
  },

  viewMedicines: async (prescriptionID) => {
    let medicines = (App.savedMedicines).filter((medicine) => medicine[1].toNumber() == prescriptionID)
    const $medicineTemplate = $('.medicineTemplate')

    // const offset = parseInt(id.split("-")[0]) + 1
    // const count = id.split("-")[1]

    for (let i = 0; i < medicines.length; i++) {
      let $newTemplate = $medicineTemplate.clone()
      $newTemplate.find('.medicineID').html(medicines[i][0].toNumber())
      $newTemplate.find('.medicinePrescription').html(medicines[i][1].toNumber())
      $newTemplate.find('.medicineName').html(medicines[i][2])
      $newTemplate.find('.medicineDose').html(medicines[i][3])
      $newTemplate.find('.medicinePeriod').html(medicines[i][4])

      $('#medicinesTable').append($newTemplate)
    }

  },

  /******************** LAB VISITS *********************/
  renderLabVisits: async () => {
    const labVisitsCount = await App.EHR_Contract.labVisitsCount()
    const $labVisitTemplate = $('.labVisitTemplate')

    for (let i = 1; i <= labVisitsCount; i++) {
      let labVisit = await App.EHR_Contract.labVisits(i);

      let $newTemplate = $labVisitTemplate.clone()
      $newTemplate.find('.labVisitID').html(labVisit[0].toNumber())
      $newTemplate.find('.labVisitHeartRate').html(labVisit[3].toNumber())
      $newTemplate.find('.labVisitTemperature').html(labVisit[4].toNumber())
      $newTemplate.find('.labVisitTestType').html(labVisit[5])
      $newTemplate.find('.labVisitTestResult').html(labVisit[6])

      // patients
      let patient = $newTemplate.find('.labVisitPatient')[0]
      let p = document.createElement("p");
      let count = document.createTextNode(labVisit[1].toNumber());
      p.appendChild(count);
      patient.appendChild(p);
      let btn = document.createElement("button");
      let text = document.createTextNode("Show");
      btn.id = labVisit[1].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientsLabVisit(event.target.id)
      });
      patient.appendChild(btn);

      // clinics
      let clinic = $newTemplate.find('.labVisitClinic')[0]
      p = document.createElement("p");
      count = document.createTextNode(labVisit[2].toNumber());
      p.appendChild(count);
      clinic.appendChild(p);
      btn = document.createElement("button");
      text = document.createTextNode("Show");
      btn.id = labVisit[2].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewClinicsLabVisit(event.target.id)
      });
      clinic.appendChild(btn);

      $('#LabVisitsTable').append($newTemplate)
      App.savedLabVisits.push(labVisit)
    }
  },

  viewPatientsLabVisit: async (patientID) => {
    let patientLabVisits = (App.savedLabVisits).filter((labVisit) => labVisit[1].toNumber() == patientID)

    const $labVisitPatientTemplate = $('.labVisitPatientTemplate')

    for (let i = 0; i < patientLabVisits.length; i++) {
      let $newTemplate = $labVisitPatientTemplate.clone()
      $newTemplate.find('.labVisitPatientID').html(patientLabVisits[i][0].toNumber())
      $newTemplate.find('.labVisitPatientClinicID').html(patientLabVisits[i][2].toNumber())
      $newTemplate.find('.labVisitPatientHeartRate').html(patientLabVisits[i][3].toNumber())
      $newTemplate.find('.labVisitPatientTemperature').html(patientLabVisits[i][4].toNumber())
      $newTemplate.find('.labVisitPatientTestType').html(patientLabVisits[i][5])
      $newTemplate.find('.labVisitPatientTestResult').html(patientLabVisits[i][6])
      $('#LabVisitsPatientsTable').append($newTemplate)
    }
  },

  viewClinicsLabVisit: async (clinicID) => {
    let clinicLabVisits = (App.savedLabVisits).filter((labVisit) => labVisit[2].toNumber() == clinicID)

    const $labVisitClinicTemplate = $('.labVisitClinicTemplate')

    for (let i = 0; i < clinicLabVisits.length; i++) {
      let $newTemplate = $labVisitClinicTemplate.clone()
      $newTemplate.find('.labVisitClinicID').html(clinicLabVisits[i][0].toNumber())
      $newTemplate.find('.labVisitClinicPatientID').html(clinicLabVisits[i][1].toNumber())
      $newTemplate.find('.labVisitClinicHeartRate').html(clinicLabVisits[i][3].toNumber())
      $newTemplate.find('.labVisitClinicTemperature').html(clinicLabVisits[i][4].toNumber())
      $newTemplate.find('.labVisitClinicTestType').html(clinicLabVisits[i][5])
      $newTemplate.find('.labVisitClinicTestResult').html(clinicLabVisits[i][6])
      $('#LabVisitsClinicsTable').append($newTemplate)
    }
  },

  createLabVisit: async () => {
    App.setLoading(true)
    const patientId = $('#newLabVisitPatient').val()
    const heartRate = $('#newLabVisitHeartRate').val()
    const temperature = $('#newLabVisitTemperature').val()
    const testType = $('#newLabTestType').val()
    const testResult = $('#newLabVisitTestResult').val()

    const patient = (App.savedPatients).find((patient) => patient[0].toNumber() == patientId)
    const clinicId = patient[1].toNumber()

    const result = await App.EHR_Contract.createLabVisit(patientId, clinicId, heartRate, temperature, testType, testResult, { from: App.account })
    window.location.reload()
  },
}

$(() => {
  $(window).load(async () => {
    await App.load()
  })
})