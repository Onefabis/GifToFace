(function() {
	// this is the complete list of currently supported params you can pass to the plugin (all optional)
	var options = {
		message: 'Send image to', // not supported on some apps (Facebook, Instagram)
		subject: 'Send image to', // fi. for email
		files: ['', ''], // an array of filenames either locally or remotely
		url: '',
		chooserTitle: 'Pick an app' // Android only, you can override the default share sheet title,
		//appPackageName: 'com.apple.social.facebook' // Android only, you can provide id of the App you want to share with
	};

	var onSuccess = function(result) {
		console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
		console.log("Shared to app: " + result.app); // On Android result.app since plugin version 5.4.0 this is no longer empty. On iOS it's empty when sharing is cancelled (result.completed=false)
	};

	var onError = function(msg) {
		console.log("Sharing failed with message: " + msg);
	};
	
	// contrtol background of playback buttons with checking attribute
	var playCB = document.getElementById('playCheckbox');
	var playB = document.getElementById('playButton');
	playCB.addEventListener('change', function(){
		if( this.checked == 1){
			playB.style.backgroundPosition = '-32px 0px';
			if (delays){
				playStatus = 1;
				//playFrame = minTimeRangeVal;
				playBack();
			}
		} else {
			playB.style.backgroundPosition = '0px 0px';
			playStatus = 0;
		}
	});
	
	var stopB = document.getElementById('stopButton');
	stopB.addEventListener('click', function(){
		playB.style.backgroundPosition = '0px 0px';
		playCB.checked = 0;
		playFrame = minTimeRangeVal;
		playStatus = 0;
		// If frames exist restore the first one from time range
		if(framesCanvases){
			renderCanvasCtx.drawImage( framesCanvases[minTimeRangeVal], 0, 0, mainWidth, mainHeight, 0, 0, renderCanvas.width, renderCanvas.height );
		}
	});
	
	var loopCB = document.getElementById('loopCheckbox');
	var loopB = document.getElementById('loopButton');
	loopCB.addEventListener('change', function(){
		if( this.checked == 1){
			loopB.style.border = '1px solid #dd411c';
			loopB.style.backgroundColor = '#320d04';
			loopB.style.borderRadius = '4px';
		} else {
			loopB.style.border = 'none';
			loopB.style.backgroundColor = 'rgba(0,0,0,0)';
		}
	});
	
	// Save button event 
	var saveB = document.getElementById('saveButton');
	saveB.addEventListener('click', function(){
		createImageToSave();
	});

	// Playback function 
	var playStatus = 0; 
	var playFrame = 0; 
	
	function playBack(){
		if (playStatus == 1){
			renderCanvasCtx.drawImage( framesCanvases[playFrame], 0, 0, mainWidth, mainHeight, 0, 0, renderCanvas.width, renderCanvas.height );
			playFrame ++;
			if (playFrame == maxTimeRangeVal+1 && loopCB.checked == 1){
				playFrame = minTimeRangeVal;
			} else if (playFrame == maxTimeRangeVal+1 && loopCB.checked == 0) {
				playStatus = 0;
				playFrame = minTimeRangeVal;
				playB.style.backgroundPosition = '0px 0px';
				playCB.checked = 0;
			}	
			setTimeout( function(){
					requestAnimationFrame( playBack );
			}, delays[playFrame])
		}
	}
	var fileToRead = document.getElementById("openFile");
	var fileOpenLabel = document.getElementById("openLabel");
	fileOpenLabel.addEventListener("click", function(event) { fileToRead.click() });
	
	// Data to play ang generate gif
	var renderCanvas,
	renderCanvasCtx,
	renderCanvasDiv,
	delays,
	minTimeRangeVal=null,
	maxTimeRangeVal=null,
	framesCanvases,
	mainWidth,
	mainHeight,
	resizeMult,
	cropPosX,
	cropPosY,
	imgIdx,
	gifName;
	// Event that update rendr canvas size, run the giflib script that split gif into frames
	// each frame will be rendered in separate canvas that stored in framesCanvases array
	// Every file processing will empty that list, so 
	fileToRead.addEventListener("change", function(event) {
		var files = fileToRead.files;
		if (files.length) {
			
			gifName = files[0].name;
			resizeMult = 1;
			delays = [];
			framesCanvases = {};
			renderCanvas = document.getElementById('gifcanvas');
			renderCanvasDiv = document.getElementById('gifcanvasDiv');
			renderCanvasCtx = renderCanvas.getContext('2d',{ alpha: true });
			var canvasHolder = document.getElementById('canvasHolder');
			var animInfo = document.getElementById('animInfo');
			
				var reader = new FileReader();
				reader.onload = function() {
					//SpinnerPlugin.activityStart("GIF loading...", { dimBackground: true })
					var arrayBuffer = this.result;
					var gif = new GIF(arrayBuffer);
					var frames = gif.decompressFrames(true);
					mainWidth = frames[0].dims.width;
					mainHeight = frames[0].dims.height;
					var tempMainCanvas = document.createElement('canvas');
					tempMainCanvas.width = mainWidth;
					tempMainCanvas.height = mainHeight;
					var tempMainCanvasCtx = tempMainCanvas.getContext('2d');
					for (k = 0; k<frames.length; k++){
						delays.push(frames[k].delay);
						var tempCanvas = document.createElement('canvas');
						tempCanvas.width = frames[0].dims.width;
						tempCanvas.height = frames[0].dims.height;
						var tempCanvasCtx = tempCanvas.getContext('2d');
						
						tempCanvasCtx.putImageData( new ImageData( frames[k].patch, frames[k].dims.width, frames[k].dims.height ), frames[k].dims.left, frames[k].dims.top, 0, 0, frames[0].dims.width, frames[0].dims.height  );
						if(frames[k].disposalType==2){
							tempMainCanvasCtx.fillStyle = "black";
							tempMainCanvasCtx.fillRect(0, 0, mainWidth, mainHeight);
						}
						tempMainCanvasCtx.drawImage(tempCanvas, 0, 0 );
						tempCanvasCtx.drawImage(tempMainCanvas, 0, 0 );
						framesCanvases[k] = tempCanvas;
					}
					
					canvasHolder.style.visibility = 'visible';
					canvasHolder.style.opacity = 0;
					
					
					// Check whether parent div smaller than loaded GIF, if so then store multiplier that scale down renderCanvas and renderCanvasDiv
					if ( animInfo.offsetWidth <= mainWidth || animInfo.offsetHeight <= mainHeight){
						var offscreenCanvasX = animInfo.offsetWidth/mainWidth;
						var offscreenCanvasY = animInfo.offsetHeight/mainHeight;
						resizeMult = Math.min(offscreenCanvasX, offscreenCanvasY)
					};
					// Resize renderCanvas element
					renderCanvasDiv.style.width = mainWidth*resizeMult + 'px';
					renderCanvasDiv.style.height = mainHeight*resizeMult + 'px';
					renderCanvas.width = mainWidth*resizeMult;
					renderCanvas.height = mainHeight*resizeMult;
					
					minTimeRangeVal = 0;
					maxTimeRangeVal = delays.length-1;
					
					renderCanvasCtx.drawImage( framesCanvases[0], 0, 0, mainWidth, mainHeight, 0, 0, renderCanvas.width, renderCanvas.height );
					renderCrop();
					$(function() {
						playFrame = 0;
						// Draw playbak slider with minimal time as minTimeRangeVal and maximum time as maxTimeRangeVal
						$('#slider-range').slider({
							range: true,
							min: 0,
							max: delays.length-1, 
							values: [ 0, delays.length-1 ],
							slide: function( event, ui ) {
								if( minTimeRangeVal != ui.values[ 0 ] ){
									minTimeRangeVal = ui.values[ 0 ];
									playFrame = ui.values[ 0 ];
									renderCanvasCtx.drawImage( framesCanvases[ui.values[ 0 ]], 0, 0, mainWidth, mainHeight, 0, 0, renderCanvas.width, renderCanvas.height );
								};
								if( maxTimeRangeVal != ui.values[ 1 ] ){
									maxTimeRangeVal = ui.values[ 1 ];
									renderCanvasCtx.clearRect( 0, 0, renderCanvas.width, renderCanvas.height );
									renderCanvasCtx.drawImage( framesCanvases[ui.values[ 1 ]], 0, 0, mainWidth, mainHeight, 0, 0, renderCanvas.width, renderCanvas.height );
									if( ui.values[ 1 ] -2 > ui.values[ 0 ]){
										playFrame = ui.values[ 1 ]-2;
									} else {
										playFrame = ui.values[ 1 ];
									}	
								};
							}	
						});
					});
					//SpinnerPlugin.activityStop();	
				}
			reader.readAsArrayBuffer(this.files[0]);
				
		};	
		
		}, false
	);
	// Div with dashed border, it must be always square 
	var cropCanvasBB = document.getElementById('cropCanvasBB');
	// Div which will catch mouse events
	var cropMouse = document.getElementById('cropMouse');
	
	function renderCrop(){
		var minDim = Math.min(renderCanvas.width,renderCanvas.height);
		// Draw and resize final crop canvas
		var cropCanvas = document.getElementById('cropCanvas');
		var cropCtx = cropCanvas.getContext('2d');
		cropCanvas.width = renderCanvas.width;
		cropCanvas.height = renderCanvas.height;
		// Resize it accordingly to renderCanvas dimensions, so it will have with and height with shortest renderCanvas's side
		var cropWidthX = minDim;
		var cropHeightY = minDim;
		cropCanvasBB.style.width = cropWidthX + 'px';
		cropCanvasBB.style.height = cropHeightY + 'px';
		// Place it to the center of the renderCanvas
		cropPosX = (renderCanvas.width-minDim)/2;
		cropPosY = (renderCanvas.height-minDim)/2;
		cropCanvasBB.style.left = cropPosX + 'px';
		cropCanvasBB.style.top = cropPosY + 'px';
		// Draw semitransparent canvas layer with circle in the center
		var maskCanvas = document.createElement('canvas');
		maskCanvas.width = cropCanvas.width;
		maskCanvas.height = cropCanvas.height;
		var maskCtx = maskCanvas.getContext('2d');
		maskCtx.fillStyle = "black";
		maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
		maskCtx.globalCompositeOperation = 'xor';
		maskCtx.arc(renderCanvas.width/2, renderCanvas.height/2, minDim/2, 0, 2 * Math.PI);
		maskCtx.fill();
		cropCtx.globalAlpha = 0.75;
		cropCtx.drawImage(maskCanvas, 0, 0);
		// Catch mouse button down event and store it to variables
		var cropCursorX;
		var cropCursorY;
		var rect = cropCanvasBB.getBoundingClientRect(); 
		canvasHolder.style.opacity = 1;
		// Touch start event 
		var pressCropStatus = 0;
		document.addEventListener('touchstart', 
			function(ev){
				var e = ev.touches[0];
				var elementMouseIsOver = document.elementFromPoint(e.clientX, e.clientY );
				if(elementMouseIsOver && elementMouseIsOver.id == 'cropMouse'){
					rect = cropMouse.getBoundingClientRect();
					cropCursorX = e.clientX - rect.left;
					cropCursorY = e.clientY - rect.top;
					pressCropStatus = 1;
				}
			}, false 
		);
		var touchEndPosX,
			touchEndPosY;	
		// Touch drag event 
		document.addEventListener('touchmove', 
			function(ev){
				var e = ev.touches[0];
				touchEndPosX = e.clientX;
				touchEndPosY = e.clientY;
				var elementMouseIsOver = document.elementFromPoint(e.clientX, e.clientY );
				if (elementMouseIsOver){
					if(pressCropStatus==1 && elementMouseIsOver.id == 'cropMouse'){
						rect = cropMouse.getBoundingClientRect();
						var x = e.clientX - rect.left,
							y = e.clientY - rect.top;
						cropCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
						// Redraw mask canvas and context with round hole inside;
						if(maskCanvas){
							maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
							delete maskCtx;
						}
						maskCanvas = document.createElement('canvas');
						maskCanvas.width = cropCanvas.width;
						maskCanvas.height = cropCanvas.height;
						maskCtx = maskCanvas.getContext('2d');
						maskCtx.fillStyle = "black";
						maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
						maskCtx.globalCompositeOperation = 'xor';
						var circleHoleX;
						var circleHoleY;
						// Get cusror position and redraw absolute crop canvas position and arc in canvas (hole inside the mask canvas)
						// Each event fire it should check that relative cursor position delta is less than cropCanvasBB - renderCanvas dimensions
						// Otherwise cropCanvasBB will stick to the nearest renderCanvas edge
						if ( cropPosX - (cropCursorX - x) >= 0 && (cropPosX  - (cropCursorX - x) )+ cropWidthX <= renderCanvas.width ){
							cropCanvasBB.style.left = cropPosX - (cropCursorX - x) + 'px';
							circleHoleX = cropPosX - (cropCursorX - x) + cropWidthX/2;
						} else {
							if ( cropPosX - ( cropCursorX - x ) < 0){
								cropCanvasBB.style.left = 0;
								circleHoleX = cropWidthX/2;
							} else {
								cropCanvasBB.style.left = (renderCanvas.width - cropWidthX) + 'px';
								circleHoleX = renderCanvas.width - cropWidthX/2;
							}
						}
						//console.log( ((cropPosY  - (cropCursorY - y) ) + cropHeightY) + ',' + (renderCanvas.height) + ',' + (cropPosY - (cropCursorY - y)) );
						if ( cropPosY - (cropCursorY - y) >= 0 && ( (cropPosY  - (cropCursorY - y) ) + cropHeightY ) <= renderCanvas.height ){
							cropCanvasBB.style.top = cropPosY - (cropCursorY - y) + 'px';
							circleHoleY =  cropPosY - (cropCursorY - y) + cropHeightY/2;
						} else {
							if ( cropPosY - ( cropCursorY - y) < 0 && (cropPosY  - (cropCursorY - y) ) + cropHeightY < renderCanvas.height ){
								cropCanvasBB.style.top = 0;
								circleHoleY = cropHeightY/2;
							} else if ( cropPosY - ( cropCursorY - y) > 0 && (cropPosY  - (cropCursorY - y) ) + cropHeightY > renderCanvas.height ) {
								cropCanvasBB.style.top = (renderCanvas.height - cropHeightY) + 'px';
								circleHoleY = renderCanvas.height - cropHeightY/2;
							}
						}
						// Redraw mask canvas and place it inside crop canvas
						maskCtx.arc(circleHoleX, circleHoleY, minDim/2, 0, 2 * Math.PI);
						maskCtx.fill();
						cropCtx.globalAlpha = 0.75;
						cropCtx.drawImage(maskCanvas, 0, 0);
					}
				}
			}
		, false);
		// Touch release event 
		document.addEventListener('touchend', 
			function(ev){
				var elementMouseIsOver = document.elementFromPoint(touchEndPosX, touchEndPosY );
				if(elementMouseIsOver){
					if( elementMouseIsOver.id == 'cropMouse'){
						cropPosX = parseInt(cropCanvasBB.style.left);
						cropPosY = parseInt(cropCanvasBB.style.top);
						pressCropStatus = 0;
					}
				}
		}, false);
	}
	
	var saveCanvas,
	saveCanvasCtx,
	saveFramesCanvases,
	fps = 20;
	
	// Generate final image to save
	function createImageToSave(){
		if (framesCanvases && delays){
			//SpinnerPlugin.activityStart("Processing GIF...", { dimBackground: true });
			saveFramesCanvases = [];
			var frameCount = Math.round( (delays.reduce((x, y) => x + y))/Math.round(1000/fps) );
			if (minTimeRangeVal && maxTimeRangeVal){
				frameCount = Math.round( (delays.slice(minTimeRangeVal, maxTimeRangeVal).reduce((x, y) => x + y))/Math.round(1000/fps) );
			}
			var startSeek = 0;
			var endSeek = frameCount;
			if (minTimeRangeVal){startSeek = minTimeRangeVal};
			if (maxTimeRangeVal){endSeek = maxTimeRangeVal};
			for ( var i=startSeek; i<frameCount; i++ ){
				var curFrame = i*Math.round(1000/fps);
				var timeSum = 0;
				for ( var k=0; k<delays.length; k++){
					if ( curFrame > timeSum ){
						timeSum += delays[k];
					} else {
						var minAppendVal = Math.min( i*Math.round(1000/fps)-timeSum, (timeSum + delays[k])-i*Math.round(1000/fps) );
						if (minAppendVal == i*Math.round(1000/fps)-timeSum){
							if(k-1>=0){
								saveFramesCanvases.push(framesCanvases[k-1]);
							} else {
								saveFramesCanvases.push(framesCanvases[0]);
							}
						} else {
							saveFramesCanvases.push(framesCanvases[k]);
						}
						break;
					}
				}	
			}
			if (saveFramesCanvases){
				saveCanvas = document.createElement('canvas');
				saveCanvasCtx = saveCanvas.getContext('2d');
				saveCanvas.width = 360*fps;
				saveCanvas.height = 360*( Math.ceil(saveFramesCanvases.length/fps) );
				var tempSaveCanvas = document.createElement('canvas');
				var tempSaveCanvasCtx = tempSaveCanvas.getContext('2d');
				tempSaveCanvas.width = 360;
				tempSaveCanvas.height = 360;
				tempSaveCanvasCtx.clearRect(0,0,360,360);
				var saveMinDim = Math.min( mainWidth,mainHeight );
				for ( var z=0; z < Math.ceil(saveFramesCanvases.length/fps)*fps; z++ ){
					if ( z<saveFramesCanvases.length){
						tempSaveCanvasCtx.drawImage( saveFramesCanvases[z], cropPosX/resizeMult, cropPosY/resizeMult, saveMinDim, saveMinDim, 0, 0, 360, 360 )
						saveCanvasCtx.drawImage( tempSaveCanvas, 0, 0, 360, 360, 360*z-360*fps*Math.floor(z/fps), 360*( Math.floor(z/fps) ), 360, 360 );
					} 
				}
				try{
					document.addEventListener("deviceready", function() {					
						window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
							var fileName = gifName.substring(0, gifName.lastIndexOf('.') ) + '_toGear.gif';
							fs.root.getFile( 'Pictures/' + fileName, { create: true, exclusive: false  }, function (fileEntry) {
								saveCanvas.toBlob(function(blob) {
									writeFile( fileEntry, blob );
								}, "image/png", 0.9 );
							}, function(){
								fs.root.getDirectory('Pictures', { create: true, exclusive: true  }, function (file) {
									fs.root.getFile( 'Pictures/' + fileName, { create: true, exclusive: false  }, function (fileEntry) {
										saveCanvas.toBlob(function(blob) {
											writeFile( fileEntry, blob );
										}, "image/png", 0.9 );
									}, function(){});
								}, function(){});
							});
						}, function(){});
					});
				} catch(e){};
			}	
		}
	}
	
	function writeFile(fileEntry, dataObj) {
		
		fileEntry.createWriter(function (fileWriter) {
			fileWriter.onwriteend = function() {
				if (dataObj.type == "image/png") {
					var preview = document.getElementById('preview');
					var previewCtx = preview.getContext('2d');
					previewCtx.drawImage( saveFramesCanvases[0], 0, 0, 30, 30 );
					preview.onclick = function() { 
						startApp.set({
							"action": "ACTION_VIEW",
							"flags":["FLAG_ACTIVITY_NEW_TASK"],
							"type": "image/*"
							}).start();
						}
					}
				//SpinnerPlugin.activityStop();
				}
			fileWriter.onerror = function (e) {};
			fileWriter.write(dataObj);
		});
	}
	
	function init(){	
	}
	
    window.onload = init();
}());