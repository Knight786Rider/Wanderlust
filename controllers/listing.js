const Listing = require('../models/listing');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Utility to safely escape regex patterns
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// =============================
// INDEX (supports AJAX & normal GET)
// =============================
const index = async (req, res) => {
  try {
    const {
      category,
      search,
      checkin,
      checkout,
      guests,
      minPrice,
      maxPrice,
      ajax
    } = req.query;

    const query = {};

    if (category && category !== 'All') query.category = category;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      query.$or = [{ location: regex }, { country: regex }];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (guests) query.guests = { $gte: Number(guests) };

    if (checkin && checkout) {
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      if (isNaN(checkinDate) || isNaN(checkoutDate) || checkinDate > checkoutDate) {
        if (req.xhr || req.headers.accept?.includes('json') || ajax) {
          return res.json({ ok: false, msg: 'Invalid check-in / check-out' });
        } else {
          req.flash('error', 'Invalid check-in / check-out dates.');
          return res.redirect('/listings');
        }
      }
      query.availableDates = {
        $elemMatch: {
          start: { $lte: checkinDate },
          end: { $gte: checkoutDate }
        }
      };
    }

    const listings = await Listing.find(query).lean();

    // If it's an AJAX (fetch) request — return JSON instead of rendering
    if (req.xhr || req.headers.accept?.includes('json') || ajax === '1') {
      const data = listings.map(l => ({
        _id: l._id,
        title: l.title,
        location: l.location,
        country: l.country,
        price: l.price || 0,
        imageUrl: l.image?.url || 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60',
        guests: l.guests || 1,
        category: l.category || 'Rooms'
      }));
      return res.json({ ok: true, listings: data });
    }

    // Otherwise, render the EJS page normally
    res.render('listings/index.ejs', {
      listings,
      category: category || 'All',
      search: search || '',
      checkin: checkin || '',
      checkout: checkout || '',
      guests: guests || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || ''
    });
  } catch (err) {
    console.error(err);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ ok: false, msg: 'Server error' });
    } else {
      req.flash('error', 'Something went wrong.');
      return res.redirect('/listings');
    }
  }
};

// =============================
// NEW FORM
// =============================
const renderNewForm = (req, res) => {
  res.render('listings/new.ejs');
};

// =============================
// CREATE LISTING
// =============================
const createListing = async (req, res, next) => {
  try {
    const geoData = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
      .send();

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.geometry = geoData.body.features[0].geometry;

    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    await newListing.save();
    req.flash('success', 'New listing created!');
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating listing.');
    res.redirect('/listings');
  }
};

// =============================
// SHOW LISTING
// =============================
const showListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: 'reviews',
        populate: { path: 'author' }
      })
      .populate('owner');

    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/listings');
    }

    res.render('listings/show.ejs', { listing });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading listing.');
    res.redirect('/listings');
  }
};

// =============================
// EDIT FORM
// =============================
const editListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/listings');
    }

    res.render('listings/edit.ejs', { listing });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading edit form.');
    res.redirect('/listings');
  }
};

// =============================
// UPDATE LISTING
// =============================
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename
      };
    }

    await listing.save();
    req.flash('success', 'Listing updated successfully!');
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating listing.');
    res.redirect('/listings');
  }
};

// =============================
// DELETE LISTING
// =============================
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing deleted successfully!');
    res.redirect('/listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting listing.');
    res.redirect('/listings');
  }
};

// =============================
// EXPORT ALL CONTROLLER FUNCTIONS
// =============================
module.exports = {
  index,
  renderNewForm,
  createListing,
  showListing,
  editListing,
  updateListing,
  deleteListing
};
