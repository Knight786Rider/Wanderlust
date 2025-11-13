const express = require('express');
const router = express.Router();
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const { listingSchema } = require("../schema.js");
const listingController = require("../controllers/listing.js");
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// ✅ Validation middleware
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  } else {
    next();
  }
};

// ✅ Updated Index Route — with category & AJAX support
// 🔍 Live search suggestions (AJAX)
router.get("/search/suggestions", async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";
    if (!query) return res.json({ suggestions: [] });

    const regex = new RegExp(query, "i");
    const suggestions = await Listing.find({
      $or: [{ title: regex }, { location: regex }, { country: regex }],
    })
      .limit(5)
      .select("title location country");

    res.json({
      suggestions: suggestions.map(s => ({
        text: `${s.title} — ${s.location}, ${s.country}`,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🏠 All Listings + Search & Category Filter
// 🏠 All Listings + Search, Category & AJAX Filter Support
// 🏠 All Listings + Search & Category Filter + AJAX JSON support
router.get("/", async (req, res) => {
  try {
    const { category, search, ajax } = req.query;
    let query = {};

    // ✅ Filter by category
    if (category && category !== "all" && category !== "All") {
      query.category = category;
    }

    // ✅ Text search
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { location: regex },
        { country: regex },
        { description: regex },
      ];
    }

    const listings = await Listing.find(query).populate("owner");

    // ✅ If AJAX request, return JSON instead of rendering page
    if (ajax === "1" || req.headers.accept?.includes("application/json")) {
      return res.json({
        ok: true,
        listings: listings.map(l => ({
          _id: l._id,
          title: l.title,
          location: l.location,
          country: l.country,
          price: l.price,
          guests: l.guests,
          imageUrl: l.image?.url || "/images/default.jpg",
        })),
      });
    }

    // ✅ Normal page render (non-AJAX)
    res.render("listings/index", {
      listings,
      currentCategory: category || "all",
      searchQuery: search || "",
    });
  } catch (err) {
    console.error("Error fetching listings:", err);
    req.flash("error", "Unable to load listings right now.");
    res.redirect("/");
  }
});

// ✅ Create Route
router.post("/", isLoggedIn, upload.single('imageFile'), wrapAsync(listingController.createListing));

// ✅ New Listing Form
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ✅ Show / Update / Delete Routes
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(isLoggedIn, upload.single('imageFile'), wrapAsync(listingController.updateListing))
  .delete(isLoggedIn, wrapAsync(listingController.deleteListing));

// ✅ Edit Route
router.get("/:id/edit", isLoggedIn, wrapAsync(listingController.editListing));

module.exports = router;
