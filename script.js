'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');
const cityImIn = document.querySelector('.city');

const renderCountry = function (data, className = '') {
  const name = data.name?.common;
  const flag = data.flags?.svg;
  const region = data.region;
  const language = Object.values(data.languages).join(', ');
  const currency = Object.values(data.currencies)[0].name;
  const html = `
  <article class="country ${className}">
    <img class="country__img" src="${flag}" />
    <div class="country__data">
      <h3 class="country__name">${name}</h3>
      <h4 class="country__region">${region}</h4>
      <p class="country__row"><span>👫</span>${(
        +data.population / 1000000
      ).toFixed(1)} M people</p>
      <p class="country__row"><span>🗣️</span>${language}</p>
      <p class="country__row"><span>💰</span>${currency}</p>
    </div>
  </article>  
  `;

  countriesContainer.insertAdjacentHTML('beforeend', html);
  countriesContainer.style.opacity = 1;
};

const renderError = function (msg) {
  countriesContainer.insertAdjacentText('beforeend', msg);
  countriesContainer.style.opacity = 1;
};

//get json(because it gets data and coverts it into json)
const getJSON = function (url, errorMsg = 'Something went wrong') {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`${errorMsg} ${response.status}`);
    return response.json();
  });
}; //this will return a promise

//flat chain of promises, getting the country and its neighbour with fetch and promise
const getCountryData = function (country) {
  //Country 1
  getJSON(`https://restcountries.com/v3.1/name/${country}`, 'Country not found')
    .then(data => {
      renderCountry(data[0]);
      const neighbour = data[0].borders?.[0];
      if (!neighbour) throw new Error('No neighbour found!');

      //Country 2
      return getJSON(
        `https://restcountries.com/v3.1/alpha/${neighbour}`,
        'Country not found'
      );
    }) //this returns a promise
    .then(data => renderCountry(data[0], 'neighbour'))
    .catch(err => {
      //catching the error that might occur in the promises above
      console.error(err);
      renderError(`Something went wrong. ${err.message} Try again!`);
      //err.message is the messsage we passed above in the throw new error
    })
    //no matter if te promise is fulfilled or rejected and the error returns a promise, finally's callback function is called
    //ex:to hide the loading spinner
    .finally(() => {
      countriesContainer.style.opacity = 1;
    });
};

//promisifying geolocation API
const getPosition = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject); //same as above
  });
};
//async/await
//is an async function= it will be loaded on the background
const whereAmI = async function () {
  try {
    btn.disabled = true;

    //Geolocation
    const pos = await getPosition();
    const { latitude: lat, longitude: lng } = pos.coords;

    //reverse geocoding
    const resGeo = await fetch(
      `https://geocode.xyz/${lat},${lng}?geoit=json&auth=152873530374618e15913220x12090`
    );
    if (!resGeo.ok) throw new Error('Problem getting location data');
    const dataGeo = await resGeo.json();
    //country data
    const res = await fetch(
      `https://restcountries.com/v3.1/name/${dataGeo.country}`
    );
    if (!res.ok) throw new Error('Problem getting country');
    //await will stop the code excecution at this point of the function, until the premise if fulfilled(until the data has been fetched here)
    const data = await res.json();
    getCountryData(`${dataGeo.country}`);

    const city = `
    <div>
    <h1 class="city-name">You are in ${dataGeo.city}, ${dataGeo.country}</h1>
    </div>
    `;
    cityImIn.insertAdjacentHTML('afterbegin', city);

    btn.style.display = 'none';
  } catch (err) {
    console.error(err.message);

    //reject promise returned from async function
    throw err;
  }
};

btn.addEventListener('click', whereAmI);
