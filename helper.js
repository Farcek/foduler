module.exports.args = function (args, start) {
    var k = (start === undefined) ? 1 : start;

    var handles = [];
    for (var i = k; i < args.length; i++) {
        var it = args[i];
        if (Array.isArray(it)) {
            for (var k in it) {
                handles.push(it[k]);
            }
        } else {
            handles.push(it);
        }
    }

    return handles;
};

module.exports.parseName = function (name) {

    if ((typeof name === 'string' || name instanceof String) && name.length > 0) {
        var r = false;
        if (name[0] === '$') {
            name = name.substring(1);
            r = true;
        }
        var names = name.split('$');

        if (names.length === 1) {
            return {
                name: r ? '$' + name : name
            }
        }
        if (names.length === 2) {
            return {
                module: r ? '$' + names[0] : names[0],
                name: names[1]
            }
        }
    }


    return {};
};