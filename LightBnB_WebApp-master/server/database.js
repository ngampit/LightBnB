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
    .then((data) => {
      user = data.rows[0];
      if (user.email === email) {
        return Promise.resolve(user);
      } else {
        user = null;
        return Promise.reject(user);
      }
    });
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
    .then((data) => {
      user = data.rows[0];
      if (user.id === id) {
        return Promise.resolve(user);
      } else {
        user = null;
        return Promise.reject(user);
      }
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
    .then((data) => {
      return Promise.resolve((data.rows[0]));
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
  JOIN properties prop ON r.property_id = prop.id
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
  });
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
  const limitedProperties = {};
  for (let i = 1; i <= limit; i++) {
    limitedProperties[i] = properties[i];
  }
  return Promise.resolve(limitedProperties);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
