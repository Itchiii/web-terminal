export class Commands {
  constructor() { }

  static about(instance) {
    instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
      `<p>Hi! Raik my name and I am a german front-end developer and media computer scientist. 
      Feel free to contact me if you have any questions or concerns via E-Mail (info@raikloesche.de).</p>`
    );
  }

  static browser(instance) {
    instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
      `<pre>${navigator.userAgent}</pre>`
    );
  }

  static clear(instance) {
    //change * to *:not(.terminal-intro) if intro should not be removed
    let content = instance.shadowRoot.querySelectorAll('.terminal-content > *');
    for (const ele of content) {
      ele.remove();
    }
  }

  static empty(instance) {
    instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
      `<pre></pre>`
    );
  }

  static help(instance) {
    instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
      `<p>This is a small project to display a terminal on the web. 
      You can try my defined commands here or copy the code on GitHub and use it in your own project, with your own commands. 
      Since this is early stage, there may still be small issues.
      </p>
      <p>Currents Commands are:</p>
      <p>browser</p>
      <p>clear</p>
      <p>history (--clear)</p>
      <p>...</p>
      `
    );
  }

  static history(instance) {
    for (const iterator of JSON.parse(localStorage.getItem(`${instance.getAttribute('user')}`))) {
      instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
        `<p>${iterator}</p>`
      );
    }
  }

  static history_clear(instance) {
    localStorage.setItem(`${instance.getAttribute('user')}`, JSON.stringify([]));
    Commands.empty(instance);
  }

  static notFound(instance) {
    instance.shadowRoot.getElementById('terminal-content').insertAdjacentHTML('beforeend',
      `<pre>${[...instance.shadowRoot.querySelectorAll('.command-field')].pop().textContent}: Command not found. Try 'help' or another command.</pre>`
    );
  }
}
