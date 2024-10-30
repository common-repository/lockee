<?php
/**
 * Plugin Name:       Lockee
 * Plugin URI:        https://wordpress.lockee.fr/
 * Description:       Ajoute les cadenas Lockee à Wordpress.
 * Version:           2.1.5
 * Author:            Nicolas Desmarets
 * Author URI:        https://lockee.fr/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       lockee
**/

$lockee_version = '2.1.5';

function lockee_admin_includes(){
	global $lockee_version;
	wp_enqueue_style('nunito', plugins_url('/css/nunito.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style('leaflet', plugins_url('/css/leaflet.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style('styles', plugins_url('/css/styles.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style('light', plugins_url('/css/light.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_script('leaflet', plugins_url('/js/leaflet.js', __FILE__), false, $lockee_version, false);
	wp_enqueue_script('voca', plugins_url('/js/voca.js', __FILE__), array('wp-i18n'), $lockee_version, false);
	wp_enqueue_script('lock', plugins_url('/js/lock.js', __FILE__), array('jquery'), $lockee_version, false);
	$script  = 'templateUrl = "'. plugin_dir_url( __FILE__ ) .'";';
	wp_add_inline_script('lock', $script, 'before');
}

function lockee_includes(){
	global $lockee_version;
	wp_enqueue_style('nunito', plugins_url('/css/nunito.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style( 'leaflet', plugins_url('/css/leaflet.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style( 'styles', plugins_url('/css/styles.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_style( 'light', plugins_url('/css/light.css', __FILE__), false, $lockee_version, 'all');
	wp_enqueue_script('leaflet', plugins_url('/js/leaflet.js', __FILE__), false, $lockee_version, false);
	wp_enqueue_script('voca', plugins_url('/js/voca.js', __FILE__), array('wp-i18n'), $lockee_version, false);
	wp_enqueue_script('lock', plugins_url('/js/lock.js', __FILE__), array('jquery'), $lockee_version, false);
	$script  = 'templateUrl = "'. plugin_dir_url( __FILE__ ) .'";';
	wp_add_inline_script('lock', $script, 'before');
	wp_enqueue_script('func', plugins_url('/js/func.js', __FILE__), array('jquery'), $lockee_version, true);
	$script  = 'ajaxurl = "'. plugin_dir_url( __FILE__ ).'fast-ajax.php";';
	wp_add_inline_script('func', $script, 'before');
}

if(!function_exists('lockee_verifcode')) {
	function lockee_verifcode(){
		if((!empty($_GET["id"]))&&($_GET["code"] != "")){
			$id = intval($_GET['id']);
			$code = htmlspecialchars($_GET['code']);
			$lock_code = get_post_meta($id , 'lockee_code', true);
			$lock_type = get_post_meta($id , 'lockee_type', true);
			$lock_options = get_post_meta($id , 'lockee_options', true);
			$content = get_post_meta($id , 'lockee_content', true);
			$open = 1;
			
			if($lock_type == "G1"){
				$tcode1 = explode(";", $code);
				$tcode2 = explode(";", $lock_code);
				$earth_radius = 6378137;
				if(($tcode1[0] != $tcode2[0])||($tcode1[1] != $tcode2[1])){
					$rla1 = deg2rad($tcode1[0]);
					$rlo1 = deg2rad($tcode1[1]);
					$rla2 = deg2rad($tcode2[0]);
					$rlo2 = deg2rad($tcode2[1]);
					$dlo = ($rlo2 - $rlo1) / 2;
					$dla = ($rla2 - $rla1) / 2;
					$a = (sin($dla) * sin($dla)) + cos($rla1) * cos($rla2) * (sin($dlo) * sin($dlo));
					$d = 2 * atan2(sqrt($a), sqrt(1 - $a));
					$dist = ($earth_radius * $d);
					if($dist >= min($tcode1[2] + $tcode2[2], 50)){
						$open = 0;
					}
				}
			} else if($lock_type == "G2"){
				$tcode1 = explode(";", $code);
				$tcode2 = explode(";", $lock_code);
				$earth_radius = 6378137;
				if(($tcode1[0] != $tcode2[0])||($tcode1[1] != $tcode2[1])){
					$rla1 = deg2rad($tcode1[0]);
					$rlo1 = deg2rad($tcode1[1]);
					$rla2 = deg2rad($tcode2[0]);
					$rlo2 = deg2rad($tcode2[1]);
					$dlo = ($rlo2 - $rlo1) / 2;
					$dla = ($rla2 - $rla1) / 2;
					$a = (sin($dla) * sin($dla)) + cos($rla1) * cos($rla2) * (sin($dlo) * sin($dlo));
					$d = 2 * atan2(sqrt($a), sqrt(1 - $a));
					$dist = ($earth_radius * $d);
					if($dist >= $tcode2[2]){
						$open = 0;
					}
				}
			} else if($lock_type == "P"){
				if(lockee_ignoreTypes($lock_code, $lock_options) != lockee_ignoreTypes($code, $lock_options)){
					$open = 0;
				}
			} else {
				if($lock_code != $code){
					$open = 0;
				}
			}
			if($open == 0){
				$content = "[[LOCKEE_BADCODE]]";
			}
			$file = $content;
		} else {
			$file = "[[LOCKEE_ERROR]]";
		}
		echo $file;
		wp_die();
	}
}

if(!function_exists('lockee_display_metabox')) {
	function lockee_display_metabox($post){
		$lockee_type = get_post_meta($post->ID, 'lockee_type', true);
		$lockee_code = get_post_meta($post->ID, 'lockee_code', true);
		$lockee_options = get_post_meta($post->ID, 'lockee_options', true);
		$lockee_content = get_post_meta($post->ID, 'lockee_content', true);
		$lock_types = array(
			"N" => __("Numérique", "lockee"),
			"D" => __("Directionnel (4 directions)", "lockee"),
			"D8" => __("Directionnel (8 directions)", "lockee"),
			"C" => __("À couleurs", "lockee"),
			"M" => __("Musical", "lockee"),
			"S" => __("À schéma", "lockee"),
			"O1" => __("Avec interrupteurs (4x4)", "lockee"),
			"O2" => __("Avec interrupteurs (5x5)", "lockee"),
			"Q1" => __("Avec interrupteurs ordonnés (4x4)", "lockee"),
			"Q2" => __("Avec interrupteurs ordonnés (5x5)", "lockee"),
			"G1" => __("Géolocalisé (réel)", "lockee"),
			"G2" => __("Géolocalisé (virtuel)", "lockee"),
			"L" => __("À connexion", "lockee"),
			"P" => __("Mot de passe", "lockee")
		);
		echo '<div class="lockee" id="lock-admin">';
		echo '<input type="hidden" id="oldtype" value="'.$lockee_type.'" />';
		echo '<select id="inputtype" name="inputtype" onchange="reloadLock();"><option value="">'.__("Aucun", "lockee").'</option>';
		foreach($lock_types as $k => $v){
			if($lockee_type == $k){
				echo "<option value='$k' selected>$v</option>";
			} else {
				echo "<option value='$k'>$v</option>";
			}
		}
		echo '</select>';
		echo '<div id="isclose">';
		echo '<div style="position:relative;width:320px;margin:auto;">';
		echo '<input type="hidden" id="inputcode" name="inputcode" value="'.$lockee_code.'" />';
		echo '<input type="hidden" id="inputoptions" name="inputoptions" value="'.$lockee_options.'" />';
		echo '<div id="wrapper-code"></div>';
		echo '</div>';
		echo '<script type="text/javascript">';
		echo 'lockAdmin = new Lock("lockAdmin", "admin", "#wrapper-code", "#inputcode", "'.$lockee_type.'", 2);';
		echo 'function reloadLock(){
			lockAdmin = new Lock("lockAdmin", "admin", "#wrapper-code", "#inputcode", document.getElementById("inputtype").value, 2);	
		}';
		echo '</script>';
		echo '</div></div>';
		echo "<h2 style='font-weight:bold;font-size:1.1em;'>".__("Contenu à afficher à l'ouverture du cadenas :", "lockee")."</h2>";
		wp_editor( $lockee_content , 'lockee_content', $settings = array('textarea_name' => 'lockee_content') );
		echo "<h2 style='font-weight:bold;font-size:1.1em;'>".__("Shortcode pour inclure ce cadenas ailleurs :", "lockee")."</h2>";
		echo "<pre>[lockee id=$post->ID]</pre>";
		wp_nonce_field(plugin_basename( __FILE__ ), 'lockee_metabox_nonce' );
	}
}

if(!function_exists('lockee_initialisation_metabox')) {
	function lockee_initialisation_metabox(){
		add_meta_box('lockee', 'Cadenas Lockee', 'lockee_display_metabox', array('post', 'page'), 'normal', 'high');
	}
}

if(!function_exists('lockee_display_content')) {
	function lockee_display_content($content) {
		global $post;
		$id = $post->ID;
		$lockee_type = get_post_meta($id, 'lockee_type', true);
		$lockee_code = get_post_meta($id, 'lockee_code', true);
		if((!empty($lockee_type))&&(!empty($lockee_code))){
			$contentLock = '<div class="lockee" id="lock-'.$id.'"><div id="isclose">
			<div style="position:relative;width:320px;margin:auto;">
				<div id="wrongcode"><div class="alert">'.__("Code incorrect", "lockee").'</div></div>
				<input type="hidden" id="inputid" name="inputid" value="'.$id.'" />
				<input type="hidden" id="inputcode" name="inputcode" value="" />
				<div id="wrapper-code"></div>
			</div>
			<script type="text/javascript">
				lock'.$id.' = new Lock("lock'.$id.'", "'.$id.'", "#wrapper-code", "#inputcode", "'.$lockee_type.'", 1);
			</script>
			</div>
			<div id="isopen"><div onclick="closeLock(\''.$id.'\', lock'.$id.');" style="position:absolute; top:4px; right:0; cursor:pointer;"><img src="'.plugin_dir_url( __FILE__ ).'imgs/close-light.png" id="close-light" alt="'.__("Refermer le cadenas", "lockee").'" title="'.__("Refermer le cadenas", "lockee").'" /><img src="'.plugin_dir_url( __FILE__ ).'imgs/close-dark.png" id="close-dark" alt="'.__("Refermer le cadenas", "lockee").'" title="'.__("Refermer le cadenas", "lockee").'" /></div>
			<div class="title">'.__("Cadenas ouvert !", "lockee").'</div>
			<div id="contentlock"></div>
			</div></div>';
			return $content.$contentLock;
		} else {
			return $content;
		}
	}
}

if(!function_exists('lockee_save_metabox')) {
	function lockee_save_metabox($post_id){
		if(!wp_verify_nonce($_POST['lockee_metabox_nonce'], plugin_basename(__FILE__))){
			return $post_id;
		}
		if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) 
			return $post_id;
		
		if ('page' == $_POST['post_type'] ||  'post' == $_POST['post_type']){
			if ( !current_user_can( 'edit_page', $post_id ) || !current_user_can( 'edit_post', $post_id ))
				return $post_id;
		}
		
		$lockee_content = $_POST['lockee_content'];
		update_post_meta($post_id, 'lockee_content', $lockee_content);
		
		if ((!empty($_POST['inputtype'])) && (!empty($_POST['inputcode']))) {
			$code = htmlspecialchars($_POST['inputcode']);
			$type = htmlspecialchars($_POST['inputtype']);
			update_post_meta($post_id, 'lockee_type', $type);
			update_post_meta($post_id, 'lockee_code', $code);
			if(!empty($_POST['ignore'])){
				$options = implode("", $_POST['ignore']);
			} else {
				$options = "";
			}
			update_post_meta($post_id, 'lockee_options', $options);
		} else {
			delete_post_meta($post_id, 'lockee_type');
			delete_post_meta($post_id, 'lockee_code');
			delete_post_meta($post_id, 'lockee_options');
		}
	}
}

if(!function_exists('lockee_ignoreTypes')) {
	function lockee_ignoreTypes($txt, $types){
		if(strpos($types, "A") !== false){
			$txt = htmlentities($txt, ENT_NOQUOTES, 'utf-8');
			$txt = preg_replace('#&([A-za-z])(?:acute|cedil|caron|circ|grave|orn|ring|slash|th|tilde|uml);#', '\1', $txt);
			$txt = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $txt);
			$txt = html_entity_decode($txt); 
		}
		if(strpos($types, "P") !== false){
			$txt = preg_replace('/\p{P}/', '', $txt);
			$exceptions = array("’","#\h#u"," ");
			$txt = str_replace($exceptions, '', $txt);
		}
		if(strpos($types, "C") !== false){
			$txt = mb_strtolower($txt, 'UTF-8');
		}
		return $txt;
	}
}

// [lockee id="id-post-or-page"]
function lockee_shortcode($atts){
	extract(shortcode_atts(
		array(
			'id' => -1
	), $atts));

	if($id > -1){
		$lockee_type = get_post_meta($id, 'lockee_type', true);
		$lockee_code = get_post_meta($id, 'lockee_code', true);
		if((!empty($lockee_type))&&(!empty($lockee_code))){
			$contentLock = '<div class="lockee" id="lock-'.$id.'"><div id="isclose">
			<div style="position:relative;width:320px;margin:auto;">
				<div id="wrongcode"><div class="alert">'.__("Code incorrect", "lockee").'</div></div>
				<input type="hidden" id="inputid" name="inputid" value="'.$id.'" />
				<input type="hidden" id="inputcode" name="inputcode" value="" />
				<div id="wrapper-code"></div>
			</div>
			<script type="text/javascript">
				lock'.$id.' = new Lock("lock'.$id.'", "'.$id.'", "#wrapper-code", "#inputcode", "'.$lockee_type.'", 1);
			</script>
			</div>
			<div id="isopen"><div onclick="closeLock(\''.$id.'\', lock'.$id.');" style="position:absolute; top:4px; right:0; cursor:pointer;"><img src="'.plugin_dir_url( __FILE__ ).'imgs/close-light.png" id="close-light" alt="'.__("Refermer le cadenas", "lockee").'" title="'.__("Refermer le cadenas", "lockee").'" /><img src="'.plugin_dir_url( __FILE__ ).'imgs/close-dark.png" id="close-dark" alt="'.__("Refermer le cadenas", "lockee").'" title="'.__("Refermer le cadenas", "lockee").'" /></div>
			<div class="title">'.__("Cadenas ouvert !", "lockee").'</div>
			<div id="contentlock"></div>
			</div></div>';
		} else {
			$contentLock = '<p>'.__("Cadenas non trouvé. Veuillez vérifier le shortcode utilisé.").'</p>';
		}
	}
	return $contentLock;
}
add_shortcode('lockee', 'lockee_shortcode');

add_action('wp_enqueue_scripts', 'lockee_includes', 15);
add_action('admin_enqueue_scripts', 'lockee_admin_includes', 15);
add_action("wp_fast_ajax_verifcode", "lockee_verifcode");
add_action("wp_fast_ajax_nopriv_verifcode", "lockee_verifcode");
add_action('add_meta_boxes', 'lockee_initialisation_metabox');
add_action('save_post', 'lockee_save_metabox');
add_filter('the_content', 'lockee_display_content', 99);
?>