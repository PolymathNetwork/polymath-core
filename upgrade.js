const fs = require('fs');
const glob = require("glob");

let regex = new RegExp('((const|let|var) (.*) = artifacts.require(.)*)', 'gi');
let m;
 
glob("test/**/*.js", function (er, files) {
    files.forEach(function(filename) {
        fs.readFile(filename, 'utf-8', function(err, content) {
            if (err) {
                return console.log(err);
            }
            content = content.replace(regex, '$1\n$3.numberFormat = "BN";'); 
            fs.writeFile(filename, content, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        });
    });
})