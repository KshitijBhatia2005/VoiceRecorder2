document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // DOM Elements
    const startRecordBtn = document.getElementById('startRecord');
    const stopRecordBtn = document.getElementById('stopRecord');
    const playRecordBtn = document.getElementById('playRecord');
    const statusText = document.getElementById('statusText');

    // Global variables
    let mediaRec = null;
    let audioFileURI = null;
    let isRecording = false;

    // Create app directory
    function createDirectory() {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, (dirEntry) => {
                dirEntry.getDirectory('VoiceRecorder', { create: true }, (newDirEntry) => {
                    console.log('Directory created or exists at: ' + newDirEntry.nativeURL);
                    resolve(newDirEntry.nativeURL);
                }, (error) => {
                    console.error('Error creating directory:', error);
                    reject(error);
                });
            }, (error) => {
                console.error('Error accessing file system:', error);
                reject(error);
            });
        });
    }

    // Permissions Request for Android 11
    function requestPermissions() {
        return new Promise((resolve, reject) => {
            // Check if the specific permissions plugin is available
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
                const permissions = cordova.plugins.permissions;
                
                // List of required permissions
                const permissionList = [
                    permissions.RECORD_AUDIO,
                    permissions.WRITE_EXTERNAL_STORAGE,
                    permissions.READ_EXTERNAL_STORAGE
                ];

                // Use individual permission check and request
                permissions.checkPermission(permissions.RECORD_AUDIO, (status) => {
                    if (!status.hasPermission) {
                        permissions.requestPermission(permissions.RECORD_AUDIO, 
                            () => resolve(true), 
                            () => reject(new Error('Audio permission denied'))
                        );
                    } else {
                        resolve(true);
                    }
                }, (error) => reject(error));
            } else {
                // Fallback for when permissions plugin is not available
                console.warn('Permissions plugin not found. Attempting native request.');
                
                // Android's native permission request (might work in some cases)
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(() => resolve(true))
                        .catch((err) => reject(err));
                } else {
                    reject(new Error('No permission method available'));
                }
            }
        });
    }

    // Start Recording
    async function startRecording() {
        try {
            // Request permissions first
            await requestPermissions();

            if (isRecording) {
                statusText.textContent = 'Already recording';
                return;
            }

            // Disable start button and enable stop button
            startRecordBtn.disabled = true;
            stopRecordBtn.disabled = false;
            playRecordBtn.disabled = true;

            // Create directory and get path
            const dirPath = await createDirectory();
            
            // Generate unique filename
            const fileName = 'recording_' + new Date().getTime() + '.mp3';
            
            // Construct full file path
            audioFileURI = dirPath + fileName;
            console.log('Recording path:', audioFileURI);

            // Create Media object
            mediaRec = new Media(
                audioFileURI, 
                () => { 
                    console.log('Recording completed successfully');
                    statusText.textContent = 'Recording saved';
                    isRecording = false;
                    
                    // Re-enable buttons
                    startRecordBtn.disabled = false;
                    stopRecordBtn.disabled = true;
                    playRecordBtn.disabled = false;
                },
                (err) => { 
                    console.error('Recording failed:', err);
                    statusText.textContent = 'Recording failed';
                    isRecording = false;
                    
                    // Re-enable buttons
                    startRecordBtn.disabled = false;
                    stopRecordBtn.disabled = true;
                    playRecordBtn.disabled = true;
                    
                    alert('Recording failed: ' + JSON.stringify(err));
                }
            );

            // Start recording
            mediaRec.startRecord();
            isRecording = true;
            statusText.textContent = 'Recording...';
            console.log('Recording started');

        } catch (error) {
            console.error('Recording error:', error);
            statusText.textContent = 'Error: ' + error.message;
            
            // Re-enable buttons
            startRecordBtn.disabled = false;
            stopRecordBtn.disabled = true;
            playRecordBtn.disabled = true;
            
            alert('Error starting recording: ' + error.message);
        }
    }

    // Stop Recording
    function stopRecording() {
        if (mediaRec && isRecording) {
            mediaRec.stopRecord();
            isRecording = false;
            statusText.textContent = 'Recording stopped';
            
            // Re-enable buttons
            startRecordBtn.disabled = false;
            stopRecordBtn.disabled = true;
            playRecordBtn.disabled = false;
        }
    }

    // Play Recording
    function playRecording() {
        if (audioFileURI) {
            const mediaPlay = new Media(
                audioFileURI,
                () => {
                    console.log('Playback completed');
                    statusText.textContent = 'Playback finished';
                },
                (err) => {
                    console.error('Playback failed:', err);
                    statusText.textContent = 'Playback failed';
                    alert('Playback failed: ' + JSON.stringify(err));
                }
            );
            mediaPlay.play();
            statusText.textContent = 'Playing...';
        } else {
            statusText.textContent = 'No recording to play';
        }
    }

    // Attach event listeners
    startRecordBtn.addEventListener('click', startRecording);
    stopRecordBtn.addEventListener('click', stopRecording);
    playRecordBtn.addEventListener('click', playRecording);

    // Initial button states
    stopRecordBtn.disabled = true;
    playRecordBtn.disabled = true;
}