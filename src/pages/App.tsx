import React, { useEffect, useState } from 'react';
import './App.css';
import OtrApp, { createOtrApp } from '../otr-messaging';

export const App = () => {
  const [state, setState] = useState<'login-needed' | 'loading' | 'finished'>('loading');
  const [otrApp, setOtrApp] = useState<OtrApp | undefined>(undefined);

  // effect for creating all instance of the communication service
  useEffect(() => {
    // do not execute when otrApp is already in place
    if (otrApp) {
      return;
    }
    // initialise app
    createOtrApp({ api: { baseUrl: 'http://localhost:8080/api/v1' } })
    .then(app => {
      app.listen((events => {
        // TODO here bind it to redux dispatch
        console.log('new events', events);
      }));
      // now the app is ready, set it to state
      setOtrApp(app);
      // and send that we finished the initialisation
      setState('finished');
    })
    // when this fails, user is not logged in
    .catch(() => {
      setState('login-needed');
    });
    // eslint-disable-next-line
  }, []);
  // print self to console
  otrApp?.getSelf().then(self => console.log('self', self));
  return (
    <div className="App">
      <header className="App-header">
        <p>State? {state}</p>
      </header>
    </div>
  );
};

export default App;
