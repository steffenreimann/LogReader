var ipcRenderer = require('electron').ipcRenderer;
var childprocess = require('child_process')
window.slash = require('slash');
const path = require('path')
const ejs = require('ejs')
const remote = require('electron').remote;




window.instances = {}

window.getInstances = async function (params) {

    const result = await ipcRenderer.invoke('getInstances');

    renderInstances(result)
    console.log(result); // prints "foo"
}

window.reopenWindow = async function (id) {
    console.log(window.instances)

    if (window.instances[id].WindowOpen) {

        const result = ipcRenderer.invoke('windowShow', id)
        console.log(result); // prints "foo"
    } else {
        const result = ipcRenderer.invoke('reopenWindow', id)
        console.log(result); // prints "foo"
    }



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

window.addWatchedFiles = async function (data) {

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
    document.getElementById('WatchedFiles').innerHTML = ''
    console.log('renderSettings Function!', settings);
    var html = await getHTMLView('WatchedFiles')
    document.getElementById('WatchedFiles').innerHTML += ejs.render(html, { settings: settings });

    document.getElementById('RAWexecPath').value = settings.RAWexecPath

    renderSettingsColors(settings)
}

function renderSettingsColors(settings) {
    Object.keys(settings.WatchFiles).forEach(function (key) {
        var currentElement = document.getElementById(`watchBTN-${key}`)
        if (settings.WatchFiles[key].watch) {
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



