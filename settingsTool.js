var path = require('path')
var fs = require('fs')


module.exports.settingFilePath = ''
module.exports.data = {}

var init = (App) => {
    return new Promise((resolve, reject) => {
        var AppName = App
        module.exports.settingFilePath = path.join(process.env.LOCALAPPDATA, AppName, `settings.json`)
        getSettings().then((resolveData) => {
            resolve(resolveData)
        }, (err) => {
            if (err.code == 'ENOENT') {
                dir(path.dirname(module.exports.settingFilePath)).then((dirERR) => {
                    if (dirERR) {
                        reject(dirERR)
                    } else {
                        fs.writeFile(module.exports.settingFilePath, JSON.stringify({ App: AppName }), { recursive: true }, (fileERR) => {
                            if (fileERR) {
                                console.log('File write error')
                                reject(fileERR)
                            } else {
                                console.log('reading file after write')
                                getSettings().then((settings) => { resolve(settings) }, (errr) => { reject(errr) })
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

var dir = (dirPath) => {
    return new Promise((resolve, reject) => {
        fs.mkdir(dirPath, (dirERR) => { if (dirERR) { if (dirERR.code == 'EEXIST') { resolve(null) } else { reject(dirERR) } } else { resolve(null) } })
    })
}

module.exports = {
    init,
    getSettings,
    setSettings
};