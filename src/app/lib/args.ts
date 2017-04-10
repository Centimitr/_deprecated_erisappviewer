const qs = require('querystring');
const {ipcRenderer} = window['require']('electron');

export class Args {
  path: string;
  port: number;
  _promise: Promise<any>;
  _resolve: Function;

  constructor() {
    this._promise = new Promise(resolve => this._resolve = resolve);
  }

  check() {
    if (this._resolve && this.path && this.port) {
      this._resolve();
    }
  }

  wait() {
    return this._promise;
  }
}

const args: Args = new Args();

ipcRenderer.on('path', (event, message) => {
  // console.log('path:', message);
  args.path = message;
  args.check();
});
ipcRenderer.on('port', (event, message) => {
  // console.log('port:', message);
  args.port = message;
  args.check();
});

export default args;
