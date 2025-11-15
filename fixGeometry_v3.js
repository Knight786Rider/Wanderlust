// fixGeometry_v3.js
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const Listing = require("./models/listing");

const mapBoxToken = process.env.MAP_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

async function fixGeometry() {
  try {
    const dbUrl = process.env.ATLASDB_URL;

    console.log("Connecting to MongoDB...");
    await mongoose.connect(dbUrl);
    console.log("Connected!");

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings.`);

    for (let listing of listings) {
      console.log(`\n🔎 Checking: ${listing.title}`);

      const locationString = `${listing.location}, ${listing.country}`.trim();
      if (!locationString) {
        console.log("❌ No location — skipping");
        continue;
      }

      // ALWAYS re-geocode, ignore existing geometry
      const geoData = await geocoder
        .forwardGeocode({
          query: locationString,
          limit: 1,
        })
        .send();

      if (
        !geoData.body ||
        !geoData.body.features ||
        geoData.body.features.length === 0
      ) {
        console.log("❌ Geocoding failed");
        continue;
      }

      const coords = geoData.body.features[0].geometry.coordinates;

      // Force-set geometry even if it exists
      listing.geometry = {
        type: "Point",
        coordinates: coords,
      };

      await listing.save();

      console.log(`✔ Updated: ${listing.title}`);
      console.log("   →", listing.geometry.coordinates);
    }

    console.log("\n🎉 ALL listings updated successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

fixGeometry();
