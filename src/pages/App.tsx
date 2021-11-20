/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';
import './App.css';
import { providePermanentEngine } from '../storage';
import Cryptography from '../cryptography';
import CommunicationService from '../service/communication-service';
import Api from '../api';

function App() {
  const userId = 'alice';
  const clientId = 'alices-client';
  const [service, setService] = useState<CommunicationService | undefined>(undefined);

  // effect for creating all instance of the communication service
  useEffect(() => {
    providePermanentEngine(userId)
    .then(engine => {
      const crypto = Cryptography.createWithEngine(engine);
      const service = new CommunicationService(new Api(), crypto, clientId);
      // initialize service
      crypto.initialize()
      .then((keys) => {
        setService(service);
      });
    });
  }, [userId]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
