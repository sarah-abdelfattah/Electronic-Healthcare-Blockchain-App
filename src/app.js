App = {
  loading: false,
  contracts: {},
  savedClinics: [],
  savedPatients: [],

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

    await App.renderClinics()
    await App.renderPatients()

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

      const $general = $('#clinicPatientsTable')
      console.log("🚀 ~ file: app.js ~ line 171 ~ viewClinicsPatient: ~ general", $general);

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

      //regular visits
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
}

$(() => {
  $(window).load(async () => {
    await App.load()
  })
})