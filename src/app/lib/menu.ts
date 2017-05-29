import {Injectable} from "@angular/core";
import {CoverService} from "../cover/cover-layer/cover.service";
const electron = window['require']('electron');
const {app, Menu, MenuItem, BrowserWindow} = electron.remote;
const process = window['process'];

const alwaysOnTopItem = {
  label: 'Always on Top',
  type: 'checkbox',
  checked: false,
  click(item, win) {
    win.setAlwaysOnTop(!win.isAlwaysOnTop());
    item.checked = win.isAlwaysOnTop();
  }
};
const getTemplate = function (c) {
  const template: any = [
    {
      label: 'File',
      submenu: []
    }, {
      label: 'Catalogue',
      submenu: []
    }, {
      label: 'View',
      submenu: []
    },
    {
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          // label: 'Learn More',
          // click () {
          //   electron.shell.openExternal('http://erisapp.com');
          // }
          // }, {
          //   label: 'Credits',
          //   click(){
          //     electron.shell.openExternal('http://erisapp.com/credits');
          //   }
          // }, {
          label: 'Feedback',
          click(){
            electron.shell.openExternal('mailto:centimitr@gmail.com?subject=[Feedback] &body=Thank you for your feedback!');
          }
        }, {
          label: 'Feature Request',
          click(){
            electron.shell.openExternal('mailto:centimitr@gmail.com?subject=[Feature Request] &body=Thank you for your feedback!');
          }
        }
      ]
    }
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: `About ${app.getName()}`,
          click(){
            c.showAbout();
          }
        }, {
          label: `Preferences...`,
          accelerator: 'CmdOrCtrl+,',
          click(){
            c.showPreferences();
          }
        }, {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    });
    // Window menu.
    template[4].submenu = [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      }, {
        type: 'separator'
      }, {
        role: 'togglefullscreen'
      }, {
        label: 'Zoom',
        accelerator: 'Ctrl+Cmd+=',
        role: 'zoom'
      }, {
        label: 'Center',
        click(item, win){
          win.center();
        }
      }, alwaysOnTopItem, {
        type: 'separator'
      }, {
        label: 'Background',
        enabled: false
      }, {
        label: 'Light',
        type: 'radio',
        click(item, win){
          document.body.style.backgroundColor = null;
          win.setVibrancy('light');
        }
      }, {
        label: 'Dark',
        type: 'radio',
        click(item, win){
          win.setVibrancy('medium-light');
          document.body.style.backgroundColor = 'rgba(0,0,0,.7)';
        }
      }, {
        label: 'Book Paper',
        type: 'radio',
        click(){
          document.body.style.backgroundColor = '#f8f4ea';
        }
      }, {
        label: 'Silver Gray',
        type: 'radio',
        click(){
          document.body.style.backgroundColor = '#dedede';
        }
      }, {
        label: 'Deep Black',
        type: 'radio',
        click(){
          document.body.style.backgroundColor = '#171717';
        }
      }, {
        type: 'separator'
      }, {
        label: 'Bring All to Front',
        role: 'front'
      }
    ];
    if (1) {
      template[4].submenu.push({
        label: 'Developer Tools',
        accelerator: 'Cmd+Alt+I',
        role: 'toggledevtools'
      });
    }
  }
  return Menu.buildFromTemplate(template);
};

export {
  Menu,
  MenuItem,
  alwaysOnTopItem
}

@Injectable()
export class AppMenu {

  constructor(private c: CoverService) {

  }

  current: any = getTemplate(this.c);

  get() {
    return this.current;
  }

  getSubMenu(index: number) {
    return this.current.items[index].submenu;
  }

  file() {
    return this.getSubMenu(1);
  }

  catalogue() {
    return this.getSubMenu(2);
  }

  view() {
    return this.getSubMenu(3);
  }

  set() {
    Menu.setApplicationMenu(this.current);
  }

  reset() {
    this.current = getTemplate(this.c);
    this.set();
  }
}
