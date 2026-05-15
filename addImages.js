// addImages.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://iriscredotteta:Niwenshuti250@ac-9q9mfo1-shard-00-00.qexuxqn.mongodb.net:27017,ac-9q9mfo1-shard-00-01.qexuxqn.mongodb.net:27017,ac-9q9mfo1-shard-00-02.qexuxqn.mongodb.net:27017/RwandaMenya?ssl=true&replicaSet=atlas-by4k1l-shard-0&authSource=admin&appName=Cluster0';

// Remove the options object – just pass the URI
const client = new MongoClient(uri);

async function addStaticImages() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');

    const db = client.db('RwandaMenya');
    const collection = db.collection('attractions');

    const imageToAttractionName = {
      'akagera.jpg': 'Akagera National Park',
      'bisoke.png': 'Mount Bisoke',
      'campaign.png': 'Campaign Against Genocide Museum',
      'congo.png': 'Congo Nile Trail Viewpoints',
      'convention.png': 'Kigali Convention Centre',
      'gishwati.png': 'Gishwati-Mukura National Park',
      'heaven.png': 'Heaven Restaurant',
      'ibyiwacu.png': "Ib'Iwacu Cultural Village",
      'inema.png': 'Inema Arts Center',
      'kalisimbi.png': 'Mount Karisimbi',
      'kandt.png': 'Kandt House Museum',
      'kigali.png': 'Kigali Eco Park',
      'kimironko.png': 'Kimironko Market',
       'kings.png': "King's Palace Museum",
      'kivu.png': 'Lake Kivu',
      'marriot.png': 'Kigali Marriott Hotel',
      'memorial.png': 'Kigali Genocide Memorial',
      'muhazi.png': 'Lake Muhazi',
      'murambi.png': 'Murambi Genocide Memorial',
      'ndaba.png': 'Ndaba Waterfall',
      'nyanza.png': 'Nyanza Royal Palace Museum',
      'nyungwe.png': 'Nyungwe Forest National Park',
      'one.png': 'One&Only Gorilla’s Nest',
      'poivre.png': 'Poivre Noir Bistro',
      'radisson.png': 'Radisson Blu Hotel Kigali',
      'rebero.png': 'Rebero Viewpoint',
      'rusumo.png': 'Rusumo Falls',
      'rwanda.png': 'Rwanda Art Museum',
      'volcanoes.png': 'Volcanoes National Park'
    };

    for (const [filename, attractionName] of Object.entries(imageToAttractionName)) {
      const attraction = await collection.findOne({ name: attractionName });
      if (attraction) {
        const result = await collection.updateOne(
          { _id: attraction._id },
          { $push: { images: `/images/${filename}` } }
        );
        console.log(`✅ ${attractionName} → ${filename}: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
      } else {
        console.log(`❌ Not found: ${attractionName}`);
      }
    }

    console.log('All images added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

addStaticImages();