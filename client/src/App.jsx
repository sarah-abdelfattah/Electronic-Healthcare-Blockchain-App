import { useEffect, useState } from 'react';
import Web3 from 'web3';
import contract from "@truffle/contract";

import './App.css'
import Clinics from './Components/Clinics';


function App() {
  const [web3, setWeb3] = useState();
  const [admin, setAdmin] = useState();
  const [account, setAccount] = useState();
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    load()
  }, []);

  const load = async () => {
    await loadAdminAccount()
    await loadContract()
  }

  const loadAdminAccount = async () => {
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
    const accounts = await web3.eth.requestAccounts();
    setWeb3(web3)
    setAdmin(accounts[0]);
  }

  const loadContract = async () => {
    const contract = require('./config/EHR.json')
    const MyContract = TruffleContract(contract);
    MyContract.setProvider(provider);
    const instance = await MyContract.deployed();
    console.log("🚀 ~ file: App.jsx ~ line 36 ~ loadContract ~ instance", instance);


    // new web3.eth.Contract(TODO_LIST_ABI, TODO_LIST_ADDRESS)


    // const EHR_Contract = await $.getJSON('EHR.json')
    // App.contracts.EHR = TruffleContract(EHR_Contract) //this is a wrapper
    // App.contracts.EHR.setProvider(App.web3Provider)
    // App.EHR_Contract = await App.contracts.EHR.deployed() //gets our actual values from the blockchain
    // smartContract = EHR_Contract
  }

  const getCurrentAccount = async () => {
    const accounts = await web3.eth.requestAccounts();
    setAccount(accounts[0])
  }

  const handleButtonClick = async () => {
    await getCurrentAccount()
    setShowAccount(true)
  }

  return (
    <div>
      {/* ACCOUNT */}
      <button onClick={handleButtonClick}>Show Account</button>
      {showAccount ?
        <div className="innerContainer">

          <h2 className="title">Account</h2>
          <p id="account"><b>{`${admin === account ? "System Admin" : ""} Account:`}</b> {account}</p>
        </div> : null}
      <hr />
      <Clinics web3={web3} account={account} />
    </div >
  );
}

export default App;