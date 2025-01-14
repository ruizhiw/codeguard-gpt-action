import './sourcemap-register.cjs';/******/ "use strict";
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
/* eslint-disable sort-imports */
const core = __importStar(require("@actions/core"));
const action_1 = require("@octokit/action");
const client_1 = require("./client");
const chatgptClient_1 = require("./chatgptClient");
const prompt_1 = require("./prompt");
const utils_1 = require("./utils");
const octokit = new action_1.Octokit();
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.debug("Start Running gpt action");
            const extensions = core.getInput('extensions').split(',');
            const pullNumber = parseInt(core.getInput('number'));
            const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
            core.debug(`Owner: ${owner}, Repo: ${repo}`);
            const files = yield octokit.request(`GET /repos/${owner}/${repo}/pulls/${pullNumber}/files`);
            core.debug(`Files: ${files.data}`);
            for (const file of files.data) {
                const extension = file.filename.split('.').pop();
                if (extensions.includes(extension)) {
                    core.debug(`File.raw_url: $${file.raw_url}`);
                    const text = yield (0, client_1.getRawFileContent)(file.raw_url);
                    const textWithLineNumber = (0, utils_1.addLineNumbers)(text);
                    if (process.env.CODEGUARD_COMMENT_BY_LINE) {
                        const changedLines = (0, utils_1.getChangedLineNumbers)(file.patch);
                        const suggestions = yield (0, chatgptClient_1.getSuggestions)(textWithLineNumber, changedLines);
                        (0, utils_1.validateSuggestions)(suggestions);
                        yield (0, client_1.processSuggestions)(file, suggestions, owner, repo, pullNumber, octokit, changedLines);
                    }
                    else {
                        const response = yield (0, chatgptClient_1.sendPostRequest)({
                            prompt: (0, prompt_1.promptForText)(file.filename, textWithLineNumber)
                        });
                        yield (0, client_1.postCommentToPR)(owner, repo, pullNumber, response.message.content.parts[0], octokit);
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.debug(error.message);
        }
    });
}
run();


//# sourceMappingURL=index.js.map