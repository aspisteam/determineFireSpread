var request = require('then-request');

//INPUT
constants = require('./constants');

//URLS
const surfaceFuelURL = 'http://emxsys.net/wmt-rest/rs/surfacefuel';
const surfaceFireURL = 'http://emxsys.net/wmt-rest/rs/surfacefire';

exports.handler = (event, context, callback) => {
    const lat = event.lat;
    const lon = event.lon;
    const fuelModelNumber = event.fuelModelNo;
    if(lat !== undefined || lon !== undefined && fuelModelNumber !== undefined){
        const weatherURL = 'https://api.darksky.net/forecast/37f15e5ba37febda526b82b195f15d37/'+ event.lat+','+event.lon;
        const fuelModelInfoURL = 'http://emxsys.net/wmt-rest/rs/fuelmodels/'+fuelModelNumber;

        request('GET', weatherURL).done(function(res) {
            const weatherBody = JSON.parse(res.getBody());
            const currentTemp = weatherBody.currently.temperature;
            const currentHumidity = weatherBody.currently.humidity;
            const currentWindSpeed = weatherBody.currently.windSpeed;
            const currentWindDir  = weatherBody.currently.windBearing;
            const currentCloudCover = weatherBody.currently.cloudCover;
            const currentWeather = {
                airTemperature: { type: "air_temp:F", value: currentTemp, unit: "fahrenheit"},
                relativeHumidity: {type: "rel_humidity:%", "value": currentHumidity, "unit": "%"},
                windSpeed: {type: "wind_speed:kts",value: currentWindSpeed,unit: "kt"},
                windDirection: {type: "wind_dir:deg",value: currentWindDir,unit: "deg"},
                cloudCover: {type: "cloud_cover:%",value: currentCloudCover,unit: "%"}
            }

            request('GET', fuelModelInfoURL).done(function (res) {
                const fuelModelInfoBody = JSON.parse(res.getBody());
                var FormData = request.FormData;
                var data = new FormData();

                data.append('fuelModel', JSON.stringify(fuelModelInfoBody));
                data.append('fuelMoisture', constants.fuelMoisture);

                request('POST', surfaceFuelURL, {form: data}).done(function (res) {
                    var surfaceFuelBody = JSON.parse(res.getBody());

                    var data = new FormData();
                    data.append('weather', JSON.stringify(currentWeather));
                    data.append('terrain', constants.terrain);
                    data.append('fuel', JSON.stringify(surfaceFuelBody))

                    request('POST', surfaceFireURL, {form: data}).done(function (res) {
                        var surfaceFireBody = JSON.parse(res.getBody());
                        //computeData(surfaceFireBody,callback)
                        const speedMax = surfaceFireBody.rateOfSpreadMax.value*0.00508;
                        const speedBack = surfaceFireBody.rateOfSpreadBacking.value*0.00508;
                        const speedFlanks = surfaceFireBody.rateOfSpreadFlanking.value*0.00508;
                        let directionMaxSpread = surfaceFireBody.directionMaxSpread.value;

                        const x_length = 30;
                        const y_length = 11;
                        const z_length = Math.sqrt(x_length*x_length + y_length*y_length);

                        const l1 = l5 = y_length;
                        const l2 = l4 = l6 = l8 = z_length;
                        const l3 = l7 = x_length;

                        const x1 = Math.abs(directionMaxSpread);
                        const x2 = Math.abs(directionMaxSpread - 45);
                        const x3 = Math.abs(directionMaxSpread - 90);
                        const x4 = Math.abs(directionMaxSpread - 135);
                        const x5 = Math.abs(directionMaxSpread - 180);
                        const x6 = Math.abs(directionMaxSpread - 225);
                        const x7 = Math.abs(directionMaxSpread - 270);
                        const x8 = Math.abs(directionMaxSpread - 315);

                        let v1 = 0;
                        let v2 = 0;
                        let v3 = 0;
                        let v4 = 0;
                        let v5 = 0;
                        let v6 = 0;
                        let v7 = 0;
                        let v8 = 0;

                        let t1 = -1;
                        let t2 = -1;
                        let t3 = -1;
                        let t4 = -1;
                        let t5 = -1;
                        let t6 = -1;
                        let t7 = -1;
                        let t8 = -1;


                        if (x1 < x2 && x1 < x3 && x1 < x4 && x1 < x5 && x1 < x6 && x1 < x7 && x1 < x8) {
                            directionMaxSpread = 0;
                            v1 = speedMax;
                            v8 = v2 = 2/3*speedMax;
                            v3 = v7 = speedFlanks;
                            v4 = v6 = (speedFlanks + speedBack) / 2;
                            v5 = speedBack;
                        } else if (x2 < x1 && x2 < x3 && x2 < x4 && x2 < x5 && x2 < x6 && x2 < x7 && x2 < x8) {
                            directionMaxSpread = 45;
                            v2 = speedBack;
                            v1 = v3 = 2/3*speedMax;
                            v8 = v4 = speedFlanks;
                            v7 = v5 = (speedFlanks + speedBack) / 2;
                            v6 = speedBack;
                        } else if (x3 < x1 && x3 < x2 && x3 < x4 && x3 < x5 && x3 < x6 && x3 < x7 && x3 < x8) {
                            directionMaxSpread = 90;
                            v3 = speedMax;
                            v2 = v4 = 2/3*speedMax;
                            v1 = v5 = speedFlanks;
                            v8 = v6 = (speedFlanks + speedBack) /2;
                            v2 = speedBack;
                        } else if (x4 < x1 && x4 < x2 && x4 < x3 && x4 < x5 && x4 < x6 && x4 < x7 && x4 < x8) {
                            directionMaxSpread = 135;
                            v4 = speedMax;
                            v3 = v5 = 2/3*speedMax;
                            v2 = v6 = speedFlanks;
                            v1 = v7 = (speedFlanks + speedBack) /2;
                            v8 = speedBack;
                        } else if (x5 < x1 && x5 < x2 && x5 < x3 && x5 < x4 && x5 < x6 && x5 < x7 && x5 < x8) {
                            directionMaxSpread = 180;
                            v5 = speedMax;
                            v4 = v6 = 2/3*speedMax;
                            v3 = v7 = speedFlanks;
                            v2 = v8 = (speedFlanks + speedBack) /2;
                            v1 = speedBack;
                        } else if (x6 < x1 && x6 < x2 && x6 < x3 && x6 < x4 && x6 < x5 && x6 < x7 && x6 < x8) {
                            directionMaxSpread = 225;
                            v6 = speedMax;
                            v5 = v6 = speedMax*2/3;
                            v4 = v7 = speedFlanks;
                            v3 = v8 = (speedBack + speedFlanks) /2;
                            v2 = speedBack;
                        } else if (x7 < x1 && x7 < x2 && x7 < x3 && x7 < x4 && x7 < x5 && x7 < x6 && x7 < x8) {
                            directionMaxSpread = 270;
                            v7 = speedMax;
                            v6 = v8 = speedMax*2/3;
                            v5 = v1 = speedFlanks;
                            v4 = v2 = (speedFlanks + speedBack) /2;
                            v3 = speedBack;
                        } else if (x8 < x1 && x8 < x2 && x8 < x3 && x8 < x4 && x8 < x5 && x8 < x6 && x8 < x7) {
                            directionMaxSpread = 315;
                            v8 = speedMax;
                            v7 = v1 = speedMax*2/3;
                            v6 = v2 = speedFlanks;
                            v5 = v3 = (speedBack + speedFlanks) /2;
                            v6 = speedBack;
                        }

                        if(v1 === 0) v1 = 0.00001;
                        if(v2 === 0) v2 = 0.00001;
                        if(v3 === 0) v3 = 0.00001;
                        if(v4 === 0) v4 = 0.00001;
                        if(v5 === 0) v5 = 0.00001;
                        if(v6 === 0) v6 = 0.00001;
                        if(v7 === 0) v7 = 0.00001;
                        if(v8 === 0) v8 = 0.00001;

                        t1 = Math.round(l1/v1);
                        t2 = Math.round(l2/v2);
                        t3 = Math.round(l3/v3);
                        t4 = Math.round(l4/v4);
                        t5 = Math.round(l5/v5);
                        t6 = Math.round(l6/v6);
                        t7 = Math.round(l7/v7);
                        t8 = Math.round(l8/v8);

                        const times = [t1,t2,t3,t4,t5,t6,t7,t8];
                        callback(null, JSON.stringify(times));
                    });
                });
            });
        })
    }else{
        callback(null,'You need to provide POST json body : { lat: number, lon: number, fuelModelNo: [0-13]}');
    }



};