
let lon1,lat1,lon2,lat2;

function locate(){
    navigator.geolocation.getCurrentPosition((position) =>{
        let lon=position.coords.longitude;
        let lat=position.coords.latitude;
        return lon,lat;
    })
}

lon1,lat1=locate();



export function distance() {
    lon2,lat2=locate();

	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515*1.609344*1000;
        
        lon1=lon2;
        lat1=lat2;
		return dist;
	}
}

