# Turning the Pi into a WiFi HotSpot

Until I can resolve connecting the iPad / Tablet directly to the Pi and being able to achieve simultaneously transmit data to the tablet and charge the tablet, using RaspAP to set the Raspberry Pi as a wifi hotspot is the best solution.

## Pros
- The tablet is always connected to the Pi, allowing for device configuration without having to remove the SD card
- The tablet need only be configured to connect to the RPi's WiFi hotspot
- Any tablet can theoretically be swapped in for the iPad so long as it can connect to the RPi's HotSpot

## Cons
- Uses more Power and CPU
- Opens up opportunities for 3rd party hacking
- Need to record the HotSpot SSID and Password somewhere physically on the device

## HotSpot Setup
In the event that I have to re-install the Raspberry Pi, here's what I did to achieve this.
- Semi-follow the [Tech Craft YouTube tutorial](https://www.youtube.com/watch?v=YbvSS8MJm2s):
  - Connect to the RPi via Ethernet/SSH
  - Make sure the TP bot server is not running (it will conflict with the website hosted on port 80)
  - Update the Raspberry Pi: `sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get autoremove && sudo apt-get autoclean`
  - Reboot (if required): `sudo reboot`
  - Run the RaspAp Quick Installer with: `curl -sL https://install.raspap.com | bash`
    - lighttpd root: `Y`
    - complete installation with these values: `Y`
    - Enable HttpOnly: `Y`
    - Enable Control Service: `Y`
    - Install ad blocking: `N`
    - Install OpenVPN: `N`
    - reboot: `Y`
  - Connect to the Pi via Ethernet from a web browser: `http://[RPi Ethernet IP Address]:80`
    - Hotspot
      - Disable Hotspot
    - WiFi Client: 
      - Delete the pre-configured WiFi Credentials
      - Rescan
      - If you receive the `Wifi settings updated but cannot restart (cannot execute "wpa_cli reconfigure")`
       - run: `sudo wpa_supplicant -B -Dnl80211,wext -c/etc/wpa_supplicant/wpa_supplicant.conf -iwlan0`
        - Rescan
      - Add to the appropriate WiFi network
      - Connect to the appropriate WiFi network
      - *Important*: you need to be able to see the <-> connected arrows before proceeding
    - Hotspot
      - change the SSID / Security settings
        - SSID: `tpbot`
        - Encryption: CCMP
        - PSK: `telepres`
        - Country Code: `Australia`
        - WiFi client AP mode: true
      - Reboot
    - SSH
      - Edit `/etc/dnsmasq.conf` and ensure the line `dhcp-range=192.168.50.50,192.168.50.150,12h` exists - if not - add it
      - Reboot
    - System - Advanced
      - Web Server Port: `3000`
      - Reboot
  - Connect to the Pi via Ethernet from a web browser: `http://[RPi Ethernet IP Address]:3000`
    - In the Network tab - make sure the network interfaces have the expected IP addresses and are appropriately 
    connected.
  - Disconnect the Pi from the Ethernet
  - Connect to the Pi via WiFi from a web browser: `http://[RPi WiFi IP Address]:3000`
    - In the Network tab - make sure the network interfaces have the expected IP addresses and are appropriately connected
  - Spin up the TPBot server again and attempt to connect to it from the iPad on `192.168.50.1`