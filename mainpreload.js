var ipcRenderer = require('electron').ipcRenderer;
var childprocess = require('child_process')
window.slash = require('slash');
const path = require('path')
const ejs = require('ejs')
const remote = require('electron').remote;
const crypto = require('crypto');



window.instances = {}

window.getInstances = async function (params) {

    const result = await ipcRenderer.invoke('getInstances');

    renderInstances(result)
    console.log(result); // prints "foo"
}

window.reopenWindow = async function (id) {
    // id = crypto.createHash("sha256").update(id).digest("hex");
    console.log(id)

    const result = ipcRenderer.invoke('reopenWindow', id)
    console.log(result); // prints "foo"

}

window.openFileInBrowser = function (filepath) {

    childprocess.exec(`start "" "${path.dirname(filepath)}"`);
}

window.quitInstance = async function (id) {
    const result = await ipcRenderer.invoke('quitInstance', id);
    return result
}

window.getSMMData = async function () {
    const result = await ipcRenderer.invoke('getSMMData');
    renderSMMData(result)
    //return result
}

window.maximize = async function () {
    const result = await ipcRenderer.invoke('transformWindow', 'maximize');
}

window.minimize = async function () {
    const result = await ipcRenderer.invoke('transformWindow', 'minimize');
}

window.close = async function () {
    const result = await ipcRenderer.invoke('transformWindow', 'close');
}

var ontop = false
window.setAlwaysOnTop = async function () {

    const result = await ipcRenderer.invoke('setAlwaysOnTop', !ontop);
    ontop = !ontop
}

window.addWatchedFiles = async function () {

    var file = await ipcRenderer.invoke('openDialog');
    var result = await ipcRenderer.invoke('addWatchedFiles', file);
    console.log(result)
}

window.deleteFile = async function (id) {

    var result = await ipcRenderer.invoke('deleteFile', id);
    console.log(result)
}

window.toggleWatch = async function (id) {

    var result = await ipcRenderer.invoke('toggleWatch', id);
    console.log(result)
}

window.changeFilePath = async function (id) {
    var file = await ipcRenderer.invoke('openDialog');

    if (file != undefined) {
        var result = await ipcRenderer.invoke('changeFilePath', id, file);
        console.log(result)
    }
}

window.openRAW = async function (id) {
    await ipcRenderer.invoke('openRAW', id);
}

window.changeRAWexecPath = async function () {
    var file = await ipcRenderer.invoke('openDialog');
    await ipcRenderer.invoke('changeRAWexecPath', file);
}

window.addProfile = async function () {
    var profile = {
        "ProfileName": "NewProfile",
        "execFile": "c://",
        "args": [],
        "WatchFiles": {
        }
    }
    var addProfile = await ipcRenderer.invoke('addProfile', profile);
    // await ipcRenderer.invoke('changeRAWexecPath', file);
}

window.changeProfile = async function () {
    var selectedProfile = document.getElementById('profiles-select').value

    console.log(selectedProfile)

    var changeProfile = await ipcRenderer.invoke('changeProfile', selectedProfile);

}

window.removeProfile = async function () {
    var selectedProfile = document.getElementById('profiles-select').value
    var removeProfile = await ipcRenderer.invoke('removeProfile', selectedProfile);
}

window.changeProfileName = async function (dat) {
    console.log(dat.value)
    var changeProfileName = await ipcRenderer.invoke('changeProfileName', dat.value);
}

window.changeExecFileForProfile = async function () {
    var file = await ipcRenderer.invoke('openDialog');
    if (file != undefined) {
        await ipcRenderer.invoke('changeExecFileForProfile', file);
    }
}

window.addEXECAttribute = async function () {
    var newAttr = document.getElementById('NewAttribute').value

    //newAttr = newAttr.replace(/\s/g, '');
    if (newAttr != undefined && newAttr != '') {
        await ipcRenderer.invoke('addEXECAttribute', newAttr);
    }
}

window.changeAttribute = async function (id, dat) {
    if (dat.value != undefined && dat.value != '') {
        await ipcRenderer.invoke('changeAttribute', { id: id, value: dat.value });
    }
}

window.removeAttribute = async function (id) {
    await ipcRenderer.invoke('removeAttribute', id);
}

window.startEXEC = async function (id) {
    await ipcRenderer.invoke('startEXEC');
}

window.makePathID = function (path) {
    return crypto.createHash("sha256").update(path).digest("hex")
}





async function getHTMLView(data) {
    const result = await ipcRenderer.invoke('getHTMLView', data);
    return result
}


ipcRenderer.on('instancesChanged', function (event, data) {
    console.log(data);
    renderInstances(data)
    window.instances = data
});


window.loadSettings = async function () {
    var settings = await ipcRenderer.invoke('loadSettings');
    renderSettings(settings)
}


ipcRenderer.on('settingsChanged', function (event, data) {
    console.log('settingsChanged ', data);
    renderSettings(data)

});



async function renderSMMData(SMMData) {
    var html = await getHTMLView('SMMData')
    document.getElementById('SMMData').innerHTML = ''
    console.log('Render SMMData ', SMMData)
    document.getElementById('SMMData').innerHTML += ejs.render(html, { data: SMMData });
}

async function renderInstances(instances) {
    var html = await getHTMLView('newReader')
    document.getElementById('instances').innerHTML = ''

    console.log('Render instances ', instances)

    Object.keys(instances).forEach(function (element) {
        console.log('Render element ', instances[element])
        document.getElementById('instances').innerHTML += ejs.render(html, { data: instances[element] });
    })
}


async function renderSettings(settings) {
    console.log('renderSettings Function!', settings);

    document.getElementById('WatchedFiles').innerHTML = ''
    document.getElementById('profiles').innerHTML = ''
    document.getElementById('Attrbutes').innerHTML = ''


    //Render Profile HTML
    var profileshtml = await getHTMLView('profiles')
    document.getElementById('profiles').innerHTML += ejs.render(profileshtml, { settings: settings });

    //Render Watched Files HTML

    var html = await getHTMLView('WatchedFiles')
    document.getElementById('WatchedFiles').innerHTML += ejs.render(html, { profile: settings.profiles[settings.selectedProfile] });

    //Set Path to exe
    document.getElementById('RAWexecPath').value = settings.RAWexecPath

    //Set Exec Path to UI
    document.getElementById('ExecFileForProfile').value = settings.profiles[settings.selectedProfile].execFile

    //Render Attrebutes List
    var htmlNewAttrItem = await getHTMLView('NewAttrItem')
    document.getElementById('Attrbutes').innerHTML += ejs.render(htmlNewAttrItem, { profile: settings.profiles[settings.selectedProfile] });

    renderSettingsColors(settings)
}

function renderSettingsColors(settings) {
    var settingProfileFiles = settings.profiles[settings.selectedProfile].WatchFiles
    Object.keys(settingProfileFiles).forEach(function (key) {
        var currentElement = document.getElementById(`watchBTN-${key}`)
        if (settingProfileFiles[key].watch) {
            currentElement.classList.remove("btn-outline-light")
            currentElement.classList.add("btn-outline-success");
        } else {
            currentElement.classList.add("btn-outline-light")
            currentElement.classList.remove("btn-outline-success");
        }
    })


}

window.onload = function (params) {
    window.loadSettings()
    console.log('Preload loaded!')

}



