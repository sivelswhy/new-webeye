var map = L.map('map').setView([51.505, -0.09], 3);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
}).addTo(map);

var planeIcon = L.divIcon({
  className: 'plane-icon',
  html: '<img src="/icons/basic_plane.svg" alt="Plane Icon" width="32" height="32">',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
var planeDetails = document.createElement('div');
planeDetails.className = 'plane-details';
document.body.appendChild(planeDetails);
let markers = {};
let aircraftPositions = {} // Object to store marker references
var countdownInterval; // Global variable to store the countdown interval
var lastUpdateTime = 0;
function startCountdown(seconds) {
  let remainingTime = seconds;

  countdownInterval = setInterval(() => {
    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      updateMarkers(); // Refresh markers
    } else {
      document.getElementById('next-update').textContent = `Next update in: ${remainingTime} seconds`;
      remainingTime--;
    }
  }, 1000); // Update every second
}
function updateMarkers() {
  fetch('https://api.ivao.aero/v2/tracker/whazzup', {
    headers: {
      'If-Modified-Since': new Date(lastUpdateTime).toUTCString(),
    },
  })
    .then(response => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 304) {
        console.log('No update since last refresh');
        startCountdown(30);
        return null;
      } else {
        throw new Error('Failed to fetch data');
      }
    })
    .then(data => {
      if (data) {
        lastUpdateTime = Date.now() - 30000;

        data.clients.pilots.forEach(pilot => {
          var lat = pilot.lastTrack.latitude;
          var lon = pilot.lastTrack.longitude;

          if (markers[pilot.callsign]) {
            var marker = markers[pilot.callsign];
            var currentPosition = marker.getLatLng();
            var newPosition = L.latLng(lat, lon);

            if (!currentPosition.equals(newPosition)) {
              // Calculate rotation angle based on line direction
              var rotationAngle = Math.atan2(newPosition.lng - currentPosition.lng, newPosition.lat - currentPosition.lat) * (180 / Math.PI);

              // Update marker position
              marker.setLatLng(newPosition);

              // Draw a line between previous and current positions
              var previousPosition = aircraftPositions[pilot.callsign];
              if (previousPosition) {
                var line = L.polyline([previousPosition, newPosition], { color: 'blue' }).addTo(map);
                marker.setIcon(L.divIcon({
                  className: 'plane-icon',
                  html: `<img src="/icons/basic_plane.svg" alt="Plane Icon" width="32" height="32" style="transform: rotate(${rotationAngle}deg);">`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                }));
              }

              // Store current position as previous position
              aircraftPositions[pilot.callsign] = newPosition;
            }
          } else {
            var marker = L.marker([lat, lon], {
              icon: L.divIcon({
                className: 'plane-icon',
                html: `<img src="/icons/basic_plane.svg" alt="Plane Icon" width="32" height="32">`,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })
            }).addTo(map);
            markers[pilot.callsign] = marker;
            aircraftPositions[pilot.callsign] = L.latLng(lat, lon);

            var popupContent = `
              <b>Callsign:</b> ${pilot.callsign}<br>
              <b>Altitude:</b> ${pilot.lastTrack.altitude}<br>
              <b>Ground Speed:</b> ${pilot.lastTrack.groundSpeed}
            `;
            marker.bindPopup(popupContent);

            marker.on('click', () => {
              showPlaneDetails(pilot);
            });
          }
        });

        startCountdown(30);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}
updateMarkers(); // Initial call
setInterval(updateMarkers, 30000);

// Function to display plane details on the left
function showPlaneDetails(pilot) {
planeDetails.innerHTML = `
  <h2>Plane Details</h2>
  <p><b>Callsign:</b> ${pilot.callsign}</p>
  <p><b>Altitude:</b> ${pilot.lastTrack.altitude}</p>
  <p><b>Ground Speed:</b> ${pilot.lastTrack.groundSpeed}</p>
  <!-- Add more plane details here -->
`;
}

updateMarkers(); // Initial call
setInterval(updateMarkers, 30000);

function updateDateTime() {
    var now = new Date();
    var options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZone: 'UTC',
    };
    document.getElementById('datetime').textContent = `${now.toLocaleString('en-US', options)} UTC(Zoulou)`
  }
  
  updateDateTime(); // Initial call
  setInterval(updateDateTime, 1000);