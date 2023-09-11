// Import required modules and libraries
const express = require('express');
var favicon = require('serve-favicon')
const multer = require('multer');
const fs = require('fs-extra'); // Provides file system operations
const path = require('path');
const { exec } = require('child_process'); // Allows running shell commands
const { Console } = require('console');

// Create an instance of the Express application
const app = express();
const port = 3000;
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// Configure Express settings
app.set('view engine', 'ejs'); // Set the view engine to EJS
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Define the directory for file uploads
const uploadDir = path.join(__dirname, 'public/uploads');

// Function to clean up a filename
const cleanFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9_.]/g, '_');
};

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, cleanFileName(file.originalname));
  },
});
const upload = multer({ storage });

// Define routes and their corresponding actions

// 1. Display a list of uploaded files on the homepage
app.get('/', async (req, res) => {
  const files = await fs.readdir(uploadDir);
  res.render('index', { files });
});

// 2. Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

// 3. Serve file downloads
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const file = path.join(uploadDir, filename);
  res.download(file);
});

// 4. Handle file renaming
app.post('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  const oldPath = path.join(uploadDir, oldName);
  const newPath = path.join(uploadDir, cleanFileName(newName));

  fs.rename(oldPath, newPath)
    .then(() => {
      res.redirect('/');
    })
    .catch((err) => {
      res.status(500).send('Error renaming file');
    });
});

// 5. Handle file deletion
app.post('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const file = path.join(uploadDir, filename);

  fs.unlink(file)
    .then(() => {
      res.redirect('/');
    })
    .catch((err) => {
      res.status(500).send('Error deleting file');
    });
});

//determines if the rom is a gb game
function endsWithGb(fileName) {
  const regex = /\.gb$/i; // The "$" matches the end of the string, and "i" makes it case-insensitive
  return regex.test(fileName);
}

//determines if the rom is an nes game
function endsWithNes(fileName) {
  const regex = /\.nes$/i; // The "$" matches the end of the string, and "i" makes it case-insensitive
  return regex.test(fileName);
}

//creates a goomba emulator rom for the file
async function concatenateFiles(inputFilePath1, inputFilePath2, outputFilePath) {
  try {
    const sourceFiles = [inputFilePath1, inputFilePath2];
    const destinationStream = fs.createWriteStream(outputFilePath, { flags: 'a' });

    function copyFile(sourceFile) {
      return new Promise((resolve, reject) => {
        const sourceStream = fs.createReadStream(sourceFile);

        sourceStream.on('error', reject);
        destinationStream.on('error', reject);

        sourceStream.pipe(destinationStream, { end: false });
        sourceStream.on('end', () => {
          resolve();
        });
      });
    }

    for (const sourceFile of sourceFiles) {
      await copyFile(sourceFile);
      console.log(`Copied ${sourceFile} to ${outputFilePath}`);
    }
    
    destinationStream.end();
    console.log('All files copied successfully.');
  } catch (err) {
    console.error('Error copying files:', err);
  }
}

// 6. Execute a Python script with a specified file as an argument
let mbcommand;//stores the command to be executed later
app.post('/run-script/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(filename);
  const scriptPath = 'multiboot.py'; // Replace with your Python script path

  //Check if its a gameboy game, and if so, package with goomba
  if(endsWithGb(filename)){
    //deletes the cureent goomba patched rom if it exists
    if (fs.existsSync('./public/goombapatch.gba')) {
      console.log('File exists.');
    
      // Delete the file
      fs.unlink('./public/goombapatch.gba', (err) => {
        if (err) {
          console.error('Error deleting the file:', err);
        } else {
          console.log('File deleted successfully.');
        }
      });
    } else {
      console.log('File does not exist.');
    }
    //patched the files
    concatenateFiles('./public/goomba.gba', './public/uploads/' + filename, './public/goombapatch.gba');
    //set the command to the goomba file
    mbcommand = `python ${scriptPath} ./public/goombapatch.gba`;
  }
  else if(endsWithNes(filename)){
    //deletes the cureent nes patched rom if it exists
    if (fs.existsSync('./public/pocketnespatch.gba')) {
      console.log('File exists.');
    
      // Delete the file
      fs.unlink('./public/pocketnespatch.gba', (err) => {
        if (err) {
          console.error('Error deleting the file:', err);
        } else {
          console.log('File deleted successfully.');
        }
      });
    } else {
      console.log('File does not exist.');
    }
    
    //patched the files
    //concatenateFiles('./public/pocketnes.gba', './public/fillerduck', './public/almostthere.abc');
    concatenateFiles('./public/pocketnes.gba', './public/uploads/' + filename, './public/pocketnespatch.gba');
    
    //set the command to the pocketnes file
    mbcommand = `python ${scriptPath} ./public/pocketnespatch.gba`;
  }
  else{
    mbcommand = `python ${scriptPath} ${path.join(uploadDir, filename)}`;
  }
  
  const command = mbcommand;

  // Execute the Python script using the child_process module
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running script: ${error.message}`);
      res.status(500).send('Error running script');
      return;
    }
    console.log(`Script output: ${stdout}`);
    res.redirect('/');
  });
});

// Start the Express server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});