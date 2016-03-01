/* Note
	E  - blue   - lower right -
	C# - yellow - lower left  -
	A  - red    - upper right -
	E  - green  - upper left  - (a note lower than blue)
*/

//the current sound files don't have the same duration, some take slightly longer before the beat starts

// Assume beeps take half a second


var beep = [
	new Audio('simonSound1.mp3'),
	new Audio('simonSound2.mp3'),
	new Audio('simonSound3.mp3'),
	new Audio('simonSound4.mp3'),
]

function playBeep(num) {
	;
}

document.addEventListener("DOMContentLoaded", function(event) {
	var buttons = document.getElementsByClassName("tone-button");
	for (var i = 0; i < buttons.length; i++) {
		buttons[buttons.length - 1 - i].onclick = function(number, index) {
			return function() {
				var audioClip = new Audio(beep[index].src);
				setTimeout(function(){audioClip.play();}, 0);
				console.log(number);
			}
		}(buttons.length - i, i)
	}
});