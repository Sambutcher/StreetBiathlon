
let pos1, pos2;

async function locate() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(position => {
            resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        }, reject, {
            enableHighAccuracy: true,
            timeout: Infinity,
            maximumAge: 0
        });
    });
}

pos1 = await locate();

export async function distance() {
    pos2 = await locate();
    console.log(pos2);

    if ((pos1.latitude == pos2.latitude) && (pos1.longitude == pos2.longitude)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * pos1.latitude / 180;
        var radlat2 = Math.PI * pos2.latitude / 180;
        var theta = pos1.longitude - pos2.longitude;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515 * 1.609344 * 1000;

        pos1 = pos2;
        return dist;
    }
}

