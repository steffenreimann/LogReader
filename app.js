const electron = require('electron');
const path = require('path');
const url = require('url');

// SET ENV
process.env.NODE_ENV = 'development';
const { app, BrowserWindow, Menu, ipcMain } = electron;


app.on('ready', function () {
    // Create new window
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 500,
        title: 'Electon Example'
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'public/index.html'),
        protocol: 'file:',
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
const getLastLine = require('./fileTools.js').getLastLine
var follow = require('text-file-follower');
const { callbackify } = require('util');

const { exit } = require('process');

const config = require('./config.js').config

var interval
var lineTemp
var lastLineData



config.updateRate
config.port

checkFGLogFile(function () {
    lastLine(function (line) {
        lastLineData = line

        var time = getItem(line);
        var id = getItem(time.rest);
        if (getType(id.rest, 'Log file closed')) {
            // //console.log('file not startet')
            log('File Not Started', true, true)
            interval = setInterval(lookForFileUpdate, config.updateRate);
        } else {
            liveReader(config.path)
        }
    })
})


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
});


var isFileEnded = false
function liveReader(file) {
    var follower = follow(file);
    follower.on('line', function (filename, line) {
        var time = getItem(line);
        var id = getItem(time.rest);

        if (getType(id.rest, 'SatisfactoryModLoader')) {
            //io.emit('newLine', lineTemp, { data: line });
            log(line, true, true)
        }

        if (!isFileEnded && getType(id.rest, 'Log file closed')) {
            isFileEnded = true
            //console.log('Satisfactory log file has been closed and a new one is automatically searched for')
            log('Satisfactory log file has been closed and a new one is automatically searched for', true, true)
            interval = setInterval(lookForFileUpdate, config.updateRate);
            return
        }
    });
}

function lookForFileUpdate() {
    var d = new Date();
    var n = d.toLocaleString();
    // //console.log('look for new log file ', n);
    log('look for new log file ' + n, true, true)
    //const fileName = 'C:/Users/Steffen/AppData/Local/FactoryGame/Saved/Logs/FactoryGame.log'
    lastLine(function (newLastLine) {

        var time = getItem(newLastLine);
        var id = getItem(time.rest);

        if (!getType(id.rest, 'Log file closed')) {
            ////console.log('New Log File Started')
            log('New Log File Started', true, true)
            isFileEnded = false
            liveReader(config.path)
            clearInterval(interval)
        }
    })
}


function log(data, sEmit, terminal) {
    if (sEmit) {
        io.emit('newLine', lineTemp, { data: data });
    }
    if (terminal) {
        //console.log(data);
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

function lastLine(callback) {
    getLastLine(config.path, 1)
        .then((lastLine) => {
            // //console.log(lastLine)
            callback(lastLine)
        })
        .catch((err) => {
            //console.error(err)
            callback(err)
        })
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


httpServer.listen(config.port);
//console.log('Log Server Running on http://localhost:' + config.port)
