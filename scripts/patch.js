const fs = require("fs");
const request = require("request");
const regex = /node ..\/n(.)*,/gim;
const regex2 = /truffle test(.)*,/gim;

request("https://raw.githubusercontent.com/maxsam4/solidity-coverage/relative-path/lib/app.js").pipe(
    fs.createWriteStream("node_modules\\solidity-coverage\\lib\\app.js")
);

fs.readFile(".solcover.js", "utf8", function(err, data) {
    if (err) {
        return console.log(err);
    }

    let testCommand = "truffle test --network coverage";
    fs.readdirSync("./test").forEach(file => {
        if (file != "a_poly_oracle.js") testCommand = testCommand + " test\\\\" + file;
    });
    testCommand = testCommand + "',";
    let result = data.replace(regex2, testCommand);
    result = result.replace(regex, testCommand);

    fs.writeFile(".solcover.js", result, "utf8", function(err) {
        if (err) return console.log(err);
    });
});
