// Remotely start drone-mobile vehicle if temperature is too hot
// or too cold.
// Source:
// https://github.com/Hacksore/drone-mobile

require('dotenv').config();
const DroneMobile = require('drone-mobile');
const client = new DroneMobile({
    username: process.env.DRONE_MOBILE_USERNAME,
    password: process.env.DRONE_MOBILE_PASSWORD
});

// degrees in 'murica
// TEMPERATURE_MURICAN_HIGH=78
// TEMPERATURE_MURICAN_LOW-70
// SECONDS_BETWEEN_CHECKS=60
// IS_ENABLED=TRUE
const TooHot = process.env.TEMPERATURE_MURICAN_HIGH;
const TooCold = process.env.TEMPERATURE_MURICAN_LOW;
const SecondsBetweenChecks = process.env.SECONDS_BETWEEN_CHECKS;

function GetDateTimeString()
{
    let date_ob = new Date();
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let year = date_ob.getFullYear();
    // current hours
    let hours = date_ob.getHours();
    // current minutes
    let minutes = date_ob.getMinutes();
    // current seconds
    let seconds = date_ob.getSeconds();
    // prints date & time in YYYY-MM-DD HH:MM:SS format
    return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
}


function IsTempOutOfRange(temperature)
{
    console.log('checking if temperature between ', TooHot, ' and ', TooCold);
    const isTempOutOfrange = (temperature < TooCold) || (temperature > TooHot);
    console.log('temperature out of range?: ', isTempOutOfrange);
    return isTempOutOfrange;
}

async function StartIfNeeded() {
    console.log('Starting car if needed at: ', GetDateTimeString());

    let isTempOutOfRange = false;
    let isCarStarted = false;

    // get a list of vehicles on the account
    const vehicleList = await client.vehicles();

    // pick the first one
    const vehicle = vehicleList[0];

    console.log('getting status for car:', vehicle.device_key);

    try {
        const response = await client.status(vehicle.device_key);

        // degrees in 'murica
        const temperature = response.last_known_state.controller.current_temperature * (9 / 5) + 32
        console.log('current temperature: ', temperature);
        isTempOutOfRange = IsTempOutOfRange(temperature);
        isCarStarted = response.remote_start_status;
        console.log('car remote started?: ', isCarStarted);
    } catch (err) {
        console.log('Err:', err);
    }

    if (isTempOutOfRange === false) {
        console.log("temp in range. exiting...");
        return;
    }
    if (isCarStarted === true) {
        console.log("car already remote started. exiting...");
        return;
    }

    console.log('starting car: ', vehicle.device_key);
    try {
        const response = await client.start(vehicle.device_key);
    } catch (err) {
        console.log('Err:', err);
    }
}

function WaitMs(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

client.on('ready', async () =>
{
    while(true) {
        await StartIfNeeded();
        console.log('Next check will run in ', SecondsBetweenChecks, ' seconds...');
        await WaitMs(SecondsBetweenChecks*1000);
    }
});
