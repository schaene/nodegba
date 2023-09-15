# Node GBA Multiboot Server
An easy web interface for multibooting ROMs on a GBA

[![Demo Video](https://img.youtube.com/vi/6aRVQPOI518/hqdefault.jpg)](https://youtu.be/6aRVQPOI518)
![Home](/assets/home.png)

supports GBA, NES, and GB ROMS by automatically using the Goomba GB and Pocket NES Emulators
---

## Hardware Setup:
Using whatever means you prefer, connect the GBA to the serial headers on the Raspberry Pi. a wiring guide can be found [here](https://github.com/rodri042/gba-remote-play#how-it-works)

You can use a breakout board such as [this one by vaguilar](https://www.tindie.com/products/vaguilar/gameboy-coloradvancesp-link-cable-breakout-board/)
![GBA Breakout](/assets/gba-breakout.jpg)

Or sacrifice a GBA link cable like I did
![RIP knock-off Link Cable](/assets/ripped-apart-cable.jpg)

Only the SO, SI, SC, And GND pins are required

---

## Installation:

Assuming you already have Raspberry Pi OS installed, and connected to your network:

 1. [Install Node.js]( https://deb.nodesource.com/)
 2. Install the WiringPi Library:  <br>```pip install wiringpi```</br>
 3. Clone this Repository, or download the master.zip:<br>[Clone](https://github.com/schaene/nodegba.git) //////////// [Master](https://github.com/schaene/nodegba/archive/refs/heads/main.zip)
 4. run ``npm install .`` in the root of the repository
 5. run ``node .`` to start the server
 
 ---
## Usage:

Connect to the Web Server using a Browser on a device connected to the same network as the Raspberry Pi, using the IP address or hostname of the pi, and port 3000. eg:
``raspberrypi.local:3000``
or
``192.168.0.xxx:3000``

From there,  you should see the home page. Using the "Choose File" and "Upload" buttons, upload any NES or GB rom, or Multiboot GBA Game to the server. After the file is uploaded, you can send it to the GBA by clicking "Send MultiBoot"

NES and GB games are automatically patched with the Pocket NES and Goomba emulators respectively, and their listed file size accounts for the size of the game after the emulator is attached.

---

## Limitations

Using Multiboot comes with some limitations. Firstly, the max rom size is 256 KB. This is the size of the GBA's EWRAM, where the entire game is stored. Games created with multiboot in mind shouldn't run into this limit, but later NES and GB titles may be too large, especially when including the 45~ KB emulators.

GBA titles must be built for multiboot. Although a ROM may be less than 256 KB, it will sit at a white screen unless it was specifically made for Multiboot. 
 
 ---
 ## Special thanks:
 

 - [Bartjakobs](https://github.com/bartjakobs)
 - [Dwedit](https://github.com/Dwedit)

---
### Includes:

<ul>
  <li>https://github.com/bartjakobs/GBA-Multiboot-Python</li>
  <li>https://github.com/Dwedit/PocketNES</li>
  <li>http://goomba.webpersona.com/</li>
</ul>
