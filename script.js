/**
 * Star Topology Network Simulation
 * Demonstrates star network topology with interactive PC management,
 * data transmission simulation, and real-time network monitoring.
 * 
 * @author Network Topology Project
 * @version 2.0
 * @created 2025
 */

class StarTopologySimulation {    /**
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
        this.hubState = 'active';             // Hub state: active, failed, recovering
        this.networkCongested = false;        // Network congestion state
        this.hubHealth = 100;                 // Hub health percentage (0-100)
        
        // Performance metrics
        this.metrics = {
            latency: 0,                       // Network latency in ms
            collisionRate: 0,                 // Collision percentage
            totalBandwidth: 0,                // Total bandwidth usage
            packetsCollided: 0,               // Number of packet collisions
            avgLatency: []                    // Moving average for latency
        };
        
        // Bandwidth tracking per device
        this.bandwidthUsage = {};
        
        // Statistics tracking
        this.stats = {
            totalPacketsSent: 0,
            onlineDevices: 6,
            networkUptime: 0
        };
        
        // Initialize the simulation
        this.init();
    }/**
     * Initialize all simulation components
     * Sets up DOM elements, event listeners, and initial network state
     */    init() {
        this.setupElements();
        this.setupEventListeners();
        this.initializeDeviceStates();
        this.initializeBandwidthTracking();
        this.drawConnections();
        this.updateConnectionStates();
        this.updateSpeedDisplay();
        this.updateNetworkMetrics();
        this.addLogEntry('Network topology initialized - All PCs online', 'success');
        this.startUptimeCounter();
        this.startMetricsUpdater();
    }/**
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
        document.getElementById('simulateHubFailure').addEventListener('click', () => this.simulateHubFailure());
        document.getElementById('simulateCongestion').addEventListener('click', () => this.simulateNetworkCongestion());
        document.getElementById('resetNetwork').addEventListener('click', () => this.resetNetwork());
        document.getElementById('clearLog').addEventListener('click', () => this.clearLog());
        
        // Hub power button
        const hubPowerButton = document.getElementById('hubPowerButton');
        if (hubPowerButton) {
            hubPowerButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHubPower();
            });
        }
        
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
    }    handleDeviceClick(event) {
        const clickedDevice = event.currentTarget;
        const deviceId = clickedDevice.dataset.device;
        const macAddress = clickedDevice.dataset.mac;

        // Check if hub is failed
        if (this.hubState === 'failed') {
            this.addLogEntry(`Cannot communicate - Hub is offline`, 'error');
            return;
        }

        // Check if device is online
        if (!this.isDeviceOnline(clickedDevice)) {
            this.addLogEntry(`Cannot communicate with PC ${deviceId} [${macAddress}] - Device is offline`, 'error');
            return;
        }

        if (this.selectedDevice === null) {
            // First device selection (sender)
            this.selectedDevice = clickedDevice;
            clickedDevice.classList.add('active');
            this.updateDeviceStatus(clickedDevice, 'Selected');
            this.addLogEntry(`PC ${deviceId} [${macAddress}] selected as sender`, 'info');
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
            const senderMac = this.selectedDevice.dataset.mac;
            const receiverMac = receiverDevice.dataset.mac;
            
            this.simulateDataTransmission(this.selectedDevice, receiverDevice);
            this.addLogEntry(`Data transmission: ${senderMac} → ${receiverMac}`, 'info');
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
    }    async simulateDataTransmission(sender, receiver) {
        if (this.hubState === 'failed') {
            this.addLogEntry('Transmission failed - Hub is offline', 'error');
            return;
        }

        const senderId = sender.dataset.device;
        const receiverId = receiver.dataset.device;
        const senderMac = sender.dataset.mac;
        const receiverMac = receiver.dataset.mac;

        // Simulate bandwidth usage
        this.updateBandwidthUsage(senderId, Math.random() * 60 + 40); // 40-100%
        this.updateBandwidthUsage(receiverId, Math.random() * 40 + 20); // 20-60%

        // Calculate latency based on network conditions
        let transmissionLatency = this.metrics.latency;
        if (this.networkCongested) {
            transmissionLatency += Math.random() * 100 + 50; // Additional 50-150ms
        }

        // Update device states
        sender.classList.add('sending');
        receiver.classList.add('receiving');
        this.updateDeviceStatus(sender, 'Sending');
        this.updateDeviceStatus(receiver, 'Receiving');
        this.updateHubStatus('Processing');

        // MAC address table lookup simulation
        this.addLogEntry(`Hub: MAC table lookup for ${receiverMac}`, 'info');

        // Highlight connections
        const senderConnection = document.getElementById(`connection-${senderId}`);
        const receiverConnection = document.getElementById(`connection-${receiverId}`);
        
        if (senderConnection && receiverConnection) {
            // Phase 1: Sender to Hub with latency
            senderConnection.classList.add('active');
            await this.createDataPacket(sender, this.hub, `${senderMac}`, false, transmissionLatency);
            
            // Phase 2: Hub processing with MAC learning
            this.addLogEntry(`Hub: Frame from ${senderMac} on port ${senderId}`, 'info');
            await this.delay(Math.max(500, transmissionLatency) / this.animationSpeed);
            
            // Phase 3: Hub to Receiver with latency
            receiverConnection.classList.add('active');
            this.addLogEntry(`Hub: Forwarding to ${receiverMac} on port ${receiverId}`, 'info');
            await this.createDataPacket(this.hub, receiver, `${senderMac}`, false, transmissionLatency);
            
            // Cleanup
            setTimeout(() => {
                senderConnection.classList.remove('active');
                receiverConnection.classList.remove('active');
                sender.classList.remove('sending');
                receiver.classList.remove('receiving');
                this.updateDeviceStatus(sender, this.isDeviceOnline(sender) ? 'Online' : 'Offline');
                this.updateDeviceStatus(receiver, this.isDeviceOnline(receiver) ? 'Online' : 'Offline');
                this.updateHubStatus('Ready');

                // Reset bandwidth usage gradually
                setTimeout(() => {
                    this.updateBandwidthUsage(senderId, 0);
                    this.updateBandwidthUsage(receiverId, 0);
                }, 2000);

                // Update packet statistics and log
                this.stats.totalPacketsSent++;
                this.addLogEntry(`Frame successfully delivered: ${senderMac} → ${receiverMac}`, 'success');
            }, Math.max(1000, transmissionLatency) / this.animationSpeed);
        }
    }/**
     * Get the actual center position of an element relative to the network area
     */    getElementCenter(element) {
        // Use getBoundingClientRect for accurate positioning
        const rect = element.getBoundingClientRect();
        const networkRect = this.networkArea.getBoundingClientRect();
        
        // Calculate center position relative to the network area
        const centerX = rect.left + rect.width / 2 - networkRect.left;
        const centerY = rect.top + rect.height / 2 - networkRect.top;
        
        return { x: centerX, y: centerY };
    }    async createDataPacket(fromElement, toElement, label, isCollision = false, customLatency = null) {
        const packet = document.createElement('div');
        packet.className = 'data-packet moving';
        
        // Add collision effect if this is a collision packet
        if (isCollision) {
            packet.classList.add('collision');
        }

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
        
        // Calculate duration based on latency and network conditions
        let baseDuration = Math.max(800, 1500 / this.animationSpeed);
        
        if (customLatency !== null) {
            // Apply latency to duration
            baseDuration += customLatency * 2; // Scale latency to visible duration
        }
        
        if (this.networkCongested) {
            baseDuration *= 1.5; // Slower during congestion
            packet.classList.add('slow');
        }

        // Set transition and animate to target position
        packet.style.transition = `left ${baseDuration}ms ease-in-out, top ${baseDuration}ms ease-in-out, opacity 200ms ease-in-out`;
        
        // Start animation after a small delay
        requestAnimationFrame(() => {
            packet.style.left = endX + 'px';
            packet.style.top = endY + 'px';
        });
        
        // Handle collision effects
        if (isCollision) {
            setTimeout(() => {
                packet.style.backgroundColor = '#f39c12';
                packet.style.transform = 'scale(1.5)';
            }, baseDuration / 2);
        }
        
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
        }, baseDuration - 100);
        
        return new Promise(resolve => setTimeout(resolve, baseDuration));
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
            
            // Reset hub state
            this.hubState = 'active';
            this.hub.classList.remove('failed');
            this.updateHubStatus('Ready');
            this.updateHubHealth(100);
            
            // Clear network congestion
            if (this.networkCongested) {
                this.clearNetworkCongestion();
            }
            
            // Reset all device states
            this.devices.forEach(device => {
                if (device) {
                    device.classList.remove('active', 'sending', 'receiving', 'congested');
                    const status = this.isDeviceOnline(device) ? 'Online' : 'Offline';
                    this.updateDeviceStatus(device, status);
                    
                    // Reset bandwidth usage
                    const deviceId = device.dataset.device;
                    this.updateBandwidthUsage(deviceId, 0);
                }
            });

            // Clear all active connection animations
            const connectionLines = document.querySelectorAll('.connection-line');
            connectionLines.forEach(line => {
                if (line) {
                    line.classList.remove('active', 'congested');
                }
            });

            // Reset connection states based on device status
            this.updateConnectionStates();

            // Clear all data packets from display
            if (this.dataPacketsContainer) {
                this.dataPacketsContainer.innerHTML = '';
            }

            // Reset metrics
            this.metrics.latency = 0;
            this.metrics.collisionRate = 0;
            this.metrics.totalBandwidth = 0;
            this.metrics.packetsCollided = 0;
            
            // Clear active connections tracking
            this.activeConnections.clear();

            // Reset selection state
            if (this.selectedDevice) {
                this.selectedDevice.classList.remove('active');
                this.selectedDevice = null;
            }

            // Reset simulation control buttons
            const simulateButton = document.getElementById('simulateTraffic');
            if (simulateButton) {
                simulateButton.innerHTML = '<span class="btn-icon">🚀</span>Simulate Network Traffic';
                simulateButton.disabled = false;
                simulateButton.classList.remove('loading');
            }

            const hubFailureButton = document.getElementById('simulateHubFailure');
            if (hubFailureButton) {
                hubFailureButton.innerHTML = '<span class="btn-icon">⚠️</span>Simulate Hub Failure';
                hubFailureButton.classList.remove('btn-success');
                hubFailureButton.classList.add('btn-warning');
            }

            const congestionButton = document.getElementById('simulateCongestion');
            if (congestionButton) {
                congestionButton.innerHTML = '<span class="btn-icon">🚫</span>Create Network Congestion';
                congestionButton.classList.remove('btn-success');
                congestionButton.classList.add('btn-danger');
            }
            
            // Update metrics display
            this.updateNetworkMetrics();
            
            // Log the reset action
            this.addLogEntry('Network reset completed - All systems restored to normal operation', 'info');
            
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

    /**
     * Initialize bandwidth tracking for all devices
     */
    initializeBandwidthTracking() {
        this.devices.forEach(device => {
            const deviceId = device.dataset.device;
            this.bandwidthUsage[deviceId] = 0;
        });
    }

    /**
     * Simulate hub failure scenario
     * Demonstrates single point of failure in star topology
     */
    async simulateHubFailure() {
        if (this.hubState === 'failed') {
            // Recover the hub
            await this.recoverHub();
            return;
        }

        this.hubState = 'failed';
        this.hub.classList.add('failed');
        this.updateHubStatus('FAILED');
        this.updateHubHealth(0);
        
        // Update all connection lines to show failure
        const connectionLines = document.querySelectorAll('.connection-line');
        connectionLines.forEach(line => {
            line.classList.add('offline');
        });

        // Log the failure with MAC addresses
        this.addLogEntry('CRITICAL: Hub failure detected - All network communication stopped', 'error');
        this.addLogEntry('MAC Address table cleared - All device entries lost', 'error');
        
        // Update button text
        const button = document.getElementById('simulateHubFailure');
        button.innerHTML = '<span class="btn-icon">🔧</span>Recover Hub';
        button.classList.remove('btn-warning');
        button.classList.add('btn-success');

        // Show impact on all devices
        this.devices.forEach(device => {
            if (this.isDeviceOnline(device)) {
                device.classList.add('congested');
                const deviceId = device.dataset.device;
                const macAddress = device.dataset.mac;
                this.addLogEntry(`PC ${deviceId} [${macAddress}] cannot reach network - Hub unreachable`, 'error');
            }
        });

        this.updateNetworkMetrics();
    }

    /**
     * Recover hub from failure state
     */
    async recoverHub() {
        this.addLogEntry('Initiating hub recovery procedure...', 'info');
        
        // Gradual recovery process
        for (let health = 0; health <= 100; health += 10) {
            this.updateHubHealth(health);
            await this.delay(200);
        }

        this.hubState = 'active';
        this.hub.classList.remove('failed');
        this.updateHubStatus('Ready');
        
        // Restore connection lines
        this.updateConnectionStates();
        
        // Remove congestion from devices
        this.devices.forEach(device => {
            device.classList.remove('congested');
        });

        // Update button
        const button = document.getElementById('simulateHubFailure');
        button.innerHTML = '<span class="btn-icon">⚠️</span>Simulate Hub Failure';
        button.classList.remove('btn-success');
        button.classList.add('btn-warning');

        // Rebuild MAC address table
        this.addLogEntry('Hub recovery complete - Rebuilding MAC address table...', 'success');
        this.devices.forEach(device => {
            if (this.isDeviceOnline(device)) {
                const deviceId = device.dataset.device;
                const macAddress = device.dataset.mac;
                this.addLogEntry(`MAC learned: Port ${deviceId} -> ${macAddress}`, 'info');
            }
        });

        this.updateNetworkMetrics();
    }

    /**
     * Simulate network congestion
     * Shows collision detection and bandwidth management
     */
    async simulateNetworkCongestion() {
        if (this.networkCongested) {
            this.clearNetworkCongestion();
            return;
        }

        if (this.hubState === 'failed') {
            this.addLogEntry('Cannot simulate congestion - Hub is failed', 'error');
            return;
        }

        this.networkCongested = true;
        this.addLogEntry('Simulating network congestion - High traffic load detected', 'warning');

        // Update button
        const button = document.getElementById('simulateCongestion');
        button.innerHTML = '<span class="btn-icon">✅</span>Clear Congestion';
        button.classList.remove('btn-danger');
        button.classList.add('btn-success');

        // Increase latency and collision rate
        this.metrics.latency = Math.random() * 200 + 100; // 100-300ms
        this.metrics.collisionRate = Math.random() * 15 + 5; // 5-20%

        // Apply congestion effects to online devices
        const onlineDevices = this.devices.filter(device => this.isDeviceOnline(device));
        onlineDevices.forEach(device => {
            device.classList.add('congested');
            const deviceId = device.dataset.device;
            this.updateBandwidthUsage(deviceId, Math.random() * 80 + 20); // 20-100%
        });

        // Show connection congestion
        const connectionLines = document.querySelectorAll('.connection-line:not(.offline)');
        connectionLines.forEach(line => {
            line.classList.add('congested');
        });

        // Simulate some packet collisions
        await this.simulatePacketCollisions();
        
        this.updateNetworkMetrics();
    }

    /**
     * Clear network congestion
     */
    clearNetworkCongestion() {
        this.networkCongested = false;
        this.addLogEntry('Network congestion cleared - Normal operation restored', 'success');

        // Reset metrics
        this.metrics.latency = Math.random() * 20; // 0-20ms normal
        this.metrics.collisionRate = 0;

        // Remove congestion effects
        this.devices.forEach(device => {
            device.classList.remove('congested');
            const deviceId = device.dataset.device;
            this.updateBandwidthUsage(deviceId, 0);
        });

        // Clear connection congestion
        const connectionLines = document.querySelectorAll('.connection-line');
        connectionLines.forEach(line => {
            line.classList.remove('congested');
        });

        // Update button
        const button = document.getElementById('simulateCongestion');
        button.innerHTML = '<span class="btn-icon">🚫</span>Create Network Congestion';
        button.classList.remove('btn-success');
        button.classList.add('btn-danger');

        this.updateNetworkMetrics();
    }

    /**
     * Simulate packet collisions for educational purposes
     */
    async simulatePacketCollisions() {
        const onlineDevices = this.devices.filter(device => this.isDeviceOnline(device));
        if (onlineDevices.length < 2) return;

        for (let i = 0; i < 3; i++) {
            // Create two packets that will "collide" at the hub
            const device1 = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
            const device2 = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];

            if (device1 !== device2) {
                // Create packets simultaneously
                const packet1Promise = this.createDataPacket(device1, this.hub, 'COLLISION', true);
                const packet2Promise = this.createDataPacket(device2, this.hub, 'COLLISION', true);

                await Promise.all([packet1Promise, packet2Promise]);

                // Log collision detection
                const mac1 = device1.dataset.mac;
                const mac2 = device2.dataset.mac;
                this.addLogEntry(`Collision detected: ${mac1} and ${mac2} transmitted simultaneously`, 'error');
                this.metrics.packetsCollided += 2;

                await this.delay(500);
            }
        }
    }

    /**
     * Toggle hub power state
     */
    toggleHubPower() {
        if (this.hubState === 'active') {
            this.simulateHubFailure();
        } else if (this.hubState === 'failed') {
            this.recoverHub();
        }
    }

    /**
     * Update hub health display
     */
    updateHubHealth(healthPercent) {
        this.hubHealth = healthPercent;
        const hubHealthElement = document.getElementById('hubHealth');
        if (hubHealthElement) {
            hubHealthElement.textContent = `${healthPercent}%`;
            
            // Color coding based on health
            if (healthPercent <= 25) {
                hubHealthElement.style.color = '#e74c3c';
            } else if (healthPercent <= 50) {
                hubHealthElement.style.color = '#f39c12';
            } else {
                hubHealthElement.style.color = '#e0f0ff';
            }
        }
    }

    /**
     * Update bandwidth usage for a device
     */
    updateBandwidthUsage(deviceId, percentage) {
        this.bandwidthUsage[deviceId] = percentage;
        const bandwidthBar = document.getElementById(`bandwidthBar${deviceId}`);
        if (bandwidthBar) {
            bandwidthBar.style.width = `${percentage}%`;
        }
        
        // Update total bandwidth metric
        const totalBandwidth = Object.values(this.bandwidthUsage).reduce((sum, usage) => sum + usage, 0) / this.devices.length;
        this.metrics.totalBandwidth = totalBandwidth;
    }

    /**
     * Update network performance metrics display
     */
    updateNetworkMetrics() {
        // Hub status
        const hubStatusElement = document.getElementById('hubStatusMetric');
        if (hubStatusElement) {
            const status = this.hubState === 'active' ? 'Active' : 'Failed';
            hubStatusElement.textContent = status;
            hubStatusElement.className = `metric-value status-${this.hubState === 'active' ? 'active' : 'failed'}`;
        }

        // Network latency
        const latencyElement = document.getElementById('networkLatency');
        if (latencyElement) {
            latencyElement.textContent = `${Math.round(this.metrics.latency)}ms`;
            if (this.metrics.latency > 100) {
                latencyElement.className = 'metric-value status-warning';
            } else {
                latencyElement.className = 'metric-value status-active';
            }
        }

        // Collision rate
        const collisionElement = document.getElementById('collisionRate');
        if (collisionElement) {
            collisionElement.textContent = `${Math.round(this.metrics.collisionRate)}%`;
            if (this.metrics.collisionRate > 5) {
                collisionElement.className = 'metric-value status-warning';
            } else {
                collisionElement.className = 'metric-value status-active';
            }
        }

        // Total bandwidth
        const bandwidthElement = document.getElementById('totalBandwidth');
        if (bandwidthElement) {
            bandwidthElement.textContent = `${Math.round(this.metrics.totalBandwidth)}%`;
            if (this.metrics.totalBandwidth > 70) {
                bandwidthElement.className = 'metric-value status-warning';
            } else {
                bandwidthElement.className = 'metric-value status-active';
            }
        }
    }

    /**
     * Start the metrics updater for real-time network monitoring
     */
    startMetricsUpdater() {
        setInterval(() => {
            // Simulate natural latency fluctuation
            if (!this.networkCongested && this.hubState === 'active') {
                this.metrics.latency = Math.random() * 20; // 0-20ms normal operation
            }
            
            // Update collision rate based on network activity
            if (!this.networkCongested) {
                this.metrics.collisionRate = Math.random() * 2; // 0-2% normal
            }
            
            this.updateNetworkMetrics();
        }, 1000);
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
