const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const slugify = require('slugify');
const jwt = require('jsonwebtoken');
var bodyParser = require('body-parser')

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 3000;

const secretKey = 'your_jwt_secret_key';
// create multer storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '.jpg');
  },
});


// create multer file filter
const fileFilter = (req, file, cb) => {
  // only accept jpg files
  if (file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG files are allowed.'), false);
  }
};

// create multer instance with configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 }, // limit file size to 1MB
  fileFilter: fileFilter,
});

// Load blog posts from the JSON file
let blogs = [];
try {
  const data = fs.readFileSync('blogs.json');
  blogs = JSON.parse(data);
} catch (err) {
  console.error(err);
}

// console.log(blogs)

// API endpoint to add a new blog post
app.post('/blog', upload.any(['main_image','additional_images'], 5), async (req, res) => {

  try {
    // validate the inputs
    const { title, description, date_time } = req.body;

    if (!title || title.length < 5 || title.length > 50 || /[^a-zA-Z0-9 ]/.test(title)) {
      return res.status(400).json({ error: 'Invalid title. Title should be between 5 to 50 characters and should not contain any special characters.' });
    }

    if (!description || description.length > 500) {
      return res.status(400).json({ error: 'Invalid description. Description should be maximum 500 characters.' });
    }

    if (!date_time || date_time > Date.now()) {
      return res.status(400).json({ error: 'Invalid date_time. Date time should be a valid Unix timestamp and should not be before current time.' });
    }
    // console.log(req.files)

    // compress the image and save to the "images" folder
    const files = req.files;
    var mainImage= '';
    var additionalimage = [];
    console.log(files)
    for (const file of files) {
        const path = file.path;
        // console.log(path)
        const filename = file.fieldname;
        if (filename == 'main_image'){
          mainImage = `main_image_${blogs.length+1}_test.jpg`
          const metadata = await sharp(path).metadata();
          await sharp(path)
              .resize({ width: Math.round(metadata.width * 0.75) })
              .toFile(`images/${mainImage}`);
        }
          else{
            additionalimage = `additional_image_${blogs.length+1}_test.jpg`
            const metadata = await sharp(path).metadata();
            await sharp(path)
                .resize({ width: Math.round(metadata.width * 0.75) })
                .toFile(`images/${additionalimage}`);
          }
               // remove the original file from the system
               fs.unlinkSync(path);



    }

    // console.log(blogs);
    const newBlogPost = {
      reference: blogs.length + 1,
      title,
      description,
      main_image: `images/${mainImage}`,
      additional_images:[`images/${additionalimage}`],
      date_time: parseInt(date_time),
    };
 blogs.push(newBlogPost);
fs.writeFileSync('blogs.json', JSON.stringify(blogs));


    // return the newly added blog post
    res.json(newBlogPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to get all blog posts
app.get('/blog', async (req, res) => {

  try {
    // read all blog posts from the "blogs.json" file
    const blogsRaw = fs.readFileSync('blogs.json');
    const blogs = JSON.parse(blogsRaw);

    // format "date_time" from unix timestamp to ISO string
    for (const blog of blogs) {
      blog.date_time = new Date(blog.date_time * 1000).toISOString();
      blog.title_slug = blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^-|-$)/g, '');
    }

    // return all blog posts
    res.json(blogs);


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// API to generate a timed token for image_path
app.get('/generate-token', (req, res) => {
  const image_path = req.query.image_path;
  if (!image_path) {
    res.status(400).json({ error: 'image_path parameter is missing' });
    return;
  }

  // Generate a token that will expire after 5 minutes
  const token = jwt.sign({ image_path }, secretKey, { expiresIn: '5m' });

  res.json({ token });
});

// API to get image by token
app.get('/get-image-by-token', (req, res) => {
  const image_path = req.query.image_path;
  const token = req.query.token;
  if (!image_path || !token) {
    res.status(400).json({ error: 'image_path and/or token parameters are missing' });
    return;
  }

  try {
    // Verify the token and check if it's made for the input "image_path"
    const decoded = jwt.verify(token, secretKey);
    if (decoded.image_path !== image_path) {
      res.status(400).json({ error: 'Invalid token for the specified image_path' });
      return;
    }
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
    return;
  }

  // Read the image file and send it back in a way that browser
  const image = fs.readFileSync(image_path);
  res.writeHead(200, { 'Content-Type': 'image/jpeg' });
  res.end(image, 'binary');
});







// start the server
app.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`)
});
