const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg')

const pool = new Pool ({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'vagrant'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  let user;
  queryString = '';
  queryParams = [];

  queryString = `SELECT name, email, password, id FROM users WHERE email = $1`;
  queryParams = [email];
  return pool.query(queryString, queryParams)
    
    .then((res) => {
//      console.log('get email', res.rows[0]);
      user = res.rows[0];
      if (user.email === email) {
        return Promise.resolve(user);
      } else {
        user = null;
        return Promise.reject(user);
      }
    })
    .catch((err)=>{
       return Promise.reject(err);
    })
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  queryString = '';
  queryParams = [];
  queryString = `SELECT name, email, password, id FROM users WHERE id = $1`;
  queryParams = [id];
  let user;
  
  return pool.query(queryString, queryParams)
    .then((res) => {
      user = res.rows[0];
      if (user.id === id) {
        return Promise.resolve(user);
      } else {
        user = null;
        return Promise.reject(user);
      }
    })
    .catch((err)=>{
       return Promise.reject(err);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  queryString = '';
  queryParams = [];
  queryParams = [user.name, user.email, user.password];
  queryString = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
  return pool.query(queryString, queryParams)
    .then((res) => {
//      console.log(res.rows[0]);
      return Promise.resolve((res.rows[0]));
    })
    .catch((err)=>{
      return Promise.reject(err);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  queryString = [];
  queryParams = ``;
  queryString = `
  SELECT res.*,
  prop.*,
  AVG(pr.rating)
  FROM reservations res
  JOIN properties prop ON res.property_id = prop.id
  JOIN property_reviews pr ON pr.property_id = prop.id
  WHERE res.guest_id = $1
  AND res.end_date < now()
  GROUP BY res.id, prop.id
  ORDER BY start_date ASC
  LIMIT $2;`;

  queryParams = [guest_id, limit];
  return pool.query(queryString, queryParams)
  .then((res)=>{
    return Promise.resolve(res.rows);
  })
  .catch(err => Promise.reject(err));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  queryString = '';
  queryParams = [];
  queryString = `SELECT p.*,
  ROUND(AVG(pr.rating)) AS average_rating
  FROM properties p
  JOIN property_reviews pr ON pr.property_id = p.id `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE p.city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.owner_id}`);
      queryString += `AND p.owner_id = $${queryParams.length} `;
    } else {
      queryParams.push(`${options.owner_id}`);
      queryString += `WHERE p.owner_id = $${queryParams.length} `;
    }
  }
 
  if (options.minimum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += `AND p.cost_per_night >= $${queryParams.length} `;
    } else {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += `WHERE p.cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += `AND p.cost_per_night <= $${queryParams.length} `;
    } else {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += `WHERE p.cost_per_night <= $${queryParams.length} `;
    }
  }

  queryString += `GROUP BY p.id`;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING AVG(pr.rating) >= $${queryParams.length } `;
  }

  queryParams.push(limit);
  queryString += ` ORDER BY p.cost_per_night ASC
  LIMIT $${queryParams.length};`;

  return pool.query(queryString, queryParams)
    .then((res) => {
      return Promise.resolve(res.rows);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  queryString = '';
  queryParams = [];
  queryString = `
  INSERT INTO properties (owner_id, title, description,thumbnail_photo_url,cover_photo_url,cost_per_night,street,city,province,post_code,country,parking_spaces,number_of_bathrooms,number_of_bedrooms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`;
  queryParams = 
  [ 
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];
  
  return pool.query(queryString,queryParams)
  .then ((res)=>{
    return Promise.resolve(res.rows[0]);
  }); 
};
exports.addProperty = addProperty;
