import { useState } from 'react'
import './App.css'
import { api } from "../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

interface Message {
  author: string;
  body: string;
}

function App() {
  const messages: Message[] = useQuery(api.messages.list) || [];
  const sendMessage = useMutation(api.messages.send);

  const [newMessageText, setNewMessageText] = useState('');

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
        sendMessage({newMessageText}).then(() => {});
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

