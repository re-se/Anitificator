var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');

require('crash-reporter').start();

var mainWindow = null;

var showSetting = function() {
  mainWindow.webContents.send('menu-clicked', '');
}

var menu = Menu.buildFromTemplate([
  {
    label: 'Anitificator',
    submenu: [
      {label: 'Preferences...', accelerator: 'CmdOrCtrl+,', click: showSetting},
      {label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: app.quit}
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
  }
]);


app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', function() {
  // ブラウザ(Chromium)の起動, 初期画面のロード

  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  Menu.setApplicationMenu(menu);
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
