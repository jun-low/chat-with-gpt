import { api } from '../convex/_generated/api';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { AddIdentity } from './components/AddIdentity';
import { Thread, UIMessage } from './components/Thread';
import { Id } from '../convex/_generated/dataModel';

export default function App() {
  const {loadMore, results, status} = usePaginatedQuery(
    api.messages.list,
    {},
    {initialNumItems: 100}
  );
  const messages = useMemo(() => results.slice().reverse(), [results]);

  const [newThreadId, setNewThreadId] = useState<Id<'threads'>>();
  const createThread = useMutation(api.threads.add);
  useEffect(() => {
    if (newThreadId && messages.find((m) => newThreadId === m.threadId))
      setNewThreadId(undefined);
  }, [newThreadId, messages]);

  return (
    <main className="container mx-auto bg-white rounded-lg shadow-lg border p-4 md:p-6 max-w-xs sm:max-w-2xl">
      <h1 className="text-gray-600 text-2xl text-center font-semibold mb-2 md:mb-4">Chat with GPT</h1>
      <p className="text-gray-600 mb-2 md:mb-4 text-center">Disclaimer: Any identities here are not real. Just
        robots.</p>
      {status === 'CanLoadMore' && (
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-700 w-full md:w-auto"
          onClick={() => loadMore(100)}
        >
          Load More
        </button>
      )}
      {messages
        .reduce<UIMessage[][]>((threads, message) => {
          const thread = threads.find(
            (threadMessages) => threadMessages[0].threadId === message.threadId
          );
          if (thread) {
            thread.push(message);
          } else {
            threads.push([message]);
          }
          return threads;
        }, [])
        .map((messages, index, threads) => (
          <details
            key={'thread' + index}
            open={!newThreadId && index === threads.length - 1}
            className="mb-2 md:mb-4"
          >
            <summary className="font-semibold text-blue-500 cursor-pointer">
              {messages[0]?.body?.substring(0, 100)}...
            </summary>
            <Thread messages={messages} threadId={messages[0].threadId} />
          </details>
        ))}
      {newThreadId && (
        <>
          <Thread messages={[]} threadId={newThreadId} />
        </>
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          createThread().then(setNewThreadId);
        }}
        disabled={!!newThreadId}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-green active:bg-green-700 w-full md:w-auto"
      >
        Start New Thread
      </button>
      <AddIdentity />
    </main>
  );
}
