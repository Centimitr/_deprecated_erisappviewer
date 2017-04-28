import {Injectable} from "@angular/core";
const electron = window['require']('electron');
const {app, Menu, MenuItem} = electron.remote;
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
const getTemplate = function () {
  const template: any = [
    {
      label: 'File',
      submenu: []
    },
    {
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
          label: 'Learn More',
          click () {
            electron.shell.openExternal('http://devbycm.com')
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
          role: 'about'
        },
        {
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
    template[3].submenu = [
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
        role: 'togglefullscreen'
      }, {
        type: 'separator'
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
        label: 'Bring All to Front',
        role: 'front'
      }
    ];
    if (1) {
      template[3].submenu.push({
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
  current: any = getTemplate();

  get() {
    return this.current;
  }

  getSubMenu(index: number) {
    return this.current.items[index].submenu;
  }

  file() {
    return this.getSubMenu(1);
  }

  view() {
    return this.getSubMenu(2);
  }

  set() {
    Menu.setApplicationMenu(this.current);
  }

  reset() {
    this.current = getTemplate();
    this.set();
  }
}
