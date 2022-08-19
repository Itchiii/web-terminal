import { WebTerminal } from './web-terminal/web-terminal.js';
import { GitHubCorner } from './vendor/gitHub-corner/gitHubCorner.js';

customElements.define("terminal-component", WebTerminal);
customElements.define("github-component", GitHubCorner);

