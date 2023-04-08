const axios = require('axios');


function getData(){
  axios.get('http://localhost:3000/blog')
  .then(response => console.log(response.data))
  .catch(error =>console.log(error));
}

getData();


module.exports ={getData}