// server/services/forecastService.js
const ParkingLot = require('../models/ParkingLot');

async function getPopularTimes(lotId) {
  const lot = await ParkingLot.findOne({ lotId });
  if (!lot) {
    throw new Error(`Parking lot ${lotId} not found`);
  }

  const records = lot.occupancyHistory || [];
  // Example: We'll aggregate by 'available' (could do 'occupied' if you prefer).
  
  // Data structure for sums & counts:
  // dataByDayHour[day][hour] = { sum: number, count: number }
  const dataByDayHour = {};
  for (let day = 0; day < 7; day++) {
    dataByDayHour[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      dataByDayHour[day][hour] = { sum: 0, count: 0 };
    }
  }

  // Populate sums and counts
  records.forEach(record => {
    const ts = new Date(record.timestamp);
    const day = ts.getDay();    // 0 = Sunday, 6 = Saturday
    const hour = ts.getHours(); // 0-23
    dataByDayHour[day][hour].sum += record.available;
    dataByDayHour[day][hour].count++;
  });

  // Convert aggregated data into final result
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const popularTimes = [];

  for (let day = 0; day < 7; day++) {
    const hoursArray = [];
    for (let hour = 0; hour < 24; hour++) {
      const { sum, count } = dataByDayHour[day][hour];
      const average = count > 0 ? sum / count : 0;
      hoursArray.push({
        hour,
        average: Math.round(average) // or keep it as floating
      });
    }

    popularTimes.push({
      dayOfWeek: day,
      dayName: daysOfWeek[day],
      hours: hoursArray
    });
  }

  return popularTimes;
}

module.exports = {
  getPopularTimes
};
