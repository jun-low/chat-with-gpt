import { useState } from 'react'
import './App.css'

interface Message {
  author: string;
  body: string;
}

function App() {
  const messages: Message[] = [
    {author: 'ser', body: 'Hello, world'},
  ];
  const sendMessage = body =>
    console.log('Trying to send: ' + body);
  const [newMessageText, setNewMessageText] =
    useState('');

  return (
    <div className='App'>
      {messages.map((message, i) => (
        <p key={i}>
          <span>{message.author}: </span>
          <span style={{ whiteSpace: 'pre-wrap' }}>
            {message.body ?? '...'}
          </span>
        </p>
      ))}
      <form onSubmit={(e) => {
        e.preventDefault();
        setNewMessageText('');
        sendMessage(newMessageText);
      }}>
        <input
          value={newMessageText}
          onChange={e => setNewMessageText(e.target.value)}
          placeholder='Write a message…'
        />
        <input type='submit' value='Send' disabled={!newMessageText} />
      </form>
    </div>
  );
}

export default App

