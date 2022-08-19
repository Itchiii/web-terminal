// https://github.com/tholman/github-corners

const response = fetch('./vendor/gitHub-corner/gitHubCorner.html').then(response => response.text());

export class GitHubCorner extends HTMLElement {
  constructor() {
    super();
    response.then(
      data => {
        //attach shadow content
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = data;
      }
    );
  }
}
