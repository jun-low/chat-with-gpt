import { api } from '../../convex/_generated/api';
import { useAction } from 'convex/react';
import { useState } from 'react';

export function AddIdentity() {
  const addIdentity = useAction(api.openai.moderateIdentity);
  const [newIdentityName, setNewIdentityName] = useState('');
  const [newIdentityInstructions, setNewIdentityInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mt-4">
      <details open={false} className="border rounded-md p-4 shadow">
        <summary className="text-blue-500 font-semibold cursor-pointer">
          Add an identity
        </summary>
        {error && (
          <div className="text-red-500 mt-2">{error}</div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const errorMsg = await addIdentity({
              name: newIdentityName,
              instructions: newIdentityInstructions,
            });
            if (errorMsg) setError(errorMsg);
            setLoading(false);
            setNewIdentityName('');
            setNewIdentityInstructions('');
          }}
          className="mt-4 space-y-2 flex flex-col"
        >
          <input
            value={newIdentityName}
            onChange={(event) => setNewIdentityName(event.target.value)}
            placeholder="Identity name"
            className="border rounded-md py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:border-blue-300"
          />
          <textarea
            value={newIdentityInstructions}
            onChange={(event) => setNewIdentityInstructions(event.target.value)}
            placeholder="GPT3.5 Instructions (You're a helpful assistance)"
            rows={2}
            cols={40}
            className="border rounded-md py-2 px-3 bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline-blue active:bg-blue-700 self-start"
            disabled={loading || !newIdentityName || !newIdentityInstructions}
          >
            Add Identity
          </button>
        </form>
      </details>
    </section>
  );
}
