//? The following function is provided by https://github.com/bbecquet/Leaflet.RotatedMarker and is under MIT License

(function() {
  // save these original methods before they are overwritten
  var proto_initIcon = L.Marker.prototype._initIcon;
  var proto_setPos = L.Marker.prototype._setPos;

  var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

  L.Marker.addInitHook(function () {
      var iconOptions = this.options.icon && this.options.icon.options;
      var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
      if (iconAnchor) {
          iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
      }
      this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom' ;
      this.options.rotationAngle = this.options.rotationAngle || 0;

      // Ensure marker keeps rotated during dragging
      this.on('drag', function(e) { e.target._applyRotation(); });
  });

  L.Marker.include({
      _initIcon: function() {
          proto_initIcon.call(this);
      },

      _setPos: function (pos) {
          proto_setPos.call(this, pos);
          this._applyRotation();
      },

      _applyRotation: function () {
          if(this.options.rotationAngle) {
              this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

              if(oldIE) {
                  // for IE 9, use the 2D rotation
                  this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
              } else {
                  // for modern browsers, prefer the 3D accelerated version
                  this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
              }
          }
      },

      setRotationAngle: function(angle) {
          this.options.rotationAngle = angle;
          this.update();
          return this;
      },

      setRotationOrigin: function(origin) {
          this.options.rotationOrigin = origin;
          this.update();
          return this;
      }
  });
})();
















function getAirplane(planeCode) {
  const airplaneList = [
    "A124",
    "A20N",
    "A21N",
    "A225",
    "A300",
    "A310",
    "A318",
    "A319",
    "A320",
    "A321",
    "A332",
    "A333",
    "A342",
    "A343",
    "A345",
    "A346",
    "A359",
    "A35K",
    "A388",
    "A3ST",
    "AS30",
    "AT4x",
    "AT7x",
    "B46x",
    "B703",
    "B712",
    "B720",
    "B721",
    "B722",
    "B731",
    "B732",
    "B733",
    "B734",
    "B735",
    "B736",
    "B737",
    "B738",
    "B739",
    "B741",
    "B742",
    "B743",
    "B744",
    "B748",
    "B74S",
    "B752",
    "B753",
    "B762",
    "B763",
    "B764",
    "B772",
    "B773",
    "B77L",
    "B77W",
    "B788",
    "B789",
    "BE58",
    "B78X",
    "BA11",
    "BALL",
    "BCLF",
    "BN2P",
    "C1572",
    "C25C",
    "C700",
    "COMT",
    "CONC",
    "CRJ9",
    "DA40",
    "DA642",
    "DC10",
    "DC6",
    "DH8A",
    "DH8D",
    "DHC6",
    "E120",
    "E135",
    "E17x",
    "E19x",
    "E29x",
    "E75x",
    "EC345",
    "EUFI",
    "F22",
    "F18",
    "GLID",
    "HDJT",
    "L101",
    "MD11",
    "MD8x",
    "P28x",
    "PC12",
    "SB20",
    "SB34",
    "SF50",
    "SR22",
    "T154",
    "TBM9",
    "VC10",
    "VISC"
];

  const closest = airplaneList.reduce((a, b) => {
    const commonCharsA = countCommonCharacters(planeCode, a);
    const commonCharsB = countCommonCharacters(planeCode, b);
    return commonCharsA >= commonCharsB ? a : b;
  });

  // Check if no common characters were found
  if (countCommonCharacters(planeCode, closest) === 0) {
    return "A320";
  }

  return closest;
}

function countCommonCharacters(str1, str2) {
  let count = 0;
  const minLength = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLength; i++) {
    if (str1[i] === str2[i]) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
var map = L.map("map").setView([51.505, -0.09], 3);

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap Contributors</a>',
}).addTo(map);

// var planeIcon = L.icon({
//   iconUrl: 'public/basic_plane.svg',
//   iconSize: [32, 32],
// });

var markers = {}; // Store markers by callsign

function updateMarkers() {
  fetch("https://api.ivao.aero/v2/tracker/whazzup")
    .then((response) => response.json())
    .then((data) => {
      for (const pilot of data.clients.pilots) {

        var callsign = pilot.callsign;
        var lat = pilot.lastTrack.latitude;
        var lon = pilot.lastTrack.longitude;
        var headingPlane = pilot.lastTrack.heading;
        // Check if marker exists for the callsign
        if (markers[callsign]) {
          markers[callsign].setLatLng([lat, lon]);
          markers[callsign].setRotationAngle(headingPlane)
          // Update popup content
          markers[callsign].getPopup().setContent(
            `<b>Callsign:</b> ${pilot.callsign}<br><b>Altitude:</b> ${
              pilot.lastTrack.altitude
            }<br><b>Ground Speed:</b> ${
              pilot.lastTrack.groundSpeed
            }<br><b>Aircraft Type:</b> ${
              pilot.flightPlan.aircraftId
            }, ${getAirplane(pilot.flightPlan.aircraftId)}`
          );
        } else {
          // Create new marker
          var marker = L.marker([lat, lon],{
            rotationAngle: headingPlane,
            icon: L.icon({
              iconUrl: `/public/plane_icons/${getAirplane(
                pilot.flightPlan.aircraftId
              )}.png`,
              iconSize: [32, 32],
            }),
          }).addTo(map);

          // Bind popup
          marker
            .bindPopup(
              `<b>Callsign:</b> ${pilot.callsign}<br><b>Altitude:</b> ${
                pilot.lastTrack.altitude
              }<br><b>Ground Speed:</b> ${
                pilot.lastTrack.groundSpeed
              }<br><b>Aircraft Type:</b> ${
                pilot.flightPlan.aircraftId
              }, ${getAirplane(pilot.flightPlan.aircraftId)}`
            )

          // Store marker by callsign
          markers[callsign] = marker;
        }
      }
      // data.clients.pilots.forEach((pilot) => {

      // });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      alert(
        "An error occurred. Please report this to the Developer with the following error :\n\n" +
          error
      );
    });
}

updateMarkers(); // Initial call
setInterval(updateMarkers, 30000);