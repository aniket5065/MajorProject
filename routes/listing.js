// routes/listing.js

const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');

const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

// Multer setup for local uploads
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

/* ──────────────────────────────────────────────────────────────────────────────
   ROUTES - Sab jagah () hata diye gaye hain wrapAsync ke andar
────────────────────────────────────────────────────────────────────────────── */

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListings)
    );

// New form - brackets nahi
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))                    // ← () hata diya
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListings)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListings)
    );

// Edit form
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListing));  // ← () hata diya

module.exports = router;