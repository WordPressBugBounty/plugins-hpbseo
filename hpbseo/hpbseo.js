const id_prefix   = "#hpbseo_";
const cls_prefix  = "hpbseo_";
const name_prefix = "hpbseo_";
const cls_defaulttext = "hpbseo_defaulttext";
const ajax_php_file   = "postajax.php";
const lint_file       = "hpbseo.txt";
const graph_row_max   = 10;	//グラフ表示件数
const main_theme_max  = 3;	//メインテーマ表示単語数
const uninputted_msg_body     = "記事本文を入力してください。";
const titlebox_under_msg      = "※メインテーマのワードを含めた文章にしてください。<br />※重要なキーワードは、前方に配置してください。<br />※魅力的な文章は、検索結果でクリック率が高まります。";
const lint_mid_msg            = "最適化されています。";

/*--------------------------------------------------------------------
 * 文字数カウント
--------------------------------------------------------------------*/
function fncStrCount(str){

	//タグ・改行除去
	var remove_tag = fncRemoveTag(str);

	//アンエスケープ
	//remove_tag = jQuery('<div>').html(remove_tag).text();
	const container = document.createElement('div');
	container.innerHTML = remove_tag;
	remove_tag = container.innerText;
	//console.log(remove_tag);

	return remove_tag.length;
}


/*--------------------------------------------------------------------
 * タグ・改行
--------------------------------------------------------------------*/
function fncRemoveTag(str){
	if (str == null) return '';

	//タグ・改行除去
	var remove_tag = str.trim();
	remove_tag = remove_tag.replace(/<!--[\s\S]*?-->/g, ''); // コメントを削除
	remove_tag = remove_tag.replace(/<\/?[^>]+>/g, ''); // HTMLタグを削除
	//remove_tag = remove_tag.replace(/\r\n/gi, "");
	//remove_tag = remove_tag.replace(/\r/gi, "");
	//remove_tag = remove_tag.replace(/\n/gi, "");
	//remove_tag = remove_tag.replace(/ /gi, "");
	remove_tag = remove_tag.replace(/\s+/g, ""); // すべての空白文字を削除

	return remove_tag;
}


/*--------------------------------------------------------------------
 * 記事本文取得（エディター判別/記事本文を返す）
--------------------------------------------------------------------*/
function fncGetBodyStr(str) {

	// ブロックエディタが使われているか（DOMで判定）
	var isBlockEditor = document.querySelector('.block-editor') !== null || document.querySelector('.edit-post-visual-editor') !== null;

	if (
		isBlockEditor &&
		typeof wp !== 'undefined' &&
		wp.data &&
		wp.data.select &&
		wp.data.select('core/editor') &&
		typeof wp.data.select('core/editor').getEditedPostContent === 'function'
	) {
		var blockContent = wp.data.select('core/editor').getEditedPostContent();
		if (blockContent) {
			document.getElementById(cls_prefix + "content_tune_wrap").classList.remove("fail");
			return blockContent;
		} else {
			document.getElementById(cls_prefix + "content_tune_wrap").classList.add("fail");
			return '';
		}
	}

	// クラシックエディタの処理
	if (typeof window.tinymce !== 'undefined') {
		var editor = window.tinymce.get('content');
		if (editor) {
			if (!editor.isHidden()) {
				return editor.getContent();
			}
			var el = document.getElementById('content');
			if (el) {
				return el.value;
			}
		}
	}

	return str || '';
}

/*--------------------------------------------------------------------
 * 閾値比較（記事本文の文字数）
--------------------------------------------------------------------*/
function fncBodyCount(e){
	var str      = e.data.str.val();
	var disp_len = e.data.disp_len;
	var disp     = e.data.disp;
	var lint     = e.data.lint;

	//本文取得（エディターチェック）
	str = fncGetBodyStr(str);

	//文字数取得
	var len = fncStrCount(str);

	//文字数表示
	disp_len.text(len);
	//空値の場合
	if(len==0){
		disp.text(uninputted_msg_body);
		disp.addClass(cls_prefix + "arrow_box_top");
		return;
	}
	//アラート文取得/表示
	fncLintCheck(lint,len,disp, cls_prefix + "arrow_box_top");

}

/*--------------------------------------------------------------------
 * 閾値比較（メタディスクリプション）
--------------------------------------------------------------------*/
function fncMetaDesCount(e){
	//引数取得
	var str     = e.data.str.val();
	var disp    = e.data.disp;
	var lint    = e.data.lint;
	var g_str   = e.data.g_str.val();
	var g_flg   = e.data.g_flg;
	var prev    = e.data.prev;
	var len     = 0;
	var disp_image = e.data.disp_image;

	//改行削除
	str = str.replace(/\r\n/gi, "");
	str = str.replace(/\r/gi, "");
	str = str.replace(/\n/gi, "");

	//一括設定の値を使う→文字数に追加
	if(g_flg.prop('checked') && !g_flg.prop('disabled')){
		len += g_str.length;
	}else{
		g_str = '';
	}

	//文字数取得（入力表示回避）
	if(str!=""){
		len += str.length;
	}else{
		str = '';
	}

	//空値の場合
	if(len==0){
		disp.text("");
		disp.removeClass(cls_prefix + "arrow_box_left");
		prev.text("");
		return;
	}
	//アラート文取得/表示
	fncLintCheck(lint,len,disp,cls_prefix + "arrow_box_left");
	//プレビュー表示
	prev.text( str + g_str );

	// 表示イメージ
	disp_image.text( str + g_str );
}

/*--------------------------------------------------------------------
 * 閾値比較（メタキーワード単語数）
--------------------------------------------------------------------*/
function fncMetaKeyCount(e){
	//引数取得
	var str     = e.data.str.val();
	var disp    = e.data.disp;
	var lint    = e.data.lint;
	var g_str   = e.data.g_str.val();
	var g_flg   = e.data.g_flg;
	var prev    = e.data.prev;
	var len     = 0;

	var arr      = new Array();
	var join_str = "";

	//文字数取得（入力表示回避）
	if(str!=""){
		arr.push(str);
	}

	//一括設定の値を使う
	if(g_flg.prop('checked') && !g_flg.prop('disabled') && g_str!=""){
		arr.push(g_str);
	}

	//カンマ区切りで結合
	join_str = arr.join(',');

	//空値の場合
	if(join_str==""){
		disp.text("");
		disp.removeClass(cls_prefix + "arrow_box_left");
		prev.text("");
		return;
	}
	//単語数取得
	var arrMetaKey = join_str.split(",");
	var len        = arrMetaKey.length;
	if(len == 1 && arrMetaKey[0] == ""){
		len = 0;
	}

	//アラート文取得/表示
	fncLintCheck(lint,len,disp,cls_prefix + "arrow_box_left");

	//プレビュー表示
	prev.text( join_str );

}



/*--------------------------------------------------------------------
 * 閾値
--------------------------------------------------------------------*/
function fncLintCheck(lint,val,disp,cls){
	var msg     = "";
	var arrLint = lint["params"].split(',');
	var check_img_url = plugin_img_url + "check.png";
	var icon    = "";
//	var ok_flg  = false;

	//アラート文作成
	if( val < arrLint[0] ){
		msg = lint["alertLow"];
	}else if( arrLint[0] <= val && val < arrLint[1] ){
		msg = lint["alertMidLow"];
	}else if( arrLint[1] <= val && val <= arrLint[2] ){
//		ok_flg = true;
		msg = lint["alertMid"];
		//空の場合はメッセージ補完
		if(msg==""){
			msg  = lint_mid_msg;
			icon = '<img src="' + check_img_url + '" class="' + cls_prefix + 'lint_img">';
		}
	}else if( arrLint[2] <  val && val <= arrLint[3] ){
		msg = lint["alertMidHigh"];
	}else if( arrLint[3] <  val ){
		msg = lint["alertHigh"];
	}

	//空値の場合
	if(msg==""){
		disp.text("");
		disp.removeClass(cls);
		disp.removeClass(cls + "_ok");
		return;
	}

	//「%value%」を置き換える
	msg = msg.replace("%value%",val);
	//表示
	disp.empty()
	disp.append(icon + msg);
//	disp.text(msg);
	disp.addClass(cls);

//	if(ok_flg){
//		disp.addClass(cls + "_ok");
//	}else{
//		disp.removeClass(cls + "_ok");
//	}

	return;
}


/*--------------------------------------------------------------------
 * 一括設定呼び出しボタン押下
--------------------------------------------------------------------*/
function fncGlobalSet(e){
	var input = e.data.input;
	var str   = e.data.str.val();
	var fnc   = e.data.fnc;

	//入力値あるとき
	if(input.val()!=''){
		//確認ダイアログ表示
		var flg = window.confirm('入力されている文字列を上書きしますか？');
		// キャンセルの場合は終了
		if(!flg){
			return;
		}
	}

	//表示
	input.val(str);
	//入力中表示
	input.removeClass(cls_defaulttext);
	//フォーカス移動
	input.focus();

	//閾値チェック
	fnc(e);

}


/*--------------------------------------------------------------------
 * メインテーマ＆構成ワード
--------------------------------------------------------------------*/
function fncContentTune(e){
	var str          = e.data.str.val();
	var lint         = e.data.lint;
	var lint_content = e.data.lint_content.val();
	var disp_len     = e.data.disp_len;
	var disp         = e.data.disp;
	var disp_content_tune = e.data.disp_content_tune;
	var content_tune_wrap = e.data.content_tune_wrap;
	var loading           = e.data.loading;

	//本文取得（エディターチェック）
	str = fncGetBodyStr(str);
	//タグ削除
	var str_cnt = fncRemoveTag(str);
	//文字数取得
	var len = fncStrCount(str_cnt);

	//文字数表示
	disp_len.text(len);
	//空値の場合
	if(len==0){
		disp.text(uninputted_msg_body);
		disp.addClass(cls_prefix + "arrow_box_top");
	}else{
		//アラート文取得/表示
		fncLintCheck(lint,len,disp, cls_prefix + "arrow_box_top");
	}

	//文字数チェック
	if(str_cnt.length < lint_content){
		//グラフ表示（サンプルデータ）
		fncContentTune_Disp(e);
		loading.removeClass(cls_prefix + "display");
		loading.addClass(cls_prefix + "display_none");
		loading.height("auto");
		return;
	}

//	//タグ削除（※改行はそのまま）→php側で
//	var remove_tag = str.replace(/<\/?[^>]+>/gi, "");
	var remove_tag = str;

	//改行コード調整（※IE対応）
	remove_tag = remove_tag.replace(/\n/gi, "\r\n");

	//引数
	var data = {'src':remove_tag};
	//ajax用url
	var get_words_url =plugin_url + ajax_php_file;

	//loding画像表示
	var content_height = content_tune_wrap.height();
	var loading_height = loading.height();
	if(content_height < loading_height){
		content_tune_wrap.height(loading_height);
	}else{
		loading.height(content_height);
	}
	loading.removeClass(cls_prefix + "display_none");
	loading.addClass(cls_prefix + "display");

	//形態素解析
	jQuery.ajax({
		type: "POST",
		url: get_words_url,
		data: data,
		traditional: true,
		dataType: "json",
		//async: false,
		beforeSend : function( xhr ){
			xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
		},
		success: function(json){
			//グラフ表示
			fncContentTune_Disp(e,json);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			var err_str = "";
			err_str += "XMLHttpRequest : " + XMLHttpRequest.status;
			err_str += "textStatus : " + textStatus;
			err_str += "errorThrown : " + errorThrown.message;

			alert("構成ワードの取得に失敗しました。");
			disp_content_tune.removeClass(cls_prefix + "display");
			disp_content_tune.addClass(cls_prefix + "display_none");
		},
		complete: function(data){
			loading.removeClass(cls_prefix + "display");
			loading.addClass(cls_prefix + "display_none");
			loading.height("auto");
		}

	});

}


/*--------------------------------------------------------------------
 * メインテーマ＆構成ワード表示
--------------------------------------------------------------------*/
function fncContentTune_Disp(e,json){
	var str          = e.data.str.val();
	var lint         = e.data.lint;
	var lint_content = e.data.lint_content.val();
	var disp_len     = e.data.disp_len;
	var disp         = e.data.disp;

	var disp_main         = e.data.disp_main_theme;
	var disp_graph        = e.data.disp_graph;
	var disp_content_tune = e.data.disp_content_tune;
	var main_theme_alert  = e.data.main_theme_alert;
	var composition_alert = e.data.composition_alert;
	var content_tune_wrap = e.data.content_tune_wrap;

	var graph_img     = plugin_img_url + "graph.gif";		//グラフ画像
	var graph_img_off = plugin_img_url + "graph_off.gif";	//グラフ画像

	var main_theme_tag = "";
	var graph_tag      = "";
	var maxcnt         = 0;
	var keywords_total = 0;
	var graph_percent  = 0;
	var i;
	var sampleflg      = false;
	var keywords_list  = new Array();

	if(json === undefined){
		//jsonが渡されていない＝サンプル表示
		sampleflg = true;
		main_theme_msg  = lint_content + '文字以上の記事本文を入力して更新ボタンを押すと、ページのメインテーマが表示されます。';
		composition_msg = lint_content + '文字以上の記事本文を入力して更新ボタンを押すと、ページの構成ワードとグラフが表示されます。';
	}else if(json.result == 0){
		//名詞が0の場合
		sampleflg = true;
		main_theme_msg  = 'ワードが取得できませんでした。';
		composition_msg = 'ワードが取得できませんでした。';
	}

	if(sampleflg==true){
		//サンプルデータ作成
		keywords_list[0]={key:'ブログ'  ,val:10};
		keywords_list[1]={key:'seo'     ,val:8};
		keywords_list[2]={key:'効果'    ,val:6};
		keywords_list[3]={key:'デザイン',val:4};
		keywords_list[4]={key:'無料'    ,val:2};
		main_theme_tag = "ブログ seo 効果";
		maxcnt         = 10;
		keywords_total = 30;
		//表示
		graph_img = graph_img_off;
		disp_main.removeClass(cls_prefix + "display");
		disp_main.addClass(cls_prefix + "display_off");
		disp_graph.removeClass(cls_prefix + "display");
		disp_graph.addClass(cls_prefix + "display_off");

	}else{
		var tmp             = json.keywords;
		var keywords_total  = json.total;

		//ソート用の連想配列に格納
		for(i in tmp ){
		    keywords_list.push({key:i,val:tmp[i]});
		}
//		//降順に並べ替え
//		function largeVal(a,b){ return (a.val < b.val) ? 1 : -1 ; }
//		keywords_list.sort(largeVal);
		//キーワード数の最大値
		maxcnt = keywords_list[0].val;

		//表示
		main_theme_msg  = 'これらのワードの組み合わせで検索される文章構成になっています。';
		composition_msg = 'ユーザーが検索に使用すると思われるキーワードを効果的に織り交ぜてください。';
		disp_main.removeClass(cls_prefix + "display_off");
		disp_main.addClass(cls_prefix + "display");
		disp_graph.removeClass(cls_prefix + "display_off");
		disp_graph.addClass(cls_prefix + "display");
	}

	//グラフ出力
	var graph_tag = "";
	graph_tag += '<table id="' + cls_prefix + 'graph_tbl">';
	for(i=0;i<keywords_list.length;i++){
		//件数チェック
		if(i >= graph_row_max){
			break;
		}else if(i < main_theme_max){
			main_theme_tag +=  ' ' + keywords_list[i].key;
			main_theme_tag = main_theme_tag.replace(/^\s+/, "");
		}
		//グラフの幅
		graph_width = (keywords_list[i].val / maxcnt) * 100;
		//割合
		graph_percent = Math.round(( keywords_list[i].val / keywords_total) * 100);
		//タグ作成
		graph_tag += '<tr>';
		graph_tag += '<td class="no" nowrap>' + (i+1) + '. </td>';
		graph_tag += '<td class="keywords">' + keywords_list[i].key + '</td>';
		graph_tag += '<td class="value" nowrap>' + keywords_list[i].val     + '</td>';
		graph_tag += '<td><img src="' + graph_img + '" style="height:12px;max-height:12px;width:' + graph_width + '%;" /></td>';
		graph_tag += '<td class="percent" nowrap>' + graph_percent     + '%</td>';
		graph_tag += '</tr>';
	}
	graph_tag += '</table>';

	content_tune_wrap.height("auto");

	disp_main.empty();
	disp_main.append(main_theme_tag);
	disp_graph.empty();
	disp_graph.append(graph_tag);

	main_theme_alert.empty();
	main_theme_alert.append(main_theme_msg);
	composition_alert.empty();
	composition_alert.append(composition_msg);

	disp_content_tune.removeClass(cls_prefix + "display_none");
	disp_content_tune.addClass(cls_prefix + "display");

	return;
}

/*====================================================================
 * 呼び出し
====================================================================*/
(function($) {
jQuery(window).on("load",function(){

	//画面チェック
	var custom_post_type_list = $(id_prefix + 'custom_post_type_list').val();
	var post_type_list = custom_post_type_list + ',post';
	var this_post_type =  $('#post_type').val();

	if(this_post_type!=null && post_type_list.indexOf(this_post_type)>=0){

		//プラグインフォルダまでのurl
		plugin_url = $(id_prefix + 'plugin_url').val();
		//プラグイン-画像フォルダまでのurl
		plugin_img_url = plugin_url + 'image/';
		//閾値ファイルurl
		var ajaxurl = plugin_url + lint_file;

		//閾値取得
		jQuery.ajax({
			type: "POST",
			url: ajaxurl,
			dataType: "json",
			//async: false,
			cache : true,
			beforeSend : function( xhr ){
				xhr.setRequestHeader("If-Modified-Since", "Thu, 01 Jun 1970 00:00:00 GMT");
			},
			success: function(json){

				// エディタチェック
				if (document.body.classList.contains('block-editor-page')) {
					// ブロックエディタ
				} else {
					// クラシックエディタ
					if (document.getElementById('titlewrap')) {
						titlebox_after_html = '<div class="' + cls_prefix + 'arrow_box_top ' + cls_prefix + 'title_alert_clasic">' + titlebox_under_msg + '</div>';
						document.getElementById('titlewrap').insertAdjacentHTML('afterend', titlebox_after_html);
					}
				}

				//閾値取得
				var scoreTotalSourceNum 		= json["result_data"]["column"]["scoreTotalSourceNum"];
				var scoreMetaDescriptionLength	= json["result_data"]["column"]["scoreMetaDescriptionLength"];
				var scoreMetaVolume				= json["result_data"]["column"]["scoreMetaVolume"];

				//投稿記事文字数カウント
				var strcnt_obj  = {};
				strcnt_obj.data = {};
				strcnt_obj.data.str      = $('#content');
				strcnt_obj.data.disp_len = $(id_prefix + 'content_length');
				strcnt_obj.data.disp     = $(id_prefix + 'title_alert');
				strcnt_obj.data.lint     = scoreTotalSourceNum;
				//初回
//				fncBodyCount(strcnt_obj);

				//メタディスクリプション文字数カウント
				var metades_cnt_obj  = {};
				metades_cnt_obj.data = {};
				metades_cnt_obj.data.str   = $(id_prefix + 'meta_des');
				metades_cnt_obj.data.disp  = $(id_prefix + 'meta_des_alert');
				metades_cnt_obj.data.lint  = scoreMetaDescriptionLength;
				metades_cnt_obj.data.g_str = $(id_prefix + 'global_meta_des');
				metades_cnt_obj.data.g_flg = $(id_prefix + 'meta_des_add_flg');
				metades_cnt_obj.data.prev  = $(id_prefix + 'meta_des_preview');
				metades_cnt_obj.data.disp_image = $(id_prefix +'disp_image .hpbseo_meta_des');

				//初回
				fncMetaDesCount(metades_cnt_obj);
				//入力時
				$(id_prefix + "meta_des").on("click blur keydown keyup keypress change", metades_cnt_obj.data, fncMetaDesCount);
				//チェックボックスクリック時
				$(id_prefix + 'meta_des_add_flg').on("click",metades_cnt_obj.data,fncMetaDesCount);

				//メタキーワード単語数カウント
				var metakey_cnt_obj  = {};
				metakey_cnt_obj.data = {};
				metakey_cnt_obj.data.str  = $(id_prefix + 'meta_key');
				metakey_cnt_obj.data.disp = $(id_prefix + 'meta_key_alert');
				metakey_cnt_obj.data.lint = scoreMetaVolume;
				metakey_cnt_obj.data.g_str = $(id_prefix + 'global_meta_key');
				metakey_cnt_obj.data.g_flg = $(id_prefix + 'meta_key_add_flg');
				metakey_cnt_obj.data.prev  = $(id_prefix + 'meta_key_preview');
				//初回
				fncMetaKeyCount(metakey_cnt_obj);
				//入力時
				$(id_prefix + "meta_key").on("click blur keydown keyup keypress change", metakey_cnt_obj.data, fncMetaKeyCount);
				//チェックボックスクリック時
				$(id_prefix + 'meta_key_add_flg').on("click",metakey_cnt_obj.data,fncMetaKeyCount);

				//一括設定値呼び出し（メタディスクリプション）
				var global_meta_des_obj  = {};
				global_meta_des_obj.data = {};
				global_meta_des_obj.data.input = $(id_prefix + 'meta_des');
				global_meta_des_obj.data.str   = $(id_prefix + 'global_meta_des');
				global_meta_des_obj.data.fnc   = fncMetaDesCount;
				global_meta_des_obj.data.disp  = $(id_prefix + 'meta_des_alert');
				global_meta_des_obj.data.lint  = scoreMetaDescriptionLength;
				global_meta_des_obj.data.g_str = $(id_prefix + 'global_meta_des');
				global_meta_des_obj.data.g_flg = $(id_prefix + 'meta_des_add_flg');
				global_meta_des_obj.data.prev  = $(id_prefix + 'meta_des_preview');
				global_meta_des_obj.data.disp_image = $(id_prefix +'disp_image .hpbseo_meta_des');

				//ボタン押下時
				$(id_prefix + 'global_set_meta_des').on("click",global_meta_des_obj.data,fncGlobalSet);

				//一括設定値呼び出し（メタキーワード）
				var global_meta_key_obj  = {};
				global_meta_key_obj.data = {};
				global_meta_key_obj.data.input = $(id_prefix + 'meta_key');
				global_meta_key_obj.data.str   = $(id_prefix + 'global_meta_key');
				global_meta_key_obj.data.fnc   = fncMetaKeyCount;
				global_meta_key_obj.data.disp  = $(id_prefix + 'meta_key_alert');
				global_meta_key_obj.data.lint  = scoreMetaVolume;
				global_meta_key_obj.data.g_str = $(id_prefix + 'global_meta_key');
				global_meta_key_obj.data.g_flg = $(id_prefix + 'meta_key_add_flg');
				global_meta_key_obj.data.prev  = $(id_prefix + 'meta_key_preview');
				//ボタン押下時
				$(id_prefix + 'global_set_meta_key').on("click",global_meta_key_obj.data,fncGlobalSet);

				//メインテーマ・構成ワード
				var content_tune_obj   = {};
				content_tune_obj.data  = {};
				content_tune_obj.data.str          = $('#content');
				content_tune_obj.data.disp_len     = $(id_prefix + 'content_length');
				content_tune_obj.data.disp         = $(id_prefix + 'title_alert');
				content_tune_obj.data.lint         = scoreTotalSourceNum;
				content_tune_obj.data.lint_content = $(id_prefix + 'lint_content_tune');
				content_tune_obj.data.disp_main_theme   = $(id_prefix + 'main_theme_word');
				content_tune_obj.data.disp_graph        = $(id_prefix + 'composition_word_graph');
				content_tune_obj.data.disp_content_tune = $(id_prefix + 'content_tune_div');
				content_tune_obj.data.main_theme_alert  = $(id_prefix + 'main_theme_alert');
				content_tune_obj.data.composition_alert = $(id_prefix + 'composition_word_alert');
				content_tune_obj.data.content_tune_wrap = $(id_prefix + 'content_tune_wrap');
				content_tune_obj.data.loading           = $(id_prefix + 'content_tune_loading');

				//更新ボタンクリック
				$(id_prefix + 'content_tune').on("click",content_tune_obj.data,fncContentTune);
				//初回実行
				fncContentTune(content_tune_obj);


				/*
				// タイトル変更検出
				//Classic Editor / 初期Gutenberg
				$('input#title, .editor-post-title__input').on('input', function () {
					const title = $(this).val();
					$(id_prefix + 'disp_image .hpbseo_title span').text(title);
				});
				*/

				// Gutenberg の wp.data が使える場合（5.4以降推奨）
				if (typeof wp !== 'undefined' &&
					wp.data &&
					wp.data.select &&
					wp.data.subscribe &&
					wp.data.select('core/editor') &&
					typeof wp.data.select('core/editor').getEditedPostAttribute === 'function'
				) {
					let currentTitle = wp.data.select('core/editor').getEditedPostAttribute('title');

					wp.data.subscribe(function () {
						const newTitle = wp.data.select('core/editor').getEditedPostAttribute('title');
						if (newTitle !== currentTitle) {
							currentTitle = newTitle;
							$(id_prefix + 'disp_image .hpbseo_title span').text(newTitle);
						}
					});
				}

			},
			error: function(){
				alert("閾値の取得ができませんでした。\n\n.htaccessでLimit POSTを指定していないかなど、\nご利用のサーバーの設定をご確認ください。");
				//各ボタン押下不可にする
				$(id_prefix + 'content_tune').attr("disabled", "disabled");
				$(id_prefix + 'global_set_meta_des').attr("disabled", "disabled");
				$(id_prefix + 'global_set_meta_key').attr("disabled", "disabled");
			}
		});

	}

});
})(jQuery);
