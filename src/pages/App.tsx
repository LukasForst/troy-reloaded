import React, { useEffect, useState } from 'react';
import './App.css';
import OtrApp, { createOtrApp } from '../otr-messaging';
import { StoredEvent } from '../otr-messaging/storage/storage-schemata';
import { AssetId } from '../otr-messaging/model';

interface Asset {
  id: AssetId;
  name: string;
}

const parseText = (events: StoredEvent[]) => events.map(x => 'text' in x.message ? x.message.text : '').filter(x => x !== '');
const parseFiles = (events: StoredEvent[]): Asset[] => events.map(x => {
  if ('assetId' in x.message && x.message.assetId) {
    return { id: x.message.assetId, name: x.message.metadata.fileName };
  } else {
    return {} as Asset;
  }
}).filter(x => x.id !== undefined);

export const App = () => {
  const [state, setState] = useState<'login-needed' | 'loading' | 'finished'>('loading');
  const [otrApp, setOtrApp] = useState<OtrApp | undefined>(undefined);
  const [message, setMessage] = useState('Hello world!');
  const [topic, setTopic] = useState('19:cfa5b371-349e-434e-944f-17fa5653375d_f9445383-8e82-46d6-8e7e-f7bbf6c6b6dc@unq.gbl.spaces');
  const [messagesList, setMessagesList] = useState<Array<string>>([]);
  const [fileList, setFileList] = useState<Array<Asset>>([]);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  // effect for creating all instance of the communication service
  useEffect(() => {
    // do not execute when otrApp is already in place
    if (otrApp) {
      return;
    }
    // initialise app
    createOtrApp({ api: { baseUrl: 'http://localhost:8080/api', websocketUrl: 'ws://localhost:8080/async' } })
    .then(app => {
      app.listen((events => {
        // TODO here bind it to redux dispatch
        console.log('new events', events);
        setMessagesList((current) => {
            return current.concat(parseText(events));
          }
        );
        setFileList((current) => {
          return current.concat(parseFiles(events));
        });
      }));
      // prefill all messages from storage
      app.listTopicEvents(topic)
      .then(e => {
        setMessagesList(parseText(e));
        setFileList(parseFiles(e));
      });
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
  // otrApp?.getSelf().then(self => console.log('self', self));
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
            <button disabled={state !== 'finished'} onClick={() => {
              setState('loading');
              otrApp!.sendText(topic, message)
              .then(r => console.log(r))
              .then(() => setState('finished'));
            }}>
              Send Message!
            </button>
          </div>
          <div>
            Messages
            <ul>
              {messagesList.map((m, idx) => <li key={idx}>Message #{idx}: {m}</li>)}
            </ul>
          </div>
          <div>
            Files
            <ul>
              {fileList.map((asset, idx) => <li key={idx}>File #{idx}: <button onClick={(e) => {
                e.preventDefault();
                otrApp?.getAsset(asset.id)
                .then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  // the filename you want
                  a.download = asset.name;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                })
                .catch((e) => console.log(e));
              }}>{asset.name}</button></li>)}
            </ul>
          </div>
          <div>
            <form onSubmit={(e) => {
              if (selectedFile && otrApp) {
                setState('loading');
                otrApp.sendAsset(topic, selectedFile)
                .catch((e) => console.log(e))
                .then(r => console.log(r))
                .then(() => setState('finished'))
                .catch((e) => console.log(e));
              }
              e.preventDefault();
            }}>
              <input type="file" onChange={(e) => {
                const f = e?.target?.files?.item(0);
                if (f) {
                  setSelectedFile(f);
                }
              }}/>
              <input type="submit" value="Send!"/>
            </form>
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
