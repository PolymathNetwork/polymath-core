var fs = require('fs')
const regex = /(?<=try {)(.*?)(await )(.*?)(?=;)(.*?)(?=message\);)/gmis;
const regex2 = /(try {)(.*?)(message\);)/gmis;
const regex3 = /(let errorThrown. = false;)/gmis;
const dirname = 'test/';

fs.readdir(dirname, function(err, filenames) {
    if (err) {
        return console.log(err);
    }
    filenames.forEach(function(filename) {
        fs.readFile(dirname + filename, 'utf-8', function(err, content) {
            if (err) {
                return console.log(err);
            }
            content = content.replace(regex, 'catchRevert($3);');
            content = content.replace(regex2, 'await $2');
            content = content.replace(regex3, '');
            fs.writeFile(dirname + filename, content, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        });
    });
});