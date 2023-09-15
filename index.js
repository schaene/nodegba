// Import required modules and libraries
const express = require('express'); // The part that makes the web interface happen
var favicon = require('serve-favicon') // I just... really wanted the icon I guess?
const multer = require('multer'); // Handles file uploads
const fs = require('fs-extra'); // Provides file system operations
const path = require('path'); //
const { exec } = require('child_process'); // Allows running shell commands
const { Console } = require('console');
// Create an instance of the Express application
const app = express();
const port = 3000;
//Use the favicon
app.use(favicon(path.join('./public/favicon.ico')))

// Configure Express settings
app.set('view engine', 'ejs'); // Set the view engine to EJS
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Define the directory for file uploads
const uploadDir = './public/uploads';

// Clean a given filename, replaces unwanted characters with underscores.
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


// 1. Display a list of uploaded files and their size
app.get('/', async (req, res) => {
  const files = await fs.readdir(uploadDir);
  const filesWithSize = [];

  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const fileStats = await fs.stat(filePath);

    // Convert file size reading to KB. Max 2 decimal places
    let fileSize = parseInt((fileStats.size / 1024).toFixed(2));
    // Inflate the file size for GB and NES files to account for the emulators
    if(endsWithGb(file)){ // Adds the size of the Goomba Emulator to the GB rom (42.4 KB)
      fileSize = (fileSize + 42.4).toFixed(2);
    }
    else if(endsWithNes(file)){// Adds the size of the Pocket NES Emulator to the NES rom (46.41 KB)
      fileSize = (fileSize + 46.41).toFixed(2);
    }
    // Send off the filename and filesize
    filesWithSize.push({ name: file, size: fileSize});
  }
  res.render('index', { files: filesWithSize });
});

// 2. Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  // Refreshes the page after upload to make the file show on screen
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

// Determines if the rom is a gb game
function endsWithGb(fileName) {
  const regex = /\.gb$/i; // The "$" matches the end of the string, and "i" makes it case-insensitive
  return regex.test(fileName);
}

// Determines if the rom is an nes game
function endsWithNes(fileName) {
  const regex = /\.nes$/i; // The "$" matches the end of the string, and "i" makes it case-insensitive
  return regex.test(fileName);
}

// Concatenates 2 given files into one file. The emulators will read the rom attatched to the end of the file.
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

// Creates a Goomba Emulator rom with the given rom
function makeGoomba(filename){
  // Deletes the current goomba patched rom if it exists
  if (fs.existsSync('./public/temproms/goombapatch.gba')) {
    fs.unlink('./public/temproms/goombapatch.gba', (err) => {
      if (err) {
        console.error('Error deleting the file:', err);
      } else {
        console.log('File deleted successfully.');
      }
    });
  }
  // Patch the emulator
  concatenateFiles('./public/goomba.gba', './public/uploads/' + filename, './public/temproms/goombapatch.gba');
}

// Creates a Pocket NES rom with the given rom
function makePocketNES(filename){
  // Deletes the current nes patched rom if it exists
  if (fs.existsSync('./public/temproms/pocketnespatch.gba')) {
    fs.unlink('./public/temproms/pocketnespatch.gba', (err) => {
      if (err) {
        console.error('Error deleting the file:', err);
      } else {
        console.log('File deleted successfully.');
      }
    });
  } 
  // Patch the emulator
  concatenateFiles('./public/pocketnes.gba', './public/uploads/' + filename, './public/temproms/pocketnespatch.gba');
}

// 6. Send the Multiboot to the GBA using multiboot.py
let mbcommand; // stores the command to be executed later
app.post('/run-script/:filename/:filesize', (req, res) => {
  const filename = req.params.filename;
  const filesize = req.params.filesize
  console.log(filename);

  // Check if it's a gameboy game, and if so, package with goomba
  if (endsWithGb(filename)) {
    makeGoomba(filename);
    // Set the command to the goomba file
    mbcommand = `python multiboot.py ./public/temproms/goombapatch.gba`;
  } else if (endsWithNes(filename)) {
    makePocketNES(filename);
    // Set the command to the pocketnes file
    mbcommand = `python multiboot.py ./public/temproms/pocketnespatch.gba`;
  } else {
    // set the command to the given GBA file
    mbcommand = `python multiboot.py ${path.join(uploadDir, filename)}`;
  }

  //res.write('Searching for GBA');

  // Check if a GBA is connected
  console.log('Checking if gba is connected:');
  exec('python detectgba.py', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running script: ${error.message}`);
      res.status(500).send('Error running script');
      return;
    }
    console.log(`Script output: ${stdout}`);
    res.render('searching.ejs', {filename : filename, fileSize : filesize})
    // Send ROM to GBA
    console.log('Sending rom to GBA');
    exec(mbcommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running script: ${error.message}`);
        res.status(500).send('Error running script');
        return;
      }
      console.log(`Script output: ${stdout}`);
    });
  });
});


// Start the Express server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
