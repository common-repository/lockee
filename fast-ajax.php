<?php
$_fast_ajax = [];

function get_sanitized_action() {
	return filter_var(
		((!empty($_GET['action'])) ? $_GET['action'] : $_POST['action']),
		FILTER_SANITIZE_STRING
	);
}

define('DOING_AJAX', true);

if (!isset($_POST['action']) && !isset($_GET['action'])) {
	die('-1');
}

$_fast_ajax['action'] = get_sanitized_action();

$_fast_ajax['allowed_actions'] = [
	'verifcode'
];

if(!in_array($_fast_ajax['action'], $_fast_ajax['allowed_actions'])){
	die('-1');
}

require_once('../../../wp-load.php');

header('Content-Type: text/html');
send_nosniff_header();

header('Cache-Control: no-cache');
header('Pragma: no-cache');

if(is_user_logged_in()) {
	do_action("wp_fast_ajax_{$_fast_ajax['action']}");
} else {
	do_action("wp_fast_ajax_nopriv_{$_fast_ajax['action']}");
}

?>