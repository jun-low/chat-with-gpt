'use node';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import { v } from 'convex/values';
import OpenAI from 'openai';
import { Moderation } from 'openai/resources';

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY in environment variables.\n' +
    'Set it in the project settings in the Convex dashboard:\n' +
    '    npx convex dashboard\n or https://dashboard.convex.dev'
  );
}

export const moderateIdentity = action({
  args: {name: v.string(), instructions: v.string()},
  handler: async (ctx, {name, instructions}) => {
    const apiKey = process.env.OPENAI_API_KEY!;
    const openai = new OpenAI({apiKey});

    // Check if the message is offensive.
    const modResponse = await openai.moderations.create({
      input: name + ': ' + instructions,
    });

    const modResult = modResponse.results[0];
    if (modResult.flagged) {
      return 'Flagged: ' + flaggedCategories(modResult).join(', ');
    }
    await ctx.runMutation(internal.identity.add, {name, instructions});
    return null;
  },
});

const flaggedCategories = (modResult: Moderation) => {
  return Object.entries(modResult.categories)
    .filter(([, flagged]) => flagged)
    .map(([category]) => category);
};

export const chat = action({
  args: {
    body: v.string(),
    identityName: v.string(),
    threadId: v.id('threads'),
  },
  handler: async (ctx, {body, identityName, threadId}) => {
    const {instructions, messages, userMessageId, botMessageId} =
      await ctx.runMutation(internal.messages.send, {
        body,
        identityName,
        threadId,
      });
    const fail = (reason: string) =>
      ctx
        .runMutation(internal.messages.update, {
          messageId: botMessageId,
          patch: {
            error: reason,
          },
        })
        .then(() => {
          throw new Error(reason);
        });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await fail(
        'Add your OPENAI_API_KEY as an env variable in the convex dashboard'
      );
    }

    const openai = new OpenAI({apiKey});

    // Check if the message is offensive.
    try {
      const modResponse = await openai.moderations.create({
        input: body,
      });
      const modResult = modResponse.results[0];
      if (modResult.flagged) {
        await ctx.runMutation(internal.messages.update, {
          messageId: userMessageId,
          patch: {
            error:
              'Your message was flagged: ' +
              flaggedCategories(modResult).join(', '),
          },
        });
        return;
      }
    } catch (error) {
      await fail(`${error}`);
    }

    const gptMessages = [];
    let lastInstructions = null;
    if (instructions !== lastInstructions) {
      gptMessages.push({
        role: 'system' as const,
        content: instructions ?? 'You are a helpful assistant',
      });
      lastInstructions = instructions;
    }
    for (const {body, author, instructions} of messages) {
      if (instructions && instructions !== lastInstructions) {
        gptMessages.push({
          role: 'system' as const,
          content: instructions,
        });
        lastInstructions = instructions;
      }
      gptMessages.push({role: author, content: body as string});
    }

    try {
      const openaiResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: gptMessages,
      });
      await ctx.runMutation(internal.messages.update, {
        messageId: botMessageId,
        patch: {
          body: openaiResponse.choices[0].message?.content as string,
          usage: openaiResponse.usage, // Track how many tokens we're using for various messages
          updatedAt: Date.now(),
          // ms: Number(openaiResponse.headers["openai-processing-ms"]), // How long it took OpenAI
        },
      });
    } catch (error) {
      await fail(`OpenAI error: ${error}`);
    }
  },
});
