/*
Lock.js
Auteur : Nicolas Desmarets
Copyright (c) 2020 Lockee.fr
*/
(function(factory) {
	/** support UMD ***/
	var global = Function('return this')() || (42, eval)('this');
	if (typeof define === "function" && define.amd) {
		define(["jquery"], function($) {
			return (global.Lock = factory($, global));
		});
	} else if (typeof module === "object" && module.exports) {
		module.exports = global.document ?
			factory(require("jquery"), global) :
			function(w) {
				if (!w.document) {
					throw new Error("lock.js requires a window with a document");
				}
				return factory(require("jquery")(w), w);
			};
	} else {
		global.Lock = factory(global.jQuery, global);
	}
}(function($, window, undefined) {
	"use strict";

	//var document = window.document
	var svgns = 'http://www.w3.org/2000/svg'
	var moveEvent = 'touchmove mousemove'
	var loc = navigator.geolocation;

	var scrollKeys = {
		37: true, // left
		38: true, // up
		39: true, // right
		40: true, // down
		32: true, // spacebar
		33: true, // pageup
		34: true, // pagedown
		35: true, // end
		36: true, // home
	}
	var frequencies = {
		"C": 261.63,
		"C#": 277.18,
		"D": 293.66,
		"D#": 311.13,
		"E": 329.63,
		"F": 349.23,
		"F#": 369.99,
		"G": 392,
		"G#": 415.3,
		"A": 440,
		"A#": 466.16,
		"B": 493.88
	};


	function Lock(namevar, idlock, idholder, idinputcode, type, mode) {

		var context, svg, root, dots, lines, actives, arrows, pt, pattern, currentline, currenthandler, codeentry, userentry, passentry, dcode, atype, playsound, pl, map, marker, circle

		var clearCode, initCode, displayCode, addtoCode, updateCode, displayCode, playCode, errorCode

		var self = this,
			lockname = this.name,
			holder = $("#lock-"+idlock+" "+idholder),
			inputcode = $("#lock-"+idlock+" "+idinputcode),
			atype = $("#lock-"+idlock+" #oldtype"),
			code = ""

		if (holder.length === 0) return;

		readyDom()
		dcode = $("#lock-"+idlock+" "+idholder + " #code")
		readyFunc()
		initCode()

		//internal functions
		function readyDom() {
			var html = []

			if (type == "") { //Schema
				html.push('')
			} else if (type == "S") { //Schema
				html.push('<div class="pad lock" id="schema"><div class="title">' + titlePattern + '</div><svg class="schema" id="lock" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg"><g class="lock-dots">')
				for (var j = 0; j < 3; j++) {
					for (var i = 0; i < 3; i++) {
						var x = 20 + i * 30
						var y = 10 + j * 30
						html.push('<circle cx="' + x + '" cy="' + y + '" r="2"></circle>')
					}
				}
				html.push('</g><g class="lock-lines"></g><g class="lock-actives"></g><g class="lock-arrows"></g></svg></div>')
			} else if (type == "P") { //Mot de passe
				html.push('<div class="pad lock"><div class="title">' + titlePassword + '</div><textarea id="codeentry" name="codeentry" class="codeentry" rows="3" placeholder="' + txtPassword + '..."></textarea>')
				if (mode == 2) {
					html.push(txtIgnore + '<label><input type="checkbox" id="ignoreC" name="ignore[]" class="chkbx" value="C" />' + txtIgnoreC + '</label><label><input type="checkbox" id="ignoreA" name="ignore[]" class="chkbx" value="A" />' + txtIgnoreA + '</label><label><input type="checkbox" id="ignoreP" name="ignore[]" class="chkbx" value="P" />' + txtIgnoreP + '</label>')
				}
				html.push('</div>')
			} else if (type == "L") { //Identification
				html.push('<div class="pad lock"><div class="title">' + titleUsername + '</div><input type="text" id="userentry" name="userentry" autocomplete="off" class="codeentry" /><div class="title">' + titlePassword + '</div><input type="text" id="passentry" name="passentry" class="codeentry" /></div>')
			} else if (type == "M") { //Musical
				html.push('<div class="pad lock"><div class="title">' + titlePiano + '</div><div class="piano"><div class="piano-key"><div class="key white" data-key="C"><div class="label">C</div></div><div class="key black" data-key="C#"><div class="label">C#</div></div></div><div class="piano-key"><div class="key white" data-key="D"><div class="label">D</div></div><div class="key black" data-key="D#"><div class="label">D#</div></div></div><div class="piano-key"><div class="key white" data-key="E"><div class="label">E</div></div></div><div class="piano-key"><div class="key white" data-key="F"><div class="label">F</div></div><div class="key black" data-key="F#"><div class="label">F#</div></div></div><div class="piano-key"><div class="key white" data-key="G"><div class="label">G</div></div><div class="key black" data-key="G#"><div class="label">G#</div></div></div><div class="piano-key"><div class="key white" data-key="A"><div class="label">A</div></div><div class="key black" data-key="A#"><div class="label">A#</div></div></div><div class="piano-key"><div class="key white" data-key="B"><div class="label">B</div></div></div></div></div><div id="play">' + txtPlay + '</div>')
			} else if (type == "G1") { //Geolocalise (reel)
				html.push('<div class="pad lock"><div class="title">' + titleLocation + '</div><div id="map"></div>')
				if(mode == 1){
					html.push('<input type="hidden" id="lat" name="lat" /><input type="hidden" id="lng" name="lng" /><input type="hidden" id="dst" name="dst" />')
					html.push('</div><div id="position">' + txtStartLoc + '</div>')
				} else {
					html.push('<input type="text" id="lat" name="lat" autocomplete="off" class="codeentry" placeholder="' + txtLat + '" /><input type="text" id="lng" name="lng" autocomplete="off" class="codeentry" placeholder="' + txtLng + '" /><input type="text" id="dst" name="dst" autocomplete="off" class="codeentry" placeholder="' + txtDst + '" />')
					html.push('</div><div id="position">' + txtStartLoc + '</div>')
					html.push('<input type="text" id="adr" name="adr" autocomplete="off" class="codeentry" placeholder="' + txtAdr + '" />')
					html.push('</div><div id="address">' + txtGetAddress + '</div>')
				}
			} else if (type == "G2") { //Geolocalise (virtuel)
				html.push('<div class="pad lock"><div class="title">' + titleLocation + '</div><div id="map"></div>')
				if(mode == 1){
					html.push('<input type="text" id="lat" name="lat" autocomplete="off" class="codeentry" placeholder="' + txtLat + '" /><input type="text" id="lng" name="lng" autocomplete="off" class="codeentry" placeholder="' + txtLng + '" /><input type="hidden" id="dst" name="dst" value="0" /><input type="text" id="adr" name="adr" autocomplete="off" class="codeentry" placeholder="' + txtAdr + '" />');
					html.push('</div><div id="address">' + txtGetAddress + '</div>')
				} else {
					html.push('<input type="text" id="lat" name="lat" autocomplete="off" class="codeentry" placeholder="' + txtLat + '" /><input type="text" id="lng" name="lng" autocomplete="off" class="codeentry" placeholder="' + txtLng + '" /><input type="text" id="dst" name="dst" autocomplete="off" class="codeentry" placeholder="' + txtDst + '" /><input type="text" id="adr" name="adr" autocomplete="off" class="codeentry" placeholder="' + txtAdr + '" />');
					html.push('</div><div id="address">' + txtGetAddress + '</div>')
				}
			} else if (type == "N") { //Chiffres
				html.push('<div class="pad lock" id="numbers"><div class="title">' + titleCode + '</div><table><tr><td><div class="touch" data-key="7">7</div></td><td><div class="touch" data-key="8">8</div></td><td><div class="touch" data-key="9">9</div></td></tr><tr><td><div class="touch" data-key="4">4</div></td><td><div class="touch" data-key="5">5</div></td><td><div class="touch" data-key="6">6</div></td></tr><tr><td><div class="touch" data-key="1">1</div></td><td><div class="touch" data-key="2">2</div></td><td><div class="touch" data-key="3">3</div></td></tr><tr><td></td><td><div class="touch" data-key="0">0</div></td><td></td></tr></table></div><div id="code"></div>')
			} else if (type == "D") { //Directions
				html.push('<div class="pad lock" id="directions"><div class="title">' + titleCode + '</div><table><tr><td></td><td><div class="touch" data-key="H"><img src="' + templateUrl + 'imgs/H-light.png" class="light" /><img src="' + templateUrl + 'imgs/H-dark.png" class="dark" /></div></td><td></td></tr><tr><td><div class="touch" data-key="G"><img src="' + templateUrl + 'imgs/G-light.png" class="light" /><img src="' + templateUrl + 'imgs/G-dark.png" class="dark" /></div></td><td></td><td><div class="touch" data-key="D"><img src="' + templateUrl + 'imgs/D-light.png" class="light" /><img src="' + templateUrl + 'imgs/D-dark.png" class="dark" /></div></td></tr><tr><td></td><td><div class="touch" data-key="B"><img src="' + templateUrl + 'imgs/B-light.png" class="light" /><img src="' + templateUrl + 'imgs/B-dark.png" class="dark" /></div></td><td></td></tr></table></div><div id="code"></div>')
			} else if (type == "D8") { //Directions
				html.push('<div class="pad lock directions" id="directions"><div class="title">' + titleCode + '</div><table><tr><td><div class="touch" data-key="A"><img src="' + templateUrl + 'imgs/A-light.png" class="light" /><img src="' + templateUrl + 'imgs/A-dark.png" class="dark" /></div></td><td><div class="touch" data-key="H"><img src="' + templateUrl + 'imgs/H-light.png" class="light" /><img src="' + templateUrl + 'imgs/H-dark.png" class="dark" /></div></td><td><div class="touch" data-key="C"><img src="' + templateUrl + 'imgs/C-light.png" class="light" /><img src="' + templateUrl + 'imgs/C-dark.png" class="dark" /></div></td></tr><tr><td><div class="touch" data-key="G"><img src="' + templateUrl + 'imgs/G-light.png" class="light" /><img src="' + templateUrl + 'imgs/G-dark.png" class="dark" /></div></td><td></td><td><div class="touch" data-key="D"><img src="' + templateUrl + 'imgs/D-light.png" class="light" /><img src="' + templateUrl + 'imgs/D-dark.png" class="dark" /></div></td></tr><tr><td><div class="touch" data-key="F"><img src="' + templateUrl + 'imgs/F-light.png" class="light" /><img src="' + templateUrl + 'imgs/F-dark.png" class="dark" /></div></td><td><div class="touch" data-key="B"><img src="' + templateUrl + 'imgs/B-light.png" class="light" /><img src="' + templateUrl + 'imgs/B-dark.png" class="dark" /></div></td><td><div class="touch" data-key="E"><img src="' + templateUrl + 'imgs/E-light.png" class="light" /><img src="' + templateUrl + 'imgs/E-dark.png" class="dark" /></div></td></tr></table></div><div id="code" class="code"></div>')
			} else if (type == "C") { //Couleurs
				html.push('<div class="pad lock" id="colors"><div class="title">' + titleCode + '</div><table><tr><td><div class="touch R" data-key="R">' + colorRed + '</div></td><td><div class="touch O" data-key="O">' + colorOrange + '</div></td><td><div class="touch J" data-key="J">' + colorYellow + '</div></td></tr><tr><td><div class="touch V" data-key="V">' + colorGreen + '</div></td><td><div class="touch B" data-key="B">' + colorBlue + '</div></td><td><div class="touch P" data-key="P">' + colorPurple + '</div></td></tr><tr><td><div class="touch I" data-key="I">' + colorIndigo + '</div></td><td><div class="touch K" data-key="K">' + colorPink + '</div></td><td><div class="touch M" data-key="M">' + colorBrown + '</div></td></tr><tr><td><div class="touch G" data-key="G">' + colorGrey + '</div></td><td><div class="touch N" data-key="N">' + colorBlack + '</div></td><td><div class="touch W" data-key="W">' + colorWhite + '</div></td></tr></table></div><div id="code"></div>')
			} else if (type == "O1") { //On-Off
				html.push('<div class="pad lock" id="switchs"><div class="title">' + titleCode + '</div><div class="onoff" id="A"><div>off</div></div><div class="onoff" id="B"><div>off</div></div><div class="onoff" id="C"><div>off</div></div><div class="onoff" id="D"><div>off</div></div><div class="onoff" id="E"><div>off</div></div><div class="onoff" id="F"><div>off</div></div><div class="onoff" id="G"><div>off</div></div><div class="onoff" id="H"><div>off</div></div><div class="onoff" id="I"><div>off</div></div><div class="onoff" id="J"><div>off</div></div><div class="onoff" id="K"><div>off</div></div><div class="onoff" id="L"><div>off</div></div><div class="onoff" id="M"><div>off</div></div><div class="onoff" id="N"><div>off</div></div><div class="onoff" id="O"><div>off</div></div><div class="onoff" id="P"><div>off</div></div></div><div id="code"></div>')
			} else if (type == "O2") { //On-Off2
				html.push('<div class="pad lock" id="switchs"><div class="title">' + titleCode + '</div><div class="onoff2" id="A"><div>off</div></div><div class="onoff2" id="B"><div>off</div></div><div class="onoff2" id="C"><div>off</div></div><div class="onoff2" id="D"><div>off</div></div><div class="onoff2" id="E"><div>off</div></div><div class="onoff2" id="F"><div>off</div></div><div class="onoff2" id="G"><div>off</div></div><div class="onoff2" id="H"><div>off</div></div><div class="onoff2" id="I"><div>off</div></div><div class="onoff2" id="J"><div>off</div></div><div class="onoff2" id="K"><div>off</div></div><div class="onoff2" id="L"><div>off</div></div><div class="onoff2" id="M"><div>off</div></div><div class="onoff2" id="N"><div>off</div></div><div class="onoff2" id="O"><div>off</div></div><div class="onoff2" id="P"><div>off</div></div><div class="onoff2" id="Q"><div>off</div></div><div class="onoff2" id="R"><div>off</div></div><div class="onoff2" id="S"><div>off</div></div><div class="onoff2" id="T"><div>off</div></div><div class="onoff2" id="U"><div>off</div></div><div class="onoff2" id="V"><div>off</div></div><div class="onoff2" id="W"><div>off</div></div><div class="onoff2" id="X"><div>off</div></div><div class="onoff2" id="Y"><div>off</div></div></div><div id="code"></div>')
			} else if (type == "Q1") { //On-Off Ordered
				html.push('<div class="pad lock" id="switchs"><div class="title">' + titleCode + '</div><div class="onoff" data-key="A"><div>off</div></div><div class="onoff" data-key="B"><div>off</div></div><div class="onoff" data-key="C"><div>off</div></div><div class="onoff" data-key="D"><div>off</div></div><div class="onoff" data-key="E"><div>off</div></div><div class="onoff" data-key="F"><div>off</div></div><div class="onoff" data-key="G"><div>off</div></div><div class="onoff" data-key="H"><div>off</div></div><div class="onoff" data-key="I"><div>off</div></div><div class="onoff" data-key="J"><div>off</div></div><div class="onoff" data-key="K"><div>off</div></div><div class="onoff" data-key="L"><div>off</div></div><div class="onoff" data-key="M"><div>off</div></div><div class="onoff" data-key="N"><div>off</div></div><div class="onoff" data-key="O"><div>off</div></div><div class="onoff" data-key="P"><div>off</div></div></div><div id="code" class="code"></div>')
			} else if (type == "Q2") { //On-Off2 Ordered
				html.push('<div class="pad lock" id="switchs"><div class="title">' + titleCode + '</div><div class="onoff2" data-key="A"><div>off</div></div><div class="onoff2" data-key="B"><div>off</div></div><div class="onoff2" data-key="C"><div>off</div></div><div class="onoff2" data-key="D"><div>off</div></div><div class="onoff2" data-key="E"><div>off</div></div><div class="onoff2" data-key="F"><div>off</div></div><div class="onoff2" data-key="G"><div>off</div></div><div class="onoff2" data-key="H"><div>off</div></div><div class="onoff2" data-key="I"><div>off</div></div><div class="onoff2" data-key="J"><div>off</div></div><div class="onoff2" data-key="K"><div>off</div></div><div class="onoff2" data-key="L"><div>off</div></div><div class="onoff2" data-key="M"><div>off</div></div><div class="onoff2" data-key="N"><div>off</div></div><div class="onoff2" data-key="O"><div>off</div></div><div class="onoff2" data-key="P"><div>off</div></div><div class="onoff2" data-key="Q"><div>off</div></div><div class="onoff2" data-key="R"><div>off</div></div><div class="onoff2" data-key="S"><div>off</div></div><div class="onoff2" data-key="T"><div>off</div></div><div class="onoff2" data-key="U"><div>off</div></div><div class="onoff2" data-key="V"><div>off</div></div><div class="onoff2" data-key="W"><div>off</div></div><div class="onoff2" data-key="X"><div>off</div></div><div class="onoff2" data-key="Y"><div>off</div></div></div><div id="code" class="code"></div>')
			}

			if (mode == 1) {
				html.push('<div class="pad"><table><tr><td><div class="restart" onclick="' + namevar + '.clearCode();">&#8634;</div></td><td></td><td><div class="confirm" onclick="openLock(\'' + idlock + '\');">&#10004;&#xfe0e;</div></td></tr></table></div>')
			} else if ((mode == 2) && (type != "")) {
				html.push('<div class="pad"><table><tr><td><div class="restart" onclick="' + namevar + '.clearCode();">&#8634;</div></td><td></td><td></td></tr></table></div>')
			}

			holder.html(html.join(''))

		}

		function readyFunc() {

			
			if(type == ""){
				
				initCode = function() {
					code = ""
					inputcode.val(code)
				}
				
				displayCode = function() {
					code = ""
					inputcode.val(code)
				}
				
				clearCode = function() {
					code = ""
					inputcode.val(code)
				}
				
				updateCode = function() {
					code = ""
					inputcode.val(code)
				}
				
			} else if (type == "S") { //Schema

				svg = $(".schema")
				root = svg[0]
				dots = svg.find('.lock-dots circle')
				lines = svg.find('.lock-lines')
				actives = svg.find('.lock-actives')
				arrows = svg.find('.lock-arrows')
				pt = root.createSVGPoint()
				pattern = []
				svg.on('touchstart mousedown', function(e) {
					clearCode()
					e.preventDefault()
					disableScroll()
					svg.on(moveEvent, discoverDot)
					var endEvent = e.type == 'touchstart' ? 'touchend' : 'mouseup'
					$(document).one(endEvent, function(e) {
						end()
					})
				})

				initCode = function() {
					if (atype.val() == "S") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					for (var i = 0; i < code.length; i++) {
						var x = dots[code[i] - 1].getAttribute('cx')
						var y = dots[code[i] - 1].getAttribute('cy')
						var marker = createNewMarker(x, y)
						pattern.push(marker)
						actives.append(marker)
						if (code[i - 1] != undefined) {
							var x0 = dots[code[i - 1] - 1].getAttribute('cx')
							var y0 = dots[code[i - 1] - 1].getAttribute('cy')
							var line = createNewLine(x0, y0, x, y)
							lines.append(line)
							var arrow = createArrow(x0, y0, x, y)
							arrows.append(arrow)
						}
					}
				}

				clearCode = function() {
					pattern = []
					code = ""
					inputcode.val("")
					currentline = undefined
					currenthandler = undefined
					lines.empty()
					actives.empty()
					arrows.empty()
				}

				updateCode = function() {
					pattern.map(function(n, i) {
						code += dots.index(n) + 1
					})
					code = parseInt(code)
					inputcode.val(code)
				}

			} else if (type == "P") { //Mot de passe

				codeentry = $(idholder + " #codeentry");

				if (codeentry != undefined) {
					codeentry.bind('input', function(e) {
						updateCode()
					})
				}
				
				if (mode == 2) {
					if($("#inputoptions").val() != ""){
						var ignore = $("#inputoptions").val()
						if(ignore.includes("C")){
							$(idholder + " #ignoreC").prop("checked", true)
						}
						if(ignore.includes("A")){
							$(idholder + " #ignoreA").prop("checked", true)
						}
						if(ignore.includes("P")){
							$(idholder + " #ignoreP").prop("checked", true)
						}
					}
				}

				initCode = function() {
					if (atype.val() == "P") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

				displayCode = function() {
					codeentry.val(code)
				}

				updateCode = function() {
					code = codeentry.val()
					code = code.replace(/(\r\n|\n|\r)/gm,"")
					codeentry.val(code)
					inputcode.val(code)
				}

			} else if (type == "L") { //Identification

				userentry = $(idholder + " #userentry")
				passentry = $(idholder + " #passentry")

				if (userentry != undefined) {
					userentry.bind('input', function(e) {
						updateCode()
					})
				}

				if (passentry != undefined) {
					passentry.bind('input', function(e) {
						updateCode()
					})
				}

				initCode = function() {
					if (atype.val() == "L") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

				displayCode = function() {
					code = code.split('&-~~-&')
					userentry.val(code[0])
					passentry.val(code[1])
				}

				updateCode = function() {
					var user = userentry.val()
					user = user.replace(/(\r\n|\n|\r)/gm,"")
					var pass = passentry.val()
					pass = pass.replace(/(\r\n|\n|\r)/gm,"")
					userentry.val(user)
					passentry.val(pass)
					code = user + "&-~~-&" + pass
					inputcode.val(code)
				}

			} else if (type == "M") { //Musical

				context = new(window.AudioContext || window.webkitAudioContext)();

				playsound = function(key) {
					var freq = frequencies[key];
					var oscillator = context.createOscillator();
					var gainNode = context.createGain();
					oscillator.connect(gainNode);
					gainNode.connect(context.destination);
					oscillator.type = 'sine';
					oscillator.frequency.value = freq;
					gainNode.gain.setValueAtTime(0, context.currentTime);
					gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.01);
					oscillator.start(context.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
					oscillator.stop(context.currentTime + 1);
				}

				holder.find(".key").on('click', function(e) {
					playsound($(this).attr("data-key"));
					addtoCode($(this).attr("data-key"))
				})

				$(idholder + " #play").on('click', function(e) {
					if (code != "") {
						if (pl == undefined) {
							playCode(0)
							$(idholder + " #play").text(txtStop);
						} else {
							clearTimeout(pl);
							pl = undefined;
							holder.find(".key").removeClass("active");
							$(idholder + " #play").text(txtPlay);
						}
					}
				})

				playCode = function() {
					var tcode = code.split(" ");
					var i = 0;
					clearTimeout(pl);
					pl = setTimeout(function() {
						playNote(i)
					}, 0);

					function playNote(i) {
						holder.find(".key").removeClass("active");
						holder.find("[data-key='" + tcode[i] + "']").addClass("active");
						playsound(tcode[i]);
						i++;
						if (i < tcode.length) {
							pl = setTimeout(function() {
								playNote(i)
							}, 800);
						} else {
							pl = setTimeout(function() {
								pl = undefined;
								holder.find(".key").removeClass("active");
								holder.find("#play").text(txtPlay);
							}, 800);
						}
					}
				}

				addtoCode = function(t) {
					if (code != "") {
						code += " "
					}
					code += t
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "M") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					if (mode == 0) {
						dcode.text(code)
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}
				
			} else if (type == "G1") { //Geolocalise Reel

				map = L.map('map').setView([0, 0], 0)
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map)
				if(mode > 1){
					marker = L.marker([0, 0], {draggable: 'true'}).addTo(map)
					if($(idholder + " #dst").val() > 0){
						circle = L.circle([0, 0], {radius: $(idholder + " #dst").val()}).addTo(map)
					}
					marker.on('dragstart', function(e) {
						loc.clearWatch(pl)
						pl = undefined
						$(idholder + " #position").text(txtStartLoc)
					});
					marker.on('dragend', function (e) {
						code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val()
						inputcode.val(code)
						displayCode()
					});
				} else {
					marker = L.marker([0, 0]).addTo(map)
				}

				$(idholder + " #position").on('click', function(e) {
					if(pl == undefined){
						if (loc){
							pl = loc.watchPosition(addtoCode, null, {maximumAge: 0, enableHighAccuracy:true});
						} else {
							alert(errLoc);
						}
						$(idholder + " #position").text(txtStopLoc);
					} else {
						loc.clearWatch(pl);
						pl = undefined;
						$(idholder + " #position").text(txtStartLoc);
					}
				})
				
				$(idholder + " #address").on('click', function(e) {
					var location = $(idholder + " #adr").val()
					if(location != ""){
						loc.clearWatch(pl)
						pl = undefined;
						$(idholder + " #position").text(txtStartLoc);
						//var geocode = 'https://nominatim.openstreetmap.org/search/?format=json&q=' + location
						var geocode = 'https://photon.komoot.io/api/?limit=1&lang=fr&q=' + location
						$.getJSON(geocode, function(data) {
							var res = data.features[0];
							code = res.geometry.coordinates[1] + ";" + res.geometry.coordinates[0] + ";" + $(idholder + " #dst").val()
							//code = data[0].lat + ";" + data[0].lon + ";" + $(idholder + " #dst").val() + ";" + location
							inputcode.val(code)
							displayCode(true)
						});
					}
				})
				
				$(idholder + " #lat").on('keyup', function(e) {
					updateCode()
				})
				
				$(idholder + " #lng").on('keyup', function(e) {
					updateCode()
				})
				
				$(idholder + " #dst").on('keyup', function(e) {
					updateCode()
				})
				
				updateCode = function() {
					code = $(idholder + " #lat").val() + ";" + $(idholder + " #lng").val() + ";" + $(idholder + " #dst").val()
					inputcode.val(code)
					displayCode(false)
				}
				
				addtoCode = function(t) {
					code = t.coords.latitude + ";" + t.coords.longitude + ";" + t.coords.accuracy
					inputcode.val(code)
					displayCode(true)
				}
				
				initCode = function() {
					if (atype.val() == "G1") {
						code = inputcode.val()
						displayCode(true)
					} else {
						clearCode()
					}
				}

				displayCode = function(center) {
					if(code != ""){
						var tcode = code.split(";")
						var lat = tcode[0]
						var lng = tcode[1]
						var dst = tcode[2]
						$(idholder + " #lat").val(lat)
						$(idholder + " #lng").val(lng)
						$(idholder + " #dst").val(dst)
						if(center){
							map.setView([lat, lng], 18)
						}
						if(map.hasLayer(marker)){
							map.removeLayer(marker)
						}
						if(map.hasLayer(circle)){
							map.removeLayer(circle)
						}
						if(mode > 1){
							marker = L.marker([lat, lng], {draggable: 'true'}).addTo(map)
							if(dst > 0){
								circle = L.circle([lat, lng], {radius: dst}).addTo(map)
							}
							marker.on('dragstart', function(e) {
								loc.clearWatch(pl)
								pl = undefined
								$(idholder + " #position").text(txtStartLoc)
							});
							marker.on('dragend', function (e) {
								code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val()
								inputcode.val(code)
								displayCode()
							});
						} else {
							marker = L.marker([lat, lng]).addTo(map)
						}
					} else {
						$(idholder + " #lat").val("")
						$(idholder + " #lng").val("")
						$(idholder + " #dst").val("15")
					}
				}

				clearCode = function() {
					if(map.hasLayer(marker)){
						map.removeLayer(marker)
					}
					if(map.hasLayer(circle)){
						map.removeLayer(circle)
					}
					if(mode > 1){
						marker = L.marker([0, 0], {draggable: 'true'}).addTo(map)
						if($(idholder + " #dst").val() > 0){
							circle = L.circle([0, 0], {radius: $(idholder + " #dst").val()}).addTo(map)
						}
						marker.on('dragstart', function(e) {
							loc.clearWatch(pl)
							pl = undefined
							$(idholder + " #position").text(txtStartLoc)
						});
						marker.on('dragend', function (e) {
							code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val()
							inputcode.val(code)
							displayCode()
						});
					} else {
						marker = L.marker([0, 0]).addTo(map)
					}
					code = ""
					inputcode.val("")
					displayCode()
				}
			
			} else if (type == "G2") { //Geolocalise Virtuel

				map = L.map('map').setView([0, 0], 0)
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map)
				marker = L.marker([0, 0], {draggable: 'true'}).addTo(map)
				if($(idholder + " #dst").val() > 0){
					circle = L.circle([0, 0], {radius: $(idholder + " #dst").val()}).addTo(map)
				}
				marker.on('dragend', function (e) {
					code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val() + ";"
					inputcode.val(code)
					displayCode(false)
				});

				$(idholder + " #address").on('click', function(e) {
					var location = $(idholder + " #adr").val().replace(";", "")
					$(idholder + " #adr").val(location)
					if(location != ""){
						//var geocode = 'https://nominatim.openstreetmap.org/search/?format=json&q=' + location
						var geocode = 'https://photon.komoot.io/api/?limit=1&lang=fr&q=' + location
						$.getJSON(geocode, function(data) {
							var res = data.features[0];
							code = res.geometry.coordinates[1] + ";" + res.geometry.coordinates[0] + ";" + $(idholder + " #dst").val() + ";" + location
							//code = data[0].lat + ";" + data[0].lon + ";" + $(idholder + " #dst").val() + ";" + location
							inputcode.val(code)
							displayCode(true)
						});
					}
				})
				
				$(idholder + " #lat").on('keyup', function(e) {
					updateCode()
				})
				
				$(idholder + " #lng").on('keyup', function(e) {
					updateCode()
				})
				
				$(idholder + " #dst").on('keyup', function(e) {
					updateCode()
				})
				
				updateCode = function() {
					code = $(idholder + " #lat").val() + ";" + $(idholder + " #lng").val() + ";" + $(idholder + " #dst").val() + ";" + $(idholder + " #adr").val()
					inputcode.val(code)
					displayCode(false)
				}
				
				initCode = function() {
					if (atype.val() == "G2") {
						code = inputcode.val()
						displayCode(true)
					} else {
						clearCode()
					}
				}

				displayCode = function(center) {
					if(code != ""){
						var tcode = code.split(";")
						var lat = tcode[0]
						var lng = tcode[1]
						var dst = tcode[2]
						var adr = tcode[3]
						$(idholder + " #lat").val(lat)
						$(idholder + " #lng").val(lng)
						$(idholder + " #dst").val(dst)
						$(idholder + " #adr").val(adr)
						if(center){
							map.setView([lat, lng], 18)
						}
						if(map.hasLayer(marker)){
							map.removeLayer(marker)
						}
						if(map.hasLayer(circle)){
							map.removeLayer(circle)
						}
						marker = L.marker([lat, lng], {draggable: 'true'}).addTo(map)
						if((mode == 2)&&(dst > 0)){
							circle = L.circle([lat, lng], {radius: dst}).addTo(map)
						}
						marker.on('dragend', function (e) {
							code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val() + ";" + $(idholder + " #adr").val()
							inputcode.val(code)
							displayCode()
						});
					} else {
						$(idholder + " #lat").val("")
						$(idholder + " #lng").val("")
						$(idholder + " #dst").val("0")
						$(idholder + " #adr").val("")
					}
				}

				clearCode = function() {
					if(map.hasLayer(marker)){
						map.removeLayer(marker)
					}
					map.setView([0, 0], 0)
					marker = L.marker([0, 0], {draggable: 'true'}).addTo(map)
					if($(idholder + " #dst").val() > 0){
						circle = L.circle([0, 0], {radius: $(idholder + " #dst").val()}).addTo(map)
					}
					marker.on('dragend', function (e) {
						code = marker.getLatLng().lat + ";" + marker.getLatLng().lng + ";" + $(idholder + " #dst").val() + ";" + $(idholder + " #adr").val()
						inputcode.val(code)
						displayCode()
					});
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "N") { //Nombres

				holder.find(".touch").on('click', function(e) {
					addtoCode($(this).data("key"))
				})

				addtoCode = function(t) {
					code += t
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "N") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					dcode.text("")
					for (var i = 0; i < code.length; i++) {
						dcode.append("<span class='mini'>" + code[i] + "</span>")
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "D") { //Directions

				holder.find(".touch").on('click', function(e) {
					addtoCode($(this).data("key"))
				})

				addtoCode = function(t) {
					code += t
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "D") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					dcode.text("")
					for (var i = 0; i < code.length; i++) {
						dcode.append("<img src='" + templateUrl + "imgs/" + code[i] + "-light.png' class='mini light' />")
					}
					for (var i = 0; i < code.length; i++) {
						dcode.append("<img src='" + templateUrl + "imgs/" + code[i] + "-dark.png' class='mini dark' />")
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}
			
			} else if (type == "D8") { //Directions
			
				holder.find(".touch").on('click', function(e) {
					addtoCode($(this).data("key"))
				})
				
				addtoCode = function(t) {
					code += t
					inputcode.val(code)
					displayCode()
				}
				
				initCode = function() {
					if (atype.val() == "D8") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}
				
				displayCode = function() {
					dcode.text("")
					for (var i = 0; i < code.length; i++) {
						dcode.append("<img src='" + templateUrl + "imgs/" + code[i] + "-light.png' class='mini light' />")
					}
					for (var i = 0; i < code.length; i++) {
						dcode.append("<img src='" + templateUrl + "imgs/" + code[i] + "-dark.png' class='mini dark' />")
					}
				}
				
				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}
			
			} else if (type == "C") { //Couleurs
			
				holder.find(".touch").on('click', function(e) {
					addtoCode($(this).data("key"))
				})
			
				addtoCode = function(t) {
					code += t
					inputcode.val(code)
					displayCode()
				}
			
				initCode = function() {
					if (atype.val() == "C") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}
			
				displayCode = function() {
					dcode.text("")
					for (var i = 0; i < code.length; i++) {
						dcode.append("<span class='mini " + code[i] + "'></span>")
					}
				}
			
				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "C") { //Couleurs

				holder.find(".touch").on('click', function(e) {
					addtoCode($(this).attr("id"))
				})

				addtoCode = function(t) {
					code += t
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "C") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					dcode.text("")
					for (var i = 0; i < code.length; i++) {
						dcode.append("<span class='mini " + code[i] + "'></span>")
					}
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "O1") { //Switchs

				holder.find(".onoff").on('click', function(e) {
					addtoCode($(this).attr("id"))
				})

				addtoCode = function(t) {
					var tcode, find
					find = false
					tcode = []
					for(var i = 0; i < code.length; i++) {
						if(code[i] != t ){
							tcode[i] = code[i]
						} else {
							find = true
						}
					}
					if(!find){
						tcode.push(t)
					}
					tcode.sort()
					code = tcode.join("")
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "O1") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					$(".onoff").each(function( index ) {
						if(code.indexOf($(this).attr("id")) >= 0){
							$(this).html("<div class='on'>I</div>")
						} else {
							$(this).html("<div class='off'>O</div>")
						}
					});
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "O2") { //Directions

				holder.find(".onoff2").on('click', function(e) {
					addtoCode($(this).attr("id"))
				})

				addtoCode = function(t) {
					var tcode, find
					find = false
					tcode = []
					for(var i = 0; i < code.length; i++) {
						if(code[i] != t ){
							tcode[i] = code[i]
						} else {
							find = true
						}
					}
					if(!find){
						tcode.push(t)
					}
					tcode.sort()
					code = tcode.join("")
					inputcode.val(code)
					displayCode()
				}

				initCode = function() {
					if (atype.val() == "O2") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}

				displayCode = function() {
					$(".onoff2").each(function( index ) {
						if(code.indexOf($(this).attr("id")) >= 0){
							$(this).html("<div class='on'>I</div>")
						} else {
							$(this).html("<div class='off'>O</div>")
						}
					});
				}

				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}

			} else if (type == "Q1") { //Switchs Ordered
			
				holder.find(".onoff").on('click', function(e) {
					addtoCode($(this).data("key"))
				})
			
				addtoCode = function(t) {
					if(code.indexOf(t) == -1){
						code += t
					}
					inputcode.val(code)
					displayCode()
				}
			
				initCode = function() {
					if (atype.val() == "Q1") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}
			
				displayCode = function() {
					holder.find(".onoff").each(function( index ) {
						if(code.indexOf($(this).data("key")) >= 0){
							$(this).html("<div class='on'>" + (code.indexOf($(this).data("key"))+1) + "</div>")
						} else {
							$(this).html("<div class='off'>O</div>")
						}
					});
				}
			
				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}
			
			} else if (type == "Q2") { //Switchs Ordered
			
				holder.find(".onoff2").on('click', function(e) {
					addtoCode($(this).data("key"))
				})
			
				addtoCode = function(t) {
					if(code.indexOf(t) == -1){
						code += t
					}
					inputcode.val(code)
					displayCode()
				}
			
				initCode = function() {
					if (atype.val() == "Q2") {
						code = inputcode.val()
						displayCode()
					} else {
						clearCode()
					}
				}
			
				displayCode = function() {
					holder.find(".onoff2").each(function( index ) {
						if(code.indexOf($(this).data("key")) >= 0){
							$(this).html("<div class='on'>" + (code.indexOf($(this).data("key"))+1) + "</div>")
						} else {
							$(this).html("<div class='off'>O</div>")
						}
					});
				}
			
				clearCode = function() {
					code = ""
					inputcode.val("")
					displayCode()
				}
			
			}
			//initCode();
		}

		function end() {
			enableScroll()
			stopTrack(currentline)
			currentline && currentline.remove()
			svg.off(moveEvent, discoverDot)
			var val = updateCode()
		}

		function preventDefault(e) {
			e = e || window.event;
			if (e.preventDefault)
				e.preventDefault();
			e.returnValue = false;
		}

		function preventDefaultForScrollKeys(e) {
			if (scrollKeys[e.keyCode]) {
				preventDefault(e);
				return false;
			}
		}

		function disableScroll() {
			if (window.addtoCodeEventListener) // older FF
				window.addtoCodeEventListener('DOMMouseScroll', preventDefault, false);
			window.onwheel = preventDefault; // modern standard
			window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
			window.ontouchmove = preventDefault; // mobile
			document.onkeydown = preventDefaultForScrollKeys;
		}

		function enableScroll() {
			if (window.removeEventListener)
				window.removeEventListener('DOMMouseScroll', preventDefault, false);
			window.onwheel = null;
			window.onmousewheel = document.onmousewheel = null;
			window.ontouchmove = null;
			document.onkeydown = null;
		}

		function isTargetUsed(target) {
			for (var i = 0; i < pattern.length; i++) {
				if (pattern[i] === target) {
					return true
				}
			}
			return false
		}

		function isTargetAvailable(target) {
			for (var i = 0; i < dots.length; i++) {
				if (dots[i] === target) {
					return true
				}
			}
			return false
		}

		function updateLine(line) {
			return function(e) {
				e.preventDefault()
				if (currentline !== line) return
				var pos = svgPosition(e.target, e)
				line.setAttribute('x2', pos.x)
				line.setAttribute('y2', pos.y)
				return false
			}
		}

		function discoverDot(e, target) {
			if (!target) {
				var x = getMousePosX(e)
				var y = getMousePosY(e)
				target = document.elementFromPoint(x, y)
			}
			var cx = target.getAttribute('cx')
			var cy = target.getAttribute('cy')
			if (isTargetAvailable(target) && !isTargetUsed(target)) {
				stopTrack(currentline, target)
				currentline = beginTrack(target)
			}
		}

		function stopTrack(line, target) {
			if (line === undefined) return
			if (currenthandler) {
				svg.off('touchmove mousemove', currenthandler)
			}
			if (target === undefined) return
			var x = target.getAttribute('cx')
			var y = target.getAttribute('cy')
			var arrow = createArrow(line.getAttribute('x1'), line.getAttribute('y1'), x, y)
			arrows.append(arrow)
			line.setAttribute('x2', x)
			line.setAttribute('y2', y)
		}

		function beginTrack(target) {
			pattern.push(target)
			var x = target.getAttribute('cx')
			var y = target.getAttribute('cy')
			var line = createNewLine(x, y)
			var marker = createNewMarker(x, y)
			actives.append(marker)
			currenthandler = updateLine(line)
			svg.on('touchmove mousemove', currenthandler, false)
			lines.append(line)
			return line
		}

		function createNewMarker(x, y) {
			var marker = document.createElementNS(svgns, "circle")
			marker.setAttribute('cx', x)
			marker.setAttribute('cy', y)
			marker.setAttribute('r', 6)
			return marker
		}

		function createNewLine(x1, y1, x2, y2) {
			var line = document.createElementNS(svgns, "line")
			line.setAttribute('x1', x1)
			line.setAttribute('y1', y1)
			if (x2 === undefined || y2 == undefined) {
				line.setAttribute('x2', x1)
				line.setAttribute('y2', y1)
			} else {
				line.setAttribute('x2', x2)
				line.setAttribute('y2', y2)
			}
			return line
		}

		function createArrow(x1, y1, x2, y2) {
			var arrow = document.createElementNS(svgns, "path")
			var fx1 = parseInt(x1) - 0.5
			var fx2 = parseInt(x1) + 1.5
			var fy1 = parseInt(y1) - 2
			var fy2 = parseInt(y1) + 2
			var ang = (Math.atan2(y2 - y1, x2 - x1)) * 180 / Math.PI
			arrow.setAttribute('d', 'M ' + fx1 + ' ' + fy1 + ' L ' + fx2 + ' ' + y1 + ' L ' + fx1 + ' ' + fy2)
			arrow.setAttribute('transform', 'rotate(' + ang + ',' + x1 + ',' + y1 + ')')
			return arrow
		}

		function getMousePosX(e) {
			return e.clientX || e.originalEvent.touches[0].clientX
		}

		function getMousePosY(e) {
			return e.clientY || e.originalEvent.touches[0].clientY
		}

		function svgPosition(element, e) {
			var x = getMousePosX(e)
			var y = getMousePosY(e)
			pt.x = x
			pt.y = y
			return pt.matrixTransform(element.getScreenCTM().inverse())
		}

		return ({
			'clearCode': clearCode
		})
	}

	return Lock

}));