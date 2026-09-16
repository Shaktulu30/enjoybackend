export const toPublicEvent = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  price: event.price,
  status: event.status,
  organizer: event.organizer.toString(),
});
