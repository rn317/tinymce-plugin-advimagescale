/**
 * TinyMCE Advanced Image Resize Helper Plugin
 *
 * Forces images to maintain aspect ratio while scaling - also optionally enforces
 * min/max image dimensions, and appends width/height to the image URL for server-side
 * resizing
 *
 * @author     Marc Hodgins
 * @link       http://www.hodginsmedia.com Hodgins Media Ventures Inc.
 * @copyright  Copyright (C) 2008 Hodgins Media Ventures Inc., All right reserved.
 * @license    http://www.opensource.org/licenses/lgpl-3.0.html LGPLv3
 */
(function() {

	/**
	 * Stores pre-resize image dimensions
	 * @var {array} (w,h)
	 */
	var originalDimensions = new Array();
	
	/**
	 * Stores last dimensions before a resize
	 * @var {array} (w,h)
	 */
	var lastDimensions = new Array();

	/**
	 * Current node
	 * @var {object}
	 */
	var currentNode;

	tinymce.create('tinymce.plugins.AdvImageScale', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			// Watch for mouseup (could be an image resize)
			ed.onMouseUp.add(function(ed, e) {
				currentNode = tinyMCE.activeEditor.selection.getNode();
				if (currentNode.nodeName == 'IMG') {
					//setTimeout is necessary to allow the browser to complete the resize so we have new dimensions
					setTimeout(function() {
						constrainSize(currentNode);
					}, 100);
				}
			});

			// Assign all img tags a unique mce_advimageresize_id
			// This tag is auto-removed by tinyMCE's invalid_elements list
			ed.onPreProcess.add(function(ed, o) {
				tinymce.each(ed.dom.select('img', o.node), function(currentNode) {
					if (!ed.dom.getAttrib(currentNode, 'mce_advimageresize_id')) {
						// assign unique ID
						ed.dom.setAttrib(currentNode, 'mce_advimageresize_id', ed.dom.uniqueId());
					} 
				});
			});

			// Append image dimensions? (optional)
			if (ed.getParam('advimagescale_append_to_url')) {
				// Create callback to try to append image dimensions to all URLs on serializer runs
				ed.onPreProcess.add(function(ed, o) {
					tinymce.each(ed.dom.select('img', o.node), function(currentNode) {
						constrainSize(currentNode);
					});
				});
			}

		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname  : 'Advanced Image Resize Helper',
				author    : 'Marc Hodgins',
				authorurl : 'http://www.hodginsmedia.com',
				infourl   : 'http://code.google.com/p/tinymce-plugin-advimagescale',
				version   : '1.0'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('advimagescale', tinymce.plugins.AdvImageScale);

	/**
	 * Store image dimensions, pre-resize
	 *
	 * @param {object} el HTMLDomNode
	 */
	function storeDimensions(el)
	{
		var ed = tinyMCE.activeEditor;
		var dom = ed.dom;
		var elId = dom.getAttrib(el, 'mce_advimageresize_id');

		// store original dimensions if this is the first resize of this element
		if (!originalDimensions[elId]) {
			originalDimensions[elId] = lastDimensions[elId] = {width: dom.getAttrib(el, 'width'), height: dom.getAttrib(el, 'height')};
		}
		return true;
	}

	/**
	 * Adjusts width and height to keep within min/max bounds and also maintain aspect ratio
	 */
	function constrainSize(el)
	{
	        var ed  = tinyMCE.activeEditor;
		var dom = ed.dom;
		var elId = dom.getAttrib(el, 'mce_advimageresize_id');

		storeDimensions(el);

		// allow filtering by regexp so only some images get constrained
		var src_filter = ed.getParam('advimagescale_filter_src');
		if (src_filter) {
			var r = new RegExp(src_filter);
			if (!el.src.match(r))
				return; // skip this element
		}
		// allow filtering by classname
		var class_filter = ed.getParam('advimagescale_filter_class');
		if (class_filter) {
			if(!dom.hasClass(el, class_filter))
				return; // skip this element, doesn't have the class we want
		}

		// get (optional) max W/H and min W/H settings
		var maxW = ed.getParam('advimagescale_max_width');
		var maxH = ed.getParam('advimagescale_max_height');
		var minW = ed.getParam('advimagescale_min_width');
		var minH = ed.getParam('advimagescale_min_height');

		// adjust w/h to maintain aspect ratio and stay within maxW/H and minW/H
	        var newDimensions = maintainAspect(dom.getAttrib(el, 'width'), dom.getAttrib(el, 'height'), el, maxW, maxH, minW, minH);

		var adjusted      = (dom.getAttrib(el, 'width') != newDimensions.width || dom.getAttrib(el, 'height') != newDimensions.height);
		dom.setAttrib(el, 'width',  newDimensions.width);
		dom.setAttrib(el, 'height', newDimensions.height);

		if (ed.getParam('advimagescale_append_to_url')) {
			appendToUri(el, newDimensions.width, newDimensions.height);
		        //dom.setAttrib(el, 'src', newUrl);
		}

		// fix Gecko glitches with drag handles after resize
		if (adjusted && tinymce.isGecko) {
			ed.execCommand('mceRepaint', false);
		}

		// remember "last dimensions" for next time ..
	        lastDimensions[elId] = { width: dom.getAttrib(el, 'width'), height: dom.getAttrib(el, 'height') };
	}

	/**
	 * Set image dimensions on into a uri as querystring params
	 */
	function appendToUri(el, w, h) {
		var ed     = tinyMCE.activeEditor;
		var dom    = ed.dom;
		var uri    = dom.getAttrib(el, 'src');

		// filter by img src
		var src_filter = ed.getParam('advimagescale_filter_src');
		if (src_filter) {
			var r = new RegExp(src_filter);
			if (!uri.match(r))
				return; // skip
		}
		// filter by img classname
		var class_filter = ed.getParam('advimagescale_filter_class');
		if (class_filter) {
			var r = new RegExp(class_filter);
			if (!dom.hasClass(el, class_filter))
				return;
		}
			
		var wKey = ed.getParam('advimagescale_url_width_key', 'w');
		uri = setQueryParam(uri, wKey, w);
		var hKey = ed.getParam('advimagescale_url_height_key', 'h');
		uri = setQueryParam(uri, hKey, h);

		dom.setAttrib(el, 'src', uri);
	}

	/**
 	 * Sets URL querystring parameters by appending or replacing existing params of same name
	 */
	function setQueryParam(uri, key, value) {
		if (!uri.match(/\?/)) uri += '?';
		if (!uri.match(new RegExp('([\?&])' + key + '='))) {
			if (!uri.match(/[&\?]$/)) uri += '&';
			uri += key + '=' + escape(value);
		} else
		        uri = uri.replace(new RegExp('([\?\&])' + key + '=[^&]*'), '$1' + key + '=' + escape(value));
		return uri;
	}

	/**
	 * Returns w/h that maintain aspect ratio
	 */
	function maintainAspect(w, h, el, maxW, maxH, minW, minH)
	{
		var ed    = tinyMCE.activeEditor;
		var dom   = ed.dom;
		var elId  = dom.getAttrib(el, 'mce_advimageresize_id');

		// calculate aspect ratio of original so we can maintain it
	        var oW = originalDimensions[elId].width;
	        var oH = originalDimensions[elId].height;
	        var ratio = oW/oH;
	
		// decide which dimension changed more (percentage),  because that's the
	        // one we'll respect (the other we'll adjust to keep aspect ratio)
		var lastW  = lastDimensions[elId].width;
		var lastH  = lastDimensions[elId].height;
		var deltaW = Math.abs(lastW - w); // absolute
		var deltaH = Math.abs(lastH - h); // absolute
		var pctW   = Math.abs(deltaW / lastW); // percentage
		var pctH   = Math.abs(deltaH / lastH); // percentage

		var ret = {};
		if (deltaW || deltaH) {
			if (pctW > pctH) {
				// width changed more - use that as the locked point and adjust height
				ret = {width:w, height: Math.round(w/ratio)};
			} else {
				// height changed more - use that as the locked point and adjust width
				ret = {width: Math.round(h*ratio), height:h};
			}
		} else {
		    ret = {width:w, height:h}; // nothing changed
		}

		// note, min/max behavior is undefined if the minW/H and maxW/H are set such that there is no possible numbers that fit (i.e. really wide, short images)
		// enforce maxW/maxH
		if(maxW && ret.width > maxW) {
			ret = { width: maxW, height: Math.round(maxW/ratio) };
		}
		if(maxH && ret.height > maxH) {
			ret = { width: Math.round(maxH/ratio), height: maxH };
		}

		// enforce minW/minH
		if(minW && ret.width < minW) {
			ret = { width : minW, height: Math.round(minW/ratio) };
		}
		if(minH && ret.height < minH) {
			ret = { height: Math.round(minH/ratio), width: minH };
		}

		return ret;
	}
})();