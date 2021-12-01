// Remotely start drone-mobile vehicle if temperature is too hot
// or too cold.
// Source:
// https://github.com/Hacksore/drone-mobile

const username = 'user@name.com'
const password = 'p@ssword'

const DroneMobile = require('drone-mobile');
const client = new DroneMobile({
    username: username,
    password: password
});

// degrees in 'murica
const TooHot = 80;
const TooCold = 60;

function IsTempOutOfRange(temperature)
{
    const isTempOutOfrange = (temperature < TooCold) || (temperature > TooHot);
    console.log('temperature out of range?: ', isTempOutOfrange);
    return isTempOutOfrange;
}

client.on('ready', async () =>
{
    isTempOutOfRange = false;
    isCarStarted = false;

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
});
