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
	
	tinymce.create('tinymce.plugins.AdvImageScale', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
					
			// Watch for mousedown (to set a unique ID on the element and store original dimensions)
			ed.onMouseDown.add(function(ed, e) {
				var el = tinyMCE.activeEditor.selection.getNode();
				if (el.nodeName == 'IMG') {
					// prepare image for resizing
					prepareImage(ed, e.target);
				}
				return true;
			});
			
			// Watch for mouseup (catch image resizes)
			ed.onMouseUp.add(function(ed, e) {			
				var el = tinyMCE.activeEditor.selection.getNode();	
				if (el.nodeName == 'IMG') {
					// setTimeout is necessary to allow the browser to complete the resize so we have new dimensions
					setTimeout(function() {
						constrainSize(ed, el);
					}, 100);
				}
				return true;
			});

			// If any of these settings are active, then we need to preProcess the image nodes on startup
			if (ed.getParam('advimagescale_append_to_url')
				|| ed.getParam('advimagescale_max_height')
				|| ed.getParam('advimagescale_max_width')
				|| ed.getParam('advimagescale_min_height')
				|| ed.getParam('advimagescale_min_width')
			    ) {
				// Run constrainSize immediately on all image nodes to append image dimensions to URL, enforce dimension restrictions, etc...
				ed.onPreProcess.add(function(ed, o) {
					tinymce.each(ed.dom.select('img', o.node), function(currentNode) {
						prepareImage(ed, currentNode);
						constrainSize(ed, currentNode);
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
				version   : '1.1.0'
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
	function storeDimensions(ed, el)
	{
		var dom = ed.dom;
		var elId = dom.getAttrib(el, 'mce_advimageresize_id');

		// store original dimensions if this is the first resize of this element
		if (!originalDimensions[elId]) {
			originalDimensions[elId] = lastDimensions[elId] = {width: dom.getAttrib(el, 'width'), height: dom.getAttrib(el, 'height')};
		}
		return true;
	}

	/**
	 * Prepare image for resizing
	 * Check to see if we've seen this IMG tag before; does tasks such as adding
	 * unique IDs to image tags, saving "original" image dimensions, etc.
	 * @param {object} e is optional
	 */
	function prepareImage(ed, el)
	{
		var dom = ed.dom;
		var elId= dom.getAttrib(el, 'mce_advimageresize_id');

		// is this the first time this image tag has been seen?
		if (!elId) {
			var uniqueId = ed.dom.uniqueId();
			dom.setAttrib(el, 'mce_advimageresize_id', uniqueId);
			storeDimensions(ed, el);
		}
	}

	/**
	 * Adjusts width and height to keep within min/max bounds and also maintain aspect ratio
	 * If mce_noresize attribute is set to image tag, then image resize is disallowed
	 */
	function constrainSize(ed, el, e)
	{
		var dom = ed.dom;
		var elId = dom.getAttrib(el, 'mce_advimageresize_id');

		// node must have a unique mce_advimageresize_id before we do anything with it
		if (!elId) {
			prepareImage(ed, el);
			elId = dom.getAttrib(el, 'mce_advimageresize_id');
		}

		// fix Gecko "expands image by border width" bug before doing anything else
		if (tinymce.isGecko) {
			fixGeckoImageBorderGlitch(ed, el);
		}

		// disallow image resize if mce_noresize or the noresize class is set on the image tag
		if (dom.getAttrib(el, 'mce_noresize') || dom.hasClass(el, ed.getParam('advimagescale_noresize_class') || 'noresize')) {
			dom.setAttrib(el, 'width', lastDimensions[elId].width);
			dom.setAttrib(el, 'height', lastDimensions[elId].height);
			if (tinymce.isGecko) {
				fixGeckoHandles(ed);
			}
			return;
		}

		storeDimensions(ed, el);

		// allow filtering by regexp so only some images get constrained
		var src_filter = ed.getParam('advimagescale_filter_src');
		if (src_filter) {
			var r = new RegExp(src_filter);
			if (!el.src.match(r)) {
				return; // skip this element
			}
		}
		// allow filtering by classname
		var class_filter = ed.getParam('advimagescale_filter_class');
		if (class_filter) {
			if (!dom.hasClass(el, class_filter)) {
				return; // skip this element, doesn't have the class we want
			}
		}

		// get (optional) max W/H and min W/H settings
		var maxW = ed.getParam('advimagescale_max_width');
		var maxH = ed.getParam('advimagescale_max_height');
		var minW = ed.getParam('advimagescale_min_width');
		var minH = ed.getParam('advimagescale_min_height');

		// adjust w/h to maintain aspect ratio and stay within maxW/H and minW/H
	        var newDimensions = maintainAspect(ed, el, dom.getAttrib(el, 'width'), dom.getAttrib(el, 'height'), maxW, maxH, minW, minH);

		// did maintainAspect make an adjustment to maintain aspect ratio? If so, apply the new width/height
		var adjusted      = (dom.getAttrib(el, 'width') != newDimensions.width || dom.getAttrib(el, 'height') != newDimensions.height);
		dom.setAttrib(el, 'width',  newDimensions.width);
		dom.setAttrib(el, 'height', newDimensions.height);

		// if an adjustment was made to preserve aspect ratio - then redraw handles
		if (adjusted && tinymce.isGecko) {
			fixGeckoHandles(ed);
		}

		if (ed.getParam('advimagescale_append_to_url')) {
			appendToUri(ed, el, dom.getAttrib(el, 'width'), dom.getAttrib(el, 'height'));
		}

		// after all that, was the image resized at all?
		if (lastDimensions[elId].width != dom.getAttrib(el, 'width') || lastDimensions[elId].height != dom.getAttrib(el, 'height')) {
		        // call "image resized" callback (if set), passing editor and element as params
			if (ed.getParam('advimagescale_resize_callback')) {
				ed.getParam('advimagescale_resize_callback')(ed, el);
			}
		}

		// remember "last dimensions" for next time ..
	        lastDimensions[elId] = { width: dom.getAttrib(el, 'width'), height: dom.getAttrib(el, 'height') };
	        
	}

	/**
	 * Fixes Gecko border width glitch
	 *
	 * Gecko "adds" the border width to an image after the resize handles have been
	 * dropped.  This reverses it by looking at the "previous" known size and comparing
	 * to the current size.  If they don't match, then a resize has taken place and Gecko
	 * has (probably) messed it up.  So, we reverse it.  Note, this will probably need to be
	 * wrapped in a conditional statement if/when Gecko fixes this bug.
	 */
	function fixGeckoImageBorderGlitch(ed, el) {
		var dom = ed.dom;
		var elId = dom.getAttrib(el, 'mce_advimageresize_id');		
		var currentWidth = dom.getAttrib(el, 'width');
		var currentHeight= dom.getAttrib(el, 'height');
		
		// if current dimensions do not match what we last saw, then a resize has taken place
		if (currentWidth != lastDimensions[elId].width || currentHeight != lastDimensions[elId].height) {

			// gecko always messes it up by blowing out the w/h by the border width - so fix it!		
			var adjustWidth = 0;
			var adjustHeight = 0;
			
			// get computed border left/right widths
			adjustWidth += parseInt(dom.getStyle(el, 'borderLeftWidth', 'borderLeftWidth'));
			adjustWidth += parseInt(dom.getStyle(el, 'borderRightWidth', 'borderRightWidth'));
			
			// get computed border top/bottom widths
			adjustHeight += parseInt(dom.getStyle(el, 'borderTopWidth', 'borderTopWidth'));
			adjustHeight += parseInt(dom.getStyle(el, 'borderBottomWidth', 'borderBottomWidth'));

			// reset the width height to NOT include these amounts
			if (adjustWidth > 0) {
				dom.setAttrib(el, 'width', (currentWidth - adjustWidth) + 'px');
			}
			if (adjustHeight > 0) {
				dom.setAttrib(el, 'height', (currentHeight - adjustHeight) + 'px');
			}
			fixGeckoHandles(ed);
		}
	}

	/**
	 * Fix gecko resize handles glitch
	 */
	function fixGeckoHandles(ed) {
		ed.execCommand('mceRepaint', false);
	}

	/**
	 * Set image dimensions on into a uri as querystring params
	 */
	function appendToUri(ed, el, w, h) {
		//var ed     = tinyMCE.activeEditor;
		var dom    = ed.dom;
		var uri    = dom.getAttrib(el, 'src');

		// filter by img src
		var src_filter = ed.getParam('advimagescale_filter_src');
		if (src_filter) {
			var rSrcFilter = new RegExp(src_filter);
			if (!uri.match(rSrcFilter)) {
				return; // skip
			}
		}
		// filter by img classname
		var class_filter = ed.getParam('advimagescale_filter_class');
		if (class_filter) {
			if (!dom.hasClass(el, class_filter)) {
				return;
			}
		}
			
		var wKey = ed.getParam('advimagescale_url_width_key', 'w');
		uri = setQueryParam(uri, wKey, w);
		var hKey = ed.getParam('advimagescale_url_height_key', 'h');
		uri = setQueryParam(uri, hKey, h);

		// did URI change from previous value? no need to set img src or call callbacks if nothing changed
		if (uri != dom.getAttrib(el, 'src')) {
		
			// trigger image loading callback (if set)
			if (ed.getParam('advimagescale_loading_callback')) {
				// call loading callback
				ed.getParam('advimagescale_loading_callback')(el);
			}
			// hook image load(ed) callback (if set)
			if (ed.getParam('advimagescale_loaded_callback')) {
				// hook load event on the image tag to call the loaded callback
				tinymce.dom.Event.add(el, 'load', imageLoadedCallback, {el: el, ed: ed});
			}

			// set new src
			dom.setAttrib(el, 'src', uri);
		}
	}
	
	/**
	 * Callback event when an image is (re)loaded
	 * @param {object} e Event (use e.target or this.el to access element, this.ed to access editor instance)
	 */
	function imageLoadedCallback(e) {
		var el       = this.el; // image element
		var ed       = this.ed; // editor
		var callback = ed.getParam('advimagescale_loaded_callback'); // user specified callback

		// call callback, pass img as param
		callback(el);
		
		// remove callback event
		tinymce.dom.Event.remove(el, 'load', imageLoadedCallback);
	}


	/**
 	 * Sets URL querystring parameters by appending or replacing existing params of same name
	 */
	function setQueryParam(uri, key, value) {
		if (!uri.match(/\?/)) {
			uri += '?';
		}
		if (!uri.match(new RegExp('([\?&])' + key + '='))) {
			if (!uri.match(/[&\?]$/)) {
				uri += '&';
			}
			uri += key + '=' + escape(value);
		} else {
		        uri = uri.replace(new RegExp('([\?\&])' + key + '=[^&]*'), '$1' + key + '=' + escape(value));
		}
		return uri;
	}

	/**
	 * Returns w/h that maintain aspect ratio
	 */
	function maintainAspect(ed, el, w, h, maxW, maxH, minW, minH)
	{
		//var ed    = tinyMCE.activeEditor;
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
		if (maxW && ret.width > maxW) {
			ret = { width: maxW, height: Math.round(maxW/ratio) };
		}
		if (maxH && ret.height > maxH) {
			ret = { width: Math.round(maxH/ratio), height: maxH };
		}

		// enforce minW/minH
		if (minW && ret.width < minW) {
			ret = { width : minW, height: Math.round(minW/ratio) };
		}
		if (minH && ret.height < minH) {
			ret = { height: Math.round(minH/ratio), width: minH };
		}

		return ret;
	}
	
})();