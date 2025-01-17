/* eslint-disable filenames/match-regex */
/* eslint-disable sort-imports */
import {promptForJson} from './prompt.js'
import {Suggestions} from './utils.js'
import * as core from '@actions/core'
import http from 'http'
import {a} from "ollama/dist/shared/ollama.67ec3cf9.js";

// import fetch from "node-fetch"
// import { ReadableStream } from 'web-streams-polyfill'
// globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream

const url = 'https://origin-discovery-reco-bastion.preprod.hotstar-labs.com/api/chat'
const agent = new http.Agent({ keepAlive: true });

type SendPostRequestOptions = {
  prompt?: string;
  model?: string;
};


export async function sendPostRequest(options: SendPostRequestOptions = {}): Promise<any> {
    try {
        const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            agent: agent,
            body: JSON.stringify({
            "model": options.model || "llama3.2",
            "messages": [{
                "role": "user",
                // "content": options.prompt || ""
                "content": "why is the sky blue"
            }],
            "stream": true
            })
        }, 1000000)
        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder();
        let result = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            result += JSON.parse(decoder.decode(value, { stream: true })).message.content;
            core.debug(result)
        }

        core.debug(`Response: ${result}`);
        return result
    } catch (error) {
        core.error(`Error during ollama.chat call: ${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`)
        core.error(`Error during ollama.chat call: ${error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}`)
        core.error(`Error during ollama.chat call: ${error instanceof Error ? error.cause : JSON.stringify(error, null, 2)}`)
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

async function fetchWithTimeout(url: string, options = {}, timeout = 3000) {
    // 创建 AbortController 实例
    const controller = new AbortController();
    const { signal } = controller;

    // 设置超时
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        // 发起 fetch 请求，传入 signal
        const response = await fetch(url, { ...options, signal });

        // 清除超时计时器
        clearTimeout(timeoutId);

        // 返回响应
        return response;
    } catch (error) {
        // 如果请求被中断（超时），抛出超时错误
        if ((error as Error).name === "AbortError") {
            throw new Error("Request timed out");
        }

        // 其他错误
        throw error;
    }
}
