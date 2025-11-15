// map.js
try {
  if (!mapToken) {
    console.error('Map token missing. Please set MAP_TOKEN in environment.');
  } else if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    console.error('Invalid coordinates:', coordinates);
  } else {
    mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: coordinates,
      zoom: 9,
    });

    map.addControl(new mapboxgl.NavigationControl());

    new mapboxgl.Marker({ color: "red" })
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <h4>${locationName}</h4>
          <p>Exact location of the listing</p>
        `)
      )
      .addTo(map);
  }
} catch (err) {
  console.error('Map initialization failed:', err);
}
