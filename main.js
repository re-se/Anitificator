const {app, BrowserWindow, Menu, Tray} = require('electron');

// crashReporter.start();

var mainWindow = null;
var appIcon = null;

var showSetting = function() {
  mainWindow.webContents.send('menu-clicked', '');
}
var name = app.getName();
var menu = Menu.buildFromTemplate([
  {
    label: name,
    submenu: [
      {label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: showSetting},
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: app.quit}
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.toggleDevTools();
        }
      },
    ]
  },
  {
    label: 'Window',
    role: 'window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
    ]
  },
  {
    label: 'Help',
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: function() { require('electron').shell.openExternal('http://electron.atom.io') }
      },
    ]
  },
]);


app.on('window-all-closed', function() {
  // if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', function() {
  // ブラウザ(Chromium)の起動, 初期画面のロード
  appIcon = new Tray(__dirname + '/dist/resource/image/icon.png');
  mainWindow = new BrowserWindow({"width": 470, "height": 720, "frame": false, "show": false, "title": name});
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  Menu.setApplicationMenu(menu);
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  appIcon.on('click', function clicked (e, bounds) {
    console.log(bounds);
    console.log(mainWindow.isVisible());
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.setPosition(10 + bounds.x - mainWindow.getSize()[0] / 2, bounds.y);
      mainWindow.show();
    }
  });
});
