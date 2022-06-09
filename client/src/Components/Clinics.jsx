import { useEffect, useState } from 'react';

function Clinics({ web3, account }) {
  const [state, setState] = useState(0);
  const [newClinicLocation, setNewClinicLocation] = useState();
  // const [showAccount, setShowAccount] = useState(false);

  const handleAddClinic = () => {
  }

  const handleViewClinics = () => {
    setState(2)
  }

  return (
    <div>
      <h2 className="title">Clinics</h2>
      <button onClick={() => setState(1)}>Add Clinic</button>
      <button onClick={handleViewClinics}>View All Clinics</button>

      {state === 1 ? <div className="innerContainer">
        <div className="section">
          <h4 className="subTitle">Add New Clinic</h4>
          <input placeholder="Clinic location" required value={newClinicLocation} onChange={(event) => setNewClinicLocation(event.target.value)}></input>
          <button onClick={handleAddClinic}>Add</button>
        </div>
      </div> :
        state === 2 ? <div className="innerContainer"></div> : null}


      <hr />
    </div >
  );
}

export default Clinics;