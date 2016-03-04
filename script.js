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
	timeBetweenBeeps  : 500,
	normalColors : ['#0B0', '#B00', '#BB0', '#00B'], // overwritten by CSS colors after 'DOMContentLoaded'
	flashColors  : ['#0F0', '#F00', '#FF0', '#00F'],
	
	// A P P   V A R I A B L E S
	mode : undefined, // "normal", "strict", "zen" initialized by default-checked HTML radio button
	flashStack   : [0, 0, 0, 0], // used by buttonFlash function to deal with overlapping flashes
	noteStack    : [], // array of button user needs to play in order
	playingStack : {}, // temp storage while a file plays, files deleted after they are finished playing
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
	
	// plays beep and flashes the button
	// game breaks if browser doesn't cache the audio files
	function playBeep(num, volume, delay) {
		var clipID = Math.random();
		settings.playingStack[clipID] = beep[num].cloneNode(false);
		//settings.playingStack[clipID] = beep.slice(num,num+1)[0];
		settings.playingStack[clipID].volume = volume || 1;
		settings.playingStack[clipID].onended = function() {
			test = settings.playingStack[clipID];
			//console.log(settings.playingStack[clipID]);
			delete settings.playingStack[clipID];
			//console.log(settings.playingStack[clipID]);
		}
		setTimeout(function() {
			settings.playingStack[clipID].play();
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
		settings.noteStack = [];
		if (settings.mode !== 'zen') {
			aiTurn();
		}
	}
	
	var gameMode = document.getElementsByClassName("game-mode");
	for (var i = 0; i < gameMode.length; i++) {
		if (gameMode[i].checked) {settings.mode = gameMode[i].value; }
		gameMode[i].addEventListener('change', function(event) {
			console.log(event.target.value);
			settings.mode = event.target.value;
			resetGame();
		});
	}

	// plays notes that human has to input/repeat, player can't play notes until this ends
	function playNoteStack(notePos) {
		var notePosToPlay = notePos || 0;
		if (notePosToPlay >= settings.noteStack.length) {
			settings.playerCanMove = true;
		} else {
			settings.playerCanMove = false;
			var noteToPlay = settings.noteStack[notePosToPlay];
			setTimeout(function() {
				playBeep(noteToPlay);
				playNoteStack(notePosToPlay+1);
				}, settings.timeBetweenBeeps);
		}
	}
	
	//settings.noteStack = [0,1];
	//playNoteStack();
	
	
	function aiTurn() {
		var newNote = Math.floor(Math.random() * buttons.length);
		settings.noteStack.push(newNote);
		playNoteStack();
	}
	
	function playerMove(note) {
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
			
			if (settings.mode = 'strict') { 
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
		var zeroTime = settings.zeroTime || (settings.zeroTime = (new Date()).getTime());
		var time = (new Date()).getTime() - zeroTime;
		var noteAndTime = [note, time];
		settings.recordedSong.push(noteAndTime);
	}
	function playSavedNotes() {
		if (settings.activePlayback == true) { return; };
		settings.activePlayback = true;
		settings.recordedSong.map(function(val, index, arr) {
			var note = val[0];
			var time = val[1];
			setTimeout(function() {
				playBeep(note);
			}, time);
		});
		var endOfRecording = settings.recordedSong[settings.recordedSong.length - 1][1];
		setTimeout(function() { settings.activePlayback = false; }, endOfRecording + 50);
	}
	
	document.onkeypress = function(event) {
		console.log(event);
		if (event.code === "KeyF") {
			funkyTownA();
		};
		// used String.fromCharCode(event.keyCode) for cross browser compatability
		if (event.code == "Numpad7" || String.fromCharCode(event.charCode).toUpperCase() == "Q") buttons[0].click();
		if (event.code == "Numpad8" || String.fromCharCode(event.charCode).toUpperCase() == "W") buttons[1].click();
		if (event.code == "Numpad4" || String.fromCharCode(event.charCode).toUpperCase() == "A") buttons[2].click();
		if (event.code == "Numpad5" || String.fromCharCode(event.charCode).toUpperCase() == "S") buttons[3].click();
		if (event.code == "Numpad3") playSavedNotes();
		if (event.code == "Space") {
			buttons[0].click();
			buttons[1].click();
			buttons[2].click();
			buttons[3].click();
		}
	}
});