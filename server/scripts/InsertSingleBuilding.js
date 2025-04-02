const mongoose = require('mongoose');
const Building = require('../models/Building');

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://Nikhil:Lebron233021@parking1.08cpt.mongodb.net/P4SBU?retryWrites=true&w=majority';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function insertSingleBuilding() {
  try {
    // Example building data:
    const buildingData = {
      name: "Island Federal Credit Union Arena",
      buildingID: "IFCA",
      id: 999999999,
      building: "university", 
      geometry: [
        [
            [
              -73.126105248102,
              40.917746954350804
            ],
            [
              -73.12610897427399,
              40.91773709945528
            ],
            [
              -73.12613133130664,
              40.91773991513983
            ],
            [
              -73.12630087213635,
              40.91764418179483
            ],
            [
              -73.12630087213635,
              40.917627287660565
            ],
            [
              -73.12637539557757,
              40.91763573472795
            ],
            [
              -73.12644991901945,
              40.91729785118187
            ],
            [
              -73.12637539557757,
              40.917287996218874
            ],
            [
              -73.12637721706699,
              40.91727282943074
            ],
            [
              -73.12625626798392,
              40.917144102676446
            ],
            [
              -73.12578950673517,
              40.917081026475586
            ],
            [
              -73.12578609971884,
              40.91709518644444
            ],
            [
              -73.12571966289839,
              40.91708360101549
            ],
            [
              -73.12571114535756,
              40.917120931834205
            ],
            [
              -73.12564641204528,
              40.91715053902047
            ],
            [
              -73.12560893486496,
              40.91714925175182
            ],
            [
              -73.12551353811122,
              40.91758705233545
            ],
            [
              -73.12555953283301,
              40.917594775896305
            ],
            [
              -73.12563619070247,
              40.917679735002736
            ],
            [
              -73.12566515034194,
              40.91768230951931
            ],
            [
              -73.12566685385012,
              40.91769518210137
            ],
            [
              -73.12609954493485,
              40.917746672403524
            ]
          ]
      ],
      // Pre-computed centroid (using Turf.js in your other script, for example)
      centroid: {
        x: -73.1200,
        y: 40.9035
      }
    };

    // Insert the new building document
    const building = await Building.create(buildingData);
    console.log('Inserted building:', building);
  } catch (error) {
    console.error('Error inserting building:', error);
  } finally {
    mongoose.connection.close();
  }
}

insertSingleBuilding();
