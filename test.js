var Moduler = require('./index').Moduler;


var k = new Moduler('kkk', 'k')
        .factory('k1', function () {
            return function () {
                return "ret-k1"
            };
        })

        .factory('k2', function () {
            return "k2";
        })
        .run(function (k1) {
            console.log('run kkk ',k1())
        })
        .on('postInit',  function (k1) {
            console.log('post init',k1())
        })
        .on('preRun', 'k1', function () {
            console.log('pre Run `kkk1`')
        })
        .on('postRun', 'k1', function () {
            console.log('post Run `kkk1`')
        })
    ;


var testApp = new Moduler('testApp', 'app');


testApp.include(k);

testApp.def('v1', function (k$k1) {
    return "a1 {" + k$k1() + "}";
});

testApp.factory('h1', function (v1) {
    console.log('factory h1')
    return v1 + "-h1"
});
testApp.factory('h2', 'h1', function (v1) {
    console.log('factory h2')
    return v1 + "-h2";
})

testApp.factory('init', 'h1', 'h2', function (h1) {
    console.log('factory init')
    return "kk" + h1;
}, 'h1', function () {
    console.log('test')
});

testApp.run( function (init) {
    console.log('run app ',+init);
});

module.exports = testApp;