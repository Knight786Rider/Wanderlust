const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  let newReview = new Review(req.body.review);
  newReview.author = req.user._id; // 👈 store logged-in user as author

  await newReview.save();
  listing.reviews.push(newReview);
  await listing.save();

  req.flash("success", "Successfully added a new review!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }

  // Authorization check 👇
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not authorized to delete this review!");
    return res.redirect(`/listings/${id}`);
  }

  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Successfully deleted the review!");
  res.redirect(`/listings/${id}`);
};