exports.logToJSON = (str) => {
    var time = getTime(str)
    var id = getID(time.rest)
    var type = getType(id.rest)
    return { raw: str, time: time.val, id: id.val, type: type.val, msg: type.rest }
}

function getID(str) {
    var pos1Item1 = str.indexOf("[");
    var pos2Item2 = str.indexOf("]");
    var val = str.substring(pos1Item1 + 1, pos2Item2);
    var rest = str.slice(pos2Item2 + 1);
    var ret = { val: val.trim(), rest: rest }
    return ret
}

function getTime(str) {
    var pos1Item1 = str.indexOf("[");
    var pos2Item2 = str.indexOf("]");
    var val = str.substring(pos1Item1 + 1, pos2Item2);
    var rest = str.slice(pos2Item2 + 1);
    var ret = { val: val, rest: rest }
    return ret
}

function getType(str) {
    var pos1Item1 = str.indexOf(":");
    var val = str.substring(0, pos1Item1);
    var rest = str.slice(pos1Item1 + 2);
    var ret = { val: val, rest: rest }
    return ret
}
function getMSG(str) {
    var pos1Item1 = str.indexOf("[");
    var pos2Item2 = str.indexOf("]");
    var val = str.substring(pos1Item1, pos2Item2 + 1);
    var rest = str.slice(pos2Item2 + 1);
    var ret = { val: val, rest: rest }
    return ret
}