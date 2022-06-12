/* eslint-disable */
/**
 * 1- message
 * 2- encrypt
 * 3- hash
 * 4- digital signature
 * 5- verify
 */

adminAddress = "0x49c6FA3D26FA753329e09a076708877E2922162f"
clinicAddresses =
  ["0x3E2637969F370DDbb0CfA3F729dcE9b416ae2bE6",
    "0x79790e430E6a92F43f22CfB09119886A2B68c210",
    "0x29378a3378FCd1A6D37C350062A8AE65a2C1A203",
    "0x6852Ab0a5E0092caBD86755818E3cE713E14028e",
    "0x35B1FbA4E755af875Cf4b88684691A42E10AC56A",
  ]
currentAddress = ""
vTypes = ['Period Checkup', 'Case Management', 'Complaint']

App = {
  loading: false,
  contracts: {},
  savedHumans: [],
  savedClinics: [],
  savedPatients: [],
  savedRegularVisits: [],
  savedLabVisits: [],
  savedPrescriptions: [],
  savedMedicines: [],
  addedMedicines: [],
  numberOfAddedMedicines: 0,

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    // await App.seedingFunction()
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
    const accounts = await web3.eth.getAccounts();
    App.account = accounts[0];
    currentAddress = accounts[0];
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

    // App.setLoading(true)

    // $('#role').html() //TODO:
    $('#account').html(App.account) // Render Account

    // await App.renderClinics()
    // await App.renderPatients()
    // await App.renderRegularVisits()
    // await App.renderPrescriptions()
    // await App.renderMedicines()
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

  creationHelper: async (encryptedData, fn) => {
    print("HASHING", 1)
    const encryptedHashedMsg = web3.utils.sha3(encryptedData)
    print("Hashed Message: " + encryptedHashedMsg)

    let signature = await App.sign(encryptedHashedMsg, currentAddress)
    print("signature concat with separate hash : " + signature + web3.utils.sha3(currentAddress))

    const newAccount = await web3.eth.accounts.create();
    print("New account details")
    console.log(newAccount)

    await fn(newAccount.address, encryptedHashedMsg, signature, encryptedData, currentAddress)
  },

  sign: async (message, address) => {
    print("CREATING A DIGITAL SIGNATURE", 1)

    // dataToSign, address, callback function
    let res = await web3.eth.sign(message, address, async function (err, result) {
      if (err)
        print("Sorry an error occurred " + err)
      else {
        print("message after signing: " + result)
        return result
      }
    })
    return res
  },

  /******************** CLINICS *********************/
  createClinic: async () => {
    try {
      print("current account: " + currentAddress)

      const location = $('#newClinicLocation').val()
      const encryptedData = encryptWithAES(location, currentAddress)

      print("ENCRYPTION", 1)
      print("Encrypted Data: " + encryptedData)

      const dispatchCreate = async (address, hash, sign, data, acc) => {
        const clinicCount = await App.EHR_Contract.clinicsCount()
        await App.EHR_Contract.createClinic(clinicAddresses[clinicCount], hash, sign, data, { from: acc })
      }

      await App.creationHelper(encryptedData, dispatchCreate)

      print("CLINIC ADDED SUCCESSFULLY", 1)
    } catch (error) {
      print("error: " + error);
      window.alert("Sorry you are not authorized")
    }
  },

  viewAllClinics: async () => {
    let el = document.getElementsByClassName(`clinicBody`)[0]

    const clinicCount = await App.EHR_Contract.clinicsCount()

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    try {
      print("Number of clinics: " + clinicCount)

      for (let i = 1; i <= clinicCount; i++) {
        let clinic = await App.EHR_Contract.getClinic(i);
        let id = clinic[0]
        let location = decryptWithAES(clinic[3], currentAddress)
        if (location) {
          let data = id + ":" + location

          await draw(2, 'clinicBody', data)

          let btn = document.createElement("button");
          btn.id = id
          btn.innerText = "View"
          btn.addEventListener('click', function handleClick(event) {
            console.log("🚀 ~ file: app.js ~ line 208 ~ handleClick ~ event", event.target.id);
            // App.viewClinicsPatient(event.target.id) // TODO
          });
          el.lastChild.appendChild(btn)
        } else {
          throw new Error('Authorization')
        }
      }
    } catch (error) {
      console.log("🚀 ~ file: app.js ~ line 247 ~ viewClinicByID: ~ error", error);
      window.alert("Sorry, you are not Authorized!")
    }
  },

  viewClinicByID: async () => {
    let el = document.getElementsByClassName(`clinicBody`)[0]

    const clinicCount = await App.EHR_Contract.clinicsCount()
    const requiredClinic = parseInt($('#requiredClinicID').val())

    if (clinicCount < requiredClinic) {
      window.alert("Sorry, cannot find a clinic with this id")
      return
    }

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }
    try {
      let clinic = await App.EHR_Contract.getClinic(requiredClinic);
      let id = clinic[0]
      let location = decryptWithAES(clinic[3], currentAddress)
      let data = id + ":" + location
      if (location) {
        await draw(2, 'clinicBody', data)

        let btn = document.createElement("button");
        btn.id = id
        btn.innerText = "View"
        btn.addEventListener('click', function handleClick(event) {
          console.log("🚀 ~ file: app.js ~ line 208 ~ handleClick ~ event", event.target.id);
          // App.viewClinicsPatient(event.target.id) // TODO
        });
        el.lastChild.appendChild(btn)
      } else {
        throw new Error('Authorization')
      }
    } catch (error) {
      console.log("🚀 ~ file: app.js ~ line 247 ~ viewClinicByID: ~ error", error);
      window.alert("Sorry, you are not Authorized!")
    }
  },

  // TODO
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
      btn.id = clinicPatients[i][0].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientsRegularVisit(event.target.id)
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
      btn.id = clinicPatients[i][0].toNumber()
      btn.appendChild(text);
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientsLabVisit(event.target.id)
      });
      labVisits.appendChild(btn);

      $('#clinicPatientsTable').append($newTemplate)
    }
  },

  /******************** PATIENTS *********************/
  createPatient: async () => {
    try {
      print("current account: " + currentAddress)

      const name = $('#newPatientName').val()
      const gender = $('#newPatientGender').val()
      const age = $('#newPatientAge').val()
      const weight = $('#newPatientWeight').val()
      const height = $('#newPatientHeight').val()
      const heartRate = $('#newPatientInitialHeartRate').val()
      const temperature = $('#newPatientInitialTemperature').val()

      let allData = name + ":" + gender + ":" + age + ":" + weight + ":" + height + ":" + heartRate + ":" + temperature
      const encryptedData = encryptWithAES(allData, currentAddress)

      print("ENCRYPTION", 1)
      print("Encrypted Data: " + encryptedData)

      const dispatchCreate = async (address, hash, sign, data, acc) => {
        await App.EHR_Contract.createPatient(address, hash, sign, data, { from: acc })
      }

      await App.creationHelper(encryptedData, dispatchCreate)

      print("PATIENT ADDED SUCCESSFULLY", 1)
    } catch (error) {
      print("error: " + error);
      window.alert("Sorry you are not authorized")
    }
  },

  viewAllPatients: async () => {
    let el = document.getElementsByClassName(`patientBody`)[0]
    const patientCount = await App.EHR_Contract.patientsCount()

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    if (currentAddress == adminAddress) {
      print("Number of patients: " + patientCount)

      for (let i = 1; i <= patientCount; i++) {
        let patient = await App.EHR_Contract.getPatient(i);
        let id = patient[0]
        let data = decryptWithAES(patient[3], currentAddress)
        data = id + ":" + data

        await draw(8, 'patientBody', data)

        // regular visits
        let btn = document.createElement("button");
        btn.id = id
        btn.innerText = "View"
        btn.addEventListener('click', function handleClick(event) {
          App.viewPatientRegularVisits(event.target.id)
        });
        el.lastChild.appendChild(btn)

        //lab visits
        btn = document.createElement("button");
        btn.id = id
        btn.innerText = "View"
        btn.addEventListener('click', function handleClick(event) {
          App.viewPatientLabVisits(event.target.id)
        });
        el.lastChild.appendChild(btn)
      }
    } else {
      window.alert("Sorry, you are not authorized")
    }
  },

  viewMyPatients: async () => {
    let el = document.getElementsByClassName(`patientBody`)[0]
    const patientCount = await App.EHR_Contract.getMyPatientsCount(currentAddress)
    print("Number of patients: " + patientCount)

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    for (let i = 0; i < patientCount; i++) {
      let patient = await App.EHR_Contract.getMyPatients(i, currentAddress);
      let id = patient[0]
      let data = decryptWithAES(patient[3], currentAddress)
      data = id + ":" + data

      await draw(8, 'patientBody', data)

      // regular visits
      let btn = document.createElement("button");
      btn.id = id
      btn.innerText = "View"
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientRegularVisits(event.target.id)
      });
      el.lastChild.appendChild(btn)

      //lab visits
      btn = document.createElement("button");
      btn.id = id
      btn.innerText = "View"
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientLabVisits(event.target.id)
      });
      el.lastChild.appendChild(btn)
    }
  },

  viewPatientByID: async () => {
    let el = document.getElementsByClassName(`patientBody`)[0]

    const patientCount = await App.EHR_Contract.patientsCount()
    const requiredPatient = parseInt($('#requiredPatient').val())

    if (patientCount < requiredPatient) {
      window.alert("Sorry, no patient with this ID in your clinic")
      return
    }

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    try {
      let patient = await App.EHR_Contract.getPatient(requiredPatient);
      if (patient[4] !== currentAddress) {
        window.alert("Sorry, no patient with this ID in your clinic")
        return
      }
      let id = patient[0]
      let data = decryptWithAES(patient[3], currentAddress)
      data = id + ":" + data

      await draw(8, 'patientBody', data)

      // regular visits
      let btn = document.createElement("button");
      btn.id = id
      btn.innerText = "View"
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientRegularVisits(event.target.id)
      });
      el.lastChild.appendChild(btn)

      //lab visits
      btn = document.createElement("button");
      btn.id = id
      btn.innerText = "View"
      btn.addEventListener('click', function handleClick(event) {
        App.viewPatientLabVisits(event.target.id)
      });
      el.lastChild.appendChild(btn)
    } catch (error) {
      console.log("🚀 ~ file: app.js ~ line 247 ~ viewClinicByID: ~ error", error);
      window.alert("Sorry, you are not Authorized!")
    }
  },

  /******************** REGULAR VISITS *********************/
  createRegularVisit: async () => {
    try {
      print("current account: " + currentAddress)

      const patientID = $('#newRegularVisitPatient').val()
      const heartRate = $('#newRegularVisitHeartRate').val()
      const temperature = $('#newRegularVisitTemperature').val()
      const diagnosis = $('#newRegularVisitDiagnosis').val()
      const visitType = vTypes[parseInt(document.querySelector('input[name="newRegularVisitVisitType"]:checked').value)];
      const referral = $('#newRegularVisitReferral').val()
      const followUp = $('#newRegularVisitFollowUp').val()
      const labTest = $('#newRegularVisitLabTest').val()

      const medicines = await getMedicines()

      let allData = heartRate + ":" + temperature + ":" + diagnosis + ":" + visitType + ":" + referral + ":" + followUp + ":" + labTest + ":" + medicines
      const encryptedData = encryptWithAES(allData, currentAddress)

      print("ENCRYPTION", 1)
      print("Encrypted Data: " + encryptedData)

      const dispatchCreate = async (address, hash, sign, data, acc) => {
        await App.EHR_Contract.createRegularVisit(patientID, hash, sign, data, { from: acc })
      }

      await App.creationHelper(encryptedData, dispatchCreate)

      print("REGULAR VISIT ADDED SUCCESSFULLY", 1)
    } catch (error) {
      print("error: " + error);
      window.alert("Sorry you are not authorized")
    }
  },

  viewPatientRegularVisits: async (incomingID) => {
    let el = document.getElementsByClassName(`regularVisitBody`)[0]
    let requiredPatient = parseInt($('#requiredPatientRegularVisit').val())
    if (!requiredPatient) requiredPatient = incomingID
    const regularVisitsCount = await App.EHR_Contract.getPatientRegularVisitsCount(requiredPatient, currentAddress)
    print("Number of Regular Visits: " + regularVisitsCount)

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    for (let i = 0; i < regularVisitsCount; i++) {
      let patient = await App.EHR_Contract.getPatientRegularVisits(requiredPatient, i, currentAddress);
      let id = patient[0]
      let patientID = patient[1]
      let data = decryptWithAES(patient[4], currentAddress)
      data = id + ":" + patientID + ":" + data

      await draw(9, 'regularVisitBody', data)

      let btn = document.createElement("button");
      btn.id = id
      btn.innerText = "Show"
      btn.addEventListener('click', function handleClick(event) {
        let container = document.getElementById(`medicinesClicked`)

        let medicines = data.split(":")
        medicines = medicines[medicines.length - 1]

        let p = document.createElement("p");
        p.innerText = medicines
        container.appendChild(p)
      });
      el.lastChild.appendChild(btn)
    }
  },

  viewMyRegularVisits: async () => {
    let el = document.getElementsByClassName(`regularVisitBody`)[0]
    const regularVisitsCount = await App.EHR_Contract.getClinicRegularVisitsCount(currentAddress)
    print("Number of Regular Visits: " + regularVisitsCount)

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    for (let i = 0; i < regularVisitsCount; i++) {
      let patient = await App.EHR_Contract.getClinicRegularVisits(i, currentAddress);
      let id = patient[0]
      let patientID = patient[1]
      let data = decryptWithAES(patient[4], currentAddress)
      data = id + ":" + patientID + ":" + data

      await draw(9, 'regularVisitBody', data)

      let btn = document.createElement("button");
      btn.id = id
      btn.innerText = "Show"
      btn.addEventListener('click', function handleClick(event) {
        let container = document.getElementById(`medicinesClicked`)

        let medicines = data.split(":")
        medicines = medicines[9]
        console.log("🚀 ~ file: app.js ~ line 567 ~ handleClick ~ medicines", medicines);
        medicines = medicines.substring(14)
        let p = document.createElement("p");
        p.innerText = !medicines ? "none" : `THE MEDICINES: ${medicines}`
        container.appendChild(p)
      });
      el.lastChild.appendChild(btn)
    }
  },

  handleAddMedicine: async () => {
    let el = document.getElementById(`medicinesAdded`)
    let name = $('#medicineName').val()
    let dose = $('#medicineDose').val()
    let period = $('#medicinePeriod').val()

    let p = document.createElement("p");
    p.innerText = "Name--> " + name + ", Dose--> " + dose + ", Period--> " + period
    el.appendChild(p)
  },

  /******************** LAB VISITS *********************/
  createLabVisit: async () => {
    try {
      print("current account: " + currentAddress)

      const patientID = $('#newLabVisitPatient').val()
      const heartRate = $('#newLabVisitHeartRate').val()
      const temperature = $('#newLabVisitTemperature').val()
      const testType = $('#newLabVisitTestType').val()
      const testResult = $('#newLabVisitTestResult').val()

      let allData = heartRate + ":" + temperature + ":" + testType + ":" + testResult
      const encryptedData = encryptWithAES(allData, currentAddress)

      print("ENCRYPTION", 1)
      print("Encrypted Data: " + encryptedData)

      const dispatchCreate = async (address, hash, sign, data, acc) => {
        await App.EHR_Contract.createLabVisit(patientID, hash, sign, data, { from: acc })
      }

      await App.creationHelper(encryptedData, dispatchCreate)

      print("LAB VISIT ADDED SUCCESSFULLY", 1)
    } catch (error) {
      print("error: " + error);
      window.alert("Sorry you are not authorized")
    }
  },

  viewPatientLabVisits: async (incomingID) => {
    let el = document.getElementsByClassName(`labVisitBody`)[0]
    let requiredPatient = parseInt($('#requiredPatientLabVisit').val())
    if (!requiredPatient) requiredPatient = incomingID
    const labVisitsCount = await App.EHR_Contract.getPatientLabVisitsCount(requiredPatient, currentAddress)
    print("Number of Lab Visits: " + labVisitsCount)

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    for (let i = 0; i < labVisitsCount; i++) {
      let patient = await App.EHR_Contract.getPatientLabVisits(requiredPatient, i, currentAddress);
      let id = patient[0]
      let patientID = patient[1]
      let data = decryptWithAES(patient[4], currentAddress)
      data = id + ":" + patientID + ":" + data

      await draw(6, 'labVisitBody', data)
    }
  },

  viewMyLabVisits: async () => {
    let el = document.getElementsByClassName(`labVisitBody`)[0]
    const labVisitsCount = await App.EHR_Contract.getClinicLabVisitsCount(currentAddress)
    print("Number of Lab Visits: " + labVisitsCount)

    while (el.hasChildNodes()) {
      el.removeChild(el.lastChild);
    }

    for (let i = 0; i < labVisitsCount; i++) {
      let patient = await App.EHR_Contract.getClinicLabVisits(i, currentAddress);
      let id = patient[0]
      let patientID = patient[1]
      let data = decryptWithAES(patient[4], currentAddress)
      data = id + ":" + patientID + ":" + data

      await draw(6, 'labVisitBody', data)
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
    App.savedMedicines = []
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

  createMedicine: async () => {
    const name = $('#newMedicineNameInput').val()
    const dose = $('#newMedicineDoseInput').val()
    const period = $('#newMedicinePeriodInput').val()
    const visitID = App.savedRegularVisits[App.savedRegularVisits.length - 1][0].toNumber()

    App.addedMedicines.push({ name, dose, period })
    const result = await App.EHR_Contract.createMedicine(visitID, name, dose, period, { from: App.account })
    App.numberOfAddedMedicines++

    const $newMedicineTemplate = $('.newMedicineTemplate')

    let $newTemplate = $newMedicineTemplate.clone()
    $newTemplate.find('.newMedicineName').html(name)
    $newTemplate.find('.newMedicineDose').html(dose)
    $newTemplate.find('.newMedicinePeriod').html(period)
    $('#newMedicinesTable').append($newTemplate)

    await renderMedicines()
  },

  /******************** SEEDING *********************/
  seedingFunction: async () => {
    // CLINICS
    let locations = ['Egypt', 'KSA', 'Germany']

    for (let i = 0; i < locations.length; i++) {
      const encryptedData = encryptWithAES(location[i], adminAddress)

      const dispatchCreate = async (address, hash, sign, data, acc) => {
        await App.EHR_Contract.createClinic(address, hash, sign, data, { from: acc })
      }

      await App.creationHelper(encryptedData, dispatchCreate)
    }
  }
}

const print = (text = "", type = 0) => {
  if (type === 1) console.log("***************** " + text + " *****************")
  else console.log("🚀 ~ ", text);
};

const draw = async (items, className, data) => {
  let bodyItem = document.createElement("div");
  bodyItem.classList.add("bodyItem");

  data = data.split(":")

  for (let i = 0; i < items; i++) {
    let p = document.createElement("p");
    p.innerText = data[i]
    bodyItem.appendChild(p)
  }
  let el = document.getElementsByClassName(`${className}`)[0]


  el.append(bodyItem)
};

const getMedicines = async () => {
  let res = ""
  const el = document.getElementById(`medicinesAdded`)
  const children = el.childNodes
  children.forEach(p => {
    res = res + " + " + p.innerText;
  });

  return res
}

const encryptWithAES = (text, key) => {
  return CryptoJS.AES.encrypt(text, key).toString();
}

const decryptWithAES = (ciphertext, key) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}

$(() => {
  $(window).load(async () => {
    await App.load()
  })
})
