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

const url = require('url');
const { dialog, app, BrowserWindow, Menu, ipcMain, globalShortcut, screen } = electron;
var readers = {}



var newReader = async (file, cb) => {
    var hashedPath = crypto.createHash("sha256").update(file).digest("hex");

    if (typeof readers[hashedPath] != 'undefined') {
        return
    }
    readers[hashedPath] = { follower: follower, hashedPath: hashedPath, path: file, line: new events.EventEmitter() }

    var follower = follow(file);
    follower.on('line', function (filename, line) {
        //console.log('follower new line ', line)
        //cb(line)
        readers[hashedPath].line.emit('change', line);
    });
    follower.on('error', (err) => {
        console.log('follower error = ', err)
        delete readers[hashedPath]
        return
    })
    follower.on('success', (err) => {
        console.log('follower success = ', err)

        if (typeof err != 'undefined') {


            testWindow(file)
        }
    })
    follower.on('close', (err) => {
        console.log('follower close = ', err)

        return
    })
}

function testWindow(file) {
    var hashedPath = crypto.createHash("sha256").update(file).digest("hex");

    newWindow = new BrowserWindow({
        width: 1200,
        height: 700,
        title: 'Live Reading File - ' + file,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    newWindow.loadURL(url.format({
        pathname: 'localhost:3000/log',
        protocol: 'http:',
        slashes: true
    }));

    newWindow.webContents.on('did-finish-load', () => {
        readers[hashedPath].line.on('change', (data) => {
            newWindow.send('log_msg', data);
        });
        newWindow.webContents.openDevTools()
    })

    // Quit app when closed
    newWindow.on('closed', function () {
    });
}


var fileChecker = () => {
    var files = []
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_2.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_3.log`))
    files.push(path.join(process.env.LOCALAPPDATA, 'FactoryGame/Saved/Logs', `FactoryGame_4.log`))



    ['new-file-2', 'new-file-3', '**/other-file*']

    const watcher = chokidar.watch(files, {
        persistent: true,
        usePolling: false,
        interval: 1000
    });

    watcher.on('add', path => console.log(`File ${path} has been added`))
    watcher.on('change', path => {
        console.log('File Changed!')
        var hashedPath = crypto.createHash("sha256").update(path).digest("hex");
        if (typeof readers[hashedPath] == 'undefined') {
            console.log('New Reader Call!!')
            watcher.unwatch(path);
            newReader(path)
        }
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

var lastLineStream = (file, cb) => {

    fs.watch(file, (eventType, filename) => {
        readLastLines.read(file, 1).then((line) => {
            if (typeof line == 'undefined') {
                return
            }
            console.log("The type of change was:", eventType);
            console.log("change was:", line);

            findFilter(['SatisfactoryModLoader', 'hbbt'], line).then((isIN) => {
                if (isIN) {
                    //console.log(line)
                    cb(line)
                }
            })
        });
    });
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
    lastLineStream,
    findFilter,
    getLastLines,
    newReader,
    fileChecker
};