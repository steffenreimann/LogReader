const electron = require('electron');
const path = require('path');
const url = require('url');

// SET ENV
process.env.NODE_ENV = 'development';
const { dialog, app, Menu, BrowserWindow, Tray, ipcMain, globalShortcut, screen, nativeTheme, webContents } = electron;


app.on('ready', function () {

    nativeTheme.themeSource = 'dark'
    const displays = screen.getAllDisplays()
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    })

    console.log(displays)
    console.log(process.env.LOCALAPPDATA)

    // Create new window
    mainWindow = new BrowserWindow({
        alwaysOnTop: false,
        width: 1500,
        height: 1500,
        title: 'LogReader',
        transparent: false,
        frame: true,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'mainpreload.js')
        },

    });

    mainWindow.loadURL(url.format({
        pathname: 'localhost:3000',
        protocol: 'http:',
        slashes: true,
        title: 'LogReader'
    }));

    // Quit app when closed
    mainWindow.on('closed', function () {
        app.exit(0);
    });

    let tray = null;
    mainWindow.on('minimize', function (event) {
        event.preventDefault();
        mainWindow.hide();
        tray = createTray();
    });

    mainWindow.on('restore', function (event) {
        mainWindow.show();
        tray.destroy();
    });
    // Build menu from template
    // const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    //Menu.setApplicationMenu(mainMenu);
    mainWindow.toggleDevTools();
    mainWindow.setOpacity(0.9)
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

function createTray() {
    let appIcon = new Tray(path.join(__dirname, "cloud_fun.ico"));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.exit();
            }
        }
    ]);

    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });
    appIcon.setToolTip('LogReader');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

var KeyRefs = {}
app.whenReady().then(() => {
    for (let index = 0; index < 10; index++) {
        // Register a 'CommandOrControl+X' shortcut listener.
        KeyRefs[index] = globalShortcut.register(`CmdOrCtrl+Alt+Shift+${index}`, () => {
            console.log('is pressed ', index)
            ft.startMultiGames(index)
        })

        if (!KeyRefs[index]) {
            console.log('registration failed')
        }
    }

})

app.on('will-quit', () => {
    // Unregister a shortcut.
    //globalShortcut.unregister('CommandOrControl+X')

    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})




var express = require('express');
var expressapp = express();
var httpServer = require("http").createServer(expressapp);
var io = require('socket.io')(httpServer);
var fs = require('fs');
expressapp.use(express.static(__dirname + '/public'));
const ft = require('./fileTools.js')
//const st = require('./settingsTool.js')
const settings = require('easy-nodejs-app-settings')
var follow = require('text-file-follower');
//var smmapi = require('satisfactory-mod-manager-api');
const { callbackify } = require('util');


const { exit } = require('process');

const config = require('./config.js').config

const { exec, spawn } = require('child-process-async');

//var { getProfiles, getInstalls, isDebug, setDebug } = require('satisfactory-mod-manager-api')



config.updateRate
config.port


var changeSettings = { 'dudu': 'junge wie dumm', 'test.one': 'du loster dude', 'test.two': 'jaaa moin', 'lol': { junge: 'und gewhts ? ' } }



settings.init('LogReader').then((resolveData) => {
    console.log('Settings File Succsessfull Init.')
    //Assign the event handler to an event:
    settings.ev.on('changed', (data) => {
        console.log('Event on changed = ', data)
        var windows = webContents.getAllWebContents()
        windows.forEach(win => {
            //console.log(win);
            win.send('settingsChanged', data);
        });
    });
    //console.log(resolveData)

    //settings.setSettings({ App: 'Diese App ist nice', dudu: 'JONGE', test: { one: 'hallo', two: 'welt' } }).then((resolveData) => {
    //    settings.setKey(changeSettings).then((data) => {
    //        console.log('Change settings by keys = ', data)
    //        settings.getKey('lol.junge').then((data) => {
    //            console.log('get settings by key = ', data)
    //        }, (err) => { console.log('get settings by key error = ', err) })
    //    }, () => { })
    //}, (rejectData) => { console.log('Cant write Settings File!!! Error= ', rejectData) })


}, (rejectData) => { console.log('Cant Init Settings File System!!! Error= ', rejectData) })





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



ipcMain.handle('openDialog', async () => {
    var files = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] })
    return files.filePaths[0]
})


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
ipcMain.handle('transformWindow', async (event, data) => {
    return new Promise((resolve, reject) => {
        switch (data) {
            case 'maximize':
                if (!mainWindow.isMaximized()) {
                    mainWindow.maximize();
                } else {
                    mainWindow.unmaximize();
                }
                resolve()
                break;
            case 'minimize':
                mainWindow.minimize();
                resolve()
                break
            case 'close':
                mainWindow.close()
                resolve()
                break
            default:
                resolve()
                break;
        }

    })
})

ipcMain.handle('getSMMData', async (event, data) => {
    return new Promise((resolve, reject) => {

        //getSMMData().then((data) => {
        //    console.log(data)
        //    resolve(data)
        //})
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
ipcMain.handle('setAlwaysOnTop', async (event, data) => {
    mainWindow.setAlwaysOnTop(data)
})


ipcMain.handle('addWatchedFiles', async (event, file) => {
    console.log('addWatchedFiles ', file)

    var key = await settings.getKey('WatchFiles')

    key[UUID()] = { path: file, autoWindowOpen: true, autoScroll: true, watch: true }

    await settings.setKey({ "WatchFiles": key })

    ft.watcher.add(file);

})

ipcMain.handle('loadSettings', async () => {
    return await settings.getSettings()
})




ipcMain.handle('deleteFile', async (event, id) => {
    var key = await settings.getKey('WatchFiles')
    console.log('deleteFile = ', key[id]);
    delete key[id];
    await settings.setKey({ "WatchFiles": key })
    return 1
})

ipcMain.handle('toggleWatch', async (event, id) => {
    var key = await settings.getKey('WatchFiles')
    console.log(id);
    console.log(key);
    console.log(key[id]);
    key[id].watch = !key[id].watch
    await settings.setKey({ "WatchFiles": key })

    console.log(ft.watcher.getWatched())

    if (key[id].watch) {
        ft.watcher.add(key[id].path);
    } else {
        await ft.watcher.unwatch(key[id].path);
    }

    return key[id].watch
})

ipcMain.handle('changeFilePath', async (event, id, file) => {
    var key = await settings.getKey('WatchFiles')
    await ft.watcher.unwatch(key[id].path);
    key[id].path = file
    await settings.setKey({ "WatchFiles": key })
    ft.watcher.add(key[id].path);
    return key[id]
})

ipcMain.handle('openRAW', async (event, id) => {
    var key = await settings.getKey('WatchFiles')

    //var path = settings.data.RAWexecPath.replace(/ /g, "\\ ");
    //var cmd = `start "${settings.data.RAWexecPath}" "${key[id].path}"`
    //var cmd = `"${settings.data.RAWexecPath}" "${key[id].path}"`
    //console.log('cmd', cmd);

    spawn(settings.data.RAWexecPath, [`${key[id].path}`]);

    //script = exec(cmd);
    // script = exec('start', "${settings.data.RAWexecPath}", "${key[id].path}");
    //script = exec('start ' + settings.data.RAWexecPath + ' ' + key[id].path);
    return 1
})

ipcMain.handle('changeRAWexecPath', async (event, path) => {
    await settings.setKey({ "RAWexecPath": path })
    return 1
})

async function getSMMData() {
    var installs = await getInstalls()
    var profiles = getProfiles()
    setDebug(true)
    //console.log(isDebug())
    //console.log(installs)
    //console.log(profiles)
    var data = { installs: installs.installs, profiles: profiles, isDebug: isDebug() }
    return data
}



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




httpServer.listen(config.port);
console.log('Log Server Running on http://localhost:' + config.port)

ft.fileChecker()
// getLastLines(LogPath, len).then((lastLines) => {
// //console.log(lastLines[0])
// })

