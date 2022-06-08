App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

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

    App.setLoading(false)  // Update loading state
  },

  renderClinics: async () => {
    // 1- load total count of clinics from the blockchain
    const clinicCount = await App.EHR_Contract.clinicsCount()
    const $clinicTemplate = $('.clinicTemplate')

    // 2- render each task one by one (creating our own template)
    for (let i = 1; i <= clinicCount; i++) {
      let clinic = await App.EHR_Contract.clinics(i);
      let id = clinic[0].toNumber()
      let location = clinic[1]

      // 3- Show the task on the screen
      // Putting it in a html
      let $newTemplate = $clinicTemplate.clone()
      $newTemplate.find('.clinicID').html(id)
      $newTemplate.find('.clinicLocation').html(location)

      //putting it our table
      $('#clinicTable').append($newTemplate)
    }

  },

  createClinic: async () => {
    App.setLoading(true)
    const location = $('#newClinicLocation').val()
    const result = await App.EHR_Contract.createClinic(location, { from: App.account })
    window.location.reload()
  },

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
  }
}

$(() => {
  $(window).load(async () => {
    await App.load()
  })
})