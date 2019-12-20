(function() {
	var MES;
	if (navigator.language.includes('ru')) {
       MES = ['Загрузка GIF...', 'Обработка GIF...', 'Пожалуйста, выберите картинку меньше: ', ' сек. длительность слишком большая. Сократите до 10 сек., пожалуйста.', ' с.' ];
    } else if (navigator.language.includes('de')) {
       MES = ['Laden GIF...', 'Bearbeitung GIF...', 'Bitte wählen Sie ein kleineres Bild: ', 'sek. die dauer ist zu lang. Reduziere auf 10 sek., bitte.', ' s.'  ];
    } else if (navigator.language.includes('fr')) {
       MES = ['Chargement GIF...', 'Traitement GIF...', 'Veuillez sélectionner une image plus petite: ', "sec. la durée est trop longue. Réduire à 10 sec., s'il vous plait", ' s.'  ];
    } else if (navigator.language.includes('pl')) {
       MES = ["Ładowanie GIF...", "Przetwarzanie GIF...", "Wybierz mniejszy obraz: ", 'sek. czas trwania jest za długi. Skróć do 10 sekund, proszę', ' s.'  ];
    } else if (navigator.language.includes('lv')) {
       MES = ["Iekraušana GIF...", "Apstrāde GIF...", "Lūdzu, atlasiet mazāku attēlu: ", 'sek. ilgums ir pārāk garš. Samaziniet līdz 10 sekundēm, lūdzu.', ' s.'  ];
    } else if (navigator.language.includes('lt')) {
       MES = ["Pakrovimas GIF...", "Apdorojimas GIF...", "Pasirinkite mažesnį vaizdą: ", 'sek. trukmė per ilga. Sumažinkite iki 10 sek., prašau.', ' s.'  ];
    } else if (navigator.language.includes('ua')) {
       MES = ["Завантаження GIF...", "Обробка GIF...", "Будь ласка, виберіть картинку менше: ", 'сек. тривалість занадто велика. Скоротіть до 10 сек., будь ласка.', ' с.'  ];
    } else {
       MES = ['GIF loading...', 'Processing GIF...', 'Please, select image less than: ', ' sec. is too long. Reduce to 10 sec., please. ', ' s.'  ];
    }

	var filesizeLimit = 30e6;

	// contrtol background of playback buttons with checking attribute
	var playCB = document.getElementById('playCheckbox');
	var playB = document.getElementById('playButton');
	playCB.addEventListener('change', function(){
		if( this.checked == 1){
			playB.style.backgroundPosition = '-32px 0px';
			if (delays){
				playStatus = 1;
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
		var permissions = cordova.plugins.permissions;
		permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, createImageToSave, errorCatcher('saving error'));
		//createImageToSave();
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
	var canvasHolder = document.getElementById('canvasHolder');
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
			if (files[0].size > filesizeLimit){
				window.alert( MES[2] + filesizeLimit/1e6 + 'Mb' )
				return
			}
			gifName = files[0].name;
			resizeMult = 1;
			delays = [];
			framesCanvases = {};
			renderCanvas = document.getElementById('gifcanvas');
			renderCanvasDiv = document.getElementById('gifcanvasDiv');
			renderCanvasCtx = renderCanvas.getContext('2d',{ alpha: true });

			var animInfo = document.getElementById('animInfo');

				var reader = new FileReader();
				reader.onload = function() {
					SpinnerPlugin.activityStart(MES[0], { dimBackground: true })
					var arrayBuffer = this.result;
					var gif = new GIF(arrayBuffer);
					if (gif){
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
						var delayResult = delays.filter(word => (word));
						var averageDelay = Math.round( (delayResult.reduce( ( x, y ) => x + y) )/delayResult.length )
						delays=delays.map(function(elem){ return (!elem)?averageDelay:elem; });

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
							duration.innerHTML = Math.round( ( delays.slice(minTimeRangeVal, maxTimeRangeVal).reduce((x, y) => x + y))/1e3 ) + MES[4];
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
									if ( minTimeRangeVal < maxTimeRangeVal) {
										duration.innerHTML = Math.round( ( delays.slice(minTimeRangeVal, maxTimeRangeVal).reduce((x, y) => x + y))/1e3) + MES[4];
									}
								}
							});
						});
						SpinnerPlugin.activityStop();

					} else {
						errorCatcher('gif is not animated')
					}
				}
			reader.readAsArrayBuffer(this.files[0]);
			reader.onerror = function(){ errorCatcher('file is corrupted') };
			};

		}, false
	);
	// Div with dashed border, it must be always square
	var cropCanvasBB = document.getElementById('cropCanvasBB');
	// Div which will catch mouse events
	var cropMouse = document.getElementById('cropMouse');
	var regEvents = 0;
	var cropCanvas = document.getElementById('cropCanvas');
	var cropCtx = cropCanvas.getContext('2d');
	var maskCanvas = document.createElement('canvas');
	var pressCropStatus = 0;
	var pressResizeStatus = 0;
	var maskCtx = maskCanvas.getContext('2d');

	function renderCrop(){
		var minDim = Math.min(renderCanvas.width,renderCanvas.height);
		// Draw and resize final crop canvas

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

		maskCanvas.width = cropCanvas.width;
		maskCanvas.height = cropCanvas.height;

		maskCtx.fillStyle = "black";
		maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
		maskCtx.globalCompositeOperation = 'xor';
		maskCtx.arc(renderCanvas.width/2, renderCanvas.height/2, minDim/2, 0, 2 * Math.PI);
		maskCtx.fill();
		cropCtx.globalAlpha = 0.75;
		cropCtx.drawImage(maskCanvas, 0, 0);
		canvasHolder.style.opacity = 1;
		// Touch start event

		var activeElement;
		if (regEvents == 0){
			registerEvents();
			regEvents = 1;
		}
	}

	function registerEvents(){
		canvasHolder.addEventListener('touchstart',
			function(ev){
				var e = ev.touches[0];
				var elementMouseIsOver = document.elementsFromPoint(e.clientX, e.clientY );
				var ids = [];
				for(var i = 0; i < elementMouseIsOver.length; i++) {
					ids.push( elementMouseIsOver[i].id )
				}
				if( ids.includes('cropMouse') ){
					oldPosX = e.clientX;
					oldPosY = e.clientY;
					pressCropStatus = 1
				}

				if( ids.includes('cropMouse') ){
					if( !ids.includes('cropBBHandle1' ) && !ids.includes('cropBBHandle2' ) && !ids.includes('cropBBHandle3' ) && !ids.includes('cropBBHandle4' ) ){
						activeElement = 'cropMouse'
					} else {
						 if( ids.includes( 'cropBBHandle1' ) ){
							activeElement = 'cropBBHandle1';
						} else if ( ids.includes( 'cropBBHandle2' ) ){
							activeElement = 'cropBBHandle2';
						} else if ( ids.includes( 'cropBBHandle3' ) ){
							activeElement = 'cropBBHandle3';
						} else if ( ids.includes( 'cropBBHandle4' ) ){
							activeElement = 'cropBBHandle4';
						}
					}
				}


			}, false
		);
		var oldPosX = 0;
		var oldPosY = 0;
		// Touch drag event
		canvasHolder.addEventListener( 'touchmove',
			function(ev){
				var e = ev.touches[0];
				var elementMouseIsOver = document.elementsFromPoint(e.clientX, e.clientY );
				var ids = [];
				for(var i = 0; i < elementMouseIsOver.length; i++) {
					ids.push( elementMouseIsOver[i].id )
				}
				if( pressCropStatus && ids.includes('cropMouse') ){
					var x = e.clientX, y = e.clientY;
					//var delta = Math.round( Math.sqrt ( Math.pow( x-oldPosX, 2 ) + Math.pow( y-oldPosY, 2 ) ) ) * pm;
						//console.log( parseInt( cropCanvasBB.style.left ) + Math.round(x-oldPosX) + 'px' )
						if( activeElement =='cropBBHandle1' ){
							if( parseInt( cropCanvasBB.style.top ) + (y-oldPosY) >= 0 && parseInt( cropCanvasBB.style.left ) + (x-oldPosX) >= 0 && parseInt( cropCanvasBB.style.width ) - (x-oldPosX) > 40 && parseInt( cropCanvasBB.style.height ) - (y-oldPosY) > 40 ){
								cropCanvasBB.style.top = parseInt( cropCanvasBB.style.top ) + Math.round(y-oldPosY) + 'px';
								cropCanvasBB.style.left = parseInt( cropCanvasBB.style.left ) + Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.width = parseInt( cropCanvasBB.style.width ) - Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.height = parseInt( cropCanvasBB.style.height ) - Math.round(y-oldPosY) + 'px';
							}
						} else if( activeElement =='cropBBHandle2' ){
							if( parseInt( cropCanvasBB.style.top ) + (y-oldPosY) >= 0 && parseInt( cropCanvasBB.style.left ) + parseInt( cropCanvasBB.style.width ) + (x-oldPosX) <= renderCanvas.width && parseInt( cropCanvasBB.style.width ) + (x-oldPosX) > 40 && parseInt( cropCanvasBB.style.height ) - (y-oldPosY) > 40 ){
								cropCanvasBB.style.top = parseInt( cropCanvasBB.style.top ) + Math.round(y-oldPosY) + 'px';
								cropCanvasBB.style.width = parseInt( cropCanvasBB.style.width ) + Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.height = parseInt( cropCanvasBB.style.height ) - Math.round(y-oldPosY) + 'px';
							}
						} else if( activeElement =='cropBBHandle3' ){
							if( parseInt( cropCanvasBB.style.left ) + (x-oldPosX) >= 0 && parseInt( cropCanvasBB.style.top ) + parseInt( cropCanvasBB.style.height ) + (y-oldPosY)<= renderCanvas.height && parseInt( cropCanvasBB.style.width ) - (x-oldPosX) > 40 && parseInt( cropCanvasBB.style.height ) + (y-oldPosY) > 40 ){
								cropCanvasBB.style.left = parseInt( cropCanvasBB.style.left ) + Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.width = parseInt( cropCanvasBB.style.width ) - Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.height = parseInt( cropCanvasBB.style.height ) + Math.round(y-oldPosY) + 'px';
							}
						} else if( activeElement =='cropBBHandle4' ){
							if( parseInt( cropCanvasBB.style.top ) + parseInt( cropCanvasBB.style.height ) + (y-oldPosY) <= renderCanvas.height && parseInt( cropCanvasBB.style.left ) + parseInt( cropCanvasBB.style.width ) + (x-oldPosX) <= renderCanvas.width && parseInt( cropCanvasBB.style.width ) + (x-oldPosX) > 40 && parseInt( cropCanvasBB.style.height ) + (y-oldPosY) > 40 ){
								cropCanvasBB.style.width = parseInt( cropCanvasBB.style.width ) + Math.round(x-oldPosX) + 'px';
								cropCanvasBB.style.height = parseInt( cropCanvasBB.style.height ) + Math.round(y-oldPosY) + 'px';
							}
						} else if( activeElement =='cropMouse' ){
							if( parseInt( cropCanvasBB.style.top ) + parseInt( cropCanvasBB.style.height ) <= renderCanvas.height ){
								if( parseInt( cropCanvasBB.style.top ) + (y-oldPosY)  >= 0 ){
									cropCanvasBB.style.top = parseInt( cropCanvasBB.style.top ) + Math.round(y-oldPosY) + 'px';
								} else {
									cropCanvasBB.style.top = 0;
								}
							} else {
								cropCanvasBB.style.top =  renderCanvas.height - parseInt( cropCanvasBB.style.height ) + 'px';
							}
							if( parseInt( cropCanvasBB.style.left ) + parseInt( cropCanvasBB.style.width ) <= renderCanvas.width ){
								if( parseInt( cropCanvasBB.style.left ) + (x-oldPosX) >= 0 ){
									cropCanvasBB.style.left = parseInt( cropCanvasBB.style.left ) + Math.round(x-oldPosX) + 'px';
								} else {
									cropCanvasBB.style.left = 0;
								}
							} else {
								cropCanvasBB.style.left =  renderCanvas.width - parseInt( cropCanvasBB.style.width ) + 'px';
							}
						}
						oldPosX = x;
						oldPosY = y;
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
						// Redraw mask canvas and place it inside crop canvas
						maskCtx.arc( (parseInt(cropCanvasBB.style.left) + parseInt(cropCanvasBB.style.width)/2), (parseInt(cropCanvasBB.style.top) + parseInt(cropCanvasBB.style.height)/2), Math.min( parseInt(cropCanvasBB.style.width),parseInt(cropCanvasBB.style.height) ) /2, 0, 2 * Math.PI);
						maskCtx.fill();
						cropCtx.globalAlpha = 0.75;
						cropCtx.drawImage(maskCanvas, 0, 0);


				}
			//console.log(elementMouseIsOver.id)
			}
		, false);
		// Touch release event
		canvasHolder.addEventListener('touchend',
			function(ev){
				pressCropStatus = 0;
		}, false);

	}

	var saveCanvas,
	saveCanvasCtx,
	saveFramesCanvases,
	fps = 20;

	// Generate final image to save
	function createImageToSave(){
		if (framesCanvases && delays){

			saveFramesCanvases = [];
			var totalDuration = delays.reduce((x, y) => x + y);
			if ( Math.floor( delays.slice(minTimeRangeVal, maxTimeRangeVal+1).reduce((x, y) => x + y) ) > 10e3){
				window.alert( Math.round( delays.slice(minTimeRangeVal, maxTimeRangeVal+1).reduce((x, y) => x + y)/1e3 )  + MES[3])
				return
			}
			var rangeDuration = Math.round( delays.slice(minTimeRangeVal, maxTimeRangeVal+1).reduce((x, y) => x + y) );
			if( rangeDuration > 0 && rangeDuration <= 2000 ){
				fps = 30;
			} else if ( rangeDuration > 2000 && rangeDuration <= 4000 ){
				fps = 25;
			} else if ( rangeDuration > 4000 && rangeDuration <= 6000 ){
				fps = 20;
			} else if ( rangeDuration > 6000 && rangeDuration <= 8000 ){
				fps = 15;
			} else if ( rangeDuration > 8000 && rangeDuration <= 10000 ){
				fps = 12;
			}

			SpinnerPlugin.activityStart(MES[1], { dimBackground: true });
			var frameCount = Math.round( totalDuration/(1000/fps) );
			if (minTimeRangeVal>=0 && maxTimeRangeVal){
				frameCount = Math.round( (delays.slice(minTimeRangeVal, maxTimeRangeVal+1).reduce((x, y) => x + y))/(1000/fps) );
			}
			saveFramesCanvases.push(framesCanvases[minTimeRangeVal])
			for ( var i=1; i<frameCount; i++ ){
				var curFrame = i*(1000/fps);
				var delaySum = 0;
				var matchCount = 0;
				for ( var k=minTimeRangeVal+1; k<delays.length+1; k++ ){
					delaySum += delays[k];
					if( Math.abs(delaySum - curFrame) <= (1000/fps)/2){
						saveFramesCanvases.push(framesCanvases[k])
						matchCount ++;
						break;
					}
				}
				if( matchCount == 0){
					saveFramesCanvases.push(null);
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
						if(saveFramesCanvases[z]){
							var minCropDimSave = Math.min( parseInt(cropCanvasBB.style.width),parseInt(cropCanvasBB.style.height) )
							var xMinPos = parseInt(cropCanvasBB.style.left) + (parseInt(cropCanvasBB.style.width) - minCropDimSave )/2
							var yMinPos = parseInt(cropCanvasBB.style.top) + (parseInt(cropCanvasBB.style.height) - minCropDimSave )/2
							tempSaveCanvasCtx.drawImage( saveFramesCanvases[z], xMinPos/resizeMult, yMinPos/resizeMult, minCropDimSave/resizeMult, minCropDimSave/resizeMult, 0, 0, 360, 360 )
						} else {
							tempSaveCanvasCtx.clearRect(0,0,360,360);
							// fill 3x 3y pixel with green color 
							tempSaveCanvasCtx.fillStyle = "rgba("+0+","+255+","+0+","+255+")";
							tempSaveCanvasCtx.fillRect( 2, 2, 4, 4 );
							tempSaveCanvasCtx.fillStyle = "rgba("+0+","+0+","+0+","+0+")";
							tempSaveCanvasCtx.fillRect( 9, 9, 4, 4 );
							//tempSaveCanvasCtx.drawImage( saveFramesCanvases[z], cropPosX/resizeMult, cropPosY/resizeMult, saveMinDim, saveMinDim, 0, 0, 360, 360 )
						}
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
								}, "image/gif", 0.95 );
							}, function(){
								fs.root.getDirectory('Pictures', { create: true, exclusive: true  }, function (file) {
									fs.root.getFile( 'Pictures/' + fileName, { create: true, exclusive: false  }, function (fileEntry) {
										saveCanvas.toBlob(function(blob) {
											writeFile( fileEntry, blob );
										}, "image/gif", 0.95 );
									}, function(){errorCatcher('file in new folder is not created')});
								}, function(){errorCatcher('pictures folder is not created')});
							});
						}, function(){errorCatcher('file is not created')});
					});
				} catch(e){errorCatcher(e)};
			}
		}
	}

	function writeFile(fileEntry, dataObj) {

		fileEntry.createWriter(function (fileWriter) {
			fileWriter.onwriteend = function() {
				//if (dataObj.type == "image/*") {
					var preview = document.getElementById('preview');
					var previewCtx = preview.getContext('2d');
					previewCtx.drawImage( saveFramesCanvases[0], 0, 0, 30, 30 );
					preview.onclick = function() {
						
						/*
						startApp.set({
							"action": "ACTION_VIEW",
							"flags":["FLAG_ACTIVITY_NEW_TASK"],
							"type": "image/*"
							}).start();
						*/
						
						var sApp = startApp.set({ /* params */
							"action":"ACTION_VIEW",
							"type":"image/gif",
							"package":"com.android.gallery",
							"intentstart":"startActivity"
						}, { /* extras */
							
						});

						sApp.check(function(values) { /* success */
							console.log(values)
						}, function(error) { /* fail */
							alert(error);
						});

						sApp.start(function() { /* success */
							console.log(values)
						}, function(error) { /* fail */
							alert(error);
						});
						
					}
					//}
				SpinnerPlugin.activityStop();
				}
			fileWriter.onerror = function (e) {};
			fileWriter.write(dataObj);
		});
	}

	function errorCatcher(e){
		//console.log(e);
		SpinnerPlugin.activityStop();
	}

	function init(){
		language = navigator.language;
	}

    window.onload = init();
}());