// fileTools.js
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');
const readLastLines = require('read-last-lines');
var follow = require('text-file-follower');
const crypto = require('crypto');
const chokidar = require('chokidar');
var path = require('path')
var events = require('events');
const electron = require('electron');
const { exec, spawn } = require('child-process-async');
const url = require('url');
const ut = require('./utils.js')



var watcher
const { dialog, app, BrowserWindow, Menu, ipcMain, globalShortcut, screen } = electron;
var readers = {}
var instances = {}


var newReader = async (file, cb) => {
    var hashedPath = crypto.createHash("sha256").update(file).digest("hex");
    if (typeof readers[hashedPath] != 'undefined') {
        if (typeof readers[hashedPath].window != 'undefined') {
            readers[hashedPath].window.close()
        }
    }

    readers[hashedPath] = { follower: follower, hashedPath: hashedPath, path: file, line: new events.EventEmitter(), window: undefined }

    var follower = follow(file);
    follower.on('line', function (filename, line) {
        //console.log('follower new line ', line)
        //cb(line)
        if (line.search('Log file closed') != -1) {
            console.log('Log file closed watch file now')
            watcher.add(file);
        }
        if (readers[hashedPath].window != 'undefined') {
            readers[hashedPath].line.emit('change', line);
        }
    });
    follower.on('error', (err) => {
        console.log('follower error = ', err)
        delete readers[hashedPath]
        return
    })
    follower.on('success', (err) => {
        console.log('follower success = ', err)

        if (typeof err != 'undefined') {

            makeWindow(file)
        }
    })
    follower.on('close', (err) => {
        console.log('follower close = ', err)

        return
    })
}


//id: { window: '', clientProcess: '', LogPath: '' }

var startGame = async (data) => {

    var id = ut.UUID()
    var ins = ''
    if (ut.count(instances) != 0) {
        ins = `_${ut.count(instances) + 1}`
    }
    var logPath = path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame${ins}.log`)


    const child_process = spawn(data.filePath, data.attr, {});
    // do whatever you want with `child` here - it's a ChildProcess instance just
    // with promise-friendly `.then()` & `.catch()` functions added to it!
    //child_process.stdin.write(...);
    // child_process.stdout.on('data', (data) => {
    //     cb(data.toString())
    //     // console.log('Pipe Data', data.toString())
    // });

    child_process.stderr.on('data', (data) => {
        cb(data)
        console.log(data)
    })
    child_process.stderr.on('data', (data) => {
        cb(data)
        console.log(data)
    })
    child_process.on('exit', function (code) {
        console.log('child process exited with code ' + code);

        //console.log('Verbleibende Instanzen ', instances);
        if (instances[id].WindowOpen) {
            newWindow.setTitle('File Closed! - ' + logPath)
        }
        delete instances[id];
        // instancesChanged().then((data) => {
        //     mainWindow.webContents.send('instancesChanged', data);
        // })
        return
    });

    instances[id] = { id: id, process: child_process, LogPath: logPath, data: data, WindowOpen: false }

    //console.log(instances)


    // instancesChanged().then((data) => {
    //     mainWindow.webContents.send('instancesChanged', data);
    // })

}

var makeWindow = (file) => {
    var hashedPath = crypto.createHash("sha256").update(file).digest("hex");
    //readers[hashedPath].window
    console.log(typeof readers[hashedPath].window);
    if (typeof readers[hashedPath].window == 'object') {
        //readers[hashedPath].window.close()
        return
    }

    readers[hashedPath].window = new BrowserWindow({
        width: 1200,
        height: 700,
        title: 'Live Reading File - ' + file,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    readers[hashedPath].window.loadURL(url.format({
        pathname: 'localhost:3000/log',
        protocol: 'http:',
        slashes: true
    }));

    readers[hashedPath].window.webContents.on('did-finish-load', () => {
        readers[hashedPath].line.on('change', (data) => {
            if (typeof readers[hashedPath].window != 'undefined') {
                readers[hashedPath].window.send('log_msg', data);
            }
        });
        readers[hashedPath].window.webContents.openDevTools()
    })

    // Quit app when closed
    readers[hashedPath].window.on('closed', function () {
        readers[hashedPath].window = undefined
        return
    });
}

var fileChecker = () => {
    var files = []
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_2.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_3.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_4.log`))



    watcher = chokidar.watch(files, {
        persistent: true,
        usePolling: false,
        interval: 1000
    });

    watcher.on('add', path => console.log(`File ${path} has been added`))
    watcher.on('change', path => {
        console.log('File Changed!')


        console.log('New Reader Call!!')
        watcher.unwatch(path);
        newReader(path)

    })
    watcher.on('unlink', path => console.log(`File ${path} has been removed`));


}

var getLastLines = (fileName, lines) => {

    let inStream = fs.createReadStream(fileName);
    let outStream = new Stream;
    return new Promise((resolve, reject) => {
        var i = 0
        var returnArr = []
        let rl = readline.createInterface(inStream, outStream);

        let lastLine = '';
        rl.on('line', function (line) {

            //findFilter(['SatisfactoryModLoader', 'hbbt'], line).then((isIN) => { })


            if (returnArr.length > lines) {
                returnArr.shift()
            }

            returnArr.push(line)
            lastLine = line;



        });

        rl.on('error', reject)

        rl.on('close', function () {
            resolve(returnArr.reverse())
        });
    })
}

var findFilter = (filter, data) => {
    return new Promise((resolve, reject) => {
        var a = data.toUpperCase();
        var i = 0
        filter.forEach(element => {
            i++
            var b = element.toUpperCase();
            var n = a.search(b);
            if (n != -1) {
                //console.log('findfilter true', data);
                resolve(true)
                return
            }
            if (filter.length <= i + 1) {
                // console.log('findfilter false', data);
                resolve(false)
                return
            }
        });
    })
}





module.exports = {
    findFilter,
    getLastLines,
    newReader,
    fileChecker,
    makeWindow,
    startGame
};