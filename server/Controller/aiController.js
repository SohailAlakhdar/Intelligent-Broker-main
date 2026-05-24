const express = require("express");
const { spawn } = require("child_process");
const path = require('path')
const estate = require("../Model/estateModel");
const pythonPath = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
const { promisify } = require('util');
const { spawn } = require('child_process');

// Returns 1 if ANY keyword from pattern is found in target, 0 otherwise
function containsKeyword(target, keywords) {
  return keywords.some(word => target.includes(word)) ? 1 : 0;
}
const FEATURE_KEYWORDS = {
  pool: ["pool", "مسبح", "سباحة", "سباحه"],
  garden: ["garden", "حديقة", "حديقه", "جنينة", "جنينه"],
  seaView: ["sea", "nile", "نيل", "بحر", "بحيرة", "بحيره"],
  roof: ["roof", "سطح", "روف"],
  compound: ["compound", "مجمع", "كمباوند", "كومباوند", "كموند"],
};

function preprocessRequest(req) {
  const { numOfRooms, numOfBathRooms, size, addressOnMap, category, desc } = req.body;

  const categoryCode = category === 'Apartment' ? 1 : 2;

  const features = Object.fromEntries(
    Object.entries(FEATURE_KEYWORDS).map(([key, keywords]) => [
      key,
      containsKeyword(desc, keywords),
    ])
  );

  return [
    numOfRooms,
    numOfBathRooms,
    categoryCode,
    size,
    addressOnMap[0],
    addressOnMap[1],
    features.garden,
    features.pool,
    features.seaView,
    features.roof,
    features.compound,
  ];
}

async function getRecommendedEstate(ids) {
  return estate.estateModel
    .find({
      status: 'approved',
      _id: { $in: ids },
    })
    .populate('category')
    .populate('type')
    .exec();
}

// Helper to run a Python script and return a Promise
function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const python = spawn(pythonPath, [scriptPath, ...args]);

    let stderr = '';

    python.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script failed with code ${code}: ${stderr}`));
      } else {
        resolve();
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });
  });
}


// exports.predictEstate = async function (req, res) {

//   const formData = preprocess_request(req);
//   const python = await spawn(pythonPath, [path.join(__dirname, '..', 'Model', 'predictionModel.py'), formData]);
//   // const python = spawn('python', [path.join(__dirname, '..', 'Model', 'predictionModel.py'), formData.join(",")]);
//   python.stdout.on('data', (data) => {
//     console.log(data.toString('utf8'));
//     const price = Number(data.toString('utf8')).toFixed(0);
//     res.send({ result: price })
//   })
//   python.stderr.on('data', (data) => {
//     console.log(data.toString('utf8'));
//   })
// }
exports.predictEstate = function (req, res) {
  let formData;

  try {
    formData = preprocess_request(req);
  } catch (err) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  // Validate all fields are numeric to prevent injection
  if (!formData.every(val => Number.isFinite(Number(val)))) {
    return res.status(400).json({ error: "Form data must contain only numeric values" });
  }

  const python = spawn(pythonPath, [
    path.join(__dirname, '..', 'Model', 'predictionModel.py'),
    formData.join(",")
  ]);

  let result = "";
  let errorOutput = "";

  python.stdout.on('data', (data) => {
    result += data.toString('utf8');
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString('utf8');
  });

  python.on('close', (code) => {
    if (code !== 0) {
      console.error("Python error:", errorOutput);
      return res.status(500).json({ error: "Prediction failed" });
    }

    const price = Math.round(Number(result.trim()));

    if (isNaN(price)) {
      return res.status(500).json({ error: "Invalid prediction output" });
    }

    res.json({ result: price }); // number, not string
  });

  python.on('error', (err) => {
    console.error("Spawn error:", err);
    res.status(500).json({ error: "Failed to start prediction process" });
  });
};


exports.getRecommendedEstate = async function (req, res) {
  try {
    const python = spawn(pythonPath, [
      path.join(__dirname, '..', 'Model', 'recommendationModel.py'),
      req.user.id,
    ]);

    let dataBuffer = '';

    python.stdout.on('data', (chunk) => {
      dataBuffer += chunk.toString('utf8');
    });

    python.stderr.on('data', (data) => {
      console.error('[Python error]:', data.toString('utf8'));
    });

    python.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Recommendation model failed' });
      }

      try {
        const ids = JSON.parse(dataBuffer.trim());
        const estates = await getRecommendedEstate(ids);
        res.json(estates);
      } catch (parseError) {
        console.error('Failed to parse Python output:', parseError);
        res.status(500).json({ error: 'Invalid model output' });
      }
    });

    python.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      res.status(500).json({ error: 'Failed to start recommendation model' });
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.recommendationTrainingModel = async function () {
  try {
    await runPythonScript(
      path.join(__dirname, '..', 'Model', 'recommendationTrainingModel.py')
    );
    console.log('Recommendation model trained successfully');
  } catch (err) {
    console.error('Recommendation training failed:', err.message);
  }
};

exports.TrainPredictModel = async function (req, res) {
  try {
    await runPythonScript(
      path.join(__dirname, '..', 'Model', 'predictionTrainingModel.py')
    );
    res.json({ message: 'Prediction model trained successfully' });
  } catch (err) {
    console.error('Prediction training failed:', err.message);
    res.status(500).json({ error: 'Model training failed', details: err.message });
  }
};