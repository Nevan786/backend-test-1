const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

describe("api calls", () => {

    // Test for adding a valid blog post
   
    test('Add blog post successfully with all fields', async () => {
   
      
        const newPost = new FormData();
        newPost.append('title', 'Title Test');
        newPost.append('description', 'Description Test');
        newPost.append('date_time', '1671017885');
        newPost.append('main_image', fs.createReadStream('main_image.jpg'));
        newPost.append('additional_images', fs.createReadStream('additional_images.jpg'));

        const response = await axios.post('http://localhost:3000/blog', newPost);
      
        
        expect(response.status).toBe(200);
      });

        // Test for adding a blog post with missing fields
test('Add blog post with missing fields failed Test', async () => {
    const newPost = new FormData();
    newPost.append('title', 'Title Test');
    newPost.append('description', 'Description Test');


  const response = await axios.post('http://localhost:3000/blog', newPost);

  expect(response.status).toBe(400);
  expect(response.data.error).toBe('Missing required field(s): date_time');
});


// // Test for adding a blog post with a main image larger than 1MB
test('Add blog post with large main image failed Test', async () => {
    const newPost = new FormData();
    newPost.append('title', 'Title Test');
    newPost.append('description', 'Description Test');
    newPost.append('date_time', '1671017885');
    newPost.append('main_image', fs.createReadStream('main_image.jpg'));
    newPost.append('additional_images', fs.createReadStream('additional_images.jpg'));

  const response = await axios.post('http://localhost:3000/blog', newPost);
  expect(response.status).toBe(400);
  expect(response.data.error).toBe('Main image size exceeds 1MB');
});


// // Test for adding a blog post with a title containing special characters
test('Add blog post with special characters in title failed Test', async () => {
    const newPost = new FormData();
    newPost.append('title', 'Title Test#$%');
    newPost.append('description', 'Description Test');
    newPost.append('date_time', '1671017885');
    newPost.append('main_image', fs.createReadStream('main_image.jpg'));
    newPost.append('additional_images', fs.createReadStream('additional_images.jpg'));

  const response = await axios.post('http://localhost:3000/blog', newPost);

  expect(response.status).toBe(400);
  expect(response.data.error).toBe('Title contains special characters');
});

// Test for adding a blog post with an ISO date_time
test('Add blog post with ISO date_time failed Test', async () => {
    const newPost = new FormData();
    newPost.append('title', 'Title Test#$%');
    newPost.append('description', 'Description Test');
    newPost.append('date_time', '2022-04-08T12:00:00.000Z');
    newPost.append('main_image', fs.createReadStream('main_image.jpg'));
    newPost.append('additional_images', fs.createReadStream('additional_images.jpg'));

  const response = await axios.post('http://localhost:3000/blog', newPost);
  expect(response.status).toBe(400);
  expect(response.data.error).toBe('date_time is not a Unix timestamp');
});

})
  



