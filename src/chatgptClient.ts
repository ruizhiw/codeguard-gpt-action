/* eslint-disable filenames/match-regex */
/* eslint-disable sort-imports */
import ollama from 'ollama'
import {promptForJson} from './prompt'
import {Suggestions} from './utils'
import * as core from '@actions/core'

process.env.OLLAMA_URL = 'https://origin-discovery-reco-bastion.preprod.hotstar-labs.com'
type SendPostRequestOptions = {
  prompt?: string;
  model?: string;
};

export async function sendPostRequest(options: SendPostRequestOptions = {}): Promise<any> {
    try {
        const responseGenerator = await ollama.chat({
            "model": options.model || "llama3.2",
            "messages": [{
                "role": "user",
                "content": options.prompt || ""
            }],
            "stream": true
        })
        let response = ''
        for await (const part of responseGenerator) {
            response += part.message.content

        }
        core.debug(`Response: ${response}`)
        return response
    } catch (error) {
        core.error(JSON.stringify(error, null, 2))
    }
}

export async function getSuggestions(
  textWithLineNumber: string,
  linesToReview: {start: number; end: number}[]
): Promise<Suggestions> {
  const response = await sendPostRequest({
    prompt: promptForJson(
      textWithLineNumber,
      linesToReview.map(({start, end}) => `line ${start}-${end}`).join(',')
    )
  })

  // extract the json from the response
  const result = response
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
