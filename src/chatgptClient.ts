/* eslint-disable filenames/match-regex */
/* eslint-disable sort-imports */
import ollama from 'ollama'
import {promptForJson} from './prompt.js'
import {Suggestions} from './utils.js'
import * as core from '@actions/core'
import fetch from "node-fetch"
import { ReadableStream } from 'web-streams-polyfill'

const url = 'https://origin-discovery-reco-bastion.preprod.hotstar-labs.com/api/chat'
type SendPostRequestOptions = {
  prompt?: string;
  model?: string;
};

export async function sendPostRequest(options: SendPostRequestOptions = {}): Promise<any> {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
            "model": options.model || "llama3.2",
            "messages": [{
                "role": "user",
                "content": options.prompt || ""
            }],
            "stream": true
            })
        })
        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        core.debug(`Response: ${result}`);
        return result
    } catch (error) {
        core.error(`Error during ollama.chat call: ${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`)
    }
}

export async function getSuggestions(
  textWithLineNumber: string,
  linesToReview: {start: number; end: number}[]
): Promise<Suggestions> {
    core.debug(`Lines to review: start: ${linesToReview[0].start}, end: ${linesToReview[0].end}`)
  const response = await sendPostRequest({
    prompt: promptForJson(
      textWithLineNumber,
      linesToReview.map(({start, end}) => `line ${start}-${end}`).join(',')
    )
  })

  // extract the json from the response
  const result = response
    core.debug(`Result: ${result}`)
  const startIndex = result.indexOf('{')
  const endIndex = result.lastIndexOf('}')
  const json =
    startIndex !== -1 && endIndex !== -1 && endIndex > startIndex
      ? result.substring(startIndex, endIndex + 1)
      : ''

  let suggestions
  try {
    suggestions = JSON.parse(json)
  } catch (err) {
    throw new Error(
      `ChatGPT response is not a valid json:\n ${response}`
    )
  }
  return suggestions
}
