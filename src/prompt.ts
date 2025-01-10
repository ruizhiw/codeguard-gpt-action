/**
 * Generates a prompt for a code guard to review TypeScript source code.
 *
 * @param fileName - The name of the file being reviewed
 * @param sourceCodeWithLineNumber - The source code with line numbers
 * @returns A formatted prompt instructing a code guard to provide code review suggestions
 *
 * @remarks
 * The prompt requests the code guard to:
 * - Start suggestions with a specific phrase
 * - Mention the file name
 * - Provide suggestions for code readability, maintainability, and security
 * - Include line numbers with each suggestion
 * - Provide concise code snippets for suggested improvements
 */
export function promptForText(
  fileName: string,
  sourceCodeWithLineNumber: string
): string {
  return `Act as a code guard that has deep knowledge of software development, you will review the pull request files change below for a project is written in Typescript. Always start your suggestions with 'As a codeguard, here are my suggestions' and mention file name. Please provide suggestions for making the code more readable, maintainable and secure, mentioning line numbers with each suggestion and only provide suggestions and one line code snippets corresponding to those lines of suggestion:
    ${fileName}
    \`\`\`ts
    ${sourceCodeWithLineNumber}
    \`\`\``
}

/**
 * Generates a prompt for a code guard to review specific lines of TypeScript code and provide JSON-formatted suggestions.
 *
 * @param sourceCodeWithLineNumber - The source code with line numbers to be reviewed
 * @param linesToReview - Specification of which lines should be reviewed
 * @returns A formatted prompt instructing the code guard to provide JSON-structured code review suggestions
 *
 * @remarks
 * The generated prompt requests a code guard to:
 * - Review TypeScript code
 * - Focus on specified lines
 * - Provide suggestions for improving readability, maintainability, and security
 * - Return suggestions in a JSON format with line numbers as keys
 */
export function promptForJson(
  sourceCodeWithLineNumber: string,
  linesToReview: string
): string {
  return `Act as a code guard with deep knowledge of software development, review the code below for a project written in TypeScript.
    \`\`\`ts
    ${sourceCodeWithLineNumber}
    \`\`\`
    Please provide suggestions for ${linesToReview} to making the code more readable, maintainable and secure in the format of a json object, property key of the json object uses the line number as key value and value of the property is an object for suggestion and reason without any code block. please only reply the json string without any additional text.
    `
}
