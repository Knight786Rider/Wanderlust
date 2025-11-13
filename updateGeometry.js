// 📄 updateGeometry.js
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
require("dotenv").config();

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });

async function updateAllListings() {
  try {
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("✅ MongoDB connected!");

    const listings = await Listing.find({
      $or: [
        { geometry: { $exists: false } },
        { "geometry.coordinates": { $size: 0 } }
      ]
    });

    if (listings.length === 0) {
      console.log("🎉 All listings already have geometry!");
      return mongoose.connection.close();
    }

    console.log(`📍 Found ${listings.length} listings missing geometry...`);

    for (let listing of listings) {
      try {
        if (!listing.location || listing.location.trim() === "") {
          console.log(`⚠️ Skipping "${listing.title}" — no location field.`);
          continue;
        }

        const geoData = await geocodingClient
          .forwardGeocode({
            query: listing.location,
            limit: 1
          })
          .send();

        if (geoData.body.features.length > 0) {
          listing.geometry = geoData.body.features[0].geometry;
          await listing.save();
          console.log(`✅ Updated: ${listing.title}`);
        } else {
          console.log(`❌ No coordinates found for: ${listing.title}`);
        }

        // Small delay to avoid Mapbox rate limits
        await new Promise(res => setTimeout(res, 200));
      } catch (innerErr) {
        console.error(`🚨 Error updating ${listing.title}:`, innerErr.message);
      }
    }

    console.log("🎯 Done! All possible listings updated.");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Main error:", err);
    mongoose.connection.close();
  }
}

updateAllListings();
