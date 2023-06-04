const {app, BrowserWindow, dialog, ipcMain} = require('electron')
require('@electron/remote/main').initialize()

// main.js

// Create the browser window
function createWindow(){
let win= new BrowserWindow({
width: 500,
height: 800,
resizable: false,
icon: __dirname + "/A_ICON.png",
webPreferences: {
nodeIntegration: true,
      contextIsolation: false,
}
})

ipcMain.on('data-channel', (event, data) => {
      // Create a new BrowserWindow with the received data
      const newWindow = new BrowserWindow({
        // window options
      });
  
      // Load the HTML file for the new window
      newWindow.loadFile('index.html');

      newWindow.webContents.openDevTools();
  
      // You can also send the data to the new window using IPC
      newWindow.webContents.on('did-finish-load', () => {
        newWindow.webContents.send('new-data-channel', data);
      });
    });






require("@electron/remote/main").enable(win.webContents)

// load the html file into the window
//win.loadFile('sign.html')
win.loadFile('index.html')
win.setMenu(null); 

//show the DevTools
win.webContents.openDevTools()
}

//app.on is the function in charge of launching the windows
app.on('ready', createWindow)


