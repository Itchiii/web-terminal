import { Commands } from "../helper/commands.js";

const response = fetch('./web-terminal/web-terminal.html').then(response => response.text());

export class WebTerminal extends HTMLElement {
  #commandField;
  #terminalUser;
  #history = [];
  #commandCount;

  /**
   * Creates an instance of Terminal.
   */
  constructor() {
    super();
    response.then(
      data => {
        //attach shadow content
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = data;

        //set specific terminal user
        this.shadowRoot.querySelector('.terminal-user').textContent = `[${this.getAttribute('user')}]:$`;

        //object handler to remove click event listener
        this.clickedTerminalContent = function () {
          this.removeCursor();
          this.#commandField.focus();
          this.setCustomCursor();
        }
        this.clickHandlerTerminalContent = this.clickedTerminalContent.bind(this);

        this.#history = JSON.parse(localStorage.getItem(`${this.getAttribute('user')}`)) ? JSON.parse(localStorage.getItem(`${this.getAttribute('user')}`)) : [];
        this.#commandCount = this.#history.length;

        this.addNavEvents();
        this.init();
      }
    );
  }

  /**
   * init function to set variables, cursor and events 
   * will be also called after content has been changed
   *
   */
  init() {
    //last element of class
    this.#terminalUser = [...this.shadowRoot.querySelectorAll('.terminal-user')].pop();
    this.#commandField = [...this.shadowRoot.querySelectorAll('.command-field')].pop();

    this.addEvents();
    this.#commandField.focus();
    this.setCustomCursor();
  }

  /**
   * add event listener for command field and content wrapper
    * ArrowUp, ArrowDown and Enter trigger specific functions
   *
   */
  addEvents() {
    ['keyup', 'mouseup'].forEach(evt =>
      this.#commandField.addEventListener(evt, (e) => {
        if (e.key === "ArrowUp") {
          if (this.#commandCount > 0) {
            this.#commandField.textContent = this.#history[this.#commandCount - 1];
            this.#commandCount--;
          }
          if (this.#commandCount >= 0) {
            //set cursor to beginning (strange workaround for chrome, chrome loses the normal cursor, focus() did not work
            this.removeCursor();
            this.setCursor(0,0)
            this.setCustomCursor();
          }
        }
        else if (e.key === "ArrowDown") {
          if (this.#commandCount + 1 < this.#history.length) {
            this.#commandField.textContent = this.#history[this.#commandCount + 1];
            this.#commandCount++;
          }
          else {
            this.#commandCount = this.#history.length;
            this.#commandField.textContent = "";
            //workaround for chrome, to set with empty content
            this.#commandField.append(document.createTextNode(" "));
          }

          //set cursor to beginning (strange workaround for chrome, chrome loses the normal cursor, focus() did not work
          this.removeCursor();
          this.setCursor(0,0)
          this.setCustomCursor();
        }
        else if (e?.key === "Enter") {
          this.changeContent(this.#commandField.textContent);
        }

        else {
          //set cursor to new position after typing
          this.removeCursor();
          this.setCustomCursor();
        }
      })
    );

    ['blur', 'keydown'].forEach(evt =>
      this.#commandField.addEventListener(evt, (e) => {
        //don't remove cursor on ArrowUp or Arrow Down to prevent the text content from moving for a short time
        if (e?.key !== "ArrowUp" && e?.key !== "ArrowDown") {
          this.removeCursor();
        }
      })
    );

    //remove listener to avoid duplicates after content changed and elements were duplicated
    this.shadowRoot.getElementById('terminal-content').removeEventListener('click', this.clickHandlerTerminalContent);
    this.shadowRoot.getElementById('terminal-content').addEventListener('click', this.clickHandlerTerminalContent);
  }

  /**
   * add event listener for nav elements
   *
   */
  addNavEvents() {
    this.shadowRoot.getElementById('nav-help').addEventListener('click', () => {
      this.changeContent("help");
    });
    this.shadowRoot.getElementById('nav-about').addEventListener('click', () => {
      this.changeContent("about");
    });
  }

  /**
   * set cursor to specific position
   * https://stackoverflow.com/a/6249440
   *
   * @param line
   * @param number
   */
  setCursor(line, number) {
    const range = document.createRange()
    range.setStart(this.#commandField.childNodes[line], number);
    range.collapse(true);

    const sel = window.getSelection()
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * set cursor 
   *
   */
  setCustomCursor(line = 0, number = 0) {
    //getSelection() does not work in Chrome with 'document' but with 'shadowRoot'; safari is unclear
    //https://stackoverflow.com/a/4565120
    var isChrome = /Chrome/.test(navigator.userAgent);
    let range = isChrome ? this.shadowRoot.getSelection().getRangeAt(0) : document.getSelection().getRangeAt(0);

    //node itself or if the inner text is focused
    if (range.endContainer.classList?.contains("command-field") || range.endContainer.parentNode.classList.contains("command-field")) {
      //create custom cursor element
      const cursor = document.createElement('span');
      cursor.classList.add('command-cursor');
      cursor.setAttribute('id', "command-cursor");
      cursor.setAttribute('contenteditable', "false");
      range.insertNode(cursor);

      //due to the new cursor, inside the element, the inner nodes of the element split and you have to specify concretely the text node and its char position. 
      line = [...this.#commandField.childNodes].indexOf(cursor) - 1 > -1
        ? [...this.#commandField.childNodes].indexOf(cursor) - 1
        : line;
      number = this.#commandField.childNodes[[...this.#commandField.childNodes].indexOf(cursor) - 1]?.length
        ? this.#commandField.childNodes[[...this.#commandField.childNodes].indexOf(cursor) - 1]?.length
        : number;

      this.setCursor(line, number);
    }
  }

  /**
   * if cursor is set, remove it
   *
   */
  removeCursor() {
    this.shadowRoot.getElementById('command-cursor')?.remove();
  }

  /**
   * copy user and command field and then change content with given command
   *
   * @param input
   */
  changeContent(input) {
    input = input.trim();

    //push input into history
    if (input !== '') {
      this.#history.push(input);
      localStorage.setItem(`${this.getAttribute('user')}`, JSON.stringify(this.#history));
      this.#commandCount = this.#history.length;
    }

    const newUserField = this.#terminalUser.cloneNode(true);
    const newCommandField = this.#commandField.cloneNode(false);
    const oldCommandField = this.#commandField.cloneNode(false);
    //replaceChild() removes the old event listeners
    this.shadowRoot.getElementById('terminal-content').replaceChild(oldCommandField, this.#commandField);
    oldCommandField.textContent = input;
    oldCommandField.removeAttribute('contenteditable');

    //set content with specific command
    this.setContent(input);

    //workaround for chrome, to set with empty content
    newCommandField.append(document.createTextNode(" "));

    //append new nodes
    this.shadowRoot.getElementById('terminal-content').append(newUserField);
    this.shadowRoot.getElementById('terminal-content').append(newCommandField);

    this.init();
  }

  /**
   * get specific function with given command
   *
   * @param command
   */
  setContent(command) {
    switch (command) {
      case '': Commands.empty(this); break;
      case 'about': Commands.about(this); break;
      case 'browser': Commands.browser(this); break;
      case 'clear': Commands.clear(this); break;
      case 'help': Commands.help(this); break;
      case 'history': Commands.history(this); break;
      case 'history --clear': Commands.history_clear(this); this.#history = []; this.#commandCount = 0; break;
      default: Commands.notFound(this); break;
    }
  }
}
