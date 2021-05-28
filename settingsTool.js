var path = require('path')
var fs = require('fs')

var EventEmitter = require('events').EventEmitter;

var ev = new EventEmitter();



module.exports.settingFilePath = ''
module.exports.data = {}
module.exports.isInit = false




var init = (App) => {
    return new Promise((resolve, reject) => {
        var AppName = App
        module.exports.settingFilePath = path.join(process.env.LOCALAPPDATA, AppName, `settings.json`)
        getSettings().then((resolveData) => {
            watchSttingsFile(module.exports.settingFilePath)
            resolve(resolveData)
        }, (err) => {
            if (err.code == 'ENOENT') {
                dir(path.dirname(module.exports.settingFilePath)).then((dirERR) => {
                    if (dirERR) {
                        reject(dirERR)
                    } else {
                        fs.writeFile(module.exports.settingFilePath, JSON.stringify({ App: AppName }), { recursive: true }, (fileERR) => {
                            if (fileERR) {
                                //console.log('File write error')
                                reject(fileERR)
                            } else {
                                //console.log('reading file after write')
                                getSettings().then((settings) => {
                                    module.exports.isInit = true
                                    watchSttingsFile(module.exports.settingFilePath)
                                    resolve(settings)

                                }, (errr) => { reject(errr) })
                            }
                        })
                    }
                }, reject);
            } else {
                reject(err)
            }
        })
    })
}
var getSettings = () => {
    return new Promise((resolve, reject) => {
        console.log(module.exports.settingFilePath)

        fs.readFile(module.exports.settingFilePath, function (err, data) {
            if (err) {
                reject(err)
            } else {
                module.exports.data = JSON.parse(data.toString())
                resolve(module.exports.data)
            }
        });
    })
}

var setSettings = (data) => {
    return new Promise((resolve, reject) => {
        console.log(module.exports.settingFilePath)


        fs.writeFile(module.exports.settingFilePath, JSON.stringify(data), { recursive: true }, (fileERR) => {
            if (fileERR) {
                console.log('File write error')
                reject(fileERR)
            } else {
                console.log('reading file after write')
                getSettings().then((settings) => { resolve(settings) }, (errr) => { reject(errr) })
            }
        })
    })
}

var setKey = (data) => {
    return new Promise((resolve, reject) => {
        console.log(module.exports.settingFilePath)

        getSettings().then((settings) => {

            setObjKeys(settings, data).then((newSettings) => {

                console.log('Save Setting to file =', newSettings)

                fs.writeFile(module.exports.settingFilePath, JSON.stringify(newSettings), { recursive: true }, (fileERR) => {
                    if (fileERR) {
                        console.log('File write error')
                        reject(fileERR)
                    } else {
                        console.log('reading file after write')
                        getSettings().then((settings) => { resolve(settings) }, (errr) => { reject(errr) })
                    }
                })

            })
        }, reject)
    })
}

var getKey = (data) => {
    return new Promise((resolve, reject) => {
        console.log(module.exports.settingFilePath)

        getSettings().then((settings) => {
            resolve(index(settings, data))
        }, reject)
    })
}

var dir = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirPath, (dirERR) => { if (dirERR) { if (dirERR.code == 'EEXIST') { resolve(null) } else { reject(dirERR) } } else { resolve(null) } })
    })
}




function watchSttingsFile(file) {
    //console.log("watchSttingsFile ");
    fs.watchFile(file, { bigint: false, persistent: true, interval: 4000 }, (curr, prev) => {
        //console.log("Settings File changed = ");
        //console.log("Previous Modified Time", prev.mtime);
        //console.log("Current Modified Time", curr.mtime);
        getSettings().then((settings) => { module.exports.ev.emit('changed', settings) }, () => { })
    });
}

function index(obj, is, value) {
    if (typeof is == 'string')
        return index(obj, is.split('.'), value);
    else if (is.length == 1 && value !== undefined)
        return obj[is[0]] = value;
    else if (is.length == 0)
        return obj;
    else
        return index(obj[is[0]], is.slice(1), value);
}

var setObjKeys = (settings, newData) => {
    return new Promise((resolve, reject) => {

        Object.keys(newData).forEach(function (key) {
            index(settings, key, newData[key])
            //console.log('new index func = ', settings)
        })
        //console.log('resolve setobjkeys = ', settings)
        resolve(settings)
    })
}

module.exports = {
    init,
    getSettings,
    setSettings,
    setKey,
    getKey,
    ev
};