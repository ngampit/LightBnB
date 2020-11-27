const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
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
  pool.query(`
  SELECT name FROM users
  WHERE email = $1
  `, [email])
  .then(res => { return Promise.resolve(res.rows[0].name)})
  .catch(err => { return  null});
  let user;
  for (const userId in users) {
    user = users[userId];
    if (user.email.toLowerCase() === email.toLowerCase()) {
      break;
    } else {
      user = null;
    }
  }
  return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  pool.query(`
  SELECT name FROM users
  WHERE id = $1
  `, [id])
  .then(res => { return Promise.resolve(res.rows[0].name)});
  return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  //console.log('this function', user);
  var queryString = "insert into users(name, email, password) values ('"+user.name+"','"+user.email+"','"+user.password+"') returning id";
  pool.query(queryString)
  .then(res => { 
    return Promise.resolve(res.rows[0].id);
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
pool.query(
`SELECT properties.*, reservations.*, avg(rating) as average_rating 
FROM reservations
JOIN properties ON reservations.property_id = properties.id 
JOIN property_reviews ON properties.id = property_reviews.property_id 
WHERE reservations.guest_id = $1,${guest_id} 
AND reservations.end_date < now()::date 
GROUP BY properties.id, reservations.id 
ORDER BY reservations.start_date 
LIMIT = $2`,[limit])
.then(res => { 
  console.log(res);
  //return Promise.resolve(res.rows);
});
  return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

//  const getAllProperties = function(options, limit = 10) {
//   pool.query(`
//   SELECT * FROM properties
//   LIMIT $1
//   `, [limit])
//   .then(res => res.rows);
//   const limitedProperties = {};
//   for (let i = 1; i <= limit; i++) {
//     limitedProperties[i] = properties[i];
//   }
//   return Promise.resolve(limitedProperties);
// }
// exports.getAllProperties = getAllProperties;


const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  if (options.city && options.owner_id && options.minimum_price_per_night && options.maximum_price_per_night && options.minimum_rating) {
    queryParams.push(`%${options.city}%`);
    queryParams.push(`${options.owner_id}`);
    queryParams.push(`${options.minimum_price_per_night}`);
    queryParams.push(`${options.maximum_price_per_night}`);
    queryParams.push(`${options.minimum_rating}`);
    queryString += `WHERE city LIKE $${queryParams.length - (queryParams.length -1)} 
    AND the owner id LIKE $${queryParams.length - (queryParams.length -2)}
    AND the minimum price = , $${queryParams.length - (queryParams.length -3)}
    AND the maximum price = , $${queryParams.length - (queryParams.length -4)}
    AND the minimum rating =, $${queryParams.length - (queryParams.length -5)}`;
  }

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `WHERE cost_per_night > $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `WHERE cost_per_night <= $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `WHERE rating >= $${queryParams.length}`;
  }


  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
  .then(res => res.rows);
}


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
