var express = require('express');
var app = express();
var httpServer = require("http").createServer(app);
var io = require('socket.io')(httpServer);
var fs = require('fs');
app.use(express.static(__dirname + '/public'));





const getLastLine = require('./fileTools.js').getLastLine

const logToJSON = require('./parseLog.js').logToJSON

const con = require('./saveConf.js')



var follow = require('text-file-follower');

const { callbackify } = require('util');

const { exit } = require('process');

const config = require('./config.js').config



var interval
var lineTemp
var lastLineData
var searchStr = 'SatisfactoryModLoader'
var types = []
var settings
config.updateRate
config.port



con.read(__dirname + '/settings.json', function (data) {
    settings = data


    settings.paths.forEach(file => {
        checkFGLogFile(file.path, function () {
            lastLine(function (line) {
                lastLineData = line

                var time = getItem(line);
                var id = getItem(time.rest);
                if (getType(id.rest, 'Log file closed')) {
                    // console.log('file not startet')
                    log({ raw: 'File Not Started' }, false)
                    interval = setInterval(lookForFileUpdate, config.updateRate);
                } else {
                    liveReader(config.path)
                }
            })
        })
    });

})

fs.readFile(__dirname + '/views/line.ejs', function (err, data) {
    if (err) {
        throw err;
    }
    lineTemp = data.toString()
});

app.get('/', function (req, res) {
    // console.log('app.get / ')
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

app.get('/download', function (req, res) {
    res.download(config.path); // Set disposition and send it.
});

app.get('/RawLog', function (req, res) {
    res.sendFile(config.path);
});

io.on('connection', function (socket) {
    console.log('connection')
    // socket.emit('data', 'welcome');

    // socket.emit('newLine', lineTemp, { data: 'welcome' });


    socket.on('setSearch', function (data, callback) {

        console.log('setSearch ', data);
        searchStr = data
        callback(searchStr)
        //socket.emit('ue4Test', data);
    })
    socket.on('getConfig', function (callback) {

        console.log('getConfig');

        callback(config)

    })
    socket.on('getSettings', function (callback) {
        console.log('getFilter');



        fs.readFile(__dirname + '/views/filter.ejs', function (err, FilterHTML) {
            if (err) {
                throw err;
            }
            fs.readFile(__dirname + '/views/types.ejs', function (err, TypesHTML) {
                if (err) {
                    throw err;
                }
                fs.readFile(__dirname + '/views/paths.ejs', function (err, PathsHTML) {
                    if (err) {
                        throw err;
                    }
                    con.read(__dirname + '/settings.json', function (settings) {
                        callback(settings, types, FilterHTML.toString(), TypesHTML.toString(), PathsHTML.toString())
                    })

                });
            });
        });
    })
    socket.on('getTypes', function (callback) {
        console.log('getTypes');
        callback(types)
    })
    socket.on('addFilter', function (filter, callback) {
        console.log('addFilter');
        callback(addFilter(filter))
    })
    socket.on('removeFilter', function (filter, callback) {
        console.log('removeFilter');
        callback(removeFilter(filter))
    })
    socket.on('addLogFile', function (paths, callback) {
        console.log('addLogFile');
        callback(addLogFile(paths))
    })
    socket.on('removeLogFile', function (paths, callback) {
        console.log('removeLogFile');
        callback(removeLogFile(paths))
    })
    socket.on('changeShow', function (displayName, show, callback) {
        console.log('changeShow');
        callback(changeShow(displayName, show, socket.id))
    })
});


function changeShow(displayName, show, socketID) {

    findByDisplayName(displayName, settings.paths, function (index, element) {
        console.log(index)
        console.log(element)

        element.sendIDs = toggleShowing(socketID, element.sendIDs)

        setPathSettings(index, element)

    })

}

function toggleShowing(socketID, array) {
    found = array.indexOf(socketID)
    if (found != -1) {
        console.log('found ID')
        array.splice(found, 1);
        return array
    } else {
        console.log('dont found id')
        array.push(socketID)
        return array
    }
}

function setPathSettings(index, path) {
    console.log(settings)
    settings.paths[index] = path
    console.log(settings)
    con.write(__dirname + '/settings.json', settings);
    return true
}


function findByDisplayName(displayName, array, callback) {
    var i = 0
    array.forEach(element => {
        console.log(element.displayName, '  =   ', displayName)
        if (element.displayName == displayName) {
            callback(i, element)
            return
        }
        i++
    });

    return
}

function findByPath(path, array, callback) {
    var i = 0
    array.forEach(element => {
        if (element.path == path) {
            callback(i, element)
            return
        }
        i++
    });
}

function liveReader(file) {
    var follower = follow(file);
    follower.on('line', function (filename, line) {
        var time = getItem(line);
        var id = getItem(time.rest);


        //io.emit('newLine', lineTemp, { data: line });

        log({ filename: filename, line: line }, true)


        if (getType(id.rest, 'Log file closed')) {
            isFileEnded = true
            console.log('Satisfactory log file has been closed and a new one is automatically searched for')
            log({ raw: 'Satisfactory log file has been closed and a new one is automatically searched for' }, false)
            interval = setInterval(lookForFileUpdate, config.updateRate);
            return
        }
    });
}

function lookForFileUpdate() {
    var d = new Date();
    var n = d.toLocaleString();
    // console.log('look for new log file ', n);
    log({ raw: 'look for new log file ' + n }, false)
    //const fileName = 'C:/Users/Steffen/AppData/Local/FactoryGame/Saved/Logs/FactoryGame.log'
    lastLine(function (newLastLine) {

        var time = getItem(newLastLine);
        var id = getItem(time.rest);

        if (!getType(id.rest, 'Log file closed')) {
            //console.log('New Log File Started')
            log({ raw: 'New Log File Started' }, false)
            isFileEnded = false
            liveReader(config.path)
            clearInterval(interval)
        }
    })
}


function log(data, isLog) {
    if (isLog) {
        data.line = logToJSON(data.line)
        addType(data.line.type)

        FindFilter(data.line, function name(params) {
            if (params) {
                //console.log('FindFilter')
                io.emit('newLine', { data: data.line });
                //console.log(data.line);
            } else {
                //console.log('filter not found')
            }
        })
    } else {
        io.emit('newLine', { data: data });
        //console.log(data);
    }
}



function addLogFile(filePath) {
    checkFGLogFile(filePath, function () {

        var temp = { displayName: 'test', sendIDs: [], path: filePath }

        settings.paths.push(temp)
        con.write(__dirname + '/settings.json', settings);

        lastLine(function (line) {
            lastLineData = line

            var time = getItem(line);
            var id = getItem(time.rest);
            if (getType(id.rest, 'Log file closed')) {
                // console.log('file not startet')
                log({ raw: 'File Not Started' }, false)
                interval = setInterval(lookForFileUpdate, config.updateRate);
            } else {
                liveReader(config.path)
            }
        })
    })
}


function removeLogFile(paths) {
    found = settings.paths.indexOf(paths)
    if (found != -1) {
        console.log('remove path')
        settings.paths.splice(found, 1);
        con.write(__dirname + '/settings.json', settings);
        return true
    } else {
        console.log('path nicht vorhanden')
        return false
    }
}


function addType(type) {
    found = types.indexOf(type)
    if (found != -1) {
        //console.log('type ist schon vorhanden')
    } else {
        types.push(type)
    }
}

function addFilter(filter) {
    found = settings.filter.indexOf(filter)
    if (found != -1) {
        console.log('type ist schon vorhanden')
        return false
    } else {
        settings.filter.push(filter)
        con.write(__dirname + '/settings.json', settings);
        return true
    }
}

function removeFilter(filter) {
    found = settings.filter.indexOf(filter)
    if (found != -1) {
        console.log('remove filter')
        settings.filter.splice(found, 1);
        con.write(__dirname + '/settings.json', settings);
        return true
    } else {
        console.log('filter nicht vorhanden')
        return false
    }
}

function FindFilter(data, callback) {
    var a = data.raw.toUpperCase();
    var i = 0
    settings.filter.forEach(element => {
        i++
        var b = element.toUpperCase();
        var n = a.search(b);
        if (n != -1) {
            callback(true)
            return
        }
        if (settings.filter.length <= i + 1) {
            callback(false)
            return
        }
    });
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
            // console.log(lastLine)
            callback(lastLine)
        })
        .catch((err) => {
            console.error(err)
            callback(err)
        })
}

function checkFGLogFile(file, callback) {
    //console.log(process.env)

    log({ raw: file }, false)
    if (fs.existsSync(file)) {
        //file exists
        callback(file)
    } else {
        console.log('log file could not be found', file)
        //process.exit(1)
    }
}



httpServer.listen(config.port);

console.log('Log Server Running on http://localhost:' + config.port)




