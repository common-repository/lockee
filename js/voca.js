'use strict';
var homeURL, titleCode, titlePattern, titlePassword, titleUsername, titlePiano, titleLocation, txtLat, txtLng, txtDst, txtAdr, txtGetAddress, txtUsername, txtPassword, txtStartLoc, txtStopLoc, errLoc, txtPlay, txtStop, colorRed, colorOrange, colorYellow, colorBlue, colorGreen, colorPurple, colorIndigo, colorPink, colorBrown, colorGrey, colorBlack, colorWhite, errorOpenLock, txtIgnore, txtIgnoreC , txtIgnoreA, txtIgnoreP;
function getVoca() {
	const { __, _x, _n, _nx } = wp.i18n;
	homeURL = "";
	titleCode = __("Code de déverrouillage :", "lockee");
	titlePattern = __("Schéma de déverrouillage :", "lockee");
	titlePassword = __("Mot de passe :", "lockee");
	titleUsername = __("Identifiant :", "lockee");
	titlePiano = __("Séquence de déverrouillage :", "lockee");
	titleLocation = __("Position de déverrouillage :", "lockee");
	txtLat = __("Latitude", "lockee");
	txtLng = __("Longitude", "lockee");
	txtDst = __("Précision", "lockee");
	txtAdr = __("Adresse", "lockee");
	txtGetAddress = __("Localiser l'addresse", "lockee");
	txtUsername = __("Identifiant", "lockee");
	txtPassword = __("Mot de passe", "lockee");
	txtStartLoc = __("Démarrer la localisation", "lockee");
	txtStopLoc = __("Stopper la localisation", "lockee");
	errLoc = __("Le navigateur ne prend pas en compte la géolocalisation HTML5.", "lockee");
	txtPlay = __("Jouer la séquence", "lockee");
	txtStop = __("Stopper la séquence", "lockee");
	colorRed = __("Rouge", "lockee");
	colorOrange = __("Orange", "lockee");
	colorYellow = __("Jaune", "lockee");
	colorBlue = __("Bleu", "lockee");
	colorGreen = __("Vert", "lockee");
	colorPurple = __("Violet", "lockee");
	colorIndigo = __("Indigo", "lockee");
	colorPink = __("Rose", "lockee");
	colorBrown = __("Marron", "lockee");
	colorGrey = __("Gris", "lockee");
	colorBlack = __("Noir", "lockee");
	colorWhite = __("Blanc", "lockee");
	errorOpenLock = __("Désolé, une erreur a été rencontrée durant la vérification. Merci de réessayer plus tard ou avec un autre navigateur.", "lockee");
	txtIgnore = __("La saisie est insensible :", "lockee");
	txtIgnoreC = __("À la casse (majuscule/minuscule)", "lockee");
	txtIgnoreA = __("Aux caractères accentués", "lockee");
	txtIgnoreP = __("À la ponctuation et aux espaces", "lockee");
}
getVoca();