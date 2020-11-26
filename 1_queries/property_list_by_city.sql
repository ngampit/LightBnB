SELECT properties.id as id, properties.title as title, properties.cost_per_night as cost_per_night, AVG(property_reviews.rating) as average_rating 
FROM properties
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE property_reviews.rating >= 4 AND properties.city LIKE 'Vancouver'
GROUP BY properties.id
ORDER BY properties.cost_per_night ASC
LIMIT 10;