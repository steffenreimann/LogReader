var express = require('express');
var app = express();
var httpServer = require("http").createServer(app);
var io = require('socket.io')(httpServer);
var fs = require('fs');
app.use(express.static(__dirname + '/public'));
const getLastLine = require('./fileTools.js').getLastLine
var follow = require('text-file-follower');
const { callbackify } = require('util');
var path = require('path');
const { exit } = require('process');


var interval
var lineTemp
var lastLineData
var doConsoleLogging = true
var doFullConsoleLogging = false
var updateRate = 5000
var filePath
var port = 3000




checkFGLogFile(function () {
    lastLine(function (line) {
        lastLineData = line

        var time = getItem(line);
        var id = getItem(time.rest);
        if (getType(id.rest, 'Log file closed')) {
            // console.log('file not startet')
            log('File Not Started', true, true)
            interval = setInterval(lookForFileUpdate, updateRate);
        } else {
            liveReader(filePath)
        }
    })
})


fs.readFile(__dirname + '/views/line.ejs', function (err, data) {
    if (err) {
        throw err;
    }
    lineTemp = data.toString()
});

app.get('/', function (req, res) {
    // console.log('app.get / ')
    log('app get / ', false, true)
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/microTemplates', function (req, res) {
    console.log(req.body)
    var body = JSON.parse(req.body.data)
    //console.log(body)
    res.sendFile(__dirname + '/views/' + body.file)
    //res.end('pages/microTemplates/' + body.file)
    return
});


io.on('connection', function (socket) {
    console.log('connection')
    // socket.emit('data', 'welcome');

    // socket.emit('newLine', lineTemp, { data: 'welcome' });


    socket.on('ue4', function (data) {

        console.log('ue4Test');

        socket.emit('ue4Test', data);

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

        if (doConsoleLogging) {
            if (doFullConsoleLogging) {
                //  console.log(line)
            } else {

                if (getType(id.rest, 'SatisfactoryModLoader')) {
                    // console.log(id.rest)
                }
            }
        }

        if (!isFileEnded && getType(id.rest, 'Log file closed')) {
            isFileEnded = true
            console.log('Satisfactory log file has been closed and a new one is automatically searched for')
            log('Satisfactory log file has been closed and a new one is automatically searched for', true, true)
            interval = setInterval(lookForFileUpdate, updateRate);
            return
        }
    });
}

function lookForFileUpdate() {
    var d = new Date();
    var n = d.toLocaleString();
    // console.log('look for new log file ', n);
    log('look for new log file ' + n, true, true)
    //const fileName = 'C:/Users/Steffen/AppData/Local/FactoryGame/Saved/Logs/FactoryGame.log'
    lastLine(function (newLastLine) {

        var time = getItem(newLastLine);
        var id = getItem(time.rest);

        if (!getType(id.rest, 'Log file closed')) {
            //console.log('New Log File Started')
            log('New Log File Started', true, true)
            isFileEnded = false
            liveReader(filePath)
            clearInterval(interval)
        }
    })
}


function log(data, sEmit, terminal) {
    if (sEmit) {
        io.emit('newLine', lineTemp, { data: data });
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

function lastLine(callback) {
    getLastLine(filePath, 1)
        .then((lastLine) => {
            //console.log(lastLine)
            callback(lastLine)
        })
        .catch((err) => {
            console.error(err)
            callback(err)
        })
}

function checkFGLogFile(callback) {
    var LogPath
    //console.log(process.env)

    LogPath = path.join(process.env.LOCALAPPDATA, 'FactoryGame', 'Saved', 'Logs', 'FactoryGame.log')

    // console.log(LogPath)
    log(LogPath, true, true)
    if (fs.existsSync(LogPath)) {
        //file exists
        filePath = LogPath
        callback(LogPath)
    } else {
        console.log('Satisfactory log file could not be found')
        process.exit(1)
    }
}


httpServer.listen(port);
console.log('Log Server Running on http://localhost:' + port)
