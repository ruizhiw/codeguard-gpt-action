/* eslint-disable sort-imports */
import * as core from '@actions/core'
import {Octokit} from '@octokit/action'
import {getRawFileContent, postCommentToPR, processSuggestions} from './client'
import {getSuggestions, sendPostRequest} from './chatgptClient'
import {promptForText} from './prompt'
import {
  addLineNumbers,
  getChangedLineNumbers,
  validateSuggestions
} from './utils'

const octokit = new Octokit()

export async function run(): Promise<void> {
  try {
    core.debug("Start Running gpt action")
    const extensions = core.getInput('extensions').split(',')

    const pullNumber = parseInt(core.getInput('number'))
    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/')
    core.debug(`Owner: ${owner}, Repo: ${repo}`)

    const files = await octokit.request(
      `GET /repos/${owner}/${repo}/pulls/${pullNumber}/files`
    )
    core.debug(`Files: ${files.data}`)

    for (const file of files.data) {
      const extension = file.filename.split('.').pop()

      if (extensions.includes(extension)) {
        core.debug(`File.raw_url: $${file.raw_url}`)
        const text = await getRawFileContent(file.raw_url)
        const textWithLineNumber = addLineNumbers(text!)
        if (process.env.CODEGUARD_COMMENT_BY_LINE) {
          const changedLines = getChangedLineNumbers(file.patch)

          const suggestions = await getSuggestions(
            textWithLineNumber,
            changedLines
          )

          validateSuggestions(suggestions)

          await processSuggestions(
            file,
            suggestions,
            owner,
            repo,
            pullNumber,
            octokit,
            changedLines
          )
        } else {
          const response = await sendPostRequest({
            prompt: promptForText(file.filename, textWithLineNumber)
          })

          await postCommentToPR(
            owner,
            repo,
            pullNumber,
            response.message.content.parts[0],
            octokit
          )
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) core.debug(error.message)
  }
}

run()
