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
    
    const result = await ipcRenderer.invoke('addWatchedFiles', data);
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



console.log('Preload are loaded!');


