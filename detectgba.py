import wiringpi as wiringpi
import time

def WriteSPI32(w): 
    buf = [0,0,0,0]
    buf[3] = (w & 0x000000ff)
    buf[2] = (w & 0x0000ff00) >> 8
    buf[1] = (w & 0x00ff0000) >> 16
    buf[0] = (w & 0xff000000) >> 24
    length, buf = wiringpi.wiringPiSPIDataRW(0, bytes(buf))
    r=0
    r += buf[0] << 24
    r += buf[1] << 16
    r += buf[2] << 8
    r += buf[3]
    return r

def WaitSPI32(w, comp): 
    r=-1
    while(r!=comp):
        r = WriteSPI32(w)
        time.sleep(0.01)

def main():
    wiringpi.wiringPiSetupGpio()
    wiringpi.wiringPiSPISetup(0, 100000)
    print("Looking for Gameboy")
    WaitSPI32(0x00006202, 0x72026202) ## Look for gba

    print("Found GBA!")

main()