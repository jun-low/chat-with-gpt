import {api} from '../../convex/_generated/api';
import {useAction, useQuery} from 'convex/react';
import React, {useEffect, useState} from 'react';
import {Id} from '../../convex/_generated/dataModel';

export type UIMessage = {
  name: string;
  author: string;
  identityId?: Id<'identities'>;
  threadId: Id<'threads'>;
  body?: string;
  error?: string;
  updatedAt?: number;
  _id: Id<'messages'>;
  _creationTime: number;
};

export function Thread({threadId, messages}: { threadId: Id<'threads'>; messages: UIMessage[]; }) {
  const identities = useQuery(api.identity.list);
  const [identityName, setIdentityName] = useState<string>();
  const [newMessageText, setNewMessageText] = useState('');
  const sendMessage = useAction(api.openai.chat);
  useEffect(() => {
    if (identities?.length && !identityName) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage?.identityId &&
        identities.indexOf(lastMessage.name) !== -1
      ) {
        if (identityName !== lastMessage.name)
          setIdentityName(lastMessage.name);
      } else {
        setIdentityName(identities[0]);
      }
    }
  }, [messages, identities, identityName]);

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identityName) throw new Error('No identity selected');
    setNewMessageText('');
    await sendMessage({body: newMessageText, identityName, threadId});
  }

  return (
    <div className="sm:max-w-md mx-auto">
      <ul className="divide-y divide-gray-300">
        {messages.map((message) => (
          <li key={message._id} className="py-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <span className="text-blue-500 font-semibold sm:mr-2">
                {message.name ?? message.author}:
              </span>
              <span
                className={`flex-grow ${
                  message.error
                    ? 'text-red-500'
                    : 'text-gray-800'
                }`}
              >
                {message.error ? '⚠️ ' + message.error : message.body ?? '...'}
              </span>
              <span className="text-gray-500 text-sm mt-1 sm:mt-0">
                {new Date(
                  message.updatedAt ?? message._creationTime
                ).toLocaleTimeString()}
              </span>
            </div>
          </li>
        ))}
        {messages.length === 0 ? (
          <li className="text-gray-500">New thread...</li>
        ) : null}
      </ul>
      <form
        onSubmit={handleSendMessage}
        className="my-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-start sm:items-center"
      >
        <select
          value={identityName}
          onChange={(e) => setIdentityName(e.target.value)}
          className="border rounded-md py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:border-blue-300"
        >
          {identities?.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          value={newMessageText}
          onChange={(event) => setNewMessageText(event.target.value)}
          placeholder="Write a message…"
          className="flex-grow border rounded-md py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-700"
          disabled={!newMessageText}
        >
          Send
        </button>
      </form>
    </div>
  );
}
