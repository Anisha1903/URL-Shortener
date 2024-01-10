require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const validURL = require('valid-url');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGOOSE_URI);

const urlSchema = new mongoose.Schema({
    longURL: String,
    shortURL: String,
    shortID: String
});

const URL = new mongoose.model('URL', urlSchema);

app.get('/', (req, res) => {
    res.render('index', { error: "", newURL: {} });
});

function isValidLongURL(url) {
    return validURL.isUri(url);
}

app.post('/', async (req, res) => {
    const longURL = req.body.longURL;

    // Check if the input URL is a valid long URL
    if (isValidLongURL(longURL)) {
        const shortID = nanoid(10);
        const shortURL = process.env.BASE_URL + "/" + shortID;

        if (shortURL.length < 120 && longURL.length > 120) {
            const newURL = new URL({
                longURL: longURL,
                shortURL: shortURL,
                shortID: shortID
            });

            try {
                const result = await URL.findOne({ longURL: longURL });
                if (!result) {
                    await newURL.save();
                }
                res.render('index', { error: "", newURL: { shortURL: shortURL } });
            } catch (error) {
                const errorMessage = "Error processing the URL!";
                res.render('index', { error: errorMessage, newURL: {} });
            }
        } else {
            // Display an error for invalid URL lengths
            const error = "Short URLs are restricted! Please provide a long URL exceeding 120 characters in length, such as \
             'https://example.com/great-deals-on-products-and-services'.";
            res.render('index', { error: error, newURL: {} });
        }
    } else {
        const error = "Invalid Long URL! Please enter a valid long URL.";
        res.render('index', { error: error, newURL: {} });
    }
});

app.get('/:shortID', async (req, res) => {
    const result = await URL.findOne({ shortID: req.params.shortID });
    if (!result) return res.sendStatus(404);

    res.redirect(result.longURL);
});

function isShortURL(url) {
    // You may need to customize this check based on your URL structure
    return url.startsWith(process.env.BASE_URL);
}

app.listen(process.env.PORT || 3001, () => {
    console.log("Successfully listening");
});
