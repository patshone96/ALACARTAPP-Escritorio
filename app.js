const {app, BrowserWindow, dialog} = require('electron')


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

// load the html file into the window
//win.loadFile('index.html')
win.loadFile('index.html')
win.setMenu(null); 

//show the DevTools
win.webContents.openDevTools()
}

//app.on is the function in charge of launching the windows
app.on('ready', createWindow)


