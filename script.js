/**
 * Star Topology Network Simulation
 * Demonstrates star network topology with interactive PC management,
 * data transmission simulation, and real-time network monitoring.
 * 
 * @author Network Topology Project
 * @version 2.0
 * @created 2025
 */

class StarTopologySimulation {
    /**
     * Initialize the Star Topology Simulation
     * Sets up all network components, event handlers, and initial state
     */
    constructor() {
        // Network state management
        this.devices = [];                    // Array of PC devices
        this.hub = null;                      // Central hub element
        this.isSimulating = false;            // Traffic simulation state
        this.selectedDevice = null;           // Currently selected device
        this.animationSpeed = 3;              // Animation speed (1-5)
        this.activeConnections = new Set();   // Active data transmission connections
        this.deviceStates = {};               // Track online/offline state for each device
        
        // Statistics tracking
        this.stats = {
            totalPacketsSent: 0,
            onlineDevices: 6,
            networkUptime: 0
        };
        
        // Initialize the simulation
        this.init();
    }    /**
     * Initialize all simulation components
     * Sets up DOM elements, event listeners, and initial network state
     */
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.initializeDeviceStates();
        this.drawConnections();
        this.updateConnectionStates();
        this.updateSpeedDisplay();
        // this.updateNetworkStats();
        this.addLogEntry('Network topology initialized - All PCs online', 'success');
        this.startUptimeCounter();
    }    /**
     * Set up DOM element references
     * Establishes connections to all required HTML elements
     */
    setupElements() {
        this.hub = document.getElementById('hub');
        this.devices = Array.from(document.querySelectorAll('.device'));
        this.connectionsContainer = document.getElementById('connections');
        this.dataPacketsContainer = document.getElementById('dataPackets');
        this.networkArea = document.querySelector('.network-area');
        this.logContent = document.getElementById('logContent');
        this.hubStatus = document.getElementById('hubStatus');
        
        // Statistics elements
        this.onlineCountElement = document.getElementById('onlineCount');
        this.packetCountElement = document.getElementById('packetCount');
        this.hubStatusIndicator = document.getElementById('hubStatusIndicator');
    }

    /**
     * Set up all event listeners for user interactions
     * Handles device clicks, power toggles, and control button actions
     */
    setupEventListeners() {
        // Device interaction handlers
        this.devices.forEach(device => {
            device.addEventListener('click', (e) => this.handleDeviceClick(e));
            
            // Power button click handler with event propagation control
            const powerButton = device.querySelector('.power-button');
            if (powerButton) {
                powerButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering device click
                    this.toggleDevicePower(device);
                });
            }
        });

        // Hub interaction handler
        this.hub.addEventListener('click', () => this.handleHubClick());
        
        // Control panel button handlers
        document.getElementById('simulateTraffic').addEventListener('click', () => this.simulateNetworkTraffic());
        document.getElementById('resetNetwork').addEventListener('click', () => this.resetNetwork());
        document.getElementById('clearLog').addEventListener('click', () => this.clearLog());
        
        // New export log functionality
        const exportLogBtn = document.getElementById('exportLog');
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', () => this.exportLogData());
        }

        // Speed control with improved feedback
        document.getElementById('speedSlider').addEventListener('input', (e) => this.updateAnimationSpeed(e.target.value));    }

    /**
     * Draw connection lines between hub and all devices
     * Creates SVG lines representing the star topology structure
     */    drawConnections() {
        const svg = this.connectionsContainer;
        svg.innerHTML = ''; // Clear existing connections

        const hubCenter = this.getElementCenter(this.hub);

        this.devices.forEach((device, index) => {
            const deviceCenter = this.getElementCenter(device);

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', hubCenter.x);
            line.setAttribute('y1', hubCenter.y);
            line.setAttribute('x2', deviceCenter.x);
            line.setAttribute('y2', deviceCenter.y);
            line.setAttribute('class', 'connection-line');
            line.setAttribute('id', `connection-${index + 1}`);
            
            svg.appendChild(line);
        });
    }

    initializeDeviceStates() {
        // Initialize all devices as online
        this.devices.forEach(device => {
            const deviceId = device.dataset.device;
            this.deviceStates[deviceId] = 'online';
            this.updateDeviceStatus(device, 'Online');
        });
    }

    isDeviceOnline(device) {
        const deviceId = device.dataset.device;
        return this.deviceStates[deviceId] === 'online';    }    
      /**
     * Toggle power state of a PC device
     * Handles turning devices on/off and updates network statistics
     * @param {HTMLElement} device - The device element to toggle
     */
    toggleDevicePower(device) {
        const deviceId = device.dataset.device;
        const currentState = this.deviceStates[deviceId];
        
        if (currentState === 'online') {
            // Turn off the device
            this.deviceStates[deviceId] = 'offline';
            device.classList.add('offline');
            device.classList.remove('active', 'sending', 'receiving');
            this.updateDeviceStatusAnimated(device, 'Offline');
            this.addLogEntry(`PC ${deviceId} powered OFF`, 'error');
            this.stats.onlineDevices--;
            
            // If this device was selected, deselect it
            if (this.selectedDevice === device) {
                this.deselectDevice();
            }
        } else {
            // Turn on the device
            this.deviceStates[deviceId] = 'online';
            device.classList.remove('offline');
            this.updateDeviceStatusAnimated(device, 'Online');
            this.addLogEntry(`PC ${deviceId} powered ON`, 'success');
            this.stats.onlineDevices++;
        }
        
        // Update connection line states
        this.updateConnectionStates();
        
        // Update network statistics display
        // this.updateNetworkStats();
    }

    /**
     * Update connection line states based on device online/offline status
     */
    updateConnectionStates() {
        this.devices.forEach((device, index) => {
            const connectionLine = document.getElementById(`connection-${index + 1}`);
            if (connectionLine) {
                if (this.isDeviceOnline(device)) {
                    connectionLine.classList.remove('offline');
                } else {
                    connectionLine.classList.add('offline');
                }
            }
        });
    }handleDeviceClick(event) {
        const clickedDevice = event.currentTarget;
        const deviceId = clickedDevice.dataset.device;

        // Check if device is online
        if (!this.isDeviceOnline(clickedDevice)) {
            this.addLogEntry(`Cannot communicate with PC ${deviceId} - Device is offline`, 'error');
            return;
        }

        if (this.selectedDevice === null) {
            // First device selection (sender)
            this.selectedDevice = clickedDevice;
            clickedDevice.classList.add('active');
            this.updateDeviceStatus(clickedDevice, 'Selected');
            this.addLogEntry(`PC ${deviceId} selected as sender`, 'info');
        } else if (this.selectedDevice === clickedDevice) {
            // Deselect the same device
            this.deselectDevice();
        } else {
            // Check if selected device is still online
            if (!this.isDeviceOnline(this.selectedDevice)) {
                this.addLogEntry(`Cannot send from PC ${this.selectedDevice.dataset.device} - Device went offline`, 'error');
                this.deselectDevice();
                return;
            }
            
            // Second device selection (receiver) - start transmission
            const receiverDevice = clickedDevice;
            const senderId = this.selectedDevice.dataset.device;
            const receiverId = receiverDevice.dataset.device;
            
            this.simulateDataTransmission(this.selectedDevice, receiverDevice);
            this.addLogEntry(`Data transmission from PC ${senderId} to PC ${receiverId} initiated`, 'info');
            this.deselectDevice();
        }
    }

    handleHubClick() {
        this.updateHubStatus('Hub Clicked');
        this.addLogEntry('Hub status checked - All connections active', 'info');
        
        // Briefly highlight all connections
        this.devices.forEach((_, index) => {
            const connection = document.getElementById(`connection-${index + 1}`);
            if (connection) {
                connection.classList.add('active');
                setTimeout(() => connection.classList.remove('active'), 1000);
            }
        });

        setTimeout(() => this.updateHubStatus('Ready'), 2000);
    }

    deselectDevice() {        if (this.selectedDevice) {
            this.selectedDevice.classList.remove('active');
            this.updateDeviceStatus(this.selectedDevice, this.isDeviceOnline(this.selectedDevice) ? 'Online' : 'Offline');
            this.selectedDevice = null;
        }
    }

    async simulateDataTransmission(sender, receiver) {
        const senderId = sender.dataset.device;
        const receiverId = receiver.dataset.device;
          // Update device states
        sender.classList.add('sending');
        receiver.classList.add('receiving');
        this.updateDeviceStatus(sender, 'Sending');
        this.updateDeviceStatus(receiver, 'Receiving');
        this.updateHubStatus('Processing');

        // Highlight connections
        const senderConnection = document.getElementById(`connection-${senderId}`);
        const receiverConnection = document.getElementById(`connection-${receiverId}`);
        
        if (senderConnection && receiverConnection) {
            // Phase 1: Sender to Hub
            senderConnection.classList.add('active');
            await this.createDataPacket(sender, this.hub, `PC${senderId}`);
            
            // Phase 2: Hub processing
            await this.delay(500 / this.animationSpeed);
            
            // Phase 3: Hub to Receiver
            receiverConnection.classList.add('active');
            await this.createDataPacket(this.hub, receiver, `PC${senderId}`);
            
            // Cleanup
            setTimeout(() => {
                senderConnection.classList.remove('active');                receiverConnection.classList.remove('active');
                sender.classList.remove('sending');
                receiver.classList.remove('receiving');
                this.updateDeviceStatus(sender, this.isDeviceOnline(sender) ? 'Online' : 'Offline');
                this.updateDeviceStatus(receiver, this.isDeviceOnline(receiver) ? 'Online' : 'Offline');
                this.updateHubStatus('Ready');
                  // Update packet statistics and log
                this.stats.totalPacketsSent++;
                // this.updateNetworkStats();
                this.addLogEntry(`Data successfully transmitted from PC ${senderId} to PC ${receiverId}`, 'success');
            }, 1000 / this.animationSpeed);
        }
    }    /**
     * Get the actual center position of an element relative to the network area
     */    getElementCenter(element) {
        // Use getBoundingClientRect for accurate positioning
        const rect = element.getBoundingClientRect();
        const networkRect = this.networkArea.getBoundingClientRect();
        
        // Calculate center position relative to the network area
        const centerX = rect.left + rect.width / 2 - networkRect.left;
        const centerY = rect.top + rect.height / 2 - networkRect.top;
        
        return { x: centerX, y: centerY };
    }

    async createDataPacket(fromElement, toElement, label) {
        const packet = document.createElement('div');
        packet.className = 'data-packet moving';
        
        // Get actual center positions using CSS-based calculation
        const startPos = this.getElementCenter(fromElement);
        const endPos = this.getElementCenter(toElement);
        
        // Adjust for packet size (7px radius)
        const startX = startPos.x - 7;
        const startY = startPos.y - 7;
        const endX = endPos.x - 7;
        const endY = endPos.y - 7;
        
        // Set initial position
        packet.style.left = startX + 'px';
        packet.style.top = startY + 'px';
        packet.style.opacity = '1';
        
        this.dataPacketsContainer.appendChild(packet);
        
        // Force a reflow to ensure the packet is rendered at start position
        packet.offsetHeight;
        
        // Set transition and animate to target position
        const duration = Math.max(800, 1500 / this.animationSpeed);
        packet.style.transition = `left ${duration}ms ease-in-out, top ${duration}ms ease-in-out, opacity 200ms ease-in-out`;
        
        // Start animation after a small delay
        requestAnimationFrame(() => {
            packet.style.left = endX + 'px';
            packet.style.top = endY + 'px';
        });
        
        // Remove packet after animation completes
        setTimeout(() => {
            if (packet && packet.parentNode) {
                packet.style.opacity = '0';
                setTimeout(() => {
                    if (packet.parentNode) {
                        packet.parentNode.removeChild(packet);
                    }
                }, 200);
            }
        }, duration - 100);
        
        return new Promise(resolve => setTimeout(resolve, duration));
    }async simulateNetworkTraffic() {
        if (this.isSimulating) {
            this.addLogEntry('Network traffic simulation already in progress', 'error');
            return;
        }

        // Get only online devices
        const onlineDevices = this.devices.filter(device => this.isDeviceOnline(device));
        
        if (onlineDevices.length < 2) {
            this.addLogEntry('Need at least 2 online PCs for network simulation', 'error');
            return;
        }

        this.isSimulating = true;
        this.addLogEntry('Starting automated network traffic simulation', 'info');
        
        this.setLoadingState(true);

        // Simulate random traffic between online devices
        const simulations = Math.min(8, onlineDevices.length * 2);
        for (let i = 0; i < simulations; i++) {
            const sender = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
            let receiver;
            do {
                receiver = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
            } while (receiver === sender && onlineDevices.length > 1);

            // Double-check devices are still online before transmission
            if (this.isDeviceOnline(sender) && this.isDeviceOnline(receiver) && sender !== receiver) {
                await this.simulateDataTransmission(sender, receiver);
            }
            await this.delay(Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
        }        this.isSimulating = false;
        this.setLoadingState(false);
        this.addLogEntry('Network traffic simulation completed', 'success');
    }
    
    /**
     * Reset network to initial state
     * Clears all active transmissions while maintaining device power states
     * Includes validation and error handling
     */
    resetNetwork() {
        try {
            // Stop any ongoing simulation
            this.isSimulating = false;
            this.setLoadingState(false);
            
            // Clear all active device states
            this.devices.forEach(device => {
                if (device) { // Validate device exists
                    device.classList.remove('active', 'sending', 'receiving');
                    // Maintain current power state - don't reset offline devices
                    const status = this.isDeviceOnline(device) ? 'Online' : 'Offline';
                    this.updateDeviceStatus(device, status);
                }
            });

            // Clear all active connection animations
            const connectionLines = document.querySelectorAll('.connection-line');
            connectionLines.forEach(line => {
                if (line) {
                    line.classList.remove('active');
                }
            });

            // Clear all data packets from display
            if (this.dataPacketsContainer) {
                this.dataPacketsContainer.innerHTML = '';
            }

            // Reset hub to ready state
            this.updateHubStatus('Ready');
            
            // Clear active connections tracking
            this.activeConnections.clear();

            // Reset selection state
            if (this.selectedDevice) {
                this.selectedDevice.classList.remove('active');
                this.selectedDevice = null;
            }

            // Reset simulation controls
            const simulateButton = document.getElementById('simulateTraffic');
            if (simulateButton) {
                simulateButton.innerHTML = '<span class="btn-icon">🚀</span>Simulate Network Traffic';
                simulateButton.disabled = false;
                simulateButton.classList.remove('loading');
            }
            
            // Log the reset action
            this.addLogEntry('Network reset completed - All transmissions cleared', 'info');
            
        } catch (error) {
            console.error('Network reset failed:', error);
            this.addLogEntry('Network reset encountered an error', 'error');
        }
    }

    updateAnimationSpeed(value) {
        this.animationSpeed = parseInt(value);
        this.updateSpeedDisplay();
    }

    updateSpeedDisplay() {
        const speedValue = document.getElementById('speedValue');
        const speeds = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
        speedValue.textContent = speeds[this.animationSpeed - 1];
    }

    updateDeviceStatus(device, status) {
        const statusElement = device.querySelector('.device-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    updateDeviceStatusAnimated(device, status) {
        const statusElement = device.querySelector('.device-status');
        if (statusElement) {
            statusElement.style.opacity = '0';
            setTimeout(() => {
                statusElement.textContent = status;
                statusElement.style.opacity = '1';
            }, 150);
        }
    }    /**
     * Update hub status display
     * @param {string} status - Status message to display
     */
    updateHubStatus(status) {
        if (this.hubStatus) {
            this.hubStatus.textContent = status;
        }
    }

    /**
     * Add enhanced log entry with improved formatting and timestamps
     * @param {string} message - Log message content
     * @param {string} type - Log entry type (success, error, warning, info)
     */
    addLogEntry(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        
        // Create timestamp element
        const timeElement = document.createElement('span');
        timeElement.className = 'log-time';
        timeElement.textContent = new Date().toLocaleTimeString();
        
        // Create message content
        const messageContent = document.createTextNode(message);
        
        // Append time and message
        entry.appendChild(timeElement);
        entry.appendChild(messageContent);
        
        // Add entry to log with animation
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;

        // Limit log entries to prevent memory issues (keep last 50 entries)
        const entries = this.logContent.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    /**
     * Clear log content and reset to initial state
     * Maintains the initial network status message
     */
    clearLog() {
        this.logContent.innerHTML = '';
        this.addLogEntry('Network initialized - All PCs connected to hub', 'success');
    }

    setLoadingState(isLoading) {
        const button = document.getElementById('simulateTraffic');
        if (isLoading) {
            button.innerHTML = '<span class="spinner"></span> Simulating...';
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.innerHTML = 'Simulate Network Traffic';
            button.disabled = false;
            button.classList.remove('loading');
        }
    }    /**
     * Update network statistics display
     * Updates the header statistics panel with current network status
     */
    updateNetworkStats() {
        // Commented out since we removed the statistics panel
        /*
        if (this.onlineCountElement) {
            this.onlineCountElement.textContent = this.stats.onlineDevices;
        }
        if (this.packetCountElement) {
            this.packetCountElement.textContent = this.stats.totalPacketsSent;
        }
        if (this.hubStatusIndicator) {
            this.hubStatusIndicator.textContent = this.stats.onlineDevices > 0 ? 'Active' : 'Inactive';
            this.hubStatusIndicator.className = this.stats.onlineDevices > 0 ? 'stat-value status-active' : 'stat-value';
        }
        */
    }

    /**
     * Start the network uptime counter
     * Tracks how long the network has been running
     */
    startUptimeCounter() {
        const startTime = Date.now();
        setInterval(() => {
            this.stats.networkUptime = Math.floor((Date.now() - startTime) / 1000);
        }, 1000);
    }

    /**
     * Export network activity log as downloadable file
     * Provides log data export functionality for analysis
     */
    exportLogData() {
        try {
            const logEntries = Array.from(this.logContent.children);
            const logData = logEntries.map(entry => {
                const timeElement = entry.querySelector('.log-time');
                const time = timeElement ? timeElement.textContent : 'Unknown';
                const message = entry.textContent.replace(time, '').trim();
                const type = entry.className.includes('success') ? 'SUCCESS' : 
                           entry.className.includes('error') ? 'ERROR' :
                           entry.className.includes('warning') ? 'WARNING' : 'INFO';
                return `[${time}] ${type}: ${message}`;
            });

            const dataStr = logData.join('\n');
            const dataUri = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `network_log_${new Date().toISOString().slice(0,10)}.txt`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.addLogEntry('Network log exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.addLogEntry('Failed to export network log', 'error');
        }
    }    /**
     * Enhanced log entry creation with timestamps and improved formatting
     * @param {string} message - Log message content
     * @param {string} type - Log entry type (success, error, warning, info)
     */
    enhancedLogEntry(message, type) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const timestamp = document.createElement('span');
        timestamp.className = 'log-time';
        timestamp.textContent = new Date().toLocaleTimeString();
        entry.appendChild(timestamp);
        entry.appendChild(document.createTextNode(`: ${message}`));
        
        this.logContent.appendChild(entry);
        this.logContent.scrollTop = this.logContent.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = this.logContent.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[0].remove();
        }
    }

    /**
     * Utility function to create delays in async operations
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after the specified delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.starTopology = new StarTopologySimulation();
    
    // Redraw connections on window resize
    window.addEventListener('resize', () => {
        setTimeout(() => window.starTopology.drawConnections(), 100);
    });
});

// Additional utility functions for demonstration

function demonstrateStarTopologyFeatures() {
    const topology = window.starTopology;
    
    // Show the advantages of star topology
    topology.addLogEntry('Demonstrating star topology features...', 'info');
    
    setTimeout(() => {
        topology.addLogEntry('✓ Centralized management through hub', 'success');
    }, 1000);
    
    setTimeout(() => {
        topology.addLogEntry('✓ Easy to add/remove devices', 'success');
    }, 2000);
    
    setTimeout(() => {
        topology.addLogEntry('✓ Fault isolation - one device failure doesn\'t affect others', 'success');
    }, 3000);
    
    setTimeout(() => {
        topology.addLogEntry('⚠ Single point of failure: if hub fails, network fails', 'error');
    }, 4000);
}

// Expose demonstration function globally
window.demonstrateFeatures = demonstrateStarTopologyFeatures;
