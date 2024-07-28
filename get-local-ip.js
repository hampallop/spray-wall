const os = require('os')

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const interfaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[interfaceName]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost' // Fallback to localhost if no suitable IP is found
}

const localIP = getLocalIP()
console.log(`Local IP: http://${localIP}:3000`)
