const electron = require('electron');
const path = require('path');
const url = require('url');

// SET ENV
process.env.NODE_ENV = 'development';
const { dialog, app, BrowserWindow, Menu, ipcMain, globalShortcut, screen } = electron;


app.on('ready', function () {

    const displays = screen.getAllDisplays()
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    })

    console.log(displays)
    console.log(process.env.LOCALAPPDATA)

    // Create new window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 500,
        title: 'Electon Example',
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'mainpreload.js')
        }
    });

    mainWindow.loadURL(url.format({
        pathname: 'localhost:3000',
        protocol: 'http:',
        slashes: true,
        title: 'Electron Example'
    }));

    // Quit app when closed
    mainWindow.on('closed', function () {
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);


});


app.on('will-quit', () => {


})

// Create menu template
const mainMenuTemplate = [
    // Each object is a dropdown
    {
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function () { app.quit(); } }
        ]
    }, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Test Function Call", accelerator: "CmdOrCtrl+S", click: function () { testFunction(); } },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]
    }
];

// If OSX, add empty object to menu
if (process.platform == 'darwin') {
    // mainMenuTemplate.unshift({});
}


// Add developer tools option if in dev
if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [

            {
                role: 'reload'
            },
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
        ]
    });
}


// This is the Test Function that you can call from Menu
var i = 0
function testFunction(params) {
    i++
    //console.log('You Click in Menu the Test Button i = ', i);
}







var express = require('express');
var expressapp = express();
var httpServer = require("http").createServer(expressapp);
var io = require('socket.io')(httpServer);
var fs = require('fs');
expressapp.use(express.static(__dirname + '/public'));
const ft = require('./fileTools.js')
var follow = require('text-file-follower');
//var smmapi = require('satisfactory-mod-manager-api');
const { callbackify } = require('util');


const { exit } = require('process');

const config = require('./config.js').config

const { exec, spawn } = require('child-process-async');

//var SMMAPI = require('satisfactory-mod-manager-api')

//console.log(SMMAPI)


config.updateRate
config.port





fs.readFile(__dirname + '/views/line.ejs', function (err, data) {
    if (err) {
        throw err;
    }
    lineTemp = data.toString()
});

expressapp.get('/', function (req, res) {
    // //console.log('app.get / ')
    log('app get / ', false, true)
    res.sendFile(__dirname + '/public/index.html');
});
expressapp.get('/log', function (req, res) {
    // //console.log('app.get / ')
    //log('app get / ', false, true)
    res.sendFile(__dirname + '/public/log.html');
});

expressapp.post('/microTemplates', function (req, res) {
    //console.log(req.body)
    var body = JSON.parse(req.body.data)
    ////console.log(body)
    res.sendFile(__dirname + '/views/' + body.file)
    //res.end('pages/microTemplates/' + body.file)
    return
});

expressapp.get('/download', function (req, res) {
    res.download(config.path); // Set disposition and send it.
});

expressapp.get('/showRaw', function (req, res) {
    res.sendFile(config.path);
});

io.on('connection', function (socket) {
    //console.log('connection')
    // socket.emit('data', 'welcome');

    // socket.emit('newLine', lineTemp, { data: 'welcome' });


    socket.on('ue4', function (data) {

        //console.log('ue4Test');

        socket.emit('ue4Test', data);

    })
    socket.on('getConfig', function (callback) {

        //console.log('getConfig');

        callback(config)

    })
    socket.on('newWindow', function (data) {

        //console.log('getConfig');
        ft.startGame(data)

    })


    socket.on('getHTMLView', function (data, callback) {

        fs.readFile(__dirname + '/views/' + data + '.ejs', function (err, data) {
            if (err) {
                throw err;
            }
            callback(data.toString())

        });
    })

    socket.on('openDialog', function (cb) {

        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile']
        }).then(result => {
            console.log(result)

            result.ext = path.extname(result.filePaths[0])

            cb(result)
        }).catch(err => {
            console.log(err)
        })
    })
});
var filter = ["hbbt", "SatisfactoryModLoader"]

function FindFilter(data, callback) {
    var a = data.toUpperCase();
    var i = 0
    filter.forEach(element => {
        i++
        var b = element.toUpperCase();
        var n = a.search(b);
        if (n != -1) {
            callback(true)
            return
        }
        if (filter.length <= i + 1) {
            callback(false)
            return
        }
    });
}






function count(obj) { return Object.keys(obj).length; }

ipcMain.on('newLogReader', (event, data) => {
    console.log('import server side received ', data);
    startgame(data, (log) => {
        FindFilter(log, (aa) => {
            if (aa) {
                event.sender.send('log_msg', log);
            }

        })

    })

});

async function instancesChanged() {
    var newArr = []
    var newObj = {}
    Object.keys(instances).forEach(function (key) {
        console.log('Key : ' + key + ', Value : ' + instances[key].LogPath)
        newArr.push({ id: key, LogPath: instances[key].LogPath, data: instances[key].data, WindowOpen: instances[key].WindowOpen })
        newObj[key] = { id: key, LogPath: instances[key].LogPath, data: instances[key].data, WindowOpen: instances[key].WindowOpen }
    })
    return newObj
    return newArr;
}

ipcMain.handle('getInstances', async (event, arg) => {
    console.log('getInstances = ', instances)
    return instances
    return instancesChanged();
})

ipcMain.handle('quitInstance', async (event, id) => {
    console.log('quitInstance = ', id)
    instances[id].window.close();
    instances[id].process.kill('SIGINT');
    return instances
    return instancesChanged();
})

ipcMain.handle('getHTMLView', async (event, data) => {
    return new Promise((resolve, reject) => {
        fs.readFile(__dirname + '/views/' + data + '.ejs', function (err, data) {
            if (err) {
                throw err;
            }
            resolve(data.toString())
        });
    })
})
ipcMain.handle('windowShow', async (event, data) => {
    return new Promise((resolve, reject) => {
        instances[data].window.show()
        resolve()
    })
})

ipcMain.handle('reopenWindow', async (event, id) => {
    if (typeof instances[id] == 'undefined') {
        return false
    }
    instances[id].window = new BrowserWindow({
        width: 1200,
        height: 700,
        title: 'Live Reading File - ' + instances[id].LogPath,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    instances[id].window.loadURL(url.format({
        pathname: 'localhost:3000/log',
        protocol: 'http:',
        slashes: true
    }));

    // Quit app when closed
    instances[id].window.on('closed', function () {
        if (typeof instances[id] != 'undefined') {
            instances[id].WindowOpen = false
        }

        instancesChanged().then((data) => {
            mainWindow.webContents.send('instancesChanged', data);
        })

    });
    instances[id].WindowOpen = true
    instancesChanged().then((data) => {
        mainWindow.webContents.send('instancesChanged', data);
    })



    instances[id].window.webContents.on('did-finish-load', () => {
        //newWindow.webContents.openDevTools()
        //newWindow.webContents.send('newWindowData', data);
        ft.getLastLines(instances[id].LogPath, 10).then((lastLines) => {
            console.log(lastLines)
            lastLines.reverse().forEach(element => {
                instances[id].window.send('log_msg', element);
            });
        })
    })
})






function UUID() {
    function ff(s) {
        var pt = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + pt.substr(0, 4) + "-" + pt.substr(4, 4) : pt;
    }
    return ff() + ff(true) + ff(true) + ff();
}



var isFileEnded = false
function liveReader(file, cb) {
    console.log('New File Reader ', file)
    var follower = follow(file);
    console.log('New follower = ', follower)
    follower.on('line', function (filename, line) {

        var time = getItem(line);
        var id = getItem(time.rest);
        //console.log(line)
        if (getType(id.rest, 'SatisfactoryModLoader')) {
            //console.log(line)
            //io.emit('newLine', lineTemp, { data: line });
            //log(line, true, false)
            cb(line)
        }

        if (!isFileEnded && getType(id.rest, 'Log file closed')) {
            cb('')
            //console.log('Satisfactory log file has been closed and a new one is automatically searched for')
            log('Satisfactory log file has been closed and a new one is automatically searched for', true, true)
            //interval = setInterval(lookForFileUpdate, config.updateRate);
            return
        }
    });
    follower.on('error', (err) => {
        console.log('follower error = ', err)
    })
}

function isFileNew(file, cb) {
    var d = new Date();
    var n = d.toLocaleString();
    // //console.log('look for new log file ', n);
    log('look for new log file ' + n, true, true)
    //const fileName = 'C:/Users/Steffen/AppData/Local/FactoryGame/Saved/Logs/FactoryGame.log'

    ft.getLastLines(file, 1).then((lastLines) => {
        // //console.log(lastLine)


        var time = getItem(lastLines[0]);
        var id = getItem(time.rest);

        if (!getType(id.rest, 'Log file closed')) {
            ////console.log('New Log File Started')
            log('New Log File Started', true, true)
            cb(true)
        } else {
            cb(false)
        }
    })
}



function log(data, sEmit, terminal) {

    if (sEmit) {
        io.emit('newLine', data);
    }
    if (terminal) {
        console.log(data);
    }
}

function getItem(str) {
    var pos1Item1 = str.indexOf("[");
    var pos2Item2 = str.indexOf("]");
    var val = str.substring(pos1Item1, pos2Item2 + 1);
    var rest = str.slice(pos2Item2 + 1);
    var ret = { val: val, rest: rest }
    return ret
}

function getType(str, type) {
    var n = str.search(type);
    if (n != -1) {
        return true
    } else {
        return false
    }
}



function checkFGLogFile(callback) {
    ////console.log(process.env)

    log(config.path, true, true)
    if (fs.existsSync(config.path)) {
        //file exists
        callback(config.path)
    } else {
        //console.log('Satisfactory log file could not be found')
        process.exit(1)
    }
}


function openDialog(cb) {

}



httpServer.listen(config.port);
console.log('Log Server Running on http://localhost:' + config.port)

ft.fileChecker()
 // getLastLines(LogPath, len).then((lastLines) => {
        // //console.log(lastLines[0])
   // })