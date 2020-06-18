const csvParse = require('csv-parse/lib/sync');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
const program = require('commander');
const path = require('path');

const TOTAL_VESTING_DURATION = 48; // in months
const NON_LINEAR_TEMPLATE_DURATION = 12; // in months
const LAUNCH_TIME_STAMP = 1593475200; // 30-JUNE-2020

let Templates = [];

let Schedules = [];

program
    .version('1.0.1')
    .description('CLI for parsing CSV')

program
    .option('-f, --file <File>', 'Path of the CSV file')
    .description('Please Enter the path of the CSV')
    .action(async function (cmd) {
        await makeDataProducible(cmd.file);
    });
program.parse(process.argv);

if (typeof program.commands.length == 0) {
    console.error('No command given!');
    process.exit(1);
}

async function makeDataProducible(filePath) {
    let input;
    try {
        let pathOfFile = path.join(__dirname, filePath);
        input = fs.readFileSync(pathOfFile, 'utf8');
    } catch(error) {
        console.error(`Error in reading the file: ${error.message}`);
        process.exit(0);
    }

    let data = csvParse(input, {
        columns: true,
        skip_empty_lines: true
    });

    // Create template structure
    for(let i = 0; i < data.length; i++) {
        assignTemplate(data[i]['Vesting start date'], data[i]['Month elapsed'], data[i]['Unvested share'], data[i]['Already vested'], data[i]['Remaining months'], data[i]['ETH address']);
    }

    let csv = new ObjectsToCsv(Templates);
    await csv.toDisk('./data/Wallet/VEW/templates.csv');
    csv = new ObjectsToCsv(Schedules);
    await csv.toDisk('./data/Wallet/VEW/schedules.csv');
    console.log("CSV Segregation is successfully done");
}


function assignTemplate(_startDate, _alreadyPassedMonths, _unVestedShares, _alreadyVestedShares, _remainingMonths, _beneficiary) {
    if (!/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.test(_startDate)) {
        console.error("Not a proper date format i.e dd/mm/yy");
        process.exit(1);
    }
    date = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(_startDate);
    let composedDate = new Date(date[3], date[2] -1, date[1]);
    let timestampDate = (composedDate.getTime())/1000 + + 19800; // for 5 and half hour time
    let alreadyPassedTimestamp = 0;
    let templateName;
    if (timestampDate < LAUNCH_TIME_STAMP) {
        alreadyPassedTimestamp = LAUNCH_TIME_STAMP - timestampDate;
    }
    if (_alreadyPassedMonths > 0) {
        templateName = createUniqueTemplate({
                "numberOfTokens": _alreadyVestedShares,
                "duration": 1, // for 1 sec
                "frequency": 1
            });
        Schedules.push({
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": 0,
        });
    }
    if (_alreadyPassedMonths >= NON_LINEAR_TEMPLATE_DURATION) {
        let duration = noOfSeconds(_remainingMonths);
        templateName = createUniqueTemplate({
            "numberOfTokens": _unVestedShares,
            "duration": duration, // Remaining months in seconds
            "frequency": duration / _remainingMonths
            });
        Schedules.push({
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": LAUNCH_TIME_STAMP,
        });
    }
    // In this case two schedule will be created with 2 templates
    // Ex - only 6 months being passed then 6 template will be created to first 6 months as the non-linear
    // while for the other remaining months it will be linear of having 1 month frequency
    else if (_alreadyPassedMonths < NON_LINEAR_TEMPLATE_DURATION) {
        let months_remaining_for_non_linear = NON_LINEAR_TEMPLATE_DURATION - _alreadyPassedMonths;
        let months_remaining_for_linear = _remainingMonths - months_remaining_for_non_linear;

        let duration_for_non_linear = noOfSeconds(months_remaining_for_non_linear);
        let duration_for_linear = noOfSeconds(months_remaining_for_linear);

        let no_of_tokens_for_non_linear = (parseInt(_unVestedShares / _remainingMonths)) * months_remaining_for_non_linear;
        let no_of_tokens_for_linear = _unVestedShares - no_of_tokens_for_non_linear;

        // Non-linear
        templateName = createUniqueTemplate({
            "numberOfTokens": no_of_tokens_for_non_linear,
            "duration": duration_for_non_linear, // Remaining months in seconds
            "frequency": duration_for_non_linear / months_remaining_for_non_linear
            });
        Schedules.push({
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": LAUNCH_TIME_STAMP,
        });

        // Linear
        templateName = createUniqueTemplate({
            "numberOfTokens": no_of_tokens_for_linear,
            "duration": duration_for_linear, // Remaining months in seconds
            "frequency": duration_for_linear / months_remaining_for_linear
            });
        Schedules.push({
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": LAUNCH_TIME_STAMP + duration_for_non_linear
        });
    }
}

function noOfSeconds(_remainingMonths) {
    let date = new Date(LAUNCH_TIME_STAMP * 1000);
    let newYear = date.getUTCFullYear();
    let newMonth = date.getUTCMonth() + _remainingMonths;
    let newDate = date.getUTCDay();
    if (newMonth > 12) {
        newMonth = newMonth % 12 == 0 ? date.getUTCMonth() :  newMonth % 12;
        newYear = date.getFullYear() + parseInt(_remainingMonths / 12);
    }
    let composedDate = new Date(newYear, newMonth - 1, newDate);
    let timestampDate = (composedDate.getTime())/1000 + + 19800;
    let duration = timestampDate - LAUNCH_TIME_STAMP;
    duration = duration % _remainingMonths == 0 ? duration : duration - (duration % _remainingMonths); // To make it completely divisible
    return duration;
}

function createUniqueTemplate(obj) {
    if (Templates.length == 0) {
        Templates.push(getTemplateObject(obj));
        return getTemplateObject(obj).TemplateName;
    } else {
        for (let i = 0; i < Templates.length; i++) {
            if (Templates[i].numberOfTokens == obj.numberOfTokens && Templates[i].duration == obj.duration && Templates[i].frequency == obj.frequency) {
                return Templates[i].TemplateName;
            }
        }
        Templates.push(getTemplateObject(obj));
        return getTemplateObject(obj).TemplateName;
    }
}

function getTemplateObject(obj) {
    let templateObject = {
        "TemplateName": `Template${Templates.length}`,
        "numberOfTokens": obj.numberOfTokens,
        "duration": obj.duration,
        "frequency": obj.frequency
    }
    return templateObject;
}