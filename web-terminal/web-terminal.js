import { Commands } from "../helper/commands.js";

const response = fetch('./web-terminal/web-terminal.html').then(response => response.text());

export class WebTerminal extends HTMLElement {
  #commandField;
  #customCursor;
  #terminalUser;

  //save current history in array
  #history = [];
  //help variable to go through the history
  #commandCount;

  /**
   * Creates an instance of WebTerminal.
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

        //fill history with local storage
        this.#history = localStorage.getItem(`${this.getAttribute('user')}`) ? JSON.parse(localStorage.getItem(`${this.getAttribute('user')}`)) : [];
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
    this.#customCursor = this.shadowRoot.querySelector('.command-cursor');

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
    this.#commandField.addEventListener('blur', this);
    this.#commandField.addEventListener('keyup', this);
    this.#commandField.addEventListener('mouseup', this);
    this.#commandField.addEventListener('mousedown', this);
    this.#commandField.addEventListener('keydown', this);

    this.shadowRoot.getElementById('terminal-content').addEventListener('click', this.clickedTerminalContent);
  }

  handleEvent(e) {
    //on blur
    if (e.type === 'blur') {
      this.stopCursorAnimation();
    }

    //on keydown or mousedown
    else if (e.type === 'keydown' || e.type === 'mousedown') {
      //preventDefault() on enter to avoid line break unti keyup
      //preventDefault() on ArrowUp and ArrowDown to that the cursor (from browser) is jumping to the beginning of the word
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
      }
      this.stopCursorAnimation();
      //If you hold down a key, the cursor should be updated
      this.setCustomCursor();
    }

    //on keyup or mouseup
    else if (e.type === 'keyup' || e.type === 'mouseup') {
      this.startCursorAnimation();

      //previous element on history
      if (e.key === "ArrowUp") {
        if (this.#commandCount > 0) {
          this.#commandField.textContent = this.#history[--this.#commandCount];
        }
        if (this.#commandCount >= 0) {
          this.setCaret(0, this.#commandField.textContent.length);
          this.setCustomCursor();
        }
      }

      //next element on history
      else if (e.key === "ArrowDown") {
        if (this.#commandCount + 1 < this.#history.length) {
          this.#commandField.textContent = this.#history[++this.#commandCount];
        }
        else {
          //if next element does not exist, clear content
          this.#commandCount = this.#history.length;
          this.#commandField.textContent = "";
        }
        this.setCaret(0, this.#commandField.textContent.length);
        this.setCustomCursor();
      }

      //on submit, add content depending on input
      else if (e.key === "Enter") {
        this.changeContent(this.#commandField.textContent);
      }

      else {
        this.setCustomCursor();
      }
    }
  }

  /**
   * event handler after terminal was clicked
   *
   */
  clickedTerminalContent = (e) => {
    if (e.target === this.#commandField) return;
    //set cursor to the end of the input
    this.setCaret(0, this.#commandField.textContent.length);
    this.setCustomCursor();
    this.startCursorAnimation();
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
   * stop blink animation of cursor
   *
   */
  stopCursorAnimation() {
    this.#customCursor.style.animationName = 'none';
  }

  /**
   * start blink animation of cursor
   *
   */
  startCursorAnimation() {
    this.#customCursor.style.animationName = 'blink-animation';
  }

  /**
   * set cursor to specific position
   * https://stackoverflow.com/a/6249440
   *
   * @param line
   * @param number
   */
  setCaret(line, number) {
    const range = document.createRange()
    if (this.#commandField.childNodes[line]) {
      range.setStart(this.#commandField.childNodes[line], number);
    }
    else {
      range.setStart(this.#commandField, number);
    }
    range.collapse(true);

    const sel = window.getSelection()
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * set custom cursor 
   *
   */
  setCustomCursor() {
    //getSelection() does not work in Chrome with 'document' but with 'shadowRoot'; safari is unclear
    //https://stackoverflow.com/a/4565120
    var isChrome = /Chrome/.test(navigator.userAgent);
    let range = isChrome ? this.shadowRoot.getSelection().getRangeAt(0) : document.getSelection().getRangeAt(0);

    if (range.endContainer.classList?.contains("command-field") || range.endContainer.parentNode.classList.contains("command-field")) {
      this.#customCursor.style.transform = `translateX(${range.endOffset}ch)`
    }
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

    //clone elements to append new one
    const newUserField = this.#terminalUser.cloneNode(true);
    const newCommandField = this.#commandField.cloneNode(false);
    const oldCommandField = this.#commandField.cloneNode(false);

    //adjust old command field
    //replaceChild() removes the old event listeners
    this.#commandField.parentNode.replaceChild(oldCommandField, this.#commandField);
    oldCommandField.textContent = input;
    oldCommandField.removeAttribute('contenteditable');

    //remove old cursor
    this.#customCursor.remove();

    //set content with specific command
    this.setContent(input);

    //create new wrapper and cursor
    const commandFieldWrapper = document.createElement('div');
    commandFieldWrapper.classList.add('command-field--wrapper');
    const commandCursor = document.createElement('div');
    commandCursor.classList.add('command-cursor');

    //append new nodes
    this.shadowRoot.getElementById('terminal-content').append(newUserField);
    commandFieldWrapper.append(newCommandField);
    commandFieldWrapper.append(commandCursor);
    this.shadowRoot.getElementById('terminal-content').append(commandFieldWrapper);

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
