/* Note
	E  - green  - upper left  - 0 - lowest note
	A  - red    - upper right - 1 -
	C# - yellow - lower left  - 2 -
	E  - blue   - lower right - 3 - highest note
	
*/

//the current sound files don't have the same duration, some take slightly longer before the beat starts

// Assume beeps take half a second

// intro song? : 0, 1, 2, 3, 2, 3 (taradada dada);

// app settings and memory stuff
var settings = {
	// A P P   S E T T I N G S
	flashDuration     : 250,
	//timeBetweenBeeps  : 500,
	timeBetweenBeeps  : 500,
	pointGoal    : 20,
	difficultyCurve: 2, // hoy much the game speeds up over time, last turn is sped by this multiplier
	normalColors : ['#0B0', '#B00', '#BB0', '#00B'], // overwritten by CSS colors after 'DOMContentLoaded'
	flashColors  : ['#0F0', '#F00', '#FF0', '#00F'],
	victorySong  : [[0,0],[1,163],[2,336],[3,522],[3,680],[3,853],[2,1068],[2,1219],[2,1370],[2,1497],[1,1650],[2,1813],[1,1983],[0,2226],[0,2786],[1,2962],[2,3139],[3,3306],[3,3472],[3,3626],[2,3826],[2,3987],[2,4128],[1,4338],[0,4546],[0,4698],[1,4952],[2,5912],[3,5927],[1,5936],[0,5944],[3,6202],[1,6212],[2,6218],[0,6226]],
	
	// A P P   V A R I A B L E S
	mode : "normal", // "normal", "strict", "zen" 
	flashStack   : [0, 0, 0, 0], // used by buttonFlash function to deal with overlapping flashes
	noteStack    : [], // array of button user needs to play in order
	correctPressesThisRound: 0,
	isTurnOfAI   : false, // unused?
	playerCanMove: true,
	recordedSong : [], // user can record key presses and play them back
	activePlayback: false, // is true while a recording is being played, to avoid re-recording those notes
	
}



/*
var beep = [
	new Audio('simonSound4.mp3'), // lower tone
	new Audio('simonSound3.mp3'),
	new Audio('simonSound2.mp3'),
	new Audio('simonSound1.mp3'), // higher tone
]*/

var beep = [
	new Audio('dino/roar0.mp3'), // lower tone
	new Audio('dino/roar1.mp3'),
	new Audio('dino/roar2.mp3'),
	new Audio('dino/roar3.mp3'), // higher tone
]

function buttonFlash(button, index) {
	var newColor = settings.flashColors[index];
	button.style.backgroundColor = newColor;
	settings.flashStack[index]++;
	setTimeout(function() {
		if (0 < --settings.flashStack[index]) { return; }
		button.style.backgroundColor = settings.normalColors[index];
	}, settings.flashDuration);
}

document.addEventListener("DOMContentLoaded", function(event) {
	var buttons = document.getElementsByClassName("tone-button");
	var counter = document.getElementById("points");
	function displayPoints(val) { 
		var pointTotal = (val<10?'0'+val:val).toString();
		var ifZeroInsteadDisplay = 'XX'
		counter.innerHTML = (pointTotal != '00')? pointTotal : ifZeroInsteadDisplay;
		
	}
	displayPoints(0);
	
	// plays beep and flashes the button
	function playBeep(num, volume, delay) {
		displayPoints(settings.noteStack.length);
		setTimeout(function() {
			beep[num].volume = volume || 1;
			beep[num].currentTime = 0;
			beep[num].play();
			buttonFlash(buttons[num], num);
		}, delay || 0);
		
		if (settings.mode == "zen" && settings.activePlayback == false) {
			//settings.recordedSong.push(saveNote(num))
			saveNote(num);
		}
	}
	
	
	for (var i = 0; i < buttons.length; i++) {
		settings.normalColors[i] = window.getComputedStyle(buttons[i], null).backgroundColor;
		
		buttons[i].onclick = function(index) {
			return function() {
				if (settings.playerCanMove == true) {
					playerMove(index);
				}
			}
		}(i)
	}
	
	function resetGame() {
		if (settings.mode === 'strict') {
			settings.noteStack = [];
		}
		if (settings.mode !== 'zen') {
			aiTurn();
		}
		displayPoints(settings.noteStack.length);
	}
	
	function victory() {
		var originalMode = settings.mode;
		settings.mode = "zen"; //ADD SOMETHING TO PREVENT USER FROM CHANGING MODES WHILE TUNE PLAYS
		playSavedNotes(settings.victorySong);
		var songDuration = settings.victorySong[settings.victorySong.length-1][1] + settings.timeBetweenBeeps;
		makeElementFlash(counter, settings.timeBetweenBeeps, songDuration);
		setTimeout(function() {
			settings.mode = originalMode;
			settings.noteStack = [];
			aiTurn();
		}, songDuration + settings.timeBetweenBeeps * 4);
	}
	
	var gameMode = document.getElementsByClassName("game-mode");
	settings.elStyleDefaults = {};
	settings.elStyleDefaults['modeButton'] = {
		color: window.getComputedStyle(gameMode[0], null).color,
		backgroundColor: window.getComputedStyle(gameMode[0], null).backgroundColor,
	}
	function colorModeButtons() {
		for(var i = 0; i < gameMode.length; i++ ) {
			//console.log(settings.mode, gameMode[i].value)
			if (settings.mode == gameMode[i].value) {
				// inverted color/background
				gameMode[i].style.color = settings.elStyleDefaults['modeButton'].backgroundColor;
				gameMode[i].style.backgroundColor = settings.elStyleDefaults['modeButton'].color;
			}
			else {
				// normal color/background
				gameMode[i].style.color = settings.elStyleDefaults['modeButton'].color;
				gameMode[i].style.backgroundColor = settings.elStyleDefaults['modeButton'].backgroundColor;				
			}
		}
	}
	for (var i = 0; i < gameMode.length; i++) {
		if (gameMode[i].checked) {settings.mode = gameMode[i].value; }
		gameMode[i].onclick = function(event) {
			if (settings.playerCanMove == false) {return; }
			settings.noteStack = [];
			//console.log(event.target.value);
			settings.mode = event.target.value;
			resetGame();
			colorModeButtons();
		};
	}
	colorModeButtons();

	// plays notes that human has to input/repeat, player can't play notes until this ends
	function playNoteStack(notePos) {
		var multiplyer = 1 - (settings.noteStack.length - 1)/((settings.pointGoal - 1) * settings.difficultyCurve);
		var speed = settings.timeBetweenBeeps * multiplyer;
		var notePosToPlay = notePos || 0;
		if (notePosToPlay >= settings.noteStack.length) {
			settings.playerCanMove = true;
		} else {
			settings.playerCanMove = false;
			var noteToPlay = settings.noteStack[notePosToPlay];
			setTimeout(function() {
				playBeep(noteToPlay);
				playNoteStack(notePosToPlay+1);
				}, speed);
		}
	}
	
	//settings.noteStack = [0,1];
	//playNoteStack();
	
	
	function aiTurn() {
		if (settings.noteStack.length >= settings.pointGoal) {
			victory();
			return;
		}
		var newNote = Math.floor(Math.random() * buttons.length);
		settings.noteStack.push(newNote);
		playNoteStack();
	}
	
	function playerMove(note) {
		makeElementFlash(counter, 100);
		if (settings.mode == 'zen') {
			playBeep(note);
			return;
		}
		var noteWasCorrect = settings.noteStack[settings.correctPressesThisRound] == note;
		if (noteWasCorrect) {
			
			playBeep(note)
			settings.correctPressesThisRound++;
			if (settings.correctPressesThisRound >= settings.noteStack.length) {
				// round was beaten
				settings.playerCanMove = false;
				setTimeout(function() {
					settings.playerCanMove = false;
					settings.correctPressesThisRound = 0;
					happyNote(aiTurn);
				}, 1000);
				
				//aiTurn();
			}
		} else {
			//failed note
			
			settings.playerCanMove = false;
			settings.correctPressesThisRound = 0;
			
			if (settings.mode == 'strict') { 
				sadNote();
				setTimeout(function() {
					resetGame();// start game from scratch
				}, settings.timeBetweenBeeps * 2);
			}
			else { sadNote(playNoteStack); } // replay the needed tones/melody
		}
	}
	
	
	 aiTurn();
	

	
	
	
	
	//buttons[0].click();

	function happyNote(callback) {/*
		playBeep(0,0.05,0);
		playBeep(1,0.05,0);
		playBeep(2,0.05,0);
		playBeep(3,0.05,0);*/
		setTimeout(function() {
			callback();
		}, 300);
	}
	//happyNote()
	
	function sadNote(callback) {
		playBeep(3,0,0);
		playBeep(2,0,65);
		playBeep(1,0,65);
		playBeep(0,0,240);
		playBeep(0,0,445);
		setTimeout(function() {
			if(callback) { callback(); }
		}, 3000 + 445 + 500);
	}
	//sadNote();
	
	function funkyTownA(callback) {
		var multiplier = 1//2700 / 2750;
		playBeep(1,0,0 * multiplier);
		playBeep(1,0,250 * multiplier);
		playBeep(0,0,500 * multiplier);
		playBeep(1,0,750 * multiplier);
		playBeep(0,0,1250 * multiplier);
		playBeep(0,0,1750 * multiplier);
		playBeep(2,0,2000 * multiplier);
		playBeep(3,0,2250 * multiplier);
		playBeep(2,0,2500 * multiplier);
		playBeep(1,0,2750 * multiplier);
		setTimeout(function() {
			//callback();
		}, 2645 + 1000);
	}
	/*
	function funkyTownB(callback) {
		playBeep(0,.25,0 );
		playBeep(1,.125,250);
		setTimeout(function() {
		funkyTownB()}, 500);
	}
	*/
	
	// used to save a user-made melody inside setttings.recordedSong via note and time
	function saveNote(note) {
		if (settings.activePlayback == true) { return; };
		//var zeroTime = settings.zeroTime || (settings.zeroTime = (new Date()).getTime());
		var time = (new Date()).getTime()// - zeroTime;
		var noteAndTime = [note, time];
		settings.recordedSong.push(noteAndTime);
	}
	function playSavedNotes(notesToPlay) {
		if (settings.activePlayback == true) { return; };
		settings.activePlayback = true;
		settings.playerCanMove = false;
		var noteArr = notesToPlay || settings.recordedSong
		var firstNoteTime = noteArr[0][1];
		noteArr.map(function(val, index, arr) {
			var note = val[0];
			var time = val[1] - firstNoteTime;
			setTimeout(function() {
				playBeep(note);
			}, time);
		});
		var endOfRecording = noteArr[noteArr.length - 1][1] - firstNoteTime;
		setTimeout(function() { 
			settings.activePlayback = false; 
			settings.playerCanMove = true;
		}, endOfRecording + settings.timeBetweenBeeps);
	}
	
	document.onkeypress = function(event) {
		var pressedKey = String.fromCharCode(event.charCode).toUpperCase();
		//console.log(String.fromCharCode(event.charCode).toUpperCase());
		
		if (pressedKey == "F") { funkyTownA(); }
		
		// used String.fromCharCode(event.keyCode) for cross browser compatability
		if (pressedKey == "7" || pressedKey == "Q") buttons[0].click();
		if (pressedKey == "8" || pressedKey == "W") buttons[1].click();
		if (pressedKey == "4" || pressedKey == "A") buttons[2].click();
		if (pressedKey == "5" || pressedKey == "S") buttons[3].click();
		if (pressedKey == "3") playSavedNotes();
		if (pressedKey == " ") {
			buttons[0].click();
			buttons[1].click();
			buttons[2].click();
			buttons[3].click();
		}
	}
	
	var recordButton = document.getElementById("record-button")
	settings.recording = false;
	recordButton.onclick = function() {
		if (settings.playerCanMove == false) {return;}
		if (settings.recording == false) { 
			// will now start recording
			settings.recording = true;
			gameMode[2].click();
			settings.recordedSong = [];
			this.style.color = "red";
			this.innerHTML = "PLAY";
			
			

		}
		else {
			// will now stop recording and play
			playSavedNotes();
			stopRecording();
			gameMode[2].click();
		}
	}
	function stopRecording() {
		settings.recording = false;
		recordButton.style.color = settings.elStyleDefaults['modeButton'].color;
		recordButton.innerHTML = "RECORD"
	}
});


// flashes color as backgroundColor, backgroundColor currently untouched
// each propper "flash" lasts half a flashCycleTime, then waits another half flashCycleTime for next
// if no "duration" var is given, a singlge propper "flash" of duration flashCycleTime occurs
function makeElementFlash(node, flashCycleTime, duration) {
	if (duration == undefined) { 
		var flashCycleTime = flashCycleTime * 2;
		var duration = flashCycleTime;
	}
	if (!settings.elStyleDefaults) { settings.elStyleDefaults = {}; }
	if (!settings.elStyleDefaults[node]) { 
		settings.elStyleDefaults[node] = {
			color: window.getComputedStyle(node, null).color, 
			backgroundColor: window.getComputedStyle(node, null).backgroundColor,
		}
	}
	var transitionTimes = [];
	for (var i = 0; i < 2 * duration/flashCycleTime; i++) {
		transitionTimes.push(i * flashCycleTime / 2);
	}
	if (transitionTimes.length % 2 !== 0) { transitionTimes.push(duration); }
	transitionTimes.map(function(time, index) {
		setTimeout(function() {
			if (index % 2 == 0) {
				node.style.color = settings.elStyleDefaults[node].backgroundColor;
			}
			else {
				node.style.color = settings.elStyleDefaults[node].color;
			}
		}, time);
		
	});
}








