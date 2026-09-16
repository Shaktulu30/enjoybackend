export const toPublicEvent = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  organizer: event.organizer.toString(),
  status: event.status,
});
