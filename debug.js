// Remotely start drone-mobile vehicle if temperature is too hot
// or too cold.
// Source:
// https://github.com/Hacksore/drone-mobile

require('dotenv').config();
const DroneMobile = require('drone-mobile');

let client = null;

function GetClient()
{
    return new DroneMobile({
        username: process.env.DRONE_MOBILE_USERNAME,
        password: process.env.DRONE_MOBILE_PASSWORD
    });
}

// degrees in 'murica
// TEMPERATURE_MURICAN_HIGH=78
// TEMPERATURE_MURICAN_LOW-70
// SECONDS_BETWEEN_CHECKS=60
// IS_ENABLED=TRUE
const TooHot = process.env.TEMPERATURE_MURICAN_HIGH;
const TooCold = process.env.TEMPERATURE_MURICAN_LOW;
const SecondsBetweenChecks = process.env.SECONDS_BETWEEN_CHECKS;
const SecondsToRun = process.env.SECONDS_TO_RUN;
const ShouldIgnoreCarStartedState = process.env.SHOULD_IGNORE_CAR_STARTED;
const ShouldIgnoreTemperature = process.env.SHOULD_IGNORE_TEMPERATURE;

async function WaitMs(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

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


function IsTempOutOfRange(temperature_celcius)
{
    // degrees in 'murica
    const temperature = temperature_celcius * (9 / 5) + 32
    console.log('current temperature: ', temperature);
    console.log('checking if temperature between ', TooHot, ' and ', TooCold);
    const isTempOutOfrange = (temperature < TooCold) || (temperature > TooHot);
    console.log('temperature out of range?: ', isTempOutOfrange);
    if (ShouldIgnoreTemperature)
    {
        console.log('ignoring current temperature...');
        return true;
    }
    return isTempOutOfrange;
}

function IsCarStarted(is_engine_on)
{
    isCarStarted = is_engine_on;
    console.log('car remote started?: ', isCarStarted);
    if (ShouldIgnoreCarStartedState)
    {
        console.log('ignoring car started state...');
        return false;
    }
    return isCarStarted;
}

async function StartCar(vehicle)
{
    console.log('starting car: ', vehicle.device_key);
    try {
        const response = await client.start(vehicle.device_key);
        console.log("start response: ", response);
    } catch (err) {
        console.log('Err:', err);
    }
}

async function StopCar(vehicle)
{
    console.log('stopping car: ', vehicle.device_key);
    try {
        const response = await client.stop(vehicle.device_key);
        console.log("stop response: ", response);
    } catch (err) {
        console.log('Err:', err);
    }
}

async function StartAndStopCar()
{
    console.log('Starting car if needed at: ', GetDateTimeString());

    // get a list of vehicles on the account
    const vehicleList = await client.vehicles();

    // pick the first one
    const vehicle = vehicleList[0];
    let shouldStart = false;
    try {
        console.log('getting status for car:', vehicle.device_key);
        const response = await client.status(vehicle.device_key);
        //console.log('status: ', response);
        //console.log('controller_status', response.last_known_state.controller);
        let temperature_celcius = response.last_known_state.controller.current_temperature;
        let is_engine_on = response.last_known_state.controller.engine_on;
        if (IsTempOutOfRange(temperature_celcius) === false) {
            console.log("temp in range. exiting...");
            return;
        }
        if (IsCarStarted(is_engine_on) === true) {
            console.log("car already remote started. exiting...");
            return;
        }
    } catch (err) {
        console.log('Err:', err);
    }

    //await StartCar(vehicle);

    //console.log('Seconds until car is stopped ', SecondsToRun);
    //await WaitMs(SecondsToRun*1000);

    //await StopCar(vehicle);
}

function MainLoop()
{
    client = GetClient();
    client.on('ready', async () =>
    {
        await StartAndStopCar();
    });
}

function run() {
    MainLoop();
    //setInterval(MainLoop, SecondsBetweenChecks*1000);
  };
  
run();
  
