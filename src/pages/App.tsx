import React, { useEffect, useState } from 'react';
import './App.css';
import OtrApp, { createOtrApp } from '../otr-messaging';

export const App = () => {
  const [state, setState] = useState<'login-needed' | 'loading' | 'finished'>('loading');
  const [otrApp, setOtrApp] = useState<OtrApp | undefined>(undefined);
  const [message, setMessage] = useState('Hello world!');
  const [topic, setTopic] = useState('19:cfa5b371-349e-434e-944f-17fa5653375d_f9445383-8e82-46d6-8e7e-f7bbf6c6b6dc@unq.gbl.spaces');

  // effect for creating all instance of the communication service
  useEffect(() => {
    // do not execute when otrApp is already in place
    if (otrApp) {
      return;
    }
    // initialise app
    createOtrApp({ api: { baseUrl: 'http://localhost:8080/api' } })
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
    .catch((e) => {
      console.error('error during initialization', e);
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
        <div>
          <div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div>
            <button onClick={() => {
              otrApp!.sendText(topic, message).then(r => console.log(r));
            }}>
              Hit it!
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
