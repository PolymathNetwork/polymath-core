const csvParse = require('csv-parse/lib/sync');
const ObjectsToCsv = require('objects-to-csv');
const fs = require('fs');
const program = require('commander');
const path = require('path');
const timestamp = require('unix-timestamp');

const TOTAL_VESTING_DURATION = 48; // in months
const TOTAL_VESTING_DURATION_REMAIN = 47; // In months
const NON_LINEAR_TEMPLATE_DURATION = 12; // in months
const LAUNCH_TIME_STAMP = 1593475200; // 30-JUNE-2020
const NEW_LAUNCH_TIME_STAMP = 1596240000; // 01-AUG-2020

let Templates = [];

let Schedules = [];

let SchedulesWithTemplate = [];

let DisplayData = [];

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
        assignTemplate(data[i]['Vesting start date'], data[i]['Month elapsed'], data[i]['Unvested share'], data[i]['Already vested'], data[i]['Remaining months'], data[i]['ETH address'], data[i]['Name']);
    }

    let csv = new ObjectsToCsv(Templates);
    await csv.toDisk('./data/Wallet/VEW/templates.csv');
    csv = new ObjectsToCsv(Schedules);
    await csv.toDisk('./data/Wallet/VEW/schedules.csv');

    for (let i = 0; i < Schedules.length; i++) {
        let tempObj = {};
        for(let j = 0; j < Templates.length; j++) {
            if (Schedules[i]["TemplateName"] == Templates[j]["TemplateName"]) {
                tempObj = Templates[j];
                break;
            }
        }
        SchedulesWithTemplate.push({
            "BeneficiaryName": Schedules[i]["BeneficiaryName"],
            "Beneficiary": Schedules[i]["Beneficiary"],
            "TemplateName": tempObj.TemplateName,
            "NumberOfTokens": tempObj.numberOfTokens,
            "Duration": tempObj.duration,
            "Frequency": tempObj.frequency,
            "StartTimestamp": Schedules[i]["StartDate"]
        });
        let frequencyInDays = tempObj.frequency > 86400 ? parseInt(tempObj.frequency) / 86400 : null;
        let durationInDays = tempObj.duration > 86400 ? parseInt(tempObj.duration) / 86400 : null;
        let startDate = Schedules[i]["StartDate"] == 0 ? 0 : new Date( Schedules[i]["StartDate"] * 1000);
        DisplayData.push({
            "BeneficiaryName": Schedules[i]["BeneficiaryName"],
            "Beneficiary": Schedules[i]["Beneficiary"],
            "TemplateName": tempObj.TemplateName,
            "NumberOfTokens": tempObj.numberOfTokens,
            "Duration": tempObj.duration,
            "Frequency": tempObj.frequency,
            "StartTimestamp": Schedules[i]["StartDate"],
            "StartDate": startDate,
            "FrequencyInDays": frequencyInDays,
            "DurationInDays": durationInDays
        });
    }
    csv = new ObjectsToCsv(SchedulesWithTemplate);
    await csv.toDisk('./data/Wallet/VEW/scheduleWithTemplates.csv');

    csv = new ObjectsToCsv(DisplayData);
    await csv.toDisk('./data/Wallet/VEW/displayData.csv');
    console.log("CSV parsing is successfully done");
}


function assignTemplate(_startDate, _alreadyPassedMonths, _unVestedShares, _alreadyVestedShares, _remainingMonths, _beneficiary, _beneficiaryName) {
    if (!/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.test(_startDate)) {
        console.error("Not a proper date format i.e dd/mm/yy");
        process.exit(1);
    }
    date = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(_startDate);
    let composedDate = new Date(date[3], date[2] -1, date[1]);
    let timestampDate = (composedDate.getTime())/1000 + + 19800; // for 5 and half hour time
    let alreadyPassedTimestamp = 0;
    let templateName;
    let dustTokens = 0;
    // if (timestampDate < LAUNCH_TIME_STAMP) {
    //     alreadyPassedTimestamp = LAUNCH_TIME_STAMP - timestampDate;
    // }

    if (_remainingMonths == TOTAL_VESTING_DURATION_REMAIN) {
        let non_linear_duration = noOfSeconds(NON_LINEAR_TEMPLATE_DURATION - 1);
        let months_for_linear_duration = TOTAL_VESTING_DURATION - NON_LINEAR_TEMPLATE_DURATION - 1;
        let linear_duration = noOfSeconds(months_for_linear_duration);

        if (_unVestedShares % TOTAL_VESTING_DURATION != 0) {
            let remainder = _unVestedShares % TOTAL_VESTING_DURATION;
            dustTokens += remainder;
            _unVestedShares = _unVestedShares - remainder;
        }

        let tokens_per_period = (_unVestedShares / TOTAL_VESTING_DURATION);

        let no_of_tokens_for_non_linear_vesting = tokens_per_period * NON_LINEAR_TEMPLATE_DURATION;
        let no_of_tokens_for_linear_vesting = tokens_per_period * months_for_linear_duration;

        // Non-linear
        templateName = createUniqueTemplate({
            "numberOfTokens": no_of_tokens_for_non_linear_vesting,
            "duration": non_linear_duration, // Remaining months in seconds
            "frequency": non_linear_duration
            });
        Schedules.push({
            "BeneficiaryName": _beneficiaryName,
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": NEW_LAUNCH_TIME_STAMP,
        });

        // Linear
        templateName = createUniqueTemplate({
            "numberOfTokens": no_of_tokens_for_linear_vesting,
            "duration": linear_duration, // Remaining months in seconds
            "frequency": linear_duration / months_for_linear_duration
            });
        Schedules.push({
            "BeneficiaryName": _beneficiaryName,
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": NEW_LAUNCH_TIME_STAMP + non_linear_duration
        });
    }
    else if (_alreadyPassedMonths > 1) {

        if (_alreadyVestedShares != 0) {
            templateName = createUniqueTemplate({
                "numberOfTokens": _alreadyVestedShares,
                "duration": 1, // for 1 sec
                "frequency": 1
            });
            Schedules.push({
                "BeneficiaryName": _beneficiaryName,
                "Beneficiary": _beneficiary,
                "TemplateName": templateName,
                "StartDate": 0,
            });
        }

        if (_alreadyPassedMonths >= NON_LINEAR_TEMPLATE_DURATION) {

            if (_unVestedShares % _remainingMonths != 0) {
                let remainder = _unVestedShares % _remainingMonths;
                dustTokens += remainder;
                _unVestedShares = _unVestedShares - remainder;
            }
            let duration = noOfSeconds(_remainingMonths);

            templateName = createUniqueTemplate({
                "numberOfTokens": _unVestedShares,
                "duration": duration, // Remaining months in seconds
                "frequency": duration / _remainingMonths
                });
            Schedules.push({
                "BeneficiaryName": _beneficiaryName,
                "Beneficiary": _beneficiary,
                "TemplateName": templateName,
                "StartDate": NEW_LAUNCH_TIME_STAMP,
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

            if (_unVestedShares % _remainingMonths != 0) {
                let remainder = _unVestedShares % _remainingMonths;
                dustTokens += remainder;
                _unVestedShares = _unVestedShares - remainder;
            }

            let tokens_per_period = (_unVestedShares / _remainingMonths);

            let no_of_tokens_for_non_linear = tokens_per_period * months_remaining_for_non_linear;
            let no_of_tokens_for_linear = tokens_per_period * months_remaining_for_linear;

            // Non-linear
            templateName = createUniqueTemplate({
                "numberOfTokens": no_of_tokens_for_non_linear,
                "duration": duration_for_non_linear, // Remaining months in seconds
                "frequency": duration_for_non_linear
                });
            Schedules.push({
                "BeneficiaryName": _beneficiaryName,
                "Beneficiary": _beneficiary,
                "TemplateName": templateName,
                "StartDate": NEW_LAUNCH_TIME_STAMP,
            });

            // Linear
            templateName = createUniqueTemplate({
                "numberOfTokens": no_of_tokens_for_linear,
                "duration": duration_for_linear, // Remaining months in seconds
                "frequency": duration_for_linear / months_remaining_for_linear
                });
            Schedules.push({
                "BeneficiaryName": _beneficiaryName,
                "Beneficiary": _beneficiary,
                "TemplateName": templateName,
                "StartDate": (NEW_LAUNCH_TIME_STAMP + duration_for_non_linear)
            });
        }
    }
    if (dustTokens > 0) {
        let finalDuration = noOfSeconds(_remainingMonths);
        templateName = createUniqueTemplate({
            "numberOfTokens": dustTokens,
            "duration": 1, // only runs for 1 seconds
            "frequency": 1 // only runs for 1 seconds
            });
        Schedules.push({
            "BeneficiaryName": _beneficiaryName,
            "Beneficiary": _beneficiary,
            "TemplateName": templateName,
            "StartDate": (NEW_LAUNCH_TIME_STAMP + finalDuration),
        });
    }
}

// lots of fixation to work with timing
function noOfSeconds(_remainingMonths) {
    const MONTH = 8;
    let newYear = 2020
    let newMonth = MONTH + parseInt(_remainingMonths);
    let newDate = 1;
    if (newMonth > 12) {
        newYear = newYear + parseInt(newMonth / 12);
        newMonth = newMonth % 12;
    }
    let duration = timestamp.fromDate(`${newYear}/${newMonth}/${newDate}`) - NEW_LAUNCH_TIME_STAMP;
    duration = duration % _remainingMonths == 0 ? duration : duration - (duration % _remainingMonths); // To make it completely divisible
    return duration;
}

function createUniqueTemplate(obj) {
    if (Templates.length == 0) {
        let templateObject = getTemplateObject(obj);
        Templates.push(templateObject);
        return templateObject.TemplateName;
    } else {
        for (let i = 0; i < Templates.length; i++) {
            if (Templates[i].numberOfTokens == obj.numberOfTokens && Templates[i].duration == obj.duration && Templates[i].frequency == obj.frequency) {
                return Templates[i].TemplateName;
            }
        }
        let templateObject = getTemplateObject(obj);
        Templates.push(templateObject);
        return templateObject.TemplateName;
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